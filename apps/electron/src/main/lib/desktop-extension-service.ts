import {kernelRouteLaunchArgs} from './kernel-routing-adapters'
import {routedApprovalDefault}from'@proma/auth-bridge'
import {cliInstallPlan,cliInstallUnavailable} from './desktop-cli-install-plan'
import {readManagedCli} from './desktop-cli-managed'
import {registryAgent} from '@proma/kernel-host'
import {listAgentWorkspaces} from './agent-workspace-manager'
import {withBuiltinFeatures} from './builtin-features'
import {paseoProviderDefaults} from './plugin-host/config'
import {pluginProviderDescriptors,pluginProviderDescriptor} from './plugin-host/registry'
import {readThemePackage} from './theme-package'
import {presetFromValue} from './theme-static-reader'
import {createHash,randomUUID} from 'node:crypto'
import { prepareRoutedKernel } from './model-routing-service'
import { openKernelWithAuthenticationFallback } from './kernel-auth-fallback'
import {KernelProbeQueue}from'./desktop-kernel-probe-queue'
import {closeSessionGateway}from'./model-routing-proxy'
import {stagePluginFiles,materializePlugin,localPluginFiles,pluginDirectory} from './plugin-host/packages'
import {pluginStatusSnapshot} from './plugin-host/status'
import {isReasoningControl,primaryKernelControl,isKernelModelDependency} from '@proma/shared'
import{verifiedThemeSource}from'./desktop-theme-source'
import {verifiedMarketOffer} from './desktop-plugin-market'
import {previewThemePath} from './desktop-theme-import'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, isAbsolute, join } from 'node:path'
import { sessionControls, acpDialect, AcpKernel, KernelRegistry, DESKTOP_REFERENCE_CATALOG } from '@proma/kernel-host'
import type { DesktopKernelConfig, DesktopKernelEntry, DesktopKernelState, DesktopKernelCatalog, DesktopPluginEntry, DesktopPluginOffer, DesktopPluginState } from '@proma/shared'
import { executableCandidates, checkCommand, loginShellPath, mapLimited } from './desktop-cli-discovery'
import { cliProcessEnvironment } from './desktop-cli-environment'
import { cliManagedDirectories } from './desktop-cli-recipes'
import { getConfigDir } from './config-paths'
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file'
import { DesktopKernelConfigSchema, DesktopPluginSchema, DesktopExtensionConfigSchema, pluginDigest, BUILTIN_PLUGIN_CATALOG } from './desktop-extension-config'
interface ExtensionConfig {version:1; defaultKernelId:string; kernels:DesktopKernelConfig[]; plugins:DesktopPluginEntry[];selectedThemeId?:string|null}
const configPath=()=>join(getConfigDir(),'desktop-extensions.json')
function read():ExtensionConfig {
 const path=configPath(), value=readJsonFileSafe<unknown>(path)
 if(value===null){if(existsSync(path))throw new Error('内核与插件配置无法读取，请恢复备份；未覆盖原文件');return {version:1,defaultKernelId:'pi',kernels:[],plugins:withBuiltinFeatures([])}}
 const parsed=DesktopExtensionConfigSchema.safeParse(value)
 if(!parsed.success)throw new Error('内核与插件配置结构无效，请检查配置或恢复备份；未覆盖原文件')
 if(parsed.data.plugins.some(plugin=>pluginDigest(plugin.manifest)!==plugin.digest))throw new Error('插件内容与已确认的校验值不符，请重新安装插件')
 return {...parsed.data,plugins:withBuiltinFeatures(parsed.data.plugins)}
}
function write(value:ExtensionConfig):void {writeJsonFileAtomic(configPath(),value)}
interface Detection { signature: string; command?: string; version?: string; cliAvailable: boolean; diagnostic?: string }
const detections = new Map<string, Detection>()
const kernelListeners = new Set<(state: DesktopKernelState) => void>()
let refreshFlight: Promise<DesktopKernelState> | undefined
let checkedAt = 0
let pathWarning: string | undefined
let hydratedPath = ''
export function desktopCliPath(): string {
 const managed = cliManagedDirectories(getConfigDir())
 return [...new Set([managed.runtimeBin, managed.bin, ...hydratedPath.split(delimiter), ...(process.env.PATH??'').split(delimiter), join(homedir(),'.local/bin'), join(homedir(),'.bun/bin'), join(homedir(),'.kimi/bin'), join(homedir(),'.kimi-code/bin'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'])].join(delimiter)
}
export function desktopCliEnvironment(): Record<string,string> { return cliProcessEnvironment(desktopCliPath()) }
export function desktopKernelEnvironment(id:string):Record<string,string>{const def=new KernelRegistry().get(id),managed=readManagedCli(id),base=desktopCliEnvironment();return {...def?.acp?.env,...base,...managed?.env,...(id==='cline'?{CLINE_SESSION_BACKEND_MODE:'local',CLINE_NO_AUTO_UPDATE:'1'}:{}),...(id==='gemini'&&process.platform==='win32'?{GEMINI_PTY_INFO:'child_process'}:{}),PATH:managed?.env.PATH?[managed.env.PATH,base.PATH].join(delimiter):base.PATH!}}
export function resolveDesktopCommand(command:string):string|undefined { return executableCandidates(command,desktopCliPath())[0] }
function kernelSignature(entry:DesktopKernelConfig):string { return JSON.stringify([getConfigDir(),entry.command,entry.args]) }
export function desktopKernelState():DesktopKernelState {
 const config=read(),custom=new Map(config.kernels.map(k=>[k.id,k]));const entries:DesktopKernelEntry[]=[{id:'pi',name:'Pi（内置）',command:'',args:[],enabled:true,builtin:true,available:true,detected:'installed'}]
 const defs=new KernelRegistry().list()
 const append=(entry:DesktopKernelConfig,builtin:boolean,cli:string,pluginId?:string):void=>{
  const storedManaged=readManagedCli(entry.id),official=registryAgent(entry.id),plan=cliInstallPlan(entry.id);
  const def=defs.find(d=>d.id===entry.id),reference=DESKTOP_REFERENCE_CATALOG.find(d=>d.id===entry.id);
  const known=builtin&&entry.command===((def?.acp?def.acp.command??def.cli:def?.pty?.command??cli)),managed=known?storedManaged:undefined;
  const detection=detections.get(entry.id),matched=detection?.signature===kernelSignature(entry),command=managed?.command??(matched?detection.command:resolveDesktopCommand(entry.command));
  const cliAvailable=managed?.cliSelfContained?true:matched?detection.cliAvailable:!!resolveDesktopCommand(cli)
  const available=!!command&&cliAvailable&&!reference?.hostRequirement
  entries.push({...entry,builtin,available,transport:def?.acp?'acp':def?.pty?'pty':'acp',description:reference?.description,homepage:official?.website??official?.repository??reference?.homepage,catalogSources:reference?.sources,hostRequirement:reference?.hostRequirement,resolvedCommand:command,...(managed?{launchArgs:managed.args,managed:true,version:managed.installedVersion,verification:managed.verification}:{}),pluginId,cliAvailable,adapterAvailable:!!command,
   detected:reference?.hostRequirement?'custom':managed?'installed':matched?(available?'installed':command?'broken':'missing'):known?'checking':'custom',version:managed?.installedVersion??(matched?detection.version:undefined),
   diagnostic:reference?.hostRequirement??(matched?detection.diagnostic:undefined),installable:!reference?.hostRequirement&&builtin&&!!plan,installDiagnostic:cliInstallUnavailable(entry.id),source:builtin?plan?.source:undefined})
 }
 for(const provider of pluginProviderDescriptors()){if(provider.requiresConfiguration&&paseoProviderDefaults(provider.id).enabled!==true)continue;if(paseoProviderDefaults(provider.id).enabled===false)continue;if(entries.some(p=>p.id===provider.id))continue;entries.push({id:provider.id,name:provider.label,description:provider.description,command:provider.command?.[0]??'plugin-provider',args:provider.command?.slice(1)??[],enabled:true,builtin:false,available:true,transport:'native',detected:'installed',pluginId:provider.pluginId})}
 for(const def of defs){if(['deepseek','opencode2','kilocode'].includes(def.id)&&!custom.has(def.id))continue;const saved=custom.get(def.id);const entry=saved??{id:def.id,name:def.name,command:(def.acp?def.acp.command??def.cli:def.pty?.command??def.cli),args:def.acp?.args??def.pty?.args??[],enabled:false};append(entry,true,saved&&saved.command!==((def.acp?def.acp.command??def.cli:def.pty?.command??def.cli))?saved.command:def.cli);custom.delete(def.id)}
 for(const entry of custom.values())append(entry,false,entry.command)
 for(const plugin of config.plugins.filter(p=>p.enabled))for(const entry of plugin.manifest.kernels??[]){if(entries.some(e=>e.id===entry.id))continue;append(entry,false,entry.command,plugin.manifest.id)}
 return {entries,defaultKernelId:config.defaultKernelId,refreshing:!!refreshFlight,checkedAt:checkedAt||undefined,warning:pathWarning}
}
export function onDesktopKernelsChanged(listener:(state:DesktopKernelState)=>void):()=>void {kernelListeners.add(listener);return()=>kernelListeners.delete(listener)}
export function publishPluginKernelChange():void{publish()}
function publish():DesktopKernelState {const state=desktopKernelState();for(const listener of kernelListeners)listener(state);return state}
/** 每轮使用配置签名复核；配置在探测期间变更时，迟到结果不能覆盖。 */
export function refreshDesktopKernels():Promise<DesktopKernelState> {
 if(refreshFlight)return refreshFlight
 const work=async():Promise<DesktopKernelState>=>{
  const env=await loginShellPath(desktopCliPath());hydratedPath=env.path;pathWarning=env.warning
  const entries=desktopKernelState().entries.filter(e=>e.id!=='pi'),defs=new KernelRegistry()
  await mapLimited(entries,1,async entry=>{
   if(entry.hostRequirement||entry.transport==='native'||readManagedCli(entry.id))return
   const def=defs.get(entry.id),known=entry.builtin&&entry.command===((def?.acp?def.acp.command??def.cli:def?.pty?.command??def?.cli))
   const adapter=await checkCommand(entry.command,desktopCliPath(),false,2000,desktopCliEnvironment())
   const cli=known&&def?.cli!==entry.command?await checkCommand(def!.cli,desktopCliPath(),false,2000,desktopCliEnvironment()):adapter
   const latest=read().kernels.find(e=>e.id===entry.id),current=latest??entry
   if(kernelSignature(current)===kernelSignature(entry))detections.set(entry.id,{signature:kernelSignature(entry),command:adapter.path,version:cli.version??adapter.version,cliAvailable:!!cli.path,diagnostic:!cli.path?'CLI 尚未安装或无法运行':!adapter.path?'需要安装 ACP 适配器':undefined})
  })
  checkedAt=Date.now();return desktopKernelState()
 }
 refreshFlight=work().then(()=>{refreshFlight=undefined;return publish()},error=>{refreshFlight=undefined;publish();throw error});publish();return refreshFlight
}
export function saveDesktopKernel(raw:DesktopKernelConfig):DesktopKernelState {const value=DesktopKernelConfigSchema.parse(raw);if(value.id==='pi')throw new Error('不能覆盖内置 Pi');const config=read();if(config.plugins.some(p=>p.enabled&&p.manifest.kernels?.some(k=>k.id===value.id)))throw new Error('请先停用提供此内核的插件');config.kernels=[...config.kernels.filter(k=>k.id!==value.id),value];write(config);return publish()}
export function removeDesktopKernel(id:string):DesktopKernelState {if(id==='pi')throw new Error('不能移除内置 Pi');const config=read();config.kernels=config.kernels.filter(k=>k.id!==id);if(config.defaultKernelId===id)config.defaultKernelId='pi';write(config);return publish()}
export function requireDesktopKernel(id:string):DesktopKernelEntry {const entry=desktopKernelState().entries.find(e=>e.id===id);if(entry?.transport==='pty')throw new Error('该程序仅支持终端，请点击打开终端；不能作为ACP对话内核。');if(!entry||!entry.enabled||!entry.available)throw new Error('内核未配置、已停用或命令不可用，请到设置 → Agent 内核检查');return entry}
export function setDesktopDefaultKernel(id:string):DesktopKernelState {requireDesktopKernel(id);const config=read();config.defaultKernelId=id;write(config);return publish()}
const kernelProbeQueue=new KernelProbeQueue()
export function probeDesktopKernel(id:string,cwd:string,selection:import('@proma/shared').KernelSessionSelection={},apply=false):Promise<DesktopKernelCatalog> {
 const key=JSON.stringify([getConfigDir(),id,cwd,selection,apply])
 return kernelProbeQueue.run(key,()=>probeDesktopKernelNow(id,cwd,selection,apply))
}
async function probeDesktopKernelNow(id:string,cwd:string,selection:import('@proma/shared').KernelSessionSelection,apply:boolean):Promise<DesktopKernelCatalog> {
 const entry=desktopKernelState().entries.find(e=>e.id===id);if(pluginProviderDescriptor(id)){const {probePluginProvider}=await import('./plugin-host/provider-kernel');return probePluginProvider(id,cwd,selection)}if(entry?.transport==='pty')throw new Error('此条目使用终端协议，不是ACP');if(!entry?.resolvedCommand)throw new Error('CLI 尚未就绪，请点击一键安装或修复。')
 const dialectId:Record<string,string>={grok:'grok',claude:'claude-code',codex:'codex',gemini:'gemini-cli',cursor:'cursor-agent',omp:'omp',opencode2:'opencode-2'}
 const scope='probe_'+randomUUID()
 const opened=await openKernelWithAuthenticationFallback({kernelId:id,base:desktopKernelEnvironment(id),scope,open:async route=>{
  const kernel=new AcpKernel(id,{...(dialectId[id]?{dialect:acpDialect(dialectId[id]!)}:{}),command:entry.resolvedCommand!,args:kernelRouteLaunchArgs(entry.id,entry.launchArgs??entry.args,route.env),inheritEnv:false,env:route.env,timeoutMs:45000})
  const handle=await kernel.createSession({sessionId:scope,cwd,systemPrompt:''})
  try{await kernel.modelCatalog(handle);return {kernel,handle}}catch(error){await kernel.close(handle);throw error}
 }})
 const {kernel,handle}=opened.value,route=opened.route
 try{
  await kernel.modelCatalog(handle)
  const approvalDefault=routedApprovalDefault(id,!!route.model,selection.modeId,primaryKernelControl(sessionControls(kernel.sessionMetadata(handle)),'mode')?.options?.map(o=>o.value)??[])
  if(approvalDefault)await kernel.configureSession(handle,{modeId:approvalDefault})
  // 新探测进程必须先应用已选模型，才能获得该模型动态公布的全部配置。
  if(apply||selection.modelId||selection.modeId||Object.keys(selection.configValues??{}).length){
   const managed=route.model?sessionControls(kernel.sessionMetadata(handle)).filter(control=>isReasoningControl(control)||isKernelModelDependency(control,sessionControls(kernel.sessionMetadata(handle)))||control.id===primaryKernelControl(sessionControls(kernel.sessionMetadata(handle)),'model')?.id).map(control=>control.id):[]
   await kernel.configureSession(handle,{modelId:route.model?undefined:selection.modelId,modeId:selection.modeId,configValues:Object.fromEntries(Object.entries(selection.configValues??{}).filter(([id])=>!managed.includes(id)))})
  }
  const catalog=await kernel.modelCatalog(handle),meta=kernel.sessionMetadata(handle),controls=sessionControls(meta)
  if(catalog.models.length&&!primaryKernelControl(controls,'model'))controls.unshift({id:'model',name:'模型',type:'select',category:'model',method:'model',currentValue:catalog.currentModelId??undefined,options:catalog.models.map(m=>({value:m.id,name:m.name}))})
  const mode=primaryKernelControl(controls,'mode')
  return {...catalog,controls,modes:(mode?.options??[]).map(o=>({id:String(o.value),name:o.name})),currentModeId:typeof mode?.currentValue==='string'?mode.currentValue:null,kernelId:id,observedAt:Date.now(),...(route.model?{routedModel:route.model}:{}),...(opened.notice?{notice:opened.notice}:{})}
 }finally{await kernel.close(handle);closeSessionGateway(scope)}
}
function effectivePluginEntry(entry:DesktopPluginEntry):DesktopPluginEntry{return entry.access?.runtime==='trusted'&&entry.access.allWorkspaces?{...entry,access:{...entry.access,workspaceIds:listAgentWorkspaces().map(w=>w.id)}}:entry}
export function readDesktopPluginEntries():DesktopPluginEntry[]{return read().plugins.map(effectivePluginEntry)}
const runtimeThemes=new Map<string,import('@proma/shared').DesktopThemePreset[]>()
export function registerRuntimePluginThemes(id:string,raw:unknown[]):DesktopPluginState{if(!read().plugins.some(p=>p.enabled&&p.manifest.id===id&&p.manifest.runtime))throw new Error('插件未启用');if(raw.length>128||Buffer.byteLength(JSON.stringify(raw))>512000)throw new Error('插件主题数据过大');runtimeThemes.set(id,raw.flatMap(value=>presetFromValue(value,id)));return publishPlugins()}
export function desktopPluginState():DesktopPluginState{const config=read();return {selectedThemeId:config.selectedThemeId??null,installed:config.plugins.map(effectivePluginEntry).map(p=>p.enabled&&runtimeThemes.has(p.manifest.id)?{...p,manifest:{...p.manifest,themes:[...new Map([...(p.manifest.themes??[]),...runtimeThemes.get(p.manifest.id)!].map(t=>[t.id,t])).values()]}}:p),runtime:pluginStatusSnapshot(),catalog:BUILTIN_PLUGIN_CATALOG.map(manifest=>({manifest,source:'Tervell 内置目录',digest:pluginDigest(manifest)}))}}
export function previewDesktopPlugin(path:string):DesktopPluginOffer {
 if(!isAbsolute(path))throw new Error('请选择本地插件目录或绝对路径')
 if(existsSync(join(path,'paseo-plugin.json'))||existsSync(join(path,'package.json'))){
  const files=localPluginFiles(path),pkg=JSON.parse(files.get('package.json')?.toString('utf8')??'{}'),paseo=files.get('paseo-plugin.json'),ecosystem=paseo?'paseo':'dsh'
  const runtime=stagePluginFiles(files,ecosystem),metadata=JSON.parse(paseo?.toString('utf8')??'{}'),id='local-'+createHash('sha256').update(path).digest('hex').slice(0,20)
  const themes=readThemePackage(files);const manifest={id,name:String(metadata.name??metadata.id??pkg.name??id).slice(0,100),version:/^\d+\.\d+\.\d+$/.test(pkg.version)?pkg.version:'0.0.0',description:String(metadata.description??pkg.description??'本地运行时插件').slice(0,2000),capabilities:[...(['runtime'] as const),...(themes.length?['theme' as const]:[])],runtime,...(themes.length?{themes}:{})}
  return {manifest,source:path,digest:pluginDigest(manifest)}
 }
 const file=path.endsWith('.json')?path:join(path,'tervell-plugin.json')
 if(!existsSync(file))return previewThemePath(path)
 const bytes=readFileSync(file);if(bytes.length>1024*1024)throw new Error('插件清单超过 1 MB')
 const raw:unknown=JSON.parse(bytes.toString('utf8'));const parsed=DesktopPluginSchema.safeParse(raw);if(!parsed.success)return previewThemePath(path);const manifest=parsed.data;return {manifest,digest:pluginDigest(manifest),source:file}
}
export function installDesktopPlugin(offer:DesktopPluginOffer):DesktopPluginState {
 const manifest=DesktopPluginSchema.parse(offer.manifest);if(pluginDigest(manifest)!==offer.digest)throw new Error('插件内容已变更，请重新预览')
 if(manifest.id.startsWith('builtin-'))throw new Error('内置功能标识由应用保留，外部插件不能覆盖')
 if(!(verifiedThemeSource(offer)||verifiedMarketOffer(offer)||offer.source==='Tervell 内置目录'&&BUILTIN_PLUGIN_CATALOG.some(m=>pluginDigest(m)===offer.digest))){const current=previewDesktopPlugin(offer.source);if(current.digest!==offer.digest)throw new Error('来源已修改，请重新确认权限')}
 const config=read();if(config.plugins.some(p=>p.manifest.id===manifest.id))throw new Error('同名插件已安装，请先移除旧版')
 if(manifest.runtime)materializePlugin(manifest.runtime,manifest.id)
 config.plugins.push({manifest,source:offer.source,digest:offer.digest,enabled:false,installedAt:Date.now()});write(config);return publishPlugins()
}
export function toggleDesktopPlugin(id:string,enabled:boolean,quiet=false):DesktopPluginState {
 const config=read(),plugin=config.plugins.find(p=>p.manifest.id===id);if(!plugin)throw new Error('插件不存在')
 if(enabled){for(const k of plugin.manifest.kernels??[])if(desktopKernelState().entries.some(e=>e.id===k.id&&e.pluginId!==id))throw new Error('插件内核标识与现有内核冲突');if(plugin.manifest.theme&&config.plugins.some(p=>p.enabled&&p.manifest.id!==id&&p.manifest.theme))throw new Error('请先停用其它强调色插件')}
 if(!enabled&&config.selectedThemeId?.startsWith(id+'/'))config.selectedThemeId=null;plugin.enabled=enabled;write(config);if(!quiet&&!enabled&&plugin.manifest.runtime)void import('./plugin-host/runtime').then(r=>r.syncPluginHosts()).catch(error=>console.warn('[插件同步]',String(error)));return publishPlugins()
}
export function removeDesktopPlugin(id:string):DesktopPluginState {if(id.startsWith('builtin-'))return toggleDesktopPlugin(id,false);runtimeThemes.delete(id);void import('./plugin-host/runtime').then(r=>r.stopPluginHost(id)).catch(error=>console.warn('[插件卸载]',String(error)));const config=read();config.plugins=config.plugins.filter(p=>p.manifest.id!==id);if(config.selectedThemeId?.startsWith(id+'/'))config.selectedThemeId=null;write(config);return publishPlugins()}

const pluginListeners=new Set<(state:DesktopPluginState)=>void>()
export function onDesktopPluginsChanged(listener:(state:DesktopPluginState)=>void):()=>void{pluginListeners.add(listener);return()=>pluginListeners.delete(listener)}
function publishPlugins():DesktopPluginState{const state=desktopPluginState();for(const listener of pluginListeners)listener(state);return state}
export async function activateDesktopPlugin(id:string,enabled:boolean):Promise<DesktopPluginState>{
 const {syncPluginHosts,stopPluginHost,ensurePluginHost}=await import('./plugin-host/runtime');
 if(!enabled){toggleDesktopPlugin(id,false);await stopPluginHost(id);await syncPluginHosts();return publishPlugins()}
 // 上次失败的进程必须在重试前回收；持久化仍保留原来源、授权及插件设置。
 await stopPluginHost(id);toggleDesktopPlugin(id,true);
 try{const entry=read().plugins.find(e=>e.manifest.id===id);if(entry?.manifest.runtime)await ensurePluginHost(entry);await syncPluginHosts();return publishPlugins()}
 catch(error){toggleDesktopPlugin(id,false,true);await stopPluginHost(id,true);throw error}
}
export function configureDesktopPlugin(id:string,values:{config?:Record<string,unknown>;access?:{workspaceIds:string[];network:boolean;cli?:string[];runtime?:'restricted'|'trusted';allWorkspaces?:boolean}}):DesktopPluginState{const value=read(),entry=value.plugins.find(p=>p.manifest.id===id);if(!entry)throw new Error('插件不存在');if(entry.enabled)throw new Error('修改项目授权或设置前请先停用插件');if(values.config)entry.config=values.config;if(values.access){if(values.access.allWorkspaces&&values.access.runtime!=='trusted')throw Error('全宿主授权需要标准受信任模式');entry.access=values.access;}write(value);return publishPlugins()}
export function selectDesktopTheme(id:string|null):DesktopPluginState{
 const config=read()
 if(id!==null&&!desktopPluginState().installed.some(p=>p.enabled&&p.manifest.themes?.some(t=>p.manifest.id+'/'+t.id===id)))throw new Error('主题未安装或已停用')
 config.selectedThemeId=id;write(config);return publishPlugins()
}

export function saveRunningPluginConfig(id:string,config:Record<string,unknown>):void{const value=read(),entry=value.plugins.find(p=>p.enabled&&p.manifest.id===id);if(!entry)throw new Error('插件未启用');entry.config=config;write(value)}

export function grantRunningPluginWorkspace(id:string,workspaceId:string):void{const value=read(),entry=value.plugins.find(p=>p.enabled&&p.manifest.id===id);if(!entry||entry.access?.runtime!=='trusted')throw Error('插件未获标准信任授权');entry.access={...entry.access,workspaceIds:[...new Set([...entry.access.workspaceIds,workspaceId])]};write(value)}
