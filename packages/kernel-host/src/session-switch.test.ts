import { test, expect } from 'bun:test'
import type { KernelPromptInput, Message } from '@proma/protocol'
import { AgentKernelRegistry } from './agent-kernel.ts'
import { ScriptedKernel } from './scripted-kernel.ts'
import { KernelSessionSwitcher } from './session-switch.ts'
import { createPromptContext } from './prompt-context.ts'

test('Given A→B→A 切换 When 传递N轮和摘要 Then 顺序/附件/旧句柄不丢失', async () => {
  const observed: KernelPromptInput[] = []; const registry = new AgentKernelRegistry()
  for (const id of ['a', 'b']) registry.register(new ScriptedKernel(id, (input) => { observed.push(input); return [{ event: { t: 'done', runId: input.runId, seq: 1, reason: 'stop' } }] }))
  const switcher = new KernelSessionSwitcher(registry, { sessionId: 's1', cwd: '/tmp', systemPrompt: '规则' })
  const history: Message[] = [{ id: 'm1', role: 'user', content: [{ type: 'text', text: '问题' }, { type: 'image', url: 'https://example.test/a.png' }], createdAt: 0 }, { id: 'm2', role: 'assistant', content: [{ type: 'text', text: '回答' }], createdAt: 1 }]
  const first = await switcher.switchTo('a')
  for (const id of ['a', 'b', 'a']) {
    await switcher.switchTo(id)
    for await (const _event of switcher.prompt({ runId: `run${observed.length}`, text: '继续' }, history, '摘要', new AbortController().signal)) { /* 消费事件 */ }
  }
  expect(await switcher.switchTo('a')).toEqual(first)
  expect(observed.every((input) => JSON.stringify(input.history) === JSON.stringify(history))).toBe(true)
  expect(observed.every((input) => input.summary === '摘要')).toBe(true)
  expect(createPromptContext(observed[0]!, false)).toContain('example.test/a.png')
  expect(createPromptContext(observed[0]!, true)).toBe('继续')
  await switcher.close()
})
test('Given 不存在目标 When 切换失败 Then 原内核仍然可执行', async () => {
  const registry = new AgentKernelRegistry(); registry.register(new ScriptedKernel('a', (input) => [{ event: { t: 'done', runId: input.runId, seq: 1, reason: 'stop' } }]))
  const switcher = new KernelSessionSwitcher(registry, { sessionId: 's1', cwd: '/tmp', systemPrompt: '' }); await switcher.switchTo('a')
  await expect(switcher.switchTo('missing')).rejects.toThrow('未注册')
  const events = []; for await (const event of switcher.prompt({ runId: 'r', text: '' }, [], undefined, new AbortController().signal)) events.push(event)
  expect(events).toHaveLength(1); await switcher.close()
})

test('Given 异步创建句柄 When 并发切换 Then 第二次被拒绝而非覆盖第一次', async () => {
  const registry = new AgentKernelRegistry(); const kernel = new ScriptedKernel('a', () => [])
  const create = kernel.createSession.bind(kernel); let finish: (() => void) | undefined
  kernel.createSession = async (input) => { await new Promise<void>((resolve) => { finish = resolve }); return create(input) }
  registry.register(kernel)
  const switcher = new KernelSessionSwitcher(registry, { sessionId: 's1', cwd: '/tmp', systemPrompt: '' })
  const first = switcher.switchTo('a'); await expect(switcher.switchTo('a')).rejects.toThrow('切换中')
  finish?.(); await first; await switcher.close()
})

for (const [name, script] of Object.entries({
  '迟到run': [{ t: 'done', runId: 'old', seq: 1, reason: 'stop' }],
  '重复序号': [{ t: 'message.delta', runId: 'r', seq: 1, index: 0, kind: 'text', text: '' }, { t: 'done', runId: 'r', seq: 1, reason: 'stop' }],
  '终态后事件': [{ t: 'done', runId: 'r', seq: 1, reason: 'stop' }, { t: 'done', runId: 'r', seq: 2, reason: 'stop' }],
  '缺终态': [],
} as const)) {
  test(`Given ${name} When 通过切换器消费 Then 流明确失败而不污染其他run`, async () => {
    const registry = new AgentKernelRegistry(); registry.register(new ScriptedKernel('a', () => script.map((event) => ({ event }))))
    const switcher = new KernelSessionSwitcher(registry, { sessionId: 's1', cwd: '/tmp', systemPrompt: '' }); await switcher.switchTo('a')
    const consume = async () => { for await (const _event of switcher.prompt({ runId: 'r', text: '' }, [], undefined, new AbortController().signal)) { /* 消费 */ } }
    await expect(consume()).rejects.toThrow(name === '缺终态' ? '终态' : 'run/序号')
    await switcher.close()
  })
}
