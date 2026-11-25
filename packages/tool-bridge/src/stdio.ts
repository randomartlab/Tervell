import { Transform } from 'node:stream'
import { createConnection } from 'node:net'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { ToolMetadataSchema, JsonValueSchema } from '@proma/protocol'
const Tool = ToolMetadataSchema.extend({ inputSchema: z.record(z.string(), z.unknown()) })
const Reply = z.discriminatedUnion('ok', [z.object({ ok: z.literal(true), data: z.unknown() }), z.object({ ok: z.literal(false), error: z.string() })])
const port = Number(process.env.PROMA_TOOL_PORT)
const token = process.env.PROMA_TOOL_TOKEN ?? ''
if (!Number.isInteger(port) || port < 1 || port > 65535 || !/^[a-f0-9]{64}$/.test(token)) throw new Error('会话工具代理凭据缺失')
// 初始化后删除环境中的代理凭据；绝不复制模型供应商凭据到响应。
delete process.env.PROMA_TOOL_TOKEN
async function call(action: 'list' | 'call', args: object, signal?: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    let buffer = Buffer.alloc(0), settled = false
    const finish = (error?: Error, value?: unknown) => {
      if (settled) return
      settled = true; signal?.removeEventListener('abort', cancel); socket.destroy()
      if (error) reject(error); else resolve(value)
    }
    const cancel = () => finish(new Error('工具请求取消'))
    socket.setTimeout(60000, () => finish(new Error('工具请求超时')))
    socket.on('error', () => finish(new Error('会话工具服务不可用')))
    socket.on('close', () => finish(new Error('会话工具连接已关闭')))
    socket.once('connect', () => socket.write(JSON.stringify({ token, action, ...args }) + '\n'))
    socket.on('data', (chunk: Buffer) => {
      if (buffer.length + chunk.length > 1024 * 1024) { finish(new Error('工具响应超过上限')); return }
      buffer = Buffer.concat([buffer, chunk]); const end = buffer.indexOf(10)
      if (end < 0) return
      try {
        const reply = Reply.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, end))))
        if (!reply.ok) throw new Error(reply.error)
        finish(undefined, reply.data)
      } catch { finish(new Error('工具请求被拒绝或响应无效')) }
    })
    signal?.addEventListener('abort', cancel, { once: true }); if (signal?.aborted) cancel()
  })
}
const server = new Server({ name: 'proma', version: '0.1.0' }, { capabilities: { tools: {} } })
server.setRequestHandler(ListToolsRequestSchema, async (_request, extra) => ({ tools: z.array(Tool).parse(await call('list', {}, extra.signal)).map((tool) => ({ name: tool.name, description: tool.description, inputSchema: { ...tool.inputSchema, type: 'object' as const }, annotations: { readOnlyHint: tool.effect === 'read', destructiveHint: tool.effect === 'delete', openWorldHint: tool.effect === 'external' } })) }))
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  try {
    const result = JsonValueSchema.parse(await call('call', { name: request.params.name, input: request.params.arguments ?? {} }, extra.signal))
    return { content: [{ type: 'text', text: JSON.stringify(result) }] }
  } catch { return { isError: true, content: [{ type: 'text', text: '工具执行失败、被拒绝或会话已关闭' }] } }
})
// MCP SDK 的 ReadBuffer 本身无帧上限，先在输入流执行 UTF-8/字节边界检查。
let frameBytes = 0
const utf8 = new TextDecoder('utf-8', { fatal: true })
const boundedInput = new Transform({ transform(chunk: Buffer, _encoding, done) {
  try { utf8.decode(chunk, { stream: true }) } catch { done(new Error('MCP 输入不是合法 UTF-8')); return }
  let start = 0
  for (;;) {
    const end = chunk.indexOf(10, start)
    frameBytes += (end < 0 ? chunk.length : end) - start
    if (frameBytes > 300 * 1024) { done(new Error('MCP 输入帧超过上限')); return }
    if (end < 0) break
    frameBytes = 0; start = end + 1
    if (start === chunk.length) break
  }
  done(null, chunk)
}, flush(done) {
  try { utf8.decode(); if (frameBytes) throw new Error('MCP 帧截断'); done() } catch { done(new Error('MCP 输入截断')) }
} })
boundedInput.on('error', () => { void server.close().finally(() => process.exit(1)) })
process.stdin.pipe(boundedInput)
await server.connect(new StdioServerTransport(boundedInput, process.stdout))
process.stdin.once('end', () => { void server.close() })

// 与宿主保持无数据租约；宿主回收时关闭 MCP stdio，避免 ACP 被强杀后留下孤儿代理。
const lease = createConnection({ host: '127.0.0.1', port })
lease.setTimeout(10000, () => lease.destroy())
lease.once('connect', () => lease.write(JSON.stringify({ token, action: 'lease' }) + '\n'))
lease.once('data', () => lease.setTimeout(0))
lease.on('error', () => {})
lease.once('close', () => { void server.close().finally(() => process.exit(0)) })
process.stdin.once('end', () => lease.destroy())
