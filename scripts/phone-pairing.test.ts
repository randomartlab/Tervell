import { test, expect } from 'bun:test';
import { createDirectCertificate } from '../apps/electron/src/main/lib/direct-certificate';
import { X509Certificate, createPrivateKey, createPublicKey, randomUUID, randomBytes } from 'node:crypto';
import { createDirectDevice, RemoteHost } from '../packages/core/src/remote/host';
import type { RemoteState } from '../packages/core/src/remote/host';
import { DirectRemoteServer } from '../packages/core/src/remote/direct-server';
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto';
import { request } from 'node:https';
import { remotePairingLink } from '../packages/core/src/remote/pairing';
import { decodeRemotePairing } from '../packages/core/src/remote/tunnel-client';

test('Given Windows或Mac无OpenSSL When 首次手机连接 Then 生成本机独立证书且私钥匹配', () => {
  const identity = createDirectCertificate(), certificate = new X509Certificate(identity.cert);
  expect(certificate.verify(certificate.publicKey)).toBe(true);
  expect(createPublicKey(createPrivateKey(identity.key)).export({ type: 'spki', format: 'der' }).equals(certificate.publicKey.export({ type: 'spki', format: 'der' }))).toBe(true);
  expect(identity.fingerprint).toHaveLength(64);
  expect(createDirectCertificate().fingerprint).not.toBe(identity.fingerprint);
});

test('Given 未配置外网的新电脑 When 同一网络配对与发送 Then 固定身份、一次性链接与撤权仍生效', async () => {
  const identity = createDirectCertificate(), state: RemoteState = { hostId: 'lan-host', devices: [], sent: [] };
  let writes = 0;
  const host = new RemoteHost(state, { sessions: () => [{ id: 's', title: 'test', workspaceId: 'w', updatedAt: 1 }], workspaces: () => [{ id: 'w', name: 'Project' }], create: async () => { throw Error(); }, messages: () => [], send: () => { writes++; }, stop: () => {}, approvals: () => [], approve: () => false, running: () => false }, () => {}, () => ['w']);
  let server = new DirectRemoteServer(host, state, () => true, { host: '127.0.0.1', tls: identity });
  await server.listen();
  try {
    const device = createDirectDevice(state, { url: `https://127.0.0.1:${server.port}`, certificateSha256: identity.fingerprint }, ['w']);
    const pairing = decodeRemotePairing(remotePairingLink(device.pairing)); expect(pairing.v).toBe(3);
    const mobile = { ...pairing, key: randomBytes(32).toString('hex'), token: randomBytes(32).toString('hex') };
    let sequence = 0;
    const send = async (auth: typeof pairing, method: string, params: object) => {
      const packet = sealRemote(auth, 'to-host', ++sequence, { id: randomUUID(), sentAt: Date.now(), method, ...params });
      return new Promise<{ packet?: unknown; code: number }>((resolve, reject) => {
        const call = request(`https://127.0.0.1:${server.port}/v2/connect`, { method: 'POST', rejectUnauthorized: false, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + auth.token } }, response => {
          let text = ''; response.on('data', part => { text += String(part); }); response.on('end', () => resolve({ ...JSON.parse(text), code: response.statusCode! }));
        }); call.on('error', reject); call.end(JSON.stringify({ room: auth.room, packet }));
      });
    };
    const paired = await send(pairing, 'pair', { deviceKey: mobile.key, deviceToken: mobile.token });
    expect((openRemote(mobile, 'to-device', 0, paired.packet).value as { ok: boolean }).ok).toBe(true);
    expect(device.pairedAt).toBeGreaterThan(0);
    expect((await send(pairing, 'pair', { deviceKey: pairing.key, deviceToken: pairing.token })).code).not.toBe(200);
    const sent = await send(mobile, 'send', { sessionId: 's', text: '只发一次', clientMessageId: randomUUID() });
    expect((openRemote(mobile, 'to-device', 0, sent.packet).value as { ok: boolean }).ok).toBe(true); expect(writes).toBe(1);
    const originalPort = server.port;
    await server.close();
    server = new DirectRemoteServer(host, state, () => true, { host: '127.0.0.1', port: originalPort, tls: identity });
    await server.listen();
    expect(server.port).toBe(originalPort);
    const restored = await send(mobile, 'sessions', {});
    expect((openRemote(mobile, 'to-device', 0, restored.packet).value as { ok: boolean }).ok).toBe(true);
    device.revoked = true; expect((await send(mobile, 'sessions', {})).code).toBe(403);
  } finally { await server.close(); }
});
