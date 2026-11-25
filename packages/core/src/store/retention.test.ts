import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { SessionSchema } from '@proma/protocol'
import { EventJournal, JournalJsonl, JournalRetention, LeaseStore, openJournal } from './index.ts'
import type { JournalRetentionPolicy } from './index.ts'

async function fixture(retention: JournalRetentionPolicy = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'proma-retention-')), journal = await openJournal(join(directory, 'journal.db'), { retention })
  for (const id of ['s1', 's2']) journal.db.prepare('INSERT INTO sessions VALUES (?,?)').run(id, JSON.stringify(SessionSchema.parse({ schemaVersion: 2, id, workspaceId: 'w1', title: id, kernelId: 'scripted', flags: { archived: true }, createdAt: 1, updatedAt: 1 })))
  const leases = new LeaseStore(journal), proof = leases.claim('s1', 'test')
  const event = (seq: number) => ({ ts: 1, turnId: 'turn', kernelEvent: { t: 'message.delta' as const, runId: 'run', seq, index: 0, kind: 'text' as const, text: '内容' } })
  return { journal, leases, proof, event, store: new EventJournal(journal), close: () => { journal.close(); rmSync(directory, { recursive: true, force: true }) } }
}
test('Given 事件数量达到阈值 When 整批超限 Then 数据、head和run序号全部回滚', async () => {
  const fixtureState = await fixture({ maxSessionEvents: 2 })
  try {
    fixtureState.store.append(fixtureState.proof, [fixtureState.event(1)])
    expect(() => fixtureState.store.append(fixtureState.proof, [fixtureState.event(2), fixtureState.event(3)])).toThrow('容量上限')
    expect(fixtureState.store.read('s1')).toHaveLength(1)
    expect(fixtureState.store.append(fixtureState.proof, [fixtureState.event(2)]).toSeq).toBe(2)
  } finally { fixtureState.close() }
})
test('Given 单事件、单会话、全库字节限额 When UTF8载荷超限 Then 明确拒绝且不部分提交', async () => {
  for (const policy of [{ maxEventBytes: 10 }, { maxSessionBytes: 150 }, { maxTotalBytes: 150 }]) {
    const fixtureState = await fixture(policy)
    try {
      expect(() => fixtureState.store.append(fixtureState.proof, [{ ...fixtureState.event(1), kernelEvent: { ...fixtureState.event(1).kernelEvent, text: '文'.repeat(200) } }])).toThrow('容量上限')
      expect(fixtureState.store.read('s1')).toHaveLength(0)
      expect(fixtureState.journal.db.prepare('SELECT * FROM journal_state').all()).toHaveLength(0)
    } finally { fixtureState.close() }
  }
})
test('Given 同库另一会话占用额度 When 写入新会话 Then 全库阈值按两者合计', async () => {
  const fixtureState = await fixture({ maxTotalBytes: 200 })
  try {
    fixtureState.store.append(fixtureState.proof, [fixtureState.event(1)])
    const second = fixtureState.leases.claim('s2', 'second')
    expect(() => fixtureState.store.append(second, [fixtureState.event(1)])).toThrow('容量上限')
    expect(fixtureState.store.read('s2')).toEqual([])
  } finally { fixtureState.close() }
})
test('Given 保留期、活租约、pin或近期活动 When 计划清理 Then 受保护会话均不入选', async () => {
  const fixtureState = await fixture()
  try {
    const retention = new JournalRetention(fixtureState.journal, { archivedAfterMs: 1000 }, () => Date.now())
    expect(retention.candidates().map(item => item.sessionId)).toEqual(['s2'])
    fixtureState.leases.release(fixtureState.proof)
    expect(retention.candidates()).toHaveLength(2)
    const session = SessionSchema.parse(JSON.parse(String(fixtureState.journal.db.prepare('SELECT record FROM sessions WHERE id=?').get('s2')?.record)))
    session.flags.pinned = true
    fixtureState.journal.db.prepare('UPDATE sessions SET record=? WHERE id=?').run(JSON.stringify(session), 's2')
    fixtureState.store.append(fixtureState.leases.claim('s1', 'new'), [{ ...fixtureState.event(1), ts: Date.now() }])
    fixtureState.journal.db.prepare('UPDATE leases SET expires_at=0').run()
    expect(retention.candidates()).toHaveLength(0)
    expect(() => retention.cleanup(['s1', 's2'])).toThrow('拒绝清理')
    expect(fixtureState.store.read('s1')).toHaveLength(1)
  } finally { fixtureState.close() }
})
test('Given 归档会话及目录缓存 When 显式清理 Then 整会话移除并生成目录tombstone', async () => {
  const fixtureState = await fixture()
  try {
    fixtureState.store.append(fixtureState.proof, [fixtureState.event(1), fixtureState.event(2)])
    fixtureState.leases.release(fixtureState.proof)
    fixtureState.journal.db.prepare('INSERT INTO service_directory(session_id,workspace_id,record) VALUES (?,?,?)').run('s1', 'w1', '{}')
    const retention = new JournalRetention(fixtureState.journal, { archivedAfterMs: 0 })
    expect(retention.cleanup(['s1']).freedBytes).toBeGreaterThan(0)
    for (const table of ['sessions', 'events', 'leases', 'journal_state', 'journal_runs', 'journal_volumes', 'projection_snapshots', 'service_requests']) expect(fixtureState.journal.db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${table === 'sessions' ? 'id' : 'session_id'}=?`).get('s1')?.count).toBe(0)
    expect(fixtureState.journal.db.prepare('SELECT record FROM service_directory WHERE session_id=?').all('s1')).toEqual([{ record: null }])
    expect(fixtureState.journal.db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    expect(retention.cleanup(['s2']).deleted).toEqual(['s2'])
  } finally { fixtureState.close() }
})
test('Given 排队请求或清理中SQL失败 When 清理 Then 拒绝活动会话且事务完整回滚', async () => {
  const fixtureState = await fixture()
  try {
    fixtureState.leases.release(fixtureState.proof)
    fixtureState.journal.db.prepare('INSERT INTO service_requests VALUES (?,?,?,?,?,?,?,?,?)').run('s1', 'm1', 'device', 'hash', '请求', 'queue', 'queued', 'run', 1)
    const retention = new JournalRetention(fixtureState.journal, { archivedAfterMs: 0 })
    expect(() => retention.cleanup(['s1'])).toThrow('拒绝清理')
    fixtureState.journal.db.exec("CREATE TRIGGER stop_cleanup BEFORE DELETE ON sessions BEGIN SELECT RAISE(ABORT,'cleanup failure'); END")
    expect(() => retention.cleanup(['s2'])).toThrow('cleanup failure')
    expect(fixtureState.journal.db.prepare('SELECT id FROM sessions').all()).toHaveLength(2)
    expect(fixtureState.journal.db.prepare('SELECT * FROM service_directory').all()).toHaveLength(0)
  } finally { fixtureState.close() }
})
test('Given 配额受限的导入或只读句柄 When 写入或清理 Then 不绕过门禁', async () => {
  const fixtureState = await fixture()
  try {
    fixtureState.store.append(fixtureState.proof, [fixtureState.event(1)])
    const archive = new JournalJsonl(fixtureState.journal).export('s1').replaceAll('s1', 's3')
    const limited = { ...fixtureState.journal, retention: { maxTotalBytes: 1 } }
    expect(() => new JournalJsonl(limited).import(archive)).toThrow('容量上限')
    expect(fixtureState.journal.db.prepare('SELECT id FROM sessions WHERE id=?').get('s3')).toBeUndefined()
    expect(() => new JournalRetention({ ...fixtureState.journal, readOnly: true }).cleanup(['s2'])).toThrow('只读')
  } finally { fixtureState.close() }
})
