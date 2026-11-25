import { createHash } from 'node:crypto'
import { AcpTextUpdateSchema, AcpToolUpdateSchema, AcpPlanUpdateSchema, AcpUsageUpdateSchema, AcpPromptResultSchema, AcpCompactionUpdateSchema, AcpCompactionChunkSchema, KernelEventSchema } from '@proma/protocol'
import type { AcpDialect } from './dialects/types.ts'
import type { KernelEvent, ContentPart, ToolKind, JsonValue } from '@proma/protocol'

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const string = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value) ?? ''
export function acpEntityId(value: string): string { return 'acp_' + createHash('sha256').update(value).digest('hex').slice(0, 32) }
export function acpToolKind(value: string | null | undefined): ToolKind {
  switch (value) { case 'read': case 'search': case 'edit': case 'delete': case 'execute': case 'fetch': return value; default: return 'other' }
}
/** 一个mapper只属于一次prompt，原始session更新由宿主路由；本地seq从1递增。 */
export class AcpEventMapper {
  private seq = 0
  private finals = 0
  private suppressDeltas = false
  private messageId?: string
  private retainedTextBytes = 0
  private compactionBytes = 0
  private readonly compactions = new Map<string, { summary: string; summaryContent: JsonValue[]; error?: string | null; metadata?: Record<string, JsonValue> | null }>()
  private readonly parts = new Map<number, { kind: 'text' | 'thinking'; text: string; bytes: number }>()
  constructor(readonly runId: string, private readonly dialect?: AcpDialect) {}
  emit(payload: object): KernelEvent { const event = KernelEventSchema.parse(JSON.parse(JSON.stringify({ ...payload, runId: this.runId, seq: this.seq + 1 }))); this.seq++; return event }
  error(code: string, raw: unknown, message = code): KernelEvent {
    return this.emit({ t: 'error', err: { code, message, recoverable: !['acp_message_limit','acp_compaction_limit','acp_content_index_limit'].includes(code), raw: JSON.parse(JSON.stringify(raw ?? null)) } })
  }
  flush(): KernelEvent[] {
    if (!this.parts.size) return []
    const content: ContentPart[] = []
    const max = Math.max(...this.parts.keys())
    for (let index = 0; index <= max; index++) {
      const part = this.parts.get(index)
      content.push(part ? { type: part.kind, text: part.text } : { type: 'text', text: '' })
    }
    this.parts.clear(); this.retainedTextBytes = 0; this.messageId = undefined; this.suppressDeltas = false
    return [this.emit({ t: 'message.final', message: { id: acpEntityId(`${this.runId}:${++this.finals}`), role: 'assistant', createdAt: 0, content } })]
  }
  update(raw: unknown): KernelEvent[] {
    if (this.dialect?.normalizeUpdate) {
      try { raw = this.dialect.normalizeUpdate(JSON.parse(JSON.stringify(raw))) }
      catch (error) { return [this.error('invalid_dialect_update', raw, String(error))] }
    }
    const update = object(raw)
    try {
      switch (update.sessionUpdate) {
        // 用户输入已由宿主持久化；CLI的标准回显可能包含注入上下文，不能作为助手输出或错误重复展示。
        case 'user_message_chunk': return []
        case 'agent_message_chunk': case 'agent_thought_chunk': {
          const data = AcpTextUpdateSchema.parse(raw)
          if (this.dialect?.restartsStream?.(JSON.parse(JSON.stringify(data)))) {
            for (const part of this.parts.values()) { part.text = ''; part.bytes = 0 }
            this.retainedTextBytes = 0
            if (typeof data.messageId === 'string') this.messageId = data.messageId
            this.suppressDeltas = true // append-only delta不可回撤；等权威final修正失败残片。
          }
          const flushed = data.messageId && this.messageId && data.messageId !== this.messageId ? this.flush() : []
          if (data.messageId) this.messageId = data.messageId
          const kind = data.sessionUpdate === 'agent_thought_chunk' ? 'thinking' : 'text'
          const existing = [...this.parts.entries()].find(([, part]) => part.kind === kind)?.[0]
          const index = data.contentIndex ?? existing ?? (this.parts.size ? Math.max(...this.parts.keys()) + 1 : 0)
          if (index > 4096) return [...flushed, this.error('acp_content_index_limit', raw)]
          const old = this.parts.get(index)
          if (old && old.kind !== kind) return [...flushed, this.error('acp_content_kind_changed', raw)]
          const combined = (old?.text ?? '') + data.content.text
          const deltaBytes = Buffer.byteLength(data.content.text), bytes = (old?.bytes ?? 0) + deltaBytes
          if (this.retainedTextBytes + deltaBytes > 8 * 1024 * 1024) return [...flushed, this.error('acp_message_limit', null, '本轮未收束文本超过 8MiB；已停止追加以保护内存')]
          this.retainedTextBytes += deltaBytes
          this.parts.set(index, { kind, text: combined, bytes })
          if (this.suppressDeltas) return flushed
          return [...flushed, this.emit({ t: 'message.delta', index, kind, text: data.content.text })]
        }
        case 'tool_call': case 'tool_call_update': {
          const data = AcpToolUpdateSchema.parse(raw); const id = acpEntityId(data.toolCallId)
          const status = data.status === 'in_progress' ? 'running' : data.status === 'completed' ? 'succeeded' : data.status ?? undefined
          if (data.sessionUpdate === 'tool_call') return [...this.flush(), this.emit({ t: 'tool.call', call: { id, kind: acpToolKind(data.kind), name: data.name ?? data.title ?? data.toolCallId, input: data.rawInput === undefined ? {} : data.rawInput !== null && typeof data.rawInput === 'object' && !Array.isArray(data.rawInput) ? data.rawInput : { rawInput: data.rawInput }, status: status ?? 'pending',...(data.rawOutput===undefined?{}:{result:string(data.rawOutput)}) } })]
          const result = data.rawOutput === undefined ? data.content == null ? undefined : string(data.content) : string(data.rawOutput)
          const patch = { ...(status ? { status } : {}), ...(result === undefined ? {} : { result }),
            ...(data.name === undefined ? {} : { name:data.name }), ...(data.title === undefined ? {} : { title:data.title }),
            ...(data.kind === undefined ? {} : { kind:acpToolKind(data.kind) }), ...(data.rawInput === undefined ? {} : { input:data.rawInput }),
            ...(data._meta === undefined ? {} : { metadata:data._meta }), ...(data.locations === undefined ? {} : { locations:data.locations }) }
          // ACP 的所有变更字段均可省略；空patch是无变化，扩展元数据不能伪造任务错误。
          if (!Object.keys(patch).length) return []
          return [this.emit({ t: 'tool.update', callId: id, patch })]
        }
        case 'plan': {
          const data = AcpPlanUpdateSchema.parse(raw)
          return [this.emit({ t: 'plan.update', steps: data.entries.map((entry, index) => ({ id: `step_${index}`, title: entry.content, status: entry.status === 'in_progress' ? 'running' : entry.status })) })]
        }
        case 'compaction_update': {
          const data = AcpCompactionUpdateSchema.parse(raw)
          const current = this.compactions.get(data.compactionId) ?? { summary: '', summaryContent: [] }
          const next = { ...current }
          if (data.summary !== undefined) { next.summaryContent = data.summary ?? []; next.summary = next.summaryContent.map((part) => object(part).type === 'text' ? string(object(part).text) : string(part)).join('\n') }
          if (data.error !== undefined) next.error = data.error
          if (data._meta !== undefined) next.metadata = data._meta
          if (!this.retainCompaction(data.compactionId,next)) return [this.error('acp_compaction_limit', null, '本轮压缩摘要超过宿主内存预算')]
          const events = [this.emit({ t: 'compaction', info: { strategy: 'summarize', compactionId: acpEntityId(data.compactionId), status: data.status, ...next } })]
          if (data.error) events.push(this.error('acp_compaction_failed', raw, data.error))
          return events
        }
        case 'compaction_summary_chunk': {
          const data = AcpCompactionChunkSchema.parse(raw)
          const current = this.compactions.get(data.compactionId) ?? { summary: '', summaryContent: [] }
          const next = { ...current, summary: current.summary + (data.content.type === 'text' ? string(data.content.text) : string(data.content)), summaryContent: [...current.summaryContent, data.content] }
          if (!this.retainCompaction(data.compactionId,next)) return [this.error('acp_compaction_limit', null, '本轮压缩摘要超过宿主内存预算')]
          return [this.emit({ t: 'compaction', info: { strategy: 'summarize', compactionId: acpEntityId(data.compactionId), status: 'in_progress', ...next } })]
        }
        case 'usage_update': {
          const data = AcpUsageUpdateSchema.parse(raw)
          const events = [this.emit({ t: 'usage', usage: { contextTokens: data.used, contextWindow: data.size, ...(data.cost?.currency === 'USD' ? { cost: data.cost.amount, costScope: 'session' } : {}) } })]
          if (data.cost && data.cost.currency !== 'USD') events.push(this.error('acp_non_usd_cost', raw, '非USD费用保留原文，不转换为美元'))
          return events
        }
        default: return [this.error('unknown_acp_update', raw)]
      }
    } catch (error) { return [this.error('invalid_acp_update', raw, error instanceof Error ? error.message : String(error))] }
  }
  private retainCompaction(id:string,value:{summary:string;summaryContent:JsonValue[];error?:string|null;metadata?:Record<string,JsonValue>|null}):boolean {
    const size=Buffer.byteLength(JSON.stringify(value)),previous=this.compactions.get(id)
    const total=this.compactionBytes-(previous?Buffer.byteLength(JSON.stringify(previous)):0)+size
    if(size>2*1024*1024||total>4*1024*1024||!previous&&this.compactions.size>=128)return false
    this.compactionBytes=total;this.compactions.set(id,value);return true
  }
  extension(method: string, params: JsonValue | undefined): KernelEvent[] {
    const value = object(params)
    try {
      if (method === '_proma/compaction') return [this.emit({ t: 'compaction', info: { strategy: 'summarize', summary: value.summary, originalTokens: value.originalTokens, compactedTokens: value.compactedTokens } })]
      if (method === '_proma/retry') return [this.emit({ t: 'retry', attempt: value.attempt, maxAttempts: value.maxAttempts, reason: value.reason, retryAfterMs: value.delayMs })]
      return [] // JSON-RPC未协商的通知是可忽略扩展，不得把成功任务改成失败。未知反向请求仍明确拒绝。
    } catch (error) { return [this.error('invalid_acp_extension', { method, params: params ?? null }, String(error))] }
  }
  finish(raw: unknown): KernelEvent[] {
    try {
      const { stopReason } = AcpPromptResultSchema.parse(raw); const events = this.flush()
      const usage = object(object(raw).usage)
      if (this.dialect?.promptUsageScope && (usage.inputTokens !== undefined || usage.outputTokens !== undefined)) {
        try { events.push(this.emit({ t: 'usage', usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, tokenScope: this.dialect.promptUsageScope } })) }
        catch (error) { events.push(this.error('invalid_dialect_usage', raw, String(error))) }
      }
      if (stopReason === 'refusal' || stopReason === 'max_turn_requests') events.push(this.error(`acp_${stopReason}`, raw))
      events.push(this.emit({ t: 'done', reason: stopReason === 'end_turn' ? 'stop' : stopReason === 'max_tokens' ? 'max-tokens' : stopReason === 'cancelled' ? 'cancelled' : 'error' }))
      return events
    } catch (error) { return [this.error('invalid_acp_prompt_result', raw, String(error)), this.emit({ t: 'done', reason: 'error' })] }
  }
}
