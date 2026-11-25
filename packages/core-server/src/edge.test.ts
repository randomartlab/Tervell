import {test,expect} from 'bun:test'
import {writeFileSync,symlinkSync} from 'node:fs'
import {join} from 'node:path'
import {fixture,websocket} from './test-fixtures/fixture.ts'
import {ServiceRepository} from './repository.ts'
import {ServiceDispatcher} from './dispatcher.ts'
import {openJournal} from '@proma/core/store'
import {SessionSchema} from '@proma/protocol'
import {KernelCapabilitiesSchema} from '@proma/protocol'
import type {AgentKernel} from '@proma/kernel-host'
import type {KernelPromptInput,KernelSessionHandle,KernelEvent} from '@proma/protocol'

class WaitingKernel implements AgentKernel{
 readonly id='scripted';readonly protocol='native' as const
 readonly capabilities=KernelCapabilitiesSchema.parse({context:{instructionsFile:null},transport:'in-process'})
 calls:string[]=[];finish:(()=>void)|undefined
 async createSession(input:{sessionId:string}){return {kernelId:this.id,sessionId:input.sessionId,kernelSessionRef:input.sessionId}}
 async *prompt(_handle:KernelSessionHandle,input:KernelPromptInput,{signal}:{signal:AbortSignal}):AsyncIterable<KernelEvent>{
  this.calls.push(input.text)
  if(input.text==='wait')await new Promise<void>(resolve=>{this.finish=resolve;signal.addEventListener('abort',()=>resolve(),{once:true})})
  if(signal.aborted)throw new Error('aborted')
  yield {t:'done',runId:input.runId,seq:1,reason:'stop'}
 }
 async cancel(){this.finish?.()}
 async close(){}
}
test('Given 运行等待与排队 When 重复排队、拒绝同时发送 Then 串行启动且不中断队列顺序',async()=>{
 const kernel=new WaitingKernel(),f=await fixture({kernel:async()=>kernel})
 try{
  expect((await f.rpc('session.send',{id:'s1',text:'wait',clientMessageId:'m1'})).status).toBe(200)
  for(let i=0;i<50&&!kernel.finish;i++)await Bun.sleep(2)
  expect((await f.rpc('session.send',{id:'s1',text:'conflict',clientMessageId:'m2'})).error?.code).toBe('RUNNING')
  expect((await f.rpc('session.queue',{id:'s1',text:'queued',clientMessageId:'q1'})).status).toBe(200)
  expect((await f.rpc('session.queue',{id:'s1',text:'queued',clientMessageId:'q1'})).status).toBe(200)
  kernel.finish?.();await f.settled();expect(kernel.calls).toEqual(['wait','queued'])
  expect((await f.rpc('session.send',{id:'s1',text:'conflict',clientMessageId:'m2'})).status).toBe(200);await f.settled();expect(kernel.calls).toEqual(['wait','queued','conflict'])
 }finally{await f.close()}
})
test('Given 服务重建 When 持久幂等与epoch恢复 Then 旧消息不重复且第二runner被拒绝',async()=>{
 const f=await fixture();try{
  await f.rpc('session.send',{id:'s1',text:'persist',clientMessageId:'saved'});await f.settled()
  const second=await openJournal(join(f.directory,'journal.db')),repo=new ServiceRepository(second)
  try{expect(()=>new ServiceDispatcher({...f.dispatcher.options,repository:repo})).toThrow('运行中')}finally{second.close()}
  const epoch=f.repository.epoch;await f.dispatcher.close()
  let runs=0
  const next=new ServiceDispatcher({...f.dispatcher.options,kernel:async session=>{runs++;return f.dispatcher.options.kernel(session,f.auth.authenticate(f.a.token))}})
  try{
   const result=await next.dispatch(f.auth.authenticate(f.a.token),{clientKind:'mobile',requestId:'retry',method:'session.send',params:{id:'s1',text:'persist',clientMessageId:'saved'}})
   expect(result.data).toMatchObject({accepted:true});expect(runs).toBe(0);expect(next.repository.epoch).toBe(epoch)
  }finally{await next.close()}
 }finally{await f.close()}
})
test('Given 项目目录分页 When 分页间改动或换项目 Then 固定快照和移除记录可收敛',async()=>{
 const f=await fixture();try{
  for(const id of ['s3','s4','s5'])f.repository.upsert(SessionSchema.parse({...f.repository.get('s1')!,id,title:id}))
  const initial=await f.rpc('session.list',{limit:2}),cursor=(initial.data?.pageInfo as {nextCursor:string}).nextCursor
  f.repository.upsert({...f.repository.get('s1')!,title:'later',updatedAt:2})
  const next=await f.rpc('session.list',{limit:2,cursor});expect(next.status).toBe(200);expect((next.data?.entries as Array<{id:string}>).map(s=>s.id)).toEqual(['s4','s5'])
  const before=await f.rpc('session.list');f.repository.upsert({...f.repository.get('s1')!,workspaceId:'w2'})
  const changes=await f.rpc('session.list',{generation:before.data?.generation,afterSeq:before.data?.headSeq,limit:2})
  expect(changes.data?.entries).toHaveLength(0);expect(changes.data?.removals).toEqual([{id:'s1',seq:Number(before.data?.headSeq)+1}])
 }finally{await f.close()}
})
test('Given 手机模块与终端 When 只读浏览/创建/别设备读取/撤销 Then 资源受授权约束',async()=>{
 const f=await fixture();try{
  expect((await f.rpc('module.catalog',{clientKind:'mobile'})).status).toBe(200)
  expect((await f.rpc('module.catalog',{clientKind:'web'})).status).toBe(403)
  expect((await f.rpc('files.tree',{id:'s1',path:'.',depth:1})).data?.entries).toEqual([{path:'hello.txt',kind:'file',size:5}])
  expect((await f.rpc('files.tree',{id:'s1',path:'../',depth:1})).status).not.toBe(200)
  const created=await f.rpc('terminal.create',{id:'s1',command:process.execPath,args:['-e',"console.log('mobile terminal')"]})
  expect(created.status).toBe(200);const termId=String(created.data?.termId)
  let output='';for(let i=0;i<30&&!output;i++){output=String((await f.rpc('terminal.attach',{id:'s1',termId})).data?.output??'');if(!output)await Bun.sleep(5)}
  expect(output).toContain('mobile terminal')
  expect((await f.rpc('terminal.attach',{id:'s1',termId},f.b.token,'web')).status).toBe(404)
  expect((await f.rpc('terminal.create',{id:'s1',command:'rm',args:['-rf','.']})).status).not.toBe(200)
  expect((await f.rpc('terminal.release',{id:'s1',termId})).status).toBe(200)
  expect((await f.rpc('terminal.attach',{id:'s1',termId})).status).toBe(404)
 }finally{await f.close()}
})
test('Given 静态目录外文件 When 编码越界和符号链接 Then 不泄露外部文件',async()=>{
 const f=await fixture();try{
  const secret=join(f.directory,'secret');writeFileSync(secret,'PRIVATE FILE');symlinkSync(secret,join(f.assets,'leak.txt'))
  expect((await fetch(`${f.server.url}/leak.txt`)).status).toBe(404)
  const escape=await fetch(`${f.server.url}/%2e%2e%2fsecret`);expect(escape.status).toBe(403);expect(await escape.text()).not.toContain('PRIVATE FILE')
 }finally{await f.close()}
})
test('Given WS订阅旧epoch或错误会话 When 拉取 Then reset明确且无私有会话数据',async()=>{
 const f=await fixture();try{
  const proof=f.repository.leases.claim('s1',f.a.device.id);f.repository.append(proof,[{ts:1,turnId:'t',kernelEvent:{t:'done',runId:'r',seq:1,reason:'stop'}}])
  const connection=await websocket(f);connection.ws.send(JSON.stringify({clientKind:'mobile',requestId:'old',method:'session.subscribe',params:{ids:['s1'],cursors:{s1:{epoch:'old',seq:999}}}}))
  expect((await connection.wait(m=>m.type==='session.events')).reset).toBe(true)
  connection.ws.send(JSON.stringify({clientKind:'mobile',requestId:'foreign',method:'session.subscribe',params:{ids:['s2']}}))
  expect((await connection.wait(m=>m.ok===false)).error).toMatchObject({code:'SESSION_MISSING'})
  connection.ws.close()
 }finally{await f.close()}
})

