import {test,expect} from 'bun:test'
import {gatewayProviders,gatewayGroups,gatewayUsage,gatewayPrivacy,gatewayRoutingModels} from '../apps/electron/src/main/lib/model-gateway-adapter'
import {GatewayCommandSchema,activeGatewayModel} from '../apps/electron/src/main/lib/model-gateway-management'
import {applyGatewayEffort,gatewayReasoningRequest,sessionGateway,closeSessionGateways} from '../apps/electron/src/main/lib/model-routing-proxy'

test('Given 完整模型档位与密钥配置 When 转换管理快照 Then 不裁剪未知档位且不回传原密钥',()=>{
 const levels=['none','minimal','low','medium','high','xhigh','max','ultra','vendor-future']
 const [provider]=gatewayProviders({providers:[{id:'a',name:'A',chat:'http://127.0.0.1:1/v1',key:{set:true,masked:'masked',value:'do-not-return'},rawKey:'do-not-return',models:[{id:'model',name:'Model',on:true,efforts:levels,images:true}],keyList:[{id:'key1',masked:'masked',on:true,key:'do-not-return'}]}]})
 expect(provider?.models[0]?.efforts).toEqual(levels);expect(provider?.models[0]?.images).toBe(true);expect(JSON.stringify(provider)).not.toContain('do-not-return')
 expect(gatewayGroups({groups:[{id:'g',ref:'group/g',name:'G',members:['a/model'],offers:levels,ready:true}]} )[0]?.efforts).toEqual(levels)
 expect(gatewayUsage({calls:3,input:100,output:10,reasoning:5,cost:.01,models:[]}).calls).toBe(3)
 expect(gatewayPrivacy({noAccountDiscovery:true,noAccountsEnv:true}).forcedOff).toBe(true)
})
test('Given 类型化管理动作 When IPC校验 Then 拒绝任意URL与未知秘密读取操作',()=>{
 expect(()=>GatewayCommandSchema.parse({kind:'fetch',url:'file:///etc/passwd'})).toThrow()
 expect(()=>GatewayCommandSchema.parse({kind:'provider.save',provider:{id:'a',name:'A',chat:'file:///secret',responses:'',anthropic:'',gemini:'',models:[],routing:'order',fallback:[]}})).toThrow()
 expect(()=>GatewayCommandSchema.parse({kind:'provider.save',provider:{id:'a',name:'A',chat:'http://127.0.0.1:3000/v1',responses:'',anthropic:'',gemini:'',models:[],routing:'order',fallback:[],advanced:{command:'do-not-run'}}})).toThrow()
 expect(activeGatewayModel({version:1,enabled:true,defaultModel:'a/m',rules:[{kernelId:'codex',mode:'native'}]},'codex')).toBeUndefined()
 expect(activeGatewayModel({version:1,enabled:false,defaultModel:'',rules:[{kernelId:'pi',mode:'override',model:'a/m'}]},'pi')).toBe('a/m')
 expect(activeGatewayModel({version:1,enabled:false,defaultModel:'a/m',rules:[]},'pi')).toBeUndefined()
})
test('Given 各协议的CLI推理默认值 When 应用用户选中的档位 Then 覆盖实际字段并保留其余请求',()=>{
 const original={model:'a/m',thinking:{type:'disabled'},output_config:{format:'json'},reasoning:{summary:'auto'},messages:[{role:'user',content:'test'}]}
 expect(applyGatewayEffort('/v1/messages',original,'max')).toMatchObject({thinking:{type:'adaptive'},output_config:{format:'json',effort:'max'}})
 expect(applyGatewayEffort('/v1/responses',original,'ultra')).toMatchObject({reasoning:{summary:'auto',effort:'ultra'}})
 expect(applyGatewayEffort('/v1/chat/completions',original,'minimal').reasoning_effort).toBe('minimal')
 expect(applyGatewayEffort('/v1/messages',original,'none').thinking).toEqual({type:'disabled'})
 expect(applyGatewayEffort('/v1beta/models/m:generateContent',original,'high').generationConfig).toEqual({thinkingConfig:{thinkingLevel:'high'}})
 expect(original.thinking).toEqual({type:'disabled'});expect(applyGatewayEffort('/v1/models',original,'high')).toEqual(original)
})
test('Given 两个并行会话 When 通过本机会话网关发送 Then 档位隔离/SSE完整且管理接口不可达',async()=>{
 const received:Array<Record<string,unknown>>=[],markers:Array<string|null>=[]
 const upstream=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(req){markers.push(req.headers.get('x-tervell-exact-effort'));received.push(await req.json() as Record<string,unknown>);return new Response('data: {"delta":"ok"}\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}})}})
 try{
  const target=`http://127.0.0.1:${upstream.port}`,[a,b]=await Promise.all([sessionGateway('a',target,{model:'p/m',effort:'max'}),sessionGateway('b',target,{model:'p/m',effort:'low'})])
  for(const url of [a,b]){const response=await fetch(url+'/v1/chat/completions',{method:'POST',body:JSON.stringify({model:'p/m',messages:[],stream:true}),headers:{'content-type':'application/json'}});expect(await response.text()).toContain('[DONE]')}
  expect(received.map(body=>body.reasoning_effort)).toEqual(['max','low']);expect(markers).toEqual(['1','1'])
  expect((await fetch(a+'/api/settings')).status).toBe(403)
  expect((await fetch(a+'/v1/chat/completions',{method:'POST',body:'broken'})).status).toBe(400)
 }finally{closeSessionGateways();upstream.stop(true)}
})
test('Given Responses WebSocket When 会话选择推理档位 Then 升级握手及帧保留且修改实际配置',async()=>{
 let observed:Record<string,unknown>|undefined
 const upstream=Bun.serve({hostname:'127.0.0.1',port:0,fetch(req,server){if(server.upgrade(req))return;return new Response('no',{status:400})},websocket:{message(socket,value){observed=JSON.parse(String(value)) as Record<string,unknown>;socket.send(JSON.stringify({type:'response.completed'}))}}})
 try{
  const url=await sessionGateway('ws-test',`http://127.0.0.1:${upstream.port}`,{model:'p/m',effort:'xhigh'})
  const socket=new WebSocket(url.replace('http:','ws:')+'/v1/responses')
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('WebSocket超时')),2000);socket.onopen=()=>socket.send(JSON.stringify({type:'response.create',model:'p/m',reasoning:{effort:'low'},input:[]}));socket.onerror=()=>{clearTimeout(timer);reject(new Error('握手失败'))};socket.onmessage=()=>{clearTimeout(timer);resolve()}})
  expect(observed?.reasoning).toEqual({effort:'xhigh'});expect(observed?.type).toBe('response.create');socket.close()
 }finally{closeSessionGateways();upstream.stop(true)}
})

