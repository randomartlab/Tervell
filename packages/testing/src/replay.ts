import type { Trace, TraceEvent } from './fixtures.ts'

/**
 * 回放引擎：逐事件重放 trace，收集统计与验证
 *
 * 设计：
 * - 顺序重放（按 timestamp 排序，但此处 fixture 已保证顺序）
 * - 收集 per-turn 统计（消息数、工具数、耗时）
 * - 累积错误日志
 * - 幂等（相同 trace 多次回放结果一致）
 */

export interface ReplaySession {
  trace: Trace
  index: number
  turnStats: Record<string, TurnStat>
  seenMessages: Set<string>
  errors: ReplayError[]
}

export interface TurnStat {
  turnId: string
  messageCount: number
  toolCallCount: number
  startTimestamp: number
  endTimestamp: number
  stopReason?: string
}

export interface ReplayError {
  turnId: string
  type: string
  message: string
  timestamp: number
}

export interface ReplayResult {
  totalEvents: number
  totalTurns: number
  totalDuration: number
  perTurnStats: Record<string, TurnStat>
  errors: ReplayError[]
  turns: string[]
}

export function createReplaySession(trace: Trace): ReplaySession {
  return {
    trace,
    index: 0,
    turnStats: {},
    seenMessages: new Set(),
    errors: [],
  }
}

export function nextEvent(session: ReplaySession): TraceEvent | null {
  if (session.index >= session.trace.length) return null
  return session.trace[session.index++] ?? null
}

export async function replay(trace: Trace): Promise<ReplayResult> {
  const session = createReplaySession(trace)
  let event: TraceEvent | null = null

  while ((event = nextEvent(session))) {
    const { type, timestamp } = event

    switch (type) {
      case 'message.delta': {
        const { turnId } = event
        const stat = session.turnStats[turnId] ?? {
          turnId,
          messageCount: 0,
          toolCallCount: 0,
          startTimestamp: timestamp,
          endTimestamp: timestamp,
        }
        const messageKey = `${turnId}:${event.messageId}`
        if (!session.seenMessages.has(messageKey)) {
          session.seenMessages.add(messageKey)
          stat.messageCount++
        }
        stat.endTimestamp = timestamp
        session.turnStats[turnId] = stat
        break
      }

      case 'tool.call': {
        const { turnId } = event
        const stat = session.turnStats[turnId] ?? {
          turnId,
          messageCount: 0,
          toolCallCount: 0,
          startTimestamp: timestamp,
          endTimestamp: timestamp,
        }
        stat.toolCallCount++
        stat.endTimestamp = timestamp
        session.turnStats[turnId] = stat
        break
      }

      case 'tool.result': {
        const { turnId } = event
        const stat = session.turnStats[turnId]
        if (stat) stat.endTimestamp = timestamp
        break
      }

      case 'done': {
        const { turnId, stopReason } = event
        const stat = session.turnStats[turnId]
        if (stat) {
          stat.stopReason = stopReason
          stat.endTimestamp = timestamp
        }
        break
      }

      case 'error': {
        const { turnId, message } = event
        session.errors.push({ turnId, type: 'KernelError', message, timestamp })
        break
      }
    }
  }

  const turnIds = Object.keys(session.turnStats).sort()
  const minTs = trace[0]?.timestamp ?? 0
  const maxTs = trace[trace.length - 1]?.timestamp ?? 0

  return {
    totalEvents: trace.length,
    totalTurns: turnIds.length,
    totalDuration: maxTs - minTs,
    perTurnStats: session.turnStats,
    errors: session.errors,
    turns: turnIds,
  }
}

// ── Assertions ──

export const assert = {
  eventCount(result: ReplayResult, expected: number, message?: string) {
    if (result.totalEvents !== expected) {
      throw new Error(`${message ?? 'Event count mismatch'}: expected ${expected}, got ${result.totalEvents}`)
    }
  },

  turnCount(result: ReplayResult, expected: number, message?: string) {
    if (result.totalTurns !== expected) {
      throw new Error(`${message ?? 'Turn count mismatch'}: expected ${expected}, got ${result.totalTurns}`)
    }
  },

  noErrors(result: ReplayResult, message?: string) {
    if (result.errors.length > 0) {
      const details = result.errors.map((e) => `  ${e.turnId}: ${e.message}`).join('\n')
      throw new Error(`${message ?? 'Unexpected errors'}:\n${details}`)
    }
  },

  hasError(result: ReplayResult, substring: string, message?: string) {
    if (!result.errors.some((e) => e.message.includes(substring))) {
      throw new Error(`${message ?? `Expected error containing "${substring}"`}, got: ${result.errors.map((e) => e.message).join('; ')}`)
    }
  },

  avgTurnDuration(result: ReplayResult, maxMs: number, message?: string) {
    if (result.totalTurns === 0) return
    const avg = result.totalDuration / result.totalTurns
    if (avg > maxMs) {
      throw new Error(`${message ?? 'Average turn duration exceeded'}: ${avg.toFixed(0)}ms > ${maxMs}ms`)
    }
  },
}
