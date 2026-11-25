import {SERVICE_API_CONTRACTS} from './service-api.ts'
import { z } from 'zod'
import { ApprovalSchema, ClientKindSchema, EntityIdSchema, SessionSchema } from './session.ts'
import type { ClientKind } from './session.ts'

const Seq = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const Empty = z.strictObject({})
const IdParams = z.strictObject({ id: EntityIdSchema })
const Cursor = z.strictObject({ epoch: z.string().min(1), seq: Seq })
export const TimelineRowSchema = z.strictObject({
  id: EntityIdSchema, turnId: EntityIdSchema, seqStart: Seq, seqEnd: Seq,
  kind: z.enum(['text', 'thinking', 'tool', 'plan', 'approval', 'error', 'status']), summary: z.string(), role:z.enum(['user','assistant','system']).optional(),
  sourceSeqRanges: z.array(z.strictObject({ start: Seq, end: Seq }).refine((range) => range.start <= range.end, '区间倒置')).optional(),
}).refine((row) => row.seqStart <= row.seqEnd, '时间线序号倒置')
const TimelineResponse = z.strictObject({
  epoch: z.string().min(1), rows: z.array(TimelineRowSchema), hasOlder: z.boolean(), hasNewer: z.boolean(),
  endCursor: Cursor.optional(), reset: z.boolean().optional(), gap: z.boolean().optional(),
})
const PendingApproval = ApprovalSchema.extend({ sessionId: EntityIdSchema, allowedDecisions: z.array(z.enum(['allow', 'allow-session', 'deny'])).optional() })

