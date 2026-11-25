import type { ConversationAnnotation } from '@proma/shared';
import { getDefaultStore } from 'jotai';
import { agentSessionsAtom, currentAgentSessionIdAtom, currentAgentWorkspaceIdAtom, agentDiffPanelTabAtom, currentSessionSidePanelOpenAtom, getPreviewSidePanelTab } from '@/atoms/agent-atoms';
import { previewFilesMapAtom, previewFileMapAtom, getPreviewFileId } from '@/atoms/preview-atoms';
import { appModeAtom } from '@/atoms/app-mode';
import { activeViewAtom } from '@/atoms/active-view';
import { pluginMainTargetAtom } from '@/components/plugins/native-state';
import { resolveAnnotationTextRange } from './annotation-range';
const pendingReveals = new Map<string, (found: boolean) => void>();
export function completeAnnotationReveal(id: string, found: boolean): void {
  pendingReveals.get(id)?.(found);
}
export async function annotationDigest(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
}
/** 只恢复精确匹配的文件；失效时继续保留文本快照，不猜测另一个位置。 */
export async function reopenAnnotationSource(row: ConversationAnnotation): Promise<boolean> {
  if (!row.source.path || !row.source.digest || !['file', 'markdown'].includes(row.source.kind)) return false;
  const value = await window.electronAPI.resolveAndReadFile(row.source.path, {
    sessionId: row.source.sessionId
  });
  if (!value || value.isBinary || value.isTooLarge || (await annotationDigest(value.content)) !== row.source.digest) return false;
  const range = resolveAnnotationTextRange(value.content, row.quote, row.source);
  if (!range) return false;
  const store = getDefaultStore(),
    session = store.get(agentSessionsAtom).find(s => s.id === row.source.sessionId);
  if (!session) return false;
  const file = {
    filePath: value.resolvedPath,
    previewOnly: true,
    annotationSelection: { id: crypto.randomUUID(), quote: row.quote, digest: row.source.digest, ...range },
  };
  const revealed = new Promise<boolean>(resolve => {
    const finish = (found: boolean) => { clearTimeout(timer); pendingReveals.delete(file.annotationSelection.id); resolve(found); };
    const timer = setTimeout(() => finish(false), 6000);
    pendingReveals.set(file.annotationSelection.id, finish);
  });
  store.set(activeViewAtom, 'conversations');
  store.set(pluginMainTargetAtom, null);
  store.set(previewFilesMapAtom, all => new Map(all).set(session.id, [...(all.get(session.id) ?? []).filter(f => getPreviewFileId(f) !== getPreviewFileId(file)), file]));
  store.set(previewFileMapAtom, all => new Map(all).set(session.id, file));
  store.set(currentAgentSessionIdAtom, session.id);
  store.set(currentAgentWorkspaceIdAtom, session.workspaceId ?? null);
  store.set(appModeAtom, 'agent');
  store.set(agentDiffPanelTabAtom, all => new Map(all).set(session.id, getPreviewSidePanelTab(getPreviewFileId(file))));
  store.set(currentSessionSidePanelOpenAtom, true);
  return revealed;
}
