import { app, BrowserWindow } from 'electron';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { writeJsonFileAtomic, writeTextFileAtomic } from '../apps/electron/src/main/lib/safe-file';

/** 真实桌面ACP runner + 实际OMP + 回环模型：重复bash、非空env、文件写入、完整终态。 */
const root=mkdtempSync(join(tmpdir(),'tervell-desktop-terminal-'));
process.env.TERVELL_PROFILE_DIR=root;
app.setPath('userData',join(root,'chromium'));
(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));
app.commandLine.appendSwitch('use-mock-keychain');
const assert=(condition:unknown,message:string):void=>{if(!condition)throw Error(message)};

async function run(){
 const window=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
 const config=join(root,'config'),cwd=join(root,'project'),agent=join(root,'omp-agent');
 for(const path of[config,cwd,agent])mkdirSync(path,{recursive:true});
 writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'a',slug:'a',name:'终端隔离验收',projectRootPath:cwd,createdAt:1,updatedAt:1}]});
 let requests=0;let fullConversation='';
 const upstream=createServer(async(req,res)=>{
  let content='';for await(const part of req)content+=String(part);const body=JSON.parse(content);requests++;fullConversation=JSON.stringify(body.messages);
  console.log('LOCAL MODEL REQUEST',requests);
  const command=requests<=12?`printf 'DESKTOP_BASH_${requests}'; pwd`:requests===13?"printf 'written-by-acp' > completed.txt; cat completed.txt":undefined;
  const call=command?{name:'bash',input:{i:'local isolated shell regression',command,pty:false}}:undefined;
  const events=[{type:'message_start',message:{id:'m'+requests,type:'message',role:'assistant',content:[],model:'local',stop_reason:null,stop_sequence:null,usage:{input_tokens:1,output_tokens:0}}},{type:'content_block_start',index:0,content_block:call?{type:'tool_use',id:'t'+requests,name:call.name,input:{}}:{type:'text',text:''}},{type:'content_block_delta',index:0,delta:call?{type:'input_json_delta',partial_json:JSON.stringify(call.input)}:{type:'text_delta',text:'桌面对话和 Bash 工具完整完成。'}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:call?'tool_use':'end_turn',stop_sequence:null},usage:{output_tokens:2}},{type:'message_stop'}];
  res.writeHead(200,{'content-type':'text/event-stream'});res.end(events.map(event=>`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''));
 });
 await new Promise<void>(ok=>upstream.listen(0,'127.0.0.1',ok));
 const port=(upstream.address()as{port:number}).port;
 writeJsonFileAtomic(join(agent,'models.yml'),{providers:{offline:{baseUrl:`http://127.0.0.1:${port}`,api:'anthropic-messages',auth:'apiKey',apiKey:'local-fixture-only',models:[{id:'desktop-fixture',name:'Desktop local',reasoning:false,input:['text'],contextWindow:200000,maxTokens:2048}]}}});
 writeTextFileAtomic(join(agent,'config.yml'),'enabledModels:\n  - offline/desktop-fixture\n');
 const runtime=await import('../apps/electron/src/main/lib/plugin-host/runtime');
 try{
  const desktop=await import('../apps/electron/src/main/lib/desktop-extension-service');
  const managed=await import('../apps/electron/src/main/lib/desktop-cli-managed');
  const executable=process.env.TERVELL_QA_OMP_BIN;if(!executable)throw Error('请显式指定隔离验收使用的既有OMP可执行文件');
  const installation=join(config,'cli-runtime/agents/omp/versions/local');mkdirSync(installation,{recursive:true});
  // 私有启动器只调用明确指定的已有程序，不安装依赖或继承日常HOME。
  const {copyFileSync,chmodSync}=await import('node:fs');const privateBin=join(installation,'omp');copyFileSync(executable,privateBin);chmodSync(privateBin,0o700);
  managed.writeManagedCli({version:1,id:'omp',command:privateBin,args:['acp','--model','offline/desktop-fixture'],env:{PI_CODING_AGENT_DIR:agent,PI_NO_PTY:'1',PI_OFFLINE:'1'},directory:installation,installedVersion:'qa-existing',source:'explicit local test',cliSelfContained:true});
  desktop.saveDesktopKernel({id:'omp',name:'oh-my-pi',command:'omp',args:['acp'],enabled:true});
  const manager=await import('../apps/electron/src/main/lib/agent-session-manager');
  const session=manager.createAgentSession('普通任务执行回归',undefined,'a',undefined,'project',undefined,false,{kernelId:'omp',kernelAutoApprove:true});
  manager.appendSDKMessages(session.id,[{type:'user',uuid:'qa-input',message:{content:[{type:'text',text:'执行已批准的隔离回归命令'}]}}]);
  const {AgentEventBus}=await import('../apps/electron/src/main/lib/agent-event-bus');const bus=new AgentEventBus();
  const {DesktopAcpRunner}=await import('../apps/electron/src/main/lib/desktop-acp-runner');
  const errors:string[]=[];let completed=false;
  await new DesktopAcpRunner(bus).run({sessionId:session.id,userMessage:'执行已批准的隔离回归命令',workspaceId:'a',channelId:'not-used-by-acp'},{onError:error=>{errors.push(error);console.error('RUN ERROR',error)},onComplete:(_messages,options)=>{completed=options?.resultSubtype==='success';console.log('RUN COMPLETE',JSON.stringify(options))},onTitleUpdated:()=>{}},1);
  assert(!errors.length,'桌面runner报错：'+errors.join(';'));assert(completed,'桌面runner未正常完成');
  assert(fullConversation.includes('DESKTOP_BASH_12')&&fullConversation.includes('written-by-acp'),'工具输出未回传模型');
  assert(readFileSync(join(cwd,'completed.txt'),'utf8')==='written-by-acp','实际文件未写入');
  const transcript=manager.getAgentSessionSDKMessages(session.id);assert(JSON.stringify(transcript).includes('桌面对话和 Bash 工具完整完成。'),'完整回答未持久化');
  assert(transcript.some(message=>message.type==='result'&&message.subtype==='success'),'没有成功终态');
  console.log(JSON.stringify({status:'passed',actualKernel:'omp',upstream:'local-only',requests,terminalCommands:13,finalPersisted:true,realFileWritten:true,accountDirectory:'isolated',errors}));
 }finally{await runtime.stopAllPluginHosts();upstream.closeAllConnections();await new Promise<void>(ok=>upstream.close(()=>ok()));window.destroy()}
 console.log('ISOLATED PROFILE',root);
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1)});
