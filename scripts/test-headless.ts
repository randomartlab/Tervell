import { readdirSync } from 'node:fs'
import { join, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

export function headlessTests(roots = ['packages', 'scripts', 'tests']): string[] {
  const files: string[] = []
  const visit = (path: string) => {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      if (['node_modules', 'generated', 'dist'].includes(item.name)) continue
      const name = join(path, item.name)
      if (item.isDirectory()) visit(name)
      else if (/\.test\.[cm]?[jt]sx?$/.test(item.name) && name.split(sep).join('/') !== 'packages/core/src/store/runtime.test.ts') files.push(name.split(sep).join('/'))
    }
  }
  for (const root of roots) visit(root)
  return files.sort()
}
if (import.meta.main) {
  const files = headlessTests()
  console.log(`无桌面验证：${files.length} 个文件；排除 apps/** 和 Electron 原生 SQLite 冒烟`)
  const result = spawnSync(process.execPath, ['test', '--isolate', ...files], { stdio: 'inherit', env: process.env })
  if (result.error) throw result.error
  process.exit(result.status ?? 1)
}
