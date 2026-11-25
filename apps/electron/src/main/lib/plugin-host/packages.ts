import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, lstatSync, writeFileSync, existsSync, rmSync, chmodSync } from 'node:fs';
import { join, resolve, relative, dirname, isAbsolute } from 'node:path';
import { getConfigDir } from '../config-paths';
import { writeTextFileAtomic, writeJsonFileAtomic } from '../safe-file';
import type { DesktopPluginRuntime } from '@proma/shared';
const stageRoot = () => join(getConfigDir(), 'plugin-packages');
const MAX_BYTES = 64 * 1024 * 1024;
export function validPluginPath(name: string): boolean {
  return !!name && !isAbsolute(name) && !name.includes('\\') && !name.includes('\0') && name.split('/').every(part => !!part && part !== '.' && part !== '..');
}
export interface PluginPackageFiles extends Map<string, Buffer> {
  executablePaths?: string[];
}
function bundleHash(files: PluginPackageFiles): string {
  const hash = createHash('sha256');
  for (const [name, bytes] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    hash.update(name + '\0' + bytes.length + '\0');
    hash.update(bytes);
  }
  if (files.executablePaths?.length) hash.update('\0executable-paths\0' + JSON.stringify([...files.executablePaths].sort()));
  return hash.digest('hex');
}
export function stagePluginFiles(files: PluginPackageFiles, ecosystem: 'paseo' | 'dsh'): DesktopPluginRuntime {
  let total = 0;
  if (files.size > 7000) throw new Error('插件文件数量超过上限');
  for (const [name, bytes] of files) {
    if (!validPluginPath(name)) throw new Error('插件文件路径无效');
    total += bytes.length;
    if (bytes.length > 8 * 1024 * 1024 || total > MAX_BYTES) throw new Error('插件内容超过允许大小');
  }
  if (files.executablePaths?.some(path => !validPluginPath(path) || !files.has(path))) throw Error('插件执行文件路径无效');
  const bundleId = bundleHash(files),
    directory = join(stageRoot(), bundleId, 'files');
  for (const [name, bytes] of files) {
    const path = join(directory, name);
    mkdirSync(dirname(path), {
      recursive: true
    });
    writeTextFileAtomic(path, bytes.toString('base64'));
  }
  writeJsonFileAtomic(join(stageRoot(), bundleId, 'index.json'), {
    files: [...files.keys()],
    executablePaths: files.executablePaths ?? []
  });
  const pkg = JSON.parse(files.get('package.json')?.toString('utf8') ?? '{}') as {
    main?: string;
    exports?: Record<string, unknown>;
  };
  const exp = (value: unknown): string | undefined => typeof value === 'string' ? value : value && typeof value === 'object' ? exp((value as Record<string, unknown>).default ?? (value as Record<string, unknown>).import) : undefined;
  const serverEntry = ecosystem === 'paseo' ? ['index.server.ts', 'index.server.tsx', 'index.server.js', 'index.server.jsx', 'index.server.mjs'].find(n => files.has(n)) : (exp(pkg.exports?.['.']) ?? pkg.main ?? 'lib/index.js').replace(/^\.\//, '');
  const clientEntry = ecosystem === 'paseo' ? ['index.client.tsx', 'index.client.ts', 'index.client.js', 'index.client.jsx'].find(n => files.has(n)) : exp(pkg.exports?.['./client'])?.replace(/^\.\//, '');
  const manifest = ecosystem === 'paseo' && files.has('paseo-plugin.json') ? JSON.parse(files.get('paseo-plugin.json')!.toString('utf8')) as {
    build?: unknown[];
  } : undefined;
  const discoverEntriesAfterBuild = ecosystem === 'paseo' && !!manifest?.build?.length;
  if (!(serverEntry && files.has(serverEntry)) && !(clientEntry && files.has(clientEntry)) && !discoverEntriesAfterBuild) throw new Error('插件没有可执行入口');
  return {
    ecosystem,
    bundleId,
    ...(serverEntry && files.has(serverEntry) ? {
      serverEntry
    } : {}),
    ...(clientEntry && files.has(clientEntry) ? {
      clientEntry
    } : {}),
    ...(discoverEntriesAfterBuild ? {
      discoverEntriesAfterBuild: true
    } : {})
  };
}
export function materializePlugin(runtime: DesktopPluginRuntime, id: string): string {
  if (!/^[a-f0-9]{64}$/.test(runtime.bundleId)) throw new Error('插件包校验值无效');
  const source = join(stageRoot(), runtime.bundleId),
    index = JSON.parse(readFileSync(join(source, 'index.json'), 'utf8')) as {
      files: unknown;
      executablePaths?: unknown;
    },
    files: PluginPackageFiles = new Map<string, Buffer>();
  if (!Array.isArray(index.files) || index.files.length > 7000) throw new Error('插件文件索引无效');
  const indexedFiles = index.files;
  if (index.executablePaths !== undefined && (!Array.isArray(index.executablePaths) || index.executablePaths.some(path => typeof path !== 'string' || !validPluginPath(path) || !indexedFiles.includes(path)))) throw Error('插件执行权限索引无效');
  files.executablePaths = index.executablePaths as string[] | undefined;
  let total = 0;
  for (const name of index.files) {
    if (typeof name !== 'string' || !validPluginPath(name) || files.has(name)) throw new Error('插件路径越界或重复');
    const bytes = Buffer.from(readFileSync(join(source, 'files', name), 'utf8'), 'base64');
    total += bytes.length;
    if (bytes.length > 8 * 1024 * 1024 || total > MAX_BYTES) throw new Error('插件内容超过上限');
    files.set(name, bytes);
  }
  if (bundleHash(files) !== runtime.bundleId) throw new Error('插件原包已变化，请重新预览');
  for (const path of [runtime.serverEntry, runtime.clientEntry]) if (path && (!validPluginPath(path) || !files.has(path))) throw new Error('插件入口无效');
  const target = pluginDirectory(id),
    dest = join(target, 'source');
  if (existsSync(dest) && lstatSync(dest).isSymbolicLink()) throw new Error('插件目录不能为链接');
  rmSync(dest, {
    recursive: true,
    force: true
  });
  // source已被替换，旧成功标记不再证明新目录完成过依赖安装或准备。
  for(const name of ['preparation.json','dependency-install.json'])rmSync(join(target,name),{force:true});
  mkdirSync(dest, {
    recursive: true
  });
  for (const [name, bytes] of files) {
    const path = join(dest, name);
    mkdirSync(dirname(path), {
      recursive: true
    });
    writeFileSync(path, bytes);
    if (files.executablePaths?.includes(name)) chmodSync(path, 0o755);
  }
  return target;
}
export function pluginDirectory(id: string): string {
  if (!/^[a-z0-9-]{1,64}$/.test(id)) throw new Error('插件标识无效');
  return join(getConfigDir(), 'plugins', id);
}
export function localPluginFiles(path: string): PluginPackageFiles {
  const files: PluginPackageFiles = new Map<string, Buffer>();
  files.executablePaths = [];
  let total = 0;
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, {
      withFileTypes: true
    })) {
      if (entry.isSymbolicLink() || ['node_modules', '.git'].includes(entry.name)) continue;
      const p = join(directory, entry.name);
      if (entry.isDirectory()) visit(p);else if (entry.isFile()) {
        const stat = lstatSync(p),
          size = stat.size;
        total += size;
        if (size > 8 * 1024 * 1024 || total > MAX_BYTES || files.size >= 7000) throw new Error('插件目录超过允许大小');
        const name = relative(path, p).split('\\').join('/');
        files.set(name, readFileSync(p));
        if (stat.mode & 0o111) files.executablePaths!.push(name);
      }
    }
  };
  visit(path);
  return files;
}
