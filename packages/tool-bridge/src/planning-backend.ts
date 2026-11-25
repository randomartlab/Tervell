import { PRODUCT_TOOL_CONTRACTS, ProductCalendarEventSchema, ProductTodoSchema } from '@proma/protocol'
import type { ProductTodo, ProductCalendarEvent, ToolContext, ProductToolInput } from '@proma/protocol'
import type { PlanningBackend } from './planning.ts'

interface TodoRecord extends Omit<ProductTodo, 'workspaceId' | 'dueAt'> { workspaceId?: string; dueAt?: number }
interface EventRecord extends Omit<ProductCalendarEvent, 'workspaceId'> { workspaceId?: string }
export interface PlanningStore {
  listTodos(): TodoRecord[]; getTodo(id: string): TodoRecord | undefined
  createTodo(input: ProductToolInput<'todo_create'> & { workspaceId: string; sessionId: string }): TodoRecord
  updateTodo(input: ProductToolInput<'todo_update'>): TodoRecord | undefined; deleteTodo(id: string): boolean
  listCalendarEvents(): EventRecord[]; getCalendarEvent(id: string): EventRecord | undefined
  createCalendarEvent(input: ProductToolInput<'calendar_create'> & { workspaceId: string }): EventRecord
  updateCalendarEvent(input: ProductToolInput<'calendar_update'>): EventRecord | undefined; deleteCalendarEvent(id: string): boolean
}
/** 同步产品存储中归属/版本检查与变更连续执行，不在检查和提交之间 await。 */
export function createPlanningBackend(store: PlanningStore, changed: (kind: 'todo' | 'calendar') => void = () => {}): PlanningBackend {
  const todo = (id: string, context: ToolContext, expected: number) => {
    const value = store.getTodo(id)
    if (!value || value.workspaceId !== context.workspaceId) throw new Error('任务不属于当前项目或不存在')
    if (value.updatedAt !== expected) throw new Error('任务已修改，请重新读取后重试')
    return value
  }
  const event = (id: string, context: ToolContext, expected: number) => {
    const value = store.getCalendarEvent(id)
    if (!value || value.workspaceId !== context.workspaceId) throw new Error('日程不属于当前项目或不存在')
    if (value.updatedAt !== expected) throw new Error('日程已修改，请重新读取后重试')
    return value
  }
  const mapTodo = (value: TodoRecord | undefined) => ProductTodoSchema.parse(value && { id: value.id, title: value.title, notes: value.notes, status: value.status, dueAt: value.dueAt, workspaceId: value.workspaceId, updatedAt: value.updatedAt })
  const mapEvent = (value: EventRecord | undefined) => ProductCalendarEventSchema.parse(value && { id: value.id, title: value.title, notes: value.notes, startAt: value.startAt, endAt: value.endAt, workspaceId: value.workspaceId, updatedAt: value.updatedAt })
  return {
    todo_list: async (_input, context) => ({ todos: store.listTodos().filter((value) => value.workspaceId === context.workspaceId).slice(0, 200).map(mapTodo) }),
    todo_create: async (raw, context) => {
      const input = PRODUCT_TOOL_CONTRACTS.todo_create.input.parse(raw)
      const result = mapTodo(store.createTodo({ ...input, workspaceId: context.workspaceId, sessionId: context.sessionId })); changed('todo'); return result
    },
    todo_update: async (raw, context) => {
      const input = PRODUCT_TOOL_CONTRACTS.todo_update.input.parse(raw); todo(input.id, context, input.expectedUpdatedAt)
      const result = mapTodo(store.updateTodo(input)); changed('todo'); return result
    },
    todo_delete: async (raw, context) => {
      const input = PRODUCT_TOOL_CONTRACTS.todo_delete.input.parse(raw); todo(input.id, context, input.expectedUpdatedAt)
      const deleted = store.deleteTodo(input.id); changed('todo'); return { deleted }
    },
    calendar_list: async (_input, context) => ({ events: store.listCalendarEvents().filter((value) => value.workspaceId === context.workspaceId).slice(0, 200).map(mapEvent) }),
    calendar_create: async (raw, context) => {
      const input = PRODUCT_TOOL_CONTRACTS.calendar_create.input.parse(raw)
      const result = mapEvent(store.createCalendarEvent({ ...input, workspaceId: context.workspaceId })); changed('calendar'); return result
    },
    calendar_update: async (raw, context) => {
      const input = PRODUCT_TOOL_CONTRACTS.calendar_update.input.parse(raw); const old = event(input.id, context, input.expectedUpdatedAt)
      const { expectedUpdatedAt: _version, ...changes } = input
      mapEvent({ ...old, ...changes })
      const result = mapEvent(store.updateCalendarEvent(input)); changed('calendar'); return result
    },
    calendar_delete: async (raw, context) => {
      const input = PRODUCT_TOOL_CONTRACTS.calendar_delete.input.parse(raw); event(input.id, context, input.expectedUpdatedAt)
      const deleted = store.deleteCalendarEvent(input.id); changed('calendar'); return { deleted }
    },
  }
}
