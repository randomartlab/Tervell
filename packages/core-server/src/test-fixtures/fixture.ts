import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {openJournal} from '@proma/core/store'
import {ScriptedKernel} from '@proma/kernel-host'
import type {AgentKernel} from '@proma/kernel-host'
import {SessionSchema} from '@proma/protocol'
import type {Session,ClientKind} from '@proma/protocol'
import {DeviceAuth} from '../auth.ts'
import type {DeviceRecord} from '../auth.ts'
import {ServiceRepository} from '../repository.ts'
import {ServiceDispatcher} from '../dispatcher.ts'
import {CoreServer} from '../server.ts'
export async function fixture(options:{local?:boolean;kernel?:(session:Session)=>Promise<AgentKernel>}={}){
 const directory=mkdtempSync(join(tmpdir(),'proma-w8-')),project=join(directory,'project'),assets=join(directory,'assets');mkdirSync(project);mkdirSync(assets)
 writeFileSync(join(project,'hello.txt'),'hello');writeFileSync(join(assets,'index.html'),'<html>Proma app shell</html>');writeFileSync(join(assets,'app.js'),'console.log("proma")')
 let now=Date.now(),records:DeviceRecord[]=[],runs=0
 const journal=await openJournal(join(directory,'journal.db')),repository=new ServiceRepository(journal,()=>now)
 for(const [id,workspaceId]of [['s1','w1'],['s2','w2']])repository.upsert(SessionSchema.parse({schemaVersion:2,id,title:id,kernelId:'scripted',workspaceId,createdAt:1,updatedAt:1}))
 const auth=new DeviceAuth({read:()=>records,write:value=>{records=value}},()=>now)
 const issue=(kind:ClientKind='mobile',control=true,workspaceIds=['w1'],ttlMs?:number)=>auth.issue({name:'test-device',kind,control,workspaceIds,ttlMs})
 const a=issue(),b=issue('web'),viewer=issue('mobile',false)
 const dispatcher=new ServiceDispatcher({repository,auth,cwd:()=>project,authorizeTool:async()=>true,kernel:options.kernel??(async()=>new ScriptedKernel('scripted',input=>{runs++;return [{event:{t:'message.delta',runId:input.runId,seq:1,index:0,kind:'text',text:'回复'}},{event:{t:'message.final',runId:input.runId,seq:2,message:{id:`final_${runs}`,role:'assistant',content:[{type:'text',text:'回复'}],createdAt:now}}},{event:{t:'done',runId:input.runId,seq:3,reason:'stop'}}]}))})
 const server=new CoreServer({dispatcher,auth,staticRoot:assets,local:options.local?{workspaceIds:['w1'],control:true}:undefined,batchMs:10,clock:()=>now})
 let request=0
 async function rpc(method:string,params:object={},token=a.token,kind:ClientKind='mobile'){
  const response=await fetch(`${server.url}/rpc`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({requestId:`request_${++request}`,clientKind:kind,method,params})})
  const body=await response.json() as {ok:boolean;data?:Record<string,unknown>;error?:{code:string;message:string;data?:unknown}}
  return {status:response.status,...body}
 }
 async function settled(){for(let i=0;i<100&&dispatcher.runtime.running.length;i++)await Bun.sleep(5)}
 return {directory,project,assets,journal,repository,auth,dispatcher,server,a,b,viewer,issue,rpc,settled,time:(delta:number)=>{now+=delta},runs:()=>runs,records:()=>records,close:async()=>{await server.close();journal.close();rmSync(directory,{recursive:true,force:true})}}
}
export async function websocket(f:Awaited<ReturnType<typeof fixture>>,token=f.a.token){
 const response=await fetch(`${f.server.url}/ws-ticket`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'})
 const {ticket}=await response.json() as {ticket:string}
 const ws=new WebSocket(`${f.server.url.replace('http:','ws:')}/events?ticket=${ticket}`),messages:Array<Record<string,unknown>>=[]
 ws.addEventListener('message',event=>messages.push(JSON.parse(String(event.data)) as Record<string,unknown>))
 await new Promise<void>((resolve,reject)=>{ws.addEventListener('open',()=>resolve(),{once:true});ws.addEventListener('error',()=>reject(new Error('WS打开失败')),{once:true})})
 return {ws,messages,ticket,wait:async(predicate:(m:Record<string,unknown>)=>boolean)=>{for(let i=0;i<100;i++){const value=messages.find(predicate);if(value)return value;await Bun.sleep(10)}throw new Error('WS消息超时')}}
}
