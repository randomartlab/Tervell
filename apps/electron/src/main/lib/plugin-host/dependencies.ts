import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, lstatSync, rmSync, symlinkSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { writeJsonFileAtomic, writeBytesFileAtomic } from '../safe-file';
const require = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
const semver = require('semver') as {
  maxSatisfying: (versions: string[], range: string) => string | null;
  validRange: (range: string) => string | null;
};
const hostModules = new Set(['@getpaseo/plugin', '@getpaseo/client', '@getpaseo/protocol', 'react', 'react-dom', 'react-native', 'react-native-web', 'react-native-unistyles', '@tanstack/react-query', 'zod', '@deepseek-ai/cordis', '@deepseek-ai/schemastery', '@deepseek-ai/dsh-tools']);
export interface DependencyRequest {
  (url: string): Promise<Response>;
}
interface PackageInfo {
  name: string;
  version: string;
  dist: {
    tarball: string;
    integrity: string;
  };
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bin?: string | Record<string, string>;
  peerDependencies?: Record<string, string>;
  os?: string[];
  cpu?: string[];
}
interface LockEntry {
  name: string;
  version: string;
  url: string;
  integrity: string;
  dependencies: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bin?: string | Record<string, string>;
}
interface Lock {
  version: 1;
  declarations: string;
  requests: Record<string, string>;
  packages: Record<string, LockEntry>;
}
export const platformAllows = (list: string[] | undefined, value: string): boolean => !list || !list.includes('!' + value) && (!list.some(x => !x.startsWith('!')) || list.includes(value) || list.includes('any'));
const nameOK = (name: string) => /^(?:@[a-zA-Z0-9_.-]+\/)?[a-zA-Z0-9_.-]+$/.test(name) && !name.split('/').some(p => p === '.' || p === '..');
export function dependencyArchive(bytes: Buffer): Map<string, Buffer> {
  const raw = gunzipSync(bytes, {
      maxOutputLength: 64 * 1024 * 1024
    }),
    files = new Map<string, Buffer>();
  let count = 0,
    paxPath: string | undefined,
    longPath: string | undefined;
  for (let at = 0; at + 512 <= raw.length;) {
    const h = raw.subarray(at, at + 512);
    if (h.every(v => v === 0)) break;
    const text = (a: number, b: number) => h.subarray(a, b).toString('utf8').replace(/\0.*$/s, ''),
      size = parseInt(text(124, 136).trim() || '0', 8),
      type = text(156, 157);
    if (!Number.isSafeInteger(size) || size < 0 || at + 512 + size > raw.length || ++count > 15000) throw Error('依赖压缩包超限或已损坏');
    const expected = parseInt(text(148, 156).trim() || '0', 8),
      sum = h.reduce((n, x, i) => n + (i >= 148 && i < 156 ? 32 : x), 0);
    if (sum !== expected) throw Error('依赖压缩包校验失败');
    const data = raw.subarray(at + 512, at + 512 + size);
    let full = paxPath ?? longPath ?? (text(345, 500) ? text(345, 500) + '/' : '') + text(0, 100);
    if (type === 'x') {
      for (const line of data.toString('utf8').split('\n')) {
        const m = line.match(/^\d+ path=(.+)$/);
        if (m) paxPath = m[1];
      }
    } else if (type === 'L') longPath = data.toString('utf8').replace(/\0.*$/s, '').trimEnd();else {
      paxPath = undefined;
      longPath = undefined;
      if (type === '1' || type === '2') throw Error('依赖发行包包含链接，拒绝越界风险');
      if (type === '' || type === '0') {
        if (full.startsWith('/') || full.includes('\\') || full.split('/').some(p => p === '..' || p === '')) throw Error('依赖压缩包路径无效');
        full = full.split('/').slice(1).join('/');
        if (!full || files.has(full) || size > 16 * 1024 * 1024) throw Error('依赖文件重复或过大');
        files.set(full, Buffer.from(data));
      }
    }
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}
/** 仅为用户选择的插件解析生产依赖。独立目录、固定版本/SRI，不执行任何package脚本。 */
export async function preparePluginDependencies(directory: string, request: DependencyRequest = url => fetch(url, {
  redirect: 'error',
  signal: AbortSignal.timeout(30000)
})): Promise<void> {
  const source = join(directory, 'source'),
    manifest = join(source, 'package.json');
  if (!existsSync(manifest)) return;
  const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as {
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };
  const declarations = JSON.stringify([pkg.dependencies ?? {}, pkg.optionalDependencies ?? {}]),
    lockPath = join(directory, 'dependency-lock.json');
  const saved = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) as Lock : undefined;
  if (saved && (!saved.requests || !saved.packages || saved.version !== 1)) throw Error('插件依赖锁文件损坏，未覆盖原文件');
  const lock: Lock = saved?.version === 1 && saved.declarations === declarations ? saved : {
    version: 1,
    declarations,
    requests: {},
    packages: {}
  };
  const completed = new Map<string, string>();
  let downloads = 0,
    total = 0;
  const fetchBytes = async (url: string, max: number) => {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.hostname !== 'registry.npmjs.org' || u.username || u.password) throw Error('依赖必须来自npm官方HTTPS源');
    const response = await request(url);
    if (!response.ok) throw Error('依赖下载失败：' + response.status);
    if (Number(response.headers.get('content-length')) > max) throw Error('依赖超过大小限制');
    if (!response.body) return Buffer.alloc(0);
    const chunks: Buffer[] = [];
    let length = 0;
    const reader = response.body.getReader();
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        length += next.value.length;
        if (length > max) {
          await reader.cancel();
          throw Error('依赖超过大小限制');
        }
        chunks.push(Buffer.from(next.value));
      }
    } finally {
      reader.releaseLock();
    }
    return Buffer.concat(chunks, length);
  };
  const link = (owner: string, name: string, target: string) => {
    const path = join(owner, 'node_modules', name);
    mkdirSync(dirname(path), {
      recursive: true
    });
    if (existsSync(path) || (() => {
      try {
        return lstatSync(path).isSymbolicLink();
      } catch {
        return false;
      }
    })()) {
      if (lstatSync(path).isSymbolicLink() && resolve(dirname(path), readlink(path)) === target) return;
      rmSync(path, {
        recursive: true,
        force: true
      });
    }
    symlinkSync(target, path, 'dir');
  };
  const install = async (name: string, range: string, owner: string, ancestry = new Set<string>()): Promise<void> => {
    if (hostModules.has(name) && owner === source) return;
    if (name === 'react' || name === 'react-dom' || name.startsWith('@getpaseo/')) return;
    if (!nameOK(name) || !semver.validRange(range)) throw Error(`插件依赖 ${name}@${range} 不是可校验npm版本范围`);
    const key = name + '@' + range;
    let id = lock.requests[key],
      entry = id ? lock.packages[id] : undefined;
    if (!entry) {
      if (++downloads > 256) throw Error('插件依赖数量超过256');
      const metadata = JSON.parse((await fetchBytes('https://registry.npmjs.org/' + encodeURIComponent(name), 12 * 1024 * 1024)).toString('utf8')) as {
        versions: Record<string, PackageInfo>;
      };
      const version = semver.maxSatisfying(Object.keys(metadata.versions ?? {}), range);
      if (!version) throw Error(`无法解析插件依赖 ${name}@${range}`);
      const info = metadata.versions[version]!;
      if (!platformAllows(info.os, process.platform) || !platformAllows(info.cpu, process.arch)) throw Error(`插件依赖 ${name} 不支持当前系统/架构`);
      if (!info.dist?.integrity?.startsWith('sha512-')) throw Error(`插件依赖 ${name} 缺少SHA-512 integrity`);
      id = name + '@' + version;
      entry = {
        name,
        version,
        url: info.dist.tarball,
        integrity: info.dist.integrity,
        dependencies: info.dependencies ?? {},
        optionalDependencies: info.optionalDependencies ?? {},
        bin: info.bin
      };
      lock.requests[key] = id;
      lock.packages[id] = entry;
    }
    const target = join(directory, 'dependencies', createHash('sha256').update(id!).digest('hex').slice(0, 24));
    if (completed.has(id!)) {
      link(owner, name, target);
      return;
    }
    const stamp = join(target, '.tervell-integrity');
    if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== entry.integrity) {
      const archive = await fetchBytes(entry.url, 32 * 1024 * 1024);
      if ('sha512-' + createHash('sha512').update(archive).digest('base64') !== entry.integrity) throw Error(`插件依赖 ${name} integrity不匹配`);
      const files = dependencyArchive(archive);
      total += [...files.values()].reduce((n, b) => n + b.length, 0);
      if (total > 128 * 1024 * 1024) throw Error('插件依赖总大小超过128MB');
      rmSync(target, {
        recursive: true,
        force: true
      });
      mkdirSync(target, {
        recursive: true
      });
      for (const [relative, bytes] of files) {
        const path = join(target, relative);
        mkdirSync(dirname(path), {
          recursive: true
        });
        writeBytesFileAtomic(path, bytes);
      }
      writeBytesFileAtomic(stamp, Buffer.from(entry.integrity));
    }
    completed.set(id!, target);
    link(owner, name, target);
    const bins = typeof entry.bin === 'string' ? {
      [name.split('/').at(-1)!]: entry.bin
    } : entry.bin ?? {};
    for (const [binName, file] of Object.entries(bins)) {
      if (!/^[a-zA-Z0-9._-]+$/.test(binName) || file.startsWith('/') || file.split('/').includes('..')) throw Error('依赖bin路径无效');
      const binary = resolve(target, file);
      if (!existsSync(binary)) throw Error('依赖bin文件缺失：' + binName);
      chmodSync(binary, 0o755);
      const linkPath = join(owner, 'node_modules/.bin', binName);
      mkdirSync(dirname(linkPath), {
        recursive: true
      });
      rmSync(linkPath, {
        force: true
      });
      symlinkSync(binary, linkPath);
    }
    if (ancestry.has(id!)) return;
    const next = new Set(ancestry).add(id!);
    for (const [child, version] of Object.entries(entry.dependencies)) if (!Object.hasOwn(entry.optionalDependencies ?? {}, child)) await install(child, version, target, next);
    for (const [child, version] of Object.entries(entry.optionalDependencies ?? {})) try {
      await install(child, version, target, next);
    } catch (error) {
      console.warn('[插件可选依赖]', child, String(error));
    }
  };
  for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
    if (Object.hasOwn(pkg.optionalDependencies ?? {}, name)) continue;
    await install(name, range, source);
    const id = lock.requests[name + '@' + range];
    if (id && completed.has(id)) link(directory, name, completed.get(id)!);
  }
  // optional依赖在不支持平台或网络不可达时保持可选，但不得影响必需依赖。
  for (const [name, range] of Object.entries(pkg.optionalDependencies ?? {})) try {
    await install(name, range, source);
  } catch (error) {
    console.warn('[插件可选依赖]', name, String(error));
  }
  writeJsonFileAtomic(lockPath, lock);
}
import { readlinkSync as readlink } from 'node:fs';
