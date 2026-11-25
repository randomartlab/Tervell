import {stagePluginFiles} from './plugin-host/packages'
import type {PluginPackageFiles} from './plugin-host/packages'
import {marketSources,parseDshMarket} from './market-sources'
import {readThemePackage} from './theme-package'
import {createHash} from 'node:crypto'
import {archiveFiles} from './plugin-host/archive'
export {archiveFiles} from './plugin-host/archive'
import type {DesktopMarketEntry,DesktopMarketState,DesktopPluginOffer} from '@proma/shared'
import {z} from 'zod'
import {join} from 'node:path'
import {getConfigDir} from './config-paths'
import {readJsonFileSafe,writeJsonFileAtomic} from './safe-file'
import {pluginDigest} from './desktop-extension-config'
export const CAFE_REGISTRY='https://plugins.paseo.sh'
const entrySchema=z.object({id:z.string().regex(/^[\w-]+\/[\w-]+$/),name:z.string().max(200),description:z.string().max(6000),license:z.string().max(200).optional(),categories:z.array(z.string().max(100)).max(40),author:z.object({github:z.string().max(100)}),repository:z.object({url:z.string().url()}),artifact:z.discriminatedUnion('kind',[
 z.object({kind:z.literal('npm'),package:z.string().max(214),version:z.string().regex(/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/),resolved:z.string().url(),integrity:z.string().regex(/^sha512-[A-Za-z\d+/]+=*$/)}),
 z.object({kind:z.literal('git'),remote:z.string(),commit:z.string().regex(/^[a-f\d]{40,64}$/),pluginPath:z.string().max(500).optional()}),
])})
export function parseMarketIndex(raw:unknown):DesktopMarketEntry[]{const doc=z.object({schemaVersion:z.literal(1),plugins:z.array(z.unknown()).max(3000)}).parse(raw);return doc.plugins.flatMap(x=>{const p=entrySchema.safeParse(x);if(!p.success)return [];const d=p.data;return [{id:d.id,name:d.name,description:d.description,license:d.license,categories:d.categories,author:d.author.github,repository:d.repository.url,version:d.artifact.kind==='npm'?d.artifact.version:d.artifact.commit.slice(0,10),artifact:d.artifact}]})}
/** 只访问固定registry与公开GitHub/npm；下载不接触用户文件、SSH凭据或任意内网URL。 */
export interface MarketRequest { (url:URL,options:RequestInit):Promise<Response> }
export async function marketBytes(url:string,max=16*1024*1024,request:MarketRequest=fetch):Promise<Buffer>{
 const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||![...new Set(['plugins.paseo.sh','registry.npmjs.org','codeload.github.com','raw.githubusercontent.com','github.com',...marketSources().map(s=>new URL(s.url).hostname)])].includes(u.hostname))throw new Error('来源必须是公开插件市场、npm或GitHub的HTTPS地址')
 let response:Response|undefined
 for(let attempt=0;attempt<2;attempt++){
  try{response=await request(u,{signal:AbortSignal.timeout(15000),redirect:'error',headers:{'User-Agent':'Tervell-Plugin-Market'}});break}
  catch{if(attempt===1)throw new Error('暂时无法连接插件来源，请检查网络后重试；已安装的主题不受影响。');await new Promise(resolve=>setTimeout(resolve,300))}
 }
 if(!response)throw new Error('插件来源暂不可用，请稍后重试')
 if(!response.ok)throw new Error(`插件来源暂不可用（${response.status}），可稍后重试`)
 if(Number(response.headers.get('content-length'))>max)throw new Error('插件来源超过允许大小')
 const reader=response.body?.getReader();if(!reader)throw new Error('插件来源没有内容');const chunks:Uint8Array[]=[];let size=0
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw new Error('插件来源超过允许大小');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
 return Buffer.concat(chunks)
}
export function archiveTextFiles(archive:Buffer):Map<string,string>{return new Map([...archiveFiles(archive)].filter(([n])=>!/\.(?:png|jpe?g|webp|gif|avif)$/i.test(n)).map(([n,b])=>[n,b.toString('utf8')]))}

