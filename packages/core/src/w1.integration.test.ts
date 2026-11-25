import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ApiRequestSchema, KernelCapabilitiesSchema, KernelDefinitionSchema, KernelEventSchema, KernelProjectionSchema, PluginManifestSchema, SCHEMA_VERSION, SessionSchema, normalizePermissionPolicy, parseApiResponse } from '@proma/protocol'
import { decidePermission } from './permission/index.ts'
import { openJournal } from './store/index.ts'

test('Given W1 契约 When 插件绑定内核并读取 journal Then 权限策略、会话存储与移动裁剪贯通', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-w1-'))
  const journal = await openJournal(join(directory, 'journal.db'))
  try {
    const capabilities = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null } })
    const kernel = KernelDefinitionSchema.parse({ id: 'fixture', name: '验证内核', cli: 'fixture', tier: 'pty', pty: {}, capabilities })
    const projection = KernelProjectionSchema.parse({ transport: 'pty', mcp: 'none', fsCallback: false, terminalCallback: false, permissionGate: 'none', usageDetail: 'none', systemPromptInjection: 'prepend-text' })
    const plugin = PluginManifestSchema.parse({ api: 1, engines: { proma: '>=0.20' }, display: { title: '验证主题' }, capabilities: [], data: { themes: ['theme.json'] } })
    expect(plugin.data?.themes).toHaveLength(1)
    expect(projection.permissionGate).toBe('none')
    const session = SessionSchema.parse({ schemaVersion: SCHEMA_VERSION, id: 's1', title: '验证会话', kernelId: kernel.id, permissionMode: 'plan', createdAt: 0, updatedAt: 0 })
    journal.db.prepare('INSERT INTO sessions (id, record) VALUES (?, ?)').run(session.id, JSON.stringify(session))
    const stored = journal.db.prepare('SELECT record FROM sessions WHERE id=?').get(session.id)?.record
    if (typeof stored !== 'string') throw new Error('会话存储结果错误')
    const loaded = SessionSchema.parse(JSON.parse(stored))
    expect(decidePermission(normalizePermissionPolicy(loaded.permissionMode), { kind: 'edit', readOnlyCommand: false })).toBe('deny')
    const request = ApiRequestSchema.parse({ clientKind: 'mobile', requestId: 'r1', method: 'session.detail', params: { id: session.id } })
    expect(parseApiResponse('session.detail', request.clientKind, { session: loaded }).session?.kernelId).toBe(kernel.id)
    const event = KernelEventSchema.parse({ t: 'message.delta', runId: 'run1', seq: 1, index: 0, text: '已读取' })
    expect(event.runId).toBe('run1')
    const result = parseApiResponse('session.timeline', 'mobile', { epoch: 'e1', hasOlder: false, hasNewer: false, rows: [{ id: 'row1', turnId: 'turn1', seqStart: event.seq, seqEnd: event.seq, kind: 'text', summary: '已读取', sourceSeqRanges: [{ start: 1, end: 1 }] }] })
    expect(result.rows[0]).not.toHaveProperty('sourceSeqRanges')
  } finally { journal.close(); rmSync(directory, { recursive: true, force: true }) }
})
