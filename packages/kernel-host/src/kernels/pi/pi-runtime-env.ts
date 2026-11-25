export type AgentRuntimeShellKind = 'git-bash' | 'wsl'

export interface AgentRuntimeEnv {
  env: Record<string, string>
  shellKind?: AgentRuntimeShellKind
  shellPath?: string
  wslCommand?: string
  wslDistro?: string
}


const CASE_INSENSITIVE_MERGE_KEYS = new Set([
  'path',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'no_proxy',
  'proma_cli',
  'claude_code_shell',
  'shell',
  'proma_windows_shell',
  'proma_wsl_distro',
])

export function mergeRuntimeEnv(
  baseEnv: NodeJS.ProcessEnv | Record<string, string | undefined> | undefined,
  overrideEnv: Record<string, string | undefined> | undefined,
): Record<string, string> {
  const merged: Record<string, string> = {}
  const overrideLowerKeys = new Set(Object.keys(overrideEnv ?? {}).map((key) => key.toLowerCase()))

  for (const [key, value] of Object.entries(baseEnv ?? {})) {
    if (value !== undefined) merged[key] = value
  }

  for (const existingKey of Object.keys(merged)) {
    const lowerKey = existingKey.toLowerCase()
    if (overrideLowerKeys.has(lowerKey) && CASE_INSENSITIVE_MERGE_KEYS.has(lowerKey)) {
      delete merged[existingKey]
    }
  }

  for (const [key, value] of Object.entries(overrideEnv ?? {})) {
    if (value === undefined) continue
    merged[key] = value
  }

  return merged
}
