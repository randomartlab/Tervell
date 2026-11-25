import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, symlinkSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import {delimiter} from 'node:path'
import { createServer } from 'node:net'
import { randomBytes, createHash } from 'node:crypto'
import { z } from 'zod'
import { MAGPIE_AGENT_ADAPTERS, MAGPIE_ACCOUNT_REQUIRED_KERNELS, ENVIRONMENT_ROUTED_KERNELS, environmentRoutedKernel, kernelGatewayEnvironment, routedAgentEnvironment, routedModel } from '@proma/auth-bridge'
import type { ModelRoutingConfig, ModelRoutingState, GatewayReasoningSelection } from '@proma/shared'
import { getConfigDir } from './config-paths'
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file'
import {gatewayRoutingModels} from './model-gateway-adapter'
import {sessionGateway,closeSessionGateways} from './model-routing-proxy'
import {prepareKernelRouteAdapter} from './kernel-routing-adapters'
import { cliProcessEnvironment } from './desktop-cli-environment'

const Config = z.strictObject({version:z.literal(1),enabled:z.boolean(),defaultModel:z.string().trim().max(512),rules:z.array(z.strictObject({kernelId:z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/),mode:z.enum(['native','override']),model:z.string().trim().max(512).optional()})).max(100)})
const path = () => join(getConfigDir(),'model-routing.json')
export function modelRoutingConfig(): ModelRoutingConfig {
  const raw = readJsonFileSafe<unknown>(path())
  if (raw === null) {if(existsSync(path()))throw new Error('模型路由配置无法读取，请恢复备份');return {version:1,enabled:false,defaultModel:'',rules:[]}}
  return Config.parse(raw)
}
export function saveModelRouting(raw: unknown): ModelRoutingState {
  const value = Config.parse(raw)
  if(new Set(value.rules.map(r=>r.kernelId)).size!==value.rules.length)throw new Error('同一内核只能设置一条例外规则')
  if(value.enabled&&!value.defaultModel)throw new Error('请先选择全局覆盖模型')
  const incomplete=value.rules.find(rule=>rule.mode==='override'&&!rule.model)
  if(incomplete)throw new Error(`请先选择 ${incomplete.kernelId} 的单独覆盖模型`)
  writeJsonFileAtomic(path(),value)
  return modelRoutingState()
}
function binary():string|undefined {
  let appPath=process.cwd();try{appPath=require('electron').app?.getAppPath()??appPath}catch{/* 无界面契约验证。 */}
  const executable=process.platform==='win32'?'magpie.exe':'magpie'
  const candidates=[process.env.TERVELL_MAGPIE_BIN,join(process.resourcesPath??'', 'model-gateway',executable),join(appPath,'resources/model-gateway',executable),join(appPath,'../../vendor/model-gateway',`${process.platform}-${process.arch}`,executable),...(process.platform==='darwin'?['/Applications/magpie.app/Contents/MacOS/magpie']:[])]
  return candidates.find((value):value is string=>!!value&&existsSync(value))
}
let child:ChildProcess|undefined,flight:Promise<void>|undefined,phase:ModelRoutingState['phase']='stopped',error:string|undefined
let startGeneration=0,disposed=false
const ownedProcesses=new Set<ChildProcess>()
function own(process:ChildProcess):ChildProcess{ownedProcesses.add(process);process.once('exit',()=>ownedProcesses.delete(process));process.once('error',()=>ownedProcesses.delete(process));return process}
let gateway='',web='',webKey='',models:ModelRoutingState['models']=[]
const root=()=>join(getConfigDir(),'model-routing')
function env(pathValue:string,home=join(root(),'home'),endpoint=gateway||'http://127.0.0.1:1'):Record<string,string> {
  const config=join(root(),'config'),cache=join(root(),'cache')
  for(const dir of [root(),home,config,cache,join(config,'magpie'),join(home,'.config/opencode'),join(home,'.pi/agent'),join(home,'.local/share'),...(process.platform==='win32'?[join(home,'AppData/Roaming'),join(home,'AppData/Local/Temp')]:[])])mkdirSync(dir,{recursive:true,mode:0o700})
  const settingsPath=join(config,'magpie','settings.json')
  if(!existsSync(settingsPath))writeJsonFileAtomic(settingsPath,{noAutoUpdate:true,noAutoDownload:true,noAccountDiscovery:true,gatewayMode:'on',agentTelemetryOff:true})
  const bun=[process.env.MAGPIE_BUN,join(process.resourcesPath??'', 'third-party/plugin-runtime',process.platform+'-'+process.arch,process.platform==='win32'?'bun.exe':'bun'),join(process.resourcesPath??'', 'vendor/bun',process.platform==='win32'?'bun.exe':'bun'),...(pathValue.split(delimiter).map(dir=>join(dir,process.platform==='win32'?'bun.exe':'bun')))].find((file):file is string=>!!file&&existsSync(file))
  return {...(bun?{MAGPIE_BUN:bun}:{}),...routedAgentEnvironment(cliProcessEnvironment(pathValue),home,config,cache,endpoint),MAGPIE_WEB_KEY:webKey,MAGPIE_NO_ACCOUNTS:process.env.TERVELL_PROFILE_DIR?'1':'0',MAGPIE_NO_INSTALL:'1',MAGPIE_NO_HANDOVER:'1'}
}
async function port():Promise<number> {return new Promise((resolve,reject)=>{const server=createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const address=server.address();server.close(err=>err?reject(err):address&&typeof address==='object'?resolve(address.port):reject(new Error('本地端口不可用')))})})}
export function modelRoutingState():ModelRoutingState {
  return {config:modelRoutingConfig(),phase,available:!!binary(),models,support:[{kernelId:'pi',method:'native'},...Object.entries(MAGPIE_AGENT_ADAPTERS).map(([kernelId,adapter])=>({kernelId,adapter,method:'native' as const,...(MAGPIE_ACCOUNT_REQUIRED_KERNELS[kernelId]?{requiresAccount:true,reason:MAGPIE_ACCOUNT_REQUIRED_KERNELS[kernelId]}:{})})),...ENVIRONMENT_ROUTED_KERNELS.map(kernelId=>({kernelId,method:'environment' as const})),{kernelId:'cursor',method:'unavailable',reason:'Cursor 自有云端 Agent 不能通过通用模型网关替换；可使用 Magpie 独立的 Cursor Local 能力。'},{kernelId:'kiro',method:'unavailable',reason:'此内核没有开放自定义模型端点。'},{kernelId:'auggie',method:'unavailable',reason:'此内核使用厂商后端，未提供受管模型覆盖适配。'},{kernelId:'amp',method:'unavailable',reason:'Amp 使用自身账号和执行服务；当前适配器没有开放通用 Magpie 模型接管接口。请先登录 Amp。'}],error}
}
export async function startModelRouting(pathValue:string):Promise<ModelRoutingState> {
  if(disposed)throw new Error('应用正在退出，模型网关已关闭')
  if(phase==='ready')return modelRoutingState()
  if(flight){await flight;return modelRoutingState()}
  const generation=++startGeneration
  const assertCurrent=()=>{if(disposed||generation!==startGeneration)throw new Error('模型网关启动已取消')}
  let running:ChildProcess|undefined
  const work=(async()=>{
    const executable=binary();if(!executable)throw new Error('未找到模型网关运行组件，请修复 Tervell 安装')
    phase='starting';error=undefined
    const endpointFile=join(root(),'endpoint.json');mkdirSync(root(),{recursive:true,mode:0o700})
    const stored=readJsonFileSafe<{port:number}>(endpointFile)
    const gatewayPort=stored&&Number.isInteger(stored.port)&&stored.port>1024&&stored.port<65536?stored.port:await port();if(!stored)writeJsonFileAtomic(endpointFile,{port:gatewayPort})
    assertCurrent()
    let webPort=await port();while(webPort===gatewayPort)webPort=await port();assertCurrent();gateway=`http://127.0.0.1:${gatewayPort}`;web=`http://127.0.0.1:${webPort}`;webKey=randomBytes(24).toString('hex')
    running=own(spawn(executable,['web','--gateway','--no-open','--addr',new URL(web).host],{env:env(pathValue),stdio:'ignore',windowsHide:true}));child=running
    let spawnError:Error|undefined;running.once('error',e=>{spawnError=e});running.once('exit',()=>{if(child===running){if(phase!=='failed')phase='stopped';child=undefined}})
    for(let attempt=0;attempt<100;attempt++){
      assertCurrent()
      if(spawnError)throw spawnError
      if(!child)throw new Error('模型网关提前退出')
      try {const response=await fetch(`${gateway}/`,{signal:AbortSignal.timeout(500)});const identity=await response.json() as {name?:string;pid?:number};assertCurrent();if(response.ok&&identity.name==='magpie'&&identity.pid===child?.pid){phase='ready';await refreshRoutingModels();assertCurrent();return}if(response.ok)throw new Error('模型网关端口已被其他进程占用')}catch(e){assertCurrent();if(e instanceof Error&&e.message.includes('其他进程'))throw e;/* 启动期间端口尚未就绪。 */}
      await new Promise(resolve=>setTimeout(resolve,100))
    }
    throw new Error('模型网关启动超时')
  })().catch(e=>{running?.kill('SIGKILL');if(generation===startGeneration&&!disposed){phase='failed';error=e instanceof Error?e.message:String(e)}throw e}).finally(()=>{if(flight===work)flight=undefined})
  flight=work
  await work;return modelRoutingState()
}
export async function refreshRoutingModels():Promise<ModelRoutingState> {
  if(phase!=='ready')return modelRoutingState()
  const response=await fetch(`${gateway}/v1/models`,{signal:AbortSignal.timeout(8000)})
  if(!response.ok)throw new Error('无法读取网关模型列表')
  const data=z.object({data:z.array(z.object({id:z.string(),name:z.string().optional(),display_name:z.string().optional(),reasoning:z.boolean().optional(),native_endpoints:z.array(z.string()).optional(),magpie_prefers:z.string().optional(),reasoning_levels:z.array(z.string()).optional(),supported_reasoning_levels:z.array(z.object({effort:z.string()})).optional(),context_length:z.number().optional(),context_window:z.number().optional(),max_output_tokens:z.number().optional()}))}).parse(await response.json())
  models=gatewayRoutingModels(data.data,await gatewayRequest('/api/providers'));return modelRoutingState()
}
/** 所有会话/协作/自动化最终在相同的 runner 创建进程，原 CLI 配置从不被覆写。 */
export async function prepareRoutedKernel(kernelId:string,base:Record<string,string>,scope='default',selection?:GatewayReasoningSelection,authenticationModel?:string):Promise<{env:Record<string,string>;model?:string}> {
  const model=authenticationModel??routedModel(modelRoutingConfig(),kernelId);if(!model)return {env:base}
  const adapter=MAGPIE_AGENT_ADAPTERS[kernelId]
  if(!adapter&&!environmentRoutedKernel(kernelId)){if(modelRoutingConfig().rules.find(rule=>rule.kernelId===kernelId)?.mode==='override')throw new Error('此内核暂不支持模型覆盖，请使用原生配置');return {env:base}}
  await startModelRouting(base.PATH??process.env.PATH??'')
  await refreshRoutingModels()
  if(!models.some(item=>item.id===model))throw new Error('所选模型已不可用，请同步模型目录后重新选择')
  if(selection?.model===model&&selection.effort&&!models.find(item=>item.id===model)?.efforts?.includes(selection.effort))throw new Error('当前模型已不再提供所选推理档位，请重新选择')
  const endpoint=selection?.model===model&&selection.effort?await sessionGateway(scope,gateway,selection):gateway
  const home=join(root(),'agents',kernelId,createHash('sha256').update(scope).digest('hex').slice(0,20))
  const environment=env(base.PATH??'',home,endpoint)
  environment.XDG_CONFIG_HOME=join(home,'.config');environment.XDG_CACHE_HOME=join(home,'.cache');for(const directory of [environment.XDG_CONFIG_HOME,environment.XDG_CACHE_HOME])mkdirSync(directory,{recursive:true,mode:0o700})
  const sharedGatewayConfig=join(environment.XDG_CONFIG_HOME,'magpie');if(!existsSync(sharedGatewayConfig))symlinkSync(join(root(),'config/magpie'),sharedGatewayConfig,process.platform==='win32'?'junction':'dir')
  if(adapter){
    const executable=binary()!
    try{await new Promise<void>((resolve,reject)=>{
      if(disposed)throw Error('应用正在退出，模型网关已关闭')
      const command=own(spawn(executable,[adapter,model],{env:environment,stdio:'ignore',windowsHide:true}))
      const timer=setTimeout(()=>{command.kill();reject(new Error('内核模型覆盖配置超时'))},20000)
      command.once('error',e=>{clearTimeout(timer);reject(e)})
      command.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('此内核未能接受所选模型；请在模型路由中检查模型与协议'))})
    })}finally{if(existsSync(sharedGatewayConfig))unlinkSync(sharedGatewayConfig)}
  }
  // Magpie 的原生 adapter 会将某些模型转换为 CLI 自己的 ID，交给 CLI 默认值选择。
  const routed=routedAgentEnvironment({...base,...environment},environment.HOME!,environment.XDG_CONFIG_HOME!,environment.XDG_CACHE_HOME!,endpoint)
  delete routed.MAGPIE_WEB_KEY;delete routed.MAGPIE_WEB_RUNKEY
  return {model,env:{...routed,...kernelGatewayEnvironment(kernelId,endpoint,model),...prepareKernelRouteAdapter(kernelId,home,model,endpoint,models.find(item=>item.id===model))}}
}
export function routedAgentModelSelection():{channelId:string;channelName:string;provider:'openai-responses';models:Array<{id:string;name:string}>}|undefined {const model=routedModel(modelRoutingConfig(),'pi');if(!model)return undefined;return {channelId:'tervell-routing',channelName:'全局模型路由',provider:'openai-responses',models:[...models.filter(item=>item.id!==model),{id:model,name:model}]}}
export async function routedPiModel(scope='pi-default',selection?:GatewayReasoningSelection):Promise<{model:string;baseUrl:string;apiKey:string;provider:'openai'|'openai-responses'|'anthropic'}|undefined> {
  const model=routedModel(modelRoutingConfig(),'pi');if(!model)return undefined
  return gatewayModelConnection(model,scope,selection)
}
/** Chat 可直接选择目录模型，不依赖 Pi 或任何 CLI 的覆盖策略。 */
export async function gatewayModelConnection(model:string,scope:string,selection?:GatewayReasoningSelection):Promise<{model:string;baseUrl:string;apiKey:string;provider:'openai'|'openai-responses'|'anthropic'}> {
  await startModelRouting(process.env.PATH??'')
  await refreshRoutingModels()
  if(!models.some(item=>item.id===model))throw new Error('所选模型已不可用，请同步模型目录后重新选择')
  if(selection?.model===model&&selection.effort&&!models.find(item=>item.id===model)?.efforts?.includes(selection.effort))throw new Error('当前模型已不再提供所选推理档位，请重新选择')
  const endpoint=selection?.model===model&&selection.effort?await sessionGateway(scope,gateway,selection):gateway
  const metadata=models.find(item=>item.id===model),native=metadata?.nativeEndpoints??[],preferred=metadata?.preferredEndpoint
  const chosen=preferred&&native.includes(preferred)?preferred:native.includes('/v1/responses')?'/v1/responses':native[0]
  const provider=chosen==='/v1/chat/completions'?'openai':chosen==='/v1/messages'?'anthropic':'openai-responses'
  return {model,provider,baseUrl:provider==='anthropic'?endpoint:`${endpoint}/v1`,apiKey:'magpie-tervell'}
}
/** 主进程专用管理 API；renderer 无法接触控制台管理密钥或选择任意 URL。 */
export async function gatewayRequest(path:string,body?:unknown):Promise<unknown>{
 await startModelRouting(process.env.PATH??'')
 const endpoint=new URL(path,web)
 if(endpoint.origin!==web||!endpoint.pathname.startsWith('/api/'))throw new Error('无效的模型管理操作')
 const response=await fetch(endpoint,{method:body===undefined?'GET':'POST',redirect:'error',headers:{'content-type':'application/json',cookie:`magpie_web_${new URL(web).port}=${webKey}`,origin:web},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(path.startsWith('/api/plugins/')&&body!==undefined?310000:45000)})
 const result=await response.text()
 if(!response.ok)throw new Error(`模型管理操作失败（${response.status}），请检查填写内容与网关状态`)
 if(!result)return null
 try{return JSON.parse(result)}catch{throw new Error('网关返回了无法识别的管理数据')}
}
export function stopModelRouting(permanent=false):void {
  if(permanent)disposed=true
  startGeneration++;closeSessionGateways();const running=child;child=undefined;phase='stopped'
  if(permanent){for(const process of ownedProcesses)process.kill('SIGKILL');return}
  running?.kill();if(running){const timer=setTimeout(()=>{if(running.exitCode===null)running.kill('SIGKILL')},8000);timer.unref()}
}

