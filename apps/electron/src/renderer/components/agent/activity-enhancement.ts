import * as React from 'react'
import {useAtomValue} from 'jotai'
import {desktopPluginStateAtom} from '@/atoms/desktop-themes'
import {paseoToolDetail} from '@proma/shared'
export function useVividActivityEnabled():boolean {
 return useAtomValue(desktopPluginStateAtom).installed.some(p=>p.enabled&&p.manifest.id==='builtin-vivid-activity')
}
/** 原生图标按过程类别着色；边框由主题 CSS 处理，不改字号和点击命中区。 */
export function vividIconColor(tool:string,input:unknown={}):string {
 const type=tool==='reasoning'?'reasoning':String(paseoToolDetail(tool,input,null).type)
 if(type==='reasoning')return 'text-violet-600 dark:text-violet-400'
 if(type==='read')return 'text-blue-600 dark:text-blue-400'
 if(type==='edit'||type==='write')return 'text-emerald-600 dark:text-emerald-400'
 if(type==='shell')return 'text-orange-600 dark:text-orange-400'
 if(type==='search')return 'text-indigo-600 dark:text-indigo-400'
 if(type==='fetch')return 'text-cyan-600 dark:text-cyan-400'
 if(/agent|task/i.test(tool))return 'text-fuchsia-600 dark:text-fuchsia-400'
 if(tool.startsWith('mcp__'))return 'text-pink-600 dark:text-pink-400'
 return 'text-muted-foreground'
}
/** 历史有真实起止时显示真实耗时；未知时不从相邻消息猜测。 */
export function useActivityElapsed(running:boolean,start?:number,end?:number):string|undefined {
 const liveStart=React.useRef<number|undefined>(start??(running?Date.now():undefined)),observedEnd=React.useRef<number|undefined>(),wasRunning=React.useRef(running),[now,setNow]=React.useState(Date.now())
 React.useEffect(()=>{if(wasRunning.current&&!running)observedEnd.current=Date.now();wasRunning.current=running;if(start!==undefined)liveStart.current=start;else if(running&&liveStart.current===undefined)liveStart.current=Date.now();if(!running)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[running,start])
 const from=start??liveStart.current,to=end??(running?now:observedEnd.current)
 if(from===undefined||to===undefined||to<from)return undefined
 const seconds=(to-from)/1000
 return seconds<60?`${seconds<10?seconds.toFixed(1):Math.floor(seconds)}秒`:`${Math.floor(seconds/60)}分${Math.floor(seconds%60)}秒`
}

export function vividActivityKind(tool:string,input:unknown={}):string {
 const type=tool==='reasoning'?'reasoning':String(paseoToolDetail(tool,input,null).type)
 return ['reasoning','read','edit','write','shell','search','fetch'].includes(type)?type:/agent|task/i.test(tool)?'agent':'other'
}
