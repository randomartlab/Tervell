import { readFileSync, readdirSync, writeFileSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { z } from 'zod'
import { acpDialect } from '../packages/kernel-host/src/acp/dialects/index.ts'
import { createAcpBaseline, inspectAcpDrift } from '../packages/kernel-host/src/acp/drift.ts'
import { AcpTraceSchema } from '../packages/protocol/src/index.ts'
const directory = fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/dialects/', import.meta.url))
const path = fileURLToPath(new URL('../packages/kernel-host/src/acp/baselines.json', import.meta.url))
const Baseline = z.strictObject({ kernelId: z.string(), dialectId: z.string(), agentVersion: z.string(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), scenario: z.string(), evidence: z.enum(['scripted', 'live']) })
const fixtures = readdirSync(directory).filter((name) => /(?:-scripted|live-tools)\.json$/.test(name)).sort()
if (process.argv.includes('--write')) {
  const baselines = Object.fromEntries(fixtures.map((name) => {
    const trace = AcpTraceSchema.parse(JSON.parse(readFileSync(join(directory, name), 'utf8')))
    return [name, createAcpBaseline(trace, acpDialect(trace.dialectId ?? trace.kernelId))]
  }))
  writeFileSync(path + '.tmp', JSON.stringify(baselines, null, 2) + '\n'); renameSync(path + '.tmp', path)
  console.log('ACP 漂移基线已生成；请人工审查，不得用于自动接受漂移')
} else {
  const baselines = z.record(z.string(), Baseline).parse(JSON.parse(readFileSync(path, 'utf8')))
  if (JSON.stringify(Object.keys(baselines).sort()) !== JSON.stringify(fixtures)) throw new Error('ACP 基线集合漂移')
  const health = fixtures.map((name) => {
    const trace = AcpTraceSchema.parse(JSON.parse(readFileSync(join(directory, name), 'utf8')))
    const result = inspectAcpDrift(trace, acpDialect(trace.dialectId ?? trace.kernelId), baselines[name])
    if (result.status === 'degraded' || result.reason !== 'matched') throw new Error(`ACP ${name} 已降级：${result.reason}`)
    return { fixture: name, status: result.status, evidence: result.evidence }
  })
  console.log(JSON.stringify({ gate: 'ACP-drift', health, note: 'scripted 保持 unverified；不安装、不启动任何真实 CLI' }, null, 2))
}
