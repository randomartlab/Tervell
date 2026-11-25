import { test, expect } from 'bun:test'
import { KernelCapabilitiesSchema } from '@proma/protocol'
import { projectKernel } from './projection.ts'
const cap = (extra: object = {}) => KernelCapabilitiesSchema.parse({ context: { instructionsFile: null }, ...extra })
test('Given ACP 三桥能力 When 实际启用桥接 Then full，关闭桥接不能虚报拦截', () => {
  const capabilities = cap({ tools: { mcp: true }, permission: 'callback', fs: 'client-bridge', terminal: 'client-bridge', usage: { tokens: true, cost: true } })
  expect(projectKernel(capabilities, 'acp', { fs: true, terminal: true })).toMatchObject({ permissionGate: 'full', mcp: 'native', usageDetail: 'token+cost' })
  expect(projectKernel(capabilities, 'acp')).toMatchObject({ permissionGate: 'mcp-only', fsCallback: false, terminalCallback: false })
})
test('Given ACP无MCP/nativeSDK/PTY When 投影 Then 精确降级且不按名称分支', () => {
  expect(projectKernel(cap(), 'acp')).toMatchObject({ mcp: 'none', permissionGate: 'none' })
  expect(projectKernel(cap({ transport: 'in-process', context: { instructionsFile: null, systemPrompt: 'meta' }, tools: { mcp: true }, usage: { tokens: true } }), 'native-sdk')).toMatchObject({ systemPromptInjection: 'native', usageDetail: 'token', fsCallback: false })
  expect(projectKernel(cap({ transport: 'pty', tools: { mcp: true }, usage: { tokens: true, cost: true } }), 'pty')).toMatchObject({ mcp: 'none', usageDetail: 'none', permissionGate: 'none', systemPromptInjection: 'prepend-text' })
  expect(() => projectKernel(cap(), 'native-sdk')).toThrow('传输')
})
