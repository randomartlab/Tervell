import * as React from 'react';
import { useAtomValue, useStore } from 'jotai';
import { X, ExternalLink } from 'lucide-react';
import { chatAnnotationSideMapAtom } from './side-chat';
import { ChatView } from '@/components/chat/ChatView';
import { Button } from '@/components/ui/button';
import { conversationsAtom, currentConversationIdAtom } from '@/atoms/chat-atoms';
import { tabsAtom, activeTabIdAtom, openTab } from '@/atoms/tab-atoms';
export function ChatAnnotationSidePanel({
  parentId
}: {
  parentId: string;
}): React.ReactElement | null {
  const store = useStore(),
    id = useAtomValue(chatAnnotationSideMapAtom).get(parentId);
  if (!id) return null;
  return <aside className="flex h-full w-[min(48vw,720px)] min-w-[320px] flex-col border-l border-border"><header className="flex items-center gap-2 border-b border-border px-3 py-2"><span className="flex-1 text-sm font-medium">旁支问答</span><Button size="icon" variant="ghost" aria-label="在普通对话打开旁支" onClick={() => {
        const conversation = store.get(conversationsAtom).find(c => c.id === id);
        const tabs = openTab(store.get(tabsAtom), {
          type: 'chat',
          sessionId: id,
          title: conversation?.title ?? '旁支问答'
        });
        store.set(tabsAtom, tabs.tabs);
        store.set(activeTabIdAtom, tabs.activeTabId);
        store.set(currentConversationIdAtom, id);
      }}><ExternalLink className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="关闭旁支面板" onClick={() => store.set(chatAnnotationSideMapAtom, all => {
        const next = new Map(all);
        next.delete(parentId);
        return next;
      })}><X className="size-4" /></Button></header><div className="min-h-0 flex-1"><ChatView conversationId={id} /></div></aside>;
}
