import { z } from 'zod'
import { PermissionModeSchema, ToolKindSchema } from './session.ts'

/** 执行权限与 plan 正交；Session v2 的旧枚举仅作为兼容输入。 */
export const ExecutionPermissionModeSchema = z.enum(['read-only', 'ask', 'accept-edits', 'auto'])
export const PermissionPolicySchema = z.strictObject({ mode: ExecutionPermissionModeSchema.default('ask'), plan: z.boolean().default(false) })
export const PermissionOperationSchema = z.strictObject({
  kind: ToolKindSchema,
  /** 仅接受宿主规则分类结果，不得直接信任 Agent/客户端声明；识别规则由 SEC-02 提供。 */
  readOnlyCommand: z.boolean().default(false),
})
export const PermissionDecisionSchema = z.enum(['allow', 'ask', 'deny'])
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>
export type PermissionOperation = z.infer<typeof PermissionOperationSchema>
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>
export type ExecutionPermissionMode = z.infer<typeof ExecutionPermissionModeSchema>

export function normalizePermissionPolicy(input: unknown): PermissionPolicy {
  if (typeof input === 'string') {
    const legacy = PermissionModeSchema.parse(input)
    return PermissionPolicySchema.parse(legacy === 'plan' ? { mode: 'ask', plan: true } : { mode: legacy })
  }
  return PermissionPolicySchema.parse(input)
}

export const ToolPolicyRequestSchema = z.strictObject({ tool: z.string().min(1), command: z.string().optional(), input: z.json().optional() })
export const ToolPolicyResultSchema = z.strictObject({ decision: PermissionDecisionSchema, risk: z.enum(['read', 'review', 'dangerous']), reason: z.string(), whitelistable: z.boolean() })
export const CommandRuleSchema = z.strictObject({ executable: z.string().min(1), args: z.array(z.string()) })
export type ToolPolicyRequest = z.infer<typeof ToolPolicyRequestSchema>
export type ToolPolicyResult = z.infer<typeof ToolPolicyResultSchema>
export type CommandRule = z.infer<typeof CommandRuleSchema>
export const PathBoundaryConfigSchema = z.strictObject({ cwd: z.string().min(1), attachedDirectories: z.array(z.string().min(1)).default([]), worktrees: z.array(z.string().min(1)).default([]) })
export const BoundaryAuditSchema = z.strictObject({ path: z.string(), operation: z.enum(['read', 'write']), allowed: z.boolean(), reason: z.string() })
export type PathBoundaryConfig = z.input<typeof PathBoundaryConfigSchema>
export type BoundaryAudit = z.infer<typeof BoundaryAuditSchema>
