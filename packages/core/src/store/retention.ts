import { EntityIdSchema, SessionSchema, JournalRetentionPolicySchema } from '@proma/protocol'
import type { AppendEventInput, JournalRetentionPolicy } from '@proma/protocol'
import type { Journal } from './index.ts'
import { journalTransaction } from './lease.ts'

export { JournalRetentionPolicySchema } from '@proma/protocol'
export type { JournalRetentionPolicy } from '@proma/protocol'
export interface JournalUsage { events: number; bytes: number; totalBytes: number }
export interface CleanupCandidate { sessionId: string; updatedAt: number; events: number; bytes: number }
export class JournalCapacityError extends Error {
  readonly code = 'JOURNAL_CAPACITY'
  constructor(readonly limit: 'event' | 'session' | 'total' | 'count') { super('会话日志达到容量上限，请先导出并清理已归档会话') }
}
export class JournalRetention {
  readonly policy: ReturnType<typeof JournalRetentionPolicySchema.parse>
  constructor(private readonly journal: Journal, policy: JournalRetentionPolicy = {}, private readonly clock = Date.now) { this.policy = JournalRetentionPolicySchema.parse(policy) }
  usage(sessionId: string): JournalUsage {
    EntityIdSchema.parse(sessionId)
    const summary = this.journal.db.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(length(CAST(kernel_event AS BLOB))+length(CAST(turn_id AS BLOB))+24),0) AS bytes FROM events WHERE session_id=?').get(sessionId)
    const total = this.journal.db.prepare('SELECT COALESCE(SUM(length(CAST(kernel_event AS BLOB))+length(CAST(turn_id AS BLOB))+24),0) AS bytes FROM events').get()
    return { events: Number(summary?.count ?? 0), bytes: Number(summary?.bytes ?? 0), totalBytes: Number(total?.bytes ?? 0) }
  }
  assertAppend(sessionId: string, input: readonly AppendEventInput[]): void {
    const sizes = input.map(event => Buffer.byteLength(JSON.stringify(event.kernelEvent)) + Buffer.byteLength(event.turnId) + 24)
    if (sizes.some(size => size > this.policy.maxEventBytes)) throw new JournalCapacityError('event')
    const existing = this.usage(sessionId), added = sizes.reduce((total, size) => total + size, 0)
    if (existing.events + input.length > this.policy.maxSessionEvents) throw new JournalCapacityError('count')
    if (existing.bytes + added > this.policy.maxSessionBytes) throw new JournalCapacityError('session')
    if (existing.totalBytes + added > this.policy.maxTotalBytes) throw new JournalCapacityError('total')
  }
  candidates(): CleanupCandidate[] {
    const now = this.clock(), cutoff = now - this.policy.archivedAfterMs
    const result: CleanupCandidate[] = []
    for (const row of this.journal.db.prepare('SELECT id,record FROM sessions').all()) {
      if (typeof row.record !== 'string') continue
      let raw: unknown
      try { raw = JSON.parse(row.record) } catch { throw new Error(`会话 ${String(row.id)} 元数据损坏，无法安全计算清理计划`) }
      const parsed = SessionSchema.safeParse(raw)
      if (!parsed.success || parsed.data.id !== row.id) continue
      const session = parsed.data
      if (!session.flags.archived || session.flags.pinned || session.flags.starred || session.updatedAt > cutoff) continue
      const lastEvent = this.journal.db.prepare('SELECT MAX(ts) AS latest FROM events WHERE session_id=?').get(session.id)
      if (Number(lastEvent?.latest ?? 0) > cutoff) continue
      const lease = this.journal.schemaVersion >= 3 ? this.journal.db.prepare('SELECT expires_at FROM leases WHERE session_id=?').get(session.id) : undefined
      if (typeof lease?.expires_at === 'number' && lease.expires_at > now) continue
      if (this.journal.schemaVersion >= 6 && this.journal.db.prepare("SELECT message_id FROM service_requests WHERE session_id=? AND status IN ('queued','running') LIMIT 1").get(session.id)) continue
      if (this.journal.schemaVersion >= 6 && Number(this.journal.db.prepare('SELECT MAX(created_at) AS latest FROM service_requests WHERE session_id=?').get(session.id)?.latest ?? 0) > cutoff) continue
      const usage = this.usage(session.id)
      result.push({ sessionId: session.id, updatedAt: session.updatedAt, events: usage.events, bytes: usage.bytes })
    }
    return result.sort((left, right) => left.updatedAt - right.updatedAt || left.sessionId.localeCompare(right.sessionId))
  }
  cleanup(sessionIds: readonly string[]): { deleted: string[]; freedBytes: number } {
    if (sessionIds.length > 100) throw new Error('每次最多清理100个归档会话')
    const ids = [...new Set(sessionIds.map(id => EntityIdSchema.parse(id)))]
    return journalTransaction(this.journal, () => {
      const eligible = new Map(this.candidates().map(candidate => [candidate.sessionId, candidate]))
      if (ids.some(id => !eligible.has(id))) throw new Error('会话未归档、保留期未到、受保护或仍在运行，拒绝清理')
      let freedBytes = 0
      for (const id of ids) {
        if (this.journal.schemaVersion >= 6) {
          const workspaces = this.journal.db.prepare('SELECT DISTINCT workspace_id FROM service_directory WHERE session_id=?').all(id)
          this.journal.db.prepare('DELETE FROM service_directory WHERE session_id=?').run(id)
          for (const workspace of workspaces) this.journal.db.prepare('INSERT INTO service_directory(session_id,workspace_id,record) VALUES (?,?,NULL)').run(id, workspace.workspace_id ?? '')
          this.journal.db.prepare('DELETE FROM service_requests WHERE session_id=?').run(id)
        }
        if (this.journal.schemaVersion >= 5) this.journal.db.prepare('DELETE FROM projection_snapshots WHERE session_id=?').run(id)
        if (this.journal.schemaVersion >= 4) for (const table of ['journal_runs', 'journal_volumes', 'journal_state']) this.journal.db.prepare(`DELETE FROM ${table} WHERE session_id=?`).run(id)
        if (this.journal.schemaVersion >= 3) this.journal.db.prepare('DELETE FROM leases WHERE session_id=?').run(id)
        this.journal.db.prepare('DELETE FROM events WHERE session_id=?').run(id)
        this.journal.db.prepare('DELETE FROM sessions WHERE id=?').run(id)
        freedBytes += eligible.get(id)!.bytes
      }
      return { deleted: ids, freedBytes }
    })
  }
}