class ApprovalKernel extends WaitingKernel{
 answer:string|undefined
 override async *prompt(_handle:KernelSessionHandle,input:KernelPromptInput,{signal}:{signal:AbortSignal}):AsyncIterable<KernelEvent>{
  yield {t:'permission.request',runId:input.runId,seq:1,req:{requestId:'approval1',kind:'edit',tool:'Write',input:{path:'hello.txt'},summary:'修改文件',actions:[{id:'once',label:'允许一次',behavior:'allow'},{id:'session',label:'本会话',behavior:'allow',variant:'session'},{id:'deny',label:'拒绝',behavior:'deny'}]}}
  await new Promise<void>(resolve=>{this.finish=resolve;signal.addEventListener('abort',()=>resolve(),{once:true})})
  if(signal.aborted)throw new Error('aborted')
  yield {t:'done',runId:input.runId,seq:2,reason:'stop'}
 }
 async respondPermission(_handle:KernelSessionHandle,_id:string,response:{actionId:string;behavior:'allow'|'deny'}){this.answer=response.actionId;this.finish?.()}
}
test('Given 两设备同时响应审批 When 首个决策已接收 Then 另一端resolved=false且只执行一次',async()=>{
 const kernel=new ApprovalKernel(),f=await fixture({kernel:async()=>kernel})
 try{
  await f.rpc('session.send',{id:'s1',text:'approval',clientMessageId:'m1'})
  let pending:Record<string,unknown>|undefined
  for(let i=0;i<50&&!pending;i++){pending=((await f.rpc('approval.list')).data?.approvals as Array<Record<string,unknown>>)?.[0];if(!pending)await Bun.sleep(2)}
  expect(pending?.id).toBe('approval1')
  const results=await Promise.all([f.rpc('approval.respond',{requestId:'approval1',decision:'allow-session'}),f.rpc('approval.respond',{requestId:'approval1',decision:'deny'},f.b.token,'web')])
  expect(results.map(r=>r.data?.resolved).sort()).toEqual([false,true]);expect(kernel.answer).toBe('session');await f.settled()
  expect((await f.rpc('approval.list',{},f.viewer.token)).status).toBe(403)
 }finally{await f.close()}
})
test('Given 运行中设备撤销 When 服务撤销授权 Then 内核取消且排队不再启动',async()=>{
 const kernel=new WaitingKernel(),f=await fixture({kernel:async()=>kernel})
 try{
  await f.rpc('session.send',{id:'s1',text:'wait',clientMessageId:'m1'});for(let i=0;i<50&&!kernel.finish;i++)await Bun.sleep(2)
  await f.rpc('session.queue',{id:'s1',text:'should-not-start',clientMessageId:'q1'})
  await f.server.revoke(f.a.device.id);expect(f.dispatcher.runtime.running).toHaveLength(0);expect(kernel.calls).toEqual(['wait'])
  expect(f.repository.pending('s1')).toBeUndefined()
 }finally{await f.close()}
})

