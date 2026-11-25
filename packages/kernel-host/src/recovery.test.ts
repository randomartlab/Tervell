import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'
import { KernelProcessHost } from './process.ts'
const entry = fileURLToPath(new URL('./test-fixtures/child.ts', import.meta.url))
const input = { sessionId: 's1', runId: 'r1', prompt: 'crash-once', resumeToken: 'saved-session' }
function host() { return new KernelProcessHost({ entry, executable: process.execPath, timeoutMs: 500, startupTimeoutMs: 1000, recoverOnce: true }) }

test('Given ready 后崩溃 When 有恢复句柄 Then 仅重启一次从已确认序号续跑', async () => {
  const h = host(); const events = await h.run(input)
  expect(h.restarts).toBe(1)
  expect(events.map((event) => event.seq)).toEqual([1, 2, 3])
  expect(events.filter((event) => event.t === 'message.delta').map((event) => event.text)).toEqual(['已确认', '续跑'])
  expect(h.pid).toBeUndefined()
})
test('Given 再次崩溃 When 已重启一次 Then 中断且不循环重试', async () => {
  const h = host(); await expect(h.run({ ...input, prompt: 'crash-always' })).rejects.toThrow('退出')
  expect(h.restarts).toBe(1); expect(h.pid).toBeUndefined()
})
test('Given 无恢复句柄或运行超时 When 失败 Then 不重发 prompt', async () => {
  for (const run of [{ ...input, resumeToken: undefined }, { ...input, prompt: 'hang' }]) {
    const h = host(); await expect(h.run(run)).rejects.toThrow()
    expect(h.restarts).toBe(0)
  }
})
test('Given 两会话独立宿主 When 一方崩溃 Then 另一方正常完成', async () => {
  const failing = host(); const healthy = host()
  const results = await Promise.allSettled([failing.run({ ...input, prompt: 'crash-always' }), healthy.run({ ...input, sessionId: 's2', runId: 'r2', prompt: '正常' })])
  expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled'])
  expect(failing.pid).toBeUndefined(); expect(healthy.pid).toBeUndefined()
})
