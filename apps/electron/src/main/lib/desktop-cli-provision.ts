import {gunzipSync} from 'node:zlib';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,existsSync,chmodSync,readdirSync,realpathSync,lstatSync,openSync,readSync,closeSync} from 'node:fs';
import {join,dirname,resolve,relative,isAbsolute,delimiter} from 'node:path';
import { downloadCliFile } from './desktop-cli-download';
import {net} from 'electron';
import extraDistributions from './desktop-cli-extras.json';
import {registryPlatform}from'@proma/kernel-host';
import runtimes from './desktop-cli-runtimes.json';
import {extractCliArchive} from './desktop-cli-archive';
import {getConfigDir} from './config-paths';
import {writeJsonFileAtomic} from './safe-file';
import {managedCliRoot} from './desktop-cli-managed';
import type {ManagedCli} from './desktop-cli-managed';
import {cliInstallPlan} from './desktop-cli-install-plan';
import {pluginBun} from './plugin-host/paseo-dependencies';
import {trustedCliLifecycle} from './desktop-cli-lifecycle';
import {cliPackageRuntime,cliPackageBin,cliDependencyEnvironment} from './desktop-cli-runtime-choice';
import type {CliPackageManifest} from './desktop-cli-runtime-choice';
import {applyManagedCliCompatibility} from './desktop-cli-compat';
import {managedNativeEntry} from './desktop-cli-native-entry';
import {requiresWindowsGit,windowsGitDistribution,windowsGitEnvironment} from './desktop-cli-windows-git';
export interface ProvisionContext {signal:AbortSignal;output:(text:string)=>void;env:Record<string,string>;fetch?:typeof fetch;existingCli?:string}
const runtimeRoot=()=>join(getConfigDir(),'cli-runtime/runtime');
function executableHeader(path:string):string {const fd=openSync(path,'r');try{const buffer=Buffer.alloc(200);return buffer.subarray(0,readSync(fd,buffer,0,buffer.length,0)).toString()}finally{closeSync(fd)}}
export async function downloadCliArtifact(url:string,file:string,expected:string|undefined,c:ProvisionContext):Promise<string>{
 return downloadCliFile(url,file,expected,{signal:c.signal,output:c.output,fetch:c.fetch??net.fetch});
}
async function command(file:string,args:string[],cwd:string,env:Record<string,string>,c:ProvisionContext):Promise<void>{
 c.signal.throwIfAborted();await new Promise<void>((ok,no)=>{
  const child=spawn(file,args,{cwd,env,shell:false,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',chunk=>c.output(chunk.toString()));child.stderr.on('data',chunk=>c.output(chunk.toString()));
  const abort=()=>{if(process.platform==='win32'){spawn('taskkill.exe',['/pid',String(child.pid),'/t','/f'],{windowsHide:true});}else try{if(child.pid)process.kill(-child.pid,'SIGTERM');}catch{child.kill('SIGKILL');}};
  c.signal.addEventListener('abort',abort,{once:true});child.once('error',no);child.once('close',code=>{c.signal.removeEventListener('abort',abort);c.signal.aborted?no(Error('已取消安装')):code===0?ok():no(Error(`安装命令退出 ${code}`));});
 });
}
async function nodeRuntime(work:string,c:ProvisionContext):Promise<string>{
 const filename=`node-v${runtimes.node.version}-${process.platform==='win32'?'win':process.platform}-${process.arch}${process.platform==='win32'?'.zip':'.tar.gz'}`;
 const entry=(runtimes.node.files as Record<string,{url:string;sha256:string}>)[filename];if(!entry)throw Error('当前系统没有兼容 Node 运行时');
 const root=join(runtimeRoot(),'node-'+runtimes.node.version),bin=join(root,`node-v${runtimes.node.version}-${process.platform==='win32'?'win':process.platform}-${process.arch}`,process.platform==='win32'?'node.exe':'bin/node');
 if(existsSync(bin))return bin;
 const file=join(work,filename);await downloadCliArtifact(entry.url,file,entry.sha256,c);await extractCliArchive(file,root,c.signal);if(!existsSync(bin))throw Error('Node 运行时缺少可执行入口');if(process.platform!=='win32')chmodSync(bin,0o700);return bin;
}
async function uvRuntime(work:string,c:ProvisionContext):Promise<string>{
 const target=process.platform==='darwin'?`${process.arch==='arm64'?'aarch64':'x86_64'}-apple-darwin`:process.platform==='win32'?`${process.arch==='arm64'?'aarch64':'x86_64'}-pc-windows-msvc`:`${process.arch==='arm64'?'aarch64':'x86_64'}-unknown-linux-gnu`;
 const spec=(runtimes.uv.targets as Record<string,{url:string;sha256:string}>)[target];if(!spec)throw Error('当前系统没有兼容 Python 工具运行时');
 const root=join(runtimeRoot(),'uv-'+runtimes.uv.version),binary=join(root,process.platform==='win32'?'uv.exe':`uv-${target}/uv`);if(existsSync(binary))return binary;
 const file=join(work,'uv'+(spec.url.endsWith('.zip')?'.zip':'.tar.gz'));await downloadCliArtifact(spec.url,file,spec.sha256,c);await extractCliArchive(file,root,c.signal);if(!existsSync(binary))throw Error('Python 工具运行时缺少入口');if(process.platform!=='win32')chmodSync(binary,0o700);return binary;
}
async function windowsGitRuntime(work:string,c:ProvisionContext):Promise<Record<string,string>>{
 const spec=windowsGitDistribution(process.arch),root=join(runtimeRoot(),`git-${spec.version}-${process.arch}`),ready=join(root,'.tervell-ready.json');
 const bash=join(root,'bin/bash.exe'),git=join(root,'cmd/git.exe');
 let verified=false;try{verified=JSON.parse(readFileSync(ready,'utf8')).sha256===spec.sha256&&existsSync(bash)&&existsSync(git)}catch{/* 中断的安装不算已就绪。 */}
 if(!verified){
  const archive=join(work,'portable-git.exe');c.output('准备此内核所需的私有Git Bash运行时…\r\n');await downloadCliArtifact(spec.url,archive,spec.sha256,c);
  await command(archive,['-y','-o'+root],work,c.env,{...c,signal:AbortSignal.any([c.signal,AbortSignal.timeout(120000)])});
  if(!existsSync(bash)||!existsSync(git))throw Error('Git Bash便携发行物未包含所需入口');
  const env={...c.env,...windowsGitEnvironment(root,c.env.PATH??'')};
  const checked={...c,signal:AbortSignal.any([c.signal,AbortSignal.timeout(30000)])};
  try{await command(git,['--version'],root,env,checked);await command(bash,['--noprofile','--norc','-c','/usr/bin/true; /usr/bin/cat --version >/dev/null'],root,env,checked);}catch(error){if(!c.signal.aborted&&checked.signal.aborted)throw Error('私有Git Bash启动检查超时，未启用不完整安装');throw error;}
  writeJsonFileAtomic(ready,{version:spec.version,sha256:spec.sha256});
 }
 return windowsGitEnvironment(root,c.env.PATH??'');
}
export async function provisionDesktopCli(id:string,c:ProvisionContext):Promise<ManagedCli>{
 const plan=cliInstallPlan(id);if(!plan)throw Error('当前平台没有此内核的官方安装发行物');
 // Windows的Python原生扩展仍可能受MAX_PATH限制，版本实例无需占满36位UUID。
 const directory=join(managedCliRoot(),id,'versions',plan.version+'-'+randomUUID().replaceAll('-','').slice(0,12)),work=join(directory,'download');mkdirSync(work,{recursive:true});
 c.output(`准备 ${id} ${plan.version} · ${plan.source}\r\n`);let executable='',digest:string|undefined,args=plan.args,env={...plan.env};
 if(process.platform==='win32'&&requiresWindowsGit(id)){const gitEnv=await windowsGitRuntime(work,c);c={...c,env:{...c.env,...gitEnv}};Object.assign(env,gitEnv);}
 if(plan.kind==='binary'){
  const spec=plan.binary!,ext=new URL(spec.archive).pathname.match(/\.(zip|tar\.gz|tgz|tar\.bz2|gz)$/)?.[0]??'.bin',file=join(work,'package'+ext),content=join(directory,'content');
  digest=await downloadCliArtifact(spec.archive,file,spec.sha256,c);mkdirSync(content,{recursive:true});
  if(ext==='.gz'){(await import('./safe-file')).writeBytesFileAtomic(join(content,spec.cmd.replace(/^\.\//,'')),gunzipSync(readFileSync(file),{maxOutputLength:1024*1024*1024}));}else if(ext==='.bin'){const {copyFileSync}=await import('node:fs');copyFileSync(file,join(content,spec.cmd.replace(/^\.\//,'')));}else await extractCliArchive(file,content,c.signal);
  executable=resolve(content,spec.cmd.replaceAll('\\','/'));const local=relative(content,executable);if(local.startsWith('..')||isAbsolute(local)||!existsSync(executable))throw Error('安装归档缺少声明的内核入口');
  if(process.platform!=='win32')chmodSync(executable,0o700);
  for(const [index,sidecar]of(plan.sidecars??[]).entries()){const download=join(work,'sidecar-'+index+'.gz');await downloadCliArtifact(sidecar.archive,download,sidecar.sha256,c);const dest=resolve(content,sidecar.cmd);if(relative(content,dest).startsWith('..'))throw Error('附属运行时路径越界');(await import('./safe-file')).writeBytesFileAtomic(dest,gunzipSync(readFileSync(download),{maxOutputLength:512*1024*1024}));if(process.platform!=='win32')chmodSync(dest,0o700);}
 }else if(plan.kind==='npm'){
  const node=await nodeRuntime(work,c),bun=pluginBun(),packageRoot=join(directory,'package');mkdirSync(packageRoot,{recursive:true});
  const dependencies:Record<string,string>={};
  for(const packageName of plan.packages??[]){const at=packageName.lastIndexOf('@'),name=packageName.slice(0,at),version=packageName.slice(at+1);if(!name||!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version))throw Error('安装配方必须使用固定包版本');dependencies[name]=version;}
  const name=Object.keys(dependencies)[0];if(!name)throw Error('安装配方没有声明主程序包');
  writeJsonFileAtomic(join(packageRoot,'package.json'),{name:'tervell-managed-'+id,private:true,dependencies,trustedDependencies:[name,...(plan.trustedDependencies??[])]});
  const path=[dirname(node),dirname(bun),c.env.PATH??''].join(delimiter);
  const installEnv={...c.env,PATH:[join(packageRoot,'node_modules/.bin'),path].join(delimiter),BUN_INSTALL_CACHE_DIR:join(getConfigDir(),'cli-runtime/cache')};
  await command(bun,['install','--ignore-scripts','--production','--no-env-file','--no-progress','--registry=https://registry.npmjs.org'],packageRoot,installEnv,c);
  for(const step of trustedCliLifecycle(packageRoot,[name,...(plan.trustedDependencies??[])])){
   c.output(`准备依赖 ${step.name}@${step.version} · ${step.hook}\r\n`);
   await command(bun,['run','--if-present',step.hook],step.cwd,installEnv,c);
  }
  const manifest=JSON.parse(readFileSync(join(packageRoot,'node_modules',name,'package.json'),'utf8')) as CliPackageManifest;
  const relativeBin=cliPackageBin(manifest,name,plan.bin);
  if(!relativeBin)throw Error('内核安装包没有匹配的可执行入口');const bin=realpathSync(join(packageRoot,'node_modules',name,relativeBin));
  const header=executableHeader(bin);
  if(/\.(?:m?js|cjs|ts)$/.test(bin)||header.match(/^#!.*(?:node|bun)/)){executable=cliPackageRuntime(manifest,runtimes.node.version,'1.4.4',header)==='bun'?bun:node;args=[bin,...args];}else executable=bin;
  // 标准node启动器在私有安装目录内，避免active记录指向目录外的共享运行时。
  if(executable===node||executable===bun){const {copyFileSync}=await import('node:fs');const privateRuntime=join(directory,process.platform==='win32'?'runtime.exe':'runtime');copyFileSync(executable,privateRuntime);if(process.platform!=='win32')chmodSync(privateRuntime,0o700);executable=privateRuntime;}
  env.PATH=[join(packageRoot,'node_modules/.bin'),path].join(delimiter);
  Object.assign(env,cliDependencyEnvironment(id,packageRoot));
  const native=managedNativeEntry(id,directory,plan.version);if(native){executable=native;args=plan.args;env.GROK_MANAGED_BY_NPM='1';}
  if(id==='codex'&&c.existingCli){env.CODEX_PATH=c.existingCli;c.output('沿用已安装 Codex 与现有登录配置\r\n');}
 }else{
  const uv=await uvRuntime(work,c),tool=join(directory,process.platform==='win32'?'py':'python-tools'),bin=join(directory,'bin'),python=join(runtimeRoot(),'python');mkdirSync(bin,{recursive:true});
  const toolEnv={...c.env,UV_TOOL_DIR:tool,UV_TOOL_BIN_DIR:bin,UV_PYTHON_INSTALL_DIR:python,UV_PYTHON: '3.13',UV_PYTHON_DOWNLOADS:'automatic'};
  const constraints=join(directory,'python-constraints.txt');if(plan.pythonConstraints?.length)(await import('./safe-file')).writeTextFileAtomic(constraints,plan.pythonConstraints.join('\n')+'\n');
  await command(uv,['tool','install','--python','3.13',...(plan.pythonConstraints?.length?['--constraint',constraints]:[]),plan.packages![0]!],directory,toolEnv,c);
  executable=join(bin,(plan.bin??id)+(process.platform==='win32'?'.exe':''));if(!existsSync(executable))throw Error('Python 内核安装完成但入口缺失');
 }
 if(plan.requiresCli==='amp'&&!c.env.PATH?.split(delimiter).some(path=>existsSync(join(path,process.platform==='win32'?'amp.exe':'amp')))){
  const spec=(extraDistributions.amp.binary as Record<string,{archive:string;cmd:string}>)[registryPlatform(process.platform,process.arch)];if(!spec)throw Error('Amp主程序没有当前平台发行物');
  const destination=join(directory,'amp-bin');mkdirSync(destination,{recursive:true});const file=join(work,'amp.bin');await downloadCliArtifact(spec.archive,file,undefined,c);const target=join(destination,process.platform==='win32'?'amp.exe':'amp');(await import('node:fs')).copyFileSync(file,target);if(process.platform!=='win32')chmodSync(target,0o700);env.PATH=[destination,c.env.PATH??''].join(delimiter);
 }
 applyManagedCliCompatibility(id,directory,plan.version);
 // 部分二进制ACP入口会按程序名启动自身的MCP子服务，必须能在私有PATH中找到同一发行物。
 env.PATH=[dirname(executable),env.PATH??c.env.PATH??''].join(delimiter);
 c.signal.throwIfAborted();return {version:1,id,command:executable,args,env,installedVersion:plan.version,directory,source:plan.source,cliSelfContained:true,artifactSha256:digest};
}
