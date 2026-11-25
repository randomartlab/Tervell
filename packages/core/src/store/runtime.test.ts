import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('Given Electron 原生 Node When 执行 SQLite 升降级和失败恢复 Then 与 Bun 行为一致', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-journal-electron-'))
  try {
    const source = join(directory, 'verify.ts')
    const output = join(directory, 'verify.mjs')
    await Bun.write(source, `
      import assert from 'node:assert/strict'
      import { readFileSync } from 'node:fs'
      import { openJournal, restoreJournalBackup, LeaseStore, EventJournal, TimelineProjector } from ${JSON.stringify(join(import.meta.dir, 'index.ts'))}
      const file = ${JSON.stringify(join(directory, 'journal.db'))}
      const first = await openJournal(file, {targetVersion: 1})
      assert.equal(first.schemaVersion, 1)
      first.db.exec("INSERT INTO sessions VALUES ('keep', '{}')")
      first.close()
      const next = await openJournal(file, { targetVersion: 2 })
      assert.equal(next.schemaVersion, 2)
      assert.equal(next.db.prepare('SELECT id FROM sessions').get().id, 'keep')
      next.close()
      const current = await openJournal(file)
      const proof = new LeaseStore(current).claim('keep','electron')
      const events = new EventJournal(current)
      events.append(proof,[{ts:1,turnId:'turn1',kernelEvent:{t:'message.delta',runId:'run1',seq:1,index:0,text:'Electron'}}])
      const projector = new TimelineProjector('keep')
      for(const event of events.read('keep')) {projector.apply(event);projector.apply(event)}
      assert.equal(projector.rows()[0].summary,'Electron')
      const newer = new LeaseStore(current).claim('keep','other',true)
      assert.equal(newer.fence,proof.fence+1)
      assert.throws(()=>events.append(proof,[{ts:2,turnId:'turn1',kernelEvent:{t:'done',runId:'run1',seq:2,reason:'stop'}}]))
      current.close()
      const backup = readFileSync(file + '.bak')
      restoreJournalBackup(file)
      assert.deepEqual(readFileSync(file), backup)
      const down = await openJournal(file, { targetVersion: 1 })
      assert.equal(down.schemaVersion, 1)
      down.close()
      const failed = await openJournal(file, {targetVersion: 2, migrations: [
        {version: 1, up: 'CREATE TABLE sessions(id TEXT, record TEXT)', down:'DROP TABLE sessions'},
        {version: 2, up: 'NOT SQL', down:'NOT SQL'},
      ]})
      assert.equal(failed.readOnly, true)
      assert.equal(failed.schemaVersion, 1)
      assert.throws(() => failed.db.exec('DELETE FROM sessions'))
      assert.throws(() => failed.db.prepare('PRAGMA query_only=OFF').get())
      assert.equal(failed.db.prepare('SELECT id FROM sessions').get().id, 'keep')
      failed.close()
      console.log('Electron SQLite smoke OK')
    `)
    const build = await Bun.build({ entrypoints: [source], target: 'node', format: 'esm', external: ['node:sqlite'] })
    expect(build.success).toBe(true)
    if (!build.outputs[0]) throw new Error('未生成 Electron 冒烟程序')
    await Bun.write(output, build.outputs[0])
    const binary: string = createRequire(import.meta.url)('electron')
    const result = spawnSync(binary, [output], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', timeout: 15000 })
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)
    expect(result.stdout).toContain('Electron SQLite smoke OK')
  } finally { rmSync(directory, { recursive: true, force: true }) }
}, 20000)
