import { existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'

const INVALID_CWD_ERROR = '终端工作目录不存在或不是目录'

/**
 * 普通终端可由用户在目录被移除后再次打开。此时保留可用的终端体验，
 * 而不是将失效的历史 cwd 传给 PTY。
 */
export function resolveTerminalCwd(cwd: string | undefined, fallback = homedir()): string {
  return isDirectory(cwd) ? cwd : fallback
}

/** Agent 终端必须始终在已授权且有效的目录中启动。 */
export function requireTerminalCwd(cwd: string | undefined): string {
  if (!isDirectory(cwd)) throw new Error(INVALID_CWD_ERROR)
  return cwd
}

/** 会话终端初始化早于 Renderer 路径加载时，仍使用所属项目目录，禁止静默落到用户主目录。 */
export function resolveSessionTerminalCwd(cwd: string | undefined, sessionCwd: string | undefined): string {
  return requireTerminalCwd(cwd ?? sessionCwd)
}

function isDirectory(path: string | undefined): path is string {
  if (!path || !existsSync(path)) return false
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}
