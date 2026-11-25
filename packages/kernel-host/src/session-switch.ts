import type { KernelEvent, KernelPromptInput, KernelSessionCreate, KernelSessionHandle, Message } from '@proma/protocol'
import { KernelSessionCreateSchema, KernelSessionHandleSchema, KernelEventSchema, KernelPromptInputSchema } from '@proma/protocol'
import { AgentKernelRegistry } from './agent-kernel.ts'
import { projectKernel } from './projection.ts'

/** 会话历史由 journal 调用方提供；切换器只持有运行时句柄，绝不另存持久历史。 */
export class KernelSessionSwitcher {
  private current?: KernelSessionHandle
  private readonly handles = new Map<string, KernelSessionHandle>()
  private running = false
  private switching = false
  constructor(private readonly registry: AgentKernelRegistry, private readonly input: KernelSessionCreate) { KernelSessionCreateSchema.parse(input) }
  async switchTo(kernelId: string): Promise<KernelSessionHandle> {
    if (this.running || this.switching) throw new Error('运行中或切换中不能再次切换内核')
    this.switching = true
    try {
      const kernel = this.registry.get(kernelId)
      projectKernel(kernel.capabilities, kernel.protocol === 'native' ? 'native-sdk' : kernel.protocol)
      let target = this.handles.get(kernelId)
      if (!target) {
        if (!kernel.createSession) throw new Error('目标内核不支持创建会话')
        target = KernelSessionHandleSchema.parse(await kernel.createSession(this.input))
        if (target.kernelId !== kernelId || target.sessionId !== this.input.sessionId) throw new Error('目标内核返回错误会话句柄')
        this.handles.set(kernelId, target)
      }
      if (this.current) await this.registry.get(this.current.kernelId).cancel(this.current)
      this.current = target; return target
    } finally { this.switching = false }
  }
  async *prompt(input: KernelPromptInput, history: readonly Message[], summary: string | undefined, signal: AbortSignal): AsyncIterable<KernelEvent> {
    if (this.switching) throw new Error('内核切换中')
    if (!this.current) throw new Error('尚未绑定内核')
    if (this.running) throw new Error('会话正在运行')
    this.running = true
    try {
      const request = KernelPromptInputSchema.parse({ ...input, history: [...history], summary })
      let lastSeq = 0; let done = false
      for await (const raw of this.registry.get(this.current.kernelId).prompt(this.current, request, { signal })) {
        const event = KernelEventSchema.parse(raw)
        if (event.runId !== request.runId || event.seq <= lastSeq || done) throw new Error('内核事件 run/序号错误或终态后仍有事件')
        lastSeq = event.seq; done = event.t === 'done'
        yield event
      }
      if (!done && !signal.aborted) throw new Error('内核事件流缺少 done 终态')
    } finally { this.running = false }
  }
  async close(): Promise<void> {
    if (this.running || this.switching) throw new Error('请先取消当前运行或等待切换完成')
    for (const handle of this.handles.values()) await this.registry.get(handle.kernelId).close(handle)
    this.handles.clear(); this.current = undefined
  }
}
