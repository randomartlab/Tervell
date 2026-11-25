import type { JsonValue } from '@proma/protocol'
import {JsonRpcPeer} from '../rpc.ts'
let fastMode=false,provider='local';
let model='local-small',mode='review',speed='normal',reasoning='medium';const sessionId='configurable'
const options=():JsonValue[]=>[...(process.argv.includes('--provider-control')?[{id:'provider',category:'model',name:'Provider',type:'select',currentValue:provider,options:[{value:'local',name:'Local'},{value:'cloud',name:'Cloud'}]}]:[]),{id:'fast-mode',category:'speed',name:'Fast mode',type:'boolean',currentValue:fastMode},{id:'model',category:'model',name:'Model',type:'select',currentValue:model,options:provider==='cloud'?[{value:'cloud-large',name:'Cloud Large'}]:[{value:'local-small',name:'Local Small'},{value:'local-large',name:'Local Large'}]},{id:'mode',category:'mode',name:'Mode',type:'select',currentValue:mode,options:[{value:'review',name:'Review'},{value:'build',name:'Build'}]},...(model==='local-large'?[{id:'speed',category:'speed',name:'Speed',type:'select',currentValue:speed,options:[{value:'normal',name:'Normal'},{value:'fast',name:'Fast'}]},{id:'thinking',category:'thought_level',name:'Reasoning',type:'select',currentValue:reasoning,options:[{value:'medium',name:'Medium'},{value:'high',name:'High'}]}]:[])]
const peer=new JsonRpcPeer(process.stdin,process.stdout,{timeoutMs:120000,onRequest:async(method,params):Promise<JsonValue>=>{
 const p=params&&typeof params==='object'&&!Array.isArray(params)?params:{}
 if(method==='initialize'&&process.argv.includes('--hang-initialize'))return new Promise<JsonValue>(()=>{})
 if(method==='initialize')return {protocolVersion:1,agentCapabilities:{loadSession:false}}
 if(method==='session/new')return {sessionId,configOptions:options()}
 if(method==='session/set_config_option'){if(p.configId==='provider'&&['local','cloud'].includes(String(p.value))){provider=String(p.value);model=provider==='cloud'?'cloud-large':'local-small';}else if(p.configId==='fast-mode'){if(p.type!=='boolean'||typeof p.value!=='boolean')throw new Error('typed boolean required');fastMode=p.value;}else if(p.configId==='model'&&(provider==='cloud'?['cloud-large']:['local-small','local-large']).includes(String(p.value)))model=String(p.value);else if(p.configId==='mode'&&['review','build'].includes(String(p.value)))mode=String(p.value);else if(p.configId==='speed'&&model==='local-large'&&['normal','fast'].includes(String(p.value)))speed=String(p.value);else if(p.configId==='thinking'&&model==='local-large'&&['medium','high'].includes(String(p.value)))reasoning=String(p.value);else throw new Error('invalid option');await peer.notify('session/update',{sessionId,update:{sessionUpdate:'config_option_update',configOptions:options()}});return {configOptions:options()}}
 if(method==='session/prompt'){const text=Array.isArray(p.prompt)?p.prompt.map(value=>value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.text==='string'?value.text:'').join(''):'';if(text.endsWith('qa-hang'))return new Promise(()=>{});
 if(text.endsWith('qa-file-approval')){
  await peer.request('fs/write_text_file',{sessionId,path:'qa-acp-file.txt',content:'ACP_APPROVED_FILE_WRITE'})
  const result=await peer.request('fs/read_text_file',{sessionId,path:'qa-acp-file.txt'})
  await peer.notify('session/update',{sessionId,update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:`ACP文件审批成功 ${JSON.stringify(result)}`}}});return {stopReason:'end_turn'}
 }
 await peer.notify('session/update',{sessionId,update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:`ACP运行成功 model=${model} mode=${mode} speed=${speed} reasoning=${reasoning}`}}});return {stopReason:'end_turn'}}
 throw new Error('unsupported')
}})
