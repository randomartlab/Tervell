import type {GatewayPluginPage,GatewayQueryResult} from '@proma/shared'
import {object,array,string} from './gateway-extension-adapter'
import {gatewayRequest,gatewayPageAsset} from './model-routing-service'
/** 只根据当前启用插件目录加载其资源，不能由 renderer 指定任意本机端口或管理 API。 */
interface PageTransport {request:typeof gatewayRequest;asset:typeof gatewayPageAsset}
export async function gatewayPluginPageQuery(command:{kind:string;key?:string;method?:string;params?:Record<string,unknown>},transport:PageTransport={request:gatewayRequest,asset:gatewayPageAsset}):Promise<GatewayQueryResult>{
 const {request,asset}=transport
 const pageRaw=await request('/api/plugin-pages'),panelRaw=await request('/api/plugin-panels')
 const pages=[...array(pageRaw),...array(panelRaw)].map(object)
 const list:GatewayPluginPage[]=pages.map(p=>({key:string(p.key),spec:string(p.spec),title:string(object(p.titles).zh)||string(p.title)||string(p.name),slot:string(p.slot)||undefined,reads:array(p.reads).filter((v):v is string=>typeof v==='string'),service:string(p.service)}))
 if(command.kind==='plugins.pages')return {pages:list}
 const raw=pages.find(p=>p.key===command.key),entry=list.find(p=>p.key===command.key)
 if(!raw||!entry)throw new Error('插件页面已停用或移除，请刷新插件目录')
 const own=string(raw.url)
 if(!/^\/_magpie\/plugin\/[a-f0-9]{32}\//.test(own))throw new Error('插件页面地址不在受管资源目录中')
 if(command.kind==='plugins.document'){
  const document=await asset(own,true)
  return {document:document.text}
 }
 const params=command.params??{}
 switch(command.method){
  case 'read':{const name=string(params.name);if(!entry.reads.includes(name))throw new Error('此插件未声明该读取权限');return {result:await request('/api/plugin-pages/read',{spec:entry.spec,read:name,params:object(params.params)})}}
  case 'options.get':return {result:await request('/api/plugin-pages/options',{spec:entry.spec})}
  case 'options.set':{if(!params.options||typeof params.options!=='object'||Array.isArray(params.options))throw new Error('插件选项需要 JSON 对象');return {result:await request('/api/plugin-pages/options',{spec:entry.spec,options:params.options})}}
  case 'asset':{const requested=string(params.url),base=own.slice(0,own.indexOf('/',own.indexOf('/plugin/')+8)+1);let path:string
   try{const url=new URL(requested,'https://plugin.invalid'+own);path=url.pathname}catch{throw new Error('插件只能读取自己的资源')}
   if(!path.startsWith(base))throw new Error('插件只能读取自己的资源')
   const result=await asset(path);return {result:{type:result.type,data:Array.from(result.bytes)}}
  }
  case 'image.copy':case 'image.save':return {result:await request('/api/plugin-pages/image',{spec:entry.spec,action:command.method==='image.save'?'save':'copy',name:params.name,png:params.png})}
  default:throw new Error('不支持的插件页面操作')
 }
}

