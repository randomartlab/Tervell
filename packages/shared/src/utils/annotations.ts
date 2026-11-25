export interface ConversationAnnotation {
  id: string;
  quote: string;
  comment: string;
  source: {
    kind: 'chat' | 'file' | 'markdown' | 'diff' | 'terminal';
    label: string;
    sessionId: string;
    messageId?: string;
    path?: string;
    start?: number;
    end?: number;
    lineStart?: number;
    lineEnd?: number;
    side?: 'old' | 'new';
    digest?: string;
    terminalId?: string;
    buffer?: 'normal' | 'alternate';
    cols?: number;
    rows?: number;
  };
}
export const MAX_ANNOTATION_BYTES = 2_000_000;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function isConversationAnnotation(value: unknown): value is ConversationAnnotation {
  if (!object(value) || typeof value.id !== 'string' || value.id.length > 200 || typeof value.quote !== 'string' || value.quote.length > 200000 || typeof value.comment !== 'string' || value.comment.length > 32000 || !object(value.source)) return false;
  const source = value.source;
  if (!['chat', 'file', 'markdown', 'diff', 'terminal'].includes(String(source.kind)) || typeof source.label !== 'string' || source.label.length > 4096 || typeof source.sessionId !== 'string' || source.sessionId.length > 200) return false;
  for (const key of ['start', 'end', 'lineStart', 'lineEnd', 'cols', 'rows']) if (source[key] !== undefined && (!Number.isSafeInteger(source[key]) || Number(source[key]) < (key === 'start' || key === 'end' ? 0 : 1))) return false;
  for (const key of ['path', 'messageId', 'terminalId']) if (source[key] !== undefined && (typeof source[key] !== 'string' || source[key].length > 4096)) return false;
  if (source.digest !== undefined && (typeof source.digest !== 'string' || !/^[a-f0-9]{64}$/.test(source.digest))) return false;
  if (source.buffer !== undefined && source.buffer !== 'normal' && source.buffer !== 'alternate') return false;
  if (source.side !== undefined && source.side !== 'old' && source.side !== 'new') return false;
  if (typeof source.start === 'number' && typeof source.end === 'number' && source.end < source.start) return false;
  if (typeof source.lineStart === 'number' && typeof source.lineEnd === 'number' && source.lineEnd < source.lineStart) return false;
  return true;
}
const marker = /\[\[tervell-annotations:([A-Za-z0-9%_.!~*'()-]+)\]\]/g;
export function annotationMarker(rows: readonly ConversationAnnotation[]): string {
  if (rows.length > 50 || !rows.every(isConversationAnnotation) || JSON.stringify(rows).length > MAX_ANNOTATION_BYTES) throw Error('批注数量或内容超出限制');
  return rows.length ? '[[tervell-annotations:' + encodeURIComponent(JSON.stringify(rows)) + ']]' : '';
}
export function parseAnnotations(text: string): {
  text: string;
  annotations: ConversationAnnotation[];
} {
  const annotations: ConversationAnnotation[] = [];
  const rest = text.replace(marker, (whole, payload: string) => {
    try {
      if (payload.length > MAX_ANNOTATION_BYTES * 3) return whole;
      const rows: unknown = JSON.parse(decodeURIComponent(payload));
      if (!Array.isArray(rows) || rows.length + annotations.length > 50 || !rows.every(isConversationAnnotation)) return whole;
      annotations.push(...rows);
      return '';
    } catch {
      return whole;
    }
  });
  return {
    text: rest,
    annotations
  };
}
export function annotationsForModel(text: string): string {
  const parsed = parseAnnotations(text),
    escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return parsed.text + parsed.annotations.map(row => `\n\n<annotation source="${row.source.kind}">\n来源：${escape(row.source.label)}\n${escape(row.quote)}\n${row.comment.trim() ? '评论：' + escape(row.comment) : ''}\n</annotation>`).join('');
}

/** 历史/导出使用可读 Markdown；模型专用 XML 在 Markdown 预览中会被当作 HTML 隐藏。 */
export function annotationsForTranscript(text: string): string {
  const parsed = parseAnnotations(text);
  return parsed.text + parsed.annotations.map(row => {
    const value = row.quote, longest = Math.max(2, ...(value.match(/`+/g) ?? []).map(run => run.length));
    const fence = '`'.repeat(longest + 1);
    const label = row.source.label.replace(/[\r\n]/g, ' ').replace(/[\\`*_{}\[\]<>]/g, '\\$&');
    return `\n\n> 批注 · ${label}\n\n${fence}text\n${value}\n${fence}${row.comment ? '\n\n**评论**\n\n' + row.comment : ''}`;
  }).join('');
}
