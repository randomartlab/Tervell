import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { AcpTraceSchema } from '../packages/protocol/src/index.ts'
import { acpDialect } from '../packages/kernel-host/src/acp/dialects/index.ts'
import { replayAcpTrace } from '../packages/kernel-host/src/acp/replay.ts'

const directory = fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/dialects/', import.meta.url))
const required = ['claude-code', 'gemini-cli', 'opencode-1', 'opencode-2', 'cursor-agent', 'omp', 'codex']
const passed = new Set<string>()
for (const name of readdirSync(directory).filter((file) => file.endsWith('.json'))) {
  const trace = AcpTraceSchema.parse(JSON.parse(readFileSync(join(directory, name), 'utf8')))
  if (trace.origin !== 'live') continue
  const id = trace.dialectId ?? trace.kernelId
  const runs = replayAcpTrace(trace, acpDialect(id))
  if (runs.some((run) => {
    const kinds = new Set(run.filter((event) => event.t === 'tool.call').map((event) => event.call.kind))
    const final = run.at(-1)
    return ['read', 'edit', 'execute'].every((kind) => kinds.has(kind as 'read' | 'edit' | 'execute')) && run.some((event) => event.t === 'permission.request') && !run.some((event) => event.t === 'error') && final?.t === 'done' && final.reason === 'stop'
  })) passed.add(id)
}
const pending = required.filter((id) => !passed.has(id))
console.log(JSON.stringify({ gate: 'W5-live-cli-scenario', status: pending.length ? 'pending' : 'passed', passed: required.filter((id) => passed.has(id)), pending, note: 'OpenCode包含1.x/2.x；只检查已保存live trace，不安装或启动任何CLI' }, null, 2))
if (pending.length) process.exitCode = 1
