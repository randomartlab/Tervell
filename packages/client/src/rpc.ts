import { ApiRequestSchema, parseApiResponse } from '@proma/protocol'
import type { ApiMethod, ApiParams, ApiResult } from '@proma/protocol'
import { z } from 'zod'

const Reply = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), requestId: z.string(), data: z.unknown() }),
  z.object({ ok: z.literal(false), requestId: z.string().optional(), error: z.object({ code: z.string(), message: z.string(), data: z.unknown().optional() }) }),
])

export class ApiError extends Error {
  constructor(readonly code: string, message: string, readonly status: number, readonly data?: unknown) { super(message) }
}

export class CoreRpc {
  private token = ''
  readonly base: string
  constructor(base: string, private readonly fetcher: (input: string, init?: RequestInit) => Promise<Response> = (input, init) => globalThis.fetch(input, init)) {
    const url = new URL(base)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new Error('服务地址必须为 HTTPS 或本机回环地址，且不含路径或凭据')
    this.base = url.origin
  }
  useToken(token: string): void { this.token = token.trim() }
  headers(): Record<string, string> { return { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) } }
  async localSession(signal?: AbortSignal): Promise<void> {
    const response = await this.fetcher(`${this.base}/local-session`, { method: 'POST', credentials: 'same-origin', headers: this.headers(), body: '{}', signal: deadline(signal), redirect: 'error' })
    if (!response.ok) throw new ApiError('AUTH_REQUIRED', '请使用宿主签发的 Web 设备凭据连接', response.status)
  }
  async call<Method extends ApiMethod>(method: Method, params: ApiParams<Method>, signal?: AbortSignal): Promise<ApiResult<Method>> {
    const requestId = crypto.randomUUID()
    const request = ApiRequestSchema.parse({ method, params, requestId, clientKind: 'web' })
    const response = await this.fetcher(`${this.base}/rpc`, { method: 'POST', credentials: 'same-origin', headers: this.headers(), body: JSON.stringify(request), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000), redirect: 'error' })
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 2 * 1024 * 1024) throw new ApiError('RESPONSE_TOO_LARGE', '服务响应超过限制', 413)
    const reply = Reply.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
    if (reply.requestId && reply.requestId !== requestId) throw new ApiError('REQUEST_MISMATCH', '服务响应与请求不匹配', 502)
    if (!reply.ok) throw new ApiError(reply.error.code, reply.error.message, response.status, reply.error.data)
    if (!response.ok) throw new ApiError('HTTP_ERROR', '请求未成功', response.status)
    return parseApiResponse(method, 'web', reply.data)
  }
  async ticket(signal?: AbortSignal): Promise<string> {
    const response = await this.fetcher(`${this.base}/ws-ticket`, { method: 'POST', credentials: 'same-origin', headers: this.headers(), body: '{}', signal: deadline(signal), redirect: 'error' })
    if (!response.ok) throw new ApiError('WS_AUTH_FAILED', '无法建立事件连接，请重新连接', response.status)
    return z.object({ ticket: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).parse(await response.json()).ticket
  }
}
function deadline(signal?: AbortSignal): AbortSignal { return signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) }
