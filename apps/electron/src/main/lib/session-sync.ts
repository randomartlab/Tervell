import { randomUUID } from 'node:crypto';
import type { SessionSyncCursor, SessionSyncChange, SessionSyncPage, ChatRunSnapshot, ChatToolActivity } from '@proma/shared';
/** 日志正文仍由原有JSONL持有；这层只保留恢复游标、失效通知及活跃流快照。 */
export class SessionSync {
  readonly epoch = randomUUID();
  private seq = 0;
  private changes: SessionSyncChange[] = [];
  private chats = new Map<string, ChatRunSnapshot>();
  constructor(private capacity = 300, private clock = Date.now) {}
  changed(kind: 'agent'|'chat', id: string, state: SessionSyncChange['state'] = 'changed'): void {
    this.changes.push({ seq: ++this.seq, kind, id, state, at: this.clock() });
    if (this.changes.length > this.capacity) this.changes.splice(0, this.changes.length - this.capacity);
  }
  beginChat(id: string, model: string): string {
    const generation = randomUUID();
    this.chats.set(id, { id, generation, revision: 0, content: '', reasoning: '', model, startedAt: this.clock(), toolActivities: [], truncated: false });
    this.changed('chat', id, 'running'); return generation;
  }
  chatDelta(id: string, generation: string, key: 'content'|'reasoning', delta: string): void {
    const current = this.chats.get(id); if (!current || current.generation !== generation) return;
    const text = current[key] + delta; current[key] = text.slice(-1024 * 1024); current.truncated ||= text.length > 1024 * 1024;
    current.revision++;
  }
  chatTool(id: string, generation: string, activity: ChatToolActivity): void {
    const current = this.chats.get(id); if (!current || current.generation !== generation) return;
    current.toolActivities.push(activity); if (current.toolActivities.length > 100) { current.toolActivities.shift(); current.truncated = true; }
    current.revision++;
  }
  chatPosition(id: string, generation: string) {
    const current = this.chats.get(id);
    return current?.generation === generation ? { generation, revision: current.revision, startedAt: current.startedAt, model: current.model } : undefined;
  }
  finishChat(id: string, generation: string): void {
    if (this.chats.get(id)?.generation !== generation) return;
    this.chats.delete(id); this.changed('chat', id, 'idle');
  }
  read(cursor?: SessionSyncCursor): SessionSyncPage {
    const oldest = this.changes[0]?.seq ?? this.seq + 1;
    const reset = !cursor || cursor.epoch !== this.epoch || cursor.seq < oldest - 1 || cursor.seq > this.seq;
    return { cursor: { epoch: this.epoch, seq: this.seq }, reset, changes: reset ? [...this.changes] : this.changes.filter(row => row.seq > cursor.seq), chats: structuredClone([...this.chats.values()]) };
  }
}
export const sessionSync = new SessionSync();
