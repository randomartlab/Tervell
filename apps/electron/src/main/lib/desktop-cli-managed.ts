import {existsSync,realpathSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {z} from 'zod';
import {getConfigDir} from './config-paths';
import {readJsonFileSafe,writeJsonFileAtomic} from './safe-file';
import {cliDependencyEnvironment} from './desktop-cli-runtime-choice';
import {applyManagedCliCompatibility} from './desktop-cli-compat';
import {managedNativeEntry} from './desktop-cli-native-entry';
const schema=z.strictObject({version:z.literal(1),id:z.string(),command:z.string(),args:z.array(z.string()),env:z.record(z.string(),z.string()),installedVersion:z.string(),directory:z.string(),source:z.string(),cliSelfContained:z.boolean().default(true),artifactSha256:z.string().optional(),verification:z.object({protocol:z.literal(1),initialized:z.boolean().optional(),session:z.enum(['ready','login-required']),agentName:z.string().optional(),agentVersion:z.string().optional(),checkedAt:z.number()}).optional()});
export type ManagedCli=z.infer<typeof schema>;
export function managedCliRoot(){return join(getConfigDir(),'cli-runtime','agents');}
function recordFile(id:string){if(!/^[a-z0-9][a-z0-9._-]{0,127}$/.test(id))throw Error('内核标识无效');return join(managedCliRoot(),id,'active.json');}
export function readManagedCli(id:string):ManagedCli|undefined{
 const result=schema.safeParse(readJsonFileSafe(recordFile(id)));if(!result.success)return;
 const value=result.data;if(!existsSync(value.directory)||!existsSync(value.command))return;
 // macOS 的 /var 和 /private/var 是同一安装目录；比较真实路径而非混合别名。
 let base:string,command:string;
 try{const directory=realpathSync(value.directory);base=relative(realpathSync(managedCliRoot()),directory);command=relative(directory,realpathSync(value.command));}catch{return;}
 if(base.startsWith('..')||isAbsolute(base)||command.startsWith('..')||isAbsolute(command))return;
 try{applyManagedCliCompatibility(value.id,value.directory,value.installedVersion);const native=managedNativeEntry(value.id,value.directory,value.installedVersion);return {...value,...(native?{command:native,args:value.args[0]?.endsWith('/bin/grok')||value.args[0]?.endsWith('\\bin\\grok')?value.args.slice(1):value.args}:{}),env:{...value.env,...cliDependencyEnvironment(value.id,join(value.directory,'package')),...(native?{GROK_MANAGED_BY_NPM:'1'}:{})}};}catch{return;}
}
export function writeManagedCli(value:ManagedCli){const file=recordFile(value.id);(require('node:fs') as typeof import('node:fs')).mkdirSync(join(managedCliRoot(),value.id),{recursive:true});writeJsonFileAtomic(file,schema.parse(value));}
