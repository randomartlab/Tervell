import { JsonRpcPeer } from '../rpc'
import type { JsonValue } from '@proma/protocol'
const sessionId='reliability'
const peer=new JsonRpcPeer(process.stdin,process.stdout,{onRequest:async(method,params):Promise<JsonValue>=>{
 if(method==='initialize')return {protocolVersion:1,agentCapabilities:{}}
 if(method==='session/new')return {sessionId}
 if(method==='session/prompt'){
  const p=params as {prompt?:Array<{text?:string}>},text=p.prompt?.[0]?.text??''
  const update=(value:JsonValue)=>peer.notify('session/update',{sessionId,update:value})
  if(text.endsWith('hold')){await update({sessionUpdate:'agent_message_chunk',content:{type:'text',text:'HOLD_CONTENT'}});return new Promise(()=>{})}
  if(text.endsWith('quick')){await update({sessionUpdate:'agent_message_chunk',content:{type:'text',text:'OK'}});return {stopReason:'end_turn'}}
  for(let i=0;i<40;i++){await update({sessionUpdate:'agent_message_chunk',content:{type:'text',text:i===0?'PREFIX_0 ':i===39?' SUFFIX_39':String(i)+' '}});await new Promise(r=>setTimeout(r,8))}
  await update({sessionUpdate:'tool_call',toolCallId:'patch-tool',title:'工具准备',kind:'execute',status:'pending'})
  await update({sessionUpdate:'tool_call_update',toolCallId:'patch-tool',name:'execute',title:'更新后的工具标题',rawInput:{command:'actual-command'},_meta:{source:'fixture'}})
  await update({sessionUpdate:'tool_call_update',toolCallId:'patch-tool',status:'completed',rawOutput:'actual-result'})
  await update({sessionUpdate:'agent_message_chunk',content:{type:'text',text:'FINAL_AFTER_TOOL'}})
  return {stopReason:'end_turn'}
 }
 throw Error('Unsupported method')
}})
