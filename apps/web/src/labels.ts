import type { PermissionMode } from '@proma/protocol'

export function permissionLabel(mode: PermissionMode): string {
  return ({ 'read-only': '只读', ask: '操作前确认', 'accept-edits': '允许编辑', auto: '自动执行', plan: '仅规划' })[mode]
}
