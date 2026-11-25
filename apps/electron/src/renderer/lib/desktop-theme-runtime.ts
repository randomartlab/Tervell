import type {DesktopThemePreset} from '@proma/shared'
import {themeTokens} from '@proma/shared/utils'
export function applyDesktopPalette(theme:DesktopThemePreset|null):()=>void{
 const root=document.documentElement
 if(!theme)return()=>{}
 const previousStyles=[...root.classList].filter(name=>/^theme-(?:slate|ocean|forest|terminal)-(?:light|dark)$/.test(name));for(const name of previousStyles)root.classList.remove(name)
 const previousScheme=root.style.colorScheme
 const priorBackground=root.dataset.tervellBackground,background=theme.background
 const layer=background&&(background.image||background.gradient)?document.createElement('div'):undefined
 if(layer){layer.setAttribute('aria-hidden','true');layer.dataset.tervellWallpaper='true';Object.assign(layer.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'0',backgroundImage:[background?.gradient,background?.image?`url(${JSON.stringify(background.image)})`:undefined].filter(Boolean).join(','),backgroundSize:background?.fit??'cover',backgroundPosition:background?.position??'center',opacity:String(background?.opacity??.85),filter:`blur(${background?.blur??0}px) brightness(${background?.brightness??1})`});document.body.prepend(layer);root.dataset.tervellBackground='true'}
 const vars=themeTokens(theme);if(layer)vars['--tervell-surface-opacity']=String(background?.surfaceOpacity??.65);const before=new Map(Object.keys(vars).map(k=>[k,root.style.getPropertyValue(k)])),wasDark=root.classList.contains('dark')
 for(const [key,value]of Object.entries(vars))root.style.setProperty(key,value)
 root.classList.toggle('dark',theme.appearance==='dark');root.dataset.tervellExternalTheme=theme.id;root.style.colorScheme=theme.appearance
 const changes=new MutationObserver(()=>{const expected=theme.appearance==='dark';if(root.classList.contains('dark')!==expected)root.classList.toggle('dark',expected)})
 changes.observe(root,{attributes:true,attributeFilter:['class']});window.dispatchEvent(new Event('tervell-theme-changed'))
 return()=>{changes.disconnect();layer?.remove();if(priorBackground)root.dataset.tervellBackground=priorBackground;else delete root.dataset.tervellBackground;for(const [key,value]of before){if(value)root.style.setProperty(key,value);else root.style.removeProperty(key)}for(const name of previousStyles)root.classList.add(name);root.classList.toggle('dark',wasDark);delete root.dataset.tervellExternalTheme;if(previousScheme)root.style.colorScheme=previousScheme;else root.style.removeProperty('color-scheme');window.dispatchEvent(new Event('tervell-theme-changed'))}
}
export function terminalThemeFromTokens(element:Element):{background:string;foreground:string;cursor:string;selectionBackground:string}{const s=getComputedStyle(element),read=(k:string,f:string)=>s.getPropertyValue(k).trim()||f;return {background:read('--tervell-terminal-background',s.backgroundColor),foreground:read('--tervell-terminal-foreground',s.color),cursor:read('--tervell-terminal-foreground',s.color),selectionBackground:read('--tervell-terminal-selection',s.borderColor||s.color)}}
