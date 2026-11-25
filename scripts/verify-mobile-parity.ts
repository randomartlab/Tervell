import {build} from 'esbuild';
import {app} from 'electron';
import {mkdtempSync,mkdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash,randomUUID,randomBytes} from 'node:crypto';
import type {MobileControlCall} from '@proma/protocol';
import {writeJsonFileAtomic,writeTextFileAtomic} from '../apps/electron/src/main/lib/safe-file';
import {sealRemote,openRemote} from '../packages/core/src/remote/crypto';
import {decodeRemotePairing} from '../packages/core/src/remote/tunnel-client';
import {request} from 'node:https';
const root=mkdtempSync(join(tmpdir(),'tervell-mobile-parity-verify-'));
process.env.TERVELL_PROFILE_DIR=root;process.env.PROMA_RELEASE_CHANNEL='alpha';app.setPath('userData',join(root,'chromium'));(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));app.commandLine.appendSwitch('use-mock-keychain');
const assert=(value:unknown,message:string)=>{if(!value)throw Error(message);};
async function run(){
 const config=join(root,'config');mkdirSync(config,{recursive:true});mkdirSync(join(root,'project-a'));mkdirSync(join(root,'project-b'));
 writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'a',slug:'a',name:'工作区甲',projectRootPath:join(root,'project-a'),createdAt:1,updatedAt:1},{id:'b',slug:'b',name:'工作区乙',projectRootPath:join(root,'project-b'),createdAt:1,updatedAt:1}]});
 writeTextFileAtomic(join(root,'project-a','same.txt'),'项目甲原文');writeTextFileAtomic(join(root,'project-b','same.txt'),'项目乙原文');
 const remote=await import('../apps/electron/src/main/lib/remote-service'),sessions=await import('../apps/electron/src/main/lib/agent-session-manager');
 try{
 remote.configureRemote({enabled:true,connectionMode:'lan'});assert(remote.remoteStatus().allWorkspaces,'全项目未默认启用');assert(remote.remoteStatus().allowManagement,'管理未默认启用');
 const pairing=decodeRemotePairing(await remote.pairRemote());if(pairing.v!==3)throw Error('LAN pairing needed');
 const mobile={...pairing,key:randomBytes(32).toString('hex'),token:randomBytes(32).toString('hex')};let seq=0;
 const exchange=async(method:string,values:object={})=>{const packet=sealRemote(method==='pair'?pairing:mobile,'to-host',++seq,{id:randomUUID(),sentAt:Date.now(),method,...values});return new Promise<{ok:boolean;data?:Record<string,unknown>;error?:string}>((ok,bad)=>{const call=request(new URL('/v2/connect',pairing.direct.url),{method:'POST',rejectUnauthorized:false,headers:{'content-type':'application/json',authorization:'Bearer '+(method==='pair'?pairing:mobile).token}},response=>{let text='';response.on('data',bytes=>text+=String(bytes));response.on('end',()=>{try{const value=JSON.parse(text);if(response.statusCode!==200)throw Error('HTTP '+response.statusCode);ok(openRemote(mobile,'to-device',0,value.packet).value as {ok:boolean;data?:Record<string,unknown>;error?:string});}catch(e){bad(e);}});});call.once('error',bad);call.end(JSON.stringify({room:mobile.room,packet}));});};
 const paired=await exchange('pair',{deviceKey:mobile.key,deviceToken:mobile.token});assert(paired.ok,'配对失败');
 const call=async(operation:string,values:MobileControlCall['values']={},workspaceId?:string,sessionId?:string)=>{
  let reply=await exchange('control',{call:{operation,values,workspaceId,sessionId}});if(!reply.ok)throw Error(reply.error);let result=reply.data!;
  while(result.job){const job=result.job as {id:string;phase:string};if(job.phase==='failed')throw Error(String(result.error));if(job.phase==='done')return result.result as Record<string,unknown>;await new Promise(r=>setTimeout(r,30));reply=await exchange('control',{call:{operation:'jobs.status',values:{id:job.id}}});if(!reply.ok)throw Error(reply.error);result=reply.data!;}
  if(result.error)throw Error(String(result.error));return result;
 };
 const directory=await call('workspaces.directory');assert((directory.workspaces as unknown[]).length===2,'默认范围遗漏旧项目');
 const created=await call('workspace.create',{name:'手机新建工作区'});const workspace=created.workspace as {id:string;slug:string},createdSession=created.session as {id:string};
 assert(!!createdSession.id,'没有首个会话');
 const status=await exchange('status');assert((status.data?.workspaces as Array<{id:string}>).some(w=>w.id===workspace.id),'配对后新增项目未自动出现');
 const content='跨工作区🙂'.repeat(50000),bytes=Buffer.from(content),sha=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
 const prepared=await call('project.edit-start',{path:'same.txt',expected:'new',digest:sha(bytes),bytes:bytes.length},workspace.id);const uploadId=String(prepared.id);
 for(let at=0;at<bytes.length;at+=48000)await call('project.edit-chunk',{id:uploadId,index:at/48000,data:bytes.subarray(at,at+48000).toString('base64')},workspace.id);
 await call('project.edit-finish',{id:uploadId},workspace.id);assert(readFileSync(join(config,'agent-workspaces',workspace.slug,'workspace-files','same.txt'),'utf8')===content,'大文件保存不完整');
 assert(readFileSync(join(root,'project-a','same.txt'),'utf8')==='项目甲原文','跨项目串写');
 console.log('PROJECTS real encrypted pair -> create -> new workspace auto discovery -> >100KB atomic edit PASS');
 const session=sessions.createAgentSession('迁移验收',undefined,'a');await call('session.move',{targetWorkspaceId:'b'},undefined,session.id);assert(sessions.getAgentSessionMeta(session.id)?.workspaceId==='b','迁移未生效');
 await call('session.cwd',{mode:'session'},undefined,createdSession.id);assert(sessions.getAgentSessionMeta(createdSession.id)?.agentCwdMode==='session','工作目录未保存');
 await call('workspace.rename',{name:'手机改名工作区'},workspace.id);await call('workspace.pin',{pinned:true},workspace.id);
 assert((await call('workspaces.directory')).workspaces,'重读失败');
 const outside=await exchange('control',{call:{operation:'project.read',workspaceId:'a',values:{path:'../project-b/same.txt'}}});assert(!outside.ok||!!outside.data?.error,'路径边界无效');
 console.log('PROJECTS move sessions + cwd + rename/pin + boundary enforced PASS');
 const channels=await import('../apps/electron/src/main/lib/channel-manager');const channel=channels.createChannel({name:'完整配置验收',provider:'openai',baseUrl:'http://127.0.0.1:1/v1',apiKey:'local-only',enabled:true,models:[{id:'full-reasoning',name:'完整推理',enabled:true,efforts:['low','ultra','vendor-future']}]});
 await call('session.configuration',{selection:{kernelId:'pi',configValues:{},autoApprove:true},channelId:channel.id,piModelId:'full-reasoning',effort:'vendor-future',cwd:'project',permissionMode:'plan',worktree:''},undefined,createdSession.id);
 const configured=sessions.getAgentSessionMeta(createdSession.id)!;assert(configured.modelReasoning?.effort==='vendor-future'&&configured.permissionMode==='plan'&&configured.kernelAutoApprove===true,'Pi配置不完整');
 const failed=await exchange('control',{call:{operation:'session.configuration',sessionId:createdSession.id,values:{selection:{kernelId:'pi',configValues:{},autoApprove:false},channelId:channel.id,piModelId:'missing-model',effort:'ultra',cwd:'session',worktree:''}}});
 assert(!failed.ok||!!failed.data?.error,'失效模型没有拒绝');assert(sessions.getAgentSessionMeta(createdSession.id)?.kernelAutoApprove===true&&sessions.getAgentSessionMeta(createdSession.id)?.agentCwdMode==='project','失败事务部分落盘');
 const dynamicFixture=join(root,'configurable-acp.cjs');await build({entryPoints:[resolve('packages/kernel-host/src/acp/test-fixtures/configurable-server.ts')],bundle:true,platform:'node',format:'cjs',outfile:dynamicFixture});
 const desktop=await import('../apps/electron/src/main/lib/desktop-extension-service');desktop.saveDesktopKernel({id:'qa.dynamic',name:'动态ACP验收',command:join(process.env.HOME!,'.bun/bin/bun'),args:[dynamicFixture],enabled:true});
 await call('kernels.preferences-save',{kernelId:'qa.dynamic',values:{modelId:'local-large',modeId:'review',configValues:{speed:'fast',thinking:'high'}}});
 await call('kernels.preferences-save',{kernelId:'qa.dynamic',targetWorkspaceId:'b',values:{modeId:'build'}});
 const inherited=await call('kernels.preferences',{kernelId:'qa.dynamic',targetWorkspaceId:'b'});assert((inherited.effective as {modeId:string;configValues:{speed:string}}).modeId==='build'&&(inherited.effective as {configValues:{speed:string}}).configValues.speed==='fast','手机全局项目继承丢失');
 const probe=await call('session.probe',{kernelId:'qa.dynamic',modelId:'local-large'},undefined,createdSession.id);
 assert((probe.controls as Array<{id:string}>).some(c=>c.id==='thinking'),'所选模型动态推理控件未返回');
 await call('session.configuration',{selection:{kernelId:'qa.dynamic',modelId:'local-large',modeId:'build',configValues:{speed:'fast',thinking:'high'},autoApprove:false},cwd:'session',worktree:''},undefined,createdSession.id);
 const acp=sessions.getAgentSessionMeta(createdSession.id)!;assert(acp.kernelId==='qa.dynamic'&&acp.kernelModelId==='local-large'&&acp.kernelModeId==='build'&&acp.kernelConfigValues?.speed==='fast'&&acp.kernelConfigValues?.thinking==='high','ACP原始配置丢失');
 console.log('MODELS Pi raw vendor-future + atomic invalid rollback + real ACP dynamic model/mode/speed/reasoning PASS');

 remote.revokeRemote(pairing.deviceId);let revoked=false;try{await exchange('status');}catch{revoked=true;}assert(revoked,'撤销未生效');
 console.log('PROJECTS default all-workspace grant + future workspace + revoke PASS');
 }finally{remote.stopRemote();await(await import('../apps/electron/src/main/lib/plugin-host/runtime')).stopAllPluginHosts();}
 console.log('PROFILE',root);
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1);});
