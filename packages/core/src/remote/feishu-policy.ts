/** 飞书只信任桌面显式配置的用户；群成员身份不等于本机控制权限。 */
export interface FeishuAccessPolicy {
  operatorOpenId?: string
  allowedUserOpenIds?: string[]
}
export function canUseFeishu(policy: FeishuAccessPolicy, sender: string): boolean {
  return sender.startsWith('ou_') && (sender === policy.operatorOpenId || !!policy.allowedUserOpenIds?.includes(sender))
}
export function scopedFeishuSessions<T extends { id: string }>(sessions: T[], history: readonly string[], current?: string): T[] {
  const allowed = new Set([...history, ...(current ? [current] : [])])
  return sessions.filter((session) => allowed.has(session.id))
}
export function findScopedSession<T extends { id: string }>(sessions: T[], arg: string): T | undefined {
  const index = Number(arg)
  if (Number.isInteger(index) && index > 0) return sessions[index - 1]
  const matches = sessions.filter((session) => arg.length >= 8 && session.id.startsWith(arg))
  return matches.length === 1 ? matches[0] : undefined
}