/** 仅主进程取已缓存的图标；不允许 renderer 指定任意 URL 或磁盘路径。 */
export async function gatewayIcon(icon:string):Promise<string|undefined>{
 if(!/^file:[a-f0-9]{16}\.(?:png|jpg|jpeg|gif|webp|ico|svg)$/.test(icon))return undefined
 await startModelRouting(process.env.PATH??'')
 const response=await fetch(`${web}/api/icons/${encodeURIComponent(icon.slice(5))}`,{redirect:'error',headers:{cookie:`magpie_web_${new URL(web).port}=${webKey}`,origin:web},signal:AbortSignal.timeout(10000)})
 if(!response.ok)return undefined
 const type=response.headers.get('content-type')?.split(';')[0]??''
 if(!['image/png','image/jpeg','image/gif','image/webp','image/x-icon','image/vnd.microsoft.icon','image/svg+xml'].includes(type))return undefined
 if(Number(response.headers.get('content-length')??0)>1024*1024)return undefined
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>1024*1024)return undefined
 return `data:${type};base64,${bytes.toString('base64')}`
}

/** 仅加载固定运行时的插件资源。HTML 已由上游将本地脚本和样式内联；不附带控制台凭据。 */
export async function gatewayPageAsset(path:string,document=false):Promise<{text:string;type:string;bytes:Uint8Array}>{
 await startModelRouting(process.env.PATH??'')
 if(!/^\/_magpie\/plugin\/[a-f0-9]{32}\//.test(path)||path.includes('..')||path.includes('\\'))throw new Error('无效的插件资源')
 const url=new URL(path,web);if(url.origin!==web)throw new Error('无效的插件资源')
 const response=await fetch(url,{redirect:'error',headers:{cookie:`magpie_web_${new URL(web).port}=${webKey}`,origin:web},signal:AbortSignal.timeout(15000)})
 if(!response.ok)throw new Error('插件页面资源不可用')
 const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>8*1024*1024)throw new Error('插件页面资源超过大小限制')
 const type=response.headers.get('content-type')??'application/octet-stream';let text=new TextDecoder().decode(bytes)
 if(document){
  if(!type.startsWith('text/html'))throw new Error('插件页面格式无效')
  const original=response.headers.get('content-security-policy')??"default-src 'none'; style-src 'unsafe-inline'"
  const policy=original.split(';').map(v=>v.trim()).filter(v=>v&&!/^(?:sandbox|frame-ancestors|base-uri)\b/.test(v)).join('; ')+"; base-uri 'none'"
  const escape=(v:string)=>v.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')
  const prefix=`<base href="${escape(url.href)}"><meta http-equiv="Content-Security-Policy" content="${escape(policy)}">`
  text=/<head(?:\s[^>]*)?>/i.test(text)?text.replace(/<head(?:\s[^>]*)?>/i,match=>match+prefix):prefix+text
 }
 return {text,type,bytes}
}
