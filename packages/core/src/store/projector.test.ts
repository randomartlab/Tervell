import { expect, test } from 'bun:test'
import { KernelEventSchema, StoredEventSchema } from '@proma/protocol'
import type { StoredEvent } from '@proma/protocol'
import { TimelineProjector } from './projector.ts'

function stored(seq: number, event: unknown, turnId = 'turn1'): StoredEvent {
  return StoredEventSchema.parse({ sessionId: 's1', seq, ts: seq, turnId, kernelEvent: KernelEventSchema.parse(event) })
}
const delta = (seq: number, text: string, index = 0, runId = 'run1') => stored(seq, { t: 'message.delta', runId, seq, index, text })

test('Given delta 与 final When 重放与重复重放 Then 字节一致且最终文本覆盖增量', () => {
  const events = [delta(1, '你'), delta(2, '好'), stored(3, { t: 'message.final', runId: 'run1', seq: 3, message: { id: 'm1', role: 'assistant', content: [{ type: 'text', text: '你好！' }], createdAt: 0 } })]
  const first = new TimelineProjector('s1'); events.forEach((event) => first.apply(event))
  const bytes = JSON.stringify(first.rows())
  events.forEach((event) => first.apply(event))
  expect(JSON.stringify(first.rows())).toBe(bytes)
  expect(first.rows()).toHaveLength(1)
  expect(first.rows()[0]?.summary).toBe('你好！')
  expect(first.rows()[0]?.sourceSeqRanges).toEqual([{ start: 1, end: 3 }])
  const second = new TimelineProjector('s1'); events.forEach((event) => second.apply(JSON.parse(JSON.stringify(event))))
  expect(JSON.stringify(second.rows())).toBe(bytes)
})
test('Given 多段/多个 run 的文本 When 交错重放 Then 不串台并保留来源区间', () => {
  const projector = new TimelineProjector('s1')
  ;[delta(1, 'A'), delta(2, 'B', 1), delta(3, 'C'), delta(4, 'D', 0, 'run2')].forEach((event) => projector.apply(event))
  expect(projector.rows().map((row) => row.summary)).toEqual(['AC', 'B', 'D'])
  expect(projector.rows()[0]?.sourceSeqRanges).toEqual([{ start: 1, end: 1 }, { start: 3, end: 3 }])
})
test('Given 工具进度 When 完成 Then 单条生命周期且不伪造百分比', () => {
  const projector = new TimelineProjector('s1')
  projector.apply(stored(1, { t: 'tool.call', runId: 'r', seq: 1, call: { id: 'c', name: 'read', kind: 'read', status: 'running' } }))
  projector.apply(stored(2, { t: 'tool.update', runId: 'r', seq: 2, callId: 'c', patch: { status: 'succeeded', result: '已读取' } }))
  expect(projector.rows()).toHaveLength(1)
  expect(projector.rows()[0]?.status).toBe('succeeded')
  expect(projector.rows()[0]?.summary).toBe('已读取')
  expect(projector.rows()[0]?.progress).toBeUndefined()
})
test('Given 缺口/冲突/其他会话 When 应用 Then 拒绝并保持已接受状态', () => {
  const projector = new TimelineProjector('s1'); projector.apply(delta(1, '稳定'))
  const before = JSON.stringify(projector.rows())
  expect(() => projector.apply(delta(3, '缺口'))).toThrow('序号')
  expect(() => projector.apply(delta(1, '冲突'))).toThrow('冲突')
  expect(() => projector.apply({ ...delta(2, '串台'), sessionId: 's2' })).toThrow('会话')
  expect(JSON.stringify(projector.rows())).toBe(before)
})
test('Given 其余事件 When 重放 Then 均有投影且返回快照不泄露可变状态', () => {
  const projector = new TimelineProjector('s1')
  const payloads = [
    { t: 'plan.update', steps: [{ id: 'p', title: '检查', status: 'pending' }] },
    { t: 'permission.request', req: { requestId: 'a', kind: 'edit', tool: 'write', input: {}, summary: '请求编辑', actions: [{ id: 'no', label: '拒绝', behavior: 'deny' }] } },
    { t: 'usage', usage: { inputTokens: 1 } }, { t: 'compaction', info: { strategy: 'summarize', originalTokens: 2, compactedTokens: 1 } },
    { t: 'retry', attempt: 1, reason: '重试' }, { t: 'error', err: { code: 'x', message: '失败', recoverable: false } }, { t: 'done', reason: 'stop' },
  ]
  payloads.forEach((payload, index) => projector.apply(stored(index + 1, { ...payload, runId: 'r', seq: index + 1 })))
  expect(projector.rows()).toHaveLength(7)
  const snapshot = projector.rows(); snapshot[0]!.summary = '被修改'
  expect(projector.rows()[0]?.summary).toBe('检查')
})

test('Given 同一 turn 连续两条 assistant 消息 When index 从0复用 Then 保留前一条', () => {
  const projector = new TimelineProjector('s1')
  projector.apply(delta(1, '第一'))
  projector.apply(stored(2, { t: 'message.final', runId: 'run1', seq: 2, message: { id: 'm1', role: 'assistant', content: [{ type: 'text', text: '第一条' }], createdAt: 0 } }))
  projector.apply(delta(3, '第二'))
  projector.apply(stored(4, { t: 'message.final', runId: 'run1', seq: 4, message: { id: 'm2', role: 'assistant', content: [{ type: 'text', text: '第二条' }], createdAt: 0 } }))
  expect(projector.rows().map((row) => row.summary)).toEqual(['第一条', '第二条'])
})


test('Given thinking 增量 When final 重新标明为 text Then 投影类型遵从最终消息', () => {
  const projector = new TimelineProjector('s1')
  projector.apply(stored(1, { t: 'message.delta', runId: 'run1', seq: 1, index: 0, kind: 'thinking', text: '草稿' }))
  projector.apply(stored(2, { t: 'message.final', runId: 'run1', seq: 2, message: { id: 'm1', role: 'assistant', content: [{ type: 'text', text: '结果' }], createdAt: 0 } }))
  expect(projector.rows()[0]?.kind).toBe('text')
  expect(projector.rows()[0]?.summary).toBe('结果')
})

test('Given 相同compactionId的生命周期 When 重放 Then 就地更新而非创建重复压缩条目', () => {
  const projector = new TimelineProjector('s1')
  for (const [index, status] of ['in_progress', 'completed'].entries()) projector.apply(stored(index + 1, { t: 'compaction', runId: 'r', seq: index + 1, info: { strategy: 'summarize', compactionId: 'c1', status, summary: index ? '最终摘要' : '进行中' } }))
  expect(projector.rows()).toHaveLength(1); expect(projector.rows()[0]?.summary).toBe('最终摘要')
})