let memory:{state:DesktopMarketState;root:string}|undefined,flight:Promise<DesktopMarketState>|undefined
export async function desktopMarket(force=false,request:MarketRequest=fetch):Promise<DesktopMarketState>{
 const root=getConfigDir();if(!force&&memory?.root===root&&Date.now()-memory.state.fetchedAt<5*60*1000)return memory.state
 if(flight)return flight
 flight=(async()=>{
  const saved=readJsonFileSafe<DesktopMarketState>(join(root,'plugin-market-cache.json')),sources=marketSources()
  const results=await Promise.all(sources.map(async source=>{try{const bytes=await marketBytes(source.url,32*1024*1024,request),raw:unknown=JSON.parse(bytes.toString('utf8'));const entries=source.format==='paseo'?parseMarketIndex(raw).map(e=>({...e,marketId:source.id,marketName:source.name})):parseDshMarket(raw,source);return {source,entries}}catch{return {source,entries:saved?.entries?.filter(e=>(e.marketId??'paseo')===source.id)??[],error:'暂时无法更新此索引，已保留缓存'}}}))
  const entries=results.flatMap(r=>r.entries);if(!entries.length)throw new Error('暂时无法读取插件市场；请稍后重试或添加其它索引源')
  const stale=results.some(r=>r.error),state:DesktopMarketState={entries,fetchedAt:Date.now(),stale,...(stale?{error:'部分市场暂时离线，显示可用目录与缓存'}:{}),source:'Paseo Cafe / DSH Market',sources:results.map(r=>({...r.source,count:r.entries.length,error:r.error}))}
  if(entries.length)writeJsonFileAtomic(join(root,'plugin-market-cache.json'),state)
  memory={state,root};return state
 })().finally(()=>{flight=undefined});return flight

}
const previewCache=new Map<string,DesktopPluginOffer>()
export async function previewMarketPlugin(id:string):Promise<DesktopPluginOffer>{
 const state=await desktopMarket(),entry=state.entries.find(e=>e.id===id);if(!entry)throw new Error('插件不在当前市场目录')
 const key=getConfigDir()+entry.id+JSON.stringify(entry.artifact);const cached=previewCache.get(key);if(cached)return cached
 let artifact=entry.artifact;let files:PluginPackageFiles
 if(artifact.kind==='npm-version'){const registry=new URL(artifact.registry);if(registry.origin!=='https://registry.npmjs.org')throw new Error('此索引要求额外npm注册表，当前未授权该来源');const metadata:unknown=JSON.parse((await marketBytes(`${registry.origin}/${encodeURIComponent(artifact.package)}/${encodeURIComponent(artifact.version)}`,2*1024*1024)).toString('utf8'));const dist=z.object({dist:z.object({tarball:z.string().url(),integrity:z.string().regex(/^sha512-/)})}).parse(metadata).dist;artifact={kind:'npm',package:artifact.package,version:artifact.version,resolved:dist.tarball,integrity:dist.integrity}}
 if(artifact.kind==='npm'){
  const url=new URL(artifact.resolved);if(url.hostname!=='registry.npmjs.org')throw new Error('插件发行包来源不受支持')
  const bytes=await marketBytes(artifact.resolved);const hash='sha512-'+createHash('sha512').update(bytes).digest('base64');if(hash!==artifact.integrity)throw new Error('插件内容与市场integrity不一致，未安装')
  files=archiveFiles(bytes)
 }else{
  const match=artifact.remote.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);if(!match)throw new Error('仅支持公开GitHub插件来源')
  files=archiveFiles(await marketBytes(`https://codeload.github.com/${match[1]}/${match[2]}/tar.gz/${artifact.commit}`))
  if(artifact.pluginPath){const prefix=artifact.pluginPath.replace(/\/+$/,'')+'/';if(prefix.startsWith('/')||prefix.split('/').includes('..'))throw new Error('插件目录无效');const executablePaths=(files.executablePaths??[]).filter(n=>n.startsWith(prefix)).map(n=>n.slice(prefix.length));files=new Map([...files].filter(([n])=>n.startsWith(prefix)).map(([n,s])=>[n.slice(prefix.length),s]));files.executablePaths=executablePaths}
 }
 const manifestRaw=files.get('paseo-plugin.json')??files.get('package.json');if(!manifestRaw)throw new Error('插件发行包缺少清单')
 const sourceManifest:unknown=JSON.parse(manifestRaw.toString('utf8'));if(!sourceManifest||typeof sourceManifest!=='object')throw new Error('插件清单无效')
 let themes=readThemePackage(files)
 if(entry.marketId==='dsh'&&entry.categories.some(c=>c==='theme'||c==='themes')){const {evaluateDshTheme}=await import('./dsh-theme-host');try{const dynamic=await evaluateDshTheme(files);const byId=new Map(themes.map(t=>[t.id,t]));for(const theme of dynamic)byId.set(theme.id,theme);themes=[...byId.values()].slice(0,128)}catch(error){if(!themes.length)throw error;for(const theme of themes)theme.warnings.push('动态背景或设置尚未完整生效：'+(error instanceof Error?error.message:String(error)).slice(0,250))}}
 if(entry.marketId!=='paseo'&&(files.has('index.server.ts')||files.has('index.server.js')))for(const t of themes)t.warnings.push('此包包含服务端代码；需要启用相应插件运行时。')
 const isThemeOnly=entry.marketId==='dsh'&&entry.categories.some(c=>c==='theme'||c==='themes')
 const runtime=isThemeOnly&&themes.length?undefined:stagePluginFiles(files,entry.marketId==='paseo'?'paseo':'dsh')
 const safeId=entry.marketId==='dsh'?'market-'+entry.id.replace(/[^a-z0-9-]/gi,'-').toLowerCase().slice(0,40)+'-'+createHash('sha256').update(entry.id).digest('hex').slice(0,10):'cafe-'+entry.id.replace('/','-').slice(0,44)+'-'+createHash('sha256').update(entry.id).digest('hex').slice(0,10)
 const manifest={id:safeId,name:entry.name.slice(0,100),version:/^\d+\.\d+\.\d+$/.test(entry.version)?entry.version:'0.0.0',description:entry.description.slice(0,2000),capabilities:[...(themes.length?['theme' as const]:[]),...(runtime?['runtime' as const]:[])],...(themes.length?{themes}:{}),...(runtime?{runtime}:{})}
 const offer:DesktopPluginOffer={manifest,source:`${entry.marketName??'Paseo Cafe'}: ${entry.id}@${entry.version}`,digest:pluginDigest(manifest)}
 previewCache.set(key,offer);if(previewCache.size>50)previewCache.delete(previewCache.keys().next().value!);return offer
}
export function verifiedMarketOffer(offer:DesktopPluginOffer):boolean{return [...previewCache.values()].some(v=>v.source===offer.source&&v.digest===offer.digest&&pluginDigest(offer.manifest)===v.digest)}
