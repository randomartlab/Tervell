import { preparePaseoDependencies } from './paseo-dependencies';
import {compileBuiltinFeature} from '../builtin-features';
import { preparePaseoSource } from './preparation';
import { writeTextFileAtomic } from '../safe-file';
import { preparePluginDependencies } from './dependencies';
import type { Plugin } from 'esbuild';
import { join, resolve, dirname } from 'node:path';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { app } from 'electron';
import type { DesktopPluginRuntime } from '@proma/shared';
import { unpackedResourcePath } from '../packaged-path';
const realResource = (path: string): string => {
  const unpacked = unpackedResourcePath(path);
  return unpacked !== path && existsSync(unpacked) ? unpacked : path;
};
const nativeRequire = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
export function hostResources(): string {
  const paths = [...(!app.isPackaged ? [resolve(process.cwd(), 'apps/electron/resources/third-party/plugin-host')] : []), join(process.resourcesPath ?? '', 'third-party/plugin-host'), join(app.getAppPath(), 'resources/third-party/plugin-host'), resolve(process.cwd(), 'apps/electron/resources/third-party/plugin-host')];
  const path = paths.find(p => existsSync(join(p, 'cordis.cjs')));
  if (!path) throw new Error('缺少插件宿主组件');
  return path;
}
function pluginEsbuild(): typeof import('esbuild') {
  const resolved = realResource(nativeRequire.resolve('esbuild')),
    load = createRequire(resolved);
  let binary: string | undefined;
  try {
    binary = realResource(load.resolve('@esbuild/' + process.platform + '-' + process.arch + (process.platform === 'win32' ? '/esbuild.exe' : '/bin/esbuild')));
  } catch {/* esbuild自身会报告缺失平台二进制。 */}
  const previous = process.env.ESBUILD_BINARY_PATH;
  if (binary) process.env.ESBUILD_BINARY_PATH = binary;
  try {
    return nativeRequire(resolved) as typeof import('esbuild');
  } finally {
    if (previous === undefined) delete process.env.ESBUILD_BINARY_PATH;else process.env.ESBUILD_BINARY_PATH = previous;
  }
}
/** 按插件独立锁定生产依赖并使用原始编译器；不执行package脚本。 */
export async function compilePlugin(directory: string, runtime: DesktopPluginRuntime, trusted = false): Promise<{
  server: boolean;
  client: boolean;
}> {
  const bundled=compileBuiltinFeature(directory,runtime,hostResources());
  if(bundled)return bundled;
  const {
    build
  } = pluginEsbuild();
  const resources = hostResources(),
    source = join(directory, 'source');
  mkdirSync(join(directory, 'compiled'), {
    recursive: true
  });
  if (runtime.ecosystem === 'paseo') {
    const core = nativeRequire(join(resources, 'paseo-core.cjs')) as {
      readPluginManifest: (directory: string) => Promise<{
        id: string;
        requirements?: {
          paseo?: string;
        };
        build?: string[][];
      }>;
      assertPluginCompatibility: (input: {
        id: string;
        requirements?: {
          paseo?: string;
        };
        version: string;
        runtime: string;
      }) => void;
    };
    const manifest = await core.readPluginManifest(source);
    core.assertPluginCompatibility({
      ...manifest,
      version: '0.16.0',
      runtime: 'daemon'
    });
    if (runtime.clientEntry) core.assertPluginCompatibility({
      ...manifest,
      version: '0.16.0',
      runtime: 'app'
    });
    await preparePaseoDependencies(directory);
    await preparePaseoSource(directory, manifest, trusted);
    const previous = process.env.TERVELL_PLUGIN_REQUIRE_BASE;
    process.env.TERVELL_PLUGIN_REQUIRE_BASE = nativeRequire.resolve('esbuild');
    let compiler: {
      compilePlugin: (entry: {
        client: string | null;
        server: string | null;
      }) => Promise<{
        clientBundle: string | null;
        serverBundle: string | null;
      }>;
    };
    try {
      compiler = nativeRequire(join(resources, 'paseo-compiler.cjs')) as typeof compiler;
    } finally {
      if (previous === undefined) delete process.env.TERVELL_PLUGIN_REQUIRE_BASE;else process.env.TERVELL_PLUGIN_REQUIRE_BASE = previous;
    }
    const find = (side: 'client' | 'server') => ['ts', 'tsx', 'js', 'jsx', 'mjs'].map(ext => join(source, `index.${side}.${ext}`)).find(existsSync) ?? null;
    const client = runtime.discoverEntriesAfterBuild ? find('client') : runtime.clientEntry ? join(source, runtime.clientEntry) : null;
    const server = runtime.discoverEntriesAfterBuild ? find('server') : runtime.serverEntry ? join(source, runtime.serverEntry) : null;
    if (!client && !server) throw Error('插件准备后仍没有客户端或服务端入口');
    if (client) core.assertPluginCompatibility({
      ...manifest,
      version: '0.16.0',
      runtime: 'app'
    });
    const result = await compiler.compilePlugin({
      client,
      server
    });
    if (result.serverBundle) {
      const modules = {
        '@getpaseo/plugin': 'sdk',
        '@getpaseo/plugin/server': 'serverSdk',
        '@getpaseo/plugin/server/provider': 'providerSdk',
        '@getpaseo/plugin/server/usage': 'usageSdk',
        '@getpaseo/plugin/server/acp': 'acpSdk',
        zod: 'zod'
      };
      const header = `const core=require(${JSON.stringify(join(resources, 'paseo-core.cjs'))});const modules=${JSON.stringify(modules)};const sdk=require(${JSON.stringify(join(resources, 'paseo-sdk.cjs'))});`;
      writeTextFileAtomic(join(directory, 'compiled/server.cjs'), header + 'module.exports=(' + result.serverBundle + ')(name=>name==="@getpaseo/plugin/server"?sdk:modules[name]?core[modules[name]]:require(name));');
    }
    if (result.clientBundle) writeTextFileAtomic(join(directory, 'compiled/client.js'), result.clientBundle);
    return {
      server: !!result.serverBundle,
      client: !!result.clientBundle
    };
  }
  await preparePluginDependencies(directory);
  const sdk: Record<string, string> = {
    '@deepseek-ai/cordis': join(resources, 'cordis.cjs'),
    '@deepseek-ai/schemastery': join(resources, 'schemastery.cjs'),
    '@deepseek-ai/dsh-tools': join(resources, 'dsh-tools.cjs'),
    '@getpaseo/plugin': join(resources, 'paseo-sdk.cjs'),
    '@getpaseo/plugin/server': join(resources, 'paseo-sdk.cjs'),
    '@getpaseo/plugin/server/provider': join(resources, 'paseo-provider.cjs'),
    '@getpaseo/plugin/server/usage': join(resources, 'paseo-usage.cjs'),
    '@getpaseo/plugin/server/acp': join(resources, 'paseo-acp.cjs')
  };
  const host: Plugin = {
    name: 'tervell-host-sdk',
    setup(builder) {
      builder.onResolve({
        filter: /^(?:\.|\/)/
      }, args => {
        if (args.importer && args.importer.startsWith(source)) {
          const path = resolve(args.resolveDir, args.path);
          if (path !== source && !path.startsWith(source + '/')) throw new Error('插件源码引用越界：' + args.path);
        }
        return undefined;
      });
      builder.onResolve({
        filter: /^(?:@deepseek-ai\/|@getpaseo\/plugin|zod(?:\/.*)?$)/
      }, args => {
        if (sdk[args.path]) return {
          path: sdk[args.path]!
        };
        if (args.path.startsWith('@getpaseo/plugin')) throw new Error(`插件宿主尚未实现模块 ${args.path}`);
        // 其余包属于插件自己的依赖树，交给标准解析；不借宿主版本覆盖。
        if (args.path === 'zod' || args.path.startsWith('zod/')) return {
          path: realResource(nativeRequire.resolve(args.path))
        };
        return undefined;
      });
    }
  };
  if (runtime.serverEntry) await build({
    entryPoints: [join(source, runtime.serverEntry)],
    outfile: join(directory, 'compiled/server.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    loader: {
      '.svg': 'text'
    },
    define: {
      'import.meta.url': JSON.stringify(pathToFileURL(join(directory, 'compiled/server.cjs')).href)
    },
    plugins: [host],
    logLevel: 'silent',
    nodePaths: [dirname(realResource(nativeRequire.resolve('zod/package.json'))) + '/..']
  });
  if (runtime.clientEntry) {
    const aliases: Plugin = {
      name: 'tervell-client-host',
      setup(builder) {
        builder.onResolve({
          filter: /^(?:\.|\/)/
        }, args => {
          if (args.importer && args.importer.startsWith(source)) {
            const path = resolve(args.resolveDir, args.path);
            if (path !== source && !path.startsWith(source + '/')) throw new Error('插件客户端引用越界：' + args.path);
          }
          return undefined;
        });
        builder.onResolve({
          filter: /^(?:@tanstack\/react-query|react(?:\/.*)?|react-native(?:-web)?|react-native-unistyles|zod|@getpaseo\/plugin(?:\/.*)?|@deepseek-ai\/dsh-client-ui-primitives|lucide-react-native)$/
        }, args => ({
          path: args.path,
          namespace: 'host'
        }));
        builder.onLoad({
          filter: /.*/,
          namespace: 'host'
        }, args => ({
          contents: `module.exports=__tervellNativeRequire(${JSON.stringify(args.path)})`,
          loader: 'js'
        }));
      }
    };
    await build({
      entryPoints: [join(source, runtime.clientEntry)],
      outfile: join(directory, 'compiled/client.js'),
      bundle: true,
      platform: 'browser',
      format: 'iife',
      globalName: 'TervellPluginClient',
      jsx: 'automatic',
      loader: {
        '.svg': 'text'
      },
      banner: {
        js: '(function(__tervellNativeRequire){'
      },
      footer: {
        js: 'return TervellPluginClient;})'
      },
      target: 'chrome120',
      plugins: [aliases],
      nodePaths: [dirname(realResource(nativeRequire.resolve('zod/package.json'))) + '/..'],
      logLevel: 'silent'
    });
  }
  return {
    server: !!runtime.serverEntry,
    client: !!runtime.clientEntry
  };
}
