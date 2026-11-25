import {openSync,closeSync,fstatSync,readSync,constants,realpathSync} from 'node:fs'
import {resolve,relative,extname,join,isAbsolute} from 'node:path'
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'}
/** 仅静态目录内常规文件；SPA fallback仅给无扩展HTML导航，不拦截API或缺失资源。 */
export class StaticAssets{
 private readonly root:string
 constructor(root:string){this.root=realpathSync(root)}
 response(request:Request):Response{
  const url=new URL(request.url);let path:string
  try{path=decodeURIComponent(url.pathname)}catch{return new Response('Bad path',{status:400})}
  if(path.includes('\0')||path.includes('\\')||path.split('/').some(p=>p==='..'||p.startsWith('.')))return new Response('Forbidden',{status:403})
  const desired=resolve(this.root,'.'+path),rel=relative(this.root,desired)
  if(rel.startsWith('..')||isAbsolute(rel))return new Response('Forbidden',{status:403})
  let file=this.open(desired)
  if(!file&&!extname(path)&&request.headers.get('accept')?.includes('text/html'))file=this.open(join(this.root,'index.html'))
  if(!file)return new Response('Not found',{status:404})
  const headers={'content-type':mime[extname(file.path)]??'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"}
  return new Response(request.method==='HEAD'?null:new Uint8Array(file.bytes).buffer,{headers})
 }
 private open(path:string):{path:string;bytes:Uint8Array}|undefined{
  let fd:number|undefined
  try{
   const real=realpathSync(path),rel=relative(this.root,real)
   if(rel.startsWith('..')||isAbsolute(rel))return
   fd=openSync(real,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK)
   const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink>1||stat.size>8*1024*1024)return
   const buffer=Buffer.alloc(stat.size+1);let offset=0
   while(offset<buffer.length){const n=readSync(fd,buffer,offset,buffer.length-offset,null);if(!n)break;offset+=n}
   if(offset>stat.size)return
   return {path:real,bytes:buffer.subarray(0,offset)}
  }catch{return}finally{if(fd!==undefined)closeSync(fd)}
 }
}
