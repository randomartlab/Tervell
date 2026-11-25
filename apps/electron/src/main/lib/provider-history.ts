import {spawn} from 'node:child_process'
import {randomUUID} from 'node:crypto'
import {join} from 'node:path'
import {existsSync,statSync} from 'node:fs'
import {JsonRpcPeer} from '@proma/kernel-host'
import {desktopKernelState,desktopKernelEnvironment,desktopCliEnvironment} from './desktop-extension-service'
import {getAgentSessionMeta} from './agent-session-manager'
import {getAgentWorkspace} from './agent-workspace-manager'
import {getSdkConfigDir} from './config-paths'
interface HistoryRow {id:string;title:string;provider:string;updatedAt:number}
interface SavedSource {targetId:string;provider:string;remoteId:string;cwd:string;path?:string;title:string;expiresAt:number}
const sources=new Map<string,SavedSource>()
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
function save(value:Omit<SavedSource,'expiresAt'>):string {
 const id='provider:'+randomUUID();sources.set(id,{...value,expiresAt:Date.now()+30*60_000});while(sources.size>1000)sources.delete(sources.keys().next().value!);return id
}
async function acp<T>(provider:string,cwd:string,operation:(peer:JsonRpcPeer,capabilities:Record<string,unknown>,updates:Record<string,unknown>[])=>Promise<T>):Promise<T> {
 const entry=desktopKernelState().entries.find(row=>row.id===provider)
 if(!entry?.enabled||!entry.available||entry.transport!=='acp'||!entry.resolvedCommand)throw Error('此内核未启用或不支持 ACP 历史导入')
 const child=spawn(entry.resolvedCommand,entry.args,{cwd,env:desktopKernelEnvironment(provider),stdio:['pipe','pipe','pipe'],windowsHide:true}),updates:Record<string,unknown>[]=[]
 child.stderr.on('data',()=>{})
 const peer=new JsonRpcPeer(child.stdout,child.stdin,{timeoutMs:10000,onRequest:async()=>{throw Error('导入历史不允许文件写入、终端或权限授权')},onNotification:(method,params)=>{if(method!=='session/update')return;updates.push(record(params))}})
 child.on('error',error=>peer.close(error))
 const timer=setTimeout(()=>{peer.close(new Error('读取 CLI 历史超时'));child.kill()},20000)
 try {const initialized=record(await peer.request('initialize',{protocolVersion:1,clientInfo:{name:'Tervell history importer',version:'1'},clientCapabilities:{}}));return await operation(peer,record(initialized.agentCapabilities),updates)}
 finally{clearTimeout(timer);peer.close(new Error('历史读取结束'));child.kill();if(child.exitCode===null){const force=setTimeout(()=>child.kill('SIGKILL'),1000);force.unref()}}
}
export async function listProviderHistory(targetId:string):Promise<{entries:HistoryRow[];warnings:string[]}> {
 const target=getAgentSessionMeta(targetId),workspace=target?.workspaceId?getAgentWorkspace(target.workspaceId):undefined,cwd=workspace?.projectRootPath
 if(!target||!cwd)throw Error('先选择具有本地文件夹的项目，才能读取该项目的 CLI 历史')
 const entries:HistoryRow[]=[],warnings:string[]=[]
 const {SessionManager}=await import('@earendil-works/pi-coding-agent')
 const home=desktopCliEnvironment().HOME??desktopCliEnvironment().USERPROFILE
 for(const directory of [...new Set([join(getSdkConfigDir(),'sessions'),...(home?[join(home,'.pi/agent/sessions',`--${cwd.replace(/^[/\\]/,'').replace(/[/\\:]/g,'-')}--`)]:[])])]){
  if(!existsSync(directory))continue
  try{for(const row of (await SessionManager.list(cwd,directory)).slice(0,100)){if(row.cwd&&row.cwd!==cwd)continue;const title=row.name||row.firstMessage||'Pi 会话';entries.push({id:save({targetId,provider:'pi',remoteId:row.id,cwd,path:row.path,title}),title,provider:'Pi CLI',updatedAt:row.modified.getTime()})}}catch{warnings.push('Pi 历史无法读取；原始文件未修改')}
 }
 await Promise.all(desktopKernelState().entries.filter(e=>e.enabled&&e.available&&e.transport==='acp').map(async entry=>{
  try{await acp(entry.id,cwd,async(peer,caps)=>{
   if((record(caps.sessionCapabilities).list===undefined||record(caps.sessionCapabilities).list===false)||caps.loadSession!==true){warnings.push(entry.name+' 未声明历史列表与读取能力，可从导出文件导入');return}
   let cursor:string|undefined;const seen=new Set<string>();let count=0;for(let page=0;page<5;page++){
   const response=record(await peer.request('session/list',{cwd,...(cursor?{cursor}:{})}));if(!Array.isArray(response.sessions))throw Error('CLI 返回的会话列表无效')
   for(const raw of response.sessions.slice(0,100-count)){const row=record(raw);if(typeof row.sessionId!=='string'||row.cwd!==cwd)continue;const title=typeof row.title==='string'?row.title:'CLI 会话';entries.push({id:save({targetId,provider:entry.id,remoteId:row.sessionId,cwd,title}),title,provider:entry.name,updatedAt:typeof row.updatedAt==='string'?Date.parse(row.updatedAt)||0:0});count++}
   if(count>=100||typeof response.nextCursor!=='string'||!response.nextCursor)break;if(seen.has(response.nextCursor))throw Error('CLI 历史分页未前进');seen.add(response.nextCursor);cursor=response.nextCursor;}
  })}catch(error){warnings.push(entry.name+'：'+String(error).slice(0,160))}
 }))
 return {entries:entries.sort((a,b)=>b.updatedAt-a.updatedAt),warnings}
}
export async function readProviderHistory(targetId:string,id:string):Promise<{title:string;text:string}> {
 const source=sources.get(id);if(!source||source.targetId!==targetId||source.expiresAt<Date.now())throw Error('CLI 历史列表已过期，请重新读取')
 let text=''
 if(source.provider==='pi'){
  if(!source.path)throw Error('Pi 历史文件不存在')
  const {parseSessionEntries,buildSessionContext}=await import('@earendil-works/pi-coding-agent');const {readFileSync}=await import('node:fs');const entries=parseSessionEntries(readFileSync(source.path,'utf8')).filter(entry=>entry.type!=='session');
  text=buildSessionContext(entries).messages.map(message=>{const row=record(message);return `[${String(row.role)}]\n${typeof row.content==='string'?row.content:JSON.stringify(row.content)}`}).join('\n\n')
 }else text=await acp(source.provider,source.cwd,async(peer,caps,updates)=>{
  if(caps.loadSession!==true)throw Error('CLI 未声明历史读取能力')
  await peer.request('session/load',{sessionId:source.remoteId,cwd:source.cwd,mcpServers:[]})
  const rows=updates.filter(row=>row.sessionId===source.remoteId).map(row=>record(row.update))
  return rows.map(row=>{const content=record(row.content);if(typeof content.text==='string')return `[${String(row.sessionUpdate)}]\n${content.text}`;if(row.sessionUpdate==='tool_call'||row.sessionUpdate==='tool_call_update')return `[工具 ${String(row.title??row.toolCallId)}]\n${JSON.stringify(row.rawInput??row.rawOutput??row.content??{})}`;return ''}).filter(Boolean).join('\n\n')
 })
 if(!text.trim())throw Error('此 CLI 未返回可导入的历史，请使用其导出文件；没有创建空记录')
 return {title:source.title,text}
}
