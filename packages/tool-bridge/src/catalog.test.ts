import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { ToolCatalog } from './catalog.ts'
import { registerPlanningTools } from './planning.ts'
import { createPlanningBackend } from './planning-backend.ts'
import { fixturePlanningStore } from './test-fixtures/store.ts'
import type { ToolContext } from '@proma/protocol'
const context: ToolContext = { sessionId: 's1', workspaceId: 'w1', permission: { mode: 'ask', plan: false }, triggeredBy: 'user' }
const execution = (value = context) => ({ context: value, signal: new AbortController().signal })
const fixture = () => { const catalog = new ToolCatalog(); const store = fixturePlanningStore(); registerPlanningTools(catalog, createPlanningBackend(store)); return { catalog, store } }
describe('TL-01/03 工具目录与产品操作', () => {
  test('Given 产品目录 When 读取快照 Then 名称权限和schema稳定且不可通过快照改写', () => {
    const { catalog } = fixture(); const rows = catalog.snapshot()
    expect(rows.map((item) => [item.name, item.effect])).toEqual([
      ['mcp__proma__calendar_create', 'write'], ['mcp__proma__calendar_delete', 'delete'], ['mcp__proma__calendar_list', 'read'], ['mcp__proma__calendar_update', 'write'],
      ['mcp__proma__todo_create', 'write'], ['mcp__proma__todo_delete', 'delete'], ['mcp__proma__todo_list', 'read'], ['mcp__proma__todo_update', 'write'],
    ])
    expect(rows[0]?.inputSchema.additionalProperties).toBe(false)
    expect(catalog.get('mcp__proma__todo_list')?.effect).toBe('read')
    expect(catalog.get('missing')).toBeUndefined()
    rows[0]!.effect = 'read'; expect(catalog.snapshot()[0]?.effect).toBe('write')
    expect(() => registerPlanningTools(catalog, createPlanningBackend(fixturePlanningStore()))).toThrow('已注册')
    expect(() => catalog.register({ name: 'bad', description: 'x', kind: 'read', effect: 'read' }, z.json(), z.json(), async () => null)).toThrow()
  })
  test('Given ask四档及plan When 创建/删除 Then 不靠内核回调也强制门禁', async () => {
    const { catalog } = fixture(); let approvals = 0
    const allow = async () => { approvals++; return true }
    for (const mode of ['read-only', 'ask', 'accept-edits', 'auto'] as const) for (const plan of [false, true]) {
      const call = catalog.execute('mcp__proma__todo_create', { title: '任务' }, execution({ ...context, permission: { mode, plan } }), allow)
      if (plan || mode === 'read-only') await expect(call).rejects.toThrow('权限')
      else await call
    }
    expect(approvals).toBe(2)
    await expect(catalog.execute('mcp__proma__todo_create', { title: '拒绝' }, execution(), async () => false)).rejects.toThrow('拒绝')
    const created = await catalog.execute('mcp__proma__todo_create', { title: '删除' }, execution(), allow) as { id: string; updatedAt: number }
    await expect(catalog.execute('mcp__proma__todo_delete', { id: created.id, expectedUpdatedAt: created.updatedAt }, execution({ ...context, triggeredBy: 'automation' }), allow)).rejects.toThrow()
    await expect(catalog.execute('mcp__proma__todo_delete', { id: created.id, expectedUpdatedAt: created.updatedAt }, execution({ ...context, permission: { mode: 'auto', plan: false } }), async () => false)).rejects.toThrow('拒绝')
  })
  test('Given 两项目任务 When 更新删除与伪造上下文 Then 越界、旧版本和非法参数不执行', async () => {
    const { catalog, store } = fixture(); const allow = async () => true
    const a = store.createTodo({ title: 'A', workspaceId: 'w1', sessionId: 's1' }), b = store.createTodo({ title: 'B', workspaceId: 'w2', sessionId: 's2' })
    expect(await catalog.execute('mcp__proma__todo_list', {}, execution(), allow)).toMatchObject({ todos: [{ id: a.id }] })
    await expect(catalog.execute('mcp__proma__todo_update', { id: b.id, expectedUpdatedAt: b.updatedAt, status: 'completed' }, execution(), allow)).rejects.toThrow('当前项目')
    await expect(catalog.execute('mcp__proma__todo_delete', { id: a.id, expectedUpdatedAt: a.updatedAt + 1 }, execution(), allow)).rejects.toThrow('修改')
    for (const input of [{ title: 'x', workspaceId: 'w2' }, { title: 'x', permission: { mode: 'auto' } }, { title: ' ' }]) await expect(catalog.execute('mcp__proma__todo_create', input, execution(), allow)).rejects.toThrow()
    await catalog.execute('mcp__proma__todo_update', { id: a.id, expectedUpdatedAt: a.updatedAt, status: 'completed' }, execution(), allow)
    expect(store.getTodo(a.id)?.status).toBe('completed'); expect(store.getTodo(b.id)?.status).toBe('open')
    await expect(catalog.execute('mcp__proma__calendar_create', { title: '倒置', startAt: 10, endAt: 1 }, execution(), allow)).rejects.toThrow()
    const event = await catalog.execute('mcp__proma__calendar_create', { title: '日程', startAt: 10, endAt: 20 }, execution(), allow) as { id: string; updatedAt: number }
    await expect(catalog.execute('mcp__proma__calendar_update', { id: event.id, expectedUpdatedAt: event.updatedAt, startAt: 30 }, execution(), allow)).rejects.toThrow('早于')
    expect(store.getCalendarEvent(event.id)?.startAt).toBe(10)
  })
  test('Given 已取消请求 When 执行 Then 后端不产生写入', async () => {
    const { catalog, store } = fixture(); const stop = new AbortController(); stop.abort()
    await expect(catalog.execute('mcp__proma__todo_create', { title: '取消' }, { context, signal: stop.signal }, async () => true)).rejects.toThrow('取消')
    expect(store.listTodos()).toHaveLength(0)
  })
})

