/** 固定源码在构建时编译；首次启动不下载依赖、不运行插件安装脚本。 */
import { build } from 'esbuild';
import type { Plugin } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
const repo = resolve(import.meta.dir, '../../..');
const source = join(repo, 'apps/electron/resources/third-party/default-features');
const target = join(repo, 'apps/electron/resources/default-features');
const hostModules = ['@getpaseo/plugin', '@getpaseo/plugin/server', '@getpaseo/plugin/server/provider', '@getpaseo/plugin/server/usage', '@getpaseo/plugin/server/acp', 'zod'];
const clientModules = ['@getpaseo/plugin', '@getpaseo/plugin/client', '@getpaseo/plugin/client/ui', '@getpaseo/plugin/client/react-native', 'react', 'react/jsx-runtime', 'react-native', '@tanstack/react-query', 'zod'];
const features = [{
  id: 'builtin-conversation-export',
  folder: 'exporter',
  name: '会话导出',
  version: '0.1.1',
  description: '完整会话的 Markdown / JSON、预览、复制、保存及项目默认值。'
}, {
  id: 'builtin-better-conversation',
  folder: 'better-paseo',
  name: 'Better Conversation',
  version: '1.6.4',
  description: '增强时间线、任务看板、详情、查找及阅读设置。'
}, {id:'builtin-vivid-activity',folder:'vivid-activity',name:'Vivid Activity · 彩色活动',version:'0.11.1',description:'彩色实时推理、工具详情、步骤计时与过程折叠。'}] as const;
const rows = [];
for (const feature of features) {
  const directory = join(source, feature.folder),
    out = join(target, feature.id);
  mkdirSync(out, {
    recursive: true
  });
  for (const side of ['client', 'server'] as const) {
    const adapters: Plugin = {
      name: 'tervell-builtin-adapters',
      setup(b) {
        b.onResolve({filter:/^@getpaseo\/protocol\/tool-name-normalization$/},()=>({path:join(repo,'apps/electron/resources/third-party/paseo-runtime/protocol/tool-name-normalization.ts')}));
        b.onResolve({
          filter: /^remend$/
        }, () => ({
          path: join(source, 'dependencies/remend/dist/index.js')
        }));
        b.onLoad({
          filter: /\.[jt]sx?$/
        }, args => {
          if (!args.path.startsWith(directory + (process.platform === 'win32' ? '\\' : '/'))) return;
          let text = readFileSync(args.path, 'utf8');
          const file = relative(directory, args.path).split('\\').join('/');
          if (feature.folder === 'better-paseo') {
            if(file==='index.client.tsx')text=text.replace('const removeTimelineLevelControl = installTimelineLevelControl(client);','const removeTimelineLevelControl = () => {};');
            for (const [original, replacement] of [
              ['当前 Paseo 主机', '当前 Tervell 主机'], ['跟随 Paseo', '跟随 Tervell'],
              ['Paseo 跟随系统', 'Tervell 跟随系统'], ['使用 Paseo 里设置的语言', '使用 Tervell 里设置的语言'],
              ['关闭后整个聊天交给 Paseo 和其他插件', '关闭后使用 Tervell 原生聊天与其他插件'],
            ]) text = text.replaceAll(original!, replacement!);
            if(file==='client/tasks/board/sidebar-model.ts')text=text.replace('inlineFrom: 1020','inlineFrom: 1580').replace('floatBelow: 996','floatBelow: 1556');
            if(file==='client/tasks/board/navigation.ts'){
              text=text.replace('const { laneWidth } = laneLayout(boardWidth, Math.max(1, activeExpanded), activeCollapsed, size);','const available=Math.max(220,viewport);const fit=(available-2*LANES.edge-Math.max(0,order.length-1)*LANES.gap-order.filter(id=>collapsed.includes(id)).length*LANES.collapsed)/Math.max(1,order.filter(id=>!collapsed.includes(id)).length);const {laneWidth:preferred}=laneLayout(available,Math.max(1,activeExpanded),activeCollapsed,size);const laneWidth=size==="default"&&fit>=LANES.narrow?Math.min(LANES.max,fit):preferred;');
            }
            if (file === 'server/tasks/provider-subagents.ts') {
              const start = text.indexOf('export function hasHostDaemon()'),
                end = text.indexOf('/** The daemon\'s `listen`', start);
              text = text.slice(0, start) + `export function hasHostDaemon():boolean{return true;}\nexport async function connectHostDaemon(_clientId?:string):Promise<HostDaemon|null>{return (globalThis as unknown as {__tervellBuiltinHost:{daemon:HostDaemon}}).__tervellBuiltinHost.daemon;}\n` + text.slice(end);
            }
            if (file === 'server/tasks/register.ts') {
              const start = text.indexOf('function resolveCli()'),
                end = text.indexOf('function isCliStopOutput', start);
              text = text.slice(0, start) + `function resolveCli():Promise<CliCommand|null>{return Promise.resolve({command:'tervell-native',args:[]});}\nfunction runCli(_cli:CliCommand,args:string[],_timeout:number){return (globalThis as unknown as {__tervellBuiltinHost:{cli:(args:string[])=>Promise<{stdout:string}>}}).__tervellBuiltinHost.cli(args);}\n` + text.slice(end);
            }
            if (file === 'shared/timeline-translation.ts') text = text.replace('enabled: z.boolean().catch(false)', 'enabled: z.boolean().catch(true)');
            if (file === 'server/tasks/title-generation.ts') text = text.replace('config: { provider: `${provider}/${model}`, systemPrompt: SYSTEM_PROMPT,', 'config: { provider: `${provider}/${model}`, systemPrompt: SYSTEM_PROMPT, ...(provider==="pi"?{toolPolicy:{preapproved:[],toolFree:true}}:{}),');
            if (file === 'server/tasks/session-tokens.ts') text = `export function createSessionTokenReader(){return {read:(agent:{id:string})=>(globalThis as unknown as {__tervellBuiltinHost:{tokens:(id:string)=>Promise<{total:number;cached:number}|null>}}).__tervellBuiltinHost.tokens(agent.id)}};export type SessionTokenReader=ReturnType<typeof createSessionTokenReader>;`;
            if (file === 'server/agent-updates.ts') text = text.replace(
              'Object.assign(result, parseAgentDiagnostic(diagnostic.diagnostic));',
              `Object.assign(result, parseAgentDiagnostic(diagnostic.diagnostic));
              if (entry.provider === "pi" && diagnostic.diagnostic.includes("Managed by: Tervell application update")) {
                Object.assign(result, {method:"native",status:"reference",latest:result.current,issue:null,updateAvailable:false,releasePackage:null,command:null});
                state={...state,entries:[...state.entries.filter(row=>row.provider!==result.provider),result]};return;
              }`,
            );
            if (file === 'client/settings-page.tsx') text = text
              .replace('const status = statuses[entry.status].replace', 'const status = (entry.provider === "pi" && entry.method === "native" ? "随 Tervell 应用更新" : statuses[entry.status]).replace')
              .replace('const executable = entry.server ?', 'const executable = entry.provider === "pi" && entry.method === "native" ? "Tervell 内置 Pi" : entry.server ?');
            if (file === 'index.server.ts') text = text.replace('const stopAutomaticUpdateCheck = startAutomaticUpdateCheck(preferences, checkUpdate);', 'const stopAutomaticUpdateCheck = () => {};').replace('server.handle(updateCheckRpc, ({ action }) => checkUpdate(action));', 'server.handle(updateCheckRpc, () => ({state:"local" as const}));');
          }
          if (feature.folder === 'vivid-activity') {
            if(file==='index.client.tsx')text=`import React from 'react';import {NativeActivitySettings} from '@getpaseo/plugin/client/ui';export default function contribute(client){return client.addSettingsScreen({id:'display',title:'彩色活动与过程显示',icon:'Activity',Component:NativeActivitySettings});}`;

            if(file==='client/activity.tsx') {
              text='import {useActivityPreferences} from "@getpaseo/plugin/client/ui";\n'+text;
              text=text.replace('const settings = useSettings(activitySettings);\n  if (settings.status === "ready") return settings.values.expansion[target] ?? DEFAULT_EXPANSION[target];','const policy=useActivityPreferences()[target==="thinking"?"reasoning":"operations"];\n  const settings = useSettings(activitySettings);\n  if(policy==="expanded")return "always";if(policy==="collapsed")return "never";\n  if (settings.status === "ready") return settings.values.expansion[target] ?? DEFAULT_EXPANSION[target];');
            }
            // 宿主按真实 turn 分组并保留动作栏；不让插件的全局文本键跨会话折叠内容。
            if(file==='shared/settings.ts')text=text.replace('enabled: parsed.data.fold, scope: parsed.data.takeover','enabled: false, scope: parsed.data.takeover');
            if(file==='server/provider-base.ts')text=text.replace('const read = options.read ?? (() => readDaemonConfig());','const read = options.read ?? (async () => null);');
          }
          if (feature.folder === 'exporter') {
            text=text.replaceAll('Paseo Exports', 'Tervell Exports');
            if(file==='client/export-panel.tsx'){
              text=text.replace('const [raw, setRaw] = useState(false);','const [browseError,setBrowseError]=useState("");const [raw, setRaw] = useState(false);');
              text=text.replace('width: props.layout.compact ? "100%" : 360','width: "100%", minWidth: 0');
              const start=text.indexOf('{destination === "custom" && <TextInput');
              const end=text.indexOf(' />}',start);
              if(start<0||end<0)throw Error('导出目录控件定位失败');
              text=text.slice(0,start)+`{destination === "custom" && <View style={{gap:8}}>{action("浏览文件夹…",()=>{void (globalThis as unknown as {electronAPI:{builtinFeatureCall:(operation:string,input?:unknown)=>Promise<unknown>}}).electronAPI.builtinFeatureCall("export.choose-directory").then(value=>{if(typeof value==="string"){setDirectory(value);reset();}}).catch(error=>{setBrowseError(String(error));});})}<Text selectable style={{...text,fontSize:12}}>{directory||"尚未选择文件夹"}</Text>{browseError&&<Text accessibilityRole="alert" style={text}>{browseError}</Text>}</View>}`+text.slice(end+4);
              for(const [a,b]of [['Export conversation','导出会话'],['Host folder','默认导出文件夹'],['Session folder','会话文件夹'],['Custom folder','选择文件夹'],['Clipboard','剪贴板'],['Save to','保存到'],['Format','格式'],['Full panel ↗','完整预览 ↗'],['"Reasoning"','"推理"'],['"Tools"','"工具"'],['"Timestamps"','"时间戳"']])text=text.replaceAll(a!,b!);
            }
          }
          return {
            contents: text,
            loader: args.path.endsWith('tsx') ? 'tsx' : 'ts',
            resolveDir: dirname(args.path)
          };
        });
      }
    };
    const result = await build({
      entryPoints: [join(directory, `index.${side}.${side === 'client' ? 'tsx' : 'ts'}`)],
      bundle: true,
      write: false,
      platform: side === 'client' ? 'browser' : 'node',
      format: 'cjs',
      target: side === 'client' ? 'chrome120' : 'node22',
      jsx: 'automatic',
      external: side === 'client' ? clientModules : hostModules,
      nodePaths: [join(repo, 'node_modules')],
      plugins: [adapters],
      loader: {
        '.svg': 'text', '.txt':'text'
      },
      legalComments: 'inline',
      logLevel: 'warning'
    });
    const code = result.outputFiles[0]!.text;
    const factory = `(function(require){const module={exports:{}};const exports=module.exports;${code}\nreturn module.exports;})`;
    writeFileSync(join(out, side + '.js'), factory);
  }
  const digest = createHash('sha256').update(readFileSync(join(out, 'client.js'))).update(readFileSync(join(out, 'server.js'))).digest('hex');
  rows.push({
    ...feature,
    digest
  });
  console.log('已编译内置能力', feature.name, digest.slice(0, 12));
}
mkdirSync(target, {
  recursive: true
});
writeFileSync(join(target, 'index.json'), JSON.stringify({
  version: 1,
  features: rows
}, null, 2) + '\n');
