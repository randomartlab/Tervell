import { z } from 'zod'
import { SCHEMA_VERSION, SessionSchema, TurnSchema, type Session, type Turn } from '@proma/protocol'

/**
 * 标准回放 Trace 数据结构
 *
 * 每条 trace 事件代表会话中的一个离散事件（turn 完成、消息 delta、工具调用等）。
 * 用于：
 * - 单元/集成测试（固定输入，验证业务逻辑）
 * - 性能基准与回归检测
 * - 错误场景模拟
 */

export const TraceEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('session.init'),
    sessionId: z.string(),
    kernelId: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('turn.complete'),
    turnId: z.string(),
    turn: TurnSchema,
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('message.delta'),
    turnId: z.string(),
    role: z.enum(['user', 'assistant']),
    messageId: z.string(),
    delta: z.string(),
    index: z.number().int().nonnegative(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('tool.call'),
    turnId: z.string(),
    toolCallId: z.string(),
    kind: z.string(),
    name: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('tool.result'),
    turnId: z.string(),
    toolCallId: z.string(),
    result: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('approval.request'),
    turnId: z.string(),
    approvalId: z.string(),
    kind: z.string(),
    request: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('error'),
    turnId: z.string(),
    message: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('done'),
    turnId: z.string(),
    stopReason: z.enum(['stop', 'max-tokens', 'tool-use', 'error']),
    timestamp: z.number(),
  }),
])

export type TraceEvent = z.infer<typeof TraceEventSchema>

export const TraceSchema = z.array(TraceEventSchema)
export type Trace = TraceEvent[]

/** 由 trace 生成一个最小有效 Session fixture，复用 protocol 的唯一 schema。 */
export function fixtureSession(sessionId: string, kernelId: string, timestamp: number): Session {
  return SessionSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    id: sessionId,
    title: 'Replay fixture',
    kernelId,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

/** 测试用有效 Turn，复用 protocol schema；消息可由调用方覆盖。 */
export function fixtureTurn(turnId: string, timestamp: number, messages: Turn['messages'] = []): Turn {
  return TurnSchema.parse({
    id: turnId,
    seq: 1,
    userMessageIndex: 0,
    messages,
    createdAt: timestamp,
  })
}

// ── Fixtures ──

/**
 * 黄金 fixture 集合：标准场景的重用 trace 数据
 * 每个 fixture 是一个完整会话序列的重放
 */

export const FIXTURES = {
  /** 简单单 turn（用户问/AI 答/结束） */
  simpleSingleTurn(): Trace {
    const now = 1_700_000_000_000
    return [
      { type: 'session.init', sessionId: 'sess-1', kernelId: 'claude', timestamp: now },
      { type: 'message.delta', turnId: 'turn-1', role: 'user', messageId: 'user-1', delta: 'Hello', index: 0, timestamp: now + 10 },
      { type: 'message.delta', turnId: 'turn-1', role: 'assistant', messageId: 'assistant-1', delta: 'Hi! ', index: 0, timestamp: now + 50 },
      { type: 'message.delta', turnId: 'turn-1', role: 'assistant', messageId: 'assistant-1', delta: 'How can I help?', index: 0, timestamp: now + 100 },
      { type: 'done', turnId: 'turn-1', stopReason: 'stop', timestamp: now + 150 },
    ]
  },

  /** 多 turn（用户 Q1 → A1 → 用户 Q2 → A2） */
  multiTurn(): Trace {
    const now = 1_700_001_000_000
    return [
      { type: 'session.init', sessionId: 'sess-2', kernelId: 'omp', timestamp: now },
      { type: 'message.delta', turnId: 'turn-1', role: 'user', messageId: 'user-1', delta: 'Write a function', index: 0, timestamp: now + 10 },
      { type: 'message.delta', turnId: 'turn-1', role: 'assistant', messageId: 'assistant-1', delta: 'function hello() { ', index: 0, timestamp: now + 50 },
      { type: 'message.delta', turnId: 'turn-1', role: 'assistant', messageId: 'assistant-1', delta: 'return "world"; }', index: 0, timestamp: now + 100 },
      { type: 'done', turnId: 'turn-1', stopReason: 'stop', timestamp: now + 150 },
      { type: 'message.delta', turnId: 'turn-2', role: 'user', messageId: 'user-1', delta: 'Add tests', index: 0, timestamp: now + 200 },
      { type: 'message.delta', turnId: 'turn-2', role: 'assistant', messageId: 'assistant-2', delta: "it('should work', () => { ", index: 0, timestamp: now + 250 },
      { type: 'message.delta', turnId: 'turn-2', role: 'assistant', messageId: 'assistant-2', delta: "expect(hello()).toBe('world'); })", index: 0, timestamp: now + 300 },
      { type: 'done', turnId: 'turn-2', stopReason: 'stop', timestamp: now + 350 },
    ]
  },

  /** 工具调用场景（read + 结果） */
  withToolCall(): Trace {
    const now = 1_700_002_000_000
    return [
      { type: 'session.init', sessionId: 'sess-3', kernelId: 'kimi', timestamp: now },
      { type: 'message.delta', turnId: 'turn-1', role: 'user', messageId: 'user-1', delta: 'Read package.json', index: 0, timestamp: now + 10 },
      { type: 'tool.call', turnId: 'turn-1', toolCallId: 'tc-1', kind: 'read', name: 'read_file', timestamp: now + 50 },
      { type: 'tool.result', turnId: 'turn-1', toolCallId: 'tc-1', result: '{ "name": "proma" }', timestamp: now + 100 },
      { type: 'message.delta', turnId: 'turn-1', role: 'assistant', messageId: 'assistant-1', delta: 'The package name is proma', index: 0, timestamp: now + 150 },
      { type: 'done', turnId: 'turn-1', stopReason: 'tool-use', timestamp: now + 200 },
    ]
  },

  /** 错误场景（连接失败） */
  connectionError(): Trace {
    const now = 1_700_003_000_000
    return [
      { type: 'session.init', sessionId: 'sess-4', kernelId: 'gemini', timestamp: now },
      { type: 'message.delta', turnId: 'turn-1', role: 'user', messageId: 'user-1', delta: 'Test', index: 0, timestamp: now + 10 },
      { type: 'error', turnId: 'turn-1', message: 'ECONNREFUSED: Could not connect to API', timestamp: now + 50 },
    ]
  },

  /** 权限场景（需要批准） */
  withApproval(): Trace {
    const now = 1_700_004_000_000
    return [
      { type: 'session.init', sessionId: 'sess-5', kernelId: 'claude', timestamp: now },
      { type: 'message.delta', turnId: 'turn-1', role: 'user', messageId: 'user-1', delta: 'Delete src/old.ts', index: 0, timestamp: now + 10 },
      { type: 'approval.request', turnId: 'turn-1', approvalId: 'appr-1', kind: 'delete', request: 'Delete src/old.ts', timestamp: now + 50 },
      { type: 'message.delta', turnId: 'turn-1', role: 'assistant', messageId: 'assistant-1', delta: 'Deleted', index: 0, timestamp: now + 100 },
      { type: 'done', turnId: 'turn-1', stopReason: 'stop', timestamp: now + 150 },
    ]
  },
}

export function fixture(name: keyof typeof FIXTURES): Trace {
  return FIXTURES[name]()
}
