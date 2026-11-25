import { app } from 'electron'
import { build } from 'esbuild'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file'

const root=mkdtempSync(join(tmpdir(),'tervell-acp-host-'))
process.env.TERVELL_PROFILE_DIR=root
app.setPath('userData',join(root,'chromium'))
;(app as typeof app&{setAppPath(path:string):void}).setAppPath(resolve('apps/electron'))
app.commandLine.appendSwitch('use-mock-keychain')
const check=(value:unknown,message:string):void=>{if(!value)throw Error(message)}
async function run(){
 const fixture=join(root,'ACP fixture 中文 空格.cjs')
 await build({entryPoints:[resolve('packages/kernel-host/src/acp/test-fixtures/reliability-server.ts')],bundle:true,platform:'node',format:'cjs',outfile:fixture})
 const {AcpKernel}=await import('@proma/kernel-host')
 const before=process.memoryUsage().rss,stats:Array<{round:number;rssBytes:number;heapBytes:number}>=[]
 const executable=process.env.TERVELL_QA_NODE_BIN
 if(!executable)throw Error('请明确指定本次隔离验收使用的Node运行时 TERVELL_QA_NODE_BIN')
 const environment=(await import('../apps/electron/src/main/lib/desktop-extension-service')).desktopCliEnvironment()
 let command=executable,args=[fixture]
 if(process.platform==='win32'){
  const launcher=join(root,'ACP launcher 中文.cmd')
  // 此测试脚本明确以 UTF-8 写入；cmd 必须先选 UTF-8，再解释带中文的路径。
  writeFileSync(launcher,'@echo off\r\nchcp 65001 >nul\r\n"'+executable+'" "'+fixture+'" %*\r\n')
  command=launcher;args=[]
 }
 const soakDurationMs=Number(process.env.TERVELL_QA_SOAK_MS??0)
 check(Number.isSafeInteger(soakDurationMs)&&soakDurationMs>=0&&soakDurationMs<=3600000,'持续验收时限必须介于0和一小时')
 const soakStarted=Date.now();let rounds=0
 for(let i=0;i<30||Date.now()-soakStarted<soakDurationMs;i++){
  const kernel=new AcpKernel('soak',{command,args,inheritEnv:false,env:environment,timeoutMs:3000,cancelGraceMs:100})
  const handle=await kernel.createSession({sessionId:'soak-'+i,cwd:root,systemPrompt:''})
  try{
   const events=[];for await(const event of kernel.prompt(handle,{runId:'round-'+i,text:'quick',history:[]},{signal:new AbortController().signal}))events.push(event)
   check(events.at(-1)?.t==='done'&&!events.some(e=>e.t==='error'),'重复运行未完成')
   const controller=new AbortController(),iterator=kernel.prompt(handle,{runId:'cancel-'+i,text:'hold',history:[]},{signal:controller.signal})[Symbol.asyncIterator]()
   await iterator.next();controller.abort();while(!(await iterator.next()).done){/* 等待真实进程退出。 */}
  }finally{await kernel.close(handle)}
  rounds=i+1
  if(i%5===4)stats.push({round:i+1,rssBytes:process.memoryUsage().rss,heapBytes:process.memoryUsage().heapUsed})
 }
 check((stats.at(-1)?.rssBytes??0)-before<160*1024*1024,'持续运行宿主RSS净增长超过160MiB，禁止通过')
 const config=join(root,'config'),project=join(root,'project');mkdirSync(config,{recursive:true});mkdirSync(project)
 writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'a',slug:'a',name:'ACP回归',projectRootPath:project,createdAt:1,updatedAt:1}]})
 const desktop=await import('../apps/electron/src/main/lib/desktop-extension-service')
 desktop.saveDesktopKernel({id:'qa.recovery',name:'ACP流式恢复验收',command:executable,args:[fixture],enabled:true})
 // 本次自定义Node入口使用隔离HOME，不借用日常账号。
 const managed=await import('../apps/electron/src/main/lib/desktop-cli-managed')
 const directory=join(config,'cli-runtime/agents/qa.recovery/versions/fixture');mkdirSync(directory,{recursive:true})
 const {copyFileSync}=await import('node:fs');const privateBin=join(directory,process.platform==='win32'?'runtime.exe':'runtime');copyFileSync(executable,privateBin)
 if(process.platform!=='win32')(await import('node:fs')).chmodSync(privateBin,0o700)
 managed.writeManagedCli({version:1,id:'qa.recovery',command:privateBin,args:[fixture],env:{},directory,installedVersion:'fixture',source:'isolated fixture',cliSelfContained:true})
 const manager=await import('../apps/electron/src/main/lib/agent-session-manager')
 const {DesktopAcpRunner}=await import('../apps/electron/src/main/lib/desktop-acp-runner')
 const {AgentEventBus}=await import('../apps/electron/src/main/lib/agent-event-bus')
 const bus=new AgentEventBus(),runner=new DesktopAcpRunner(bus),session=manager.createAgentSession('重载恢复',undefined,'a',undefined,'project',undefined,false,{kernelId:'qa.recovery'})
 let errors:string[]=[],replayed=false,deltaEvents=0,heldContentReceived=false;const received:unknown[]=[]
 const off=bus.on((id,payload)=>{if(id!==session.id)return;received.push(payload);if(JSON.stringify(payload).includes('HOLD_CONTENT'))heldContentReceived=true;if(payload.kind==='sdk_delta'){deltaEvents++;if(!replayed){replayed=true;runner.replay(id)}}})
 const send=async(text:string)=>{const uuid=crypto.randomUUID();manager.appendSDKMessages(session.id,[{type:'user',uuid,message:{content:[{type:'text',text}]}}]);await runner.run({sessionId:session.id,workspaceId:'a',channelId:'unused',userMessage:text,userMessageUuid:uuid},{onTitleUpdated:()=>{},onError:error=>errors.push(error),onComplete:()=>{}},Date.now())}
 try{
  await send('stream')
  check(!errors.length&&deltaEvents>0&&replayed,'桌面ACP未通过delta/重订阅运行')
  const transcript=manager.getAgentSessionSDKMessagesStrict(session.id),text=JSON.stringify(transcript)
  check(text.includes('PREFIX_0')&&text.includes('SUFFIX_39')&&text.includes('actual-command')&&text.includes('更新后的工具标题'),'流式正文或工具patch没有完整持久化')
  check(received.some(p=>{const row=p as {kind?:string;message?:Record<string,unknown>};return row.kind==='sdk_message'&&row.message?._partial===true}),'重订阅未重发未完成内容')
  const pending=send('hold');const holdDeadline=Date.now()+15000;while(!heldContentReceived&&Date.now()<holdDeadline)await new Promise(r=>setTimeout(r,10));check(heldContentReceived,'取消测试尚未收到真实流式内容');await runner.stop(session.id);await pending
  check(!runner.isActive(session.id),'停止后runner仍占用槽位')
  check(JSON.stringify(manager.getAgentSessionSDKMessagesStrict(session.id)).includes('HOLD_CONTENT'),'停止后已生成内容丢失')
 }finally{off();await(await import('../apps/electron/src/main/lib/plugin-host/runtime')).stopAllPluginHosts();(await import('../apps/electron/src/main/lib/model-routing-service')).stopModelRouting()}
 const result={ok:true,platform:process.platform,arch:process.arch,rounds,soakDurationMs:Date.now()-soakStarted,cmdLauncher:process.platform==='win32',deltaEvents,replayed,toolPatchPersisted:true,cancelPreserved:true,mainBeforeBytes:before,mainAfterBytes:process.memoryUsage().rss,stats}
 writeJsonFileAtomic(join(root,'acp-host-runtime.json'),result);console.log(JSON.stringify(result));console.log('EVIDENCE',root)
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1)})