test('Given 内核故意不响应取消 When 中断 Then 服务等待有界且旧run不能追加事件',async()=>{
 class Uncooperative extends WaitingKernel{
  override async *prompt(_handle:KernelSessionHandle,input:KernelPromptInput):AsyncIterable<KernelEvent>{this.calls.push(input.text);await new Promise(()=>{});yield {t:'done',runId:input.runId,seq:1,reason:'stop'}}
 }
 const kernel=new Uncooperative(),f=await fixture({kernel:async()=>kernel})
 try{
  await f.rpc('session.send',{id:'s1',text:'uncooperative',clientMessageId:'u1'})
  for(let i=0;i<50&&!kernel.calls.length;i++)await Bun.sleep(2)
  const started=Date.now();expect((await f.rpc('session.interrupt',{id:'s1'})).status).toBe(200);expect(Date.now()-started).toBeLessThan(1000)
  expect(f.dispatcher.runtime.running).toHaveLength(0)
  expect(f.repository.read('s1').at(-1)?.kernelEvent).toMatchObject({t:'done',reason:'cancelled'})
 }finally{await f.close()}
},3000)
test('Given 多会话都有补洞 When 一条长会话持续积压 Then 后台会话也得到事件',async()=>{
 const f=await fixture();try{
  for(const id of ['s3','s4'])f.repository.upsert(SessionSchema.parse({...f.repository.get('s1')!,id,title:id}))
  for(const id of ['s1','s3','s4']){
   const proof=f.repository.leases.claim(id,f.a.device.id)
   f.repository.append(proof,Array.from({length:id==='s1'?400:2},(_,index)=>({ts:1,turnId:'t',kernelEvent:{t:'message.delta' as const,runId:'r',seq:index+1,index:0,kind:'text' as const,text:id==='s1'?'大'.repeat(10000):id}})))
  }
  const connection=await websocket(f);connection.ws.send(JSON.stringify({clientKind:'mobile',requestId:'multi',method:'session.subscribe',params:{ids:['s1','s3','s4']}}))
  expect((await connection.wait(m=>m.type==='session.events'&&m.id==='s4')).events).toHaveLength(2);connection.ws.close()
 }finally{await f.close()}
},5000)

