import {test,expect} from 'bun:test'
import {fixture,websocket} from '../packages/core-server/src/test-fixtures/fixture.ts'
import {ServiceEventSchema} from '../packages/protocol/src/index.ts'

test('Given Web与手机共用Core Service When HTTP发送→WS事件→HTTP补洞→转移lease Then 同一journal序号贯通',async()=>{
 const f=await fixture();try{
  const socket=await websocket(f)
  socket.ws.send(JSON.stringify({clientKind:'mobile',requestId:'subscribe',method:'session.subscribe',params:{ids:['s1']}}))
  await socket.wait(message=>message.requestId==='subscribe')
  expect((await f.rpc('session.send',{id:'s1',text:'跨端运行',clientMessageId:'integration'},f.b.token,'web')).status).toBe(200)
  await f.settled()
  const streamed=await socket.wait(message=>message.type==='session.events')
  const events=(streamed.events as unknown[]).map(e=>ServiceEventSchema.parse(e));expect(events.map(e=>e.seq)).toEqual([1,2,3])
  const rest=await f.rpc('session.events',{id:'s1',afterSeq:1,epoch:f.repository.epoch});expect((rest.data?.events as Array<{seq:number}>).map(e=>e.seq)).toEqual([2,3])
  const lease=(await f.rpc('lease.status',{id:'s1'})).data?.lease as {fence:number;mine:boolean}
  expect(lease.mine).toBe(false);expect((await f.rpc('lease.transfer',{id:'s1',expectedFence:lease.fence,confirm:'transfer-writer'})).status).toBe(200)
  expect((await f.rpc('session.send',{id:'s1',text:'手机接管',clientMessageId:'phone'})).status).toBe(200);await f.settled();expect(f.repository.head('s1')).toBe(6)
  socket.ws.close()
 }finally{await f.close()}
},10000)

test('Given 宿主显式open入口 When 创建HTTP服务并关闭 Then 独立journal可重开且不接触桌面数据',async()=>{
 const {mkdtempSync,rmSync,mkdirSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os')
 const {openCoreService}=await import('../packages/core-server/src/open.ts'),{SessionSchema}=await import('../packages/protocol/src/index.ts'),{ScriptedKernel}=await import('../packages/kernel-host/src/scripted-kernel.ts')
 const root=mkdtempSync(join(tmpdir(),'w8-open-'));mkdirSync(join(root,'project'))
 let devices:unknown=[]
 const input={directory:root,devices:{read:()=>devices,write:(value:unknown)=>{devices=value}},cwd:()=>join(root,'project'),kernel:async()=>new ScriptedKernel('scripted',input=>[{event:{t:'done',runId:input.runId,seq:1,reason:'stop'}}]),authorizeTool:async()=>true,sessions:[SessionSchema.parse({schemaVersion:2,id:'s1',workspaceId:'w1',kernelId:'scripted',title:'host',createdAt:1,updatedAt:1})]}
 try{
  const first=await openCoreService(input),epoch=first.repository.epoch
  expect((await fetch(`${first.server.url}/health`)).status).toBe(200)
  const device=first.auth.issue({name:'phone',kind:'mobile',workspaceIds:['w1'],control:true})
  const request={clientKind:'mobile',requestId:'persisted',method:'session.send',params:{id:'s1',text:'持久发送',clientMessageId:'saved'}}
  await first.dispatcher.dispatch(first.auth.authenticate(device.token),request)
  for(let i=0;i<50&&first.dispatcher.runtime.running.length;i++)await Bun.sleep(2)
  expect(first.repository.head('s1')).toBe(1)
  await Promise.all([first.close(),first.close()])
  const reopened=await openCoreService(input);expect(reopened.repository.epoch).toBe(epoch)
  await reopened.dispatcher.dispatch(reopened.auth.authenticate(device.token),request)
  expect(reopened.repository.head('s1')).toBe(1);await reopened.close()
 }finally{rmSync(root,{recursive:true,force:true})}
})
