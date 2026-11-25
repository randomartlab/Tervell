import {JsonRpcPeer} from '../rpc.ts'
import type {JsonValue} from '@proma/protocol'
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{}
let remote='w7-remote'
const peer=new JsonRpcPeer(process.stdin,process.stdout,{onRequest:async(method,params):Promise<JsonValue>=>{
 if(method==='initialize')return {protocolVersion:1}
 if(method==='session/new')return {sessionId:remote}
 if(method==='session/prompt'){
  const text=String(object((object(params).prompt as unknown[])?.[0]).text)
  if(text.includes('permission')){
   const response=await peer.request('session/request_permission',{sessionId:remote,toolCall:{toolCallId:'t1',title:'Write',kind:'edit',rawInput:{path:'a.txt'}},options:[{optionId:'once',name:'一次',kind:'allow_once'},{optionId:'session',name:'会话',kind:'allow_always'},{optionId:'no',name:'拒绝',kind:'reject_once'}]})
   await peer.notify('session/update',{sessionId:remote,update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:JSON.stringify(response)}}})
  }else{
   await peer.request('fs/write_text_file',{sessionId:remote,path:'from-acp.txt',content:'ACP写入'})
   const content=await peer.request('fs/read_text_file',{sessionId:remote,path:'from-acp.txt'})
   let blocked=false;try{await peer.request('fs/read_text_file',{sessionId:'foreign',path:'from-acp.txt'})}catch{blocked=true}
   const created=object(await peer.request('terminal/create',{sessionId:remote,command:process.execPath,args:['-e',"console.log('ACP终端');process.exit(3)"]}))
   const status=await peer.request('terminal/wait_for_exit',{sessionId:remote,terminalId:String(created.terminalId)})
   const output=await peer.request('terminal/output',{sessionId:remote,terminalId:String(created.terminalId)})
   await peer.request('terminal/release',{sessionId:remote,terminalId:String(created.terminalId)})
   await peer.notify('session/update',{sessionId:remote,update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:JSON.stringify({content,blocked,status,output})}}})
  }
  return {stopReason:'end_turn'}
 }
 throw new Error('未实现')
}})
