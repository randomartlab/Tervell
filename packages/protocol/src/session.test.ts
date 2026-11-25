import { describe, expect, test } from 'bun:test'
import {
  ApprovalSchema,
  KernelAuthConfigSchema,
  KernelIdSchema,
  MessageSchema,
  SCHEMA_VERSION,
  SessionSchema,
  ToolCallSchema,
  TurnSchema,
} from './index.ts'

const now = 1_700_000_000_000

describe('PR-01 基础类型', () => {
  test('Given 最小会话 When 解析 Then 补齐默认值', () => {
    const s = SessionSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      id: 'sess-1',
      title: '新会话',
      kernelId: 'claude',
      createdAt: now,
      updatedAt: now,
    })
    expect(s.permissionMode).toBe('ask')
    expect(s.cwdMode).toBe('project')
    expect(s.attachedFiles).toEqual([])
    expect(s.flags).toEqual({})
  })

  test('Given 旧版 schemaVersion=1 When 解析 Then 拒绝（迁移由 ST-01 负责）', () => {
    const r = SessionSchema.safeParse({ schemaVersion: 1, id: 's', title: 't', kernelId: 'claude', createdAt: now, updatedAt: now })
    expect(r.success).toBe(false)
  })

  test('Given 未知权限档 When 解析 Then 拒绝', () => {
    const r = SessionSchema.safeParse({
      schemaVersion: SCHEMA_VERSION, id: 's', title: 't', kernelId: 'claude',
      permissionMode: 'yolo', createdAt: now, updatedAt: now,
    })
    expect(r.success).toBe(false)
  })

  test('Given 内核 id 含大写或空格 When 解析 Then 拒绝；自定义小写 id 接受', () => {
    expect(KernelIdSchema.safeParse('Claude Code').success).toBe(false)
    expect(KernelIdSchema.safeParse('my-custom-kernel').success).toBe(true)
  })

  test('Given 多段内容消息 When 解析 Then 按判别式区分', () => {
    const m = MessageSchema.parse({
      id: 'm1', role: 'assistant', createdAt: now,
      content: [{ type: 'text', text: 'hi' }, { type: 'tool-result', toolUseId: 't1', content: 'ok' }],
    })
    expect(m.content.map((c) => c.type)).toEqual(['text', 'tool-result'])
    expect(MessageSchema.safeParse({ id: 'm2', role: 'assistant', createdAt: now, content: [{ type: 'video' }] }).success).toBe(false)
  })

  test('Given 工具调用与批准 When 组成轮次 Then 可解析', () => {
    const call = ToolCallSchema.parse({ id: 't1', kind: 'edit', name: 'write_file', status: 'pending' })
    const approval = ApprovalSchema.parse({
      id: 'a1', kind: 'edit', toolCallId: call.id, request: '写入 src/a.ts', scope: 'session', outcome: 'approved', createdAt: now,
    })
    const turn = TurnSchema.parse({ id: 'turn-1', seq: 1, userMessageIndex: 0, messages: [], toolCalls: [call], approvals: [approval], createdAt: now })
    expect(turn.approvals?.[0]?.toolCallId).toBe('t1')
  })
})

describe('凭据配置（开放接管）', () => {
  test('Given 未指定来源 When 解析 Then 默认 cli-native（不接管 CLI 自身认证）', () => {
    expect(KernelAuthConfigSchema.parse({ kernelId: 'codex' }).source).toBe('cli-native')
  })

  test('Given gateway 无 baseUrl When 解析 Then 拒绝', () => {
    expect(KernelAuthConfigSchema.safeParse({ kernelId: 'claude', source: 'gateway', gateway: { baseUrls: {} } }).success).toBe(false)
  })

  test('Given magpie 网关 When 解析 Then 接受', () => {
    const r = KernelAuthConfigSchema.safeParse({
      kernelId: 'claude', source: 'gateway', gateway: { baseUrls: { anthropic: 'http://127.0.0.1:3425' } },
    })
    expect(r.success).toBe(true)
  })

  test('Given proma 来源缺 secretRef 或 wire When 解析 Then 拒绝', () => {
    expect(KernelAuthConfigSchema.safeParse({ kernelId: 'kimi', source: 'proma', wire: 'openai' }).success).toBe(false)
    expect(KernelAuthConfigSchema.safeParse({ kernelId: 'kimi', source: 'proma', secretRef: 'kimi.key' }).success).toBe(false)
  })
})
