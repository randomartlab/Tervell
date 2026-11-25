import type {SDKMessage,ActivityDisplayPreferences} from '@proma/shared'
import {pluginTimelinePage} from './plugin-host/timeline'
import {getAgentSessionSDKMessages} from './agent-session-manager'
import {readJsonFileSafe} from './safe-file'
import {getConfigDir} from './config-paths'
import {join} from 'node:path'
import {normalizeActivityDisplay} from '@proma/shared'
interface ProcessRow {id:string;kind:string;label:string;status:string;body:string;createdAt:number}
export function mobileMessageProjection(messages:SDKMessage[]):Array<{id:string;role:string;content:string;createdAt:number;activity?:ProcessRow[]}> {
 const entries=pluginTimelinePage(messages,{limit:0}).entries
 const result:Array<{id:string;role:string;content:string;createdAt:number;activity?:ProcessRow[]}>=[]
 let assistant:typeof result[number]|undefined
 for(const e of entries){const item=e.item,when=Date.parse(e.timestamp)||0
  if(item.type==='user_message'){assistant=undefined;result.push({id:e.id,role:'user',content:String(item.text??''),createdAt:when})}
  else if(['assistant_message','reasoning','tool_call','notification','error'].includes(String(item.type))){
   if(!assistant){assistant={id:e.id,role:'assistant',content:'',createdAt:when,activity:[]};result.push(assistant)}
   if(item.type==='assistant_message')assistant.content+=(assistant.content?'\n\n':'')+String(item.text??'')
   else {const detail=item.detail&&typeof item.detail==='object'?item.detail as Record<string,unknown>:{};const body=item.type==='reasoning'?String(item.text??''):item.type==='tool_call'?JSON.stringify(detail,null,2):String(item.message??'');assistant.activity!.push({id:e.id,kind:item.type==='reasoning'?'reasoning':String(detail.type??item.type),label:item.type==='reasoning'?'推理':String(item.name??(item.type==='error'?'运行错误':'状态')),status:String(item.status??(item.type==='error'?'failed':'completed')),body:body.slice(0,8000)+(body.length>8000?'\n［过程较长，请在电脑查看完整记录］':''),createdAt:when})}
  }
 }
 return result
}
export function mobileMessages(id:string){return mobileMessageProjection(getAgentSessionSDKMessages(id))}
export function mobileActivityPreferences():ActivityDisplayPreferences{return normalizeActivityDisplay(readJsonFileSafe(join(getConfigDir(),'activity-display.json')))}
