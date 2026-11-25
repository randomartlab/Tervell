import { expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { deleteManagedSkill } from '../apps/electron/src/main/lib/skill-deletion.ts'

test('Given 启用或关闭的技能 When 删除 Then 两种状态均删除且外部链接目标保留', () => {
  const root = mkdtempSync(join(tmpdir(), 'tervell-skill-delete-'))
  const active = join(root, 'active'), inactive = join(root, 'inactive'), outside = join(root, 'external')
  try {
    for (const path of [active, inactive, outside]) mkdirSync(path)
    for (const dir of [active, inactive]) {
      mkdirSync(join(dir, 'review'))
      writeFileSync(join(dir, 'review/SKILL.md'), 'test')
      deleteManagedSkill(active, inactive, 'review')
      expect(existsSync(join(dir, 'review'))).toBe(false)
    }
    writeFileSync(join(outside, 'keep.txt'), 'keep')
    symlinkSync(outside, join(inactive, 'linked'))
    deleteManagedSkill(active, inactive, 'linked')
    expect(existsSync(join(inactive, 'linked'))).toBe(false)
    expect(existsSync(join(outside, 'keep.txt'))).toBe(true)
    for (const slug of ['../external', '..', '.', '', 'a/b', 'a\\b']) expect(() => deleteManagedSkill(active, inactive, slug)).toThrow('标识')
    for (const dir of [active, inactive]) mkdirSync(join(dir, 'duplicate'))
    expect(() => deleteManagedSkill(active, inactive, 'duplicate')).toThrow('多个副本')
    expect(existsSync(join(active, 'duplicate'))).toBe(true)
    expect(existsSync(join(inactive, 'duplicate'))).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
