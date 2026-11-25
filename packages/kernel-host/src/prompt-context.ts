import { KernelPromptInputSchema } from '@proma/protocol'
import type { KernelPromptInput } from '@proma/protocol'

/** 已绑定持久句柄时不重复注入历史；跨内核时按原始顺序携带。 */
export function createPromptContext(raw: KernelPromptInput, hasNativeHistory: boolean): string {
  const input = KernelPromptInputSchema.parse(raw)
  if (hasNativeHistory) return input.text
  const history = input.history.map((message) => ({ role: message.role, content: message.content }))
  if (!input.summary && !history.length) return input.text
  // JSON 编码保留换行/角色/顺序，内容视为历史数据而非新的系统指令。
  return `${JSON.stringify({ kind: 'conversation-context', summary: input.summary ?? null, messages: history })}\n\n${input.text}`
}
