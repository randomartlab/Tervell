import * as React from 'react'
import {ChevronRight,Plus,Search,Trash2} from 'lucide-react'
import type {GatewayProvider,GatewaySnapshot} from '@proma/shared'
import {providerHost} from '@proma/shared/utils'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Switch} from '@/components/ui/switch'
import {ProviderLogo} from './ProviderLogo'
import type {GatewayActionProps} from './ProviderEditor'
interface Props extends GatewayActionProps {data:GatewaySnapshot;onEdit:(value:GatewayProvider)=>void;onAdd:()=>void;onDelete:(id:string)=>void;editorId?:string;renderEditor?:()=>React.ReactNode;dirty:boolean}
export function ProviderList({data,busy,execute,onEdit,onAdd,onDelete,editorId,renderEditor,dirty}:Props):React.ReactElement{
 const [query,setQuery]=React.useState(''),[showDisabled,setShowDisabled]=React.useState(false)
 const filtered=data.providers.filter(p=>`${p.name} ${p.id} ${providerHost(p)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
 const active=filtered.filter(p=>p.enabled),disabled=filtered.filter(p=>!p.enabled)
 const render=(provider:GatewayProvider)=>{
  const open=editorId===provider.id
  return <article key={provider.id} className="overflow-hidden rounded-xl border border-border/40 bg-card" data-provider-id={provider.id}>
   <div className="flex min-h-20 items-center gap-2 px-3 sm:px-4"><button type="button" onClick={()=>onEdit(provider)} aria-expanded={open} aria-label={`编辑 ${provider.name}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={busy}><ProviderLogo icon={provider.icon} className="size-8"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{provider.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{providerHost(provider)||provider.id} · {provider.models.filter(m=>m.enabled).length} 个模型{provider.subscription?' · 订阅账号':''}</span></span></button><span className="hidden max-w-32 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground sm:block">{provider.keySet?provider.keyMasked:provider.ready?'无需密钥':'待配置'}</span><Switch aria-label={`启用 ${provider.name}`} checked={provider.enabled} disabled={busy||dirty} onCheckedChange={enabled=>void execute({kind:'provider.toggle',id:provider.id,enabled})}/><Button size="icon-sm" type="button" variant="ghost" aria-label={`删除 ${provider.name}`} disabled={busy||dirty} onClick={()=>onDelete(provider.id)}><Trash2 size={14}/></Button><Button size="icon-sm" type="button" variant="ghost" aria-label={open?`收起 ${provider.name}`:`展开 ${provider.name}`} disabled={busy} onClick={()=>onEdit(provider)}><ChevronRight size={15} className={open?'rotate-90':''}/></Button></div>
   {open&&renderEditor?.()}
  </article>
 }
 return <div className="space-y-4" data-testid="provider-list"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold">供应商</h3><p className="mt-1 text-sm text-muted-foreground">{data.providers.length} 个已配置供应商，点击展开模型与账号。</p></div><Button size="sm" type="button" onClick={onAdd} disabled={busy||dirty}><Plus size={15}/>添加供应商</Button></div>
  {data.providers.length>4&&<div className="relative"><Search size={15} aria-hidden="true" className="absolute left-3 top-3 text-muted-foreground"/><Input aria-label="搜索已添加供应商" placeholder="搜索已添加供应商…" value={query} onChange={e=>setQuery(e.target.value)} className="pl-9" disabled={dirty}/></div>}
  <div className="space-y-2">{active.map(render)}{!data.providers.length&&<div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">还没有供应商，从下方选择品牌或添加自定义服务。</div>}{!!disabled.length&&<><Button type="button" variant="ghost" size="sm" aria-expanded={showDisabled} disabled={dirty} onClick={()=>setShowDisabled(v=>!v)}><ChevronRight size={14} className={showDisabled?'rotate-90':''}/>{disabled.length} 个已停用供应商</Button>{(showDisabled||disabled.some(p=>p.id===editorId))&&disabled.map(render)}</>}</div>
 </div>
}
