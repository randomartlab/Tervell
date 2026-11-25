import{acpPromptFailureMessage}from'./errors';
import{RpcRemoteError}from'./rpc';
import { AcpSessionMetadataUpdateSchema, AcpTraceSchema, AcpNotificationSchema, AcpPermissionSchema } from '@proma/protocol'
import type { JsonValue, JsonRpcMessage, KernelEvent } from '@proma/protocol'
import { AcpEventMapper, acpEntityId, acpToolKind } from './mapper.ts'
import type { AcpDialect, DialectInteraction } from './dialects/types.ts'
import { record } from './dialects/types.ts'

function canonical(value: unknown): unknown { return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value }
interface Request { method: string; params?: JsonValue; vendor?: DialectInteraction }
/** 离线回放仅消费已录制响应；缺回复、错误归属、非法选项不能靠脚本自动补成功。 */
export function replayAcpTrace(raw: unknown, dialect?: AcpDialect): KernelEvent[][] {
  const trace = AcpTraceSchema.parse(raw)
  if (dialect && (trace.dialectId ?? trace.kernelId) !== dialect.id) throw new Error('trace方言与kernelId不匹配')
  const pending = { client: new Map<string, Request>(), agent: new Map<string, Request>() }
  const runs: KernelEvent[][] = []; let active: { id: string; sessionId: string; mapper: AcpEventMapper; events: KernelEvent[] } | undefined
  const sessions = new Set<string>(); let initialized = false
  const key = (id: unknown) => JSON.stringify(id)
  const mapNotification = (message: Extract<JsonRpcMessage, { method: string }>) => {
    if (!active) {
      const metadata = message.method === 'session/update' ? AcpNotificationSchema.safeParse(message.params) : undefined
      if (metadata?.success && sessions.has(metadata.data.sessionId) && AcpSessionMetadataUpdateSchema.safeParse(metadata.data.update).success) return
      throw new Error('trace存在prompt外且无法归属的agent通知')
    }
    if (message.method === 'session/update') {
      const notification = AcpNotificationSchema.parse(message.params)
      if (notification.sessionId !== active.sessionId) throw new Error('trace通知不属于活动session')
      if (!AcpSessionMetadataUpdateSchema.safeParse(notification.update).success) active.events.push(...active.mapper.update(notification.update))
    } else active.events.push(...active.mapper.extension(message.method, message.params))
  }
  for (const frame of trace.frames) {
    const message = frame.message; const side = frame.direction; const opposite = side === 'client' ? 'agent' : 'client'
    if ('method' in message) {
      if (message.id === undefined) { if (side === 'agent') mapNotification(message); continue }
      const id = key(message.id)
      if (pending[side].has(id)) throw new Error('trace请求ID重复')
      if (side === 'client' && message.method !== 'initialize' && !initialized) throw new Error('trace在initialize完成前调用会话方法')
      if (side === 'client' && message.method === 'initialize' && (initialized || [...pending.client.values()].some((item) => item.method === 'initialize'))) throw new Error('trace重复initialize')
      const request: Request = { method: message.method, params: message.params }
      if (side === 'client' && message.method === 'session/prompt') {
        if (!initialized || active) throw new Error('trace未初始化或prompt并发')
        const sessionId = record(message.params).sessionId
        if (typeof sessionId !== 'string' || !sessions.has(sessionId)) throw new Error('trace prompt缺少已创建session')
        active = { id, sessionId, mapper: new AcpEventMapper(`replay_${runs.length + 1}`, dialect), events: [] }
      }
      if (side === 'agent' && active) {
        const vendor = dialect?.interaction?.(message.method, message.params); request.vendor = vendor
        if (vendor && record(message.params).sessionId !== undefined && record(message.params).sessionId !== active.sessionId) throw new Error('trace厂商请求session不匹配')
        if (message.method === 'session/request_permission' || vendor) {
          const permission = AcpPermissionSchema.parse(vendor ? { sessionId: active.sessionId, toolCall: vendor.toolCall, options: vendor.options } : message.params)
          if (permission.sessionId !== active.sessionId) throw new Error('trace权限session不匹配')
          if (vendor?.plan) active.events.push(active.mapper.emit({ t: 'plan.update', steps: [{ id: 'cursor_plan', title: vendor.plan, status: 'pending' }] }))
          active.events.push(active.mapper.emit({ t: 'permission.request', req: { requestId: acpEntityId(id), kind: acpToolKind(permission.toolCall.kind), tool: permission.toolCall.title ?? permission.toolCall.toolCallId, summary: permission.toolCall.title ?? 'ACP工具审批', input: { rawInput: permission.toolCall.rawInput ?? null }, actions: permission.options.map((option) => ({ id: acpEntityId(option.optionId), label: option.name, behavior: option.kind.startsWith('allow') ? 'allow' : 'deny', ...(option.kind === 'allow_always' ? { variant: 'always' } : {}) })) } }))
        } else active.events.push(active.mapper.error('unsupported_acp_request', { method: message.method, params: message.params ?? null }))
      }
      pending[side].set(id, request); continue
    }
    if (message.id === null) throw new Error('trace存在无归属RPC错误')
    const id = key(message.id); const request = pending[opposite].get(id)
    if (!request) throw new Error('trace响应找不到原始请求')
    pending[opposite].delete(id)
    if (opposite === 'client') {
      if (request.method === 'initialize') {
        if ('error' in message || record(message.result).protocolVersion !== 1) throw new Error('trace初始化失败')
        initialized = true
      }
      if (request.method === 'session/new') {
        const sessionId = 'result' in message ? record(message.result).sessionId : undefined
        if (!initialized || typeof sessionId !== 'string') throw new Error('trace session/new失败')
        sessions.add(sessionId)
      }
      if (request.method === 'session/prompt') {
        if (!active || active.id !== id) throw new Error('trace prompt响应归属错误')
        if (pending.agent.size) throw new Error('trace prompt结束时仍有未答反向请求')
        if ('error' in message) active.events.push(...active.mapper.flush(),active.mapper.error('acp_prompt_failure', message.error,acpPromptFailureMessage(new RpcRemoteError(message.error.code,message.error.message))), active.mapper.emit({ t: 'done', reason: 'error' }))
        else active.events.push(...active.mapper.finish(message.result))
        runs.push(active.events); active = undefined
      }
    } else if ('result' in message && request.method === 'session/request_permission') {
      const permission = AcpPermissionSchema.parse(request.params); const outcome = record(record(message.result).outcome)
      if (outcome.outcome !== 'cancelled' && (outcome.outcome !== 'selected' || !permission.options.some((option) => option.optionId === outcome.optionId))) throw new Error('trace选择了未提供的权限选项')
    } else if ('result' in message && request.vendor) {
      const result = JSON.stringify(canonical(message.result))
      const choices = [request.vendor.reply(null), ...request.vendor.options.map((option) => request.vendor!.reply(option.optionId))]
      if (!choices.some((choice) => JSON.stringify(canonical(choice)) === result)) throw new Error('trace厂商答复不属于任何显式选项')
    }
  }
  if (active || pending.client.size || pending.agent.size) throw new Error('trace请求/响应不完整')
  if (!runs.length) throw new Error('trace没有完整prompt')
  return runs
}
