import {test,expect} from 'bun:test'
import {gatewaySubscriptions,gatewayPluginEntries,gatewayPluginListings,gatewayPrompt,gatewaySignIn} from '../apps/electron/src/main/lib/gateway-extension-adapter'
import {extensionCommand,extensionQuery,GatewayQuerySchema} from '../apps/electron/src/main/lib/gateway-extension-api'
import {GatewayCommandSchema} from '../apps/electron/src/main/lib/model-gateway-management'
import {gatewayProviders} from '../apps/electron/src/main/lib/model-gateway-adapter'

test('Given 插件动态登录声明 When 生成供应商登录目录 Then 保留多方式/提问/插件替代且不回传认证秘密',()=>{
 const subs=gatewaySubscriptions({movesTo:{grok:'@community/grok'},plugins:[{id:'plugin-company',pid:'company',name:'Company',icon:'company',spec:'plugin-company',methods:[{type:'oauth',label:'Browser',labels:{zh:'企业登录'}},{type:'api',label:'API',keyless:true}],options:[{key:'free',label:'Free',on:true}],signedIn:true,models:5,secret:'not-returned'}]})
 expect(subs).toHaveLength(20);expect(subs.find(s=>s.id==='grok')?.installSpec).toBe('@community/grok')
 const plugin=subs.find(s=>s.id==='plugin-company')!;expect(plugin.methods.map(m=>m.label)).toEqual(['企业登录','API']);expect(plugin.methods[1]?.keyless).toBe(true);expect(plugin.providerId).toBe('company');expect(plugin.options[0]?.on).toBe(true)
 expect(JSON.stringify(subs)).not.toContain('not-returned')
 const moved=gatewaySubscriptions({movesTo:{grok:'old'},plugins:[{id:'grok',pid:'xai',spec:'new',methods:[{type:'oauth',label:'X'}]}]}).find(s=>s.id==='grok')!
 expect(moved.spec).toBe('new');expect(moved.installSpec).toBeUndefined()
})
test('Given 账号与插件快照含原始密钥 When 映射给界面 Then 仅列展示字段并保留冲突与多账号',()=>{
 const p=gatewayProviders({providers:[{id:'p',account:{agent:'a',logins:[{user:'test',active:true,on:true,access:'not-returned',refresh:'not-returned'}]},key:{value:'not-returned'}}]})[0]!
 expect(p.subscriptionId).toBe('a');expect(p.logins?.[0]).toMatchObject({user:'test',active:true,enabled:true});expect(JSON.stringify(p)).not.toContain('not-returned')
 const list=gatewayPluginEntries({plugins:[{spec:'x',ownName:'X',options:{secret:'not-returned'},optionsExample:{port:1},clashes:[{id:'p',by:'other',name:'P'}],isMiddleware:true}]})
 expect(list[0]?.clashes?.[0]?.serving).toBe('other');expect(list[0]?.kind).toBe('middleware');expect(JSON.stringify(list)).not.toContain('not-returned')
 expect(gatewaySignIn({id:'a',state:'waiting',url:'https://example.invalid',pasteCode:true,accessToken:'not-returned'}).pasteCode).toBe(true)
})
test('Given 社区目录与提问返回 When 转换 Then 不锁死供应商并保留中文和密码字段',()=>{
 expect(gatewayPluginListings({listings:[{package:'pkg',name:'Package',summary:{zh:'中文'},providers:['x']} ]})[0]).toMatchObject({spec:'pkg',description:'中文',kind:'provider'})
 expect(gatewayPrompt({key:'password',type:'password',message:'Pass',messages:{zh:'登录密码'}})).toMatchObject({type:'password',message:'登录密码'})
 expect(gatewayPrompt(null)).toBeNull()
})
test('Given 动态账号动作 When 通过类型化IPC Then 接受新插件ID但拒绝任意管理URL和超大输入',()=>{
 expect(GatewayCommandSchema.parse({kind:'signin.start',agent:'vendor-future',site:'cn'}).kind).toBe('signin.start')
 expect(GatewayCommandSchema.parse({kind:'signin.plugin',provider:'vendor',method:2,inputs:{tenant:'team'}}).kind).toBe('signin.plugin')
 expect(()=>GatewayQuerySchema.parse({kind:'fetch',url:'file:///secret'})).toThrow()
 expect(()=>GatewayQuerySchema.parse({kind:'signin.prompt',provider:'v',method:-1,inputs:{}})).toThrow()
 expect(()=>GatewayCommandSchema.parse({kind:'plugins.registry',url:'file:///secret'})).toThrow()
 expect(()=>GatewayCommandSchema.parse({kind:'signin.plugin',provider:'v',method:1,inputs:{x:'x'.repeat(70000)}})).toThrow()
})
test('Given 隔离验收profile When 尝试授权/导入/账号切换 Then 所有真实认证动作在请求前被阻止',async()=>{
 let calls=0;const dependencies={isolated:true,request:async()=>{calls++;return {}}}
 for(const command of [{kind:'signin.start' as const,agent:'grok'},{kind:'signin.plugin' as const,provider:'p',method:0,inputs:{}},{kind:'signin.import' as const,agent:'p',files:['secret']},{kind:'login.switch' as const,agent:'p',user:'u'},{kind:'login.toggle' as const,agent:'p',user:'u',enabled:true}])await expect(extensionCommand(command,dependencies)).rejects.toThrow('隔离')
 await expect(extensionQuery({kind:'signin.prompt',provider:'p',method:0,inputs:{}},dependencies)).rejects.toThrow('隔离');expect(calls).toBe(0)
})
test('Given 插件提问授权生命周期 When 选择方式/回答/回调/轮询 Then 使用实际接口并保留厂商全部选项',async()=>{
 const log:Array<{path:string;body:unknown}>=[]
 const request=async(path:string,body?:unknown):Promise<unknown>=>{log.push({path,body});if(path.endsWith('/prompt'))return {inputs:{tenant:'my-team'},prompt:{key:'password',message:'Password',type:'password'}};if(path==='/api/plugin-signin')return {id:'flow',agent:'plugin-test',url:'https://vendor.invalid',state:'waiting',pasteCode:true};if(path==='/api/signin/flow')return {id:'flow',state:'done',user:'test-account',token:'not-returned'};return {}}
 const deps={request,isolated:false}
 const q=await extensionQuery({kind:'signin.prompt',provider:'test',method:1,inputs:{},key:'tenant',value:'my-team'},deps);expect(q.prompt?.type).toBe('password');expect(q.inputs).toEqual({tenant:'my-team'})
 const flow=await extensionCommand({kind:'signin.plugin',provider:'test',method:1,inputs:q.inputs!},deps);expect(flow?.signIn?.pasteCode).toBe(true)
 await extensionCommand({kind:'signin.callback',id:'flow',url:'mock-authorization-code'},deps)
 const done=await extensionCommand({kind:'signin.poll',id:'flow'},deps);expect(done?.signIn?.state).toBe('done');expect(JSON.stringify(done)).not.toContain('not-returned')
 await extensionCommand({kind:'subscription.option',provider:'test',key:'free',enabled:true},deps)
 expect(log.map(r=>r.path)).toEqual(['/api/plugin-signin/prompt','/api/plugin-signin','/api/signin/flow/callback','/api/signin/flow','/api/settings/plugin-option'])
})
test('Given 一个插件目录请求失败 When 读取目录 Then 仍保留另一部分并显示可重试提示',async()=>{
 const result=await extensionQuery({kind:'plugins.catalog'},{isolated:true,request:async path=>{if(path.endsWith('listings'))throw new Error('offline');return {bun:true,plugins:[]}}})
 expect(result.catalog?.bun).toBe(true);expect(result.catalog?.warnings).toHaveLength(1)
})

