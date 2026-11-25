import type { AgentWorkspace } from '@proma/shared';
const listeners = new Set<(name: 'workspace.create.after' | 'workspace.archive.after', workspace: AgentWorkspace) => void>();
export function observePluginWorkspaceEvents(listener: (name: 'workspace.create.after' | 'workspace.archive.after', workspace: AgentWorkspace) => void): void {
  listeners.add(listener);
}
export function publishPluginWorkspaceEvent(name: 'workspace.create.after' | 'workspace.archive.after', workspace: AgentWorkspace): void {
  for (const listener of listeners) try {
    listener(name, workspace);
  } catch (error) {
    console.warn('[插件项目事件]', String(error));
  }
}
