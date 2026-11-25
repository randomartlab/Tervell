import {control, plain} from './bridge';
import type {RecordValue} from './bridge';

export interface MobileConversation {
  id: string;
  title: string;
  updatedAt: number;
  channelId?: string;
  modelId?: string;
  reasoning?: {effort?: string};
  contextLength?: number | 'infinite';
  pinned?: boolean;
  archived?: boolean;
  running?: boolean;
}
export interface MobileChatMessage {
  id: string;
  role: string;
  content: string;
  reasoning?: string;
  error?: string;
  createdAt: number;
  toolActivities?: RecordValue[];
  attachments?: Array<{id: string; filename: string; mediaType: string; size: number}>;
}
export interface MobileChatChannel {
  id: string;
  name: string;
  models: Array<{id: string; name: string}>;
}
export interface MobileChatTool {
  id: string;
  name: string;
  enabled: boolean;
  available: boolean;
}

/** 消息、工具和模型目录按冻结快照分页；不接收摘要替代结构。 */
export async function readChat<T = RecordValue>(values: RecordValue): Promise<T> {
  const response = await control('chat.read', values);
  const page = plain(response.resultPage);
  if (!page.id) return response.result as T;
  let text = String(page.content);
  let next = Number(page.nextOffset);
  let more = Boolean(page.hasMore);
  while (more) {
    const row = await control('chat.read', {action: 'result', id: page.id, offset: next});
    if (Number(row.offset) !== next) throw Error('Chat 读取位置不符');
    text += String(row.content);
    next = Number(row.nextOffset);
    more = Boolean(row.hasMore);
  }
  return JSON.parse(text) as T;
}
