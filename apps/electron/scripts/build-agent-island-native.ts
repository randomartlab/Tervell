#!/usr/bin/env bun
/** Build the macOS-native Agent Island helper for the current host architecture. */

import { macBuildTarget } from '@proma/shared/config'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(scriptDir, '..')
const source = resolve(appDir, 'native/agent-island/macos-agent-island-helper.swift')
const brandSource = resolve(appDir, 'native/agent-island/TervellBrandMark.swift')
const output = resolve(appDir, 'resources/agent-island/macos-agent-island-helper')

if (process.platform !== 'darwin') {
  console.log('[agent-island-native] skipped (macOS only)')
  process.exit(0)
}

if (!existsSync(source)) throw new Error(`Agent Island helper source not found: ${source}`)
if (!existsSync(brandSource)) throw new Error('缺少生成的 Tervell 原生标志，请先生成图标资源。')
mkdirSync(dirname(output), { recursive: true })
rmSync(output, { force: true })
const target = macBuildTarget(process.env.PROMA_BUILD_ARCH ?? process.arch, process.arch)
execFileSync('xcrun', ['swiftc', '-O', '-parse-as-library', '-target', target.swiftTarget, source, brandSource, '-o', output], { stdio: 'inherit' })
chmodSync(output, 0o755)
console.log(`[agent-island-native] built ${output}`)
