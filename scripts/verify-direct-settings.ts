import { app, safeStorage } from 'electron';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file';
const root = mkdtempSync(join(tmpdir(), 'tervell-direct-settings-'));
process.env.TERVELL_PROFILE_DIR = root;
app.setPath('userData', join(root, 'chromium'));
app.commandLine.appendSwitch('use-mock-keychain');
const assert = (value: unknown, message: string) => { if (!value) throw Error(message); };
async function run() {
  let stop = () => {};
  try {
    const config = join(root, 'config'); mkdirSync(config);
    // 仅阻断本测试的 SSH 启动；加密手机 HTTP/TLS 请求仍走真实 RemoteHost。
    const load = createRequire(process.cwd() + '/package.json'), processes = load('node:child_process') as typeof import('node:child_process');
    let sshStarts = 0;
    const originalSpawn = processes.spawn;
    processes.spawn = ((...args: Parameters<typeof originalSpawn>) => {
      if (args[0] === '/usr/bin/ssh') { sshStarts++; return originalSpawn('/usr/bin/true', [], { stdio: 'ignore' }); }
      return originalSpawn(...args);
    }) as typeof originalSpawn;
    writeJsonFileAtomic(join(config, 'remote-tunnel-private.json'), { version: 1, sshHost: 'fixture-invalid', tunnel: { server: 'fixture.invalid', port: 443, path: '/abcdefghijklmnop', clientId: randomUUID(), targetHost: '127.0.0.1', targetPort: 45000 } });
    const { createTunnelDevice } = await import('../packages/core/src/remote/host');
    const state = { hostId: 'settings-fixture', devices: [], sent: [] } as import('../packages/core/src/remote/host').RemoteState;
    const device = createTunnelDevice(state, { server: 'fixture.invalid', port: 443, path: '/abcdefghijklmnop', clientId: randomUUID(), targetHost: '127.0.0.1', targetPort: 45000 }, []);
    device.paired = true; device.management = true;
    writeJsonFileAtomic(join(config, 'remote.json'), { version: 1, cipher: safeStorage.encryptString(JSON.stringify({ settings: { enabled: true, workspaceIds: [], allowManagement: true }, state })).toString('base64') });
    const remote = await import('../apps/electron/src/main/lib/remote-service'); stop = remote.stopRemote;
    const direct = await import('../apps/electron/src/main/lib/native-direct-service');
    remote.startRemote();
    for (let i = 0; i < 100 && !direct.nativeDirectDiscovery().ready; i++) await new Promise(resolve => setTimeout(resolve, 30));
    const first = direct.nativeDirectDiscovery(); assert(first.ready, 'TLS 监听未就绪');
    const preferences = direct.nativeDirectPreferences(), starts = sshStarts;
    const { sealRemote, openRemote } = await import('../packages/core/src/remote/crypto');
    const https = load('node:https') as typeof import('node:https');
    let seq = 0;
    const control = async (operation: string, values: object) => {
      const id = randomUUID(), packet = sealRemote(device.pairing, 'to-host', ++seq, { id, sentAt: Date.now(), method: 'control', call: { operation, values } });
      const url = first.candidates[0]?.url; assert(url, '缺少本机网卡候选');
      const response = await new Promise<{ packet: unknown }>((resolve, reject) => {
        const request = https.request(new URL('/v2/connect', url), { method: 'POST', rejectUnauthorized: false, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + device.pairing.token } }, result => {
          const chunks: Buffer[] = []; result.on('data', chunk => chunks.push(Buffer.from(chunk))); result.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch (error) { reject(error); } });
        }); request.on('error', reject); request.end(JSON.stringify({ room: device.pairing.room, packet }));
      });
      return openRemote(device.pairing, 'to-device', 0, response.packet).value as { ok: boolean; data: unknown; error?: string };
    };
    const saved = await control('connection.configure', { ...preferences, ignoredInterfaces: ['unused-fixture'] });
    assert(saved.ok, '手机保存地址失败：' + saved.error);
    assert(direct.nativeDirectDiscovery().candidates[0]?.url === first.candidates[0]?.url && sshStarts === starts, '地址偏好重启了监听或隧道');
    assert((await control('connection.discovery', {})).ok, '保存后同一通道不能继续请求');
    console.log('DIRECT_SETTINGS encrypted management save retained listener, response and tunnel PASS');
    await direct.nativeDirectCall('direct.write', { ...preferences, enabled: false });
    assert(!direct.nativeDirectDiscovery().ready && sshStarts === starts, '关闭直连破坏原有隧道');
    console.log('DIRECT_SETTINGS disable LAN leaves encrypted tunnel ownership unchanged PASS');
    console.log('PROFILE', root);
    processes.spawn = originalSpawn; stop(); app.exit(0);
  } catch (error) { console.error(error); stop(); app.exit(1); }
}
if (app.isReady()) void run(); else app.once('ready', () => void run());
