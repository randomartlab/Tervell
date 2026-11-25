import { app } from 'electron'
import { createServer } from 'node:http'
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { KernelEvent } from '@proma/protocol'
import {routedApprovalDefault}from'@proma/auth-bridge'
import type { ManagedCli } from '../apps/electron/src/main/lib/desktop-cli-managed'
import { writeJsonFileAtomic, writeTextFileAtomic } from '../apps/electron/src/main/lib/safe-file'

/** 真实受管CLI→真实Magpie→回环模型。工具输出、第二轮、取消、进程退出均实际验证。
 * 默认隔离安装；可显式传入本次QA安装清单，重复使用只读安装文件，账号/HOME仍重新隔离。
 */
const root = mkdtempSync(join(tmpdir(), 'tervell-kernel-dialogue-'))
process.env.TERVELL_PROFILE_DIR = root
app.setPath('userData', join(root, 'chromium'))
;(app as typeof app & { setAppPath(path: string): void }).setAppPath(resolve('apps/electron'))
app.commandLine.appendSwitch('use-mock-keychain')
const check = (value: unknown, message: string): void => { if (!value) throw Error(message) }
interface Tool { type?: string; function: { name: string; parameters?: { properties?: Record<string,unknown>; required?: string[] } } }
interface ModelRequest { tools?: Tool[]; messages?: Array<{role:string;content:unknown}>; model?:string;response_format?:unknown }
interface DialogueState { id:string; stage:number; toolName?:string; calls:number; held:boolean; requests:Array<{keys:string[];tools:string[]}>; toolResults:string[] }

