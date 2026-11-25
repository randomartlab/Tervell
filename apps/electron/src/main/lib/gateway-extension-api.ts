import {gatewayPluginPageQuery} from './gateway-plugin-pages'
import {z} from 'zod'
import type {GatewayCommand,GatewayCommandResult,GatewayQueryResult} from '@proma/shared'
import {array,object,string,gatewayPluginListings,gatewayPrompt,gatewaySignIn} from './gateway-extension-adapter'
const id=z.string().trim().min(1).max(512).refine(v=>!/[^\S ]|\0/.test(v))
const inputs=z.record(z.string().min(1).max(128),z.string().max(65536)).refine(v=>JSON.stringify(v).length<=65536)
export const extensionCommandSchemas=[
 z.strictObject({kind:z.literal('plugin.options'),spec:id,options:z.record(z.string(),z.unknown()).refine(v=>JSON.stringify(v).length<=60000)}),
 z.strictObject({kind:z.literal('plugin.prefer'),spec:id,provider:id}),
 ...(['plugins.check','plugins.update'] as const).map(kind=>z.strictObject({kind:z.literal(kind)})),
 z.strictObject({kind:z.literal('plugins.builtin'),id,enabled:z.boolean().optional(),config:z.record(z.string(),z.unknown()).optional()}).refine(v=>(v.enabled===undefined)!==(v.config===undefined)),
 z.strictObject({kind:z.literal('plugins.mirror'),enabled:z.boolean()}),z.strictObject({kind:z.literal('plugins.registry'),url:z.string().max(4096).refine(v=>!v||/^https?:\/\//.test(v))}),
 z.strictObject({kind:z.literal('subscription.option'),provider:id,key:z.string().regex(/^[a-z0-9_-]{1,40}$/),enabled:z.boolean()}),
 z.strictObject({kind:z.literal('login.toggle'),agent:id,user:id,enabled:z.boolean()}),
 ...(['login.switch','login.forget'] as const).map(kind=>z.strictObject({kind:z.literal(kind),agent:id,user:id})),
 z.strictObject({kind:z.literal('signin.import'),agent:id,files:z.array(z.string().max(4*1024*1024)).min(1).max(20).refine(v=>JSON.stringify(v).length<=7*1024*1024),accessOnly:z.boolean().optional()}),
 z.strictObject({kind:z.literal('signin.export'),agent:z.enum(['claude','codex']),format:z.enum(['sub2api','cliproxyapi']),users:z.array(id).min(1).max(1000)}),
 z.strictObject({kind:z.literal('platform.session'),id,platform:z.enum(['stepfun','qianfan']),text:z.string().min(1).max(60000)}),
 z.strictObject({kind:z.literal('platform.signout'),id,platform:z.enum(['stepfun','qianfan','qianwen'])}),
 ...(['platform.start','platform.poll','platform.cancel'] as const).map(kind=>z.strictObject({kind:z.literal(kind),id})),
 z.strictObject({kind:z.literal('signin.token'),token:z.string().min(1).max(16000)}),
 z.strictObject({kind:z.literal('signin.plugin'),provider:id,method:z.number().int().min(0).max(100),inputs,key:z.string().max(65536).optional(),user:id.optional()}),
 z.strictObject({kind:z.literal('signin.start'),agent:id,site:id.optional(),user:id.optional()}),
 ...(['signin.poll','signin.cancel'] as const).map(kind=>z.strictObject({kind:z.literal(kind),id})),
 z.strictObject({kind:z.literal('signin.callback'),id,url:z.string().min(1).max(16384)}),
] as const
export const GatewayQuerySchema=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('plugins.builtin')}),z.strictObject({kind:z.literal('plugins.github')}),
 z.strictObject({kind:z.literal('plugins.pages')}),
 z.strictObject({kind:z.literal('plugins.document'),key:id}),
 z.strictObject({kind:z.literal('plugins.page-call'),key:id,method:z.enum(['read','options.get','options.set','asset','image.copy','image.save']),params:z.record(z.string(),z.unknown()).refine(v=>JSON.stringify(v).length<8*1024*1024)}),
 z.strictObject({kind:z.literal('plugins.catalog')}),z.strictObject({kind:z.literal('plugins.search'),query:z.string().trim().min(1).max(200)}),
 z.strictObject({kind:z.literal('plugins.readme'),spec:id}),
 z.strictObject({kind:z.literal('signin.prompt'),provider:id,method:z.number().int().min(0).max(100),inputs,key:z.string().max(128).optional(),value:z.string().max(65536).optional()}),
])
type Request=(path:string,body?:unknown)=>Promise<unknown>
interface Dependencies {request:Request;isolated:boolean}
/** 操作只指向固定管理 API。可注入传输用于本机合成插件回归，不改变生产隔离策略。 */
export async function extensionQuery(raw:unknown,{request,isolated}:Dependencies):Promise<GatewayQueryResult>{
 const q=GatewayQuerySchema.parse(raw)
 switch(q.kind){
  case 'plugins.pages':case 'plugins.document':case 'plugins.page-call':return gatewayPluginPageQuery(q)
  case 'plugins.builtin':return {builtins:array(await request('/api/plugins/builtin')).map(value=>{const b=object(value);return {id:string(b.id),name:string(b.name),description:string(b.sub),enabled:b.on===true,inUse:Number(b.inUse)||0,error:string(b.broken)||string(b.why),config:object(b.config)}})}
  case 'plugins.github':{const r=object(await request('/api/plugins/github'));return {catalog:{listings:gatewayPluginListings(r,'repos'),warnings:string(r.error)?['GitHub 目录暂未完整返回，可重试']:[],bun:true,mirror:false}}}
  case 'plugins.catalog':{const results=await Promise.allSettled([request('/api/plugins/listings'),request('/api/plugins')]);const listings=results[0]?.status==='fulfilled'?gatewayPluginListings(results[0].value):[];const state=results[1]?.status==='fulfilled'?object(results[1].value):{};return {catalog:{listings,warnings:results.flatMap((r,i)=>r.status==='rejected'?[`${i?'已安装插件':'社区目录'}暂不可用，可重试`]:[]),bun:state.bun===true,registry:string(object(state.registry).url),mirror:state.mirror===true}}}
  case 'plugins.search':{const result=await request(`/api/plugins/search?q=${encodeURIComponent(q.query)}`);return {catalog:{listings:gatewayPluginListings(result,'hits'),warnings:[],bun:true,mirror:false}}}
  case 'plugins.readme':{const result=object(await request(`/api/plugins/page?name=${encodeURIComponent(q.spec)}&lang=zh`));return {readme:{title:string(result.name)||q.spec,text:string(result.markdown)||string(result.readme)||string(result.text)}}}
  case 'signin.prompt':{if(isolated)throw new Error('隔离验收配置禁止登录真实订阅账号');const r=object(await request('/api/plugin-signin/prompt',{provider:q.provider,method:q.method,inputs:q.inputs,key:q.key,value:q.value}));return {prompt:gatewayPrompt(r.prompt),inputs:Object.fromEntries(Object.entries(object(r.inputs)).filter((entry):entry is [string,string]=>typeof entry[1]==='string')),error:string(r.error)||undefined}}
 }
}
export async function extensionCommand(command:GatewayCommand,{request,isolated}:Dependencies):Promise<Partial<GatewayCommandResult>|undefined>{
 const auth=()=>{if(isolated)throw new Error('隔离验收配置禁止登录或读取真实订阅账号')}
 switch(command.kind){
  case 'plugin.options':await request('/api/plugins/options',{spec:command.spec,options:command.options});return {}
  case 'plugin.prefer':await request('/api/plugins/prefer',{spec:command.spec,provider:command.provider});return {}
  case 'plugins.check':await request('/api/plugins/check',{});return {message:'已检查插件更新'}
  case 'plugins.update':await request('/api/plugins/update',{});return {message:'插件更新已完成'}
  case 'plugins.builtin':await request('/api/plugins/builtin',{id:command.id,...(command.enabled!==undefined?{on:command.enabled}:{config:command.config})});return {}
  case 'plugins.mirror':await request('/api/plugins/mirror',{on:command.enabled});return {}
  case 'plugins.registry':await request('/api/plugins/registry',{url:command.url});return {}
  case 'subscription.option':await request('/api/settings/plugin-option',{provider:command.provider,key:command.key,on:command.enabled});return {}
  case 'login.toggle':auth();await request(`/api/login/${command.enabled?'on':'off'}`,{agent:command.agent,user:command.user});return {}
  case 'login.switch':case 'login.forget':auth();await request(`/api/login/${command.kind==='login.switch'?'switch':'forget'}`,{agent:command.agent,user:command.user});return {}
  case 'signin.import':{auth();const result=object(await request('/api/signin/import',{agent:command.agent,files:command.files,accessOnly:command.accessOnly}));return {imported:array(result.results).map(value=>{const r=object(value);return {user:string(r.user),status:string(r.status),error:string(r.error)}})}}
  case 'signin.export':{auth();const result=object(await request('/api/signin/export',{agent:command.agent,format:command.format,users:command.users}));return {exported:{path:string(result.path),accounts:array(result.accounts).filter((v):v is string=>typeof v==='string')}}}
  case 'platform.session':auth();await request(`/api/${command.platform}/${encodeURIComponent(command.id)}/session`,{text:command.text});return {}
  case 'platform.signout':auth();await request(`/api/${command.platform}/${encodeURIComponent(command.id)}/signout`,{});return {}
  case 'platform.start':{auth();const result=object(await request(`/api/qianwen/${encodeURIComponent(command.id)}/signin`,{}));return {platformSignIn:{state:'waiting',url:string(result.url)}}}
  case 'platform.poll':{const result=object(await request(`/api/qianwen/${encodeURIComponent(command.id)}/signin`));return {platformSignIn:{state:string(result.state),error:string(result.error)}}}
  case 'platform.cancel':await request(`/api/qianwen/${encodeURIComponent(command.id)}/signin/cancel`,{});return {}
  case 'signin.token':auth();await request('/api/signin/claude-token',{token:command.token});return {message:'订阅令牌已保存'}
  case 'signin.start':{auth();return {signIn:gatewaySignIn(await request('/api/signin',{agent:command.agent,site:command.site,user:command.user,linkOnly:true}))}}
  case 'signin.plugin':{auth();return {signIn:gatewaySignIn(await request('/api/plugin-signin',{provider:command.provider,method:command.method,inputs:command.inputs,key:command.key,user:command.user}))}}
  case 'signin.poll':return {signIn:gatewaySignIn(await request(`/api/signin/${encodeURIComponent(command.id)}`))}
  case 'signin.cancel':await request(`/api/signin/${encodeURIComponent(command.id)}/cancel`,{});return {}
  case 'signin.callback':await request(`/api/signin/${encodeURIComponent(command.id)}/callback`,{url:command.url});return {}
  default:return undefined
 }
}
