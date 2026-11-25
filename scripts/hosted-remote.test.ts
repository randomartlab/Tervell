import { test, expect } from 'bun:test'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes, randomUUID, createHash, sign } from 'node:crypto'
import WebSocket from 'ws'
import { hostedProof, createHostedIdentity, verifyHostedIdentity } from '../packages/core/src/remote/hosted'
import type { DeviceStart, HostedLease } from '../packages/core/src/remote/hosted'
import { createHostedDevice, RemoteHost } from '../packages/core/src/remote/host'
import type { RemoteState } from '../packages/core/src/remote/host'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto'
import { remotePairingLink } from '../packages/core/src/remote/pairing'
import { decodeRemotePairing } from '../packages/core/src/remote/tunnel-client'

test('Given 每电脑独立身份 When 密钥被替换 Then 不能通过本机身份自校验', () => {
  const a = createHostedIdentity(randomUUID()), b = createHostedIdentity(randomUUID())
  expect(verifyHostedIdentity(a)).toBe(true)
  expect(verifyHostedIdentity({ ...a, privateKey: b.privateKey })).toBe(false)
})
test('Given 原生Go服务与真实加密Host When 公网式登记配对续签和断线 Then 无SSH共享秘密且操作只执行一次', async () => {
  const cache = join(homedir(), '.cache/tervell/gateway-build')
  const child = spawn(join(cache, 'go/bin/go'), ['-C', 'services/connect', 'test', '-run', '^TestFixture$', '-v'], { cwd: process.cwd(), env: { ...process.env, GOPATH: join(cache, 'gopath'), GOCACHE: join(cache, 'build-cache'), GOTOOLCHAIN: 'local', GOPROXY: 'off', TERVELL_CONNECT_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let url = '', output = ''
  const ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Go fixture timeout: ' + output.slice(-500))), 30000)
    child.stdout.on('data', chunk => { output += chunk.toString(); const found = /FIXTURE (http:\/\/127\.0\.0\.1:\d+)/.exec(output); if (found) { url = found[1]!; clearTimeout(timer); resolve() } })
    child.once('error', reject); child.stderr.on('data', chunk => { output += chunk.toString() })
  })
  const sockets: WebSocket[] = []
  try {
    await ready
    const base = url + '/', identity = createHostedIdentity(randomUUID())
    const start = await hostedProof<DeviceStart>(base, identity, 'start', { hostId: identity.hostId, name: '本机模拟电脑', platform: 'test', requestId: randomUUID() })
    expect(start.state).toBe('pending'); expect(start.userCode).toHaveLength(12)
    const approve = await fetch(url + '/account/approve', { method: 'POST', headers: { origin: url, authorization: 'Bearer local-test-owner', 'content-type': 'application/json' }, body: JSON.stringify({ code: start.userCode, confirm: true }) })
    expect(approve.status).toBe(200)
    const registration = await hostedProof<DeviceStart>(base, identity, 'poll', { requestId: start.requestId })
    expect(registration.state).toBe('approved')
    const lease = registration.lease!
    const state: RemoteState = { hostId: identity.hostId, devices: [], sent: [] }
    const phone = createHostedDevice(state, ['project']), pairing = decodeRemotePairing(remotePairingLink(phone.pairing))
    expect(pairing.v).toBe(4)
    let writes = 0
    const adapter = { sessions: () => [{ id: 's', title: 'fixture', workspaceId: 'project', updatedAt: 1 }], workspaces: () => [{ id: 'project', name: 'Project' }], create: async () => { throw Error('unused') }, messages: () => [], send: () => { writes++ }, stop: () => {}, approvals: () => [], approve: () => false, running: () => false }
    let socket: WebSocket
    const routes = () => socket.send(JSON.stringify({ type: 'routes', routes: phone.revoked ? {} : { [phone.pairing.deviceId]: { tokenHash: createHash('sha256').update(phone.pairing.token).digest('hex'), ...(phone.bootstrap ? { bootstrapHash: createHash('sha256').update(phone.bootstrap.token).digest('hex') } : {}), expiresAt: phone.pairing.expiresAt } } }))
    const host = new RemoteHost(state, adapter, () => { if (socket?.readyState === WebSocket.OPEN) routes() }, () => ['project'])
    const attach = async (value: HostedLease, valid = true) => {
      socket = new WebSocket(url.replace('http:', 'ws:') + '/host/ws'); sockets.push(socket)
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('WS auth timeout')), 5000)
        socket.on('message', raw => { const message = JSON.parse(raw.toString()); if (message.type === 'hello') { const proof = `tervell-connect-ws-v1\n${identity.hostId}\n${message.nonce}\n${value.accessToken}`; socket.send(JSON.stringify({ type: 'auth', token: value.accessToken, signature: valid ? sign(null, Buffer.from(proof), identity.privateKey).toString('base64url') : randomBytes(64).toString('base64url') })) } else if (message.type === 'ready') { routes(); clearTimeout(timer); resolve() } else if (message.type === 'request') { void host.receive(phone, message.packet).then(packet => { routes(); socket.send(JSON.stringify({ type: 'response', id: message.id, packet })) }) } })
        socket.once('close', () => { clearTimeout(timer); reject(Error('WS authentication refused')) })
      })
      await Bun.sleep(40)
    }
    await expect(attach(lease, false)).rejects.toThrow()
    await attach(lease)
    let seq = 0
    const exchange = async (auth: typeof pairing, method: string, values: object, id = randomUUID()) => {
      const packet = sealRemote(auth, 'to-host', ++seq, { id, sentAt: Date.now(), method, ...values })
      const result = await fetch(url + '/exchange', { method: 'POST', headers: { authorization: 'Bearer ' + auth.token, 'content-type': 'application/json' }, body: JSON.stringify({ hostId: auth.hostId, deviceId: auth.deviceId, packet }) })
      const data = await result.json() as { packet: unknown }; return { status: result.status, packet: data.packet }
    }
    const mobile = { ...pairing, token: randomBytes(32).toString('hex'), key: randomBytes(32).toString('hex') }
    const paired = await exchange(pairing, 'pair', { deviceKey: mobile.key, deviceToken: mobile.token })
    expect((openRemote(mobile, 'to-device', 0, paired.packet).value as { ok: boolean }).ok).toBe(true)
    const clientMessageId = randomUUID(), id = randomUUID(), values = { sessionId: 's', text: '只执行一次', clientMessageId }
    expect((await exchange(mobile, 'send', values, id)).status).toBe(200)
    expect((await exchange(mobile, 'send', values, id)).status).toBe(200); expect(writes).toBe(1)
    const next = await hostedProof<HostedLease>(base, identity, 'lease', { hostId: identity.hostId })
    socket.send(JSON.stringify({ type: 'renew', token: next.accessToken })); await Bun.sleep(30)
    expect((await exchange(mobile, 'status', {})).status).toBe(200)
    socket.close(); await Bun.sleep(40); await attach(await hostedProof<HostedLease>(base, identity, 'lease', { hostId: identity.hostId }))
    expect((await exchange(mobile, 'send', values, id)).status).toBe(200); expect(writes).toBe(1)
    phone.revoked = true; routes(); await Bun.sleep(30)
    expect((await exchange(mobile, 'status', {})).status).toBe(403)
  } finally { for (const socket of sockets) socket.terminate(); child.kill('SIGTERM') }
}, 45000)
