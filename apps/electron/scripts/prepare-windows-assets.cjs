/** 只下载固定版本的Windows目标组件到独立缓存，校验后解压；不执行安装脚本。 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const Zip = require('adm-zip');
const tar = require('tar');
const manifest = require('./windows-assets.json');
const cache = process.env.TERVELL_WINDOWS_BUILD_CACHE || path.join(os.homedir(), '.cache/tervell/windows-build');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function acquire(item, filename) {
  const file = path.join(cache, filename);
  if (fs.existsSync(file) && digest(fs.readFileSync(file)) === item.sha256) return file;
  const response = await fetch(item.url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw Error('Windows组件下载失败: ' + item.url + ' / ' + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (digest(bytes) !== item.sha256) throw Error('Windows组件摘要不符: ' + filename);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', bytes);
  fs.renameSync(file + '.tmp', file);
  return file;
}
function extractZip(file, directory) {
  const zip = new Zip(file);
  for (const entry of zip.getEntries()) {
    const dest = path.resolve(directory, entry.entryName);
    if (!dest.startsWith(path.resolve(directory) + path.sep)) throw Error('Windows压缩包路径越界');
  }
  zip.extractAllTo(directory, true);
}
async function main() {
  fs.mkdirSync(cache, { recursive: true });
  await Promise.all(manifest.assets.map(async item => {
    const file = await acquire(item, item.file);
    if (item.id === 'electron') extractZip(file, path.join(cache, 'electron-win32-x64'));
    if (item.id === 'bun') {
      const source = require('../resources/third-party/plugin-runtime/win32-x64/sources.json');
      const bytes = new Zip(file).getEntry('bun-windows-x64/bun.exe').getData();
      if (digest(bytes) !== source.binarySha256) throw Error('Windows Bun二进制摘要不符');
      const target = path.join(__dirname, '../resources/third-party/plugin-runtime/win32-x64/bun.exe');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
  }));
  await Promise.all(manifest.nativePackages.map(async item => {
    const file = await acquire(item, 'archives/' + item.name.replace('/', '__') + '__' + item.version + '.tgz');
    const [algorithm, expected] = item.integrity.split('-');
    if (crypto.createHash(algorithm).update(fs.readFileSync(file)).digest('base64') !== expected) throw Error('依赖SRI不符: ' + item.name);
    const directory = path.join(cache, 'native-packages', item.name.replace('/', '__') + '__' + item.version);
    fs.rmSync(directory, { recursive: true, force: true });
    fs.mkdirSync(directory, { recursive: true });
    await tar.x({ file, cwd: directory, strip: 1, preservePaths: false, filter: (name, entry) => !['SymbolicLink', 'Link'].includes(entry.type) && !name.split('/').includes('..') });
  }));
  console.log('Windows固定组件与原生依赖已校验，缓存：' + cache);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
