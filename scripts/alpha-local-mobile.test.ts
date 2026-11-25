import { expect, test } from 'bun:test'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file'
import { prepareAlphaLocalMobile } from './prepare-alpha-local-mobile'

const profile = { version: 1, sshHost: 'fixture', tunnel: { server: 'fixture.invalid', port: 443, path: '/fixture_connection_12345', clientId: '361482b2-2483-48e9-b7a4-d65433db7eb4', targetHost: '127.0.0.1', targetPort: 42500 } }

test('Given 本机已有连接 When 显式准备Alpha Then 只复制连接且不继承配对与项目授权', () => {
  const home = mkdtempSync(join(tmpdir(), 'tervell-alpha-mobile-'))
  try {
    mkdirSync(join(home, '.proma-dev'))
    writeJsonFileAtomic(join(home, '.proma-dev/remote-tunnel-private.json'), profile)
    writeJsonFileAtomic(join(home, '.proma-dev/remote.json'), { cipher: 'must-not-migrate' })
    expect(prepareAlphaLocalMobile(home)).toBe('prepared')
    const target = join(home, '.project-workbench-alpha/remote-tunnel-private.json')
    expect(JSON.parse(readFileSync(target, 'utf8'))).toEqual(profile)
    expect(statSync(target).mode & 0o777).toBe(0o600)
    expect(existsSync(join(home, '.project-workbench-alpha/remote.json'))).toBe(false)
    expect(existsSync(join(home, '.project-workbench-alpha/settings.json'))).toBe(false)
  } finally { rmSync(home, { recursive: true, force: true }) }
})

test('Given Alpha已有配置 When 再次准备 Then 保留独立落点而不覆盖', () => {
  const home = mkdtempSync(join(tmpdir(), 'tervell-alpha-mobile-'))
  try {
    mkdirSync(join(home, '.project-workbench-alpha'))
    const target = join(home, '.project-workbench-alpha/remote-tunnel-private.json')
    const existing = { ...profile, sshHost: 'other-host' }
    writeJsonFileAtomic(target, existing)
    expect(prepareAlphaLocalMobile(home)).toBe('existing')
    expect(JSON.parse(readFileSync(target, 'utf8'))).toEqual(existing)
    expect(existsSync(target + '.bak')).toBe(false)
  } finally { rmSync(home, { recursive: true, force: true }) }
})

test('Given 无配置或目标为符号链接 When 准备 Then 拒绝且不修改外部目录', () => {
  const home = mkdtempSync(join(tmpdir(), 'tervell-alpha-mobile-'))
  const outside = mkdtempSync(join(tmpdir(), 'tervell-alpha-external-'))
  try {
    expect(() => prepareAlphaLocalMobile(home)).toThrow('没有现成')
    symlinkSync(outside, join(home, '.project-workbench-alpha'))
    expect(() => prepareAlphaLocalMobile(home)).toThrow('现有配置未修改')
    expect(existsSync(join(outside, 'remote-tunnel-private.json'))).toBe(false)
  } finally { rmSync(home, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }) }
})
