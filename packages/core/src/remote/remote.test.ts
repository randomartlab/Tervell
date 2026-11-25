import { describe, test, expect } from 'bun:test'
import { randomBytes, randomUUID } from 'node:crypto'
import { RemoteHost, createRemoteDevice } from './host'
import type { RemoteState, RemoteAdapter } from './host'
import { openRemote, sealRemote } from './crypto'
import { RemotePairingSchema, RemoteRequestSchema } from '@proma/protocol'

function fixture() {
  const state: RemoteState = { hostId: 'host', devices: [], sent: [] }
  let sends = 0, creates = 0, stops = 0, approvals = 0, saves = 0
  let allowed = ['ws-a']
  const adapter: RemoteAdapter = {
    sessions: () => [{ id: 's-a', title: 'A', workspaceId: 'ws-a', updatedAt: 1 }, { id: 's-b', title: 'B', workspaceId: 'ws-b', updatedAt: 2 }],
    workspaces: () => [{ id: 'ws-a', name: 'A' }, { id: 'ws-b', name: 'B' }],
    create: async (workspaceId) => { creates++; return { id: 'new', title: '新对话', workspaceId, updatedAt: 3 } },
    messages: () => Array.from({ length: 25 }, (_, i) => ({ id: String(i), role: 'user', content: i === 24 ? '字'.repeat(33000) : '消息', createdAt: i })),
    send: () => { sends++ }, stop: () => { stops++ }, running: () => false,
    approvals: () => [{ requestId: 'r-a', sessionId: 's-a', toolName: 'Write', description: '写入' }, { requestId: 'r-b', sessionId: 's-b', toolName: 'Write', description: '私有' }],
    approve: () => { approvals++; return true },
  }
  const device = createRemoteDevice(state, 'https://example.test/proma-relay/', ['ws-a'])
  const host = new RemoteHost(state, adapter, () => { saves++ }, () => allowed)
  let seq = 0
  const request = async (method: string, params: object = {}, id = randomUUID()) => {
    const packet = sealRemote(device.pairing, 'to-host', ++seq, { id, sentAt: Date.now(), method, ...(method === 'pair' ? { deviceKey: randomBytes(32).toString('hex'), deviceToken: randomBytes(32).toString('hex') } : {}), ...params })
    const reply = await host.receive(device, packet)
    if (!reply) throw new Error('无响应')
    return openRemote(device.pairing, 'to-device', 0, reply).value as { ok: boolean; data: Record<string, unknown>; error?: string }
  }
  return { state, host, device, request, adapter, setAllowed: (value: string[]) => { allowed = value }, counts: () => ({ sends, creates, stops, approvals, saves }) }
}
describe('远程配对与授权', () => {
  test('Given 新设备 When 未配对、过期、重复配对 Then 仅一次有效配对', async () => {
    const f = fixture()
    expect((await f.request('sessions')).ok).toBe(false)
    expect((await f.request('pair')).ok).toBe(true)
    expect((await f.request('pair')).ok).toBe(false)
    f.device.pairing.expiresAt = 1
    await expect(f.request('sessions')).rejects.toThrow('过期')
  })
  test('Given 项目授权 When 列表、详情、发送、停止、审批 Then 跨项目全拒绝', async () => {
    const f = fixture(); await f.request('pair')
    expect((await f.request('sessions')).data.sessions).toHaveLength(1)
    for (const method of ['messages', 'stop']) expect((await f.request(method, { sessionId: 's-b' })).ok).toBe(false)
    expect((await f.request('send', { sessionId: 's-b', text: '不能发', clientMessageId: randomUUID() })).ok).toBe(false)
    expect((await f.request('create', { workspaceId: 'ws-b' })).ok).toBe(false)
    expect((await f.request('approvals')).data.approvals).toHaveLength(1)
    expect((await f.request('approve', { requestId: 'r-b', decision: 'allow' })).ok).toBe(false)
    expect((await f.request('approve', { requestId: 'r-a', decision: 'allow' })).ok).toBe(true)
    expect(f.counts().approvals).toBe(1)
    f.setAllowed([])
    expect((await f.request('sessions')).data.sessions).toHaveLength(0)
    f.device.revoked = true
    await expect(f.request('sessions')).rejects.toThrow('撤销')
  })
  test('Given 重连重发 When 重复请求或消息 ID Then 不重复启动', async () => {
    const f = fixture(); await f.request('pair')
    const id = randomUUID(), clientMessageId = randomUUID()
    const params = { sessionId: 's-a', text: '你好', clientMessageId }
    expect((await f.request('send', params, id)).ok).toBe(true)
    expect((await f.request('send', params, id)).ok).toBe(true)
    expect((await f.request('send', params)).data.duplicate).toBe(true)
    await expect(f.request('send', { ...params, text: '篡改' }, id)).rejects.toThrow('不一致')
    expect((await f.request('send', { ...params, text: '不一致' })).ok).toBe(false)
    expect(f.counts().sends).toBe(1)
  })
  test('Given 已处理包 When 重放同包 Then 只返回缓存结果', async () => {
    const f = fixture(); await f.request('pair')
    const packet = sealRemote(f.device.pairing, 'to-host', 50, { id: randomUUID(), sentAt: Date.now(), method: 'create', workspaceId: 'ws-a' })
    await f.host.receive(f.device, packet)
    await f.host.receive(f.device, packet)
    expect(f.counts().creates).toBe(1)
  })
  test('Given 执行中崩溃的记录 When 恢复 Then 不重做副作用', async () => {
    const f = fixture(); await f.request('pair')
    const id = randomUUID()
    await f.request('create', { workspaceId: 'ws-a' }, id)
    f.device.replies = []
    expect((await f.request('create', { workspaceId: 'ws-a' }, id)).error).toContain('不确定')
    expect(f.counts().creates).toBe(1)
  })
  test('Given 大量消息 When 手机分页 Then 有界并告知裁剪', async () => {
    const f = fixture(); await f.request('pair')
    const tail = await f.request('messages', { sessionId: 's-a' })
    expect(tail.data.before).toBe(5)
    expect(tail.data.hasOlder).toBe(true)
    const messages = tail.data.messages as Array<{ content: string; truncated: boolean }>
    expect(messages).toHaveLength(20)
    expect(messages.at(-1)?.content.length).toBe(32000)
    expect(messages.at(-1)?.truncated).toBe(true)
    expect((await f.request('messages', { sessionId: 's-a', before: 5 })).data.messages).toHaveLength(5)
  })
})
describe('加密边界与协议输入', () => {
  test('Given 固定向量 When HKDF+GCM Then 输出稳定、错误密钥和篡改被拒绝', () => {
    const f = fixture()
    const pairing = { ...f.device.pairing, key: '11'.repeat(32), room: '22'.repeat(32), hostId: 'host', deviceId: 'device' }
    const packet = sealRemote(pairing, 'to-host', 1, { hello: '你好' }, Buffer.from('33'.repeat(12), 'hex'))
    expect(packet.ciphertext).toBe('cb8413002954fb8dfeafbd8b31416537988b6f5dadd69837e6c08f65c9d8fedcb529')
    expect(openRemote(pairing, 'to-host', 0, packet).value).toEqual({ hello: '你好' })
    expect(() => openRemote({ ...pairing, key: '44'.repeat(32) }, 'to-host', 0, packet)).toThrow()
    expect(() => openRemote(pairing, 'to-device', 0, packet)).toThrow()
    expect(() => openRemote(pairing, 'to-host', 1, packet)).toThrow()
    expect(() => openRemote(pairing, 'to-host', 0, { ...packet, seq: 2 })).toThrow()
    expect(() => openRemote(pairing, 'to-host', 0, { ...packet, deviceId: 'other' })).toThrow()
  })
  test('Given 不安全地址或伪造运行参数 When 解析 Then 拒绝', () => {
    const f = fixture()
    expect(RemotePairingSchema.safeParse({ ...f.device.pairing, relay: 'http://example.test/' }).success).toBe(false)
    expect(RemotePairingSchema.safeParse({ ...f.device.pairing, relay: 'https://user:pass@example.test/' }).success).toBe(false)
    expect(RemoteRequestSchema.safeParse({ id: randomUUID(), sentAt: Date.now(), method: 'send', sessionId: 's-a', text: 'hi', clientMessageId: randomUUID(), permissionModeOverride: 'bypassPermissions' }).success).toBe(false)
  })
})

