import { lstatSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { PathBoundaryConfigSchema } from '@proma/protocol'
import type { PathBoundaryConfig, BoundaryAudit } from '@proma/protocol'

function canonical(path: string): string {
  const missing: string[] = []; let cursor = resolve(path)
  for (;;) {
    try {
      lstatSync(cursor) // 断链也不能被当成普通未创建目录。
      return missing.reduceRight((base, segment) => join(base, segment), realpathSync.native(cursor))
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
      // 如果lstat成功但realpath失败，说明是断链；必须拒绝。
      try { if (lstatSync(cursor).isSymbolicLink()) throw new Error('路径包含断裂符号链接') } catch (check) {
        if (!(check instanceof Error) || !('code' in check) || check.code !== 'ENOENT') throw check
      }
      const parent = dirname(cursor)
      if (parent === cursor) throw new Error('路径无法解析')
      missing.push(cursor.slice(parent.length).replace(/^[/\\]/, '')); cursor = parent
    }
  }
}
function within(root: string, path: string): boolean { const rel = relative(root, path); return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/'))) }
/** 配置只接收宿主已授权根；每次操作重新realpath，避免缓存旧symlink目标。 */
export class PathBoundary {
  private readonly roots: string[]
  private readonly cwd: string
  constructor(input: PathBoundaryConfig, private readonly audit: (event: BoundaryAudit) => void) {
    const config = PathBoundaryConfigSchema.parse(input)
    if (![config.cwd, ...config.attachedDirectories, ...config.worktrees].every(isAbsolute)) throw new Error('授权根必须是绝对路径')
    this.cwd = realpathSync.native(config.cwd)
    this.roots = [...new Set([config.cwd, ...config.attachedDirectories, ...config.worktrees].map((root) => {
      const real = realpathSync.native(root); if (!statSync(real).isDirectory()) throw new Error('授权根不是目录'); return real
    }))]
  }
  assert(path: string, operation: 'read' | 'write'): string {
    let target = path
    try {
      if (operation !== 'read' && operation !== 'write') throw new Error('路径操作类型无效')
      if (!path || path.split(/[/\\]/).includes('..') || /[\x00-\x1f\x7f]/.test(path) || (process.platform !== 'win32' && /\\|^[a-zA-Z]:|^\/\//.test(path))) throw new Error('路径为空或包含跨平台不透明语法')
      if (process.platform === 'win32') {
        const tail = path.replace(/^[a-zA-Z]:/, '')
        if (tail.includes(':') || /^[/\\]{2}/.test(path) || path.split(/[/\\]/).some((part) => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) || /[. ]$/.test(part))) throw new Error('Windows设备路径/ADS/UNC/非规范路径禁止访问')
      }
      target = canonical(isAbsolute(path) ? path : resolve(this.cwd, path))
      if (!this.roots.some((root) => within(root, target))) throw new Error('路径越过cwd/附加目录/worktree授权边界')
      if (operation === 'read') statSync(target)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      this.audit({ path: target, operation, allowed: false, reason }); throw new Error(reason)
    }
    this.audit({ path: target, operation, allowed: true, reason: '路径位于授权根内' }); return target
  }
}
