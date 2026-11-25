import { isAbsolute, join, normalize, parse } from 'node:path'

export interface LocalProfile {
  root: string
  configDirectory: string
  chromiumDirectory: string
}

/** 显式本机配置空间，供隔离验收或并行实例使用；不读取或迁移默认目录。 */
export function resolveLocalProfile(input: string | undefined): LocalProfile | undefined {
  if (input === undefined) return undefined
  if (!input || !isAbsolute(input) || input.includes('\0')) throw new Error('本机配置空间必须是有效绝对路径。')
  const root = normalize(input)
  if (root === parse(root).root) throw new Error('本机配置空间不能是文件系统根目录。')
  return { root, configDirectory: join(root, 'config'), chromiumDirectory: join(root, 'chromium') }
}
