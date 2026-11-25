import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {gatewaySnapshot,gatewayCommand,validateGatewayReasoning} from '../apps/electron/src/main/lib/model-gateway-management'
import {saveModelRouting,routedPiModel,stopModelRouting,refreshRoutingModels,gatewayModelConnection} from '../apps/electron/src/main/lib/model-routing-service'

/** 真实随包网关 + 本机模拟上游。不会读取日常配置、登录账号或请求远程模型。 */
if(!process.env.TERVELL_MAGPIE_BIN)process.env.TERVELL_MAGPIE_BIN=join(import.meta.dir,'../apps/electron/resources/model-gateway/magpie')
const profile=mkdtempSync(join(tmpdir(),'tervell-native-model-')),previous=process.env.TERVELL_PROFILE_DIR
process.env.TERVELL_PROFILE_DIR=profile
import {gatewayReasoningRequest} from '../apps/electron/src/main/lib/model-routing-proxy'
const levels=['none','minimal','low','medium','high','xhigh','max','ultra','vendor-future']
const calls:Array<{effort:unknown;model:unknown}>=[]
const upstream=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(req){
 if(req.method==='GET')return Response.json({data:[{id:'routing-fixture',object:'model',supported_reasoning_levels:levels.map(effort=>({effort})),reasoning:true}]})
 const body=await req.json() as {stream?:boolean;model?:unknown;reasoning_effort?:unknown}
 calls.push({effort:body.reasoning_effort,model:body.model})
 const result={id:'native-fixture',created:1,model:'routing-fixture'}
 if(body.stream){const chunk=(done=false)=>({...result,object:'chat.completion.chunk',choices:[{index:0,delta:done?{}:{role:'assistant',content:'native-routing-ok'},finish_reason:done?'stop':null}]});return new Response(`data: ${JSON.stringify(chunk())}\n\ndata: ${JSON.stringify(chunk(true))}\n\ndata: [DONE]\n\n`,{headers:{'content-type':'text/event-stream'}})}
 return Response.json({...result,object:'chat.completion',choices:[{index:0,message:{role:'assistant',content:'native-routing-ok'},finish_reason:'stop'}]})
}})
const assert=(condition:unknown,message:string):void=>{if(!condition)throw new Error(message)}
try{
 mkdirSync(join(profile,'config'),{recursive:true});saveModelRouting({version:1,enabled:false,defaultModel:'',rules:[]})
 assert((await gatewaySnapshot()).providers.length===0,'隔离配置并非空目录')
 const localPlugin=join(profile,'synthetic-plugin');mkdirSync(localPlugin)
 const {writeJsonFileAtomic,writeTextFileAtomic}=await import('../apps/electron/src/main/lib/safe-file')
 writeJsonFileAtomic(join(localPlugin,'package.json'),{name:'tervell-options-fixture',version:'1.0.0',type:'module',main:'index.js'})
 writeTextFileAtomic(join(localPlugin,'index.js'),"export const Fixture=async()=>({})")
 await gatewayCommand({kind:'plugin.add',spec:localPlugin})
 await gatewayCommand({kind:'plugin.options',spec:localPlugin,options:{existingSecret:'fixture-plugin-secret',existingSetting:1}})
 await gatewayCommand({kind:'plugin.options',spec:localPlugin,options:{newSetting:2}})
 const pluginFile=JSON.parse(readFileSync(join(profile,'config/model-routing/config/magpie/plugins.json'),'utf8')) as {plugins:Array<{options:{existingSecret?:string;existingSetting?:number;newSetting?:number}}>}
 assert(pluginFile.plugins[0]?.options.existingSecret==='fixture-plugin-secret'&&pluginFile.plugins[0]?.options.newSetting===2,'修改插件配置抹掉原字段')
 assert(!JSON.stringify(await gatewaySnapshot()).includes('fixture-plugin-secret'),'插件配置秘密泄漏到目录')
 await gatewayCommand({kind:'plugin.remove',spec:localPlugin})

 const provider={id:'local-fixture',name:'原生回环供应商',chat:`http://127.0.0.1:${upstream.port}/v1`,responses:'',anthropic:'',gemini:'',models:['routing-fixture'],routing:'order',fallback:[]}
 await gatewayCommand({kind:'provider.save',provider:{...provider,key:'fixture-secret',advanced:{extraBody:{fixtureTag:'preserved'}},create:true}})
 await gatewayCommand({kind:'provider.save',provider:{...provider,name:'编辑后供应商'}})
 const saved=JSON.parse(readFileSync(join(profile,'config/model-routing/config/magpie/providers.json'),'utf8')) as {providers:Array<{key:string;extraBody?:{fixtureTag?:string}}>}
 assert(saved.providers[0]?.key==='fixture-secret'&&saved.providers[0]?.extraBody?.fixtureTag==='preserved','编辑丢失原密钥或高级配置')
 await gatewayCommand({kind:'provider.refresh',id:provider.id})
 await gatewayCommand({kind:'model.preferences',id:provider.id,model:'routing-fixture',name:'本机测试模型',context:120000,output:16000})
 saveModelRouting({version:1,enabled:true,defaultModel:'local-fixture/routing-fixture',rules:[]})
 let state=await refreshRoutingModels();for(let retry=0;retry<12&&JSON.stringify(state.models.find(m=>m.id==='local-fixture/routing-fixture')?.efforts)!==JSON.stringify(levels);retry++){await new Promise(resolve=>setTimeout(resolve,100));state=await refreshRoutingModels()}
 assert(JSON.stringify(state.models.find(m=>m.id==='local-fixture/routing-fixture')?.efforts)===JSON.stringify(levels),'模型档位丢失')
 // 复现实测：没有旧直连渠道，全局开关关闭，仅 Pi 选择单独覆盖。
 saveModelRouting({version:1,enabled:false,defaultModel:'',rules:[{kernelId:'pi',mode:'override',model:'local-fixture/routing-fixture'}]})
 for(const effort of ['minimal','xhigh','max','ultra','vendor-future']){
  const selected=await validateGatewayReasoning('pi',{model:'local-fixture/routing-fixture',effort})
  const route=(await routedPiModel('check-'+effort,selected))!
  assert(route.provider==='openai','没有选择上游原生协议')
  const reply=await fetch(route.baseUrl+'/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${route.apiKey}`},body:JSON.stringify({model:route.model,messages:[{role:'user',content:'local fixture'}]})})
  const text=await reply.text();assert(reply.ok&&text.includes('native-routing-ok')&&calls.at(-1)?.effort===effort,'推理档位没有到达上游')
 }
 // Chat 使用同一发包变换；Responses/Anthropic 入站需翻译到唯一 Chat 上游。
 const chatRoute=await gatewayModelConnection('local-fixture/routing-fixture','chat-regression')
 for(const effort of ['minimal','ultra','vendor-future'])for(const path of ['/v1/chat/completions','/v1/responses','/v1/messages']){
  const body=path.endsWith('/responses')?{model:chatRoute.model,input:'fixture',stream:true}:path.endsWith('/messages')?{model:chatRoute.model,messages:[{role:'user',content:'fixture'}],max_tokens:256,stream:true}:{model:chatRoute.model,messages:[{role:'user',content:'fixture'}],stream:true}
  const request=gatewayReasoningRequest({url:new URL(path,chatRoute.baseUrl).href,headers:{'content-type':'application/json',authorization:`Bearer ${chatRoute.apiKey}`},body:JSON.stringify(body)},effort)
  const response=await fetch(request.url,{method:'POST',headers:request.headers,body:request.body});await response.text()
  assert(response.ok&&calls.at(-1)?.effort===effort,`Chat/协议翻译 ${path}/${effort} 档位被改写`)
 }
 saveModelRouting({version:1,enabled:false,defaultModel:'local-fixture/routing-fixture',rules:[]})
 assert(await routedPiModel('disabled-inherit')===undefined,'全局关闭后跟随者仍使用网关')
 saveModelRouting({version:1,enabled:true,defaultModel:'local-fixture/routing-fixture',rules:[{kernelId:'pi',mode:'native'}]})
 assert(await routedPiModel('native-exception')===undefined,'原生策略未覆盖全局默认')
 await gatewayCommand({kind:'group.save',group:{id:'local-group',name:'回环路由组',members:['local-fixture/routing-fixture'],routing:'order'}})
 await gatewayCommand({kind:'account.add',id:provider.id,name:'第二密钥',key:'second-fixture-key'})
 const snapshot=await gatewaySnapshot();assert(snapshot.groups.some(g=>g.id==='local-group'),'路由组未持久化');assert(snapshot.providers[0]?.accounts.length===2,'多密钥未保存');assert(!JSON.stringify(snapshot).includes('fixture-secret'),'原始密钥泄漏到管理快照')
 await gatewayCommand({kind:'provider.save',provider:{...provider,models:[]}})
 assert((await gatewaySnapshot()).providers.find(p=>p.id===provider.id)?.models.every(model=>!model.enabled),'取消全部模型未生效')
 await gatewayCommand({kind:'provider.save',provider})
 assert((await gatewaySnapshot()).providers.find(p=>p.id===provider.id)?.models.some(model=>model.id==='routing-fixture'&&model.enabled),'重新启用模型失败')
 await gatewayCommand({kind:'privacy.rules',words:['fixture-only'],allow:['public'],rules:[]})
 assert((await gatewaySnapshot()).privacy.words.includes('fixture-only'),'脱敏设置未保存')
 await gatewayCommand({kind:'group.delete',id:'local-group'});await gatewayCommand({kind:'provider.delete',id:provider.id})
 assert((await gatewaySnapshot()).providers.length===0,'供应商删除失败')
 console.log(JSON.stringify({gateway:'0.1.4596',nativeManagement:['provider-create','provider-edit','secret-preservation','advanced-preservation','model-sync','model-alias','group-create-delete','multiple-keys','privacy-rules','provider-delete','model-disable-all','model-reenable','plugin-options-secret-preservation'],routingPolicy:['pi-override-with-global-off','disabled-inherit-native','native-rule-over-global'],reasoningLevels:levels,upstreamVerifiedEfforts:calls.map(c=>c.effort),realProviderRequests:0},null,2))
}finally{stopModelRouting();upstream.stop(true);if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(profile,{recursive:true,force:true})}