test('Given 手机工具输出 When 读取事件与投影 Then 只含摘要且桌面仍可查看完整输出',async()=>{
 const f=await fixture();try{
  const proof=f.repository.leases.claim('s1',f.a.device.id)
  f.repository.append(proof,[{ts:1,turnId:'t',kernelEvent:{t:'tool.call',runId:'r',seq:1,call:{id:'c',kind:'read',name:'Read',input:{private:'SECRET_INPUT'},status:'pending'}}},{ts:1,turnId:'t',kernelEvent:{t:'tool.update',runId:'r',seq:2,callId:'c',patch:{status:'succeeded',result:'SECRET_OUTPUT'}}}])
  const mobile=await f.rpc('session.events',{id:'s1',limit:200}),timeline=await f.rpc('session.timeline',{id:'s1',direction:'tail',limit:40,wholeTurns:true})
  for(const value of [mobile,timeline]){expect(JSON.stringify(value)).not.toContain('SECRET_INPUT');expect(JSON.stringify(value)).not.toContain('SECRET_OUTPUT')}
  const desktop=await f.rpc('session.events',{id:'s1'},f.b.token,'web');expect(JSON.stringify(desktop)).toContain('SECRET_OUTPUT')
 }finally{await f.close()}
})
test('Given 授权页游标固定在旧版本 When 会话随后移出授权项目 Then 旧快照不能泄漏标题',async()=>{
 const f=await fixture();try{
  for(const id of ['s3','s4'])f.repository.upsert({...f.repository.get('s1')!,id,title:`title-${id}`})
  const first=await f.rpc('session.list',{limit:1}),cursor=(first.data?.pageInfo as {nextCursor:string}).nextCursor
  f.repository.upsert({...f.repository.get('s3')!,workspaceId:'w2'})
  const next=await f.rpc('session.list',{limit:2,cursor});expect(JSON.stringify(next)).not.toContain('title-s3');expect(next.data?.removals).toHaveLength(1)
 }finally{await f.close()}
})
test('Given 实际Git diff When 手机只读查询 Then 返回统一diff且不接受项目外路径',async()=>{
 const {execFileSync}=await import('node:child_process'),f=await fixture()
 try{
  execFileSync('git',['init','-q',f.project]);execFileSync('git',['-C',f.project,'add','hello.txt']);execFileSync('git',['-C',f.project,'-c','user.name=Proma Test','-c','user.email=test@localhost','commit','-qm','init'])
  writeFileSync(join(f.project,'hello.txt'),'changed')
  const result=await f.rpc('files.diff',{id:'s1',path:'hello.txt'});expect(result.status).toBe(200);expect(String(result.data?.diff)).toContain('+changed')
  expect((await f.rpc('files.diff',{id:'s1',path:'../outside'})).status).not.toBe(200)
 }finally{await f.close()}
})

test('Given 无效输入或跨站WS When 网络请求 Then 可关联错误且不建立未授权订阅',async()=>{
 const f=await fixture();try{
  const error=await fetch(`${f.server.url}/rpc`,{method:'POST',headers:{Authorization:`Bearer ${f.a.token}`,'Content-Type':'application/json'},body:JSON.stringify({requestId:'invalid123',clientKind:'mobile',method:'lease.transfer',params:{id:'s1',expectedFence:1,confirm:'yes'}})})
  expect(error.status).toBe(400);expect(await error.json()).toMatchObject({requestId:'invalid123',ok:false})
  expect((await fetch(`${f.server.url}/rpc?token=not-allowed`,{method:'POST',headers:{Authorization:`Bearer ${f.a.token}`}})).status).toBe(400)
  const ws=await websocket(f);ws.ws.send(JSON.stringify({clientKind:'mobile',requestId:'bad-frame',method:'constructor',params:{}}))
  expect(await ws.wait(m=>m.requestId==='bad-frame')).toMatchObject({ok:false,error:{code:'METHOD_FORBIDDEN'}});ws.ws.close()
 }finally{await f.close()}
})

