import * as React from 'react'
import type {GatewayPluginPage} from '@proma/shared'
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
function pageTheme(){
 const css=getComputedStyle(document.documentElement),hsl=(name:string)=>`hsl(${css.getPropertyValue(name).trim()})`
 return {dark:document.documentElement.classList.contains('dark'),lang:'zh',tokens:{bg:hsl('--background'),card:hsl('--card'),fg:hsl('--foreground'),'fg-2':hsl('--muted-foreground'),muted:hsl('--muted-foreground'),faint:hsl('--muted-foreground'),line:hsl('--border'),accent:hsl('--primary'),'accent-soft':hsl('--accent'),'accent-fg':hsl('--primary-foreground'),green:hsl('--primary'),red:hsl('--destructive'),amber:hsl('--ring'),font:css.fontFamily,code:'ui-monospace, monospace'}}
}
export function GatewayPluginPageView({entry,onClose}:{entry:GatewayPluginPage;onClose:()=>void}):React.ReactElement{
 const [documentText,setDocumentText]=React.useState(''),[error,setError]=React.useState(''),[retry,setRetry]=React.useState(0),[ready,setReady]=React.useState(false)
 const frame=React.useRef<HTMLIFrameElement>(null),alive=React.useRef(true)
 React.useEffect(()=>{let current=true;alive.current=true;setReady(false);setError('');void window.electronAPI.modelGatewayQuery({kind:'plugins.document',key:entry.key}).then(result=>{if(current)setDocumentText(result.document??'')},e=>{if(current)setError(String(e))});return()=>{current=false;alive.current=false}},[entry.key,retry])
 React.useEffect(()=>{
  const post=(message:Record<string,unknown>)=>frame.current?.contentWindow?.postMessage({magpie:1,...message},'*')
  const listen=async(event:MessageEvent)=>{
   if(event.source!==frame.current?.contentWindow)return
   const msg:unknown=event.data;if(!msg||typeof msg!=='object'||!('magpie'in msg)||msg.magpie!==1||!('method'in msg)||typeof msg.method!=='string')return
   const m=msg as {id?:unknown;method:string;params?:Record<string,unknown>};const id=m.id
   try{
    if(m.method==='error'){setError(String(m.params?.message??'插件页面运行出错'));return}
    if(m.method==='size')return
    let result:unknown
    if(m.method==='hello'){setReady(true);result={...pageTheme(),context:entry.context??{},service:entry.service??'',visible:true}}
    else if(m.method==='theme')result=pageTheme()
    else if(['read','options.get','options.set','asset','image.copy','image.save'].includes(m.method)){
     if(m.method==='read'&&!entry.reads.includes(String(m.params?.name??'')))throw new Error('此插件未声明该读取权限')
     let params=m.params??{}
     if(m.method==='image.copy'||m.method==='image.save'){
      const blob=params.png;if(!(blob instanceof Blob)||blob.type!=='image/png'||!blob.size||blob.size>5*1024*1024)throw new Error('插件图片必须是 5 MB 以内的 PNG')
      const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));params={png:btoa(binary),name:String(params.name??'').slice(0,120)}
     }
     const response=await window.electronAPI.modelGatewayQuery({kind:'plugins.page-call',key:entry.key,method:m.method as 'read'|'options.get'|'options.set'|'asset'|'image.copy'|'image.save',params});result=response.result
     if(m.method==='asset'&&result&&typeof result==='object'&&'data'in result&&Array.isArray(result.data))result={...result,data:new Uint8Array(result.data).buffer}
    }else throw new Error('不支持的插件页面调用')
    if(alive.current)post({id,result})
   }catch(e){if(alive.current)post({id,error:e instanceof Error?e.message:String(e)})}
  }
  const observer=new MutationObserver(()=>post({event:'theme',data:pageTheme()}));observer.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']})
  window.addEventListener('message',listen);return()=>{window.removeEventListener('message',listen);observer.disconnect()}
 },[entry])
 React.useEffect(()=>{if(!documentText||ready)return;const timeout=setTimeout(()=>setError('插件页面未完成初始化，可重试或检查插件配置。'),15000);return()=>clearTimeout(timeout)},[documentText,ready])
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="max-w-5xl"><DialogHeader><DialogTitle>{entry.title}</DialogTitle><DialogDescription>插件页面 · {entry.spec}；读取权限：{entry.reads.join('、')||'无'}。页面使用独立沙箱。</DialogDescription></DialogHeader>{error?<div className="space-y-3"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={()=>{setDocumentText('');setRetry(v=>v+1)}}>重新加载插件页面</Button></div>:<>{!ready&&<p role="status" className="text-sm text-muted-foreground">正在初始化插件页面…</p>}{documentText&&<iframe ref={frame} key={retry} title={entry.title} srcDoc={documentText} sandbox="allow-scripts" referrerPolicy="no-referrer" className="h-[65vh] w-full rounded-lg border border-border bg-background"/>}</>}</DialogContent></Dialog>
}
