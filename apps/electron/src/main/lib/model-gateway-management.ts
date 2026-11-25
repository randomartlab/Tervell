import {extensionCommandSchemas,extensionCommand,extensionQuery} from './gateway-extension-api'
import {gatewaySubscriptions} from './gateway-extension-adapter'
import {z} from 'zod'
import {routedModel} from '@proma/auth-bridge/agent-routing'
import type {GatewaySnapshot,GatewayCommandResult,GatewayReasoningSelection,ModelRoutingConfig} from '@proma/shared'
import {readJsonFileSafe} from './safe-file'
import {getConfigDir} from './config-paths'
import {join} from 'node:path'
import {gatewayRequest,refreshRoutingModels,modelRoutingState,startModelRouting} from './model-routing-service'
import {gatewayProviders,gatewayPresets,gatewayGroups,gatewayUsage,gatewayPrivacy,gatewayPlugins} from './model-gateway-adapter'
const id=z.string().trim().min(1).max(512).refine(v=>!/[\0\r\n]/.test(v))
const endpoint=z.string().max(4096).refine(v=>!v||/^https?:\/\//.test(v),'请输入 HTTP 或 HTTPS 地址')
const advanced=z.record(z.string(),z.unknown()).refine(v=>Object.keys(v).every(key=>['headers','extraBody','contexts','maxConcurrency','maxAccounts','queueLimit','queueWait','maxRPM','proxy','affinity','sink','priceRate','billing','outputs','modelPrefs'].includes(key)),'高级设置含不支持的字段')
export const GatewayCommandSchema=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('provider.save'),provider:z.strictObject({id,name:id,preset:z.string().optional(),chat:endpoint,responses:endpoint,anthropic:endpoint,gemini:endpoint,baseAPI:z.enum(['chat','responses','anthropic','gemini']).optional(),key:z.string().max(65536).optional(),models:z.array(id).max(10000),routing:z.string().max(64),fallback:z.array(id).max(100),advanced:advanced.optional(),create:z.boolean().optional()})}),
 ...(['provider.delete','provider.refresh','provider.test','group.delete'] as const).map(kind=>z.strictObject({kind:z.literal(kind),id})),
 ...(['provider.toggle','group.toggle'] as const).map(kind=>z.strictObject({kind:z.literal(kind),id,enabled:z.boolean()})),
 z.strictObject({kind:z.literal('account.add'),id,name:id,key:z.string().min(1).max(65536)}),
 z.strictObject({kind:z.literal('account.toggle'),id,ref:id,enabled:z.boolean()}),z.strictObject({kind:z.literal('account.delete'),id,ref:id}),
 z.strictObject({kind:z.literal('model.preferences'),id,model:id,name:z.string().max(512).optional(),efforts:z.array(z.string().regex(/^[a-z0-9_-]{1,40}$/)).max(32).optional(),images:z.boolean().optional(),context:z.number().int().positive().max(1e9).optional(),output:z.number().int().positive().max(1e9).optional()}),
 z.strictObject({kind:z.literal('group.save'),group:z.strictObject({id:z.string().regex(/^[a-z0-9][a-z0-9.-]{0,127}$/),name:id,members:z.array(id).min(1).max(1000),routing:z.string().max(64),note:z.string().max(2000).optional()})}),
 z.strictObject({kind:z.literal('privacy'),accountDiscovery:z.boolean().optional(),telemetryOff:z.boolean().optional(),redact:z.boolean().optional()}),
 z.strictObject({kind:z.literal('plugin.toggle'),spec:id,enabled:z.boolean()}),
 ...(['plugin.add','plugin.remove','plugin.update'] as const).map(kind=>z.strictObject({kind:z.literal(kind),spec:id})),
 z.strictObject({kind:z.literal('privacy.rules'),words:z.array(z.string().max(4096)).max(1000),allow:z.array(z.string().max(4096)).max(1000),rules:z.array(z.strictObject({kind:z.string().max(24),prefix:z.string().max(64).optional(),regex:z.string().max(300).optional()})).max(1000)}),
 ...extensionCommandSchemas,
])
export async function gatewaySnapshot():Promise<GatewaySnapshot>{
 const results=await Promise.allSettled(['/api/providers','/api/groups','/api/settings','/api/usage?period=month','/api/plugins'].map(path=>gatewayRequest(path)))
 const data=(index:number)=>{const result=results[index]!;return result.status==='fulfilled'?result.value:undefined}
 if(results[0]?.status==='rejected')throw results[0].reason
 return {providers:gatewayProviders(data(0)),presets:gatewayPresets(data(0)),groups:gatewayGroups(data(1)),privacy:{...gatewayPrivacy(data(2)),forcedOff:!!process.env.TERVELL_PROFILE_DIR||gatewayPrivacy(data(2)).forcedOff},usage:gatewayUsage(data(3)),plugins:gatewayPlugins(data(4)),subscriptions:gatewaySubscriptions(data(0)),warnings:results.flatMap((r,i)=>r.status==='rejected'?[`${['供应商','路由组','隐私','用量','网关扩展'][i]}暂不可用，请重试`]:[])}
}
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
/** 旧字段只在主进程合并，编辑基础信息不会抹去密钥、模型参数或上游高级设置。 */
function savedProvider(idValue:string):Record<string,unknown>{const data=readJsonFileSafe<{providers?:unknown[]}>(join(getConfigDir(),'model-routing/config/magpie/providers.json'));return record(data?.providers?.find(p=>record(p).id===idValue))}
export async function gatewayCommand(raw:unknown):Promise<GatewayCommandResult>{
 const parsed=GatewayCommandSchema.safeParse(raw);if(!parsed.success)throw new Error('模型管理表单格式不正确，请检查地址、标识、数值与高级配置');const command=parsed.data;let message:string|undefined
 const effective=command.kind==='plugin.options'?{...command,options:{...objectPluginOptions(command.spec),...command.options}}:command
 const extra=await extensionCommand(effective,{request:gatewayRequest,isolated:!!process.env.TERVELL_PROFILE_DIR})
 if(extra){if(command.kind!=='signin.poll'||extra.signIn?.state==='done')await refreshRoutingModels();return {...extra,snapshot:await gatewaySnapshot()}}
 switch(command.kind){
  case 'provider.save':{const p=command.provider,old=savedProvider(p.id);if(p.create&&Object.keys(old).length)throw new Error('供应商标识已存在，请使用其他标识');await gatewayRequest('/api/provider/save',{...old,...p.advanced,id:p.id,name:p.name,preset:p.preset==='random-market'?'':p.preset??old.preset,chat:p.chat,responses:p.responses,anthropic:p.anthropic,gemini:p.gemini,...(p.baseAPI?{baseAPI:p.baseAPI}:{}),models:p.models,...(!p.models.length&&!p.create?{noModels:true}:{noModels:false}),routing:p.routing==='smart'?'':p.routing,fallback:p.fallback,...(p.key?{key:p.key}:{}),new:p.create===true});break}
  case 'provider.toggle':await gatewayRequest(`/api/provider/${command.enabled?'on':'off'}`,{id:command.id});break
  case 'provider.delete':await gatewayRequest('/api/provider/delete',{id:command.id});break
  case 'provider.refresh':await gatewayRequest('/api/provider/models',{id:command.id});break
  case 'provider.test':{const result=record(await gatewayRequest('/api/provider/test',{id:command.id}));const rows=Array.isArray(result.results)?result.results:[];const failed=rows.some(row=>!!record(row).error||record(row).ok===false);message=failed?'连接测试未全部通过，请检查供应商地址与授权':'连接测试已完成';break}
  case 'account.add':await gatewayRequest('/api/keys/add',{id:command.id,name:command.name,key:command.key});break
  case 'account.toggle':await gatewayRequest(`/api/keys/${command.enabled?'on':'off'}`,{id:command.id,ref:command.ref});break
  case 'account.delete':await gatewayRequest('/api/keys/remove',{id:command.id,ref:command.ref});break
  case 'model.preferences':{
   const old=savedProvider(command.id)
   const prefs={...(command.name!==undefined?{name:command.name}:{}),...(command.efforts?{efforts:command.efforts}:{}),...(command.images!==undefined?{images:command.images}:{})}
   const settings=command.output?record(await gatewayRequest('/api/settings')):{}
   const outputs=Object.fromEntries(Object.entries(record(settings.modelOutputs)).filter(([key])=>key.startsWith(command.id+'/')).map(([key,value])=>[key.slice(command.id.length+1),value]))
   await gatewayRequest('/api/provider/save',{...old,id:command.id,modelPrefs:{[command.model]:prefs},...(command.context?{contexts:{...record(old.contexts),[command.model]:command.context}}:{}),...(command.output?{outputs:{...outputs,[command.model]:command.output}}:{})})
   break
  }
  case 'group.save':{const current=record(await gatewayRequest('/api/groups'));const groups=Array.isArray(current.groups)?current.groups:[];const old=record(groups.find(row=>record(row).id===command.group.id));await gatewayRequest('/api/groups/save',{...old,...command.group,routing:command.group.routing==='smart'?'':command.group.routing});break}
  case 'group.toggle':await gatewayRequest('/api/groups/switch',{id:command.id,on:command.enabled});break
  case 'group.delete':await gatewayRequest('/api/groups/delete',{id:command.id});break
  case 'privacy':if(command.accountDiscovery!==undefined){if(command.accountDiscovery&&process.env.TERVELL_PROFILE_DIR)throw new Error('隔离验收配置禁止读取日常订阅账号');await gatewayRequest('/api/settings/account-discovery',{off:!command.accountDiscovery})}if(command.telemetryOff!==undefined)await gatewayRequest('/api/settings/agent-telemetry',{off:command.telemetryOff});if(command.redact!==undefined)await gatewayRequest('/api/settings',{redact:command.redact});break
  case 'plugin.toggle':await gatewayRequest('/api/plugins/off',{spec:command.spec,off:!command.enabled});break
  case 'plugin.add':await gatewayRequest('/api/plugins/add',{spec:command.spec});break
  case 'plugin.remove':await gatewayRequest('/api/plugins/remove',{spec:command.spec});break
  case 'plugin.update':await gatewayRequest('/api/plugins/upgrade',{spec:command.spec});break
  case 'privacy.rules':await gatewayRequest('/api/settings',{redactWords:command.words,redactAllow:command.allow});await gatewayRequest('/api/settings/redact-rules',{rules:command.rules});break

 }
 await refreshRoutingModels();const snapshot=await gatewaySnapshot();if(command.kind==='plugin.add'||command.kind==='plugin.update'||command.kind==='plugin.toggle'&&command.enabled){await new Promise(resolve=>setTimeout(resolve,250));return {snapshot:await gatewaySnapshot(),message}}return {snapshot,message}
}
export async function validateGatewayReasoning(kernelId:string,raw:unknown):Promise<GatewayReasoningSelection>{
 const selection=z.strictObject({model:id,effort:z.string().max(64).optional()}).parse(raw)
 await startModelRouting(process.env.PATH??'')
 await refreshRoutingModels();const state=modelRoutingState(),rule=state.config.rules.find(r=>r.kernelId===kernelId),model=activeGatewayModel(state.config,kernelId)
 if(!state.support.some(item=>item.kernelId===kernelId&&item.method!=='unavailable'))throw new Error('此内核使用原生模型配置，请使用内核返回的推理选项')
 if(!model||rule?.mode==='native'||selection.model!==model)throw new Error('会话模型路由已变化，请重新选择推理档位')
 const offered=state.models.find(m=>m.id===model)?.efforts??[]
 if(selection.effort&&!offered.includes(selection.effort))throw new Error('该推理档位不在当前模型返回的能力中')
 return selection
}
export function activeGatewayModel(config:ModelRoutingConfig,kernelId:string):string|undefined{return routedModel(config,kernelId)}

export const gatewayQuery=(raw:unknown)=>extensionQuery(raw,{request:gatewayRequest,isolated:!!process.env.TERVELL_PROFILE_DIR})

function objectPluginOptions(spec:string):Record<string,unknown>{
 const list=readJsonFileSafe<{plugins?:unknown[]}>(join(getConfigDir(),'model-routing/config/magpie/plugins.json'))
 const plugin=list?.plugins?.find(value=>record(value).spec===spec)
 return record(record(plugin).options)
}
