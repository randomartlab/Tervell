import { satisfies } from 'semver'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface CliPackageManifest {
  bin?: string | Record<string, string>
  engines?: { node?: string; bun?: string }
}
/** 安装器运行时不是内核运行时；按包 engines 选 Node/Bun，不能仅靠 shebang 猜。 */
export function cliPackageRuntime(manifest: CliPackageManifest, nodeVersion: string, bunVersion: string, header: string): 'node' | 'bun' {
  if (manifest.engines?.bun || /^#![^\n]*\bbun\b/.test(header)) {
    if (manifest.engines?.bun && !satisfies(bunVersion, manifest.engines.bun)) throw Error(`内核需要 Bun ${manifest.engines.bun}，当前受管版本 ${bunVersion}`)
    return 'bun'
  }
  if (manifest.engines?.node && !satisfies(nodeVersion, manifest.engines.node)) throw Error(`内核需要 Node ${manifest.engines.node}，当前受管版本 ${nodeVersion}`)
  return 'node'
}
export function cliPackageBin(manifest: CliPackageManifest, packageName: string, requested?: string): string {
  if (typeof manifest.bin === 'string') return manifest.bin
  const choices = manifest.bin ?? {}
  if (requested && choices[requested]) return choices[requested]
  const shortName = packageName.split('/').at(-1)!
  if (choices[shortName]) return choices[shortName]
  const entries = Object.values(choices)
  if (entries.length === 1) return entries[0]!
  throw Error('内核包存在多个启动入口，安装配方必须明确选择，未启用不确定入口')
}
/** pi-acp默认猜pi.cmd，但Bun在Windows创建pi.exe；使用私有依赖的实际入口。 */
export function cliDependencyEnvironment(id: string, packageRoot: string, platform: string = process.platform): Record<string,string> {
  if(id==='cline')return {CLINE_SESSION_BACKEND_MODE:'local',CLINE_NO_AUTO_UPDATE:'1'}
  if(id==='gemini'&&platform==='win32')return {GEMINI_PTY_INFO:'child_process'}
  if(id!=='pi-acp')return {}
  const names=platform==='win32'?['pi.exe','pi.cmd','pi.bat']:['pi']
  const command=names.map(name=>join(packageRoot,'node_modules/.bin',name)).find(existsSync)
  if(!command)throw Error('Pi ACP依赖入口缺失，请一键修复内核')
  return {PI_ACP_PI_COMMAND:command}
}
