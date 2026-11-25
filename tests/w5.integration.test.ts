import { test, expect } from 'bun:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { AcpTraceSchema } from '../packages/protocol/src/index.ts'
import { acpDialect, replayAcpTrace } from '../packages/kernel-host/src/index.ts'
import { EventJournal, LeaseStore, openJournal, TimelineProjector } from '../packages/core/src/store/index.ts'

test('Given 真实OMP脱敏trace When 离线归一入journal并重复回放 Then 工具审批与投影一致', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-w5-integration-')); const journal = await openJournal(join(directory, 'journal.db'))
  try {
    const trace = AcpTraceSchema.parse(JSON.parse(readFileSync(fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/dialects/omp-live-tools.json', import.meta.url)), 'utf8')))
    expect(trace.origin).toBe('live'); const run = replayAcpTrace(trace, acpDialect('omp'))[0]!
    expect(run.filter((event) => event.t === 'tool.call').map((event) => event.call.kind)).toEqual(['read', 'edit', 'execute'])
    expect(run.some((event) => event.t === 'permission.request')).toBe(true)
    journal.db.exec("INSERT INTO sessions VALUES ('s1','{}')")
    const proof = new LeaseStore(journal).claim('s1', 'test'); const store = new EventJournal(journal)
    store.append(proof, run.map((event) => ({ ts: 0, turnId: 'turn1', kernelEvent: event })))
    const first = new TimelineProjector('s1'); const second = new TimelineProjector('s1')
    for (const event of store.read('s1')) { first.apply(event); second.apply(event); second.apply(event) }
    expect(JSON.stringify(first.rows())).toBe(JSON.stringify(second.rows()))
    expect(first.rows().filter((row) => row.kind === 'tool')).toHaveLength(3)
    expect(first.rows().filter((row) => row.kind === 'tool').every((row) => row.status === 'succeeded')).toBe(true)
  } finally { journal.close(); rmSync(directory, { recursive: true, force: true }) }
})
