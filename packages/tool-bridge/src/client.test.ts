import {test,expect} from 'bun:test'
import {createServer} from 'node:http'
import type {Server as HttpServer,IncomingMessage,ServerResponse} from 'node:http'
import {fileURLToPath} from 'node:url'
import {randomUUID,createHash} from 'node:crypto'
import {Server} from '@modelcontextprotocol/sdk/server/index.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {SSEServerTransport} from '@modelcontextprotocol/sdk/server/sse.js'
import {ListToolsRequestSchema,CallToolRequestSchema} from '@modelcontextprotocol/sdk/types.js'
import {ManagedMcpClient} from './client.ts'
import {McpOAuthProvider} from './oauth.ts'
function mcp(){const s=new Server({name:'loopback',version:'1.0.0'},{capabilities:{tools:{}}});s.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[{name:'echo',inputSchema:{type:'object'}}]}));s.setRequestHandler(CallToolRequestSchema,async(r)=>({content:[{type:'text',text:JSON.stringify(r.params.arguments)}]}));return s}
async function listen(handler:(req:IncomingMessage,res:ServerResponse)=>void){const server=createServer(handler);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw new Error();return {server,url:`http://127.0.0.1:${address.port}`}}
const execution=()=>({context:{sessionId:'s1',workspaceId:'w1',permission:{mode:'auto' as const,plan:false},triggeredBy:'user' as const},signal:new AbortController().signal,authorize:async()=>true})
const close=async(server:HttpServer)=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()))}
for(const transport of ['stdio','http','sse'] as const)test(`Given ${transport} MCP When 真实回环握手/listTools/callTool Then ready后才可执行`,async()=>{
 let service:Awaited<ReturnType<typeof listen>>|undefined,server:Server|undefined,http:StreamableHTTPServerTransport|undefined,sse:SSEServerTransport|undefined
 if(transport!=='stdio'){
  server=mcp()
  service=await listen((req,res)=>{void(async()=>{
   if(transport==='http'){if(!http){http=new StreamableHTTPServerTransport({sessionIdGenerator:()=>randomUUID()});await server!.connect(http)}await http.handleRequest(req,res)}
   else if(req.method==='GET'){sse=new SSEServerTransport('/messages',res);await server!.connect(sse)}
   else if(sse)await sse.handlePostMessage(req,res);else{res.writeHead(400);res.end()}
  })().catch(()=>{res.writeHead(500);res.end()})})
 }
 const config=transport==='stdio'?{id:'stdio',transport,command:process.execPath,args:[fileURLToPath(new URL('./test-fixtures/mcp-server.ts',import.meta.url))]}:{id:transport,transport,url:`${service!.url}/${transport==='http'?'mcp':'sse'}`}
 const client=new ManagedMcpClient({config,secrets:{get:async()=>undefined},timeoutMs:2000})
 try{
  expect(()=>client.tools()).toThrow('握手');await client.connect();expect(client.status).toBe('ready');expect(client.tools()).toHaveLength(1);expect(client.tools()[0]?.name).toBe(`mcp__${transport}__echo`)
  const result=await client.call(`mcp__${transport}__echo`,{hello:'你好'},execution());expect(JSON.stringify(result)).toContain('你好')
  await expect(client.call(`mcp__${transport}__echo`,{}, {...execution(),authorize:async()=>false})).rejects.toThrow('拒绝')
  await expect(client.call(`mcp__${transport}__unknown`,{},execution())).rejects.toThrow('未协商')
 }finally{await client.close();await server?.close();await http?.close();await sse?.close();if(service)await close(service.server)}
},10000)
test('Given OAuth保护MCP When PKCE/state回调和token交换 Then 不泄漏凭据且拒绝重放',async()=>{
 let origin='',authorization:URL|undefined,challenge='',verifierSeen=false
 let http:StreamableHTTPServerTransport|undefined;const server=mcp();const secrets=new Map<string,string>()
 const service=await listen((req,res)=>{void(async()=>{
  const path=new URL(req.url??'/',origin)
  const json=(body:unknown,status=200)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body))}
  if(path.pathname.startsWith('/.well-known/oauth-protected-resource')){json({resource:`${origin}/mcp`,authorization_servers:[origin]});return}
  if(path.pathname.startsWith('/.well-known/oauth-authorization-server')){json({issuer:origin,authorization_endpoint:`${origin}/authorize`,token_endpoint:`${origin}/token`,response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['none']});return}
  if(path.pathname==='/token'){
   let text='';for await(const chunk of req)text+=String(chunk)
   const params=new URLSearchParams(text);verifierSeen=createHash('sha256').update(params.get('code_verifier')??'').digest('base64url')===challenge
   if(!verifierSeen||params.get('code')!=='valid-code'){json({error:'invalid_grant'},400);return}
   json({access_token:'loopback-access-token',token_type:'Bearer',expires_in:3600,refresh_token:'loopback-refresh-token'});return
  }
  if(req.headers.authorization!=='Bearer loopback-access-token'){res.writeHead(401,{'www-authenticate':`Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`});res.end();return}
  if(!http){http=new StreamableHTTPServerTransport({sessionIdGenerator:()=>randomUUID()});await server.connect(http)}
  await http.handleRequest(req,res)
 })().catch(()=>{res.writeHead(500);res.end()})})
 origin=service.url
 const provider=new McpOAuthProvider('http://127.0.0.1:54321/callback','oauth', {get:async r=>secrets.get(r),set:async(r,v)=>{secrets.set(r,v)},delete:async r=>{secrets.delete(r)}},async url=>{authorization=url;challenge=url.searchParams.get('code_challenge')??''},[origin],'proma-test')
 const client=new ManagedMcpClient({config:{id:'oauth',transport:'http',url:`${origin}/mcp`},secrets:{get:async()=>undefined},oauth:provider,authOrigins:[origin],timeoutMs:2500})
 try{
  await client.connect();expect(client.status).toBe('auth-required');expect(authorization?.searchParams.get('code_challenge_method')).toBe('S256')
  expect(()=>provider.consumeCallback(`http://127.0.0.1:54321/callback?code=bad&state=${'A'.repeat(authorization!.searchParams.get('state')!.length)}`)).toThrow('state')
  expect(()=>provider.consumeCallback(`http://127.0.0.1:54322/callback?code=valid-code&state=${authorization!.searchParams.get('state')}`)).toThrow('来源')
  const callback=`http://127.0.0.1:54321/callback?code=valid-code&state=${authorization!.searchParams.get('state')}`
  await client.finishAuth(callback);expect(verifierSeen).toBe(true);expect(client.status).toBe('ready');expect([...secrets.keys()].some(key=>key.startsWith('mcp:oauth:')&&key.endsWith(':tokens'))).toBe(true)
  expect(()=>provider.consumeCallback(callback)).toThrow();expect(()=>provider.codeVerifier()).toThrow()
 }finally{await client.close();await server.close();await http?.close();await close(service.server)}
},10000)

