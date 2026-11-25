import {createHash,randomUUID} from 'node:crypto'
import {ApiRequestSchema,assertApiMethodAllowed,parseApiResponse,normalizePermissionPolicy} from '@proma/protocol'
import type {ApiRequest,Session,SessionLease} from '@proma/protocol'
import {ToolGate} from '@proma/core/permission'
import type {GateApproval} from '@proma/core/permission'
import type {Principal,DeviceAuth} from './auth.ts'
import {ServiceRepository} from './repository.ts'
import {ServiceRuntime} from './runtime.ts'
import type {RuntimeOptions} from './runtime.ts'
import {ServiceCapabilities} from './capabilities.ts'
import {eventPage} from './events.ts'
import {fail} from './errors.ts'
export interface DispatcherOptions {repository:ServiceRepository;auth:DeviceAuth;kernel:RuntimeOptions['kernel'];cwd:RuntimeOptions['cwd'];gate?:ToolGate;authorizeTool:(request:GateApproval)=>Promise<boolean|'allow-once'|'allow-session'|'deny'>;hostId?:string;version?:string}
export class ServiceDispatcher{
 readonly repository:ServiceRepository
 readonly runtime:ServiceRuntime
 readonly capabilities:ServiceCapabilities
 private readonly transitions=new Set<string>()
 private readonly gate:ToolGate
 constructor(readonly options:DispatcherOptions){this.repository=options.repository;this.gate=options.gate??new ToolGate();this.runtime=new ServiceRuntime({repository:options.repository,kernel:options.kernel,cwd:options.cwd,authorize:p=>options.auth.check(p)});this.capabilities=new ServiceCapabilities(options.cwd,this.gate)}
 session(principal:Principal,id:string):Session{const p=this.options.auth.check(principal),session=this.repository.get(id);if(!session?.workspaceId||!p.workspaceIds.includes(session.workspaceId))fail(404,'SESSION_MISSING','会话不存在或未授权');return session}
 private canRead(p:Principal,id:string){try{this.session(p,id);return true}catch{return false}}
 private control(p:Principal){this.runtime.assertReady();if(!this.options.auth.check(p).control)fail(403,'READ_ONLY_DEVICE','设备未获控制权限')}
 private publicLease(value:SessionLease|undefined,p:Principal){return value?{holderId:value.holderId,fence:value.fence,expiresAt:value.expiresAt,mine:value.holderId===p.deviceId}:null}
 private writer(p:Principal,id:string):SessionLease{
  if(this.transitions.has(id))fail(409,'LEASE_TRANSITION','会话正在转移写入权')
  this.control(p);this.session(p,id);const current=this.repository.lease(id)
  if(current&&current.holderId!==p.deviceId)fail(409,'LEASE_CONFLICT','由另一设备输入中',{lease:this.publicLease(current,p)})
  try{if(current)return this.repository.leases.renew(current);const lease=this.repository.leases.claim(id,p.deviceId);this.repository.cancelQueued(id,p.deviceId);return lease}catch{fail(409,'LEASE_CONFLICT','写入租约已改变')}
 }
 async dispatch(principal:Principal,raw:unknown):Promise<{request:ApiRequest;data:unknown}>{
  const p=this.options.auth.check(principal)
  if(!raw||typeof raw!=='object'||!('method'in raw)||typeof raw.method!=='string')fail(400,'INVALID_REQUEST','请求格式无效')
  try{assertApiMethodAllowed(p.kind,raw.method)}catch{fail(403,'METHOD_FORBIDDEN','此客户端不允许调用该方法')}
  if('clientKind'in raw&&raw.clientKind!==p.kind)fail(403,'CLIENT_MISMATCH','不能伪造设备客户端类型')
  const parsed=ApiRequestSchema.safeParse(raw);if(!parsed.success)fail(400,'INVALID_REQUEST','参数不符合方法契约')
  const request=parsed.data
  const response=await this.execute(p,request)
  this.options.auth.check(p)
  if('id'in request.params)this.session(p,request.params.id)
  const data=parseApiResponse(request.method,p.kind,response)
  if(Buffer.byteLength(JSON.stringify(data))>1024*1024)fail(413,'RESPONSE_TOO_LARGE','响应过大，请缩小分页')
  return {request,data}
 }
 private async execute(p:Principal,request:ApiRequest):Promise<unknown>{
  const repo=this.repository
  if('id'in request.params)this.session(p,request.params.id)
  switch(request.method){
   case 'session.list':return repo.list(p.workspaceIds,request.params)
   case 'session.detail':return {session:this.session(p,request.params.id)}
   case 'session.timeline':{const timeline=repo.timeline(request.params.id,request.params,p.kind==='mobile');return p.kind==='mobile'?{...timeline,rows:timeline.rows.map(row=>({...row,summary:row.kind==='tool'?'工具活动（详细输入输出请在桌面查看）':row.summary.slice(0,8000)}))}:timeline}
   case 'session.events':return eventPage(repo,request.params.id,p.kind,request.params.afterSeq,request.params.epoch,request.params.limit)
   case 'session.send':case 'session.queue':{
    const input=request.params,id=input.id
    if('attachments'in input&&input.attachments?.length)fail(422,'ATTACHMENTS_UNAVAILABLE','附件上传适配尚未启用')
    if(Buffer.byteLength(input.text)>128*1024)fail(413,'MESSAGE_TOO_LARGE','消息过大')
    const proof=this.writer(p,id),kind=request.method==='session.send'?'send':'queue',messageId=input.clientMessageId??request.requestId
    const saved=repo.remember(id,messageId,p.deviceId,input.text,kind,proof,this.runtime.running.includes(id))
    if(!saved.duplicate||saved.record.status==='queued')this.runtime.schedule(id,p,proof)
    return request.method==='session.send'?{accepted:true,clientMessageId:messageId}:{queuedMessageId:messageId}
   }
   case 'session.interrupt':this.writer(p,request.params.id);repo.cancelQueued(request.params.id);return {interrupted:await this.runtime.interrupt(request.params.id)}
   case 'session.subscribe':for(const id of request.params.ids)this.session(p,id);return {subscriptionId:randomUUID()}
   case 'approval.list':this.control(p);return {approvals:this.runtime.pending(id=>this.canRead(p,id))}
   case 'approval.respond':this.control(p);return {requestId:request.params.requestId,resolved:await this.runtime.respond(request.params.requestId,request.params.decision,id=>this.canRead(p,id))}
   case 'revision.probe':{
    const {scope,entity}=request.params
    if(!p.workspaceIds.includes(scope))fail(403,'SCOPE_DENIED','目录范围未授权')
    if(entity!=='sessions')fail(422,'ENTITY_UNAVAILABLE','此目录适配器尚未接入')
    return {revision:createHash('sha256').update(repo.revision(scope)).digest('hex')}
   }
   case 'host.status':return {hostId:this.options.hostId??'proma-host',version:this.options.version??'0.1.0',status:repo.journal.readOnly?'degraded':'online'}
   case 'lease.status':return {lease:this.publicLease(repo.lease(request.params.id),p)}
   case 'lease.acquire':return {lease:this.publicLease(this.writer(p,request.params.id),p)}
   case 'lease.renew':case 'lease.release':{
    this.control(p);if(this.transitions.has(request.params.id))fail(409,'LEASE_TRANSITION','会话正在转移写入权');const lease=repo.lease(request.params.id)
    if(!lease||lease.holderId!==p.deviceId||lease.fence!==request.params.fence)fail(409,'LEASE_CONFLICT','租约不属于此设备或已过期')
    if(request.method==='lease.release'){this.transitions.add(request.params.id);try{await this.runtime.interrupt(request.params.id);repo.cancelQueued(request.params.id);repo.leases.release(lease);await this.capabilities.revoke(p.deviceId,request.params.id);return {lease:null}}finally{this.transitions.delete(request.params.id)}}
    return {lease:this.publicLease(repo.leases.renew(lease),p)}
   }
   case 'lease.transfer':{
    this.control(p);if(this.transitions.has(request.params.id))fail(409,'LEASE_TRANSITION','会话正在转移写入权');const lease=repo.lease(request.params.id)
    if(!lease||lease.fence!==request.params.expectedFence)fail(409,'LEASE_CONFLICT','租约版本已改变')
    this.transitions.add(request.params.id)
    try{
    await this.runtime.interrupt(request.params.id)
    const latest=repo.lease(request.params.id);if(latest?.fence!==lease.fence)fail(409,'LEASE_CONFLICT','租约版本已改变')
    repo.cancelQueued(request.params.id)
    await this.capabilities.revoke(lease.holderId,request.params.id)
    if(repo.lease(request.params.id)?.fence!==lease.fence)fail(409,'LEASE_CONFLICT','租约在回收期间改变')
    this.control(p);this.session(p,request.params.id)
    return {lease:this.publicLease(repo.leases.claim(request.params.id,p.deviceId,true,request.params.expectedFence),p)}
    }finally{this.transitions.delete(request.params.id)}
   }
   case 'module.catalog':{
    if(request.params.clientKind!==p.kind)fail(403,'CLIENT_MISMATCH','模块目录不能伪造端类型')
    const ready=new Map([['sessions','ready'],['files','read-only'],['terminal',p.control?'ready':'read-only'],['approvals',p.control?'ready':'read-only']])
    return {modules:['sessions','files','changes','terminal','browser','skills','mcp','memory','todo','calendar','automations','kernels','plugins','settings','custom','approvals'].map(id=>({id,state:ready.get(id)??'unavailable',badge:id==='approvals'&&p.control?this.runtime.pending(s=>this.canRead(p,s)).length:0}))}
   }
   case 'files.tree':return this.capabilities.tree(this.session(p,request.params.id),request.params)
   case 'files.diff':return this.capabilities.diff(this.session(p,request.params.id),request.params.path,AbortSignal.timeout(10000))
   case 'terminal.list':return this.capabilities.list(p.deviceId,this.session(p,request.params.id))
   case 'terminal.attach':return this.capabilities.output(p.deviceId,this.session(p,request.params.id),request.params.termId)
   case 'terminal.kill':case 'terminal.release':this.writer(p,request.params.id);await this.capabilities.kill(p.deviceId,this.session(p,request.params.id),request.params.termId,request.method==='terminal.release');return request.method==='terminal.kill'?{stopped:true}:{released:true}
   case 'terminal.create':{
    const proof=this.writer(p,request.params.id),session=this.session(p,request.params.id)
    if(session.permissionMode==='read-only'||session.permissionMode==='plan')fail(403,'READ_ONLY_SESSION','只读会话不允许创建终端')
    const signature=JSON.stringify([session.workspaceId,session.permissionMode,this.options.cwd(session)])
    const termId=await this.capabilities.create(p.deviceId,session,request.params,{context:{sessionId:session.id,workspaceId:session.workspaceId!,permission:normalizePermissionPolicy(session.permissionMode),triggeredBy:'external'},signal:AbortSignal.timeout(120000),authorize:this.options.authorizeTool,assertContext:()=>{this.control(p);const current=this.session(p,session.id);if(JSON.stringify([current.workspaceId,current.permissionMode,this.options.cwd(current)])!==signature)fail(409,'CONTEXT_CHANGED','终端授权上下文已改变');repo.leases.assert(proof)}})
    return {termId}
   }
  }
 }
 async close():Promise<void>{await this.runtime.close();await this.capabilities.close()}
}
