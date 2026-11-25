import {PermissionRules,decidePermission} from '@proma/core/permission'
import {JournalCapacityError} from '@proma/core/store'
import {normalizePermissionPolicy} from '@proma/protocol'
import {remoteApprovalPreview} from '@proma/core/remote/approval-preview'
import {bounded} from './waits.ts'
import {randomUUID} from 'node:crypto'
import type {AgentKernel} from '@proma/kernel-host'
import type {Session,SessionLease,KernelSessionHandle,KernelEvent,Approval,PermissionRequest} from '@proma/protocol'
import {KernelEventSchema} from '@proma/protocol'
import type {ServiceRepository,RequestRecord} from './repository.ts'
import type {Principal} from './auth.ts'
import {fail,ServiceError} from './errors.ts'
interface ActiveRun {finished:boolean;device:Principal;proof:SessionLease;kernel?:AgentKernel;handle?:KernelSessionHandle;stop:AbortController;done:Promise<void>}
interface PendingApproval {sessionId:string;event:PermissionRequest;createdAt:number;run:ActiveRun}
export interface RuntimeOptions {
 repository:ServiceRepository
 kernel:(session:Session,principal:Principal)=>Promise<AgentKernel>
 cwd:(session:Session)=>string
 authorize:(principal:Principal)=>Principal
 changed?:(id:string)=>void
 runTimeoutMs?:number
}
/** 单进程运行协调器；SQLite lease/fence仍是跨连接和跨设备写入的权威。 */
export class ServiceRuntime {
 private readonly active=new Map<string,ActiveRun>()
 private readonly approvals=new Map<string,PendingApproval>()
 private closing=false
 private closingPromise?:Promise<void>
 private readonly ownerId=randomUUID()
 private readonly ownerTimer:ReturnType<typeof setInterval>
 constructor(private readonly options:RuntimeOptions){options.repository.owner(this.ownerId);try{options.repository.recover()}catch(error){options.repository.owner(this.ownerId,true);throw error}this.ownerTimer=setInterval(()=>{try{options.repository.owner(this.ownerId)}catch{void this.close()}},10000)}
 assertReady():void{if(this.closing)fail(503,'RUNNER_CLOSED','Core运行器已关闭');this.options.repository.owner(this.ownerId)}
 get running(){return [...this.active.keys()]}
 schedule(id:string,principal:Principal,proof:SessionLease):void{
  if(this.closing||this.active.has(id))return
  this.options.repository.owner(this.ownerId)
  const record=this.options.repository.pending(id);if(!record||record.deviceId!==principal.deviceId)return
  if(this.active.size>=50)fail(429,'RUN_LIMIT','宿主并发会话已满')
  const run:ActiveRun={finished:false,device:principal,proof,stop:new AbortController(),done:Promise.resolve()};this.active.set(id,run)
  // 先同步预留运行槽，再异步创建内核；RPC立即返回accepted。
  run.done=Promise.resolve().then(()=>this.execute(id,record,run)).finally(()=>{
   this.active.delete(id)
   for(const [key,value]of this.approvals)if(value.run===run)this.approvals.delete(key)
   if(!this.closing&&!run.stop.signal.aborted){try{const proof=this.options.repository.leases.renew(run.proof);this.schedule(id,principal,proof)}catch{/*租约失效不再自动排队*/}}
  }).catch(()=>{this.active.delete(id)})
 }
 private async execute(id:string,record:RequestRecord,run:ActiveRun):Promise<void>{
  const {repository:repo}=this.options;let last=0,done=false,failed=false
  let signature:string|undefined
  const verify=()=>{const current=this.options.authorize(run.device),session=repo.get(id);if(!current.control||!session?.workspaceId||!current.workspaceIds.includes(session.workspaceId))throw new Error('会话项目或授权已改变');const next=JSON.stringify([session.kernelId,session.workspaceId,session.permissionMode,session.model,session.worktree,session.attachedDirectories,this.options.cwd(session)]);if(signature&&signature!==next)throw new Error('会话执行上下文已改变');return {session,signature:next}}
  const append=(event:KernelEvent)=>{verify();repo.owner(this.ownerId);repo.leases.assert(run.proof);repo.append(run.proof,[{ts:repo.clock(),turnId:record.messageId,kernelEvent:event}]);this.options.changed?.(id)}
  const deadline=setTimeout(()=>{run.stop.abort();if(run.handle)void run.kernel?.cancel(run.handle).catch(()=>{})},this.options.runTimeoutMs??120000)
  const tick=setInterval(()=>{try{verify();run.proof=repo.leases.renew(run.proof)}catch{run.stop.abort();if(run.handle)void run.kernel?.cancel(run.handle).catch(()=>{})}},10000)
  try{
   this.options.authorize(run.device);repo.owner(this.ownerId);repo.leases.assert(run.proof)
   const checked=verify(),session=checked.session;signature=checked.signature
   const history=repo.history(id)
   if(!repo.start(record,run.proof))return
   if(run.stop.signal.aborted)throw new Error('运行已取消')
   const kernel=await bounded(this.options.kernel(session,run.device),run.stop.signal);run.kernel=kernel
   if(run.stop.signal.aborted)throw new Error('运行已取消')
   verify()
   if(!kernel.createSession)fail(422,'KERNEL_UNAVAILABLE','内核不支持创建会话')
   if(kernel.id!==session.kernelId)throw new Error('宿主内核与会话配置不匹配')
   const creation=kernel.createSession({sessionId:id,cwd:this.options.cwd(session),systemPrompt:''})
   let expired=false
   void creation.then(handle=>{if(expired||run.stop.signal.aborted)void kernel.close(handle).catch(()=>{})},()=>{})
   try{run.handle=await bounded(creation,run.stop.signal)}catch(error){expired=true;throw error}
   if(run.handle.sessionId!==id||run.handle.kernelId!==kernel.id)throw new Error('内核返回外会话句柄')
   if(run.stop.signal.aborted)throw new Error('运行已取消')
   const iterator=kernel.prompt(run.handle,{runId:record.runId,text:record.text,history:history.slice(-20)},{signal:run.stop.signal})[Symbol.asyncIterator]()
   for(;;){
    const next=await bounded(iterator.next(),run.stop.signal,this.options.runTimeoutMs??120000);if(next.done)break;const raw=next.value
    if(run.stop.signal.aborted)throw new Error('运行已取消')
    const event=KernelEventSchema.parse(raw)
    if(Buffer.byteLength(JSON.stringify(event))>2*1024*1024)throw new Error('内核单条事件过大')
    if(event.runId!==record.runId||event.seq!==last+1||done)throw new Error('内核事件序号或终态无效')
    append(event);last=event.seq;done=event.t==='done';run.finished=done;if(event.t==='done'&&['error','cancelled'].includes(event.reason))failed=true
    if(event.t==='permission.request'){
     if(this.approvals.size>=200)throw new Error('待审批过多')
     if(this.approvals.has(event.req.requestId))throw new Error('审批ID冲突')
     this.approvals.set(event.req.requestId,{sessionId:id,event:event.req,createdAt:repo.clock(),run})
    }
   }
   if(!done)throw new Error('内核缺少终态')
   repo.requestStatus(record,failed?'failed':'completed')
  }catch(error){
   if(!done){try{append({t:'error',runId:record.runId,seq:last+1,err:{code:'RUN_FAILED',message:run.stop.signal.aborted?'运行已中止':'内核运行失败，请在宿主检查配置',recoverable:true}});last++;append({t:'done',runId:record.runId,seq:last+1,reason:run.stop.signal.aborted?'cancelled':'error'})}catch{/*旧fence不得追加错误事件*/}}
   repo.requestStatus(record,error instanceof JournalCapacityError?'capacity-exceeded':run.stop.signal.aborted?'interrupted':'failed')
  }finally{
   run.finished=true;clearInterval(tick);clearTimeout(deadline)
   if(run.kernel&&run.handle)await bounded(run.kernel.close(run.handle),new AbortController().signal).catch(()=>{})
   this.options.changed?.(id)
  }
 }
 pending(allowed:(id:string)=>boolean):Array<Approval&{sessionId:string;allowedDecisions:Array<'allow'|'allow-session'|'deny'>}>{return [...this.approvals].filter(([,pending])=>allowed(pending.sessionId)).map(([id,pending])=>{
  const preview=remoteApprovalPreview(pending.event.input),decisions:Array<'allow'|'allow-session'|'deny'>=[]
  for(const decision of ['allow','allow-session','deny'] as const)if(pending.event.actions.some(action=>action.behavior===(decision==='deny'?'deny':'allow')&&(decision==='deny'||(decision==='allow-session'?action.variant==='session':!action.variant||action.variant==='once')))){
   if(decision==='deny'){decisions.push(decision);continue}
   try{this.approvalPolicy(pending,decision);if(preview.canApprove)decisions.push(decision)}catch(error){if(!(error instanceof ServiceError))throw error}
  }
  return {id,sessionId:pending.sessionId,kind:pending.event.kind,toolCallId:id,request:`${pending.event.summary}\n${preview.inputPreview}`,createdAt:pending.createdAt,allowedDecisions:decisions}
 })}
 private approvalPolicy(pending:PendingApproval,decision:'allow'|'allow-session'):void{
  const session=this.options.repository.get(pending.sessionId);if(!session)fail(404,'SESSION_MISSING','会话不存在')
  const req=pending.event,policy=normalizePermissionPolicy(session.permissionMode)
  const raw=req.input.rawInput??req.input,input=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}
  const command=typeof input.command==='string'?input.command:undefined
  const facts=new PermissionRules().evaluate(session.id,policy,{tool:command?'execute':req.tool,command,input})
  if(facts.decision==='deny'||decidePermission(policy,{kind:req.kind,readOnlyCommand:!!command&&facts.risk==='read'})==='deny')fail(403,'APPROVAL_DENIED','会话权限或命令策略拒绝此审批')
  if(decision==='allow-session'&&(!facts.whitelistable||['delete','fetch'].includes(req.kind)))fail(422,'APPROVAL_SCOPE_DENIED','此操作不能加入会话授权')
 }
 async respond(requestId:string,decision:'allow'|'allow-session'|'deny',allowed:(id:string)=>boolean):Promise<boolean>{
  const pending=this.approvals.get(requestId);if(!pending||!allowed(pending.sessionId))return false
  const {run}=pending
  if(!run.handle||!run.kernel?.respondPermission||run.stop.signal.aborted||run.finished)return false
  const actor=this.options.authorize(run.device),session=this.options.repository.get(pending.sessionId);if(!actor.control||!session?.workspaceId||!actor.workspaceIds.includes(session.workspaceId))return false
  this.options.repository.leases.assert(run.proof)
  if(decision!=='deny')this.approvalPolicy(pending,decision)
  if(decision!=='deny'&&!remoteApprovalPreview(pending.event.input).canApprove)fail(422,'APPROVAL_TOO_LARGE','工具参数过长，请在宿主查看完整参数后审批')
  const action=pending.event.actions.find(action=>action.behavior===(decision==='deny'?'deny':'allow')&&(decision==='deny'||(decision==='allow-session'?action.variant==='session':!action.variant||action.variant==='once')))
  if(!action)fail(422,'UNSUPPORTED_APPROVAL','该内核未提供所选审批作用域')
  this.approvals.delete(requestId)
  await bounded(run.kernel.respondPermission(run.handle,requestId,{actionId:action.id,behavior:decision==='deny'?'deny':'allow'}),run.stop.signal)
  return true
 }
 async interrupt(id:string):Promise<boolean>{const run=this.active.get(id);if(!run)return false;run.stop.abort();if(run.kernel&&run.handle)void run.kernel.cancel(run.handle).catch(()=>{});await run.done;return true}
 async revoke(deviceId:string):Promise<void>{this.options.repository.journal.db.prepare("UPDATE service_requests SET status='interrupted' WHERE device_id=? AND status='queued'").run(deviceId);await Promise.all([...this.active].filter(([,run])=>run.device.deviceId===deviceId).map(([id])=>this.interrupt(id)))}
 async close():Promise<void>{if(this.closingPromise)return this.closingPromise;this.closing=true;clearInterval(this.ownerTimer);this.closingPromise=(async()=>{await Promise.all([...this.active.keys()].map(id=>this.interrupt(id)));try{this.options.repository.owner(this.ownerId,true)}catch{/*已失去runner租约*/}})();return this.closingPromise}
}
