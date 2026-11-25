import { createHash } from 'node:crypto'
import { AcpTraceSchema, KernelHealthSchema } from '@proma/protocol'
import type { AcpTrace, KernelEvent, KernelHealth } from '@proma/protocol'
import { replayAcpTrace } from './replay.ts'
import type { AcpDialect } from './dialects/types.ts'

export interface AcpBaseline { kernelId: string; dialectId: string; agentVersion: string; fingerprint: string; scenario: string; evidence: AcpTrace['origin'] }
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}
function versionKey(value: string): string { return value.replace(/^[a-zA-Z0-9_-]+[ /](?=v?\d)/, '').replace(/^v(?=\d)/, '') }
export function traceFingerprint(raw: unknown): string { return createHash('sha256').update(JSON.stringify(canonical(AcpTraceSchema.parse(raw)))).digest('hex') }
function scenario(runs: KernelEvent[][]): string {
  return JSON.stringify(runs.map((events) => events.filter((event) => event.t !== 'message.delta').map((event) => {
    if (event.t === 'tool.call') return { t: event.t, kind: event.call.kind, status: event.call.status }
    if (event.t === 'tool.update') return { t: event.t, status: event.patch.status }
    if (event.t === 'permission.request') return { t: event.t, kind: event.req.kind, actions: event.req.actions.map((action) => action.behavior) }
    if (event.t === 'done') return { t: event.t, reason: event.reason }
    if (event.t === 'error') return { t: event.t, code: event.err.code }
    return { t: event.t }
  })))
}
function assertScenario(runs: KernelEvent[][]): void {
  if (runs.some((events) => events.some((event) => event.t === 'error') || !events.some((event, index) => index === events.length - 1 && event.t === 'done' && event.reason === 'stop'))) throw new Error('剧本未正常完成')
  if (!runs.some((events) => {
    const calls = events.filter((event) => event.t === 'tool.call')
    return ['read', 'edit', 'execute'].every((kind) => calls.some((event) => event.call.kind === kind && (event.call.status === 'succeeded' || events.some((update) => update.t === 'tool.update' && update.callId === event.call.id && update.patch.status === 'succeeded')))) && events.some((event) => event.t === 'permission.request')
  })) throw new Error('剧本缺少 read/edit/execute/approval')
}
export function createAcpBaseline(raw: unknown, dialect: AcpDialect): AcpBaseline {
  const trace = AcpTraceSchema.parse(raw), runs = replayAcpTrace(trace, dialect)
  assertScenario(runs)
  return { kernelId: trace.kernelId, dialectId: dialect.id, agentVersion: trace.agentVersion, fingerprint: traceFingerprint(trace), scenario: scenario(runs), evidence: trace.origin }
}
/** 证据检查不探测/安装真实CLI；scripted通过仍是unverified，不能冒充真实内核验收。 */
export function inspectAcpDrift(raw: unknown, dialect: AcpDialect, baseline?: AcpBaseline, observedVersion?: string): KernelHealth {
  const parsed = AcpTraceSchema.safeParse(raw)
  const kernelId = parsed.success ? parsed.data.kernelId : dialect.id
  const base = { kernelId, ...(baseline ? { expectedVersion: baseline.agentVersion } : {}), ...(observedVersion ? { observedVersion } : {}) }
  const result = (status: KernelHealth['status'], reason: KernelHealth['reason'], evidence?: AcpTrace['origin'], fingerprint?: string) => KernelHealthSchema.parse({ ...base, status, reason, ...(evidence ? { evidence } : {}), ...(fingerprint ? { fingerprint } : {}) })
  if (!parsed.success) return result('degraded', 'invalid-trace')
  const trace = parsed.data, fingerprint = traceFingerprint(trace)
  if (!baseline) return result('unverified', 'missing-baseline', trace.origin, fingerprint)
  if (versionKey(trace.agentVersion) !== versionKey(baseline.agentVersion) || (observedVersion !== undefined && versionKey(observedVersion) !== versionKey(baseline.agentVersion))) return result('degraded', 'version-drift', trace.origin, fingerprint)
  if (baseline.kernelId !== trace.kernelId || baseline.dialectId !== dialect.id || baseline.evidence !== trace.origin || fingerprint !== baseline.fingerprint) return result('degraded', 'trace-drift', trace.origin, fingerprint)
  try {
    const runs = replayAcpTrace(trace, dialect); assertScenario(runs)
    if (scenario(runs) !== baseline.scenario) return result('degraded', 'scenario-failed', trace.origin, fingerprint)
  } catch { return result('degraded', 'scenario-failed', trace.origin, fingerprint) }
  return result(trace.origin === 'live' ? 'verified' : 'unverified', 'matched', trace.origin, fingerprint)
}
export class AcpHealthRegistry {
  private readonly values = new Map<string, KernelHealth>()
  inspect(raw: unknown, dialect: AcpDialect, baseline?: AcpBaseline, observedVersion?: string): KernelHealth { const health = inspectAcpDrift(raw, dialect, baseline, observedVersion); this.record(health); return health }
  record(health: KernelHealth): void { const parsed = KernelHealthSchema.parse(health); this.values.set(parsed.kernelId, parsed) }
  get(kernelId: string): KernelHealth { return structuredClone(this.values.get(kernelId) ?? { kernelId, status: 'unverified', reason: 'missing-baseline' }) }
  checkVersion(kernelId: string, observedVersion?: string): void {
    const current = this.get(kernelId)
    if (observedVersion && current.expectedVersion && versionKey(observedVersion) !== versionKey(current.expectedVersion)) this.record({ ...current, status: 'degraded', reason: 'version-drift', observedVersion })
  }
  assertLaunchable(kernelId: string): void { if (this.get(kernelId).status === 'degraded') throw new Error('ACP 内核已降级，请重新验证版本与剧本') }
}

export const acpHealth = new AcpHealthRegistry()
