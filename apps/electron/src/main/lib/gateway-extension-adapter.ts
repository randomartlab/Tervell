import type {GatewaySubscription,GatewayPlugin,GatewayPluginListing,GatewayPrompt,GatewaySignIn} from '@proma/shared'
export const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
export const array=(value:unknown):unknown[]=>Array.isArray(value)?value:[]
export const string=(value:unknown):string=>typeof value==='string'?value:''
const strings=(value:unknown):string[]=>array(value).filter((v):v is string=>typeof v==='string')
const localized=(value:unknown,fallback:unknown):string=>string(object(value).zh)||string(fallback)
/** 此目录来自固定 Magpie 源码 SUBS；插件替代关系始终采用运行时目录，不把退休入口当可登录。 */
const builtins:Array<{id:string;name:string;icon:string;importable?:boolean;risk?:string;sites?:Array<{id:string;name:string}>}>= [
 {id:'claude',name:'Claude',icon:'claude-color',importable:true,risk:'上游提示：在厂商自有应用之外使用订阅可能导致账号限制或封禁。请确认接受该风险。'},
 {id:'codex',name:'ChatGPT / Codex',icon:'openai',importable:true}, {id:'chatgpt-api',name:'ChatGPT API',icon:'openai'},
 {id:'cursor',name:'Cursor',icon:'cursor'}, {id:'grok',name:'Grok',icon:'xai'}, {id:'copilot',name:'GitHub Copilot',icon:'githubcopilot'},
 {id:'zcode',name:'ZCode / GLM Coding Plan',icon:'zcode',sites:[{id:'zai',name:'Z.ai'},{id:'bigmodel',name:'BigModel 智谱'}]},
 {id:'workbuddy',name:'WorkBuddy / CodeBuddy',icon:'workbuddy-color',risk:'上游提示：在其他工具中使用 WorkBuddy 订阅可能导致账号被封禁。'},
 {id:'workbuddy-ai',name:'WorkBuddy AI（国际版）',icon:'workbuddy-color',risk:'上游提示：WorkBuddy AI 曾限制在其他工具中使用的账号。'},
 {id:'commandcode-plan',name:'Command Code',icon:'commandcode',risk:'上游提示：Go 套餐使用私有接口，厂商可能采取账号限制措施。'},
 {id:'qoder',name:'Qoder（国际版）',icon:'qoder',risk:'上游提示：第三方订阅调用可能受到厂商限制。'}, {id:'qoder-cn',name:'Qoder 中国',icon:'qoder',risk:'上游提示：第三方订阅调用可能受到厂商限制。'},
 {id:'devin',name:'Devin',icon:'devin'}, {id:'zed',name:'Zed',icon:'zed',risk:'上游提示：此订阅面向 Zed 编辑器，第三方调用可能受到限制。'},
 {id:'factory',name:'Factory',icon:'factory',importable:true,risk:'上游提示：此订阅面向 Droid，第三方使用可能受到厂商限制。'},
 {id:'mimo-app',name:'Xiaomi MiMo',icon:'mimocode',risk:'上游提示：此订阅面向 MiMo 应用，第三方调用可能受到限制。'},
 {id:'kiro',name:'Kiro',icon:'kiro-color'}, {id:'gemini',name:'Gemini CLI',icon:'geminicli-color'},
 {id:'antigravity',name:'Antigravity',icon:'antigravity-color',importable:true,risk:'上游提示：在其他工具中使用该账号可能被 Google 限制或封禁。'},
]
export function gatewaySubscriptions(raw:unknown):GatewaySubscription[]{
 const data=object(raw),moved=object(data.movesTo)
 const plugins=array(data.plugins).map(value=>{const p=object(value);return {id:string(p.id),providerId:string(p.pid),name:string(p.name),icon:string(p.icon),spec:string(p.spec),methods:array(p.methods).map(value=>{const m=object(value);return {type:string(m.type),label:localized(m.labels,m.label),placeholder:string(m.placeholder),keyless:m.keyless===true,keyAsked:m.keyAsked===true}}),signedIn:p.signedIn===true,single:p.single===true,models:Number(p.models)||0,importable:p.importable===true,importFrom:string(p.importFrom),options:array(p.options).map(value=>{const o=object(value);return {key:string(o.key),label:localized(o.labels,o.label),description:localized(o.descriptions,o.description),confirm:localized(o.confirms,o.confirm),on:o.on===true}})}})
 const known=builtins.map(b=>{const p=plugins.find(p=>p.id===b.id);return {...b,methods:[{type:'oauth',label:'浏览器登录'}],signedIn:false,single:b.id==='cursor',models:0,importable:!!b.importable,options:[],...p,...(b.risk?{risk:b.risk}:{}),...(!p&&string(moved[b.id])?{installSpec:string(moved[b.id])}: {})}})
 return [...known,...plugins.filter(p=>!known.some(b=>b.id===p.id))]
}
export function gatewayPluginEntries(raw:unknown):GatewayPlugin[]{return array(object(raw).plugins).map(value=>{const p=object(value);return {spec:string(p.spec),name:string(p.ownName)||string(p.name)||string(p.package)||string(p.spec),icon:string(p.icon),version:string(p.version),latest:string(p.latest),enabled:p.off!==true,error:string(p.error)||undefined,providers:strings(p.providers),kind:p.isAgent?'agent':p.isMiddleware?'middleware':p.isGateway?'gateway':p.page?'page':array(p.tools).length?'tools':'provider',optionsExample:object(p.optionsExample),clashes:array(p.clashes).map(value=>{const c=object(value);return {provider:string(c.provider)||string(c.id),name:string(c.name),serving:string(c.by)||string(c.serving)||string(c.spec)}})}})}
export function gatewayPluginListings(raw:unknown,field='listings'):GatewayPluginListing[]{return array(object(raw)[field]).map(value=>{const p=object(value),npm=object(p.npm);return {spec:string(p.spec)||string(p.package),name:string(p.name)||string(p.package)||string(p.repo),icon:string(p.icon)||string(npm.icon),description:localized(p.summary,p.description||npm.description),providers:strings(p.providers),kind:string(p.kind)||'provider',version:string(p.version)||string(npm.version),license:string(p.license)||string(npm.license),repository:string(p.url)||string(p.repository)||string(npm.repository),community:p.community===true}}).filter(p=>!!p.spec)}
export function gatewayPrompt(raw:unknown):GatewayPrompt|null {if(!raw)return null;const p=object(raw);return {type:string(p.type),key:string(p.key),message:localized(p.messages,p.message),placeholder:string(p.placeholder),options:array(p.options).map(value=>{const o=object(value);return {label:localized(o.labels,o.label),value:string(o.value),hint:localized(o.hints,o.hint)}})}}
export function gatewaySignIn(raw:unknown):GatewaySignIn {const s=object(raw);return {id:string(s.id),agent:string(s.agent),state:string(s.state),url:string(s.url),code:string(s.code),instructions:string(s.instructions),pasteCallback:s.pasteCallback===true,pasteCode:s.pasteCode===true,pasteKey:s.pasteKey===true,opened:s.opened===true,user:string(s.user),error:string(s.error)}}
