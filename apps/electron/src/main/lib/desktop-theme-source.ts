import {readThemePackage} from './theme-package'
import {createHash}from'node:crypto'
import type{DesktopPluginOffer,DesktopThemePreset}from'@proma/shared'
import {parseThemeText}from'./theme-static-reader'
import {marketBytes,archiveFiles}from'./desktop-plugin-market'
import {pluginDigest}from'./desktop-extension-config'
const previews=new Map<string,DesktopPluginOffer>()
export function previewThemeText(text:string,name='导入主题',source='粘贴主题内容'):DesktopPluginOffer{
 const themes=parseThemeText(text,name);if(!themes.length)throw new Error('未识别到静态色板；请粘贴完整Codex导入串或主题JSON')
 return remember(themes,source,text)
}
function remember(themes:DesktopThemePreset[],source:string,identity:string):DesktopPluginOffer{
 const manifest={id:'theme-'+createHash('sha256').update(identity).digest('hex').slice(0,16),name:themes[0]!.name.slice(0,100),version:'1.0.0',description:'导入的社区主题色板，适配Tervell界面。',capabilities:['theme' as const],themes}
 const offer={manifest,source,digest:pluginDigest(manifest)};previews.set(offer.digest,offer);if(previews.size>30)previews.delete(previews.keys().next().value!);return offer
}
export async function previewThemeSource(input:string):Promise<DesktopPluginOffer>{
 if(input.length>1024*1024)throw new Error('导入内容超过1MB')
 if(!input.trim().startsWith('https://'))return previewThemeText(input)
 const url=new URL(input.trim());if(url.search||url.hash)throw new Error('请使用不含查询参数或片段的GitHub主题地址')
 if(url.username||url.password)throw new Error('GitHub地址不能包含凭据')
 if(url.hostname==='raw.githubusercontent.com'){
  const text=(await marketBytes(url.href,1024*1024)).toString('utf8'),name=decodeURIComponent(url.pathname.split('/').pop()!);const themes=parseThemeText(text,name)
  if(!themes.length)throw new Error('该文件没有可读取的主题；请改用源码目录或色板文件')
  return remember(themes,url.href,url.href)
 }
 if(url.hostname!=='github.com')throw new Error('请使用GitHub主题地址或完整主题内容')
 const parts=url.pathname.split('/').filter(Boolean);if(parts.length<2||!parts.slice(0,2).every(p=>/^[\w.-]+$/.test(p)))throw new Error('GitHub主题地址无效')
 const [owner,repository]=parts
 if(parts.length>2&&!['blob','tree'].includes(parts[2]!))throw new Error('请选择GitHub仓库、tree目录或blob文件地址')
 if(parts[2]==='blob'){
  if(parts.length<5)throw new Error('GitHub文件地址不完整')
  const raw=`https://raw.githubusercontent.com/${owner}/${repository}/${parts.slice(3).join('/')}`
  return previewThemeSource(raw)
 }
 const ref=parts[2]==='tree'?parts[3]:'HEAD';if(!ref||!/^[-\w.]+$/.test(ref))throw new Error('GitHub版本标识无效；可粘贴具体文件地址')
 let files=archiveFiles(await marketBytes(`https://codeload.github.com/${owner}/${repository}/tar.gz/${ref}`))
 if(parts[2]==='tree'&&parts.length>4){const prefix=parts.slice(4).join('/')+'/';if(prefix.split('/').includes('..'))throw new Error('主题目录无效');files=new Map([...files].filter(([n])=>n.startsWith(prefix)).map(([n,s])=>[n.slice(prefix.length),s]))}
 const unique=readThemePackage(files);if(!unique.length)throw new Error('发行包没有可读取的主题贡献；需要兼容运行时执行该宿主的API')
 return remember(unique,url.href,url.href)
}
export function verifiedThemeSource(offer:DesktopPluginOffer):boolean{const prior=previews.get(offer.digest);return !!prior&&prior.source===offer.source&&pluginDigest(offer.manifest)===prior.digest}
