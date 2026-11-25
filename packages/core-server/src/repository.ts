import {randomUUID,createHash} from 'node:crypto'
import {SessionSchema} from '@proma/protocol'
import type {Session,SessionLease,StoredEvent,AppendEventInput,LeaseProof,ApiParams} from '@proma/protocol'
import {LeaseStore,EventJournal,TimelineProjector} from '@proma/core/store'
import type {Journal} from '@proma/core/store'
import {journalTransaction} from '@proma/core/store'
import {fail} from './errors.ts'
export interface RequestRecord {sessionId:string;messageId:string;deviceId:string;text:string;kind:'send'|'queue';status:string;runId:string;createdAt:number}
export class ServiceRepository {
 readonly epoch:string
 readonly leases:LeaseStore
 readonly events:EventJournal
 constructor(readonly journal:Journal,readonly clock=Date.now){
  if(journal.readOnly||journal.schemaVersion<6)fail(503,'STORAGE_UNAVAILABLE','服务需要可写的v6 journal')
  journal.db.prepare("INSERT OR IGNORE INTO service_state VALUES ('epoch',?)").run(randomUUID())
  const saved=journal.db.prepare("SELECT value FROM service_state WHERE key='epoch'").get()?.value
  if(typeof saved!=='string')fail(503,'STORAGE_CORRUPT','服务epoch缺失');this.epoch=saved
  this.leases=new LeaseStore(journal,clock);this.events=new EventJournal(journal)
  // 目录是可重建缓存；新结构升级后为既有会话建立目录版本。
  for(const row of journal.db.prepare('SELECT id,record FROM sessions WHERE NOT EXISTS (SELECT 1 FROM service_directory WHERE session_id=sessions.id)').all())if(typeof row.id==='string'&&typeof row.record==='string'){
   const parsed=SessionSchema.safeParse(JSON.parse(row.record));if(parsed.success&&parsed.data.workspaceId)journal.db.prepare('INSERT INTO service_directory(session_id,workspace_id,record) VALUES (?,?,?)').run(row.id,parsed.data.workspaceId,JSON.stringify(parsed.data))
  }
 }
 upsert(raw:Session):void{const value=SessionSchema.parse(raw);if(!value.workspaceId)fail(400,'WORKSPACE_REQUIRED','服务会话必须属于项目');journalTransaction(this.journal,()=>{
  const previous=this.get(value.id)
  if(previous?.workspaceId&&previous.workspaceId!==value.workspaceId)this.journal.db.prepare('INSERT INTO service_directory(session_id,workspace_id,record) VALUES (?,?,NULL)').run(value.id,previous.workspaceId)
  this.journal.db.prepare('INSERT INTO sessions VALUES (?,?) ON CONFLICT(id) DO UPDATE SET record=excluded.record').run(value.id,JSON.stringify(value))
  this.journal.db.prepare('INSERT INTO service_directory(session_id,workspace_id,record) VALUES (?,?,?)').run(value.id,value.workspaceId!,JSON.stringify(value))
 })}
 get(id:string):Session|undefined{const record=this.journal.db.prepare('SELECT record FROM sessions WHERE id=?').get(id)?.record;return typeof record==='string'?SessionSchema.parse(JSON.parse(record)):undefined}
 list(workspaces:readonly string[],params:ApiParams<'session.list'>){
  const limit=params.limit??50,head=Number(this.journal.db.prepare('SELECT COALESCE(MAX(seq),0) AS head FROM service_directory').get()?.head??0)
  let after=0,upper=head,mode:'snapshot'|'changes'=params.generation===this.epoch&&params.afterSeq!==undefined?'changes':'snapshot'
  if(params.cursor){try{
   const value=JSON.parse(Buffer.from(params.cursor,'base64url').toString('utf8')) as {epoch?:unknown;after?:unknown;upper?:unknown;mode?:unknown}
   if(value.epoch!==this.epoch||!Number.isSafeInteger(value.after)||Number(value.after)<0||!Number.isSafeInteger(value.upper)||Number(value.upper)>head||Number(value.upper)<Number(value.after)||!['snapshot','changes'].includes(String(value.mode)))throw new Error()
   after=Number(value.after);upper=Number(value.upper);mode=value.mode==='changes'?'changes':'snapshot'
  }catch{fail(400,'CURSOR_INVALID','目录游标无效')}}else if(mode==='changes')after=params.afterSeq??0
  if(after>head)fail(409,'CURSOR_AHEAD','目录游标领先服务端')
  const all=this.journal.db.prepare('SELECT seq,session_id,workspace_id,record FROM service_directory WHERE seq>? AND seq<=? ORDER BY seq').all(mode==='snapshot'?0:after,upper)
  const scoped=all.filter(row=>typeof row.workspace_id==='string'&&workspaces.includes(row.workspace_id))
  const latest=new Map<string,typeof scoped[number]>();for(const row of scoped)latest.set(String(row.session_id),row)
  const selected=(mode==='snapshot'?[...latest.values()].filter(row=>Number(row.seq)>after&&row.record!==null):scoped).sort((a,b)=>Number(a.seq)-Number(b.seq))
  const page=selected.slice(0,limit),last=Number(page.at(-1)?.seq??after),hasMore=selected.length>page.length
  const final=new Map<string,typeof page[number]>();for(const row of page)final.set(String(row.session_id),row)
  const entries:Session[]=[],removals:Array<{id:string;seq:number}>=[]
  for(const row of final.values()){const current=this.get(String(row.session_id));if(typeof row.record==='string'&&current?.workspaceId&&workspaces.includes(current.workspaceId))entries.push(SessionSchema.parse(JSON.parse(row.record)));else removals.push({id:String(row.session_id),seq:Number(row.seq)})}
  return {generation:this.epoch,headSeq:hasMore?last:upper,mode,entries,removals,pageInfo:{hasMore,...(hasMore?{nextCursor:Buffer.from(JSON.stringify({epoch:this.epoch,after:last,upper,mode})).toString('base64url')}:{})}}
 }

