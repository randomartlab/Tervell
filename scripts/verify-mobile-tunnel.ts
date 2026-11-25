import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { RemoteTunnelProfileSchema } from '../packages/protocol/src/index.ts'
import { RemoteHost, createTunnelDevice } from '../packages/core/src/remote/host.ts'
import type { RemoteState } from '../packages/core/src/remote/host.ts'
import { DirectRemoteServer } from '../packages/core/src/remote/direct-server.ts'
import { SshRemoteTunnel } from '../packages/core/src/remote/ssh-tunnel.ts'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto.ts'
import { tunnelExchange, decodeRemotePairing } from '../packages/core/src/remote/tunnel-client.ts'
import { remotePairingLink } from '../packages/core/src/remote/pairing.ts'

const profile = RemoteTunnelProfileSchema.parse(JSON.parse(readFileSync(join(homedir(), '.proma-dev', 'remote-tunnel-private.json'), 'utf8')))
const state: RemoteState = { hostId: randomUUID(), devices: [], sent: [] }
const device = createTunnelDevice(state, profile.tunnel, ['probe'])
let sends = 0, stops = 0, saves = 0, connected = false
const host = new RemoteHost(state, {
  sessions: () => [{ id: 'probe', title: '连接验证', workspaceId: 'probe', updatedAt: 1 }], workspaces: () => [{ id: 'probe', name: '连接验证' }],
  messages: () => [], create: async () => { throw new Error('本探针不创建会话') }, send: () => { sends++ }, stop: () => { stops++ }, approvals: () => [], approve: () => false, running: () => false,
}, () => { saves++ }, () => ['probe'])
const server = new DirectRemoteServer(host, state, () => true)
await server.listen()
const tunnel = new SshRemoteTunnel(profile, server.port, online => { connected = online })
try {
  tunnel.start()
  for (let attempt = 0; attempt < 100 && !tunnel.connected; attempt++) await Bun.sleep(100)
  if (!tunnel.connected) throw new Error('手机连接探针未就绪')
  const mobile = decodeRemotePairing(remotePairingLink(device.pairing))
  const old = { ...mobile }, next = { ...mobile, key: randomBytes(32).toString('hex'), token: randomBytes(32).toString('hex') }
  const paired = await tunnelExchange(mobile, sealRemote(mobile, 'to-host', 1, { id: randomUUID(), sentAt: Date.now(), method: 'pair', deviceKey: next.key, deviceToken: next.token }), process.argv.includes('--diagnose') ? stage => console.log(stage) : undefined)
  if (!(openRemote(next, 'to-device', 0, paired).value as { ok: boolean }).ok) throw new Error('配对探针未通过')
  const request = { id: randomUUID(), sentAt: Date.now(), method: 'send', sessionId: 'probe', text: '临时连接探针，不调用真实模型', clientMessageId: randomUUID() }
  for (const sequence of [2, 3]) {
    const response = await tunnelExchange(next, sealRemote(next, 'to-host', sequence, request))
    if (!(openRemote(next, 'to-device', 0, response).value as { ok: boolean }).ok) throw new Error('传输探针未通过')
  }
  if (sends !== 1) throw new Error('重复发送未去重')
  let oldDenied = false
  try { await tunnelExchange(old, sealRemote(old, 'to-host', 4, { id: randomUUID(), sentAt: Date.now(), method: 'status' })) } catch { oldDenied = true }
  if (!oldDenied) throw new Error('旧配对凭据仍可访问')
  device.revoked = true
  let revoked = false
  try { await tunnelExchange(next, sealRemote(next, 'to-host', 5, { id: randomUUID(), sentAt: Date.now(), method: 'status' })) } catch { revoked = true }
  if (!revoked) throw new Error('撤销未生效')
  console.log('默认手机连接公网探针通过：TLS/WS隧道、回环反向转发、加密配对轮换、幂等与撤销；未启动桌面、真实模型或修改现有会话。')
} finally { await tunnel.close(); await server.close() }
