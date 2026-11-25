import { chmodSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'
import { writeBytesFileAtomic } from './safe-file'

/** Grok的npm入口会在每个新HOME解压和复制自身；受管安装一次性准备原生入口，ACP不再套一层启动器。 */
export function managedNativeEntry(id: string, directory: string, version: string, platform = process.platform as string, arch = process.arch as string): string | undefined {
  if (id !== 'grok') return
  const root = join(directory, 'package/node_modules/@xai-official', `grok-${platform}-${arch}`)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name?: string; version?: string }
  if (manifest.name !== `@xai-official/grok-${platform}-${arch}` || manifest.version !== version) throw Error('Grok原生运行时版本与适配器不一致，请一键修复内核')
  const name = platform === 'win32' ? 'grok.exe' : 'grok'
  const destination = join(directory, platform === 'win32' ? 'grok-native.exe' : 'grok-native')
  if (existsSync(destination)) return destination
  const source = join(root, 'bin', name)
  const bytes = existsSync(source + '.br') ? brotliDecompressSync(readFileSync(source + '.br'), { maxOutputLength: 512 * 1024 * 1024 }) : readFileSync(source)
  writeBytesFileAtomic(destination, bytes)
  if (platform !== 'win32') chmodSync(destination, 0o700)
  return destination
}
