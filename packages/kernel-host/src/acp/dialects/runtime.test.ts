import { test, expect } from 'bun:test'
import { fileURLToPath } from 'node:url'
import { AcpKernel } from '../kernel.ts'
import { acpDialect } from './index.ts'
import type { KernelEvent } from '@proma/protocol'
const server = fileURLToPath(new URL('../test-fixtures/dialect-server.ts', import.meta.url))

test('Given Cursor分组/多选扩展 When 当前产品无法完整表示 Then 明确RPC拒绝且原文落error', async () => {
  const kernel = new AcpKernel('cursor-agent', { command: process.execPath, args: [server, 'cursor-agent'], dialect: acpDialect('cursor-agent'), timeoutMs: 1500 })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: process.cwd(), systemPrompt: '' })
  try {
    const events: KernelEvent[] = []
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'unsupported-question' }, { signal: new AbortController().signal })) events.push(event)
    expect(events.some((event) => event.t === 'error' && event.err.code === 'unsupported_dialect_interaction')).toBe(true)
    expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'error' })
  } finally { await kernel.close(handle) }
})
test('Given Cursor单题问题 When 等待到期 Then 返回cancelled而非自动选第一项', async () => {
  const kernel = new AcpKernel('cursor-agent', { command: process.execPath, args: [server, 'cursor-agent'], dialect: acpDialect('cursor-agent'), timeoutMs: 1500, permissionTimeoutMs: 15 })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: process.cwd(), systemPrompt: '' })
  try {
    const events: KernelEvent[] = []
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'question-only' }, { signal: new AbortController().signal })) events.push(event)
    expect(events.filter((event) => event.t === 'permission.request')).toHaveLength(1)
    expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
    const tool = events.find((event) => event.t === 'tool.update')
    expect(tool).toMatchObject({ patch: { result: expect.stringContaining('cancelled') } })
  } finally { await kernel.close(handle) }
})

test('Given 已完成runId再次执行 When 同session重置seq Then 明确拒绝', async () => {
  const kernel = new AcpKernel('omp', { command: process.execPath, args: [server, 'omp'], dialect: acpDialect('omp'), timeoutMs: 1500 })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: process.cwd(), systemPrompt: '' })
  try {
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'script' }, { signal: new AbortController().signal })) {
      if (event.t === 'permission.request') { const option = event.req.actions.find((item) => item.behavior === 'allow')!; await kernel.respondPermission(handle, event.req.requestId, { actionId: option.id, behavior: 'allow' }) }
    }
    await expect(kernel.prompt(handle, { runId: 'r1', text: '' }, { signal: new AbortController().signal })[Symbol.asyncIterator]().next()).rejects.toThrow('已使用')
  } finally { await kernel.close(handle) }
})
