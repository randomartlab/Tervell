import { test, expect } from 'bun:test'
import { opencode1Dialect, opencode2Dialect } from './opencode.ts'
for (const dialect of [opencode1Dialect, opencode2Dialect]) test(`Given ${dialect.id}metadata When 归一 Then 保留实际exit并不覆盖共享输出`, () => {
  expect(dialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { metadata: { exit: 9, output: '失败' } } })).toMatchObject({ rawOutput: { exitCode: 9, stdout: '失败' } })
  expect(dialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { exitCode: 5, stdout: '原输出', metadata: { exit: 0, output: '次级' } } })).toMatchObject({ rawOutput: { exitCode: 5, stdout: '原输出' } })
})
