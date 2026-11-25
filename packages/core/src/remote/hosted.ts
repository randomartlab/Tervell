import { createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto'

export interface HostedIdentity { hostId: string; publicKey: string; privateKey: string }
export interface HostedLease { hostId: string; accessToken: string; expiresAt: number; renewAfterMs: number }
export interface DeviceStart { state: 'pending'|'approved'; requestId?: string; userCode?: string; expiresAt?: number; verificationUrl?: string; lease?: HostedLease }
export class HostedError extends Error { constructor(message: string, readonly status: number) { super(message) } }
export function createHostedIdentity(hostId: string): HostedIdentity {
  const pair = generateKeyPairSync('ed25519')
  return { hostId, publicKey: pair.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url'), privateKey: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }
}
export function verifyHostedIdentity(identity: HostedIdentity): boolean {
  try { return createPublicKey(createPrivateKey(identity.privateKey)).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url') === identity.publicKey } catch { return false }
}
/** 服务器每次提供一次性challenge；签名绑定用途、payload、公钥与挑战，不能重放续签。 */
export async function hostedProof<T>(base: string, identity: HostedIdentity, purpose: 'start'|'poll'|'lease', body: object, signal?: AbortSignal): Promise<T> {
  const post = async (path: string, value: object): Promise<unknown> => {
    const response = await fetch(new URL(path, base), { method: 'POST', redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) })
    if (Number(response.headers.get('content-length')) > 32768) throw new Error('连接服务响应过大')
    const text = await response.text(); if (text.length > 32768) throw new Error('连接服务响应过大')
    if (!response.ok) throw new HostedError(response.status === 403 ? '电脑连接授权已失效，请重新授权' : response.status === 410 ? '确认已过期，请重新连接' : '连接服务暂不可用，请稍后重试', response.status)
    return JSON.parse(text) as unknown
  }
  const challenge = await post('challenge', { publicKey: identity.publicKey, purpose }) as { id: string; nonce: string; expiresAt: number }
  if (!/^[a-f0-9]{32}$/.test(challenge.id) || !/^[a-f0-9]{64}$/.test(challenge.nonce) || challenge.expiresAt <= Date.now()) throw new Error('连接服务身份挑战无效')
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url')
  const message = `tervell-connect-v1\n${purpose}\n${challenge.id}\n${challenge.nonce}\n${payload}`
  const result = await post(purpose === 'start' ? 'device/start' : purpose === 'poll' ? 'device/poll' : 'lease', { publicKey: identity.publicKey, challengeId: challenge.id, payload, signature: sign(null, Buffer.from(message), identity.privateKey).toString('base64url') })
  return result as T
}
