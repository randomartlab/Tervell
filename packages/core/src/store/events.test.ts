import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { KernelEventSchema } from '@proma/protocol'
import { openJournal } from './index.ts'
import { LeaseStore } from './lease.ts'
import { EventJournal } from './events.ts'
import { TimelineProjector } from './projector.ts'

const event = (seq: number, runId = 'run1') => ({ turnId: 'turn1', ts: seq, kernelEvent: KernelEventSchema.parse({ t: 'message.delta', runId, seq, index: 0, text: `文本${seq}` }) })
async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'proma-events-')); const path = join(directory, 'journal.db')
  const journal = await openJournal(path); journal.db.exec("INSERT INTO sessions VALUES ('s1','{}'); INSERT INTO sessions VALUES ('s2','{}')")
  const leases = new LeaseStore(journal); const proof = leases.claim('s1', 'desktop')
  return { journal, path, proof, leases, store: new EventJournal(journal, 2), close: () => { journal.close(); rmSync(directory, { recursive: true, force: true }) } }
}
test('Given 有效租约 When 追加跨 run 事件 Then session 序号连续且 run 序号独立', async () => {
  const f = await fixture()
  try {
    expect(f.store.append(f.proof, [event(1), event(2), event(1, 'run2')])).toEqual({ fromSeq: 1, toSeq: 3, count: 3 })
    expect(f.store.read('s1').map((row) => [row.seq, row.kernelEvent.runId, row.kernelEvent.seq])).toEqual([[1, 'run1', 1], [2, 'run1', 2], [3, 'run2', 1]])
    expect(f.store.read('s2')).toEqual([])
    expect(f.store.read('s1', 1, 1)[0]?.seq).toBe(2)
  } finally { f.close() }
})
test('Given 重复/倒序 run 事件 When 批量追加 Then 整批回滚且序号无洞', async () => {
  const f = await fixture()
  try {
    f.store.append(f.proof, [event(1)])
    expect(() => f.store.append(f.proof, [event(2), event(2)])).toThrow('序号')
    expect(f.store.read('s1')).toHaveLength(1)
    expect(f.store.append(f.proof, [event(2)]).toSeq).toBe(2)
    expect(() => f.store.append(f.proof, [event(1)])).toThrow('序号')
  } finally { f.close() }
})
test('Given 分卷阈值2 When 写5条并归档 Then 封闭卷可归档且重开读取一致', async () => {
  const f = await fixture()
  try {
    f.store.append(f.proof, [event(1), event(2), event(3), event(4), event(5)])
    expect(f.store.volumes('s1').map((v) => [v.number, v.firstSeq, v.lastSeq, v.archived])).toEqual([[1, 1, 2, false], [2, 3, 4, false], [3, 5, 5, false]])
    expect(() => f.store.archive(f.proof, 3)).toThrow('当前卷')
    f.store.archive(f.proof, 1)
    expect(f.store.volumes('s1')[0]?.archived).toBe(true)
    expect(f.store.read('s1')).toHaveLength(5)
    const reopened = await openJournal(f.path)
    try {
      const store = new EventJournal(reopened)
      expect(store.read('s1')).toEqual(f.store.read('s1'))
      expect(store.volumes('s1')[0]?.archived).toBe(true)
      expect(store.append(f.proof, [event(6)]).toSeq).toBe(6)
      expect(store.volumes('s1')).toHaveLength(3)
    } finally { reopened.close() }
  } finally { f.close() }
})
test('Given 接管后的旧凭据 When 写入或归档 Then 同事务拒绝', async () => {
  const f = await fixture()
  try {
    f.store.append(f.proof, [event(1), event(2), event(3)])
    f.leases.claim('s1', 'mobile', true)
    expect(() => f.store.append(f.proof, [event(4)])).toThrow('lease')
    expect(() => f.store.archive(f.proof, 1)).toThrow('lease')
    expect(f.store.read('s1')).toHaveLength(3)
  } finally { f.close() }
})
test('Given 无效事件/分页 When 写读 Then 拒绝且不改变数据', async () => {
  const f = await fixture()
  try {
    expect(() => f.store.append(f.proof, [{ ...event(1), ts: -1 }])).toThrow()
    expect(() => f.store.read('s1', -1)).toThrow()
    expect(() => f.store.read('s1', 0, 0)).toThrow()
    expect(f.store.read('s1')).toEqual([])
  } finally { f.close() }
})
test('Given 10万事件 When 批量提交 Then 可重开读取且跨10卷完整', async () => {
  const f = await fixture(); const store = new EventJournal(f.journal, 10000)
  try {
    const started = performance.now()
    store.append(f.proof, Array.from({ length: 100000 }, (_, index) => event(index + 1)))
    const duration = performance.now() - started
    const reopened = await openJournal(f.path)
    let rows
    try { rows = new EventJournal(reopened).read('s1', 0, 100000) } finally { reopened.close() }
    expect(rows).toHaveLength(100000)
    expect(rows[99999]?.seq).toBe(100000)
    const first = new TimelineProjector('s1'); const second = new TimelineProjector('s1')
    for (const row of rows) { first.apply(row); second.apply(row); second.apply(row) }
    expect(JSON.stringify(first.rows())).toBe(JSON.stringify(second.rows()))
    expect(store.volumes('s1')).toHaveLength(10)
    console.log(`ST-02：10万事件写入 ${duration.toFixed(0)}ms；功能验收通过（W2 不设性能门禁）`)
  } finally { f.close() }
}, 60000)

test('Given v2 已有事件 When 升级新索引 Then 从原 head 和 run 序号继续', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-upgrade-events-')); const path = join(directory, 'journal.db')
  const old = await openJournal(path, { targetVersion: 2 })
  old.db.exec("INSERT INTO sessions VALUES ('s1','{}')")
  old.db.prepare('INSERT INTO events VALUES (?,?,?,?,?)').run('s1', 1, 1, 'turn1', JSON.stringify(event(1).kernelEvent)); old.close()
  const next = await openJournal(path)
  try {
    const proof = new LeaseStore(next).claim('s1', 'desktop'); const store = new EventJournal(next)
    expect(() => store.append(proof, [event(1)])).toThrow('序号')
    expect(store.append(proof, [event(2)]).toSeq).toBe(2)
    expect(store.read('s1')).toHaveLength(2)
    expect(store.volumes('s1')[0]?.firstSeq).toBe(1)
  } finally { next.close(); rmSync(directory, { recursive: true, force: true }) }
})

test('Given SQLite 事件流 When 两次独立重放 Then 投影逐字节一致且无重复', async () => {
  const f = await fixture()
  try {
    const { TimelineProjector } = await import('./projector.ts')
    f.store.append(f.proof, [event(1), event(2), event(3)])
    const first = new TimelineProjector('s1'); const second = new TimelineProjector('s1')
    for (const row of f.store.read('s1')) first.apply(row)
    for (const row of f.store.read('s1')) { second.apply(row); second.apply(row) }
    expect(JSON.stringify(second.rows())).toBe(JSON.stringify(first.rows()))
  } finally { f.close() }
})
