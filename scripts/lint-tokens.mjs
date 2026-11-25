#!/usr/bin/env node
/**
 * lint:tokens —— 设计 token 检查（I-11）
 *
 * 规则：渲染层与共享 UI 中，颜色只能来自 CSS 变量 / Tailwind 语义类，
 * 不得新增硬编码的 #hex、rgb()/rgba()、hsl()/hsla()。
 *
 * 豁免：
 * - 主题定义源（globals.css、theme.config.ts）本身就是 token 的出处
 * - *.test.* 与 *.d.ts
 * - 注释行
 * - 存量违规记入 scripts/lint-baselines/lint:tokens.json，只拦截新增
 *
 * 用法：node scripts/lint-tokens.mjs [--update]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listFiles, read, judge } from './lint-lib.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const COLOR_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\b(?:rgba?|hsla?)\(\s*[\d.]/g
const TOKEN_SOURCES = new Set(['apps/electron/theme.config.ts', 'apps/electron/src/renderer/styles/globals.css', 'packages/ui/src/workbench/theme.css', 'packages/ui/src/brand/palette.css',
  // 上游归档控件CSS与token原样保留，来源/摘要在third-party/dsh-runtime记录。
  'apps/electron/src/renderer/lib/third-party/paseo-client/dsh-tokens.css',
  'apps/electron/src/renderer/lib/third-party/paseo-client/dsh-ui.css'])

const violations = new Map()
const files = [...listFiles(root, ['apps/electron/src/renderer', 'packages/ui/src'], ['.ts', '.tsx', '.css']), ...listFiles(root, ['apps/web/src'], ['.ts', '.tsx', '.css'])]

for (const file of files) {
  if (file.endsWith('.d.ts') || file.includes('.test.') || TOKEN_SOURCES.has(file)) continue
  const lines = read(root, file).split('\n')
  const list = []
  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return
    // 排除 HTML 实体（&#123;）与 URL 片段（#anchor 不会是 3/6/8 位纯 hex 才会误报，保守处理）
    for (const m of line.matchAll(COLOR_RE)) {
      if (line[m.index - 1] === '&') continue
      list.push(`L${i + 1}: ${m[0]}`)
    }
  })
  if (list.length) violations.set(file, list)
}

process.exit(judge(root, 'lint:tokens', violations))
