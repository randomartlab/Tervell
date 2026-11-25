import {normalizeActivityDisplay} from '@proma/shared';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { getConfigDir } from './config-paths';
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file';
const source = z.object({
  kind: z.enum(['chat', 'file', 'markdown', 'diff', 'terminal']),
  label: z.string().max(4096),
  sessionId: z.string().max(200),
  messageId: z.string().max(200).optional(),
  path: z.string().max(4096).optional(),
  start: z.number().int().nonnegative().optional(),
  end: z.number().int().nonnegative().optional(),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
  side: z.enum(['old', 'new']).optional(),
  digest: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  terminalId: z.string().max(200).optional(),
  buffer: z.enum(['normal', 'alternate']).optional(),
  cols: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional()
});
const annotation = z.object({
  id: z.uuid(),
  quote: z.string().max(200000),
  comment: z.string().max(32000),
  source
});
const preferences = z.object({
  chat: z.boolean().default(true),
  file: z.boolean().default(true),
  markdown: z.boolean().default(true),
  diff: z.boolean().default(true),
  terminal: z.boolean().default(true)
});
const fileSchema = z.object({
  version: z.literal(1),
  preferences: preferences.default({
    chat: true,
    file: true,
    markdown: true,
    diff: true,
    terminal: true
  }),
  drafts: z.record(z.string().max(200), z.array(annotation).max(50)).default({})
});
function state() {
  const file = join(getConfigDir(), 'builtin-annotations.json'),
    raw = readJsonFileSafe<unknown>(file),
    value = fileSchema.parse(raw ?? (existsSync(file) ? (() => {
      throw Error('批注文件损坏，已保留原文件；请先恢复文件再保存');
    })() : {
      version: 1
    }));
  return {
    file,
    value,
    revision: createHash('sha256').update(JSON.stringify(value)).digest('hex')
  };
}
let changes: Promise<unknown> = Promise.resolve();
export function builtinNativeCall(operation: string, input: unknown, beforeWrite?:()=>void): Promise<unknown> {
  if (operation !== 'annotations.write') return call(operation, input);
  const run = changes.catch(() => {}).then(() => {beforeWrite?.();return call(operation, input);});
  changes = run;
  return run;
}
async function call(operation: string, input: unknown): Promise<unknown> {
  if(operation==='activity.translation-models')return (await import('./reasoning-translation')).reasoningTranslationModels();
  if(operation==='activity.translate')return (await import('./reasoning-translation')).startReasoningTranslation(input);
  if(operation==='activity.translation-status')return (await import('./reasoning-translation')).readReasoningTranslation(input);
  if(operation.startsWith('history.'))return (await import('./history-context')).historyContextCall(operation,input);
  if(operation==='export.choose-directory'){const {dialog,BrowserWindow}=await import('electron');const options={title:'选择会话导出文件夹',properties:['openDirectory','createDirectory'] as Array<'openDirectory'|'createDirectory'>};const owner=BrowserWindow.getFocusedWindow();const result=await (owner?dialog.showOpenDialog(owner,options):dialog.showOpenDialog(options));return result.canceled?null:result.filePaths[0]??null;}
  if(operation==='activity.read')return normalizeActivityDisplay(readJsonFileSafe(join(getConfigDir(),'activity-display.json')));
  if(operation==='activity.write'){const value=z.object({reasoning:z.enum(['expanded','balanced','collapsed']),operations:z.enum(['expanded','balanced','collapsed']),chineseReasoning:z.boolean().optional(),translationModel:z.object({channelId:z.string().max(512),modelId:z.string().max(512)}).optional()}).strict().parse(input);writeJsonFileAtomic(join(getConfigDir(),'activity-display.json'),value);return value;}
  if (operation === 'annotations.side-chat') return (await import('./annotation-side-chat')).createAnnotationSideChat(input);
  if (operation === 'annotations.chat-side-chat') return (await import('./annotation-side-chat')).createChatAnnotationSideChat(input);
  if (operation === 'annotations.read') {
    const {
      value,
      revision
    } = state();
    return {
      ...value,
      revision
    };
  }
  if (operation === 'annotations.write') {
    const request = z.object({
        revision: z.string(),
        scope: z.string().max(200).optional(),
        annotations: z.array(annotation).max(50).optional(),
        preferences: preferences.optional()
      }).parse(input),
      current = state();
    if (request.revision !== current.revision) throw Error('批注已在其他窗口变化，请刷新后重试；未覆盖草稿');
    const next = structuredClone(current.value);
    if (request.annotations && !request.scope) throw Error('批注缺少接收会话');
    if (request.scope && request.annotations) {
      const scope = /^(agent|chat):([a-f0-9-]{36})$/.exec(request.scope);
      if (!scope) throw Error('接收会话无效');
      const exists = scope[1] === 'agent' ? (await import('./agent-session-manager')).getAgentSessionMeta(scope[2]!) : (await import('./conversation-manager')).listConversations().find(c => c.id === scope[2]);
      if (!exists) throw Error('接收会话已移除；批注内容保留');
      if (request.annotations.length) next.drafts[request.scope] = request.annotations;else delete next.drafts[request.scope];
    }
    if (request.preferences) next.preferences = request.preferences;
    if (Object.keys(next.drafts).length > 1000 || Buffer.byteLength(JSON.stringify(next)) > 8_000_000) throw Error('批注草稿存储已满，请先发送或移除旧草稿');
    writeJsonFileAtomic(current.file, next);
    return {
      ...next,
      revision: state().revision
    };
  }
  if (operation.startsWith('direct.')) return (await import('./native-direct-service')).nativeDirectCall(operation, input);
  throw Error('未知内置功能操作：' + operation);
}
