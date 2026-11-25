import {ToolGate} from '@proma/core/permission'
import type {GateOptions} from '@proma/core/permission'
import {JsonValueSchema} from '@proma/protocol'
import {AjvJsonSchemaValidator} from '@modelcontextprotocol/sdk/validation/ajv'
import type {JsonSchemaValidator} from '@modelcontextprotocol/sdk/validation/types.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {BoundedStdioTransport} from './bounded-stdio.ts'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { McpConnectionSchema } from '@proma/protocol'
import type { McpConnection } from '@proma/protocol'
import { isAbsolute } from 'node:path'
import type { McpOAuthProvider } from './oauth.ts'
export interface McpClientOptions {config:McpConnection;secrets:{get(ref:string):Promise<string|undefined>};oauth?:McpOAuthProvider;authOrigins?:readonly string[];timeoutMs?:number;gate?:ToolGate}
/** 成功初始化且listTools校验通过才标ready；协议错误关闭连接，不静默改换传输。 */
export class ManagedMcpClient {
 private readonly gate:ToolGate
 private readonly lifetime=new AbortController()
 private client?:Client
 private transport?:Transport
 private authTransport?:StreamableHTTPClientTransport|SSEClientTransport
 private catalog:Array<{name:string;description?:string;inputSchema:Record<string,unknown>}>=[]
 private readonly validators=new Map<string,JsonSchemaValidator<unknown>>()
 private phase:'idle'|'connecting'|'auth-required'|'ready'|'closed'='idle'
 private readonly settings:McpConnection
 get config():McpConnection{return structuredClone(this.settings)}
 constructor(private readonly options:McpClientOptions){this.settings=McpConnectionSchema.parse(options.config);this.gate=options.gate??new ToolGate();for(const origin of options.authOrigins??[]){const url=new URL(origin);if(url.origin!==origin||!(url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','[::1]','localhost'].includes(url.hostname))))throw new Error('MCP授权来源不安全')} }
 get status(){return this.phase}
 tools(){if(this.phase!=='ready')throw new Error('MCP尚未完成握手');return this.catalog.map(tool=>({...structuredClone(tool),name:`mcp__${this.settings.id}__${tool.name}`}))}
 private async fetch(input:string|URL|Request,init?:RequestInit):Promise<Response>{
  const url=new URL(input instanceof Request?input.url:String(input))
  if(this.config.transport==='stdio')throw new Error('stdio不能发起网络请求')
  const server=new URL(this.config.url),origins=[server.origin,...this.options.authOrigins??[]]
  if(!origins.includes(url.origin)||url.username||url.password)throw new Error('MCP网络目标未经授权')
  const headers=new Headers(input instanceof Request?input.headers:undefined)
  new Headers(init?.headers).forEach((value,key)=>headers.set(key,value))
  if(url.origin!==server.origin)headers.delete('Authorization')
  const response=await fetch(input,{...init,headers,redirect:'error',signal:AbortSignal.any([this.lifetime.signal,...(init?.signal?[init.signal]:[])])})
  const size=Number(response.headers.get('content-length')??'0');if(size>2*1024*1024)throw new Error('MCP响应超限')
  if(!response.body)return response
  let bytes=0,previous=-1
  const streaming=response.headers.get('content-type')?.includes('text/event-stream')
  const body=response.body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){
    for(const byte of chunk){bytes++;if(bytes>2*1024*1024)throw new Error('MCP响应帧超限');if(streaming&&byte===10&&previous===10)bytes=0;if(byte!==13)previous=byte}
    controller.enqueue(chunk)
  }}))
  return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers})
 }
 async connect():Promise<void>{
  if(!['idle','auth-required'].includes(this.phase))throw new Error('MCP连接状态不允许握手')
  this.phase='connecting'
  try{
  const client=new Client({name:'proma',version:'0.1.0'})
  let transport:Transport
  if(this.config.transport==='stdio'){
    if(!isAbsolute(this.config.command))throw new Error('MCP命令必须由宿主解析为绝对路径')
    transport=new BoundedStdioTransport(this.config.command,this.config.args)
  }else{
    const headers:Record<string,string>={}
    if(this.config.apiKeyRef){const secret=await this.options.secrets.get(this.config.apiKeyRef);if(!secret)throw new Error('MCP凭据引用不存在');headers.Authorization=`Bearer ${secret}`}
    const opts={fetch:(input:string|URL|Request,init?:RequestInit)=>this.fetch(input,init),requestInit:{headers},authProvider:this.options.oauth}
    const remote=this.config.transport==='http'?new StreamableHTTPClientTransport(new URL(this.config.url),{...opts,reconnectionOptions:{maxRetries:0,initialReconnectionDelay:100,maxReconnectionDelay:100,reconnectionDelayGrowFactor:1}}):new SSEClientTransport(new URL(this.config.url),opts)
    this.authTransport=remote;transport=remote
  }
  this.client=client;this.transport=transport
  try{
    let timer:ReturnType<typeof setTimeout>|undefined
    try{await Promise.race([client.connect(transport,{timeout:this.options.timeoutMs??10000}),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('MCP握手超时')),this.options.timeoutMs??10000)})])}finally{clearTimeout(timer)}
    const listed=await client.listTools({}, {timeout:this.options.timeoutMs??10000})
    if(listed.tools.some(t=>!/^[A-Za-z0-9_.-]{1,80}$/.test(t.name))||listed.nextCursor||listed.tools.length>200||new Set(listed.tools.map(t=>t.name)).size!==listed.tools.length)throw new Error('MCP工具目录超限、分页或重名')
    for(const tool of listed.tools){this.validators.set(tool.name,new AjvJsonSchemaValidator().getValidator(tool.inputSchema))}
    this.catalog=listed.tools.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema}));this.phase='ready'
    client.onclose=()=>{this.phase='closed';this.catalog=[]}
  }catch(error){
    if(error instanceof UnauthorizedError&&this.options.oauth&&this.authTransport){this.phase='auth-required';await transport.close();return}
    await this.close();throw new Error('MCP握手或工具目录校验失败')
  }
  }catch(error){await this.close();throw error}
 }
 async finishAuth(callback:string){
  if(this.phase!=='auth-required'||!this.authTransport||!this.options.oauth)throw new Error('没有待完成的OAuth授权')
  const code=this.options.oauth.consumeCallback(callback)
  try{let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([this.authTransport.finishAuth(code),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('OAuth令牌交换超时')),this.options.timeoutMs??10000)})])}finally{clearTimeout(timer)};await this.connect()}catch{await this.close();throw new Error('OAuth令牌交换失败')}finally{this.options.oauth.clearVerifier()}
 }
 async call(name:string,input:Record<string,unknown>,execution:GateOptions):Promise<unknown>{
  const selected=this.catalog.find(t=>`mcp__${this.settings.id}__${t.name}`===name)
  if(this.phase!=='ready'||!this.client||!selected)throw new Error('MCP工具未协商或连接已关闭')
  input=JsonValueSchema.parse(structuredClone(input)) as Record<string,unknown>
  if(Buffer.byteLength(JSON.stringify(input))>256*1024)throw new Error('MCP输入超限')
  if(!this.validators.get(selected.name)?.(input).valid)throw new Error('MCP工具参数不符合协商schema')
  const client=this.client
  return this.gate.run({name,kind:'other',effect:'external'},JsonValueSchema.parse(input),execution,async()=>{
    const result=await client.callTool({name:selected.name,arguments:input},undefined,{signal:AbortSignal.any([execution.signal,this.lifetime.signal]),timeout:this.options.timeoutMs??10000})
    if(Buffer.byteLength(JSON.stringify(result))>1024*1024)throw new Error('MCP输出超限')
    return result
  })
 }
 async close(){this.lifetime.abort();this.phase='closed';this.catalog=[];this.validators.clear();await this.client?.close().catch(()=>{});await this.transport?.close().catch(()=>{})}
}
