import { test, expect } from 'bun:test'
import { AcpTraceRecorder } from './recorder.ts'
import { replayAcpTrace } from './replay.ts'

function fixture() {
  const recorder = new AcpTraceRecorder({ kernelId: 'codex', origin: 'scripted', agentVersion: 'scripted-1', source: 'unit-script' })
  recorder.record('client', { jsonrpc: '2.0', id: 'i', method: 'initialize', params: { protocolVersion: 1 } })
  recorder.record('agent', { jsonrpc: '2.0', id: 'i', result: { protocolVersion: 1 } })
  recorder.record('client', { jsonrpc: '2.0', id: 'n', method: 'session/new', params: { cwd: '/private/example', mcpServers: [] } })
  recorder.record('agent', { jsonrpc: '2.0', id: 'n', result: { sessionId: 's1' } })
  recorder.record('client', { jsonrpc: '2.0', id: 'p', method: 'session/prompt', params: { sessionId: 's1', prompt: [{ type: 'text', text: 'private' }] } })
  recorder.record('agent', { jsonrpc: '2.0', method: 'session/update', params: { sessionId: 's1', update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'response' } } } })
  recorder.record('agent', { jsonrpc: '2.0', id: 'p', result: { stopReason: 'end_turn' } })
  return recorder.snapshot()
}
test('Given 脱敏trace When 重复回放 Then 规范事件逐字节一致', () => {
  const trace = fixture(); const a = replayAcpTrace(trace); expect(JSON.stringify(a)).toBe(JSON.stringify(replayAcpTrace(trace)))
  expect(a[0]?.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
  expect(a[0]?.some((event) => event.t === 'message.final')).toBe(true)
})
test('Given 断序/缺响应/错归属 When 回放 Then 明确拒绝而非补成功', () => {
  const gap = fixture(); gap.frames[0]!.seq = 9; expect(() => replayAcpTrace(gap)).toThrow('连续')
  const missing = fixture(); missing.frames.pop(); expect(() => replayAcpTrace(missing)).toThrow('不完整')
  const foreign = fixture(); const frame = foreign.frames.find((item) => 'method' in item.message && item.message.method === 'session/update')!
  if ('method' in frame.message) frame.message.params = { sessionId: 'wrong', update: { sessionUpdate: 'future' } }
  expect(() => replayAcpTrace(foreign)).toThrow('session')
  const id = fixture(); const last = id.frames.at(-1)!.message; if ('id' in last) last.id = 'unknown'; expect(() => replayAcpTrace(id)).toThrow('找不到')
})

test('Given trace声明的方言与实际选用不一致 When 回放 Then 拒绝用错映射器', async () => {
  const { acpDialect } = await import('./dialects/index.ts')
  expect(() => replayAcpTrace(fixture(), acpDialect('omp'))).toThrow('不匹配')
})

test('Given 注册kernelId不同于方言id When 显式记录dialectId Then 回放只校验真实方言', async () => {
  const { acpDialect } = await import('./dialects/index.ts')
  const trace = fixture(); trace.kernelId = 'codex-installed'; trace.dialectId = 'codex'
  expect(replayAcpTrace(trace, acpDialect('codex'))[0]?.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
})
test('Given ACP永久允许选项 When 离线回放权限请求 Then 保留always范围供Web拒绝降格成一次', () => {
  const trace = fixture(), promptResult = trace.frames.pop()!
  const prompt = trace.frames.find(frame => 'method' in frame.message && frame.message.method === 'session/prompt')?.message
  const params = prompt && 'method' in prompt ? prompt.params : undefined
  const sessionId = params && typeof params === 'object' && !Array.isArray(params) ? params.sessionId : undefined
  if (typeof sessionId !== 'string') throw new Error('fixture缺少已脱敏sessionId')
  const permission = { jsonrpc: '2.0' as const, id: 'approval', method: 'session/request_permission', params: { sessionId, toolCall: { toolCallId: 'tool', title: 'Write', kind: 'edit' }, options: [{ optionId: 'always', name: '总是允许', kind: 'allow_always' }, { optionId: 'deny', name: '拒绝', kind: 'reject_once' }] } }
  trace.frames.push({ seq: trace.frames.length + 1, direction: 'agent', message: permission })
  trace.frames.push({ seq: trace.frames.length + 1, direction: 'client', message: { jsonrpc: '2.0', id: 'approval', result: { outcome: { outcome: 'cancelled' } } } })
  trace.frames.push({ ...promptResult, seq: trace.frames.length + 1 })
  const event = replayAcpTrace(trace)[0]?.find(item => item.t === 'permission.request')
  expect(event?.t === 'permission.request' ? event.req.actions[0]?.variant : undefined).toBe('always')
})
