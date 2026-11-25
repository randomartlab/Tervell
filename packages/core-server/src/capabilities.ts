import {readdirSync,lstatSync} from 'node:fs'
import {join,relative} from 'node:path'
import {execFile} from 'node:child_process'
import {PathBoundary,GatedTerminals,ToolGate} from '@proma/core/permission'
import type {GateOptions} from '@proma/core/permission'
import type {Session,ApiParams,ApiResult} from '@proma/protocol'
import {fail} from './errors.ts'
interface Entry {terminals:GatedTerminals;ids:Set<string>;stop:AbortController;signature:string;assert:()=>void}
export class ServiceCapabilities{
 private readonly entries=new Map<string,Entry>()
 constructor(private readonly cwd:(session:Session)=>string,private readonly gate:ToolGate){}
 private boundary(session:Session){return new PathBoundary({cwd:this.cwd(session)},()=>{})}
 tree(session:Session,params:ApiParams<'files.tree'>):ApiResult<'files.tree'>{
  const boundary=this.boundary(session),root=boundary.assert(this.cwd(session),'read'),start=boundary.assert(params.path??'.','read');if((params.path??'.').split(/[\\/]/).some(p=>p.startsWith('.')&&p!=='.'))fail(403,'PATH_DENIED','隐藏文件路径不对移动文件树开放');let truncated=false
  const entries:ApiResult<'files.tree'>['entries']=[]
  const visit=(path:string,depth:number)=>{for(const item of readdirSync(path,{withFileTypes:true})){
   if(entries.length>=500){truncated=true;return}
   if(item.name.startsWith('.')||item.name==='node_modules'||item.isSymbolicLink())continue
   const target=boundary.assert(join(path,item.name),'read'),stat=lstatSync(target)
   if(!stat.isDirectory()&&!stat.isFile())continue
   entries.push({path:relative(root,target),kind:stat.isDirectory()?'directory':'file',size:stat.size})
   if(stat.isDirectory()&&depth>1)visit(target,depth-1)
  }}
  visit(start,params.depth??1);return {entries,truncated}
 }
 async diff(session:Session,path:string,signal:AbortSignal):Promise<ApiResult<'files.diff'>>{
  const boundary=this.boundary(session),root=boundary.assert(this.cwd(session),'read'),target=boundary.assert(path,'write'),file=relative(root,target)
  if(file.startsWith('..')||file.includes('\0')||file.split(/[\\/]/).some(p=>p.startsWith('.')))fail(403,'PATH_DENIED','diff只能读取项目内路径')
  const run=(args:string[])=>new Promise<string>((resolve,reject)=>execFile('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],{cwd:root,signal,timeout:10000,maxBuffer:512*1024,env:{PATH:process.env.PATH??'',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_PAGER:'cat'}},(error,stdout)=>error?reject(new Error('读取Git diff失败或超过限制')):resolve(stdout)))
  const top=(await run(['rev-parse','--show-toplevel'])).trim()
  if(top!==root)fail(403,'GIT_ROOT_DENIED','diff只允许当前项目Git根')
  const common=(await run(['rev-parse','--git-common-dir'])).trim();boundary.assert(common,'read')
  const diff=await run(['--no-pager','diff','--no-ext-diff','--no-textconv','--',file]);return {diff,truncated:false}
 }
 private key(device:string,id:string){return JSON.stringify([device,id])}
 private signature(session:Session){return JSON.stringify([this.cwd(session),session.workspaceId,session.permissionMode,session.attachedDirectories,session.worktree])}
 private owned(device:string,session:Session):Entry|undefined{const entry=this.entries.get(this.key(device,session.id));if(entry){entry.assert();if(entry.signature!==this.signature(session))fail(409,'CONTEXT_CHANGED','终端授权上下文已改变')}return entry}
 list(device:string,session:Session):ApiResult<'terminal.list'>{return {terminals:[...this.owned(device,session)?.ids??[]].map(termId=>({termId}))}}
 async create(device:string,session:Session,input:ApiParams<'terminal.create'>,execution:GateOptions):Promise<string>{
  const key=this.key(device,session.id);let entry=this.entries.get(key)
  if(entry){try{entry.assert()}catch{this.entries.delete(key);entry.stop.abort();await entry.terminals.close();entry=undefined;execution.assertContext?.()}}
  if(!entry){if(this.entries.size>=100)fail(429,'TERMINAL_LIMIT','终端会话过多');entry={terminals:new GatedTerminals(this.boundary(session),this.gate),ids:new Set(),stop:new AbortController(),signature:this.signature(session),assert:execution.assertContext??(()=>{})};this.entries.set(key,entry)}
  if(entry.signature!==this.signature(session))fail(409,'CONTEXT_CHANGED','终端授权上下文已改变')
  const termId=await entry.terminals.create({command:input.command,args:input.args??[],cwd:this.cwd(session),env:[]},{...execution,signal:AbortSignal.any([entry.stop.signal,execution.signal])});entry.ids.add(termId);return termId
 }
 output(device:string,session:Session,termId:string):ApiResult<'terminal.attach'>{const entry=this.owned(device,session);if(!entry?.ids.has(termId))fail(404,'TERMINAL_MISSING','终端不属于此设备会话');return entry.terminals.output(termId)}
 async kill(device:string,session:Session,termId:string,release:boolean):Promise<void>{const entry=this.owned(device,session);if(!entry?.ids.has(termId))fail(404,'TERMINAL_MISSING','终端不属于此设备会话');if(release){await entry.terminals.release(termId);entry.ids.delete(termId);if(!entry.ids.size){entry.stop.abort();await entry.terminals.close();this.entries.delete(this.key(device,session.id))}}else await entry.terminals.kill(termId)}
 async sweep():Promise<void>{for(const [key,entry]of this.entries){try{entry.assert()}catch{this.entries.delete(key);entry.stop.abort();await entry.terminals.close()}}}
 async revoke(device:string,sessionId?:string):Promise<void>{for(const [key,entry]of this.entries)if(JSON.parse(key)[0]===device&&(!sessionId||JSON.parse(key)[1]===sessionId)){this.entries.delete(key);entry.stop.abort();await entry.terminals.close()}}
 async close():Promise<void>{const entries=[...this.entries.values()];this.entries.clear();for(const entry of entries){entry.stop.abort();await entry.terminals.close()}}
}
