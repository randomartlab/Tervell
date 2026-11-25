import { AcpRunEnvelopeSchema, EntityIdSchema, KernelEventSchema } from '@proma/protocol'
import type { KernelEvent } from '@proma/protocol'

/** 接收门禁不为乱序事件重新编号；只有连续前缀可送入journal与投影器。 */
export class AcpRunTimeline {
  private epoch = -1
  private runId = ''
  private head = 0
  private done = false
  private readonly buffered = new Map<number, KernelEvent>()
  private readonly seen = new Map<number, string>()
  constructor(private readonly sessionId: string, private readonly maxBuffered = 256) { EntityIdSchema.parse(sessionId) }
  begin(epoch: number, runId: string): void {
    if (!Number.isSafeInteger(epoch) || epoch < 0 || epoch <= this.epoch) throw new Error('新epoch必须严格递增')
    EntityIdSchema.parse(runId); this.epoch = epoch; this.runId = runId; this.head = 0; this.done = false; this.buffered.clear(); this.seen.clear()
  }
  accept(raw: unknown): KernelEvent[] {
    const envelope = AcpRunEnvelopeSchema.parse(raw)
    if (envelope.sessionId !== this.sessionId) throw new Error('ACP时间线会话不匹配')
    // 旧epoch/旧run是可识别的迟到帧；未来epoch不能静默接管当前运行。
    if (envelope.epoch < this.epoch) return []
    if (envelope.epoch !== this.epoch) throw new Error('未初始化的ACP epoch')
    const event = KernelEventSchema.parse(envelope.event)
    if (event.runId !== this.runId) return []
    const bytes = JSON.stringify(event); const old = this.seen.get(event.seq)
    if (old !== undefined) { if (old !== bytes) throw new Error('ACP重复序号载荷冲突'); return [] }
    if (this.done) throw new Error('ACP终态后仍有新事件')
    if (event.seq <= this.head) throw new Error('ACP已确认序号账本缺失')
    // done不能被已经缓存的更高序号越过。
    if (event.t === 'done' && [...this.buffered.keys()].some((seq) => seq > event.seq)) throw new Error('ACP终态前已存在更高序号')
    if ([...this.buffered.values()].some((item) => item.t === 'done' && item.seq < event.seq)) throw new Error('ACP事件超过已缓存终态')
    if (this.buffered.size >= this.maxBuffered && event.seq !== this.head + 1) throw new Error('ACP乱序缓冲超过上限')
    this.buffered.set(event.seq, event); this.seen.set(event.seq, bytes)
    const ready: KernelEvent[] = []
    for (;;) {
      const next = this.buffered.get(this.head + 1); if (!next) break
      this.buffered.delete(next.seq); this.head = next.seq; ready.push(next); if (next.t === 'done') this.done = true
    }
    return ready
  }
  gaps(): Array<{ fromSeq: number; toSeq: number }> {
    const result: Array<{ fromSeq: number; toSeq: number }> = []; let start = this.head + 1
    for (const seq of [...this.buffered.keys()].sort((a, b) => a - b)) { if (seq > start) result.push({ fromSeq: start, toSeq: seq - 1 }); start = seq + 1 }
    return result
  }
}
