import { record } from './types.ts'
import type { AcpDialect } from './types.ts'
export const geminiCliDialect: AcpDialect = {
  id: 'gemini-cli', restartsStream: (update) => record(record(update)._meta).reset === true && record(record(update)._meta).retry === true, promptUsageScope: 'turn',
  sources: ['google-gemini/gemini-cli/main/packages/cli/src/acp/acpSession.ts:buildPromptResponse'],
}