 revision(workspaceId:string):string{const head=this.journal.db.prepare('SELECT COALESCE(MAX(seq),0) AS seq FROM service_directory WHERE workspace_id=?').get(workspaceId)?.seq??0;return `${this.epoch}:${head}`}
 head(id:string):number{return Number(this.journal.db.prepare('SELECT head_seq FROM journal_state WHERE session_id=?').get(id)?.head_seq??0)}
 append(proof:LeaseProof,items:readonly AppendEventInput[]):void{this.events.append(proof,items)}
 userMessage(id:string,messageId:string):{id:string;text:string;createdAt:number}|undefined{const row=this.journal.db.prepare('SELECT text,created_at FROM service_requests WHERE session_id=? AND message_id=?').get(id,messageId);return row?{id:messageId,text:String(row.text),createdAt:Number(row.created_at)}:undefined}
 read(id:string,after=0,limit=200):StoredEvent[]{return this.events.read(id,after,limit)}
 timeline(id:string,params:ApiParams<'session.timeline'>,mobile=false){
  const head=this.head(id),projector=new TimelineProjector(id);let after=0
  for(;;){const batch=this.read(id,after,10000);if(!batch.length)break;for(const stored of batch){const event=mobile?structuredClone(stored):stored;if(mobile){const kernel=event.kernelEvent;if(kernel.t==='tool.call'){kernel.call.input=undefined;kernel.call.result=undefined;kernel.call.error=undefined}else if(kernel.t==='tool.update'){kernel.patch.result=kernel.patch.result===undefined?undefined:'工具输出（在桌面查看）';kernel.patch.error=kernel.patch.error===undefined?undefined:'工具失败'}else if(kernel.t==='message.final')for(const part of kernel.message.content){if(part.type==='tool-result')part.content='工具输出（在桌面查看）';if(part.type==='tool-call')part.input=undefined}}projector.apply(event)};after=batch.at(-1)!.seq}
  const projected=projector.rows().map(row=>({...row,role:'assistant' as const}))
  const users=this.journal.db.prepare('SELECT message_id,text,created_at FROM service_requests WHERE session_id=? ORDER BY rowid').all(id).flatMap(row=>{const first=this.journal.db.prepare('SELECT MIN(seq) AS seq FROM events WHERE session_id=? AND turn_id=?').get(id,String(row.message_id))?.seq;if(typeof first!=='number')return [];return [{id:`user_${first}`,turnId:String(row.message_id),seqStart:first,seqEnd:first,kind:'text' as const,summary:String(row.text),status:undefined,progress:undefined,role:'user' as const,sourceSeqRanges:[{start:first,end:first}],sessionId:id,runId:'user'}]})
  const all=[...projected,...users].sort((a,b)=>a.seqStart-b.seqStart||(a.role==='user'?-1:1)),reset=!!params.cursor&&params.cursor.epoch!==this.epoch
  const cursor=reset?undefined:params.cursor
  if(cursor&&cursor.seq>head)fail(409,'CURSOR_AHEAD','时间线游标领先服务端')
  const selected=all.filter(row=>!cursor||params.direction==='tail'||(params.direction==='before'?row.seqStart<cursor.seq:row.seqEnd>cursor.seq))
  let rows=params.direction==='after'?selected.slice(0,params.limit):selected.slice(-params.limit)
  // wholeTurns为真时宁可明确拒绝过大单轮，也不能静默拆掉一轮。
  const turns=new Set(rows.map(row=>row.turnId));rows=all.filter(row=>turns.has(row.turnId))
  if(rows.length>1000)fail(413,'TURN_TOO_LARGE','单轮时间线过大，请缩小范围或使用事件分页')
  const first=rows.length?Math.min(...rows.map(row=>row.seqStart)):head+1,last=rows.length?Math.max(...rows.map(row=>row.seqEnd)):head
  return {epoch:this.epoch,rows:rows.map(({sessionId:_session,runId:_run,status:_status,progress:_progress,...row})=>row),hasOlder:all.some(row=>row.seqStart<first),hasNewer:all.some(row=>row.seqEnd>last),endCursor:{epoch:this.epoch,seq:last},...(reset?{reset:true}:{})}
 }
 lease(id:string):SessionLease|undefined{const lease=this.leases.inspect(id);return lease&&lease.expiresAt>this.clock()?lease:undefined}
 remember(id:string,messageId:string,deviceId:string,text:string,kind:'send'|'queue',proof:LeaseProof,busy=false):{duplicate:boolean;record:RequestRecord}{
  return journalTransaction(this.journal,()=>{
   this.leases.assert(proof)
   const hash=createHash('sha256').update(JSON.stringify([text,kind])).digest('hex'),old=this.journal.db.prepare('SELECT * FROM service_requests WHERE session_id=? AND message_id=?').get(id,messageId)
   if(old){if(old.input_hash!==hash||old.device_id!==deviceId)fail(409,'IDEMPOTENCY_CONFLICT','消息ID已用于其他请求');if(old.status==='interrupted')fail(409,'REQUEST_INTERRUPTED','上次请求已中止，请确认后使用新消息ID');return {duplicate:true,record:this.map(old)}}
   if(kind==='send'&&busy)fail(409,'RUNNING','会话运行中，请使用排队发送')
   if(Number(this.journal.db.prepare("SELECT COUNT(*) AS n FROM service_requests WHERE session_id=? AND status IN ('queued','running')").get(id)?.n??0)>=50)fail(429,'QUEUE_FULL','会话排队已满')
   const runId=randomUUID(),at=this.clock();this.journal.db.prepare('INSERT INTO service_requests VALUES (?,?,?,?,?,?,?,?,?)').run(id,messageId,deviceId,hash,text,kind,'queued',runId,at)
   return {duplicate:false,record:{sessionId:id,messageId,deviceId,text,kind,status:'queued',runId,createdAt:at}}
  })
 }
 private map(row:Record<string,unknown>):RequestRecord{return {sessionId:String(row.session_id),messageId:String(row.message_id),deviceId:String(row.device_id),text:String(row.text),kind:row.kind==='queue'?'queue':'send',status:String(row.status),runId:String(row.run_id),createdAt:Number(row.created_at)}}
 pending(id:string):RequestRecord|undefined{const row=this.journal.db.prepare("SELECT * FROM service_requests WHERE session_id=? AND status='queued' ORDER BY created_at,rowid LIMIT 1").get(id);return row?this.map(row):undefined}
 start(record:RequestRecord,proof:LeaseProof):boolean{return journalTransaction(this.journal,()=>{this.leases.assert(proof);const row=this.journal.db.prepare('SELECT status FROM service_requests WHERE session_id=? AND message_id=?').get(record.sessionId,record.messageId);if(row?.status!=='queued')return false;this.requestStatus(record,'running');return true})}
 cancelQueued(id:string,exceptDevice?:string):void{this.journal.db.prepare("UPDATE service_requests SET status='interrupted' WHERE session_id=? AND status='queued'"+(exceptDevice?' AND device_id<>?':'')).run(...(exceptDevice?[id,exceptDevice]:[id]))}
 requestStatus(record:RequestRecord,status:string):void{this.journal.db.prepare('UPDATE service_requests SET status=? WHERE session_id=? AND message_id=?').run(status,record.sessionId,record.messageId)}
 owner(id:string,release=false):void{journalTransaction(this.journal,()=>{
  const old=this.journal.db.prepare("SELECT value FROM service_state WHERE key='runner'").get()?.value
  if(old){const record=JSON.parse(String(old)) as {id:string;expiresAt:number};if(record.id!==id&&(release||record.expiresAt>this.clock()))fail(409,'RUNNER_BUSY','此journal已有Core Service运行中')}
  this.journal.db.prepare("INSERT INTO service_state VALUES ('runner',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify({id,expiresAt:release?0:this.clock()+30000}))
 })}
 history(id:string):import('@proma/protocol').Message[]{
  const requests=this.journal.db.prepare("SELECT message_id,text,created_at FROM service_requests WHERE session_id=? AND status IN ('completed','failed','running') ORDER BY rowid DESC LIMIT 10").all(id).reverse()
  const result:import('@proma/protocol').Message[]=[]
  for(const request of requests){result.push({id:String(request.message_id),role:'user',content:[{type:'text',text:String(request.text)}],createdAt:Number(request.created_at)});const rows=this.journal.db.prepare('SELECT kernel_event FROM events WHERE session_id=? AND turn_id=? ORDER BY seq').all(id,String(request.message_id));for(const row of rows){const event=JSON.parse(String(row.kernel_event)) as import('@proma/protocol').KernelEvent;if(event.t==='message.final'){result.push(event.message);if(result.length>20)result.shift()}}}
  return result.slice(-20)
 }
 recover():void{this.journal.db.prepare("UPDATE service_requests SET status='interrupted' WHERE status='running'").run()}

}
