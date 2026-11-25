import AdmZip from 'adm-zip';
import {extract,list} from 'tar';
import bzip from 'seek-bzip';
import {mkdirSync,writeFileSync,symlinkSync,openSync,readSync,writeSync,closeSync,rmSync} from 'node:fs';
import {join,resolve,relative,isAbsolute,dirname,posix} from 'node:path';
function decodeBzipToFile(file:string,target:string,signal:AbortSignal):void {
 const input=openSync(file,'r'),output=openSync(target,'wx',0o600),source=Buffer.alloc(65536),destination=Buffer.alloc(65536);let at=0,size=0,used=0,total=0,eof=false;
 const flush=()=>{if(used){writeSync(output,destination,0,used);used=0}};
 const readByte=()=>{if(at===size){signal.throwIfAborted();size=readSync(input,source,0,source.length,null);at=0;if(!size){eof=true;return -1}}return source[at++]!};
 try{bzip.decode({readByte,read:(buffer,offset,length)=>{let n=0;while(n<length){const value=readByte();if(value<0)return n||-1;buffer[offset+n++]=value}return n},eof:()=>eof},{writeByte:value=>{if(++total>1024*1024*1024)throw Error('安装归档展开超过 1GB，已停止');destination[used++]=value;if(used===destination.length)flush()},flush});flush()}
 finally{closeSync(input);closeSync(output)}
}
/** 解压官方发行物，拒绝越界路径及可借父链接写出私有安装目录的归档。 */
export function safeCliArchivePath(name:string):boolean {
 const path=name.replaceAll('\\','/').replace(/^(\.\/)+/,'').replace(/\/$/,'');
 return !!path&&!path.includes('\0')&&!isAbsolute(path)&&!/^[a-z]:/i.test(path)&&path.split('/').every(p=>p!=='.'&&p!=='..');
}
export async function extractCliArchive(file:string,dest:string,signal:AbortSignal):Promise<void>{
 signal.throwIfAborted();mkdirSync(dest,{recursive:true});let total=0,count=0;const links:Array<{name:string;target:string}>=[];
 const validate=(name:string,size:number,type:string,link='')=>{
  if((name==='.'||/^\.\/$/.test(name))&&type==='Directory')return;
  if(++count>150000||!safeCliArchivePath(name)||!Number.isFinite(size)||size<0||(total+=size)>2*1024*1024*1024)throw Error('安装归档路径、大小或条目数量无效');
  if(['SymbolicLink','Link'].includes(type)){
   const target=type==='Link'?link:posix.join(posix.dirname(name.replaceAll('\\','/')),link.replaceAll('\\','/'));
   if(isAbsolute(link)||!safeCliArchivePath(target))throw Error('安装归档链接越界');
   links.push({name:name.replace(/^\.\//,''),target});
  }else if(!['File','OldFile','Directory','ExtendedHeader','GlobalExtendedHeader','NextFileHasLongPath','NextFileHasLongLinkpath'].includes(type))throw Error('安装归档包含不可执行的特殊文件类型');
 };
 if(file.endsWith('.zip')){
  const zip=new AdmZip(file),entries=zip.getEntries();
  for(const e of entries){signal.throwIfAborted();const mode=e.attr>>>16;validate(e.entryName,e.header.size,(mode&0o170000)===0o120000?'SymbolicLink':e.isDirectory?'Directory':'File',(mode&0o170000)===0o120000?e.getData().toString():undefined);}
  assertLinks(links,entries.map(e=>e.entryName));
  for(const e of entries){signal.throwIfAborted();const name=e.entryName.replaceAll('\\','/'),target=resolve(dest,name);if((e.attr>>>16&0o170000)===0o120000)continue;mkdirSync(e.isDirectory?target:dirname(target),{recursive:true});if(!e.isDirectory){writeFileSync(target,e.getData(),{mode:(e.attr>>>16&0o777)||0o600});}}
  for(const row of links){const target=join(dest,row.name);mkdirSync(dirname(target),{recursive:true});symlinkSync(relative(dirname(target),join(dest,row.target)),target);}
 }else{
  const temporary=file.endsWith('.bz2')?file+'.decoded.tar':undefined,source=temporary??file;
  try{if(temporary)decodeBzipToFile(file,temporary,signal);
   const names:string[]=[];
   // tar 的事件回调抛错不会自动拒绝 list()，可能让主进程收到未捕获异常且安装永远等待。
   let invalid:unknown;
   await list({file:source,onReadEntry:e=>{if(invalid)return;try{signal.throwIfAborted();names.push(e.path);validate(e.path,e.size,e.type,e.linkpath);}catch(error){invalid=error;}}});
   if(invalid)throw invalid;
   assertLinks(links,names);signal.throwIfAborted();
   await extract({file:source,cwd:dest,strict:true,preservePaths:false});
  }finally{if(temporary)rmSync(temporary,{force:true})}
 }
 signal.throwIfAborted();
}
function assertLinks(links:Array<{name:string;target:string}>,names:string[]) {
 for(const link of links){if(names.some(name=>name.startsWith(link.name.replace(/\/$/,'')+'/')))throw Error('安装归档不接受符号链接目录下的写入');}
}
