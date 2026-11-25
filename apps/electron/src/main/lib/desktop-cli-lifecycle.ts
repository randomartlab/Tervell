import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, relative } from 'node:path'

export interface CliLifecycleStep { name: string; version: string; cwd: string; hook: 'preinstall' | 'install' | 'postinstall' }
/** 安装文件先完整落地，再按依赖顺序执行配方显式允许的生命周期，避免根包提前验证原生依赖。 */
export function trustedCliLifecycle(packageRoot: string, trusted: readonly string[]): CliLifecycleStep[] {
  const allowed = new Set(trusted), visited = new Set<string>(), packages = new Map<string, { name: string; version: string; cwd: string; dependencies: string[]; hooks: CliLifecycleStep['hook'][] }>()
  const root = realpathSync(packageRoot)
  const walk = (modules: string): void => {
    if (!existsSync(modules)) return
    for (const item of readdirSync(modules, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue
      if (item.name.startsWith('@')) { walk(join(modules, item.name)); continue }
      const cwd = join(modules, item.name), file = join(cwd, 'package.json')
      if (!existsSync(file)) continue
      const real = realpathSync(cwd); if (visited.has(real)) continue; visited.add(real)
      const manifest = JSON.parse(readFileSync(file, 'utf8')) as { name: string; version: string; scripts?: Record<string, string>; dependencies?: Record<string, string>; optionalDependencies?: Record<string, string> }
      const local = relative(root, real)
      if (local.startsWith('..') || isAbsolute(local)) throw Error('安装依赖链接越过私有安装目录')
      packages.set(real, { name: manifest.name, version: manifest.version, cwd: real, dependencies: Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies }).sort(), hooks: allowed.has(manifest.name) ? (['preinstall', 'install', 'postinstall'] as const).filter(hook => !!manifest.scripts?.[hook]) : [] })
      walk(join(cwd, 'node_modules'))
    }
  }
  walk(join(packageRoot, 'node_modules'))
  const done = new Set<string>(), visiting = new Set<string>(), output: CliLifecycleStep[] = []
  const dependencyPath = (cwd: string, name: string): string | undefined => {
    for (let directory = cwd; ;) {
      const candidate = join(directory, 'node_modules', name)
      if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
      if (directory === root) return undefined
      const parent = dirname(directory), local = relative(root, parent)
      if (parent === directory || local.startsWith('..') || isAbsolute(local)) return undefined
      directory = parent
    }
  }
  const visit = (path: string): void => {
    if (done.has(path) || visiting.has(path)) return
    const pkg = packages.get(path); if (!pkg) return
    visiting.add(path)
    for (const dependency of pkg.dependencies) { const target = dependencyPath(pkg.cwd, dependency); if (target) visit(target) }
    visiting.delete(path); done.add(path)
    for (const hook of pkg.hooks) output.push({ name: pkg.name, version: pkg.version, cwd: pkg.cwd, hook })
  }
  for (const [path, pkg] of packages) if (allowed.has(pkg.name)) visit(path)
  return output
}
