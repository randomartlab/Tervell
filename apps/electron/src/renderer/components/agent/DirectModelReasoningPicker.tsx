import * as React from 'react'
import {useAtomValue,useSetAtom} from 'jotai'
import {agentSessionsAtom} from '@/atoms/agent-atoms'
import {ReasoningPicker} from '@/components/ai-elements/ReasoningPicker'
import {useModelReasoningOptions} from '@/hooks/useModelReasoningOptions'

export function DirectModelReasoningPicker({sessionId,channelId,model,busy}:{sessionId:string;channelId:string|null;model:string|null;busy:boolean}):React.ReactElement{
 const sessions=useAtomValue(agentSessionsAtom),setSessions=useSetAtom(agentSessionsAtom),selection=sessions.find(item=>item.id===sessionId)?.modelReasoning
 const value=selection?.channelId===channelId&&selection?.model===model?selection?.effort??'':''
 const {options,loading,error,refresh}=useModelReasoningOptions(channelId??undefined,model??undefined)
 const [saving,setSaving]=React.useState(false),[saveError,setSaveError]=React.useState('')
 const save=async(effort:string)=>{if(!channelId||!model)return;setSaving(true);setSaveError('');try{const next=await window.electronAPI.setSessionModelReasoning(sessionId,{channelId,model,effort:effort||undefined});setSessions(all=>all.map(item=>item.id===sessionId?next:item))}catch(e){setSaveError(e instanceof Error?e.message:String(e))}finally{setSaving(false)}}
 return <ReasoningPicker value={value} options={options.map(value=>({value}))} automatic disabled={busy||!model} loading={loading||saving} error={saveError||error} onChange={save} onRefresh={refresh} description="完整保留当前模型支持的档位；选择保存在此会话，下一轮请求生效。"/>
}
