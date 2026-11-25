import type { AcpDialect } from './types.ts'
export const codexDialect: AcpDialect = {
  id: 'codex', sources: ['zed-industries/codex-acp/main/src/thread.rs:EventMsg::TokenCount'],
  // 标准usage_update只报告上下文窗口占用；不把它误算成turn input/output。
}
