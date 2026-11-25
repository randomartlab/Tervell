import * as React from 'react'
import type {GatewaySnapshot} from '@proma/shared'
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {ProviderList} from './ProviderList'
import {RandomMarketProvider,randomMarketPreset,isRandomMarketProvider} from './RandomMarketProvider'
import {ProviderChooser} from './ProviderChooser'
import type {ProviderChoice} from './ProviderChooser'
import {ProviderEditor} from './ProviderEditor'
import type {GatewayActionProps} from './ProviderEditor'
interface Props extends GatewayActionProps {data:GatewaySnapshot;onDirty:(dirty:boolean)=>void;onDelete:(id:string)=>void;onSubscriptions:(agent:string)=>void}
export function ProviderWorkspace({data,busy,execute,onDirty,onDelete,onSubscriptions}:Props):React.ReactElement{
 const [editor,setEditor]=React.useState<{providerId?:string;presetId?:string}>(),[chooser,setChooser]=React.useState(!data.providers.length),[dirty,setDirty]=React.useState(false),[pending,setPending]=React.useState<(()=>void)>()
 const marketProvider=data.providers.find(isRandomMarketProvider)
 const chosenProvider=data.providers.find(p=>p.id===editor?.providerId),preset=(editor?.presetId||chosenProvider?.preset)===randomMarketPreset.id?randomMarketPreset:data.presets.find(p=>p.id===(editor?.presetId||chosenProvider?.preset))
 const changeDirty=React.useCallback((value:boolean)=>{setDirty(value);onDirty(value)},[onDirty])
 const navigate=(next:()=>void)=>{if(dirty)setPending(()=>next);else next()}
 const close=(saved?:boolean)=>{const next=()=>{changeDirty(false);setEditor(undefined);if(!chosenProvider)setChooser(!saved)};if(saved)next();else navigate(next)}
 const choose=(choice:ProviderChoice)=>navigate(()=>{setEditor({providerId:choice.provider?.id,presetId:choice.preset?.id});setChooser(false)})
 const renderEditor=()=>editor&&chosenProvider?.subscription?<div className="space-y-3 border-t border-border p-4"><p className="text-sm text-muted-foreground">该供应商使用账号授权，不需要填写 Base URL 或 API 密钥。</p><Button size="sm" variant="outline" onClick={()=>onSubscriptions(chosenProvider.subscriptionId??chosenProvider.id)}>管理登录与订阅账号</Button></div>:editor?<ProviderEditor key={editor.providerId??editor.presetId??'custom'} provider={chosenProvider} preset={preset} busy={busy} execute={execute} onDirty={changeDirty} onChooseAnother={()=>navigate(()=>{setEditor(undefined);setChooser(true)})} onDone={close}/>:null
 return <div className="space-y-4"><RandomMarketProvider busy={busy} existing={marketProvider} onChoose={()=>choose({preset:randomMarketPreset,provider:marketProvider})}/><ProviderList data={data} busy={busy} execute={execute} dirty={dirty} editorId={editor?.providerId} renderEditor={renderEditor} onAdd={()=>navigate(()=>{setEditor(undefined);setChooser(true)})} onEdit={provider=>navigate(()=>{setEditor(editor?.providerId===provider.id?undefined:{providerId:provider.id});setChooser(false)})} onDelete={onDelete}/>
  {chooser&&<ProviderChooser data={data} busy={busy} onChoose={choose} onSubscriptions={agent=>navigate(()=>onSubscriptions(agent))} onClose={()=>setChooser(false)}/>}
  {editor&&!editor.providerId&&<div className="overflow-hidden rounded-xl border border-border/40 bg-card">{renderEditor()}</div>}
  <AlertDialog open={!!pending} onOpenChange={open=>{if(!open)setPending(undefined)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>放弃未保存的供应商更改？</AlertDialogTitle><AlertDialogDescription>离开编辑后将放弃当前修改。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>继续编辑</AlertDialogCancel><AlertDialogAction onClick={()=>{changeDirty(false);pending?.();setPending(undefined)}}>放弃修改</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>
}
