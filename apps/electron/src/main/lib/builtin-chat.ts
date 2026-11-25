import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { listConversations, getConversationMessagesStrict } from './conversation-manager';
import { getConfigDir } from './config-paths';
import { paseoAgent, paseoWorkspace } from './plugin-host/projection';
import { pluginTimelinePage } from './plugin-host/timeline';
import type { AgentSessionMeta, SDKMessage, SDKContentBlock } from '@proma/shared';
export const BUILTIN_CHAT_WORKSPACE = 'builtin-chat';
export function builtinChatWorkspace(): Record<string, unknown> {
  const directory = join(getConfigDir(), 'conversations');
  mkdirSync(directory, {
    recursive: true
  });
  return paseoWorkspace({
    id: BUILTIN_CHAT_WORKSPACE,
    name: 'Chat',
    slug: BUILTIN_CHAT_WORKSPACE,
    createdAt: 0,
    updatedAt: 0
  }, directory);
}
export function builtinChatAgent(id: string): Record<string, unknown> | null {
  const conversation = listConversations().find(c => 'chat:' + c.id === id);
  if (!conversation) return null;
  const cwd = String(builtinChatWorkspace().directory),
    session: AgentSessionMeta = {
      ...conversation,
      id,
      workspaceId: BUILTIN_CHAT_WORKSPACE,
      kernelId: 'chat',
      gatewayReasoning: conversation.reasoning ? {
        model: conversation.modelId ?? '',
        effort: conversation.reasoning.effort
      } : undefined
    };
  return paseoAgent(session, {
    cwd,
    running: false
  });
}
export function builtinChatOperation(method: string, input: Record<string, unknown>): unknown {
  const id = String(input.id),
    agent = builtinChatAgent(id);
  if (!agent) throw Error('Chat 会话不存在');
  if (method === 'agent.get') return agent;
  if (method !== 'agent.timeline') throw Error('此内置 Chat 入口只提供会话读取');
  const messages: SDKMessage[] = [];
  for (const message of getConversationMessagesStrict(id.slice(5))) {
    const timestamp = new Date(message.createdAt).toISOString();
    if (message.role === 'system') {
      messages.push({
        type: 'system',
        subtype: 'builtin_chat_system',
        uuid: message.id,
        timestamp,
        message: message.content
      });
      continue;
    }
    const content: SDKContentBlock[] = [];
    if (message.reasoning) content.push({
      type: 'thinking',
      thinking: message.reasoning
    });
    content.push({
      type: 'text',
      text: message.content
    });
    for (const attachment of message.attachments ?? []) content.push({
      type: 'text',
      text: `\n[附件：${attachment.filename}；${attachment.mediaType}；${attachment.size} 字节；${attachment.localPath}]`
    });
    const calls = new Map<string, {
      name: string;
      input: Record<string, unknown>;
      result?: string;
      isError?: boolean;
      done: boolean;
    }>();
    for (const activity of message.toolActivities ?? []) {
      const previous = calls.get(activity.toolCallId);
      calls.set(activity.toolCallId, {
        name: activity.toolName,
        input: activity.input ?? previous?.input ?? {},
        result: activity.result ?? previous?.result,
        isError: activity.isError ?? previous?.isError,
        done: activity.type === 'result' || previous?.done === true
      });
    }
    for (const [callId, call] of calls) content.push({
      type: 'tool_use',
      id: callId,
      name: call.name,
      input: call.input
    });
    messages.push({
      type: message.role,
      uuid: message.id,
      timestamp,
      message: {
        content
      }
    });
    const results = [...calls].filter(([, call]) => call.done).map(([callId, call]) => ({
      type: 'tool_result' as const,
      tool_use_id: callId,
      content: call.result ?? '',
      is_error: call.isError
    }));
    if (results.length) messages.push({
      type: 'user',
      uuid: message.id + ':tools',
      timestamp,
      message: {
        content: results
      }
    });
    if (message.error) messages.push({
      type: 'system',
      subtype: 'builtin_chat_error',
      uuid: message.id + ':error',
      timestamp,
      message: message.error
    });
  }
  return pluginTimelinePage(messages, {
    ...(input.options as Record<string, unknown> ?? {}),
    agentId: id,
    provider: 'chat'
  });
}
