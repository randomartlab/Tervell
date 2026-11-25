import { createCipheriv, randomBytes } from 'node:crypto'
import { RemotePairingSchema } from '@proma/protocol'
import type { RemotePairing } from '@proma/protocol'

export function remotePairingLink(input: RemotePairing): string {
  const pairing = RemotePairingSchema.parse(input)
  const key = randomBytes(32), nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  cipher.setAAD(Buffer.from('tervell-pair-v3'))
  const payload = Buffer.concat([nonce, cipher.update(JSON.stringify(pairing)), cipher.final(), cipher.getAuthTag()])
  return `tervell://pair?code=${key.toString('base64url')}.${payload.toString('base64url')}`
}