test('Given 外部发起auto模式 When 产品写操作 Then 仍需显式批准', async () => {
  const { catalog, store } = fixture()
  await expect(catalog.execute('mcp__proma__todo_create', { title: '外部' }, execution({ ...context, permission: { mode: 'auto', plan: false }, triggeredBy: 'external' }), async () => false)).rejects.toThrow('拒绝')
  expect(store.listTodos()).toHaveLength(0)
})

test('Given 产品工具CRUD When 完成、重读与删除 Then Todo日程均有实际状态改变', async () => {
  const { catalog, store } = fixture(), allow = async () => true
  const todo = await catalog.execute('mcp__proma__todo_create', { title: '任务', dueAt: 10 }, execution(), allow) as { id: string; updatedAt: number }
  const updated = await catalog.execute('mcp__proma__todo_update', { id: todo.id, expectedUpdatedAt: todo.updatedAt, status: 'completed' }, execution(), allow) as { id: string; updatedAt: number }
  await catalog.execute('mcp__proma__todo_delete', { id: updated.id, expectedUpdatedAt: updated.updatedAt }, execution(), allow)
  expect(store.listTodos()).toHaveLength(0)
  const event = await catalog.execute('mcp__proma__calendar_create', { title: '日程', startAt: 10, endAt: 20 }, execution(), allow) as { id: string; updatedAt: number }
  const changed = await catalog.execute('mcp__proma__calendar_update', { id: event.id, expectedUpdatedAt: event.updatedAt, title: '已修改', endAt: null }, execution(), allow) as { id: string; updatedAt: number }
  expect(store.getCalendarEvent(event.id)?.title).toBe('已修改')
  expect(await catalog.execute('mcp__proma__calendar_list', {}, execution(), allow)).toMatchObject({ events: [{ title: '已修改' }] })
  await catalog.execute('mcp__proma__calendar_delete', { id: event.id, expectedUpdatedAt: changed.updatedAt }, execution(), allow)
  expect(store.listCalendarEvents()).toHaveLength(0)
})

test('Given 等待审批时会话项目改变 When 用户批准 Then 执行前重新验证项目', async () => {
  const { catalog, store } = fixture()
  let active = true
  const assertContext = () => { if (!active) throw new Error('会话项目已变更') }
  await expect(catalog.execute('mcp__proma__todo_create', { title: '不得写入旧项目' }, { ...execution(), assertContext }, async () => { active = false; return true })).rejects.toThrow('项目已变更')
  expect(store.listTodos()).toHaveLength(0)
  await expect(catalog.execute('mcp__proma__todo_list', {}, { ...execution(), assertContext }, async () => true)).rejects.toThrow('项目已变更')
})
