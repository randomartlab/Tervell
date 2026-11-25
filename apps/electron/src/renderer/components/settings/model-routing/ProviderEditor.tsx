import {ProviderPlatformLogin} from './ProviderPlatformLogin'
import * as React from 'react'
import {ArrowLeft,ExternalLink,RefreshCw} from 'lucide-react'
import type {GatewayCommand,GatewayProvider,GatewayProviderInput,GatewayPreset} from '@proma/shared'
import {Button} from '@/components/ui/button'
import {SettingsCard,SettingsInput,SettingsSecretInput,SettingsSelect,SettingsTextarea} from '../primitives'
import {useCapabilityDraftGuard} from '@/hooks/useCapabilityDraftGuard'
import {ProviderLogo} from './ProviderLogo'
import {ProviderModels} from './ProviderModels'
import {ProviderAccounts} from './ProviderAccounts'

export interface GatewayActionProps {busy:boolean;execute:(command:GatewayCommand)=>Promise<boolean>}
interface Props extends GatewayActionProps {provider?:GatewayProvider;preset?:GatewayPreset;onChooseAnother:()=>void;onDone:(saved?:boolean)=>void;onDirty:(value:boolean)=>void}
export const ROUTING_OPTIONS=[{value:'smart',label:'智能选择'},{value:'order',label:'按顺序与失败回退'},{value:'rotate',label:'轮询'},{value:'weight',label:'按权重'},{value:'usage',label:'优先低用量'},{value:'pace',label:'按配额节奏'},{value:'free',label:'优先免费'},{value:'fast',label:'优先响应速度'},{value:'cheap',label:'优先低价'},{value:'drain',label:'依次用尽配额'},{value:'expiring',label:'优先即将到期'},{value:'fit',label:'适合上下文大小'}]
const PROTOCOLS=[{value:'chat',label:'OpenAI Chat'},{value:'responses',label:'Responses'},{value:'anthropic',label:'Anthropic'},{value:'gemini',label:'Gemini'}] as const
type Protocol=typeof PROTOCOLS[number]['value']
export function ProviderEditor({provider,preset,busy,execute,onChooseAnother,onDone,onDirty}:Props):React.ReactElement{
 const [initial,setInitial]=React.useState<GatewayProviderInput>(()=>({id:provider?.id??preset?.id??('custom-'+crypto.randomUUID().slice(0,8)),name:provider?.name??preset?.name??'',preset:provider?.preset??preset?.id??'',chat:provider?.chat??preset?.chat??'',responses:provider?.responses??preset?.responses??'',anthropic:provider?.anthropic??preset?.anthropic??'',gemini:provider?.gemini??preset?.gemini??'',key:'',models:provider?.models.filter(m=>m.enabled).map(m=>m.id)??preset?.models??[],routing:provider?.routing||'smart',fallback:provider?.fallback??[],create:!provider}))
 const [draft,setDraft]=React.useState(initial),[protocol,setProtocol]=React.useState<Protocol>(initial.chat?'chat':initial.responses?'responses':initial.anthropic?'anthropic':initial.gemini?'gemini':'chat'),[fallback,setFallback]=React.useState(initial.fallback.join('\n')),[advanced,setAdvanced]=React.useState(''),[formError,setFormError]=React.useState(''),[modelDirty,setModelDirty]=React.useState(false),[accountDirty,setAccountDirty]=React.useState(false),[platformDirty,setPlatformDirty]=React.useState(false),[region,setRegion]=React.useState(preset?.regions?.find(region=>provider&&[region.chat,region.responses,region.anthropic].some(url=>url&&[provider.chat,provider.responses,provider.anthropic].includes(url)))?.id??preset?.regions?.[0]?.id??'')
 const initialProtocol:Protocol=initial.chat?'chat':initial.responses?'responses':initial.anthropic?'anthropic':initial.gemini?'gemini':'chat'
 const ownDirty=JSON.stringify(draft)!==JSON.stringify(initial)||fallback!==initial.fallback.join('\n')||!!advanced||protocol!==initialProtocol
 const dirty=ownDirty||modelDirty||accountDirty||platformDirty,current=useCapabilityDraftGuard(dirty)
 React.useEffect(()=>{onDirty(dirty);return()=>onDirty(false)},[dirty,onDirty])
 React.useEffect(()=>{
  if(!provider||dirty)return
  const updated={...initial,name:provider.name,chat:provider.chat,responses:provider.responses,anthropic:provider.anthropic,gemini:provider.gemini,models:provider.models.filter(model=>model.enabled).map(model=>model.id),routing:provider.routing||'smart',fallback:provider.fallback}
  if(JSON.stringify(updated)!==JSON.stringify(initial)){setInitial(updated);setDraft(updated);setFallback(updated.fallback.join('\n'));setProtocol(updated.chat?'chat':updated.responses?'responses':updated.anthropic?'anthropic':updated.gemini?'gemini':'chat')}
 },[provider,dirty,initial])
 const selectedRegion=preset?.regions?.find(item=>item.id===region)
 const update=(key:keyof GatewayProviderInput,value:string)=>setDraft(d=>({...d,[key]:value}))
 const save=async(event:React.FormEvent)=>{
  event.preventDefault();setFormError('')
  if(!draft.id.trim()||!draft.name.trim()){setFormError('请填写供应商名称与标识');return}
  if(!draft.chat&&!draft.responses&&!draft.anthropic&&!draft.gemini&&!draft.preset){setFormError('请填写模型 API 的 Base URL');return}
  let fields:Record<string,unknown>|undefined
  if(advanced.trim()){try{const parsed:unknown=JSON.parse(advanced);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();fields=parsed as Record<string,unknown>}catch{setFormError('高级设置需要有效的 JSON 对象');return}}
  const saved=await execute({kind:'provider.save',provider:{...draft,id:draft.id.trim(),name:draft.name.trim(),baseAPI:protocol,fallback:fallback.split('\n').map(v=>v.trim()).filter(Boolean),advanced:fields}})
  if(saved&&current())onDone(true)
 }
 const icon=provider?.icon||preset?.icon
 const website=selectedRegion?.keysUrl||preset?.keysUrl||provider?.keysUrl||preset?.website||provider?.website
 const isPreset=!!preset
 return <form onSubmit={event=>void save(event)} className="space-y-4 border-t border-border/40 bg-muted/20 p-4 sm:p-5" aria-label={provider?'编辑路由供应商':'添加路由供应商'} data-testid="provider-inline-editor">
  <div className="flex flex-wrap items-center gap-3"><ProviderLogo icon={icon} className="size-9"/><div className="min-w-0 flex-1"><h3 className="text-base font-semibold">{provider?.name||preset?.name||'自定义服务'}</h3><p className="mt-0.5 text-xs text-muted-foreground">{preset?.note|| (isPreset?'填写密钥即可接入；模型与高级选项可按需调整。':'使用 OpenAI、Anthropic 或 Gemini 兼容 API。')}</p></div>{!provider&&<Button type="button" size="sm" variant="ghost" onClick={onChooseAnother} disabled={busy}>重新选择供应商</Button>}{website&&/^https?:\/\//.test(website)&&<a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">获取密钥<ExternalLink size={13}/></a>}</div>
  <SettingsCard>
   {isPreset&&!!preset.regions?.length&&<SettingsSelect label={preset.regionLabel||'服务区域'} value={region} options={preset.regions.map(item=>({value:item.id,label:item.name}))} disabled={busy} onValueChange={id=>{const next=preset.regions?.find(item=>item.id===id);if(next){setRegion(id);setDraft(d=>({...d,chat:next.chat,responses:next.responses,anthropic:next.anthropic,gemini:next.gemini??'',models:next.models?.length?next.models:d.models}))}}}/>}
   {isPreset&&preset.kind==='local'&&<SettingsInput label="Base URL" value={draft[protocol]} onChange={value=>update(protocol,value)} disabled={busy}/>}
   {!isPreset&&<><SettingsInput label="供应商名称" value={draft.name} onChange={value=>{setDraft(d=>({...d,name:value,...(!provider?{id:value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||d.id}: {})}))}} required disabled={busy}/><div className="space-y-2 px-4 py-3"><span className="text-sm font-medium">API 协议</span><div className="flex flex-wrap gap-1" role="group" aria-label="供应商 API 协议">{PROTOCOLS.map(item=><Button key={item.value} type="button" size="sm" disabled={busy} variant={protocol===item.value?'secondary':'ghost'} aria-pressed={protocol===item.value} onClick={()=>setProtocol(item.value)}>{item.label}</Button>)}</div></div><SettingsInput label="Base URL" value={draft[protocol]} onChange={value=>update(protocol,value)} placeholder={protocol==='anthropic'?'https://api.example.com':'https://api.example.com/v1'} disabled={busy}/></>}
   <SettingsSecretInput label={preset?.noKey?'API 密钥（可选）':'API 密钥'} description={provider?'留空保留原密钥；原值不会回显。':preset?.noKey?'本机服务无密钥时可留空。':preset?.keyHint||'供应商密钥仅保存在本机模型配置中。'} value={draft.key??''} onChange={value=>update('key',value)} disabled={busy}/>
  </SettingsCard>
  {provider&&<ProviderPlatformLogin provider={provider} busy={busy||ownDirty||modelDirty||accountDirty} execute={execute} onDirty={setPlatformDirty}/>}
  <details open={!!provider} className="rounded-lg border border-border/40 p-3"><summary className="cursor-pointer text-sm font-medium">模型 <span className="text-muted-foreground">{draft.models.length} 个已选</span></summary><div className="space-y-3 pt-3">{provider&&<Button type="button" size="sm" variant="outline" disabled={busy||dirty} onClick={()=>void execute({kind:'provider.refresh',id:provider.id})}><RefreshCw size={14}/>同步供应商模型</Button>}<ProviderModels provider={provider} selected={draft.models} onChange={models=>setDraft(d=>({...d,models}))} busy={busy} execute={execute} onDirty={setModelDirty} icon={icon}/></div></details>
  {provider&&<details className="rounded-lg border border-border/40 p-3"><summary className="cursor-pointer text-sm font-medium">密钥与账号 <span className="text-muted-foreground">{provider.accounts.length}</span></summary><div className="pt-3"><ProviderAccounts provider={provider} busy={busy||ownDirty||modelDirty} execute={execute} onDirty={setAccountDirty}/></div></details>}
  <details className="rounded-lg border border-border/40 p-3"><summary className="cursor-pointer text-sm font-medium">高级设置</summary><div className="space-y-4 pt-3"><SettingsCard>
   {isPreset&&<SettingsInput label="供应商显示名称" value={draft.name} onChange={value=>update('name',value)} disabled={busy}/>}<SettingsInput label="供应商标识" description="模型使用 provider/model 引用，标识保持稳定。" value={draft.id} onChange={value=>update('id',value)} disabled={busy||!!provider}/>
   <SettingsInput label="Chat Completions 地址" value={draft.chat} onChange={value=>update('chat',value)} disabled={busy}/><SettingsInput label="Responses 地址" value={draft.responses} onChange={value=>update('responses',value)} disabled={busy}/><SettingsInput label="Anthropic Messages 地址" value={draft.anthropic} onChange={value=>update('anthropic',value)} disabled={busy}/><SettingsInput label="Gemini 地址" value={draft.gemini} onChange={value=>update('gemini',value)} disabled={busy}/>
   <SettingsSelect label="多账号调度" value={draft.routing} options={ROUTING_OPTIONS} onValueChange={value=>update('routing',value)} disabled={busy}/><SettingsTextarea label="失败回退模型" description="每行一个 provider/model。" value={fallback} onChange={setFallback} disabled={busy}/><SettingsTextarea label="高级配置 JSON" description="headers、extraBody、限额、代理等未修改的设置会保留。" value={advanced} onChange={setAdvanced} disabled={busy}/>
  </SettingsCard></div></details>
  {formError&&<p role="alert" className="text-sm text-destructive">{formError}</p>}
  <div className="flex flex-wrap items-center gap-2"><Button type="submit" size="sm" disabled={busy||accountDirty||modelDirty||platformDirty}>保存供应商</Button>{provider&&<Button type="button" size="sm" variant="outline" disabled={busy||dirty} onClick={()=>void execute({kind:'provider.test',id:provider.id})}>测试连接</Button>}<Button type="button" size="sm" variant="ghost" onClick={()=>onDone(false)} disabled={busy}><ArrowLeft size={14}/>{provider?'收起':'返回供应商选择'}</Button></div>
 </form>
}
