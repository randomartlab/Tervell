import { test, expect } from 'bun:test'
import { claudeCodeDialect } from './claude-code.ts'
import { AcpEventMapper } from '../mapper.ts'
test('Given Claude每prompt重置的累加用量 When 归一 Then 是turn而非session累计', () => {
  const events = new AcpEventMapper('r1', claudeCodeDialect).finish({ stopReason: 'end_turn', usage: { inputTokens: 12, outputTokens: 4 } })
  expect(events[0]).toMatchObject({ t: 'usage', usage: { inputTokens: 12, outputTokens: 4, tokenScope: 'turn' } })
})
