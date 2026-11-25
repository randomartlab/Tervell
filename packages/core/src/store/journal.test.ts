import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JOURNAL_SCHEMA_VERSION, openJournal, restoreJournalBackup } from './index.ts'

const directories: string[] = []
function fixture() { const dir = mkdtempSync(join(tmpdir(), 'proma-journal-')); directories.push(dir); return join(dir, 'journal.db') }
afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe('ST-01 SQLite 迁移框架', () => {
  test('Given 新库 When 打开两次 Then 初始化独立存储版本且幂等', async () => {
    const file = fixture()
    const first = await openJournal(file)
    expect(first.readOnly).toBe(false)
    expect(first.schemaVersion).toBe(JOURNAL_SCHEMA_VERSION)
    first.db.prepare('INSERT INTO sessions (id, record) VALUES (?, ?)').run('s1', '{"title":"保留"}')
    first.close()
    const second = await openJournal(file)
    expect(second.schemaVersion).toBe(JOURNAL_SCHEMA_VERSION)
    expect(second.db.prepare('SELECT record FROM sessions WHERE id = ?').get('s1')).toEqual({ record: '{"title":"保留"}' })
    expect(second.backupPath).toBeUndefined()
    second.close()
  })
  test('Given 有数据的 v1 When 升到 v2 再降级 Then 逻辑数据一致且更新版本', async () => {
    const file = fixture()
    const initial = await openJournal(file, { targetVersion: 1 })
    initial.db.prepare('INSERT INTO sessions (id, record) VALUES (?, ?)').run('s1', '{"updatedAt":12}')
    const before = initial.db.prepare('SELECT * FROM sessions ORDER BY id').all()
    initial.close()
    const upgraded = await openJournal(file, { targetVersion: 2 })
    expect(upgraded.schemaVersion).toBe(2)
    expect(upgraded.backupPath).toBe(file + '.bak')
    upgraded.close()
    const downgraded = await openJournal(file, { targetVersion: 1 })
    expect(downgraded.schemaVersion).toBe(1)
    expect(downgraded.db.prepare('SELECT * FROM sessions ORDER BY id').all()).toEqual(before)
    downgraded.close()
  })
  test('Given 三步自定义迁移 When 升降级 Then 严格按版本链执行', async () => {
    const file = fixture()
    const migrations = [
      { version: 1, up: 'CREATE TABLE records (id TEXT PRIMARY KEY)', down: 'DROP TABLE records' },
      { version: 2, up: 'ALTER TABLE records ADD COLUMN extra TEXT', down: 'ALTER TABLE records DROP COLUMN extra' },
      { version: 3, up: 'CREATE INDEX record_extra ON records(extra)', down: 'DROP INDEX record_extra' },
    ]
    const first = await openJournal(file, { migrations, targetVersion: 1 })
    first.db.exec("INSERT INTO records VALUES ('keep')")
    first.close()
    const up = await openJournal(file, { migrations, targetVersion: 3 }); expect(up.schemaVersion).toBe(3); up.close()
    const down = await openJournal(file, { migrations, targetVersion: 1 })
    expect(down.schemaVersion).toBe(1)
    expect(down.db.prepare('SELECT * FROM records').all()).toEqual([{ id: 'keep' }])
    down.close()
  })
  test('Given 中途迁移失败 When 打开 Then 整链回滚并真正只读', async () => {
    const file = fixture()
    const initial = await openJournal(file, { targetVersion: 1 }); initial.close()
    const failed = await openJournal(file, { targetVersion: 3, migrations: [
      { version: 1, up: 'CREATE TABLE sessions (id TEXT PRIMARY KEY, record TEXT NOT NULL)', down: 'DROP TABLE sessions' },
      { version: 2, up: 'CREATE TABLE transient_table (id TEXT)', down: 'DROP TABLE transient_table' },
      { version: 3, up: 'THIS IS NOT SQL', down: 'DROP TABLE missing_table' },
    ] })
    expect(failed.readOnly).toBe(true)
    expect(failed.schemaVersion).toBe(1)
    expect(failed.migrationError).toContain('迁移失败')
    expect(failed.db.prepare("SELECT name FROM sqlite_master WHERE name='transient_table'").all()).toEqual([])
    expect(() => failed.db.exec("INSERT INTO sessions VALUES ('x', '{}')")).toThrow()
    expect(() => failed.db.exec('PRAGMA query_only=OFF')).toThrow()
    expect(() => failed.db.prepare('PRAGMA query_only=OFF').get()).toThrow()
    expect(() => failed.db.prepare("WITH x AS (SELECT 1) DELETE FROM sessions RETURNING id").all()).toThrow()
    failed.close()
  })
  test('Given 最新版本高于程序支持 When 打开 Then 不自动降级且只读', async () => {
    const file = fixture()
    const initial = await openJournal(file); initial.db.exec('PRAGMA user_version = 99'); initial.close()
    const newer = await openJournal(file)
    expect(newer.readOnly).toBe(true)
    expect(newer.schemaVersion).toBe(99)
    expect(newer.migrationError).toContain('版本')
    newer.close()
  })
  test('Given WAL 中已有数据 When 迁移并恢复备份 Then 数据完整且备份字节一致', async () => {
    const file = fixture()
    const old = await openJournal(file, { targetVersion: 1 })
    old.db.exec("INSERT INTO sessions VALUES ('wal', '{}')")
    const next = await openJournal(file)
    expect(next.backupPath).toBe(file + '.bak')
    next.close(); old.close()
    const saved = readFileSync(file + '.bak')
    restoreJournalBackup(file)
    expect(readFileSync(file)).toEqual(saved)
    const restored = await openJournal(file, { targetVersion: 1 })
    expect(restored.db.prepare('SELECT id FROM sessions').all()).toEqual([{ id: 'wal' }])
    restored.close()
  })
  test('Given 无效/断裂迁移定义 When 调用 Then 明确拒绝', async () => {
    const file = fixture()
    await expect(openJournal(file, { targetVersion: -1 })).rejects.toThrow('版本')
    await expect(openJournal(file, { migrations: [{ version: 2, up: 'SELECT 1', down: 'SELECT 1' }] })).rejects.toThrow('连续')
  })
  test('Given 恢复路径缺备份 When 恢复 Then 明确失败', () => expect(() => restoreJournalBackup(fixture())).toThrow())
  test('Given 损坏的备份 When 尝试恢复 Then 保留当前库字节', async () => {
    const file = fixture()
    const initial = await openJournal(file); initial.close()
    const before = readFileSync(file)
    writeFileSync(file + '.bak', '损坏的 SQLite 备份')
    expect(() => restoreJournalBackup(file)).toThrow()
    expect(readFileSync(file)).toEqual(before)
  })
})

