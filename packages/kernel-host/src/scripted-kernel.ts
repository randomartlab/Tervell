import { randomUUID } from 'node:crypto'
import { KernelCapabilitiesSchema, KernelSessionCreateSchema, KernelSessionHandleSchema, KernelEventSchema } from '@proma/protocol'
import type { KernelEvent, KernelPromptInput, KernelSessionCreate, KernelSessionHandle } from '@proma/protocol'
import type { AgentKernel } from './agent-kernel.ts'

export type ScriptStep = { event: KernelEvent } | { error: string } | { waitForCancel: true }
/** KH-04 确定性故障注入内核；脚本可产生重复/乱序/迟到，不能当真实模型替代品。 */
export class ScriptedKernel implements AgentKernel {
  readonly protocol = 'native' as const
  readonly capabilities = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null }, transport: 'in-process' })
  private readonly sessions = new Map<string, string>()
  private readonly cancellations = new Map<string, AbortController>()
  constructor(readonly id: string, private readonly script: (input: KernelPromptInput) => readonly ScriptStep[]) {}
  async createSession(raw: KernelSessionCreate): Promise<KernelSessionHandle> {
    const input = KernelSessionCreateSchema.parse(raw)
    const ref = randomUUID(); this.sessions.set(ref, input.sessionId)
    return { kernelId: this.id, sessionId: input.sessionId, kernelSessionRef: ref }
  }
  private verify(handle: KernelSessionHandle): void {
    KernelSessionHandleSchema.parse(handle)
    if (handle.kernelId !== this.id || this.sessions.get(handle.kernelSessionRef) !== handle.sessionId) throw new Error('scripted 句柄不属于本内核')
  }
  async *prompt(handle: KernelSessionHandle, input: KernelPromptInput, { signal }: { signal: AbortSignal }): AsyncIterable<KernelEvent> {
    this.verify(handle)
    if (this.cancellations.has(handle.kernelSessionRef)) throw new Error('scripted 会话正在运行')
    const controller = new AbortController(); const abort = () => controller.abort()
    this.cancellations.set(handle.kernelSessionRef, controller)
    signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort()
    try {
      for (const step of this.script(input)) {
        if (controller.signal.aborted) throw new Error('scripted 已取消')
        if ('error' in step) throw new Error(step.error)
        if ('waitForCancel' in step) {
          await new Promise<void>((resolve) => controller.signal.addEventListener('abort', () => resolve(), { once: true }))
          throw new Error('scripted 已取消')
        }
        yield KernelEventSchema.parse(step.event)
      }
    } finally { signal.removeEventListener('abort', abort); this.cancellations.delete(handle.kernelSessionRef) }
  }
  async cancel(handle: KernelSessionHandle) { this.verify(handle); this.cancellations.get(handle.kernelSessionRef)?.abort() }
  async close(handle: KernelSessionHandle) { await this.cancel(handle); this.sessions.delete(handle.kernelSessionRef) }
}
