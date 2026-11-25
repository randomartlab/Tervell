import { app } from 'electron'
import type { WebContents } from 'electron'
import { createServer } from 'node:http'
import type { ServerResponse } from 'node:http'
import { mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CHAT_IPC_CHANNELS } from '@proma/shared'

const root = mkdtempSync(join(tmpdir(), 'tervell-session-recovery-'))
process.env.TERVELL_PROFILE_DIR = root
app.setPath('userData', join(root, 'chromium'));
(app as typeof app & { setAppPath: (path: string) => void }).setAppPath(resolve('apps/electron'))
app.commandLine.appendSwitch('use-mock-keychain')
const assert = (value: unknown, message: string) => { if (!value) throw Error(message) }
async function run() {
  let requests = 0, latest: ServerResponse | undefined
  const packet = (response: ServerResponse, delta: object, finish: string | null = null) => response.write('data: ' + JSON.stringify({ id: 'fixture', model: 'fixture', choices: [{ index: 0, delta, finish_reason: finish }] }) + '\n\n')
  const upstream = createServer(async (request, response) => {
    if (request.url === '/fixture-tool') { response.writeHead(200, { 'content-type': 'text/plain' }); response.end('恢复测试工具结果'); return }
    for await (const _chunk of request) { /* 清空本机模拟请求 */ }
    requests++
    response.writeHead(200, { 'content-type': 'text/event-stream' })
    if (requests === 1) {
      packet(response, { reasoning_content: '恢复前推理。', content: '恢复前正文。', tool_calls: [{ index: 0, id: 'fixture-read', type: 'function', function: { name: 'fixture_read', arguments: '{}' } }] })
      packet(response, {}, 'tool_calls'); response.end('data: [DONE]\n\n')
    } else { latest = response; packet(response, { reasoning_content: '恢复后的推理。', content: '恢复后的正文。' }) }
  })
  await new Promise<void>(ok => upstream.listen(0, '127.0.0.1', ok))
  try {
    mkdirSync(join(root, 'config'), { recursive: true })
    const port = (upstream.address() as { port: number }).port
    const { createChannel } = await import('../apps/electron/src/main/lib/channel-manager')
    const channel = createChannel({ name: '恢复本机模拟', provider: 'openai', baseUrl: `http://127.0.0.1:${port}/v1`, apiKey: 'local-recovery-fixture', enabled: true, models: [{ id: 'fixture', name: 'Fixture', enabled: true }] })
    const chats = await import('../apps/electron/src/main/lib/conversation-manager')
    const tools = await import('../apps/electron/src/main/lib/chat-tool-config')
    tools.saveChatToolsConfig({ toolStates: { fixture_read: { enabled: true } }, toolCredentials: {}, customTools: [{ id: 'fixture_read', name: '本机验收', description: '只供本机恢复测试', params: [], category: 'custom', executorType: 'http', httpConfig: { method: 'GET', urlTemplate: `http://127.0.0.1:${port}/fixture-tool` } }] })
    const conversation = chats.createConversation('恢复验收', 'fixture', channel.id)
    const { sessionSync } = await import('../apps/electron/src/main/lib/session-sync')
    const service = await import('../apps/electron/src/main/lib/chat-service')
    const deliveries: Array<{ channel: string; data: Record<string, unknown> }> = []
    let destroyed = false
    const webContents = { isDestroyed: () => destroyed, send: (channel: string, data: Record<string, unknown>) => deliveries.push({ channel, data }) } as unknown as WebContents
    const run = service.sendMessage({ conversationId: conversation.id, userMessage: '恢复测试', messageHistory: [], channelId: channel.id, modelId: 'fixture', enabledToolIds: ['fixture_read'] }, webContents)
    for (let i = 0; i < 200 && (!latest || !sessionSync.read().chats[0]?.content.includes('恢复后的正文。')); i++) await new Promise(r => setTimeout(r, 25))
    const before = sessionSync.read().chats.find(c => c.id === conversation.id)
    if (!before) throw Error('活跃快照缺失')
    assert(before?.content === '恢复前正文。恢复后的正文。' && before.reasoning === '恢复前推理。恢复后的推理。', '主进程未保留完整正文推理')
    assert(before.toolActivities.some(t => t.type === 'result'), '工具执行结果未进入恢复快照')
    destroyed = true
    const { restoreChatStream, acceptsChatStreamEvent } = await import('../apps/electron/src/renderer/lib/chat-stream-recovery')
    const restored = restoreChatStream(undefined, before)
    const lastEvent = deliveries.filter(d => d.channel === CHAT_IPC_CHANNELS.STREAM_CHUNK).at(-1)!
    assert(!acceptsChatStreamEvent(restored, lastEvent.data), '恢复后会重复追加已包含的片段')
    packet(latest!, { content: '窗口丢失时正文。' })
    packet(latest!, {}, 'stop'); latest!.end('data: [DONE]\n\n')
    assert(await run, '窗口消失中断了执行')
    const history = chats.getConversationMessagesStrict(conversation.id)
    assert(history.length === 2 && history[1]?.content === '恢复前正文。恢复后的正文。窗口丢失时正文。', '完整落盘丢失或重复消息')
    assert(history[1]?.reasoning === before.reasoning && history[1]?.toolActivities?.some(t => t.type === 'result'), '推理或工具结果未持久化')
    assert(!sessionSync.read().chats.some(c => c.id === conversation.id), '完成后仍保留运行快照')
    console.log('RECOVERY actual Chat SSE+tool, detached renderer, exact snapshot, no duplicate persistence PASS')
    destroyed = false
    latest = undefined
    const completedBeforeStop = deliveries.filter(d => d.channel === CHAT_IPC_CHANNELS.STREAM_COMPLETE).length
    const interrupted = service.sendMessage({ conversationId: conversation.id, userMessage: '停止测试', messageHistory: [], channelId: channel.id, modelId: 'fixture', enabledToolIds: [] }, webContents)
    for (let i = 0; i < 200 && !latest; i++) await new Promise(r => setTimeout(r, 25))
    assert(await service.sendMessage({ conversationId: conversation.id, userMessage: '不能重复运行', messageHistory: [], channelId: channel.id, modelId: 'fixture' }, webContents).then(() => false, () => true), '同一对话允许重叠执行')
    service.stopGeneration(conversation.id)
    assert(await interrupted, '停止请求未正常收尾')
    assert(deliveries.filter(d => d.channel === CHAT_IPC_CHANNELS.STREAM_COMPLETE).length === completedBeforeStop + 1, '停止后未推送完整历史刷新')
    assert(chats.getConversationMessagesStrict(conversation.id).at(-1)?.stopped, '停止后的部分回复未保存')
    console.log('RECOVERY duplicate run rejected, stop persists partial reply and emits completion PASS')
    console.log('PROFILE', root)
  } finally { upstream.closeAllConnections(); await new Promise<void>(ok => upstream.close(() => ok())) }
}
app.whenReady().then(run).then(() => app.exit(0)).catch(error => { console.error(error); app.exit(1) })
