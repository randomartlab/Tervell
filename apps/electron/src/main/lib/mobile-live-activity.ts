import type {AgentStreamPayload, SDKContentBlock} from '@proma/shared'
import {paseoToolDetail} from '@proma/shared'
export interface MobileActivityRow {id:string;kind:string;label:string;status:string;body:string;createdAt:number}
interface SessionActivity {startedAt:number;generation?:number;rows:Map<string,MobileActivityRow>}
/** 手机只保留当前运行的有界过程快照；完成记录由原始会话转录提供。 */
export class MobileLiveActivity {
 private readonly sessions=new Map<string,SessionActivity>()
 update(id:string,payload:AgentStreamPayload):void {
  if(payload.kind==='proma_event'){
   if(payload.event.type==='run_completed'){const old=this.sessions.get(id);if(old?.generation!==undefined&&payload.event.runGeneration!==undefined&&payload.event.runGeneration<old.generation)return;this.sessions.delete(id);return}
   if(payload.event.type==='run_started'||payload.event.type==='external_run_started'){this.sessions.set(id,{startedAt:Date.now(),generation:payload.event.runGeneration,rows:new Map()});while(this.sessions.size>100)this.sessions.delete(this.sessions.keys().next().value!)}
   return
  }
  let session=this.sessions.get(id)
  if(!session){session={startedAt:Date.now(),rows:new Map()};this.sessions.set(id,session);while(this.sessions.size>100)this.sessions.delete(this.sessions.keys().next().value!)}
  const put=(row:MobileActivityRow)=>{session!.rows.set(row.id,{...row,body:row.body.slice(-8000)});while(session!.rows.size>20)session!.rows.delete(session!.rows.keys().next().value!)}
  const block=(value:SDKContentBlock,key:string)=>{
   if(value.type==='thinking')put({id:key,kind:'reasoning',label:'推理',status:payload.kind==='sdk_message'&&Reflect.get(payload.message,'_partial')?'running':'completed',body:String(value.thinking??''),createdAt:session!.startedAt})
   if(value.type==='tool_use'){const detail=paseoToolDetail(String(value.name),value.input,null);put({id:String(value.id),kind:String(detail.type),label:String(value.name),status:'running',body:JSON.stringify(detail,null,2),createdAt:Date.now()})}
   if(value.type==='tool_result'){const row=session!.rows.get(String(value.tool_use_id));if(row)put({...row,status:value.is_error?'failed':'completed',body:row.body+'\n\n'+(typeof value.content==='string'?value.content:JSON.stringify(value.content))})}
  }
  if(payload.kind==='sdk_delta'){
   const delta=payload.delta
   if(session.generation!==undefined&&delta.runGeneration!==undefined&&delta.runGeneration<session.generation)return
   if(delta.runGeneration!==undefined)session.generation=delta.runGeneration
   for(const part of delta.deltas){
    const key=delta.uuid+':'+('contentIndex'in part?part.contentIndex:0)
    if(part.type==='thinking_start')put({id:key,kind:'reasoning',label:'推理',status:'running',body:'',createdAt:Date.now()})
    if(part.type==='thinking_delta'||part.type==='thinking_end'){const row=session.rows.get(key)??{id:key,kind:'reasoning',label:'推理',status:'running',body:'',createdAt:Date.now()};put({...row,status:part.type==='thinking_end'?'completed':'running',body:part.type==='thinking_end'?part.content:row.body+part.delta})}
    if((part.type==='toolcall_start'||part.type==='toolcall_delta'||part.type==='toolcall_end')&&part.toolCall)block({type:'tool_use',id:part.toolCall.id,name:part.toolCall.name,input:part.toolCall.arguments??{}},key)
   }
  }else{
   const message=payload.message as unknown as {uuid?:string;message?:{content?:unknown};_partial?:boolean}
   const content=message.message?.content
   if(Array.isArray(content))for(const [index,part]of content.entries())if(part&&typeof part==='object'&&'type'in part)block(part as SDKContentBlock,String(message.uuid??'message')+':'+index)
  }
 }
 snapshot(id:string):MobileActivityRow[]{return [...(this.sessions.get(id)?.rows.values()??[])].map(row=>({...row}))}
 clear():void{this.sessions.clear()}
}
