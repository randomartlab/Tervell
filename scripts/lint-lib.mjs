/**
 * lint 共用工具：文件遍历 + 基线（豁免清单）读写
 *
 * 基线策略（对应 14-AI原生PRD I-04/I-11 与 13 A08「旧值有豁免清单」）：
 * - 存量违规按「文件 → 违规数」记录在 scripts/lint-baselines/<name>.json
 * - 文件违规数 ≤ 基线 → 通过；超过基线或出现新文件 → 失败
 * - 违规减少时提示用 --update 收紧基线（基线只降不升）
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SKIP_DIRS = new Set(['node_modules', 'dist', 'out', 'build', '.git', 'release'])

/** 递归列出 root 下匹配扩展名的文件（返回以 / 分隔的相对路径） */
export function listFiles(repoRoot, roots, exts) {
  const out = []
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name))
      } else if (exts.some((x) => e.name.endsWith(x))) {
        out.push(relative(repoRoot, join(dir, e.name)).split(sep).join('/'))
      }
    }
  }
  for (const r of roots) walk(join(repoRoot, r))
  return out.sort()
}

export function read(repoRoot, file) {
  return readFileSync(join(repoRoot, file), 'utf8')
}

/**
 * 按基线判定并输出结果
 * @param {string} name 基线名
 * @param {Map<string, string[]>} violations 文件 → 违规描述列表
 */
export function judge(repoRoot, name, violations) {
  const dir = join(repoRoot, 'scripts', 'lint-baselines')
  const path = join(dir, `${name.replaceAll(':', '-')}.json`)
  const update = process.argv.includes('--update')
  const counts = Object.fromEntries([...violations].map(([f, v]) => [f, v.length]).sort())

  if (update || !existsSync(path)) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(path, JSON.stringify(counts, null, 2) + '\n')
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    console.log(`${name}: 基线已写入 ${relative(repoRoot, path)}（${Object.keys(counts).length} 个文件，${total} 处存量）`)
    return 0
  }

  const baseline = JSON.parse(readFileSync(path, 'utf8'))
  const failures = []
  const improved = []
  for (const [file, list] of violations) {
    const allowed = baseline[file] ?? 0
    if (list.length > allowed) {
      failures.push(`${file}: ${list.length} 处（基线 ${allowed}）\n  ${list.slice(0, 5).join('\n  ')}`)
    } else if (list.length < allowed) {
      improved.push(file)
    }
  }
  for (const file of Object.keys(baseline)) {
    if (!violations.has(file)) improved.push(file)
  }

  if (failures.length) {
    console.error(`❌ ${name}: ${failures.length} 个文件新增违规\n${failures.join('\n')}`)
    return 1
  }
  const total = [...violations.values()].reduce((a, v) => a + v.length, 0)
  console.log(`✅ ${name} OK（存量 ${total} 处均在基线内）`)
  if (improved.length) {
    console.log(`  ${improved.length} 个文件违规已减少，可运行 \`bun run ${name} -- --update\` 收紧基线`)
  }
  return 0
}
