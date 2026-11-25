import { KernelCapabilitiesSchema, KernelIdSchema } from '@proma/protocol'
import type { KernelCapabilities, KernelEvent, KernelId, KernelPermissionResponse, KernelProbeResult, KernelPromptInput, KernelSessionCreate, KernelSessionHandle } from '@proma/protocol'

/** 只暴露产品契约；可选方法缺失代表不支持，不能静默模拟成功。 */
export interface AgentKernel {
  readonly id: KernelId
  readonly protocol: 'native' | 'acp' | 'pty'
  readonly capabilities: KernelCapabilities
  probe?(): Promise<KernelProbeResult>
  createSession?(input: KernelSessionCreate): Promise<KernelSessionHandle>
  loadSession?(handle: KernelSessionHandle): Promise<KernelSessionHandle>
  prompt(handle: KernelSessionHandle, input: KernelPromptInput, options: { signal: AbortSignal }): AsyncIterable<KernelEvent>
  cancel(handle: KernelSessionHandle): Promise<void>
  close(handle: KernelSessionHandle): Promise<void>
  steer?(handle: KernelSessionHandle, text: string): Promise<void>
  respondPermission?(handle: KernelSessionHandle, requestId: string, response: KernelPermissionResponse): Promise<void>
  describePersistence?(handle: KernelSessionHandle): { kernelSessionRef: string } | null
}
export class AgentKernelRegistry {
  private readonly kernels = new Map<string, AgentKernel>()
  register(kernel: AgentKernel): () => void {
    KernelIdSchema.parse(kernel.id); KernelCapabilitiesSchema.parse(kernel.capabilities)
    if (this.kernels.has(kernel.id)) throw new Error(`内核运行时已注册：${kernel.id}`)
    if (kernel.capabilities.session.create && !kernel.createSession) throw new Error('声明 create 能力但缺少方法')
    if (kernel.capabilities.session.load && !kernel.loadSession) throw new Error('声明 load 能力但缺少方法')
    if (kernel.capabilities.steer && !kernel.steer) throw new Error('声明 steer 能力但缺少方法')
    this.kernels.set(kernel.id, kernel)
    return () => { if (this.kernels.get(kernel.id) === kernel) this.kernels.delete(kernel.id) }
  }
  get(id: string): AgentKernel {
    const kernel = this.kernels.get(id)
    if (!kernel) throw new Error(`未注册内核运行时：${id}`)
    return kernel
  }
  list(): AgentKernel[] { return [...this.kernels.values()] }
}
