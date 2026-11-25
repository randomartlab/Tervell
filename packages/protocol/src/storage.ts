import { z } from 'zod'
import { EntityIdSchema, TimestampSchema, ToolCallStatusSchema, SessionSchema } from './session.ts'
import { KernelEventSchema } from './events.ts'
import { TimelineRowSchema } from './api.ts'

const Sequence = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const LeaseProofSchema = z.strictObject({ sessionId: EntityIdSchema, holderId: EntityIdSchema, fence: Sequence, claimKeyId: EntityIdSchema })
export const SessionLeaseSchema = LeaseProofSchema.extend({ expiresAt: TimestampSchema })
export type LeaseProof = z.infer<typeof LeaseProofSchema>
export type SessionLease = z.infer<typeof SessionLeaseSchema>
export const StoredEventSchema = z.strictObject({
  sessionId: EntityIdSchema, seq: Sequence, ts: TimestampSchema, turnId: EntityIdSchema, kernelEvent: KernelEventSchema,
})
export type StoredEvent = z.infer<typeof StoredEventSchema>
export const AppendEventInputSchema = StoredEventSchema.omit({ sessionId: true, seq: true })
export const AppendResultSchema = z.strictObject({ fromSeq: Sequence, toSeq: Sequence, count: Sequence })
export const JournalVolumeSchema = z.strictObject({ sessionId: EntityIdSchema, number: Sequence, firstSeq: Sequence, lastSeq: Sequence, archived: z.boolean() })
export type AppendEventInput = z.input<typeof AppendEventInputSchema>
export type AppendResult = z.infer<typeof AppendResultSchema>
export type JournalVolume = z.infer<typeof JournalVolumeSchema>

// 投影附加宿主 ownership；公共 API 可选用 TimelineRowSchema 暴露端侧摘要。
export const ProjectedTimelineRowSchema = TimelineRowSchema.safeExtend({ sessionId: EntityIdSchema, runId: EntityIdSchema, status: ToolCallStatusSchema.optional(), progress: z.number().min(0).max(100).optional() })
export type ProjectedTimelineRow = z.infer<typeof ProjectedTimelineRowSchema>

export const ProjectionCheckpointSchema = z.strictObject({
  version: z.literal(1), sessionId: EntityIdSchema, head: z.number().int().nonnegative(),
  seen: z.array(z.tuple([Sequence, z.string()])), runHeads: z.array(z.tuple([EntityIdSchema, Sequence])),
  items: z.array(z.tuple([z.string(), ProjectedTimelineRowSchema])),
})
export type ProjectionCheckpoint = z.infer<typeof ProjectionCheckpointSchema>

export const JournalArchiveHeaderSchema = z.strictObject({ format: z.literal('proma-journal'), version: z.literal(1), session: SessionSchema })
export type JournalArchiveHeader = z.infer<typeof JournalArchiveHeaderSchema>

const Capacity = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const JournalRetentionPolicySchema = z.strictObject({
  maxEventBytes: Capacity.default(2 * 1024 * 1024),
  maxSessionBytes: Capacity.default(128 * 1024 * 1024),
  maxTotalBytes: Capacity.default(2 * 1024 * 1024 * 1024),
  maxSessionEvents: Capacity.default(1000000),
  archivedAfterMs: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(90 * 86400000),
})
export type JournalRetentionPolicy = z.input<typeof JournalRetentionPolicySchema>
