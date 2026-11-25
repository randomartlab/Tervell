import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AgentKernelRegistry, ScriptedKernel, KernelSessionSwitcher } from '../packages/kernel-host/src/index.ts'
import { EventJournal, JournalJsonl, LeaseStore, openJournal, ProjectionSnapshots, TimelineProjector } from '../packages/core/src/store/index.ts'
import { SessionSchema } from '../packages/protocol/src/index.ts'

test('Given 内核A/B切换 When 事件落库/快照/补洞/导出往返 Then 投影一致且无旧run串台', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-w3-integration-'))
  const journal = await openJournal(join(directory, 'source.db')); const target = await openJournal(join(directory, 'target.db'))
  const registry = new AgentKernelRegistry()
  for (const id of ['alpha', 'beta']) registry.register(new ScriptedKernel(id, (input) => [
    { event: { t: 'message.delta', runId: input.runId, seq: 1, index: 0, text: id, kind: 'text' } },
    { event: { t: 'message.final', runId: input.runId, seq: 2, message: { id: `msg_${input.runId}`, role: 'assistant', content: [{ type: 'text', text: id }], createdAt: 0 } } },
    { event: { t: 'done', runId: input.runId, seq: 3, reason: 'stop' } },
  ]))
  const switcher = new KernelSessionSwitcher(registry, { sessionId: 's1', cwd: directory, systemPrompt: '' })
  try {
    const session = SessionSchema.parse({ schemaVersion: 2, id: 's1', title: '切换测试', kernelId: 'alpha', createdAt: 0, updatedAt: 0 })
    journal.db.prepare('INSERT INTO sessions VALUES (?,?)').run(session.id, JSON.stringify(session))
    const proof = new LeaseStore(journal).claim('s1', 'test'); const events = new EventJournal(journal)
    const projection = new TimelineProjector('s1'); const snapshots = new ProjectionSnapshots(journal)
    for (const [number, id] of ['alpha', 'beta', 'alpha'].entries()) {
      await switcher.switchTo(id)
      for await (const event of switcher.prompt({ runId: `r${number}`, text: '继续' }, [], '摘要', new AbortController().signal)) events.append(proof, [{ turnId: `t${number}`, ts: number, kernelEvent: event }])
      if (number === 0) { events.read('s1').forEach((row) => projection.apply(row)); snapshots.save(proof, projection) }
    }
    snapshots.fill(projection, 4, 9)
    expect(snapshots.load('s1').rows()).toEqual(projection.rows())
    expect(projection.rows().filter((row) => row.kind === 'text').map((row) => row.summary)).toEqual(['alpha', 'beta', 'alpha'])
    const exported = new JournalJsonl(journal).export('s1'); const io = new JournalJsonl(target)
    io.import(exported); expect(io.export('s1')).toBe(exported)
    const restored = new TimelineProjector('s1'); new EventJournal(target).read('s1').forEach((row) => restored.apply(row))
    expect(JSON.stringify(restored.rows())).toBe(JSON.stringify(projection.rows()))
  } finally { await switcher.close(); journal.close(); target.close(); rmSync(directory, { recursive: true, force: true }) }
})
