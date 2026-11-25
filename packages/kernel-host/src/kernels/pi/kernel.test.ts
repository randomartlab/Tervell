import { expect, test } from 'bun:test'
import type { SDKMessage } from '@proma/shared'
import type { PiAgentQueryOptions } from './pi-agent-adapter'
import { PiKernel } from './kernel.ts'

function options(): PiAgentQueryOptions {
  return { sessionId: 's1', prompt: '', apiKey: 'offline-fixture', provider: 'anthropic', permissionMode: 'plan', systemPrompt: '', piAgentDir: '/tmp/pi-offline', piSessionDir: '/tmp/pi-offline' }
}
test('Given Pi query 注入 When 两轮执行 Then 稳定句柄恢复且事件归一', async () => {
  const inputs: PiAgentQueryOptions[] = []; const aborted: string[] = []
  const kernel = new PiKernel(options, {
    async *query(input) { inputs.push(input); input.onSessionId?.('native-session'); yield { type: 'assistant', message: { content: [{ type: 'text', text: '完成' }] }, parent_tool_use_id: null }; yield { type: 'result', subtype: 'success' } },
    abort(id) { aborted.push(id) }, dispose() {},
  })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: '/tmp', systemPrompt: '规则' })
  for (let i = 0; i < 2; i++) {
    const events = []; for await (const event of kernel.prompt(handle, { runId: `r${i}`, text: '继续' }, { signal: new AbortController().signal })) events.push(event)
    expect(events.map((event) => event.t)).toEqual(['message.final', 'done'])
  }
  expect(inputs[0]?.resumeSessionId).toBeUndefined(); expect(inputs[1]?.resumeSessionId).toBe('native-session')
  expect(kernel.describePersistence(handle)).toEqual({ kernelSessionRef: 'native-session' })
  await kernel.close(handle); await expect(kernel.loadSession(handle)).rejects.toThrow('句柄')
  expect(aborted).toContain('s1')
})
test('Given 工具请求 When 产品审批允许 Then query 继续且跨会话不能答复', async () => {
  let allowed = false
  const kernel = new PiKernel(options, {
    async *query(input) {
      const result = await input.canUseTool?.('write', { path: 'a' }, { signal: new AbortController().signal, toolUseID: 't1' })
      allowed = result?.behavior === 'allow'; yield { type: 'result', subtype: 'success' }
    }, abort() {}, dispose() {},
  })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: '/tmp', systemPrompt: '' })
  const other = await kernel.createSession({ sessionId: 's2', cwd: '/tmp', systemPrompt: '' })
  const iterator = kernel.prompt(handle, { runId: 'r', text: '写' }, { signal: new AbortController().signal })[Symbol.asyncIterator]()
  const first = await iterator.next()
  if (first.done || first.value.t !== 'permission.request') throw new Error('未收到审批')
  await expect(kernel.respondPermission(other, first.value.req.requestId, { actionId: 'allow', behavior: 'allow' })).rejects.toThrow('本会话')
  await kernel.respondPermission(handle, first.value.req.requestId, { actionId: 'allow', behavior: 'allow' })
  expect((await iterator.next()).value).toMatchObject({ t: 'done' }); await iterator.return?.()
  expect(allowed).toBe(true)
})
test('Given 取消已触发 When prompt Then 不启动 query', async () => {
  let calls = 0
  const kernel = new PiKernel(options, { async *query() { calls++; yield { type: 'result' } as SDKMessage }, abort() {}, dispose() {} })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: '/tmp', systemPrompt: '' }); const controller = new AbortController(); controller.abort()
  await expect(kernel.prompt(handle, { runId: 'r', text: '' }, { signal: controller.signal })[Symbol.asyncIterator]().next()).rejects.toThrow('取消')
  expect(calls).toBe(0)
})

test('Given Pi→其他内核→Pi When 已有native句柄 Then 新历史仍注入且旧历史不重复', async () => {
  const prompts: string[] = []
  const kernel = new PiKernel(options, { async *query(input) { prompts.push(input.prompt); input.onSessionId?.('native'); yield { type: 'result', subtype: 'success' } }, abort() {}, dispose() {} })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: '/tmp', systemPrompt: '' })
  const first = { id: 'm1', role: 'assistant' as const, content: [{ type: 'text' as const, text: '旧历史' }], createdAt: 0 }
  const second = { id: 'm2', role: 'assistant' as const, content: [{ type: 'text' as const, text: '外部新历史' }], createdAt: 1 }
  for (const [i, history] of [[first], [first, second], [first, second]].entries()) {
    for await (const _event of kernel.prompt(handle, { runId: `r${i}`, text: '继续', history }, { signal: new AbortController().signal })) { /* 消费 */ }
  }
  expect(prompts[1]).toContain('外部新历史'); expect(prompts[1]).not.toContain('旧历史'); expect(prompts[2]).toBe('继续')
  await kernel.close(handle)
})
test('Given 正在等待审批 When cancel Then 拒绝待审批并结束源流', async () => {
  let behavior: string | undefined
  const kernel = new PiKernel(options, { async *query(input) { const result = await input.canUseTool?.('write', {}, { signal: new AbortController().signal, toolUseID: 'tool1' }); behavior = result?.behavior; yield { type: 'result', subtype: 'success' } }, abort() {}, dispose() {} })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: '/tmp', systemPrompt: '' })
  const iterator = kernel.prompt(handle, { runId: 'r', text: '' }, { signal: new AbortController().signal })[Symbol.asyncIterator]()
  expect((await iterator.next()).value).toMatchObject({ t: 'permission.request' })
  await kernel.cancel(handle); await expect(iterator.next()).rejects.toThrow('取消'); await iterator.return?.()
  expect(behavior).toBe('deny'); await kernel.close(handle)
})

test('Given 关闭后同sessionId重新创建 When 旧句柄重用 Then 不能控制新会话', async () => {
  const kernel = new PiKernel(options, { async *query() { yield { type: 'result', subtype: 'success' } }, abort() {}, dispose() {} })
  const input = { sessionId: 's1', cwd: '/tmp', systemPrompt: '' }
  const first = await kernel.createSession(input); await kernel.close(first)
  const second = await kernel.createSession(input)
  expect(second.kernelSessionRef).not.toBe(first.kernelSessionRef)
  await expect(kernel.cancel(first)).rejects.toThrow('句柄')
  await kernel.close(second)
})

test('Given 外部持久化native句柄 When 显式load Then 从原Pi会话恢复', async () => {
  let resumed: string | undefined
  const kernel = new PiKernel(options, { async *query(input) { resumed = input.resumeSessionId; yield { type: 'result', subtype: 'success' } }, abort() {}, dispose() {} })
  const handle = { kernelId: 'pi', sessionId: 's1', kernelSessionRef: 'persisted-native' }
  await kernel.loadSession(handle)
  for await (const _event of kernel.prompt(handle, { runId: 'r1', text: '继续' }, { signal: new AbortController().signal })) { /* 消费 */ }
  expect(resumed).toBe('persisted-native'); await kernel.close(handle)
})
