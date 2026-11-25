import { useEffect } from 'react';
import { useStore } from 'jotai';
import type { SessionSyncCursor } from '@proma/shared';
import { conversationsAtom, streamingStatesAtom, chatMessageRefreshAtom } from '@/atoms/chat-atoms';
import { agentSessionsAtom, agentMessageRefreshAtom } from '@/atoms/agent-atoms';
import { restoreChatStream } from '@/lib/chat-stream-recovery';

/** IPC是实时通路，统一游标补齐重载/失焦时遗漏的完成通知，不重发任何用户操作。 */
export function useSessionSync(): void {
  const store = useStore();
  useEffect(() => {
    let alive = true, busy = false, cursor: SessionSyncCursor | undefined;
    const sync = async () => {
      if (!alive || busy) return;
      busy = true;
      const before = store.get(streamingStatesAtom);
      try {
        const page = await window.electronAPI.syncSessions(cursor);
        if (!alive) return;
        const agents = new Set(page.changes.filter(c => c.kind === 'agent').map(c => c.id));
        const chats = new Set(page.changes.filter(c => c.kind === 'chat').map(c => c.id));
        if (page.reset || agents.size) {
          const sessions = await window.electronAPI.listAgentSessions();
          if (!alive) return;
          store.set(agentSessionsAtom, sessions);
          if (page.reset) for (const s of sessions) agents.add(s.id);
          store.set(agentMessageRefreshAtom, previous => { const next = new Map(previous); for (const id of agents) next.set(id, (next.get(id) ?? 0) + 1); return next; });
        }
        if (page.reset || chats.size) {
          const conversations = await window.electronAPI.listConversations();
          if (!alive) return;
          store.set(conversationsAtom, conversations);
          if (page.reset) for (const c of conversations) chats.add(c.id);
          store.set(chatMessageRefreshAtom, previous => { const next = new Map(previous); for (const id of chats) next.set(id, (next.get(id) ?? 0) + 1); return next; });
        }
        store.set(streamingStatesAtom, current => {
          const next = new Map(current), active = new Set(page.chats.map(c => c.id));
          for (const snapshot of page.chats) {
            next.set(snapshot.id, restoreChatStream(current.get(snapshot.id), snapshot));
          }
          for (const [id, value] of current) if (value.streaming && value.generation && !active.has(id) && value === before.get(id)) next.set(id, { ...value, streaming: false });
          return next;
        });
        cursor = page.cursor;
      } catch { /* 网络/IPC恢复后继续按同一游标补齐，不清空已经显示的内容。 */ }
      finally { busy = false; }
    };
    void sync();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void sync(); }, 2000);
    const focus = () => { void sync(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [store]);
}
