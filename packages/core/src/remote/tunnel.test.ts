import { expect, test } from 'bun:test'
import { randomUUID, randomBytes } from 'node:crypto'
import { createTunnelDevice, RemoteHost } from './host.ts'
import type { RemoteState, RemoteAdapter } from './host.ts'
import { DirectRemoteServer } from './direct-server.ts'
import { sealRemote, openRemote } from './crypto.ts'
import { remotePairingLink } from './pairing.ts'
import { decodeRemotePairing } from './tunnel-client.ts'
import { tunnelArguments } from './ssh-tunnel.ts'
import { RemoteConfigureSchema, RemotePairingSchema } from '@proma/protocol'

const descriptor = { server: 'example.test', port: 443 as const, path: '/1234567890abcdef12345678', clientId: 'bdb0eb5a-3bc5-4d25-a62d-640684485938', targetHost: '127.0.0.1' as const, targetPort: 27890 }
test('Given 默认手机配对 When 创建与解码 Then v2不再用relay且展示码不含明文节点字段', () => {
  const state: RemoteState = { hostId: 'host', devices: [], sent: [] }, device = createTunnelDevice(state, descriptor, ['workspace'])
  expect(device.pairing.v).toBe(2)
  expect('relay' in device.pairing).toBe(false)
  const code = remotePairingLink(device.pairing)
  for (const value of [descriptor.server, descriptor.path, descriptor.clientId, device.pairing.token]) expect(code).not.toContain(value)
  expect(decodeRemotePairing(code)).toEqual(device.pairing)
  expect(() => decodeRemotePairing(code.slice(0, -4) + 'abcd')).toThrow()
  expect(RemoteConfigureSchema.parse({ enabled: true, workspaceIds: ['workspace'] })).toEqual({ enabled: true, workspaceIds: ['workspace'] })
  expect(() => RemoteConfigureSchema.parse({ enabled: true, workspaceIds: ['workspace'], relay: 'https://leak.test/' })).toThrow()
})
test('Given 隧道默认配置 When 生成SSH参数 Then 远端和本机都只绑定回环且不能传入命令选项', () => {
  const profile = { version: 1 as const, sshHost: 'fixture', tunnel: descriptor }
  const args = tunnelArguments(profile, 33333)
  expect(args).toContain('127.0.0.1:27890:127.0.0.1:33333')
  expect(args).toContain('StrictHostKeyChecking=yes')
  expect(args).toContain('ExitOnForwardFailure=yes')
  expect(() => tunnelArguments({ ...profile, sshHost: '-oProxyCommand=bad' }, 33333)).toThrow()
  expect(() => RemotePairingSchema.parse({ v: 2, tunnel: { ...descriptor, targetHost: 'public.test' } })).toThrow()
})
test('Given 回环手机入口 When 配对、权限收紧、并发和撤销 Then 加密授权与幂等仍生效且不输出配置详情', async () => {
  const state: RemoteState = { hostId: 'host', devices: [], sent: [] }, device = createTunnelDevice(state, descriptor, ['allowed'])
  let allowed = ['allowed'], sends = 0, saves = 0
  const adapter: RemoteAdapter = { sessions: () => [{ id: 'session', workspaceId: 'allowed', title: 'test', updatedAt: 1 }], workspaces: () => [], create: async () => { throw new Error('unused') }, messages: () => [], send: () => { sends++ }, stop: () => { throw new Error('unused') }, approvals: () => [], approve: () => false, running: () => false }
  const host = new RemoteHost(state, adapter, () => { saves++ }, () => allowed), server = new DirectRemoteServer(host, state, () => true)
  await server.listen()
  const initial = { ...device.pairing }, next = { ...initial, key: randomBytes(32).toString('hex'), token: randomBytes(32).toString('hex') }
  const request = async (pairing: typeof initial, sequence: number, method: string, params: object = {}, id = randomUUID()) => {
    const packet = sealRemote(pairing, 'to-host', sequence, { id, method, sentAt: Date.now(), ...params })
    return fetch(`http://127.0.0.1:${server.port}/v2/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pairing.token}` }, body: JSON.stringify({ room: pairing.room, packet }) })
  }
  try {
    const paired = await request(initial, 1, 'pair', { deviceKey: next.key, deviceToken: next.token })
    expect(paired.status).toBe(200)
    const data = await paired.json() as { packet: unknown }
    expect(openRemote(next, 'to-device', 0, data.packet).value).toMatchObject({ ok: true })
    const params = { sessionId: 'session', text: '一次', clientMessageId: randomUUID() }, identity = randomUUID()
    await request(next, 2, 'send', params, identity); await request(next, 3, 'send', params, identity)
    expect(sends).toBe(1)
    allowed = []
    const denied = await request(next, 4, 'messages', { sessionId: 'session' })
    expect(openRemote(next, 'to-device', 0, (await denied.json() as { packet: unknown }).packet).value).toMatchObject({ ok: false })
    const invalid = await request(initial, 5, 'status')
    expect(invalid.status).toBe(400)
    const text = await invalid.text()
    for (const value of [descriptor.server, descriptor.path, descriptor.clientId]) expect(text).not.toContain(value)
    device.revoked = true
    expect((await request(next, 6, 'status')).status).toBe(403)
    expect(saves).toBeGreaterThan(0)
  } finally { await server.close() }
})
