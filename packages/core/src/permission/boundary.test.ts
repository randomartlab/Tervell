import { test, expect } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, unlinkSync, rmSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { BoundaryAudit } from '@proma/protocol'
import { PathBoundary } from './boundary.ts'

test('Given cwd/附加/worktree When 读取或新增 Then 仅真实路径位于授权根内通过', () => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), 'proma-boundary-')))
  try {
    for (const name of ['cwd', 'extra', 'tree', 'cwd-escape', 'outside']) { mkdirSync(join(dir, name)); writeFileSync(join(dir, name, 'a.txt'), name) }
    const audit: BoundaryAudit[] = []; const boundary = new PathBoundary({ cwd: join(dir, 'cwd'), attachedDirectories: [join(dir, 'extra')], worktrees: [join(dir, 'tree')] }, (event) => audit.push(event))
    expect(boundary.assert('a.txt', 'read')).toBe(join(dir, 'cwd/a.txt'))
    expect(boundary.assert(join(dir, 'extra/a.txt'), 'read')).toBe(join(dir, 'extra/a.txt'))
    expect(boundary.assert(join(dir, 'tree/new/sub/file'), 'write')).toBe(join(dir, 'tree/new/sub/file'))
    for (const path of ['../outside/a.txt', join(dir, 'cwd-escape/a.txt'), 'new/../../outside/created', 'C:\\secret.txt']) expect(() => boundary.assert(path, 'write')).toThrow()
    expect(audit.filter((event) => !event.allowed)).toHaveLength(4)
    expect(() => boundary.assert('missing', 'read')).toThrow()
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
test('Given symlink逃逸/断链/链接被替换 When 每次校验 Then 拒绝并记录', () => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), 'proma-boundary-link-')))
  try {
    mkdirSync(join(dir, 'cwd')); mkdirSync(join(dir, 'outside')); writeFileSync(join(dir, 'outside/secret'), 'secret')
    const logs: BoundaryAudit[] = []; const boundary = new PathBoundary({ cwd: join(dir, 'cwd') }, (event) => logs.push(event))
    symlinkSync(join(dir, 'outside'), join(dir, 'cwd/escape'))
    expect(() => boundary.assert('escape/secret', 'read')).toThrow()
    expect(() => boundary.assert('escape/new/file', 'write')).toThrow()
    symlinkSync(join(dir, 'missing'), join(dir, 'cwd/broken'))
    expect(() => boundary.assert('broken/file', 'write')).toThrow('断裂')
    symlinkSync(join(dir, 'cwd'), join(dir, 'cwd/swap')); expect(boundary.assert('swap/new', 'write')).toBe(join(dir, 'cwd/new'))
    unlinkSync(join(dir, 'cwd/swap')); symlinkSync(join(dir, 'outside'), join(dir, 'cwd/swap'))
    expect(() => boundary.assert('swap/new', 'write')).toThrow()
    expect(logs.filter((event) => !event.allowed)).toHaveLength(4)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('Given 符号链接后跟.. When 校验 Then 拒绝非规范路径避免逻辑化绕过', () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-boundary-dotdot-'))
  try {
    mkdirSync(join(directory, 'cwd')); mkdirSync(join(directory, 'outside')); symlinkSync(join(directory, 'outside'), join(directory, 'cwd/link'))
    const boundary = new PathBoundary({ cwd: join(directory, 'cwd') }, () => {})
    expect(() => boundary.assert('link/../secret', 'write')).toThrow('语法')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
