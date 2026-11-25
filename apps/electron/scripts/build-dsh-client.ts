import { build } from 'esbuild';
import { join, resolve } from 'node:path';
import { existsSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const repo = resolve(import.meta.dir, '../../..'),
  root = join(repo, 'apps/electron/resources/third-party/dsh-runtime'),
  output = join(repo, 'apps/electron/src/renderer/lib/third-party/paseo-client'),
  deps = process.env.TERVELL_DSH_CLIENT_MODULES ?? '/tmp/tervell-dsh-client-build/node_modules';
if (!existsSync(join(deps, 'simple-icons/package.json'))) throw Error('重建DSH界面库需要已核验原始依赖缓存，不自动安装依赖');
const modules: Record<string, string> = {
  '@deepseek-ai/cordis': 'vendor/cordis/src/index.ts',
  '@deepseek-ai/cosmokit': 'vendor/cosmokit/src/index.ts',
  '@deepseek-ai/dsh-client-store': 'packages/client/store/src/index.ts',
  '@deepseek-ai/dsh-util-workspace-path': 'packages/util/workspace-path/src/index.ts',
  '@deepseek-ai/dsh-util-code-language': 'packages/util/code-language/src/index.ts',
  '@deepseek-ai/dsh-client-ui-slots': 'packages/client/ui-slots/src/index.ts'
};
await build({
  stdin: {
    contents: `export * as primitives from ${JSON.stringify(join(root, 'packages/client/ui-primitives/src/index.ts'))};export * as slotKit from ${JSON.stringify(join(root, 'packages/client/ui-slots/src/index.ts'))};export {SlotRegistry} from ${JSON.stringify(join(root, 'packages/client/ui-renderer/src/client/registry.ts'))};export {createSlotRenderer} from ${JSON.stringify(join(root, 'packages/client/ui-renderer/src/client/scoped-slots.tsx'))};export {Context} from ${JSON.stringify(join(root, 'vendor/cordis/src/index.ts'))}`,
    resolveDir: repo,
    loader: 'ts'
  },
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'chrome120',
  jsx: 'automatic',
  outfile: join(output, 'dsh-ui.js'),
  nodePaths: [deps, '/tmp/tervell-plugin-sdk-build/node_modules', join(repo, 'node_modules')],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  banner: {
    js: "import * as __DshReact from 'react';import * as __DshReactDOM from 'react-dom';import * as __DshJSX from 'react/jsx-runtime';const require=name=>{if(name==='react')return __DshReact;if(name==='react-dom')return __DshReactDOM;if(name==='react/jsx-runtime')return __DshJSX;throw Error('DSH运行库缺少模块 '+name)};"
  },
  loader: {
    '.module.css': 'local-css',
    '.woff2': 'dataurl',
    '.woff': 'dataurl',
    '.ttf': 'dataurl'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  plugins: [{
    name: 'dsh-module-boundary',
    setup(b) {
      b.onResolve({
        filter: /^@deepseek-ai\//
      }, args => modules[args.path] ? {
        path: join(root, modules[args.path]!)
      } : undefined);
    }
  }]
});
const licenses = join(root, 'licenses');
mkdirSync(licenses, {
  recursive: true
});
for (const name of ['anser', 'immer', 'simple-icons', 'zustand']) {
  const dir = join(deps, name),
    file = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license'].find(n => existsSync(join(dir, n)));
  if (!file) throw Error('依赖缺少许可：' + name);
  copyFileSync(join(dir, file), join(licenses, name + '-LICENSE'));
}
copyFileSync(resolve(deps, '../sources.json'), join(root, 'client-dependencies.json'));
