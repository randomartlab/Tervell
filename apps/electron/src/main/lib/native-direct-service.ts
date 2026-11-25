import { networkInterfaces } from 'node:os';
import { mkdirSync, readFileSync, existsSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { X509Certificate, createPrivateKey, createPublicKey } from 'node:crypto';
import { createDirectCertificate } from './direct-certificate';
import { z } from 'zod';
import { getConfigDir } from './config-paths';
import { readJsonFileSafe, writeJsonFileAtomic, writeTextFileAtomic } from './safe-file';
import { DirectAddressSchema, directForwardTargets, directForwardAdd, directForwardRemove } from './native-direct-forwarding';
import type { NativeDirectPreferences } from '@proma/shared';
const schema = z.object({
  enabled: z.boolean().default(true),
  autoDiscover: z.boolean().default(true),
  ignoredInterfaces: z.array(z.string().max(128)).max(32).default([]),
  customAddresses: z.array(DirectAddressSchema).max(16).default([])
});
let hostId = '',
  port = 0,
  fingerprint = '',
  failure: string | undefined,
  restart: (() => void) | undefined;
export function nativeDirectPreferences(): NativeDirectPreferences {
  return schema.parse(readJsonFileSafe(join(getConfigDir(), 'native-direct.json')) ?? {});
}
/** LAN配对无法依赖外网重新发现端口，重启必须复用首次成功监听的端口。 */
export function nativeDirectListenPort():number {
  const value=readJsonFileSafe<{port?:number}>(join(getConfigDir(),'native-direct-listener.json'))?.port
  return typeof value==='number'&&Number.isInteger(value)&&value>=1024&&value<=65535?value:0
}
export function rememberNativeDirectPort(value:number):void {
  if(!Number.isInteger(value)||value<1024||value>65535)throw new Error('直连端口无效')
  if(nativeDirectListenPort()!==value)writeJsonFileAtomic(join(getConfigDir(),'native-direct-listener.json'),{port:value})
}
export function onNativeDirectRestart(handler: () => void): void {
  restart = handler;
}
export function nativeDirectStatus(value: {
  port: number;
  fingerprint: string;
  hostId?: string;
  error?: string;
}): void {
  port = value.port;
  fingerprint = value.fingerprint;
  failure = value.error;
  if (value.hostId) hostId = value.hostId;
}
export function nativeDirectDiscovery() {
  const preferences = nativeDirectPreferences(),
    candidates: Array<{
      url: string;
      interfaceName: string;
    }> = [];
  if (preferences.enabled && port) {
    if (preferences.autoDiscover) for (const [name, entries] of Object.entries(networkInterfaces()).sort(([a], [b]) => a.localeCompare(b))) {
      if (preferences.ignoredInterfaces.includes(name)) continue;
      for (const e of entries ?? []) if (e.family === 'IPv4' && !e.internal && !e.address.startsWith('169.254.')) candidates.push({
        url: `https://${e.address}:${port}`,
        interfaceName: name
      });
    }
    for (const value of preferences.customAddresses) candidates.push({
      url: new URL(value.startsWith('https://') ? value : 'https://' + value).origin,
      interfaceName: '自定义'
    });
  }
  return {
    hostId,
    targets: directForwardTargets(),
    enabled: preferences.enabled,
    ready: port > 0,
    certificateSha256: fingerprint,
    candidates: [...new Map(candidates.map(c => [c.url, c])).values()].slice(0, 16),
    error: failure ?? null
  };
}
/** 私钥仅在本机生成；指纹通过原有已认证加密会话下发。 */
export async function nativeDirectCertificate(): Promise<{
  key: string;
  cert: string;
  fingerprint: string;
}> {
  const directory = join(getConfigDir(), 'native-direct');
  mkdirSync(directory, {
    recursive: true,
    mode: 0o700
  });
  const keyFile = join(directory, 'identity-key.pem'),
    certFile = join(directory, 'identity-cert.pem');
  const valid = () => {
    try {
      const certificate = new X509Certificate(readFileSync(certFile));
      return existsSync(keyFile) && Date.parse(certificate.validTo) > Date.now() + 86400000 && createPublicKey(createPrivateKey(readFileSync(keyFile))).export({
        type: 'spki',
        format: 'der'
      }).equals(certificate.publicKey.export({
        type: 'spki',
        format: 'der'
      }));
    } catch {
      return false;
    }
  };
  if (!valid()) {
    const generated = createDirectCertificate();
    writeTextFileAtomic(keyFile, generated.key);
    writeTextFileAtomic(certFile, generated.cert);
    chmodSync(keyFile, 0o600);
  }
  const cert = readFileSync(certFile, 'utf8'),
    key = readFileSync(keyFile, 'utf8');
  return {
    key,
    cert,
    fingerprint: new X509Certificate(cert).fingerprint256.replaceAll(':', '').toLowerCase()
  };
}
export async function nativeDirectCall(operation: string, input: unknown): Promise<unknown> {
  if (operation === 'direct.read') return {
    preferences: nativeDirectPreferences(),
    ...nativeDirectDiscovery()
  };
  if (operation === 'direct.write') {
    const preferences = schema.parse(input);
    writeJsonFileAtomic(join(getConfigDir(), 'native-direct.json'), preferences);
    restart?.();
    return {
      preferences,
      ...nativeDirectDiscovery()
    };
  }
  if (operation === 'direct.reports') return (await import('./mobile-control-service')).mobileConnectionReports();
  if (operation === 'direct.forward.add') return directForwardAdd(input);
  if (operation === 'direct.forward.remove') return directForwardRemove(z.object({
    id: z.uuid()
  }).parse(input).id);
  if (operation === 'direct.identity' && (!hostId || !fingerprint || !port)) throw Error('请先开启远程连接，再复制本机直连身份');
  if (operation === 'direct.identity') return 'tervell-direct:v1:' + Buffer.from(JSON.stringify({
    hostId,
    certificateSha256: fingerprint,
    candidates: nativeDirectDiscovery().candidates
  })).toString('base64url');
  if (operation === 'direct.refresh') return nativeDirectDiscovery();
  throw Error('未知直连操作');
}
