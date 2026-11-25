import{test,expect}from'bun:test';
import{mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync,symlinkSync}from'node:fs';
import{tmpdir}from'node:os';import{join}from'node:path';
import{create}from'tar';import AdmZip from'adm-zip';
import{ACP_REGISTRY_AGENTS,registryPlatform,registryAgent}from'@proma/kernel-host';
import{cliInstallPlan,cliInstallUnavailable}from'../apps/electron/src/main/lib/desktop-cli-install-plan';
import{extractCliArchive,safeCliArchivePath}from'../apps/electron/src/main/lib/desktop-cli-archive';
import{mergeKernelDefaults,saveKernelPreferences,kernelPreferences,defaultSessionKernelSelection}from'../apps/electron/src/main/lib/desktop-kernel-preferences';
import{KernelProbeQueue}from'../apps/electron/src/main/lib/desktop-kernel-probe-queue';
import{spawnSync}from'node:child_process';
test('Given 多处同时读取内核配置 When 排队探测 Then 相同请求合并且所有CLI串行并在失败后继续',async()=>{
 const queue=new KernelProbeQueue();let active=0,max=0,runs=0;
 const work=async()=>{active++;max=Math.max(max,active);runs++;await Bun.sleep(5);active--;return runs};
 const first=queue.run('same',work),second=queue.run('same',work);expect(first).toBe(second);
 const next=queue.run('next',work);await Promise.all([first,second,next]);expect(runs).toBe(2);expect(max).toBe(1);
 await expect(queue.run('failure',async()=>{throw Error('fixture failure')})).rejects.toThrow('fixture failure');expect(await queue.run('after',async()=>3)).toBe(3);
})
test('Given 固定ACP官方目录 When 匹配三平台 Then 每个发行物有安装计划且不把不兼容架构冒充可用',()=>{
 for(const platform of ['darwin','win32','linux'])for(const arch of ['x64','arm64'])for(const agent of ACP_REGISTRY_AGENTS.filter(a=>a.id!=='kimi')){
  const offered=agent.id==='crow-cli'||!!agent.distribution.npx||!!agent.distribution.uvx||!!agent.distribution.binary?.[registryPlatform(platform,arch)];
  const aliases:Record<string,string>={'codex-acp':'codex','claude-acp':'claude','amp-acp':'amp','antigravity-acp':'antigravity','codebuddy-code':'codebuddy','factory-droid':'droid','grok-build':'grok','github-copilot-cli':'copilot','kimi-code':'kimi','minimax-code':'mcode','qwen-code':'qwen','opencode-v2':'opencode2','muse-code':'muse'};
  const plan=cliInstallPlan(aliases[agent.id]??agent.id,platform,arch);expect(!!plan).toBe(offered);
  if(plan?.kind==='binary')expect(new URL(plan.binary!.archive).protocol).toBe('https:');
 }
 expect(cliInstallPlan('codex','win32','x64')?.packages).toContain('@agentclientprotocol/codex-acp@2.10.0');
 expect(cliInstallPlan('toString')).toBeUndefined();expect(cliInstallUnavailable('kiro','win32','x64')).toContain('官方当前未发布');
});
test('Given 归档包含普通文件与内部链接 When 私有目录解压 Then 内容保真且拒绝路径越界和链接目录写入',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-cli-archive-'));try{const source=join(root,'source');mkdirSync(source);mkdirSync(join(source,'nested'));writeFileSync(join(source,'nested/agent'),'hello中文',{mode:0o700});symlinkSync('nested/agent',join(source,'agent'));const archive=join(root,'good.tar.gz');await create({cwd:source,file:archive,gzip:true},['nested','agent']);await extractCliArchive(archive,join(root,'out'),new AbortController().signal);expect(readFileSync(join(root,'out/agent'),'utf8')).toBe('hello中文');
 const zip=new AdmZip();zip.addFile('agent.exe',Buffer.from('MZfixture'));const file=join(root,'good.zip');zip.writeZip(file);await extractCliArchive(file,join(root,'zip-out'),new AbortController().signal);expect(readFileSync(join(root,'zip-out/agent.exe'),'utf8')).toBe('MZfixture');
 if(process.platform!=='win32'){const plain=join(root,'plain.tar');await create({cwd:source,file:plain},['nested']);const compressed=spawnSync('/usr/bin/bzip2',['-c',plain]);if(compressed.status===0){const bz=join(root,'agent.tar.bz2');writeFileSync(bz,compressed.stdout);await extractCliArchive(bz,join(root,'bz-out'),new AbortController().signal);expect(readFileSync(join(root,'bz-out/nested/agent'),'utf8')).toBe('hello中文');}}
 const withRoot=join(root,'root.tar');await create({cwd:source,file:withRoot},['./']);await extractCliArchive(withRoot,join(root,'root-out'),new AbortController().signal);expect(readFileSync(join(root,'root-out/nested/agent'),'utf8')).toBe('hello中文');
 for(const name of ['../outside','a/../../outside','C:\\outside','/absolute','a\\..\\outside'])expect(safeCliArchivePath(name)).toBe(false);
 const abort=new AbortController();abort.abort();await expect(extractCliArchive(archive,join(root,'cancelled'),abort.signal)).rejects.toThrow();
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Given 全局与项目模型偏好 When 新会话继承 Then 按类型保留并且跨模型不继承旧特殊选项',()=>{
 expect(mergeKernelDefaults({modelId:'small',modeId:'review',configValues:{speed:'normal',budget:1000},autoApprove:false},{modelId:'large',configValues:{reasoning:'ultra'}})).toEqual({modelId:'large',modeId:'review',configValues:{reasoning:'ultra'},autoApprove:false});
 const root=mkdtempSync(join(tmpdir(),'tervell-kernel-pref-')),previous=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root;try{mkdirSync(join(root,'config'));saveKernelPreferences('codex',undefined,{modelId:'a',modeId:'read-only',configValues:{fast:false,budget:1200}});saveKernelPreferences('codex','project-a',{modeId:'agent',configValues:{fast:true}});expect(defaultSessionKernelSelection('codex','project-a')).toEqual({kernelId:'codex',modelId:'a',modeId:'agent',configValues:{fast:true,budget:1200}});expect(kernelPreferences('codex','project-b').effective.modeId).toBe('read-only');expect(()=>saveKernelPreferences('codex',undefined,{configValues:{secret:null}})).toThrow();}finally{if(previous===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=previous;rmSync(root,{recursive:true,force:true});}
});

