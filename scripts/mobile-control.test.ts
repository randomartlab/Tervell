import {test,expect} from 'bun:test'
import {z} from 'zod'
import {randomBytes,randomUUID} from 'node:crypto'
import {MobileControlRegistry} from '../apps/electron/src/main/lib/mobile-control-policy'
import {RemoteHost,createRemoteDevice} from '../packages/core/src/remote/host'
import type {RemoteAdapter,RemoteState} from '../packages/core/src/remote/host'
import {sealRemote,openRemote} from '../packages/core/src/remote/crypto'
import {RemoteConfigureSchema,MobileControlCallSchema} from '@proma/protocol'
import {GatewayCommandSchema} from '../apps/electron/src/main/lib/model-gateway-management'
import {readFileSync} from 'node:fs'
import {mobileProviderDraft,mobileKernelCatalog} from '../apps/electron/src/main/lib/mobile-control-presentation'
import {MobileAttachments,prepareMobileMessage} from '../apps/electron/src/main/lib/mobile-control-attachments'
import {serializeInlineAttachment} from '@proma/shared'
import {createHash} from 'node:crypto'
import {mkdtempSync,mkdirSync,symlinkSync,rmSync,existsSync,realpathSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {gatewayProviders} from '../apps/electron/src/main/lib/model-gateway-adapter'

test('Given 已配对项目手机 When 请求整机管理或其他项目 Then 拒绝且不能通过scope/额外字段绕过',async()=>{
 const registry=new MobileControlRegistry(id=>id==='session-a'?'project-a':'project-b')
 let writes=0
 for(const scope of ['management','project','session'] as const)registry.add({action:{id:scope,title:scope,group:'test',scope,effect:'write',description:'',fields:[]},schema:z.strictObject({value:z.string()}),run:()=>{writes++;return {saved:true}}})
 const device={id:'phone',workspaceIds:['project-a'],management:false}
 await expect(registry.execute(device,{operation:'management',values:{value:'x'}})).rejects.toThrow('整机')
 await expect(registry.execute(device,{operation:'project',workspaceId:'project-b',values:{value:'x'}})).rejects.toThrow('项目')
 await expect(registry.execute(device,{operation:'session',sessionId:'session-b',values:{value:'x'}})).rejects.toThrow('会话')
 await expect(registry.execute(device,{operation:'session',sessionId:'session-a',workspaceId:'project-b',values:{value:'x'}})).rejects.toThrow()
 expect(writes).toBe(0)
 await registry.execute(device,{operation:'session',sessionId:'session-a',values:{value:'x'}});expect(writes).toBe(1)
 expect(()=>MobileControlCallSchema.parse({operation:'management',scope:'management',values:{}})).toThrow()
 expect(RemoteConfigureSchema.parse({enabled:true,workspaceIds:['project-a']}).allowManagement).toBeUndefined()
})
test('Given 手机能力目录 When 整机管理未授权 Then 不返回管理入口且参数始终校验',async()=>{
 const registry=new MobileControlRegistry(()=>undefined)
 registry.add({action:{id:'write',title:'Write',group:'test',scope:'management',effect:'write',description:'',fields:[]},schema:z.strictObject({flag:z.boolean()}),run:()=>({ok:true})})
 const limited={id:'phone',workspaceIds:[],management:false},catalog=await registry.execute(limited,{operation:'catalog',values:{}}) as {actions:unknown[]}
 expect(catalog.actions).toHaveLength(0)
 await expect(registry.execute({...limited,management:true},{operation:'write',values:{flag:'yes'}})).rejects.toThrow()
 expect(await registry.execute({...limited,management:true},{operation:'write',values:{flag:true}})).toEqual({ok:true})
})
test('Given 加密远程控制 When 重试写入/收紧授权/重新读取 Then 不重复执行且旧缓存不能泄漏',async()=>{
 const state:RemoteState={hostId:'host',devices:[],sent:[]},device=createRemoteDevice(state,'https://example.invalid/',['project-a']);device.management=true
 let management=true,allowed=['project-a'],writes=0,reads=0
 const registry=new MobileControlRegistry(()=> 'project-a')
 registry.add({action:{id:'state',title:'State',group:'test',scope:'management',effect:'read',description:'',fields:[]},schema:z.strictObject({}),run:()=>({reads:++reads})})
 registry.add({action:{id:'write',title:'Write',group:'test',scope:'management',effect:'write',description:'',fields:[]},schema:z.strictObject({}),run:()=>({writes:++writes})})
 const adapter:RemoteAdapter={sessions:()=>[],workspaces:()=>[],create:async()=>{throw new Error()},messages:()=>[],send:()=>{},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false,control:(d,c)=>registry.execute(d,c),authorizeControl:(d,c)=>registry.authorize(d,c),controlRead:id=>registry.isRead(id),managementEnabled:()=>management}
 const host=new RemoteHost(state,adapter,()=>{},()=>allowed);let seq=0
 const request=async(method:string,params:object={},id=randomUUID())=>{const packet=sealRemote(device.pairing,'to-host',++seq,{id,sentAt:Date.now(),method,...params});const reply=await host.receive(device,packet);return openRemote(device.pairing,'to-device',0,reply!).value as {ok:boolean;data:Record<string,unknown>;error?:string}}
 await request('pair',{deviceKey:randomBytes(32).toString('hex'),deviceToken:randomBytes(32).toString('hex')})
 const writeId=randomUUID();expect((await request('control',{call:{operation:'write',values:{}}},writeId)).ok).toBe(true)
 await request('control',{call:{operation:'write',values:{}}},writeId);expect(writes).toBe(1)
 const readId=randomUUID();const first=await request('control',{call:{operation:'state',values:{}}},readId),second=await request('control',{call:{operation:'state',values:{}}},readId);expect(first.data.reads).toBe(1);expect(second.data.reads).toBe(2)
 management=false;expect((await request('control',{call:{operation:'write',values:{}}},writeId)).ok).toBe(false);expect(writes).toBe(1)
 device.revoked=true;await expect(request('control',{call:{operation:'state',values:{}}})).rejects.toThrow('撤销')
})
test('Given 电脑模型服务命令与手机目录生成 When 增加账号或插件动作 Then 无需逐家手写手机路由',()=>{
 const service=readFileSync(new URL('../apps/electron/src/main/lib/mobile-control-service.ts',import.meta.url),'utf8')
 expect(service).toContain('GatewayCommandSchema.options');expect(service).toContain('z.toJSONSchema')
 for(const option of GatewayCommandSchema.options)expect(typeof option.shape.kind.value).toBe('string')
 const java=readFileSync(new URL('../apps/mobile/app/src/main/java/art/randomai/proma/ControlPanel.java',import.meta.url),'utf8')
 for(const capability of ['gateway.signin.plugin','gateway.signin.callback','gateway.auth-prompt','routing.save','kernels.install','gateway.plugin.add'])expect(java).toContain(capability)
 expect(java).toContain('TYPE_TEXT_VARIATION_PASSWORD');expect(java).not.toMatch(/VLESS|sshHost|targetPort|randomai\.art/)
})

test('Given 手机长操作 When 请求提前返回与轮询 Then 票据仅本设备可读且授权收紧后失效',async()=>{
 const {MobileControlJobs}=await import('../apps/electron/src/main/lib/mobile-control-jobs')
 let allowed=true,finish!:(value:unknown)=>void,run=0
 const jobs=new MobileControlJobs(()=>{if(!allowed)throw new Error('已撤销')})
 const device={id:'phone',workspaceIds:['project-a'],management:true}
 const first=await jobs.run(device,{operation:'slow',values:{}},()=>{run++;return new Promise(resolve=>{finish=resolve})},1) as {job:{id:string;phase:string}}
 expect(first.job.phase).toBe('running');expect(run).toBe(1)
 expect(()=>jobs.poll({...device,id:'other'},first.job.id)).toThrow('其他设备')
 finish({installed:true});await Promise.resolve();await Promise.resolve()
 expect(jobs.poll(device,first.job.id)).toMatchObject({job:{phase:'done'},result:{installed:true}})
 allowed=false;expect(()=>jobs.poll(device,first.job.id)).toThrow('撤销')
})

test('Given 读取期间收紧项目授权 When 操作返回 Then 旧权限不能通过最终响应泄漏内容',async()=>{
 const state:RemoteState={hostId:'host',devices:[],sent:[]},device=createRemoteDevice(state,'https://example.invalid/',['a'])
 let allowed=['a'];let finish!:(value:unknown)=>void
 const adapter:RemoteAdapter={sessions:()=>[{id:'s',title:'s',workspaceId:'a',updatedAt:1}],workspaces:()=>[],create:async()=>{throw new Error()},messages:()=>[],send:()=>{},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false,controlRead:()=>true,authorizeControl:(d)=>{if(!d.workspaceIds.includes('a'))throw new Error('未授权')},control:async()=>new Promise(resolve=>{finish=resolve})}
 const host=new RemoteHost(state,adapter,()=>{},()=>allowed);let seq=0
 const ask=async(method:string,params:object)=>{const reply=await host.receive(device,sealRemote(device.pairing,'to-host',++seq,{id:randomUUID(),sentAt:Date.now(),method,...params}));return openRemote(device.pairing,'to-device',0,reply!).value as {ok:boolean;data?:unknown}}
 await ask('pair',{deviceKey:randomBytes(32).toString('hex'),deviceToken:randomBytes(32).toString('hex')})
 const pending=ask('control',{call:{operation:'read',sessionId:'s',values:{}}});while(!finish)await Promise.resolve();allowed=[];finish({secret:'must-not-return'});const reply=await pending;expect(reply.ok).toBe(false);expect(JSON.stringify(reply)).not.toContain('must-not-return')
})

test('Given 插件异步结果 When 插件停用后查询票据 Then 仍保留原插件身份重新核验',async()=>{
 const {MobileControlJobs}=await import('../apps/electron/src/main/lib/mobile-control-jobs')
 let enabled=true,finish!:(value:unknown)=>void
 const device={id:'plugin-phone',workspaceIds:['project-a'],management:true}
 const jobs=new MobileControlJobs((_,call)=>{expect(call.values.pluginId).toBe('plugin-original');expect(call.values.input).toBeUndefined();if(!enabled)throw Error('插件未启用')})
 const ticket=await jobs.run(device,{operation:'plugins.mobile-rpc',values:{pluginId:'plugin-original',name:'read-large',input:{private:'not-retained'}}},()=>new Promise(resolve=>{finish=resolve}),1) as {job:{id:string}}
 finish({ready:true});await Promise.resolve();await Promise.resolve()
 expect(jobs.poll(device,ticket.job.id)).toMatchObject({result:{ready:true}})
 enabled=false;expect(()=>jobs.poll(device,ticket.job.id)).toThrow('插件未启用')
})

test('Given 手机粘贴OAuth回调 When state或回环地址被替换 Then 拒绝而非接受任意code',async()=>{
 const {mobileOAuthCode}=await import('../apps/electron/src/main/lib/mobile-oauth-callback')
 const redirect='http://127.0.0.1:45000/callback'
 expect(mobileOAuthCode(redirect+'?state=expected&code=code',redirect,'expected')).toBe('code')
 for(const value of ['http://attacker.invalid/callback?state=expected&code=x',redirect+'?state=wrong&code=x','http://127.0.0.1:45001/callback?state=expected&code=x',redirect+'?state=expected',redirect+'?state=expected&code=x&code=y',redirect+'?state=expected&code=x&error=access_denied'])expect(()=>mobileOAuthCode(value,redirect,'expected')).toThrow()
})

test('Given 控制操作等待异步完成 When 项目移出设备授权 Then 提交前的上下文复核拒绝写入',async()=>{
 let allowed=['project-a'],finish!:()=>void,writes=0
 const registry=new MobileControlRegistry(()=> 'project-a')
 registry.add({action:{id:'async-save',title:'Save',scope:'session',effect:'write',group:'test',fields:[],description:''},schema:z.strictObject({}),run:async(_,context)=>{await new Promise<void>(resolve=>{finish=resolve});context.assertCurrent();writes++;return {saved:true}}})
 const device={id:'phone',get workspaceIds(){return allowed},management:false}
 const pending=registry.execute(device,{operation:'async-save',sessionId:'s',values:{}});allowed=[];finish();await expect(pending).rejects.toThrow('会话');expect(writes).toBe(0)
})

test('Given 供应商展示只取20条模型 When 打开手机编辑表单 Then 完整已启用模型和调度策略不丢失且不返回密钥',()=>{
 const provider=gatewayProviders({providers:[{id:'local',name:'Fixture',routing:'',key:{set:true,masked:'***'},keyList:[{id:'one',masked:'***'}],models:Array.from({length:150},(_,index)=>({id:'model-'+index,on:index%3!==0}))}]})[0]!
 const draft=mobileProviderDraft(provider)
 expect(draft.models).toHaveLength(100);expect(draft.models).toContain('model-149');expect(draft.routing).toBe('')
 expect(draft).not.toHaveProperty('key');expect(draft).not.toHaveProperty('accounts');expect(draft).not.toHaveProperty('keyMasked')
 const parsed=GatewayCommandSchema.parse({kind:'provider.save',provider:draft});if(parsed.kind!=='provider.save')throw new Error('错误命令类型')
 expect(parsed.provider.models).toEqual(draft.models)
})

test('Given 手机更改模型后读取动态选项 When 内核未改变默认模型 Then 表单保持所选模型而不伪造不可用档位',()=>{
 const catalog:import('@proma/shared').DesktopKernelCatalog={models:[{id:'a',name:'A'},{id:'b',name:'B'}],modes:[],currentModelId:'a',currentModeId:null,controls:[{id:'models',name:'模型',category:'model',type:'select',method:'config',currentValue:'a',options:[{value:'a',name:'A'},{value:'b',name:'B'}]},{id:'effort',name:'推理',type:'select',method:'config',currentValue:'medium',options:[{value:'medium',name:'中'},{value:'xhigh',name:'高'}]}]}
 const next=mobileKernelCatalog(catalog,{modelId:'b',configValues:{effort:'ultra'}})
 expect(next.controls?.[0]?.currentValue).toBe('b');expect(next.controls?.[1]?.currentValue).toBe('medium');expect(catalog.controls?.[0]?.currentValue).toBe('a')
})

test('Given 手机分块附件 When 乱序上传与同块重试 Then 摘要校验后保留原始字节和内联标记',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-attachment-test-'))
 try{
  const uploads=new MobileAttachments(),bytes=randomBytes(100001),digest=createHash('sha256').update(bytes).digest('hex')
  const started=uploads.start('phone','workspace','session',{filename:'示例.png',mediaType:'image/png',bytes:bytes.length,digest})
  for(const index of [2,0,0,1])uploads.chunk('phone','workspace','session',{id:started.id,index,data:bytes.subarray(index*started.chunkBytes,Math.min((index+1)*started.chunkBytes,bytes.length)).toString('base64')})
  expect(()=>uploads.chunk('other','workspace','session',{id:started.id,index:0,data:'YQ=='})).toThrow('失效')
  const result=uploads.finish('phone','workspace','session',started.id,root,()=>{})
  expect(readFileSync(result.attachment.path)).toEqual(bytes);expect(result.marker).toStartWith('[[tervell-asset:')
  expect(()=>uploads.finish('phone','workspace','session',started.id,root,()=>{})).toThrow('失效')
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('Given 附件缺块、摘要错误、越权目录或已撤销授权 When 完成上传 Then 拒绝且不写目标文件',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-attachment-security-'))
 try{
  const uploads=new MobileAttachments(),bytes=Buffer.from('fixture'),digest=createHash('sha256').update(bytes).digest('hex'),base={filename:'sample.txt',mediaType:'text/plain',bytes:bytes.length,digest}
  expect(()=>uploads.start('p','w','s',{...base,filename:'../outside'})).toThrow('名称')
  const first=uploads.start('p','w','s',base)
  expect(()=>uploads.finish('p','w','s',first.id,root,()=>{})).toThrow('完整')
  uploads.chunk('p','w','s',{id:first.id,index:0,data:bytes.toString('base64')})
  expect(()=>uploads.chunk('p','w','s',{id:first.id,index:0,data:Buffer.from('changed').toString('base64')})).toThrow('不一致')
  expect(()=>uploads.finish('p','w','s',first.id,root,()=>{throw new Error('已撤销')})).toThrow('撤销')
  expect(existsSync(join(root,'attachments'))).toBe(false)
  const outside=join(root,'outside'),session=join(root,'session');mkdirSync(outside);mkdirSync(session);symlinkSync(outside,join(session,'attachments'))
  expect(()=>uploads.finish('p','w','s',first.id,session,()=>{})).toThrow('边界')
  const corrupt=uploads.start('q','w','s',{...base,digest:'0'.repeat(64)})
  uploads.chunk('q','w','s',{id:corrupt.id,index:0,data:bytes.toString('base64')})
  expect(()=>uploads.finish('q','w','s',corrupt.id,root,()=>{})).toThrow('校验')
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('Given 手机正文包含文件与网址 When 准备发送 Then 顺序保留且模型不接收序列化标记或越权路径',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-mobile-message-'))
 try{
  const asset={id:'asset',label:'本地文本',mediaType:'text/plain',path:join(root,'file.txt')}
  writeFileSync(asset.path,'fixture')
  const raw='先看'+serializeInlineAttachment(asset)+'再参考'+serializeInlineAttachment({id:'url',label:'示例',mediaType:'text/uri-list',url:'https://example.invalid/'})+'回答'
  const result=prepareMobileMessage(raw,root)
  expect(result.rawUserMessage).toBe(raw);expect(result.userMessage).toBe('先看[附件：本地文本] '+asset.path+'再参考https://example.invalid/回答')
  expect(result.additionalDirectories).toEqual([realpathSync(root)]);expect(result.userMessage).not.toContain('tervell-asset')
  expect(()=>prepareMobileMessage(serializeInlineAttachment({...asset,path:join(tmpdir(),'outside.txt')}),root)).toThrow()
  expect(()=>prepareMobileMessage(serializeInlineAttachment({id:'pending',label:'未完成',mediaType:'text/plain'}),root)).toThrow('尚未准备')
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('Given 异步会话配置启用自动批准 When 等待期间整机授权收紧 Then 票据保留必要授权位且不保存参数正文',async()=>{
 const {MobileControlJobs}=await import('../apps/electron/src/main/lib/mobile-control-jobs');let finish!:(value:unknown)=>void,management=true;
 const jobs=new MobileControlJobs((_,call)=>{expect(call.values.selection).toEqual({autoApprove:true});expect(call.values.channelId).toBeUndefined();if(!management)throw Error('已撤销');});
 const device={id:'p',workspaceIds:['w'],management:true};const ticket=await jobs.run(device,{operation:'session.configuration',sessionId:'s',values:{selection:{kernelId:'pi',autoApprove:true},channelId:'private'}},()=>new Promise(resolve=>{finish=resolve;}),1)as {job:{id:string}};
 finish({saved:true});await Promise.resolve();await Promise.resolve();management=false;expect(()=>jobs.poll(device,ticket.job.id)).toThrow('已撤销');
});
