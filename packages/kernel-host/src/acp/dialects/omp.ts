import type { AcpDialect } from './types.ts'
import { record, array, json } from './types.ts'
export const ompDialect: AcpDialect = {
  id: 'omp', promptUsageScope: 'turn', sources: ['can1357/oh-my-pi@v18.19.0/packages/coding-agent/src/modes/acp/acp-agent.ts', 'orca-src/src/main/acp/acp-dialects/omp-dialect.ts'],
  normalizeUpdate(value) {
    const update = record(value)
    if (update.sessionUpdate !== 'tool_call_update') return value
    const output = record(update.rawOutput); const details = record(output.details)
    if (!Array.isArray(output.content) || ['stdout', 'stderr', 'exitCode', 'exit_code'].some((key) => output[key] !== undefined)) return value
    const text = array(output.content).map(record).filter((part) => part.type === 'text' && typeof part.text === 'string').map((part) => part.text as string).join('\n')
    if (!text) return value
    // 只提取真实报告字段；后台/服务成功启动不能被推断为exitCode=0。
    const exitCode = typeof details.exitCode === 'number' ? details.exitCode : undefined
    return json({ ...update, rawOutput: { ...output, stdout: text, ...(exitCode === undefined ? {} : { exitCode }) } })
  },
}
