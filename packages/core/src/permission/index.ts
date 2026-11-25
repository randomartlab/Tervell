import { PermissionOperationSchema, PermissionPolicySchema } from '@proma/protocol'
import type { PermissionDecision, PermissionOperation, PermissionPolicy } from '@proma/protocol'

/** 统一策略入口；规则识别、会话批准和内核回调接入由后续 SEC-02/API 卡完成。 */
export function decidePermission(policy: PermissionPolicy, operation: PermissionOperation): PermissionDecision {
  const { mode, plan } = PermissionPolicySchema.parse(policy)
  const action = PermissionOperationSchema.parse(operation)
  const readOnly = action.kind === 'read' || action.kind === 'search' || (action.kind === 'execute' && action.readOnlyCommand)
  if (readOnly) return 'allow'
  if (plan || mode === 'read-only') return 'deny'
  if (mode === 'auto' || (mode === 'accept-edits' && action.kind === 'edit')) return 'allow'
  return 'ask'
}

export { PermissionRules, commandFacts } from './rules.ts'
export { PathBoundary } from './boundary.ts'
export * from './gate.ts'
export * from './files.ts'
export * from './terminal.ts'
export * from './project-tools.ts'
