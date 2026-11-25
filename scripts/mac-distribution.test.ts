import { expect, test } from 'bun:test'
import { distributionOptions, distributionPlan } from '../apps/electron/scripts/dist.ts'

test('Given 快速打包 When 生成DMG计划 Then 运行时、资源、依赖和原生检查全部先于打包', () => {
  const steps = distributionPlan(distributionOptions(['--dmg', '--plan'], 'arm64'), 'darwin', 'arm64')
  const commands = steps.slice(0, -2).map(step => step.args.slice(1).join(' '))
  for (const command of ['generate:icons', 'build:agent-runtime', 'build:terminal-runtime', 'build:cli', 'build:native-helpers', 'sync:runtime-deps', 'rebuild:node-pty', 'scripts/check-mac-target.ts --artifacts']) expect(commands).toContain(command)
  expect(commands.indexOf('generate:icons')).toBeLessThan(commands.indexOf('build:renderer'))
  expect(commands.indexOf('generate:icons')).toBeLessThan(commands.indexOf('build:native-helpers'))
  expect(commands.indexOf('sync:runtime-deps')).toBeLessThan(commands.indexOf('rebuild:node-pty'))
  expect(commands.at(-1)).toBe('scripts/check-mac-target.ts --artifacts')
  expect(steps.at(-1)?.args).toContain('scripts/check-mac-package.ts')
  expect(steps.at(-2)?.args).toContain('--config.mac.target=dmg')
  expect(steps.at(-2)?.args.slice(-3, -1)).not.toContain('always')
  expect(steps.at(-2)?.args).toContain('never')
  expect(steps.at(-2)?.args.join(' ')).not.toMatch(/bunx|npx|exec electron-builder/)
})

test('Given 两种CPU或错误参数 When 生成Alpha计划 Then 独立目标且错平台提前失败', () => {
  for (const arch of ['arm64', 'x64']) {
    const input = distributionOptions(['--alpha', '--zip'], arch)
    const steps = distributionPlan(input, 'darwin', arch)
    expect(steps.at(-2)?.args).toContain(`--${arch}`)
    expect(steps.at(-2)?.args).toContain('electron-builder.alpha.yml')
    expect(steps.at(-2)?.args).toContain('--config.mac.identity=null')
    expect(steps.at(-2)?.args).toContain('--config.mac.notarize=false')
  }
  expect(() => distributionPlan(distributionOptions(['--arch=x64']), 'darwin', 'arm64')).toThrow('对应架构')
  expect(() => distributionPlan(distributionOptions([]), 'linux', 'arm64')).toThrow('目标平台')
  expect(() => distributionOptions(['--dmg', '--zip'])).toThrow('互相冲突')
  expect(() => distributionOptions(['--publish=always'])).toThrow('不支持')
})
