import * as React from 'react'
import type {GatewayProvider} from '@proma/shared'
import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'
import {SettingsInput,SettingsSecretInput} from '../primitives'
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from '@/components/ui/alert-dialog'
import {useCapabilityDraftGuard} from '@/hooks/useCapabilityDraftGuard'
import type {GatewayActionProps} from './ProviderEditor'
export function ProviderAccounts({provider,busy,execute,onDirty}:{provider:GatewayProvider;onDirty:(dirty:boolean)=>void}&GatewayActionProps):React.ReactElement{
 const [name,setName]=React.useState(''),[key,setKey]=React.useState(''),[remove,setRemove]=React.useState<string>()
 const dirty=!!name||!!key;useCapabilityDraftGuard(dirty)
 React.useEffect(()=>{onDirty(dirty);return()=>onDirty(false)},[dirty,onDirty])
 return <div className="space-y-3"><h4 className="text-sm font-medium">密钥与账号</h4>{provider.accounts.length?<div className="divide-y divide-border/30 rounded-lg border border-border/40">{provider.accounts.map(account=><div key={account.id} className="flex flex-wrap items-center gap-3 px-3 py-3"><span className="min-w-28 flex-1 text-sm">{account.name}<span className="ml-2 text-xs text-muted-foreground">{account.masked}</span></span><Switch aria-label={`启用密钥 ${account.name}`} checked={account.enabled} disabled={busy||dirty} onCheckedChange={enabled=>void execute({kind:'account.toggle',id:provider.id,ref:account.id,enabled})}/><Button variant="ghost" size="sm" type="button" disabled={busy||dirty} onClick={()=>setRemove(account.id)}>移除</Button></div>)}</div>:<p className="text-sm text-muted-foreground">已有主密钥继续使用；可添加独立密钥参与调度。</p>}
 <div className="rounded-lg border border-border/40"><SettingsInput label="新密钥名称" value={name} onChange={setName} disabled={busy}/><SettingsSecretInput label="新密钥" value={key} onChange={setKey} disabled={busy}/><div className="px-4 pb-3"><Button type="button" variant="outline" size="sm" disabled={busy||!name.trim()||!key.trim()} onClick={()=>void execute({kind:'account.add',id:provider.id,name:name.trim(),key:key.trim()}).then(ok=>{if(ok){setKey('');setName('')}})}>添加密钥</Button></div></div>
 <AlertDialog open={!!remove} onOpenChange={open=>{if(!open)setRemove(undefined)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>移除密钥？</AlertDialogTitle><AlertDialogDescription>将移除此密钥，后续请求使用其他可用密钥。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={()=>{if(remove)void execute({kind:'account.delete',id:provider.id,ref:remove}).then(ok=>{if(ok)setRemove(undefined)})}}>移除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>
}
