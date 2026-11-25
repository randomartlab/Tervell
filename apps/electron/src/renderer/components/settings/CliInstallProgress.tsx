import * as React from 'react'
import { useAtomValue,useSetAtom } from 'jotai'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { desktopCliInstallAtom } from '@/atoms/desktop-extensions'
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
export function CliInstallProgress({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}):React.ReactElement {
  const job=useAtomValue(desktopCliInstallAtom),setJob=useSetAtom(desktopCliInstallAtom)
  const host=React.useRef<HTMLDivElement>(null),terminal=React.useRef<Terminal>(),seen=React.useRef(''),outputRef=React.useRef(job?.output??'')
  outputRef.current=job?.output??''
  const [error,setError]=React.useState('')
  const active=job?.phase==='installing'||job?.phase==='verifying'
  React.useEffect(()=>{
    if(!open)return
    let frame=0,observer:ResizeObserver|undefined,t:Terminal|undefined
    frame=requestAnimationFrame(()=>{
      if(!host.current)return
      t=new Terminal({disableStdin:true,convertEol:false,fontSize:13,rows:17,scrollback:3000,fontFamily:'Menlo, monospace',theme:{background:getComputedStyle(host.current).backgroundColor,foreground:getComputedStyle(host.current).color}})
      const fit=new FitAddon();t.loadAddon(fit);t.open(host.current);fit.fit();terminal.current=t;seen.current=outputRef.current;t.write(seen.current)
      observer=new ResizeObserver(()=>{try{fit.fit()}catch{/* 弹窗关闭时忽略尺寸回调。 */}});observer.observe(host.current)
    })
    return()=>{cancelAnimationFrame(frame);observer?.disconnect();t?.dispose();terminal.current=undefined;seen.current=''}
  },[open,job?.id])
  React.useEffect(()=>{
    if(!terminal.current||!job)return
    if(job.output.startsWith(seen.current))terminal.current.write(job.output.slice(seen.current.length))
    else{terminal.current.reset();terminal.current.write(job.output)}
    seen.current=job.output
  },[job?.output])
  const title=job?.phase==='succeeded'?'安装完成，内核已启用':job?.phase==='verifying'?'正在检查 CLI 与 ACP 适配器':job?.phase==='failed'?'安装未完成':job?.phase==='cancelled'?'已取消安装':'正在安装 CLI'
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>安装在 Tervell 的专用目录，不需要管理员权限。关闭窗口后继续安装，完成后自动更新列表。账号登录另行完成。</DialogDescription></DialogHeader>
    <div ref={host} aria-label="CLI 安装终端输出" className="h-[340px] overflow-hidden rounded-lg bg-background p-3 text-foreground"/>
    <p role="status" className="text-sm">{title}</p>{(job?.error||error)&&<p role="alert" className="text-sm text-destructive">{job?.error||error}</p>}
    <div className="flex justify-end gap-2">{active&&<Button variant="outline" onClick={()=>{if(job)void window.electronAPI.cancelDesktopCliInstall(job.id).then(setJob,e=>setError(String(e)))}}>取消安装</Button>}{job&&(job.phase==='failed'||job.phase==='cancelled')&&<Button onClick={()=>void window.electronAPI.installDesktopCli(job.kernelId).then(setJob,e=>setError(String(e)))}>重试安装</Button>}<Button variant="outline" onClick={()=>onOpenChange(false)}>{active?'后台继续':'完成'}</Button></div>
  </DialogContent></Dialog>
}
