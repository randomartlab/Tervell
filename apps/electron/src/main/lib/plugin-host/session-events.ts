import type { AgentSessionMeta } from '@proma/shared';
interface SessionEvent {
  name: 'agent.create.after' | 'agent.archive.after' | 'agent.close.after';
  session: AgentSessionMeta;
}
const listeners = new Set<(event: SessionEvent) => void>();
export function observePluginSessionEvents(listener: (event: SessionEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function publishPluginSessionEvent(name: SessionEvent['name'], session: AgentSessionMeta): void {
  for (const listener of listeners) try {
    listener({
      name,
      session
    });
  } catch (error) {
    console.warn('[插件会话事件]', String(error));
  }
}
interface PermissionEvent {
  name: 'agent.permission.before' | 'agent.permission.after';
  sessionId: string;
  request: Record<string, unknown>;
  resolution?: Record<string, unknown>;
}
const permissionListeners = new Set<(event: PermissionEvent) => void>();
export function observePluginPermissionEvents(listener: (event: PermissionEvent) => void): () => void {
  permissionListeners.add(listener);
  return () => permissionListeners.delete(listener);
}
export function publishPluginPermissionEvent(event: PermissionEvent): void {
  for (const listener of permissionListeners) try {
    listener(event);
  } catch (error) {
    console.warn('[插件审批事件]', String(error));
  }
}
interface BeforeHookContext {
  workspaceId?: string;
  cwd: string;
  onApplied?: (pluginId: string, request: Record<string, unknown>) => void;
}
let beforeHook: ((name: string, request: Record<string, unknown>, context: BeforeHookContext) => Promise<Record<string, unknown>>) | undefined;
export function setPluginBeforeHook(handler: NonNullable<typeof beforeHook>): void {
  beforeHook = handler;
}
export async function runPluginBeforeHook(name: string, request: Record<string, unknown>, context: BeforeHookContext): Promise<Record<string, unknown>> {
  if (!beforeHook) await import('./runtime');
  return beforeHook ? beforeHook(name, request, context) : request;
}
