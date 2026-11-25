import { writeFileSync } from 'node:fs'
import {spawn}from'node:child_process'
import { JsonRpcPeer } from '../rpc.ts'
import type { JsonValue } from '@proma/protocol'
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {}
if (process.env.PROMA_ACP_TEST_PID_FILE) writeFileSync(process.env.PROMA_ACP_TEST_PID_FILE, String(process.pid))
let sessionId = ''
const peer = new JsonRpcPeer(process.stdin, process.stdout, { onRequest: async (method, params) => {
  const input = object(params)
  if (method === 'initialize' && process.argv.includes('bad-version')) return { protocolVersion: 999 }
  if (method === 'initialize') return { protocolVersion: 1, agentCapabilities: { loadSession: false } }
  if (method === 'session/new') { sessionId = `remote/${process.pid}`; if(process.argv.includes('idle-extensions'))for(let i=0;i<40;i++)await peer.notify('vendor/notification',{i}); return { sessionId } }
  if (method === 'session/prompt') {
    const text = String(object((input.prompt as JsonValue[])?.[0]).text)
    if(text.includes('spawn-descendant')){
      const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:['ignore','inherit','inherit']})
      if(process.env.TERVELL_ACP_CHILD_PID)writeFileSync(process.env.TERVELL_ACP_CHILD_PID,String(child.pid))
    }
    if(text.includes('slow-success'))await new Promise(resolve=>setTimeout(resolve,2200))
    const update = async (body: JsonValue) => peer.notify('session/update', { sessionId, update: body })
    if (text.includes('vendor-notifications')) for(let i=0;i<40;i++) await peer.notify('vendor/notification',{i})
    if (text.includes('optional-request')) {try {await peer.request('vendor/optionalQueue',{sessionId})}catch(error){if(!(error instanceof Error)||!('code' in error)||error.code!==-32601)throw error}}
    if (text.includes('echo-history')) await update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text } })
    if (text.includes('hang')) return new Promise<JsonValue>(() => {})
    if (text.includes('crash')) process.exit(7)
    if (text.includes('bad-result')) return { stopReason: 'future_stop' }
    if (text.includes('foreign-session')) await peer.notify('session/update', { sessionId: 'wrong', update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '不应出现' } } })
    await update({ sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: '思考' } })
    await update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '你好😀' } })
    await update({ sessionUpdate: 'tool_call', toolCallId: 'remote/tool', kind: 'read', title: 'Read', status: 'pending', rawInput: { path: 'fixture' } })
    if (text.includes('approval')) {
      const answer = await peer.request('session/request_permission', { sessionId, toolCall: { toolCallId: 'remote/tool', title: 'Read', kind: 'read' }, options: [{ optionId: '原始允许一次', name: '允许', kind: 'allow_once' }, { optionId: '原始拒绝', name: '拒绝', kind: 'reject_once' }] })
      const outcome = object(object(answer).outcome)
      await update({ sessionUpdate: 'tool_call_update', toolCallId: 'remote/tool', status: outcome.optionId === '原始允许一次' ? 'completed' : 'failed', rawOutput: answer })
    } else await update({ sessionUpdate: 'tool_call_update', toolCallId: 'remote/tool', status: 'completed', rawOutput: '完成' })
    await update({ sessionUpdate: 'plan', entries: [{ content: '检查', priority: 'high', status: 'completed' }] })
    await update({ sessionUpdate: 'usage_update', used: 5, size: 100 })
    await update({ sessionUpdate: 'compaction_summary_chunk', compactionId: 'compact/1', content: { type: 'text', text: '摘要' } });
    await update({ sessionUpdate: 'compaction_update', compactionId: 'compact/1', status: 'completed' }); await peer.notify('_proma/retry', { attempt: 1, reason: '限流' })
    if (text.includes('unknown')) await update({ sessionUpdate: 'future_update', payload: '原文' })
    return { stopReason: 'end_turn' }
  }
  throw new Error('未知方法')
} })
