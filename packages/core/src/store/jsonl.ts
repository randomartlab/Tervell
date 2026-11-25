import { randomUUID } from 'node:crypto'
import { closeSync, fsyncSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { SessionSchema, StoredEventSchema, JournalArchiveHeaderSchema } from '@proma/protocol'
import type { Session, StoredEvent } from '@proma/protocol'
import type { Journal } from './index.ts'
import { journalTransaction } from './lease.ts'
import { JournalRetention } from './retention.ts'

interface Archive { session: Session; events: StoredEvent[] }
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}
const line = (value: unknown) => JSON.stringify(canonical(value))
/** 仅显式导入/导出；export.jsonl 从不自动当作运行时真源。 */
export class JournalJsonl {
  constructor(private readonly journal: Journal) {}
  export(sessionId: string): string {
    this.journal.db.exec('BEGIN')
    try {
      const row = this.journal.db.prepare('SELECT record FROM sessions WHERE id=?').get(sessionId)
      if (typeof row?.record !== 'string') throw new Error('导出会话不存在')
      const session = SessionSchema.parse(JSON.parse(row.record))
      if (session.id !== sessionId) throw new Error('会话元数据归属错误')
      const rows = this.journal.db.prepare('SELECT seq,ts,turn_id,kernel_event FROM events WHERE session_id=? ORDER BY seq').all(sessionId)
      const events = rows.map((item) => {
        if (typeof item.kernel_event !== 'string') throw new Error('事件载荷损坏')
        return StoredEventSchema.parse({ sessionId, seq: item.seq, ts: item.ts, turnId: item.turn_id, kernelEvent: JSON.parse(item.kernel_event) })
      })
      events.forEach((event, index) => { if (event.seq !== index + 1) throw new Error('journal 序号有缺口，不能导出不完整档案') })
      const result = [line({ format: 'proma-journal', version: 1, session }), ...events.map((event) => line(event))].join('\n') + '\n'
      this.journal.db.exec('COMMIT'); return result
    } catch (error) { this.journal.db.exec('ROLLBACK'); throw error }
  }
  private parse(source: string): Archive {
    const lines = source.split('\n'); if (lines.at(-1) === '') lines.pop()
    if (!lines.length || lines.some((text) => !text.trim())) throw new Error('JSONL 行不能为空')
    const { session } = JournalArchiveHeaderSchema.parse(JSON.parse(lines[0]!))
    const events = lines.slice(1).map((text) => StoredEventSchema.parse(JSON.parse(text)))
    const runs = new Map<string, number>()
    events.forEach((event, index) => {
      if (event.sessionId !== session.id || event.seq !== index + 1 || event.kernelEvent.seq <= (runs.get(event.kernelEvent.runId) ?? 0)) throw new Error('JSONL 会话归属或事件序号冲突')
      runs.set(event.kernelEvent.runId, event.kernelEvent.seq)
    })
    return { session, events }
  }
  import(source: string): string {
    const { session, events } = this.parse(source)
    return journalTransaction(this.journal, () => {
      if (this.journal.db.prepare('SELECT id FROM sessions WHERE id=?').get(session.id)) throw new Error('导入目标会话已存在，拒绝覆盖')
      new JournalRetention(this.journal, this.journal.retention).assertAppend(session.id, events.map(event => ({ ts: event.ts, turnId: event.turnId, kernelEvent: event.kernelEvent })))
      this.journal.db.prepare('INSERT INTO sessions VALUES (?,?)').run(session.id, JSON.stringify(session))
      const insert = this.journal.db.prepare('INSERT INTO events VALUES (?,?,?,?,?)')
      const runs = new Map<string, number>()
      for (const event of events) {
        insert.run(session.id, event.seq, event.ts, event.turnId, JSON.stringify(event.kernelEvent))
        runs.set(event.kernelEvent.runId, event.kernelEvent.seq)
      }
      this.journal.db.prepare('INSERT INTO journal_state VALUES (?,?,10000)').run(session.id, events.length)
      const volume = this.journal.db.prepare('INSERT INTO journal_volumes VALUES (?,?,?,?,0)')
      for (let start = 1; start <= events.length; start += 10000) volume.run(session.id, Math.floor((start - 1) / 10000) + 1, start, Math.min(start + 9999, events.length))
      const run = this.journal.db.prepare('INSERT INTO journal_runs VALUES (?,?,?)')
      for (const [id, seq] of runs) run.run(session.id, id, seq)
      return session.id
    })
  }
  exportFile(sessionId: string, path: string): void {
    const content = this.export(sessionId); const temp = `${path}.${randomUUID()}.tmp`
    let descriptor: number | undefined
    try {
      descriptor = openSync(temp, 'wx', 0o600); writeFileSync(descriptor, content); fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined
      renameSync(temp, path)
    } finally { if (descriptor !== undefined) closeSync(descriptor); rmSync(temp, { force: true }) }
  }
}
