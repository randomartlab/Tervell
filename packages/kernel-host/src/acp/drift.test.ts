import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { acpDialect } from './dialects/index.ts'
import { createAcpBaseline, inspectAcpDrift, AcpHealthRegistry } from './drift.ts'
import { AcpTraceSchema } from '@proma/protocol'
const fixture = (name: string) => AcpTraceSchema.parse(JSON.parse(readFileSync(new URL(`./test-fixtures/dialects/${name}.json`, import.meta.url), 'utf8')))
test('Given 真实/脚本证据 When 剧本通过 Then 只有真实证据可标verified', () => {
  for (const [name, evidence] of [['omp-live-tools', 'live'], ['omp-scripted', 'scripted']] as const) {
    const trace = fixture(name), dialect = acpDialect('omp'), baseline = createAcpBaseline(trace, dialect)
    expect(inspectAcpDrift(trace, dialect, baseline)).toMatchObject({ status: evidence === 'live' ? 'verified' : 'unverified', reason: 'matched', evidence })
    expect(inspectAcpDrift(trace, dialect)).toMatchObject({ status: 'unverified', reason: 'missing-baseline' })
  }
})
test('Given 基线 When 篡改原文、终态、版本、序号或剧本 Then 降级且宿主禁止启动', () => {
  const trace = fixture('omp-live-tools'), dialect = acpDialect('omp'), baseline = createAcpBaseline(trace, dialect)
  const tampered = structuredClone(trace); tampered.source += '-tampered'
  expect(inspectAcpDrift(tampered, dialect, baseline).reason).toBe('trace-drift')
  expect(inspectAcpDrift(trace, dialect, baseline, 'omp/99.0.0').reason).toBe('version-drift')
  const malformed = structuredClone(trace); malformed.frames[0]!.seq = 8
  expect(inspectAcpDrift(malformed, dialect, baseline).reason).toBe('invalid-trace')
  expect(inspectAcpDrift(trace, dialect, { ...baseline, scenario: '[]' }).reason).toBe('scenario-failed')
  const registry = new AcpHealthRegistry(); registry.record(inspectAcpDrift(tampered, dialect, baseline))
  expect(() => registry.assertLaunchable(trace.kernelId)).toThrow('降级')
  const copy = registry.get(trace.kernelId); copy.status = 'verified'; expect(registry.get(trace.kernelId).status).toBe('degraded')
  expect(registry.get('missing').status).toBe('unverified')
})

test('Given 已降级状态 When 通过工厂解析 Then 在启动前拒绝', async () => {
  const { resolveDialectKernel } = await import('./dialects/factory.ts')
  const health = new AcpHealthRegistry(); health.record({ kernelId: 'omp', status: 'degraded', reason: 'version-drift' })
  expect(() => resolveDialectKernel({ kernelId: 'omp', cwd: process.cwd(), env: {}, health })).toThrow('降级')
})

test('Given 方言名与内核别名不同 When 对应方言降级 Then 别名不能绕过门禁', async () => {
  const { resolveDialectKernel } = await import('./dialects/factory.ts')
  const health = new AcpHealthRegistry(); health.record({ kernelId: 'claude-code', status: 'degraded', reason: 'scenario-failed' })
  expect(() => resolveDialectKernel({ kernelId: 'claude', cwd: process.cwd(), env: {}, health })).toThrow('降级')
})

test('Given 已登记版本与新探测版本 When 启动 Then 标记version-drift而非带病启动', async () => {
  const { resolveDialectKernel } = await import('./dialects/factory.ts')
  const health = new AcpHealthRegistry(); health.record({ kernelId: 'omp', status: 'verified', reason: 'matched', expectedVersion: '18.19.0', evidence: 'live' })
  expect(() => resolveDialectKernel({ kernelId: 'omp', cwd: process.cwd(), env: {}, version: '19.0.0', health })).toThrow('降级')
  expect(health.get('omp')).toMatchObject({ status: 'degraded', reason: 'version-drift', observedVersion: '19.0.0' })
})

test('Given 同一版本的CLI前缀 When 版本比较 Then 不把格式差异误报升级', () => {
  const health = new AcpHealthRegistry(); health.record({ kernelId: 'omp', status: 'verified', reason: 'matched', expectedVersion: 'omp/18.19.0', evidence: 'live' })
  health.checkVersion('omp', '18.19.0')
  expect(health.get('omp').status).toBe('verified')
})
