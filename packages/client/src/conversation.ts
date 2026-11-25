import { KernelEventSchema, ServiceEventSchema } from '@proma/protocol'
import type { ApiResult, KernelEvent, PlanStep } from '@proma/protocol'

export interface ConversationBlock {
  id: string
  turnId: string
  runId: string
  kind: 'text' | 'thinking' | 'tool' | 'plan' | 'approval' | 'error' | 'status'
  role: 'user' | 'assistant' | 'system'
  text: string
  title?: string
  input?: string
  status?: string
  steps?: PlanStep[]
  truncated?: boolean
  startSeq: number
  endSeq: number
}

export interface Conversation {
  epoch: string
  seq: number
  blocks: ConversationBlock[]
  fingerprints: Record<number, string>
  running: boolean
  loading: boolean
  error?: string
}

export function emptyConversation(epoch = ''): Conversation {
  return { epoch, seq: 0, blocks: [], fingerprints: {}, running: false, loading: false }
}

export class EventGapError extends Error {}

export function applyServiceEvent(current: Conversation, input: unknown): Conversation {
  const stored = ServiceEventSchema.parse(input)
  const fingerprint = JSON.stringify(stored)
  if (stored.seq <= current.seq) {
    if (current.fingerprints[stored.seq] && current.fingerprints[stored.seq] !== fingerprint) throw new EventGapError('相同事件序号的内容发生冲突')
    return current
  }
  if (stored.seq !== current.seq + 1) throw new EventGapError('会话事件有缺口，正在补齐')
  const next: Conversation = { ...current, blocks: current.blocks.map(block => ({ ...block })), fingerprints: { ...current.fingerprints, [stored.seq]: fingerprint }, seq: stored.seq }
  for (const sequence of Object.keys(next.fingerprints).slice(0, -200)) delete next.fingerprints[Number(sequence)]
  const upsert = (id: string, kind: ConversationBlock['kind'], text: string, extra: Partial<ConversationBlock> = {}, append = false) => {
    let block = next.blocks.find(item => item.id === id)
    if (!block) {
      block = { id, turnId: stored.turnId, runId: '', kind, role: 'assistant', text: '', startSeq: stored.seq, endSeq: stored.seq }
      next.blocks.push(block)
    }
    Object.assign(block, extra, { kind, text: append ? block.text + text : text, endSeq: stored.seq })
    if (block.text.length > 1024 * 1024) throw new Error('单条消息过长，请在宿主查看完整内容')
    return block
  }
  if (stored.userMessage) upsert(`user:${stored.userMessage.id}`, 'text', stored.userMessage.text, { role: 'user', truncated: stored.userMessage.truncated })
  const parsed = KernelEventSchema.safeParse(stored.event)
  if (!parsed.success) {
    const payload = stored.event
    const summary = payload && typeof payload === 'object' && !Array.isArray(payload) && typeof payload.summary === 'string' ? payload.summary : '该事件已裁剪，请查看会话摘要'
    upsert(`summary:${stored.seq}`, 'status', summary, { truncated: true })
    if (payload && typeof payload === 'object' && !Array.isArray(payload) && typeof payload.t === 'string') next.running = payload.t !== 'done'
    return next
  }
  const event = parsed.data
  next.running = event.t !== 'done'
  const prefix = `${stored.turnId}:${event.runId}`
  const write = (suffix: string, kind: ConversationBlock['kind'], text: string, extra: Partial<ConversationBlock> = {}, append = false) => upsert(`${prefix}:${suffix}`, kind, text, { runId: event.runId, ...extra }, append)
  switch (event.t) {
    case 'message.delta':
      next.running = true
      write(`part:${event.index}`, event.kind, event.text, { status: 'running' }, true)
      break
    case 'message.final':
      event.message.content.forEach((part, index) => {
        if (part.type === 'text' || part.type === 'thinking') {
          const block = write(`part:${index}`, part.type, part.text, { status: 'completed', truncated: stored.truncated })
          block.id = `${prefix}:message:${event.message.id}:${index}`
        } else if (part.type === 'tool-call') {
          const existing = next.blocks.find(block => block.id === `${prefix}:tool:${part.toolCallId}`)
          write(`tool:${part.toolCallId}`, 'tool', existing?.text ?? '', { title: part.name, input: part.input ? JSON.stringify(part.input, null, 2) : existing?.input, status: existing?.status ?? 'pending' })
        } else if (part.type === 'tool-result') {
          write(`tool:${part.toolUseId}`, 'tool', part.content, { status: part.isError ? 'failed' : 'succeeded' })
        } else write(`image:${event.message.id}:${index}`, 'status', '此消息包含图片，请在宿主查看原图')
      })
      next.blocks = next.blocks.filter(block => !block.id.startsWith(`${prefix}:part:`))
      break
    case 'tool.call':
      next.running = true
      write(`tool:${event.call.id}`, 'tool', event.call.result ?? event.call.error ?? '', { title: event.call.name, input: event.call.input ? JSON.stringify(event.call.input, null, 2) : undefined, status: event.call.status })
      break
    case 'tool.update': {
      const previous = next.blocks.find(block => block.id === `${prefix}:tool:${event.callId}`)
      write(`tool:${event.callId}`, 'tool', event.patch.result ?? event.patch.error ?? previous?.text ?? '', { status: event.patch.status ?? previous?.status, title:event.patch.name??event.patch.title??previous?.title, input:event.patch.input===undefined?previous?.input:JSON.stringify(event.patch.input,null,2) })
      break
    }
    case 'plan.update': write('plan', 'plan', '', { title: '执行计划', steps: event.steps }); break
    case 'permission.request': write(`approval:${event.req.requestId}`, 'approval', event.req.summary, { title: event.req.tool }); break
    case 'error': write(`error:${stored.seq}`, 'error', event.err.message, { title: event.err.code }); break
    case 'retry': write(`retry:${stored.seq}`, 'status', `正在重试（第 ${event.attempt} 次）：${event.reason}`); break
    case 'compaction': write(`compaction:${stored.seq}`, 'status', event.info.summary ?? '会话上下文已整理'); break
    case 'usage': write('usage', 'status', usageText(event)); break
    case 'done':
      next.running = false
      write('done', 'status', doneText(event.reason), { status: event.reason })
      break
  }
  if (next.blocks.length > 10000) throw new Error('会话条目过多，请在宿主归档后重试')
  return next
}

