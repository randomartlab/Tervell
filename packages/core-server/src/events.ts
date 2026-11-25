import type {ClientKind,StoredEvent,ApiResult,JsonValue} from '@proma/protocol'
import type {ServiceRepository} from './repository.ts'
import {fail} from './errors.ts'
/** 保留每条session seq；手机裁剪大载荷但不合并/跳过事件。 */
export function eventPage(repository:ServiceRepository,id:string,kind:ClientKind,afterSeq=0,epoch?:string,limit=100):ApiResult<'session.events'>{
 const head=repository.head(id),reset=epoch!==undefined&&epoch!==repository.epoch,after=reset?0:afterSeq
 if(after>head)fail(409,'CURSOR_AHEAD','事件游标领先服务端')
 const rows=repository.read(id,after,limit),events:ApiResult<'session.events'>['events']=[];let bytes=0
 for(const row of rows){const item=wireEvent(row,kind)
  if(row.kernelEvent.seq===1){const message=repository.userMessage(id,row.turnId);if(message)item.userMessage={...message,text:message.text.slice(0,8000),truncated:message.text.length>8000}}
  const size=Buffer.byteLength(JSON.stringify(item));if(events.length&&bytes+size>384*1024)break;events.push(item);bytes+=size}
 const running=repository.journal.db.prepare("SELECT status FROM service_requests WHERE session_id=? AND status='running' LIMIT 1").get(id)
 const latest=running??repository.journal.db.prepare('SELECT status FROM service_requests WHERE session_id=? ORDER BY rowid DESC LIMIT 1').get(id)
 const executionStatus=latest?.status??'idle'
 return {id,epoch:repository.epoch,headSeq:head,events,hasMore:(events.at(-1)?.seq??after)<head,reset,executionStatus:executionStatus as NonNullable<ApiResult<'session.events'>['executionStatus']>}
}
function wireEvent(row:StoredEvent,kind:ClientKind):ApiResult<'session.events'>['events'][number]{
 const event=row.kernelEvent,raw=JSON.parse(JSON.stringify(event)) as JsonValue
 const large=Buffer.byteLength(JSON.stringify(raw))>128*1024
 let value:JsonValue=raw,truncated=false
 if(kind==='mobile'&&event.t==='message.final'){
  const message=structuredClone(event.message);let budget=8000
  message.content=message.content.map(part=>{
   if(part.type==='text'||part.type==='thinking'){const text=part.text.slice(0,Math.max(0,budget));budget-=text.length;if(text.length<part.text.length)truncated=true;return {...part,text}}
   if(part.type==='tool-call'){truncated=true;return {type:'text' as const,text:`工具调用: ${part.name.slice(0,200)}`}}
   if(part.type==='tool-result'){truncated=true;return {type:'text' as const,text:'工具输出（在桌面查看）'}}
   truncated=true;return {type:'text' as const,text:'[image:请按需查看原图]'}
  })
  value=JSON.parse(JSON.stringify({...event,message})) as JsonValue
 }else if(large||(kind==='mobile'&&['tool.call','tool.update','permission.request','error'].includes(event.t))){
  const summary=event.t==='tool.call'?event.call.name:event.t==='tool.update'?`工具 ${event.callId}: ${event.patch.status??'更新'}`:event.t==='permission.request'?event.req.summary:event.t==='error'?event.err.message:event.t==='message.delta'?event.text:'[payload omitted]'
  value={t:event.t,runId:event.runId,seq:event.seq,summary:summary.slice(0,4000)};truncated=true
 }
 if(Buffer.byteLength(JSON.stringify(value))>128*1024){value={t:event.t,runId:event.runId,seq:event.seq,summary:'[payload omitted: large structured message]'};truncated=true}
 return {seq:row.seq,ts:row.ts,turnId:row.turnId,event:value,truncated}
}
