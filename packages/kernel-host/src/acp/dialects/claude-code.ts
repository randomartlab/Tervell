import type { AcpDialect } from './types.ts'
export const claudeCodeDialect: AcpDialect = {
  id: 'claude-code', promptUsageScope: 'turn',
  sources: ['agentclientprotocol/claude-agent-acp@v0.31.4/src/acp-agent.ts:prompt-resets-accumulatedUsage;cross-checked-v0.102.0'],
}
