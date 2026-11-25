import {sessionControls,validateControlValue} from './controls.ts'
import type {KernelSessionSelection} from '@proma/shared'
import {primaryKernelControl,kernelControlSelectionField,isKernelModelDependency} from '@proma/shared'
import type { AcpClientBridge } from './client-bridge.ts'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { isAbsolute } from 'node:path'
import { randomUUID } from 'node:crypto'
import { AcpStdioMcpServerSchema, AcpSessionMetadataUpdateSchema, AcpInitializeResultSchema, AcpNewSessionResultSchema, AcpNotificationSchema, AcpPermissionSchema, KernelCapabilitiesSchema, KernelIdSchema, KernelSessionCreateSchema, KernelSessionHandleSchema, KernelPromptInputSchema, KernelPermissionResponseSchema } from '@proma/protocol'
import type { AcpStdioMcpServer, KernelCapabilities, JsonValue, JsonRpcMessage, AcpModelCatalog, KernelEvent, KernelSessionCreate, KernelSessionHandle, KernelPromptInput, KernelPermissionResponse } from '@proma/protocol'
import type { AgentKernel } from '../agent-kernel.ts'
import { createPromptContext } from '../prompt-context.ts'
import { JsonRpcPeer, RpcRemoteError } from './rpc.ts'
import type { AcpDialect } from './dialects/types.ts'
import { readSessionCatalog } from './dialects/catalog.ts'
import { AcpModelCatalogSchema } from '@proma/protocol'
import { AcpEventMapper, acpEntityId, acpToolKind } from './mapper.ts'
import { isKernelAuthenticationRequired, KernelAuthenticationRequiredError, configuredAcpAuthentication } from './authentication'
import { acpPromptFailureMessage } from './errors'
import {terminateAcpProcess,spawnAcpProcess}from'./process'

