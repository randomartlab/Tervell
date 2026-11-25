import { randomBytes, createDecipheriv, createHash } from 'node:crypto'
import { connect } from 'node:tls'
import { RemotePairingSchema, RemotePacketSchema } from '@proma/protocol'
import type { RemotePairing, RemotePacket } from '@proma/protocol'

export function decodeRemotePairing(link: string): RemotePairing {
  const url = new URL(link)
  if (!['tervell:', 'proma:'].includes(url.protocol) || url.hostname !== 'pair' || url.pathname || url.username || url.password || url.port || url.hash || link.length > 8192 || [...url.searchParams.keys()].join(',') !== 'code') throw new Error('配对码无效')
  const parts = url.searchParams.get('code')?.split('.')
  if (!parts || parts.length !== 2) throw new Error('配对码无效')
  const key = Buffer.from(parts[0]!, 'base64url'), payload = Buffer.from(parts[1]!, 'base64url')
  if (key.length !== 32 || payload.length < 29) throw new Error('配对码无效')
  const cipher = createDecipheriv('aes-256-gcm', key, payload.subarray(0, 12)); cipher.setAAD(Buffer.from(url.protocol === 'tervell:' ? 'tervell-pair-v3' : 'proma-pair-v2')); cipher.setAuthTag(payload.subarray(-16))
  const plain = Buffer.concat([cipher.update(payload.subarray(12, -16)), cipher.final()])
  return RemotePairingSchema.parse(JSON.parse(plain.toString('utf8')))
}
function maskedFrame(payload: Buffer, opcode = 2): Buffer {
  const mask = randomBytes(4)
  const header = payload.length < 126 ? Buffer.from([0x80 | opcode, 0x80 | payload.length]) : payload.length <= 65535 ? Buffer.from([0x80 | opcode, 0xfe, payload.length >> 8, payload.length & 255]) : Buffer.concat([Buffer.from([0x80 | opcode, 0xff]), Buffer.from([0, 0, 0, 0, (payload.length >>> 24) & 255, (payload.length >>> 16) & 255, (payload.length >>> 8) & 255, payload.length & 255])])
  const bytes = Buffer.from(payload)
  for (let index = 0; index < bytes.length; index++) bytes[index] = bytes[index]! ^ mask[index % 4]!
  return Buffer.concat([header, mask, bytes])
}
export async function tunnelExchange(pairing: RemotePairing, packet: RemotePacket, observe?: (stage: string) => void): Promise<RemotePacket> {
  if (pairing.v !== 2) throw new Error('此配对不支持默认手机连接')
  const target = pairing.tunnel
  const socket = connect({ host: target.server, port: target.port, servername: target.server, rejectUnauthorized: true })
  const requestBody = Buffer.from(JSON.stringify({ room: pairing.room, packet }))
  const uuid = Buffer.from(target.clientId.replaceAll('-', ''), 'hex')
  const vless = Buffer.concat([Buffer.from([0]), uuid, Buffer.from([0, 1, target.targetPort >> 8, target.targetPort & 255, 1, 127, 0, 0, 1])])
  const request = Buffer.concat([vless, Buffer.from(`POST /v2/connect HTTP/1.1\r\nHost: 127.0.0.1:${target.targetPort}\r\nAuthorization: Bearer ${pairing.token}\r\nContent-Type: application/json\r\nContent-Length: ${requestBody.length}\r\nConnection: close\r\n\r\n`), requestBody])
  return new Promise<RemotePacket>((resolve, reject) => {
    let buffered = Buffer.alloc(0), payload = Buffer.alloc(0), upgraded = false, settled = false, expectedAccept = ''
    const finish = (error?: Error, value?: RemotePacket) => { if (settled) return; settled = true; socket.destroy(); if (error) reject(error); else if (value) resolve(value) }
    const deadline = setTimeout(() => finish(new Error('手机连接超时')), 30000)
    socket.once('close', () => clearTimeout(deadline))
    socket.setTimeout(25000, () => finish(new Error('手机连接超时')))
    socket.once('error', () => finish(new Error('暂时无法连接电脑')))
    socket.once('close', () => { if (!settled) finish(new Error('手机连接中断')) })
    socket.once('secureConnect', () => {
      observe?.('tls-ready')
      const key = randomBytes(16).toString('base64')
      expectedAccept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
      socket.write(`GET ${target.path} HTTP/1.1\r\nHost: ${target.server}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${key}\r\n\r\n`)
    })
    socket.on('data', (chunk: Buffer) => {
      try {
        buffered = Buffer.concat([buffered, chunk])
        if (buffered.length > 1200000) throw new Error('响应超过限制')
        if (!upgraded) {
          const end = buffered.indexOf('\r\n\r\n'); if (end < 0) return
          const response = buffered.subarray(0, end).toString('ascii')
          if (!response.startsWith('HTTP/1.1 101 ') || /sec-websocket-accept:\s*([^\r\n]+)/i.exec(response)?.[1]?.trim() !== expectedAccept) throw new Error('手机连接校验失败')
          buffered = buffered.subarray(end + 4); upgraded = true; socket.write(maskedFrame(request))
          observe?.('ws-ready')
        }
        while (buffered.length >= 2) {
          const opcode = buffered[0]! & 15
          if ((buffered[0]! & 0x70) || (buffered[1]! & 0x80)) throw new Error('连接帧无效')
          let length = buffered[1]! & 127, start = 2
          if (length === 126) { if (buffered.length < 4) return; length = buffered.readUInt16BE(2); start = 4 }
          else if (length === 127) { if (buffered.length < 10) return; const large = buffered.readBigUInt64BE(2); if (large > 1200000n) throw new Error('响应超过限制'); length = Number(large); start = 10 }
          if (buffered.length < start + length) return
          const frame = buffered.subarray(start, start + length); buffered = buffered.subarray(start + length)
          observe?.(`frame-${opcode}-${length}`)
          if (opcode === 9) { socket.write(maskedFrame(frame, 10)); continue }
          if (opcode === 8) throw new Error('手机连接中断')
          if (opcode !== 0 && opcode !== 2) continue
          payload = Buffer.concat([payload, frame]); if (payload.length > 1100000) throw new Error('响应超过限制')
          if (payload.length < 2) continue
          if (payload[0] !== 0) throw new Error('手机连接版本无效')
          const offset = 2 + payload[1]!, headerEnd = payload.indexOf('\r\n\r\n', offset)
          if (headerEnd < 0) continue
          const headers = payload.subarray(offset, headerEnd).toString('ascii')
          if (!headers.startsWith('HTTP/1.1 200 ')) throw new Error('手机连接请求未完成')
          const size = Number(/content-length:\s*(\d+)/i.exec(headers)?.[1]); if (!Number.isSafeInteger(size) || size > 1000000) throw new Error('响应超过限制')
          if (payload.length < headerEnd + 4 + size) continue
          const result: unknown = JSON.parse(payload.subarray(headerEnd + 4, headerEnd + 4 + size).toString('utf8'))
          if (!result || typeof result !== 'object' || !('packet' in result)) throw new Error('响应格式无效')
          finish(undefined, RemotePacketSchema.parse(result.packet)); return
        }
      } catch { finish(new Error('手机连接校验失败')) }
    })
  })
}
