import type { SDKMessage } from '@proma/shared'
import { annotationsForTranscript } from '@proma/shared'
import { createHash } from 'node:crypto'
import { writeTextChunksAtomic } from './safe-file'

/** 事件按原顺序写出，工具输入/结果均保留，不再构建整段投影和 Markdown 副本。 */
export async function writeHistorySnapshot(
  path: string,
  messages: AsyncIterable<SDKMessage>,
  upTo?: string,
): Promise<{ digest: string; bytes: number }> {
  const hash = createHash('sha256')
  let bytes = 0, found = !upTo
  async function* chunks(): AsyncGenerator<string> {
    for await (const value of messages) {
      const message = value as Record<string, unknown>
      const body = message.message as { content?: unknown } | undefined
      const parts = typeof body?.content === 'string'
        ? [{ type: 'text', text: body.content }]
        : Array.isArray(body?.content) ? body.content as Array<Record<string, unknown>> : []
      for (const part of parts) {
        let text = ''
        if (part.type === 'text') text = `[${message.type === 'user' ? 'user_message' : 'assistant_message'}]\n${annotationsForTranscript(String(part.text ?? ''))}`
        else if (part.type === 'thinking') text = `[reasoning]\n${String(part.thinking ?? '')}`
        else if (part.type === 'tool_use') text = `[工具 ${String(part.name)} · ${String(part.id)}]\n${JSON.stringify(part.input)}`
        else if (part.type === 'tool_result') text = `[工具结果 ${String(part.tool_use_id)}${part.is_error ? ' · 失败' : ''}]\n${typeof part.content === 'string' ? part.content : JSON.stringify(part.content)}`
        else text = `[${String(part.type ?? 'content')}]\n${JSON.stringify(part)}`
        if (text.trim()) { const chunk = text + '\n\n'; hash.update(chunk); bytes += Buffer.byteLength(chunk); yield chunk }
      }
      if (!parts.length || message.error) {
        const chunk = `[${String(message.type)}]\n${JSON.stringify(message)}\n\n`
        hash.update(chunk); bytes += Buffer.byteLength(chunk); yield chunk
      }
      if (upTo && message.uuid === upTo) { found = true; break }
    }
    if (!found) throw Error('历史截断消息不存在')
    if (!bytes) throw Error('这条会话历史为空，没有可导入的消息。')
  }
  await writeTextChunksAtomic(path, chunks())
  return { digest: hash.digest('hex'), bytes }
}
