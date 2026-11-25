import { describe, expect, test } from 'bun:test'
import type { z } from 'zod'
import { assertNever, KernelEventSchema, normalizeKernelEvent } from './events.ts'
import type { KernelEvent } from './events.ts'

type Tag = KernelEvent['t']
const base = { runId: 'run-1', seq: 1 }
const samples = {
  'message.delta': { t: 'message.delta', ...base, index: 0, text: '文本' },
  'message.final': { t: 'message.final', ...base, message: { id: 'm1', role: 'assistant', content: [{ type: 'text', text: '完成' }], createdAt: 0 } },
  'tool.call': { t: 'tool.call', ...base, call: { id: 'c1', name: 'read_file', kind: 'read', status: 'pending', input: {} } },
  'tool.update': { t: 'tool.update', ...base, callId: 'c1', patch: { status: 'running' } },
  'plan.update': { t: 'plan.update', ...base, steps: [{ id: 'p1', title: '检查', status: 'pending' }] },
  'permission.request': { t: 'permission.request', ...base, req: { requestId: 'a1', kind: 'edit', tool: 'write_file', input: {}, summary: '写文件', actions: [{ id: 'yes', label: '允许', behavior: 'allow' }] } },
  usage: { t: 'usage', ...base, usage: { inputTokens: 1, outputTokens: 2, cost: 0.01 } },
  compaction: { t: 'compaction', ...base, info: { strategy: 'summarize', originalTokens: 10, compactedTokens: 5 } },
  retry: { t: 'retry', ...base, attempt: 1, reason: '限流' },
  error: { t: 'error', ...base, err: { code: 'timeout', message: '超时', recoverable: true } },
  done: { t: 'done', ...base, reason: 'stop' },
} satisfies Record<Tag, z.input<typeof KernelEventSchema>>

function label(event: KernelEvent): string {
  switch (event.t) {
    case 'message.delta': return event.text
    case 'message.final': return event.message.id
    case 'tool.call': return event.call.id
    case 'tool.update': return event.callId
    case 'plan.update': return String(event.steps.length)
    case 'permission.request': return event.req.requestId
    case 'usage': return String(event.usage.inputTokens)
    case 'compaction': return event.info.strategy
    case 'retry': return event.reason
    case 'error': return event.err.code
    case 'done': return event.reason
    default: return assertNever(event)
  }
}

describe('PR-02 事件契约', () => {
  for (const [tag, sample] of Object.entries(samples)) {
    test(`Given ${tag} When 解析并往返 JSON Then 保留判别式及载荷`, () => {
      const event = KernelEventSchema.parse(sample)
      expect(String(event.t)).toBe(tag)
      expect(label(event)).toBeString()
      expect(KernelEventSchema.parse(JSON.parse(JSON.stringify(event)))).toEqual(event)
    })
    test(`Given ${tag} 缺 runId 或 seq When 解析 Then 拒绝`, () => {
      expect(KernelEventSchema.safeParse({ ...sample, runId: undefined }).success).toBe(false)
      expect(KernelEventSchema.safeParse({ ...sample, seq: undefined }).success).toBe(false)
    })
  }
  for (const seq of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    test(`Given 非法序号 ${seq} When 解析 Then 拒绝`, () => {
      expect(KernelEventSchema.safeParse({ ...samples.done, seq }).success).toBe(false)
    })
  }
  test('Given 11 类事件 When 枚举 Then 类型处理穷尽', () => expect(Object.keys(samples)).toHaveLength(11))
  test('Given 旧 type 判别式 When 解析 Then 拒绝未发布旧格式', () => {
    expect(KernelEventSchema.safeParse({ type: 'done', ...base, stopReason: 'stop' }).success).toBe(false)
  })
  test('Given 只有工具状态 When 解析 Then 不伪造 progress', () => {
    const event = KernelEventSchema.parse(samples['tool.update'])
    if (event.t !== 'tool.update') throw new Error('事件类型错误')
    expect(event.patch.progress).toBeUndefined()
  })
  for (const sample of [
    { ...samples['message.delta'], index: -1 },
    { ...samples['message.final'], message: { ...samples['message.final'].message, role: 'user' } },
    { ...samples['tool.call'], call: { ...samples['tool.call'].call, kind: 'admin' } },
    { ...samples['tool.update'], patch: { progress: 101 } },
    { ...samples['tool.update'], patch: {} },
    { ...samples.usage, usage: { inputTokens: -1 } },
    { ...samples.usage, usage: { cost: -1 } },
    { ...samples.retry, attempt: 0 },
    { ...samples.done, reason: 'unknown' },
  ]) {
    test(`Given 非法 ${sample.t} 载荷 When 解析 Then 拒绝`, () => expect(KernelEventSchema.safeParse(sample).success).toBe(false))
  }
  test('Given 未知上游事件 When 归一化 Then 生成 error 并保留原文', () => {
    const raw = { t: 'future.event', text: '原文', nested: [1, null] }
    const event = normalizeKernelEvent(raw, base)
    expect(event.t).toBe('error')
    if (event.t !== 'error') throw new Error('事件类型错误')
    expect(event.err.raw).toEqual(raw)
    expect(event.runId).toBe('run-1')
    expect(event.seq).toBe(1)
  })
  test('Given 合法事件 When 归一化 Then 保留其运行标识', () => {
    expect(normalizeKernelEvent(samples.done, { runId: 'fallback', seq: 7 })).toEqual(samples.done)
  })
})
