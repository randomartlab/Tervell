/** 按Electron公开Fuse协议关闭生产调试注入，保留插件运行所需RunAsNode。 */
const fs = require('fs');
const path = require('path');
const SENTINEL = Buffer.from([100, 76, 55, 112, 75, 71, 100, 110, 78, 122, 55, 57, 54, 80, 98, 98, 106, 81, 87, 78, 75, 109, 72, 88, 66, 90, 97, 66, 57, 116, 115, 88]);
const required = { 2: 0x30, 3: 0x30, 4: 0x31, 5: 0x31 };
function fuseFile(application, platform) {
  return platform === 'darwin' ? path.join(application, 'Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework') : path.join(application, 'Tervell Alpha.exe');
}
function inspect(file, apply = false) {
  const data = fs.readFileSync(file), entries = [];
  for (let at = data.indexOf(SENTINEL); at >= 0; at = data.indexOf(SENTINEL, at + SENTINEL.length)) {
    const start = at + SENTINEL.length, version = data[start], length = data[start + 1];
    if (version !== 1 || length < 6 || start + 2 + length > data.length) throw Error('不支持的Electron Fuse结构');
    for (const [key, value] of Object.entries(required)) {
      const position = start + 2 + Number(key);
      if (data[position] === 0x72) throw Error('目标Electron Fuse已移除：' + key);
      if (apply) data[position] = value;
      else if (data[position] !== value) throw Error('Electron加固未生效：' + key);
    }
    entries.push({ offset: at, version, states: [...data.subarray(start + 2, start + 2 + length)] });
  }
  if (!entries.length || entries.length > 2) throw Error('Electron Fuse定位异常');
  if (apply) fs.writeFileSync(file, data);
  return entries;
}
module.exports = { hardenElectron(application, platform) { const file = fuseFile(application, platform); inspect(file, true); return inspect(file); }, inspectHardenedElectron(application, platform) { return inspect(fuseFile(application, platform)); } };
