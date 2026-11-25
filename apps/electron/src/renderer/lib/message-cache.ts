import type { SDKMessage } from '@proma/shared'

export const AGENT_MSG_CACHE_MAX = 20
export const AGENT_MSG_CACHE_BYTES = 32 * 1024 * 1024
const messageWeights = new WeakMap<object, number>()
const arrayWeights = new WeakMap<object, number>()

/** 估计 JS 保留容量而非 JSON 字节；遍历字符串而不生成另一份序列化正文。 */
function estimate(value: unknown): number {
  if (typeof value === 'string') return 24 + value.length * 2
  if (!value || typeof value !== 'object') return 8
  const cached = messageWeights.get(value)
  if (cached !== undefined) return cached
  let size = Array.isArray(value) ? 32 : 64
  for (const [key, item] of Object.entries(value)) size += key.length * 2 + 16 + estimate(item)
  messageWeights.set(value, size)
  return size
}
export function messageArrayBytes(messages: SDKMessage[]): number {
  const previous = arrayWeights.get(messages)
  if (previous !== undefined) return previous
  const bytes = 32 + messages.reduce((sum, message) => sum + 8 + estimate(message), 0)
  arrayWeights.set(messages, bytes)
  return bytes
}

/** 超大活动会话仍能查看，但不由全局缓存额外延长其生命周期。 */
export function setSessionMessagesCache(
  previous: Map<string, SDKMessage[]>, id: string, messages: SDKMessage[],
): Map<string, SDKMessage[]> {
  const next = new Map(previous)
  next.delete(id)
  if (messageArrayBytes(messages) <= AGENT_MSG_CACHE_BYTES) next.set(id, messages)
  let bytes = 0
  for (const array of next.values()) bytes += messageArrayBytes(array)
  for (const [key, array] of next) {
    if (next.size <= AGENT_MSG_CACHE_MAX && bytes <= AGENT_MSG_CACHE_BYTES) break
    next.delete(key); bytes -= messageArrayBytes(array)
  }
  return next
}
