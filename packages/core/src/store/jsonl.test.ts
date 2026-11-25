import { test, expect } from 'bun:test'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JOURNAL_SCHEMA_VERSION, JOURNAL_MIGRATIONS, openJournal, LeaseStore, EventJournal, JournalJsonl } from './index.ts'

test('Given Unicode/tool结果和多run When 导出→导入→导出 Then 字节一致且可继续追加', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-jsonl-')); const a = await openJournal(join(directory, 'a.db')); const b = await openJournal(join(directory, 'b.db'))
  try {
    a.db.prepare('INSERT INTO sessions VALUES (?,?)').run('s1', JSON.stringify({ schemaVersion: 2, id: 's1', title: '中文😀', kernelId: 'pi', createdAt: 0, updatedAt: 0 }))
    const proof = new LeaseStore(a).claim('s1', 'desktop')
    new EventJournal(a).append(proof, [
      { ts: 1, turnId: 'turn1', kernelEvent: { t: 'message.delta', runId: 'r1', seq: 1, index: 0, text: '中文\n下一行' } },
      { ts: 2, turnId: 'turn2', kernelEvent: { t: 'done', runId: 'r2', seq: 1, reason: 'stop' } },
    ])
    const exported = new JournalJsonl(a).export('s1'); const target = new JournalJsonl(b)
    expect(target.import(exported)).toBe('s1'); expect(target.export('s1')).toBe(exported)
    const file = join(directory, 'export.jsonl'); target.exportFile('s1', file); expect(readFileSync(file, 'utf8')).toBe(exported)
    expect(() => target.import(exported)).toThrow('拒绝覆盖')
    const next = new LeaseStore(b).claim('s1', 'mobile')
    expect(new EventJournal(b).append(next, [{ ts: 3, turnId: 'turn2', kernelEvent: { t: 'done', runId: 'r2', seq: 2, reason: 'stop' } }]).toSeq).toBe(3)
  } finally { a.close(); b.close(); rmSync(directory, { recursive: true, force: true }) }
})
test('Given 导入损坏/跨会话/重复序号 When 校验失败 Then 无部分会话写入', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-jsonl-bad-')); const journal = await openJournal(join(directory, 'journal.db'))
  try {
    const io = new JournalJsonl(journal)
    const header = JSON.stringify({ format: 'proma-journal', version: 1, session: { schemaVersion: 2, id: 's1', title: '', kernelId: 'pi', createdAt: 0, updatedAt: 0 } })
    const event = { sessionId: 's1', seq: 1, ts: 1, turnId: 't1', kernelEvent: { t: 'done', runId: 'r1', seq: 1, reason: 'stop' } }
    for (const input of ['bad json', header + '\n\n', header + '\n' + JSON.stringify({ ...event, sessionId: 's2' }), header + '\n' + JSON.stringify(event) + '\n' + JSON.stringify(event)]) {
      expect(() => io.import(input)).toThrow(); expect(journal.db.prepare('SELECT * FROM sessions').all()).toEqual([])
    }
  } finally { journal.close(); rmSync(directory, { recursive: true, force: true }) }
})

test('Given 迁移失败只读库 When 导出修复包 Then 仍可读取且不能写入', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-jsonl-readonly-')); const path = join(directory, 'journal.db')
  const seed = await openJournal(path)
  seed.db.prepare('INSERT INTO sessions VALUES (?,?)').run('s1', JSON.stringify({ schemaVersion: 2, id: 's1', title: '修复', kernelId: 'pi', createdAt: 0, updatedAt: 0 })); seed.close()
  const journal = await openJournal(path, { targetVersion: JOURNAL_SCHEMA_VERSION+1, migrations: [...JOURNAL_MIGRATIONS,
    {version:JOURNAL_SCHEMA_VERSION+1,up:'NOT SQL',down:'NOT SQL'},
  ] })
  try {
    expect(journal.readOnly).toBe(true)
    const io = new JournalJsonl(journal); expect(io.export('s1')).toContain('修复')
    expect(() => io.import(io.export('s1'))).toThrow('只读')
    expect(() => journal.db.exec('PRAGMA query_only=OFF')).toThrow()
  } finally { journal.close(); rmSync(directory, { recursive: true, force: true }) }
})
