import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
const repo = resolve(import.meta.dir, '../../..'),
  root = join(repo, 'apps/electron/resources/third-party/paseo-runtime'),
  output = join(repo, 'apps/electron/resources/third-party/plugin-host');
const connectionModules = join(root,'dependencies/connection');
const connectionSources=JSON.parse(readFileSync(join(root,'connection-dependencies.json'),'utf8')) as Array<{name:string;version:string}>;
for(const dependency of connectionSources){const manifest=JSON.parse(readFileSync(join(connectionModules,dependency.name,'package.json'),'utf8'));if(manifest.version!==dependency.version)throw Error('插件连接依赖源码版本不符：'+dependency.name);}
const entry = (file: string) => JSON.stringify(join(root, file));
await build({
  stdin: {
    contents: `export {readPluginManifest} from ${entry('packages/server/src/server/plugins/manifest.ts')};export {assertPluginCompatibility} from ${entry('packages/protocol/src/plugin-requirements.ts')};export {MutableDaemonConfigSchema,MutableDaemonConfigPatchSchema,AgentSnapshotPayloadSchema,WorkspaceDescriptorPayloadSchema,FetchAgentTimelineResponseMessageSchema,ListProviderModelsResponseMessageSchema,ListProviderModesResponseMessageSchema,ProviderControlsListResponseMessageSchema} from ${entry('packages/protocol/src/messages.ts')};export {PluginSettingsStore} from ${entry('packages/server/src/server/plugins/settings/index.ts')};export {PluginHookHandlers} from ${entry('packages/server/src/server/plugins/lifecycle/index.ts')};export {PluginAgentTools} from ${entry('packages/server/src/server/plugins/agent-tools.ts')};export {PluginSubscriptionHandlers} from ${entry('packages/server/src/server/plugins/subscription-handlers.ts')};export {assertPluginWireValue} from ${entry('packages/protocol/src/binary-frames/plugin.ts')};export * as zod from 'zod';export * as sdk from ${entry('packages/plugin/src/index.ts')};export * as serverSdk from ${entry('packages/plugin/src/server/index.ts')};export * as providerSdk from ${entry('packages/plugin/src/server/provider.ts')};export * as usageSdk from ${entry('packages/plugin/src/server/usage.ts')};export * as acpSdk from ${entry('packages/plugin/src/server/acp.ts')};`,
    resolveDir: repo,
    loader: 'ts'
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: join(output, 'paseo-core.cjs'),
  nodePaths: [connectionModules,join(repo, 'node_modules')],
  plugins: [sourceResolver()]
});
for (const browser of [false, true]) await build({
  entryPoints: [join(root, 'packages/client/src/index.ts')],
  bundle: true,
  platform: browser ? 'browser' : 'node',
  format: browser ? 'esm' : 'cjs',
  target: 'es2022',
  outfile: browser ? join(repo, 'apps/electron/src/renderer/lib/third-party/paseo-client/api.js') : join(output, 'paseo-api.cjs'),
  nodePaths: [connectionModules,join(repo, 'node_modules')],
  plugins: [sourceResolver()],
  treeShaking: true
});
await build({
  stdin:{contents:`export {ConnectedHosts,HostError} from ${entry('packages/server/src/server/connected-hosts/index.ts')};export {DAEMON_PERMISSIONS} from ${entry('packages/protocol/src/messages.ts')};`,resolveDir:repo,loader:'ts'},
  bundle:true,platform:'node',format:'cjs',target:'node22',outfile:join(output,'paseo-connections.cjs'),
  nodePaths:[connectionModules,join(repo,'node_modules')],plugins:[sourceResolver()]
});
await build({
  entryPoints: [join(root, 'packages/server/src/server/plugins/compiler-build.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: join(output, 'paseo-compiler.cjs'),
  banner: {
    js: 'require=require("node:module").createRequire(process.env.TERVELL_PLUGIN_REQUIRE_BASE||__filename);'
  },
  nodePaths: [connectionModules,join(repo, 'node_modules')],
  external: ['esbuild', 'typescript', 'semver', 'semver/*'],
  plugins: [sourceResolver(), {
    name: 'native-require',
    setup(b) {
      b.onLoad({
        filter: /compiler-(?:build|esbuild|imports)\.ts$/
      }, args => ({
        contents: readFileSync(args.path, 'utf8').replace('createRequire(import.meta.url)', "createRequire(process.env.TERVELL_PLUGIN_REQUIRE_BASE || __filename)").replace('return nodeRequire("esbuild") as typeof import("esbuild");', 'return nodeRequire(nodeRequire.resolve("esbuild").replace(/app\\.asar(?=[\\\\/])/, "app.asar.unpacked")) as typeof import("esbuild");').replace('const eager = makeHermesInteropEager(output);', 'const eager = output; // Tervell 在 V8 执行，保留 live binding，避免箭头 default 导出在初始化前被读成 undefined。'),
        loader: 'ts',
        resolveDir: dirname(args.path)
      }));
    }
  }]
});
function sourceResolver(): import('esbuild').Plugin {
  return {
    name: 'paseo-local-transport',
    setup(b) {
      b.onLoad({filter:/packages[\\/]protocol[\\/]src[\\/]messages\.ts$/},args=>({contents:readFileSync(args.path,'utf8').replace('preapproved: z.array(McpToolRefSchema),','preapproved: z.array(McpToolRefSchema),toolFree:z.boolean().optional(),').replace('export const AgentSnapshotPayloadSchema = z.object({','export const AgentSnapshotPayloadSchema = z.object({toolFree:z.boolean().optional(),').replace('export const ProviderSnapshotEntrySchema = z.object({','export const ProviderSnapshotEntrySchema = z.object({supportsToolFree:z.boolean().optional(),'),loader:'ts',resolveDir:dirname(args.path)}));
      b.onLoad({filter:/packages[\\/]client[\\/]src[\\/]index\.ts$/},args=>({contents:readFileSync(args.path,'utf8').replace('agents: {\n      list: listAgents,','agents: {\n      supportsToolFree: () => daemonClient.getLastServerInfoMessage()?.features?.toolFreeAgents === true,\n      list: listAgents,').replace('      get address() {','      get toolFree() { return (current as unknown as {toolFree?:boolean})?.toolFree===true; },\n      get address() {'),loader:'ts',resolveDir:dirname(args.path)}));
      b.onResolve({filter:/\/validation\/ws-outbound$/},()=>({path:'validation',namespace:'upstream-schema'}));
      b.onLoad({filter:/.*/,namespace:'upstream-schema'},()=>({contents:`import {WSOutboundMessageSchema} from ${entry('packages/protocol/src/messages.ts')};export const validateWSOutboundMessage=(value)=>WSOutboundMessageSchema.safeParse(value);`,loader:'ts',resolveDir:root}));
      b.onResolve({filter:/^\.\.\/network\/index\.js$/},args=>args.importer.replaceAll('\\','/').includes('/connected-hosts/')?{path:'network',namespace:'tervell-network'}:undefined);
      b.onLoad({filter:/.*/,namespace:'tervell-network'},()=>({contents:`import {HttpsProxyAgent} from 'https-proxy-agent';export const webSocketProxyAgent=url=>{const value=new URL(url),proxy=value.protocol==='wss:'?process.env.HTTPS_PROXY:process.env.HTTP_PROXY;return proxy?new HttpsProxyAgent(proxy):undefined};`,loader:'js',resolveDir:repo}));
      b.onResolve({
        filter: /^@agentclientprotocol\/sdk$/
      }, () => ({
        path: join(root, 'dependencies/agentclientprotocol-sdk/dist/acp.js')
      }));
      b.onResolve({
        filter: /^@getpaseo\//
      }, args => {
        const m = args.path.match(/^@getpaseo\/([^/]+)(?:\/(.*))?$/);
        if (!m) return;
        let sub = m[2] ?? 'index';
        if (m[1] === 'client' && sub.startsWith('internal/')) sub=sub.slice(9);
        if(m[1]==='client'&&sub==='node')sub='node/index';
        if (m[1] === 'plugin' && sub === 'internal/lifecycle') sub = 'server/lifecycle';
        return {
          path: join(root, 'packages', m[1]!, 'src', sub + '.ts')
        };
      });
    }
  };
}
await build({
  stdin: {
    contents: 'export {createLocalPaseoDriver} from "./paseo-driver.cjs"',
    resolveDir: output,
    loader: "js"
  },
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  outfile: join(repo, 'apps/electron/src/renderer/lib/third-party/paseo-client/driver.js')
});
