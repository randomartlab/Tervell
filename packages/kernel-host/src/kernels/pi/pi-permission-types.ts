/** SDK PermissionBehavior */
type PermissionBehavior = 'allow' | 'deny'

/** SDK PermissionUpdateDestination */
type PermissionUpdateDestination = 'userSettings' | 'projectSettings' | 'localSettings' | 'session' | 'cliArg'

/** SDK 权限规则值 */
interface PermissionRuleValue {
  toolName: string
  ruleContent?: string
}

/** SDK PermissionUpdate（匹配 SDK 0.2.63） */
export type PermissionUpdate = {
  type: 'addRules' | 'replaceRules' | 'removeRules'
  rules: PermissionRuleValue[]
  behavior: PermissionBehavior
  destination: PermissionUpdateDestination
} | {
  type: 'setMode'
  mode: string
  destination: PermissionUpdateDestination
} | {
  type: 'addDirectories' | 'removeDirectories'
  directories: string[]
  destination: PermissionUpdateDestination
}

/** SDK PermissionDecisionClassification（匹配 SDK 0.2.120） */
type PermissionDecisionClassification = 'user_temporary' | 'user_permanent' | 'user_reject'

/** SDK PermissionResult（匹配 SDK 0.2.120） */
export type PermissionResult = {
  behavior: 'allow'
  updatedInput?: Record<string, unknown>
  updatedPermissions?: PermissionUpdate[]
  toolUseID?: string
  decisionClassification?: PermissionDecisionClassification
} | {
  behavior: 'deny'
  message: string
  interrupt?: boolean
  toolUseID?: string
  decisionClassification?: PermissionDecisionClassification
}

/** canUseTool 回调的 options 参数（匹配 SDK CanUseTool） */
export interface CanUseToolOptions {
  signal: AbortSignal
  suggestions?: PermissionUpdate[]
  blockedPath?: string
  decisionReason?: string
  decisionReasonType?: string
  classifierApprovable?: boolean
  toolUseID: string
  agentID?: string
  title?: string
  displayName?: string
  description?: string
}
