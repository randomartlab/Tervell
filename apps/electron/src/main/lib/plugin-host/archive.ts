import { gunzipSync } from 'node:zlib';
import { validPluginPath } from './packages';
import type { PluginPackageFiles } from './packages';
function paxFields(bytes: Buffer): Record<string, string> {
  const result: Record<string, string> = {};
  for (let offset = 0; offset < bytes.length;) {
    const space = bytes.indexOf(32, offset);
    const length = Number(bytes.subarray(offset, space).toString());
    if (space < offset || !Number.isSafeInteger(length) || length <= space - offset + 1 || offset + length > bytes.length || bytes[offset + length - 1] !== 10) throw Error('插件压缩包PAX记录无效');
    const record = bytes.subarray(space + 1, offset + length - 1).toString('utf8');
    const equals = record.indexOf('=');
    if (equals <= 0) throw Error('插件压缩包PAX字段无效');
    const key = record.slice(0, equals);
    if (key.startsWith('GNU.sparse') || key === 'SCHILY.filetype' && record.slice(equals + 1) === 'sparse') throw Error('插件压缩包不接受稀疏文件');
    Object.defineProperty(result, key, {
      value: record.slice(equals + 1),
      enumerable: true,
      configurable: true
    });
    offset += length;
  }
  return result;
}

/** 完整保留包内普通文件；体积、路径与类型检查不按文件扩展名裁剪内容。 */
export function archiveFiles(archive: Buffer): PluginPackageFiles {
  const raw = gunzipSync(archive, {
    maxOutputLength: 72 * 1024 * 1024
  });
  const files: PluginPackageFiles = new Map<string, Buffer>();
  files.executablePaths = [];
  let offset = 0,
    count = 0,
    total = 0,
    root: string | undefined;
  let globalPax: Record<string, string> = {},
    nextPax: Record<string, string> = {};
  let longPath: string | undefined;
  while (offset + 512 <= raw.length) {
    const header = raw.subarray(offset, offset + 512);
    if (header.every(value => value === 0)) break;
    const text = (from: number, to: number) => header.subarray(from, to).toString('utf8').replace(/\0.*$/s, '');
    const octal = (from: number, to: number) => {
      const value = text(from, to).trim();
      if (!/^[0-7]*$/.test(value)) throw Error('插件压缩包数字字段无效');
      return parseInt(value || '0', 8);
    };
    const checksum = header.reduce((sum, value, index) => sum + (index >= 148 && index < 156 ? 32 : value), 0);
    if (checksum !== octal(148, 156)) throw Error('插件压缩包校验失败');
    const size = octal(124, 136),
      type = text(156, 157);
    if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > raw.length || ++count > 14000) throw Error('插件压缩包无效或文件过多');
    const bytes = raw.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === 'x') {
      nextPax = paxFields(bytes);
      continue;
    }
    if (type === 'g') {
      globalPax = {
        ...globalPax,
        ...paxFields(bytes)
      };
      continue;
    }
    if (type === 'L') {
      longPath = bytes.toString('utf8').replace(/\0.*$/s, '').replace(/\n$/, '');
      continue;
    }
    const attributes = {
      ...globalPax,
      ...nextPax
    };
    const prefix = text(345, 500);
    const path = (attributes.path ?? longPath ?? (prefix ? prefix + '/' : '') + text(0, 100)).replace(/^\.\//, '');
    nextPax = {};
    longPath = undefined;
    if (attributes.size !== undefined && Number(attributes.size) !== size) throw Error('插件压缩包PAX大小不一致');
    const normalized = type === '5' ? path.replace(/\/+$/, '') : path;
    if (!validPluginPath(normalized)) throw Error('插件压缩包路径无效');
    const parts = normalized.split('/');
    root ??= parts[0];
    if (parts[0] !== root) throw Error('插件压缩包必须使用同一根目录');
    if (type === '5') continue;
    if (type !== '' && type !== '0') throw Error('插件压缩包包含不支持的文件类型：' + type);
    const relative = parts.slice(1).join('/');
    if (!validPluginPath(relative) || files.has(relative)) throw Error('插件压缩包文件路径无效或重复');
    total += size;
    if (size > 8 * 1024 * 1024 || total > 64 * 1024 * 1024 || files.size >= 7000) throw Error('插件内容超过允许大小');
    files.set(relative, Buffer.from(bytes));
    if (octal(100, 108) & 0o111) files.executablePaths!.push(relative);
  }
  if (!files.size) throw Error('插件压缩包没有普通文件');
  return files;
}
