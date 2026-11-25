import { DeviceAuth } from './auth.ts'
import { ServiceDispatcher } from './dispatcher.ts'
import { RemoteHost, createTunnelDevice } from '@proma/core/remote/host'
import type { RemoteState } from '@proma/core/remote/host'
import { DirectRemoteServer } from '@proma/core/remote/direct-server'
import { SshRemoteTunnel } from '@proma/core/remote/ssh-tunnel'
import { remotePairingLink } from '@proma/core/remote/pairing'
import { parseApiResponse, RemoteTunnelProfileSchema } from '@proma/protocol'
import type { RemoteTunnelProfile } from '@proma/protocol'

export class MobileTunnelService {
  private readonly host: RemoteHost
  private readonly server: DirectRemoteServer
  private tunnel?: SshRemoteTunnel
  private enabled = false
  private online = false
  private sweep?: ReturnType<typeof setInterval>
  private sweeping = false
  private fault?: string
  constructor(private readonly input: { dispatcher: ServiceDispatcher; auth: DeviceAuth; profile: RemoteTunnelProfile; state: RemoteState; save: () => void; workspaceIds: () => string[]; connectTunnel?: boolean }) {
    RemoteTunnelProfileSchema.parse(input.profile)
    this.host = new RemoteHost(input.state, {
      remoteProtocol: 'core',
      sessions: () => input.dispatcher.repository.journal.db.prepare('SELECT id FROM sessions').all().flatMap(row => {
        const session = input.dispatcher.repository.get(String(row.id)); return session ? [{ id: session.id, title: session.title, workspaceId: session.workspaceId, updatedAt: session.updatedAt }] : []
      }), workspaces: () => input.workspaceIds().map(id => ({ id, name: id })),
      create: async () => { throw new Error('请在电脑创建会话') }, messages: () => [], send: () => { throw new Error('请更新手机端') }, stop: () => { throw new Error('请更新手机端') }, approvals: () => [], approve: () => false, running: id => input.dispatcher.runtime.running.includes(id),
      authorizeRpc: async (device, request) => {
        const remote = input.state.devices.find(candidate => candidate.pairing.deviceId === device.id)
        if (!remote || remote.revoked || !remote.coreDeviceId) throw new Error('设备未授权')
        const principal = input.auth.authenticate(remote.hostToken)
        if ('id' in request.params) {
          const session = input.dispatcher.session(principal, request.params.id)
          if (!session.workspaceId || !device.workspaceIds.includes(session.workspaceId)) throw new Error('项目未授权')
        }
      },
      rpc: async (device, request) => {
        const remote = input.state.devices.find(candidate => candidate.pairing.deviceId === device.id)
        if (!remote || remote.revoked || !remote.paired || remote.pairing.expiresAt <= Date.now()) throw new Error('设备授权已失效')
        let principal = remote.coreDeviceId ? input.auth.authenticate(remote.hostToken) : undefined
        if (principal && JSON.stringify([...principal.workspaceIds].sort()) !== JSON.stringify([...device.workspaceIds].sort())) { input.auth.revoke(principal.deviceId); await input.dispatcher.runtime.revoke(principal.deviceId); await input.dispatcher.capabilities.revoke(principal.deviceId); principal = undefined }
        if (!principal) {
          const issued = input.auth.issue({ name: 'mobile-private', kind: 'mobile', workspaceIds: device.workspaceIds, control: true, ttlMs: Math.max(1, remote.pairing.expiresAt - Date.now()) })
          remote.hostToken = issued.token; remote.coreDeviceId = issued.device.id; input.save(); principal = input.auth.authenticate(issued.token)
        }
        const { data } = await input.dispatcher.dispatch(principal, request)
        return parseApiResponse(request.method, 'mobile', data)
      },
    }, input.save, input.workspaceIds)
    this.server = new DirectRemoteServer(this.host, input.state, () => this.enabled)
  }
  async start(): Promise<void> {
    await this.server.listen(); this.enabled = true
    this.sweep = setInterval(() => { void this.reconcile().catch(() => { this.enabled = false; this.fault = '手机连接暂时不可用，请重新连接' }) }, 1000)
    if (this.input.connectTunnel !== false) { this.tunnel = new SshRemoteTunnel(this.input.profile, this.server.port, online => { this.online = online }); this.tunnel.start() }
  }
  get port(): number { return this.server.port }
  get connected(): boolean { return this.online }
  get status(): { connected: boolean; error?: string } { return { connected: this.enabled && this.online, error: this.fault } }
  pair(): string {
    if (!this.enabled) throw new Error('手机连接尚未就绪')
    const device = createTunnelDevice(this.input.state, this.input.profile.tunnel, this.input.workspaceIds()); this.input.save()
    return remotePairingLink(device.pairing)
  }
  async revoke(deviceId: string): Promise<void> {
    const device = this.input.state.devices.find(candidate => candidate.pairing.deviceId === deviceId)
    if (!device) return
    device.revoked = true; this.input.save()
    let principal
    try { principal = this.input.auth.authenticate(device.hostToken) } catch { return }
    this.input.auth.revoke(principal.deviceId); await this.input.dispatcher.runtime.revoke(principal.deviceId); await this.input.dispatcher.capabilities.revoke(principal.deviceId)
  }
  private async reconcile(): Promise<void> {
    if (this.sweeping) return
    this.sweeping = true
    try {
      const current = this.input.workspaceIds()
      for (const device of this.input.state.devices) {
        if (!device.coreDeviceId) continue
        const expected = device.workspaceIds.filter(id => current.includes(id))
        const record = this.input.auth.devices().find(candidate => candidate.id === device.coreDeviceId)
        if (!record || record.revoked) continue
        if (device.revoked || device.pairing.expiresAt <= Date.now() || JSON.stringify([...expected].sort()) !== JSON.stringify([...record.workspaceIds].sort())) {
          this.input.auth.revoke(record.id); await this.input.dispatcher.runtime.revoke(record.id); await this.input.dispatcher.capabilities.revoke(record.id)
          if (!device.revoked && device.pairing.expiresAt > Date.now()) { device.coreDeviceId = undefined; this.input.save() }
        }
      }
    } finally { this.sweeping = false }
  }
  async close(): Promise<void> { this.enabled = false; clearInterval(this.sweep); await this.tunnel?.close(); await this.server.close() }
}
