import { expect, test } from 'bun:test'
import type { KernelEvent } from '@proma/protocol'
import { ServiceEventSchema } from '@proma/protocol'
import { applyServiceEvent, emptyConversation, applyEventPage } from './conversation.ts'
import { parseRoute, sessionPath } from './routes.ts'

const wrap = (seq: number, event: KernelEvent) => ServiceEventSchema.parse({ seq, turnId: 'turn1', ts: seq, event, truncated: false })
test('Given delta 后最终消息 When 多消息共用index0 Then 最终正文替换且下条不会覆盖上条', () => {
  let state = emptyConversation('epoch')
  state = applyServiceEvent(state, wrap(1, { t: 'message.delta', runId: 'run', seq: 1, index: 0, kind: 'text', text: '初稿' }))
  state = applyServiceEvent(state, wrap(2, { t: 'message.final', runId: 'run', seq: 2, message: { id: 'm1', role: 'assistant', content: [{ type: 'text', text: '最终正文' }], createdAt: 1 } }))
  state = applyServiceEvent(state, wrap(3, { t: 'message.delta', runId: 'run', seq: 3, index: 0, kind: 'text', text: '第二条' }))
  expect(state.blocks.map(block => block.text)).toEqual(['最终正文', '第二条'])
  expect(state.running).toBe(true)
  state = applyServiceEvent(state, wrap(4, { t: 'done', runId: 'run', seq: 4, reason: 'stop' }))
  expect(state.running).toBe(false)
})
test('Given 工具与计划trace When 更新并回放 Then 输入不丢失且结果与状态确定', () => {
  const events: KernelEvent[] = [
    { t: 'tool.call', runId: 'run', seq: 1, call: { id: 'call', kind: 'read', name: 'Read', input: { path: 'hello.md' }, status: 'running' } },
    { t: 'tool.update', runId: 'run', seq: 2, callId: 'call', patch: { status: 'succeeded', result: '内容' } },
    { t: 'plan.update', runId: 'run', seq: 3, steps: [{ id: 'step', title: '验证', status: 'completed' }] },
    { t: 'error', runId: 'run', seq: 4, err: { code: 'TEST', message: '可恢复错误', recoverable: true } },
  ]
  const replay = () => events.reduce((state, event, index) => applyServiceEvent(state, wrap(index + 1, event)), emptyConversation())
  expect(replay()).toEqual(replay())
  expect(replay().blocks[0]).toMatchObject({ kind: 'tool', title: 'Read', text: '内容', status: 'succeeded', input: '{\n  "path": "hello.md"\n}' })
  expect(replay().blocks[1]?.steps?.[0]?.status).toBe('completed')
})
test('Given ACP工具先报占位标题再补参数 When 回放 Then 同一工具更新标题和输入而不新增错误行',()=>{
 let state=applyServiceEvent(emptyConversation(),wrap(1,{t:'tool.call',runId:'run',seq:1,call:{id:'tool',name:'pending',kind:'execute',status:'pending'}}));state=applyServiceEvent(state,wrap(2,{t:'tool.update',runId:'run',seq:2,callId:'tool',patch:{title:'运行命令',input:{command:'echo OK'},metadata:{source:'acp'}}}));expect(state.blocks).toHaveLength(1);expect(state.blocks[0]).toMatchObject({title:'运行命令',input:'{\n  "command": "echo OK"\n}',status:'pending'})
})
test('Given 重复、冲突、序号缺口与epoch重置 When 应用分页 Then 去重并显式拒绝损坏流', () => {
  const first = wrap(1, { t: 'message.delta', runId: 'run', seq: 1, index: 0, kind: 'text', text: '你好' })
  const state = applyServiceEvent(emptyConversation('old'), first)
  expect(applyServiceEvent(state, first)).toBe(state)
  expect(() => applyServiceEvent(state, { ...first, ts: 10 })).toThrow('冲突')
  expect(() => applyServiceEvent(state, { ...first, seq: 3 })).toThrow('缺口')
  expect(applyEventPage(state, { id: 's1', epoch: 'new', events: [first], reset: true, hasMore: false, headSeq: 1 }).blocks[0]?.text).toBe('你好')
})
test('Given 用户消息及裁剪事件 When 重放 Then 用户消息只出现一次并明确显示裁剪', () => {
  const item = { ...wrap(1, { t: 'done', runId: 'run', seq: 1, reason: 'stop' }), event: { summary: '过长内容已裁剪' }, truncated: true, userMessage: { id: 'user1', text: '请求', createdAt: 1, truncated: false } }
  const state = applyServiceEvent(emptyConversation(), item)
  expect(state.blocks.map(block => [block.role, block.text])).toEqual([['user', '请求'], ['assistant', '过长内容已裁剪']])
  expect(applyServiceEvent(state, item).blocks).toHaveLength(2)
})
test('Given 工具块占用最终消息index且旧epoch分页与WS重叠 When 应用 Then 无重复草稿且同epoch不被重复reset', () => {
  let state = applyServiceEvent(emptyConversation('new'), wrap(1, { t: 'message.delta', runId: 'run', seq: 1, index: 0, kind: 'text', text: '草稿' }))
  const final = wrap(2, { t: 'message.final', runId: 'run', seq: 2, message: { id: 'mixed', role: 'assistant', createdAt: 1, content: [{ type: 'tool-call', toolCallId: 'call', name: 'Read' }, { type: 'text', text: '最终正文' }] } })
  state = applyServiceEvent(state, final)
  expect(state.blocks.map(block => block.text)).not.toContain('草稿')
  const page = { id: 's1', epoch: 'new', events: [final], reset: true, hasMore: false, headSeq: 2 }
  expect(applyEventPage(state, page)).toEqual(state)
})
test('Given 深链 When 刷新解析 Then 还原项目和会话且拒绝路径注入', () => {
  expect(parseRoute(sessionPath('w1', 's1'))).toEqual({ workspaceId: 'w1', sessionId: 's1', view: 'sessions' })
  expect(parseRoute('/approvals').view).toBe('approvals')
  expect(parseRoute('/workspaces/../sessions/s1')).toEqual({ view: 'sessions' })
  expect(() => sessionPath('w1', '../secret')).toThrow()
})
test('Given HTTP旧页晚于WS新运行抵达 When 应用旧idle状态 Then 不覆盖更新的运行状态', () => {
  const state = applyServiceEvent(emptyConversation('epoch'), wrap(1, { t: 'plan.update', runId: 'run', seq: 1, steps: [] }))
  const stale = applyEventPage(state, { id: 's1', epoch: 'epoch', events: [], headSeq: 0, hasMore: false, reset: false, executionStatus: 'idle' })
  expect(stale.running).toBe(true)
})
