import {posix} from 'node:path'
import type {DesktopThemePreset} from '@proma/shared'
import {validThemeImage} from '@proma/shared/utils'
import {extractStaticThemes,parseThemeText} from './theme-static-reader'
const imageType=(name:string):string|undefined=>({png:'png',jpg:'jpeg',jpeg:'jpeg',webp:'webp',gif:'gif',avif:'avif',svg:'svg+xml'}[name.split('.').pop()?.toLowerCase()??''])
/** 一份宿主无关的主题包：源码/清单/图片一起读取，不按主题作者硬编码。 */
export function readThemePackage(files:Map<string,Buffer>):DesktopThemePreset[]{
 const text=new Map([...files].filter(([n,b])=>!imageType(n)&&b.length<1024*1024).map(([n,b])=>[n,b.toString('utf8')]))
 const image=(value:string,from:string):string|undefined=>{
  if(validThemeImage(value))return value
  if(/^[a-z]+:|^[/\\]|\0/i.test(value))return
  const path=posix.normalize(posix.join(posix.dirname(from),value));if(path==='..'||path.startsWith('../'))return
  const entry=files.get(path)??[...files].find(([n])=>n.endsWith('/'+value))?.[1],mime=imageType(value)
  if(!entry||!mime||entry.length>8*1024*1024)return
  const url=`data:image/${mime};base64,${entry.toString('base64')}`;return validThemeImage(url)?url:undefined
 }
 const resolve=(v:string,from:string):string=>image(v,from)??v
 const themes=[...extractStaticThemes(text)]
 for(const [name,source]of text)if(/\.(?:jsonc?|css|txt)$/.test(name)&&!/(?:^|\/)(?:tests?|__tests__)(?:\/|$)/.test(name)){
  try{themes.push(...parseThemeText(source,name,(v)=>resolve(v,name)))}catch{/* 非主题数据不成为空安装包。 */}
 }
 for(const theme of themes){if(theme.background?.image){const resolved=image(theme.background.image,'index.ts');if(resolved)theme.background.image=resolved;else{delete theme.background.image;theme.warnings.push('主题声明的背景图片未包含在发行包中，不能恢复缺失资源。')}}}
 return [...new Map(themes.map(t=>[t.id,t])).values()].slice(0,128)
}
