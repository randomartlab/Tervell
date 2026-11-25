import { build } from 'esbuild';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
const repo = resolve(import.meta.dir, '../../..'),
  sources = join(repo, 'apps/electron/resources/third-party/paseo-client'),
  target = join(repo, 'apps/electron/src/renderer/lib/third-party/paseo-client');
const deps = process.env.TERVELL_PLUGIN_SOURCE_MODULES ?? join(repo, 'node_modules');
if (!existsSync(join(deps, 'react-native-web/package.json'))) throw new Error('重建插件SDK需显式设置TERVELL_PLUGIN_SOURCE_MODULES至已核验依赖源码；正常应用构建使用已归档运行库');
mkdirSync(target, {
  recursive: true
});
const sdk = join(sources, 'sdk');
await build({
  stdin: {
    contents: `export {createDeviceSettings} from ${JSON.stringify(join(sources, 'device-settings.ts'))};export {runPluginClientBundle} from ${JSON.stringify(join(sources, 'evaluate.ts'))};export * as pluginClient from ${JSON.stringify(join(sdk, 'client/index.ts'))};export * as pluginHost from ${JSON.stringify(join(sdk, 'client/host.ts'))};export * as pluginShared from ${JSON.stringify(join(sdk, 'index.ts'))};export {QueryClient,QueryClientProvider} from '@tanstack/react-query';export * as ReactNative from 'react-native-web';export {transformTimelineItem} from ${JSON.stringify(join(sources, 'timeline-model.ts'))};`,
    resolveDir: repo,
    loader: 'ts'
  },
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'chrome120',
  outfile: join(target, 'runtime.js'),
  nodePaths: [deps, join(repo, 'node_modules')],
  banner: {
    js: "import * as __PaseoReact from 'react';import * as __PaseoReactDOM from 'react-dom';import * as __PaseoJSX from 'react/jsx-runtime';const require=name=>{if(name==='react')return __PaseoReact;if(name==='react-dom')return __PaseoReactDOM;if(name==='react/jsx-runtime')return __PaseoJSX;throw Error('插件运行库缺少模块 '+name)};"
  },
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'lucide-react', '@/components/plugins/native-ui', '@/components/plugins/native-settings'],
  define: {
    'global': 'globalThis',
    'process.env.NODE_ENV': '"production"',
    '__DEV__': 'false'
  },
  plugins: [{
    name: 'paseo-host-adapters',
    setup(b) {
      b.onLoad({
        filter: /[/\\]evaluate\.ts$/
      }, args => {
        let contents = readFileSync(args.path, 'utf8');
        contents = contents.replace('from "./react-native/ui"', 'from "@/components/plugins/native-ui"').replace('from "./settings/use-settings"', 'from "@/components/plugins/native-settings"').replace('from "./icons"', 'from "@/components/plugins/native-ui"').replace('from "./themes"', 'from "@/components/plugins/native-ui"').replace('import { openExternalUrl } from "@/utils/open-external-url";', 'const openExternalUrl=(url:string)=>window.electronAPI.openExternal(url);').replace('import { useRevealedText } from "@/hooks/use-revealed-text";', 'const useRevealedText=(text:string)=>text;');
        // 宿主UI也使用SDK；旧入口的对象展开会在ESM循环初始化时读取未就绪控件。
        contents=contents.replace('const pluginReactNativeCompatRuntime = { ...pluginUiRuntime, useRevealedText };', `const pluginReactNativeCompatRuntime = new Proxy({}, {get:(_target,key)=>key==='useRevealedText'?useRevealedText:Reflect.get(pluginUiRuntime,key),ownKeys:()=>[...Reflect.ownKeys(pluginUiRuntime),'useRevealedText'],getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});`);
        return {
          contents,
          loader: 'ts',
          resolveDir: dirname(args.path)
        };
      });
      b.onResolve({
        filter: /^@getpaseo\/plugin(?:\/.*)?$/
      }, args => {
        const sub = args.path.slice('@getpaseo/plugin'.length);
        const file = sub === '' ? 'index.ts' : sub === '/client' ? 'client/index.ts' : sub === '/client/host' ? 'client/host.ts' : undefined;
        if (!file) throw Error('未识别SDK入口 ' + args.path);
        return {
          path: join(sdk, file)
        };
      });
      b.onResolve({
        filter: /^react-native$/
      }, () => ({
        path: join(deps, 'react-native-web/dist/index.js')
      }));
    }
  }],
  logLevel: 'warning'
});
console.log('Paseo 原生贡献宿主已构建');
