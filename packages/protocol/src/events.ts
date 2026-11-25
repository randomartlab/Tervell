import { z } from 'zod'
import { EntityIdSchema, MessageSchema, ToolCallSchema, ToolCallStatusSchema, ToolKindSchema } from './session.ts'

const Count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const EventPositionSchema = z.object({ runId: EntityIdSchema, seq: Count.positive() })
export const UsageSchema = z.object({
  inputTokens: Count.optional(), outputTokens: Count.optional(), contextTokens: Count.optional(), contextWindow: Count.optional(),
  cost: z.number().nonnegative().optional(), costScope: z.enum(['turn', 'session']).optional(), tokenScope: z.enum(['turn', 'session']).optional(), model: z.string().optional(),
})
export const PlanStepSchema = z.object({
  id: EntityIdSchema, title: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']), result: z.string().optional(),
})
export const PermissionActionSchema = z.object({
  id: EntityIdSchema, label: z.string().min(1), behavior: z.enum(['allow', 'deny', 'variant']),
  variant: z.string().optional(),
})
export const PermissionRequestSchema = z.object({
  requestId: EntityIdSchema, kind: ToolKindSchema, tool: z.string().min(1),
  input: z.record(z.string(), z.json()), summary: z.string(), actions: z.array(PermissionActionSchema).min(1),
})
export const ToolPatchSchema = z.object({
  status: ToolCallStatusSchema.optional(), result: z.string().optional(), error: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  name: z.string().nullable().optional(), title: z.string().nullable().optional(), kind: ToolKindSchema.optional(),
  input: z.json().optional(), metadata: z.record(z.string(),z.json()).nullable().optional(), locations: z.array(z.json()).nullable().optional(),
}).refine((patch) => Object.values(patch).some((value) => value !== undefined), '工具更新不能为空')
export const CompactionInfoSchema = z.object({
  strategy: z.enum(['summarize', 'drop-middle', 'tool-only']), compactionId: EntityIdSchema.optional(), summaryContent: z.array(z.json()).optional(), error: z.string().nullable().optional(), metadata: z.record(z.string(), z.json()).nullable().optional(), status: z.enum(['in_progress', 'completed', 'failed', 'cancelled']).optional(), originalTokens: Count.optional(),
  compactedTokens: Count.optional(), summary: z.string().optional(),
})
export const KernelErrorSchema = z.object({
  code: z.string().min(1), message: z.string(), recoverable: z.boolean(), raw: z.json().optional(),
})
export const DoneReasonSchema = z.enum(['stop', 'max-tokens', 'tool-use', 'error', 'cancelled'])

export const MessageDeltaEventSchema = EventPositionSchema.extend({
  t: z.literal('message.delta'), index: Count, text: z.string(), kind: z.enum(['text', 'thinking']).default('text'),
})
export const MessageFinalEventSchema = EventPositionSchema.extend({
  t: z.literal('message.final'), message: MessageSchema.extend({ role: z.literal('assistant') }),
})
export const ToolCallEventSchema = EventPositionSchema.extend({ t: z.literal('tool.call'), call: ToolCallSchema })
export const ToolUpdateEventSchema = EventPositionSchema.extend({ t: z.literal('tool.update'), callId: EntityIdSchema, patch: ToolPatchSchema })
export const PlanUpdateEventSchema = EventPositionSchema.extend({ t: z.literal('plan.update'), steps: z.array(PlanStepSchema) })
export const PermissionRequestEventSchema = EventPositionSchema.extend({ t: z.literal('permission.request'), req: PermissionRequestSchema })
export const UsageEventSchema = EventPositionSchema.extend({ t: z.literal('usage'), usage: UsageSchema })
export const CompactionEventSchema = EventPositionSchema.extend({ t: z.literal('compaction'), info: CompactionInfoSchema })
export const RetryEventSchema = EventPositionSchema.extend({
  t: z.literal('retry'), attempt: Count.positive(), reason: z.string(), maxAttempts: Count.positive().optional(), retryAfterMs: Count.optional(),
})
export const ErrorEventSchema = EventPositionSchema.extend({ t: z.literal('error'), err: KernelErrorSchema })
export const DoneEventSchema = EventPositionSchema.extend({ t: z.literal('done'), reason: DoneReasonSchema })

/** RAE/14 §6：每个 run 内 seq 严格递增，由事件流持有者检查顺序。 */
export const KernelEventSchema = z.discriminatedUnion('t', [
  MessageDeltaEventSchema, MessageFinalEventSchema, ToolCallEventSchema, ToolUpdateEventSchema,
  PlanUpdateEventSchema, PermissionRequestEventSchema, UsageEventSchema, CompactionEventSchema,
  RetryEventSchema, ErrorEventSchema, DoneEventSchema,
])
export type KernelEvent = z.infer<typeof KernelEventSchema>
export type MessageDeltaEvent = z.infer<typeof MessageDeltaEventSchema>
export type MessageFinalEvent = z.infer<typeof MessageFinalEventSchema>
export type ToolCallEvent = z.infer<typeof ToolCallEventSchema>
export type ToolUpdateEvent = z.infer<typeof ToolUpdateEventSchema>
export type PlanUpdateEvent = z.infer<typeof PlanUpdateEventSchema>
export type PermissionRequestEvent = z.infer<typeof PermissionRequestEventSchema>
export type UsageEvent = z.infer<typeof UsageEventSchema>
export type CompactionEvent = z.infer<typeof CompactionEventSchema>
export type RetryEvent = z.infer<typeof RetryEventSchema>
export type ErrorEvent = z.infer<typeof ErrorEventSchema>
export type DoneEvent = z.infer<typeof DoneEventSchema>
export type PermissionRequest = z.infer<typeof PermissionRequestSchema>
export type Usage = z.infer<typeof UsageSchema>
export type ToolPatch = z.infer<typeof ToolPatchSchema>
export type PlanStep = z.infer<typeof PlanStepSchema>
export type KernelError = z.infer<typeof KernelErrorSchema>
export type CompactionInfo = z.infer<typeof CompactionInfoSchema>
export type DoneReason = z.infer<typeof DoneReasonSchema>

export function assertNever(value: never): never {
  throw new Error(`未处理的内核事件：${JSON.stringify(value)}`)
}
export function eventTypeOf(event: KernelEvent): KernelEvent['t'] { return event.t }

/** 未知/损坏的 JSON 事件必须可观测，并保留上游原文。 */
export function normalizeKernelEvent(input: unknown, position: z.infer<typeof EventPositionSchema>): KernelEvent {
  const parsed = KernelEventSchema.safeParse(input)
  if (parsed.success) return parsed.data
  const raw = z.json().safeParse(input)
  return ErrorEventSchema.parse({ ...position, t: 'error', err: {
    code: 'invalid_kernel_event', message: parsed.error.message, recoverable: true,
    raw: raw.success ? raw.data : String(input),
  } })
}
