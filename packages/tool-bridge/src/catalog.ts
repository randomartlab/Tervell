import { z } from 'zod'
import { ToolContextSchema, ToolMetadataSchema, JsonValueSchema } from '@proma/protocol'
import type { JsonValue, ToolContext, ToolMetadata, ToolApprovalDecision } from '@proma/protocol'
import { ToolGate } from '@proma/core/permission'

export interface ToolExecution { context: ToolContext; signal: AbortSignal; assertContext?: () => void }
export interface ToolAuthorization { context: ToolContext; tool: ToolMetadata; input: JsonValue; signal: AbortSignal; whitelistable?: boolean }
interface RegisteredTool {
  metadata: ToolMetadata; input: z.ZodType; output: z.ZodType
  execute: (input: unknown, execution: ToolExecution) => Promise<unknown>
}
export class ToolCatalog {
  constructor(readonly gate = new ToolGate()) {}
  private readonly tools = new Map<string, RegisteredTool>()
  register<I, O>(metadata: ToolMetadata, input: z.ZodType<I>, output: z.ZodType<O>, execute: (input: I, execution: ToolExecution) => Promise<O>): void {
    if (this.sealed) throw new Error('工具目录已冻结，请为新目录创建新会话')
    const parsed = ToolMetadataSchema.parse(metadata)
    if (this.tools.has(parsed.name)) throw new Error('工具名称已注册')
    if ((parsed.effect === 'read') !== (parsed.kind === 'read')) throw new Error('只读工具必须显式声明 read 类型和 effect')
    this.tools.set(parsed.name, { metadata: structuredClone(parsed), input, output, execute: async (value, execution) => execute(input.parse(value), execution) })
  }
  get(name: string): ToolMetadata | undefined { const tool = this.tools.get(name); return tool ? structuredClone(tool.metadata) : undefined }
  freeze(): void { this.sealed = true }
  private sealed = false
  snapshot(): Array<ToolMetadata & { inputSchema: Record<string, unknown> }> {
    return [...this.tools.values()].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)).map((tool) => ({ ...structuredClone(tool.metadata), inputSchema: z.toJSONSchema(tool.input, { io: 'input' }) }))
  }
  async execute(name: string, raw: unknown, execution: ToolExecution, authorize: (request: ToolAuthorization) => Promise<boolean | ToolApprovalDecision>): Promise<JsonValue> {
    const tool = this.tools.get(name)
    if (!tool) throw new Error('工具未注册')
    const context = ToolContextSchema.parse(execution.context)
    if (execution.signal.aborted) throw new Error('工具执行已取消')
    execution.assertContext?.()
    if (Buffer.byteLength(JSON.stringify(raw)) > 256 * 1024) throw new Error('工具参数超过上限')
    const input = tool.input.parse(structuredClone(raw))
    return this.gate.run(tool.metadata, JsonValueSchema.parse(JSON.parse(JSON.stringify(input))), { ...execution, context,
      authorize: (request) => authorize({ ...request, tool: tool.metadata }),
    }, async () => {
      const result = JsonValueSchema.parse(JSON.parse(JSON.stringify(tool.output.parse(await tool.execute(input, { context: structuredClone(context), signal: execution.signal })))))
      if (Buffer.byteLength(JSON.stringify(result)) > 512 * 1024) throw new Error('工具结果超过上限')
      return result
    })
  }
}
