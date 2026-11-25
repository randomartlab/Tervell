import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { copyFileSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { JournalRetentionPolicySchema } from './retention.ts'
import type { JournalRetentionPolicy } from './retention.ts'

// Node 20 类型库尚无 node:sqlite；仅在驱动边界声明实际使用的原生接口。
type SqlValue = string | number | bigint | Uint8Array | null
interface Statement {
  run(...params: SqlValue[]): unknown
  get(...params: SqlValue[]): Record<string, SqlValue> | undefined
  all(...params: SqlValue[]): Array<Record<string, SqlValue>>
}
interface Database {
  exec(sql: string): void
  prepare(sql: string): Statement
  close(): void
}
interface SqliteModule {
  DatabaseSync: new (path: string, options?: { readOnly?: boolean }) => Database
  backup(db: Database, path: string): Promise<number>
}
export interface JournalMigration { version: number; up: string; down: string }
export interface JournalOptions { targetVersion?: number; migrations?: readonly JournalMigration[]; retention?: JournalRetentionPolicy }
export interface Journal {
  db: Database
  schemaVersion: number
  readOnly: boolean
  backupPath?: string
  migrationError?: string
  retention?: JournalRetentionPolicy
  close(): void
}
/** 存储结构版本独立于 Session.schemaVersion。 */
export const JOURNAL_SCHEMA_VERSION = 6
export const JOURNAL_MIGRATIONS: readonly JournalMigration[] = [
  { version: 1, up: 'CREATE TABLE sessions (id TEXT PRIMARY KEY, record TEXT NOT NULL)', down: 'DROP TABLE sessions' },
  { version: 2, up: `CREATE TABLE events (
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL CHECK(seq > 0), ts INTEGER NOT NULL, turn_id TEXT NOT NULL,
      kernel_event TEXT NOT NULL, PRIMARY KEY (session_id, seq)
    )`, down: 'DROP TABLE events' },
  { version: 3, up: `CREATE TABLE leases (
      session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE, holder_id TEXT NOT NULL,
      fence INTEGER NOT NULL CHECK(fence > 0), expires_at INTEGER NOT NULL, claim_key_id TEXT NOT NULL
    )`, down: 'DROP TABLE leases' },
  { version: 4, up: `CREATE TABLE journal_state (session_id TEXT PRIMARY KEY REFERENCES sessions(id), head_seq INTEGER NOT NULL, volume_size INTEGER NOT NULL);
      CREATE TABLE journal_runs (session_id TEXT NOT NULL REFERENCES sessions(id), run_id TEXT NOT NULL, last_seq INTEGER NOT NULL, PRIMARY KEY(session_id,run_id));
      CREATE TABLE journal_volumes (session_id TEXT NOT NULL REFERENCES sessions(id), number INTEGER NOT NULL, first_seq INTEGER NOT NULL, last_seq INTEGER NOT NULL, archived INTEGER NOT NULL, PRIMARY KEY(session_id,number));
      INSERT INTO journal_state SELECT session_id,MAX(seq),10000 FROM events GROUP BY session_id;
      INSERT INTO journal_volumes SELECT session_id,((seq-1)/10000)+1,MIN(seq),MAX(seq),0 FROM events GROUP BY session_id,((seq-1)/10000);
      INSERT INTO journal_runs SELECT session_id,json_extract(kernel_event,'$.runId'),MAX(json_extract(kernel_event,'$.seq')) FROM events GROUP BY session_id,json_extract(kernel_event,'$.runId');`,
    down: 'DROP TABLE journal_volumes; DROP TABLE journal_runs; DROP TABLE journal_state' },
  { version: 5, up: 'CREATE TABLE projection_snapshots (session_id TEXT PRIMARY KEY REFERENCES sessions(id), head_seq INTEGER NOT NULL, payload TEXT NOT NULL, digest TEXT NOT NULL)', down: 'DROP TABLE projection_snapshots' },
  {version:6,up:`CREATE TABLE service_state (key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE service_requests (session_id TEXT NOT NULL REFERENCES sessions(id),message_id TEXT NOT NULL,device_id TEXT NOT NULL,input_hash TEXT NOT NULL,text TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,run_id TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(session_id,message_id));
    CREATE TABLE service_directory (seq INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL,workspace_id TEXT NOT NULL,record TEXT);`,down:'DROP TABLE service_directory; DROP TABLE service_requests; DROP TABLE service_state'},
]

function versionOf(db: Database): number {
  const version = db.prepare('PRAGMA user_version').get()?.user_version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) throw new Error('数据库版本无效')
  return version
}
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error) }

function readOnlyHandle(db: Database): Database {
  const denied = (): never => { throw new Error('journal 已以只读模式打开') }
  return {
    exec(sql) {
      if (!/^\s*(BEGIN(?: DEFERRED)?|COMMIT|ROLLBACK)\s*;?\s*$/i.test(sql)) return denied()
      db.exec(sql)
    },
    prepare(sql) {
      // 同时阻止通过 PRAGMA query_only=OFF 或 statement.run 解除只读。
      const readQuery = /^\s*(SELECT|WITH|EXPLAIN)\b/i.test(sql)
      const metadataQuery = /^\s*PRAGMA\s+(user_version|query_only|table_info|index_list|index_info|foreign_key_list|foreign_key_check|integrity_check)\s*(\([^;]*\))?\s*;?\s*$/i.test(sql)
      if (!readQuery && !metadataQuery) return denied()
      const statement = db.prepare(sql)
      return { get: (...params) => statement.get(...params), all: (...params) => statement.all(...params), run: denied }
    },
    close: () => db.close(),
  }
}

