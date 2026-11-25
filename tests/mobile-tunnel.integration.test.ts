import { expect, test } from 'bun:test'
import { randomBytes, randomUUID } from 'node:crypto'
import { fixture } from '../packages/core-server/src/test-fixtures/fixture.ts'
import { MobileTunnelService } from '../packages/core-server/src/mobile-tunnel.ts'
import type { RemoteState } from '../packages/core/src/remote/host.ts'
import { decodeRemotePairing } from '../packages/core/src/remote/tunnel-client.ts'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto.ts'

test('Given 默认隧道接入Core Service When 手机RPC发送、越项目与撤销 Then 同一journal与租约门禁生效', async () => {
  const host = await fixture(), state: RemoteState = { hostId: 'host', devices: [], sent: [] }
  let allowed = ['w1'], saves = 0
  const service = new MobileTunnelService({ dispatcher: host.dispatcher, auth: host.auth, connectTunnel: false, workspaceIds: () => allowed, state, save: () => { saves++ }, profile: { version: 1, sshHost: 'fixture', tunnel: { server: 'example.test', port: 443, path: '/0123456789abcdef01234567', clientId: randomUUID(), targetHost: '127.0.0.1', targetPort: 29999 } } })
  try {
    await service.start()
    const bootstrap = decodeRemotePairing(service.pair()), mobile = { ...bootstrap, key: randomBytes(32).toString('hex'), token: randomBytes(32).toString('hex') }
    let sequence = 0
    const send = async (pairing: typeof mobile, method: string, params: object = {}) => {
      const request = { id: randomUUID(), sentAt: Date.now(), method, ...params }
      const response = await fetch(`http://127.0.0.1:${service.port}/v2/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pairing.token}` }, body: JSON.stringify({ room: pairing.room, packet: sealRemote(pairing, 'to-host', ++sequence, request) }) })
      if (!response.ok) return { ok: false, data: undefined }
      const packet = (await response.json() as { packet: unknown }).packet
      return openRemote(mobile, 'to-device', 0, packet).value as { ok: boolean; data?: { entries?: Array<{ id: string }> } }
    }
    expect((await send(bootstrap, 'pair', { deviceKey: mobile.key, deviceToken: mobile.token })).ok).toBe(true)
    const rpc = (method: string, params: object) => send(mobile, 'rpc', { request: { clientKind: 'mobile', requestId: randomUUID(), method, params } })
    const sessions = await rpc('session.list', {})
    expect(sessions.ok).toBe(true); expect(sessions.data?.entries?.map(session => session.id)).toEqual(['s1'])
    expect((await rpc('session.send', { id: 's2', text: '禁止跨项目', clientMessageId: randomUUID() })).ok).toBe(false)
    expect((await rpc('session.send', { id: 's1', text: '默认隧道RPC', clientMessageId: randomUUID() })).ok).toBe(true)
    await host.settled(); expect(host.repository.head('s1')).toBe(3)
    const coreDevice = state.devices[0]?.coreDeviceId
    expect(coreDevice).toBeDefined()
    if (coreDevice) host.auth.revoke(coreDevice)
    expect((await rpc('session.list', {})).ok).toBe(false)
    expect(state.devices[0]?.coreDeviceId).toBe(coreDevice)
    allowed = []
    expect((await rpc('session.detail', { id: 's1' })).ok).toBe(false)
    await service.revoke(mobile.deviceId)
    expect((await rpc('session.list', {})).ok).toBe(false)
    expect(saves).toBeGreaterThan(0)
  } finally { await service.close(); await host.close() }
})