interface Run { callbacks:AbortController; closed: boolean; cancelled: boolean; mapper: AcpEventMapper; push: (event: KernelEvent) => void; stop: AbortController; cancel: () => void }
interface Approval { handle: string; run: Run; options: Map<string, 'allow' | 'deny'>; resolve: (value: JsonValue) => void; reply: (id: string | null) => JsonValue; timer: ReturnType<typeof setTimeout> }
export interface AcpToolBridge { config: AcpStdioMcpServer; close(): Promise<void> }
interface Session { stderr: () => string; clientBridge?: AcpClientBridge; toolBridge?: AcpToolBridge; handle: KernelSessionHandle; remoteId: string; child: ChildProcessWithoutNullStreams; peer: JsonRpcPeer; exited: Promise<void>; poisoned: boolean; seenHistory: Set<string>; catalog: AcpModelCatalog; metadata: Record<string, JsonValue>; catalogLoading: boolean; run?: Run; finished?: Promise<void> }
export interface AcpPermissionCallback { sessionId: string; kind: import('@proma/protocol').ToolKind; tool: string; input: JsonValue; command?: string; options: Array<{ optionId: string; kind: string }> }
export interface AcpKernelOptions { sessionChanged?: (sessionId:string,metadata:Record<string,JsonValue>)=>void; openClientBridge?: (input: KernelSessionCreate) => Promise<AcpClientBridge>; approve?: (request: AcpPermissionCallback, signal: AbortSignal) => Promise<string | null>; command: string; args?: string[]; env?: Record<string, string>; timeoutMs?: number; promptTimeoutMs?:number|null; permissionTimeoutMs?: number; cancelGraceMs?: number; trace?: (direction: 'client' | 'agent', message: JsonRpcMessage) => void; inheritEnv?: boolean; dialect?: AcpDialect; openToolBridge?: (input: KernelSessionCreate) => Promise<AcpToolBridge>; mcpServers?: JsonValue[] }
/** 每个产品会话一个ACP进程；取消或prompt失败后句柄不再复用，避免迟到无run标签更新串到下一轮。 */
export class AcpKernel implements AgentKernel {
  readonly protocol = 'acp' as const
  readonly capabilities: KernelCapabilities
  private readonly idleErrors = new Map<string, JsonValue[]>()
  private readonly usedRuns = new Map<string, Set<string>>()
  private readonly launches = new Set<string>()
  private readonly sessions = new Map<string, Session>()
  private readonly approvals = new Map<string, Approval>()
  constructor(readonly id: string, private readonly options: AcpKernelOptions) { KernelIdSchema.parse(id); if (!options.command) throw new Error('ACP command不能为空'); this.capabilities = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null, systemPrompt: 'prepend' }, session: { create: true, load: false }, fs: options.openClientBridge ? 'client-bridge' : 'kernel-owned', terminal: options.openClientBridge ? 'client-bridge' : 'kernel-owned', tools: { native: true, mcp: !!options.openToolBridge, perSessionMcp: !!options.openToolBridge }, permission: 'callback', streaming: { thinking: true, toolProgress: true }, transport: 'stdio' }) }
  async createSession(raw: KernelSessionCreate, control?: { signal: AbortSignal }): Promise<KernelSessionHandle> {
    if (control?.signal.aborted) throw new Error('ACP 创建已取消')
    const input = KernelSessionCreateSchema.parse(raw)
    if (!isAbsolute(input.cwd)) throw new Error('ACP cwd 必须为绝对路径')
    if (this.launches.has(input.sessionId) || [...this.sessions.values()].some((session) => session.handle.sessionId === input.sessionId)) throw new Error('ACP产品会话已存在或启动中')
    this.launches.add(input.sessionId)
    let child: ChildProcessWithoutNullStreams
    try { child = spawnAcpProcess(this.options.command, this.options.args ?? [], { cwd: input.cwd, env: { ...(this.options.inheritEnv === false ? {} : process.env), ...this.options.env },detached:process.platform!=='win32',windowsHide:true, stdio: ['pipe', 'pipe', 'pipe'] }) }
    catch (error) { this.launches.delete(input.sessionId); throw error }
    const earlyUpdates:Array<{method:string;params:JsonValue|undefined}>=[]
    let failure: Error | undefined; let session: Session | undefined; let toolBridge: AcpToolBridge | undefined; let clientBridge: AcpClientBridge | undefined
    const exited = new Promise<void>((resolve) => child.once('close', () => { failure ??= new Error('ACP 子进程退出'); session?.peer.close(failure); void toolBridge?.close().catch(() => {}); void clientBridge?.close().catch(() => {}); resolve() }))
    let stderrTail = ''
    // 仅有界保留最近诊断，在失败时统一脱敏；既不吞根因，也不无限积累 CLI 输出。
    child.stderr.on('data', (chunk: Buffer) => { stderrTail = (stderrTail + chunk.toString('utf8')).slice(-8192) })
    const peer = new JsonRpcPeer(child.stdout, child.stdin, {
      timeoutMs: this.options.timeoutMs, onMessage: this.options.trace,
      onClose: (error) => { failure = error; if (session) session.poisoned = true; terminateAcpProcess(child) },
      onNotification: (method, params) => {
        if (method !== 'session/update' && method !== '_proma/compaction' && method !== '_proma/retry') return
        if (!session) {if(earlyUpdates.length<64)earlyUpdates.push({method,params});return}
        if (method === 'session/update') {
          const notification = AcpNotificationSchema.safeParse(params)
          if (notification.success && notification.data.sessionId === session.remoteId) {
            const metadata = AcpSessionMetadataUpdateSchema.safeParse(notification.data.update)
            if (metadata.success && Buffer.byteLength(JSON.stringify(metadata.data)) < 2 * 1024 * 1024) {
              session.metadata[metadata.data.sessionUpdate] = JSON.parse(JSON.stringify(metadata.data))
              if (metadata.data.sessionUpdate === 'config_option_update') { session.metadata.configOptions=metadata.data.configOptions; session.catalog = readSessionCatalog(session.metadata) }
              if(metadata.data.sessionUpdate==='current_mode_update'){const modes=session.metadata.modes;session.metadata.modes={...(modes&&typeof modes==='object'&&!Array.isArray(modes)?modes:{}),currentModeId:metadata.data.currentModeId}}
              this.options.sessionChanged?.(session.handle.sessionId,structuredClone(session.metadata))
              return
            }
          }
        }
        if (!session.run || session.run.closed) {
          const pending = this.idleErrors.get(session.handle.kernelSessionRef) ?? []
          if (pending.length >= 32) { session.poisoned = true; peer.close(new Error('ACP空闲更新超限')); return }
          pending.push({ method, params: params ?? null }); this.idleErrors.set(session.handle.kernelSessionRef, pending); return
        }
        const run = session.run
        if (method === 'session/update') {
          const parsed = AcpNotificationSchema.safeParse(params)
          if (!parsed.success) { run.push(run.mapper.error('invalid_acp_notification', params)); return }
          if (parsed.data.sessionId !== session.remoteId) { run.push(run.mapper.error('acp_session_mismatch', params)); return }
          for (const event of run.mapper.update(parsed.data.update)) run.push(event)
        } else for (const event of run.mapper.extension(method, params)) run.push(event)
      },
      onRequest: async (method, params) => {
        if (method.startsWith('fs/') || method.startsWith('terminal/')) {
          if (!session?.clientBridge || !session.run || session.run.closed || session.poisoned || !params || typeof params !== 'object' || Array.isArray(params) || params.sessionId !== session.remoteId) throw new RpcRemoteError(-32602, '客户端回调未授权或会话不匹配')
          return session.clientBridge.request(method, params, session.run.callbacks.signal)
        }
        let vendor
        try { vendor = this.options.dialect?.interaction?.(method, params) }
        catch (error) {
          if (session?.run && !session.run.closed) session.run.push(session.run.mapper.error('unsupported_dialect_interaction', { method, params: params ?? null }, String(error)))
          throw new RpcRemoteError(-32602, error instanceof Error ? error.message : String(error))
        }
        if (method !== 'session/request_permission' && !vendor) {
          // JSON-RPC 能力探测按标准返回 Method not found；不执行未授权能力，也不把可选探测污染成整轮失败。
          throw new RpcRemoteError(-32601, '回调未实现；fs/terminal未声明')
        }
        if (vendor && params && typeof params === 'object' && !Array.isArray(params) && params.sessionId !== undefined && params.sessionId !== session?.remoteId) {
          if (session?.run && !session.run.closed) session.run.push(session.run.mapper.error('acp_session_mismatch', params))
          throw new RpcRemoteError(-32602, '厂商请求session归属不匹配')
        }
        const request = AcpPermissionSchema.parse(vendor ? { sessionId: session?.remoteId ?? '', toolCall: vendor.toolCall, options: vendor.options } : params)
        const reply = vendor?.reply ?? ((id: string | null): JsonValue => id === null ? { outcome: { outcome: 'cancelled' } } : { outcome: { outcome: 'selected', optionId: id } })
        if (!session?.run || session.run.closed || session.poisoned || request.sessionId !== session.remoteId) return reply(null)
        if (this.options.approve && !vendor) {
          const rawInput = request.toolCall.rawInput ?? {}
          const command = rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput) && typeof rawInput.command === 'string' ? rawInput.command : undefined
          const selected = await this.options.approve({ sessionId: session.handle.sessionId, kind:acpToolKind(request.toolCall.kind), tool: request.toolCall.title ?? request.toolCall.toolCallId, input: rawInput, command, options: request.options.map((o) => ({ optionId: o.optionId, kind: o.kind })) }, session.run.callbacks.signal)
          if (session.run.closed || session.run.stop.signal.aborted) return reply(null)
          if (selected !== null && !request.options.some((o) => o.optionId === selected)) throw new RpcRemoteError(-32602, '审批选项无效')
          return reply(selected)
        }
        const current = session; const run = session.run; const requestId = randomUUID()
        if (vendor?.plan) run.push(run.mapper.emit({ t: 'plan.update', steps: [{ id: 'cursor_plan', title: vendor.plan, status: 'pending' }] }))
        const choices = new Map(request.options.map((option) => [option.optionId, option.kind.startsWith('allow') ? 'allow' as const : 'deny' as const]))
        const productOptions = request.options.map((option) => ({ id: acpEntityId(option.optionId), label: option.name, behavior: option.kind.startsWith('allow') ? 'allow' : 'deny', ...(option.kind === 'allow_always' ? { variant: 'always' } : {}) }))
        return new Promise<JsonValue>((resolve) => {
          const timer = setTimeout(() => { this.approvals.delete(requestId); resolve(reply(null)) }, this.options.permissionTimeoutMs ?? 60000)
          this.approvals.set(requestId, { handle: current.handle.kernelSessionRef, run, options: choices, resolve, reply, timer })
          run.push(run.mapper.emit({ t: 'permission.request', req: { requestId, kind: acpToolKind(request.toolCall.kind), tool: request.toolCall.title ?? request.toolCall.toolCallId, summary: request.toolCall.title ?? 'ACP工具审批', input: { rawInput: request.toolCall.rawInput ?? null }, actions: productOptions } }))
        })
      },
    })
    child.on('error', (error) => { failure = error; peer.close(error) })
    const abortCreation = () => { peer.close(new Error('ACP 创建已取消')); terminateAcpProcess(child) }
    control?.signal.addEventListener('abort', abortCreation, { once: true })
    if (control?.signal.aborted) abortCreation()
    try {
      const initialized = AcpInitializeResultSchema.parse(await peer.request('initialize', { protocolVersion: 1, clientInfo: { name: 'tervell', version: '0.19' }, clientCapabilities: { ...(this.options.openClientBridge ? { fs: { readTextFile: true, writeTextFile: true }, terminal: true } : {}), session: { compaction: {}, configOptions:{boolean:{}} }, ...(this.options.dialect?.clientMeta ? { _meta: this.options.dialect.clientMeta } : {}) } }))
      if (initialized.protocolVersion !== 1) throw new Error('不支持的ACP版本')
      // 仅注入宿主创建的会话工具桥，模型与工作区配置不能覆盖此能力。
      clientBridge = await this.options.openClientBridge?.(input)
      toolBridge = await this.options.openToolBridge?.(input)
      const mcpServers: JsonValue[] = [...(toolBridge ? [AcpStdioMcpServerSchema.parse(toolBridge.config)] : []), ...(this.options.mcpServers ?? [])]
      for (const config of mcpServers) { if (config && typeof config === 'object' && !Array.isArray(config) && (config.type === 'http' || config.type === 'sse') && initialized.agentCapabilities?.mcpCapabilities?.[config.type] !== true) throw new Error(`CLI 未声明支持 MCP ${config.type}；请修改项目 MCP 配置`) }
      let createdRaw:JsonValue;
      try {createdRaw=await peer.request('session/new',{cwd:input.cwd,mcpServers});}
      catch(error){
        // 只对明确要求认证的API-Key CLI使用其已配置环境，不自动启动浏览器或猜测账号。
        if(!isKernelAuthenticationRequired(error))throw error;
        const methodId=configuredAcpAuthentication(initialized.authMethods,this.options.env??{});
        if(!methodId)throw new KernelAuthenticationRequiredError(this.id);
        try {await peer.request('authenticate',{methodId});createdRaw=await peer.request('session/new',{cwd:input.cwd,mcpServers});}
        catch(authError){if(isKernelAuthenticationRequired(authError))throw new KernelAuthenticationRequiredError(this.id);throw authError;}
      }
      const created=AcpNewSessionResultSchema.parse(createdRaw);
      if (failure) throw failure
      const handle = { kernelId: this.id, sessionId: input.sessionId, kernelSessionRef: randomUUID() }
      session = { stderr: () => stderrTail, clientBridge, toolBridge, handle, remoteId: created.sessionId, child, peer, exited, poisoned: false, seenHistory: new Set(), catalog: readSessionCatalog(created), metadata: JSON.parse(JSON.stringify(created)), catalogLoading: false }
      this.sessions.set(handle.kernelSessionRef, session)
      for(const early of earlyUpdates){if(early.method!=='session/update')continue;const notice=AcpNotificationSchema.safeParse(early.params);if(!notice.success||notice.data.sessionId!==created.sessionId)continue;const update=AcpSessionMetadataUpdateSchema.safeParse(notice.data.update);if(!update.success)continue;if(update.data.sessionUpdate==='config_option_update')session.metadata.configOptions=update.data.configOptions;else if(update.data.sessionUpdate==='current_mode_update'){const old=session.metadata.modes;session.metadata.modes={...(old&&typeof old==='object'&&!Array.isArray(old)?old:{}),currentModeId:update.data.currentModeId}}else session.metadata[update.data.sessionUpdate]=JSON.parse(JSON.stringify(update.data))}
      session.catalog=readSessionCatalog(session.metadata)
      this.options.sessionChanged?.(input.sessionId,structuredClone(session.metadata))
      // systemPrompt通过createPromptContext的显式前置文本传递，不伪称ACP有原生systemPrompt参数。
      if (input.systemPrompt) this.instructions.set(handle.kernelSessionRef, input.systemPrompt)
      return handle
    } catch (error) { peer.close(); terminateAcpProcess(child); await exited; await Promise.allSettled([toolBridge?.close(),clientBridge?.close()]); if (error instanceof KernelAuthenticationRequiredError) throw error; const secrets = Object.entries(this.options.env ?? {}).filter(([key]) => /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i.test(key)).map(([, value]) => value); throw new Error(acpPromptFailureMessage(error, secrets, stderrTail)) }
    finally { control?.signal.removeEventListener('abort', abortCreation); this.launches.delete(input.sessionId) }
  }
  private readonly instructions = new Map<string, string>()
  private session(handle: KernelSessionHandle): Session {
    KernelSessionHandleSchema.parse(handle); const session = this.sessions.get(handle.kernelSessionRef)
    if (!session || handle.kernelId !== this.id || session.handle.sessionId !== handle.sessionId) throw new Error('ACP 句柄归属无效')
    return session
  }
  async *prompt(handle: KernelSessionHandle, raw: KernelPromptInput, { signal }: { signal: AbortSignal }): AsyncIterable<KernelEvent> {
    const session = this.session(handle); const input = KernelPromptInputSchema.parse(raw)
    if (session.poisoned || session.run || session.catalogLoading) throw new Error('ACP 会话不可复用或正在运行')
    if (signal.aborted) throw new Error('ACP 请求已取消')
    const used = this.usedRuns.get(handle.kernelSessionRef) ?? new Set<string>()
    if (used.has(input.runId)) throw new Error('ACP runId已使用，不能重置事件序号')
    if (used.size >= 4096) throw new Error('ACP 会话已达到运行次数上限，请重新创建内核会话后继续')
    used.add(input.runId); this.usedRuns.set(handle.kernelSessionRef, used)
    const queue: KernelEvent[] = []; let wake: (() => void) | undefined; let done = false
    let queuedBytes = 0; let overflow = false; let cancelTimer: ReturnType<typeof setTimeout> | undefined
    const run: Run = { callbacks:new AbortController(), closed: false, cancelled: false, cancel: () => {}, mapper: new AcpEventMapper(input.runId, this.options.dialect), stop: new AbortController(), push: (event) => {
      if (event.t === 'message.final') session.seenHistory.add(event.message.id)
      queuedBytes += Buffer.byteLength(JSON.stringify(event)); queue.push(event); wake?.(); wake = undefined
      if(event.t==='error'&&!event.err.recoverable){session.poisoned=true;session.peer.close(Error(event.err.message));terminateAcpProcess(session.child)}
      if (!overflow && (queue.length > 1024 || queuedBytes > 16 * 1024 * 1024)) {
        overflow = true; session.poisoned = true; session.peer.close(new Error('ACP事件消费背压超限')); terminateAcpProcess(session.child)
      }
    } }
    session.run = run
    for (const raw of this.idleErrors.get(handle.kernelSessionRef) ?? []) run.push(run.mapper.error('acp_update_outside_prompt', raw, '运行外更新已隔离，不并入文本'))
    this.idleErrors.delete(handle.kernelSessionRef)
    const cancel = () => {
      if (run.cancelled || done) return
      run.cancelled = true; run.callbacks.abort();run.stop.abort(); void session.clientBridge?.close().catch(() => {}); void session.toolBridge?.close().catch(() => {}); queue.length = 0; queuedBytes = 0; session.poisoned = true; this.cancelApprovals(run)
      // 先发送ACP标准取消通知；宽限后仍未结束才强制回收，旧句柄始终失效。
      void session.peer.notify('session/cancel', { sessionId: session.remoteId }).catch(() => { run.stop.abort() })
      cancelTimer = setTimeout(() => { run.stop.abort(); session.peer.close(new Error('ACP 请求已取消')); terminateAcpProcess(session.child) }, this.options.cancelGraceMs ?? 50)
    }
    run.cancel = cancel
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted) cancel()
    const history = input.history.filter((message) => !session.seenHistory.has(message.id))
    const text = createPromptContext({ ...input, history, summary: history.length || !session.seenHistory.size ? input.summary : undefined }, false); const instruction = this.instructions.get(handle.kernelSessionRef)
    const finish = (async () => {
      try {
        const result = await session.peer.request('session/prompt', { sessionId: session.remoteId, prompt: [{ type: 'text', text: instruction ? `${instruction}\n\n${text}` : text }] }, run.stop.signal, () => { run.closed = true;run.callbacks.abort() },this.options.promptTimeoutMs??null)
        if (run.cancelled || run.stop.signal.aborted) throw new Error('ACP请求已取消')
        for (const event of run.mapper.finish(result)) {
          if (event.t === 'error' && event.err.code === 'invalid_acp_prompt_result') session.poisoned = true
          run.push(event)
        }
        if (!session.poisoned) for (const message of input.history) session.seenHistory.add(message.id)
        if (session.poisoned) { session.peer.close(new Error('ACP结果无效')); terminateAcpProcess(session.child) }
      } catch (error) {
        session.poisoned = true
        if(!run.cancelled&&!signal.aborted)for(const event of run.mapper.flush())run.push(event)
        const secrets=Object.entries(this.options.env??{}).filter(([key])=>/(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i.test(key)).map(([,value])=>value)
        const message=acpPromptFailureMessage(error,secrets,session.stderr())
        run.push(run.mapper.error('acp_prompt_failure', { message },message)); run.push(run.mapper.emit({ t: 'done', reason: run.cancelled || signal.aborted || run.stop.signal.aborted ? 'cancelled' : 'error' }))
        session.peer.close(error instanceof Error ? error : new Error(String(error))); terminateAcpProcess(session.child)
      } finally { run.callbacks.abort();run.stop.abort(); await session.clientBridge?.close().catch(() => {}); clearTimeout(cancelTimer); done = true; run.closed = true; this.cancelApprovals(run); wake?.() }
    })()
    session.finished = finish
    try {
      while (!done || queue.length) {
        if (!queue.length) { await new Promise<void>((resolve) => { wake = resolve }); continue }
        const next = queue.shift()!; queuedBytes -= Buffer.byteLength(JSON.stringify(next));
        if (run.cancelled && next.t !== 'error' && !(next.t === 'done' && next.reason === 'cancelled')) continue
        yield next
      }
    } finally {
      if (!done) cancel()
      await finish; signal.removeEventListener('abort', cancel); if (session.run === run) session.run = undefined; session.finished = undefined
      if (session.poisoned) await session.exited
    }
  }
  private cancelApprovals(run: Run): void { for (const [id, pending] of this.approvals) if (pending.run === run) { clearTimeout(pending.timer); pending.resolve(pending.reply(null)); this.approvals.delete(id) } }
  async respondPermission(handle: KernelSessionHandle, requestId: string, raw: KernelPermissionResponse): Promise<void> {
    const session = this.session(handle); const response = KernelPermissionResponseSchema.parse(raw); const pending = this.approvals.get(requestId)
    if (!pending || pending.run.closed || pending.handle !== handle.kernelSessionRef || pending.run !== session.run) throw new Error('审批不属于当前会话运行')
    const option = [...pending.options.entries()].find(([id]) => acpEntityId(id) === response.actionId)
    if (!option || option[1] !== response.behavior) throw new Error('审批选项或行为不匹配')
    const result = pending.reply(option[0])
    clearTimeout(pending.timer); this.approvals.delete(requestId); pending.resolve(result)
  }
  sessionMetadata(handle: KernelSessionHandle): Record<string, JsonValue> { return structuredClone(this.session(handle).metadata) }
  async modelCatalog(handle: KernelSessionHandle): Promise<AcpModelCatalog> {
    const session = this.session(handle)
    if (session.run || session.poisoned || session.catalogLoading) throw new Error('不能在运行中或已失效会话探测模型')
    session.catalogLoading = true
    try {
      const discovery = this.options.dialect?.catalog
      if (discovery) {try{session.catalog = discovery.read(await session.peer.request(discovery.method, discovery.sessionless ? {} : { sessionId: session.remoteId }))}catch(error){if(!session.catalog.models.length)throw error}}
      if(session.catalog.models.length&&!primaryKernelControl(sessionControls(session.metadata),'model'))session.metadata.models={availableModels:session.catalog.models.map(m=>({modelId:m.id,name:m.name})),currentModelId:session.catalog.currentModelId}
      return AcpModelCatalogSchema.parse(session.catalog)
    } finally { session.catalogLoading = false }
  }
  async configureSession(handle: KernelSessionHandle, selection: KernelSessionSelection, signal?: AbortSignal): Promise<void> {
    const session = this.session(handle)
    if (session.run || session.poisoned || session.catalogLoading) throw new Error('运行中不能修改内核设置')
    const apply=async(id:string,value:import('@proma/shared').KernelConfigValue,category?:'model'|'mode'):Promise<void>=>{
      const controls=sessionControls(session.metadata)
      const control=category?primaryKernelControl(controls,category):controls.find(c=>c.id===id)
      if(!control)throw new Error(`内核未报告此配置选项：${id}`)
      validateControlValue(control,value)
      const method=control.method==='config'?'session/set_config_option':control.method==='model'?'session/set_model':'session/set_mode'
      const params:JsonValue=control.method==='config'?{sessionId:session.remoteId,configId:control.id,...(control.type==='boolean'?{type:'boolean'}:{}),value}:control.method==='model'?{sessionId:session.remoteId,modelId:value}:{sessionId:session.remoteId,modeId:value}
      const result=await session.peer.request(method,params,signal)
      if(result&&typeof result==='object'&&!Array.isArray(result)&&Array.isArray(result.configOptions))session.metadata.configOptions=result.configOptions
      else if(control.method==='config'&&Array.isArray(session.metadata.configOptions))session.metadata.configOptions=session.metadata.configOptions.map(o=>o&&typeof o==='object'&&!Array.isArray(o)&&o.id===control.id?{...o,currentValue:value}:o)
      else {const key=control.method==='model'?'models':'modes',old=session.metadata[key];session.metadata[key]={...(old&&typeof old==='object'&&!Array.isArray(old)?old:{}),[control.method==='model'?'currentModelId':'currentModeId']:value}}
      session.catalog=readSessionCatalog(session.metadata)
      this.options.sessionChanged?.(handle.sessionId,structuredClone(session.metadata))
    }
    // 供应商会重新发布模型目录，必须先应用，再验证该供应商下的模型。
    const dependent=new Set<string>()
    for(const [id,value]of Object.entries(selection.configValues??{})){const controls=sessionControls(session.metadata),control=controls.find(c=>c.id===id);if(control&&isKernelModelDependency(control,controls)){await apply(id,value);dependent.add(id)}}
    if(selection.modelId){
      const control=primaryKernelControl(sessionControls(session.metadata),'model')
      if(control)await apply(control.id,selection.modelId,'model')
      else if(session.catalog.models.some(m=>m.id===selection.modelId)){await session.peer.request('session/set_model',{sessionId:session.remoteId,modelId:selection.modelId},signal);session.metadata.models={availableModels:session.catalog.models.map(m=>({modelId:m.id,name:m.name})),currentModelId:selection.modelId};session.catalog.currentModelId=selection.modelId}
      else throw new Error('内核未报告此模型')
    }
    if(selection.modeId)await apply('mode',selection.modeId,'mode')
    for(const [id,value]of Object.entries(selection.configValues??{})){
      if(dependent.has(id))continue
      const controls=sessionControls(session.metadata),c=controls.find(c=>c.id===id)
      if(c&&kernelControlSelectionField(c,controls))throw new Error('模型与模式必须使用专用字段')
      await apply(id,value)
    }
  }

  async cancel(handle: KernelSessionHandle): Promise<void> { const session = this.session(handle); if (!session.run) return; session.run.cancel(); await session.finished; if (session.poisoned) await session.exited }
  async close(handle: KernelSessionHandle): Promise<void> {
    const session = this.session(handle)
    try { await this.cancel(handle) }
    finally {
      session.peer.close(); terminateAcpProcess(session.child); await session.exited
      await Promise.allSettled([session.toolBridge?.close(), session.clientBridge?.close()])
      this.sessions.delete(handle.kernelSessionRef); this.instructions.delete(handle.kernelSessionRef); this.idleErrors.delete(handle.kernelSessionRef); this.usedRuns.delete(handle.kernelSessionRef)
    }
  }
}