/** W1 最小领域面；每个方法同时持有请求和响应，后续领域在此追加。 */
export const API_CONTRACTS = {
  ...SERVICE_API_CONTRACTS,
  'session.list': {
    request: z.strictObject({ generation: z.string().optional(), afterSeq: Seq.optional(), cursor:z.string().max(4096).optional(), limit: z.number().int().min(1).max(200).default(50) }),
    response: z.strictObject({
      generation: z.string().min(1), headSeq: Seq, mode: z.enum(['snapshot', 'changes']), entries: z.array(SessionSchema),
      removals: z.array(z.strictObject({ id: EntityIdSchema, seq: Seq })),
      pageInfo: z.strictObject({ hasMore: z.boolean(), nextCursor: z.string().optional() }),
    }),
  },
  'session.detail': { request: IdParams, response: z.strictObject({ session: SessionSchema.nullable() }) },
  'session.timeline': {
    request: IdParams.extend({ direction: z.enum(['tail', 'before', 'after']), cursor: Cursor.optional(), limit: z.number().int().min(1).max(200), wholeTurns: z.literal(true) }),
    response: TimelineResponse,
  },
  'session.send': {
    request: IdParams.extend({ text: z.string().min(1), clientMessageId: EntityIdSchema, attachments: z.array(z.strictObject({ id: EntityIdSchema, name: z.string().min(1), mimeType: z.string().min(1) })).optional() }),
    response: z.strictObject({ clientMessageId: EntityIdSchema, accepted: z.boolean() }),
  },
  'session.queue': { request: IdParams.extend({ text: z.string().min(1),clientMessageId:EntityIdSchema.optional() }), response: z.strictObject({ queuedMessageId: EntityIdSchema }) },
  'session.interrupt': { request: IdParams, response: z.strictObject({ interrupted: z.boolean() }) },
  'session.subscribe': { request: z.strictObject({ ids: z.array(EntityIdSchema).min(1).max(100), cursors:z.record(EntityIdSchema,z.strictObject({epoch:z.string().min(1),seq:Seq})).optional() }), response: z.strictObject({ subscriptionId: EntityIdSchema }) },
  'approval.list': { request: Empty, response: z.strictObject({ approvals: z.array(PendingApproval) }) },
  'approval.respond': { request: z.strictObject({ requestId: EntityIdSchema, decision: z.enum(['allow', 'allow-session', 'deny']) }), response: z.strictObject({ requestId: EntityIdSchema, resolved: z.boolean() }) },
  'revision.probe': { request: z.strictObject({ entity: z.enum(['sessions', 'workspaces', 'projects', 'skills', 'connections', 'automations']), scope: z.string().min(1) }), response: z.strictObject({ revision: z.string().min(1) }) },
  'host.status': { request: Empty, response: z.strictObject({ hostId: EntityIdSchema, status: z.enum(['online', 'degraded', 'offline']), version: z.string().min(1) }) },
} as const
export type ApiMethod = keyof typeof API_CONTRACTS
export type ApiParams<M extends ApiMethod> = z.input<(typeof API_CONTRACTS)[M]['request']>
export type ApiResult<M extends ApiMethod> = z.output<(typeof API_CONTRACTS)[M]['response']>
export const ApiMethodSchema = z.enum(Object.keys(API_CONTRACTS) as [ApiMethod, ...ApiMethod[]])
const MobileMethods = [
  'session.events','lease.status','lease.acquire','lease.renew','lease.release','lease.transfer',
  'module.catalog','files.tree','files.diff','terminal.list','terminal.create','terminal.attach','terminal.kill','terminal.release',
  'session.list', 'session.detail', 'session.timeline', 'session.send', 'session.queue',
  'session.interrupt', 'session.subscribe', 'approval.list', 'approval.respond', 'revision.probe', 'host.status',
] as const satisfies readonly ApiMethod[]
export const CLIENT_METHODS: Readonly<Record<ClientKind, readonly ApiMethod[]>> = {
  desktop: ApiMethodSchema.options, web: ApiMethodSchema.options, cli: ApiMethodSchema.options, mobile: MobileMethods,
}
export function assertApiMethodAllowed(clientKind: string, method: string): asserts method is ApiMethod {
  const client = ClientKindSchema.safeParse(clientKind)
  if (!client.success || !CLIENT_METHODS[client.data].some((allowed) => allowed === method)) throw new Error(`403：客户端 ${clientKind} 不允许调用 ${method}`)
}
const envelope = { clientKind: ClientKindSchema, requestId: EntityIdSchema }
// 显式联合保留 method 与 params 的 TypeScript 关联；注册表仍是字段定义的唯一来源。
const Request = <M extends ApiMethod, S extends z.ZodType>(method: M, params: S) => z.strictObject({ ...envelope, method: z.literal(method), params })
export const ApiRequestSchema = z.discriminatedUnion('method', [
  Request('session.events',SERVICE_API_CONTRACTS['session.events'].request),
  Request('lease.status',SERVICE_API_CONTRACTS['lease.status'].request),
  Request('lease.acquire',SERVICE_API_CONTRACTS['lease.acquire'].request),
  Request('lease.renew',SERVICE_API_CONTRACTS['lease.renew'].request),
  Request('lease.release',SERVICE_API_CONTRACTS['lease.release'].request),
  Request('lease.transfer',SERVICE_API_CONTRACTS['lease.transfer'].request),
  Request('module.catalog',SERVICE_API_CONTRACTS['module.catalog'].request),
  Request('files.tree',SERVICE_API_CONTRACTS['files.tree'].request),
  Request('files.diff',SERVICE_API_CONTRACTS['files.diff'].request),
  Request('terminal.list',SERVICE_API_CONTRACTS['terminal.list'].request),
  Request('terminal.create',SERVICE_API_CONTRACTS['terminal.create'].request),
  Request('terminal.attach',SERVICE_API_CONTRACTS['terminal.attach'].request),
  Request('terminal.kill',SERVICE_API_CONTRACTS['terminal.kill'].request),
  Request('terminal.release',SERVICE_API_CONTRACTS['terminal.release'].request),
  Request('session.list', API_CONTRACTS['session.list'].request), Request('session.detail', API_CONTRACTS['session.detail'].request), Request('session.timeline', API_CONTRACTS['session.timeline'].request), Request('session.send', API_CONTRACTS['session.send'].request), Request('session.queue', API_CONTRACTS['session.queue'].request),
  Request('session.interrupt', API_CONTRACTS['session.interrupt'].request), Request('session.subscribe', API_CONTRACTS['session.subscribe'].request), Request('approval.list', API_CONTRACTS['approval.list'].request), Request('approval.respond', API_CONTRACTS['approval.respond'].request), Request('revision.probe', API_CONTRACTS['revision.probe'].request), Request('host.status', API_CONTRACTS['host.status'].request),
]).superRefine((request, ctx) => {
  if (!CLIENT_METHODS[request.clientKind].some((method) => method === request.method)) ctx.addIssue({ code: 'custom', path: ['method'], message: '403：方法未授权' })
})
export type ApiRequest = z.infer<typeof ApiRequestSchema>

export function parseApiResponse<M extends ApiMethod>(method: M, clientKind: ClientKind, input: unknown): ApiResult<M>
export function parseApiResponse(method: ApiMethod, clientKind: ClientKind, input: unknown): ApiResult<ApiMethod> {
  assertApiMethodAllowed(clientKind, method)
  if (method === 'session.timeline') {
    const result = TimelineResponse.parse(input)
    if (clientKind === 'mobile') return { ...result, rows: result.rows.map(({ sourceSeqRanges: _ranges, ...row }) => row) }
    return result
  }
  return API_CONTRACTS[method].response.parse(input)
}