test('Given 首次配对 When 旧链接再尝试 Then 不能冒充新设备', async () => {
  const f = fixture()
  const bootstrap = { ...f.device.pairing }
  await f.request('pair')
  expect(f.device.pairing.key).not.toBe(bootstrap.key)
  expect(f.device.pairing.token).not.toBe(bootstrap.token)
  const packet = sealRemote(bootstrap, 'to-host', 5, { id: randomUUID(), sentAt: Date.now(), method: 'sessions' })
  await expect(f.host.receive(f.device, packet)).rejects.toThrow()
})
test('Given 收紧项目权限 When 重试旧详情请求 Then 缓存不能泄漏', async () => {
  const f = fixture(); await f.request('pair')
  const id = randomUUID()
  expect((await f.request('messages', { sessionId: 's-a' }, id)).ok).toBe(true)
  f.setAllowed([])
  expect((await f.request('messages', { sessionId: 's-a' }, id)).ok).toBe(false)
})
test('Given 频繁只读同步 When 请求数增加 Then 不无限保存读取记录', async () => {
  const f = fixture(); await f.request('pair')
  for (let i = 0; i < 20; i++) await f.request('sessions')
  expect(Object.keys(f.device.signatures).length).toBeLessThanOrEqual(5)
  expect(f.device.operationIds).toHaveLength(1)
})

