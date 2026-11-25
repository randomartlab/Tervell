import { test, expect } from 'bun:test'
import { KernelCapabilitiesSchema } from '@proma/protocol'
import { AgentKernelRegistry } from './agent-kernel.ts'
import type { AgentKernel } from './agent-kernel.ts'
const capabilities = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null }, session: { create: true } })
function fake(): AgentKernel {
  return { id: 'fake', protocol: 'native', capabilities,
    async createSession(input) { return { kernelId: 'fake', sessionId: input.sessionId, kernelSessionRef: input.sessionId } },
    async *prompt(_handle, input) { yield { t: 'done', runId: input.runId, seq: 1, reason: 'stop' } },
    async cancel() {}, async close() {},
  }
}
test('Given fake kernel When 注册创建运行关闭 Then 契约贯通且可撤销注册', async () => {
  const registry = new AgentKernelRegistry(); const remove = registry.register(fake()); const kernel = registry.get('fake')
  const handle = await kernel.createSession!({ sessionId: 's1', cwd: '/tmp', systemPrompt: '' })
  const events = []; for await (const event of kernel.prompt(handle, { runId: 'r1', text: '测试' }, { signal: new AbortController().signal })) events.push(event)
  expect(events[0]?.t).toBe('done'); await kernel.cancel(handle); await kernel.close(handle)
  remove(); expect(registry.list()).toEqual([]); expect(() => registry.get('fake')).toThrow('未注册')
})
test('Given 重复注册或能力虚报 When 注册 Then 拒绝', () => {
  const registry = new AgentKernelRegistry(); registry.register(fake()); expect(() => registry.register(fake())).toThrow('已注册')
  const invalid = fake(); delete invalid.createSession; expect(() => new AgentKernelRegistry().register(invalid)).toThrow('create')
})
