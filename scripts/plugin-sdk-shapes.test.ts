import {test,expect} from 'bun:test';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {paseoAgent,paseoWorkspace} from '../apps/electron/src/main/lib/plugin-host/projection';
import {pluginTimelinePage} from '../apps/electron/src/main/lib/plugin-host/timeline';
import {paseoProviderDiagnostic} from '../apps/electron/src/main/lib/plugin-host/provider-diagnostic';
import type {SDKMessage,AgentSessionMeta,AgentWorkspace} from '@proma/shared';
const require=createRequire(import.meta.url);
interface Schema {parse:(input:unknown)=>unknown}
const core=require(resolve('apps/electron/resources/third-party/plugin-host/paseo-core.cjs')) as Record<string,Schema>;
test('Given Tervell元数据 When 暴露Paseo Agent与Workspace Then 通过上游原始协议schema',()=>{
 const session={id:'a',workspaceId:'w',title:'agent',kernelId:'pi',createdAt:1,updatedAt:2} as AgentSessionMeta;
 const workspace={id:'w',slug:'workspace',name:'workspace',createdAt:1,updatedAt:2} as AgentWorkspace;
 expect(()=>core.AgentSnapshotPayloadSchema!.parse(paseoAgent(session,{cwd:'/fixture',running:false}))).not.toThrow();
 expect(()=>core.AgentSnapshotPayloadSchema!.parse(paseoAgent(session,{cwd:'/fixture',running:true,turnId:'turn'}))).not.toThrow();
 expect(()=>core.WorkspaceDescriptorPayloadSchema!.parse(paseoWorkspace(workspace,'/fixture'))).not.toThrow();
});
test('Given 多轮时间线 When 全量/前后游标/失效游标与工具结果 Then schema通过且边界保真',()=>{
 const messages:SDKMessage[]=[];
 for(let i=0;i<3;i++)messages.push({type:'user',uuid:'u'+i,message:{content:[{type:'text',text:'q'+i}]}},{type:'assistant',uuid:'a'+i,message:{content:[{type:'text',text:'a'+i}]}});
 const page=pluginTimelinePage(messages,{limit:2,provider:'pi',agentId:'fixture'});
 expect(()=>core.FetchAgentTimelineResponseMessageSchema!.parse({type:'fetch_agent_timeline_response',payload:{...page,agent:null}})).not.toThrow();
 expect(page.entries.map(e=>e.item.text)).toEqual(['q2','a2']);
 const before=pluginTimelinePage(messages,{limit:2,direction:'before',cursor:page.startCursor});expect(before.entries.map(e=>e.item.text)).toEqual(['q1','a1']);
 const after=pluginTimelinePage(messages,{limit:0,direction:'after',cursor:before.endCursor});expect(after.entries.map(e=>e.item.text)).toEqual(['q2','a2']);
 expect(pluginTimelinePage(messages,{limit:0}).entries).toHaveLength(6);
 expect(pluginTimelinePage(messages,{cursor:{epoch:'old',seq:500}}).staleCursor).toBe(true);
 const tools:SDKMessage[]=[{type:'assistant',uuid:'call',message:{content:[{type:'tool_use',id:'tool',name:'fixture',input:{}}]}},{type:'user',uuid:'result',message:{content:[{type:'tool_result',tool_use_id:'tool',content:'failed',is_error:true}]}}];
 const result=pluginTimelinePage(tools).entries[0]!;expect(result.item.status).toBe('failed');expect(result.item.error).toBe('failed');
});

import {rememberKernelCommands,cachedKernelCommands,publishKernelCatalog,clearKernelCatalogs} from '../apps/electron/src/main/lib/desktop-kernel-catalog';
test('Given 提供商与ACP报告真实会话命令 When SDK读取 Then 保留命令提示且跨内核缓存不混用',()=>{
 rememberKernelCommands('fixture','native-provider',[{name:'reset',description:'Reset state'}]);
 expect(cachedKernelCommands('fixture','native-provider')).toEqual([{name:'reset',description:'Reset state',argumentHint:'',kind:'command'}]);
 publishKernelCatalog('acp','codex',{available_commands_update:{availableCommands:[{name:'review',description:'Review',input:{hint:'files'}}]}});
 expect(cachedKernelCommands('acp','codex')?.[0]?.argumentHint).toBe('files');expect(cachedKernelCommands('acp','pi')).toBeUndefined();clearKernelCatalogs();
});
test('Given 已检测的内核版本 When Paseo插件读取诊断 Then 使用实际路径版本并拒绝注入额外字段',()=>{
 const value=paseoProviderDiagnostic({id:'codex',name:'Codex',command:'codex',args:[],enabled:true,builtin:true,available:true,resolvedCommand:'/fixture/codex',version:'1.2.3',diagnostic:'ready'},'codex');
 expect(value).toContain('\n  Resolved path: /fixture/codex\n  Version: 1.2.3\n');
 expect(paseoProviderDiagnostic({id:'custom',name:'Custom',command:'custom',args:[],enabled:true,builtin:false,available:true,resolvedCommand:'/fixture\n  Version: injected'},'custom')).not.toContain('injected');
 expect(paseoProviderDiagnostic(undefined,'missing')).toContain('Status: unavailable');
 expect(paseoProviderDiagnostic(undefined,'pi')).toContain('Managed by: Tervell application update');
});
