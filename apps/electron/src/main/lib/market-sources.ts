import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {z} from 'zod'
import type {DesktopMarketEntry,DesktopMarketSource} from '@proma/shared'
import {getConfigDir} from './config-paths'
import {readJsonFileSafe,writeJsonFileAtomic} from './safe-file'
export const DEFAULT_MARKETS:DesktopMarketSource[]=[{id:'paseo',name:'Paseo Cafe',url:'https://plugins.paseo.sh/index.json',format:'paseo',builtin:true},{id:'dsh',name:'DSH Market',url:'https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json',format:'dsh',builtin:true}]
const sourceSchema=z.object({id:z.string().max(80),name:z.string().min(1).max(100),url:z.string().url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash}),format:z.enum(['paseo','dsh'])})
export function marketSources():DesktopMarketSource[]{return [...DEFAULT_MARKETS,...z.array(sourceSchema).max(20).catch([]).parse(readJsonFileSafe(join(getConfigDir(),'plugin-market-sources.json'))??[])]}
export function saveMarketSource(raw:unknown):DesktopMarketSource[]{const s=sourceSchema.parse(raw),all=marketSources().filter(x=>!x.builtin);if(all.some(x=>x.url===s.url)||DEFAULT_MARKETS.some(x=>x.url===s.url))throw new Error('索引源已添加');s.id='custom-'+createHash('sha256').update(s.url).digest('hex').slice(0,12);writeJsonFileAtomic(join(getConfigDir(),'plugin-market-sources.json'),[...all,s]);return marketSources()}
const localized=z.union([z.string(),z.record(z.string(),z.string())]),title=(v:unknown,fallback:string):string=>{const x=localized.safeParse(v);return x.success?typeof x.data==='string'?x.data:x.data.zh??x.data['zh-CN']??x.data.en??fallback:fallback}
const source=z.discriminatedUnion('type',[z.object({type:z.literal('npm'),registry:z.string().url().optional()}),z.object({type:z.literal('git'),url:z.string().url(),commit:z.string().regex(/^[a-f\d]{40}$/),path:z.string().optional()})])
const plugin=z.object({name:z.string().min(1).max(214),title:localized.optional(),description:localized.optional(),author:z.string().optional(),homepage:z.string().optional(),repository:z.object({url:z.string().url(),directory:z.string().optional()}).optional(),metadata:z.object({category:z.string().optional(),keywords:z.array(z.string()).optional(),labels:z.array(z.string()).optional()}).optional(),versions:z.array(z.object({version:z.string().regex(/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/),publishTimestamp:z.number(),source,engines:z.object({dsh:z.string().optional()}).optional()})).min(1).max(500)})
export function parseDshMarket(raw:unknown,market:DesktopMarketSource):DesktopMarketEntry[]{
 const doc=z.object({format:z.literal(1),plugins:z.array(z.unknown()).max(30000)}).parse(raw)
 return doc.plugins.flatMap(value=>{const parsed=plugin.safeParse(value);if(!parsed.success)return [];const p=parsed.data,versions=[...p.versions].sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true})),v=versions.find(v=>!v.version.includes('-'))??versions[0]!,s=v.source
  return [{id:`${market.id}/${p.name}`,name:title(p.title,p.name).slice(0,200),description:title(p.description,'').slice(0,6000),version:v.version,author:p.author??p.repository?.url.split('/')[3]??'社区作者',repository:p.repository?.url??p.homepage??market.url,categories:p.metadata?.category?[p.metadata.category]:[],marketId:market.id,marketName:market.name,engines:v.engines?.dsh,artifact:s.type==='npm'?{kind:'npm-version' as const,package:p.name,version:v.version,registry:s.registry??'https://registry.npmjs.org'}:{kind:'git' as const,remote:s.url,commit:s.commit,pluginPath:s.path}}]
 })
}
