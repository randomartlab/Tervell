import { expect, test } from 'bun:test'
import { buildNewSkillContent, assertSkillContentUnchanged, parseSkillInlineValue, serializeSkillYamlValue, rewriteSkillMarkdown } from './skill-editor.ts'

test('Given 技能新建表单含YAML特殊字符 When 构建 Then 不把标题注入成额外指令字段', () => {
  const text = buildNewSkillContent({ slug: 'research-notes', name: "读者's 笔记: #1", description: '资料: 整理 # 归档', body: '先核对来源\n再写摘要' })
  expect(text).toContain("name: 'research-notes'")
  expect(text).toContain("display-name: '读者''s 笔记: #1'")
  expect(text).toContain('version: \'1.0.0\'')
  expect(text).toContain('先核对来源\n再写摘要')
  for (const slug of ['../escape', 'UPPERCASE', 'a/b', '', '.', '__proto__', 'a--b', 'valid-']) expect(() => buildNewSkillContent({ slug, name: 'name', description: 'description', body: 'body' })).toThrow()
  expect(() => buildNewSkillContent({ slug: 'valid', name: 'name\nmalicious: true', description: 'desc', body: 'body' })).toThrow()
})
test('Given 技能正文被外部修改 When 保存旧草稿 Then 明确拒绝而非静默覆盖', () => {
  expect(() => assertSkillContentUnchanged('新的正文', '旧正文')).toThrow('草稿已保留')
  expect(() => assertSkillContentUnchanged('相同', '相同')).not.toThrow()
})

test('Given 含引号、冒号和井号的技能元数据 When 保存后重读 Then 显示名称逐字一致', () => {
  for (const value of ["reader's notes: #1", '普通中文名称', 'say "hello"']) expect(parseSkillInlineValue(serializeSkillYamlValue(value))).toBe(value)
})

test('Given 旧技能使用多行description或无frontmatter When 编辑保存 Then 移除旧缩进行且保留其他元数据', () => {
  const source = '---\nname: Old\ndescription: |\n  第一段\n  第二段\nlicense: MIT\nversion: 2\n---\n正文'
  const saved = rewriteSkillMarkdown(source, { description: '新的: 说明', name: '$& name', body: '新正文' })
  expect(saved).toContain("name: '$& name'")
  expect(saved).toContain("description: '新的: 说明'")
  expect(saved).not.toContain('第一段')
  expect(saved).toContain('license: MIT\nversion: 2')
  expect(saved).toEndWith('新正文')
  expect(rewriteSkillMarkdown('原始正文', { name: 'Title' })).toContain("name: 'Title'\n---\n原始正文")
})


test('Given 中文显示名 When 详情保存 Then 调用名保持目录标识且显示名独立保存', () => {
  const source = buildNewSkillContent({ slug: 'alpha-review', name: '项目检查', description: '验收', body: '检查文件' })
  const result = rewriteSkillMarkdown(source, { name: '项目: 检查修订', runtimeName: 'alpha-review' })
  expect(result).toContain("name: 'alpha-review'")
  expect(result).toContain("display-name: '项目: 检查修订'")
  expect(rewriteSkillMarkdown(result, { name: '再次修订' })).toContain("name: 'alpha-review'")
  expect(() => buildNewSkillContent({ slug: 'valid', name: '显示名', description: 'x'.repeat(1025), body: 'body' })).toThrow('1024')
})
