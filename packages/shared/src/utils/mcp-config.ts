import type { McpServerEntry, WorkspaceMcpConfig } from '../types/agent'

/**
 * Removes one MCP entry without changing the configuration or enablement state
 * of every other server.
 */
export function removeMcpServerFromConfig(
  config: WorkspaceMcpConfig,
  name: string,
): WorkspaceMcpConfig {
  const servers = { ...config.servers }
  delete servers[name]
  return { servers }
}

/** 比较连接配置而非诊断时间戳，拒绝把旧表单静默覆盖到已被其他窗口改过的条目。 */
export function mergeMcpServerEdit(current: WorkspaceMcpConfig, name: string, expected: McpServerEntry, next: McpServerEntry): WorkspaceMcpConfig {
  // 递归稳定化，包含 OAuth scope 等公开元数据，绝不将比较内容写到日志或错误。
  const stable = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
    if (value && typeof value === 'object') return `{${Object.entries(value).filter(([key, item]) => key !== 'lastTestResult' && item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`
    return JSON.stringify(value) ?? 'null'
  }
  const actual = current.servers[name]
  if (!actual || stable(actual) !== stable(expected)) throw new Error('此 MCP 配置已被其他操作修改或删除。请重新读取后再编辑。')
  return { servers: { ...current.servers, [name]: next } }
}
