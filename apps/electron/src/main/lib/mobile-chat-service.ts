import { z } from 'zod';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file';
import { getConfigDir } from './config-paths';
import { listConversations, createConversation, getConversationMessagesStrict, updateConversationMeta, deleteConversation } from './conversation-manager';
import { sessionSync } from './session-sync';
import { mobileTextSlice, MobileResultPages } from './mobile-workspace-data';
import { listChannels } from './channel-manager';
import { refreshRoutingModels, startModelRouting } from './model-routing-service';
import { validateChatReasoning, modelReasoningOptions } from './model-reasoning-service';
import { getSystemPromptConfig } from './system-prompt-manager';
import { getMainWindow } from './main-window-store';
import { sendMessage, stopGeneration } from './chat-service';
import {beginChatAttachment,chatAttachmentChunk,finishChatAttachment,cancelChatAttachment,resolveChatAttachments,readChatAttachment} from './mobile-chat-attachments';
import { getAllToolInfos } from './chat-tool-registry';
import type { MobileContext } from './mobile-control-policy';
const id = z.uuid(),
  channelId = z.string().trim().min(1).max(512),
  modelId = channelId;
export const MobileChatReadSchema = z.discriminatedUnion('action', [z.strictObject({action:z.literal('attachment'),id,messageId:z.uuid(),attachmentId:z.uuid(),offset:z.number().int().min(0).default(0)}),z.strictObject({
  action: z.literal('list')
}), z.strictObject({
  action: z.literal('models')
}), z.strictObject({
  action: z.literal('capabilities'),
  channelId,
  modelId
}), z.strictObject({
  action: z.literal('read'),
  id,
  before: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).default(30)
}), z.strictObject({
  action: z.literal('result'),
  id,
  offset: z.number().int().min(0).default(0)
}), z.strictObject({
  action: z.literal('export'),
  id,
  format: z.enum(['markdown', 'json']),
  offset: z.number().int().min(0).default(0),
  revision: z.string().optional()
})]);
export const MobileChatWriteSchema = z.discriminatedUnion('action', [
 z.strictObject({action:z.literal('attachment.start'),id,filename:z.string().min(1).max(200),mediaType:z.string().max(200),bytes:z.number().int().positive(),digest:z.string().regex(/^[a-f0-9]{64}$/)}),
 z.strictObject({action:z.literal('attachment.chunk'),id,uploadId:z.uuid(),index:z.number().int().min(0),data:z.string().max(65536)}),
 z.strictObject({action:z.literal('attachment.finish'),id,uploadId:z.uuid()}),z.strictObject({action:z.literal('attachment.cancel'),id,uploadId:z.uuid()}),z.strictObject({
  action: z.literal('create'),
  title: z.string().trim().max(200).optional()
}), z.strictObject({
  action: z.literal('stop'),
  id
}), z.strictObject({
  action: z.literal('delete'),
  id
}), z.strictObject({
  action: z.literal('configure'),
  id,
  channelId,
  modelId,
  effort: z.string().max(64).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  contextLength: z.union([z.number().int().min(0).max(10000), z.literal('infinite')]).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional()
}), z.strictObject({
  action: z.literal('send'),
  id,
  text: z.string().trim().max(100000),
  attachmentIds:z.array(z.uuid()).max(30).optional(),
  clientMessageId: z.uuid(),
  enabledToolIds: z.array(z.string().max(200)).max(100).optional()
}), z.strictObject({
  action: z.literal('fork'),
  id,
  messageId: z.uuid()
})]);
const pages = new MobileResultPages();
const running = new Map<string, string>();
const outcomes = new Map<string, string>();
const meta = (id: string) => {
  const value = listConversations().find(c => c.id === id);
  if (!value) throw Error('Chat 对话不存在');
  return value;
};
interface SendRecord {
  digest: string;
  status: string;
  at: number;
}
function ledger() {
  const path = join(getConfigDir(), 'mobile-chat-operations.json'),
    records = readJsonFileSafe<Record<string, SendRecord>>(path);
  if (!records && existsSync(path)) throw Error('手机 Chat 发送记录损坏，请在电脑恢复记录后重试');
  return {
    path,
    records: records ?? {}
  };
}
const check = (context: MobileContext) => {
  context.assertCurrent();
  if (!context.device.management) throw Error('整机管理未授权');
};
/** 读操作可重试，结构化大结果使用设备私有冻结分页，不以摘要替代消息。 */
export async function mobileChatRead(raw: unknown, context: MobileContext): Promise<unknown> {
  check(context);
  const input = MobileChatReadSchema.parse(raw),
    owner = context.device.id;
  if (input.action === 'result') return pages.read(owner, input.id, input.offset);
  let result: unknown;
  if (input.action === 'list') result = {
    conversations: listConversations().map(c => ({
      ...c,
      running: running.has(c.id) || sessionSync.read().chats.some(r => r.id === c.id)
    }))
  };else if (input.action === 'models') {
    let models: Array<{
        id: string;
        name: string;
        efforts?: string[];
      }> = [],
      routingError = '';
    try {
      await startModelRouting(process.env.PATH ?? '');
      models = (await refreshRoutingModels()).models;
    } catch {
      routingError = '全局路由尚未就绪；已启用的直接供应商仍可选择。';
    }
    check(context);
    result = {
      routingError,
      channels: [...listChannels().filter(c => c.enabled && !['openai-codex', 'github-copilot', 'xai'].includes(c.provider)).map(c => ({
        id: c.id,
        name: c.name,
        models: c.models.filter(m => m.enabled).map(m => ({
          id: m.id,
          name: m.name
        }))
      })), {
        id: 'tervell-routing',
        name: '全局模型路由',
        models: models.map(m => ({
          id: m.id,
          name: m.name
        }))
      }],
      tools: getAllToolInfos().map(t => ({
        id: t.meta.id,
        name: t.meta.name,
        enabled: t.enabled,
        available: t.available
      }))
    };
  } else if (input.action === 'capabilities') result = await modelReasoningOptions(input.channelId, input.modelId);else {
    const current = meta(input.id);
    if(input.action==='attachment'){const asset=getConversationMessagesStrict(input.id).find(m=>m.id===input.messageId)?.attachments?.find(a=>a.id===input.attachmentId);if(!asset)throw Error('附件不属于当前电脑对话');return readChatAttachment(input.id,asset,input.offset);}
    if (input.action === 'export') {
      const messages = getConversationMessagesStrict(input.id),
        content = input.format === 'json' ? JSON.stringify({
          conversation: current,
          messages
        }, null, 2) : '# ' + current.title + '\n\n' + messages.map(m => '## ' + (m.role === 'user' ? '用户' : m.role === 'assistant' ? '助手' : '系统') + '\n\n' + (m.reasoning ? '### 推理\n\n' + m.reasoning + '\n\n' : '') + m.content + (m.toolActivities?.length ? '\n\n### 工具\n\n```json\n' + JSON.stringify(m.toolActivities, null, 2) + '\n```' : '') + (m.attachments?.length ? '\n\n### 附件元数据\n\n```json\n' + JSON.stringify(m.attachments, null, 2) + '\n```' : '') + (m.error ? '\n\n错误：' + m.error : '')).join('\n\n');
      return {
        title: current.title,
        ...mobileTextSlice(content, input.offset, input.revision)
      };
    }
    const all = getConversationMessagesStrict(input.id),
      end = input.before === undefined ? all.length : Math.min(input.before, all.length),
      start = Math.max(0, end - input.limit),
      live = sessionSync.read().chats.find(c => c.id === input.id);
    result = {
      conversation: current,
      messages: all.slice(start, end),
      total: all.length,
      before: start,
      hasOlder: start > 0,
      live,
      running: running.has(input.id) || !!live,
      error: outcomes.get(input.id)
    };
  }
  check(context);
  return pages.save(owner, 'chat', result);
}
/** 与桌面共享真实 Chat 执行；先落盘幂等身份，网络超时不会再次启动模型。 */
export async function mobileChatWrite(raw: unknown, context: MobileContext): Promise<unknown> {
  check(context);
  const input = MobileChatWriteSchema.parse(raw);
  if (input.action === 'create') return {
    conversation: createConversation(input.title)
  };
  const current = meta(input.id),
    active = () => running.has(input.id) || sessionSync.read().chats.some(c => c.id === input.id);
  if(input.action==='attachment.start')return beginChatAttachment(context.device.id,input.id,input);
  if(input.action==='attachment.chunk')return chatAttachmentChunk(context.device.id,input.id,{id:input.uploadId,index:input.index,data:input.data});
  if(input.action==='attachment.finish')return finishChatAttachment(context.device.id,input.id,input.uploadId,()=>check(context));
  if(input.action==='attachment.cancel')return cancelChatAttachment(context.device.id,input.id,input.uploadId);
  if (input.action === 'stop') {
    stopGeneration(input.id);
    return {
      stopped: true
    };
  }
  if (input.action === 'delete') {
    if (active()) throw Error('请先停止当前回复');
    deleteConversation(input.id);
    return {
      removed: true
    };
  }
  if (input.action === 'configure') {
    const reasoning = await validateChatReasoning({
      channelId: input.channelId,
      model: input.modelId,
      ...(input.effort ? {
        effort: input.effort
      } : {})
    });
    // 无推理档位时同样校验模型归属，不能把失效模型保存成成功状态。
    await modelReasoningOptions(input.channelId, input.modelId);
    check(context);
    return {
      conversation: updateConversationMeta(input.id, {
        channelId: input.channelId,
        modelId: input.modelId,
        reasoning,
        ...(input.title !== undefined ? {
          title: input.title
        } : {}),
        ...(input.contextLength !== undefined ? {
          contextLength: input.contextLength
        } : {}),
        ...(input.pinned !== undefined ? {
          pinned: input.pinned
        } : {}),
        ...(input.archived !== undefined ? {
          archived: input.archived
        } : {})
      })
    };
  }
  if (input.action === 'fork') {
    const fork = createConversation(current.title + ' · 分叉', current.modelId, current.channelId);
    try {
      const {
        copyConversationThrough
      } = await import('./conversation-manager');
      await copyConversationThrough(input.id, fork.id, input.messageId);
      updateConversationMeta(fork.id, {
        reasoning: current.reasoning,
        annotationContext: current.annotationContext,
        contextLength: current.contextLength
      });
      return {
        conversation: meta(fork.id)
      };
    } catch (error) {
      deleteConversation(fork.id);
      throw error;
    }
  }
  if (!current.channelId || !current.modelId) throw Error('请先选择 Chat 供应商和模型');
  if(!input.text&&!input.attachmentIds?.length)throw Error('请填写消息或添加附件');
  const attachments=resolveChatAttachments(context.device.id,input.id,input.attachmentIds??[]);
  const storage = ledger(),
    key = context.device.id + ':' + input.id + ':' + input.clientMessageId,
    digest = createHash('sha256').update(JSON.stringify({
      text: input.text,
      tools: input.enabledToolIds ?? null,attachments:input.attachmentIds??[]
    })).digest('hex');
  const previous = storage.records[key];
  if (previous) {
    if (previous.digest !== digest) throw Error('同一消息身份的正文或工具选项不一致');
    return {
      accepted: true,
      duplicate: true,
      status: previous.status
    };
  }
  if (active()) throw Error('Chat 正在回复，请稍后再发');
  const window = getMainWindow();
  if (!window) throw Error('电脑界面尚未就绪');
  if (Object.keys(storage.records).length >= 10000) throw Error('发送记录已达上限');
  storage.records[key] = {
    digest,
    status: 'accepted',
    at: Date.now()
  };
  writeJsonFileAtomic(storage.path, storage.records);
  outcomes.delete(input.id);
  const finish = (status: string) => {
    const next = ledger();
    next.records[key] = {
      digest,
      status,
      at: Date.now()
    };
    writeJsonFileAtomic(next.path, next.records);
  };
  const prompts = getSystemPromptConfig(),
    prompt = prompts.prompts.find(p => p.id === prompts.defaultPromptId)?.content;
  running.set(input.id, input.clientMessageId);
  void Promise.resolve().then(() => {
    check(context);
    return sendMessage({
      conversationId: input.id,
      userMessage: input.text,
      messageHistory: getConversationMessagesStrict(input.id),
      channelId: current.channelId!,
      modelId: current.modelId!,
      reasoning: current.reasoning,
      systemMessage: [prompt, current.annotationContext].filter(Boolean).join('\n\n'),
      contextLength: current.contextLength,
      contextDividers: current.contextDividers,
      attachments,
      enabledToolIds: input.enabledToolIds
    }, window.webContents);
  }).then(ok => {
    finish(ok ? 'done' : 'failed');
    if (!ok) outcomes.set(input.id, '电脑未能启动回复，请检查当前供应商连接或授权。');
  }, error => {
    outcomes.set(input.id, '回复未完成，请核对电脑供应商配置与会话记录。');
    console.error('[手机 Chat]', error instanceof Error ? error.message : '发送失败');
    finish('failed');
  }).catch(error => console.error('[手机 Chat 发送记录]', String(error))).finally(() => {
    if (running.get(input.id) === input.clientMessageId) running.delete(input.id);
  });
  return {
    accepted: true
  };
}
