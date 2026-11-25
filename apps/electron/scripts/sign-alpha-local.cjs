/** Alpha 仅作本地 ad-hoc 签名，修复重新打包后失效的 Electron 签名；不使用证书或公证服务。 */
const { readFileSync, writeFileSync,existsSync, openSync, readSync, closeSync, statSync } = require('node:fs')
const { join } = require('node:path')
const { execFileSync } = require('node:child_process')
const { signAsync } = require('@electron/osx-sign')

module.exports = async function signAlphaLocal(context) {
  if (context.electronPlatformName !== 'darwin') throw new Error('本地 Alpha 签名仅支持 macOS。')
  const app = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  require('./harden-electron.cjs').hardenElectron(app, 'darwin')
  const metadata = JSON.parse(readFileSync(join(context.packager.projectDir, 'package.json'), 'utf8'))
  if (context.packager.config.extraMetadata?.promaReleaseChannel !== 'alpha' || !metadata.version) throw new Error('本地签名只接受明确的 Alpha 安装产物。')
  const macho = new Set(['feedface', 'feedfacf', 'cefaedfe', 'cffaedfe', 'cafebabe', 'bebafeca', 'cafebabf', 'bfbafeca'])
  await signAsync({
    app, platform: 'darwin', identity: '-', identityValidation: false,
    preAutoEntitlements: false, preEmbedProvisioningProfile: false,
    // osx-sign 的 binary 检测包含图片和归档；只签 Mach-O 和嵌套 App/Framework。
    ignore(file) {
      if (statSync(file).isDirectory()) return !/\.(?:app|framework)$/.test(file)
      const header = Buffer.alloc(4), fd = openSync(file, 'r')
      try { return readSync(fd, header, 0, 4, 0) !== 4 || !macho.has(header.toString('hex')) }
      finally { closeSync(fd) }
    },
    optionsForFile: () => ({
      entitlements: join(context.packager.projectDir, 'resources/entitlements.mac.plist'),
      hardenedRuntime: true, timestamp: 'none',
    }),
  })
  // Bun被重签后字节摘要必然改变；记录产物签名后的摘要，来源摘要保持原值。
  const runtimeRoot=join(app,'Contents/Resources/third-party/plugin-runtime');
  const sourceFile=join(runtimeRoot,'sources.json');
  if(existsSync(sourceFile)){
    const source=JSON.parse(readFileSync(sourceFile,'utf8'));
    const actual=join(runtimeRoot,process.arch==='arm64'?'darwin-arm64':'darwin-x64','bun');
    if(existsSync(actual)){
      source.packagedBinarySha256=require('node:crypto').createHash('sha256').update(readFileSync(actual)).digest('hex');
      source.packagedSignature='local-ad-hoc';writeFileSync(sourceFile,JSON.stringify(source,null,2)+'\n');
      execFileSync('/usr/bin/codesign',['--force','--sign','-','--timestamp=none','--options','runtime','--entitlements',join(context.packager.projectDir,'resources/entitlements.mac.plist'),app]);
    }
  }
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' })
  console.log('Alpha 本地 ad-hoc 签名与完整性检查通过；未使用 Developer ID 或公证。')
}