test('Given v5既有journal When 升至服务存储v6再回滚 Then 用户会话与事件逻辑不变且服务表可重建',async()=>{
 const file=fixture(),first=await openJournal(file,{targetVersion:5})
 first.db.prepare('INSERT INTO sessions VALUES (?,?)').run('s1','{"title":"keep"}');first.db.prepare('INSERT INTO events VALUES (?,?,?,?,?)').run('s1',1,1,'t1',JSON.stringify({t:'done',runId:'r1',seq:1,reason:'stop'}));const original=first.db.prepare('SELECT * FROM sessions').all(),events=first.db.prepare('SELECT * FROM events').all();first.close()
 const up=await openJournal(file);expect(up.schemaVersion).toBe(6)
 expect(up.db.prepare("SELECT name FROM sqlite_master WHERE name='service_requests'").get()?.name).toBe('service_requests')
 up.db.prepare("INSERT INTO service_state VALUES ('test','data')").run();up.close()
 const down=await openJournal(file,{targetVersion:5});expect(down.db.prepare('SELECT * FROM sessions').all()).toEqual(original);expect(down.db.prepare('SELECT * FROM events').all()).toEqual(events)
 expect(down.db.prepare("SELECT name FROM sqlite_master WHERE name='service_requests'").get()).toBeUndefined();down.close()
})
