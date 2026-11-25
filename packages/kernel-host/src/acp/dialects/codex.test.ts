import { test, expect } from 'bun:test'
import { codexDialect } from './codex.ts'
import { AcpEventMapper } from '../mapper.ts'
test('Given Codex标准contextToken更新 When 归一 Then 不猜测input/output或成本', () => {
  expect(new AcpEventMapper('r1', codexDialect).update({ sessionUpdate: 'usage_update', used: 4, size: 100 })[0]).toMatchObject({ t: 'usage', usage: { contextTokens: 4, contextWindow: 100 } })
  expect(new AcpEventMapper('r2', codexDialect).finish({ stopReason: 'end_turn', usage: { inputTokens: 4 } }).some((event) => event.t === 'usage')).toBe(false)
})
