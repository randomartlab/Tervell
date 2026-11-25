import {app,dialog} from 'electron'
import {createServer} from 'node:http'
import {mkdtempSync,mkdirSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {execFileSync} from 'node:child_process'
import {writeJsonFileAtomic,writeTextFileAtomic} from '../apps/electron/src/main/lib/safe-file'
const root=mkdtempSync(join(tmpdir(),'tervell-timeline-check-'))
process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain')
const assert=(value:unknown,message:string)=>{if(!value)throw Error(message)}
async function run(){
 mkdirSync(join(root,'config'),{recursive:true});mkdirSync(join(root,'project'))
 writeJsonFileAtomic(join(root,'config/agent-workspaces.json'),{version:2,workspaces:[{id:'a',name:'过程验收',slug:'a',projectRootPath:join(root,'project'),createdAt:1,updatedAt:1}]})
 const manager=await import('../apps/electron/src/main/lib/agent-session-manager'),history=await import('../apps/electron/src/main/lib/history-context'),native=await import('../apps/electron/src/main/lib/builtin-native-service')
 const source=manager.createAgentSession('源会话',undefined,'a'),target=manager.createAgentSession('目标会话',undefined,'a')
 manager.updateAgentSessionMeta(source.id,{kernelId:'codex-fixture',kernelModelId:'vendor/model',gatewayReasoning:{model:'vendor/model',effort:'ultra'}})
 manager.appendSDKMessages(source.id,[{type:'user',uuid:'q',message:{content:[{type:'text',text:'导入前的提问'}]},_createdAt:1},{type:'assistant',uuid:'a',message:{content:[{type:'thinking',thinking:'原始推理'},{type:'tool_use',id:'read-1',name:'read',input:{path:'example.txt'}},{type:'text',text:'完整回答'}]},_createdAt:2},{type:'user',uuid:'result',message:{content:[{type:'tool_result',tool_use_id:'read-1',content:'工具结果'}]},_createdAt:3},{type:'assistant',uuid:'later',message:{content:[{type:'text',text:'截断点之后'}]},_createdAt:4}])
 const attachment=await history.historyContextCall('history.attach',{sourceId:source.id,targetId:target.id})as {marker:string}
 const expanded=history.expandHistoryAttachments(target.id,attachment.marker+'\n继续')
 assert(expanded.includes('原始推理')&&expanded.includes('工具结果')&&expanded.includes('完整回答')&&!expanded.includes('[[tervell-asset:'),'历史附件未完整展开')
 const rebound=history.rebindHistoryAttachments(target.id,source.id,attachment.marker);assert(history.expandHistoryAttachments(source.id,rebound).includes('工具结果'),'分叉历史附件未重绑')
 assert(await Promise.resolve().then(()=>history.expandHistoryAttachments(source.id,attachment.marker)).then(()=>false,()=>true),'历史附件越过目标会话边界')
 const large='完整大历史 '+('history payload line\n').repeat(150000)+'结束标记'
 const longAttachment=history.createHistoryAttachment(target.id,'超过2MB的完整会话',large)
 assert(longAttachment.progressive&&(longAttachment.bytes??0)>2_000_000,'大历史仍被2MB产品限制阻止')
 const longPath=JSON.parse(decodeURIComponent(longAttachment.marker.match(/tervell-asset:([^\]]+)/)![1]!))as {path:string}
 assert(readFileSync(longPath.path,'utf8')===large,'大历史快照丢失内容')
 const longPrompt=history.expandHistoryAttachments(target.id,longAttachment.marker)
 assert(longPrompt.includes('完整文件路径')&&longPrompt.length<60000&&!longPrompt.includes('结束标记'),'大历史没有使用完整文件渐进读取')
 assert(await Promise.resolve().then(()=>history.createHistoryAttachment(target.id,'空会话','  \n ')).then(()=>false,error=>String(error).includes('历史为空')&&!String(error).includes('2MB')),'空历史提示未单独区分')
 console.log('LARGE HISTORY >2MB accepted, full snapshot digest and bounded progressive prompt, separate empty notice PASS')
 const fork=await history.historyContextCall('history.fork',{sourceId:source.id,upTo:'a',target:'tab'})as {session:typeof source;marker:string;native:boolean}
 assert(!fork.native&&fork.session.kernelId==='codex-fixture'&&fork.session.gatewayReasoning?.effort==='ultra','跨内核分叉丢失模型配置')
 const forkedText=history.expandHistoryAttachments(fork.session.id,fork.marker)
 assert(forkedText.includes('完整回答')&&!forkedText.includes('截断点之后'),'分叉包含了截断点之后消息')
 const marker=JSON.parse(decodeURIComponent(attachment.marker.match(/tervell-asset:([^\]]+)/)![1]!))as {path:string}
 writeTextFileAtomic(marker.path,'篡改')
 assert(await Promise.resolve().then(()=>history.expandHistoryAttachments(target.id,attachment.marker)).then(()=>false,()=>true),'被修改历史仍静默发送')
 await native.builtinNativeCall('activity.write',{reasoning:'expanded',operations:'collapsed'})
 assert(JSON.stringify(await native.builtinNativeCall('activity.read',{}))===JSON.stringify({reasoning:'expanded',operations:'collapsed'}),'过程显示设置未落盘')
 const mobile=await import('../apps/electron/src/main/lib/mobile-activity');const projected=mobile.mobileMessages(source.id)
 assert(projected.some(m=>m.activity?.some(row=>row.kind==='reasoning'&&row.body==='原始推理'))&&projected.some(m=>m.activity?.some(row=>row.body.includes('工具结果'))),'手机没有结构化推理和工具结果')
 const extensions=await import('../apps/electron/src/main/lib/desktop-extension-service'),runtime=await import('../apps/electron/src/main/lib/plugin-host/runtime')
 assert(extensions.desktopPluginState().installed.some(p=>p.manifest.id==='builtin-vivid-activity'&&p.enabled),'Vivid未默认启用')
 await runtime.syncPluginHosts()
 assert(runtime.pluginStatuses().every(s=>s.phase==='ready'),'内置服务启动失败：'+JSON.stringify(runtime.pluginStatuses()))
 // 真实Pi树分叉：新项目不能把目标默认内核带回源Pi artifact。
 const sdk=await import('@earendil-works/pi-coding-agent')
 const piSource=manager.createAgentSession('Pi原生分叉',undefined,'a')
 const artifacts=join(root,'pi-artifacts');mkdirSync(artifacts)
 const pi=sdk.SessionManager.create(join(root,'project'),artifacts)
 pi.appendMessage({role:'user',content:'Pi原始问题',timestamp:1})
 const keep=pi.appendMessage({role:'assistant',content:[{type:'text',text:'Pi保留回答'}],api:'openai-completions',provider:'openai',model:'fixture',usage:{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},stopReason:'stop',timestamp:2})
 pi.appendMessage({role:'user',content:'Pi后续问题',timestamp:3})
 manager.updateAgentSessionMeta(piSource.id,{kernelId:'pi',sdkSessionId:pi.getSessionId(),piSessionFile:pi.getSessionFile(),piEntryBindings:{'pi-keep':keep},reasoningLevel:'high'})
 manager.appendSDKMessages(piSource.id,[{type:'user',uuid:'pi-q',message:{content:'Pi原始问题'}},{type:'assistant',uuid:'pi-keep',message:{content:'Pi保留回答'}},{type:'user',uuid:'pi-later',message:{content:'Pi后续问题'}}])
 const projectB=join(root,'project-b');mkdirSync(projectB)
 const workspaceB=await (await import('../apps/electron/src/main/lib/agent-workspace-manager')).createAgentWorkspace({name:'原生分叉目标',projectRootPath:projectB})
 const nativeFork=await manager.forkAgentSession({sessionId:piSource.id,upToMessageUuid:'pi-keep',targetWorkspaceId:workspaceB.id})
 assert(nativeFork.workspaceId===workspaceB.id&&nativeFork.kernelId==='pi','Pi分叉项目或内核错位')
 const nativeContext=sdk.SessionManager.open(nativeFork.piSessionFile!).buildSessionContext()
 assert(JSON.stringify(nativeContext).includes('Pi保留回答')&&!JSON.stringify(nativeContext).includes('Pi后续问题'),'原生Pi分叉artifact未截断')
 console.log('PI FORK actual SessionManager branch, target workspace, retained thinking and cutoff PASS')
 const selected=join(root,'导出 空格 文件夹');mkdirSync(selected)
 const savedDialog=dialog.showOpenDialog;let dialogCalls=0
 dialog.showOpenDialog=(async(...args:unknown[])=>{dialogCalls++;const options=args.at(-1)as {properties:string[]};assert(options.properties.includes('openDirectory'),'未调用原生目录选择');return {canceled:dialogCalls===1,filePaths:dialogCalls===1?[]:[selected]}})as typeof dialog.showOpenDialog
 assert(await native.builtinNativeCall('export.choose-directory',{})===null,'取消文件夹选择不是null')
 assert(await native.builtinNativeCall('export.choose-directory',{})===selected,'Unicode文件夹选择未保真');dialog.showOpenDialog=savedDialog
 const importFile=join(root,'完整 导入记录.md');writeTextFileAtomic(importFile,large)
 dialog.showOpenDialog=(async()=>({canceled:false,filePaths:[importFile]}))as typeof dialog.showOpenDialog
 try{
  const imported=await history.historyContextCall('history.file',{targetId:target.id})as {marker:string;bytes:number;progressive:boolean}
  const importedAsset=JSON.parse(decodeURIComponent(imported.marker.match(/tervell-asset:([^\]]+)/)![1]!))as {path:string}
  assert(imported.progressive&&imported.bytes>2_000_000&&readFileSync(importedAsset.path,'utf8')===large,'文件导入仍有容量限制或丢失内容')
  writeTextFileAtomic(importFile,' \n\u3000'.repeat(400000))
  assert(await history.historyContextCall('history.file',{targetId:target.id}).then(()=>false,error=>String(error).includes('历史为空')),'大空白文件没有独立空历史提示')
 }finally{dialog.showOpenDialog=savedDialog}
 console.log('FILE IMPORT >2MB complete UTF-8 snapshot, large whitespace-only file rejected separately PASS')
 const options={agentId:source.id,format:'json',options:{includeReasoning:true,includeTools:true,includeTimestamps:true}}
 const result=await runtime.pluginRpc('builtin-conversation-export','session.export',options)as {content:string}
 assert(result.content.includes('原始推理')&&result.content.includes('工具结果'),'导出字段适配破坏原始内容')
 const saved=await runtime.pluginRpc('builtin-conversation-export','session.save',{...options,destination:'custom',directory:selected})as {path:string};assert(saved.path.startsWith(selected)&&readFileSync(saved.path,'utf8').includes('原始推理'),'浏览选定文件夹后未写入完整导出')
 // 原始ACP会话列表分页与load只读回放，无prompt调用。
 const fixture=join(root,'history-cli.cjs'),audit=join(root,'cli-methods.jsonl')
 writeTextFileAtomic(fixture,`const readline=require('readline'),fs=require('fs');const rl=readline.createInterface({input:process.stdin});rl.on('line',line=>{const r=JSON.parse(line);fs.appendFileSync(${JSON.stringify(audit)},JSON.stringify(r.method)+'\\n');let result={};if(r.method==='initialize')result={protocolVersion:1,agentCapabilities:{sessionCapabilities:{list:{}},loadSession:true}};else if(r.method==='session/list')result={sessions:[{sessionId:r.params.cursor?'external-2':'external-1',cwd:r.params.cwd,title:r.params.cursor?'CLI第二页':'CLI第一页',updatedAt:'2026-11-23T00:00:00Z'}],...(r.params.cursor?{}:{nextCursor:'page2'})};else if(r.method==='session/load'){for(const update of [{sessionUpdate:'user_message_chunk',content:{type:'text',text:'外部CLI提问'}},{sessionUpdate:'agent_message_chunk',content:{type:'text',text:'外部CLI完整回答'}}])process.stdout.write(JSON.stringify({jsonrpc:'2.0',method:'session/update',params:{sessionId:r.params.sessionId,update}})+'\\n')}else if(r.method==='session/prompt')throw Error('导入不允许prompt');process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:r.id,result})+'\\n')})`)
 extensions.saveDesktopKernel({id:'history-fixture',name:'History fixture',command:process.env.TERVELL_TEST_NODE??execFileSync('which',['node'],{encoding:'utf8'}).trim(),args:[fixture],enabled:true})
 const providers=await history.historyContextCall('history.providers',{targetId:target.id})as {entries:Array<{id:string;title:string}>;warnings:string[]}
 assert(providers.entries.some(r=>r.title==='CLI第二页'),'CLI历史分页未导入：'+JSON.stringify(providers))
 const cliAttachment=await history.historyContextCall('history.attach',{targetId:target.id,sourceId:providers.entries.find(r=>r.title==='CLI第二页')!.id})as {marker:string}
 assert(history.expandHistoryAttachments(target.id,cliAttachment.marker).includes('外部CLI完整回答'),'CLI历史没有进入可发送快照')
 assert(!readFileSync(audit,'utf8').includes('session/prompt'),'历史导入发起了模型请求')
 // 真实本机SSE验证：只翻译已有文字，无工具，无上下文泄漏，并复用缓存。
 let requests=0
 const upstream=createServer(async(req,res)=>{let body='';for await(const part of req)body+=part;requests++;const input=JSON.parse(body)as {tools?:unknown;messages?:unknown};assert(!Array.isArray(input.tools)||!input.tools.length,'翻译携带了工具');assert(!body.includes('导入前的提问'),'翻译带出无关会话历史');res.writeHead(200,{'content-type':'text/event-stream'});res.end('data: '+JSON.stringify({id:'translate',model:'fixture',choices:[{index:0,delta:{content:'先检查文件，然后确认结果。'},finish_reason:null}]})+'\n\ndata: '+JSON.stringify({id:'translate',model:'fixture',choices:[{index:0,delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n')})
 await new Promise<void>(ok=>upstream.listen(0,'127.0.0.1',ok))
 try{const {createChannel}=await import('../apps/electron/src/main/lib/channel-manager');const port=(upstream.address()as {port:number}).port;const channel=createChannel({name:'翻译本机模拟',provider:'openai',baseUrl:'http://127.0.0.1:'+port+'/v1',apiKey:'local-translation-fixture',enabled:true,models:[{id:'fixture',name:'Fixture',enabled:true}]});await native.builtinNativeCall('activity.write',{reasoning:'balanced',operations:'balanced',chineseReasoning:true,translationModel:{channelId:channel.id,modelId:'fixture'}})
  const raw={sessionId:source.id,text:'First inspect the file and then confirm all results.'};let job=await native.builtinNativeCall('activity.translate',raw)as {id:string;phase:string;translation?:string;error?:string};for(let i=0;i<100&&['queued','running'].includes(job.phase);i++){await new Promise(r=>setTimeout(r,50));job=await native.builtinNativeCall('activity.translation-status',job.id)as typeof job}assert(job.phase==='done'&&job.translation==='先检查文件，然后确认结果。','推理翻译失败：'+job.error);await native.builtinNativeCall('activity.translate',raw);assert(requests===1,'重复显示导致重新计费翻译');assert(manager.getAgentSessionSDKMessagesStrict(source.id).some(m=>JSON.stringify(m).includes('原始推理')),'中文展示覆盖原始转录');console.log('CHINESE real local SSE, tool-free, no unrelated context, cache reuse, original retained PASS')
 }finally{upstream.closeAllConnections();await new Promise<void>(ok=>upstream.close(()=>ok()))}
 for(const status of runtime.pluginStatuses())await runtime.stopPluginHost(status.id)
 console.log('HISTORY snapshot completeness, fork cutoff/config, target boundaries, digest PASS')
 console.log('ACTIVITY persisted policies, Android structured reasoning/tool result, Vivid default startup PASS')
 console.log('EXPORT native chooser cancel/Unicode directory and actual saved file PASS');console.log('PROVIDER IMPORT actual ACP pagination/load, no model prompt PASS');console.log('PROFILE',root)
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1)})
