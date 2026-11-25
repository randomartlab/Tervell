import { randomUUID } from 'node:crypto'
import type { SDKMessage } from '@proma/shared'
import type { ToolCall, ToolPatch } from '@proma/protocol'

interface PendingTool {
  uuid: string
  createdAt: number
  block: Record<string, unknown>
  bytes: number
}
export interface AcpToolMessage { message: SDKMessage; persist: boolean }

/** 可变工具参数只发轻量预览；完成时按同一UUID落一次权威记录，重载、fork和导出不丢patch。 */
export class DesktopAcpTools {
  private readonly pending = new Map<string, PendingTool>()
  private readonly completed = new Set<string>()
  private bytes=0
  constructor(private readonly model: string) {}

  call(call: ToolCall): AcpToolMessage[] {
    if (this.pending.has(call.id) || this.completed.has(call.id)) throw Error('ACP 工具调用标识重复')
    if (this.pending.size >= 1024 || this.completed.size >= 10000) throw Error('ACP 本轮工具数量超限')
    const row:PendingTool = { uuid: randomUUID(), createdAt: Date.now(), block: { type: 'tool_use', id: call.id, name: call.name, input: call.input ?? {} },bytes:0 }
    row.bytes=Buffer.byteLength(JSON.stringify(row.block));if(this.bytes+row.bytes>8*1024*1024)throw Error('ACP 未完成工具参数超过内存预算');this.bytes+=row.bytes
    this.pending.set(call.id, row)
    if(['succeeded','failed','rejected'].includes(call.status))return this.update(call.id,{status:call.status,result:call.result,error:call.error})
    return [{ message: this.message(row, true), persist: false }]
  }

  update(id: string, patch: ToolPatch): AcpToolMessage[] {
    const row = this.pending.get(id)
    if (!row) return []
    if (patch.name != null) row.block.name = patch.name
    if (patch.title !== undefined) row.block._acpTitle = patch.title
    if (patch.input !== undefined) row.block.input = patch.input !== null && typeof patch.input === 'object' && !Array.isArray(patch.input) ? patch.input : { rawInput: patch.input }
    if (patch.metadata !== undefined) row.block._acpMetadata = patch.metadata
    if (patch.locations !== undefined) row.block._acpLocations = patch.locations
    const size=Buffer.byteLength(JSON.stringify(row.block));if(this.bytes-row.bytes+size>8*1024*1024)throw Error('ACP 未完成工具参数超过内存预算');this.bytes+=size-row.bytes;row.bytes=size
    if (!['succeeded', 'failed', 'rejected'].includes(patch.status ?? '')) return [{ message: this.message(row, true), persist: false }]
    this.pending.delete(id); this.completed.add(id);this.bytes-=row.bytes
    return [
      { message: this.message(row, false), persist: true },
      { message: { type: 'user', uuid: randomUUID(), message: { content: [{ type: 'tool_result', tool_use_id: id, content: patch.result ?? patch.error ?? patch.status ?? '', is_error: patch.status === 'failed' || patch.status === 'rejected' }] }, parent_tool_use_id: null, _createdAt: Date.now() }, persist: true },
    ]
  }

  drain(): SDKMessage[] {
    const messages = [...this.pending.values()].map(row => this.message(row, false))
    this.pending.clear(); this.completed.clear();this.bytes=0
    return messages
  }

  previews(): SDKMessage[] { return [...this.pending.values()].map(row => this.message(row, true)) }

  private message(row: PendingTool, partial: boolean): SDKMessage {
    return { type: 'assistant', uuid: row.uuid, message: { content: [{ ...row.block }], model: this.model }, parent_tool_use_id: null, _createdAt: row.createdAt, ...(partial ? { _partial: true } : {}) } as SDKMessage
  }
}
