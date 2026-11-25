import { expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createConnection } from 'node:net'
import { fileURLToPath } from 'node:url'
import { SessionToolServer } from './server.ts'
import { ToolCatalog } from './catalog.ts'
import { registerPlanningTools } from './planning.ts'
import { createPlanningBackend } from './planning-backend.ts'
import { fixturePlanningStore } from './test-fixtures/store.ts'
import type { ToolContext } from '@proma/protocol'
const runtime = { command: process.execPath, args: [fileURLToPath(new URL('./stdio.ts', import.meta.url))] }
const context: ToolContext = { sessionId: 's1', workspaceId: 'w1', permission: { mode: 'ask', plan: false }, triggeredBy: 'user' }
function fixture() { const catalog = new ToolCatalog(); registerPlanningTools(catalog, createPlanningBackend(fixturePlanningStore())); return catalog }
test('Given 会话 MCP stdio When SDK握手、列工具和创建 Then 绑定上下文且关闭后拒绝调用', async () => {
  const approvals: string[] = []
  const host = await SessionToolServer.open({ context, catalog: fixture(), runtime, authorize: async (r) => { approvals.push(r.context.sessionId); return true } })
  const config = host.config()
  const transport = new StdioClientTransport({ command: config.command, args: config.args, env: Object.fromEntries(config.env.map((e) => [e.name, e.value])), stderr: 'pipe' })
  transport.stderr?.on('data', () => {})
  const client = new Client({ name: 'test', version: '1.0.0' })
  try {
    await client.connect(transport)
    expect((await client.listTools()).tools).toHaveLength(8)
    const create = await client.callTool({ name: 'mcp__proma__todo_create', arguments: { title: '测试' } })
    expect(create.isError).not.toBe(true); expect(approvals).toEqual(['s1'])
    const list = await client.callTool({ name: 'mcp__proma__todo_list', arguments: {} })
    expect(JSON.stringify(list)).toContain('测试')
    const forged = await client.callTool({ name: 'mcp__proma__todo_create', arguments: { title: '伪造', workspaceId: 'other' } })
    expect(forged.isError).toBe(true)
    const pid = transport.pid
    await host.close()
    let gone = false
    for (let attempt = 0; attempt < 30; attempt++) {
      try { if (pid) process.kill(pid, 0) } catch { gone = true; break }
      await Bun.sleep(20)
    }
    expect(gone).toBe(true)
    await expect(client.listTools()).rejects.toThrow()
  } finally { await host.close(); await client.close(); await transport.close() }
}, 10000)
test('Given 两个独立会话端点 When 猜错token或借用别的端口 Then 不泄漏工具/会话', async () => {
  const host = await SessionToolServer.open({ context, catalog: fixture(), runtime, authorize: async () => true })
  const other = await SessionToolServer.open({ context: { ...context, sessionId: 's2', workspaceId: 'w2' }, catalog: fixture(), runtime, authorize: async () => true })
  const config = host.config(); const port = Number(config.env.find((e) => e.name === 'PROMA_TOOL_PORT')?.value)
  const otherToken = other.config().env.find((e) => e.name === 'PROMA_TOOL_TOKEN')!.value
  expect(other.config().env[0]?.value).not.toBe(String(port))
  try {
    const response = await new Promise<string>((resolve, reject) => {
      const socket = createConnection({ host: '127.0.0.1', port }); let text = ''
      socket.on('error', reject); socket.on('data', (data) => { text += data.toString() }); socket.once('end', () => resolve(text))
      socket.once('connect', () => socket.write(JSON.stringify({ action: 'list', token: otherToken }) + '\n'))
    })
    expect(response).toContain('"ok":false'); expect(response).not.toContain('todo')
    const snapshot = structuredClone(config); snapshot.env[0]!.value = '1'
    expect(host.config().env[0]?.value).not.toBe('1')
  } finally { await host.close(); await other.close() }
})

test('Given 会话关闭时仍等待审批 When 用户稍后允许 Then 请求取消不写入', async () => {
  const store = fixturePlanningStore(), catalog = new ToolCatalog(); registerPlanningTools(catalog, createPlanningBackend(store))
  let waiting: (() => void) | undefined
  const entered = new Promise<void>((resolve) => { waiting = resolve })
  const host = await SessionToolServer.open({ context, catalog, runtime, authorize: async ({ signal }) => { waiting?.(); return new Promise<boolean>((resolve) => signal.addEventListener('abort', () => resolve(false), { once: true })) } })
  const config = host.config(), transport = new StdioClientTransport({ command: config.command, args: config.args, env: Object.fromEntries(config.env.map((e) => [e.name, e.value])), stderr: 'pipe' })
  transport.stderr?.on('data', () => {})
  const client = new Client({ name: 'cancel-test', version: '1.0.0' })
  try {
    await client.connect(transport)
    const pending = client.callTool({ name: 'mcp__proma__todo_create', arguments: { title: '不可写入' } }).catch(() => null)
    await entered; await host.close(); await pending
    expect(store.listTodos()).toHaveLength(0)
  } finally { await host.close(); await client.close(); await transport.close() }
}, 10000)

test('Given 产品MCP选择本会话批准 When 同输入再次调用 Then 不重复询问且记录两次执行',async()=>{
 const catalog=fixture();let asks=0
 const host=await SessionToolServer.open({context,catalog,runtime,authorize:async()=>{asks++;return 'allow-session'}})
 const config=host.config(),transport=new StdioClientTransport({command:config.command,args:config.args,env:Object.fromEntries(config.env.map(e=>[e.name,e.value])),stderr:'pipe'})
 transport.stderr?.on('data',()=>{});const client=new Client({name:'session-grant',version:'1.0.0'})
 try{
  await client.connect(transport)
  for(let i=0;i<2;i++)expect((await client.callTool({name:'mcp__proma__todo_create',arguments:{title:'同输入任务'}})).isError).not.toBe(true)
  expect(asks).toBe(1);expect(catalog.gate.audit().filter(e=>e.phase==='result'&&e.outcome==='succeeded')).toHaveLength(2)
 }finally{await client.close();await transport.close();await host.close()}
},10000)