async function run(): Promise<void> {
  const { AcpKernel, createAcpClientBridge, acpDialect, sessionControls } = await import('@proma/kernel-host')
  const { PathBoundary, ToolGate } = await import('@proma/core/permission')
  const routing = await import('../apps/electron/src/main/lib/model-routing-service')
  const { kernelRouteLaunchArgs } = await import('../apps/electron/src/main/lib/kernel-routing-adapters')
  const { desktopCliEnvironment } = await import('../apps/electron/src/main/lib/desktop-extension-service')
  const { provisionDesktopCli } = await import('../apps/electron/src/main/lib/desktop-cli-provision')
  const { verifyManagedCliHandshake } = await import('../apps/electron/src/main/lib/desktop-cli-handshake')
  const { gatewayCommand } = await import('../apps/electron/src/main/lib/model-gateway-management')
  const supplied = process.env.TERVELL_QA_MANAGED_MANIFEST ? JSON.parse(readFileSync(process.env.TERVELL_QA_MANAGED_MANIFEST,'utf8')) as Record<string,string> : {}
  const overrides=process.env.TERVELL_QA_LAUNCH_OVERRIDES?JSON.parse(readFileSync(process.env.TERVELL_QA_LAUNCH_OVERRIDES,'utf8')) as Record<string,{env?:Record<string,string>;args?:string[]}>:{}
  const ids = (process.env.TERVELL_QA_KERNELS ?? 'codex,gemini,qwen,kimi,copilot,mcode,dsh,omp,opencode,glm-acp-agent').split(',').filter(Boolean)
  let current: DialogueState | undefined
  const server = createServer(async (req,res) => {
    if (req.method === 'GET') { res.setHeader('content-type','application/json'); res.end(JSON.stringify({data:[{id:'fixture',context_length:65536,max_output_tokens:8192,tool_call:true}]})); return }
    try {
      let text = ''; for await (const chunk of req) { text += String(chunk); if (text.length > 16*1024*1024) throw Error('fixture request too large') }
      const body = JSON.parse(text) as ModelRequest
      const state = current; if (!state) throw Error('请求没有归属的测试内核')
      const memoryExtraction=(body.messages??[]).some(message=>message.role==='system'&&typeof message.content==='string'&&message.content.startsWith('You are now acting as the managed memory extraction subagent'))
      if(memoryExtraction){
        // Qwen在主任务结束后异步提取记忆；固定回环任务没有需保存的用户事实，不能把后台提取误当成待取消的用户请求。
        const delta={role:'assistant',content:'No durable user facts need to be saved.'}
        res.writeHead(200,{'content-type':'text/event-stream'})
        for(const [value,finish]of [[delta,null],[{},'stop']]as const)res.write('data: '+JSON.stringify({id:'memory-fixture',object:'chat.completion.chunk',model:'fixture',choices:[{index:0,delta:value,finish_reason:finish}]})+'\n\n')
        res.end('data: [DONE]\n\n');return
      }
      if(state.calls<16)writeJsonFileAtomic(join(root,state.id+'-request-'+state.calls+'.json'),body)
      const tools=body.tools??[]
      if(tools.length===1&&tools[0]?.function.name==='respond_in_schema'){
        // Windows路径/权限策略可触发CLI自己的辅助分类调用；记录真实schema，不能把它当用户任务推进。
        writeJsonFileAtomic(join(root,state.id+'-classification.json'),{tools,messages:body.messages})
        throw Error('QA model has not implemented this CLI classifier; see classification fixture')
      }
      state.calls++; state.requests.push({keys:Object.keys(body),tools:(body.tools??[]).map(tool=>tool.function.name)})
      check(state.calls<=10,'内核工具没有收敛，停止本次回归')
      if (state.held) { res.writeHead(200,{'content-type':'text/event-stream'}); res.write(': controlled pending turn\n\n'); return }
      const toolResults=(body.messages??[]).filter(message=>message.role==='tool'); state.toolResults=[...new Set([...state.toolResults,...toolResults.map(message=>JSON.stringify(message.content))])]
      if(state.stage===0)writeJsonFileAtomic(join(root,state.id+'-tools.json'),tools)
      if(toolResults.length)console.log('TOOL_RESULTS',state.id,JSON.stringify(state.toolResults.map(value=>value.slice(0,800))))
      const shell=process.platform==='win32'&&tools.find(tool=>tool.function.name==='PowerShell')||tools.find(tool=>['exec_command','run_shell_command','run_terminal_command','Bash','bash','run_command','run_commands','terminal','shell','powershell','pwsh'].includes(tool.function.name))
      const read=tools.find(tool=>tool.function.name==='read_file'),write=tools.find(tool=>tool.function.name==='write_file')
      check(shell||read&&write||state.stage>0,`${state.id} 未向模型提供执行或文件工具`)
      const project=join(root,'projects',state.id)
      // node 已由验收环境提供；统一写UTF8，避免 PowerShell 的重定向编码或 cmd/bash 引号差异掩盖真实工具结果。
      const outputPath=join(project,'kernel-output.txt').replaceAll('\\','/')
      const command=state.stage===0?'echo TERVELL_REAL_SHELL_OK':state.stage===1?process.platform==='win32'?`node -e "require('node:fs').writeFileSync('${outputPath}','TERVELL_FILE_WRITTEN')"`:`echo TERVELL_FILE_WRITTEN> "${outputPath}"`:undefined
      let delta:Record<string,unknown>,finishReason:string
      if(command){
        const tool=shell??(state.stage===0?read!:write!); state.toolName=tool.function.name
        const properties=tool.function.parameters?.properties??{}
        const filePath=join(root,'projects',state.id,state.stage===0?'input.txt':'kernel-output.txt')
        const args:Record<string,unknown>=!shell?{file_path:filePath,...(state.stage===0?{offset:0,limit:100}:{content:'TERVELL_FILE_WRITTEN'})}:Object.hasOwn(properties,'CommandLine')?{CommandLine:command,Cwd:join(root,'projects',state.id),WaitMsBeforeAsync:1000,toolSummary:'Kernel regression',toolAction:'Checking kernel'}:Object.hasOwn(properties,'commands')?{commands:[command]}:{ [Object.hasOwn(properties,'cmd')?'cmd':'command']:command }
        if(Object.hasOwn(properties,'description'))args.description='Run isolated kernel regression command'
        if(Object.hasOwn(properties,'pty'))args.pty=false
        if(Object.hasOwn(properties,'is_background'))args.is_background=false
        if(Object.hasOwn(properties,'action'))args.action='run'
        if(Object.hasOwn(properties,'workdir'))args.workdir=project
        if(Object.hasOwn(properties,'cwd'))args.cwd=project
        delta={role:'assistant',tool_calls:[{index:0,id:'call-'+state.stage,type:'function',function:{name:tool.function.name,arguments:JSON.stringify(args)}}]}; finishReason='tool_calls'; state.stage++
      }else{check(state.toolResults.some(value=>value.includes('TERVELL_REAL_SHELL_OK')||value.includes('TERVELL_INPUT_UNCHANGED')),'真实终端输出未回传模型');delta={role:'assistant',content:'TERVELL_REAL_FINAL_OK'};finishReason='stop'}
      res.writeHead(200,{'content-type':'text/event-stream'})
      const chunk=(value:Record<string,unknown>,finish:string|null)=>'data: '+JSON.stringify({id:'chat-fixture',object:'chat.completion.chunk',model:'fixture',choices:[{index:0,delta:value,finish_reason:finish}]})+'\n\n'
      const usage='data: '+JSON.stringify({id:'chat-fixture',object:'chat.completion.chunk',model:'fixture',choices:[],usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110}})+'\n\n'
      res.end(chunk(delta,null)+chunk({},finishReason)+usage+'data: [DONE]\n\n')
    }catch(error){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:String(error)}}))}
  })
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done))
  const config=join(root,'config/model-routing/config/magpie');mkdirSync(config,{recursive:true})
  writeJsonFileAtomic(join(config,'providers.json'),{providers:[{id:'fixture',name:'Local-only kernel verification',key:'fixture-only',chat:`http://127.0.0.1:${(server.address() as {port:number}).port}/v1`,models:['fixture']}]})
  routing.saveModelRouting({version:1,enabled:true,defaultModel:'fixture/fixture',rules:[]})
  const base=desktopCliEnvironment(),results:Array<Record<string,unknown>>=[]
  try {
    await routing.startModelRouting(base.PATH??'')
    await gatewayCommand({kind:'provider.refresh',id:'fixture'})
    for(const id of ids){
      let kernel:InstanceType<typeof AcpKernel>|undefined,handle:Awaited<ReturnType<InstanceType<typeof AcpKernel>['createSession']>>|undefined
      const started=Date.now(),cwd=join(root,'projects',id);mkdirSync(cwd,{recursive:true});writeTextFileAtomic(join(cwd,'input.txt'),'TERVELL_INPUT_UNCHANGED')
      let approvals=0,reverseRequests=0
      current={id,stage:0,calls:0,held:false,requests:[],toolResults:[]}
      try {
        const cli:ManagedCli=supplied[id]?JSON.parse(readFileSync(supplied[id]!,'utf8')):await provisionDesktopCli(id,{signal:new AbortController().signal,env:base,output:text=>console.log('INSTALL',id,text.trim())})
        const native=(await import('../apps/electron/src/main/lib/desktop-cli-native-entry')).managedNativeEntry(id,cli.directory,cli.installedVersion)
        if(native){if(cli.args[0]?.endsWith('/bin/grok')||cli.args[0]?.endsWith('\\bin\\grok'))cli.args=cli.args.slice(1);cli.command=native;cli.env.GROK_MANAGED_BY_NPM='1'}
        check(existsSync(cli.command),'真实受管入口不存在')
        const verification=await verifyManagedCliHandshake(cli,cwd,base,new AbortController().signal)
        const route=await routing.prepareRoutedKernel(id,{...base,...cli.env},'dialogue-'+id)
        Object.assign(route.env,overrides[id]?.env)
        if(process.platform==='win32'&&process.env.TERVELL_QA_PROCESS_DIAGNOSTICS==='1'&&id==='gemini'){
          route.env.TERVELL_QA_PROCESS_LOG=join(root,id+'-processes.jsonl')
          route.env.NODE_OPTIONS='--require '+JSON.stringify(resolve('scripts/fixtures/cli-process-diagnostics.cjs'))
        }
        if(process.platform==='win32'&&process.env.TERVELL_QA_TRACE==='1'&&id==='hermes'){
          const diagnostic=join(root,'python-diagnostics');mkdirSync(diagnostic,{recursive:true})
          writeTextFileAtomic(join(diagnostic,'sitecustomize.py'),"import faulthandler, os\n_stream = open(os.environ['TERVELL_QA_STACK_LOG'], 'a')\nfaulthandler.dump_traceback_later(20, repeat=True, file=_stream)\n")
          route.env.PYTHONPATH=diagnostic;route.env.TERVELL_QA_STACK_LOG=join(root,id+'-stacks.txt')
        }
        const gate=new ToolGate()
        const dialects:Record<string,string>={grok:'grok',claude:'claude-code',codex:'codex',gemini:'gemini-cli',omp:'omp',cursor:'cursor-agent',opencode2:'opencode-2'}
        kernel=new AcpKernel(id,{command:cli.command,args:kernelRouteLaunchArgs(id,[...cli.args,...(overrides[id]?.args??[])],route.env),env:route.env,inheritEnv:false,timeoutMs:30000,promptTimeoutMs:180000,cancelGraceMs:100,
          ...(dialects[id]?{dialect:acpDialect(dialects[id]!)}:{}),
          ...(process.env.TERVELL_QA_TRACE?{trace:(direction,message)=>{appendFileSync(join(root,id+'-local-trace.jsonl'),JSON.stringify({direction,message})+'\n');if(direction==='agent'&&'result'in message&&message.result&&typeof message.result==='object'&&!Array.isArray(message.result)&&'authMethods'in message.result)writeJsonFileAtomic(join(root,id+'-auth-methods.json'),message.result);if(direction==='agent'&&'error'in message)console.log('RPC ERROR',id,JSON.stringify(message.error))}}:{}),
          approve:async request=>{approvals++;return request.options.find(option=>option.kind==='allow_once')?.optionId??null},
          openClientBridge:async input=>{const bridge=createAcpClientBridge(input,{context:{sessionId:id,workspaceId:'fixture',permission:{mode:'ask',plan:false},triggeredBy:'user'},authorize:async()=>{approvals++;return true}},new PathBoundary({cwd},()=>{}),gate,route.env);return {request:(...args)=>{reverseRequests++;return bridge.request(...args)},close:()=>bridge.close()}}
        })
        handle=await kernel.createSession({sessionId:id,cwd,systemPrompt:'Only execute the explicit local regression steps.'})
        await kernel.modelCatalog(handle)
        const controls=sessionControls(kernel.sessionMetadata(handle)),mode=controls.find(control=>control.category==='mode')
        // 本回归验证用户逐次审批模式；不把不支持安全分类的固定模型冒充为分类器。
        const manualMode=id==='fx'?'ask':routedApprovalDefault(id,!!route.model,undefined,mode?.options?.map(o=>o.value)??[])
        if(manualMode&&mode?.type==='select'&&mode.options?.some(option=>option.value===manualMode))await kernel.configureSession(handle,{modeId:manualMode})
        console.log('CATALOG',id,JSON.stringify(controls.map(control=>({id:control.id,category:control.category,type:control.type,current:control.currentValue}))))
        const collect=async(runId:string,text:string,signal=new AbortController().signal):Promise<KernelEvent[]>=>{const events:KernelEvent[]=[];for await(const event of kernel!.prompt(handle!,{runId,text,history:[]},{signal}))events.push(event);return events}
        const events=await collect(randomUUID(),'Run the two regression commands then reply with the exact final marker.')
        writeJsonFileAtomic(join(root,id+'-events.json'),events)
        const final=events.at(-1)
        check(final?.t==='done'&&final.reason==='stop'&&!events.some(event=>event.t==='error'),JSON.stringify(events.filter(event=>event.t==='error'||event.t==='done')))
        check(JSON.stringify(events).includes('TERVELL_REAL_FINAL_OK'),'没有最终回答')
        check(readFileSync(join(cwd,'kernel-output.txt'),'utf8').trim()==='TERVELL_FILE_WRITTEN','模型工具未实际写入文件')
        const second=await collect(randomUUID(),'Reply again using the final marker, without tools.')
        const secondFinal=second.at(-1)
        check(secondFinal?.t==='done'&&secondFinal.reason==='stop'&&!second.some(event=>event.t==='error'),'第二轮未正常完成')
        current.held=true
        const controller=new AbortController(),before=current.calls
        let earlyEvents:KernelEvent[]|undefined
        const cancelled=collect(randomUUID(),'Wait for the controlled pending response.',controller.signal).then(events=>{earlyEvents=events;writeJsonFileAtomic(join(root,id+'-cancel-events.json'),events);return events})
        const deadline=Date.now()+20000;while(current.calls===before&&!earlyEvents&&Date.now()<deadline)await new Promise(done=>setTimeout(done,25))
        if(current.calls===before){controller.abort();await cancelled;throw Error('取消回归没有进入真实模型请求：'+JSON.stringify(earlyEvents))}
        controller.abort()
        const cancelledEvents=await cancelled,cancelFinal=cancelledEvents.at(-1);check(cancelFinal?.t==='done'&&cancelFinal.reason==='cancelled','取消未收敛到终态')
        await kernel.close(handle);handle=undefined
        results.push({id,ok:true,verification,tools:true,toolKinds:current.requests.some(request=>request.tools.some(name=>['exec_command','run_shell_command','run_terminal_command','Bash','bash','run_command','run_commands','terminal','shell','powershell','pwsh','PowerShell'].includes(name)))?['shell','file-write']:['file-read','file-write'],secondTurn:true,cancel:true,closed:true,approvals,reverseRequests,mode:manualMode??mode?.currentValue,requests:current.requests,elapsedMs:Date.now()-started})
      }catch(error){results.push({id,ok:false,error:String(error),upstream:current,elapsedMs:Date.now()-started});console.log('FAILURE_DETAIL',id,JSON.stringify({error:String(error),stage:current.stage,calls:current.calls,toolResults:current.toolResults.map(value=>value.slice(0,800))}));for(const line of String(error).split('\n'))console.log('FAILURE_LINE',id,line)}
      finally{if(kernel&&handle)await kernel.close(handle).catch(error=>console.error('CLOSE',id,String(error)));console.log('RESULT',JSON.stringify(results.at(-1)));writeJsonFileAtomic(join(root,'dialogue-report.json'),{platform:process.platform,arch:process.arch,results})}
    }
  }finally{
    routing.stopModelRouting();server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()))
    const evidence=process.env.TERVELL_QA_EVIDENCE_DIR
    if(evidence){mkdirSync(evidence,{recursive:true});for(const file of readdirSync(root)){if(/(?:-tools\.json|-events\.json|-classification\.json|-request-\d+\.json|-local-trace\.jsonl|-processes\.jsonl|-stacks\.txt|^dialogue-report\.json)$/.test(file))copyFileSync(join(root,file),join(evidence,file))}}
  }
  console.log('EVIDENCE',root)
  if(results.some(result=>!result.ok))throw Error('真实内核工具/对话/取消回归存在失败，禁止宣称完整通过')
}
app.whenReady().then(run).then(()=>app.exit(0)).catch(error=>{console.error(error);app.exit(1)})
