import { generateKeyPairSync, randomBytes, sign, X509Certificate } from 'node:crypto';

const der = (tag: number, ...parts: Uint8Array[]): Buffer => {
  const content = Buffer.concat(parts), bytes: number[] = [];
  let size = content.length;
  if (size < 128) bytes.push(size);
  else { while (size) { bytes.unshift(size & 255); size >>>= 8; } bytes.unshift(0x80 | bytes.length); }
  return Buffer.concat([Buffer.from([tag, ...bytes]), content]);
};
const sequence = (...parts: Uint8Array[]) => der(0x30, ...parts);
const algorithm = sequence(Buffer.from('06092a864886f70d01010b0500', 'hex'));
const pem = (kind: string, bytes: Buffer) => `-----BEGIN ${kind}-----\n${bytes.toString('base64').match(/.{1,64}/g)!.join('\n')}\n-----END ${kind}-----\n`;
/** 自签名证书的信任来自配对码内的 SHA-256 pin，不依赖系统命令或证书仓库。 */
export function createDirectCertificate(now = Date.now()): { key: string; cert: string; fingerprint: string } {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const serial = randomBytes(16); serial[0] = (serial[0]! & 0x7f) || 1;
  const name = sequence(der(0x31, sequence(Buffer.from('0603550403', 'hex'), der(0x0c, Buffer.from('Tervell Paired Direct')))));
  const time = (at: number) => der(0x18, Buffer.from(new Date(at).toISOString().replace(/[-:T]/g, '').replace(/\.\d{3}Z$/, 'Z')));
  const tbs = sequence(der(0xa0, der(0x02, Buffer.from([2]))), der(0x02, serial), algorithm, name, sequence(time(now - 60000), time(now + 3650 * 86400000)), name, pair.publicKey.export({ type: 'spki', format: 'der' }));
  const signed = sequence(tbs, algorithm, der(0x03, Buffer.from([0]), sign('sha256', tbs, pair.privateKey)));
  const cert = pem('CERTIFICATE', signed);
  return { key: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), cert, fingerprint: new X509Certificate(cert).fingerprint256.replaceAll(':', '').toLowerCase() };
}
