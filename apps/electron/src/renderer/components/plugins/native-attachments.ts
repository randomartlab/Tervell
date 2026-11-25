import { atom } from 'jotai';
import type { Store } from 'jotai/vanilla/store';
export interface PluginResource {
  id: string;
  identifier: string;
  title: string;
  subtitle?: string;
  url: string;
  text: string;
  resourceType: string;
}
export interface PluginAttachment {
  pluginId: string;
  sourceId: string;
  item: PluginResource;
}
export const pluginAttachmentsAtom = atom<Record<string, PluginAttachment[]>>({});
export function addPluginAttachment(store: Store, sessionId: string, value: PluginAttachment): void {
  if (!value.sourceId || !value.item.id || typeof value.item.text !== 'string' || value.item.text.length > 200000) throw Error('插件附件无效或过长');
  const url = new URL(value.item.url);
  if (!['https:', 'http:'].includes(url.protocol)) throw Error('插件资源链接仅支持HTTP或HTTPS');
  store.set(pluginAttachmentsAtom, all => {
    const current = all[sessionId] ?? [];
    if (current.length >= 20) throw Error('单条消息最多20个插件附件');
    return {
      ...all,
      [sessionId]: [...current.filter(v => v.pluginId !== value.pluginId || v.sourceId !== value.sourceId || v.item.id !== value.item.id), value]
    };
  });
}
export function pluginAttachmentText(values: readonly PluginAttachment[]): string {
  return values.map(({
    item
  }) => `\n\n[${item.resourceType}: ${item.identifier} · ${item.title}]\n${item.url}\n${item.text}`).join('');
}
