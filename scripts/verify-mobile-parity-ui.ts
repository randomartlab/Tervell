import {app,BrowserWindow} from 'electron';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {writeJsonFileAtomic,writeTextFileAtomic} from '../apps/electron/src/main/lib/safe-file';
import {decodeRemotePairing} from '../packages/core/src/remote/tunnel-client';
import {remotePairingLink} from '../packages/core/src/remote/pairing';
const root=mkdtempSync(join(tmpdir(),'tervell-mobile-parity-ui-'));
process.env.TERVELL_PROFILE_DIR=root;process.env.PROMA_RELEASE_CHANNEL='alpha';app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain');
async function run(){
 const config=join(root,'config');mkdirSync(config,{recursive:true});for(const name of ['a','b'])mkdirSync(join(root,'project-'+name));
 writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'a',slug:'a',name:'产品研究',projectRootPath:join(root,'project-a'),createdAt:1,updatedAt:1},{id:'b',slug:'b',name:'客户端开发',projectRootPath:join(root,'project-b'),createdAt:1,updatedAt:1}]});
 for(const name of ['a','b']){writeTextFileAtomic(join(root,'project-'+name,'同名文件.md'),'# 项目'+name+'\n\n中文🙂文件原文。\n');writeTextFileAtomic(join(root,'project-'+name,'example.ts'),'export const project = "'+name+'";\n');}
 let requestCount=0;
 const upstream=createServer(async(req,res)=>{
  if(req.url==='/browser-fixture'){res.writeHead(200,{'content-type':'text/html;charset=utf-8'});res.end('<!doctype html><meta charset="utf-8"><title>手机浏览器验收</title><label>姓名<input id="name" aria-label="姓名"></label><button onclick="document.querySelector(\'#result\').innerText=\'提交结果：\'+document.querySelector(\'#name\').value">提交</button><p id="result">等待填写</p>');return;}
  if(req.url==='/v1/models'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({data:[{id:'mobile-qa',name:'手机真实回环'}]}));return;}
  let body='';for await(const part of req)body+=String(part);const input=JSON.parse(body);requestCount++;writeJsonFileAtomic(join(root,'qa-model-requests.json'),{count:requestCount,model:input.model,effort:input.reasoning_effort,annotationExpanded:JSON.stringify(input).includes('<annotation source='),rawAnnotationLeaked:JSON.stringify(input).includes('[[tervell-annotations:')});
  res.writeHead(200,{'content-type':'text/event-stream'});const packet=(delta:object,finish:string|null=null)=>res.write('data: '+JSON.stringify({id:'qa-'+requestCount,model:'mobile-qa',choices:[{index:0,delta,finish_reason:finish}]})+'\n\n');
  packet({reasoning_content:'先核对工作区、模型与消息身份。',content:'手机请求已到达电脑。'});let step=0;const timer=setInterval(()=>{step++;if(step===1)packet({content:'\n\n原始推理档位：'+String(input.reasoning_effort??'自动')+'。'});else{clearInterval(timer);packet({content:'\n\n```typescript\nexport const connected = true;\n```'});packet({},'stop');res.end('data: [DONE]\n\n');}},500);res.on('close',()=>clearInterval(timer));
 });
 await new Promise<void>(ok=>upstream.listen(0,'127.0.0.1',ok));
 const modelPort=(upstream.address() as {port:number}).port;
 const channel=(await import('../apps/electron/src/main/lib/channel-manager')).createChannel({name:'本机隔离验收模型',provider:'openai',baseUrl:`http://127.0.0.1:${modelPort}/v1`,apiKey:'local-test',enabled:true,models:[{id:'mobile-qa',name:'完整原始推理模型',enabled:true,efforts:['none','low','high','ultra','vendor-future']}]});
 (await import('../apps/electron/src/main/lib/settings-service')).updateSettings({agentChannelId:channel.id,agentModelId:'mobile-qa'});
 const window=new BrowserWindow({show:false,webPreferences:{sandbox:true}});(await import('../apps/electron/src/main/lib/main-window-store')).setMainWindow(window);(await import('../apps/electron/src/main/lib/browser-controller')).browserController.setOwnerWindow(window);
 const manager=await import('../apps/electron/src/main/lib/agent-session-manager'),extensions=await import('../apps/electron/src/main/lib/desktop-extension-service');
 const fixture=join(root,'dynamic-acp.cjs');await build({entryPoints:[resolve('packages/kernel-host/src/acp/test-fixtures/configurable-server.ts')],bundle:true,platform:'node',format:'cjs',outfile:fixture});extensions.saveDesktopKernel({id:'qa.dynamic',name:'动态 ACP 验收',command:join(process.env.HOME!,'.bun/bin/bun'),args:[fixture],enabled:true});
 const a=manager.createAgentSession('完整模型与过程',channel.id,'a','mobile-qa'),b=manager.createAgentSession('跨项目开发',channel.id,'b','mobile-qa');
 manager.appendSDKMessages(a.id,[{type:'user',uuid:randomUUID(),message:{content:[{type:'text',text:'检查当前项目文件。'}]},_createdAt:1},{type:'assistant',uuid:randomUUID(),message:{content:[{type:'thinking',thinking:'先读取文件，再核对两个项目内容；保留原始记录。'},{type:'tool_use',id:'qa-read',name:'read',input:{path:'example.ts'}}]},_createdAt:2},{type:'user',uuid:randomUUID(),message:{content:[{type:'tool_result',tool_use_id:'qa-read',content:'export const project = "a";'}]},_createdAt:3},{type:'assistant',uuid:randomUUID(),message:{content:[{type:'text',text:'文件已核对。\n\n```typescript\nexport const connected = true;\n```'}]},_createdAt:4}]);
 const chats=await import('../apps/electron/src/main/lib/conversation-manager'),chat=chats.createConversation('桌面 Chat 续看', 'mobile-qa',channel.id);chats.updateConversationMeta(chat.id,{reasoning:{channelId:channel.id,model:'mobile-qa',effort:'ultra'}});chats.appendMessage(chat.id,{id:randomUUID(),role:'assistant',content:'这条 Chat 在电脑与手机共享。',reasoning:'完整原始推理保留。',createdAt:Date.now()});
 const vault=await import('../apps/electron/src/main/lib/vault-service');const vaultRoot=join(root,'vault');mkdirSync(vaultRoot);vault.configureVault(vaultRoot);vault.getConfiguredVaultFileSystem().writeFile({relativePath:'手机验收.md',content:'# 移动知识库\n\n电脑原文，手机可编辑。',createOnly:true});
 const tools=await import('../apps/electron/src/main/lib/agent-workspace-manager');tools.createWorkspaceSkill('a',{slug:'phone-check',name:'手机验收流程',description:'跨工作区复用流程',body:'先读实际文件，再修改并核对结果。'});
 const planning=await import('../apps/electron/src/main/lib/planning-manager');planning.createTodo({title:'手机规划验收',workspaceId:'a'});
 writeTextFileAtomic(join(root,'browser-url.txt'),`http://127.0.0.1:${modelPort}/browser-fixture`);
 const remote=await import('../apps/electron/src/main/lib/remote-service');remote.configureRemote({enabled:true,connectionMode:'lan'});const pairing=decodeRemotePairing(await remote.pairRemote());if(pairing.v!==3)throw Error('direct fixture required');const local=remotePairingLink({...pairing,direct:{...pairing.direct,url:`https://10.0.2.2:${new URL(pairing.direct.url).port}`}});
 writeJsonFileAtomic(join(root,'qa-private.json'),{root,pairing:local,first:a.id,second:b.id,chat:chat.id,channel:channel.id});writeTextFileAtomic('/tmp/tervell-mobile-workspace-ui-root',root);
 console.log('READY',JSON.stringify({root,first:a.id,second:b.id,chat:chat.id}));
 const cleanup=async()=>{remote.stopRemote();upstream.closeAllConnections();upstream.close();await(await import('../apps/electron/src/main/lib/plugin-host/runtime')).stopAllPluginHosts();await(await import('../apps/electron/src/main/lib/terminal-service')).stopAllTerminals();window.destroy();app.exit(0);};process.once('SIGTERM',()=>void cleanup());process.once('SIGINT',()=>void cleanup());
}
app.whenReady().then(run).catch(e=>{console.error(e);app.exit(1);});
