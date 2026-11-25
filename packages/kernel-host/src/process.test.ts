import { expect, test } from 'bun:test'
import { MessageChannel } from 'node:worker_threads'
import { KernelProcessHost } from './process.ts'

import { fileURLToPath } from 'node:url'
const entry = fileURLToPath(new URL('./test-fixtures/child.ts', import.meta.url))
const input = { sessionId: 's1', runId: 'r1', prompt: '测试' }
function host() { return new KernelProcessHost({ entry, executable: process.execPath, timeoutMs: 500, startupTimeoutMs: 1000 }) }

test('Given 子进程 ready When prompt Then 接受事件并回收 PID', async () => {
  const h = host(); const events = await h.run(input)
  expect(events.map((event) => event.t)).toEqual(['message.delta', 'done'])
  expect(h.pid).toBeUndefined()
  expect(h.lastPid).toBeNumber()
  expect(() => process.kill(h.lastPid!, 0)).toThrow()
})
test('Given 超时/错 run When 执行 Then 拒绝且不留僵尸', async () => {
  for (const prompt of ['hang', 'wrong-run']) {
    const h = host()
    await expect(h.run({ ...input, prompt })).rejects.toThrow(prompt === 'hang' ? '超时' : 'run')
    expect(h.pid).toBeUndefined()
    expect(() => process.kill(h.lastPid!, 0)).toThrow()
  }
})
test('Given 子进程挂起 When cancel Then 立即拒绝并等待退出', async () => {
  const h = host(); const pending = h.run({ ...input, prompt: 'hang' }); const rejected = pending.then(() => { throw new Error('预期取消失败') }, (error: unknown) => error)
  await new Promise((resolve) => setTimeout(resolve, 30)); await h.stop()
  expect(String(await rejected)).toContain('取消')
  expect(h.pid).toBeUndefined()
})
test('Given 无效入口或输入 When 启动 Then 明确失败', async () => {
  const h = new KernelProcessHost({ entry: entry + '.missing', executable: process.execPath, timeoutMs: 200, startupTimeoutMs: 200 })
  await expect(h.run(input)).rejects.toThrow()
  await expect(host().run({ ...input, runId: '' })).rejects.toThrow()
})
test('Given MessagePort 请求 When 执行 Then 通过原生端口返回事件', async () => {
  const h = host(); const { port1, port2 } = new MessageChannel()
  const detach = h.bind(port1)
  try {
    const done = new Promise<string[]>((resolve, reject) => {
      const types: string[] = []
      port2.on('message', (message) => {
        if (message.method === 'failure') { reject(new Error(message.message)); return }
        if (message.method === 'event') { types.push(message.event.t); if (message.event.t === 'done') resolve(types) }
      })
    })
    port2.postMessage({ method: 'prompt', input })
    expect(await done).toEqual(['message.delta', 'done'])
  } finally { detach(); port1.close(); port2.close(); await h.stop() }
})
