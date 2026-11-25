import * as React from 'react'
import {ProviderLogo} from './ProviderLogo'
import {Pencil} from 'lucide-react'
import type {GatewayModel,GatewayProvider,GatewaySnapshot} from '@proma/shared'
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {SettingsSection,SettingsCard,SettingsRow,SettingsInput,SettingsToggle,SettingsTextarea} from '../primitives'
import {useCapabilityDraftGuard} from '@/hooks/useCapabilityDraftGuard'
import type {GatewayActionProps} from './ProviderEditor'
interface Props extends GatewayActionProps {data:GatewaySnapshot;onDirty:(dirty:boolean)=>void}
export function ModelsPanel({data,busy,execute,onDirty}:Props):React.ReactElement{
 const [query,setQuery]=React.useState(''),[editor,setEditor]=React.useState<{provider:GatewayProvider;model:GatewayModel}>()
 if(editor)return <ModelCapabilitiesEditor key={`${editor.provider.id}/${editor.model.id}`} {...editor} busy={busy} execute={execute} onDirty={onDirty} onDone={()=>setEditor(undefined)}/>
 const filtered=data.providers.flatMap(provider=>provider.models.filter(model=>`${provider.name} ${model.id} ${model.name}`.toLowerCase().includes(query.toLowerCase())).map(model=>({provider,model})))
 return <SettingsSection title="模型与能力" description="管理模型别名、图像能力与完整推理档位。每个模型的原始档位会完整保留。">
  <Input aria-label="搜索路由模型" placeholder="搜索模型或供应商…" value={query} onChange={event=>setQuery(event.target.value)}/>
  <SettingsCard>{filtered.length?filtered.slice(0,300).map(({provider,model})=><SettingsRow key={`${provider.id}/${model.id}`} label={model.name} icon={<ProviderLogo icon={provider.icon}/>} description={<span className="break-all">{provider.id}/{model.id} · {model.enabled?'已启用':'未启用'}{model.images?' · 图像':''}<br/>{model.efforts.length?`推理：${model.efforts.join(' / ')}`:'未公布推理档位'}</span>}><Button type="button" size="icon-sm" variant="ghost" aria-label={`配置 ${provider.id}/${model.id}`} onClick={()=>setEditor({provider,model})} disabled={busy}><Pencil size={15}/></Button></SettingsRow>):<p className="p-5 text-sm text-muted-foreground">没有匹配的模型，请先添加供应商并同步目录。</p>}</SettingsCard>
  {filtered.length>300&&<p className="text-sm text-muted-foreground">共 {filtered.length} 个模型，使用搜索缩小范围。</p>}
 </SettingsSection>
}
export function ModelCapabilitiesEditor({provider,model,busy,execute,onDirty,onDone}:GatewayActionProps&{provider:GatewayProvider;model:GatewayModel;onDirty:(dirty:boolean)=>void;onDone:()=>void}):React.ReactElement{
 const [discard,setDiscard]=React.useState(false)
 const [name,setName]=React.useState(model.name),[efforts,setEfforts]=React.useState(model.efforts.join('\n')),[images,setImages]=React.useState(model.images),[context,setContext]=React.useState(String(model.context||'')),[output,setOutput]=React.useState(String(model.output||''))
 const dirty=name!==model.name||efforts!==model.efforts.join('\n')||images!==model.images||context!==String(model.context||'')||output!==String(model.output||'')
 const current=useCapabilityDraftGuard(dirty);React.useEffect(()=>{onDirty(dirty);return()=>onDirty(false)},[dirty,onDirty])
 return <SettingsSection title={model.id} description={`供应商：${provider.name}`}><SettingsCard><SettingsInput label="显示名称" value={name} onChange={setName} disabled={busy}/><SettingsTextarea label="推理档位" description="每行一个原始值。保留全部模型公布档位；自定义服务可以填写其实际支持的值。" value={efforts} onChange={setEfforts} disabled={busy}/><SettingsToggle label="支持图片" checked={images} onCheckedChange={setImages} disabled={busy}/><SettingsInput label="上下文上限" type="number" value={context} onChange={setContext} disabled={busy}/><SettingsInput label="输出上限" type="number" value={output} onChange={setOutput} disabled={busy}/></SettingsCard><div className="flex gap-2"><Button type="button" disabled={busy||!dirty} onClick={()=>void execute({kind:'model.preferences',id:provider.id,model:model.id,name:name!==model.name?name:undefined,efforts:efforts!==model.efforts.join('\n')?efforts.split(/\s+/).filter(Boolean):undefined,images:images!==model.images?images:undefined,context:context!==String(model.context||'')&&context?Number(context):undefined,output:output!==String(model.output||'')&&output?Number(output):undefined}).then(ok=>{if(ok&&current())onDone()})}>保存模型能力</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>{if(dirty)setDiscard(true);else onDone()}}>返回模型列表</Button></div><AlertDialog open={discard} onOpenChange={setDiscard}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>放弃模型能力更改？</AlertDialogTitle><AlertDialogDescription>当前修改尚未保存。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>继续编辑</AlertDialogCancel><AlertDialogAction onClick={onDone}>放弃修改</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></SettingsSection>
}