function usageText(event: Extract<KernelEvent, { t: 'usage' }>): string {
  const usage = event.usage
  return [usage.inputTokens === undefined ? '' : `输入 ${usage.inputTokens} tokens`, usage.outputTokens === undefined ? '' : `输出 ${usage.outputTokens} tokens`, usage.contextTokens === undefined ? '' : `上下文 ${usage.contextTokens}`, usage.cost === undefined ? '' : `费用 ${usage.cost}`].filter(Boolean).join(' · ') || '用量已更新'
}

function doneText(reason: string): string {
  return ({ stop: '本轮完成', cancelled: '运行已停止', error: '本轮未完成', 'max-tokens': '达到输出上限', 'tool-use': '等待工具结果' } as Record<string, string>)[reason] ?? '运行状态已更新'
}

export function applyEventPage(current: Conversation, page: ApiResult<'session.events'>): Conversation {
  let next = (current.epoch && current.epoch !== page.epoch) ? emptyConversation(page.epoch) : { ...current, epoch: page.epoch }
  for (const event of page.events) next = applyServiceEvent(next, event)
  if (!page.hasMore && page.headSeq >= next.seq && page.executionStatus) next = { ...next, running: ['queued', 'running'].includes(page.executionStatus), error: page.executionStatus === 'capacity-exceeded' ? '宿主日志已达容量上限。本轮已停止，请先导出并清理归档会话。' : undefined }
  return next
}
