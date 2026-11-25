import { safeStorage, shell } from 'electron'
import { hostname } from 'node:os'
import { join } from 'node:path'
import { randomUUID, createHash, sign } from 'node:crypto'
import WebSocket from 'ws'
import { RANDOM_MARKET } from '@proma/shared/config'
import type { RemoteStatus } from '@proma/shared'
import type { RemoteHost, RemoteState } from '@proma/core/remote/host'
import { createHostedIdentity, verifyHostedIdentity, hostedProof, HostedError } from '@proma/core/remote/hosted'
import type { HostedIdentity, HostedLease, DeviceStart } from '@proma/core/remote/hosted'
import { RemotePacketSchema } from '@proma/protocol'
import { getConfigDir } from './config-paths'
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file'

type HostedStatus = NonNullable<RemoteStatus['hosted']>
interface StoredHosted { identity: HostedIdentity; approved?: boolean; pending?: { requestId: string; userCode: string; expiresAt: number; verificationUrl: string } }
/** 服务地址是公开常量，授权私钥只存在主进程的系统加密存储中。 */
export class HostedRemoteService {
  private record?: StoredHosted
  private status: HostedStatus = { phase: 'idle' }
  private socket?: WebSocket
  private controller?: AbortController
  private timer?: ReturnType<typeof setTimeout>
  private renewTimer?: ReturnType<typeof setTimeout>
  private readyTimer?: ReturnType<typeof setTimeout>
  private host?: RemoteHost
  private state?: RemoteState
  private enabled = false
  private failures = 0
  private routes = ''
  private routesAck = ''
  private supportsRoutesAck = false
  private authenticated = false
  private busy = new Set<string>()
  private generation = 0
  private file() { return join(getConfigDir(), 'random-connect-private.json') }
  snapshot(): HostedStatus { return { ...this.status } }
  private load(hostId: string): StoredHosted {
    if (this.record) return this.record
    const saved = readJsonFileSafe<{ cipher: string }>(this.file())
    if (saved) {
      const value = JSON.parse(safeStorage.decryptString(Buffer.from(saved.cipher, 'base64'))) as StoredHosted
      if (!value.identity || value.identity.hostId !== hostId || !verifyHostedIdentity(value.identity)) throw Error('电脑连接身份无效，请重置该连接授权')
      return this.record = value
    }
    this.record = { identity: createHostedIdentity(hostId) }; this.save(); return this.record
  }
  private save() {
    if (!this.record || !safeStorage.isEncryptionAvailable()) throw Error('系统安全存储不可用，不能保存电脑连接身份')
    writeJsonFileAtomic(this.file(), { version: 1, cipher: safeStorage.encryptString(JSON.stringify(this.record)).toString('base64') })
  }
  start(host: RemoteHost, state: RemoteState): void {
    this.stop(); this.host = host; this.state = state; this.enabled = true
    try { this.load(state.hostId); this.status = { phase: 'starting' }; void this.connect(this.generation) } catch { this.status = { phase: 'error', error: '无法读取电脑连接身份，请检查系统安全存储' } }
  }
  stop(): void {
    this.enabled = false; this.generation++; this.controller?.abort(); clearTimeout(this.timer); clearTimeout(this.renewTimer); clearTimeout(this.readyTimer)
    const old = this.socket; this.socket = undefined; old?.close(); this.status = { phase: 'idle' }; this.routes = ''; this.routesAck=''; this.supportsRoutesAck=false; this.authenticated=false; this.busy.clear()
  }
  retry(): void {
    if (!this.enabled || !this.host || !this.state) throw Error('请先开启手机连接')
    this.start(this.host,this.state)
  }
  async waitForRoutes(): Promise<void> {
    this.syncRoutes()
    const generation=this.generation
    for(let i=0;i<80;i++){
      if(!this.enabled||generation!==this.generation||this.socket?.readyState!==WebSocket.OPEN)throw Error('公网连接正在恢复，请就绪后重新生成配对码')
      const id=createHash('sha256').update(this.routes).digest('hex')
      if(!this.supportsRoutesAck||this.routesAck===id)return
      await new Promise(resolve=>setTimeout(resolve,100))
    }
    throw Error('服务尚未确认手机通路，请点击重新连接后再生成配对码')
  }
  async openAuthorization(): Promise<void> {
    const url = this.record?.pending?.verificationUrl
    if (!url || !this.record?.pending || this.record.pending.expiresAt <= Date.now()) throw Error('正在准备电脑确认，请稍后重试')
    const parsed = new URL(url)
    if (parsed.origin !== RANDOM_MARKET.origin || parsed.pathname !== '/connect/authorize') throw Error('连接确认地址无效')
    await shell.openExternal(parsed.href)
  }
  reauthorize(): void {
    if (!this.record || !this.host || !this.state || !this.enabled) throw Error('请先开启电脑连接')
    this.record.approved = false; this.record.pending = undefined; this.save()
    this.start(this.host, this.state)
  }
  private schedule(generation: number, delay = 3000) {
    clearTimeout(this.timer); if (!this.enabled || generation !== this.generation) return
    this.timer = setTimeout(() => void this.connect(generation), delay)
  }
  private async connect(generation: number): Promise<void> {
    if (!this.enabled || generation !== this.generation || !this.record) return
    const record = this.record; this.controller?.abort(); const abort = new AbortController(); this.controller = abort
    try {
      let lease: HostedLease
      if (record.approved) lease = await hostedProof<HostedLease>(RANDOM_MARKET.connect, record.identity, 'lease', { hostId: record.identity.hostId }, abort.signal)
      else {
        let result: DeviceStart
        if (record.pending && record.pending.expiresAt > Date.now()) result = await hostedProof<DeviceStart>(RANDOM_MARKET.connect, record.identity, 'poll', { requestId: record.pending.requestId }, abort.signal)
        else result = await hostedProof<DeviceStart>(RANDOM_MARKET.connect, record.identity, 'start', { hostId: record.identity.hostId, name: hostname().slice(0, 100), platform: process.platform + '-' + process.arch, requestId: randomUUID() }, abort.signal)
        if (!this.enabled || generation !== this.generation) return
        if (result.state === 'pending') {
          if (result.requestId) {
            const check = new URL(result.verificationUrl ?? '')
            if (check.origin !== RANDOM_MARKET.origin || check.pathname !== '/connect/authorize' || !/^[A-F0-9]{12}$/.test(result.userCode ?? '') || !result.expiresAt) throw Error('设备确认响应无效')
            record.pending = { requestId: result.requestId, userCode: result.userCode!, expiresAt: result.expiresAt, verificationUrl: check.href }; this.save()
          }
          this.status = { phase: 'approval', userCode: record.pending?.userCode, approvalExpiresAt: record.pending?.expiresAt }; this.schedule(generation); return
        }
        if (!result.lease) throw Error('设备连接凭据缺失')
        lease = result.lease; record.approved = true; record.pending = undefined; this.save()
      }
      if (!this.enabled || generation !== this.generation) return
      this.validateLease(lease); this.status = { phase: 'connecting' }
      const socket = new WebSocket(new URL('host/ws', RANDOM_MARKET.connect).href.replace(/^https:/, 'wss:'), { handshakeTimeout: 15000, perMessageDeflate: false, maxPayload: 1050000 }); this.socket = socket
      const stale = () => !this.enabled || generation !== this.generation || this.socket !== socket
      this.readyTimer=setTimeout(()=>{if(!stale()){this.status={phase:'reconnecting',error:'服务未完成电脑通信校验，正在自动恢复'};socket.terminate()}},20000)
      socket.on('message', raw => {
        if (stale()) return
        try {
          const message = JSON.parse(raw.toString()) as { type: string; id?: string; nonce?: string; deviceId?: string; hostId?: string; packet?: unknown; routesAck?:boolean; syncId?:string }
          if (message.type === 'hello' && /^[a-f0-9]{64}$/.test(message.nonce ?? '')) {
            const text = `tervell-connect-ws-v1\n${record.identity.hostId}\n${message.nonce}\n${lease.accessToken}`
            socket.send(JSON.stringify({ type: 'auth', token: lease.accessToken, signature: sign(null, Buffer.from(text), record.identity.privateKey).toString('base64url') }))
          } else if (message.type === 'ready') { this.failures = 0; this.authenticated=true; this.supportsRoutesAck=message.routesAck===true; this.status = { phase: this.supportsRoutesAck?'connecting':'online' }; this.routes = ''; this.routesAck=''; this.syncRoutes(); this.scheduleRenew(generation, lease); if(!this.supportsRoutesAck)clearTimeout(this.readyTimer) }
          else if(message.type==='routes-ready'&&message.syncId===createHash('sha256').update(this.routes).digest('hex')){this.routesAck=message.syncId;this.status={phase:'online'};clearTimeout(this.readyTimer)}
          else if (message.type === 'request') void this.handleRequest(message, generation)
        } catch { socket.close(1008, 'invalid message') }
      })
      socket.once('error', () => { if (!stale()) socket.terminate() })
      socket.once('close', (_code, reason) => {
        if (stale()) return
        this.socket = undefined; this.authenticated=false; clearTimeout(this.renewTimer); clearTimeout(this.readyTimer)
        if (reason.toString() === 'device revoked') { this.status = { phase: 'revoked', error: '这台电脑已撤销，请在集市管理页检查' }; return }
        if(this.status.phase === 'revoked')return
        this.status = { phase: 'reconnecting', error: '连接中断，正在自动恢复' }; this.schedule(generation, Math.min(30000, 1000 * 2 ** Math.min(++this.failures, 5)))
      })
    } catch (error) {
      if (!this.enabled || generation !== this.generation || abort.signal.aborted) return
      if (error instanceof HostedError && error.status === 403) { this.status = { phase: 'revoked', error: '电脑授权已失效，请在集市管理页检查或重新登记' }; return }
      if (error instanceof HostedError && error.status === 410) { record.pending = undefined; this.save() }
      this.status = { phase: 'reconnecting', error: '暂时无法连接 Random创造集市，正在自动重试' }; this.schedule(generation, Math.min(30000, 1000 * 2 ** Math.min(++this.failures, 5)))
    }
  }
  private validateLease(lease: HostedLease) {
    if (lease.hostId !== this.record?.identity.hostId || !/^[a-f0-9]{64}$/.test(lease.accessToken) || lease.expiresAt <= Date.now() || !Number.isFinite(lease.renewAfterMs)) throw Error('电脑连接凭据无效')
  }
  private scheduleRenew(generation: number, lease: HostedLease) {
    clearTimeout(this.renewTimer)
    this.renewTimer = setTimeout(async () => {
      if (!this.enabled || generation !== this.generation || !this.record || this.socket?.readyState !== WebSocket.OPEN) return
      try {
        const next = await hostedProof<HostedLease>(RANDOM_MARKET.connect, this.record.identity, 'lease', { hostId: this.record.identity.hostId }, this.controller?.signal)
        if (!this.enabled || generation !== this.generation) return
        this.validateLease(next); this.socket?.send(JSON.stringify({ type: 'renew', token: next.accessToken })); this.scheduleRenew(generation, next)
      } catch (error) {
        if (error instanceof HostedError && error.status === 403) { this.status = { phase: 'revoked', error: '电脑授权已撤销' }; this.socket?.close(); return }
        if (lease.expiresAt > Date.now() + 30000) this.scheduleRenew(generation, { ...lease, renewAfterMs: 15000 }); else this.socket?.close()
      }
    }, Math.max(5000, Math.min(lease.renewAfterMs, lease.expiresAt - Date.now() - 30000)))
  }
  syncRoutes(): void {
    if (this.socket?.readyState !== WebSocket.OPEN || !this.state || !this.authenticated) return
    const routes = Object.fromEntries(this.state.devices.filter(d => !d.revoked && d.pairing.v === 4 && d.pairing.expiresAt > Date.now()).map(d => [d.pairing.deviceId, { tokenHash: createHash('sha256').update(d.pairing.token).digest('hex'), ...(d.bootstrap ? { bootstrapHash: createHash('sha256').update(d.bootstrap.token).digest('hex') } : {}), expiresAt: d.pairing.expiresAt }]))
    const value = JSON.stringify(routes); if (value !== this.routes) { this.routes = value; this.routesAck=''; this.socket.send(JSON.stringify({ type: 'routes', routes, syncId:createHash('sha256').update(value).digest('hex') })) }
  }
  private async handleRequest(message: { id?: string; hostId?: string; deviceId?: string; packet?: unknown }, generation: number) {
    const device = this.state?.devices.find(d => d.pairing.deviceId === message.deviceId && d.pairing.v === 4)
    if (!device || !message.id || message.hostId !== this.state?.hostId || !this.host || this.busy.has(device.pairing.deviceId)) return
    const packet = RemotePacketSchema.safeParse(message.packet); if (!packet.success) return
    this.busy.add(device.pairing.deviceId)
    try {
      const response = await this.host.receive(device, packet.data)
      if (this.enabled && generation === this.generation && this.socket?.readyState === WebSocket.OPEN && !device.revoked) { this.syncRoutes(); this.socket.send(JSON.stringify({ type: 'response', id: message.id, packet: response })) }
    } catch { /* 无法验证的密文不返回内部错误或授权详情。 */ }
    finally { if (generation === this.generation) this.busy.delete(device.pairing.deviceId) }
  }
}
export const hostedRemote = new HostedRemoteService()
