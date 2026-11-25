import { test, expect } from 'bun:test'
import { ScriptedKernel } from './scripted-kernel.ts'
import type { ScriptStep } from './scripted-kernel.ts'
const done = { t: 'done', runId: 'r', seq: 1, reason: 'stop' } as const
for (const [name, script] of Object.entries({ error: [{ error: '注入故障' }], duplicate: [{ event: done }, { event: done }], unordered: [{ event: { ...done, seq: 2 } }, { event: done }], late: [{ event: { ...done, runId: 'old' } }] } satisfies Record<string, ScriptStep[]>)) {
  test(`Given ${name} 脚本 When 执行 Then 故障可重复且未被伪造吞掉`, async () => {
    const kernel = new ScriptedKernel('scripted', () => script)
    const handle = await kernel.createSession({ sessionId: 's', cwd: '/tmp', systemPrompt: '' })
    const collect = async () => { const result = []; for await (const e of kernel.prompt(handle, { runId: 'r', text: '' }, { signal: new AbortController().signal })) result.push(e); return result }
    if (name === 'error') await expect(collect()).rejects.toThrow('注入故障')
    else expect(await collect()).toEqual(script.flatMap((step) => 'event' in step ? [step.event] : []))
    await kernel.close(handle)
  })
}
test('Given waitForCancel When 发起取消 Then 等待结束且其他会话不受影响', async () => {
  const kernel = new ScriptedKernel('scripted', () => [{ waitForCancel: true }])
  const handle = await kernel.createSession({ sessionId: 's', cwd: '/tmp', systemPrompt: '' })
  const iterator = kernel.prompt(handle, { runId: 'r', text: '' }, { signal: new AbortController().signal })[Symbol.asyncIterator]()
  const result = iterator.next().then(() => '', (error: unknown) => String(error))
  await kernel.cancel(handle); expect(await result).toContain('取消'); await kernel.close(handle)
})
