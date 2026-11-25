import { expect, test } from 'bun:test'
import { PiKernelEventMapper } from './kernel-events.ts'

test('Given 十一类 Pi 帧 When 归一 Then 穷尽产品事件且序号单调', () => {
  const mapper = new PiKernelEventMapper('r1')
  const frames = [
    { type: 'assistant_delta', delta: { type: 'thinking_delta', contentIndex: 0, delta: '思考' } },
    { type: 'assistant', message: { content: [{ type: 'text', text: '完成' }, { type: 'tool_use', id: 't1', name: 'Read', input: {} }] } },
    { type: 'tool_progress', tool_use_id: 't1' }, { type: 'plan', steps: [] },
    { type: 'permission_request', request: { requestId: 'a1', kind: 'read', tool: 'Read', summary: '读取', input: {}, actions: [{ id: 'allow', label: '允许', behavior: 'allow' }] } },
    { type: 'system', subtype: 'compact_boundary', summary: '压缩摘要' },
    { type: 'retry', attempt: 1, reason: '限流' }, { type: 'error', code: 'x', message: '失败' },
    { type: 'result', subtype: 'success', usage: { input_tokens: 1, output_tokens: 2 } },
  ]
  const events = frames.flatMap((frame) => mapper.map(frame))
  expect(new Set(events.map((event) => event.t)).size).toBe(11)
  expect(events.map((event) => event.seq)).toEqual(events.map((_, index) => index + 1))
  expect(events.every((event) => event.runId === 'r1')).toBe(true)
  const progress = events.find((event) => event.t === 'tool.update')
  expect(progress?.patch.progress).toBeUndefined()
  const compact = events.find((event) => event.t === 'compaction')
  expect(compact?.info.originalTokens).toBeUndefined()
})
test('Given 工具结果/未知帧 When 映射 Then 状态正确且未知原文保留', () => {
  const mapper = new PiKernelEventMapper('r1')
  expect(mapper.map({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: '失败', is_error: true }] } })[0]).toMatchObject({ t: 'tool.update', patch: { status: 'failed' } })
  const event = mapper.map({ type: 'future', payload: '原文' })[0]
  expect(event).toMatchObject({ t: 'error', err: { raw: { type: 'future', payload: '原文' } } })
})

test('Given 不同run的final When 归一 Then 消息ID不重复且保留thinking/tool索引', () => {
  const frame = { type: 'assistant', message: { content: [{ type: 'thinking', thinking: '推理' }, { type: 'text', text: '结果' }, { type: 'tool_use', id: 't', name: 'Read', input: {} }] } }
  const first = new PiKernelEventMapper('r1').map(frame); const next = new PiKernelEventMapper('r2').map(frame)
  if (first[0]?.t !== 'message.final' || next[0]?.t !== 'message.final') throw new Error('缺final')
  expect(first[0].message.id).not.toBe(next[0].message.id)
  expect(first[0].message.content.map((part) => part.type)).toEqual(['thinking', 'text', 'tool-call'])
})

test('Given 真正TaskCreate工具结果 When 映射 Then 更新产品计划而非仅支持人造plan帧', () => {
  const mapper = new PiKernelEventMapper('r1')
  mapper.map({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'TaskCreate', input: { subject: '检查' } }] } })
  const result = mapper.map({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: JSON.stringify({ task: { id: 't1', subject: '检查', status: 'in_progress' } }) }] }] } })
  expect(result.find((event) => event.t === 'plan.update')).toMatchObject({ steps: [{ id: 't1', title: '检查', status: 'running' }] })
})

test('Given text与thinking增量 When 映射 Then 两类不混淆', () => {
  const mapper = new PiKernelEventMapper('r1')
  expect(mapper.map({ type: 'assistant_delta', delta: { type: 'text_delta', contentIndex: 0, delta: '正文' } })[0]).toMatchObject({ t: 'message.delta', kind: 'text', text: '正文' })
  expect(mapper.map({ type: 'assistant_delta', delta: { type: 'thinking_delta', contentIndex: 1, delta: '推理' } })[0]).toMatchObject({ t: 'message.delta', kind: 'thinking', text: '推理' })
})
