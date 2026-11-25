import {test,expect} from 'bun:test'
import {mkdtempSync,writeFileSync,readFileSync,symlinkSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {ToolGate} from './gate.ts'
import {GatedFiles} from './files.ts'
import {PathBoundary} from './boundary.ts'
import {GatedTerminals, resolveAcpTerminalCommand,acpTerminalWindowsArguments} from './terminal.ts'
import type {GateOptions} from './gate.ts'
const options=(id='s1'):GateOptions=>({context:{sessionId:id,workspaceId:'w1',permission:{mode:'ask',plan:false},triggeredBy:'user'},signal:new AbortController().signal,authorize:async()=> 'allow-session'})
test('Given ACP字符串命令和独立argv When 解析跨平台终端 Then 仅字符串命令使用显式shell且保留参数',()=>{
 expect(resolveAcpTerminalCommand('printf "one"; pwd',[],'darwin')).toEqual({command:'/bin/sh',args:['-c','printf "one"; pwd']})
 expect(resolveAcpTerminalCommand('echo hello',[],'win32',{ComSpec:'C:\\Windows\\System32\\cmd.exe'})).toEqual({command:'C:\\Windows\\System32\\cmd.exe',args:['/d','/s','/c','echo hello']})
 expect(resolveAcpTerminalCommand('node',['-e','console.log("a b")'],'win32')).toEqual({command:'node',args:['-e','console.log("a b")']})
})
test('Given cmd.exe接收含双引号的脚本 When 启动终端 Then 使用cmd原生参数规则而非C argv反斜杠转义',()=>{
 const script=`node -e "require('node:fs').writeFileSync('quoted result.txt','TERVELL_QUOTE_OK')"`
 expect(acpTerminalWindowsArguments('C:\\Windows\\System32\\cmd.exe',['/d','/s','/c',script],'win32')).toEqual({args:['/d','/s','/c','"'+script+'"'],windowsVerbatimArguments:true})
 expect(acpTerminalWindowsArguments('node.exe',['-e',script],'win32')).toEqual({args:['-e',script]});expect(acpTerminalWindowsArguments('/bin/sh',['-c',script],'darwin')).toEqual({args:['-c',script]})
})
test.skipIf(process.platform!=='win32')('Given Windows完整命令包含引号和空格文件名 When 经ACP终端真实执行 Then 文件内容正确而不只是退出0',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-cmd-quotes-')),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate())
 try{const script=`node -e "require('node:fs').writeFileSync('quoted result.txt','TERVELL_QUOTE_OK')"`;const id=await terminal.create({command:script,args:[],cwd:root,env:[]},options());expect(await terminal.wait(id,new AbortController().signal)).toEqual({exitCode:0});expect(readFileSync(join(root,'quoted result.txt'),'utf8')).toBe('TERVELL_QUOTE_OK');await terminal.release(id)}finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})
test('Given ACP完整多行命令和大于宿主预算的输出请求 When 执行 Then 真正执行且输出仍有界',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-acp-string-')),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate())
 try{
  const command=process.platform==='win32'?'echo ACP_STRING_OK & echo SECOND_LINE':'printf ACP_STRING_OK\nprintf SECOND_LINE'
  const id=await terminal.create({command,args:[],cwd:root,env:[],outputByteLimit:8*1024*1024},options())
  expect(await terminal.wait(id,new AbortController().signal)).toEqual({exitCode:0});expect(terminal.output(id).output).toContain('ACP_STRING_OK');expect(terminal.output(id).output).toContain('SECOND_LINE');await terminal.release(id)
 }finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})
