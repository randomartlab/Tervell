import {randomUUID}from'node:crypto';
import {mkdirSync,existsSync}from'node:fs';
import {join}from'node:path';
import {createTerminal}from'./terminal-service';
import {desktopKernelState,desktopKernelEnvironment,resolveDesktopCommand}from'./desktop-extension-service';
import {getConfigDir}from'./config-paths';
import {readManagedCli}from'./desktop-cli-managed';
const commands:Record<string,{command:string;args:string[]}>= {
 codex:{command:'codex',args:['login']},claude:{command:'claude',args:['auth','login']},gemini:{command:'gemini',args:[]},kimi:{command:'kimi',args:['login']},qwen:{command:'qwen',args:[]},copilot:{command:'copilot',args:['login']},opencode:{command:'opencode',args:['auth','login']},omp:{command:'omp',args:['login']},cursor:{command:'cursor-agent',args:['login']},grok:{command:'grok',args:['login']},
};
export async function openKernelLogin(id:string){
 const entry=desktopKernelState().entries.find(e=>e.id===id),known=Object.hasOwn(commands,id)?commands[id]:undefined;if(!entry||!known)throw Error('该内核请使用自身的认证流程或配置界面');
 let file=resolveDesktopCommand(known.command),args=known.args;const managed=readManagedCli(id);
 if(!file&&managed){const candidate=join(managed.directory,'package/node_modules/@openai/codex/bin/codex.js');if(id==='codex'&&existsSync(candidate)){file=managed.command;args=[candidate,...known.args];}else if(managed.args[0]?.match(/\.(?:js|mjs|cjs)$/)){file=managed.command;args=[managed.args[0],...known.args];}}
 if(!file)throw Error('尚未找到账号登录命令，请先完成内核安装');
 const terminalId='kernel-login-'+randomUUID(),cwd=join(getConfigDir(),'cli-login');mkdirSync(cwd,{recursive:true});
 return createTerminal({terminalId,sessionId:'kernel-login',cwd,cols:100,rows:25},{strictCwd:true,managedProcess:{file,args,env:desktopKernelEnvironment(id),title:entry.name+' 登录',inheritEnv:false}});
}
