import { expect, test } from 'bun:test'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
const Manifest = z.object({ name: z.string(), version: z.string().optional(), dependencies: z.record(z.string(), z.string()).optional(), devDependencies: z.record(z.string(), z.string()).optional(), peerDependencies: z.record(z.string(), z.string()).optional() })
const Lock = z.object({ workspaces: z.record(z.string(), Manifest), packages: z.record(z.string(), z.array(z.unknown())) })

test('Given 不执行安装的工作区改动 When 比较清单与锁文件 Then 所有版本依赖及workspace引用一致', () => {
  const lock = Lock.parse(Bun.JSON5.parse(readFileSync(new URL('../bun.lock', import.meta.url), 'utf8')))
  const root = fileURLToPath(new URL('../', import.meta.url))
  const paths = ['']
  for (const directory of ['packages', 'apps']) for (const child of readdirSync(join(root, directory), { withFileTypes: true })) {
    const path = `${directory}/${child.name}`
    if (child.isDirectory() && existsSync(join(root, path, 'package.json'))) paths.push(path)
  }
  expect(Object.keys(lock.workspaces).sort()).toEqual([...paths].sort())
  for (const path of paths) {
    const manifest = Manifest.parse(JSON.parse(readFileSync(join(root, path, 'package.json'), 'utf8')))
    const saved = lock.workspaces[path]
    expect(saved?.name).toBe(manifest.name)
    if (path) {
      expect(saved?.version).toBe(manifest.version)
      expect(lock.packages[manifest.name]?.[0]).toBe(`${manifest.name}@workspace:${path}`)
    }
    for (const key of ['dependencies', 'devDependencies', 'peerDependencies'] as const) expect(saved?.[key] ?? {}).toEqual(manifest[key] ?? {})
  }
})
