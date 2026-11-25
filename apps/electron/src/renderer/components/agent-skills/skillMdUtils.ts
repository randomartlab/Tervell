/**
 * SKILL.md frontmatter 解析与重写工具
 *
 * 从 SKILL.md 文本中提取正文，以及在保留 frontmatter 的前提下
 * 重写 name / description / body 字段。供 Skills Tab 内的详情编辑使用。
 */

import { rewriteSkillMarkdown } from '@proma/shared/utils'

/** 提取 SKILL.md 的正文（去除 frontmatter） */
export function extractSkillBody(content: string): string {
  // 移除 UTF-8 BOM（﻿），确保 frontmatter 匹配不受 BOM 干扰
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)

  const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/)
  return match?.[1] ?? content
}

/** 更新元数据与正文时兼容 block scalar，保留未知字段。 */
export function rebuildSkillMd(originalContent: string, updates: { name?: string; description?: string; body?: string; runtimeName?: string }): string {
  return rewriteSkillMarkdown(originalContent, updates)
}
