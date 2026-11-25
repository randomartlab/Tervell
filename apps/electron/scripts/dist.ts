#!/usr/bin/env bun
/** 当前目标架构的完整打包链；fast 只限制产物数量，不跳过构建或运行依赖。 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { MAC_RELEASE_STEPS, macBuildTarget } from '@proma/shared/config'

export interface DistributionOptions {
  platform: 'mac' | 'win' | 'linux'
  arch: string
  noSign: boolean
  verbose: boolean
  format: 'dmg' | 'zip' | 'dir' | 'all'
  plan: boolean
  alpha: boolean
}
export function distributionOptions(args: string[], hostArch: string = process.arch): DistributionOptions {
  if (args.some(arg => !['--alpha', '--win', '--linux', '--current-arch', '--no-sign', '--verbose', '--plan', '--dmg', '--zip', '--dir'].includes(arg) && !/^--arch=(arm64|x64)$/.test(arg))) throw new Error('不支持的打包参数。')
  if (['--win', '--linux'].filter(arg => args.includes(arg)).length > 1 || ['--dmg', '--zip', '--dir'].filter(arg => args.includes(arg)).length > 1) throw new Error('平台或产物选项互相冲突。')
  return {
    platform: args.includes('--win') ? 'win' : args.includes('--linux') ? 'linux' : 'mac',
    arch: args.find(arg => arg.startsWith('--arch='))?.slice(7) ?? hostArch,
    alpha: args.includes('--alpha'), noSign: args.includes('--no-sign') || args.includes('--alpha'), verbose: args.includes('--verbose'), plan: args.includes('--plan'),
    format: args.includes('--dmg') ? 'dmg' : args.includes('--zip') ? 'zip' : args.includes('--dir') ? 'dir' : 'all',
  }
}
export function distributionPlan(input: DistributionOptions, hostPlatform: string = process.platform, hostArch: string = process.arch): Array<{ name: string; args: string[] }> {
  if (input.alpha && input.platform !== 'mac') throw new Error('Alpha 首轮仅支持 macOS。')
  const host = hostPlatform === 'darwin' ? 'mac' : hostPlatform === 'win32' ? 'win' : 'linux'
  if (input.platform !== host) throw new Error('请在目标平台的 Runner 上构建。')
  if (input.platform === 'mac') macBuildTarget(input.arch, hostArch)
  else if (input.arch !== hostArch) throw new Error('本打包入口要求宿主与产物架构一致。')
  const steps: Array<{ name: string; args: string[] }> = MAC_RELEASE_STEPS
    .filter(([, command]) => input.platform === 'mac' || !command.startsWith('scripts/check-mac-target'))
    .map(([name, command]) => ({ name, args: ['run', ...command.split(' ')] }))
  // 直接运行已安装的 CLI；不经 bunx/npx 下载或由 shell 重新解析参数。
  const builder = ['run', resolve(import.meta.dir, '../../../node_modules/electron-builder/cli.js'), `--${input.platform}`, `--${input.arch}`, '--publish', 'never']
  if (input.alpha) builder.push('--config', 'electron-builder.alpha.yml')
  if (input.format === 'dir') builder.push('--dir')
  else if (input.format !== 'all') {
    if (input.platform !== 'mac') throw new Error('DMG/ZIP 选项仅用于 macOS。')
    builder.push(`--config.mac.target=${input.format}`)
  }
  if (input.noSign && input.platform === 'mac') builder.push('--config.mac.identity=null', '--config.mac.notarize=false')
  steps.push({ name: '生成安装产物', args: builder })
  if (input.platform === 'mac') steps.push({ name: '核验安装产物', args: ['run', 'scripts/check-mac-package.ts', `--format=${input.format}`, ...(input.alpha ? ['--alpha'] : [])] })
  return steps
}
function main(): void {
  const input = distributionOptions(process.argv.slice(2)), cwd = resolve(import.meta.dir, '..')
  const steps = distributionPlan(input)
  const env = {
    ...process.env, PROMA_RELEASE_CHANNEL: input.alpha ? 'alpha' : 'stable', PROMA_BUILD_ARCH: input.arch, OFFICECLI_ARCH: input.arch, PROMA_BUILD_MODE: 'package',
    ...(input.platform === 'mac' ? { MACOSX_DEPLOYMENT_TARGET: '14.0' } : {}),
    ...(input.noSign ? { CSC_IDENTITY_AUTO_DISCOVERY: 'false' } : {}),
    ...(input.verbose ? { DEBUG: 'electron-builder,electron-builder:*' } : {}),
  }
  if (input.plan) {
    console.log(JSON.stringify({ platform: input.platform, arch: input.arch, publish: 'never', steps }, null, 2))
    return
  }
  if (!existsSync(resolve(cwd, '../../node_modules/electron-builder/cli.js'))) throw new Error('缺少已安装的 electron-builder。')
  for (const [index, step] of steps.entries()) {
    console.log(`[打包 ${index + 1}/${steps.length}] ${step.name}`)
    const result = spawnSync(process.execPath, step.args, { cwd, env, stdio: 'inherit' })
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
  console.log(`完整打包结束：${input.platform}/${input.arch}；未发布到外部服务。`)
}
if (import.meta.main) main()
