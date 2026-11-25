import { z } from 'zod'
import { PRODUCT_TOOL_CONTRACTS } from '@proma/protocol'
import type { ProductToolInput, ProductToolOutput, ProductToolMethod, ToolContext, ToolMetadata } from '@proma/protocol'
import { ToolCatalog } from './catalog.ts'

/** 数据适配由宿主提供：仍使用产品原有数据层，包不能反向导入 Electron。 */
export type PlanningBackend = { [M in ProductToolMethod]: (input: ProductToolInput<M>, context: ToolContext, signal: AbortSignal) => Promise<ProductToolOutput<M>> }
export function registerPlanningTools(catalog: ToolCatalog, backend: PlanningBackend): void {
  const add = <I, O>(method: string, description: string, effect: ToolMetadata['effect'], contract: { input: z.ZodType<I>; output: z.ZodType<O> }, execute: (input: I, context: ToolContext, signal: AbortSignal) => Promise<O>) => {
    catalog.register({ name: `mcp__proma__${method}`, description, kind: effect === 'read' ? 'read' : effect === 'delete' ? 'delete' : 'other', effect }, contract.input, contract.output,
      async (input, { context, signal }) => execute(input, context, signal))
  }
  add('todo_list', '列出当前项目的任务（最多 200 项）', 'read', PRODUCT_TOOL_CONTRACTS.todo_list, backend.todo_list)
  add('todo_create', '在当前项目创建任务', 'write', PRODUCT_TOOL_CONTRACTS.todo_create, backend.todo_create)
  add('todo_update', '以预期版本更新当前项目任务', 'write', PRODUCT_TOOL_CONTRACTS.todo_update, backend.todo_update)
  add('todo_delete', '删除当前项目任务，必须逐次审批', 'delete', PRODUCT_TOOL_CONTRACTS.todo_delete, backend.todo_delete)
  add('calendar_list', '列出当前项目的日程（最多 200 项）', 'read', PRODUCT_TOOL_CONTRACTS.calendar_list, backend.calendar_list)
  add('calendar_create', '在当前项目创建日程', 'write', PRODUCT_TOOL_CONTRACTS.calendar_create, backend.calendar_create)
  add('calendar_update', '以预期版本更新当前项目日程', 'write', PRODUCT_TOOL_CONTRACTS.calendar_update, backend.calendar_update)
  add('calendar_delete', '删除当前项目日程，必须逐次审批', 'delete', PRODUCT_TOOL_CONTRACTS.calendar_delete, backend.calendar_delete)
}
