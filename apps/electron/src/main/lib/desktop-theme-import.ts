import {readFileSync,readdirSync,lstatSync} from 'node:fs'
import {join,isAbsolute,basename,dirname,resolve,relative} from 'node:path'
import {createHash} from 'node:crypto'
import type {DesktopPluginOffer} from '@proma/shared'
import {readThemePackage} from './theme-package'
import {pluginDigest} from './desktop-extension-config'
export function previewThemePath(path:string):DesktopPluginOffer{
 if(!isAbsolute(path))throw new Error('主题来源需要绝对路径')
 const files=new Map<string,Buffer>();const stat=lstatSync(path)
 if(stat.isSymbolicLink())throw new Error('请选择实际主题文件或目录')
 if(stat.isFile()){if(stat.size>1024*1024)throw new Error('主题文件过大');files.set(basename(path),readFileSync(path));const source=readFileSync(path,'utf8');for(const match of source.matchAll(/[\"']([^\"'\n]+\.(?:png|jpe?g|webp|gif|svg|avif))[\"']/gi)){const name=match[1]!,file=resolve(dirname(path),name);if(relative(dirname(path),file).startsWith('..')||isAbsolute(name))continue;try{const info=lstatSync(file);if(!info.isSymbolicLink()&&info.isFile()&&info.size<=8*1024*1024)files.set(name,readFileSync(file))}catch{/* 缺失图片在主题预览中报告。 */}}}
 else{let bytes=0,count=0;const visit=(dir:string,prefix='',depth=0):void=>{if(depth>8)return;for(const file of readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','dist','tests','__tests__','test'].includes(file.name)||file.isSymbolicLink())continue;const name=prefix+file.name,absolute=join(dir,file.name);if(file.isDirectory())visit(absolute,name+'/',depth+1);else if(/\.(?:css|jsonc?|[cm]?[jt]sx?|txt|png|jpe?g|webp|gif|svg|avif)$/i.test(name)){const info=lstatSync(absolute);if(info.size>8*1024*1024)continue;bytes+=info.size;if(bytes>40*1024*1024||++count>500)throw new Error('主题目录过大，请选择具体色板文件');files.set(name,readFileSync(absolute))}}};visit(path)}
 const presets=readThemePackage(files)
 if(!presets.length)throw new Error('没有识别到静态主题色板；支持Paseo addTheme、Codex导入串、DSH色板/种子/CSS及VS Code颜色JSON。源项目专用交互脚本需要适配。')
 const id='theme-'+createHash('sha256').update(path).digest('hex').slice(0,16),manifest={id,name:presets[0]!.name.slice(0,100),version:'1.0.0',description:'从本地主题来源导入的色板，适配Tervell完整界面。',capabilities:['theme' as const],themes:presets}
 return {manifest,source:path,digest:pluginDigest(manifest)}
}
