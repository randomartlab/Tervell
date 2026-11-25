import {spawn} from 'node:child_process'
import type {ChildProcessWithoutNullStreams} from 'node:child_process'
import type {Transport} from '@modelcontextprotocol/sdk/shared/transport.js'
import {JSONRPCMessageSchema} from '@modelcontextprotocol/sdk/types.js'
import type {JSONRPCMessage} from '@modelcontextprotocol/sdk/types.js'
/** MCP stdio 客户端的有界传输：在SDK解析前限制输入帧与写队列。 */
export class BoundedStdioTransport implements Transport{
 private child?:ChildProcessWithoutNullStreams
 private closed=false
 private exit?:Promise<void>
 private queued=0
 private buffer=Buffer.alloc(0)
 private readonly writes=new Set<(error:Error)=>void>()
 onclose?:()=>void
 onerror?:(error:Error)=>void
 onmessage?:(message:JSONRPCMessage)=>void
 constructor(private readonly command:string,private readonly args:string[]){}
 async start():Promise<void>{
  if(this.child||this.closed)throw new Error('stdio传输不可重启')
  const child=spawn(this.command,this.args,{env:{PATH:process.env.PATH??''},detached:process.platform!=='win32',stdio:['pipe','pipe','pipe']});this.child=child
  this.exit=new Promise<void>(resolve=>child.once('close',()=>{this.closed=true;for(const reject of this.writes)reject(new Error('MCP进程已退出'));this.writes.clear();this.onclose?.();resolve()}))
  child.stderr.on('data',()=>{})
  const streamError=()=>{this.onerror?.(new Error('MCP stdio流异常'));void this.close()}
  child.stdin.on('error',streamError);child.stdout.on('error',streamError);child.stderr.on('error',streamError)
  child.stdout.on('data',(bytes:Buffer)=>{
   try{
    let start=0
    for(;;){
     const end=bytes.indexOf(10,start),part=bytes.subarray(start,end<0?bytes.length:end)
     if(this.buffer.length+part.length>2*1024*1024)throw new Error('MCP stdio响应帧超限')
     this.buffer=Buffer.concat([this.buffer,part])
     if(end<0)break
     const text=new TextDecoder('utf-8',{fatal:true}).decode(this.buffer)
     this.buffer=Buffer.alloc(0);this.onmessage?.(JSONRPCMessageSchema.parse(JSON.parse(text)));start=end+1
     if(start===bytes.length)break
    }
   }catch{this.onerror?.(new Error('MCP stdio帧无效或超限'));void this.close()}
  })
  child.stdout.once('end',()=>{if(this.buffer.length)this.onerror?.(new Error('MCP stdio帧截断'))})
  child.on('error',()=>this.onerror?.(new Error('MCP stdio进程失败')))
  await new Promise<void>((resolve,reject)=>{child.once('spawn',resolve);child.once('error',()=>reject(new Error('MCP stdio启动失败')))})
 }
 async send(message:JSONRPCMessage):Promise<void>{
  if(this.closed||!this.child)throw new Error('MCP stdio已关闭')
  const bytes=Buffer.from(JSON.stringify(JSONRPCMessageSchema.parse(message))+'\n')
  if(bytes.length>300*1024||this.queued+bytes.length>2*1024*1024)throw new Error('MCP stdio发送背压超限')
  this.queued+=bytes.length
  try{await new Promise<void>((resolve,reject)=>{
   const failed=(error:Error)=>{this.writes.delete(failed);reject(error)};this.writes.add(failed)
   this.child!.stdin.write(bytes,error=>{this.writes.delete(failed);if(error)reject(new Error('MCP stdio写入失败'));else resolve()})
  })}finally{this.queued-=bytes.length}
 }
 async close():Promise<void>{
  if(!this.closed){this.closed=true;try{if(process.platform!=='win32'&&this.child?.pid)process.kill(-this.child.pid,'SIGKILL');else this.child?.kill('SIGKILL')}catch{/*已退出*/}}
  await this.exit
 }
}
