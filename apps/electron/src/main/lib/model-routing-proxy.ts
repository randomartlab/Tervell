import {createServer,request as httpRequest} from 'node:http'
import type {Server,IncomingMessage} from 'node:http'
import {createConnection} from 'node:net'
import type {Socket} from 'node:net'
import type {GatewayReasoningSelection} from '@proma/shared'
import type {ProviderRequest} from '@proma/core'

/** 在会话边界落实用户的推理选择，避免不同 CLI 的开关/默认值截断模型档位。 */
export function applyGatewayEffort(path:string,input:Record<string,unknown>,effort:string):Record<string,unknown> {
 const next={...input}
 if(/(?:^|\/)messages$/.test(path)){
  next.thinking=effort==='none'||effort==='off'?{type:'disabled'}:{type:'adaptive'}
  next.output_config={...(typeof input.output_config==='object'&&input.output_config!==null?input.output_config:{}),effort:effort==='off'?'none':effort}
 }else if(/(?:^|\/)responses(?:\/compact)?$/.test(path)){
  next.reasoning={...(typeof input.reasoning==='object'&&input.reasoning!==null?input.reasoning:{}),effort:effort==='off'?'none':effort}
 }else if(/\/chat\/completions$/.test(path))next.reasoning_effort=effort==='off'?'none':effort
 else if(/:(?:streamGenerateContent|generateContent)$/.test(path)){
  const config=typeof input.generationConfig==='object'&&input.generationConfig!==null?input.generationConfig:{}
  next.generationConfig={...config,thinkingConfig:effort==='none'||effort==='off'?{thinkingBudget:0}:{thinkingLevel:effort}}
 }
 return next
}
/** 模型声明的原始档位由受管网关核对后保留，避免通用档位归一化截断。 */
export function gatewayReasoningRequest(request:ProviderRequest,effort:string):ProviderRequest {
 return {...request,headers:{...request.headers,'x-tervell-exact-effort':'1'},body:JSON.stringify(applyGatewayEffort(new URL(request.url).pathname,JSON.parse(request.body) as Record<string,unknown>,effort))}
}
interface Entry {server:Server;url:string;target:string;selection?:GatewayReasoningSelection;sockets:Set<Socket>}
const proxies=new Map<string,Entry>()
const allowed=(path:string)=>/^\/(?:v1(?:beta|alpha)?\/)?(?:models(?:\/[^?#]*)?|responses(?:\/compact)?|messages(?:\/count_tokens)?|chat\/completions|complete)(?:\?|$)/.test(path)||/^\/v1(?:beta|alpha)?\/models\/[^?#]+:(?:streamGenerateContent|generateContent)(?:\?|$)/.test(path)
async function bytes(req:IncomingMessage):Promise<Buffer>{const parts:Buffer[]=[];let size=0;for await(const value of req){const part=Buffer.isBuffer(value)?value:Buffer.from(value);size+=part.length;if(size>32*1024*1024)throw new Error('模型请求超过大小限制');parts.push(part)}return Buffer.concat(parts)}
export async function sessionGateway(scope:string,target:string,selection?:GatewayReasoningSelection):Promise<string>{
 const existing=proxies.get(scope);if(existing){existing.target=target;existing.selection=selection;return existing.url}
 const destination=new URL(target);if(destination.protocol!=='http:'||destination.hostname!=='127.0.0.1')throw new Error('模型网关必须位于本机')
 if(proxies.size>=512)throw new Error('本机会话网关达到上限，请重启应用释放闲置连接')
 const entry:Entry={server:createServer(),url:'',target,selection,sockets:new Set()}
 entry.server.on('request',async(req,res)=>{
  let requestUrl:URL;try{requestUrl=new URL(req.url??'/',entry.target)}catch{res.writeHead(400);res.end('模型请求地址无效');return}
  if(requestUrl.origin!==new URL(entry.target).origin||!(allowed(requestUrl.pathname+requestUrl.search)||requestUrl.pathname==='/'&&req.method==='GET')||!['GET','POST','HEAD'].includes(req.method??'')){res.writeHead(403);res.end('仅允许模型协议请求');return}
  try{
   let body=await bytes(req);const selected=entry.selection
   if(selected?.effort&&req.method==='POST'&&body.length){const parsed:unknown=JSON.parse(body.toString('utf8'));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('模型请求格式不正确');body=Buffer.from(JSON.stringify(applyGatewayEffort(requestUrl.pathname,parsed as Record<string,unknown>,selected.effort)))}
   const headers:Record<string,string|string[]|undefined>={...req.headers,host:new URL(entry.target).host,'content-length':String(body.length)};delete headers['transfer-encoding'];delete headers.cookie
   delete headers['x-tervell-exact-effort'];delete headers['x-tervell-exact-model']
   if(selected?.effort)headers['x-tervell-exact-effort']='1'
   const upstream=httpRequest(requestUrl,{method:req.method,headers},reply=>{res.writeHead(reply.statusCode??502,reply.headers);reply.pipe(res);reply.on('error',()=>res.destroy())})
   upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('本地模型网关暂不可用')});res.on('close',()=>upstream.destroy());upstream.end(body)
  }catch{if(!res.headersSent)res.writeHead(400);res.end('无法准备模型请求')}
 })

 entry.server.on('upgrade',(req,socket,head)=>{
  let url:URL;try{url=new URL(req.url??'/',entry.target)}catch{socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');return}
  if(url.origin!==new URL(entry.target).origin||!/^\/(?:v1\/)?responses(?:\?|$)/.test(url.pathname+url.search)){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return}
  const target=new URL(entry.target),upstream=createConnection({host:target.hostname,port:Number(target.port)})
  entry.sockets.add(upstream)
  upstream.once('connect',()=>{
   upstream.write(`${req.method??'GET'} ${url.pathname+url.search} HTTP/1.1\r\n`)
   for(const [key,value]of Object.entries(req.headers)){if(value===undefined||key==='cookie'||key==='sec-websocket-extensions'||key==='x-tervell-exact-effort'||key==='x-tervell-exact-model')continue;const text=key==='host'?target.host:Array.isArray(value)?value.join(', '):value;upstream.write(`${key}: ${text}\r\n`)}
   if(entry.selection?.effort)upstream.write(`x-tervell-exact-effort: 1\r\n`)
   upstream.write('\r\n');if(head.length)upstream.write(head)
   upstream.pipe(socket)
  })
  let buffered=Buffer.alloc(0)
  socket.on('data',(chunk:Buffer)=>{
   buffered=Buffer.concat([buffered,chunk]);if(buffered.length>32*1024*1024){socket.destroy();return}
   while(buffered.length>=2){
    const opcode=buffered[0]!&15,masked=!!(buffered[1]!&128);let size=buffered[1]!&127,at=2
    if(size===126){if(buffered.length<4)return;size=buffered.readUInt16BE(2);at=4}else if(size===127){if(buffered.length<10)return;const large=buffered.readBigUInt64BE(2);if(large>32n*1024n*1024n){socket.destroy();return}size=Number(large);at=10}
    const header=at+(masked?4:0);if(buffered.length<header+size)return
    const frame=buffered.subarray(0,header+size);buffered=buffered.subarray(header+size)
    if(opcode!==1||!(frame[0]!&128)||!entry.selection?.effort){upstream.write(frame);continue}
    try{
     const payload=Buffer.from(frame.subarray(header));if(masked)for(let i=0;i<payload.length;i++)payload[i]=payload[i]!^frame[at+(i%4)]!
     const value=JSON.parse(payload.toString('utf8')) as Record<string,unknown>
     if(value.type!=='response.create'){upstream.write(frame);continue}
     const next=Buffer.from(JSON.stringify(applyGatewayEffort('/v1/responses',value,entry.selection.effort)))
     const offset=next.length<126?2:next.length<=65535?4:10,prefix=Buffer.alloc(offset+(masked?4:0));prefix[0]=frame[0]!;prefix[1]=(masked?128:0)|(next.length<126?next.length:next.length<=65535?126:127)
     if(offset===4)prefix.writeUInt16BE(next.length,2);else if(offset===10)prefix.writeBigUInt64BE(BigInt(next.length),2)
     if(masked){frame.copy(prefix,offset,at,at+4);for(let i=0;i<next.length;i++)next[i]=next[i]!^prefix[offset+(i%4)]!}
     upstream.write(Buffer.concat([prefix,next]))
    }catch{upstream.write(frame)}
   }
  })
  const close=()=>{entry.sockets.delete(upstream);upstream.destroy();socket.destroy()};socket.once('close',close);socket.once('error',close);upstream.once('error',close);upstream.once('close',close)
 })
 await new Promise<void>((resolve,reject)=>{entry.server.once('error',reject);entry.server.listen(0,'127.0.0.1',()=>resolve())})
 const addr=entry.server.address();if(!addr||typeof addr==='string')throw new Error('无法创建会话模型网关');entry.url=`http://127.0.0.1:${addr.port}`;entry.server.unref();proxies.set(scope,entry);return entry.url
}
export function closeSessionGateway(scope:string):void{const proxy=proxies.get(scope);if(!proxy)return;for(const socket of proxy.sockets)socket.destroy();proxy.server.closeAllConnections();proxy.server.close();proxies.delete(scope)}
export function closeSessionGateways():void{for(const p of proxies.values()){for(const socket of p.sockets)socket.destroy();p.server.closeAllConnections();p.server.close()}proxies.clear()}
