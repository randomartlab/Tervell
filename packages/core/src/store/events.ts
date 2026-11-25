import { AppendEventInputSchema, EntityIdSchema, JournalVolumeSchema, LeaseProofSchema, StoredEventSchema } from '@proma/protocol'
import type { AppendEventInput, AppendResult, JournalVolume, LeaseProof, StoredEvent } from '@proma/protocol'
import type { Journal } from './index.ts'
import { journalTransaction, LeaseStore } from './lease.ts'
import { JournalRetention } from './retention.ts'

/** 所有事件都留在 SQLite 真源；逻辑卷只管理序号区间和冷热状态。 */
export class EventJournal {
  constructor(private readonly journal: Journal, private readonly volumeSize = 10000) {
    if (!Number.isSafeInteger(volumeSize) || volumeSize < 1) throw new Error('分卷大小必须为正整数')
  }
  append(proof: LeaseProof, input: readonly AppendEventInput[]): AppendResult {
    LeaseProofSchema.parse({ sessionId: proof.sessionId, holderId: proof.holderId, fence: proof.fence, claimKeyId: proof.claimKeyId })
    if (input.length === 0) throw new Error('追加事件不能为空')
    const events = input.map((event) => AppendEventInputSchema.parse(event))
    return journalTransaction(this.journal, () => {
      new LeaseStore(this.journal).assert(proof)
      new JournalRetention(this.journal, this.journal.retention).assertAppend(proof.sessionId, events)
      const db = this.journal.db
      db.prepare('INSERT OR IGNORE INTO journal_state VALUES (?,0,?)').run(proof.sessionId, this.volumeSize)
      const state = db.prepare('SELECT head_seq, volume_size FROM journal_state WHERE session_id=?').get(proof.sessionId)
      if (typeof state?.head_seq !== 'number' || typeof state.volume_size !== 'number') throw new Error('journal 状态损坏')
      const start = state.head_seq; let seq = start
      if (!Number.isSafeInteger(start + events.length)) throw new Error('session 序号超出安全范围')
      const insert = db.prepare('INSERT INTO events VALUES (?,?,?,?,?)')
      const run = db.prepare('SELECT last_seq FROM journal_runs WHERE session_id=? AND run_id=?')
      const updateRun = db.prepare('INSERT INTO journal_runs VALUES (?,?,?) ON CONFLICT(session_id,run_id) DO UPDATE SET last_seq=excluded.last_seq')
      const volume = db.prepare(`INSERT INTO journal_volumes VALUES (?,?,?,?,0)
        ON CONFLICT(session_id,number) DO UPDATE SET last_seq=excluded.last_seq`)
      const lastByRun = new Map<string, number>()
      for (const event of events) {
        const kernel = event.kernelEvent
        const last = lastByRun.get(kernel.runId) ?? run.get(proof.sessionId, kernel.runId)?.last_seq ?? 0
        if (typeof last !== 'number' || kernel.seq <= last) throw new Error('run 事件序号必须严格递增')
        lastByRun.set(kernel.runId, kernel.seq); seq++
        insert.run(proof.sessionId, seq, event.ts, event.turnId, JSON.stringify(kernel))
        const number = Math.floor((seq - 1) / state.volume_size) + 1
        volume.run(proof.sessionId, number, (number - 1) * state.volume_size + 1, seq)
      }
      for (const [runId, last] of lastByRun) updateRun.run(proof.sessionId, runId, last)
      db.prepare('UPDATE journal_state SET head_seq=? WHERE session_id=?').run(seq, proof.sessionId)
      return { fromSeq: start + 1, toSeq: seq, count: events.length }
    })
  }
  read(sessionId: string, afterSeq = 0, limit = 10000): StoredEvent[] {
    EntityIdSchema.parse(sessionId)
    if (!Number.isSafeInteger(afterSeq) || afterSeq < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100000) throw new Error('分页序号或数量无效')
    return this.journal.db.prepare('SELECT seq,ts,turn_id,kernel_event FROM events WHERE session_id=? AND seq>? ORDER BY seq LIMIT ?').all(sessionId, afterSeq, limit).map((row) => {
      if (typeof row.kernel_event !== 'string') throw new Error('journal 事件载荷损坏')
      return StoredEventSchema.parse({ sessionId, seq: row.seq, ts: row.ts, turnId: row.turn_id, kernelEvent: JSON.parse(row.kernel_event) })
    })
  }
  volumes(sessionId: string): JournalVolume[] {
    EntityIdSchema.parse(sessionId)
    return this.journal.db.prepare('SELECT * FROM journal_volumes WHERE session_id=? ORDER BY number').all(sessionId).map((row) => JournalVolumeSchema.parse({ sessionId, number: row.number, firstSeq: row.first_seq, lastSeq: row.last_seq, archived: row.archived === 1 }))
  }
  archive(proof: LeaseProof, number: number): void {
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('卷号无效')
    journalTransaction(this.journal, () => {
      new LeaseStore(this.journal).assert(proof)
      const state = this.journal.db.prepare('SELECT head_seq,volume_size FROM journal_state WHERE session_id=?').get(proof.sessionId)
      if (typeof state?.head_seq !== 'number' || typeof state.volume_size !== 'number' || number >= Math.ceil(state.head_seq / state.volume_size)) throw new Error('当前卷或不存在的卷不能归档')
      this.journal.db.prepare('UPDATE journal_volumes SET archived=1 WHERE session_id=? AND number=?').run(proof.sessionId, number)
    })
  }
}
