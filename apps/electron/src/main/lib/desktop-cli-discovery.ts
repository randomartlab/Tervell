import { accessSync, constants, statSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import { delimiter, isAbsolute, join } from 'node:path'

export interface CommandCheck { path?: string; version?: string; diagnostic?: string }
export function executableCandidates(command: string, path: string): string[] {
  const expanded = command.startsWith('~/') ? join(homedir(), command.slice(2)) : command
  const names = process.platform === 'win32' && !/\.[a-z]+$/i.test(expanded)
    ? [expanded, ...['.exe', '.cmd', '.bat'].map(ext => expanded + ext)] : [expanded]
  return [...new Set((isAbsolute(expanded) ? names : path.split(delimiter).filter(isAbsolute).flatMap(dir => names.map(name => join(dir, name)))))]
    .filter(file => { try { accessSync(file, constants.X_OK); return statSync(file).isFile() } catch { return false } })
}
function output(file: string, args: string[], env: NodeJS.ProcessEnv, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => execFile(file, args, { env, timeout, killSignal: 'SIGKILL', maxBuffer: 65536, windowsHide: true }, (error, stdout) => error ? reject(error) : resolve(stdout)))
}
/** 只获取 PATH，避免把登录 shell 的密钥和调试输出交给 renderer。 */
export async function loginShellPath(base: string, timeout = 3000): Promise<{ path: string; warning?: string }> {
  if (process.platform === 'win32') return { path: base }
  const shell = process.env.SHELL?.startsWith('/') ? process.env.SHELL : '/bin/zsh'
  try {
    const marker = `TERVELL_PATH_${Date.now()}_`
    const text = await output(shell, ['-ilc', `printf '\\n${marker}%s\\n' "$PATH"`], process.env, timeout)
    const path = text.split('\n').find(line => line.startsWith(marker))?.slice(marker.length)
    if (!path) throw new Error('PATH 未返回')
    return { path: [...new Set([...path.split(delimiter), ...base.split(delimiter)].filter(isAbsolute))].join(delimiter) }
  } catch { return { path: base, warning: '登录环境读取超时或失败；已使用已知安装位置，稍后自动重试。' } }
}
export async function checkCommand(command: string, path: string, probe: boolean, timeout = 2000, env: NodeJS.ProcessEnv = process.env): Promise<CommandCheck> {
  const candidates = executableCandidates(command, path)
  for (const file of candidates) {
    if (!probe) return { path: file }
    try {
      const text = (await output(file, ['--version'], { ...env, PATH: path }, timeout)).replace(/\x1b\[[0-9;]*m/g, '').trim()
      return { path: file, version: text.split('\n')[0]?.slice(0, 160) || undefined }
    } catch { /* 失效的 shim 不遮挡后面的实际可执行文件。 */ }
  }
  return { diagnostic: candidates.length ? '找到命令，但版本检查未通过；可点击修复安装。' : '尚未安装' }
}
/** 并发有界，避免一个慢 CLI 卡住其余结果。 */
export async function mapLimited<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = new Array(items.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) { const index = cursor++; if (index >= items.length) return; result[index] = await work(items[index]!) }
  }))
  return result
}