test('Given 同时有 Node 和 Bun 内核 When 按已装包选择运行时 Then OMP使用Bun且DSH不再被Node22启动',async()=>{
 const {cliPackageRuntime,cliPackageBin}=await import('../apps/electron/src/main/lib/desktop-cli-runtime-choice');
 expect(cliPackageRuntime({engines:{bun:'>=1.4.4'}},'24.22.3','1.4.4','#!/usr/bin/env node')).toBe('bun');
 expect(cliPackageRuntime({engines:{node:'>=24.9.0'}},'24.22.3','1.4.4','#!/usr/bin/env node')).toBe('node');
 expect(()=>cliPackageRuntime({engines:{node:'>=24.9.0'}},'22.23.5','1.4.4','')).toThrow('Node >=24.9.0');
 expect(cliPackageBin({bin:{actual:'dist/cli.js'}},'upstream','old-name')).toBe('dist/cli.js');
 expect(()=>cliPackageBin({bin:{first:'a',second:'b'}},'upstream')).toThrow('多个启动入口');
});

test('Given 根包postinstall验证其原生依赖 When 安装生命周期 Then 先准备依赖再验证主程序且不执行未授权脚本',async()=>{
 const {trustedCliLifecycle}=await import('../apps/electron/src/main/lib/desktop-cli-lifecycle');const root=mkdtempSync(join(tmpdir(),'tervell-cli-hooks-'));
 const manifest=(name:string,data:object)=>{const path=join(root,'node_modules',name);mkdirSync(path,{recursive:true});writeFileSync(join(path,'package.json'),JSON.stringify({name,version:'1.0.0',...data}));};
 try{manifest('adapter',{dependencies:{native:'1.0.0'},scripts:{postinstall:'verify'}});manifest('native',{scripts:{install:'prepare'}});manifest('untrusted',{scripts:{postinstall:'must-not-run'}});expect(trustedCliLifecycle(root,['adapter','native']).map(row=>[row.name,row.hook])).toEqual([['native','install'],['adapter','postinstall']]);}finally{rmSync(root,{recursive:true,force:true})}
});
test('Given Windows由Bun安装Pi ACP及CLI When 选择启动入口 Then 使用实际pi.exe而非假设pi.cmd且不使用外部PATH',async()=>{
 const{cliDependencyEnvironment}=await import('../apps/electron/src/main/lib/desktop-cli-runtime-choice');const root=mkdtempSync(join(tmpdir(),'tervell-pi-dependency-'))
 try{const bin=join(root,'node_modules/.bin');mkdirSync(bin,{recursive:true});expect(()=>cliDependencyEnvironment('pi-acp',root,'win32')).toThrow('依赖入口缺失');writeFileSync(join(bin,'pi.exe'),'fixture');expect(cliDependencyEnvironment('pi-acp',root,'win32')).toEqual({PI_ACP_PI_COMMAND:join(bin,'pi.exe')});expect(cliDependencyEnvironment('codex',root,'win32')).toEqual({});writeFileSync(join(bin,'pi'),'fixture');expect(cliDependencyEnvironment('pi-acp',root,'darwin')).toEqual({PI_ACP_PI_COMMAND:join(bin,'pi')})}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given Windows ACP没有交互终端UI When 启动Gemini Then 使用CLI声明的管道后端且其他平台保留默认',async()=>{
 const{cliDependencyEnvironment}=await import('../apps/electron/src/main/lib/desktop-cli-runtime-choice');expect(cliDependencyEnvironment('gemini','/fixture/only','win32')).toEqual({GEMINI_PTY_INFO:'child_process'});expect(cliDependencyEnvironment('gemini','/fixture/only','darwin')).toEqual({})
})

