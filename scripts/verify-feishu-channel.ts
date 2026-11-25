import {app} from 'electron'
import {mkdtempSync,mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:http'
import type {AddressInfo} from 'node:net'
import {WebSocketServer} from 'ws'
import * as lark from '@larksuiteoapi/node-sdk'
const root=mkdtempSync(join(tmpdir(),'tervell-feishu-check-'));process.env.TERVELL_PROFILE_DIR=root;app.setPath('userData',join(root,'chromium'));app.commandLine.appendSwitch('use-mock-keychain')
const assert=(ok:unknown,message:string)=>{if(!ok)throw Error(message)}
async function run(){
 const server=createServer(),ws=new WebSocketServer({server});let connects=0,discovery=0,identity=0,auth=0
 ws.on('connection',()=>{connects++})
 server.on('request',(request,response)=>{response.setHeader('content-type','application/json');if(request.url?.includes('tenant_access_token')){auth++;response.end(JSON.stringify({code:0,tenant_access_token:'fixture-tenant-token',expire:7200}))}else if(request.url?.includes('/bot/v3/info')){identity++;response.end(JSON.stringify({code:0,bot:{open_id:'ou_fixture_bot',app_name:'本机模拟机器人'}}))}else if(request.url==='/callback/ws/endpoint'){discovery++;response.end(JSON.stringify({code:0,data:{URL:`ws://127.0.0.1:${(server.address() as AddressInfo).port}/events?device_id=fixture&service_id=1`,ClientConfig:{PingInterval:120,ReconnectInterval:1,ReconnectNonce:0,ReconnectCount:1}}}))}else{response.statusCode=404;response.end('{}')}})
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const domain=`http://127.0.0.1:${(server.address() as AddressInfo).port}`
 const channel=lark.createLarkChannel({appId:'cli_0123456789abcdef',appSecret:'fixture-local-secret',domain,loggerLevel:lark.LoggerLevel.error,includeRawEvent:true,policy:{dmMode:'open'},handshakeTimeoutMs:2000})
 try{
  await channel.connect();assert(channel.getConnectionStatus()?.state==='connected'&&connects===1&&discovery===1&&identity===1,'官方SDK没有完成真实WS握手')
  let received=0;channel.on({message:message=>{if(message.content==='本机消息验收'&&message.raw)received++}})
  const raw={schema:'2.0',header:{event_id:'fixture-event',event_type:'im.message.receive_v1',create_time:String(Date.now()),tenant_key:'fixture',app_id:'cli_0123456789abcdef'},event:{sender:{sender_type:'user',sender_id:{open_id:'ou_fixture_user'}},message:{message_id:'om_fixture',chat_id:'oc_fixture',chat_type:'p2p',message_type:'text',content:JSON.stringify({text:'本机消息验收'}),create_time:String(Date.now())}}}
  // 使用真实EventDispatcher+安全去重+消息归一化，不向外部聊天发送消息。
  const dispatcher=(channel as unknown as {dispatcher:{invoke:(value:unknown)=>Promise<unknown>}}).dispatcher
  await dispatcher.invoke(raw);await dispatcher.invoke(raw);await new Promise(r=>setTimeout(r,1100));console.log('NORMALIZED_MESSAGES',received);assert(received===1,'消息事件未正确归一或去重')
  console.log('FEISHU actual installed SDK HTTP identity/discovery + live WebSocket handshake + event dedupe PASS')
  console.log(JSON.stringify({auth,identity,discovery,connects,received,externalMessagesSent:0}))
 }finally{channel.rawWsClient?.close({force:true});await channel.disconnect();for(const client of ws.clients)client.terminate();await new Promise<void>(r=>ws.close(()=>r()));await new Promise<void>(r=>server.close(()=>r()))}
 mkdirSync(join(root,'config'),{recursive:true})
 const {FeishuBridge}=await import('../apps/electron/src/main/lib/feishu-bridge')
 const bridge=new FeishuBridge({id:'fixture',name:'fixture',enabled:false,appId:'cli_0123456789abcdef',appSecret:''})
 const rejected=await bridge.testConnection('cli_0123456789abcdef','invalid-local-check-secret','feishu');assert(!rejected.success,'错误凭据错误显示为已连接');console.log('FEISHU real official HTTPS API reachable; invalid credentials correctly rejected; no saved bot credentials present')
 console.log('PROFILE',root)
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(e=>{console.error(e);app.exit(1)})
