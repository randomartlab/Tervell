/** Alpha 首轮支持范围；CPU 架构与系统最低版本分别校验。 */
export const MAC_MINIMUM_VERSION = '14.0'
export const MAC_ARCHITECTURES = ['arm64', 'x64'] as const
export type MacArchitecture = (typeof MAC_ARCHITECTURES)[number]

export function macBuildTarget(arch: string, hostArch: string): { arch: MacArchitecture; minimum: string; swiftTarget: string } {
  if (arch !== 'arm64' && arch !== 'x64') throw new Error('macOS 只支持 arm64 与 x64 目标。')
  if (arch !== hostArch) throw new Error('请在对应架构的 macOS Runner 上构建，避免混入另一架构的 native 依赖。')
  return { arch, minimum: MAC_MINIMUM_VERSION, swiftTarget: `${arch === 'x64' ? 'x86_64' : 'arm64'}-apple-macosx${MAC_MINIMUM_VERSION}` }
}

/** 只读取部署目标字段，不把依赖 dylib 的 current/compatibility version 当成系统版本。 */
export function machoMinimumVersions(loadCommands: string): string[] {
  return loadCommands.split(/(?=Load command \d+)/).flatMap(command => {
    const field = /\bcmd LC_BUILD_VERSION\b/.test(command) ? 'minos'
      : /\bcmd LC_VERSION_MIN_MACOSX\b/.test(command) ? 'version' : undefined
    if (!field) return []
    const value = command.match(new RegExp(`^\\s*${field}\\s+(\\d+\\.\\d+(?:\\.\\d+)?)\\s*$`, 'm'))?.[1]
    if (!value) throw new Error('Mach-O 缺少有效的 macOS 部署目标。')
    return [value]
  })
}

export function exceedsMacMinimum(version: string): boolean {
  const parts = version.split('.').map(Number), allowed = MAC_MINIMUM_VERSION.split('.').map(Number)
  if (parts.some(part => !Number.isSafeInteger(part) || part < 0)) throw new Error('系统版本无效。')
  for (let index = 0; index < Math.max(parts.length, allowed.length); index++) {
    const delta = (parts[index] ?? 0) - (allowed[index] ?? 0)
    if (delta) return delta > 0
  }
  return false
}

export const MAC_RELEASE_STEPS = [
  ['校验目标架构', 'scripts/check-mac-target.ts'],
  ['生成统一品牌资源', 'generate:icons'],
  ['准备模型网关', 'prepare:model-gateway'],
  ['准备 OfficeCLI', 'prepare:officecli'],
  ['构建主进程', 'build:main'],
  ['构建 Agent 运行时', 'build:agent-runtime'],
  ['构建终端运行时', 'build:terminal-runtime'],
  ['构建 Preload', 'build:preload'],
  ['构建界面', 'build:renderer'],
  ['构建 CLI', 'build:cli'],
  ['构建原生组件', 'build:native-helpers'],
  ['复制资源', 'build:resources'],
  ['同步运行依赖', 'sync:runtime-deps'],
  ['重建 PTY', 'rebuild:node-pty'],
  ['核验资源与架构', 'scripts/check-mac-target.ts --artifacts'],
] as const
