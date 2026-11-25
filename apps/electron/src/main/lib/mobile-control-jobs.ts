import {mobileControlError} from './mobile-control-errors'
import {randomUUID} from 'node:crypto'
import type {MobileControlCall} from '@proma/protocol'
import type {MobileController} from './mobile-control-policy'
interface Job {id:string;deviceId:string;call:MobileControlCall;startedAt:number;finishedAt?:number;phase:'running'|'done'|'failed';result?:unknown;error?:string}
/** 手机请求短时返回任务票据；同一个加密请求ID只创建一个任务，结果读取重新授权。 */
export class MobileControlJobs {
 private readonly jobs=new Map<string,Job>()
 constructor(private authorize:(device:MobileController,call:MobileControlCall)=>void,private now=Date.now){}
 async run(device:MobileController,call:MobileControlCall,operation:()=>Promise<unknown>,waitMs=1000):Promise<unknown>{
  for(const [id,job]of this.jobs)if(job.finishedAt&&this.now()-job.finishedAt>15*60*1000)this.jobs.delete(id)
  while(this.jobs.size>=100){const completed=[...this.jobs.values()].find(job=>job.phase!=='running');if(!completed)throw new Error('请等待当前操作完成');this.jobs.delete(completed.id)}
  if([...this.jobs.values()].filter(j=>j.deviceId===device.id&&j.phase==='running').length>=3)throw new Error('请等待当前操作完成')
  const job:Job={id:randomUUID(),deviceId:device.id,call:{operation:call.operation,workspaceId:call.workspaceId,sessionId:call.sessionId,values:{...(call.values.autoApprove===true?{autoApprove:true}:{}),...(call.operation==='session.configuration'&&typeof call.values.selection==='object'&&call.values.selection!==null&&!Array.isArray(call.values.selection)&&call.values.selection.autoApprove===true?{selection:{autoApprove:true}}:{}),...(['plugins.mobile-host','plugins.mobile-rpc','plugins.mobile-bundle'].includes(call.operation)?{pluginId:call.values.pluginId}:{}),...(call.operation==='plugins.mobile-result'?{id:call.values.id}:{})}},startedAt:this.now(),phase:'running'};this.jobs.set(job.id,job)
  let timer:ReturnType<typeof setTimeout>|undefined
  const execution=operation().then(result=>{job.phase='done';job.result=result;job.finishedAt=this.now();return result},error=>{job.phase='failed';job.error=mobileControlError(error);job.finishedAt=this.now();return {error:job.error}})
  try{const result=await Promise.race([execution,new Promise(resolve=>{timer=setTimeout(()=>resolve({job:{id:job.id,phase:'running',startedAt:job.startedAt}}),waitMs)})]);if(job.phase!=='running')this.jobs.delete(job.id);return result}finally{clearTimeout(timer)}
 }
 poll(device:MobileController,id:string):unknown{const job=this.jobs.get(id);if(!job||job.deviceId!==device.id)throw new Error('任务不存在或属于其他设备');this.authorize(device,job.call);return {job:{id,phase:job.phase,startedAt:job.startedAt},...(job.phase==='done'?{result:job.result}:{}),...(job.error?{error:job.error}:{})}}
}
