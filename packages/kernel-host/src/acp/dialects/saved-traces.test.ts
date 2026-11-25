import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { AcpTraceSchema } from '@proma/protocol'
import { ACP_DIALECTS, acpDialect } from './index.ts'
import { replayAcpTrace } from '../replay.ts'

for (const dialect of ACP_DIALECTS) test(`Given ${dialect.id}持久化脚本trace When CI回放 Then 明确来源且完整工具剧本成立`, () => {
  const trace = AcpTraceSchema.parse(JSON.parse(readFileSync(fileURLToPath(new URL(`../test-fixtures/dialects/${dialect.id}-scripted.json`, import.meta.url)), 'utf8')))
  expect(trace.origin).toBe('scripted'); expect(trace.source).toContain('not-vendor-recording')
  const runs = replayAcpTrace(trace, dialect)
  expect(runs[0]?.filter((event) => event.t === 'tool.call').map((event) => event.call.kind)).toEqual(['read', 'edit', 'execute'])
  expect(runs[0]?.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
  expect(runs[0]?.some((event) => event.t === 'error')).toBe(false)
})
for (const name of ['omp-live', 'omp-live-tools']) test(`Given ${name}真实18.19.0脱敏录制 When CI离线回放 Then 不启动CLI也能校验终态与usage`, () => {
  const text = readFileSync(fileURLToPath(new URL(`../test-fixtures/dialects/${name}.json`, import.meta.url)), 'utf8')
  const trace = AcpTraceSchema.parse(JSON.parse(text)); expect(trace.origin).toBe('live'); expect(trace.agentVersion).toBe('omp/18.19.0')
  const run = replayAcpTrace(trace, acpDialect('omp'))[0]!
  expect(run.at(-1)).toMatchObject({ t: 'done', reason: 'stop' }); expect(run.some((event) => event.t === 'error')).toBe(false)
  expect(run.find((event) => event.t === 'usage' && event.usage.tokenScope === 'turn')).toMatchObject({ usage: { inputTokens: name.endsWith('tools') ? 4 : 1, outputTokens: name.endsWith('tools') ? 8 : 2 } })
  for (const privateValue of ['offline-fixture', 'OMP回环验证完成', 'fixture.txt', '/Users/', '/private/var/', 'BASH_OK']) expect(text).not.toContain(privateValue)
  if (name.endsWith('tools')) {
    expect(run.filter((event) => event.t === 'tool.call').map((event) => event.call.kind)).toEqual(['read', 'edit', 'execute'])
    expect(run.some((event) => event.t === 'permission.request')).toBe(true)
  }
})
