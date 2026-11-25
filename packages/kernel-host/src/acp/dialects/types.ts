import { JsonValueSchema } from '@proma/protocol'
import type { AcpModelCatalog, JsonValue } from '@proma/protocol'

export interface DialectInteraction {
  toolCall: { toolCallId: string; title: string; kind: string; rawInput?: JsonValue }
  options: Array<{ optionId: string; name: string; kind: 'allow_once' | 'reject_once' }>
  reply: (optionId: string | null) => JsonValue
  plan?: string
}
/** 生命周期留在宿主；厂商差异限于这些受控钩子，无任意RPC透传。 */
export interface AcpDialect {
  readonly id: string
  readonly sources: readonly string[]
  readonly clientMeta?: Record<string, JsonValue>
  normalizeUpdate?: (update: JsonValue) => JsonValue
  restartsStream?: (update: JsonValue) => boolean
  promptUsageScope?: 'turn' | 'session'
  catalog?: { method: string; sessionless: boolean; read: (raw: unknown) => AcpModelCatalog }
  interaction?: (method: string, params: JsonValue | undefined) => DialectInteraction | undefined
}
export const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
export const array = (value: unknown): unknown[] => Array.isArray(value) ? value : []
export function json(value: unknown): JsonValue { return JsonValueSchema.parse(JSON.parse(JSON.stringify(value))) }
