import { describe, expect, test } from 'bun:test'
import { assert, fixture, replay } from './index.ts'

describe('INF-04 回放引擎', () => {
  test('Given 简单 fixture When 回放 Then 事件计数和 turn 计数正确', async () => {
    const trace = fixture('simpleSingleTurn')
    const result = await replay(trace)

    assert.eventCount(result, 5)
    assert.turnCount(result, 1)
    assert.noErrors(result)
    expect(result.turns).toContain('turn-1')
    expect(result.totalDuration).toBeGreaterThan(0)
  })

  test('Given 多 turn fixture When 回放 Then per-turn 统计独立', async () => {
    const trace = fixture('multiTurn')
    const result = await replay(trace)

    assert.turnCount(result, 2)
    expect(result.perTurnStats['turn-1']?.messageCount).toBe(2)
    expect(result.perTurnStats['turn-2']?.messageCount).toBe(2)
    expect(result.perTurnStats['turn-1']?.stopReason).toBe('stop')
  })

  test('Given 工具调用 fixture When 回放 Then toolCallCount 记录', async () => {
    const trace = fixture('withToolCall')
    const result = await replay(trace)

    assert.turnCount(result, 1)
    expect(result.perTurnStats['turn-1']?.toolCallCount).toBe(1)
    assert.noErrors(result)
  })

  test('Given 错误 fixture When 回放 Then error 被捕获', async () => {
    const trace = fixture('connectionError')
    const result = await replay(trace)

    expect(result.errors).toHaveLength(1)
    assert.hasError(result, 'ECONNREFUSED')
  })

  test('Given 批准 fixture When 回放 Then 结构完整', async () => {
    const trace = fixture('withApproval')
    const result = await replay(trace)

    assert.turnCount(result, 1)
    assert.noErrors(result)
    expect(result.totalEvents).toBe(5)
  })

  test('Given 手工构造 trace When 验证平均耗时 Then 通过', async () => {
    const trace = fixture('simpleSingleTurn')
    const result = await replay(trace)

    // 总耗时 150ms，1 turn → avg 150ms；允许上限 200ms
    assert.avgTurnDuration(result, 200)
  })

  test('Given 空 trace When 回放 Then 结果全零', async () => {
    const result = await replay([])
    expect(result.totalTurns).toBe(0)
    expect(result.errors).toEqual([])
  })
})
