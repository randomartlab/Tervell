import { expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadSkillsFromDir } from '@earendil-works/pi-coding-agent'
import { buildNewSkillContent, rewriteSkillMarkdown } from '../packages/shared/src/utils/skill-editor.ts'

test('Given 中文技能显示名 When 新建并编辑后由实际Pi加载 Then 调用标识合法且没有名称警告', () => {
  const root = mkdtempSync(join(tmpdir(), 'tervell-skill-contract-'))
  const skill = join(root, 'alpha-review')
  try {
    mkdirSync(skill)
    const original = buildNewSkillContent({ slug: 'alpha-review', name: '项目: 检查 #1', description: '整理项目验收结果', body: '先检查再记录。' })
    for (const content of [original, rewriteSkillMarkdown(original, { name: '检查修订', runtimeName: 'alpha-review' })]) {
      writeFileSync(join(skill, 'SKILL.md'), content)
      const result = loadSkillsFromDir({ dir: root, source: 'alpha-contract' })
      expect(result.skills).toHaveLength(1)
      expect(result.skills[0]?.name).toBe('alpha-review')
      expect(result.diagnostics).toEqual([])
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
