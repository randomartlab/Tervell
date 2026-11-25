export interface Placement {
  id: string;
  context?: string;
  locations?: readonly string[];
}
/** Paseo panel默认进入workspace；只声明explorer的面板默认进入explorer，显式越界拒绝。 */
export function resolvePanelLocation(panel: Placement, requested?: string): 'workspace' | 'explorer' {
  const allowed = panel.locations ?? ['workspace'];
  const location = requested ?? (allowed.includes('workspace') ? 'workspace' : allowed[0]);
  if (location !== 'workspace' && location !== 'explorer' || !allowed.includes(location)) throw Error('插件未声明此面板位置');
  return location;
}
export function matchesPluginContext(input: {
  grants: readonly string[];
  workspaceId?: string;
  agentId?: string;
}, target: {
  workspaceId?: string;
  agentId?: string;
  context?: string;
}): boolean {
  if (target.context === 'global') return true;
  if (!input.workspaceId || !input.grants.includes(input.workspaceId)) return false;
  if (target.workspaceId && target.workspaceId !== input.workspaceId) return false;
  if (target.agentId && target.agentId !== input.agentId) return false;
  return target.context !== 'agent' || !!input.agentId;
}
export function matchesPluginFile(path: string, selector: {
  extensions: readonly string[];
  filenames?: readonly string[];
}): boolean {
  const name = path.split(/[\\/]/).pop() ?? '',
    extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return selector.extensions.some(value => value.toLowerCase() === extension) || selector.filenames?.includes(name) === true;
}
