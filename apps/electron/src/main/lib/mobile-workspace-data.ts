import {createHash,randomUUID} from 'node:crypto'
import type {MobileControlCall} from '@proma/protocol'

export interface MobileSlice {content:string;offset:number;nextOffset:number;total:number;hasMore:boolean;revision:string}
/** 以 UTF-16 偏移分页；不拆开代理对，重试始终读相同快照。 */
export function mobileTextSlice(content:string,offset:number,expected?:string,size=12000):MobileSlice {
 const revision=createHash('sha256').update(content).digest('hex')
 if(expected&&expected!==revision)throw Error('内容已更新，请重新读取，未返回拼接后的混合内容')
 if(!Number.isSafeInteger(offset)||offset<0||offset>content.length)throw Error('读取位置无效')
 let end=Math.min(content.length,offset+size)
 if(end<content.length&&end>offset&&/[\uD800-\uDBFF]/.test(content[end-1]!))end--
 return {content:content.slice(offset,end),offset,nextOffset:end,total:content.length,hasMore:end<content.length,revision}
}
interface Result {owner:string;operation:string;sessionId?:string;content:string;expires:number}
/** 插件 RPC 的大结构在设备私有快照中分页，不能被通用摘要逻辑破坏。 */
export class MobileResultPages {
 private readonly results=new Map<string,Result>()
 constructor(private now=Date.now){}
 save(owner:string,operation:string,content:unknown,sessionId?:string):unknown {
  const encoded=JSON.stringify(content??null)
  if(encoded.length<16000)return {result:content??null}
  for(const [id,row] of this.results)if(row.expires<this.now())this.results.delete(id)
  if(encoded.length>32*1024*1024)throw Error('此插件结果过大，请在插件中缩小查询范围')
  while(this.results.size>=12||[...this.results.values()].reduce((n,r)=>n+r.content.length,encoded.length)>64*1024*1024){const first=this.results.keys().next().value;if(!first)break;this.results.delete(first)}
  const id=randomUUID();this.results.set(id,{owner,operation,sessionId,content:encoded,expires:this.now()+10*60*1000})
  return {resultPage:{id,...mobileTextSlice(encoded,0)}}
 }
 read(owner:string,id:string,offset:number):MobileSlice&{operation:string;sessionId?:string} {
  const row=this.results.get(id)
  if(!row||row.owner!==owner||row.expires<this.now())throw Error('结果快照已过期或不属于此设备，请重新执行读取')
  return {...mobileTextSlice(row.content,offset),operation:row.operation,sessionId:row.sessionId}
 }
}

interface ControlResult {owner:string;call:MobileControlCall;content:string;expires:number}
/** 所有控制操作共用的结果分页；读每页时重新核对原操作的当前授权。 */
export class MobileControlPages {
 private readonly results=new Map<string,ControlResult>()
 constructor(private now=Date.now){}
 save(owner:string,call:MobileControlCall,value:unknown):unknown {
  const content=JSON.stringify(value??null)
  if(content.length<=80000)return value
  for(const [id,row]of this.results)if(row.expires<this.now())this.results.delete(id)
  if(content.length>64*1024*1024)throw Error('结果过大，请缩小查询范围后重试；未返回不完整摘要')
  while(this.results.size>=16||[...this.results.values()].reduce((n,r)=>n+r.content.length,content.length)>128*1024*1024){const first=this.results.keys().next().value;if(!first)break;this.results.delete(first)}
  const id=randomUUID()
  // 授权不需要把密钥或编辑正文留在结果元数据中。
  const values:MobileControlCall['values']={}
  if(call.operation==='session.configuration'&&typeof call.values.selection==='object'&&call.values.selection!==null&&!Array.isArray(call.values.selection)&&call.values.selection.autoApprove===true)values.selection={autoApprove:true}
  for(const key of ['autoApprove','pluginId','id'])if(call.values[key]!==undefined)values[key]=call.values[key]!
  this.results.set(id,{owner,call:{...call,values},content,expires:this.now()+15*60*1000})
  return {controlResult:{id,...mobileTextSlice(content,0)}}
 }
 access(owner:string,id:string):MobileControlCall {
  const row=this.results.get(id)
  if(!row||row.owner!==owner||row.expires<this.now())throw Error('结果已过期或不属于此手机，请重新读取')
  return row.call
 }
 read(owner:string,id:string,offset:number) {
  this.access(owner,id)
  return mobileTextSlice(this.results.get(id)!.content,offset)
 }
}
