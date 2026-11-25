#!/usr/bin/env node
/**
 * lint:boundaries —— 包边界检查（I-04）
 *
 * 规则：
 * 1. packages/protocol 只依赖 zod，不得 import 任何 @proma/* 包
 * 2. kernel-host 允许依赖 protocol/shared/core；core 不能反向依赖 kernel-host
 * 3. packages/* 不得 import apps/*（库不能反向依赖应用）
 * 4. apps/* 之间不得互相 import
 * 5. 相对路径不得越过 3 层（../../../ 及以上，存量走基线）
 *
 * 用法：node scripts/lint-boundaries.mjs [--update]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listFiles, read, judge } from './lint-lib.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

/** 每个包允许依赖的 @proma/* 包；未列出的包不限制 @proma 依赖（存量包） */
const ALLOWED_PROMA_DEPS = {
  'packages/protocol': [],
  'packages/client': ['@proma/protocol'],
  'packages/core-server': ['@proma/protocol','@proma/core','@proma/kernel-host'],
  'packages/tool-bridge': ['@proma/protocol', '@proma/core'],
  'packages/testing': ['@proma/protocol'],
  'packages/auth-bridge': ['@proma/protocol'],
  'packages/kernel-host': ['@proma/protocol', '@proma/shared', '@proma/core'],
}

const violations = new Map()
const add = (file, msg) => {
  const list = violations.get(file) ?? []
  list.push(msg)
  violations.set(file, list)
}

const files = listFiles(root, ['apps', 'packages'], ['.ts', '.tsx', '.mts'])
for (const file of files) {
  if (file.endsWith('.d.ts')) continue
  // 原样归档的上游源码有独立来源摘要，不能为本仓库别名规则改写其导入。
  if (file.startsWith('apps/electron/resources/third-party/default-features/')) continue
  const [top, name] = file.split('/')
  const pkg = `${top}/${name}`
  const src = read(root, file)

  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2]
    if (!spec) continue

    const allowed = ALLOWED_PROMA_DEPS[pkg]
    if (allowed && spec.startsWith('@proma/')) {
      const target = spec.split('/').slice(0, 2).join('/')
      if (!allowed.includes(target)) add(file, `${pkg} 不得依赖 ${target}`)
    }
    if (pkg === 'packages/core' && spec.startsWith('@proma/kernel-host')) add(file, 'core 不得依赖内核实现')
    if (top === 'packages' && /(^|\/)apps\//.test(spec)) add(file, `库包不得依赖应用：${spec}`)
    if (top === 'apps' && /^(\.\.\/)+apps\//.test(spec)) add(file, `应用之间不得互相依赖：${spec}`)
    if (/^(\.\.\/){3,}/.test(spec)) add(file, `相对路径过深：${spec}`)
  }
}

process.exit(judge(root, 'lint:boundaries', violations))
