import { z } from 'zod'
import { EntityIdSchema } from './session.ts'
const Empty = z.strictObject({}), Text = z.string().trim().min(1).max(32000)
export const ProductAutomationSchema = z.strictObject({ id: EntityIdSchema, name: z.string(), active: z.boolean(), scheduleType: z.string(), workspaceId: EntityIdSchema })
export const ProductDelegationSchema = z.strictObject({ id: EntityIdSchema, sessionId: EntityIdSchema, status: z.enum(['running','completed','failed','stopped']), summary: z.string().optional() })
export const EXTENDED_TOOL_CONTRACTS = {
  automation_list: { input: Empty, output: z.strictObject({ automations: z.array(ProductAutomationSchema).max(200) }) },
  automation_create: { input: z.strictObject({ name: z.string().trim().min(1).max(200), prompt: Text, scheduledAt: z.number().int().positive() }), output: ProductAutomationSchema },
  automation_set_active: { input: z.strictObject({ id: EntityIdSchema, active: z.boolean() }), output: ProductAutomationSchema },
  delegation_start: { input: z.strictObject({ task: Text, title: z.string().max(200).optional() }), output: ProductDelegationSchema },
  delegation_list: { input: Empty, output: z.strictObject({ delegations: z.array(ProductDelegationSchema).max(100) }) },
  delegation_stop: { input: z.strictObject({ id: EntityIdSchema }), output: z.strictObject({ stopped: z.boolean() }) },
  worktree_list: { input: Empty, output: z.strictObject({ worktrees: z.array(z.strictObject({ path: z.string(), branch: z.string(), current: z.boolean() })).max(100) }) },
  worktree_create: { input: z.strictObject({ name: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/) }), output: z.strictObject({ path: z.string(), branch: z.string() }) },
  files_search: { input: z.strictObject({ query: z.string().min(1).max(200), limit: z.number().int().min(1).max(100).default(50) }), output: z.strictObject({ files: z.array(z.string()).max(100), truncated: z.boolean() }) },
} as const
export type ExtendedToolMethod = keyof typeof EXTENDED_TOOL_CONTRACTS
export type ExtendedToolInput<M extends ExtendedToolMethod> = z.infer<(typeof EXTENDED_TOOL_CONTRACTS)[M]['input']>
export type ExtendedToolOutput<M extends ExtendedToolMethod> = z.infer<(typeof EXTENDED_TOOL_CONTRACTS)[M]['output']>