test('Given 握手错误和不存在凭据 When 建连 Then 不进入ready且不泄漏错误正文',async()=>{
 const service=await listen((_req,res)=>{res.writeHead(500);res.end('sensitive-upstream-error')})
 const client=new ManagedMcpClient({config:{id:'bad',transport:'http',url:`${service.url}/mcp`},secrets:{get:async()=>undefined},timeoutMs:1000})
 try{await expect(client.connect()).rejects.toThrow('握手');expect(client.status).toBe('closed');expect(()=>client.tools()).toThrow()}
 finally{await client.close();await close(service.server)}
 const missing=new ManagedMcpClient({config:{id:'missing',transport:'http',url:'https://example.test/mcp',apiKeyRef:'absent'},secrets:{get:async()=>undefined}})
 await expect(missing.connect()).rejects.toThrow('引用');expect(missing.status).toBe('closed')
})

test('Given 恶意stdio连续超大帧 When 建连 Then 有界传输拒绝并回收',async()=>{
 const client=new ManagedMcpClient({config:{id:'oversize',transport:'stdio',command:process.execPath,args:[fileURLToPath(new URL('./test-fixtures/mcp-server.ts',import.meta.url)),'oversized']},secrets:{get:async()=>undefined},timeoutMs:1000})
 try{await expect(client.connect()).rejects.toThrow('握手');expect(client.status).toBe('closed')}finally{await client.close()}
},5000)

test('Given 同名连接但授权来源改变 When 读取token Then 不跨来源复用凭据',async()=>{
 const values=new Map<string,string>(),vault={get:async(r:string)=>values.get(r),set:async(r:string,v:string)=>{values.set(r,v)},delete:async(r:string)=>{values.delete(r)}}
 const a=new McpOAuthProvider('http://127.0.0.1:54321/callback','same',vault,async()=>{},['https://a.example'],'client')
 const b=new McpOAuthProvider('http://127.0.0.1:54321/callback','same',vault,async()=>{},['https://b.example'],'client')
 await a.saveTokens({access_token:'scoped-secret',token_type:'Bearer'});expect(await b.tokens()).toBeUndefined()
})
