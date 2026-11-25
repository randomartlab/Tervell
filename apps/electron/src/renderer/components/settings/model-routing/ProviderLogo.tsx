import * as React from 'react'
import {Boxes} from 'lucide-react'
import {cn} from '@/lib/utils'
import randomMarketLogo from '@/assets/random-market/rd-mark-square.png'

const files=import.meta.glob<string>('../../../assets/gateway-providers/*.{svg,png,webp}',{eager:true,query:'?url',import:'default'})
const assets=new Map(Object.entries(files).map(([path,url])=>[path.split('/').at(-1)!.replace(/\.[^.]+$/,''),{url,monochrome:path.endsWith('.svg')&&!path.endsWith('-color.svg')}]))
const cachedIcons=new Map<string,string>()
const pendingIcons=new Map<string,Promise<string|undefined>>()
/** 源码品牌图标本地打包，供应商缓存图片只通过受限主进程接口读取。 */
export function ProviderLogo({icon,className}:{icon?:string;className?:string}):React.ReactElement{
 const asset=icon&&/^[a-zA-Z0-9_-]+$/.test(icon)?assets.get(icon):undefined
 const [failed,setFailed]=React.useState(false),[cached,setCached]=React.useState<{icon:string;url:string}>()
 React.useEffect(()=>{
  let active=true;setFailed(false);setCached(undefined)
  if(!icon?.startsWith('file:'))return
  const kept=cachedIcons.get(icon);if(kept){setCached({icon,url:kept});return}
  let fetch=pendingIcons.get(icon)
  if(!fetch){fetch=window.electronAPI.modelGatewayIcon(icon);pendingIcons.set(icon,fetch)}
  void fetch.then(url=>{if(url){cachedIcons.set(icon,url);if(active)setCached({icon,url})}}).catch(()=>{}).finally(()=>pendingIcons.delete(icon))
  return()=>{active=false}
 },[icon])
 const picture=icon==='random-market'?{url:randomMarketLogo,monochrome:false}:cached&&cached.icon===icon?{url:cached.url,monochrome:false}:asset
 return <span aria-hidden="true" className={cn('inline-flex size-8 shrink-0 items-center justify-center text-foreground',className)} data-provider-icon={icon??'generic'}>
  {!picture||failed?<Boxes className="size-5 text-muted-foreground"/>:picture.monochrome?<span className="block size-full bg-current" style={{maskImage:`url("${picture.url}")`,WebkitMaskImage:`url("${picture.url}")`,maskPosition:'center',WebkitMaskPosition:'center',maskSize:'contain',WebkitMaskSize:'contain',maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat'}}/>:<img src={picture.url} alt="" draggable={false} loading="lazy" onError={()=>setFailed(true)} className="size-full object-contain" width={32} height={32}/>}
 </span>
}
