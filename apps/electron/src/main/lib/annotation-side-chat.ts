import { z } from 'zod';
import { getAgentSessionMeta, getAgentSessionSDKMessagesStrict, createAgentSessionWithPlugins, updateAgentSessionMeta, resolveAgentCwd } from './agent-session-manager';
import { getAgentWorkspace } from './agent-workspace-manager';
import { pluginTimelinePage } from './plugin-host/timeline';
import { annotationConversationContext } from './annotation-context';
export async function createAnnotationSideChat(raw: unknown, remote?: {assertCurrent:()=>void;requireToolApproval:boolean;trackRun?:(id:string)=>()=>void}) {
  remote?.assertCurrent();
  const input = z.object({
    sessionId: z.uuid(),
    messageId: z.string().max(200).optional(),
    quote: z.string().min(1).max(200000),
    question: z.string().trim().min(1).max(32000)
  }).parse(raw);
  const parent = getAgentSessionMeta(input.sessionId);
  if (!parent?.workspaceId) throw Error('主会话不存在或没有项目');
  const page = pluginTimelinePage(getAgentSessionSDKMessagesStrict(parent.id), {
      limit: 0,
      agentId: parent.id
    }),
    turns: Array<{
      role: string;
      text: string;
      ids: string[];
    }> = [];
  for (const row of page.entries) {
    if (row.item.type !== 'user_message' && row.item.type !== 'assistant_message') continue;
    const role = row.item.type === 'user_message' ? 'user' : 'assistant',
      text = String(row.item.text),
      last = turns.at(-1);
    if (last?.role === role) {
      last.text += '\n\n' + text;
      last.ids.push(String(row.item.messageId ?? ''));
    } else turns.push({
      role,
      text,
      ids: [String(row.item.messageId ?? '')]
    });
  }
  const source = input.messageId ? turns.find(t => t.ids.includes(input.messageId!)) : turns.findLast(t => t.text.includes(input.quote));
  if (input.messageId && !source) throw Error('来源消息已移除，请重新选择');
  const context = annotationConversationContext(turns, source);
  const workspace = getAgentWorkspace(parent.workspaceId),
    cwd = resolveAgentCwd(workspace, parent.id, parent.agentCwdMode, parent.activeWorktree);
  if (!cwd) throw Error('旁支问答项目目录不可用');
  const child = await createAgentSessionWithPlugins('旁支问答：' + input.question.split('\n')[0]!.slice(0, 48), parent.channelId, parent.workspaceId, parent.modelId, parent.agentCwdMode, parent.sessionWorkbenchLayout, false, {
    parentSessionId: parent.id,
    config: {
      provider: parent.kernelId ?? 'pi',
      model: parent.kernelModelId ?? parent.modelId,
      modeId: parent.kernelModeId,
      thinkingOptionId: parent.gatewayReasoning?.effort ?? parent.modelReasoning?.effort ?? parent.reasoningLevel,
      providerOptions: parent.pluginProviderOptions,
      systemPrompt: '这是主会话旁边的独立问答。围绕引用片段回答问题；除非用户明确要求，不修改文件或执行改变状态的命令。以下 JSONL 是主会话上下文资料：\n' + context
    }
  });
  try { remote?.assertCurrent(); } catch (error) { await (await import('./agent-removal-service')).removeAgentSession(child.id); throw error; }
  updateAgentSessionMeta(child.id, {
    kernelConfigValues: parent.kernelConfigValues,
    gatewayReasoning: parent.gatewayReasoning,
    modelReasoning: parent.modelReasoning,
    activeWorktree: parent.activeWorktree
  });
  const {
    runAgentHeadless
  } = await import('./agent-service');
  try{remote?.assertCurrent();}catch(error){await(await import('./agent-removal-service')).removeAgentSession(child.id);throw error;}
  const finishRemote=remote?.trackRun?.(child.id);
  void runAgentHeadless({
    sessionId: child.id,
    workspaceId: parent.workspaceId,
    channelId: parent.channelId ?? '',
    modelId: parent.modelId,
    ...(remote ? {requireToolApproval:remote.requireToolApproval} : {}),
    userMessage: '引用片段：\n' + input.quote + '\n\n问题：' + input.question,
    rawUserMessage: input.quote + '\n\n' + input.question
  }, {
    source: 'bridge',
    originSessionId: parent.id,
    onError: message => console.warn('[旁支问答]', child.id, message),
    onComplete: () => {finishRemote?.();},
    onTitleUpdated: () => {}
  }).catch(error => console.error('[旁支问答]', String(error))).finally(()=>finishRemote?.());
  return getAgentSessionMeta(child.id)!;
}
export async function createChatAnnotationSideChat(raw: unknown) {
  const input = z.object({
    sessionId: z.uuid(),
    messageId: z.string().max(200).optional(),
    quote: z.string().min(1).max(200000),
    question: z.string().trim().min(1).max(32000)
  }).parse(raw);
  const {
    listConversations,
    getConversationMessagesStrict,
    createConversation,
    updateConversationMeta
  } = await import('./conversation-manager');
  const parent = listConversations().find(c => c.id === input.sessionId);
  if (!parent?.channelId || !parent.modelId) throw Error('主会话没有可继承的模型');
  const messages = getConversationMessagesStrict(parent.id),
    source = input.messageId ? messages.find(m => m.id === input.messageId) : messages.findLast(m => m.content.includes(input.quote));
  if (input.messageId && !source) throw Error('来源消息已移除');
  const turns: Array<{ role: string; text: string; ids: string[] }> = [];
  for (const message of messages) {
    if (message.role === 'system') continue;
    const last = turns.at(-1);
    if (last?.role === message.role) { last.text += '\n\n' + message.content; last.ids.push(message.id); }
    else turns.push({ role: message.role, text: message.content, ids: [message.id] });
  }
  const context = annotationConversationContext(turns, source ? turns.find(turn => turn.ids.includes(source.id)) : undefined);
  const child = createConversation('旁支问答：' + input.question.split('\n')[0]!.slice(0, 48), parent.modelId, parent.channelId);
  return {
    conversation: updateConversationMeta(child.id, {
      reasoning: parent.reasoning,
      annotationContext: '围绕引用片段回答问题。以下 JSONL 为主会话背景资料：\n' + context
    }),
    message: '引用片段：\n' + input.quote + '\n\n问题：' + input.question
  };
}