test('Given 本地旧目录和新官方ACP发行元数据冲突 When 解析内核 Then 使用实际包bin和官方参数',async()=>{
 const{KernelRegistry}=await import('@proma/kernel-host');const registry=new KernelRegistry();
 expect(registry.get('dsh')?.cli).toBe('dsh');expect(registry.get('dsh')?.acp?.args).toEqual(['--profile','acp']);
 expect(registry.get('kilocode')?.tier).toBe('acp-native');expect(registry.get('kilocode')?.acp?.command).toBe('kilo');
 expect(cliInstallPlan('mcode')?.bin).toBe('code-acp');expect(registry.get('copilot')?.acp?.args).toEqual(['--acp']);
 expect(cliInstallPlan('deepagents')?.packages).toContain('@langchain/openai@1.4.1');expect(cliInstallPlan('deepagents')?.packages).toContain('@langchain/anthropic@1.3.26');
 expect(cliInstallPlan('pi-acp')?.packages).toContain('@earendil-works/pi-coding-agent@0.87.1');
 expect(cliInstallPlan('crow-cli')?.packages).toContain('crow-cli==0.1.50');
 expect(cliInstallPlan('hermes')?.packages).toContain('hermes-agent[acp]==0.19.0');
 expect(registry.get('deepseek')?.acp?.args).toEqual(['--profile','acp']);expect(registry.get('glm-acp-agent')?.name).toContain('社区');expect(registry.get('deepagents')?.name).toContain('LangChain');
})

test('Given macOS安装目录具有var/private别名 When 受管入口是真实路径 Then 识别同一个安装且拒绝目录外入口',async()=>{
 const{writeManagedCli,readManagedCli,managedCliRoot}=await import('../apps/electron/src/main/lib/desktop-cli-managed');const{realpathSync}=await import('node:fs');const root=mkdtempSync(join(tmpdir(),'tervell-managed-path-')),before=process.env.TERVELL_PROFILE_DIR;process.env.TERVELL_PROFILE_DIR=root
 try{const directory=join(managedCliRoot(),'fixture','versions','test');mkdirSync(directory,{recursive:true});writeFileSync(join(directory,'agent'),'fixture');writeManagedCli({version:1,id:'fixture',command:realpathSync(join(directory,'agent')),args:[],env:{},installedVersion:'1',directory,source:'fixture',cliSelfContained:true});expect(readManagedCli('fixture')?.command).toBe(realpathSync(join(directory,'agent')));writeFileSync(join(root,'outside'),'outside');writeManagedCli({version:1,id:'outside',command:join(root,'outside'),args:[],env:{},installedVersion:'1',directory,source:'fixture',cliSelfContained:true});expect(readManagedCli('outside')).toBeUndefined()}finally{if(before===undefined)delete process.env.TERVELL_PROFILE_DIR;else process.env.TERVELL_PROFILE_DIR=before;rmSync(root,{recursive:true,force:true})}
})