test('Given Agent 提问与计划 When 手机回答和审批 Then 必须属于授权会话', async () => {
  const f = fixture(); await f.request('pair')
  f.adapter.interactions = () => [
    { requestId: 'q-a', sessionId: 's-a', kind: 'question', questions: [{ question: '选哪个？', options: [{ label: 'A' }] }] },
    { requestId: 'p-a', sessionId: 's-a', kind: 'plan', planText: '只改一个文件' },
    { requestId: 'q-b', sessionId: 's-b', kind: 'question', questions: [] },
  ]
  let answered = 0, plans = 0
  f.adapter.answer = () => { answered++; return true }
  f.adapter.plan = () => { plans++; return true }
  expect((await f.request('interactions')).data.interactions).toHaveLength(2)
  expect((await f.request('answer', { requestId: 'q-b', answers: {} })).ok).toBe(false)
  expect((await f.request('answer', { requestId: 'q-a', answers: {} })).ok).toBe(false)
  expect((await f.request('answer', { requestId: 'q-a', answers: { '选哪个？': 'A' } })).ok).toBe(true)
  expect((await f.request('plan', { requestId: 'p-a', decision: 'allow' })).ok).toBe(true)
  expect(answered).toBe(1); expect(plans).toBe(1)
})

test('Given 未配对的拒绝结果 When 同 ID 重试 Then 不能跳过配对', async () => {
  const f = fixture()
  const id = randomUUID()
  expect((await f.request('sessions', {}, id)).ok).toBe(false)
  expect((await f.request('sessions', {}, id)).ok).toBe(false)
})

test('Given 前台定时同步 When 消息无变化 Then 只返回 revision 节省流量', async () => {
  const f = fixture(); await f.request('pair')
  const first = await f.request('messages', { sessionId: 's-a' })
  const next = await f.request('messages', { sessionId: 's-a', knownRevision: first.data.revision })
  expect(next.data.unchanged).toBe(true)
  expect(next.data.messages).toBeUndefined()
})
