/** CI 从固定源码和本仓补丁原生构建，不依赖开发电脑的 vendor 文件。 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const tar = require('tar');
const repo = path.resolve(__dirname, '../../..');
const metadata = require('../resources/third-party/model-gateway-patches/build.json');
const cache = process.env.TERVELL_WINDOWS_BUILD_CACHE || path.join(os.homedir(), '.cache/tervell/windows-build');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function run(file, args, cwd) {
  const result = cp.spawnSync(file, args, { cwd, stdio: 'inherit', env: { ...process.env, CGO_ENABLED: '0', GOOS: 'windows', GOARCH: 'amd64', GOTOOLCHAIN: 'local' } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`${file} failed (${result.status})`);
}
async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('本入口必须在 Windows x64 Runner 原生运行');
  const version = cp.execFileSync('go', ['version'], { encoding: 'utf8' });
  if (!version.includes(metadata.go + ' ')) throw Error('Go toolchain version mismatch: ' + version);
  fs.mkdirSync(cache, { recursive: true });
  const target = path.join(repo, 'vendor/model-gateway/win32-x64/magpie.exe');
  const verifiedCache = path.join(cache, 'magpie-verified.exe');
  if (fs.existsSync(verifiedCache) && hash(fs.readFileSync(verifiedCache)) === metadata.binarySha256['win32-x64']) {
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(verifiedCache, target);
    console.log('复用已在原生 Windows 编译并通过固定摘要校验的网关缓存'); return;
  }
  const archive = path.join(cache, 'gateway-source.tar.gz');
  if (!fs.existsSync(archive) || hash(fs.readFileSync(archive)) !== metadata.archiveSha256) {
    const response = await fetch(`https://codeload.github.com/yetone/magpie/tar.gz/${metadata.commit}`, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw Error('Gateway source download failed: ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (hash(bytes) !== metadata.archiveSha256) throw Error('Gateway source checksum mismatch');
    fs.writeFileSync(archive, bytes);
  }
  const source = path.join(cache, 'gateway-source');
  fs.rmSync(source, { recursive: true, force: true }); fs.mkdirSync(source);
  await tar.x({ file: archive, cwd: source, strip: 1, preservePaths: false,
    filter: (name, entry) => !['SymbolicLink', 'Link'].includes(entry.type) && !name.split('/').includes('..') });
  const patch = path.join(__dirname, '../resources/third-party/model-gateway-patches', metadata.patch);
  if (hash(fs.readFileSync(patch)) !== metadata.patchSha256) throw Error('Gateway patch checksum mismatch');
  run('git', ['apply', '--check', patch], source); run('git', ['apply', patch], source);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  run('go', ['build', '-tags', 'nogui', '-trimpath', '-buildvcs=false', '-ldflags', `-s -w -X main.version=${metadata.version}`, '-o', target, '.'], source);
  run('go', ['mod', 'verify'], source);
  const actual = hash(fs.readFileSync(target));
  if (actual !== metadata.binarySha256['win32-x64']) throw Error('Native gateway binary differs from pinned build: ' + actual);
  fs.copyFileSync(target, verifiedCache);
  console.log(JSON.stringify({ sourceCommit: metadata.commit, go: version.trim(), sha256: actual, nativeWindowsBuild: true }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