test('Given 运行期间转移lease When 旧设备有排队消息 Then 取消旧run和队列且新设备可发送',async()=>{
 const kernel=new WaitingKernel(),f=await fixture({kernel:async()=>kernel})
 try{
  await f.rpc('session.send',{id:'s1',text:'wait',clientMessageId:'m1'});for(let i=0;i<50&&!kernel.finish;i++)await Bun.sleep(2)
  await f.rpc('session.queue',{id:'s1',text:'stale-queued',clientMessageId:'q1'})
  const lease=(await f.rpc('lease.status',{id:'s1'})).data?.lease as {fence:number}
  const transfer=await f.rpc('lease.transfer',{id:'s1',expectedFence:lease.fence,confirm:'transfer-writer'},f.b.token,'web')
  expect(transfer.status).toBe(200);expect(f.repository.pending('s1')).toBeUndefined()
  expect((await f.rpc('session.send',{id:'s1',text:'new-owner',clientMessageId:'new'},f.b.token,'web')).status).toBe(200);await f.settled()
  expect(kernel.calls).toEqual(['wait','new-owner'])
 }finally{await f.close()}
})

test('Given 同轮旧行后来被更新 When wholeTurns尾页 Then endCursor为最大源seq而非最后创建行seq',async()=>{
 const f=await fixture();try{
  const proof=f.repository.leases.claim('s1',f.a.device.id)
  f.repository.append(proof,[{ts:1,turnId:'t',kernelEvent:{t:'tool.call',runId:'r',seq:1,call:{id:'c',name:'Read',kind:'read',status:'pending'}}},{ts:1,turnId:'t',kernelEvent:{t:'message.delta',runId:'r',seq:2,index:0,kind:'text',text:'说明'}},{ts:1,turnId:'t',kernelEvent:{t:'tool.update',runId:'r',seq:3,callId:'c',patch:{status:'succeeded'}}}])
  const page=await f.rpc('session.timeline',{id:'s1',direction:'tail',wholeTurns:true,limit:1})
  expect((page.data?.endCursor as {seq:number}).seq).toBe(3);expect(page.data?.rows).toHaveLength(2)
 }finally{await f.close()}
})

test('Given 会话被切换为只读 When 响应先前Write审批 Then 不能通过批准绕过权限',async()=>{
 const kernel=new ApprovalKernel(),f=await fixture({kernel:async()=>kernel})
 try{
  await f.rpc('session.send',{id:'s1',text:'approval',clientMessageId:'m1'})
  for(let i=0;i<50&&!kernel.finish;i++)await Bun.sleep(2)
  f.repository.upsert({...f.repository.get('s1')!,permissionMode:'read-only'})
  expect((await f.rpc('approval.respond',{requestId:'approval1',decision:'allow'})).status).toBe(403)
  expect(kernel.answer).toBeUndefined()
 }finally{await f.close()}
})

test('Given 另一端发送 When 订阅事件并重读时间线 Then 用户消息与助手回复均可恢复',async()=>{
 const f=await fixture();try{
  await f.rpc('session.send',{id:'s1',text:'来自手机的用户正文',clientMessageId:'user1'});await f.settled()
  const events=await f.rpc('session.events',{id:'s1'});expect((events.data?.events as Array<unknown>)[0]).toMatchObject({userMessage:{id:'user1',text:'来自手机的用户正文'}})
  const timeline=await f.rpc('session.timeline',{id:'s1',direction:'tail',limit:40,wholeTurns:true})
  expect((timeline.data?.rows as Array<{role?:string;summary:string}>).some(row=>row.role==='user'&&row.summary==='来自手机的用户正文')).toBe(true)
  expect((timeline.data?.rows as Array<{role?:string}>).some(row=>row.role==='assistant')).toBe(true)
 }finally{await f.close()}
})

test('Given 手机结构化终态含大量part When HTTP补洞 Then 保留序号并把大消息限制为摘要',async()=>{
 const f=await fixture();try{
  const proof=f.repository.leases.claim('s1',f.a.device.id)
  f.repository.append(proof,[{ts:1,turnId:'t1',kernelEvent:{t:'message.final',runId:'r1',seq:1,message:{id:'large',role:'assistant',createdAt:1,content:Array.from({length:5000},()=>({type:'tool-call' as const,toolCallId:'tool',name:'x'.repeat(100)}))}}}])
  const result=await f.rpc('session.events',{id:'s1'});expect(result.status).toBe(200)
  const event=(result.data?.events as Array<{seq:number;truncated:boolean}>)[0]
  expect(event?.seq).toBe(1);expect(event?.truncated).toBe(true);expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(200000)
 }finally{await f.close()}
})
