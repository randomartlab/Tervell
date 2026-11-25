import {randomBytes,createHash} from 'node:crypto'
import type {Server,ServerWebSocket} from 'bun'
import {z} from 'zod'
import {EntityIdSchema} from '@proma/protocol'
import type {Principal,DeviceAuth} from './auth.ts'
import type {ServiceDispatcher} from './dispatcher.ts'
import {ServiceError,fail} from './errors.ts'
import {eventPage} from './events.ts'
import {StaticAssets} from './static.ts'
const TicketRequest=z.strictObject({})
interface SocketState{principal:Principal;subscriptions:Map<string,{epoch:string;seq:number}>;busy:boolean;inbound:number;window:number;offset:number;blocked:boolean}
export interface CoreServerOptions{
 dispatcher:ServiceDispatcher;auth:DeviceAuth;hostname?:string;port?:number
 allowedOrigins?:readonly string[];allowedHosts?:readonly string[];staticRoot?:string
 local?:{workspaceIds:string[];control:boolean}
 batchMs?:number;clock?:()=>number
}
/** Bun原生HTTP/WS，只监听显式地址。公网TLS由可信反向代理终止；不信任forwarded头。 */
export class CoreServer{
 private readonly server:Server<SocketState>
 private readonly revocations=new Map<string,Promise<void>>()
 private readonly sockets=new Set<ServerWebSocket<SocketState>>()
 private readonly cookies=new Map<string,{token:string;expiresAt:number}>()
 private readonly tickets=new Map<string,{principal:Principal;expiresAt:number}>()
 private readonly origins:Set<string>
 private readonly assets?:StaticAssets
 private readonly timer:ReturnType<typeof setInterval>
 private readonly cleanup:ReturnType<typeof setInterval>
 private readonly rates=new Map<string,{at:number;count:number}>()
 private closed=false
 private readonly unsubscribe:()=>void
 private closing?:Promise<void>
 readonly url:string
 private readonly now:()=>number
 constructor(private readonly options:CoreServerOptions){
  this.now=options.clock??Date.now
  this.assets=options.staticRoot?new StaticAssets(options.staticRoot):undefined
  this.origins=new Set(options.allowedOrigins??[])
  const hostname=options.hostname??'127.0.0.1'
  for(const origin of this.origins){const url=new URL(origin);if(url.origin!==origin||!['http:','https:'].includes(url.protocol))throw new Error('Origin白名单格式无效')}
  if(options.batchMs!==undefined&&(!Number.isInteger(options.batchMs)||options.batchMs<10||options.batchMs>1000))throw new Error('批量下发间隔应为10–1000ms')
  if(options.local&&options.allowedHosts?.length)throw new Error('本地免登录与反向代理域名应使用独立监听器')
  if(options.local&&!['127.0.0.1','::1','localhost'].includes(hostname))throw new Error('本地免登录只允许回环监听')
  this.server=Bun.serve<SocketState>({hostname,port:options.port??0,maxRequestBodySize:300*1024,idleTimeout:30,
   fetch:(request,server)=>this.fetch(request,server),
   websocket:{maxPayloadLength:300*1024,backpressureLimit:1024*1024,closeOnBackpressureLimit:true,idleTimeout:60,
    open:ws=>{if(this.sockets.size>=100){ws.close(1013,'connection limit');return}this.sockets.add(ws)},
    message:(ws,message)=>{void this.message(ws,message)},drain:ws=>{ws.data.blocked=false},close:ws=>{this.sockets.delete(ws)},
   },
  })
  this.url=`http://${hostname.includes(':')?`[${hostname}]`:hostname}:${this.server.port}`;this.origins.add(this.url)
  this.unsubscribe=options.auth.onRevoke(id=>{for(const ws of this.sockets)if(ws.data.principal.deviceId===id)ws.close(1008,'revoked');void this.cleanupDevice(id).catch(()=>{})})
  this.cleanup=setInterval(()=>{void options.dispatcher.capabilities.sweep().catch(()=>{})},1000)
  this.timer=setInterval(()=>this.flush(),options.batchMs??50)
 }
 get port(){return this.server.port}
 private json(body:unknown,status=200,headers:Record<string,string>={}):Response{return Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff',...headers}})}
 private origin(request:Request,required=false):void{
  const origin=request.headers.get('origin')
  if((required&&!origin)||(origin&&!this.origins.has(origin)))fail(403,'ORIGIN_FORBIDDEN','请求来源未授权')
  if(request.headers.get('sec-fetch-site')==='cross-site')fail(403,'ORIGIN_FORBIDDEN','不允许跨站控制')
 }
 private principal(request:Request):Principal{
  this.origin(request)
  const header=request.headers.get('authorization')
  if(header)return this.options.auth.authenticate(/^Bearer (\S+)$/.exec(header)?.[1])
  this.origin(request,true)
  const cookie=/(?:^|;\s*)proma_local=([A-Za-z0-9_-]+)/.exec(request.headers.get('cookie')??'')?.[1]
  const record=cookie?this.cookies.get(cookie):undefined
  if(!record||record.expiresAt<=this.now())fail(401,'UNAUTHORIZED','本地会话未初始化')
  return this.options.auth.authenticate(record.token)
 }
 private rate(key:string):void{const now=this.now(),old=this.rates.get(key),value=old&&now-old.at<60000?{at:old.at,count:old.count+1}:{at:now,count:1};if(this.rates.size>2000)this.rates.clear();this.rates.set(key,value);if(value.count>600)fail(429,'RATE_LIMIT','请求过于频繁')}
 private async body(request:Request):Promise<unknown>{
  if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'JSON_REQUIRED','请求需要JSON格式')
  let bytes:ArrayBuffer
  try{bytes=await request.arrayBuffer()}catch{fail(413,'REQUEST_TOO_LARGE','请求超限或未完整送达')}
  if(bytes.byteLength>300*1024)fail(413,'REQUEST_TOO_LARGE','请求超限')
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{fail(400,'INVALID_JSON','JSON格式无效')}
 }
 private async fetch(request:Request,server:Server<SocketState>):Promise<Response|undefined>{
  let requestId:string|undefined
  try{
   if(this.closed)fail(503,'CLOSED','服务正在关闭')
   const url=new URL(request.url)
   if(url.host!==new URL(this.url).host&&!this.options.allowedHosts?.includes(url.host))fail(403,'HOST_FORBIDDEN','Host未授权')
   this.origin(request)
   if(['/rpc','/ws-ticket','/local-session','/health'].includes(url.pathname)&&url.search)fail(400,'QUERY_FORBIDDEN','此接口不接受查询参数')
   if(request.method==='GET'&&url.pathname==='/health')return this.json({service:'proma-core',status:'online',protocol:1})
   if(url.pathname==='/local-session'&&request.method==='POST'){
    this.origin(request,true)
    if(url.origin!==this.url||request.headers.get('origin')!==this.url)fail(403,'LOCAL_ONLY','本地免登录不能从反向代理域名初始化')
    const address=server.requestIP(request)?.address
    if(!this.options.local||!address||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address))fail(403,'LOCAL_ONLY','只允许本机初始化')
    this.rate(`local:${address}`)
    if(this.cookies.size>=100)for(const [key,value]of this.cookies)if(value.expiresAt<=this.now())this.cookies.delete(key)
    if(this.cookies.size>=100)fail(429,'LOCAL_LIMIT','本地会话过多')
    const issued=this.options.auth.issue({name:'local-browser',kind:'web',workspaceIds:this.options.local.workspaceIds,control:this.options.local.control,ttlMs:8*3600000})
    const cookie=randomBytes(32).toString('base64url');this.cookies.set(cookie,{token:issued.token,expiresAt:issued.device.expiresAt})
    return this.json({deviceId:issued.device.id,clientKind:issued.device.kind},200,{'set-cookie':`proma_local=${cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`})
   }
   if(url.pathname==='/rpc'&&request.method==='POST'){
    const principal=this.principal(request);this.rate(principal.deviceId)
    const body=await this.body(request);requestId=this.requestId(body)
    const {request:rpc,data}=await this.options.dispatcher.dispatch(principal,body)
    return this.json({requestId:rpc.requestId,ok:true,data})
   }
   if(url.pathname==='/ws-ticket'&&request.method==='POST'){
    const principal=this.principal(request);this.rate(principal.deviceId);if(!TicketRequest.safeParse(await this.body(request)).success)fail(400,'INVALID_REQUEST','票据请求参数无效')
    for(const [key,t]of this.tickets)if(t.expiresAt<=this.now())this.tickets.delete(key)
    if(this.tickets.size>=1000)fail(429,'TICKET_LIMIT','待连接票据过多')
    const ticket=randomBytes(32).toString('base64url');this.tickets.set(createHash('sha256').update(ticket).digest('hex'),{principal,expiresAt:this.now()+30000})
    return this.json({ticket,expiresIn:30})
   }
   if(url.pathname==='/events'&&request.method==='GET'){
    this.origin(request)
    if((url.searchParams.get('ticket')?.length??0)>100)fail(401,'INVALID_TICKET','票据无效')
    if(!url.searchParams.has('ticket')||url.searchParams.getAll('ticket').length!==1||[...url.searchParams.keys()].some(key=>key!=='ticket'))fail(401,'TICKET_REQUIRED','需要一次性WebSocket票据')
    const hash=createHash('sha256').update(url.searchParams.get('ticket')??'').digest('hex'),ticket=this.tickets.get(hash);this.tickets.delete(hash)
    if(!ticket||ticket.expiresAt<=this.now())fail(401,'INVALID_TICKET','票据无效或已使用')
    const principal=this.options.auth.check(ticket.principal)
    if(server.upgrade(request,{data:{principal,subscriptions:new Map(),busy:false,inbound:0,window:this.now(),offset:0,blocked:false}}))return
    fail(400,'UPGRADE_FAILED','WebSocket升级失败')
   }
   if(['/rpc','/events','/local-session','/ws-ticket'].includes(url.pathname)||['/api/','/rpc/','/events/','/local-session/','/ws-ticket/'].some(prefix=>url.pathname.startsWith(prefix)))return this.json({ok:false,error:{code:'NOT_FOUND',message:'接口或方法不存在'}},404)
   if((request.method==='GET'||request.method==='HEAD')&&this.assets)return this.assets.response(request)
   return this.json({ok:false,error:{code:'NOT_FOUND',message:'资源不存在'}},404)
  }catch(error){return this.failure(error,requestId)}
 }
 private requestId(raw:unknown):string|undefined{if(!raw||typeof raw!=='object'||!('requestId'in raw))return;const result=EntityIdSchema.safeParse(raw.requestId);return result.success?result.data:undefined}
 private failure(error:unknown,requestId?:string):Response{const e=error instanceof ServiceError?error:undefined;return this.json({...(requestId?{requestId}:{}),ok:false,error:{code:e?.code??'INTERNAL_ERROR',message:e?.message??'服务未能处理请求',...(e?.data?{data:e.data}:{})}},e?.status??500)}
 private async message(ws:ServerWebSocket<SocketState>,message:string|Buffer):Promise<void>{
  const state=ws.data
  let acquired=false,requestId:string|undefined
  try{
   if(state.busy){this.send(ws,{ok:false,error:{code:'REQUEST_BUSY',message:'请等待上次请求完成'}});return}
   if(this.now()-state.window>=60000){state.window=this.now();state.inbound=0}
   if(++state.inbound>600){ws.close(1008,'rate limit');return}
   const principal=this.options.auth.check(state.principal);state.busy=true;acquired=true
   const raw:unknown=JSON.parse(typeof message==='string'?message:new TextDecoder('utf-8',{fatal:true}).decode(message))
   requestId=this.requestId(raw)
   const result=await this.options.dispatcher.dispatch(principal,raw)
   if(result.request.method==='session.subscribe'){
    const subs=new Map<string,{epoch:string;seq:number}>()
    for(const id of result.request.params.ids){
     const cursor=result.request.params.cursors?.[id]
     const reset=!!cursor&&cursor.epoch!==this.options.dispatcher.repository.epoch
     const seq=reset?0:cursor?.seq??0
     if(seq>this.options.dispatcher.repository.head(id))fail(409,'CURSOR_AHEAD','订阅游标领先服务端')
     subs.set(id,{epoch:reset?cursor!.epoch:this.options.dispatcher.repository.epoch,seq})
    }
    state.subscriptions=subs
   }
   this.send(ws,{requestId:result.request.requestId,ok:true,data:result.data})
  }catch(error){const e=error instanceof ServiceError?error:undefined;this.send(ws,{...(requestId?{requestId}:{}),ok:false,error:{code:e?.code??'INVALID_REQUEST',message:e?.message??'请求格式无效',...(e?.data?{data:e.data}:{})}});if(e?.status===401)ws.close(1008,'revoked')}
  finally{if(acquired)state.busy=false}
 }
 private send(ws:ServerWebSocket<SocketState>,value:unknown):boolean{const text=JSON.stringify(value);if(Buffer.byteLength(text)>1024*1024){ws.close(1009,'payload limit');return false}const sent=ws.send(text);if(sent===-1)ws.data.blocked=true;if(sent===0){ws.close(1013,'backpressure');return false}return true}
 private flush():void{
  const now=this.now();for(const [key,value]of this.cookies)if(value.expiresAt<=now)this.cookies.delete(key);for(const [key,value]of this.tickets)if(value.expiresAt<=now)this.tickets.delete(key)
  for(const ws of this.sockets){try{
   const principal=this.options.auth.check(ws.data.principal)
   if(ws.data.blocked||ws.getBufferedAmount()>512*1024)continue
   let budget=400*1024
   const subscriptions=[...ws.data.subscriptions]
   const rotated=[...subscriptions.slice(ws.data.offset),...subscriptions.slice(0,ws.data.offset)]
   ws.data.offset=subscriptions.length?(ws.data.offset+1)%subscriptions.length:0
   for(const [id,cursor]of rotated){
    this.options.dispatcher.session(principal,id)
    const page=eventPage(this.options.dispatcher.repository,id,principal.kind,cursor.seq,cursor.epoch,100)
    if(!page.events.length&&!page.reset)continue
    const message={type:'session.events',...page},size=Buffer.byteLength(JSON.stringify(message));if(size>budget)break
    if(!this.send(ws,message))break
    cursor.seq=page.events.at(-1)?.seq??0;cursor.epoch=page.epoch;budget-=size;if(ws.data.blocked)break
   }
  }catch{ws.close(1008,'authorization changed')}}
 }
 private cleanupDevice(id:string):Promise<void>{const old=this.revocations.get(id);if(old)return old;const pending=Promise.all([this.options.dispatcher.runtime.revoke(id),this.options.dispatcher.capabilities.revoke(id)]).then(()=>{}).finally(()=>this.revocations.delete(id));this.revocations.set(id,pending);return pending}
 async revoke(deviceId:string):Promise<void>{this.options.auth.revoke(deviceId);await this.cleanupDevice(deviceId)}
 async close():Promise<void>{if(this.closing)return this.closing;this.closed=true;this.unsubscribe();clearInterval(this.timer);clearInterval(this.cleanup);for(const ws of this.sockets)ws.close(1001,'shutdown');this.closing=(async()=>{try{await this.options.dispatcher.close()}finally{await this.server.stop(true);this.cookies.clear();this.tickets.clear()}})();return this.closing}
}
