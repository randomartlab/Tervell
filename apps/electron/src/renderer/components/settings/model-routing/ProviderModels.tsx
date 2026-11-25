import * as React from 'react'
import {Search,Plus,SlidersHorizontal} from 'lucide-react'
import type {GatewayProvider,GatewayCommand} from '@proma/shared'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {ProviderLogo} from './ProviderLogo'
import {ModelCapabilitiesEditor} from './ModelsPanel'
interface Props {provider?:GatewayProvider;selected:string[];onChange:(models:string[])=>void;busy:boolean;execute:(command:GatewayCommand)=>Promise<boolean>;onDirty:(value:boolean)=>void;icon?:string}
export function ProviderModels({provider,selected,onChange,busy,execute,onDirty,icon}:Props):React.ReactElement{
 const [query,setQuery]=React.useState(''),[custom,setCustom]=React.useState(''),[editing,setEditing]=React.useState<string>()
 const source=provider?.models??[],ids=[...new Set([...source.map(model=>model.id),...selected])]
 const filtered=ids.filter(id=>`${id} ${source.find(model=>model.id===id)?.name??''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
 const capability=source.find(model=>model.id===editing)
 if(provider&&capability)return <ModelCapabilitiesEditor key={capability.id} provider={provider} model={capability} busy={busy} execute={execute} onDirty={onDirty} onDone={()=>setEditing(undefined)}/>
 return <div className="space-y-3" data-testid="provider-model-picks"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">向 Agent 提供的模型 <span className="text-muted-foreground">{selected.length} / {ids.length}</span></span><div className="flex gap-1"><Button variant="ghost" size="sm" type="button" disabled={busy||!ids.length} onClick={()=>onChange(ids)}>全选</Button><Button variant="ghost" size="sm" type="button" disabled={busy||!selected.length} onClick={()=>onChange([])}>全不选</Button></div></div>
  {!!ids.length&&<div className="relative"><Search size={14} className="absolute left-3 top-3 text-muted-foreground" aria-hidden="true"/><Input aria-label="搜索此供应商的模型" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索模型…" className="pl-9"/></div>}
  <div className="max-h-64 overflow-y-auto rounded-lg border border-border/40">{filtered.length?filtered.slice(0,300).map(id=>{const model=source.find(model=>model.id===id);return <div key={id} className="flex min-h-11 items-center gap-2 border-b border-border/30 px-3 py-2 last:border-0"><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" aria-label={`启用模型 ${id}`} checked={selected.includes(id)} disabled={busy} onChange={e=>onChange(e.target.checked?[...selected,id]:selected.filter(value=>value!==id))}/><ProviderLogo icon={icon??provider?.icon} className="size-4"/><span className="min-w-0 flex-1"><span className="block truncate text-sm">{model?.name||id}</span>{model?.efforts.length?<span className="block truncate text-xs text-muted-foreground">{model.efforts.join(' · ')}</span>:null}</span></label>{model&&<Button type="button" variant="ghost" size="icon-sm" aria-label={`配置模型 ${id}`} disabled={busy} onClick={()=>setEditing(id)}><SlidersHorizontal size={14}/></Button>}</div>}):<p className="p-4 text-sm text-muted-foreground">{ids.length?'没有匹配的模型。':'保存供应商后同步模型，或在下方添加模型 ID。'}</p>}</div>
  <div className="flex gap-2"><Input aria-label="手动添加模型 ID" placeholder="添加模型 ID…" value={custom} disabled={busy} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const id=custom.trim();if(id&&!selected.includes(id)){onChange([...selected,id]);setCustom('')}}}}/><Button type="button" variant="outline" size="sm" disabled={busy||!custom.trim()||selected.includes(custom.trim())} onClick={()=>{const id=custom.trim();if(!selected.includes(id))onChange([...selected,id]);setCustom('')}}><Plus size={14}/>添加</Button></div>
 </div>
}
