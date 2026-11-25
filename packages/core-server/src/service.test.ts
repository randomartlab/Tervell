import {describe,test,expect} from 'bun:test'
import {fixture,websocket} from './test-fixtures/fixture.ts'
import {ScriptedKernel} from '@proma/kernel-host'

describe('API-01/02/03 HTTP认证与授权',()=>{
 test('Given 健康检查与未知方法 When HTTP请求 Then 只返回健康状态或明确403',async()=>{
  const f=await fixture();try{
   expect((await fetch(`${f.server.url}/health`)).status).toBe(200)
   for(const method of ['workspace.delete','__proto__','constructor'])expect((await f.rpc(method)).status).toBe(403)
   expect((await f.rpc('host.status',{},f.a.token,'desktop')).error?.code).toBe('CLIENT_MISMATCH')
   expect((await f.rpc('session.detail',{id:'s2'})).status).toBe(404)
   expect((await f.rpc('session.list')).data?.entries).toHaveLength(1)
   expect((await f.rpc('session.send',{id:'s1',text:'伪造',clientMessageId:'m1',permissionMode:'auto'})).status).toBe(400)
  }finally{await f.close()}
 })
 test('Given 设备过期/撤销/无控制 When 控制RPC Then 不执行任何内核',async()=>{
  const f=await fixture();try{
   const short=f.issue('mobile',true,['w1'],10);f.time(11)
   expect((await f.rpc('host.status',{},short.token)).status).toBe(401)
   expect((await f.rpc('session.send',{id:'s1',text:'no',clientMessageId:'v'},f.viewer.token)).status).toBe(403)
   await f.server.revoke(f.a.device.id);expect((await f.rpc('host.status')).status).toBe(401)
   expect(f.runs()).toBe(0);expect(JSON.stringify(f.records())).not.toContain(short.token)
  }finally{await f.close()}
 })
 test('Given 本地免登录 When 同源初始化 Then HttpOnly cookie可用而跨站和无Origin失败',async()=>{
  const f=await fixture({local:true});try{
   expect((await fetch(`${f.server.url}/local-session`,{method:'POST'})).status).toBe(403)
   expect((await fetch(`${f.server.url}/local-session`,{method:'POST',headers:{Origin:'https://evil.test'}})).status).toBe(403)
   const local=await fetch(`${f.server.url}/local-session`,{method:'POST',headers:{Origin:f.server.url}})
   expect(local.status).toBe(200);const cookie=local.headers.get('set-cookie')!;expect(cookie).toContain('HttpOnly');expect(cookie).toContain('SameSite=Strict')
   const call=(origin?:string)=>fetch(`${f.server.url}/rpc`,{method:'POST',headers:{Cookie:cookie.split(';')[0]!,...(origin?{Origin:origin}:{}),'Content-Type':'application/json'},body:JSON.stringify({clientKind:'web',requestId:'local1',method:'host.status',params:{}})})
   expect((await call()).status).toBe(403);expect((await call(f.server.url)).status).toBe(200)
  }finally{await f.close()}
 })
})
describe('API-04/05 持久消息与单写者',()=>{
 test('Given 重连重复消息 When HTTP发送 Then 去重且同ID换内容拒绝',async()=>{
  const f=await fixture();try{
   const params={id:'s1',text:'你好',clientMessageId:'m1'}
   expect((await f.rpc('session.send',params)).status).toBe(200);await f.settled()
   expect((await f.rpc('session.send',params)).status).toBe(200);expect(f.runs()).toBe(1)
   expect((await f.rpc('session.send',{...params,text:'改变'})).status).toBe(409)
   expect(f.repository.head('s1')).toBe(3)
   const timeline=await f.rpc('session.timeline',{id:'s1',direction:'tail',limit:40,wholeTurns:true});expect(timeline.status).toBe(200);expect(JSON.stringify(timeline)).not.toContain('sourceSeqRanges')
  }finally{await f.close()}
 })
 test('Given 两设备同时写入 When 显式转移 Then 旧fence拒绝且新设备获得控制',async()=>{
  const f=await fixture();try{
   const first=await f.rpc('lease.acquire',{id:'s1'}),lease=first.data?.lease as {fence:number}
   expect((await f.rpc('lease.acquire',{id:'s1'},f.b.token,'web')).error?.code).toBe('LEASE_CONFLICT')
   expect((await f.rpc('lease.transfer',{id:'s1',expectedFence:lease.fence,confirm:'transfer-writer'},f.b.token,'web')).status).toBe(200)
   expect((await f.rpc('lease.renew',{id:'s1',fence:lease.fence})).status).toBe(409)
   expect((await f.rpc('session.send',{id:'s1',text:'旧端',clientMessageId:'old'})).status).toBe(409)
   expect((await f.rpc('session.send',{id:'s1',text:'新端',clientMessageId:'new'},f.b.token,'web')).status).toBe(200);await f.settled();expect(f.runs()).toBe(1)
  }finally{await f.close()}
 })
 test('Given 运行中排队 When 前一轮完成 Then 顺序执行且重复排队不重复',async()=>{
  const f=await fixture();try{
   expect((await f.rpc('session.queue',{id:'s1',text:'排队',clientMessageId:'q1'})).status).toBe(200);await f.settled()
   expect((await f.rpc('session.queue',{id:'s1',text:'排队',clientMessageId:'q1'})).status).toBe(200);expect(f.runs()).toBe(1)
  }finally{await f.close()}
 })
})
describe('API-07 静态资源',()=>{
 test('Given 深链刷新与不存在资源 When 导航 Then SPA返回但API不落到HTML',async()=>{
  const f=await fixture();try{
   const deep=await fetch(`${f.server.url}/workspace/w1/sessions/s1`,{headers:{Accept:'text/html'}});expect(deep.status).toBe(200);expect(await deep.text()).toContain('app shell')
   expect((await fetch(`${f.server.url}/missing.js`,{headers:{Accept:'text/html'}})).status).toBe(404)
   expect((await fetch(`${f.server.url}/api/unknown`,{headers:{Accept:'text/html'}})).status).toBe(404)
   expect((await fetch(`${f.server.url}/app.js`)).headers.get('content-type')).toContain('javascript')
  }finally{await f.close()}
 })
})
describe('API-04 WebSocket补洞',()=>{
 test('Given 断线30秒 When 以最后seq重订阅 Then 无重复无缺失且移动端不泄漏raw工具输入',async()=>{
  const f=await fixture();try{
   const proof=f.repository.leases.claim('s1',f.a.device.id)
   f.repository.append(proof,[{ts:1,turnId:'t1',kernelEvent:{t:'tool.call',runId:'r1',seq:1,call:{id:'call1',kind:'read',name:'Read',input:{private:'不应发送到手机'},status:'pending'}}}])
   const first=await websocket(f);first.ws.send(JSON.stringify({clientKind:'mobile',requestId:'sub1',method:'session.subscribe',params:{ids:['s1']}}))
   const page=await first.wait(m=>m.type==='session.events');expect(JSON.stringify(page)).not.toContain('不应发送到手机');first.ws.close();f.time(30000)
   const nextProof=f.repository.leases.claim('s1',f.a.device.id)
   f.repository.append(nextProof,Array.from({length:250},(_,index)=>({ts:2,turnId:'t1',kernelEvent:{t:'message.delta' as const,runId:'r1',seq:index+2,index:0,kind:'text' as const,text:'片段'}})))
   const second=await websocket(f);second.ws.send(JSON.stringify({clientKind:'mobile',requestId:'sub2',method:'session.subscribe',params:{ids:['s1'],cursors:{s1:{epoch:f.repository.epoch,seq:1}}}}))
   const received:number[]=[]
   for(let i=0;i<100&&received.length<250;i++){for(const m of second.messages.splice(0))if(m.type==='session.events')for(const e of m.events as Array<{seq:number}>)received.push(e.seq);if(received.length<250)await Bun.sleep(10)}
   expect(received).toEqual(Array.from({length:250},(_,i)=>i+2));expect(new Set(received).size).toBe(250)
   await f.server.revoke(f.a.device.id);await Bun.sleep(20);expect(second.ws.readyState).toBe(WebSocket.CLOSED)
  }finally{await f.close()}
 },10000)
 test('Given 一次性WS票据 When 第二次使用 Then 不能重放登录',async()=>{
  const f=await fixture();try{
   const connection=await websocket(f);connection.ws.close()
   const response=await fetch(`${f.server.url}/events?ticket=${connection.ticket}`);expect(response.status).toBe(401)
  }finally{await f.close()}
 })
})
