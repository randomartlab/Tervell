import { test, expect } from 'bun:test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import {AgentPermissionService} from '../apps/electron/src/main/lib/agent-permission-service'
import {observePluginPermissionEvents} from '../apps/electron/src/main/lib/plugin-host/session-events'
import { pluginTimelinePage, collapsePluginTimeline } from '../apps/electron/src/main/lib/plugin-host/timeline'
import type { SDKMessage } from '@proma/shared'
const require = createRequire(import.meta.url)
interface Lifecycle { addHook: (name:string,handler:()=>void)=>()=>void; on:(name:string,handler:()=>void)=>()=>void; before:(name:string,handler:()=>void)=>()=>void }
const lifecycle = require(resolve('apps/electron/resources/third-party/plugin-host/lifecycle.cjs')) as { createLifecycleRegistration:(register:(name:string,handler:()=>void)=>()=>void)=>Lifecycle }

test('Given Paseo 0.13 生命周期旧名 When 原版插件注册 Then 归一到新钩子且保留取消注册',()=>{
 const registrations:string[]=[],removed:string[]=[]
 const sdk=lifecycle.createLifecycleRegistration(name=>{registrations.push(name);return()=>{removed.push(name)}})
 for(const [old,current] of Object.entries({'agent.turn_ended':'agent.turn.after','agent.turn_started':'agent.turn.before','agent.closed':'agent.close.after','agent.archived':'agent.archive.after','agent.created':'agent.create.after','workspace.created':'workspace.create.after','workspace.archived':'workspace.archive.after','agent.permission_requested':'agent.permission.before','agent.permission_resolved':'agent.permission.after'})){
  sdk.on(old,()=>{})();expect(registrations.at(-1)).toBe(current);expect(removed.at(-1)).toBe(current)
 }
 sdk.before('agent.session_open',()=>{});expect(registrations.at(-1)).toBe('agent.open.before')
 expect(()=>sdk.on('invented.event',()=>{})).toThrow('Unknown lifecycle')
})

test('Given 两轮真实SDK消息 When 插件读取尾部时间线 Then 返回语义消息/真实turnId和分页边界',()=>{
 const messages:SDKMessage[]=[{type:'user',uuid:'u1',message:{content:[{type:'text',text:'第一轮'}]}},{type:'assistant',uuid:'a1',message:{content:[{type:'text',text:'第一轮回答'}]}},{type:'user',uuid:'u2',message:{content:[{type:'text',text:'第二轮'}]}},{type:'assistant',uuid:'a2',message:{content:[{type:'text',text:'第二轮回答'}]}}]
 const page=pluginTimelinePage(messages,{limit:1,wholeTurns:true,direction:'tail'})
 expect(page.hasOlder).toBe(true);expect(page.entries.map(e=>e.item.type)).toEqual(['user_message','assistant_message']);expect(page.entries.map(e=>e.turnId)).toEqual(['u2','u2'])
 expect(pluginTimelinePage(messages).entries.filter(e=>e.item.type==='user_message')).toHaveLength(2)
})

test('Given 插件重写同一建议行 When 读回历史 Then 更新原位置且不改其他插件同名行',()=>{
 const row=(pluginId:string,status:string,uuid:string):SDKMessage=>({type:'system',subtype:'plugin_timeline',pluginId,uuid,timestamp:uuid,item:{type:'plugin',id:'suggestion-1',kind:'prompt-suggestion',version:1,data:{status}}})
 const messages=collapsePluginTimeline([row('a','ready','first'),row('b','ready','other'),row('a','dismissed','last')])
 expect(messages).toHaveLength(2);expect((messages[0] as {uuid?:string})?.uuid).toBe('first');expect(((messages[0] as {item?:unknown})?.item as {data:{status:string}}).data.status).toBe('dismissed');expect(((messages[1] as {item?:unknown})?.item as {data:{status:string}}).data.status).toBe('ready')
})

import {resolvePluginText} from '../apps/electron/src/renderer/components/plugins/display-text'
test('Given 插件翻译消息和函数标题 When 设置导航搜索与渲染 Then 解析文本而不会把对象当字符串',()=>{
 const i18n={resolve:(value:unknown)=>(value as {key:string}).key==='settings'?'提示词建议':'名称'}
 expect(resolvePluginText(i18n,{key:'settings'},'fallback')).toBe('提示词建议')
 expect(resolvePluginText(i18n,(params:Record<string,unknown>)=>'项目 '+params.name,'fallback',{name:'A'})).toBe('项目 A')
 expect(resolvePluginText(i18n,()=>{throw Error('title failed')},'screen-id')).toBe('screen-id')
})

test('Given 插件观察审批生命周期 When 用户批准或请求取消 Then 每个请求发出一次请求和一次解决事件',async()=>{
 const events:Array<{name:string;resolution?:Record<string,unknown>}>=[]
 const release=observePluginPermissionEvents(event=>events.push(event)),service=new AgentPermissionService()
 try{
  const controller=new AbortController();let requestId=''
  const allowed=service.requestGateApproval('fixture-session','Write',{path:'fixture'},{signal:controller.signal,toolUseID:'one'},false,request=>{requestId=request.requestId})
  service.respondToPermission(requestId,'allow',false);expect((await allowed).behavior).toBe('allow')
  const canceled=service.requestGateApproval('fixture-session','Write',{path:'fixture'},{signal:controller.signal,toolUseID:'two'},false,()=>{})
  controller.abort();expect((await canceled).behavior).toBe('deny')
  expect(events.map(e=>e.name)).toEqual(['agent.permission.before','agent.permission.after','agent.permission.before','agent.permission.after'])
  expect(events.filter(e=>e.resolution).map(e=>e.resolution?.behavior)).toEqual(['allow','deny'])
 }finally{release()}
})
