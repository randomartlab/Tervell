import {createHash} from 'node:crypto'
import type { SDKMessage } from '@proma/shared'
import {paseoToolDetail,annotationsForTranscript} from '@proma/shared'

export interface PluginTimelineEntry {
  id: string
  provider: string
  seqStart: number
  seqEnd: number
  sourceSeqRanges: Array<{startSeq:number;endSeq:number}>
  collapsed: string[]
  turnId: string | null
  timestamp: string
  item: Record<string, unknown>
}
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const historyVersions=new Map<string,{hashes:string[];epoch:string}>();
function historyEpoch(messages:SDKMessage[],id:string):string{
 const hashes=messages.map(message=>createHash('sha256').update(JSON.stringify(message)).digest('hex'));
 const previous=historyVersions.get(id),appended=previous&&previous.hashes.length<=hashes.length&&previous.hashes.every((hash,index)=>hash===hashes[index]);
 const epoch=appended?previous.epoch:createHash('sha256').update(hashes.join('\n')).digest('hex').slice(0,32);
 historyVersions.delete(id);historyVersions.set(id,{hashes,epoch});
 if(historyVersions.size>128)historyVersions.delete(historyVersions.keys().next().value!);
 return epoch;
}

/** SDK 的时间线使用语义条目，而非 Tervell 的原始消息信封。 */
export function pluginTimelinePage(messages: SDKMessage[], options: Record<string, unknown> = {}) {
  const entries: PluginTimelineEntry[] = [];
  let turnId: string | null = null;
  const provider = String(options.provider ?? 'pi');
  const epoch = historyEpoch(messages,String(options.agentId??record(messages[0]).uuid??'empty'));
  const calls = new Map<string, PluginTimelineEntry>();
  for (const [index, raw] of collapsePluginTimeline(messages).entries()) {
    const message = record(raw), body = record(message.message);
    const id = String(message.uuid ?? index);
    const timestamp = typeof message.timestamp === 'string' ? message.timestamp : new Date(typeof message._createdAt === 'number' ? message._createdAt : 0).toISOString();
    const add = (item: Record<string, unknown>, suffix = '') => {
      const seq = entries.length;
      const entry = {id:id+suffix,provider,seqStart:seq,seqEnd:seq,sourceSeqRanges:[{startSeq:seq,endSeq:seq}],collapsed:[],turnId,timestamp,item};
      entries.push(entry);
      return entry;
    };
    if (message.type === 'system' && message.subtype === 'plugin_turn') { turnId = String(message.turnId); continue; }
    if (message.type === 'system' && message.subtype === 'plugin_timeline') { add({ ...record(message.item), pluginId: message.pluginId }); continue; }
    if(message.type==='system'){
      if(message.subtype==='builtin_chat_system')add({type:'notification',level:'info',message:String(message.message)},':system');
      else if(message.subtype==='builtin_chat_error')add({type:'error',message:String(message.message)},':error');
      else if(message.subtype==='compact_boundary'||message.subtype==='compact_status')add({type:'compaction',status:message.compact_result==='success'||message.subtype==='compact_boundary'?'completed':'loading'},':compact');
      else if(message.subtype==='permission_denied')add({type:'notification',level:'warning',message:String(message.message??message.decision_reason??'工具操作被拒绝')},':notice');
      else if(message.subtype==='task_notification')add({type:'notification',level:message.status==='failed'?'error':'info',message:String(message.summary??message.description??'子任务状态已更新')},':task');
    }
    if (message.type !== 'user' && message.type !== 'assistant' || message._partial || message.isReplay) continue;
    const parts = typeof body.content === 'string' ? [{ type: 'text', text: body.content }] : Array.isArray(body.content) ? body.content.map(record) : [];
    if (message.type === 'user' && parts.some(part => part.type === 'text')) turnId = id;
    parts.forEach((part, partIndex) => {
      if (part.type === 'text') add({ type: message.type === 'user' ? 'user_message' : 'assistant_message', text: options.rawAnnotations===true?String(part.text??''):annotationsForTranscript(String(part.text ?? '')), messageId:id }, ':' + partIndex);
      else if (part.type === 'thinking') add({ type: 'reasoning', text: String(part.thinking ?? '') }, ':' + partIndex);
      else if (part.type === 'tool_use') {const entry=add({ type:'tool_call',callId:part.id,name:part.name,status:'running',error:null,detail:paseoToolDetail(String(part.name),part.input,null)}, ':'+partIndex);calls.set(String(part.id),entry);Object.defineProperty(entry,'_toolInput',{value:part.input,enumerable:false});}
      else if (part.type === 'tool_result') {
        const call = calls.get(String(part.tool_use_id));
        if (call) { call.item.status=part.is_error?'failed':'completed';call.item.error=part.is_error?part.content??'工具失败':null;call.item.detail=paseoToolDetail(String(call.item.name),Reflect.get(call,'_toolInput'),part.content); }
      }
    });
    if (message.error) add({ type: 'error', message: String(record(message.error).message ?? message.error) }, ':error');
  }
  const limit = typeof options.limit === 'number' && Number.isInteger(options.limit) ? Math.max(0, Math.min(options.limit, 10000)) : 100;
  const direction = options.direction === 'before' || options.direction === 'after' ? options.direction : 'tail';
  const cursor = record(options.cursor), staleCursor = typeof cursor.epoch === 'string' && cursor.epoch !== epoch;
  let start = 0, end = entries.length;
  if (!staleCursor && typeof cursor.seq === 'number') {
    if (direction === 'before') end = entries.findIndex(e => e.seqStart >= Number(cursor.seq));
    if (end < 0) end = entries.length;
    if (direction === 'after') { start = entries.findIndex(e => e.seqEnd > Number(cursor.seq)); if (start < 0) start = entries.length; }
  }
  if (limit) {
    if (direction === 'after' && !staleCursor) end = Math.min(end,start+limit);
    else start = Math.max(start,end-limit);
  }
  if (options.wholeTurns === true && direction !== 'after') {
    while (start > 0 && entries[start]?.turnId !== null && entries[start - 1]?.turnId === entries[start]?.turnId) start--;
  }
  const page=entries.slice(start,end);
  return {
    requestId:String(options.requestId??'local-timeline'),agentId:String(options.agentId??''),
    direction,projection:options.projection==='canonical'?'canonical':'projected',epoch,
    reset:staleCursor,staleCursor,gap:false,
    window:{minSeq:0,maxSeq:Math.max(0,entries.length-1),nextSeq:entries.length},
    startCursor:page.length?{epoch,seq:page[0]!.seqStart}:null,
    endCursor:page.length?{epoch,seq:page.at(-1)!.seqEnd}:null,
    entries:page,hasOlder:start>0,hasNewer:end<entries.length,error:null
  };
}

/** 追加日志中的同一插件行按最后一次值读取，保留首次位置与时间戳。 */
export function collapsePluginTimeline(messages: SDKMessage[]): SDKMessage[] {
  const result: SDKMessage[] = [], positions = new Map<string, number>()
  for (const raw of messages) {
    const message = record(raw), item = record(message.item)
    if (message.type !== 'system' || message.subtype !== 'plugin_timeline' || typeof item.id !== 'string') { result.push(raw); continue }
    const key = JSON.stringify([message.pluginId, item.id]), at = positions.get(key)
    if (at === undefined) { positions.set(key, result.length); result.push(raw) }
    else result[at] = { ...raw, uuid: String(record(result[at]).uuid ?? message.uuid ?? ''), timestamp: String(record(result[at]).timestamp ?? message.timestamp ?? '') }
  }
  return result
}
