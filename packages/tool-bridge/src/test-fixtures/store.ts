import { randomUUID } from 'node:crypto'
import type { PlanningStore } from '../planning-backend.ts'
import type { ProductTodo, ProductCalendarEvent } from '@proma/protocol'
/** 只用于无桌面回归；产品运行由桌面既有 PlanningStore 提供持久化。 */
export function fixturePlanningStore(): PlanningStore {
  const todos = new Map<string, ProductTodo>(), events = new Map<string, ProductCalendarEvent>()
  let revision = 0
  return {
    listTodos: () => [...todos.values()].map((value) => ({ ...value, dueAt: value.dueAt ?? undefined })),
    getTodo: (id) => { const value = todos.get(id); return value ? { ...value, dueAt: value.dueAt ?? undefined } : undefined },
    createTodo: (input) => { const value: ProductTodo = { ...input, id: randomUUID(), status: 'open', updatedAt: ++revision }; todos.set(value.id, value); return { ...value, dueAt: value.dueAt ?? undefined } },
    updateTodo: (input) => { const old = todos.get(input.id); if (!old) return; const value = { ...old, ...input, updatedAt: ++revision }; todos.set(value.id, value); return { ...value, dueAt: value.dueAt ?? undefined } },
    deleteTodo: (id) => todos.delete(id),
    listCalendarEvents: () => [...events.values()].map((value) => ({ ...value, endAt: value.endAt ?? undefined })),
    getCalendarEvent: (id) => { const value = events.get(id); return value ? { ...value, endAt: value.endAt ?? undefined } : undefined },
    createCalendarEvent: (input) => { const value = { ...input, id: randomUUID(), updatedAt: ++revision }; events.set(value.id, value); return value },
    updateCalendarEvent: (input) => { const old = events.get(input.id); if (!old) return; const value = { ...old, ...input, updatedAt: ++revision }; events.set(value.id, value); return { ...value, endAt: value.endAt ?? undefined } },
    deleteCalendarEvent: (id) => events.delete(id),
  }
}
