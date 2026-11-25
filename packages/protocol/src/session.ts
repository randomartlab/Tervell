import { z } from 'zod'
import { KernelIdSchema } from './kernel.ts'

/**
 * 会话契约层（对标 RAE/03 §9.2–9.3）
 *
 * 定义会话、轮次、消息、工具调用、批准的数据模型。
 * 这些类型是跨包共享的唯一真源（I-05），不得在业务包中复制定义。
 *
 * schemaVersion = 2（与 03 §9.2 一致；迁移由 ST-01 负责）
 * 轮次与事件不内嵌在 Session 里，事件日志是独立真源（03 §9.3）。
 */

export const SCHEMA_VERSION = 2

// ── 标识符与时间戳 ──

export const EntityIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, '实体 ID 只能包含字母、数字、_ 和 -')
export type EntityId = z.infer<typeof EntityIdSchema>

export const TimestampSchema = z.number().int().nonnegative()
export type Timestamp = z.infer<typeof TimestampSchema>

// ── 会话元数据 ──

/** 客户端类型（API-03 方法白名单按此裁剪） */
export const ClientKindSchema = z.enum(['desktop', 'web', 'mobile', 'cli'])
export type ClientKind = z.infer<typeof ClientKindSchema>

/** 权限四档 + plan（SEC-01；与 03 §9.2 permissionMode 一致） */
export const PermissionModeSchema = z.enum(['read-only', 'ask', 'accept-edits', 'auto', 'plan'])
export type PermissionMode = z.infer<typeof PermissionModeSchema>

// ── 消息与内容 ──

export const ContentPartSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('thinking'), text: z.string() }),
  z.object({ type: z.literal('tool-call'), toolCallId: z.string(), name: z.string(), input: z.record(z.string(), z.unknown()).optional() }),
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    url: z.url(),
    mimeType: z.string().optional(),
  }),
  z.object({
    type: z.literal('tool-result'),
    toolUseId: z.string(),
    content: z.string(),
    isError: z.boolean().optional(),
  }),
])
export type ContentPart = z.infer<typeof ContentPartSchema>

export const MessageSchema = z.object({
  id: EntityIdSchema,
  role: z.enum(['user', 'assistant']),
  content: z.array(ContentPartSchema),
  createdAt: TimestampSchema,
})
export type Message = z.infer<typeof MessageSchema>

// ── 工具调用与批准 ──

/** 工具类别：权限判定与审查的维度 */
export const ToolKindSchema = z.enum(['read', 'edit', 'delete', 'execute', 'fetch', 'search', 'other'])
export type ToolKind = z.infer<typeof ToolKindSchema>

export const ToolCallStatusSchema = z.enum(['pending', 'running', 'succeeded', 'failed', 'rejected'])
export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>

export const ToolCallSchema = z.object({
  id: EntityIdSchema,
  kind: ToolKindSchema,
  name: z.string(),
  input: z.record(z.string(), z.unknown()).optional(),
  status: ToolCallStatusSchema,
  /** 执行结果或错误信息 */
  result: z.string().optional(),
  error: z.string().optional(),
  executedAt: TimestampSchema.optional(),
})
export type ToolCall = z.infer<typeof ToolCallSchema>

export const ApprovalOutcomeSchema = z.enum(['approved', 'rejected', 'auto-approved'])
export type ApprovalOutcome = z.infer<typeof ApprovalOutcomeSchema>

export const ApprovalSchema = z.object({
  id: EntityIdSchema,
  kind: ToolKindSchema,
  toolCallId: EntityIdSchema,
  /** 人可读的请求摘要 */
  request: z.string(),
  /** 用户选择的作用域：仅一次 / 本会话 */
  scope: z.enum(['once', 'session']).optional(),
  outcome: ApprovalOutcomeSchema.optional(),
  reason: z.string().optional(),
  createdAt: TimestampSchema,
  respondedAt: TimestampSchema.optional(),
})
export type Approval = z.infer<typeof ApprovalSchema>

// ── 轮次 ──

export const TurnSchema = z.object({
  id: EntityIdSchema,
  /** 在同一会话内的单调递增序号 */
  seq: z.number().int().positive(),
  /** 用户消息序号（第几次用户输入） */
  userMessageIndex: z.number().int().nonnegative(),
  messages: z.array(MessageSchema),
  toolCalls: z.array(ToolCallSchema).optional(),
  approvals: z.array(ApprovalSchema).optional(),
  createdAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  stopReason: z.enum(['stop', 'max-tokens', 'tool-use', 'error']).optional(),
  usage: z
    .object({
      inputTokens: z.number().int().nonnegative().optional(),
      outputTokens: z.number().int().nonnegative().optional(),
      cost: z.number().optional(),
    })
    .optional(),
})
export type Turn = z.infer<typeof TurnSchema>

// ── 会话 ──

export const SessionSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: EntityIdSchema,
  title: z.string(),
  workspaceId: EntityIdSchema.optional(),
  /** 内核 id（来自内核注册表，开放字符串） */
  kernelId: KernelIdSchema,
  /** 内核会话句柄（如果内核提供原生会话支持） */
  kernelSessionRef: z.string().optional(),
  model: z
    .object({
      provider: z.string(),
      modelId: z.string(),
      reasoning: z.string().optional(),
    })
    .optional(),
  /** 权限档位（SEC-01） */
  permissionMode: PermissionModeSchema.default('ask'),
  cwdMode: z.enum(['project', 'session']).default('project'),
  worktree: z.object({ path: z.string(), base: z.string(), branch: z.string() }).optional(),
  attachedDirectories: z.array(z.string()).default([]),
  attachedFiles: z.array(z.string()).default([]),
  /** 会话关系（exploration、delegation） */
  relations: z
    .object({
      parentSessionId: EntityIdSchema.optional(),
      explorationOf: z
        .object({
          sessionId: EntityIdSchema,
          messageId: EntityIdSchema,
        })
        .optional(),
      delegationOf: EntityIdSchema.optional(),
    })
    .optional(),
  flags: z
    .object({
      pinned: z.boolean().optional(),
      starred: z.boolean().optional(),
      archived: z.boolean().optional(),
      draft: z.boolean().optional(),
    })
    .default({}),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})
export type Session = z.infer<typeof SessionSchema>
export type SessionInput = z.input<typeof SessionSchema>
