import { test, expect } from 'bun:test'
import { AcpEventMapper } from './mapper.ts'

test('Given ACP文本/思考/工具/计划/usage When 映射 Then 精确保留且不伪造指标', () => {
  const mapper = new AcpEventMapper('r1')
  const events = [
    ...mapper.update({ sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: '思考' } }),
    ...mapper.update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '回答😀' } }),
    ...mapper.update({ sessionUpdate: 'tool_call', toolCallId: 'remote/id', title: 'Read', kind: 'read', status: 'in_progress', rawInput: { path: 'a' } }),
    ...mapper.update({ sessionUpdate: 'tool_call_update', toolCallId: 'remote/id', status: 'completed', rawOutput: '完成' }),
    ...mapper.update({ sessionUpdate: 'plan', entries: [{ content: '计划', priority: 'high', status: 'in_progress' }] }),
    ...mapper.update({ sessionUpdate: 'usage_update', used: 10, size: 100, cost: { amount: 1, currency: 'USD' } }),
    ...mapper.extension('_proma/compaction', { summary: '摘要' }), ...mapper.extension('_proma/retry', { attempt: 1, reason: '限流' }), ...mapper.finish({ stopReason: 'end_turn' }),
  ]
  expect(events.map((event) => event.seq)).toEqual(events.map((_, index) => index + 1))
  expect(events.find((event) => event.t === 'message.final')?.message.content).toEqual([{ type: 'thinking', text: '思考' }, { type: 'text', text: '回答😀' }])
  const usage = events.find((event) => event.t === 'usage'); expect(usage?.usage).toEqual({ contextTokens: 10, contextWindow: 100, cost: 1, costScope: 'session' }); expect(usage?.usage.inputTokens).toBeUndefined()
  expect(events.find((event) => event.t === 'tool.update')?.patch.progress).toBeUndefined()
  expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
})
test('Given 未知/非法/非文本帧 When 归一 Then error保留原文不丢失', () => {
  for (const update of [{ sessionUpdate: 'future', payload: 1 }, { sessionUpdate: 'agent_message_chunk', content: { type: 'image', data: 'image' } }, { sessionUpdate: 'tool_call_update' }]) {
    expect(new AcpEventMapper('r1').update(update)[0]).toMatchObject({ t: 'error', err: { raw: update } })
  }
  const mapper = new AcpEventMapper('r1'); const events = mapper.update({ sessionUpdate: 'usage_update', used: 10, size: 20, cost: { currency: 'EUR', amount: 5 } })
  expect(events[0]).toMatchObject({ t: 'usage', usage: { contextTokens: 10 } }); if (events[0]?.t === 'usage') expect(events[0].usage.cost).toBeUndefined()
  expect(events[1]).toMatchObject({ t: 'error', err: { code: 'acp_non_usd_cost' } })
})
for (const [stopReason, reason] of [['end_turn', 'stop'], ['max_tokens', 'max-tokens'], ['cancelled', 'cancelled'], ['refusal', 'error'], ['max_turn_requests', 'error']]) test(`Given stopReason ${stopReason} When 完成 Then ${reason}`, () => expect(new AcpEventMapper('r').finish({ stopReason }).at(-1)).toMatchObject({ t: 'done', reason }))

test('Given messageId变化及text→thought顺序 When 映射 Then 消息不合并且kind不冲突', () => {
  const mapper = new AcpEventMapper('r1')
  const frames = [
    ...mapper.update({ sessionUpdate: 'agent_message_chunk', messageId: 'm1', content: { type: 'text', text: '第一' } }),
    ...mapper.update({ sessionUpdate: 'agent_thought_chunk', messageId: 'm1', content: { type: 'text', text: '思考' } }),
    ...mapper.update({ sessionUpdate: 'agent_message_chunk', messageId: 'm2', content: { type: 'text', text: '第二' } }),
    ...mapper.finish({ stopReason: 'end_turn' }),
  ]
  expect(frames.filter((event) => event.t === 'message.final').map((event) => event.message.content)).toEqual([[{ type: 'text', text: '第一' }, { type: 'thinking', text: '思考' }], [{ type: 'text', text: '第二' }]])
})
test('Given 标准compaction生命周期 When summary替换/追加/清空 Then 稳定ID且patch语义保留', () => {
  const mapper = new AcpEventMapper('r1')
  const first = mapper.update({ sessionUpdate: 'compaction_summary_chunk', compactionId: 'c1', content: { type: 'text', text: '摘要' } })[0]
  const complete = mapper.update({ sessionUpdate: 'compaction_update', compactionId: 'c1', status: 'completed' })[0]
  expect(first).toMatchObject({ t: 'compaction', info: { summary: '摘要', status: 'in_progress' } })
  expect(complete).toMatchObject({ t: 'compaction', info: { summary: '摘要', status: 'completed' } })
  if (first?.t === 'compaction' && complete?.t === 'compaction') expect(first.info.compactionId).toBe(complete.info.compactionId)
  expect(mapper.update({ sessionUpdate: 'compaction_update', compactionId: 'c1', status: 'completed', summary: null })[0]).toMatchObject({ t: 'compaction', info: { summary: '' } })
})

test('Given 不合法扩展事件 When emit校验失败 Then error序号不留洞', () => {
  const mapper = new AcpEventMapper('r1')
  const events = [...mapper.extension('_proma/retry', { attempt: -1, reason: 'bad' }), ...mapper.finish({ stopReason: 'end_turn' })]
  expect(events.map((event) => event.seq)).toEqual([1, 2])
  expect(events[0]).toMatchObject({ t: 'error', err: { code: 'invalid_acp_extension' } })
})

