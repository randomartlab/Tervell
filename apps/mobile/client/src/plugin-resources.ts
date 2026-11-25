export interface PluginResource {
  id: string;
  identifier: string;
  title: string;
  subtitle?: string;
  url: string;
  text: string;
  resourceType: string;
}
export interface ComposerAttachment {
  marker: string;
  label: string;
  pluginId?: string;
  sourceId?: string;
  item?: PluginResource;
  prepared?: boolean;
}

export function validatePluginResource(value: unknown): PluginResource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('插件资源格式无效');
  const row = value as Record<string, unknown>;
  for (const key of ['id', 'identifier', 'title', 'url', 'text', 'resourceType']) {
    if (typeof row[key] !== 'string') throw Error('插件资源缺少 ' + key);
  }
  if (!row.id || String(row.id).length > 256 || String(row.title).length > 500 || String(row.text).length > 200000) throw Error('插件资源无效或过长');
  const url = new URL(String(row.url));
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error('插件资源需要不含登录凭据的 HTTP 或 HTTPS 链接');
  return {
    id: String(row.id), identifier: String(row.identifier), title: String(row.title), url: url.href,
    text: String(row.text), resourceType: String(row.resourceType), ...(typeof row.subtitle === 'string' ? {subtitle: row.subtitle} : {})
  };
}

export function withPluginResource(current: ComposerAttachment[], pluginId: string, sourceId: string, value: unknown): ComposerAttachment[] {
  if (!pluginId || !sourceId) throw Error('插件附件来源无效');
  const item = validatePluginResource(value);
  const others = current.filter(row => row.pluginId !== pluginId || row.sourceId !== sourceId || row.item?.id !== item.id);
  if (others.length >= 20) throw Error('单条消息最多 20 个附件');
  return [...others, {pluginId, sourceId, item, label: item.identifier + ' · ' + item.title, marker: '', prepared: false}];
}

export function pluginResourceText(item: PluginResource): string {
  return `[${item.resourceType}: ${item.identifier} · ${item.title}]\n${item.url}\n\n${item.text}`;
}
