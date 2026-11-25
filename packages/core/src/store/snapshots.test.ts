import { test, expect } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openJournal, LeaseStore, EventJournal, TimelineProjector, ProjectionSnapshots } from './index.ts'

test('Given 快照后新增事件 When 读取与补洞 Then 与完整重放一致并拒绝缺失区间', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-snapshot-')); const journal = await openJournal(join(directory, 'journal.db'))
  try {
    journal.db.exec("INSERT INTO sessions VALUES ('s1','{}')")
    const proof = new LeaseStore(journal).claim('s1', 'desktop'); const store = new EventJournal(journal); const snapshots = new ProjectionSnapshots(journal)
    const append = (seq: number) => store.append(proof, [{ ts: seq, turnId: 't1', kernelEvent: { t: 'message.delta', runId: 'r1', seq, index: 0, text: String(seq) } }])
    append(1); append(2); const first = new TimelineProjector('s1'); store.read('s1').forEach((event) => first.apply(event)); snapshots.save(proof, first)
    append(3); append(4)
    const full = new TimelineProjector('s1'); store.read('s1').forEach((event) => full.apply(event))
    expect(JSON.stringify(snapshots.load('s1').rows())).toBe(JSON.stringify(full.rows()))
    snapshots.fill(first, 2, 4); expect(first.rows()).toEqual(full.rows())
    const before = JSON.stringify(first.checkpoint()); expect(() => snapshots.fill(first, 5, 8)).toThrow('缺少')
    expect(JSON.stringify(first.checkpoint())).toBe(before)
    journal.db.exec("UPDATE projection_snapshots SET digest='corrupt'")
    expect(() => snapshots.load('s1')).toThrow('损坏')
  } finally { journal.close(); rmSync(directory, { recursive: true, force: true }) }
})
test('Given 伪造快照 When 还原 Then 拒绝不连续账本', () => {
  const state = new TimelineProjector('s1').checkpoint()
  expect(() => TimelineProjector.restore({ ...state, head: 2 })).toThrow('账本')
})

test('Given 旧版本库 When 升降级到快照结构 Then 原事件不丢且能重放', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-snapshot-migrate-')); const path = join(directory, 'journal.db')
  const old = await openJournal(path, { targetVersion: 4 })
  old.db.exec("INSERT INTO sessions VALUES ('s1','{}')")
  const proof = new LeaseStore(old).claim('s1', 'desktop'); new EventJournal(old).append(proof, [{ ts: 1, turnId: 't1', kernelEvent: { t: 'done', runId: 'r1', seq: 1, reason: 'stop' } }]); old.close()
  const current = await openJournal(path)
  const snapshots = new ProjectionSnapshots(current); const projection = snapshots.load('s1'); snapshots.save(proof, projection); current.close()
  const down = await openJournal(path, { targetVersion: 4 })
  try { expect(new EventJournal(down).read('s1')).toHaveLength(1); expect(down.db.prepare("SELECT name FROM sqlite_master WHERE name='projection_snapshots'").all()).toEqual([]) }
  finally { down.close(); rmSync(directory, { recursive: true, force: true }) }
})
