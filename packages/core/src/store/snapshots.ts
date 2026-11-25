import { createHash } from 'node:crypto'
import { ProjectionCheckpointSchema } from '@proma/protocol'
import type { LeaseProof } from '@proma/protocol'
import type { Journal } from './index.ts'
import { EventJournal } from './events.ts'
import { LeaseStore, journalTransaction } from './lease.ts'
import { TimelineProjector } from './projector.ts'

const hash = (text: string) => createHash('sha256').update(text).digest('hex')
export class ProjectionSnapshots {
  constructor(private readonly journal: Journal) {}
  save(proof: LeaseProof, projector: TimelineProjector): void {
    const snapshot = ProjectionCheckpointSchema.parse(projector.checkpoint())
    if (snapshot.sessionId !== proof.sessionId) throw new Error('快照会话不匹配')
    journalTransaction(this.journal, () => {
      new LeaseStore(this.journal).assert(proof)
      const head = this.journal.db.prepare('SELECT head_seq FROM journal_state WHERE session_id=?').get(proof.sessionId)?.head_seq ?? 0
      if (snapshot.head > Number(head)) throw new Error('快照不能领先 journal')
      // 快照只是缓存，必须能被 raw journal 独立证明，不能注入虚构投影。
      const verified = new TimelineProjector(proof.sessionId); const store = new EventJournal(this.journal)
      let after = 0
      while (after < snapshot.head) {
        const batch = store.read(proof.sessionId, after, Math.min(10000, snapshot.head - after))
        if (!batch.length) throw new Error('快照源 journal 有缺口')
        for (const event of batch) verified.apply(event)
        after = batch.at(-1)!.seq
      }
      const payload = JSON.stringify(snapshot)
      if (JSON.stringify(ProjectionCheckpointSchema.parse(verified.checkpoint())) !== payload) throw new Error('快照与 journal 不一致')
      this.journal.db.prepare('INSERT INTO projection_snapshots VALUES (?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET head_seq=excluded.head_seq,payload=excluded.payload,digest=excluded.digest').run(proof.sessionId, snapshot.head, payload, hash(payload))
    })
  }
  load(sessionId: string): TimelineProjector {
    this.journal.db.exec('BEGIN')
    try { const result = this.loadConsistent(sessionId); this.journal.db.exec('COMMIT'); return result }
    catch (error) { this.journal.db.exec('ROLLBACK'); throw error }
  }
  private loadConsistent(sessionId: string): TimelineProjector {
    const row = this.journal.db.prepare('SELECT payload,digest,head_seq FROM projection_snapshots WHERE session_id=?').get(sessionId)
    let projector = new TimelineProjector(sessionId)
    if (row) {
      if (typeof row.payload !== 'string' || row.digest !== hash(row.payload)) throw new Error('快照损坏：摘要不匹配')
      projector = TimelineProjector.restore(JSON.parse(row.payload))
      if (projector.checkpoint().sessionId !== sessionId || projector.checkpoint().head !== row.head_seq) throw new Error('快照归属错误')
    }
    const head = this.journal.db.prepare('SELECT head_seq FROM journal_state WHERE session_id=?').get(sessionId)?.head_seq ?? 0
    if (projector.checkpoint().head > Number(head)) throw new Error('快照领先 journal，必须重建')
    const store = new EventJournal(this.journal); let after = projector.checkpoint().head
    for (;;) {
      const batch = store.read(sessionId, after)
      if (!batch.length) break
      for (const event of batch) projector.apply(event)
      after = batch.at(-1)!.seq
    }
    return projector
  }
  fill(projector: TimelineProjector, fromSeq: number, toSeq: number): void {
    if (!Number.isSafeInteger(fromSeq) || !Number.isSafeInteger(toSeq) || fromSeq < 1 || toSeq < fromSeq) throw new Error('补洞区间无效')
    const before = projector.checkpoint(); if (fromSeq > before.head + 1) throw new Error('补洞区间不连续')
    const candidate = TimelineProjector.restore(before); const store = new EventJournal(this.journal); let cursor = fromSeq - 1
    const collected = []
    this.journal.db.exec('BEGIN')
    try {
    while (cursor < toSeq) {
      const batch = store.read(before.sessionId, cursor, Math.min(10000, toSeq - cursor))
      if (!batch.length || batch[0]?.seq !== cursor + 1) throw new Error('journal 缺少请求区间')
      for (const event of batch) { candidate.apply(event); collected.push(event) }
      cursor = batch.at(-1)!.seq
    }
    this.journal.db.exec('COMMIT')
    } catch (error) { this.journal.db.exec('ROLLBACK'); throw error }
    for (const event of collected) projector.apply(event)
  }
}
