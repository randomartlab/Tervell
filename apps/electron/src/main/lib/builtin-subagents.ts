import {existsSync,statSync}from'node:fs'
import {jsonlLinesSync}from'./jsonl-reader'

const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
interface Snapshot{revision:string;bytes:number;subagents:Record<string,unknown>[]}
const snapshots=new Map<string,Snapshot>()
const MAX_CACHE_BYTES=8*1024*1024

/** 看板后台轮询只需要子任务描述；不能每次保留整份正文、推理、工具结果再丢弃。 */
export function readBuiltinSubagents(path:string,parentId:string,provider:string):Record<string,unknown>[] {
  if(!existsSync(path)){snapshots.delete(path);return []}
  const stat=statSync(path),revision=`${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}:${parentId}:${provider}`
  const cached=snapshots.get(path)
  if(cached?.revision===revision){snapshots.delete(path);snapshots.set(path,cached);return cached.subagents}
  const children=new Map<string,Record<string,unknown>>()
  for(const {line}of jsonlLinesSync(path)){
    if(!line.trim())continue
    let m:Record<string,unknown>
    try{m=record(JSON.parse(line))}catch{continue}
    if(m.type!=='system'||!['task_started','task_progress','task_notification'].includes(String(m.subtype))||typeof m.task_id!=='string')continue
    const prior=children.get(m.task_id),at=typeof m.timestamp==='string'?m.timestamp:new Date(typeof m._createdAt==='number'?m._createdAt:0).toISOString()
    children.set(m.task_id,{id:m.task_id,parentAgentId:parentId,provider,title:String(m.task_type??'子任务'),description:typeof m.description==='string'?m.description:null,status:m.subtype==='task_notification'?m.status==='failed'?'failed':m.status==='stopped'?'canceled':'completed':'running',createdAt:prior?.createdAt??at,updatedAt:at,subtitle:null})
  }
  const subagents=[...children.values()],bytes=Buffer.byteLength(JSON.stringify(subagents))
  snapshots.delete(path)
  if(bytes<=MAX_CACHE_BYTES)snapshots.set(path,{revision,subagents,bytes})
  let total=[...snapshots.values()].reduce((sum,value)=>sum+value.bytes,0)
  for(const [key,value]of snapshots){if(snapshots.size<=128&&total<=MAX_CACHE_BYTES)break;snapshots.delete(key);total-=value.bytes}
  return subagents
}
