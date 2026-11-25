import { JsonRpcPeer } from '../rpc.ts'
import type { JsonValue } from '@proma/protocol'
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const dialect = process.argv[2] ?? 'omp'
const remote = 'scripted/session'; let session = false
const peer = new JsonRpcPeer(process.stdin, process.stdout, { onRequest: async (method, params): Promise<JsonValue> => {
  const input = record(params)
  if (method === 'initialize') return { protocolVersion: 1, agentInfo: { name: dialect, version: 'scripted-1' }, agentCapabilities: {} }
  if (method === 'session/new') {
    if (!Array.isArray(input.mcpServers) || input.mcpServers.length) throw new Error('需要显式空mcpServers')
    session = true
    return { sessionId: remote, configOptions: [{ id: 'model', name: 'Model', category: 'model', type: 'select', currentValue: 'provider/model/high', options: [{ value: 'provider/model/high', name: 'Model High' }] }] }
  }
  if (method === 'cursor/list_available_models' && dialect === 'cursor-agent') return { models: [{ value: 'cursor/model', name: 'Cursor Model', configOptions: [] }] }
  if (method !== 'session/prompt' || !session || input.sessionId !== remote) throw new Error('unexpected method/session')
  const update = (body: JsonValue) => peer.notify('session/update', { sessionId: remote, update: body })
  const text = String(record((input.prompt as JsonValue[])?.[0]).text)
  if (text.includes('unsupported-question')) {
    await peer.request('cursor/ask_question', { questions: [{ id: 'q1', prompt: 'Multi', allowMultiple: true, options: [{ id: 'a', label: 'A' }] }] })
    return { stopReason: 'end_turn' }
  }
  if (text.includes('question-only')) {
    const answer = await peer.request('cursor/ask_question', { questions: [{ id: 'q1', prompt: 'Choose', allowMultiple: false, options: [{ id: 'a', label: 'A' }] }] })
    await update({ sessionUpdate: 'tool_call_update', toolCallId: 'question-result', status: 'completed', rawOutput: answer })
    return { stopReason: 'end_turn' }
  }

  const tool = async (id: string, name: string, kind: string) => {
    await update({ sessionUpdate: 'tool_call', toolCallId: id, title: name, name, kind, status: 'pending', rawInput: { path: '/private/project/fixture.txt' } })
    const answer = record(await peer.request('session/request_permission', { sessionId: remote, toolCall: { toolCallId: id, title: name, kind }, options: [{ optionId: 'allow-once', name: 'Allow', kind: 'allow_once' }, { optionId: 'reject-once', name: 'Reject', kind: 'reject_once' }] }))
    if (record(answer.outcome).optionId !== 'allow-once') throw new Error('必须人工显式选择允许')
    const rawOutput: JsonValue = dialect === 'omp' ? { content: [{ type: 'text', text: 'scripted output' }], details: { exitCode: 0, wallTimeMs: 1 } }
      : dialect.startsWith('opencode') ? { output: 'scripted output', metadata: { exit: 0 } } : 'scripted output'
    await update({ sessionUpdate: 'tool_call_update', toolCallId: id, status: 'completed', rawOutput })
  }
  await update({ sessionUpdate: 'agent_message_chunk', messageId: 'scripted-message', content: { type: 'text', text: '脚本fixture，不是真实厂商录制' } })
  await tool('read/1', 'Read', 'read'); await tool('edit/2', 'Edit', 'edit'); await tool('bash/3', 'Bash', 'execute')
  if (dialect === 'cursor-agent') {
    const answer = record(await peer.request('cursor/ask_question', { toolCallId: 'question/1', questions: [{ id: 'color', prompt: 'Choose', allowMultiple: false, options: [{ id: 'red', label: 'Red' }, { id: 'blue', label: 'Blue' }] }] }))
    if (record(answer.outcome).outcome !== 'answered') throw new Error('Cursor问题未明确答复')
    const plan = record(await peer.request('cursor/create_plan', { toolCallId: 'plan/1', plan: '# Plan\nScripted' }))
    if (record(plan.outcome).outcome !== 'accepted') throw new Error('Cursor计划未明确确认保存')
  }
  await update({ sessionUpdate: 'plan', entries: [{ content: 'Scripted verify', priority: 'high', status: 'completed' }] })
  await update({ sessionUpdate: 'usage_update', used: 5, size: 100 })
  return { stopReason: 'end_turn', ...(dialect === 'omp' || dialect === 'gemini-cli' || dialect === 'claude-code' ? { usage: { inputTokens: 2, outputTokens: 3 } } : {}) }
} })