test('Given 统一审批 When 批准一次/会话/拒绝 Then 精确输入授权且跨会话不复用',async()=>{
 const gate=new ToolGate();let asks=0;const opts={...options(),authorize:async()=>{asks++;return 'allow-session' as const}}
 for(let i=0;i<2;i++)await gate.run({name:'Write',kind:'edit',effect:'write'},{file:'a'},opts,()=>1)
 expect(asks).toBe(1)
 await gate.run({name:'Write',kind:'edit',effect:'write'},{file:'b'},opts,()=>1);expect(asks).toBe(2)
 await expect(gate.run({name:'Write',kind:'edit',effect:'write'},{file:'a'},{...options('s2'),authorize:async()=>false},()=>1)).rejects.toThrow('拒绝')
 gate.clearSession('s1');await gate.run({name:'Write',kind:'edit',effect:'write'},{file:'a'},opts,()=>1);expect(asks).toBe(3)
 expect(JSON.stringify(gate.audit())).not.toContain('"file"');expect(gate.audit().some(e=>e.outcome==='deny')).toBe(true)
})
test('Given 危险命令与只读plan When 执行 Then 审批不能覆盖拒绝',async()=>{
 const gate=new ToolGate();let calls=0
 for(const command of ['rm -rf .','git push --force','sudo sh'])await expect(gate.run({name:'execute',kind:'execute',effect:'write',command},{command},options(),()=>++calls)).rejects.toThrow('拒绝')
 for(const plan of [false,true])await expect(gate.run({name:'Write',kind:'edit',effect:'write'},{},{...options(),context:{...options().context,permission:{mode:'read-only',plan}}},()=>++calls)).rejects.toThrow('拒绝')
 expect(calls).toBe(0)
})
test('Given fs实际回调 When 读写/越界/符号链接 Then 只操作授权根',async()=>{
 const root=mkdtempSync(join(tmpdir(),'w7-fs-')),outside=mkdtempSync(join(tmpdir(),'w7-out-'))
 try{
  writeFileSync(join(root,'a.txt'),'一\n二\n三');writeFileSync(join(outside,'private'),'秘密');symlinkSync(outside,join(root,'link'))
  const gate=new ToolGate(),files=new GatedFiles(new PathBoundary({cwd:root},()=>{}),gate)
  expect(await files.read('a.txt',options(),2,1)).toBe('二')
  await files.write('new.txt','新内容',options());expect(readFileSync(join(root,'new.txt'),'utf8')).toBe('新内容')
  await expect(files.read('../private',options())).rejects.toThrow()
  await expect(files.read('link/private',options())).rejects.toThrow()
  await expect(files.write(join(outside,'private'),'不得写入',options())).rejects.toThrow()
  expect(readFileSync(join(outside,'private'),'utf8')).toBe('秘密')
 }finally{rmSync(root,{recursive:true,force:true});rmSync(outside,{recursive:true,force:true})}
})
test('Given 终端shell:false When 输出/退出/跨句柄/危险命令 Then 状态真实并回收',async()=>{
 const root=mkdtempSync(join(tmpdir(),'w7-term-'));const terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate())
 try{
  const id=await terminal.create({command:process.execPath,args:['-e',"console.log('W7');process.exit(7)"],cwd:root,env:[]},options())
  expect(await terminal.wait(id,new AbortController().signal)).toEqual({exitCode:7});expect(terminal.output(id).output).toContain('W7')
  expect(()=>terminal.output('foreign')).toThrow('此会话')
  await expect(terminal.create({command:'rm',args:['-rf','.'],cwd:root,env:[]},options())).rejects.toThrow('拒绝')
  await terminal.release(id);expect(()=>terminal.output(id)).toThrow()
 }finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})

test('Given ACP携带非空环境 When 批准真实终端 Then 环境可用且连续释放超过8次不耗尽句柄',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-terminal-env-')),gate=new ToolGate(),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),gate,{TERVELL_PARENT:'继承环境'});let approvals=0;const inputs:unknown[]=[];
 try{
  for(let i=0;i<12;i++){
   const id=await terminal.create({command:process.execPath,args:['-e',"process.stdout.write(process.env.TERVELL_PARENT+'|'+process.env.TERVELL_CHILD)"],cwd:root,env:[{name:'TERVELL_CHILD',value:'仅此命令'+i}]},{...options(),authorize:async request=>{approvals++;inputs.push(request.input);return true}});
   expect(await terminal.wait(id,new AbortController().signal)).toEqual({exitCode:0});expect(terminal.output(id).output).toBe('继承环境|仅此命令'+i);await terminal.release(id);
  }
  expect(approvals).toBe(12);expect(JSON.stringify(inputs)).not.toContain('仅此命令');expect(JSON.stringify(gate.audit())).not.toContain('仅此命令');
  await expect(terminal.create({command:process.execPath,args:[],cwd:root,env:[{name:'INVALID=NAME',value:'x'}]},options())).rejects.toThrow('环境变量');
  await expect(terminal.create({command:process.execPath,args:[],cwd:root,env:[{name:'OK',value:'x\0y'}]},options())).rejects.toThrow('环境变量');
  await expect(terminal.create({command:process.execPath,args:['-e',''],cwd:root,env:[{name:'TERVELL_CHILD',value:'blocked'}]},{...options(),context:{...options().context,permission:{mode:'read-only',plan:true}}})).rejects.toThrow('拒绝');
 }finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})

test('Given 没有空格的复合shell命令 When ACP不带args Then 按完整命令执行而不是查找同名程序',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-shell-operators-')),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate())
 try{const id=await terminal.create({command:'echo>created.txt',args:[],cwd:root,env:[]},options());expect(await terminal.wait(id,new AbortController().signal)).toEqual({exitCode:0});expect((await import('node:fs')).existsSync(join(root,'created.txt'))).toBe(true);await terminal.release(id)}finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})

