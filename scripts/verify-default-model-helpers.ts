import {app} from 'electron';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeJsonFileAtomic} from '../apps/electron/src/main/lib/safe-file';
const root=mkdtempSync(join(tmpdir(),'tervell-helper-models-'));process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));app.commandLine.appendSwitch('use-mock-keychain');
const assert=(ok:unknown,message:string)=>{if(!ok)throw Error(message)};
app.whenReady().then(run).catch(error=>{console.error(error);app.exit(1)});
async function run(){
 const calls:Array<{model:unknown;effort:unknown;tools:unknown;prompt:string}>=[];
 const upstream=createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text) as {model:string;reasoning_effort?:unknown;tools?:unknown;messages?:unknown};calls.push({model:body.model,effort:body.reasoning_effort,tools:body.tools,prompt:JSON.stringify(body.messages)});const title=JSON.stringify(body.messages).includes('task titles only');const content=title?'本机辅助模型验收':'这是翻译后的完整文字。';res.writeHead(200,{'content-type':'text/event-stream'});const base={id:'fixture-'+Date.now(),object:'chat.completion.chunk',created:1,model:body.model};res.end(`data: ${JSON.stringify({...base,choices:[{index:0,delta:{role:'assistant',content},finish_reason:null}]})}\n\ndata: ${JSON.stringify({...base,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:10,total_tokens:20}})}\n\ndata: [DONE]\n\n`);});
 await new Promise<void>(r=>upstream.listen(0,'127.0.0.1',r));const port=(upstream.address() as {port:number}).port;
 const runtime=await import('../apps/electron/src/main/lib/plugin-host/runtime');
 try{
  mkdirSync(join(root,'config'),{recursive:true});const cwd=join(root,'project');mkdirSync(cwd);writeJsonFileAtomic(join(root,'config/agent-workspaces.json'),{version:2,workspaces:[{id:'project',name:'辅助模型验收',slug:'project',projectRootPath:cwd,createdAt:1,updatedAt:1}]});
  const {createChannel}=await import('../apps/electron/src/main/lib/channel-manager');const channel=createChannel({name:'本机模拟',provider:'openai',baseUrl:`http://127.0.0.1:${port}/v1`,apiKey:'local-fixture',enabled:true,models:[{id:'fixture',name:'Fixture',enabled:true,efforts:['none','low','ultra']}]});writeJsonFileAtomic(join(root,'config/settings.json'),{agentChannelId:channel.id,agentModelId:'fixture',notificationsEnabled:false,onboardingCompleted:true});
  const manager=await import('../apps/electron/src/main/lib/agent-session-manager');const parent=manager.createAgentSession('辅助模型来源',channel.id,'project','fixture');manager.updateAgentSessionMeta(parent.id,{modelReasoning:{channelId:channel.id,model:'fixture',effort:'ultra'}});manager.appendSDKMessages(parent.id,[{type:'user',uuid:'source-q',message:{content:'需要翻译和生成标题'}},{type:'assistant',uuid:'source-a',message:{content:'Source text for helper verification.'}}]);
  await runtime.syncPluginHosts();
  const read=await runtime.pluginRpc('builtin-better-conversation','settings.timeline-translation.read',{}) as {revision:string;values:Record<string,unknown>};assert(read.values.enabled===true,'翻译没有默认启用');const values={...read.values,enabled:true,disableThinking:false,targetLanguage:'zh-CN'};const saved=await runtime.pluginRpc('builtin-better-conversation','settings.timeline-translation.write',{revision:read.revision,values}) as {status:string;values:Record<string,unknown>};assert(saved.status==='saved','设置保存失败');
  const configSignature=JSON.stringify({enabled:true,targetCode:'zh-CN',customModel:false,provider:'pi',model:channel.id+'/fixture',disableThinking:false,thinkingOptionId:'ultra',prompt:saved.values.prompt});
  let job=await runtime.pluginRpc('builtin-better-conversation','translation.translate',{action:'start',jobId:'helper-check',agentId:parent.id,text:'Translate this sentence.',sourceKind:'assistant_message',interfaceLanguage:'zh',configSignature}) as {state:string;error?:string;translation?:string};
  for(let i=0;i<180&&job.state==='running';i++){await new Promise(r=>setTimeout(r,300));job=await runtime.pluginRpc('builtin-better-conversation','translation.translate',{action:'status',jobId:'helper-check'}) as typeof job;}
  console.log('TRANSLATION',JSON.stringify(job));assert(job.state==='done'&&job.translation==='这是翻译后的完整文字。','真实翻译辅助失败：'+job.error);
  assert(calls.some(c=>c.effort==='ultra'),'辅助请求丢失原始 ultra');console.log('TOOLS',JSON.stringify(calls.map(c=>({effort:c.effort,tools:c.tools}))));assert(calls.every(c=>!Array.isArray(c.tools)||c.tools.length===0),'无工具辅助仍暴露工具');
  let title=await runtime.pluginRpc('builtin-better-conversation','tasks.title-update',{agentId:parent.id,action:'start',mode:'preview'}) as {state:string;error?:string;title?:string};for(let i=0;i<180&&title.state==='running';i++){await new Promise(r=>setTimeout(r,300));title=await runtime.pluginRpc('builtin-better-conversation','tasks.title-update',{agentId:parent.id,action:'status',mode:'preview'}) as typeof title;}
  console.log('TITLE',JSON.stringify(title));assert(title.state==='done'&&title.title==='本机辅助模型验收','标题生成辅助失败：'+title.error);
  console.log('UPSTREAM',JSON.stringify(calls.map(({prompt,...value})=>({...value,containsSource:prompt.includes('Translate this sentence.')}))));console.log('PROFILE',root);
 }finally{await runtime.stopAllPluginHosts();upstream.close();}
 app.exit(0);
}
