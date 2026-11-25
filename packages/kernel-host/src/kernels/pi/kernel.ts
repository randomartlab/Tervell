import { randomUUID } from 'node:crypto'
import { KernelCapabilitiesSchema, KernelPromptInputSchema, KernelSessionCreateSchema, KernelSessionHandleSchema, KernelPermissionResponseSchema } from '@proma/protocol'
import type { KernelEvent, KernelSessionHandle, KernelSessionCreate, KernelPromptInput, KernelPermissionResponse } from '@proma/protocol'
import type { AgentKernel } from '../../agent-kernel.ts'
import { PiAgentAdapter } from './pi-agent-adapter'
import type { PiAgentQueryOptions } from './pi-agent-adapter'
import { PiKernelEventMapper } from './kernel-events'
import { createPromptContext } from '../../prompt-context.ts'

type QueryAdapter = Pick<PiAgentAdapter, 'query' | 'abort' | 'dispose'>
interface State { input: KernelSessionCreate; nativeRef?: string; running: boolean; cancelled?: boolean; seenHistory: Set<string>; finished?: Promise<void> }
export class PiKernel implements AgentKernel {
  readonly id = 'pi'
  readonly protocol = 'native' as const
  readonly capabilities = KernelCapabilitiesSchema.parse({
    context: { systemPrompt: 'meta', skills: 'native', instructionsFile: null }, streaming: { thinking: true, toolProgress: true },
    session: { create: true, load: true, resume: true }, permission: 'callback', tools: { mcp: true, perSessionMcp: true },
    usage: { tokens: true, cost: true, contextWindow: true }, compaction: 'native', models: 'registry', transport: 'in-process',
  })
  private readonly closed = new Set<string>()
  private readonly sessions = new Map<string, State>()
  private readonly approvals = new Map<string, { ref: string; resolve: (allow: boolean) => void }>()
  constructor(private readonly options: (handle: KernelSessionHandle) => PiAgentQueryOptions, private readonly adapter: QueryAdapter = new PiAgentAdapter()) {}
  async createSession(input: KernelSessionCreate): Promise<KernelSessionHandle> {
    const parsed = KernelSessionCreateSchema.parse(input)
    if ([...this.sessions.values()].some((state) => state.input.sessionId === parsed.sessionId)) throw new Error('Pi 会话已存在')
    const handle = { kernelId: this.id, sessionId: parsed.sessionId, kernelSessionRef: randomUUID() }
    this.sessions.set(handle.kernelSessionRef, { input: parsed, running: false, seenHistory: new Set() }); return handle
  }
  async loadSession(handle: KernelSessionHandle): Promise<KernelSessionHandle> {
    KernelSessionHandleSchema.parse(handle)
    if (this.closed.has(handle.kernelSessionRef)) throw new Error('Pi 句柄已关闭')
    if (!this.sessions.has(handle.kernelSessionRef)) {
      if (handle.kernelId !== this.id) throw new Error('Pi 句柄内核不匹配')
      const configured = this.options(handle)
      this.sessions.set(handle.kernelSessionRef, { input: KernelSessionCreateSchema.parse({ sessionId: handle.sessionId, cwd: configured.cwd ?? process.cwd(), systemPrompt: configured.systemPrompt }), nativeRef: handle.kernelSessionRef, running: false, seenHistory: new Set() })
    }
    this.state(handle); return handle
  }
  private state(handle: KernelSessionHandle): State {
    KernelSessionHandleSchema.parse(handle)
    const state = this.sessions.get(handle.kernelSessionRef)
    if (handle.kernelId !== this.id || !state || state.input.sessionId !== handle.sessionId) throw new Error('Pi 句柄无效或未在本宿主加载')
    return state
  }
  async *prompt(handle: KernelSessionHandle, raw: KernelPromptInput, { signal }: { signal: AbortSignal }): AsyncIterable<KernelEvent> {
    const state = this.state(handle); const input = KernelPromptInputSchema.parse(raw)
    if (state.running) throw new Error('Pi 会话正在运行')
    if (signal.aborted) throw new Error('Pi 请求已取消')
    state.running = true; state.cancelled = false
    const mapper = new PiKernelEventMapper(input.runId); const queue: unknown[] = []
    let wake: (() => void) | undefined; let done = false; let failure: unknown
    const push = (frame: unknown) => { queue.push(frame); wake?.(); wake = undefined }
    const cancel = () => { state.cancelled = true; this.adapter.abort(handle.sessionId); this.denyApprovals(handle) }
    signal.addEventListener('abort', cancel, { once: true })
    const source = (async () => {
      try {
        const options = this.options(handle)
        for await (const frame of this.adapter.query({ ...options, sessionId: handle.sessionId, cwd: state.input.cwd,
          systemPrompt: state.input.systemPrompt, abortSignal: signal, prompt: createPromptContext({ ...input, history: input.history.filter((message) => !state.seenHistory.has(message.id)), summary: !state.nativeRef || input.history.some((message) => !state.seenHistory.has(message.id)) ? input.summary : undefined }, false),
          resumeSessionId: state.nativeRef,
          onSessionId: (id, file) => { state.nativeRef = id; options.onSessionId?.(id, file) },
          onRetry: (retry) => { options.onRetry?.(retry); if (retry.status === 'starting') push({ type: 'retry', attempt: retry.attempt, maxAttempts: retry.maxAttempts, reason: retry.reason, retryAfterMs: retry.delaySeconds * 1000 }) },
          canUseTool: async (tool, toolInput, request) => {
            // 应用已有更严格工具边界必须先通过；这里再执行显式内核审批。
            const prior = await options.canUseTool?.(tool, toolInput, request)
            if (prior?.behavior === 'deny') return prior
            if (signal.aborted || request.signal.aborted) return { behavior: 'deny', message: '操作已取消' }
            const requestId = randomUUID()
            const allow = await new Promise<boolean>((resolve) => {
              const deny = () => { this.approvals.delete(requestId); resolve(false) }
              this.approvals.set(requestId, { ref: handle.kernelSessionRef, resolve: (allowed) => { request.signal.removeEventListener('abort', deny); resolve(allowed) } })
              request.signal.addEventListener('abort', deny, { once: true })
              push({ type: 'permission_request', request: { requestId, kind: 'other', tool, input: toolInput, summary: `请求执行 ${tool}`, actions: [{ id: 'allow', label: '允许', behavior: 'allow' }, { id: 'deny', label: '拒绝', behavior: 'deny' }] } })
            })
            return allow ? { behavior: 'allow', updatedInput: prior?.updatedInput ?? toolInput } : { behavior: 'deny', message: '操作被拒绝' }
          },
        })) push(frame)
      } catch (error) { failure = error } finally { done = true; wake?.() }
    })()
    state.finished = source
    try {
      while (!done || queue.length) {
        if (state.cancelled) throw new Error('Pi 请求已取消')
        if (!queue.length) { await new Promise<void>((resolve) => { wake = resolve }); continue }
        for (const event of mapper.map(queue.shift())) {
          if (event.t === 'message.final') state.seenHistory.add(event.message.id)
          yield event
        }
      }
      if (state.cancelled) throw new Error('Pi 请求已取消')
      if (failure) throw failure
      for (const message of input.history) state.seenHistory.add(message.id)
    } finally { if (!done) cancel(); else this.denyApprovals(handle); await source; signal.removeEventListener('abort', cancel); state.running = false; state.finished = undefined }
  }
  async respondPermission(handle: KernelSessionHandle, requestId: string, raw: KernelPermissionResponse): Promise<void> {
    this.state(handle); const response = KernelPermissionResponseSchema.parse(raw)
    const pending = this.approvals.get(requestId)
    if (!pending || pending.ref !== handle.kernelSessionRef) throw new Error('审批请求不属于本会话')
    if (response.actionId !== response.behavior) throw new Error('审批动作与行为不一致')
    this.approvals.delete(requestId); pending.resolve(response.behavior === 'allow')
  }
  private denyApprovals(handle: KernelSessionHandle) { for (const [id, request] of this.approvals) if (request.ref === handle.kernelSessionRef) { this.approvals.delete(id); request.resolve(false) } }
  async cancel(handle: KernelSessionHandle) { const state = this.state(handle); if (state.running) state.cancelled = true; this.adapter.abort(handle.sessionId); this.denyApprovals(handle) }
  async close(handle: KernelSessionHandle) { const state = this.state(handle); await this.cancel(handle); await state.finished; this.sessions.delete(handle.kernelSessionRef); this.closed.add(handle.kernelSessionRef) }
  describePersistence(handle: KernelSessionHandle) { const state = this.state(handle); return state.nativeRef ? { kernelSessionRef: state.nativeRef } : null }
}
