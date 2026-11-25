import {test,expect} from 'bun:test'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,delimiter} from 'node:path'
import {checkCommand,executableCandidates,mapLimited} from '../apps/electron/src/main/lib/desktop-cli-discovery'
import {buildCliInstallScript,CLI_INSTALL_RECIPES,quoteShell} from '../apps/electron/src/main/lib/desktop-cli-recipes'
import {cliProcessEnvironment} from '../apps/electron/src/main/lib/desktop-cli-environment'
import {DesktopCliInstallJob} from '../apps/electron/src/main/lib/desktop-cli-install-job'
const wait=async(check:()=>boolean):Promise<void>=>{for(let i=0;i<100;i++){if(check())return;await Bun.sleep(5)}throw new Error('等待状态超时')}
test('Given PATH 前面有失效 shim When 自动检测 Then 跳过失效项并返回可运行的版本',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-detect-'))
 try{const a=join(root,'a'),b=join(root,'b');mkdirSync(a);mkdirSync(b);writeFileSync(join(a,'qa-cli'),'#!/missing/interpreter\n',{mode:0o755});writeFileSync(join(b,'qa-cli'),'#!/bin/sh\necho qa-cli-1.0\n',{mode:0o755});expect((await checkCommand('qa-cli',[a,b].join(delimiter),true)).path).toBe(join(b,'qa-cli'));expect((await checkCommand('qa-cli',b,true)).version).toBe('qa-cli-1.0');expect(executableCandidates(root,b)).toEqual([])}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 自定义CLI When 后台检测 Then 不执行自定义命令，新增命令无需重启可发现',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-custom-'))
 try{expect((await checkCommand('qa-cli',root,false)).path).toBeUndefined();const flag=join(root,'executed');writeFileSync(join(root,'qa-cli'),`#!/bin/sh\ntouch '${flag}'\n`,{mode:0o755});expect((await checkCommand('qa-cli',root,false)).path).toBe(join(root,'qa-cli'));expect(await Bun.file(flag).exists()).toBe(false)}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 很慢的CLI与多个候选 When 探测 Then 超时有界且并发不超过四个',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-timeout-'))
 try{writeFileSync(join(root,'slow'),'#!/bin/sh\nexec sleep 10\n',{mode:0o755});const start=Date.now();expect((await checkCommand('slow',root,true,50)).path).toBeUndefined();expect(Date.now()-start).toBeLessThan(2000);let active=0,max=0;await mapLimited([1,2,3,4,5,6],4,async n=>{active++;max=Math.max(max,active);await Bun.sleep(5);active--;return n});expect(max).toBe(4)}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 安装配方 When 构建脚本 Then 固定来源校验运行时且目录参数不能注入命令',()=>{
 const script=buildCliInstallScript('codex',"/tmp/with 'quote $(touch /tmp/should-not-exist)",'arm64')
 expect(script).toContain('@agentclientprotocol/codex-acp@2.8.0');expect(script).not.toContain('@zed-industries');expect(script).toContain('shasum -a 256 -c');expect(script).toContain(quoteShell("/tmp/with 'quote $(touch /tmp/should-not-exist)/cli-runtime"));expect(script).toContain('BUN_INSTALL_GLOBAL_DIR');expect(script).not.toContain('sudo');expect(()=>buildCliInstallScript('toString','/tmp','arm64')).toThrow();expect(()=>buildCliInstallScript('codex','/tmp','ia32')).toThrow();expect(Object.keys(CLI_INSTALL_RECIPES).length).toBeGreaterThanOrEqual(8)
})
test('Given 点击安装与双击 When 终端结束 Then 只运行一次并自动复检且推送成功',async()=>{
 let finish!:(n:number)=>void,runs=0,verified=0;const phases:string[]=[]
 const service=new DesktopCliInstallJob({run:async(_j,output)=>{runs++;output('installing\r\n');return{exit:new Promise<number>(r=>{finish=r}),cancel:()=>finish(130)}},verify:async()=>{verified++;return true},changed:j=>phases.push(j.phase)})
 const first=service.start('codex');expect(service.start('codex').id).toBe(first.id);expect(()=>service.start('gemini')).toThrow();await wait(()=>!!finish);finish(0);await wait(()=>service.state()?.phase==='succeeded');expect(runs).toBe(1);expect(verified).toBe(1);expect(phases).toContain('verifying');expect(service.state()?.output).toContain('installing')
})
test('Given 安装退出0但命令缺失 When 复检 Then 显示失败而不是已安装且支持重试',async()=>{
 let ready=false,runs=0;const service=new DesktopCliInstallJob({run:async()=>{runs++;return{exit:Promise.resolve(0),cancel:()=>{}}},verify:async()=>ready,changed:()=>{}})
 service.start('codex');await wait(()=>service.state()?.phase==='failed');expect(service.state()?.error).toContain('未通过检查');ready=true;service.start('codex');await wait(()=>service.state()?.phase==='succeeded');expect(runs).toBe(2)
})
test('Given 安装启动或复检期间取消 When 迟到结果返回 Then 不恢复成功或运行旧回调',async()=>{
 let launch!:(v:{exit:Promise<number>;cancel:()=>void})=>void,cancels=0;const service=new DesktopCliInstallJob({run:()=>new Promise(r=>{launch=r}),verify:async()=>true,changed:()=>{}})
 const first=service.start('codex');service.cancel(first.id);launch({exit:Promise.resolve(0),cancel:()=>{cancels++}});await Bun.sleep(10);expect(service.state()?.phase).toBe('cancelled');expect(cancels).toBe(1)
 let checked!:(v:boolean)=>void,sig:AbortSignal|undefined;const second=new DesktopCliInstallJob({run:async()=>({exit:Promise.resolve(0),cancel:()=>{}}),verify:async(_id,signal)=>{sig=signal;return new Promise(r=>{checked=r})},changed:()=>{}})
 const job=second.start('codex');await wait(()=>second.state()?.phase==='verifying');second.cancel(job.id);expect(sig?.aborted).toBe(true);checked(true);await Bun.sleep(10);expect(second.state()?.phase).toBe('cancelled')
})

test('Given 显式验收profile When 启动CLI Then 账号目录和环境密钥隔离且正常用户保留自有登录环境',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-cli-home-')),previous=process.env.OPENAI_API_KEY
 process.env.OPENAI_API_KEY=['fixture','credential','only'].join('-')
 try{const env=cliProcessEnvironment('/usr/bin:/bin',root);expect(env.HOME).toBe(join(root,'cli-home'));expect(env.CODEX_HOME).toBe(join(root,'cli-home/.codex'));expect(env.CLAUDE_CONFIG_DIR).toBe(join(root,'cli-home/.claude'));expect(env.OPENAI_API_KEY).toBeUndefined();expect(env.PATH).toBe('/usr/bin:/bin');expect(env.PYTHONUTF8).toBe('1');expect(env.PYTHONIOENCODING).toBe('utf-8');expect(env).not.toHaveProperty('ANTHROPIC_API_KEY');if(process.platform==='win32'){expect(env.APPDATA).toBe(join(root,'cli-home/AppData/Roaming'));expect(env.LOCALAPPDATA).toBe(join(root,'cli-home/AppData/Local'));expect(env.TEMP).toBe(join(root,'cli-home/AppData/Local/Temp'));expect(env.TMP).toBe(env.TEMP)}}finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;rmSync(root,{recursive:true,force:true})}
})
