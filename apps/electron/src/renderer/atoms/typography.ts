import {atom,useStore} from 'jotai'
import * as React from 'react'
import {normalizeTypography} from '@proma/shared'
import type {TypographyPreferences} from '@proma/shared'
export const typographyAtom=atom<TypographyPreferences>({})
export function applyTypography(raw:unknown):void {
 const value=normalizeTypography(raw),root=document.documentElement
 for(const [field,css]of [['uiFont','--user-ui-font'],['codeFont','--user-code-font'],['conversationFont','--user-conversation-font']]as const){if(value[field])root.style.setProperty(css,['serif','sans-serif','monospace','system-ui'].includes(value[field]!)?value[field]!:JSON.stringify(value[field]));else root.style.removeProperty(css);root.toggleAttribute('data-user-'+field,!!value[field])}
 for(const [field,css]of [['uiSize','--user-ui-size'],['codeSize','--user-code-size'],['conversationSize','--user-conversation-size']]as const){if(value[field])root.style.setProperty(css,value[field]+'px');else root.style.removeProperty(css);root.toggleAttribute('data-user-'+field,!!value[field])}
 root.toggleAttribute('data-user-typography',Object.keys(value).length>0)
 root.style.setProperty('--user-ui-scale',String((value.uiSize??14)/14))
 window.dispatchEvent(new Event('tervell-theme-changed'))
}
export function useTypographySync():void {
 const store=useStore()
 React.useEffect(()=>{let live=true;const refresh=async()=>{const settings=await window.electronAPI.getSettings();if(!live)return;const next=normalizeTypography(settings.typography);if(JSON.stringify(next)!==JSON.stringify(store.get(typographyAtom))){store.set(typographyAtom,next);applyTypography(next)}};void refresh().catch(console.error);const timer=setInterval(()=>void refresh().catch(console.error),5000);return()=>{live=false;clearInterval(timer)}},[store])
}