test('Given 嵌套依赖有同名不同版本 When 执行获准生命周期 Then 各版本先于实际依赖它的根包执行',async()=>{
 const{trustedCliLifecycle}=await import('../apps/electron/src/main/lib/desktop-cli-lifecycle');const root=mkdtempSync(join(tmpdir(),'tervell-nested-hooks-'))
 const put=(path:string,name:string,version:string,dependencies:Record<string,string>={})=>{mkdirSync(path,{recursive:true});writeFileSync(join(path,'package.json'),JSON.stringify({name,version,dependencies,scripts:{postinstall:'fixture-only'}}))}
 try{put(join(root,'node_modules','a'),'a','1.0.0',{native:'1'});put(join(root,'node_modules','native'),'native','1.0.0');put(join(root,'node_modules','b'),'b','1.0.0',{middle:'1'});put(join(root,'node_modules','b','node_modules','middle'),'middle','1.0.0',{native:'2'});put(join(root,'node_modules','b','node_modules','native'),'native','2.0.0');const steps=trustedCliLifecycle(root,['a','b','native']).map(row=>row.name+'@'+row.version);expect(steps.filter(row=>row.startsWith('native'))).toHaveLength(2);expect(steps.indexOf('native@1.0.0')).toBeLessThan(steps.indexOf('a@1.0.0'));expect(steps.indexOf('native@2.0.0')).toBeLessThan(steps.indexOf('b@1.0.0'));expect(steps.some(row=>row.startsWith('middle'))).toBe(false)}finally{rmSync(root,{recursive:true,force:true})}
})

test('Given GLM的session/new不验证凭据 When 创建前检查 Then 原生文件或显式环境有效否则提前进入网关接管',async()=>{
 const{assertKernelNativeAuthentication}=await import('../apps/electron/src/main/lib/kernel-native-auth');const root=mkdtempSync(join(tmpdir(),'tervell-native-auth-'))
 try{expect(()=>assertKernelNativeAuthentication('glm-acp-agent',{XDG_CONFIG_HOME:root})).toThrow('需要模型认证');expect(()=>assertKernelNativeAuthentication('glm-acp-agent',{Z_AI_API_KEY:'local-fixture'})).not.toThrow();mkdirSync(join(root,'glm-acp-agent'));writeFileSync(join(root,'glm-acp-agent/credentials.json'),JSON.stringify({z_ai_api_key:'local-fixture'}));expect(()=>assertKernelNativeAuthentication('glm-acp-agent',{XDG_CONFIG_HOME:root})).not.toThrow()}finally{rmSync(root,{recursive:true,force:true})}
})

