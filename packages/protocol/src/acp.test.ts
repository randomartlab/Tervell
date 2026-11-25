import { test, expect } from 'bun:test'
import { JsonRpcMessageSchema, AcpInitializeResultSchema, AcpPermissionSchema } from './acp.ts'
for (const message of [
  { jsonrpc: '2.0', method: 'notify', params: {} }, { jsonrpc: '2.0', id: 0, method: 'request', params: [] },
  { jsonrpc: '2.0', id: 'remote', result: null }, { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'bad' } },
]) test('Given 合法JSON-RPC请求/通知/成功/失败 When 校验 Then 接受', () => expect(JsonRpcMessageSchema.safeParse(message).success).toBe(true))
for (const message of [
  { jsonrpc: '2.0', method: 'x', id: null }, { jsonrpc: '2.0', method: 'x', params: 1 }, { jsonrpc: '2.0', id: 'x' },
  { jsonrpc: '2.0', id: 1, result: null, error: { code: 1, message: 'bad' } }, { jsonrpc: '2.0', id: 1.5, method: 'x' },
]) test('Given 非法JSON-RPC信封 When 校验 Then 拒绝', () => expect(JsonRpcMessageSchema.safeParse(message).success).toBe(false))
test('Given 不支持版本或重复权限选项 When 校验 Then 拒绝', () => {
  expect(AcpInitializeResultSchema.safeParse({ protocolVersion: 2 }).success).toBe(false)
  expect(AcpPermissionSchema.safeParse({ sessionId: 's', toolCall: { toolCallId: 't' }, options: [{ optionId: 'same', name: '允许', kind: 'allow_once' }, { optionId: 'same', name: '拒绝', kind: 'reject_once' }] }).success).toBe(false)
})
