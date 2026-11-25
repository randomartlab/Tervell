import {parseAnnotations} from '@proma/shared';
export interface Workspace {
  id: string;
  name: string;
  defaultKernelId?: string;
  pluginArchivedAt?: string | null;
  root?: string;
}
export interface Session {
  id: string;
  title: string;
  workspaceId: string;
  updatedAt: number;
  running?: boolean;
  pinned?: boolean;
  archived?: boolean;
  kernelId?: string;
  modelId?: string;
  requiresAttention?: boolean;
  status?: 'draft' | 'review' | 'done';
}
export interface Activity {
  id: string;
  kind: string;
  label: string;
  status: string;
  body: string;
  createdAt: number;
  translation?: string;
  truncated?: boolean;
}
export interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: number;
  activity?: Activity[];
  truncated?: boolean;
}
export interface TimelineEntry {
  id: string;
  item: {
    type: string;
    text?: string;
    message?: string;
    name?: string;
    status?: string;
    detail?: Record<string, unknown>;
    messageId?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  seqStart: number;
  turnId: string | null;
}
export interface Cursor {
  epoch: string;
  seq: number;
}
export interface Timeline {
  entries: TimelineEntry[];
  hasOlder: boolean;
  endCursor: Cursor | null;
  startCursor: Cursor | null;
  epoch: string;
  reset?: boolean;
}
export interface Approval {
  requestId: string;
  sessionId: string;
  toolName: string;
  description: string;
  command?: string;
  inputPreview?: string;
  canApprove?: boolean;
}
export interface Interaction {
  requestId: string;
  sessionId: string;
  kind: string;
  questions?: Array<{
    question: string;
    multiSelect?: boolean;
    options: Array<{
      label: string;
      description?: string;
    }>;
  }>;
  planText?: string;
  canApprove?: boolean;
}
export interface Field {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  value?: unknown;
  hint?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}
export interface Action {
  id: string;
  title: string;
  group: string;
  scope: string;
  effect: string;
  description: string;
  fields: Field[];
  confirm?: boolean;
  requiresManagement?: boolean;
}
export interface Catalog {
  management: boolean;
  actions: Action[];
}
export interface LocalSettings {
  theme: 'system' | 'light' | 'dark';
  uiSize: number;
  bodySize: number;
  codeSize: number;
  reasoning: 'expanded' | 'balanced' | 'collapsed';
  tools: 'expanded' | 'balanced' | 'collapsed';
}
export function mergeEntries(existing: TimelineEntry[], incoming: TimelineEntry[], reset = false): TimelineEntry[] {
  const rows = new Map<string, TimelineEntry>();
  for (const row of reset ? [] : existing) rows.set(row.id, row);
  for (const row of incoming) rows.set(row.id, row);
  return [...rows.values()].sort((a, b) => a.seqStart - b.seqStart);
}
export function groupedSessions(rows: Session[], project: string, query: string): Session[] {
  return rows.filter(r => !r.archived && (!project || r.workspaceId === project) && (!query || r.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
}
export function shortPath(value: string): string {
  return value.split(/[\\/]/).filter(Boolean).at(-1) ?? value;
}
export function cleanMessage(text: string): string {
  return parseAnnotations(text).text.replace(/\[\[tervell-asset:([^\]\r\n]+)\]\]/g, (_, value: string) => {
    try {
      return '📎 ' + JSON.parse(decodeURIComponent(value)).label;
    } catch {
      return '📎 附件';
    }
  });
}

/** Android 逐块编码为 UTF-8，不能把 emoji 的代理对拆开。 */
export function textChunks(text: string, size = 60000): string[] {
  const result: string[] = [];
  for (let offset = 0; offset < text.length;) {
    let end = Math.min(offset + size, text.length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]!)) end--;
    if (end === offset) end = Math.min(text.length, offset + 2);
    result.push(text.slice(offset, end));
    offset = end;
  }
  return result;
}