test('Given 网关报告真实容量 When 为DSH生成ACP模型配置 Then 保留容量且不捏造未知模型的上限',async()=>{
 const{prepareKernelRouteAdapter}=await import('../apps/electron/src/main/lib/kernel-routing-adapters');const root=mkdtempSync(join(tmpdir(),'tervell-dsh-route-'))
 try{const first=prepareKernelRouteAdapter('dsh',root,'fixture/model','http://127.0.0.1:1234',{id:'fixture/model',name:'Fixture',contextWindow:65536,maxOutputTokens:8192,images:true});const data=JSON.parse(readFileSync(first.TERVELL_DSH_ACP_PATCH!,'utf8'));expect(data[0].config.providers.magpie.models[0]).toEqual({id:'fixture/model',contextWindow:65536,maxTokens:8192,input:['text','image']});const second=prepareKernelRouteAdapter('dsh',root,'fixture/unknown','http://127.0.0.1:1234');expect(JSON.parse(readFileSync(second.TERVELL_DSH_ACP_PATCH!,'utf8'))[0].config.providers.magpie.models[0]).toEqual({id:'fixture/unknown'})}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given Cline在Tervell会话中运行 When 接管模型和启动受管CLI Then 使用官方local后端避免派生无主hub且不改用户服务',async()=>{
 const{prepareKernelRouteAdapter}=await import('../apps/electron/src/main/lib/kernel-routing-adapters');const{cliDependencyEnvironment}=await import('../apps/electron/src/main/lib/desktop-cli-runtime-choice')
 expect(prepareKernelRouteAdapter('cline','/fixture/only','model','http://127.0.0.1:1')).toEqual({CLINE_SESSION_BACKEND_MODE:'local',CLINE_NO_AUTO_UPDATE:'1'});expect(cliDependencyEnvironment('cline','/fixture/only','win32')).toEqual({CLINE_SESSION_BACKEND_MODE:'local',CLINE_NO_AUTO_UPDATE:'1'})
})
test('Given ACP宿主保留stdin When Windows Bash启动探测需要读取输入 Then 子进程收到EOF且输出超时有界',async()=>{
 const {HERMES_BOUNDED_PROBE,applyManagedCliCompatibility}=await import('../apps/electron/src/main/lib/desktop-cli-compat')
 const python=process.platform==='win32'?'python':'/usr/bin/python3',root=mkdtempSync(join(tmpdir(),'tervell-bash-probe-'))
 try{
  const input=`import os, signal, subprocess, sys, tempfile, time\n_IS_WINDOWS = sys.platform == 'win32'\ndef windows_hide_flags(): return 0x08000000 if _IS_WINDOWS else 0\n${HERMES_BOUNDED_PROBE}\nr=_tervell_bounded_bash_probe([sys.executable,'-c',"import sys; print('EOF=' + str(sys.stdin.read() == ''))"],timeout=1)\nassert r.returncode == 0 and 'EOF=True' in r.stdout, r\nstart=time.monotonic()\nr=_tervell_bounded_bash_probe([sys.executable,'-c','import time; time.sleep(20)'],timeout=.1)\nassert r.returncode != 0 and time.monotonic()-start < 4, r\nprint('BOUNDED_PROBE_OK')\n`
  const result=spawnSync(python,['-c',input],{input:'ACP host pipe still open',encoding:'utf8',timeout:10000})
  expect(result.error).toBeUndefined();expect(result.status).toBe(0);expect(result.stdout).toContain('BOUNDED_PROBE_OK')
  expect(()=>applyManagedCliCompatibility('hermes',root,'0.19.0','darwin')).not.toThrow()
  const file=join(root,'py/hermes-agent/Lib/site-packages/tools/environments/local.py');mkdirSync(join(root,'py/hermes-agent/Lib/site-packages/tools/environments'),{recursive:true});writeFileSync(file,'unknown upstream source')
  expect(()=>applyManagedCliCompatibility('hermes',root,'0.19.0','win32')).toThrow('核验版本不同');expect(readFileSync(file,'utf8')).toBe('unknown upstream source')
 }finally{rmSync(root,{recursive:true,force:true})}
})
test('Given Grok npm发行物包含压缩原生入口 When 一键安装 Then 一次解压后直接启动同版本程序而不再按会话HOME解压',async()=>{
 const {managedNativeEntry}=await import('../apps/electron/src/main/lib/desktop-cli-native-entry'),{brotliCompressSync}=await import('node:zlib')
 const root=mkdtempSync(join(tmpdir(),'tervell-native-entry-')),source=join(root,'package/node_modules/@xai-official/grok-win32-x64')
 try{
  mkdirSync(join(source,'bin'),{recursive:true});writeFileSync(join(source,'package.json'),JSON.stringify({name:'@xai-official/grok-win32-x64',version:'1.0.93'}))
  writeFileSync(join(source,'bin/grok.exe.br'),brotliCompressSync(Buffer.from('MZ native entry fixture')))
  const entry=managedNativeEntry('grok',root,'1.0.93','win32','x64')!;expect(readFileSync(entry,'utf8')).toBe('MZ native entry fixture')
  expect(managedNativeEntry('grok',root,'1.0.93','win32','x64')).toBe(entry)
  expect(()=>managedNativeEntry('grok',root,'2.0.0','win32','x64')).toThrow('版本与适配器不一致')
  expect(managedNativeEntry('other',root,'1.0.93','win32','x64')).toBeUndefined()
 }finally{rmSync(root,{recursive:true,force:true})}
})
test('Given Windows没有预装Git Bash When 一键安装需要Bash的内核 Then 使用固定官方便携发行物和私有PATH不依赖系统安装',async()=>{
 const {windowsGitDistribution,requiresWindowsGit,windowsGitEnvironment}=await import('../apps/electron/src/main/lib/desktop-cli-windows-git')
 for(const arch of ['x64','arm64']){const spec=windowsGitDistribution(arch);expect(spec.url).toStartWith('https://github.com/git-for-windows/git/releases/download/');expect(spec.sha256).toMatch(/^[0-9a-f]{64}$/)}
 expect(()=>windowsGitDistribution('ia32')).toThrow('没有已核验')
 for(const id of ['hermes','pi-acp','claude','cline','omp','dsh'])expect(requiresWindowsGit(id)).toBe(true)
 expect(requiresWindowsGit('other')).toBe(false)
 const env=windowsGitEnvironment('C:\\用户 空格\\Tervell\\git','C:\\Windows\\System32')
 expect(env.HERMES_GIT_BASH_PATH).toBe('C:\\用户 空格\\Tervell\\git\\bin\\bash.exe');expect(env.PI_BASH_PATH).toBe(env.HERMES_GIT_BASH_PATH);expect(env.CLAUDE_CODE_GIT_BASH_PATH).toBe(env.HERMES_GIT_BASH_PATH)
 expect(env.PATH).toBe('C:\\用户 空格\\Tervell\\git\\cmd;C:\\用户 空格\\Tervell\\git\\bin;C:\\Windows\\System32')
})
