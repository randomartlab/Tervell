import { expect, test } from 'bun:test'
import { fixture } from '../packages/core-server/src/test-fixtures/fixture.ts'
import { CoreRpc, WorkbenchClient } from '../packages/client/src/index.ts'
import { KernelCapabilitiesSchema } from '../packages/protocol/src/index.ts'
import type { KernelEvent, KernelPromptInput, KernelSessionHandle } from '../packages/protocol/src/index.ts'
import type { AgentKernel } from '../packages/kernel-host/src/index.ts'

async function until(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 150; attempt++) { if (predicate()) return; await Bun.sleep(10) }
  throw new Error('W9 集成等待超时')
}
test('Given Web客户端连接真实HTTP/WS When 发送、断线补洞、切会话 Then 同一事件只渲染一次且状态不串线', async () => {
  const host = await fixture(), sockets: WebSocket[] = []
  const client = new WorkbenchClient(new CoreRpc(host.server.url), url => { const socket = new WebSocket(url); sockets.push(socket); return socket })
  try {
    await client.connect(host.b.token)
    expect(client.store.get(client.state).sessions.map(session => session.id)).toEqual(['s1'])
    await client.select('s1')
    await until(() => sockets[0]?.readyState === WebSocket.OPEN)
    await client.send('Web端发送')
    await host.settled()
    await client.catchUp()
    const state = client.store.get(client.state)
    expect(state.conversation.seq).toBe(3)
    expect(state.conversation.blocks.filter(block => block.role === 'user').map(block => block.text)).toEqual(['Web端发送'])
    sockets[0]?.close()
    await until(() => client.store.get(client.state).status === 'reconnecting')
    const proof = host.repository.lease('s1')!
    host.repository.append(proof, [{ ts: 1, turnId: 'other', kernelEvent: { t: 'done', runId: 'other', seq: 1, reason: 'stop' } }])
    await client.catchUp()
    expect(client.store.get(client.state).conversation.seq).toBe(4)
    host.repository.upsert({ ...host.repository.get('s1')!, id: 's3', title: '第二个会话' })
    await client.refresh()
    await client.select('s3')
    expect(client.store.get(client.state).conversation.blocks).toEqual([])
    expect(client.store.get(client.state).selected).toBe('s3')
    client.disconnect()
    expect(client.store.get(client.state).sessions).toEqual([])
    expect(client.rpc.headers().Authorization).toBeUndefined()
  } finally { client.disconnect(); await host.close() }
}, 10000)

class ApprovalKernel implements AgentKernel {
  readonly id = 'scripted'
  readonly protocol = 'native' as const
  readonly capabilities = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null }, transport: 'in-process' })
  answer?: string
  private release?: () => void
  constructor(private readonly alwaysOnly = false) {}
  async createSession(input: { sessionId: string }) { return { kernelId: this.id, sessionId: input.sessionId, kernelSessionRef: input.sessionId } }
  async *prompt(_handle: KernelSessionHandle, input: KernelPromptInput, { signal }: { signal: AbortSignal }): AsyncIterable<KernelEvent> {
    const waiting = new Promise<void>(resolve => { this.release = resolve; signal.addEventListener('abort', () => resolve(), { once: true }) })
    yield { t: 'permission.request', runId: input.runId, seq: 1, req: { requestId: 'approval', kind: 'edit', tool: 'Write', input: { path: 'hello.txt' }, summary: '修改文件', actions: this.alwaysOnly ? [{ id: 'always', label: '永久允许', behavior: 'allow', variant: 'always' }, { id: 'deny', label: '拒绝', behavior: 'deny' }] : [{ id: 'session', label: '本会话', behavior: 'allow', variant: 'session' }, { id: 'once', label: '仅一次', behavior: 'allow' }, { id: 'deny', label: '拒绝', behavior: 'deny' }] } }
    await waiting
    yield { t: 'done', runId: input.runId, seq: 2, reason: 'stop' }
  }
  async respondPermission(_handle: KernelSessionHandle, _requestId: string, response: { actionId: string }) { this.answer = response.actionId; this.release?.() }
  async cancel() { this.release?.() }
  async close() { this.release?.() }
}
for (const [decision, action] of [['allow', 'once'], ['allow-session', 'session'], ['deny', 'deny']] as const) test(`Given Web审批 ${decision} When 提交并被另一端重复响应 Then 准确选择${action}且只执行一次`, async () => {
  const kernel = new ApprovalKernel(), host = await fixture({ kernel: async () => kernel }), client = new WorkbenchClient(new CoreRpc(host.server.url))
  try {
    await client.connect(host.b.token); await client.select('s1'); await client.send('需要审批')
    await until(() => host.dispatcher.runtime.pending(() => true).length === 1)
    await client.refresh()
    expect(client.store.get(client.state).approvals[0]?.allowedDecisions).toEqual(['allow', 'allow-session', 'deny'])
    await client.respond('approval', decision)
    expect(kernel.answer).toBe(action)
    expect((await host.rpc('approval.respond', { requestId: 'approval', decision: 'deny' })).data?.resolved).toBe(false)
  } finally { client.disconnect(); await host.close() }
})
test('Given 仅提供永久allow的内核 When Web读取及尝试一次批准 Then 不把永久授权伪装成一次', async () => {
  const kernel = new ApprovalKernel(true), host = await fixture({ kernel: async () => kernel })
  try {
    await host.rpc('session.send', { id: 's1', text: '审批', clientMessageId: 'approval' })
    await until(() => host.dispatcher.runtime.pending(() => true).length === 1)
    expect(host.dispatcher.runtime.pending(() => true)[0]?.allowedDecisions).toEqual(['deny'])
    expect((await host.rpc('approval.respond', { requestId: 'approval', decision: 'allow' })).status).toBe(422)
    expect(kernel.answer).toBeUndefined()
  } finally { await host.close() }
})
test('Given 宿主日志超限 When 运行终态也无法追加 Then Web仍读取明确容量错误并停止运行指示', async () => {
  const host = await fixture(), client = new WorkbenchClient(new CoreRpc(host.server.url))
  try {
    host.journal.retention = { maxSessionEvents: 1 }
    await client.connect(host.b.token); await client.select('s1'); await client.send('容量边界')
    await host.settled(); await client.catchUp()
    const state = client.store.get(client.state).conversation
    expect(state.seq).toBe(1)
    expect(state.running).toBe(false)
    expect(state.error).toContain('容量上限')
    expect(host.repository.head('s1')).toBe(1)
  } finally { client.disconnect(); await host.close() }
})
test('Given 发送已接受但网络丢失响应 When Web重试同一草稿 Then 沿用消息ID且只运行一次', async () => {
  const host = await fixture()
  let dropReply = true
  const rpc = new CoreRpc(host.server.url, async (url, init) => {
    const response = await fetch(url, init)
    const body = JSON.parse(String(init?.body ?? '{}')) as { method?: string }
    if (body.method === 'session.send' && dropReply) { dropReply = false; throw new Error('模拟响应丢失') }
    return response
  })
  const client = new WorkbenchClient(rpc)
  try {
    await client.connect(host.b.token); await client.select('s1')
    await expect(client.send('安全重试')).rejects.toThrow('响应丢失')
    await host.settled(); await client.send('安全重试', true); await host.settled()
    expect(host.runs()).toBe(1)
    expect(host.repository.head('s1')).toBe(3)
  } finally { client.disconnect(); await host.close() }
})
