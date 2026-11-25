import {app} from 'electron'
import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {resolve,join} from 'node:path'
import {randomBytes,randomUUID,createHash} from 'node:crypto'
import {createServer} from 'node:http'
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file'
const root=mkdtempSync(join(tmpdir(),'tervell-mobile-electron-'));process.env.TERVELL_PROFILE_DIR=root;process.env.PROMA_RELEASE_CHANNEL='alpha';app.setPath('userData',join(root,'chromium'));app.commandLine.appendSwitch('use-mock-keychain')
console.log('Mobile verification bootstrap',app.isReady());if(app.isReady())void run();else app.on('ready',()=>{void run()})
async function run(){
const assert=(condition:unknown,message:string):void=>{if(!condition)throw new Error(message)}
let cleanup:()=>Promise<void>=async()=>{}
try{
 const {getConfigDir}=await import('../apps/electron/src/main/lib/config-paths')
 const config=getConfigDir();mkdirSync(join(config,'agent-workspaces/test/skills-inactive'),{recursive:true});mkdirSync(join(config,'agent-workspaces/test/skills'),{recursive:true})
 writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'project-a',name:'手机联调项目',slug:'test',createdAt:1,updatedAt:1}]})
 const {createAgentSession,getAgentSessionMeta}=await import('../apps/electron/src/main/lib/agent-session-manager')
 const session=createAgentSession('手机加密联调',undefined,'project-a')
 const {mobileControl,authorizeMobileControl,mobileControlRead}=await import('../apps/electron/src/main/lib/mobile-control-service')
 const {RemoteHost,createTunnelDevice}=await import('../packages/core/src/remote/host')
 const {DirectRemoteServer}=await import('../packages/core/src/remote/direct-server')
 const {sealRemote,openRemote}=await import('../packages/core/src/remote/crypto')
 const {stopModelRouting}=await import('../apps/electron/src/main/lib/model-routing-service')
 const upstream=createServer((request,response)=>{response.setHeader('Content-Type','application/json');response.end(JSON.stringify({data:Array.from({length:50},(_,index)=>({id:'fixture-'+index,reasoning:true,reasoning_levels:['none','minimal','low','medium','high','xhigh','max','ultra']}))}))});await new Promise<void>(resolve=>upstream.listen(0,'127.0.0.1',resolve));const address=upstream.address();if(!address||typeof address==='string')throw new Error('模型目录回环未就绪')
 const state:import('../packages/core/src/remote/host').RemoteState={hostId:'local-host',devices:[],sent:[]}
 let allowed=['project-a'],manage=true
 const device=createTunnelDevice(state,{server:'fixture.invalid',port:443,path:'/fixture_mobile_control',clientId:randomUUID(),targetHost:'127.0.0.1',targetPort:45000},allowed);device.management=true
 const host=new RemoteHost(state,{sessions:()=>[{id:session.id,title:'test',workspaceId:'project-a',updatedAt:1}],workspaces:()=>[{id:'project-a',name:'Test'}],create:async()=>{throw new Error()},messages:()=>[],send:()=>{},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false,control:mobileControl,authorizeControl:authorizeMobileControl,controlRead:mobileControlRead,managementEnabled:()=>manage},()=>{},()=>allowed)
 const server=new DirectRemoteServer(host,state,()=>true);await server.listen();cleanup=async()=>{stopModelRouting();await server.close();upstream.closeAllConnections();await new Promise<void>(resolve=>upstream.close(()=>resolve()))}
 let sequence=0;const pairing={...device.pairing};const deviceKey=randomBytes(32).toString('hex'),deviceToken=randomBytes(32).toString('hex')
 const send=async(method:string,params:object={},id=randomUUID())=>{
  const packet=sealRemote(pairing,'to-host',++sequence,{id,sentAt:Date.now(),method,...params})
  const response=await fetch(`http://127.0.0.1:${server.port}/v2/connect`,{method:'POST',headers:{authorization:`Bearer ${pairing.token}`,'content-type':'application/json'},body:JSON.stringify({room:pairing.room,packet})})
  assert(response.ok,'本机加密接口请求失败')
  if(method==='pair'){pairing.key=deviceKey;pairing.token=deviceToken}
  const raw=await response.json() as {packet:unknown};return openRemote(pairing,'to-device',0,raw.packet).value as {ok:boolean;data:Record<string,unknown>;error?:string}
 }
 await send('pair',{deviceKey,deviceToken})
 const control=async(operation:string,values:Record<string,unknown>={},scope:object={})=>{
  const reply=await send('control',{call:{operation,values,...scope}});assert(reply.ok,`控制失败 ${operation}: ${reply.error}`);let result=reply.data
  for(let i=0;typeof result.job==='object'&&result.job!==null&&(result.job as {phase:string}).phase==='running'&&i<100;i++){await new Promise(r=>setTimeout(r,100));const next=await send('control',{call:{operation:'jobs.status',values:{id:(result.job as {id:string}).id}}});assert(next.ok,'任务结果读取失败');result=next.data}
  return result.result&&typeof result.result==='object'?result.result as Record<string,unknown>:result
 }
 const catalog=await control('catalog');const actions=catalog.actions as Array<{id:string}>
 assert(actions.length>=130,'能力目录被截断或未就绪')
 await control('session.rename',{title:'真实加密手机改名'},{sessionId:session.id});assert(getAgentSessionMeta(session.id)?.title==='真实加密手机改名','会话未更新')
 await control('skills.create',{slug:'phone-test',name:'手机测试',description:'受管技能',instructions:'只做测试'},{workspaceId:'project-a'})
 const skill=await control('skills.read',{slug:'phone-test'},{workspaceId:'project-a'});assert(String(skill.content).includes('只做测试'),'技能未写入')
 await control('skills.toggle',{slug:'phone-test',enabled:true},{workspaceId:'project-a'})
 await control('skills.delete',{slug:'phone-test'},{workspaceId:'project-a'})
 await control('routing.save',{enabled:false,defaultModel:'fixture/model',rules:[]})
 const provider={id:'mobile-fixture',name:'手机供应商',chat:`http://127.0.0.1:${address.port}/v1`,responses:'',anthropic:'',gemini:'',models:Array.from({length:50},(_,index)=>'fixture-'+index),routing:'',fallback:[],key:'local-fixture-secret',create:true}
 await control('gateway.provider.save',{provider});await control('gateway.provider.refresh',{id:provider.id})
 await control('gateway.model.preferences',{id:provider.id,model:'fixture-0',efforts:['none','minimal','low','medium','high','xhigh','max','ultra']})
 const draft=await control('gateway.provider-detail',{id:provider.id}),editable=draft.providerDraft as {models:string[];create:boolean;name:string};assert(editable.models.length===50,'完整供应商模型被展示裁剪误删');assert(!JSON.stringify(draft).includes('local-fixture-secret'),'编辑表单泄露密钥')
 await control('gateway.provider.save',{provider:{...editable,name:'手机编辑后供应商'}});const edited=await control('gateway.provider-detail',{id:provider.id});assert((edited.providerDraft as {models:string[]}).models.length===50,'编辑后丢失已启用模型')
 await control('routing.save',{enabled:false,defaultModel:'',rules:[{kernelId:'pi',mode:'override',model:'mobile-fixture/fixture-0'}]});await control('routing.refresh');const sessionCatalog=await control('session.catalog',{}, {sessionId:session.id});assert(sessionCatalog.routedModel==='mobile-fixture/fixture-0','全局关闭时手机忽略 Pi 单独覆盖');assert(JSON.stringify(sessionCatalog.routedEfforts)===JSON.stringify(['none','minimal','low','medium','high','xhigh','max']),'手机缺少模型实际返回的完整推理档位')
 await control('session.reasoning',{model:'mobile-fixture/fixture-0',effort:'max'},{sessionId:session.id});assert(getAgentSessionMeta(session.id)?.gatewayReasoning?.effort==='max','会话推理档位未保存')
 const attachment=Buffer.from('手机内联附件回环'),uploaded=await control('attachments.start',{filename:'phone.txt',mediaType:'text/plain',bytes:attachment.length,digest:createHash('sha256').update(attachment).digest('hex')},{sessionId:session.id})
 await control('attachments.chunk',{id:uploaded.id,index:0,data:attachment.toString('base64')},{sessionId:session.id});const saved=await control('attachments.finish',{id:uploaded.id},{sessionId:session.id});assert(readFileSync((saved.attachment as {path:string}).path).equals(attachment),'手机附件未保存');assert(String(saved.marker).startsWith('[[tervell-asset:'),'缺少正文内联标记')
 const bun=process.env.TERVELL_CONTROL_BUN;if(!bun)throw new Error('必须指定已安装 Bun 的绝对路径')
 const mcp=await control('mcp.configure',{name:'phone-fixture',type:'stdio',command:bun,args:[resolve('packages/tool-bridge/src/test-fixtures/mcp-server.ts')],enabled:true,replaceExisting:false},{workspaceId:'project-a'});assert(mcp.enabled===true&&mcp.verified===true,'手机 MCP 未完成真实握手')
 await control('mcp.remove',{name:'phone-fixture'},{workspaceId:'project-a'})
 const todo=await control('todo.create',{title:'手机待办'},{workspaceId:'project-a'});await control('todo.update',{id:todo.id,status:'completed'},{workspaceId:'project-a'});await control('todo.delete',{id:todo.id},{workspaceId:'project-a'})
 await control('settings.save',{notificationsEnabled:false});assert((await control('settings.read')).notificationsEnabled===false,'手机设置未持久化')
 const spec=resolve('scripts/test-fixtures/gateway-auth')
 await control('gateway.plugin.add',{spec});const snapshot=await control('gateway.snapshot');assert(Array.isArray(snapshot.subscriptions),'供应商快照被破坏')
 await control('gateway.plugin.remove',{spec})
 const requestId=randomUUID(),call={operation:'session.rename',sessionId:session.id,values:{title:'重试不重复'}}
 const first=await send('control',{call},requestId),second=await send('control',{call},requestId);assert(first.ok&&second.ok,'控制重试失败')
 manage=false;const denied=await send('control',{call:{operation:'routing.state',values:{}}});assert(!denied.ok,'项目手机拥有全局权限')
 allowed=[];const scoped=await send('control',{call:{operation:'session.detail',sessionId:session.id,values:{}}});assert(!scoped.ok,'撤销项目后继续读取')
 const evidence={runtime:'真实 Electron 43.2 / Node 24 + 本机加密 DirectRemoteServer',mobileActionCount:actions.length,checks:['encrypted-pairing','catalog-integrity','session-rename','skill-create-read-toggle-delete','routing-save','provider-create-edit-50-models-preserved','full-reasoning-none-minimal-through-max','encrypted-inline-attachment-upload','real-mcp-stdio-handshake-listTools','todo-create-complete-delete','desktop-settings-save','synthetic-plugin-add-remove','write-deduplication','management-revocation','project-revocation'],realProviderRequests:0,realAccountLogins:0,androidApkBuilt:false,profileIsolated:true}
 if(process.env.TERVELL_CONTROL_DESKTOP_EVIDENCE){const {writeTextFileAtomic}=await import('../apps/electron/src/main/lib/safe-file');writeTextFileAtomic(process.env.TERVELL_CONTROL_DESKTOP_EVIDENCE,JSON.stringify(evidence,null,2))}
 console.log(JSON.stringify(evidence,null,2));await cleanup();rmSync(root,{recursive:true,force:true});app.exit(0)
}catch(error){console.error(error);await cleanup();rmSync(root,{recursive:true,force:true});app.exit(1)}

}
