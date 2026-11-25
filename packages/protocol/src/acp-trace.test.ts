import { test, expect } from 'bun:test'
import { AcpTraceSchema, AcpModelCatalogSchema } from './acp-trace.ts'
const header = { format: 'proma-acp-trace', version: 1, kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'unit' }
test('Given trace序号断裂或来源缺失 When 校验 Then 拒绝', () => {
  expect(AcpTraceSchema.safeParse({ ...header, frames: [{ seq: 2, direction: 'client', message: { jsonrpc: '2.0', method: 'x' } }] }).success).toBe(false)
  expect(AcpTraceSchema.safeParse({ ...header, origin: undefined, frames: [] }).success).toBe(false)
  expect(AcpTraceSchema.safeParse({ ...header, origin: 'vendor-guessed', frames: [] }).success).toBe(false)
  expect(AcpTraceSchema.parse({ ...header, frames: [] }).origin).toBe('scripted')
})
test('Given 重复模型id When 校验 Then 拒绝而非覆盖模型参数', () => {
  expect(AcpModelCatalogSchema.safeParse({ models: [{ id: 'x', name: 'A' }, { id: 'x', name: 'B' }], currentModelId: 'x' }).success).toBe(false)
})
