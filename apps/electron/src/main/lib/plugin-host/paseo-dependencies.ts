import {spawn} from 'node:child_process';
import {existsSync,readFileSync,rmSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {writeJsonFileAtomic} from '../safe-file';
import {desktopCliEnvironment} from '../desktop-extension-service';
/** 使用随包且已校验的Bun，避免手写包管理器只能处理一部分npm语义。 */
export function pluginBun():string{
 const arch=process.platform+'-'+process.arch;
 const candidates=[join(process.resourcesPath??'','third-party/plugin-runtime',arch,process.platform==='win32'?'bun.exe':'bun'),resolve('apps/electron/resources/third-party/plugin-runtime',arch,process.platform==='win32'?'bun.exe':'bun')];
 const binary=candidates.find(existsSync);
 if(!binary)throw Error('缺少当前平台的插件依赖运行时：'+arch);
 const metadata=[resolve(binary,'../sources.json'),resolve(binary,'../../sources.json')].find(existsSync)!;
 const source=JSON.parse(readFileSync(metadata,'utf8')) as {binarySha256:string;packagedBinarySha256?:string};
 if(createHash('sha256').update(readFileSync(binary)).digest('hex')!==(source.packagedBinarySha256??source.binarySha256))throw Error('插件依赖运行时完整性校验失败');
 return binary;
}
export async function preparePaseoDependencies(directory:string):Promise<void>{
 const source=join(directory,'source'),file=join(source,'package.json');
 if(!existsSync(file))return;
 const raw=readFileSync(file),original=JSON.parse(raw.toString('utf8')) as {dependencies?:Record<string,string>;optionalDependencies?:Record<string,string>};
 if(!Object.keys(original.dependencies??{}).length&&!Object.keys(original.optionalDependencies??{}).length)return;
 const stamp=join(directory,'dependency-install.json');
 const hash=createHash('sha256').update(raw);
 for(const name of ['npm-shrinkwrap.json','package-lock.json','bun.lock','bun.lockb','yarn.lock','.npmrc'])if(existsSync(join(source,name)))hash.update(readFileSync(join(source,name)));
 const signature=hash.digest('hex');
 if(existsSync(stamp)&&existsSync(join(source,'node_modules'))&&JSON.parse(readFileSync(stamp,'utf8')).signature===signature)return;
 // Bun原生迁移npm锁文件；已发布npm包通常只有shrinkwrap，保持原包文件不变。
 const converted=existsSync(join(source,'npm-shrinkwrap.json'))&&!existsSync(join(source,'package-lock.json'));
 if(converted)copyFileSync(join(source,'npm-shrinkwrap.json'),join(source,'package-lock.json'));
 try{
  await new Promise<void>((resolve,reject)=>{
   let output='';const child=spawn(pluginBun(),['install','--production','--ignore-scripts','--omit=peer','--linker=isolated','--no-env-file','--no-progress'],{cwd:source,env:{...desktopCliEnvironment(),BUN_INSTALL_CACHE_DIR:join(directory,'dependency-cache')},shell:false,stdio:['ignore','pipe','pipe']});
   const append=(chunk:Buffer)=>{output=(output+chunk.toString()).slice(-65536)};child.stdout.on('data',append);child.stderr.on('data',append);child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`插件依赖安装失败 (${code})\n${output}`)));
  });
 }finally{if(converted)rmSync(join(source,'package-lock.json'),{force:true});}
 // 新生成的Bun锁也计入成功摘要；启动时不重复解析或升级依赖。
 const finished=createHash('sha256').update(raw);
 for(const name of ['npm-shrinkwrap.json','package-lock.json','bun.lock','bun.lockb','yarn.lock','.npmrc'])if(existsSync(join(source,name)))finished.update(readFileSync(join(source,name)));
 writeJsonFileAtomic(stamp,{signature:finished.digest('hex'),installedAt:new Date().toISOString()});
}