test('Given 模型改名后通用目录丢失能力 When 合并供应商详情 Then 保留完整与限定档位及原生协议',()=>{
 const levels=['none','minimal','low','medium','high','xhigh','max','ultra']
 const source={providers:[{id:'p',models:[{id:'vendor/m',efforts:levels}]}]}
 const models=gatewayRoutingModels([{id:'p/vendor/m',display_name:'已改名',native_endpoints:['/v1/chat/completions']}],source)
 expect(models[0]?.efforts).toEqual(levels);expect(models[0]?.name).toBe('已改名');expect(models[0]?.nativeEndpoints).toEqual(['/v1/chat/completions'])
 expect(gatewayRoutingModels([{id:'p/m'}],{providers:[{id:'p',models:[{id:'m',efforts:levels,kept:['high','max']}]}]})[0]?.efforts).toEqual(['high','max'])
 expect(gatewayRoutingModels([{id:'p/m',reasoning_levels:['low']}],{providers:[{id:'p',models:[{id:'m',efforts:[]}]}]})[0]?.efforts).toEqual([])
 expect(gatewayRoutingModels([{id:'p/m'}],{providers:[{id:'p',models:[{id:'m',given:true,efforts:levels}]}]})[0]?.efforts).toEqual([])
 expect(gatewayRoutingModels([{id:'p/m'}],{providers:[{id:'p',models:[{id:'m',given:true,efforts:levels,kept:['low','high']}]}]})[0]?.efforts).toEqual(['low','high'])
})

test('Given Chat 选择厂商原始推理档位 When 准备请求 Then 保留档位及原始请求头并启用受管精确模式',()=>{
 const request={url:'http://127.0.0.1:1/v1/chat/completions',headers:{authorization:'fixture'},body:JSON.stringify({model:'p/m',reasoning_effort:'high',stream:true})}
 const next=gatewayReasoningRequest(request,'ultra')
 expect(next.headers).toEqual({authorization:'fixture','x-tervell-exact-effort':'1'})
 expect(JSON.parse(next.body)).toMatchObject({reasoning_effort:'ultra',stream:true})
 expect(request.headers).toEqual({authorization:'fixture'});expect(JSON.parse(request.body).reasoning_effort).toBe('high')
})
