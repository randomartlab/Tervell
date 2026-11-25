import registry from './registry-data/acp-registry.json';
import packageMetadata from './registry-data/acp-package-metadata.json';
/** 固定的ACP官方目录；没有当前系统发行物时明确不可安装，不能下载其他架构冒充。 */
export interface AcpDistributionCommand {args?:string[];env?:Record<string,string>}
export interface AcpBinaryDistribution extends AcpDistributionCommand {archive:string;cmd:string;sha256?:string}
export interface AcpPackageDistribution extends AcpDistributionCommand {package:string}
export interface AcpRegistryAgent {id:string;name:string;version:string;description:string;repository?:string;website?:string;license?:string;license_url?:string;distribution:{binary?:Record<string,AcpBinaryDistribution>;npx?:AcpPackageDistribution;uvx?:AcpPackageDistribution}}
export const ACP_REGISTRY_AGENTS=registry.agents as AcpRegistryAgent[];
export const ACP_REGISTRY_SOURCE={url:'https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json',retrievedAt:'2026-11-24',sha256:'502a2b1c3af4fe61e86a4d65c70cc5d8154116f3b3c1b370ccea778804ede877'};
export const ACP_REGISTRY_ALIASES:Readonly<Record<string,string>>={deepseek:'dsh',claude:'claude-acp',codex:'codex-acp',amp:'amp-acp',antigravity:'antigravity-acp',codebuddy:'codebuddy-code',droid:'factory-droid',grok:'grok-build',copilot:'github-copilot-cli',kimi:'kimi-code',mcode:'minimax-code',qwen:'qwen-code',opencode2:'opencode-v2',muse:'muse-code',kilocode:'kilo'};
export function registryAgent(id:string):AcpRegistryAgent|undefined{return ACP_REGISTRY_AGENTS.find(a=>a.id===(ACP_REGISTRY_ALIASES[id]??id));}
export function registryPlatform(platform:string,arch:string):string {return `${platform==='win32'?'windows':platform}-${arch==='arm64'?'aarch64':arch==='x64'?'x86_64':arch}`;}
/** npm bin 来自固定版本实际包；不能拿另一个平台发行物的文件名推断 npm 入口。 */
export function registryPackageBin(agent:AcpRegistryAgent):string|undefined {
 const rows=packageMetadata.agents as Record<string,{package:string;bin?:string|Record<string,string>}>;
 const metadata=rows[agent.id];if(!metadata||metadata.package!==agent.distribution.npx?.package)return undefined;
 if(typeof metadata.bin==='string')return agent.id;
 const names=Object.keys(metadata.bin??{});if(names.includes(agent.id))return agent.id;
 const aliases:Record<string,string>={'claude-acp':'claude-agent-acp','kilo':'kilo','minimax-code':'code-acp','codebuddy-code':'codebuddy','github-copilot-cli':'copilot','grok-build':'grok','qwen-code':'qwen','kimi-code':'kimi','factory-droid':'droid'};
 if(aliases[agent.id]&&names.includes(aliases[agent.id]!))return aliases[agent.id];
 return names.length===1?names[0]:undefined;
}
export function registryCommand(agent:AcpRegistryAgent,platform=process.platform as string,arch=process.arch as string):{command:string;args:string[];env:Record<string,string>} {
 const binary=agent.distribution.binary?.[registryPlatform(platform,arch)],pkg=agent.distribution.npx??agent.distribution.uvx,entry=pkg??binary;
 const name=registryPackageBin(agent)??binary?.cmd?.replaceAll('\\','/').split('/').at(-1)?.replace(/\.exe$/,'')??agent.id;
 return {command:name,args:entry?.args??[],env:entry?.env??{}};
}
