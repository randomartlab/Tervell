import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { RemotePacketSchema } from '@proma/protocol'
import type { RemotePacket, RemotePairing } from '@proma/protocol'

type Direction = RemotePacket['direction']
function keyFor(pairing: RemotePairing, direction: Direction): Buffer {
  return Buffer.from(hkdfSync('sha256', Buffer.from(pairing.key, 'hex'), Buffer.from(pairing.room, 'hex'), `proma-remote-v1:${direction}`, 32))
}
function aad(packet: Pick<RemotePacket, 'hostId' | 'deviceId' | 'direction' | 'seq'>): Buffer {
  return Buffer.from(`proma-remote-v1|${packet.hostId}|${packet.deviceId}|${packet.direction}|${packet.seq}`)
}
export function sealRemote(pairing: RemotePairing, direction: Direction, seq: number, value: unknown, nonce = randomBytes(12)): RemotePacket {
  const header = { v: 1 as const, hostId: pairing.hostId, deviceId: pairing.deviceId, direction, seq }
  const cipher = createCipheriv('aes-256-gcm', keyFor(pairing, direction), nonce)
  cipher.setAAD(aad(header))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final(), cipher.getAuthTag()]).toString('hex')
  return RemotePacketSchema.parse({ ...header, nonce: nonce.toString('hex'), ciphertext })
}
export function openRemote(pairing: RemotePairing, direction: Direction, lastSeq: number, input: unknown): { seq: number; value: unknown } {
  const packet = RemotePacketSchema.parse(input)
  if (packet.hostId !== pairing.hostId || packet.deviceId !== pairing.deviceId || packet.direction !== direction || packet.seq <= lastSeq) throw new Error('身份、方向或序号无效')
  const ciphertext = Buffer.from(packet.ciphertext, 'hex')
  const cipher = createDecipheriv('aes-256-gcm', keyFor(pairing, direction), Buffer.from(packet.nonce, 'hex'))
  cipher.setAAD(aad(packet))
  cipher.setAuthTag(ciphertext.subarray(-16))
  const plaintext = Buffer.concat([cipher.update(ciphertext.subarray(0, -16)), cipher.final()])
  return { seq: packet.seq, value: JSON.parse(plaintext.toString('utf8')) as unknown }
}
