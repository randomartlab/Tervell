import {test,expect} from 'bun:test';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:https';
import {randomUUID} from 'node:crypto';
import {nativeDirectCertificate} from '../apps/electron/src/main/lib/native-direct-service';
import {DirectAddressSchema,directForwardAdd,directForwardRemove,directForwardPacket} from '../apps/electron/src/main/lib/native-direct-forwarding';
import {RemoteHost,createTunnelDevice} from '@proma/core/remote/host';
import type {RemoteState} from '@proma/core/remote/host';
import {sealRemote,openRemote} from '@proma/core/remote/crypto';
import {DirectRemoteServer} from '@proma/core/remote/direct-server';

test('Given 两段已配对加密路径 When 中继请求、重试、错证书和撤权 Then 只接受登记身份且操作不重复',async()=>{
 const previous=process.env.TERVELL_PROFILE_DIR,root=mkdtempSync(join(tmpdir(),'tervell-direct-test-'));process.env.TERVELL_PROFILE_DIR=root;mkdirSync(join(root,'config'));
 const identity=await nativeDirectCertificate();let writes=0;
 const state:RemoteState={hostId:'target-fixture',devices:[],sent:[]},device=createTunnelDevice(state,{server:'example.invalid',port:443,path:'/abcdefghijklmnop',clientId:randomUUID(),targetHost:'127.0.0.1',targetPort:3000},['project']);device.paired=true;
 const host=new RemoteHost(state,{sessions:()=>[{id:'session',title:'fixture',workspaceId:'project',updatedAt:1}],workspaces:()=>[{id:'project',name:'fixture'}],create:async()=>({id:'session',title:'fixture',workspaceId:'project',updatedAt:1}),messages:()=>[],send:()=>{writes++},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false},()=>{},()=>['project']);
 const target=new DirectRemoteServer(host,state,()=>true,{host:'127.0.0.1',tls:identity});await target.listen();
 try{
  const targets=directForwardAdd({label:'target',hostId:state.hostId,url:`https://127.0.0.1:${target.port}`,certificateSha256:identity.fingerprint}),id=targets[0]!.id;
  const packet=sealRemote(device.pairing,'to-host',1,{id:randomUUID(),sentAt:Date.now(),method:'send',sessionId:'session',text:'fixture only',clientMessageId:randomUUID()});
  const call={targetId:id,room:device.pairing.room,token:device.pairing.token,packet};
  const first=await directForwardPacket(call) as {packet:unknown};expect((openRemote(device.pairing,'to-device',0,first.packet).value as {ok:boolean}).ok).toBe(true);expect(writes).toBe(1);
  await directForwardPacket(call);expect(writes).toBe(1);
  expect(await directForwardPacket({...call,packet:{...packet,hostId:'different'}}).then(()=>false,()=>true)).toBe(true);
  directForwardRemove(id);const wrong=directForwardAdd({label:'wrong-pin',hostId:state.hostId,url:`https://127.0.0.1:${target.port}`,certificateSha256:'0'.repeat(64)})[0]!;
  expect(await directForwardPacket({...call,targetId:wrong.id}).then(()=>false,()=>true)).toBe(true);expect(writes).toBe(1);
  directForwardRemove(wrong.id);const valid=directForwardAdd({label:'valid',hostId:state.hostId,url:`https://127.0.0.1:${target.port}`,certificateSha256:identity.fingerprint})[0]!;device.revoked=true;
  expect(await directForwardPacket({...call,targetId:valid.id}).then(()=>false,()=>true)).toBe(true);expect(writes).toBe(1);
 }finally{await target.close();if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true});}
},20000);

test('Given 中继证书身份不匹配 When TLS建立 Then 不向错误服务器发送授权和正文',async()=>{
 const previous=process.env.TERVELL_PROFILE_DIR,root=mkdtempSync(join(tmpdir(),'tervell-direct-pin-'));process.env.TERVELL_PROFILE_DIR=root;mkdirSync(join(root,'config'));const identity=await nativeDirectCertificate();let requests=0;
 const server=createServer(identity,(_req,res)=>{requests++;res.end('{}')});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{const target=directForwardAdd({label:'wrong',hostId:'target',url:`https://127.0.0.1:${(server.address() as {port:number}).port}`,certificateSha256:'f'.repeat(64)})[0]!;
  expect(await directForwardPacket({targetId:target.id,room:'1'.repeat(64),token:'2'.repeat(64),packet:{v:1,hostId:'target',deviceId:'device',direction:'to-host',seq:1,nonce:'0'.repeat(24),ciphertext:'0'.repeat(32)}}).then(()=>false,()=>true)).toBe(true);expect(requests).toBe(0);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true});}
},20000);

test('Given TLS 标准端口与自定义地址 When URL标准化 Then 443默认端口和IPv6可保存但路径凭据不可接受',()=>{
 expect(DirectAddressSchema.parse('https://example.invalid:443')).toBe('https://example.invalid');expect(DirectAddressSchema.parse('https://[::1]:444')).toBe('https://[::1]:444');expect(()=>DirectAddressSchema.parse('https://user:secret@example.invalid:443')).toThrow();expect(()=>DirectAddressSchema.parse('https://example.invalid/path')).toThrow();
});
