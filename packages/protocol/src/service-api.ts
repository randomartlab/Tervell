import {z} from 'zod'
import {EntityIdSchema,ClientKindSchema} from './session.ts'
const Id=z.strictObject({id:EntityIdSchema}),Empty=z.strictObject({}),Seq=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const ServiceEventSchema=z.strictObject({seq:Seq.positive(),ts:Seq,turnId:EntityIdSchema,event:z.json(),truncated:z.boolean(),userMessage:z.strictObject({id:EntityIdSchema,text:z.string(),createdAt:Seq,truncated:z.boolean()}).optional()})
export const PublicLeaseSchema=z.strictObject({holderId:EntityIdSchema,fence:Seq.positive(),expiresAt:Seq,mine:z.boolean()})
const LeaseResult=z.strictObject({lease:PublicLeaseSchema.nullable()})
export const SERVICE_API_CONTRACTS={
 'session.events':{request:Id.extend({afterSeq:Seq.default(0),epoch:z.string().min(1).optional(),limit:z.number().int().min(1).max(200).default(100)}),response:z.strictObject({id:EntityIdSchema,epoch:z.string(),headSeq:Seq,events:z.array(ServiceEventSchema),hasMore:z.boolean(),reset:z.boolean(),executionStatus:z.enum(['idle','queued','running','completed','failed','interrupted','capacity-exceeded']).optional()})},
 'lease.status':{request:Id,response:LeaseResult},
 'lease.acquire':{request:Id,response:LeaseResult},
 'lease.renew':{request:Id.extend({fence:Seq.positive()}),response:LeaseResult},
 'lease.release':{request:Id.extend({fence:Seq.positive()}),response:LeaseResult},
 'lease.transfer':{request:Id.extend({expectedFence:Seq.positive(),confirm:z.literal('transfer-writer')}),response:LeaseResult},
 'module.catalog':{request:z.strictObject({clientKind:ClientKindSchema}),response:z.strictObject({modules:z.array(z.strictObject({id:z.string(),state:z.enum(['ready','unavailable','read-only']),badge:Seq}))})},
 'files.tree':{request:Id.extend({path:z.string().max(2048).default('.'),depth:z.number().int().min(1).max(3).default(1)}),response:z.strictObject({entries:z.array(z.strictObject({path:z.string(),kind:z.enum(['file','directory']),size:Seq})).max(500),truncated:z.boolean()})},
 'files.diff':{request:Id.extend({path:z.string().min(1).max(2048)}),response:z.strictObject({diff:z.string(),truncated:z.boolean()})},
 'terminal.list':{request:Id,response:z.strictObject({terminals:z.array(z.strictObject({termId:z.string().uuid()})).max(8)})},
 'terminal.create':{request:Id.extend({command:z.string().min(1).max(4096),args:z.array(z.string().max(16000)).max(100).default([])}),response:z.strictObject({termId:z.string().uuid()})},
 'terminal.attach':{request:Id.extend({termId:z.string().uuid()}),response:z.strictObject({output:z.string(),truncated:z.boolean(),exitStatus:z.strictObject({exitCode:z.number().int().optional(),signal:z.string().optional()}).optional()})},
 'terminal.kill':{request:Id.extend({termId:z.string().uuid()}),response:z.strictObject({stopped:z.boolean()})},
 'terminal.release':{request:Id.extend({termId:z.string().uuid()}),response:z.strictObject({released:z.boolean()})},
} as const
export type ServiceApiMethod=keyof typeof SERVICE_API_CONTRACTS
