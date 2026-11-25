import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { spawn } from 'node:child_process'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { relayCall } from '../packages/core/src/remote/transport'
import { RemoteHost, createRemoteDevice } from '../packages/core/src/remote/host'
import type { RemoteState } from '../packages/core/src/remote/host'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto'

// 使用随机端口启动独立 Python 中转，不启动 Electron，不安装依赖。
const port = 20000 + Math.floor(Math.random() * 20000)
const relay = `http://127.0.0.1:${port}/`
const enrollment = randomBytes(32).toString('hex')
const process = spawn('python3', ['services/relay/relay.py'], { env: { ...Bun.env, PROMA_RELAY_PORT: String(port), PROMA_RELAY_ENROLLMENT: enrollment }, stdio: 'ignore' })
beforeAll(async () => {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${relay}health`)).ok) return } catch { /* 等待端口 */ }
    await Bun.sleep(50)
  }
  throw new Error('测试中转未启动')
})
afterAll(() => process.kill())
function credentials() {
  const hex = () => randomBytes(32).toString('hex')
  const room = hex()
  return { host: { relay, room, token: hex() }, device: { relay, room, token: hex() } }
}
async function register(c: ReturnType<typeof credentials>) {
  return relayCall(c.host, 'host', 'register', { enrollment, deviceTokenHash: createHash('sha256').update(c.device.token).digest('hex') })
}
describe('真实 HTTP 中转', () => {
  test('Given 独立房间 When 错误凭据和角色 Then 拒绝注册与越权', async () => {
    const c = credentials()
    await expect(relayCall(c.host, 'host', 'register', { enrollment: 'wrong' })).rejects.toThrow('403')
    await register(c)
    await expect(relayCall({ ...c.device, token: c.host.token }, 'device', 'poll')).rejects.toThrow('403')
    await expect(relayCall(c.device, 'device', 'delete')).rejects.toThrow('403')
    await expect(relayCall(c.device, 'device', 'push', { direction: 'to-device', seq: 1 })).rejects.toThrow('400')
    await expect(relayCall({ ...c.host, token: randomBytes(32).toString('hex') }, 'host', 'register', { enrollment, deviceTokenHash: createHash('sha256').update(c.device.token).digest('hex') })).rejects.toThrow('403')
    await relayCall(c.host, 'host', 'delete')
  })
  test('Given HTTP 确认丢失 When 重取和断线重发 Then 缓存保留且不重复启动', async () => {
    const c = credentials()
    await register(c)
    const state: RemoteState = { hostId: 'host', devices: [], sent: [] }
    const device = createRemoteDevice(state, 'https://example.test/', ['ws'])
    device.paired = true
    let sends = 0
    const host = new RemoteHost(state, {
      sessions: () => [{ id: 's', title: '会话', workspaceId: 'ws', updatedAt: 1 }], workspaces: () => [], create: async () => { throw new Error('unused') },
      messages: () => [], send: () => { sends++ }, stop: () => {}, approvals: () => [], approve: () => false, running: () => false,
    }, () => {}, () => ['ws'])
    const packet = sealRemote(device.pairing, 'to-host', 1, { id: randomUUID(), sentAt: Date.now(), method: 'send', sessionId: 's', text: '一次', clientMessageId: randomUUID() })
    await relayCall(c.device, 'device', 'push', packet)
    const first = await relayCall(c.host, 'host', 'poll') as { packet: typeof packet }
    const again = await relayCall(c.host, 'host', 'poll') as { packet: typeof packet }
    expect(first.packet).toEqual(again.packet)
    const reply = await host.receive(device, first.packet)
    await host.receive(device, again.packet)
    expect(sends).toBe(1)
    await relayCall(c.host, 'host', 'push', reply)
    await relayCall(c.host, 'host', 'ack', { seq: 999 })
    expect((await relayCall(c.host, 'host', 'poll') as { packet: unknown }).packet).toEqual(packet)
    await relayCall(c.host, 'host', 'ack', { seq: packet.seq })
    const result = await relayCall(c.device, 'device', 'poll') as { packet: unknown }
    expect(openRemote(device.pairing, 'to-device', 0, result.packet).value).toMatchObject({ ok: true, data: { accepted: true } })
    await relayCall(c.host, 'host', 'delete')
    await expect(relayCall(c.device, 'device', 'poll')).rejects.toThrow('403')
  })
  test('Given 恶意大包和堆积 When 超出预算 Then 返回限制错误', async () => {
    const c = credentials(); await register(c)
    await expect(relayCall(c.device, 'device', 'push', { direction: 'to-host', seq: 1, text: 'a'.repeat(1000000) })).rejects.toThrow('413')
    for (let i = 0; i < 16; i++) await relayCall(c.device, 'device', 'push', { direction: 'to-host', seq: i + 1 })
    await expect(relayCall(c.device, 'device', 'push', { direction: 'to-host', seq: 17 })).rejects.toThrow('429')
    await relayCall(c.host, 'host', 'delete')
  })
})
