import type { AcpDialect } from './types.ts'
import { record, json } from './types.ts'
const normalizeUpdate: AcpDialect['normalizeUpdate'] = (value) => {
  const update = record(value); if (update.sessionUpdate !== 'tool_call_update') return value
  const output = record(update.rawOutput); const metadata = record(output.metadata)
  const stdout = typeof output.output === 'string' ? output.output : typeof metadata.output === 'string' ? metadata.output : undefined
  const exitCode = typeof metadata.exit === 'number' ? metadata.exit : undefined
  if (stdout === undefined && exitCode === undefined) return value
  return json({ ...update, rawOutput: { ...output, ...(output.stdout === undefined && stdout !== undefined ? { stdout } : {}), ...(output.exitCode === undefined && output.exit_code === undefined && exitCode !== undefined ? { exitCode } : {}) } })
}
export const opencode1Dialect: AcpDialect = { id: 'opencode-1', normalizeUpdate, sources: ['anomalyco/opencode@v1.18.31/packages/opencode/src/acp/service.ts', 'orca-src/src/main/acp/acp-dialects/opencode-dialect.ts'] }
export const opencode2Dialect: AcpDialect = { id: 'opencode-2', normalizeUpdate, sources: ['orca-src/src/main/acp/launch/acp-launch-registry.ts:2.0.14-private-child', 'orca-src/src/main/acp/acp-dialects/opencode-dialect.ts'] }
