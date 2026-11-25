import { execFileSync } from 'node:child_process'
import { existsSync, accessSync, constants } from 'node:fs'
import { resolve } from 'node:path'
import { MAC_MINIMUM_VERSION, macBuildTarget, machoMinimumVersions, exceedsMacMinimum } from '@proma/shared/config'

if (process.platform !== 'darwin') throw new Error('macOS 构建检查需要 macOS Runner。')
const target = macBuildTarget(process.env.PROMA_BUILD_ARCH ?? process.arch, process.arch)
if (process.argv.includes('--artifacts')) {
  const root = resolve(import.meta.dir, '..')
  for (const name of ['main', 'agent-runtime', 'terminal-runtime', 'preload']) {
    if (!existsSync(resolve(root, 'dist', `${name}.cjs`))) throw new Error(`缺少 ${name} bundle`)
  }
  if (!existsSync(resolve(root, 'dist/renderer/index.html'))) throw new Error('缺少 renderer')
  const ptyDirectory = ['build/Release', 'build/Debug', `prebuilds/darwin-${target.arch}`].find(directory => existsSync(resolve(root, 'node_modules/node-pty', directory, 'pty.node')))
  if (!ptyDirectory) throw new Error('缺少已同步并重建的 PTY binding。')
  for (const relative of [
    'resources/bin/proma', 'resources/officecli/officecli', 'resources/model-gateway/magpie',
    'resources/agent-island/macos-agent-island-helper', 'resources/eventkit/macos-eventkit.node',
    `node_modules/node-pty/${ptyDirectory}/pty.node`, `node_modules/node-pty/${ptyDirectory}/spawn-helper`,
  ]) {
    const file = resolve(root, relative)
    if (!existsSync(file)) throw new Error(`缺少资源：${relative}`)
    const arch = execFileSync('/usr/bin/lipo', ['-archs', file], { encoding: 'utf8' }).trim().split(/\s+/)
    if (!arch.includes(target.arch === 'x64' ? 'x86_64' : 'arm64')) throw new Error(`架构不匹配：${relative}`)
    const load = execFileSync('/usr/bin/otool', ['-l', file], { encoding: 'utf8' })
    const versions = machoMinimumVersions(load)
    if (!versions.length) throw new Error(`资源缺少可识别的部署目标：${relative}`)
    if (versions.some(exceedsMacMinimum)) throw new Error(`资源要求高于 macOS ${MAC_MINIMUM_VERSION}：${relative}`)
    if (!relative.endsWith('.node')) accessSync(file, constants.X_OK)
  }
  for (const pkg of ['@earendil-works/pi-coding-agent', '@earendil-works/pi-agent-core', '@earendil-works/pi-ai', 'sharp', 'node-pty']) {
    if (!existsSync(resolve(root, 'node_modules', pkg, 'package.json'))) throw new Error(`未同步运行依赖：${pkg}`)
  }
}
console.log(`macOS ${target.minimum}+ / ${target.arch} 构建目标检查通过`)
