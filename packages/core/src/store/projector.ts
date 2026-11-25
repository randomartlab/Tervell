import { assertNever, EntityIdSchema, StoredEventSchema, ProjectionCheckpointSchema, ProjectedTimelineRowSchema } from '@proma/protocol'
import type { ProjectedTimelineRow, StoredEvent, ProjectionCheckpoint } from '@proma/protocol'

/** 只消费 session seq 连续的已存储事件；网络缺口和旧 run 过滤由上游协调。 */
export class TimelineProjector {
  private head = 0
  private readonly seen = new Map<number, string>()
  private readonly runHeads = new Map<string, number>()
  private readonly items = new Map<string, ProjectedTimelineRow>()
  constructor(private readonly sessionId: string) { EntityIdSchema.parse(sessionId) }
  rows(): ProjectedTimelineRow[] { return [...this.items.values()].map((row) => ProjectedTimelineRowSchema.parse(row)) }
  checkpoint(): ProjectionCheckpoint {
    return structuredClone({ version: 1, sessionId: this.sessionId, head: this.head, seen: [...this.seen], runHeads: [...this.runHeads], items: [...this.items] })
  }
  static restore(raw: unknown): TimelineProjector {
    const snapshot = ProjectionCheckpointSchema.parse(raw)
    if (snapshot.seen.length !== snapshot.head || snapshot.seen.some(([seq], index) => seq !== index + 1)) throw new Error('快照序号账本不连续')
    if (new Set(snapshot.items.map(([key]) => key)).size !== snapshot.items.length) throw new Error('快照条目键冲突')
    for (const [, row] of snapshot.items) if (row.sessionId !== snapshot.sessionId || row.seqEnd > snapshot.head) throw new Error('快照归属或序号错误')
    const result = new TimelineProjector(snapshot.sessionId)
    result.head = snapshot.head
    for (const [key, value] of snapshot.seen) result.seen.set(key, value)
    for (const [key, value] of snapshot.runHeads) result.runHeads.set(key, value)
    for (const [key, value] of snapshot.items) result.items.set(key, value)
    return result
  }
  apply(input: StoredEvent): void {
    const stored = StoredEventSchema.parse(input); const bytes = JSON.stringify(stored)
    if (stored.sessionId !== this.sessionId) throw new Error('投影会话不匹配')
    if (this.seen.has(stored.seq)) {
      if (this.seen.get(stored.seq) !== bytes) throw new Error('相同序号事件冲突')
      return
    }
    if (stored.seq !== this.head + 1 || stored.kernelEvent.seq <= (this.runHeads.get(stored.kernelEvent.runId) ?? 0)) throw new Error('投影事件序号不连续或 run 序号回退')
    const event = stored.kernelEvent
    const base = JSON.stringify([stored.turnId, event.runId])
    const update = (key: string, kind: ProjectedTimelineRow['kind'], summary: string, append = false) => {
      let row = this.items.get(key)
      if (!row) {
        row = { id: `row_${stored.seq}_${this.items.size}`, sessionId: this.sessionId, runId: event.runId, turnId: stored.turnId, kind, summary: '', seqStart: stored.seq, seqEnd: stored.seq, sourceSeqRanges: [] }
        this.items.set(key, row)
      }
      row.kind = kind
      row.summary = append ? row.summary + summary : summary
      row.seqEnd = stored.seq
      const ranges = row.sourceSeqRanges ?? []
      const last = ranges.at(-1)
      if (last?.end !== stored.seq) {
        if (last && last.end + 1 === stored.seq) last.end = stored.seq
        else ranges.push({ start: stored.seq, end: stored.seq })
      }
      row.sourceSeqRanges = ranges
      return row
    }
    switch (event.t) {
      case 'message.delta': update(`${base}:part:${event.index}`, event.kind, event.text, true); break
      case 'message.final':
        event.message.content.forEach((part, index) => {
          const kind = part.type === 'text' ? 'text' : part.type === 'thinking' ? 'thinking' : part.type === 'tool-call' ? 'tool' : 'status'
          const text = part.type === 'text' || part.type === 'thinking' ? part.text : part.type === 'image' ? part.url : part.type === 'tool-call' ? part.name : part.content
          const active = part.type === 'tool-call' ? `${base}:tool:${part.toolCallId}` : `${base}:part:${index}`
          update(active, kind, text)
          // 归档本条消息的键，下一条消息的 index=0 不会覆盖上一条。
          const row = this.items.get(active)
          if (row && part.type !== 'tool-call') {
            const entries = [...this.items.entries()].map(([key, value]) => [key === active ? `${base}:message:${event.message.id}:${index}` : key, value] as const)
            this.items.clear(); for (const [key, value] of entries) this.items.set(key, value)
          }
        }); break
      case 'tool.call': {
        const row = update(`${base}:tool:${event.call.id}`, 'tool', event.call.result ?? event.call.name)
        row.status = event.call.status; break
      }
      case 'tool.update': {
        const row = update(`${base}:tool:${event.callId}`, 'tool', event.patch.result ?? event.patch.error ?? this.items.get(`${base}:tool:${event.callId}`)?.summary ?? event.callId)
        if (event.patch.status) row.status = event.patch.status
        if (event.patch.progress !== undefined) row.progress = event.patch.progress
        break
      }
      case 'plan.update': update(`${base}:plan`, 'plan', event.steps.map((step) => step.title).join('\n')); break
      case 'permission.request': update(`${base}:approval:${event.req.requestId}`, 'approval', event.req.summary); break
      case 'usage': update(`${base}:usage`, 'status', JSON.stringify(event.usage)); break
      case 'compaction': update(`${base}:compaction:${event.info.compactionId ?? stored.seq}`, 'status', event.info.summary ?? event.info.strategy); break
      case 'retry': update(`${base}:retry:${stored.seq}`, 'status', event.reason); break
      case 'error': update(`${base}:error:${stored.seq}`, 'error', event.err.message); break
      case 'done': update(`${base}:done`, 'status', event.reason); break
      default: assertNever(event)
    }
    this.head = stored.seq; this.seen.set(stored.seq, bytes); this.runHeads.set(event.runId, event.seq)
  }
}
