import { readFileSync } from 'node:fs'
import { hostedProof } from '../packages/core/src/remote/hosted'
import type { HostedIdentity, HostedLease, DeviceStart } from '../packages/core/src/remote/hosted'
import { sign, randomUUID, randomBytes, createHash } from 'node:crypto'
import WebSocket from 'ws'
import { RemoteHost, createHostedDevice } from '../packages/core/src/remote/host'
import type { RemoteState } from '../packages/core/src/remote/host'
import { sealRemote, openRemote } from '../packages/core/src/remote/crypto'

const root=readFileSync('/tmp/tervell-hosted-ui-root','utf8').trim(),identity=JSON.parse(readFileSync(root+'/identity.json','utf8')) as HostedIdentity,registration=JSON.parse(readFileSync(root+'/registration.json','utf8')) as DeviceStart
const assert=(ok:unknown,message:string)=>{if(!ok)throw Error(message)}
const result:DeviceStart={state:'approved',lease:await hostedProof<HostedLease>('https://randomai.art/connect/',identity,'lease',{hostId:identity.hostId})}
assert(result.state==='approved'&&result.lease,'请先在真实集市页面确认验收电脑')
const state:RemoteState={hostId:identity.hostId,devices:[],sent:[]},device=createHostedDevice(state,['project'])
let writes=0,socket!:WebSocket
const routes=()=>socket.send(JSON.stringify({type:'routes',routes:device.revoked?{}:{[device.pairing.deviceId]:{tokenHash:createHash('sha256').update(device.pairing.token).digest('hex'),...(device.bootstrap?{bootstrapHash:createHash('sha256').update(device.bootstrap.token).digest('hex')}:{}),expiresAt:device.pairing.expiresAt}}}))
const host=new RemoteHost(state,{sessions:()=>[{id:'fixture',title:'公网隔离测试',workspaceId:'project',updatedAt:1}],workspaces:()=>[{id:'project',name:'Fixture'}],create:async()=>{throw Error('unused')},messages:()=>[],send:()=>{writes++},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false},()=>{if(socket?.readyState===WebSocket.OPEN)routes()},()=>['project'])
const connect=async(lease:HostedLease)=>{socket=new WebSocket('wss://randomai.art/connect/host/ws');await new Promise<void>((ok,bad)=>{const timer=setTimeout(()=>bad(Error('公网WS超时')),12000);socket.on('message',raw=>{const message=JSON.parse(raw.toString());if(message.type==='hello'){const text=`tervell-connect-ws-v1\n${identity.hostId}\n${message.nonce}\n${lease.accessToken}`;socket.send(JSON.stringify({type:'auth',token:lease.accessToken,signature:sign(null,Buffer.from(text),identity.privateKey).toString('base64url')}))}else if(message.type==='ready'){routes();clearTimeout(timer);ok()}else if(message.type==='request')void host.receive(device,message.packet).then(packet=>{routes();socket.send(JSON.stringify({type:'response',id:message.id,packet}))})});socket.once('error',bad);socket.once('close',()=>{clearTimeout(timer);bad(Error('公网WS关闭'))})});await Bun.sleep(100)}
await connect(result.lease!)
try{
 let seq=0
 const exchange=async(auth:typeof device.pairing,method:string,values:object,id=randomUUID())=>{const packet=sealRemote(auth,'to-host',++seq,{id,sentAt:Date.now(),method,...values});const response=await fetch('https://randomai.art/connect/exchange',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+auth.token},body:JSON.stringify({hostId:auth.hostId,deviceId:auth.deviceId,packet})});const data=await response.json() as{packet:unknown};return{status:response.status,packet:data.packet}}
 const bootstrap=structuredClone(device.pairing),mobile={...bootstrap,key:randomBytes(32).toString('hex'),token:randomBytes(32).toString('hex')}
 const paired=await exchange(bootstrap,'pair',{deviceKey:mobile.key,deviceToken:mobile.token});assert((openRemote(mobile,'to-device',0,paired.packet).value as{ok:boolean}).ok,'公网配对失败')
 const id=randomUUID(),values={sessionId:'fixture',text:'仅隔离测试',clientMessageId:randomUUID()}
 assert((await exchange(mobile,'send',values,id)).status===200,'公网发送失败');await exchange(mobile,'send',values,id);assert(writes===1,'公网重复执行')
 const next=await hostedProof<HostedLease>('https://randomai.art/connect/',identity,'lease',{hostId:identity.hostId});socket.send(JSON.stringify({type:'renew',token:next.accessToken}));await Bun.sleep(100);assert((await exchange(mobile,'status',{})).status===200,'续签断开连接')
 socket.close();await Bun.sleep(100);await connect(await hostedProof<HostedLease>('https://randomai.art/connect/',identity,'lease',{hostId:identity.hostId}));await exchange(mobile,'send',values,id);assert(writes===1,'断线恢复重复执行')
 device.revoked=true;routes();await Bun.sleep(100);assert((await exchange(mobile,'status',{})).status===403,'撤销手机仍可访问')
 console.log('LIVE Random market account approval + TLS443 WS + encrypted pair + dedupe + renewal + reconnect + revoke PASS')
 console.log(JSON.stringify({service:'random-market',writes,modelCalls:0,userSessionAccess:false,phoneRevoked:true,hostId:identity.hostId}))
}finally{socket.terminate()}