test('Given 平台套餐授权和账号导出 When 执行动作 Then 调用专用接口且导出不返回token',async()=>{
 const calls:string[]=[];const deps={isolated:false,request:async(path:string)=>{calls.push(path);return {url:'https://platform.invalid/login',state:'done',path:'~/Downloads/test.json',accounts:['test'],secret:'not-returned'}}}
 const p=gatewayProviders({providers:[{id:'platform',stepPlan:{signedIn:false,url:'https://platform.invalid',bookmarklet:'javascript:void(0)'},qianwenPlan:{signedIn:true,account:'test'}}]})[0]!
 expect(p.platformLogins?.map(l=>l.kind)).toEqual(['stepfun','qianwen'])
 await extensionCommand({kind:'platform.session',id:'p',platform:'stepfun',text:'synthetic-session'},deps)
 expect((await extensionCommand({kind:'platform.start',id:'p'},deps))?.platformSignIn?.url).toBe('https://platform.invalid/login')
 await extensionCommand({kind:'platform.poll',id:'p'},deps)
 const exported=await extensionCommand({kind:'signin.export',agent:'codex',format:'sub2api',users:['test']},deps)
 expect(exported?.exported?.path).toBe('~/Downloads/test.json');expect(JSON.stringify(exported)).not.toContain('not-returned')
 expect(calls).toEqual(['/api/stepfun/p/session','/api/qianwen/p/signin','/api/qianwen/p/signin','/api/signin/export'])
})

