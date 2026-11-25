import { execFileSync } from 'node:child_process'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto'
import { relayCall } from '../packages/core/src/remote/transport'
import { RemoteHost, createRemoteDevice } from '../packages/core/src/remote/host'
import type { RemotePairing } from '../packages/protocol/src/remote'
import type { RemoteState } from '../packages/core/src/remote/host'

// 凭据只进入内存，不打印、不传入命令行、不写测试报告。
const enrollment = execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'yuyu', "python3 -c \"from pathlib import Path; print(Path('/opt/proma-relay/relay.env').read_text().strip().split('=',1)[1])\""], { encoding: 'utf8' }).trim()
const relay = 'https://randomai.art/proma-relay/'
const state: RemoteState = { hostId: randomUUID(), devices: [], sent: [] }
const device = createRemoteDevice(state, relay, ['probe'])
let mobile: RemotePairing = { ...device.pairing }
const hostCredentials = { relay, room: device.pairing.room, token: device.hostToken }
const register = () => relayCall(hostCredentials, 'host', 'register', { enrollment, deviceTokenHash: createHash('sha256').update(device.pairing.token).digest('hex') })
let sends = 0
const host = new RemoteHost(state, {
  sessions: () => [{ id: 'probe', title: '测试', workspaceId: 'probe', updatedAt: 1 }], workspaces: () => [{ id: 'probe', name: '测试' }],
  create: async () => { throw new Error('unused') }, messages: () => [], send: () => { sends++ }, stop: () => {}, approvals: () => [], approve: () => false, running: () => false,
}, () => {}, () => ['probe'])
let seq = 0
async function exchange(request: object, rotate?: RemotePairing): Promise<unknown> {
  const packet = sealRemote(mobile, 'to-host', ++seq, request)
  await relayCall(mobile, 'device', 'push', packet)
  const polled = await relayCall(hostCredentials, 'host', 'poll') as { packet: unknown }
  const response = await host.receive(device, polled.packet)
  await register()
  await relayCall(hostCredentials, 'host', 'push', response)
  await relayCall(hostCredentials, 'host', 'ack', { seq })
  if (rotate) mobile = rotate
  const result = await relayCall(mobile, 'device', 'poll') as { packet: { seq: number } }
  const decoded = openRemote(mobile, 'to-device', 0, result.packet)
  await relayCall(mobile, 'device', 'ack', { seq: result.packet.seq })
  return decoded.value
}
try {
  await register()
  const oldToken = mobile.token
  const rotated = { ...mobile, key: randomBytes(32).toString('hex'), token: randomBytes(32).toString('hex') }
  const paired = await exchange({ id: randomUUID(), sentAt: Date.now(), method: 'pair', deviceKey: rotated.key, deviceToken: rotated.token }, rotated) as { ok: boolean }
  if (!paired.ok) throw new Error('配对失败')
  let denied = false
  try { await relayCall({ ...mobile, token: oldToken }, 'device', 'poll') } catch { denied = true }
  if (!denied) throw new Error('旧配对链接未失效')
  const request = { id: randomUUID(), sentAt: Date.now(), method: 'send', sessionId: 'probe', text: '无真实模型调用的加密探针', clientMessageId: randomUUID() }
  await exchange(request)
  await exchange(request)
  if (sends !== 1) throw new Error('发生重复执行')
  console.log('公网探针通过：HTTPS、首次配对、密钥轮换、旧链接失效、双向加密、幂等重试；未启动桌面或真实模型')
} finally { await relayCall(hostCredentials, 'host', 'delete').catch(() => {}) }
