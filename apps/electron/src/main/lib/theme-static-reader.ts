import ts from 'typescript'
import type {DesktopThemePreset} from '@proma/shared'
import {completePalette,hexRgb,rgbHex,mixColor,validThemeImage,validThemeGradient} from '@proma/shared/utils'
import {DesktopThemePresetSchema} from './desktop-theme-schema'

interface StaticObject { [key:string]:StaticValue }
type StaticValue=string|number|boolean|null|StaticValue[]|StaticObject
interface Scope {parent?:Scope;bindings:Map<string,{node:ts.Expression;scope:Scope}>;values:Map<string,StaticValue>}
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
export function colorHex(v:unknown,background='#ffffff'):string|undefined{
 if(typeof v!=='string')return
 const s=v.trim()
 if(/^#[\da-f]{3}$/i.test(s))return '#'+s.slice(1).split('').map(c=>c+c).join('').toLowerCase()
 if(/^#[\da-f]{6}$/i.test(s))return s.toLowerCase()
 if(/^#[\da-f]{8}$/i.test(s))return mixColor(background,s.slice(0,7),parseInt(s.slice(7,9),16)/255)
 const rgb=s.match(/^rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)(?:[, /]+[\d.%]+)?\s*\)$/i)
 if(rgb){const hex=rgbHex(rgb.slice(1,4).map(Number));const alpha=s.match(/(?:,|\/)\s*([\d.]+)(%)?\s*\)$/);return s.startsWith('rgba')&&alpha?mixColor(background,hex,Math.min(1,Number(alpha[1])/(alpha[2]?100:1))):hex}
 return
}
export function presetFromValue(value:unknown,fallback:string,depth=0,resolveAsset?:(value:string)=>string):DesktopThemePreset[]{
 if(depth>20)return []
 const v=object(value),name=typeof v.name==='string'?v.name:typeof object(v.name).zh==='string'?String(object(v.name).zh):typeof v.id==='string'?v.id:fallback
 if(Array.isArray(value))return value.slice(0,128).flatMap((x,i)=>presetFromValue(x,`${fallback}-${i+1}`,depth+1,resolveAsset))
 if(Array.isArray(v.themes))return v.themes.slice(0,128).flatMap(x=>presetFromValue(x,name,depth+1,resolveAsset))
 const parsed=DesktopThemePresetSchema.safeParse(v);if(parsed.success)return [parsed.data]
 const tokenMap=object(v.tokens)
 if(Object.keys(tokenMap).length){
  const read=(key:string,depth=0):string|undefined=>{if(depth>16)return;const rawValue=tokenMap[key],value=typeof rawValue==='string'?rawValue:object(rawValue)[v.colorScheme==='light'?'light':'dark'];if(typeof value!=='string')return;const ref=value.match(/^var\((--[\w-]+)\)$/);return ref?read(ref[1]!,depth+1):colorHex(value,colorHex(tokenMap['--dsw-alias-bg-base'])??'#ffffff')}
  const pick=(...keys:string[])=>keys.map(k=>read(k)).find(Boolean),background=pick('--dsw-alias-bg-base','--dsw-alias-bg-layer-1'),foreground=pick('--dsw-alias-label-primary')
  if(background&&foreground)return presetFromValue({id:v.id,name,appearance:v.colorScheme,colors:{background,foreground,raised:pick('--dsw-alias-bg-layer-2'),control:pick('--dsw-alias-bg-layer-3'),sidebar:pick('--dsw-specific-sidebar-fill'),accent:pick('--dsw-alias-brand-primary'),mutedForeground:pick('--dsw-alias-label-secondary'),border:pick('--dsw-alias-border-l2','--dsw-alias-border-l1'),codeBackground:pick('--dsw-alias-markdown-code-block'),success:pick('--dsw-alias-state-success-primary'),danger:pick('--dsw-alias-state-error-primary')}},fallback).map(t=>({...t,format:'dsh'}))
 }
 const colors=object(v.colors),theme=object(v.theme),seeds=object(v.seeds),palette=object(v.palette)
 const valid=(r:Record<string,unknown>,...keys:string[]):string|undefined=>keys.map(k=>colorHex(r[k])).find(Boolean)
 let bg=valid(colors,'background','editor.background'),fg=valid(colors,'foreground','editor.foreground'),accent=valid(colors,'accent','button.background','focusBorder'),raised=valid(colors,'raised','panel.background','sideBar.background'),control=valid(colors,'control','input.background'),sidebar=valid(colors,'sidebar','sideBar.background'),codeBackground=valid(colors,'codeBackground','editor.background'),format:DesktopThemePreset['format']='paseo'
 let appearance=v.appearance==='light'||v.variant==='light'||v.type==='light'||v.mode==='light'?'light':'dark'
 let success=valid(colors,'success'),danger=valid(colors,'danger')
 if(theme.surface||v.codeThemeId){bg=valid(theme,'background','surface');fg=valid(theme,'foreground','ink');raised=valid(theme,'surface');accent=valid(theme,'accent');const semantic=object(theme.semanticColors);success=valid(semantic,'diffAdded');danger=valid(semantic,'diffRemoved');format='codex'}
 else if(seeds.surface){bg=valid(seeds,'surface');fg=valid(seeds,'text');accent=valid(seeds,'accent');format='dsh'}
 else if(palette.lightBackground||v.lightBackground){const p=palette.lightBackground?palette:v;return ['light','dark'].flatMap(mode=>{const b=valid(p,mode+'Background'),f=valid(p,mode+'Foreground');return b&&f?presetFromValue({id:String(v.id??fallback)+'-'+mode,name:name+' '+(mode==='light'?'Light':'Dark'),appearance:mode,typography:v.typography,colors:{background:b,foreground:f,raised:valid(p,mode+'Surface'),control:valid(p,mode+'InlineCode'),sidebar:valid(p,mode+'Sidebar'),accent:valid(p,mode+'Accent')},format:'dsh'},name):[]}).map(p=>({...p,format:'dsh'}))}
 else if(colors['editor.background'])format='vscode'
 else if(v.background&&v.foreground){bg=valid(v,'background');fg=valid(v,'foreground');accent=valid(v,'accent');format='tervell'}
 if(!bg||!fg)return []
 if(v.appearance===undefined&&v.variant===undefined&&v.type===undefined&&v.mode===undefined)appearance=hexRgb(bg).reduce((a,b)=>a+b,0)>390?'light':'dark'
 const warnings:string[]=[]
 if(v.contrast||v.opaqueWindows||object(v.theme).contrast||object(v.theme).opaqueWindows)warnings.push('源应用的透明窗口与对比度档位按Tervell色板和可读性派生。')
 if(v.codeThemeId)warnings.push('代码语法按宿主色板协调；供应商专用语法主题标识不直接加载。')
 if(v.bodyAttr||v.chrome)warnings.push('配色与背景由宿主统一呈现；源项目的专用DOM布局需要宿主能力匹配。')
 const fonts=object(theme.fonts),typography=object(v.typography)
 const fontNames:Record<string,string>={system:'system-ui',inter:'Inter Variable',avenir:'Avenir Next',rounded:'SF Pro Rounded',serif:'Iowan Old Style','sf-mono':'SF Mono',jetbrains:'JetBrains Mono','fira-code':'Fira Code',menlo:'Menlo',cascadia:'Cascadia Code'}
 const safeFont=(value:unknown):string|undefined=>typeof value==='string'&&value.length<300&&/^[a-zA-Z0-9 _.,'"-]+$/.test(value)?fontNames[value]??value:undefined
 const typographyOut={uiFont:safeFont(fonts.ui??typography.uiFont),codeFont:safeFont(fonts.code??typography.codeFont),uiFontSize:typeof typography.uiFontSize==='number'?Math.min(20,Math.max(12,typography.uiFontSize)):undefined,codeFontSize:typeof typography.codeFontSize==='number'?Math.min(20,Math.max(10,typography.codeFontSize)):undefined}
 const colorsOut=completePalette({background:bg,foreground:fg,accent,raised,control,sidebar,codeBackground,success,danger,border:valid(colors,'border','panel.border'),mutedForeground:valid(colors,'mutedForeground','descriptionForeground'),ring:valid(colors,'ring','focusBorder')})
 const background=object(v.background),imageValue=typeof v.hero==='string'?v.hero:typeof background.image==='string'?background.image:undefined
 const image=imageValue?(resolveAsset?.(imageValue)??imageValue):undefined,gradient=typeof background.gradient==='string'&&validThemeGradient(background.gradient)?background.gradient:undefined
 const resolvedBackground={...(image&&validThemeImage(image)?{image}:{}),...(gradient?{gradient}:{}),...(typeof v.heroFocus==='string'?{position:v.heroFocus}:{}),...Object.fromEntries(['position','fit','opacity','surfaceOpacity','blur','brightness'].filter(k=>background[k]!==undefined).map(k=>[k,background[k]]))}
 if(imageValue&&!resolvedBackground.image)warnings.push('主题背景资源未加载：'+imageValue)
 return [DesktopThemePresetSchema.parse({id:typeof v.id==='string'?v.id:typeof v.name==='string'?v.name: fallback,name,appearance,colors:colorsOut,format,warnings,typography:typographyOut,...(Object.keys(resolvedBackground).length?{background:resolvedBackground}:{}),...(typeof v.codeThemeId==='string'?{codeThemeId:v.codeThemeId}:{})})]

}
/** 有界的静态表达式求值，只读字面量/引用/属性/数组/map，不执行第三方JS或任何函数体。 */
export function extractStaticThemes(files:Map<string,string>):DesktopThemePreset[]{
 const themes:DesktopThemePreset[]=[];let budget=300000
 const cache=new Map<string,{file:ts.SourceFile;scope:Scope}>(),loading=new Set<string>()
 const path=(s:string):string=>{const parts:string[]=[];for(const x of s.split('/')){if(x==='..')parts.pop();else if(x!=='.'&&x)parts.push(x)}return parts.join('/')}
 const resolve=(from:string,specifier:string):string|undefined=>{if(!specifier.startsWith('.'))return;const base=path(from.split('/').slice(0,-1).join('/')+'/'+specifier);return [base,base+'.ts',base+'.tsx',base+'.js',base.replace(/\.js$/,'.ts'),base+'/index.ts'].find(s=>files.has(s))}
 const scopeFor=(statements:ts.NodeArray<ts.Statement>,parent?:Scope):Scope=>{const scope:Scope={parent,bindings:new Map(),values:new Map()};for(const s of statements)if(ts.isVariableStatement(s))for(const d of s.declarationList.declarations)if(ts.isIdentifier(d.name)&&d.initializer)scope.bindings.set(d.name.text,{node:d.initializer,scope});return scope}
 const evaluate=(n:ts.Expression,scope:Scope,depth=0,resolving=new Set<ts.Node>()):StaticValue|undefined=>{
  if(--budget<0||depth>32||resolving.has(n))return
  const next=new Set(resolving);next.add(n);const read=(x:ts.Expression,s=scope)=>evaluate(x,s,depth+1,next)
  if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return n.text
  if(ts.isTemplateExpression(n)){let text=n.head.text;for(const span of n.templateSpans){const value=read(span.expression);if(typeof value!=='string'&&typeof value!=='number')return;text+=String(value)+span.literal.text;if(text.length>1024*1024)return}return text}
  if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken){const a=read(n.left),b=read(n.right);if((typeof a==='string'||typeof a==='number')&&(typeof b==='string'||typeof b==='number'))return typeof a==='number'&&typeof b==='number'?a+b:String(a)+String(b)}
  if(ts.isNumericLiteral(n))return Number(n.text)
  if(n.kind===ts.SyntaxKind.TrueKeyword)return true;if(n.kind===ts.SyntaxKind.FalseKeyword)return false;if(n.kind===ts.SyntaxKind.NullKeyword)return null
  if(ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isSatisfiesExpression(n)||ts.isNonNullExpression(n))return read(n.expression)
  if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&ts.isIdentifier(n.expression.expression)&&n.expression.expression.text==='Object'&&n.expression.name.text==='freeze'&&n.arguments.length===1)return read(n.arguments[0]!)
  if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='join'){const list=read(n.expression.expression),separator=n.arguments[0]?read(n.arguments[0]):',';if(Array.isArray(list)&&list.every(v=>typeof v==='string'||typeof v==='number')&&typeof separator==='string')return list.join(separator).slice(0,1024*1024)}
  if(ts.isIdentifier(n)){let s:Scope|undefined=scope;while(s){if(s.values.has(n.text))return s.values.get(n.text);const b=s.bindings.get(n.text);if(b)return read(b.node,b.scope);s=s.parent}return}
  if(ts.isPropertyAccessExpression(n)){const base=read(n.expression);return base&&typeof base==='object'&&!Array.isArray(base)?base[n.name.text]:undefined}
  if(ts.isArrayLiteralExpression(n)){const a:StaticValue[]=[];for(const x of n.elements){const v=read(ts.isSpreadElement(x)?x.expression:x);if(v===undefined)return;if(ts.isSpreadElement(x)&&Array.isArray(v))a.push(...v);else a.push(v)}return a}
  if(ts.isObjectLiteralExpression(n)){const o:StaticObject=Object.create(null) as StaticObject;for(const p of n.properties){if(ts.isSpreadAssignment(p)){const v=read(p.expression);if(!v||typeof v!=='object'||Array.isArray(v))return;Object.assign(o,v)}else if(ts.isPropertyAssignment(p)&&!ts.isComputedPropertyName(p.name)){const k=ts.isIdentifier(p.name)||ts.isStringLiteral(p.name)?p.name.text:undefined;if(!k||['__proto__','constructor','prototype'].includes(k))return;const v=read(p.initializer);if(v!==undefined)o[k]=v}else if(ts.isShorthandPropertyAssignment(p)){const v=read(p.name);if(v===undefined)return;o[p.name.text]=v}else return}return o}
  return
 }
 const load=(name:string):{file:ts.SourceFile;scope:Scope}|undefined=>{
  if(cache.has(name))return cache.get(name);if(loading.has(name))return
  const source=files.get(name);if(!source||source.length>512000)return
  loading.add(name);const file=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),scope=scopeFor(file.statements);const result={file,scope};cache.set(name,result)
  for(const s of file.statements)if(ts.isImportDeclaration(s)&&ts.isStringLiteral(s.moduleSpecifier)){const target=resolve(name,s.moduleSpecifier.text),module=target?load(target):undefined;if(!module)continue;const bindings=s.importClause?.namedBindings;if(bindings&&ts.isNamedImports(bindings))for(const b of bindings.elements){const original=(b.propertyName??b.name).text,init=module.scope.bindings.get(original);if(init)scope.bindings.set(b.name.text,init);const v=module.scope.values.get(original);if(v!==undefined)scope.values.set(b.name.text,v)}}
  loading.delete(name);return result
 }
 const visit=(n:ts.Node,scope:Scope,fileName:string):void=>{
  if(--budget<0)return
  if(ts.isSourceFile(n)||ts.isBlock(n)){const child=scopeFor(n.statements,scope);for(const s of n.statements)visit(s,child,fileName);return}
  if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){
   if(n.expression.name.text==='addTheme'&&n.arguments[0])themes.push(...presetFromValue(evaluate(n.arguments[0],scope),fileName.split('/').pop()!))
   if(['map','forEach'].includes(n.expression.name.text)&&n.arguments[0]&&(ts.isArrowFunction(n.arguments[0])||ts.isFunctionExpression(n.arguments[0]))){const fn=n.arguments[0],list=evaluate(n.expression.expression,scope),param=fn.parameters[0]?.name;if(Array.isArray(list)&&param&&ts.isIdentifier(param)){for(const value of list.slice(0,128)){const child:Scope={parent:scope,bindings:new Map(),values:new Map([[param.text,value]])};visit(fn.body,child,fileName)}return}}
  }
  if(ts.isForOfStatement(n)&&ts.isVariableDeclarationList(n.initializer)){const param=n.initializer.declarations[0]?.name,list=evaluate(n.expression,scope);if(param&&ts.isIdentifier(param)&&Array.isArray(list)){for(const value of list.slice(0,128))visit(n.statement,{parent:scope,bindings:new Map(),values:new Map([[param.text,value]])},fileName);return}}
  if(ts.isVariableDeclaration(n)&&n.initializer&&!(ts.isIdentifier(n.name)&&/(?:DEFAULT|LEGACY|settings)/i.test(n.name.text))&&!/(?:^|\/)(?:tests?|__tests__|test-utils)(?:\/|$)|\.test\./.test(fileName)){const v=evaluate(n.initializer,scope);if(typeof v==='string'&&v.includes('--dsw-')&&v.includes('{'))themes.push(...parseThemeText(v,fileName+'.css'));else if(v!==undefined)themes.push(...presetFromValue(v,ts.isIdentifier(n.name)?n.name.text:fileName))}
  ts.forEachChild(n,c=>visit(c,scope,fileName))
 }
 for(const name of files.keys()){if(!/\.[cm]?[jt]sx?$/.test(name)||/(?:^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:test|spec)\./.test(name))continue;const m=load(name);if(m)visit(m.file,m.scope,name)}
 for(const [name,source]of files){if(/(?:^|\/)tests?\//.test(name))continue;for(const m of source.matchAll(/(?:^|`)([a-z0-9-]+)\|([^|\n]+)\|(light|dark)\|([A-Fa-f0-9 ]{50,100})(?=`|;?$)/gm)){const values=m[4]!.trim().split(/\s+/);if(values.length!==8||values.some(v=>!/^[a-f0-9]{6}$/i.test(v)))continue;const keys=['background','raised','control','border','foreground','mutedForeground','ring','accent'];themes.push(...presetFromValue({id:m[1],name:m[2],appearance:m[3],colors:Object.fromEntries(keys.map((k,i)=>[k,'#'+values[i]]))},name))}}
 return [...new Map(themes.map(t=>[t.id,t])).values()].slice(0,128)
}
export function parseThemeText(text:string,fileName='导入主题',resolveAsset?:(value:string)=>string):DesktopThemePreset[]{
 if(text.length>1024*1024)throw new Error('主题文件超过1MB')
 const trimmed=text.trim(),codex=trimmed.startsWith('codex-theme-v1:')?trimmed.slice(15):trimmed
 if(/^[\[{]/.test(codex)){try{return presetFromValue(JSON.parse(codex),fileName,0,resolveAsset)}catch(error){if(!(error instanceof SyntaxError))throw error}}
 if(/\.jsonc?$/.test(fileName)&&!trimmed.startsWith('codex-theme-')){
  const json=ts.parseJsonText(fileName,text)
  const read=(node:ts.Node,depth=0):unknown=>{if(depth>24)return;if(ts.isStringLiteral(node))return node.text;if(ts.isNumericLiteral(node))return Number(node.text);if(ts.isObjectLiteralExpression(node))return Object.fromEntries(node.properties.flatMap(p=>ts.isPropertyAssignment(p)&&(ts.isStringLiteral(p.name)||ts.isIdentifier(p.name))?[[p.name.text,read(p.initializer,depth+1)]]:[]));if(ts.isArrayLiteralExpression(node))return node.elements.map(n=>read(n,depth+1));if(node.kind===ts.SyntaxKind.TrueKeyword)return true;if(node.kind===ts.SyntaxKind.FalseKeyword)return false}
  const expression=json.statements[0];if(expression&&ts.isExpressionStatement(expression)){const presets=presetFromValue(read(expression.expression),fileName,0,resolveAsset);if(presets.length)return presets}
 }
 if(/\.[cm]?[jt]sx?$/.test(fileName))return extractStaticThemes(new Map([[fileName,text]]))
 // DSH/VSCode/Codex CSS只提取色彩声明，不注入第三方选择器、脚本或网络URL。
 const sections=[...text.matchAll(/([^{}]*)\{([^{}]*)\}/g)],result:DesktopThemePreset[]=[]
 for(const [index,section]of sections.entries()){
  const vars:Record<string,string>={};for(const m of section[2]!.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)\s*;/g))vars[m[1]!]=m[2]!.trim()
  const color=(key:string,depth=0):string|undefined=>{if(depth>16)return;const raw=vars[key];if(!raw)return;const ref=raw.match(/^var\((--[\w-]+)\)$/);return ref?color(ref[1]!,depth+1):colorHex(raw)}
  const pick=(...keys:string[])=>keys.map(k=>color(k)).find(Boolean)
  const bg=pick('--dsw-alias-bg-layer-1','--color-background','--background','--bg'),fg=pick('--dsw-alias-label-primary','--color-text','--foreground','--fg')
  if(!bg||!fg)continue
  result.push(...presetFromValue({id:`${fileName}-${index}`,name:fileName,appearance:section[1]!.includes('dark')?'dark':hexRgb(bg).reduce((a,b)=>a+b,0)>390?'light':'dark',colors:{background:bg,foreground:fg,raised:pick('--dsw-alias-bg-layer-2','--surface'),control:pick('--dsw-alias-bg-layer-3'),accent:pick('--dsw-alias-brand-primary','--accent'),mutedForeground:pick('--dsw-alias-label-secondary'),border:pick('--dsw-alias-border-default','--border')}},fileName).map(t=>({...t,format:'dsh' as const})))
 }
 return result
}
