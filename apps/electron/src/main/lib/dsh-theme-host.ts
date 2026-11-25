import {readFileSync,existsSync} from 'node:fs'
import {join} from 'node:path'
import {DSH_BASE_TOKENS} from './third-party/dsh/base-tokens'
import type {DesktopThemePreset} from '@proma/shared'
import {presetFromValue,parseThemeText} from './theme-static-reader'
import {validThemeImage,validThemeGradient} from '@proma/shared/utils'
interface ThemeCapture {definitions:unknown[];css:string;tokens:Record<string,string>;backgrounds:string[];missing:string[];changed:boolean}
/** 客户端主题在无 preload、无 Node、无网络的独立 Chromium renderer 中计算。 */
export async function evaluateDshTheme(files:Map<string,Buffer>):Promise<DesktopThemePreset[]>{
 const metadata=files.get('package.json');if(!metadata)return []
 const pkg=JSON.parse(metadata.toString('utf8')) as {name?:string;exports?:Record<string,unknown>}
 const exported=pkg.exports?.['./client'],conditional=exported&&typeof exported==='object'?exported as Record<string,unknown>:{}
 const path=typeof exported==='string'?exported:typeof conditional.default==='string'?conditional.default:typeof conditional.import==='string'?conditional.import:undefined
 const client=path?path.replace(/^\.\//,''):['client.js','lib/client.js','dist/client.js'].find(n=>files.has(n))
 if(!client||!files.has(client))throw new Error('DSH包未包含可用客户端入口：'+String(pkg.exports?.['./client'])+'；发行文件：'+[...files.keys()].slice(0,20).join('、'))
 const source=files.get(client)!.toString('utf8');if(source.length>3*1024*1024)throw new Error('动态主题客户端超过3MB')
 const {BrowserWindow,session,app}=await import('electron'),partition='tervell-theme-capture-'+Date.now()+'-'+Math.random().toString(36).slice(2)
 const origin='https://theme.tervell.invalid'
 const html='<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src \'self\' data: blob:; script-src \'unsafe-inline\' \'unsafe-eval\'"></head><body><div id="root"><aside data-pane="sidebar"></aside><main data-pane="conversation"></main></div></body></html>'
 const asset=(path:string):{name:string;bytes:Buffer}|undefined=>{const clean=decodeURIComponent(path).split(/[?#]/)[0]!.replace(/^\/+/,''),entry=[...files].find(([name])=>name===clean||clean.endsWith('/'+name));return entry?{name:entry[0],bytes:entry[1]}:undefined}
 const isolated=session.fromPartition(partition);isolated.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith(origin+'/')&&!details.url.startsWith('data:')&&!details.url.startsWith('blob:')}))
 isolated.protocol.handle('https',request=>{const url=new URL(request.url);if(url.origin!==origin)return new Response(null,{status:403});if(url.pathname==='/')return new Response(html,{headers:{'content-type':'text/html;charset=utf-8'}});const file=asset(url.pathname),type=file?.name.split('.').pop()?.toLowerCase();const mime:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml',json:'application/json'};return file?new Response(new Uint8Array(file.bytes),{headers:{'content-type':mime[type??'']??'application/octet-stream'}}):new Response(null,{status:404})})
 const win=new BrowserWindow({show:false,width:1200,height:800,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,session:isolated,webSecurity:true,backgroundThrottling:false}})
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault())
 const timer=setTimeout(()=>{if(!win.isDestroyed())win.destroy()},6000)
 try{
  await win.loadURL(origin+'/')
  const runtimeRoots=[join(process.resourcesPath,'third-party/react-runtime'),join(app.getAppPath(),'resources/third-party/react-runtime')],runtimeRoot=runtimeRoots.find(dir=>existsSync(join(dir,'react.js')))
  if(!runtimeRoot)throw new Error('缺少内置主题渲染运行时')
  await win.webContents.executeJavaScript(readFileSync(join(runtimeRoot,'react.js'),'utf8')+'\n'+readFileSync(join(runtimeRoot,'react-dom.js'),'utf8'))
  const result:DesktopThemePreset[]=[];const diagnostics:string[]=[]
  for(const mode of ['light','dark']){
   const program=`(async()=>{
    const definitions=[],missing=new Set(),modules=new Map(),effects=[];
    document.head.querySelectorAll('style').forEach(n=>n.remove());document.body.innerHTML='<div id="root"><aside data-pane="sidebar"></aside><main data-pane="conversation"></main></div>';document.body.setAttribute('data-ds-dark-theme','');if(${JSON.stringify(mode)}==='light')document.body.removeAttribute('data-ds-dark-theme');document.documentElement.style.colorScheme=${JSON.stringify(mode)};document.body.style.cssText='';const base=document.createElement('style');base.textContent=${JSON.stringify(DSH_BASE_TOKENS)};document.head.append(base);
    const watched=['--dsw-alias-bg-base','--dsw-alias-bg-layer-1','--dsw-alias-label-primary','--dsw-alias-brand-primary','--dsw-specific-sidebar-fill'];const before=watched.map(k=>getComputedStyle(document.body).getPropertyValue(k));
    const theme={getTheme:()=>({themes:definitions.filter(d=>d.tokens),preference:${JSON.stringify(mode)},active:{id:${JSON.stringify(mode)},colorScheme:${JSON.stringify(mode)},tokens:{}}}),registerTheme:t=>{definitions.push(t);return()=>{}},register:t=>{definitions.push(t);return()=>{}},setTheme:()=>{},overrideTokens:(_id,t)=>{const tokens=Object.fromEntries(Object.entries(t).map(([k,v])=>[k,typeof v==='object'?v[${JSON.stringify(mode)}]:v]));definitions.push({id:'runtime-'+${JSON.stringify(mode)}+'-'+definitions.length,colorScheme:${JSON.stringify(mode)},tokens});for(const[k,v]of Object.entries(tokens))if(typeof v==='string')document.body.style.setProperty(k,v);return()=>{}}};
    const scope=()=>({getSnapshot:()=>({status:'ready',value:null}),subscribe:()=>()=>{},set:async()=>{}});const noop=()=>()=>{},locale={register:noop,bind:()=>k=>k,getLocale:()=> 'zh',get:()=> 'zh'};let ctx;
    const react=globalThis.React,reactDom=globalThis.ReactDOM;
    const slotRoots=[];const registerSlot=(definition,Component)=>{if(typeof Component!=='function')return()=>{};const container=document.createElement('section');container.dataset.slot=definition.name||'plugin';document.body.append(container);const root=reactDom.createRoot(container);try{root.render(react.createElement(Component,{...(typeof definition.inject==='function'?definition.inject():{}),locale:'zh',view:'detail'}))}catch(e){missing.add('slot:'+String(e.message))}slotRoots.push(root);return()=>{root.unmount();container.remove()}};

    ctx={theme,locale,get:name=>{if(name==='theme')return theme;if(name==='settingsScope')return ctx.settingsScope;if(name==='configForms')return ctx.configForms;if(name==='slots')return ctx.slots;if(name==='locale')return locale;missing.add('service:'+name);return undefined},effect:fn=>{try{const d=fn();if(typeof d==='function')effects.push(d)}catch(e){missing.add(String(e.message).slice(0,200))}},on:noop,emit:()=>{},inject:(_requirements,fn)=>{if(typeof fn==='function')return fn(ctx);return()=>{}},slots:{inject:(_name,fn)=>typeof fn==='function'?fn():()=>{},register:registerSlot},settingsScope:{bind:scope},configForms:{get:scope,register:noop},runtime:{}};
    const snapshotStore=initial=>{let state=typeof initial==='function'?initial():initial;const listeners=new Set();const notify=()=>{for(const fn of listeners)fn()};return{getSnapshot:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},set:next=>{state=next;notify()},update:fn=>{const draft=structuredClone(state);const next=fn(draft);state=next===undefined?draft:next;notify()}}};
    const defineStore=spec=>{const store=snapshotStore(spec.init);const actions=Object.fromEntries(Object.entries(spec.actions||{}).map(([key,fn])=>[key,(...args)=>store.update(draft=>fn(draft,...args))]));return{...store,actions,create:()=>({...store,actions}),spec}};
    const require=name=>{if(name==='@deepseek-ai/dsh-client-store')return{defineStore,createSnapshotStore:snapshotStore,shallowEqual:(a,b)=>JSON.stringify(a)===JSON.stringify(b),notifySubscribers:ls=>{for(const fn of ls)fn()}};
      if(name==='@deepseek-ai/dsh-client-ui-primitives'){missing.add('ui:DSH组件仅映射为兼容控件，原宿主的布局和业务行为需另行检查');const known={Toast:{success:()=>{},error:()=>{},info:()=>{}},isDarwinDesktop:()=>false,writeClipboard:async()=>{},focusWithoutRing:e=>e?.focus()};return new Proxy(known,{get:(target,key)=>key in target?target[key]:props=>react.createElement(typeof key==='string'&&/Button|Switch|Checkbox/.test(key)?'button':'span',props,props?.children)})}
      if(name==='react-dom'||name==='react-dom/client')return reactDom;
      if(name==='react')return react;if(name==='react/jsx-runtime')return{jsx:(type,props,key)=>react.createElement(type,{...props,key}),jsxs:(type,props,key)=>react.createElement(type,{...props,key}),Fragment:react.Fragment};
      if(modules.has(name))return modules.get(name);missing.add('module:'+name);throw new Error('Missing host module '+name)};
    globalThis.__ModuleLoader__={load:entry=>{try{const exp=entry.factory(require);modules.set(entry.id,exp);if(exp&&typeof exp.apply==='function')exp.apply(ctx)}catch(e){missing.add(String(e.message).slice(0,200))}}};
    try{(0,eval)(${JSON.stringify(source)})}catch(e){missing.add(String(e.message).slice(0,200))}
    await new Promise(r=>setTimeout(r,180));
    const css=[...document.querySelectorAll('style')].map(n=>n.textContent).join('\\n'),style=getComputedStyle(document.body),tokens={};
    for(const key of ['--dsw-alias-bg-base','--dsw-alias-bg-layer-1','--dsw-alias-bg-layer-2','--dsw-alias-bg-layer-3','--dsw-specific-sidebar-fill','--dsw-alias-label-primary','--dsw-alias-label-secondary','--dsw-alias-brand-primary','--dsw-alias-border-l1']){const value=style.getPropertyValue(key).trim();if(value){const probe=document.createElement('i');probe.style.color=value;document.body.append(probe);const canvas=document.createElement('canvas'),context=canvas.getContext('2d');if(context){context.fillStyle=style.getPropertyValue('--dsw-alias-bg-base').trim()||(${JSON.stringify(mode)}==='dark'?'#111111':'#ffffff');context.fillRect(0,0,1,1);context.fillStyle=getComputedStyle(probe).color;context.fillRect(0,0,1,1);const rgb=context.getImageData(0,0,1,1).data;tokens[key]='#'+[rgb[0],rgb[1],rgb[2]].map(v=>v.toString(16).padStart(2,'0')).join('')}probe.remove()}}
    const backgrounds=[...document.body.querySelectorAll('*')].map(n=>getComputedStyle(n).backgroundImage).filter(v=>v&&v!=='none');
    const normalized=definitions.map((definition,index)=>{if(!definition.tokens)return definition;const scheme=definition.colorScheme||${JSON.stringify(mode)},scope=document.createElement('div');scope.style.colorScheme=scheme;for(const[k,v]of Object.entries(definition.tokens)){const value=typeof v==='object'?v?.[scheme]:v;if(typeof value==='string')scope.style.setProperty(k,value)}document.body.append(scope);const colors={};for(const k of Object.keys(definition.tokens)){const value=getComputedStyle(scope).getPropertyValue(k).trim();if(!value||!CSS.supports('color',value))continue;const probe=document.createElement('i');probe.style.color=value;scope.append(probe);const canvas=document.createElement('canvas'),context=canvas.getContext('2d');context.fillStyle=scheme==='dark'?'#111111':'#ffffff';context.fillRect(0,0,1,1);context.fillStyle=getComputedStyle(probe).color;context.fillRect(0,0,1,1);const rgb=context.getImageData(0,0,1,1).data;colors[k]='#'+[rgb[0],rgb[1],rgb[2]].map(v=>v.toString(16).padStart(2,'0')).join('');probe.remove()}scope.remove();return{...definition,id:definition.id||'runtime-'+scheme+'-'+index,colorScheme:scheme,tokens:colors}});
    const data={definitions:normalized,css,tokens,backgrounds,missing:[...missing],changed:watched.some((k,i)=>getComputedStyle(document.body).getPropertyValue(k)!==before[i])};for(const root of slotRoots)try{root.unmount()}catch{};for(const fn of effects.reverse())try{fn()}catch{};return data;
   })()`
   const data=await win.webContents.executeJavaScript(program) as ThemeCapture
   diagnostics.push(...data.missing)
   const changed=data.definitions.length>0||data.changed||data.backgrounds.length>0
   if(!changed)continue
   for(const [i,d]of data.definitions.entries()){try{result.push(...presetFromValue(d,`${pkg.name??'DSH'}-${mode}-${i}`))}catch{/* CSS现代颜色由下面Chromium归一结果承接。 */}}
   result.push(...presetFromValue({id:`${pkg.name}-${mode}`,name:`${pkg.name} ${mode}`,colorScheme:mode,tokens:data.tokens},String(pkg.name)))
   if(!result.length)result.push(...parseThemeText(data.css.replace(DSH_BASE_TOKENS,''),`${pkg.name}-${mode}.css`))
   for(const t of result.filter(t=>t.appearance===mode)){
    const declaration=data.backgrounds.find(v=>v.startsWith('url(')),reference=declaration?.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
    if(reference){const file=asset(reference.startsWith(origin)?new URL(reference).pathname:reference),extension=file?.name.split('.').pop()?.toLowerCase(),mime:Record<string,string>={png:'png',jpg:'jpeg',jpeg:'jpeg',webp:'webp',gif:'gif',avif:'avif',svg:'svg+xml'};const image=file&&mime[extension??'']?`data:image/${mime[extension! ]};base64,${file.bytes.toString('base64')}`:reference;if(validThemeImage(image))t.background={...t.background,image}}
    const gradient=data.backgrounds.find(validThemeGradient);if(gradient)t.background={...t.background,gradient}
   }
   for(const t of result)if(data.missing.length)t.warnings.push('动态主题宿主未提供：'+data.missing.slice(0,5).join('；'))
  }
  if(!result.length)throw new Error('DSH主题运行时尚缺：'+([...new Set(diagnostics)].join('；')||'未注册主题色或背景'))
  return [...new Map(result.map(t=>[t.id,t])).values()].slice(0,128)
 }finally{clearTimeout(timer);if(!win.isDestroyed())win.destroy();isolated.protocol.unhandle('https');await isolated.clearStorageData()}
}
