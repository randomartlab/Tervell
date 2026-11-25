import type { ChatToolActivity } from './chat';
export const SESSION_SYNC_IPC = 'session:sync';
export interface SessionSyncCursor { epoch: string; seq: number }
export interface SessionSyncChange { seq: number; kind: 'agent'|'chat'; id: string; state: 'running'|'changed'|'idle'; at: number }
export interface ChatRunSnapshot { id: string; generation: string; revision: number; content: string; reasoning: string; model: string; startedAt: number; toolActivities: ChatToolActivity[]; truncated: boolean }
export interface SessionSyncPage { cursor: SessionSyncCursor; reset: boolean; changes: SessionSyncChange[]; chats: ChatRunSnapshot[] }
