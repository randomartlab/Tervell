import { EntityIdSchema } from '@proma/protocol'

export interface WorkbenchRoute { workspaceId?: string; sessionId?: string; view: 'sessions' | 'approvals' | 'settings' }
export function parseRoute(path: string): WorkbenchRoute {
  if (path === '/approvals') return { view: 'approvals' }
  if (path === '/settings') return { view: 'settings' }
  const match = /^\/workspaces\/([^/]+)\/sessions\/([^/]+)\/?$/.exec(path)
  if (match && EntityIdSchema.safeParse(match[1]).success && EntityIdSchema.safeParse(match[2]).success) return { view: 'sessions', workspaceId: match[1], sessionId: match[2] }
  return { view: 'sessions' }
}
export function sessionPath(workspaceId: string, sessionId: string): string {
  return `/workspaces/${EntityIdSchema.parse(workspaceId)}/sessions/${EntityIdSchema.parse(sessionId)}`
}