/** ST-01 仅建立可逆结构；append、lease、旧 JSONL 导入分别由后续卡提供。 */
export async function openJournal(path: string, options: JournalOptions = {}): Promise<Journal> {
  if (!path || path === ':memory:') throw new Error('journal 必须使用可备份的文件路径')
  const retention = JournalRetentionPolicySchema.parse(options.retention ?? {})
  const migrations = options.migrations ?? JOURNAL_MIGRATIONS
  for (const [index, migration] of migrations.entries()) {
    if (migration.version !== index + 1 || !migration.up.trim() || !migration.down.trim()) throw new Error('迁移版本必须从 1 连续且有双向 SQL')
  }
  const target = options.targetVersion ?? migrations.length
  if (!Number.isInteger(target) || target < 0 || target > migrations.length) throw new Error('目标版本超出迁移范围')
  const sqlite: SqliteModule = createRequire(import.meta.url)('node:sqlite')
  mkdirSync(dirname(path), { recursive: true })
  let db = new sqlite.DatabaseSync(path)
  let transaction = false
  let backupPath: string | undefined
  try {
    db.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;')
    const current = versionOf(db)
    if (current > migrations.length) throw new Error(`数据库版本 ${current} 高于程序支持版本 ${migrations.length}`)
    if (current !== target) {
      const stagedBackup = `${path}.${randomUUID()}.bak.tmp`
      try {
        await sqlite.backup(db, stagedBackup)
        renameSync(stagedBackup, path + '.bak')
        backupPath = path + '.bak'
      } finally { rmSync(stagedBackup, { force: true }) }
      db.exec('BEGIN IMMEDIATE'); transaction = true
      // 拿到写锁后必须复核，避免两个打开者使用陈旧版本重复迁移。
      if (versionOf(db) !== current) throw new Error('数据库版本在迁移准备期间发生变化，请重新打开')
      for (let version = current; version !== target;) {
        const upgrading = version < target
        const migration = migrations[upgrading ? version : version - 1]
        if (!migration) throw new Error(`缺少版本 ${version} 的迁移`)
        db.exec(upgrading ? migration.up : migration.down)
        version += upgrading ? 1 : -1
        db.exec(`PRAGMA user_version = ${version}`)
      }
      db.exec('COMMIT'); transaction = false
    }
    db.exec('PRAGMA journal_mode = WAL;')
    const handle = db
    return { db: handle, schemaVersion: versionOf(handle), readOnly: false, backupPath, retention, close: () => handle.close() }
  } catch (error) {
    let message = `迁移失败：${errorText(error)}`
    if (transaction) {
      try { db.exec('ROLLBACK') } catch (rollbackError) { message += `；回滚失败：${errorText(rollbackError)}` }
    }
    try {
      // 保留已打开的 WAL 连接：Bun/macOS 的原生 readOnly 重开无法读取无侧车的 WAL 库。
      // query_only 由 SQLite 本身拒绝 INSERT/DDL，并非应用层只隐藏写按钮。
      db.exec('PRAGMA query_only = ON;')
      const handle = readOnlyHandle(db)
      return { db: handle, schemaVersion: versionOf(handle), readOnly: true, backupPath, retention, migrationError: message, close: () => handle.close() }
    } catch (readError) {
      db.close()
      throw new Error(`${message}；只读打开失败：${errorText(readError)}`)
    }
  }
}

/** 仅在所有 journal 连接已关闭的修复流程调用；还原备份的完整字节。 */
export function restoreJournalBackup(path: string): void {
  const temp = `${path}.${randomUUID()}.restore.tmp`
  try {
    copyFileSync(path + '.bak', temp)
    const sqlite: SqliteModule = createRequire(import.meta.url)('node:sqlite')
    const candidate = new sqlite.DatabaseSync(temp)
    try {
      if (candidate.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok') throw new Error('备份完整性检查失败')
      versionOf(candidate)
    } finally { candidate.close() }
    // 旧 WAL 绝不能重放到已还原的主文件。
    rmSync(path + '-wal', { force: true }); rmSync(path + '-shm', { force: true })
    renameSync(temp, path)
  } finally { rmSync(temp, { force: true }) }
}

export { LeaseStore, journalTransaction } from './lease.ts'

export { EventJournal } from './events.ts'
export { TimelineProjector } from './projector.ts'

export { ProjectionSnapshots } from './snapshots.ts'
export { JournalJsonl } from './jsonl.ts'
export { JournalRetention, JournalCapacityError, JournalRetentionPolicySchema } from './retention.ts'
export type { JournalRetentionPolicy, JournalUsage, CleanupCandidate } from './retention.ts'
