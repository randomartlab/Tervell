import { app } from 'electron'
import { mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { request } from 'node:https'
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file'
import { decodeRemotePairing } from '../packages/core/src/remote/tunnel-client'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto'
import type { RemotePairing } from '@proma/protocol'

const root = mkdtempSync(join(tmpdir(), 'tervell-phone-onboarding-'))
process.env.TERVELL_PROFILE_DIR = root
app.setPath('userData', join(root, 'chromium'));
(app as typeof app & { setAppPath: (path: string) => void }).setAppPath(resolve('apps/electron'))
app.commandLine.appendSwitch('use-mock-keychain')
const assert = (value: unknown, message: string) => { if (!value) throw Error(message) }

async function run() {
  const remote = await import('../apps/electron/src/main/lib/remote-service')
  try {
    mkdirSync(join(root, 'project'))
    mkdirSync(join(root, 'config'), { recursive: true })
    writeJsonFileAtomic(join(root, 'config/agent-workspaces.json'), { version: 2, workspaces: [{ id: 'phone', name: '连接验收', slug: 'phone', projectRootPath: join(root, 'project'), createdAt: 1, updatedAt: 1 }] })
    remote.configureRemote({ enabled: true, workspaceIds: ['phone'], allWorkspaces:false, allowManagement:false, connectionMode: 'lan' })
    const oldCode = decodeRemotePairing(await remote.pairRemote())
    const pairing = decodeRemotePairing(await remote.pairRemote())
    assert(pairing.v === 3, '新电脑未生成局域网配对')
    if (pairing.v !== 3) throw Error('配对版本错误')
    let seq = 0
    const send = async (auth: RemotePairing, method: string, values: object = {}) => {
      const packet = sealRemote(auth, 'to-host', ++seq, { id: randomUUID(), sentAt: Date.now(), method, ...values })
      return new Promise<{ code: number; packet?: unknown }>((ok, bad) => {
        const call = request(new URL('/v2/connect', pairing.direct.url), { method: 'POST', rejectUnauthorized: false, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + auth.token } }, response => {
          let text = ''; response.on('data', part => { text += String(part) }); response.on('end', () => ok({ code: response.statusCode!, ...JSON.parse(text) }))
        })
        call.on('error', bad)
        call.end(JSON.stringify({ room: auth.room, packet }))
      })
    }
    assert((await send(oldCode, 'pair', { deviceKey: randomBytes(32).toString('hex'), deviceToken: randomBytes(32).toString('hex') })).code === 403, '旧未使用配对码仍有效')
    const mobile = { ...pairing, key: randomBytes(32).toString('hex'), token: randomBytes(32).toString('hex') }
    const paired = await send(pairing, 'pair', { deviceKey: mobile.key, deviceToken: mobile.token })
    assert((openRemote(mobile, 'to-device', 0, paired.packet).value as { ok: boolean }).ok, '加密配对失败')
    const first = remote.remoteStatus()
    assert(first.devices.some(d => d.id === pairing.deviceId && d.paired && !!d.pairedAt), '配对成功未发布状态')
    remote.stopRemote()
    remote.startRemote()
    for (let i = 0; i < 120 && !remote.remoteStatus().localReady; i++) await new Promise(r => setTimeout(r, 30))
    const discovery = (await import('../apps/electron/src/main/lib/native-direct-service')).nativeDirectDiscovery()
    assert(discovery.candidates.some(c => c.url === pairing.direct.url), '电脑重启后改变了手机保存的地址')
    assert(discovery.certificateSha256 === pairing.direct.certificateSha256, '重启改变证书身份')
    const restored = await send(mobile, 'status')
    assert((openRemote(mobile, 'to-device', 0, restored.packet).value as { ok: boolean }).ok, '重启后仍需重新配对')
    console.log('PHONE LAN encrypted bootstrap, unused-code replacement and stable restart PASS')
    const pending = decodeRemotePairing(await remote.pairRemote())
    remote.configureRemote({ enabled: true, workspaceIds: ['phone'], allowManagement: true, connectionMode: 'lan' })
    assert(remote.remoteStatus().devices.some(d => d.id === pending.deviceId && d.revoked), '修改权限后旧未使用码未撤销')
    assert(!remote.remoteStatus().devices.find(d => d.id === pairing.deviceId)?.management, '新权限扩大到旧手机')
    assert((await send(mobile, 'status')).code === 200, '保存授权重启了同一请求监听')
    remote.configureRemote({enabled:true,workspaceIds:['phone'],allWorkspaces:false,allowManagement:true,connectionMode:'lan'})
    assert(remote.remoteStatus().allWorkspaces===false,'明确限制未保存')
    remote.revokeRemote(pairing.deviceId)
    assert((await send(mobile, 'status')).code === 403, '撤销后仍可访问')
    console.log('PHONE permission edits invalidate pending links, existing grants retained, revoke enforced PASS')
    console.log('PROFILE', root)
  } finally { remote.stopRemote() }
}
app.whenReady().then(run).then(() => app.exit(0)).catch(error => { console.error(error); app.exit(1) })
