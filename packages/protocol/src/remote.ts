import {MobileControlCallSchema} from './mobile-control.ts'
import { z } from 'zod'
import { ApiRequestSchema } from './api.ts'
const Id = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/)
const Secret = z.string().regex(/^[a-f0-9]{64}$/)
export const RelayUrlSchema = z.string().url().refine((value) => {
  const url = new URL(value)
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && value.endsWith('/')
}, '中转地址须为不含凭据的 HTTPS 地址，并以 / 结尾')
export const RemoteTunnelDescriptorSchema = z.strictObject({
  server: z.string().regex(/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/),
  port: z.literal(443), path: z.string().regex(/^\/[a-zA-Z0-9_-]{16,128}$/),
  clientId: z.uuid(), targetHost: z.literal('127.0.0.1'), targetPort: z.number().int().min(1024).max(65535),
})
export const RemoteTunnelProfileSchema = z.strictObject({
  version: z.literal(1), tunnel: RemoteTunnelDescriptorSchema,
  sshHost: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/),
})
export type RemoteTunnelDescriptor = z.infer<typeof RemoteTunnelDescriptorSchema>
export type RemoteTunnelProfile = z.infer<typeof RemoteTunnelProfileSchema>
const LegacyPairing = z.strictObject({
  v: z.literal(1), relay: RelayUrlSchema, room: Secret, token: Secret, key: Secret,
  hostId: Id, deviceId: Id, expiresAt: z.number().int().positive(),
})
const TunnelPairing = LegacyPairing.omit({ v: true, relay: true }).extend({ v: z.literal(2), tunnel: RemoteTunnelDescriptorSchema })
const DirectPairing = LegacyPairing.omit({ v: true, relay: true }).extend({
  v: z.literal(3),
  direct: z.strictObject({ url: z.string().url().refine(value => { const url=new URL(value); return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/' }), certificateSha256: z.string().regex(/^[a-f0-9]{64}$/) }),
})
const HostedPairing = LegacyPairing.omit({ v: true, relay: true }).extend({ v: z.literal(4), service: z.literal('random-market') })
export const RemotePairingSchema = z.discriminatedUnion('v', [LegacyPairing, TunnelPairing, DirectPairing, HostedPairing])
export type RemotePairing = z.infer<typeof RemotePairingSchema>
export const RemotePacketSchema = z.strictObject({
  v: z.literal(1), hostId: Id, deviceId: Id, direction: z.enum(['to-host', 'to-device']),
  seq: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  nonce: z.string().regex(/^[a-f0-9]{24}$/), ciphertext: z.string().min(32).max(900000).regex(/^[a-f0-9]+$/),
})
export type RemotePacket = z.infer<typeof RemotePacketSchema>
const base = { id: z.string().uuid(), sentAt: z.number().int().positive() }
const Session = { sessionId: Id }
export const RemoteRequestSchema = z.discriminatedUnion('method', [
  z.strictObject({ ...base, method: z.literal('pair'), deviceKey: Secret, deviceToken: Secret }),
  z.strictObject({ ...base, method: z.literal('sessions') }),
  z.strictObject({ ...base, method: z.literal('create'), workspaceId: Id, title: z.string().max(200).optional() }),
  z.strictObject({ ...base, method: z.literal('messages'), ...Session, before: z.number().int().nonnegative().optional(), knownRevision: z.string().regex(/^[a-f0-9]{64}$/).optional() }),
  z.strictObject({ ...base, method: z.literal('send'), ...Session, text: z.string().trim().min(1).max(32000), clientMessageId: z.string().uuid() }),
  z.strictObject({ ...base, method: z.literal('stop'), ...Session }),
  z.strictObject({ ...base, method: z.literal('approvals') }),
  z.strictObject({ ...base, method: z.literal('approve'), requestId: Id, decision: z.enum(['allow', 'deny']) }),
  z.strictObject({ ...base, method: z.literal('interactions') }),
  z.strictObject({ ...base, method: z.literal('answer'), requestId: Id, answers: z.record(z.string().max(2000), z.string().max(4000)).refine((value) => Object.keys(value).length <= 10) }),
  z.strictObject({ ...base, method: z.literal('plan'), requestId: Id, decision: z.enum(['allow', 'deny']) }),
  z.strictObject({ ...base, method: z.literal('status') }),
  z.strictObject({ ...base, method: z.literal('control'), call: MobileControlCallSchema }),
  z.strictObject({ ...base, method: z.literal('rpc'), request: ApiRequestSchema }),
])
export type RemoteRequest = z.infer<typeof RemoteRequestSchema>
export const RemoteResponseSchema = z.strictObject({ id: z.string().uuid(), ok: z.boolean(), data: z.unknown().optional(), error: z.string().max(300).optional() })
export type RemoteResponse = z.infer<typeof RemoteResponseSchema>
export const RemoteConfigureSchema = z.strictObject({ enabled: z.boolean(), workspaceIds: z.array(Id).max(10000).default([]), allWorkspaces:z.boolean().optional(), allowManagement:z.boolean().optional(), connectionMode:z.enum(['auto','lan','random']).optional() })
export type RemoteSettingsInput = z.infer<typeof RemoteConfigureSchema>
