import type { CreateWorkspaceSkillInput } from '../types/agent'

export function buildNewSkillContent(input: CreateWorkspaceSkillInput): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 64) throw new Error('技能标识请使用 1–64 位小写字母、数字或连字符。')
  if (!input.name.trim() || /[\r\n]/.test(input.name) || input.name.length > 160) throw new Error('技能名称需为 1–160 字符的单行文字。')
  if (!input.description.trim() || /[\r\n]/.test(input.description) || input.description.length > 1024) throw new Error('请填写单行用途说明（最多 1024 字符）。')
  if (!input.body.trim() || input.body.length > 256000) throw new Error('请填写技能指令（最多 256000 字符）。')
  // YAML 单引号内以两个单引号转义，保留冒号、井号等普通用户输入。
  const yaml = serializeSkillYamlValue
  return `---\nname: ${yaml(input.slug)}\ndisplay-name: ${yaml(input.name)}\ndescription: ${yaml(input.description)}\nversion: '1.0.0'\n---\n\n${input.body.trim()}\n`
}

export const serializeSkillYamlValue = (value: string): string => `'${value.trim().replace(/'/g, "''")}'`
export function parseSkillInlineValue(value: string): string {
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  if (value.startsWith('"') && value.endsWith('"')) {
    try { const parsed: unknown = JSON.parse(value); return typeof parsed === 'string' ? parsed : value } catch { return value.slice(1, -1) }
  }
  return value
}
export function assertSkillContentUnchanged(current: string, expected?: string): void {
  if (expected !== undefined && current !== expected) throw new Error('技能文件已被其他操作更新。草稿已保留，请重新读取并核对差异后再保存。')
}

/** 保留未知元数据，更新字段时一并移除旧 block scalar 的缩进行，兼容没有 frontmatter 的技能。 */
export function rewriteSkillMarkdown(original: string, updates: { name?: string; description?: string; body?: string; runtimeName?: string }): string {
  const source = original.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const match = source.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/)
  let metadata = match?.[1] ?? ''
  if (updates.runtimeName && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(updates.runtimeName) || updates.runtimeName.length > 64)) throw new Error('技能调用标识无效。')
  const fields: Record<string, string | undefined> = {
    ...(updates.runtimeName ? { name: updates.runtimeName, 'display-name': updates.name }
      : /^display-name:/m.test(metadata) ? { 'display-name': updates.name } : { name: updates.name }),
    description: updates.description,
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue
    const line = `${key}: ${serializeSkillYamlValue(value.replace(/\s*\n\s*/g, ' '))}`
    const field = new RegExp(`^${key}:[^\\n]*(?:\\n[ \\t]+[^\\n]*)*`, 'm')
    metadata = field.test(metadata) ? metadata.replace(field, () => line) : [metadata, line].filter(Boolean).join('\n')
  }
  return `---\n${metadata}\n---\n${updates.body ?? match?.[2] ?? source}`
}