test('Given 插件页面声明读取权限 When 桥接读写与资源 Then 只允许当前启用页面和自己的资源',async()=>{
 const {gatewayPluginPageQuery}=await import('../apps/electron/src/main/lib/gateway-plugin-pages')
 const token='a'.repeat(32),own=`/_magpie/plugin/${token}/index.html`,calls:string[]=[]
 const deps={request:async(path:string):Promise<unknown>=>{calls.push(path);return path==='/api/plugin-pages'?[{key:'page',spec:'test',title:'Test',url:own,reads:['providers:list']}]:path==='/api/plugin-panels'?[]:{ok:true}},asset:async(path:string)=>({text:'<html>fixture</html>',type:'text/html',bytes:new Uint8Array([1,2,3])})}
 expect((await gatewayPluginPageQuery({kind:'plugins.pages'},deps)).pages?.[0]?.key).toBe('page')
 await expect(gatewayPluginPageQuery({kind:'plugins.document',key:'removed'},deps)).rejects.toThrow('停用')
 expect((await gatewayPluginPageQuery({kind:'plugins.document',key:'page'},deps)).document).toContain('fixture')
 await expect(gatewayPluginPageQuery({kind:'plugins.page-call',key:'page',method:'read',params:{name:'secret'}},deps)).rejects.toThrow('未声明')
 await gatewayPluginPageQuery({kind:'plugins.page-call',key:'page',method:'read',params:{name:'providers:list'}},deps)
 expect(calls).toContain('/api/plugin-pages/read')
 await expect(gatewayPluginPageQuery({kind:'plugins.page-call',key:'page',method:'asset',params:{url:'http://localhost/api/providers'}},deps)).rejects.toThrow('自己的资源')
 await expect(gatewayPluginPageQuery({kind:'plugins.page-call',key:'page',method:'asset',params:{url:'../../private/key'}},deps)).rejects.toThrow('自己的资源')
})

test('Given 内置插件及GitHub社区 When 查看与切换 Then 使用运行时目录而非静态空入口',async()=>{
 const seen:Array<{path:string;body:unknown}>=[]
 const deps={isolated:true,request:async(path:string,body?:unknown):Promise<unknown>=>{seen.push({path,body});if(path==='/api/plugins/builtin')return [{id:'search',name:'Search',sub:'Web tools',on:true,inUse:2,config:{enabled:true}}];return {repos:[{spec:'github:author/repo',repo:'author/repo',description:'Custom plugin'}]}}}
 const builtins=await extensionQuery({kind:'plugins.builtin'},deps);expect(builtins.builtins?.[0]).toMatchObject({enabled:true,inUse:2})
 const repos=await extensionQuery({kind:'plugins.github'},deps);expect(repos.catalog?.listings[0]?.spec).toBe('github:author/repo')
 await extensionCommand({kind:'plugins.builtin',id:'search',enabled:false},deps)
 expect(seen.at(-1)).toEqual({path:'/api/plugins/builtin',body:{id:'search',on:false}})
 expect(()=>GatewayCommandSchema.parse({kind:'plugins.builtin',id:'search'})).toThrow()
})
