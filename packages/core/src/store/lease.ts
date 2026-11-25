import { randomUUID } from 'node:crypto'
import { EntityIdSchema, LeaseProofSchema, SessionLeaseSchema, TimestampSchema } from '@proma/protocol'
import type { LeaseProof, SessionLease } from '@proma/protocol'
import type { Journal } from './index.ts'

export function journalTransaction<T>(journal: Journal, operation: () => T): T {
  if (journal.readOnly) throw new Error('journal 只读，拒绝写入')
  journal.db.exec('BEGIN IMMEDIATE')
  try { const result = operation(); journal.db.exec('COMMIT'); return result }
  catch (error) {
    try { journal.db.exec('ROLLBACK') } catch (rollback) { throw new AggregateError([error, rollback], 'journal 回滚失败') }
    throw error
  }
}
/** 每个写事务都应使用 assert；不能在事务外校验后另起事务写入。 */
export class LeaseStore {
  static readonly ttlMs = 30000
  constructor(private readonly journal: Journal, private readonly clock: () => number = Date.now) {}
  private now(): number { return TimestampSchema.parse(this.clock()) }
  private current(sessionId: string): SessionLease | undefined {
    const row = this.journal.db.prepare('SELECT holder_id, fence, expires_at, claim_key_id FROM leases WHERE session_id=?').get(sessionId)
    return row ? SessionLeaseSchema.parse({ sessionId, holderId: row.holder_id, fence: row.fence, expiresAt: row.expires_at, claimKeyId: row.claim_key_id }) : undefined
  }
  inspect(sessionId:string):SessionLease|undefined {EntityIdSchema.parse(sessionId);return this.current(sessionId)}
  claim(sessionId: string, holderId: string, takeover = false, expectedFence?:number): SessionLease {
    EntityIdSchema.parse(sessionId); EntityIdSchema.parse(holderId)
    return journalTransaction(this.journal, () => {
      const now = this.now(); const current = this.current(sessionId)
      if(expectedFence!==undefined&&(!takeover||!Number.isSafeInteger(expectedFence)||current?.fence!==expectedFence))throw new Error('lease 转移的预期fence已改变')
      if (current && current.expiresAt > now && !takeover) throw new Error('lease 已被持有')
      const lease = SessionLeaseSchema.parse({ sessionId, holderId, fence: (current?.fence ?? 0) + 1, claimKeyId: randomUUID(), expiresAt: now + LeaseStore.ttlMs })
      this.journal.db.prepare(`INSERT INTO leases VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET holder_id=excluded.holder_id, fence=excluded.fence, expires_at=excluded.expires_at, claim_key_id=excluded.claim_key_id`)
        .run(lease.sessionId, lease.holderId, lease.fence, lease.expiresAt, lease.claimKeyId)
      return lease
    })
  }
  assert(input: LeaseProof): SessionLease {
    const proof = LeaseProofSchema.parse({ sessionId: input.sessionId, holderId: input.holderId, fence: input.fence, claimKeyId: input.claimKeyId }); const current = this.current(proof.sessionId)
    if (!current || current.holderId !== proof.holderId || current.fence !== proof.fence || current.claimKeyId !== proof.claimKeyId || current.expiresAt <= this.now()) throw new Error('lease 已失效或 fence 不匹配')
    return current
  }
  renew(proof: LeaseProof): SessionLease {
    return journalTransaction(this.journal, () => {
      const current = this.assert(proof)
      const lease = SessionLeaseSchema.parse({ ...current, expiresAt: this.now() + LeaseStore.ttlMs })
      this.journal.db.prepare('UPDATE leases SET expires_at=? WHERE session_id=?').run(lease.expiresAt, proof.sessionId)
      return lease
    })
  }
  release(proof: LeaseProof): void {
    journalTransaction(this.journal, () => {
      this.assert(proof)
      this.journal.db.prepare('UPDATE leases SET expires_at=0 WHERE session_id=?').run(proof.sessionId)
    })
  }
}
