import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createInterface } from 'node:readline'
import { AcpStdioMcpServerSchema } from '@proma/protocol'
import type { JsonValue } from '@proma/protocol'
interface Request { id: string | number; method: string; params?: Record<string, JsonValue> }
let client: Client | undefined
let transport: StdioClientTransport | undefined
let sessionId = ''
async function handle(request: Request): Promise<object> {
  if (request.method === 'initialize') return { protocolVersion: 1, agentCapabilities: { mcpCapabilities: {} } }
  if (request.method === 'session/new') {
    const configs = request.params?.mcpServers
    const config = AcpStdioMcpServerSchema.parse(Array.isArray(configs) ? configs[0] : undefined)
    transport = new StdioClientTransport({ command: config.command, args: config.args, env: Object.fromEntries(config.env.map((e) => [e.name, e.value])), stderr: 'pipe' })
    transport.stderr?.on('data', () => {})
    client = new Client({ name: 'acp-scripted-tool-client', version: '1.0.0' })
    await client.connect(transport)
    sessionId = String(request.params?.cwd)
    return { sessionId }
  }
  if (request.method === 'session/prompt' && client) {
    const tools = await client.listTools()
    const created = await client.callTool({ name: 'mcp__proma__todo_create', arguments: { title: 'ACP 创建任务' } })
    const event = await client.callTool({ name: 'mcp__proma__calendar_create', arguments: { title: 'ACP 创建日程', startAt: 100, endAt: 200 } })
    const calendar = await client.callTool({ name: 'mcp__proma__calendar_list', arguments: {} })
    const listed = await client.callTool({ name: 'mcp__proma__todo_list', arguments: {} })
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method: 'session/update', params: { sessionId, update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: JSON.stringify({ tools: tools.tools.map((t) => t.name), created, listed, event, calendar }) } } } }) + '\n')
    return { stopReason: 'end_turn' }
  }
  throw new Error('未实现')
}
for await (const line of createInterface({ input: process.stdin })) {
  const request = JSON.parse(line) as Request
  if (request.id === undefined) continue
  try { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: await handle(request) }) + '\n') }
  catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32603, message: '测试工具桥失败' } }) + '\n') }
}
await client?.close()
await transport?.close()
