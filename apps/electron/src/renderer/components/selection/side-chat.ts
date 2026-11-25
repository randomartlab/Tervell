import { getDefaultStore } from 'jotai';
import { atom } from 'jotai';
import type { AgentSessionMeta, ConversationMeta } from '@proma/shared';
import { agentSessionsAtom, agentSideTemporaryAgentMapAtom, agentDiffPanelTabAtom, currentSessionSidePanelOpenAtom, getExplorationSidePanelTab } from '@/atoms/agent-atoms';
import { conversationsAtom, chatPendingMessageAtom } from '@/atoms/chat-atoms';
import { toast } from 'sonner';
export const chatAnnotationSideMapAtom = atom(new Map<string, string>());
export async function startAnnotationSideChat(parentId: string, quote: string, messageId?: string, chat = false): Promise<void> {
  window.dispatchEvent(new CustomEvent('tervell-side-chat-request', {
    detail: {
      parentId,
      quote,
      messageId,
      chat
    }
  }));
}
export async function submitAnnotationSideChat(parentId: string, quote: string, question: string, store = getDefaultStore(), messageId?: string, chat = false): Promise<void> {
  try {
    if (chat) {
      const result = (await window.electronAPI.builtinFeatureCall('annotations.chat-side-chat', {
        sessionId: parentId,
        quote,
        question,
        messageId
      })) as {
        conversation: ConversationMeta;
        message: string;
      };
      store.set(conversationsAtom, all => [result.conversation, ...all]);
      store.set(chatAnnotationSideMapAtom, all => new Map(all).set(parentId, result.conversation.id));
      store.set(chatPendingMessageAtom, {
        conversationId: result.conversation.id,
        message: result.message
      });
      return;
    }
    const child = (await window.electronAPI.builtinFeatureCall('annotations.side-chat', {
      sessionId: parentId,
      quote,
      question,
      messageId
    })) as AgentSessionMeta;
    store.set(agentSessionsAtom, all => [child, ...all.filter(s => s.id !== child.id)]);
    store.set(agentSideTemporaryAgentMapAtom, all => new Map(all).set(parentId, [...(all.get(parentId) ?? []), {
      sessionId: child.id,
      sourceMessageId: 'annotation',
      sourceLabel: quote.slice(0, 80)
    }]));
    store.set(agentDiffPanelTabAtom, all => new Map(all).set(parentId, getExplorationSidePanelTab(child.id)));
    store.set(currentSessionSidePanelOpenAtom, true);
  } catch (error) {
    toast.error('旁支问答未能创建', {
      description: String(error)
    });
    throw error;
  }
}
