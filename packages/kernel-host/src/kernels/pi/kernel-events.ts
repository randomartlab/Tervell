import { createHash } from 'node:crypto'
import { KernelEventSchema } from '@proma/protocol'
import type { KernelEvent, ToolKind } from '@proma/protocol'

function object(value: unknown): Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function text(value: unknown): string { return typeof value === 'string' ? value : JSON.stringify(value) ?? '' }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }
function kind(name: string): ToolKind {
  switch (name.toLowerCase()) {
    case 'read': case 'ls': return 'read'
    case 'write': case 'edit': case 'multiedit': return 'edit'
    case 'bash': case 'powershell': return 'execute'
    case 'grep': case 'glob': return 'search'
    case 'webfetch': return 'fetch'
    default: return 'other'
  }
}
/** Pi 既有 query 输出协议 → 产品唯一事件契约；私有载荷不会跨过此边界。 */
export class PiKernelEventMapper {
  private seq = 0
  private messageNumber = 0
  private readonly toolNames = new Map<string, string>()
  private readonly tasks = new Map<string, { id: string; title: string; status: string }>()
  constructor(private readonly runId: string) {}
  private emit(payload: object): KernelEvent { return KernelEventSchema.parse({ ...payload, runId: this.runId, seq: ++this.seq }) }
  map(input: unknown): KernelEvent[] {
    const raw = object(input); const message = object(raw.message)
    switch (raw.type) {
      case 'assistant_delta': {
        const delta = object(raw.delta)
        if (delta.type === 'text_delta' || delta.type === 'thinking_delta') return [this.emit({ t: 'message.delta', index: delta.contentIndex, text: delta.delta, kind: delta.type === 'thinking_delta' ? 'thinking' : 'text' })]
        // 起止与不完整工具 JSON 不构成产品事件，完整工具调用由 assistant 帧提供。
        if (['start', 'text_start', 'text_end', 'thinking_start', 'thinking_end', 'toolcall_start', 'toolcall_delta', 'toolcall_end'].includes(text(delta.type))) return []
        return this.unknown(raw)
      }
      case 'assistant': {
        const result: KernelEvent[] = []; const content = list(message.content).map(object)
        if (content.some((part) => !['text', 'thinking', 'tool_use'].includes(text(part.type)))) return this.unknown(raw)
        const visible = content.map((part) => part.type === 'thinking' ? { type: 'thinking', text: text(part.thinking) } : part.type === 'tool_use' ? { type: 'tool-call', toolCallId: part.id, name: part.name, input: object(part.input) } : { type: 'text', text: text(part.text) })
        if (visible.length) result.push(this.emit({ t: 'message.final', message: { id: `pi_${createHash('sha256').update(this.runId).digest('hex').slice(0, 12)}_${++this.messageNumber}`, role: 'assistant', content: visible, createdAt: 0 } }))
        for (const part of content.filter((block) => block.type === 'tool_use')) { this.toolNames.set(text(part.id), text(part.name)); result.push(this.emit({ t: 'tool.call', call: { id: part.id, kind: kind(text(part.name)), name: part.name, input: object(part.input), status: 'pending' } })) }
        if (raw.error) result.push(this.emit({ t: 'error', err: { code: 'pi_assistant_error', message: text(object(raw.error).message), recoverable: false } }))
        return result
      }
      case 'user': {
        const events: KernelEvent[] = []
        for (const part of list(message.content).map(object).filter((part) => part.type === 'tool_result')) {
          events.push(this.emit({ t: 'tool.update', callId: part.tool_use_id, patch: { status: part.is_error ? 'failed' : 'succeeded', result: text(part.content) } }))
          if (!part.is_error && ['TaskCreate', 'TaskUpdate', 'TaskList', 'TodoRead'].includes(this.toolNames.get(text(part.tool_use_id)) ?? '')) {
            const content = list(part.content).map(object).filter((block) => block.type === 'text').map((block) => text(block.text)).join('\n')
            let payload: unknown
            try { payload = JSON.parse(content) } catch (error) { events.push(this.emit({ t: 'error', err: { code: 'pi_task_payload', message: String(error), recoverable: true, raw: content } })); continue }
            const data = object(payload)
            for (const task of (data.task ? [data.task] : list(data.tasks ?? data.todos)).map(object)) {
              const id = text(task.id)
              if (task.status === 'deleted') this.tasks.delete(id)
              else this.tasks.set(id, { id, title: text(task.subject), status: task.status === 'in_progress' ? 'running' : task.status === 'completed' ? 'completed' : ['blocked', 'error'].includes(text(task.status)) ? 'failed' : task.status === 'cancelled' ? 'skipped' : 'pending' })
            }
            events.push(this.emit({ t: 'plan.update', steps: [...this.tasks.values()] }))
          }
        }
        return events
      }
      case 'tool_progress': return [this.emit({ t: 'tool.update', callId: raw.tool_use_id, patch: { status: 'running' } })]
      case 'result': {
        const usage = object(raw.usage); const events: KernelEvent[] = []
        if (Object.keys(usage).length || raw.total_cost_usd !== undefined) events.push(this.emit({ t: 'usage', usage: { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, cost: raw.total_cost_usd } }))
        const errors = list(raw.errors)
        if (errors.length) events.push(this.emit({ t: 'error', err: { code: 'pi_result_error', message: errors.map(text).join('\n'), recoverable: false } }))
        events.push(this.emit({ t: 'done', reason: errors.length || text(raw.subtype).startsWith('error') ? 'error' : raw.subtype === 'max_tokens' ? 'max-tokens' : 'stop' })); return events
      }
      case 'system':
        if (raw.subtype === 'compact_boundary') return [this.emit({ t: 'compaction', info: { strategy: 'summarize', summary: text(raw.summary) } })]
        if (raw.subtype === 'compacting' || raw.subtype === 'init' || raw.compact_result === 'noop') return []
        if (raw.compact_result === 'failed') return [this.emit({ t: 'error', err: { code: 'compaction_failed', message: text(raw.compact_error), recoverable: true } })]
        return this.unknown(raw)
      case 'plan': return [this.emit({ t: 'plan.update', steps: raw.steps })]
      case 'permission_request': return [this.emit({ t: 'permission.request', req: raw.request })]
      case 'retry': return [this.emit({ t: 'retry', attempt: raw.attempt, maxAttempts: raw.maxAttempts, reason: text(raw.reason), retryAfterMs: raw.retryAfterMs })]
      case 'usage': return [this.emit({ t: 'usage', usage: raw.usage })]
      case 'error': return [this.emit({ t: 'error', err: { code: text(raw.code) || 'pi_error', message: text(raw.message), recoverable: raw.recoverable === true } })]
      default: return this.unknown(raw)
    }
  }
  private unknown(raw: Record<string, unknown>): KernelEvent[] { return [this.emit({ t: 'error', err: { code: 'unknown_pi_event', message: `未知 Pi 事件：${text(raw.type)}`, recoverable: true, raw: JSON.parse(JSON.stringify(raw)) } })] }
}
