import { createServer } from 'node:http'
import {createServer as createSecureServer} from 'node:https'
import type { IncomingMessage, ServerResponse, Server } from 'node:http'
import { createHash, timingSafeEqual } from 'node:crypto'
import { RemotePacketSchema } from '@proma/protocol'
import type { RemoteHost, RemoteState } from './host.ts'

function equal(left: string, right: string): boolean { return timingSafeEqual(createHash('sha256').update(left).digest(), createHash('sha256').update(right).digest()) }
const hostBusy=new WeakMap<RemoteHost,Set<string>>()
export interface DirectServerOptions {host?:string;port?:number;tls?:{key:string;cert:string}}
export class DirectRemoteServer {
  private readonly server: Server
  private readonly busy:Set<string>
  private inFlight = 0
  private closed = false
  private closing?: Promise<void>
  private portNumber = 0
  constructor(private readonly host: RemoteHost, private readonly state: RemoteState, private readonly enabled: () => boolean,private readonly options:DirectServerOptions={}) {
    this.busy=hostBusy.get(host)??new Set<string>();hostBusy.set(host,this.busy)
    const handler=(request:IncomingMessage,response:ServerResponse)=>{void this.handle(request,response)}
    this.server = options.tls?createSecureServer({...options.tls,minVersion:'TLSv1.2'},handler):createServer(handler)
    this.server.headersTimeout = 5000; this.server.requestTimeout = 20000; this.server.keepAliveTimeout = 1000
    this.server.maxConnections = 16
    this.server.on('connection', socket => { socket.setTimeout(20000, () => socket.destroy()) })
  }
  async listen(): Promise<void> {
    await new Promise<void>((resolve, reject) => { this.server.once('error', reject); this.server.listen(this.options.port??0, this.options.host??'127.0.0.1', () => { this.server.removeListener('error', reject); resolve() }) })
    const address = this.server.address()
    if (!address || typeof address === 'string') throw new Error('无法建立手机连接')
    this.portNumber = address.port
  }
  get port(): number { return this.portNumber }
  private json(response: ServerResponse, code: number, body: unknown): void {
    const text = JSON.stringify(body)
    response.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text), 'Cache-Control': 'no-store', 'Connection': 'close', 'X-Content-Type-Options': 'nosniff' }); response.end(text)
  }
  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (this.closed || !this.enabled()) { this.json(response, 503, { error: '暂时无法连接电脑' }); request.resume(); return }
    if (request.method !== 'POST' || request.url !== '/v2/connect' || request.headers.origin || !this.options.tls&&!['127.0.0.1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '')) { this.json(response, 404, { error: '连接不可用' }); request.resume(); return }
    if (this.inFlight >= 8) { this.json(response, 429, { error: '请稍候重试' }); request.resume(); return }
    this.inFlight++
    let identity: string | undefined
    try {
      if (!request.headers['content-type']?.startsWith('application/json')) throw new Error('invalid')
      const chunks: Buffer[] = []; let size = 0
      for await (const chunk of request) { const bytes = Buffer.from(chunk); size += bytes.length; if (size > 1000000) throw new Error('limit'); chunks.push(bytes) }
      const raw: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!raw || typeof raw !== 'object' || !('room' in raw) || typeof raw.room !== 'string' || !('packet' in raw)) throw new Error('invalid')
      const room = raw.room
      const device = this.state.devices.find(candidate => equal(candidate.pairing.room, room))
      const token = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.authorization ?? '')?.[1] ?? ''
      if (!device || ![2,3,4].includes(device.pairing.v) || device.revoked || device.pairing.expiresAt <= Date.now() || (!equal(token, device.pairing.token) && !(device.bootstrap && equal(token, device.bootstrap.token)))) { this.json(response, 403, { error: '设备授权已失效，请重新配对' }); return }
      identity = device.pairing.deviceId
      if (this.busy.has(identity)) { identity = undefined; this.json(response, 409, { error: '请等待上次请求完成' }); return }
      this.busy.add(identity)
      const packet = RemotePacketSchema.parse(raw.packet)
      const reply = await this.host.receive(device, packet)
      if (!this.enabled() || device.revoked) { this.json(response, 403, { error: '设备授权已失效，请重新配对' }); return }
      this.json(response, 200, { packet: reply })
    } catch { if (!response.headersSent) this.json(response, 400, { error: '连接未完成，请重试' }) }
    finally { this.inFlight--; if (identity) this.busy.delete(identity) }
  }
  close(): Promise<void> {
    if (this.closing) return this.closing
    this.closed = true
    if (!this.server.listening) return Promise.resolve()
    this.closing = new Promise(resolve => { this.server.close(() => resolve()); this.server.closeAllConnections() })
    return this.closing
  }
}
