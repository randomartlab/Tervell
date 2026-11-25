import { expect, test } from 'bun:test'
import { macBuildTarget, machoMinimumVersions, exceedsMacMinimum } from './mac-release.ts'
import { releasePolicy } from './release-channel.ts'

test('Given Intel和M芯片 When 选择原生构建目标 Then 绑定各自架构且拒绝混用', () => {
  expect(macBuildTarget('arm64', 'arm64').swiftTarget).toBe('arm64-apple-macosx14.0')
  expect(macBuildTarget('x64', 'x64').swiftTarget).toBe('x86_64-apple-macosx14.0')
  expect(() => macBuildTarget('x64', 'arm64')).toThrow('对应架构')
  expect(() => macBuildTarget('universal', 'arm64')).toThrow('只支持')
})

test('Given Mach-O带高版本系统依赖 When 检查部署目标 Then 不混淆dylib版本且精确拒绝14.1要求', () => {
  const load = `Load command 0
          cmd LC_LOAD_DYLIB
      current version 400.2.0
compatibility version 1.0.0
Load command 1
      cmd LC_BUILD_VERSION
 platform 1
    minos 14.0
      sdk 27.2
Load command 2
      cmd LC_VERSION_MIN_MACOSX
  version 12.0
      sdk 26.0
`
  expect(machoMinimumVersions(load)).toEqual(['14.0', '12.0'])
  expect(machoMinimumVersions('Load command 0\ncmd LC_LOAD_DYLIB\nversion 999.0\n')).toEqual([])
  expect(() => machoMinimumVersions('Load command 0\ncmd LC_BUILD_VERSION\nsdk 27.2')).toThrow('部署目标')
  expect(exceedsMacMinimum('13.6.9')).toBe(false)
  expect(exceedsMacMinimum('14.0.0')).toBe(false)
  expect(exceedsMacMinimum('14.1')).toBe(true)
  expect(exceedsMacMinimum('15.0')).toBe(true)
})

test('Given Alpha启动策略 When 读取路径和更新策略 Then 数据与稳定版隔离且禁止自动更新', () => {
  const alpha = releasePolicy('alpha'), stable = releasePolicy(undefined)
  expect(alpha.configDirectory).not.toBe(stable.configDirectory)
  expect(alpha.chromiumDirectory).not.toBe(stable.chromiumDirectory)
  expect(alpha.automaticUpdates).toBe(false)
  expect(stable.automaticUpdates).toBe(false)
})
