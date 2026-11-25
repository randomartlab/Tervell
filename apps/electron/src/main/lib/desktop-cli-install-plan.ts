import extraDistributions from './desktop-cli-extras.json';
import {registryAgent,registryPlatform,registryPackageBin} from '@proma/kernel-host';
import type {AcpBinaryDistribution,AcpRegistryAgent} from '@proma/kernel-host';
export interface CliInstallPlan {id:string;version:string;source:string;homepage?:string;kind:'npm'|'uv'|'binary';packages?:string[];binary?:AcpBinaryDistribution;args:string[];env:Record<string,string>;bin?:string;requiresCli?:string;sidecars?:AcpBinaryDistribution[];trustedDependencies?:string[];pythonConstraints?:string[]}
const extras:Readonly<Record<string,{package:string;bin:string;args:string[];kind:'npm'|'uv';source:string}>>={
 codewhale:{package:'codewhale@0.10.4',bin:'codewhale',args:['serve','--acp'],kind:'npm',source:'CodeWhale 官方npm'},
 hoplite:{package:'@usehoplite/cli@3.5.2',bin:'hoplite',args:['acp'],kind:'npm',source:'Hoplite 官方npm'},
 gjc:{package:'gajae-code@0.22.0',bin:'gjc',args:['acp'],kind:'npm',source:'Gajae 官方npm'},
 dsh:{package:'@deepseek-ai/dsh@0.2.2-rc.5',bin:'dsh',args:['--profile','acp'],kind:'npm',source:'DeepSeek 官方npm'},
 hermes:{package:'hermes-agent[acp]==0.19.0',bin:'hermes',args:['acp'],kind:'uv',source:'Nous Research 官方PyPI（含ACP依赖）'},
 omp:{package:'@oh-my-pi/pi-coding-agent@19.1.1',bin:'omp',args:['acp'],kind:'npm',source:'oh-my-pi'},
 'crow-cli':{package:'crow-cli==0.1.50',bin:'crow-cli',args:['acp'],kind:'uv',source:'Crow 官方PyPI（修复0.1.49原生包遗漏模块）'},
};
export function cliInstallPlan(id:string,platform=process.platform as string,arch=process.arch as string):CliInstallPlan|undefined {
 if(!['darwin','linux','win32'].includes(platform)||!['x64','arm64'].includes(arch))return undefined;
 const extra=Object.hasOwn(extras,id)?extras[id]:undefined;
 if(id==='deepseek')return cliInstallPlan('dsh',platform,arch)?{...cliInstallPlan('dsh',platform,arch)!,id}:undefined;
 if(extra)return {...(id==='dsh'?{trustedDependencies:['node-pty','koffi','@deepseek-ai/dsh-subprocess-local']}:{}),id,version:extra.package.includes('==')?extra.package.split('==').at(-1)!:extra.package.split('@').at(-1)!,source:extra.source,kind:extra.kind,packages:[extra.package],bin:extra.bin,args:extra.args,env:{}};
 if(id==='trae'){const item=(extraDistributions.trae.binary as Record<string,AcpBinaryDistribution&{sidecars?:AcpBinaryDistribution[];trustedDependencies?:string[]}>)[registryPlatform(platform,arch)];if(item)return {id,version:extraDistributions.trae.version,source:'TRAE 官方发行清单',kind:'binary',binary:item,sidecars:item.sidecars,args:item.args??[],env:{}};}
 if(id==='fx'&&platform!=='win32')return {id,version:'0.0.17',source:'Vercel Labs fx 官方发行物',kind:'binary',binary:{archive:`https://releases.fx.sh/v0.0.17/fx-${platform==='darwin'?'macos':'linux'}-${arch==='arm64'?'aarch64':'x86_64'}.tar.gz`,cmd:'./fx'},args:['acp'],env:{}};
 const agent=registryAgent(id);if(!agent)return undefined;
 const base={id,version:agent.version,source:'ACP Registry · '+agent.name,homepage:agent.website??agent.repository};
 const npm=agent.distribution.npx;
 if(npm)return {...base,kind:'npm',packages:[npm.package,...(id==='pi-acp'?['@earendil-works/pi-coding-agent@0.87.1']:id==='deepagents'?['@langchain/anthropic@1.3.26','@langchain/openai@1.4.1']:[])],args:npm.args??[],env:npm.env??{},bin:preferredBin(id,agent),...(id==='mcode'?{trustedDependencies:['@minimax-ai/code','better-sqlite3']}:{} )};
 const binary=agent.distribution.binary?.[registryPlatform(platform,arch)];
 if(binary)return {...base,kind:'binary',binary,args:[...(binary.args??[]),...(id==='harn'?['--session-environment','inherited']:[])],env:binary.env??{},...(id==='amp'?{requiresCli:'amp'}:{})};
 const python=agent.distribution.uvx;
 if(python)return {...base,kind:'uv',packages:[python.package.replace(/@(?=\d)/,'==')],bin:preferredBin(id,agent),args:python.args??[],env:python.env??{},...(id==='minion-code'?{pythonConstraints:['agent-client-protocol==0.8.1']}:{})};
 return undefined;
}
function preferredBin(id:string,agent:AcpRegistryAgent):string|undefined {
 const names:Record<string,string>={codex:'codex-acp',claude:'claude-agent-acp',kimi:'kimi',mcode:'mcode',copilot:'copilot',grok:'grok',qwen:'qwen',amp:'amp-acp','fast-agent':'fast-agent-acp','minion-code':'minion-code'};
 return registryPackageBin(agent)??names[id]??Object.values(agent.distribution.binary??{})[0]?.cmd.replaceAll('\\','/').split('/').at(-1)?.replace(/\.exe$/,'');
}
export function cliInstallUnavailable(id:string,platform=process.platform as string,arch=process.arch as string):string|undefined {
 if(cliInstallPlan(id,platform,arch))return undefined;
 const agent=registryAgent(id);
 return agent?`官方当前未发布 ${platform}/${arch} 安装包；可接入已有兼容程序。`:'此扩展条目不在当前 ACP 官方安装目录，请使用其发布者提供的程序。';
}
