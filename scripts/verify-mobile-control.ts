import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {mock} from 'bun:test'
/** 无桌面真实管理服务回环；Electron系统能力替身不接触钥匙串/窗口或日常profile。 */
const root=mkdtempSync(join(tmpdir(),'tervell-mobile-service-'));process.env.TERVELL_PROFILE_DIR=root;process.env.PROMA_RELEASE_CHANNEL='alpha'
mock.module('electron',()=>({app:{isPackaged:false,getAppPath:()=>process.cwd()+'/apps/electron',getPath:()=>root,on:()=>{},whenReady:()=>Promise.resolve()},WebContentsView:class{},Menu:{buildFromTemplate:()=>({popup:()=>{}})},net:{fetch:globalThis.fetch},session:{defaultSession:{fetch:globalThis.fetch}},MessageChannelMain:class{port1={};port2={}},BrowserWindow:{getAllWindows:()=>[],fromWebContents:()=>null},safeStorage:{isEncryptionAvailable:()=>true,encryptString:(v:string)=>Buffer.from(v),decryptString:(v:Buffer)=>v.toString()},dialog:{showOpenDialog:async()=>({canceled:true,filePaths:[]})},Notification:class{static isSupported(){return false}},powerMonitor:{on:()=>{}},powerSaveBlocker:{start:()=>0,stop:()=>{}},screen:{getAllDisplays:()=>[]},nativeImage:{createFromPath:()=>({isEmpty:()=>true})},clipboard:{writeText:()=>{}},shell:{openExternal:async()=>{},openPath:async()=>''},nativeTheme:{shouldUseDarkColors:false},ipcMain:{handle:()=>{}},utilityProcess:{fork:()=>{throw new Error('不启动真实CLI')}}}))
const {writeJsonFileAtomic}=await import('../apps/electron/src/main/lib/safe-file')
const {getConfigDir}=await import('../apps/electron/src/main/lib/config-paths')
mkdirSync(join(root,'config/agent-workspaces/test/skills-inactive'),{recursive:true});mkdirSync(join(root,'config/agent-workspaces/test/skills'),{recursive:true})
writeJsonFileAtomic(join(getConfigDir(),'agent-workspaces.json'),{workspaces:[{id:'project-a',name:'MobileFixture',slug:'test',createdAt:1,updatedAt:1}]})
const {createAgentSession}=await import('../apps/electron/src/main/lib/agent-session-manager')
const session=createAgentSession('手机控制测试',undefined,'project-a')
const {mobileControl}=await import('../apps/electron/src/main/lib/mobile-control-service')
const {stopModelRouting}=await import('../apps/electron/src/main/lib/model-routing-service')
const admin={id:'phone',workspaceIds:['project-a'],management:true},limited={...admin,management:false}
const assert=(v:unknown,message:string)=>{if(!v)throw new Error(message)}
const call=async(operation:string,values:Record<string,import('@proma/protocol').JsonValue>={},scope:{workspaceId?:string;sessionId?:string}={})=>{
 let result=await mobileControl(admin,{operation,values,...scope}) as Record<string,unknown>
 for(let i=0;typeof result.job==='object'&&result.job!==null&&(result.job as {phase:string}).phase==='running'&&i<60;i++){await new Promise(r=>setTimeout(r,100));result=await mobileControl(admin,{operation:'jobs.status',values:{id:(result.job as {id:string}).id}}) as Record<string,unknown>}
 return result.result&&typeof result.result==='object'?result.result as Record<string,unknown>:result
}
try{
 const catalog=await call('catalog'),actions=catalog.actions as Array<{id:string;scope:string}>
 assert(actions.length>70,'控制目录缺少动作');assert(actions.some(a=>a.id==='gateway.signin.plugin'),'插件账号缺少入口')
 assert(JSON.stringify(catalog).length<110000,'能力目录过大');const providerAction=(catalog.actions as Array<{id:string;fields:Array<{key:string}>}>).find(a=>a.id==='gateway.provider.save');assert(providerAction?.fields.some(f=>f.key==='provider.name'),'供应商表单没有原生展开')
 const readOnly=await mobileControl(limited,{operation:'catalog',values:{}}) as {actions:Array<{scope:string;requiresManagement:boolean}>};assert(!readOnly.actions.some(a=>a.scope==='management'||a.requiresManagement),'项目手机看到整机入口')
 await call('session.rename',{title:'手机修改标题'},{sessionId:session.id});const updated=await call('session.detail',{}, {sessionId:session.id});assert(updated.title==='手机修改标题','会话修改未保存')
 await call('skills.create',{slug:'mobile-fixture',name:'手机技能',description:'隔离回环',instructions:'只回答测试内容'},{workspaceId:'project-a'})
 const skill=await call('skills.read',{slug:'mobile-fixture'},{workspaceId:'project-a'});assert(String(skill.content).includes('只回答测试内容'),'技能创建失败')
 await call('skills.write',{slug:'mobile-fixture',expectedContent:String(skill.content),content:String(skill.content)+'\n手机更新'},{workspaceId:'project-a'})
 await call('skills.toggle',{slug:'mobile-fixture',enabled:true},{workspaceId:'project-a'})
 await call('skills.delete',{slug:'mobile-fixture'},{workspaceId:'project-a'})
 await call('routing.save',{enabled:true,defaultModel:'local/test',rules:[]});const routing=await call('routing.state');assert((routing.config as {defaultModel:string}).defaultModel==='local/test','全局路由失败')
 await Bun.write(join(root,'catalog.json'),JSON.stringify(catalog));if(process.env.TERVELL_CONTROL_EVIDENCE)await Bun.write(process.env.TERVELL_CONTROL_EVIDENCE,JSON.stringify(catalog,null,2))
 console.log(JSON.stringify({mobileActionCount:actions.length,groups:[...new Set((catalog.actions as Array<{group:string}>).map(a=>a.group))],checks:['catalog-generated','limited-scope','session-rename','skill-create-read-edit-toggle-delete','routing-save-state'],realAccountLogins:0,realModelRequests:0,androidApkBuilt:false},null,2))
}finally{stopModelRouting();rmSync(root,{recursive:true,force:true})}
