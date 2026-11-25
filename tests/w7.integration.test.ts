import {test,expect} from 'bun:test'
import {mkdtempSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {AcpKernel} from '../packages/kernel-host/src/acp/kernel.ts'
import {createAcpClientBridge} from '../packages/kernel-host/src/acp/client-bridge.ts'
import {PathBoundary,ToolGate} from '../packages/core/src/permission/index.ts'
import type {KernelEvent,ToolContext} from '../packages/protocol/src/index.ts'
const script=fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/client-agent.ts',import.meta.url))
test('Given ACP客户端回调 When 真RPC写文件/读文件/创建终端/等待退出 Then 门禁审计与会话归属生效',async()=>{
 const root=mkdtempSync(join(tmpdir(),'w7-e2e-')),gate=new ToolGate()
 const context:ToolContext={sessionId:'s1',workspaceId:'w1',permission:{mode:'ask',plan:false},triggeredBy:'user'}
 const kernel=new AcpKernel('w7',{command:process.execPath,args:[script],timeoutMs:3000,openClientBridge:async input=>createAcpClientBridge(input,{context,authorize:async()=>true},new PathBoundary({cwd:root},()=>{}),gate)})
 const handle=await kernel.createSession({sessionId:'s1',cwd:root,systemPrompt:''})
 try{
  const events:KernelEvent[]=[];for await(const e of kernel.prompt(handle,{runId:'r1',text:'callbacks'},{signal:new AbortController().signal}))events.push(e)
  expect(events.at(-1)).toMatchObject({t:'done',reason:'stop'});expect(readFileSync(join(root,'from-acp.txt'),'utf8')).toBe('ACP写入')
  const value=JSON.stringify(events);expect(value).toContain('blocked\\\":true');expect(value).toContain('exitCode');expect(value).toContain('ACP终端')
  expect(gate.audit().filter(e=>e.phase==='decision').map(e=>e.tool)).toEqual(['Write','Read','execute','TerminalWait','TerminalOutput','TerminalRelease'])
 }finally{await kernel.close(handle);rmSync(root,{recursive:true,force:true})}
},10000)
test('Given ACP审批回调 When 统一门禁allow-session Then 原始allow_once响应且第二轮复用产品授权',async()=>{
 const root=mkdtempSync(join(tmpdir(),'w7-approval-')),gate=new ToolGate();let asks=0
 const context:ToolContext={sessionId:'s1',workspaceId:'w1',permission:{mode:'ask',plan:false},triggeredBy:'user'}
 const kernel=new AcpKernel('w7-permission',{command:process.execPath,args:[script],timeoutMs:3000,approve:async(request,signal)=>{
  try{await gate.run({name:request.tool,kind:'edit',effect:'write'},request.input,{context,signal,authorize:async()=>{asks++;return 'allow-session'}},()=>{});return request.options.find(o=>o.kind==='allow_once')?.optionId??null}catch{return request.options.find(o=>o.kind==='reject_once')?.optionId??null}
 }})
 const handle=await kernel.createSession({sessionId:'s1',cwd:root,systemPrompt:''})
 try{for(const runId of ['r1','r2']){const events=[];for await(const e of kernel.prompt(handle,{runId,text:'permission'},{signal:new AbortController().signal}))events.push(e);expect(JSON.stringify(events)).toContain('once')}expect(asks).toBe(1)}
 finally{await kernel.close(handle);rmSync(root,{recursive:true,force:true})}
})
