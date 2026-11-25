import { atom } from 'jotai';
import { reopenAnnotationSource } from './annotation-source';
import type { Store } from 'jotai/vanilla/store';
import type { ConversationAnnotation, AnnotationPreferences } from '@proma/shared';
export interface AnnotationState {
  revision: string;
  preferences: AnnotationPreferences;
  drafts: Record<string, ConversationAnnotation[]>;
  loaded: boolean;
  error: string | null;
}
export const annotationStateAtom = atom<AnnotationState>({
  revision: '',
  preferences: {
    chat: true,
    file: true,
    markdown: true,
    diff: true,
    terminal: true
  },
  drafts: {},
  loaded: false,
  error: null
});
let writes: Promise<unknown> = Promise.resolve();
export async function loadAnnotations(store: Store): Promise<void> {
  const before = store.get(annotationStateAtom).revision;
  const value = (await window.electronAPI.builtinFeatureCall('annotations.read')) as Omit<AnnotationState, 'loaded' | 'error'>;
  if (store.get(annotationStateAtom).revision !== before) return;
  store.set(annotationStateAtom, {
    ...value,
    loaded: true,
    error: null
  });
}
function rebaseAnnotations(before: ConversationAnnotation[], desired: ConversationAnnotation[], fresh: ConversationAnnotation[]): ConversationAnnotation[] {
  const original = new Map(before.map(row => [row.id, row])),
    next = new Map(desired.map(row => [row.id, row])),
    current = new Map(fresh.map(row => [row.id, row]));
  for (const id of new Set([...original.keys(), ...next.keys()])) {
    if (JSON.stringify(original.get(id)) === JSON.stringify(next.get(id))) continue;
    if (JSON.stringify(current.get(id)) !== JSON.stringify(original.get(id)) && JSON.stringify(current.get(id)) !== JSON.stringify(next.get(id))) throw Error('这条批注已在另一窗口编辑；本次输入保留，请核对后重试');
    const row = next.get(id);
    if (row) current.set(id, row);else current.delete(id);
  }
  return [...current.values()];
}
/** 同一窗口串行保存；失败保持原草稿和待编辑文本，不以乐观成功冒充落盘。 */
export function changeAnnotations(store: Store, scope: string, change: (previous: ConversationAnnotation[]) => ConversationAnnotation[]): Promise<void> {
  const run = writes.catch(() => {}).then(async () => {
    if (!store.get(annotationStateAtom).loaded) await loadAnnotations(store);
    const previous = store.get(annotationStateAtom),
      annotations = change(previous.drafts[scope] ?? []);
    let value: Omit<AnnotationState, 'loaded' | 'error'>;
    try {
      value = (await window.electronAPI.builtinFeatureCall('annotations.write', {
        revision: previous.revision,
        scope,
        annotations
      })) as typeof value;
    } catch (error) {
      const fresh = (await window.electronAPI.builtinFeatureCall('annotations.read')) as typeof value;
      store.set(annotationStateAtom, {
        ...fresh,
        loaded: true,
        error: String(error)
      });
      if (fresh.revision === previous.revision) throw error;
      const merged = rebaseAnnotations(previous.drafts[scope] ?? [], annotations, fresh.drafts[scope] ?? []);
      value = (await window.electronAPI.builtinFeatureCall('annotations.write', {
        revision: fresh.revision,
        scope,
        annotations: merged
      })) as typeof value;
    }
    store.set(annotationStateAtom, {
      ...value,
      loaded: true,
      error: null
    });
  });
  writes = run;
  return run;
}
export function setAnnotationPreferences(store: Store, preferences: AnnotationPreferences): Promise<void> {
  const run = writes.catch(() => {}).then(async () => {
    await loadAnnotations(store);
    const current = store.get(annotationStateAtom);
    const value = (await window.electronAPI.builtinFeatureCall('annotations.write', {
      revision: current.revision,
      preferences
    })) as Omit<AnnotationState, 'loaded' | 'error'>;
    store.set(annotationStateAtom, {
      ...value,
      loaded: true,
      error: null
    });
  });
  writes = run;
  return run;
}
export interface AnnotationOffer {
  text: string;
  documentText?: string;
  source: ConversationAnnotation['source'];
  x: number;
  y: number;
  validate?: () => boolean;
  reveal?: () => Promise<boolean> | boolean;
}
const locators = new Map<string, Pick<AnnotationOffer, 'validate' | 'reveal'>>();
export function rememberAnnotationSource(id: string, offer: AnnotationOffer): void {
  locators.set(id, {
    validate: offer.validate,
    reveal: offer.reveal
  });
  while (locators.size > 500) locators.delete(locators.keys().next().value!);
}
export async function revealAnnotation(row: ConversationAnnotation): Promise<boolean> {
  const live = locators.get(row.id);
  if (live?.validate?.() === false) return false;
  if (live?.reveal && (await live.reveal())) return true;
  if (row.source.kind === 'chat' && row.source.messageId) {
    const element = [...document.querySelectorAll<HTMLElement>('[data-message-id]')].find(e => e.dataset.messageId === row.source.messageId);
    if (element && element.textContent?.includes(row.quote)) {
      element.scrollIntoView({
        block: 'center'
      });
      return true;
    }
  }
  return reopenAnnotationSource(row);
}
export function offerAnnotation(offer: AnnotationOffer): void {
  window.dispatchEvent(new CustomEvent('tervell-annotation-offer', {
    detail: offer
  }));
}
