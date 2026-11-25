import { createServer } from 'node:net'
import type { Socket, Server } from 'node:net'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { AcpStdioMcpServer, ToolContext, ToolApprovalDecision } from '@proma/protocol'
import { ToolContextSchema, AcpStdioMcpServerSchema } from '@proma/protocol'
import { z } from 'zod'
import { isAbsolute } from 'node:path'
import { ToolCatalog } from './catalog.ts'
import type { ToolAuthorization } from './catalog.ts'

const Request = z.discriminatedUnion('action', [
  z.strictObject({ token: z.string().length(64), action: z.literal('list') }),
  z.strictObject({ token: z.string().length(64), action: z.literal('lease') }),
  z.strictObject({ token: z.string().length(64), action: z.literal('call'), name: z.string().max(100), input: z.json() }),
])
export interface SessionToolServerOptions {
  context: ToolContext; catalog: ToolCatalog
  authorize: (request: ToolAuthorization) => Promise<boolean | ToolApprovalDecision>
  assertContext?: (context: ToolContext) => void
  runtime: { command: string; args: string[] }
}
/** 每个产品会话独立 loopback RPC；stdio 子进程只带短期代理凭据，不接受模型伪造上下文。 */
export class SessionToolServer {
  private readonly server: Server
  private closing?: Promise<void>
  private readonly token = randomBytes(32).toString('hex')
  private readonly sockets = new Set<Socket>()
  private readonly stops = new Set<AbortController>()
  private readonly context: ToolContext
  private readonly runtime: { command: string; args: string[] }
  private port = 0
  private closed = false
  private constructor(private readonly options: SessionToolServerOptions) {
    this.context = ToolContextSchema.parse(options.context)
    options.catalog.freeze()
    this.runtime = structuredClone(options.runtime)
    if (!isAbsolute(options.runtime.command)) throw new Error('MCP runtime 必须为已解析的绝对路径')
    this.server = createServer((socket) => this.accept(socket))
    this.server.maxConnections = 8
  }
  static async open(options: SessionToolServerOptions): Promise<SessionToolServer> {
    const host = new SessionToolServer(options)
    await new Promise<void>((resolve, reject) => {
      host.server.once('error', reject)
      host.server.listen(0, '127.0.0.1', () => { host.server.removeListener('error', reject); resolve() })
    })
    const address = host.server.address()
    if (!address || typeof address === 'string') { await host.close(); throw new Error('无法创建会话工具端点') }
    host.port = address.port
    return host
  }
  config(): AcpStdioMcpServer {
    if (this.closed) throw new Error('会话工具服务已关闭')
    return AcpStdioMcpServerSchema.parse({ name: 'proma', command: this.runtime.command, args: [...this.runtime.args], env: [
      { name: 'PROMA_TOOL_PORT', value: String(this.port) }, { name: 'PROMA_TOOL_TOKEN', value: this.token },
    ] })
  }
  private accept(socket: Socket): void {
    if (this.closed) { socket.destroy(); return }
    this.sockets.add(socket)
    const stop = new AbortController(); this.stops.add(stop)
    let buffer = Buffer.alloc(0), started = false
    socket.setTimeout(65000, () => socket.destroy())
    socket.on('error', () => {})
    socket.once('close', () => { stop.abort(); this.stops.delete(stop); this.sockets.delete(socket) })
    socket.on('data', (chunk: Buffer) => {
      if (started || buffer.length + chunk.length > 300 * 1024) { socket.destroy(); return }
      buffer = Buffer.concat([buffer, chunk])
      const end = buffer.indexOf(10)
      if (end < 0) return
      started = true
      void (async () => {
        try {
          if (end !== buffer.length - 1) throw new Error('请求帧无效')
          const request = Request.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, end))))
          if (!timingSafeEqual(Buffer.from(request.token), Buffer.from(this.token))) throw new Error('未授权的工具连接')
          this.options.assertContext?.(structuredClone(this.context))
          if (request.action === 'lease') { socket.setTimeout(0); socket.write(JSON.stringify({ ok: true, data: null }) + '\n'); return }
          const data = request.action === 'list' ? this.options.catalog.snapshot() : await this.options.catalog.execute(request.name, request.input, { context: this.context, signal: stop.signal, assertContext: () => this.options.assertContext?.(structuredClone(this.context)) }, this.options.authorize)
          if (!stop.signal.aborted && !this.closed) socket.end(JSON.stringify({ ok: true, data }) + '\n')
        } catch { if (!socket.destroyed) socket.end(JSON.stringify({ ok: false, error: '工具请求被拒绝或执行失败' }) + '\n') }
      })()
    })
  }
  async close(): Promise<void> {
    if (this.closing) return this.closing
    this.closed = true
    for (const stop of this.stops) stop.abort()
    for (const socket of this.sockets) socket.destroy()
    this.closing = this.server.listening ? new Promise<void>((resolve) => this.server.close(() => resolve())) : Promise.resolve()
    return this.closing
  }
}
