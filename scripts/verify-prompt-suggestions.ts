import {app} from 'electron'
import {mkdtempSync,mkdirSync,chmodSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {writeJsonFileAtomic,writeTextFileAtomic} from '../apps/electron/src/main/lib/safe-file'
const root=mkdtempSync(join(tmpdir(),'tervell-prompt-suggestions-')),config=join(root,'config');process.env.TERVELL_PROFILE_DIR=root
app.setPath('userData',join(root,'chromium'));app.commandLine.appendSwitch('use-mock-keychain')
const assert=(ok:unknown,message:string)=>{if(!ok)throw Error(message)}
async function run(){try{
 mkdirSync(config,{recursive:true});writeJsonFileAtomic(join(config,'agent-workspaces.json'),{version:2,workspaces:[{id:'a',name:'建议插件验收',slug:'a',createdAt:1,updatedAt:1},{id:'b',name:'未授权项目',slug:'b',createdAt:1,updatedAt:1}]})
 const bin=join(config,'cli-runtime/bin');mkdirSync(bin,{recursive:true});const cli=join(bin,'claude');writeTextFileAtomic(cli,'#!/bin/sh\ncat > /dev/null\nprintf \'%s\\n\' \'{"is_error":false,"result":"运行测试"}\'\n');chmodSync(cli,0o755)
 const service=await import('../apps/electron/src/main/lib/desktop-extension-service'),runtime=await import('../apps/electron/src/main/lib/plugin-host/runtime'),manager=await import('../apps/electron/src/main/lib/agent-session-manager')
 const offer=service.previewDesktopPlugin(resolve(process.env.TERVELL_PROMPT_SOURCE??'/tmp/tervell-prompt-suggestions-030'));service.installDesktopPlugin(offer);service.configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['a'],network:true,cli:['claude']}});await service.activateDesktopPlugin(offer.manifest.id,true)
 assert(runtime.pluginStatuses().find(p=>p.id===offer.manifest.id)?.hooks.includes('agent.turn.after'),'旧钩子未规范化');console.log('ACTIVATED original Prompt suggestions 0.3.0',runtime.pluginStatuses().map(p=>({id:p.id,phase:p.phase,hooks:p.hooks})))
 const session=manager.createAgentSession('两轮建议回归',undefined,'a'),workspace=(await import('../apps/electron/src/main/lib/agent-workspace-manager')).getAgentWorkspace('a'),cwd=manager.resolveAgentCwd(workspace,session.id,session.agentCwdMode)!,context={id:session.id,workspaceId:'a',cwd,kernelId:'pi'}
 const append=(role:'user'|'assistant',text:string,id:string)=>manager.appendSDKMessages(session.id,[{type:role,uuid:id,message:{content:[{type:'text',text}]},_createdAt:Date.now()}])
 append('user','先修复类型错误','user-1');await runtime.beginPluginTurn(context);append('assistant','类型错误已修复，下一步可以运行测试','assistant-1');await runtime.finishPluginTurn(session.id);await runtime.settlePluginNotifications(offer.manifest.id)
 assert(!manager.getAgentSessionSDKMessages(session.id).some((m):m is import('@proma/shared').SDKMessage & {subtype:string;uuid:string;item:{data:{text?:string;status:string}}}=>m.type==='system'&&(m as {subtype?:string}).subtype==='plugin_timeline'),'首轮不应产生建议')
 append('user','检查修改','user-2');await runtime.beginPluginTurn(context);append('assistant','检查完成，可以运行测试','assistant-2');await runtime.finishPluginTurn(session.id);await runtime.settlePluginNotifications(offer.manifest.id)
 const rows=()=>manager.getAgentSessionSDKMessages(session.id).filter((m):m is import('@proma/shared').SDKMessage & {subtype:string;uuid:string;item:{data:{text?:string;status:string}}}=>m.type==='system'&&(m as {subtype?:string}).subtype==='plugin_timeline');const ready=rows();console.log('SUGGESTION',JSON.stringify(ready))
 assert(ready.length===1&&ready[0]!.item.data.text==='运行测试','第二轮未产生真实插件建议')
 const uuid=ready[0]?.uuid;await runtime.finishPluginTurn(session.id);await runtime.settlePluginNotifications(offer.manifest.id);assert(rows().length===1,'重复结束触发了第二条建议')
 append('user','开始下一轮','user-3');await runtime.beginPluginTurn(context);await runtime.settlePluginNotifications(offer.manifest.id);const dismissed=rows();assert(dismissed.length===1&&dismissed[0]?.uuid===uuid&&dismissed[0]!.item.data.status==='dismissed','下一轮没有原位撤回建议')
 await runtime.finishPluginTurn(session.id,false,true);await runtime.settlePluginNotifications(offer.manifest.id);assert(rows().length===1,'取消回合产生了新建议');console.log('DISMISSAL updated same row; duplicate completion ignored; canceled turn skipped')
 const other=manager.createAgentSession('未授权',undefined,'b');assert(await runtime.pluginHostOperation(offer.manifest.id,'agent.timeline',{id:other.id}).then(()=>false,()=>true),'越权项目读取未拒绝')
 await service.activateDesktopPlugin(offer.manifest.id,false);await service.activateDesktopPlugin(offer.manifest.id,true);assert(runtime.pluginStatuses().find(p=>p.id===offer.manifest.id)?.phase==='ready','停启失败')
 // 原版插件注册的归档/关闭事件也必须在真实管理器操作时发出。
 append('user','归档前建议','archive-user');await runtime.beginPluginTurn(context);append('assistant','归档后应撤回','archive-answer');await runtime.finishPluginTurn(session.id);await runtime.settlePluginNotifications(offer.manifest.id);
 manager.updateAgentSessionMeta(session.id,{archived:true});await new Promise(resolve=>setTimeout(resolve,30));await runtime.settlePluginNotifications(offer.manifest.id);assert(rows().at(-1)?.item.data.status==='dismissed','归档未撤回建议');manager.updateAgentSessionMeta(session.id,{archived:false});console.log('ARCHIVE real manager event dismissed original plugin row');
 // 正在运行的通知钩子不能占住 worker 队列；新回合应立即取消旧预测。
 writeTextFileAtomic(cli,'#!/bin/sh\ncat > /dev/null\nexec /bin/sleep 15\n');chmodSync(cli,0o755);
 append('user','慢预测','slow-user');await runtime.beginPluginTurn(context);append('assistant','等待后续','slow-answer');await runtime.finishPluginTurn(session.id);
 await new Promise(resolve=>setTimeout(resolve,100));const cancellationStart=Date.now();append('user','新一轮取消过期预测','interrupt-user');await runtime.beginPluginTurn(context);await runtime.settlePluginNotifications(offer.manifest.id);assert(Date.now()-cancellationStart<3000,'新回合被后台预测阻塞');console.log('CANCELLATION in-flight notification canceled without blocking next turn');
 await runtime.finishPluginTurn(session.id,false,true);
 writeTextFileAtomic(cli,'#!/bin/sh\ncat > /dev/null\nprintf \'%s\\n\' \'{"is_error":false,"result":"运行测试"}\'\n');chmodSync(cli,0o755);
 // 撤销 CLI 授权后仍可启用，生成失败必须进入可见诊断，不能假装成功。
 await service.activateDesktopPlugin(offer.manifest.id,false);service.configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['a'],network:false,cli:[]}});await service.activateDesktopPlugin(offer.manifest.id,true);
 append('user','未授权CLI应明确失败','no-cli');await runtime.beginPluginTurn(context);append('assistant','尝试生成建议','no-cli-answer');await runtime.finishPluginTurn(session.id);await runtime.settlePluginNotifications(offer.manifest.id);
 assert(runtime.pluginStatuses().find(p=>p.id===offer.manifest.id)?.error?.includes('Claude Code'),'未授权CLI失败没有显示诊断');console.log('CLI CONSENT failure is visible without reading credentials');
 await service.activateDesktopPlugin(offer.manifest.id,false);service.configureDesktopPlugin(offer.manifest.id,{access:{workspaceIds:['a'],network:true,cli:['claude']}});await service.activateDesktopPlugin(offer.manifest.id,true);
 const file=join(root,'config/plugins',offer.manifest.id,'data/settings-suggestions.json');console.log('ISOLATED no daily credentials used; source',offer.digest,'settingsFile',file)
 append('user','最终界面复核','user-4');await runtime.beginPluginTurn(context);append('assistant','修改已完成，现在可以运行测试','assistant-4');await runtime.finishPluginTurn(session.id);await runtime.settlePluginNotifications(offer.manifest.id);assert(rows().at(-1)?.item.data.status==='ready','最终UI建议未就绪');
 writeJsonFileAtomic(join(config,'settings.json'),{themeMode:'light',onboardingCompleted:true,onboardingVersion:2,environmentCheckSkipped:true,notificationsEnabled:false,agentWorkspaceId:'a',agentIsland:{enabled:false}});
 await runtime.stopAllPluginHosts();writeJsonFileAtomic(join(root,'evidence.json'),{plugin:offer.manifest.id,source:offer.source,version:offer.manifest.version,sessionId:session.id,checks:['legacy-hooks','two-turn-generation','stable-row-update','duplicate-finish','cancel','workspace-isolation','disable-enable'],mockCLI:true,profile:root});console.log('PROFILE',root);app.exit(0)
 }catch(error){console.error(error);app.exit(1)}}
if(app.isReady())void run();else app.once('ready',()=>void run())
