import { test, expect } from 'bun:test'
import { ompDialect } from './omp.ts'
test('Given OMP命令真实非零退出码或后台无退出码 When 归一 Then 不伪造成功', () => {
  expect(ompDialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { content: [{ type: 'text', text: '失败' }], details: { exitCode: 7 } } })).toMatchObject({ rawOutput: { stdout: '失败', exitCode: 7 } })
  const background = ompDialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { content: [{ type: 'text', text: '后台启动' }], details: { async: true } } })
  expect(JSON.stringify(background)).not.toContain('exitCode')
})
