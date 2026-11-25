import type { ChatRunSnapshot, ChatStreamPosition } from '@proma/shared'
import type { ConversationStreamState } from '@/atoms/chat-atoms'

/** 同一主进程序号同时用于推送与恢复，跨IPC通道乱序不会重复追加正文。 */
export function acceptsChatStreamEvent(current: ConversationStreamState | undefined, event: ChatStreamPosition, terminal = false): boolean {
  if (!current || !event.generation) return true
  if (current.generation && current.generation !== event.generation) return (event.startedAt ?? 0) > (current.startedAt ?? 0)
  if (current.generation === event.generation && event.revision !== undefined && current.revision !== undefined) {
    return terminal ? event.revision >= current.revision : event.revision > current.revision
  }
  return true
}

export function restoreChatStream(current: ConversationStreamState | undefined, snapshot: ChatRunSnapshot): ConversationStreamState {
  if (current?.generation === snapshot.generation && (current.revision ?? -1) > snapshot.revision) return current
  if (current?.generation === snapshot.generation && !current.streaming && (current.revision ?? -1) >= snapshot.revision) return current
  if (current && current.generation !== snapshot.generation && (current.startedAt ?? 0) > snapshot.startedAt) return current
  return { streaming: true, generation: snapshot.generation, revision: snapshot.revision, content: snapshot.content, reasoning: snapshot.reasoning, model: snapshot.model, toolActivities: snapshot.toolActivities, startedAt: snapshot.startedAt, recoveryTruncated: snapshot.truncated }
}
