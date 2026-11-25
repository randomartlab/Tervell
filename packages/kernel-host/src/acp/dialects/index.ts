import type { AcpDialect } from './types.ts'
import { claudeCodeDialect } from './claude-code.ts'
import { geminiCliDialect } from './gemini-cli.ts'
import { codexDialect } from './codex.ts'
import { ompDialect } from './omp.ts'
import { opencode1Dialect, opencode2Dialect } from './opencode.ts'
import { cursorAgentDialect } from './cursor-agent.ts'
import {grokDialect} from './grok.ts'
export type { AcpDialect, DialectInteraction } from './types.ts'
export { readSessionCatalog, readCursorCatalog } from './catalog.ts'
export const ACP_DIALECTS: readonly AcpDialect[] = [claudeCodeDialect, geminiCliDialect, opencode1Dialect, opencode2Dialect, cursorAgentDialect, ompDialect, codexDialect,grokDialect]
export function acpDialect(id: string): AcpDialect {
  const dialect = ACP_DIALECTS.find((item) => item.id === id)
  if (!dialect) throw new Error(`未注册ACP方言：${id}`)
  return dialect
}
