import { test, expect } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AcpKernel, AcpRunTimeline } from '../packages/kernel-host/src/index.ts'
import { PermissionRules, PathBoundary } from '../packages/core/src/permission/index.ts'
import { openJournal, LeaseStore, EventJournal, TimelineProjector } from '../packages/core/src/store/index.ts'
import { SessionSchema } from '../packages/protocol/src/index.ts'
import type { KernelEvent, BoundaryAudit } from '../packages/protocol/src/index.ts'

// 真实本机ACP脚本子进程；不启动外部模型/桌面，不执行脚本声明的工具。
test('Given ACP审批/乱序事件 When 经过权限边界与journal Then 时间线不串run且可确定重放', async () => {
  const directory = realpathSync.native(mkdtempSync(join(tmpdir(), 'proma-w4-')))
  mkdirSync(join(directory, 'workspace')); writeFileSync(join(directory, 'workspace/fixture'), '可读')
  const journal = await openJournal(join(directory, 'journal.db'))
  const kernel = new AcpKernel('script-acp', { command: process.execPath, args: [fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/server.ts', import.meta.url))], timeoutMs: 1500 })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: join(directory, 'workspace'), systemPrompt: '' })
  try {
    const logs: BoundaryAudit[] = []; const boundary = new PathBoundary({ cwd: join(directory, 'workspace') }, (event) => logs.push(event))
    const rules = new PermissionRules(); const events: KernelEvent[] = []
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'approval unknown' }, { signal: new AbortController().signal })) {
      events.push(event)
      if (event.t === 'permission.request') {
        expect(rules.evaluate('s1', { mode: 'ask', plan: false }, { tool: 'Read', input: { path: 'fixture' } }).decision).toBe('allow')
        boundary.assert('fixture', 'read')
        const action = event.req.actions.find((choice) => choice.behavior === 'allow')!
        await kernel.respondPermission(handle, event.req.requestId, { actionId: action.id, behavior: 'allow' })
      }
    }
    expect(new Set(events.map((event) => event.t)).size).toBe(11)
    expect(() => boundary.assert('../journal.db', 'read')).toThrow()
    expect(logs.some((item) => !item.allowed)).toBe(true)
    expect(rules.evaluate('s1', { mode: 'auto', plan: false }, { tool: 'Bash', command: 'git push --force' }).decision).toBe('deny')
    const session = SessionSchema.parse({ schemaVersion: 2, id: 's1', title: 'ACP', kernelId: 'script-acp', createdAt: 0, updatedAt: 0 })
    journal.db.prepare('INSERT INTO sessions VALUES (?,?)').run('s1', JSON.stringify(session))
    const proof = new LeaseStore(journal).claim('s1', 'desktop'); const store = new EventJournal(journal)
    const gate = new AcpRunTimeline('s1'); gate.begin(1, 'r1')
    // 先收到seq2，再seq1；重复seq1不得重复追加，旧epoch也不能进入。
    const order = [events[1]!, events[0]!, events[0]!, ...events.slice(2)]
    for (const event of order) for (const ready of gate.accept({ sessionId: 's1', epoch: 1, event })) store.append(proof, [{ turnId: 'turn1', ts: 0, kernelEvent: ready }])
    expect(store.read('s1')).toHaveLength(events.length)
    gate.begin(2, 'r2'); expect(gate.accept({ sessionId: 's1', epoch: 1, event: events[0] })).toEqual([])
    const a = new TimelineProjector('s1'); const b = new TimelineProjector('s1')
    for (const stored of store.read('s1')) { a.apply(stored); b.apply(stored); b.apply(stored) }
    expect(JSON.stringify(a.rows())).toBe(JSON.stringify(b.rows()))
    expect(a.rows().some((row) => row.summary === '你好😀')).toBe(true)
  } finally { await kernel.close(handle); journal.close(); rmSync(directory, { recursive: true, force: true }) }
})
