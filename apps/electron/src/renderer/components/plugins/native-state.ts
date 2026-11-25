import { atom } from 'jotai';
export interface PluginTarget {
  pluginId: string;
  id: string;
  kind: 'screen' | 'panel' | 'settings' | 'sidebar';
  workspaceId?: string;
  agentId?: string;
  params?: Record<string, unknown>;
}
export const pluginWorkspaceTargetsAtom = atom<Record<string, PluginTarget[]>>({});
export const pluginMainTargetAtom = atom<PluginTarget | null>(null);
export const pluginSidebarViewTargetAtom = atom<PluginTarget | null>(null);
export const pluginSettingsTargetAtom = atom<PluginTarget | null>(null);
export const pluginExplorerTargetsAtom = atom<Record<string, PluginTarget[]>>({});
export const pluginDiagnosticAtom = atom<Record<string, {
  error?: string;
  placements: string[];
}>>({});
export interface PluginTabState {
  state?: unknown;
  modified: boolean;
}
export const pluginTabStatesAtom = atom<Record<string, PluginTabState>>({});
export function pluginTargetKey(target: PluginTarget): string {
  return JSON.stringify([target.pluginId, target.kind, target.id, target.workspaceId ?? '', target.agentId ?? '']);
}
export function samePluginTarget(a: PluginTarget | null, b: PluginTarget): boolean {
  return a !== null && pluginTargetKey(a) === pluginTargetKey(b);
}
export function removePluginTabState(states: Record<string, PluginTabState>, target: PluginTarget): Record<string, PluginTabState> {
  const next = {
    ...states
  };
  delete next[pluginTargetKey(target)];
  return next;
}
