import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { RemoteTunnelProfileSchema } from '../packages/protocol/src/remote'
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file'

/** 仅供同一台电脑自测时显式预置连接配置；不继承配对、账号或启用状态。 */
export function prepareAlphaLocalMobile(localHome: string): 'existing' | 'prepared' {
  const targetDirectory = join(localHome, '.project-workbench-alpha')
  const target = join(targetDirectory, 'remote-tunnel-private.json')
  for (const path of [targetDirectory, target]) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error('目标路径不适用于本机准备，现有配置未修改。')
  }
  if (existsSync(target)) {
    RemoteTunnelProfileSchema.parse(JSON.parse(readFileSync(target, 'utf8')))
    return 'existing'
  }
  const source = ['.proma-dev', '.proma']
    .map(directory => join(localHome, directory, 'remote-tunnel-private.json'))
    .find(path => existsSync(path) && !lstatSync(path).isSymbolicLink())
  if (!source) throw new Error('这台电脑没有现成的连接配置，尚不能使用此准备入口。')
  const profile = RemoteTunnelProfileSchema.parse(JSON.parse(readFileSync(source, 'utf8')))
  mkdirSync(targetDirectory, { recursive: true, mode: 0o700 })
  writeJsonFileAtomic(target, profile)
  chmodSync(target, 0o600)
  return 'prepared'
}

if (import.meta.main) {
  if (process.argv.slice(2).join(' ') !== '--apply') throw new Error('请通过本机实测准备入口显式运行。')
  try {
    const result = prepareAlphaLocalMobile(homedir())
    console.log(result === 'prepared' ? '本机手机连接已准备好。' : '本机手机连接已有配置，已保留。')
    console.log('请启动或重启 Tervell Alpha，在「设置 → 远程连接 → 安卓远程」选择项目，再保存连接并生成一次性配对码。')
    console.log('只有新生成的配对才会取得你勾选的管理权限；本入口不会启用远程或迁移账号、会话和旧设备。')
  } catch {
    console.error('本机手机连接未准备完成，现有配置已保留。请反馈此提示。')
    process.exitCode = 1
  }
}
