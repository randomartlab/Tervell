import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import type { DesktopPluginEntry, DesktopPluginRuntime } from '@proma/shared';
import { writeTextFileAtomic } from './safe-file';
const nativeRequire = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
function appPath(): string {
  const value = nativeRequire('electron') as {
    app?: {
      getAppPath: () => string;
    };
  };
  return value.app?.getAppPath() ?? resolve('apps/electron');
}
interface BundledFeature {
  id: string;
  name: string;
  version: string;
  description: string;
  digest: string;
}
export function builtinFeatureDirectory(): string {
  const paths = [join(process.resourcesPath ?? '', 'default-features'), join(appPath(), 'resources/default-features'), resolve('apps/electron/resources/default-features')];
  const path = paths.find(p => existsSync(join(p, 'index.json')));
  if (!path) throw Error('缺少默认功能资源，请重新构建应用');
  return path;
}
export function builtinFeatureDefinitions(): BundledFeature[] {
  const raw = JSON.parse(readFileSync(join(builtinFeatureDirectory(), 'index.json'), 'utf8')) as {
    features: BundledFeature[];
  };
  if (!Array.isArray(raw.features) || raw.features.some(f => !/^builtin-[a-z-]+$/.test(f.id) || !/^\d+\.\d+\.\d+$/.test(f.version) || !/^[a-f0-9]{64}$/.test(f.digest))) throw Error('默认功能清单无效');
  return raw.features;
}
/** 内置功能与应用一起审核和升级；首次使用不访问市场、不执行安装脚本。 */
export function withBuiltinFeatures(entries: DesktopPluginEntry[]): DesktopPluginEntry[] {
  const definitions = builtinFeatureDefinitions();
  return [...entries.filter(e => !definitions.some(f => f.id === e.manifest.id)), ...definitions.map(f => {
    const previous = entries.find(e => e.manifest.id === f.id && e.source === 'Tervell 内置功能');
    const manifest = {
      id: f.id,
      name: f.name,
      version: f.version,
      description: f.description,
      capabilities: ['runtime'] as ['runtime'],
      runtime: {
        ecosystem: 'paseo' as const,
        bundleId: f.digest,
        serverEntry: 'builtin/server',
        clientEntry: 'builtin/client'
      }
    };
    return {
      manifest,
      digest: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
      source: 'Tervell 内置功能',
      installedAt: previous?.installedAt ?? 0,
      enabled: previous?.enabled ?? true,
      config: previous?.config,
      access: {
        workspaceIds: [],
        network: true,
        runtime: 'trusted' as const,
        allWorkspaces: true
      }
    };
  })];
}
export function compileBuiltinFeature(directory: string, runtime: DesktopPluginRuntime, resources: string): {
  server: boolean;
  client: boolean;
} | null {
  const feature = builtinFeatureDefinitions().find(f => f.id === basename(directory));
  if (!feature) return null;
  if (runtime.ecosystem !== 'paseo' || runtime.serverEntry !== 'builtin/server' || runtime.clientEntry !== 'builtin/client') throw Error('内置标识不能被外部运行时使用');
  if (runtime.bundleId !== feature.digest) throw Error('内置功能版本与应用不一致');
  const source = join(builtinFeatureDirectory(), feature.id),
    client = readFileSync(join(source, 'client.js'), 'utf8'),
    server = readFileSync(join(source, 'server.js'), 'utf8');
  if (createHash('sha256').update(client).update(server).digest('hex') !== feature.digest) throw Error('内置功能资源校验失败');
  mkdirSync(join(directory, 'compiled'), {
    recursive: true
  });
  const modules = {
    '@getpaseo/plugin': 'sdk',
    '@getpaseo/plugin/server': 'serverSdk',
    '@getpaseo/plugin/server/provider': 'providerSdk',
    '@getpaseo/plugin/server/usage': 'usageSdk',
    '@getpaseo/plugin/server/acp': 'acpSdk',
    zod: 'zod'
  };
  const header = `const core=require(${JSON.stringify(join(resources, 'paseo-core.cjs'))});const modules=${JSON.stringify(modules)};const sdk=require(${JSON.stringify(join(resources, 'paseo-sdk.cjs'))});`;
  writeTextFileAtomic(join(directory, 'compiled/client.js'), client);
  writeTextFileAtomic(join(directory, 'compiled/server.cjs'), header + 'module.exports=(' + server + ')(name=>name==="@getpaseo/plugin/server"?sdk:modules[name]?core[modules[name]]:require(name));');
  return {
    server: true,
    client: true
  };
}
