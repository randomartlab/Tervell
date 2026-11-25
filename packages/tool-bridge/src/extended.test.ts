import {test,expect} from 'bun:test'
import {ToolCatalog} from './catalog.ts'
import {registerExtendedTools} from './extended.ts'
import type {ExtendedBackend} from './extended.ts'
import type {ToolContext,ProductDelegationSchema,ProductAutomationSchema} from '@proma/protocol'
import type {z} from 'zod'
const context:ToolContext={sessionId:'s1',workspaceId:'w1',permission:{mode:'auto',plan:false},triggeredBy:'user'}
function fixture(){
 const automations=new Map<string,z.infer<typeof ProductAutomationSchema>>()
 const delegations=new Map<string,z.infer<typeof ProductDelegationSchema>>()
 const backend:ExtendedBackend={
  automation_list:async()=>({automations:[...automations.values()]}),
  automation_create:async(input,ctx)=>{const value={id:'a1',name:input.name,active:false,scheduleType:'once',workspaceId:ctx.workspaceId};automations.set(value.id,value);return value},
  automation_set_active:async input=>{const old=automations.get(input.id);if(!old)throw new Error('不存在');const next={...old,active:input.active};automations.set(input.id,next);return next},
  delegation_start:async()=>{const value={id:'d1',sessionId:'child1',status:'running' as const};delegations.set(value.id,value);return value},
  delegation_list:async()=>({delegations:[...delegations.values()]}),
  delegation_stop:async input=>{const old=delegations.get(input.id);if(!old)throw new Error('不存在');delegations.set(input.id,{...old,status:'stopped'});return {stopped:true}},
  worktree_list:async()=>({worktrees:[]}),worktree_create:async input=>({path:`project/.worktrees/${input.name}`,branch:`proma/${input.name}`}),files_search:async input=>({files:[`src/${input.query}.ts`],truncated:false}),
 }
 const catalog=new ToolCatalog();registerExtendedTools(catalog,backend)
 return {catalog,automations,delegations}
}
test('Given 扩展产品工具 When 调度草稿/启停/委派/回收 Then 走统一门禁且模型不能伪造权限',async()=>{
 const {catalog,automations,delegations}=fixture();let approvals=0
 const run=(name:string,input:unknown)=>catalog.execute(`mcp__proma__${name}`,input,{context,signal:new AbortController().signal},async()=>{approvals++;return true})
 expect(catalog.snapshot()).toHaveLength(9)
 await run('automation_create',{name:'任务',prompt:'检查',scheduledAt:Date.now()+10000});expect(automations.get('a1')?.active).toBe(false)
 await run('automation_set_active',{id:'a1',active:true});expect(automations.get('a1')?.active).toBe(true)
 await run('delegation_start',{task:'子任务'});expect(delegations.get('d1')?.status).toBe('running')
 await run('delegation_stop',{id:'d1'});expect(delegations.get('d1')?.status).toBe('stopped')
 expect(approvals).toBe(3)
 await expect(run('delegation_start',{task:'bad',permissionMode:'auto'})).rejects.toThrow()
 await expect(run('worktree_create',{name:'../../escape'})).rejects.toThrow()
 await expect(catalog.execute('mcp__proma__delegation_start',{task:'不能执行'},{context:{...context,permission:{mode:'ask',plan:true}},signal:new AbortController().signal},async()=>true)).rejects.toThrow('权限')
 expect(catalog.gate.audit().some(e=>e.tool==='mcp__proma__delegation_start')).toBe(true)
})

test('Given 真实扩展适配边界 When 后台来源、越项目、越父会话与过去时间 Then 拒绝后端执行',async()=>{
 const {createExtendedBackend}=await import('./extended-backend.ts')
 let starts=0,active=false
 const backend=createExtendedBackend({
  automations:()=>[{id:'other',workspaceId:'w2',name:'私有',active:false,scheduleType:'once'}],getAutomation:()=>({id:'other',workspaceId:'w2',name:'私有',active:false,scheduleType:'once'}),
  createAutomation:(input,ctx)=>({id:'a1',workspaceId:ctx.workspaceId,name:input.name,active:false,scheduleType:'once'}),setActive:()=>{active=true;throw new Error('不可到达')},
  startDelegation:()=>{starts++;return {id:'d1',sessionId:'child',status:'running'}},delegations:()=>[],stopDelegation:()=>{starts++;return true},
  project:{worktree_list:async()=>({worktrees:[]}),worktree_create:async()=>({path:'x',branch:'x'}),files_search:async()=>({files:[],truncated:false})},
 })
 const signal=new AbortController().signal
 expect((await backend.automation_list({},context,signal)).automations).toHaveLength(0)
 await expect(backend.automation_set_active({id:'other',active:true},context,signal)).rejects.toThrow('此项目')
 await expect(backend.automation_create({name:'old',prompt:'x',scheduledAt:1},context,signal)).rejects.toThrow('未来')
 for(const triggeredBy of ['external','delegation','automation'] as const)await expect(backend.delegation_start({task:'x'},{...context,triggeredBy},signal)).rejects.toThrow('主会话')
 await expect(backend.delegation_stop({id:'foreign'},context,signal)).rejects.toThrow('父会话')
 expect(starts).toBe(0);expect(active).toBe(false)
})

test('Given 扩展目录 When MCP stdio真实调用调度与委派 Then 后端状态变化且受统一审批',async()=>{
 const {SessionToolServer}=await import('./server.ts'),{Client}=await import('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=await import('@modelcontextprotocol/sdk/client/stdio.js'),{fileURLToPath}=await import('node:url')
 const {catalog,automations,delegations}=fixture();let approvals=0
 const host=await SessionToolServer.open({context,catalog,runtime:{command:process.execPath,args:[fileURLToPath(new URL('./stdio.ts',import.meta.url))]},authorize:async()=>{approvals++;return true}})
 const config=host.config(),transport=new StdioClientTransport({command:config.command,args:config.args,env:Object.fromEntries(config.env.map(e=>[e.name,e.value])),stderr:'pipe'});transport.stderr?.on('data',()=>{})
 const client=new Client({name:'w7-product-e2e',version:'1.0.0'})
 try{
  await client.connect(transport)
  expect((await client.callTool({name:'mcp__proma__automation_create',arguments:{name:'草稿',prompt:'检查',scheduledAt:Date.now()+10000}})).isError).not.toBe(true)
  expect(automations.get('a1')?.active).toBe(false)
  expect((await client.callTool({name:'mcp__proma__delegation_start',arguments:{task:'有限子任务'}})).isError).not.toBe(true)
  expect(delegations.get('d1')?.status).toBe('running');expect(approvals).toBe(2)
 }finally{await client.close();await transport.close();await host.close()}
},10000)
