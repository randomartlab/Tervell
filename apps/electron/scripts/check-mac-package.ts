import { execFileSync } from 'node:child_process'
import { accessSync, constants, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { macBuildTarget, machoMinimumVersions, exceedsMacMinimum } from '@proma/shared/config'
import { readAsar } from 'app-builder-lib/out/asar/asar.js'

/** 只检查安装产物内容，不启动 Electron 或模型。由完整打包链最后调用。 */
async function main(): Promise<void> {
  if (process.platform !== 'darwin') throw new Error('macOS 产物核验需要 macOS。')
  const target = macBuildTarget(process.env.PROMA_BUILD_ARCH ?? process.arch, process.arch)
  const alpha = process.argv.includes('--alpha')
  const format = process.argv.find(argument => argument.startsWith('--format='))?.slice(9) ?? 'all'
  if (!['all', 'dmg', 'zip', 'dir'].includes(format)) throw new Error('安装产物格式无效。')
  const output = resolve(import.meta.dir, alpha ? '../out/alpha' : '../out')
  const directory = join(output, target.arch === 'x64' ? 'mac' : 'mac-arm64')
  const apps = readdirSync(directory).filter(name => name.endsWith('.app'))
  if (apps.length !== 1) throw new Error('安装产物目录必须恰好包含一个 App。')
  const contents = join(directory, apps[0]!, 'Contents'), resources = join(contents, 'Resources')
  require('./harden-electron.cjs').inspectHardenedElectron(join(directory, apps[0]!), 'darwin')
  for (const relative of ['brand/tervell-threshold.svg', 'brand/tervell-threshold.png', 'proma-logos/proma-threshold.png', 'startup-splash/artwork.jpg']) {
    if (existsSync(join(resources, relative))) throw new Error(`产物包含已归档品牌资源：${relative}`)
  }
  for (const relative of ['brand/tervell-color.svg', 'brand/tervell-reverse.svg', 'brand/tervell-ink.svg', 'brand/tervell-white.svg', 'startup-splash/surfaces.css', 'startup-splash/palette.css']) {
    if (!existsSync(join(resources, relative))) throw new Error(`产物缺少统一品牌资源：${relative}`)
  }
  const readPlist = (key: string) => execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, join(contents, 'Info.plist')], { encoding: 'utf8' }).trim()
  if (readPlist('LSMinimumSystemVersion') !== target.minimum) throw new Error('安装产物系统要求不一致。')
  if (alpha && readPlist('CFBundleIdentifier') !== 'art.randomai.tervell.alpha') throw new Error('Alpha App 标识不一致。')
  if (alpha) execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', join(directory, apps[0]!)], { stdio: 'inherit' })
  const checkBinary = (file: string, executable = false) => {
    if (!existsSync(file)) throw new Error(`产物缺少资源：${file}`)
    const arches = execFileSync('/usr/bin/lipo', ['-archs', file], { encoding: 'utf8' }).trim().split(/\s+/)
    if (!arches.includes(target.arch === 'x64' ? 'x86_64' : 'arm64')) throw new Error(`产物CPU架构不一致：${file}`)
    const versions = machoMinimumVersions(execFileSync('/usr/bin/otool', ['-l', file], { encoding: 'utf8' }))
    if (!versions.length || versions.some(exceedsMacMinimum)) throw new Error(`产物系统要求过高或无法识别：${file}`)
    if (executable) accessSync(file, constants.X_OK)
  }
  checkBinary(join(contents, 'MacOS', readPlist('CFBundleExecutable')), true)
  for (const relative of ['bin/proma', 'model-gateway/magpie', 'officecli/officecli', 'agent-island/macos-agent-island-helper', 'eventkit/macos-eventkit.node']) checkBinary(join(resources, relative), !relative.endsWith('.node'))
  for(const name of ['MAGPIE-LICENSE.txt','MAGPIE-THIRD-PARTY-NOTICES.txt','MAGPIE-SOURCE.txt'])if(!existsSync(join(resources,'third-party',name)))throw new Error('产物缺少模型网关来源与许可')
  for(const relative of ['third-party/plugin-host/lifecycle.cjs','third-party/paseo-server/LICENSE','third-party/paseo-server/NOTICE'])if(!existsSync(join(resources,relative)))throw new Error('产物缺少生命周期运行组件或许可：'+relative)
  checkBinary(join(resources,'third-party/plugin-runtime', 'darwin-'+target.arch, 'bun'),true)
  const archive = await readAsar(join(resources, 'app.asar'))
  for (const path of ['dist/mobile-control-verify.cjs', 'dist/mobile-control-verify.mjs']) {
    if (archive.getNode(path)) throw new Error('安装包包含本地联调脚本。')
  }
  for (const name of ['LICENSE', 'NOTICE']) {
    const file = join(resources, 'third-party/paseo-cafe', name)
    if (!existsSync(file) || statSync(file).size < 100) throw new Error('产物缺少 Paseo Cafe 许可或来源声明。')
  }
  for (const path of ['package.json', 'dist/main.cjs', 'dist/agent-runtime.cjs', 'dist/terminal-runtime.cjs', 'dist/pi-fork-runtime.cjs', 'dist/plugin-stdio.mjs', 'dist/preload.cjs', 'dist/renderer/index.html']) {
    if (!archive.getNode(path)) throw new Error(`ASAR 缺少 ${path}`)
  }
  for(const name of ['esbuild/lib/main.js','typescript/lib/typescript.js','semver/functions/parse.js'])if(!existsSync(join(resources,'app.asar.unpacked/node_modules',name)))throw Error('安装包缺少插件编译器依赖：'+name)
  const metadata: unknown = JSON.parse((await archive.readFile('package.json')).toString('utf8'))
  if (alpha && (!metadata || typeof metadata !== 'object' || !('promaReleaseChannel' in metadata) || metadata.promaReleaseChannel !== 'alpha')) throw new Error('Alpha 通道未写入安装产物。')
  const sourceMetadata: unknown = JSON.parse(readFileSync(resolve(import.meta.dir, '../package.json'), 'utf8'))
  if (!metadata || typeof metadata !== 'object' || !('version' in metadata) || typeof metadata.version !== 'string'
      || !sourceMetadata || typeof sourceMetadata !== 'object' || !('version' in sourceMetadata) || metadata.version !== sourceMetadata.version) throw new Error('安装产物版本与当前源码不一致。')
  const nativeRoot = join(resources, 'app.asar.unpacked/node_modules')
  const nativeFiles: string[] = []
  const walk = (path: string): void => {
    if (!existsSync(path)) return
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.name.endsWith('.node') || entry.name.endsWith('.dylib') || entry.name === 'spawn-helper') nativeFiles.push(file)
    }
  }
  walk(nativeRoot)
  const selected = nativeFiles.filter(file => !/[/\\](?:win32|linux|darwin)-(?:x64|arm64)[/\\]/.test(file) || file.includes(`/darwin-${target.arch}/`))
  if (!selected.some(file => /node-pty.*pty\.node$/.test(file))) throw new Error('产物缺少已解包的 PTY binding。')
  if (!selected.some(file => /sharp.*\.node$/.test(file))) throw new Error('产物缺少已解包的 sharp binding。')
  for (const file of selected) checkBinary(file, file.endsWith('spawn-helper'))
  checkBinary(join(contents, 'Frameworks/Electron Framework.framework/Versions/A/Electron Framework'))
  for (const extension of format === 'dir' ? [] : format === 'all' ? ['dmg', 'zip'] : [format]) {
    const expected = alpha ? `Tervell-Alpha-${metadata.version}-mac-${target.arch}.${extension}` : undefined
    const file = expected ? join(output, expected) : readdirSync(output)
      .filter(name => name.includes(`-${metadata.version}`) && name.endsWith(`.${extension}`))
      .map(name => join(output, name)).find(file => target.arch === 'arm64' ? file.includes('arm64') : !file.includes('arm64'))
    if (!file || !existsSync(file) || statSync(file).size < 1024) throw new Error(`缺少当前版本与架构的 ${extension} 产物。`)
  }
  console.log(`安装产物内容检查通过：macOS ${target.minimum}+ / ${target.arch}；未启动桌面。`)
}
if (import.meta.main) await main()
