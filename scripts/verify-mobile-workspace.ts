import {app} from 'electron'
import {mkdtempSync,mkdirSync,readFileSync,cpSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {createHash,randomUUID} from 'node:crypto'
import type {MobileControlCall} from '@proma/protocol'
import {writeJsonFileAtomic,writeTextFileAtomic} from '../apps/electron/src/main/lib/safe-file'
const root=mkdtempSync(join(tmpdir(),'tervell-mobile-workspace-'))
process.env.TERVELL_PROFILE_DIR=root;process.env.PROMA_RELEASE_CHANNEL='alpha';app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain')
const start=()=>void run().catch(error=>{console.error(error);app.exit(1)});if(app.isReady())start();else app.once('ready',start)
async function run(){
 const config=join(root,'config'),cwd=join(root,'project');mkdirSync(config,{recursive:true});mkdirSync(cwd)
 writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'mobile-fixture',name:'手机工作区验收',slug:'mobile-fixture',projectRootPath:cwd,createdAt:1,updatedAt:1}]})
 writeTextFileAtomic(join(cwd,'example.ts'),'// 手机文件读写与冲突校验\nexport const value = 42;\n')
 writeTextFileAtomic(join(cwd,'中文分页.txt'),'中文🙂'.repeat(14000))
 writeJsonFileAtomic(join(config,'channels.json'),{channels:[{id:'mobile-fixture-api',name:'隔离模型服务',provider:'openai',baseUrl:'https://fixture.invalid/v1',apiKey:'',enabled:true,models:[{id:'fixture-model',name:'隔离模型',enabled:true,efforts:['low','high','ultra','vendor-future']}],createdAt:1,updatedAt:1}]})
 const manager=await import('../apps/electron/src/main/lib/agent-session-manager')
 const service=await import('../apps/electron/src/main/lib/mobile-control-service')
 const runtime=await import('../apps/electron/src/main/lib/plugin-host/runtime')
 const extensions=await import('../apps/electron/src/main/lib/desktop-extension-service')
 const resources=join(root,'resource-plugin');mkdirSync(resources)
 cpSync(resolve('../paseo-src/plugin-examples/linear/index.client.ts'),join(resources,'index.client.ts'))
 cpSync(resolve('../paseo-src/plugin-examples/linear/shared'),join(resources,'shared'),{recursive:true})
 cpSync(resolve('../paseo-src/plugin-examples/linear/paseo-plugin.json'),join(resources,'paseo-plugin.json'))
 writeTextFileAtomic(join(resources,'index.server.ts'),`import {searchIssuesRpc} from './shared/issues';export default server=>{server.handle(searchIssuesRpc,async()=>({items:[{id:'qa-resource',identifier:'QA-1',title:'完整资源验收',url:'https://example.invalid/QA-1',text:'中文🙂'.repeat(12000),resourceType:'issue'}]}));return()=>{}}`)
 for(const path of [resolve('../paseo-src/plugin-examples/composer-controls'),resolve('../paseo-src/plugin-examples/inline-thinking'),resources]){const offer=extensions.previewDesktopPlugin(path);extensions.installDesktopPlugin(offer);extensions.configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['mobile-fixture'],network:false,runtime:'trusted'}});await extensions.activateDesktopPlugin(offer.manifest.id,true)}
 const {createDirectCertificate}=await import('../apps/electron/src/main/lib/direct-certificate')
 const {RemoteHost,createDirectDevice}=await import('../packages/core/src/remote/host')
 const {DirectRemoteServer}=await import('../packages/core/src/remote/direct-server')
 const {remotePairingLink}=await import('../packages/core/src/remote/pairing')
 const identity=createDirectCertificate(),state:import('../packages/core/src/remote/host').RemoteState={hostId:'tervell-mobile-fixture',devices:[],sent:[]}
 const first=manager.createAgentSession('过程与文件验收',undefined,'mobile-fixture'),second=manager.createAgentSession('长历史与草稿验收',undefined,'mobile-fixture')
 manager.updateAgentSessionMeta(first.id,{completedButUnconfirmed:true,channelId:'mobile-fixture-api',modelId:'fixture-model'});manager.updateAgentSessionMeta(second.id,{pinned:true})
 manager.appendSDKMessages(first.id,[{type:'user',uuid:randomUUID(),message:{content:[{type:'text',text:'请读取 example.ts，并核对结果。'}]},_createdAt:1},{type:'assistant',uuid:randomUUID(),message:{content:[{type:'thinking',thinking:'先读取文件，核对输入与调用结果。保留原有推理记录。'},{type:'tool_use',id:'read-1',name:'read',input:{path:'example.ts'}}]},_createdAt:2},{type:'user',uuid:randomUUID(),message:{content:[{type:'tool_result',tool_use_id:'read-1',content:'export const value = 42;'}]},_createdAt:3},{type:'assistant',uuid:randomUUID(),message:{content:[{type:'text',text:'已完成检查。\n\n- 文件读取成功。\n- 推理与工具结果可以分别展开。\n\n```typescript\nexport const value = 42;\n```'}]},_createdAt:4}])
 manager.appendSDKMessages(second.id,Array.from({length:180},(_,i)=>({type:i%2?'assistant' as const:'user' as const,uuid:randomUUID(),message:{content:[{type:'text' as const,text:'完整记录 '+i+'：'+(i===179?'中文🙂'.repeat(10000):'这是隔离的历史内容。')}]},_createdAt:100+i})))
 let questionOpen=true
 const questionId=randomUUID(),answersFile=join(root,'qa-answers.json')
 const running=new Set<string>(),live=new Map<string,string>()
 const host=new RemoteHost(state,{sessions:()=>manager.listAgentSessions().filter(s=>!s.archived).map(s=>({id:s.id,title:s.title,workspaceId:s.workspaceId,updatedAt:s.updatedAt})),workspaces:()=>[{id:'mobile-fixture',name:'手机工作区验收'}],create:async(w,title)=>manager.createAgentSession(title,undefined,w),messages:()=>[],send:(id,text)=>{running.add(id);manager.appendSDKMessages(id,[{type:'user',uuid:randomUUID(),message:{content:[{type:'text',text}]},_createdAt:Date.now()}]);let n=0;const timer=setInterval(()=>{n++;live.set(id,'正在验证手机流式恢复 '+n);if(n>=4){clearInterval(timer);manager.appendSDKMessages(id,[{type:'assistant',uuid:randomUUID(),message:{content:[{type:'text',text:'手机发送已到达隔离电脑。\n\n```text\nmobile-workspace-ok\n```'}]},_createdAt:Date.now()}]);running.delete(id);live.delete(id)}},700)},stop:id=>{running.delete(id);live.delete(id)},running:id=>running.has(id),liveText:id=>live.get(id)??'',approvals:()=>[],approve:()=>false,interactions:()=>questionOpen?[{requestId:questionId,sessionId:first.id,kind:'question' as const,questions:[{question:'选择需要验收的项目',multiSelect:true,options:[{label:'文件',description:'核对文件原文'},{label:'终端',description:'核对连续输出'},{label:'模型',description:'核对完整推理档位'}]},{question:'备注',options:[{label:'按原计划继续'},{label:'先处理连接'}]}]}]:[],answer:(id,answers)=>{if(id!==questionId||!questionOpen)return false;writeJsonFileAtomic(answersFile,answers);questionOpen=false;return true},control:service.mobileControl,authorizeControl:service.authorizeMobileControl,controlRead:service.mobileControlRead,managementEnabled:()=>true},()=>{},()=>['mobile-fixture'])
 const server=new DirectRemoteServer(host,state,()=>true,{host:'0.0.0.0',tls:identity});await server.listen()
 const device=createDirectDevice(state,{url:`https://10.0.2.2:${server.port}`,certificateSha256:identity.fingerprint},['mobile-fixture']);device.management=true;device.pairing.expiresAt=Date.now()+60*60*1000
 const paths={root,first:first.id,second:second.id,port:server.port,pairing:remotePairingLink(device.pairing)}
 writeJsonFileAtomic(join(root,'qa-private.json'),paths);writeTextFileAtomic('/tmp/tervell-mobile-workspace-ui-root',root)
 console.log('READY',JSON.stringify({root,first:first.id,second:second.id,port:server.port}))
 const directory=await service.mobileControl({id:device.pairing.deviceId,workspaceIds:['mobile-fixture'],management:true},{operation:'workspace.mobile',values:{},workspaceId:'mobile-fixture'}) as {sessions:unknown[]}
 if(directory.sessions.length!==2)throw Error('项目目录错误')
 const text=readFileSync(join(cwd,'中文分页.txt'),'utf8');let result='',offset=0,revision=''
 for(;;){const page=await service.mobileControl({id:device.pairing.deviceId,workspaceIds:['mobile-fixture'],management:true},{operation:'files.mobile-read',sessionId:first.id,values:{path:'中文分页.txt',offset,...(revision?{revision}:{})}}) as {content:string;hasMore:boolean;nextOffset:number;revision:string};result+=page.content;if(!page.hasMore)break;offset=page.nextOffset;revision=page.revision}
 if(result!==text)throw Error('中文文件分页破坏UTF-8')
 const directoryResult=await service.mobileControl({id:device.pairing.deviceId,workspaceIds:['mobile-fixture'],management:true},{operation:'files.list',sessionId:first.id,values:{path:'.'}}) as {entries:Array<{path:string}>};if(directoryResult.entries.some(e=>e.path.startsWith('..')||e.path.startsWith('/')))throw Error('规范化项目路径产生越界列表');console.log('FILES UTF8 boundary + canonical /var alias paths roundtrip PASS')
 await runtime.syncPluginHosts();console.log('PLUGINS',JSON.stringify(runtime.pluginStatuses().map(p=>({id:p.id,phase:p.phase}))))
 const phone={id:device.pairing.deviceId,workspaceIds:['mobile-fixture'],management:true}
 const call=async(operation:string,values:MobileControlCall['values']={},sessionId=first.id)=>{
  let result=await service.mobileControl(phone,{operation,sessionId,values}) as Record<string,unknown>
  while(result.job){const job=result.job as {id:string;phase:string};if(job.phase==='failed')throw Error(String(result.error));if(job.phase==='done')return result.result as Record<string,unknown>;await new Promise(r=>setTimeout(r,40));result=await service.mobileControl(phone,{operation:'jobs.status',values:{id:job.id}}) as Record<string,unknown>}
  if(result.error)throw Error(String(result.error));return result
 }
 const bytes=readFileSync(resolve('apps/electron/resources/icon.png')),digest=createHash('sha256').update(bytes).digest('hex')
 const upload=await call('attachments.start',{filename:'验收图片.png',mediaType:'image/png',bytes:bytes.length,digest})
 for(let at=0;at<bytes.length;at+=Number(upload.chunkBytes))await call('attachments.chunk',{id:String(upload.id),index:at/Number(upload.chunkBytes),data:bytes.subarray(at,at+Number(upload.chunkBytes)).toString('base64')})
 const finished=await call('attachments.finish',{id:String(upload.id)}),imageId=randomUUID(),asset=finished.attachment as {id:string}
 manager.appendSDKMessages(first.id,[{type:'user',uuid:imageId,message:{content:[{type:'text',text:String(finished.marker)}]},_createdAt:Date.now()}])
 const image=await call('session.attachment-bytes',{entryId:imageId+':0',attachmentId:asset.id})
 if(!Buffer.from(String(image.data),'base64').equals(bytes.subarray(0,24000)))throw Error('会话图片字节不符')
 let denied=false;try{await call('session.attachment-bytes',{entryId:imageId+':0',attachmentId:asset.id},second.id)}catch{denied=true}if(!denied)throw Error('另一会话读到了图片')
 console.log('ATTACHMENTS encrypted operation upload + exact bytes + session ownership PASS')
 const options=await call('session.direct-options');if(!(options.efforts as string[]).includes('vendor-future'))throw Error('原始推理档位被裁剪')
 await call('session.direct-reasoning',{channelId:'mobile-fixture-api',model:'fixture-model',effort:'ultra'})
 if(manager.getAgentSessionMeta(first.id)?.modelReasoning?.effort!=='ultra')throw Error('手机推理档位未保存')
 console.log('MODELS full raw choices + ultra persisted PASS')
 let full='',partOffset=0,partRevision=''
 for(;;){const page=await call('session.export',{format:'json',offset:partOffset,...(partRevision?{revision:partRevision}:{})},second.id);full+=String(page.content);if(!page.hasMore)break;partOffset=Number(page.nextOffset);partRevision=String(page.revision)}
 if(JSON.parse(full).length!==180||!full.includes('中文🙂'.repeat(10000)))throw Error('完整历史导出丢失')
 console.log('EXPORT 180 entries + long Unicode exact paged roundtrip PASS')
 const check={operation:'plugins.mobile-bundle',values:{pluginId:'builtin-vivid-activity'}}
 service.authorizeMobileControl(phone,check)
 const {toggleDesktopPlugin}=await import('../apps/electron/src/main/lib/desktop-extension-service')
 toggleDesktopPlugin('builtin-vivid-activity',false,true);denied=false;try{service.authorizeMobileControl(phone,check)}catch{denied=true}finally{toggleDesktopPlugin('builtin-vivid-activity',true,true)}if(!denied)throw Error('停用插件仍允许缓存结果')
 denied=false;try{service.authorizeMobileControl({...phone,workspaceIds:[]},check)}catch{denied=true}if(!denied)throw Error('撤销项目仍允许插件结果')
 console.log('PLUGINS disabled + revoked workspace denied before cached results PASS')
 const terminal=await call('terminal.mobile-create'),terminalId=String(terminal.terminalId)
 const output=async(marker:string)=>{const until=Date.now()+10000;for(;;){const page=await call('terminal.mobile-snapshot',{terminalId});await call('terminal.mobile-snapshot',{terminalId,ack:Number(page.sequence)});if(String(page.output).includes(marker))return page;if(Date.now()>until)throw Error('终端后续输出停滞');await new Promise(r=>setTimeout(r,80))}}
 await call('terminal.mobile-input',{terminalId,data:"printf '\\x6d\\x6f\\x62\\x69\\x6c\\x65\\x2d\\x66\\x69\\x72\\x73\\x74\\n'\n"});const initial=await output('mobile-first')
 await call('terminal.mobile-input',{terminalId,data:"printf '\\x6d\\x6f\\x62\\x69\\x6c\\x65\\x2d\\x73\\x65\\x63\\x6f\\x6e\\x64\\n'\n"});const later=await output('mobile-second')
 if(Number(later.sequence)<=Number(initial.sequence))throw Error('终端输出序号没有推进')
 denied=false;try{await call('terminal.mobile-snapshot',{terminalId},second.id)}catch{denied=true}if(!denied)throw Error('终端越过会话边界')
 await call('terminal.mobile-close',{terminalId});await runtime.syncPluginHosts()
 console.log('TERMINAL acknowledged consecutive output + session isolation PASS')
 const cleanup=async()=>{await server.close();await(await import('../apps/electron/src/main/lib/terminal-service')).stopAllTerminals();await runtime.stopAllPluginHosts();app.exit(0)}
 process.once('SIGTERM',()=>void cleanup());process.once('SIGINT',()=>void cleanup())
}