test('Given 原始工具参数为数组或字符串 When 映射 Then 包装保留而非静默丢弃', () => {
  const mapper = new AcpEventMapper('r')
  for (const rawInput of [[1, 2], 'opaque']) expect(mapper.update({ sessionUpdate: 'tool_call', toolCallId: 't', title: 'Custom', rawInput })[0]).toMatchObject({ t: 'tool.call', call: { input: { rawInput } } })
})

test('Given 四种ACP工具状态 When 映射 Then 状态表完全一致', () => {
  const statuses = { pending: 'pending', in_progress: 'running', completed: 'succeeded', failed: 'failed' }
  for (const [source, expected] of Object.entries(statuses)) {
    const mapper = new AcpEventMapper('r1')
    expect(mapper.update({ sessionUpdate: 'tool_call', toolCallId: 't', title: 'Tool', status: source })[0]).toMatchObject({ t: 'tool.call', call: { status: expected } })
    expect(mapper.update({ sessionUpdate: 'tool_call_update', toolCallId: 't', status: source })[0]).toMatchObject({ t: 'tool.update', patch: { status: expected } })
  }
})

test('Given 只有标题或扩展元数据的工具patch When 更新 Then 保留变更且不伪造状态或任务失败', () => {
  const update = { sessionUpdate: 'tool_call_update', toolCallId: 't', title: '变更标题' }
  const mapper=new AcpEventMapper('r')
  expect(mapper.update(update)[0]).toMatchObject({t:'tool.update',patch:{title:'变更标题'}})
  expect(mapper.update({...update,title:undefined,_meta:{toolLifecycle:{phase:'started'}}})[0]).toMatchObject({t:'tool.update',patch:{metadata:{toolLifecycle:{phase:'started'}}}})
  expect(mapper.update({sessionUpdate:'tool_call_update',toolCallId:'t'})).toEqual([])
})

test('Given compaction非文本摘要/错误/meta patch When 替换或清空 Then 原始数据保留且null生效', () => {
  const mapper = new AcpEventMapper('r1')
  const content = { type: 'image', data: 'opaque', mimeType: 'image/png' }
  const initial = mapper.update({ sessionUpdate: 'compaction_update', compactionId: 'c1', status: 'failed', summary: [content], error: '失败', _meta: { source: 'agent' } })
  expect(initial[0]).toMatchObject({ t: 'compaction', info: { summaryContent: [content], error: '失败', metadata: { source: 'agent' } } })
  const updated = mapper.update({ sessionUpdate: 'compaction_update', compactionId: 'c1', status: 'completed', error: null, _meta: null })
  expect(updated[0]).toMatchObject({ t: 'compaction', info: { summaryContent: [content], error: null, metadata: null } })
})

test('Given CLI发送未协商的单向扩展通知 When 核心协议仍正常 Then 不把提示通知变成任务失败',()=>{
 const mapper=new AcpEventMapper('qwen-extension')
 expect(mapper.extension('qwen/notify/session/last-user-prompt',{v:1,sessionId:'s',timestamp:'2026-11-24'})).toEqual([])
 expect(mapper.finish({stopReason:'end_turn'}).at(-1)).toMatchObject({t:'done',reason:'stop'})
})
test('Given CLI回显标准用户消息 When 宿主已保存用户输入 Then 不重复展示或伪造ACP错误',()=>{
 const mapper=new AcpEventMapper('echo-user')
 expect(mapper.update({sessionUpdate:'user_message_chunk',content:{type:'text',text:'已保存的用户输入与上下文'}})).toEqual([])
 expect(mapper.finish({stopReason:'end_turn'})).toEqual([{runId:'echo-user',seq:1,t:'done',reason:'stop'}])
})
test('Given 同一消息分成许多内容下标 When 累计超过文本预算 Then 总量有界而不是每个下标各保留8MiB',()=>{
 const mapper=new AcpEventMapper('bounded');const text='x'.repeat(1024*1024)
 for(let index=0;index<8;index++)expect(mapper.update({sessionUpdate:'agent_message_chunk',contentIndex:index,content:{type:'text',text}})[0]?.t).toBe('message.delta')
 expect(mapper.update({sessionUpdate:'agent_message_chunk',contentIndex:8,content:{type:'text',text:'x'}})[0]).toMatchObject({t:'error',err:{code:'acp_message_limit',raw:null}});const events=mapper.finish({stopReason:'end_turn'});expect(events.find(event=>event.t==='message.final')?.message.content).toHaveLength(8)
})

test('Given 长任务创建大量不同压缩项 When 达到总预算 Then 显式不可恢复错误且不保留无限摘要',()=>{
 const mapper=new AcpEventMapper('compaction-bounded')
 for(let i=0;i<128;i++)expect(mapper.update({sessionUpdate:'compaction_update',compactionId:'c'+i,status:'in_progress'})[0]?.t).toBe('compaction')
 expect(mapper.update({sessionUpdate:'compaction_update',compactionId:'overflow',status:'in_progress'})[0]).toMatchObject({t:'error',err:{code:'acp_compaction_limit',recoverable:false,raw:null}})
 expect(mapper.update({sessionUpdate:'compaction_update',compactionId:'c0',status:'completed'})[0]?.t).toBe('compaction')
})
