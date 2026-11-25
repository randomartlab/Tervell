import { z } from 'zod';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file';
import { getConfigDir } from './config-paths';
import type { ConversationAnnotation } from '@proma/shared';
import type { MobileContext } from './mobile-control-policy';
import { builtinNativeCall } from './builtin-native-service';
import { getAgentSessionMeta } from './agent-session-manager';
import { listConversations } from './conversation-manager';
const scopeSchema = z.strictObject({
  kind: z.enum(['agent', 'chat']),
  id: z.uuid()
});
interface AnnotationState {
  revision: string;
  preferences: Record<string, boolean>;
  drafts: Record<string, ConversationAnnotation[]>;
}
function authorize(value: z.infer<typeof scopeSchema>, c: MobileContext) {
  c.assertCurrent();
  if (!c.device.management) throw Error('整机管理未授权');
  if (value.kind === 'chat') {
    if (!listConversations().some(row => row.id === value.id)) throw Error('会话未授权或不存在');
  } else {
    const current = getAgentSessionMeta(value.id);
    if (!current?.workspaceId || !c.device.workspaceIds.includes(current.workspaceId)) throw Error('会话未授权或不存在');
  }
  return value.kind + ':' + value.id;
}
export async function mobileAnnotationRead(raw: unknown, c: MobileContext) {
  const value = scopeSchema.parse(raw),
    scope = authorize(value, c);
  const current = (await builtinNativeCall('annotations.read', {})) as AnnotationState;
  authorize(value, c);
  return {
    revision: current.revision,
    annotations: current.drafts[scope] ?? [],
    preferences: current.preferences
  };
}
export async function mobileAnnotationWrite(raw: unknown, c: MobileContext) {
  const value = scopeSchema.extend({
    revision: z.string(),
    annotations: z.array(z.json()).max(50)
  }).parse(raw);
  const scope = authorize(value, c);
  // 原生写操作自己的 schema 校验来源、数量和长度；不接受手机任意指定草稿 scope。
  await builtinNativeCall('annotations.write', {
    revision: value.revision,
    scope,
    annotations: value.annotations
  }, () => {
    authorize(value, c);
  });
  return mobileAnnotationRead({
    kind: value.kind,
    id: value.id
  }, c);
}
interface QuestionRecord {
  digest: string;
  status: 'pending' | 'done' | 'failed';
  result?: Record<string, unknown>;
}
const recordSchema = z.record(z.string(), z.strictObject({
  digest: z.string(),
  status: z.enum(['pending', 'done', 'failed']),
  result: z.record(z.string(), z.unknown()).optional()
}));
export async function mobileAnnotationQuestion(raw: unknown, c: MobileContext) {
  const value = scopeSchema.extend({
    messageId: z.string().max(200).optional(),
    quote: z.string().min(1).max(200000),
    question: z.string().trim().min(1).max(32000),
    clientMessageId: z.uuid()
  }).parse(raw);
  authorize(value, c);
  const file = join(getConfigDir(), 'mobile-annotation-questions.json');
  const rawLedger = readJsonFileSafe<unknown>(file);
  if (rawLedger == null && existsSync(file)) throw Error('旁问记录损坏，未创建重复会话，请在电脑恢复记录后重试');
  const ledger = recordSchema.parse(rawLedger ?? {}) as Record<string, QuestionRecord>;
  const key = [c.device.id, value.kind, value.id, value.clientMessageId].join(':'),
    digest = createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const previous = ledger[key];
  if (previous) {
    if (previous.digest !== digest) throw Error('同一旁问标识的内容不一致');
    if (previous.status === 'done' && previous.result) return previous.result;
    throw Error('上次旁问状态尚未确认，请先检查会话目录；未重复创建');
  }
  if (Object.keys(ledger).length >= 5000) throw Error('旁问记录已满，请在电脑清理设备操作记录');
  ledger[key] = {
    digest,
    status: 'pending'
  };
  writeJsonFileAtomic(file, ledger);
  const finish = (record: QuestionRecord) => {
    const stored = readJsonFileSafe<unknown>(file);
    if (stored == null && existsSync(file)) throw Error('旁问记录损坏，未创建重复会话，请在电脑恢复记录后重试');
    const latest = recordSchema.parse(stored ?? {}) as Record<string, QuestionRecord>;
    latest[key] = record;
    writeJsonFileAtomic(file, latest);
  };
  try {
    const input = {
      sessionId: value.id,
      messageId: value.messageId,
      quote: value.quote,
      question: value.question
    };
    const service = await import('./annotation-side-chat');
    authorize(value, c);
    let result: Record<string, unknown>;
    if (value.kind === 'agent') {
      const session = await service.createAnnotationSideChat(input, {
        assertCurrent: () => {
          authorize(value, c);
        },
        requireToolApproval: true,
        trackRun:(await import('./remote-service')).trackRemoteChildRun
      });
      result = {
        session
      };
    } else {
      const created = await service.createChatAnnotationSideChat(input);
      try {
        authorize(value, c);
        const {
          mobileChatWrite
        } = await import('./mobile-chat-service');
        await mobileChatWrite({
          action: 'send',
          id: created.conversation.id,
          text: created.message,
          clientMessageId: value.clientMessageId
        }, c);
      } catch (error) {
        (await import('./conversation-manager')).deleteConversation(created.conversation.id);
        throw error;
      }
      result = {
        conversation: created.conversation
      };
    }
    finish({
      digest,
      status: 'done',
      result
    });
    return result;
  } catch (error) {
    finish({
      digest,
      status: 'failed'
    });
    throw error;
  }
}
