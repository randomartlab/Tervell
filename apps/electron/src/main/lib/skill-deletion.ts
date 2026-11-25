import { existsSync, lstatSync } from 'node:fs'
import { join } from 'node:path'
import { rmSyncWithRetry } from './fs-retry'

/** 仅删除项目能力根下的单个技能；符号链接只移除链接，不遍历外部目标。 */
export function deleteManagedSkill(activeRoot: string, inactiveRoot: string, slug: string): void {
  if (!slug || slug === '.' || slug === '..' || /[/\\\0]/.test(slug)) throw new Error('技能标识无效。')
  const targets: string[] = []
  for (const root of [activeRoot, inactiveRoot]) {
    if (!existsSync(root)) continue
    const state = lstatSync(root)
    if (!state.isDirectory() || state.isSymbolicLink()) throw new Error('技能根目录必须是项目内的普通目录。')
    const path = join(root, slug)
    try { lstatSync(path); targets.push(path) }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  }
  if (!targets.length) throw new Error(`Skill 不存在: ${slug}`)
  if (targets.length !== 1) throw new Error('技能存在多个副本，请先检查启用与关闭目录。')
  const target = targets[0]!
  rmSyncWithRetry(target, { recursive: !lstatSync(target).isSymbolicLink(), force: true })
}
