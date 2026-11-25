import { request as httpsRequest } from 'node:https';
import { X509Certificate, randomUUID, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';
import { RemotePacketSchema } from '@proma/protocol';
import { getConfigDir } from './config-paths';
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file';
export const DirectAddressSchema = z.string().trim().max(255).transform(value => new URL(value.startsWith('https://') ? value : 'https://' + value)).refine(url => url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/' && Number(url.port || 443) > 0, '请填写不含凭据的 HTTPS 主机与端口').transform(url => url.origin);
const targetSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().min(1).max(128),
  url: DirectAddressSchema,
  hostId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  certificateSha256: z.string().regex(/^[a-f0-9]{64}$/)
});
export type DirectForwardTarget = z.infer<typeof targetSchema>;
const config = z.object({
  version: z.literal(1),
  targets: z.array(targetSchema).max(16)
});
const file = () => join(getConfigDir(), 'native-direct-forwarding.json');
export function directForwardTargets(): DirectForwardTarget[] {
  return config.parse(readJsonFileSafe(file()) ?? {
    version: 1,
    targets: []
  }).targets;
}
export function directForwardAdd(raw: unknown): DirectForwardTarget[] {
  const input = targetSchema.omit({
      id: true
    }).parse(raw),
    targets = directForwardTargets();
  if (targets.some(t => t.hostId === input.hostId && t.url === input.url)) return targets;
  if (targets.length >= 16) throw Error('最多保存 16 台中继目标');
  targets.push({
    ...input,
    id: randomUUID()
  });
  writeJsonFileAtomic(file(), {
    version: 1,
    targets
  });
  return targets;
}
export function directForwardRemove(id: string): DirectForwardTarget[] {
  const targets = directForwardTargets().filter(row => row.id !== id);
  writeJsonFileAtomic(file(), {
    version: 1,
    targets
  });
  return targets;
}
/** 第一段已通过配对通路认证。第二段必须匹配已登记目标证书；内容仍是手机与目标的端到端密文。 */
export async function directForwardPacket(raw: unknown): Promise<unknown> {
  const input = z.object({
    targetId: z.uuid(),
    room: z.string().regex(/^[a-f0-9]{64}$/),
    token: z.string().regex(/^[a-f0-9]{64}$/),
    packet: RemotePacketSchema
  }).parse(raw);
  const target = directForwardTargets().find(t => t.id === input.targetId);
  if (!target || target.hostId !== input.packet.hostId) throw Error('中继目标身份不匹配或已移除');
  const text = JSON.stringify({
    room: input.room,
    packet: input.packet
  });
  if (Buffer.byteLength(text) > 160000) throw Error('本次内容使用目标电脑的原有连接传输');
  return new Promise((resolve, reject) => {
    const request = httpsRequest(new URL('/v2/connect', target.url), {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        authorization: 'Bearer ' + input.token,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(text)
      },
      timeout: 25000
    }, response => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 1100000) {
          response.destroy(Error('中继响应过大'));
          return;
        }
        chunks.push(chunk);
      });
      response.once('error', reject);
      response.once('end', () => {
        if (response.statusCode !== 200) {
          reject(Error('目标连接暂不可用'));
          return;
        }
        try {
          resolve({
            packet: RemotePacketSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')).packet)
          });
        } catch {
          reject(Error('目标返回无效数据'));
        }
      });
    });
    request.once('socket', socket => {
      socket.once('secureConnect', () => {
        try {
          const certificate = (socket as import('node:tls').TLSSocket).getPeerCertificate();
          const leaf = new X509Certificate(certificate.raw);
          const fingerprint = leaf.fingerprint256.replaceAll(':', '').toLowerCase();
          if (Date.parse(leaf.validTo) <= Date.now() || Date.parse(leaf.validFrom) > Date.now() || !timingSafeEqual(Buffer.from(fingerprint), Buffer.from(target.certificateSha256))) throw Error();
          request.end(text);
        } catch {
          request.destroy(Error('目标电脑证书不匹配'));
        }
      });
    });
    request.once('timeout', () => request.destroy(Error('目标连接超时')));
    request.once('error', reject);
  });
}