test.skipIf(process.platform==='win32')('Given 根shell退出但同组后台子进程仍存活 When release Then 后台子进程也退出',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-terminal-descendant-')),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate());let pid=0
 try{const id=await terminal.create({command:process.execPath,args:['-e',"const cp=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});console.log(cp.pid);cp.unref()"],cwd:root,env:[]},options());await terminal.wait(id,new AbortController().signal);pid=Number(terminal.output(id).output.trim());expect(pid).toBeGreaterThan(0);expect(()=>process.kill(pid,0)).not.toThrow();await terminal.release(id);let exited=false;for(let i=0;i<50&&!exited;i++){try{process.kill(pid,0);await Bun.sleep(10)}catch{exited=true}}expect(exited).toBe(true)}finally{if(pid)try{process.kill(pid,'SIGKILL')}catch{/* 已退出 */}await terminal.close();rmSync(root,{recursive:true,force:true})}
})

test('Given 环境改变相同的只读命令 When 用户拒绝新环境 Then 不因旧命令白名单自动执行',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-terminal-grant-')),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate());let asks=0;
 const opts={...options(),authorize:async()=>{asks++;return asks===1?'allow-session' as const:'deny' as const}};
 try{const id=await terminal.create({command:process.execPath,args:['--version'],cwd:root,env:[{name:'TERVELL_TEST',value:'first'}]},opts);await terminal.wait(id,opts.signal);await terminal.release(id);await expect(terminal.create({command:process.execPath,args:['--version'],cwd:root,env:[{name:'TERVELL_TEST',value:'changed'}]},opts)).rejects.toThrow('拒绝');expect(asks).toBe(2)}finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})

test('Given 等待审批时取消 When 审批迟到 Then 无副作用且审计为cancelled',async()=>{
 const gate=new ToolGate(),stop=new AbortController();let run=0,entered=()=>{}
 const waiting=new Promise<void>(r=>{entered=r})
 const pending=gate.run({name:'Write',kind:'edit',effect:'write'},{secret:'不应出现在日志'}, {...options(),signal:stop.signal,authorize:async()=>{entered();return new Promise<boolean>(()=>{})}},()=>++run)
 await waiting;stop.abort();await expect(pending).rejects.toThrow('取消');expect(run).toBe(0)
 expect(gate.audit().at(-1)?.outcome).toBe('cancelled');expect(JSON.stringify(gate.audit())).not.toContain('不应出现在日志')
})
test('Given 终端持续运行 When 取消/关闭 Then 子进程退出且输出截断不破坏UTF8',async()=>{
 const root=mkdtempSync(join(tmpdir(),'w7-stop-')),terminal=new GatedTerminals(new PathBoundary({cwd:root},()=>{}),new ToolGate()),stop=new AbortController()
 try{
  const id=await terminal.create({command:process.execPath,args:['-e',"console.log(process.pid);setInterval(()=>{},1000)"],cwd:root,env:[]},{...options(),signal:stop.signal})
  let pid=0;for(let i=0;i<30&&!pid;i++){pid=Number(terminal.output(id).output.trim());if(!pid)await Bun.sleep(10)}
  expect(pid).toBeGreaterThan(0);stop.abort();await terminal.wait(id,new AbortController().signal)
  expect(()=>process.kill(pid,0)).toThrow()
  const unicode=await terminal.create({command:process.execPath,args:['-e',"process.stdout.write('😀😀😀')"],cwd:root,env:[],outputByteLimit:5},options())
  await terminal.wait(unicode,new AbortController().signal);expect(terminal.output(unicode)).toMatchObject({output:'😀',truncated:true})
 }finally{await terminal.close();rmSync(root,{recursive:true,force:true})}
})

test('Given 会话结束清理 When 原审批随后允许 Then 不恢复已结束会话的执行授权',async()=>{
 const gate=new ToolGate();let decide:(v:'allow-session')=>void=()=>{},entered=()=>{},ran=false
 const ready=new Promise<void>(r=>{entered=r})
 const pending=gate.run({name:'Write',kind:'edit',effect:'write'},{}, {...options(),authorize:async()=>{entered();return new Promise<'allow-session'>(r=>{decide=r})}},()=>{ran=true})
 await ready;gate.clearSession('s1');decide('allow-session');await expect(pending).rejects.toThrow('关闭');expect(ran).toBe(false)
})

test('Given 仅批准一次和PowerShell When 重复输入 Then 不意外形成工具级白名单',async()=>{
 const gate=new ToolGate();let asks=0
 const once={...options(),authorize:async()=>{asks++;return 'allow-once' as const}}
 for(let i=0;i<2;i++)await gate.run({name:'Write',kind:'edit',effect:'write'},{path:'a'},once,()=>{})
 expect(asks).toBe(2)
 const session={...options(),authorize:async()=>{asks++;return 'allow-session' as const}}
 for(let i=0;i<2;i++)await gate.run({name:'PowerShell',kind:'execute',effect:'write',command:'Get-Date'},{command:'Get-Date'},session,()=>{})
 expect(asks).toBe(4)
})
