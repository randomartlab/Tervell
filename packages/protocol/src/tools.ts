import { z } from 'zod'
import { EntityIdSchema, TimestampSchema, ToolKindSchema } from './session.ts'
import { PermissionPolicySchema } from './permission.ts'

export const ToolContextSchema = z.strictObject({
  sessionId: EntityIdSchema, workspaceId: EntityIdSchema, permission: PermissionPolicySchema,
  triggeredBy: z.enum(['user', 'external', 'automation', 'delegation']),
})
export type ToolContext = z.infer<typeof ToolContextSchema>
export const ToolMetadataSchema = z.strictObject({
  name: z.string().regex(/^mcp__proma__[a-z][a-z0-9_]{0,63}$/), description: z.string().min(1).max(2000),
  kind: ToolKindSchema, effect: z.enum(['read', 'write', 'delete', 'external']),
})
export type ToolMetadata = z.infer<typeof ToolMetadataSchema>
export const AcpStdioMcpServerSchema = z.strictObject({
  name: z.literal('proma'), command: z.string().min(1), args: z.array(z.string()),
  env: z.array(z.strictObject({ name: z.string().min(1), value: z.string() })),
})
export type AcpStdioMcpServer = z.infer<typeof AcpStdioMcpServerSchema>
const Text = z.string().trim().min(1).max(500)
const PlanningTime = TimestampSchema.positive()
export const ProductTodoSchema = z.strictObject({
  id: EntityIdSchema, workspaceId: EntityIdSchema, title: Text, notes: z.string().max(32000).optional(),
  status: z.enum(['open', 'completed']), dueAt: PlanningTime.nullable().optional(), updatedAt: PlanningTime,
})
export const ProductCalendarEventSchema = z.strictObject({
  id: EntityIdSchema, workspaceId: EntityIdSchema, title: Text, notes: z.string().max(32000).optional(),
  startAt: PlanningTime, endAt: PlanningTime.nullable().optional(), updatedAt: PlanningTime,
}).refine((value) => value.endAt == null || value.endAt >= value.startAt, '结束时间早于开始时间')
export type ProductTodo = z.infer<typeof ProductTodoSchema>
export type ProductCalendarEvent = z.infer<typeof ProductCalendarEventSchema>
const Empty = z.strictObject({})
export const PRODUCT_TOOL_CONTRACTS = {
  todo_list: { input: Empty, output: z.strictObject({ todos: z.array(ProductTodoSchema).max(200) }) },
  todo_create: { input: z.strictObject({ title: Text, notes: z.string().max(32000).optional(), dueAt: PlanningTime.optional() }), output: ProductTodoSchema },
  todo_update: { input: z.strictObject({ id: EntityIdSchema, expectedUpdatedAt: PlanningTime, title: Text.optional(), status: z.enum(['open', 'completed']).optional(), dueAt: PlanningTime.nullable().optional() }), output: ProductTodoSchema },
  todo_delete: { input: z.strictObject({ id: EntityIdSchema, expectedUpdatedAt: PlanningTime }), output: z.strictObject({ deleted: z.boolean() }) },
  calendar_list: { input: Empty, output: z.strictObject({ events: z.array(ProductCalendarEventSchema).max(200) }) },
  calendar_create: { input: z.strictObject({ title: Text, notes: z.string().max(32000).optional(), startAt: PlanningTime, endAt: PlanningTime.optional() }).refine((value) => value.endAt === undefined || value.endAt >= value.startAt, '结束时间早于开始时间'), output: ProductCalendarEventSchema },
  calendar_update: { input: z.strictObject({ id: EntityIdSchema, expectedUpdatedAt: PlanningTime, title: Text.optional(), startAt: PlanningTime.optional(), endAt: PlanningTime.nullable().optional() }), output: ProductCalendarEventSchema },
  calendar_delete: { input: z.strictObject({ id: EntityIdSchema, expectedUpdatedAt: PlanningTime }), output: z.strictObject({ deleted: z.boolean() }) },
} as const
export type ProductToolMethod = keyof typeof PRODUCT_TOOL_CONTRACTS
export type ProductToolInput<M extends ProductToolMethod> = z.infer<(typeof PRODUCT_TOOL_CONTRACTS)[M]['input']>
export type ProductToolOutput<M extends ProductToolMethod> = z.infer<(typeof PRODUCT_TOOL_CONTRACTS)[M]['output']>
