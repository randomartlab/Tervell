import {usesNativeMessageLayout} from './native-timeline-policy';
import * as React from 'react';
import { useAtomValue, useStore } from 'jotai';
import { agentSessionsAtom, agentSessionDraftsAtom, agentSessionDraftSyncVersionsAtom } from '@/atoms/agent-atoms';
import { conversationDraftsAtom, conversationDraftSyncVersionsAtom } from '@/atoms/chat-atoms';
import { useMessageSessionId } from '@/components/ai-elements/message';
import { usePlugins, PluginComponent } from './native-registry';
import { transformTimelineItem } from '@/lib/third-party/paseo-client/runtime';
import type { SDKContentBlock, SDKMessage, SDKUserMessage, SDKToolResultBlock } from '@proma/shared';
import { SentAnnotations } from '@/components/selection/Annotations';
import { inlineAttachmentParts, parseAnnotations } from '@proma/shared';
import { paseoToolDetail } from '@proma/shared';
export function PluginSemanticItem({
  item,
  id,
  sessionId: explicitId,
  streaming,
  fallback,
  timestamp
}: {
  item: Record<string, unknown>;
  id: string;
  sessionId?: string;
  streaming?: boolean;
  fallback: React.ReactNode;
  timestamp?: string | number;
}): React.ReactElement {
  const store = useStore(),
    plugins = usePlugins(),
    contextId = useMessageSessionId(),
    sessionId = explicitId ?? contextId,
    session = useAtomValue(agentSessionsAtom).find(s => s.id === sessionId),
    isChat = sessionId?.startsWith('chat:') === true;
  const eligible = plugins.filter(p => !p.error && !usesNativeMessageLayout(p.id,String(item.type)) && (isChat ? ['builtin-better-conversation','builtin-vivid-activity'].includes(p.id) : p.entry.access?.workspaceIds.includes(session?.workspaceId ?? '')));
  // 过程展示有单一所有者；正文仍交给 Better，避免插件顺序把活动渲染抢走。
  const process=item.type==='reasoning'||item.type==='tool_call';
  const ordered=process?[...eligible].sort((a,b)=>Number(b.id==='builtin-vivid-activity')-Number(a.id==='builtin-vivid-activity')):eligible;
  const userText = item.type === 'user_message' ? String(item.text ?? '') : undefined;
  const parsed = userText === undefined ? undefined : parseAnnotations(userText);
  const preserveHost = !!userText && (inlineAttachmentParts(userText).some(part => !!part.attachment) || /@file:|mention:\/\//.test(userText));
  const transformed = preserveHost ? undefined : transformTimelineItem({
    item: parsed ? {
      ...item,
      text: parsed.text
    } : item,
    sourceId: id,
    phase: streaming ? 'streaming' : 'complete',
    plugins: ordered
  });
  const when = React.useMemo(() => new Date(timestamp ?? Date.now()), [timestamp, id]);
  if (transformed === undefined) return <>{fallback}</>;
  const composer = {
    appendText: (text: string) => {
      if (!sessionId) return false;
      const key = isChat ? sessionId.slice(5) : sessionId;
      if (isChat) {
        store.set(conversationDraftsAtom, all => new Map(all).set(key, (all.get(key) ?? '') + text));
        store.set(conversationDraftSyncVersionsAtom, all => new Map(all).set(key, (all.get(key) ?? 0) + 1));
      } else {
        store.set(agentSessionDraftsAtom, all => new Map(all).set(key, (all.get(key) ?? '') + text));
        store.set(agentSessionDraftSyncVersionsAtom, all => new Map(all).set(key, (all.get(key) ?? 0) + 1));
      }
      return true;
    }
  };
  return <>{parsed?.annotations.length ? <SentAnnotations text={userText!} /> : null}{transformed.map(part => {
      const installation = eligible.find(p => p.id === part.pluginId),
        row = installation?.timelineRenderers.find(r => r.kind === part.kind && r.version === part.version),
        parsed = row?.schema?.safeParse(part.data);
      if (!installation || !row || !parsed?.success) return <React.Fragment key={part.id}>{fallback}</React.Fragment>;
      return <PluginComponent key={part.id} installation={installation} row={row} fallback={fallback} props={{
        agentId: sessionId,
        composer,
        item: {
          type: 'plugin',
          kind: part.kind,
          version: part.version,
          data: parsed.data
        },
        timestamp: when
      }} />;
    })}</>;
}
export function PluginTimelineBlock({
  block,
  allMessages,
  streaming,
  fallback,
  timestamp
}: {
  timestamp?:string|number;
  block: SDKContentBlock;
  allMessages: SDKMessage[];
  streaming?: boolean;
  fallback: React.ReactNode;
}): React.ReactElement {
  const sourceId = React.useId();
  let item: Record<string, unknown> | undefined;
  if (block.type === 'text') item = {
    type: 'assistant_message',
    text: String(block.text ?? '')
  };
  if (block.type === 'thinking') item = {
    type: 'reasoning',
    text: String(block.thinking ?? '')
  };
  if (block.type === 'tool_use') {
    const id = String(block.id);
    let result: SDKToolResultBlock | undefined;
    for (const message of allMessages) {
      if (message.type !== 'user') continue;
      const parts = (message as SDKUserMessage).message?.content;
      if (!Array.isArray(parts)) continue;
      for (const part of parts) if (part?.type === 'tool_result' && part.tool_use_id === id) result = part as SDKToolResultBlock;
    }
    let output: unknown = result?.content;
    if (Array.isArray(output)) {
      const text = output.filter(v => v && typeof v === 'object' && Reflect.get(v, 'type') === 'text').map(v => String(Reflect.get(v, 'text') ?? '')).join('\n');
      if (text) output = text;
    }
    try {
      if (typeof output === 'string') output = JSON.parse(output);
    } catch {/* 文本结果保留。 */}
    item = {
      type: 'tool_call',
      callId: id,
      name: String(block.name),
      status: result ? result.is_error ? 'failed' : 'completed' : 'running',
      error: result?.is_error ? String(result.content) : null,
      detail: paseoToolDetail(String(block.name), block.input, output)
    };
    const args = block.input && typeof block.input === 'object' ? block.input as Record<string, unknown> : {};
    const tasks = Array.isArray(args.todos) ? args.todos : Array.isArray(args.plan) ? args.plan : undefined;
    if (tasks && /todo|plan/i.test(String(block.name))) item = {
      type: 'todo',
      items: tasks.map(raw => {
        const row = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
        return {
          text: String(row.content ?? row.step ?? row.text ?? ''),
          completed: row.status === 'completed',
          status: ['pending', 'in_progress', 'completed'].includes(String(row.status)) ? row.status : 'pending',
          ...(typeof row.id === 'string' ? {
            id: row.id
          } : {}),
          ...(typeof row.activeForm === 'string' ? {
            activeForm: row.activeForm
          } : {})
        };
      })
    };
  }
  if (!item) return <>{fallback}</>;
  return <PluginSemanticItem timestamp={timestamp} item={item} id={String('id' in block ? block.id : sourceId)} streaming={streaming} fallback={fallback} />;
}

/** 插件自己追加的消息与原生消息共享会话转录；停用后保留可识别的占位。 */
export function PluginTimelineRow({
  message
}: {
  message: Record<string, unknown>;
}): React.ReactElement {
  const plugins = usePlugins(),
    sessionId = useMessageSessionId(),
    session = useAtomValue(agentSessionsAtom).find(s => s.id === sessionId),
    installation = plugins.find(p => p.id === message.pluginId && p.entry.access?.workspaceIds.includes(session?.workspaceId ?? '')),
    item = message.item as {
      kind: string;
      version: number;
      data: unknown;
    },
    row = installation?.timelineRenderers.find(r => r.kind === item?.kind && r.version === item?.version),
    parsed = row?.schema?.safeParse(item?.data);
  if (!installation || !row || !parsed?.success) return <p className="p-3 text-xs text-muted-foreground">插件时间线内容暂不可用：{String(message.pluginId)}</p>;
  return <PluginComponent installation={installation} row={row} props={{
    agentId: sessionId,
    item: {
      type: 'plugin',
      kind: item.kind,
      version: item.version,
      data: parsed.data
    },
    timestamp: new Date(String(message.timestamp))
  }} />;
}
export function usePluginTimelineTypes(): Set<string> {
  const plugins = usePlugins(),
    sessionId = useMessageSessionId(),
    session = useAtomValue(agentSessionsAtom).find(s => s.id === sessionId);
  return new Set(plugins.filter(p => p.entry.access?.workspaceIds.includes(session?.workspaceId ?? '')).flatMap(p => p.timelineTransformers.map(row => row.query?.itemType ?? '')));
}
