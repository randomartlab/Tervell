import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { KernelProcessHost } from '../packages/kernel-host/src/process.ts'
import { EventJournal, LeaseStore, openJournal, TimelineProjector } from '../packages/core/src/store/index.ts'

test('Given 真实内核子进程被杀 When 恢复并落 journal Then 租约写入和投影重放一致', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-w2-'))
  const path = join(directory, 'journal.db'); const journal = await openJournal(path)
  const host = new KernelProcessHost({ entry: fileURLToPath(new URL('../packages/kernel-host/src/test-fixtures/child.ts', import.meta.url)), executable: process.execPath, recoverOnce: true, startupTimeoutMs: 2000, timeoutMs: 2000 })
  try {
    journal.db.exec("INSERT INTO sessions VALUES ('s1','{}')")
    const proof = new LeaseStore(journal).claim('s1', 'desktop'); const store = new EventJournal(journal)
    let killed = false
    await host.run({ sessionId: 's1', runId: 'run1', prompt: 'crash-once', resumeToken: 'checkpoint' }, (event) => {
      store.append(proof, [{ turnId: 'turn1', ts: 1, kernelEvent: event }])
      if (!killed && host.pid) { killed = true; process.kill(host.pid, 'SIGKILL') }
    })
    expect(killed).toBe(true); expect(host.restarts).toBe(1)
    const first = new TimelineProjector('s1'); for (const event of store.read('s1')) first.apply(event)
    const reopened = await openJournal(path)
    try {
      const second = new TimelineProjector('s1')
      for (const event of new EventJournal(reopened).read('s1')) { second.apply(event); second.apply(event) }
      expect(JSON.stringify(second.rows())).toBe(JSON.stringify(first.rows()))
      expect(second.rows()[0]?.summary).toBe('已确认续跑')
      const newer = new LeaseStore(reopened).claim('s1', 'mobile', true)
      expect(() => store.append(proof, [{ turnId: 'turn1', ts: 1, kernelEvent: { t: 'done', runId: 'run1', seq: 4, reason: 'stop' } }])).toThrow('lease')
      expect(newer.fence).toBe(proof.fence + 1)
    } finally { reopened.close() }
    expect(host.pid).toBeUndefined()
  } finally { await host.stop(); journal.close(); rmSync(directory, { recursive: true, force: true }) }
})
