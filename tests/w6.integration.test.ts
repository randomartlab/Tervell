import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'
import { AcpKernel } from '../packages/kernel-host/src/acp/kernel.ts'
import { ToolCatalog } from '../packages/tool-bridge/src/catalog.ts'
import { registerPlanningTools } from '../packages/tool-bridge/src/planning.ts'
import { createPlanningBackend } from '../packages/tool-bridge/src/planning-backend.ts'
import { SessionToolServer } from '../packages/tool-bridge/src/server.ts'
import { fixturePlanningStore } from '../packages/tool-bridge/src/test-fixtures/store.ts'
import type { KernelEvent } from '../packages/protocol/src/index.ts'

test('Given ACP测试内核 When session/new收到每会话MCP配置 Then stdio握手并创建读取同项目Todo与日程', async () => {
  const store = fixturePlanningStore(); const catalog = new ToolCatalog()
  registerPlanningTools(catalog, createPlanningBackend(store))
  let toolHost: SessionToolServer | undefined
  const kernel = new AcpKernel('w6-scripted', {
    command: process.execPath, args: [fileURLToPath(new URL('../packages/tool-bridge/src/test-fixtures/acp-agent.ts', import.meta.url))], timeoutMs: 5000,
    openToolBridge: async (input) => {
      toolHost = await SessionToolServer.open({ context: { sessionId: input.sessionId, workspaceId: 'w1', permission: { mode: 'ask', plan: false }, triggeredBy: 'user' }, catalog, authorize: async () => true, runtime: { command: process.execPath, args: [fileURLToPath(new URL('../packages/tool-bridge/src/stdio.ts', import.meta.url))] } })
      return { config: toolHost.config(), close: () => toolHost!.close() }
    },
  })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: process.cwd(), systemPrompt: '' })
  try {
    expect(kernel.capabilities.tools).toMatchObject({ mcp: true, perSessionMcp: true })
    const events: KernelEvent[] = []
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: '创建任务' }, { signal: new AbortController().signal })) events.push(event)
    expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
    expect(events.some((e) => e.t === 'error')).toBe(false)
    expect(store.listTodos()).toHaveLength(1)
    expect(store.listTodos()[0]).toMatchObject({ title: 'ACP 创建任务', workspaceId: 'w1' })
    expect(store.listCalendarEvents()).toHaveLength(1)
    expect(store.listCalendarEvents()[0]).toMatchObject({ title: 'ACP 创建日程', workspaceId: 'w1', startAt: 100 })
    expect(JSON.stringify(events)).toContain('mcp__proma__todo_create')
  } finally { await kernel.close(handle) }
  expect(() => toolHost!.config()).toThrow('关闭')
}, 15000)
