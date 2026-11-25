import { test, expect } from 'bun:test';
import { SessionSync } from '../apps/electron/src/main/lib/session-sync';
import { acceptsChatStreamEvent, restoreChatStream } from '../apps/electron/src/renderer/lib/chat-stream-recovery';
test('Given Agent与Chat同一恢复游标 When 缺口或宿主重启 Then 明确重置且不伪造漏失事件', () => {
  const service = new SessionSync(2, () => 1), initial = service.read();
  service.changed('agent', 'a'); service.changed('chat', 'c');
  expect(service.read(initial.cursor).reset).toBe(false);
  service.changed('agent', 'b'); expect(service.read(initial.cursor).reset).toBe(true);
  expect(service.read({ epoch: 'old', seq: 5 }).reset).toBe(true);
});
test('Given Chat流重载与旧run结束 When 读取主进程快照 Then 原文推理工具保留且不清理新run', () => {
  const service = new SessionSync(), first = service.beginChat('chat', 'model');
  service.chatDelta('chat', first, 'content', '完整回复'); service.chatDelta('chat', first, 'reasoning', '推理');
  service.chatTool('chat', first, { type: 'result', toolCallId: 'tool', toolName: 'read', result: '完成' });
  const page = service.read(); expect(page.chats[0]?.reasoning).toBe('推理'); expect(page.chats[0]?.toolActivities[0]?.result).toBe('完成');
  page.chats[0]!.content = '不能改主进程'; expect(service.read().chats[0]?.content).toBe('完整回复');
  const second = service.beginChat('chat', 'other'); service.finishChat('chat', first); service.chatDelta('chat', first, 'content', '旧内容');
  expect(service.read().chats[0]?.model).toBe('other'); service.finishChat('chat', second); expect(service.read().chats).toHaveLength(0);
});
test('Given 超长活跃回复 When 重载恢复 Then 快照有界且明确标记部分恢复', () => {
  const service = new SessionSync(), run = service.beginChat('long', 'model');
  service.chatDelta('long', run, 'content', 'x'.repeat(1024 * 1024) + '末尾');
  const snapshot = service.read().chats[0]!;
  expect(snapshot.truncated).toBe(true);
  expect(snapshot.content.length).toBe(1024 * 1024);
  expect(snapshot.content.endsWith('末尾')).toBe(true);
});
test('Given 恢复快照与推送乱序 When 重复或旧run片段抵达 Then 正文不重复且新片段不被旧快照覆盖', () => {
  const service = new SessionSync(), generation = service.beginChat('chat', 'model');
  service.chatDelta('chat', generation, 'content', '前半');
  const first = service.read().chats[0]!;
  const restored = restoreChatStream(undefined, first);
  expect(acceptsChatStreamEvent(restored, service.chatPosition('chat', generation)!)).toBe(false);
  service.chatDelta('chat', generation, 'content', '后半');
  const current = restoreChatStream(restored, service.read().chats[0]!);
  expect(current.content).toBe('前半后半');
  expect(restoreChatStream(current, first)).toBe(current);
  expect(acceptsChatStreamEvent(current, { generation: 'old', revision: 99, startedAt: 1 })).toBe(false);
  expect(acceptsChatStreamEvent(current, service.chatPosition('chat', generation)!, true)).toBe(true);
  const completed = { ...current, streaming: false };
  expect(restoreChatStream(completed, service.read().chats[0]!)).toBe(completed);
});
