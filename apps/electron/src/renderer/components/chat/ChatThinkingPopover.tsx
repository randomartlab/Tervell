import * as React from 'react'
import {useAtomValue,useSetAtom} from 'jotai'
import {conversationsAtom} from '@/atoms/chat-atoms'
import {useConversationModel} from '@/hooks/useConversationSettings'
import {useConversationId} from '@/contexts/session-context'
import {ReasoningPicker} from '@/components/ai-elements/ReasoningPicker'
import {useModelReasoningOptions} from '@/hooks/useModelReasoningOptions'

/** 与 Agent 共用完整档位选择器；选择保存到当前对话元数据。 */
export function ChatThinkingPopover():React.ReactElement{
 const [model]=useConversationModel(),id=useConversationId(),conversations=useAtomValue(conversationsAtom),setConversations=useSetAtom(conversationsAtom)
 const saved=conversations.find(item=>item.id===id)?.reasoning
 const value=saved?.channelId===model?.channelId&&saved?.model===model?.modelId?saved?.effort??'':''
 const {options,loading,error,refresh}=useModelReasoningOptions(model?.channelId,model?.modelId)
 const [saving,setSaving]=React.useState(false),[saveError,setSaveError]=React.useState('')
 const save=async(effort:string)=>{if(!model)return;setSaving(true);setSaveError('');try{const next=await window.electronAPI.updateConversationReasoning(id,{channelId:model.channelId,model:model.modelId,effort:effort||undefined});setConversations(all=>all.map(item=>item.id===id?next:item))}catch(e){setSaveError(e instanceof Error?e.message:String(e))}finally{setSaving(false)}}
 return <ReasoningPicker value={value} options={options.map(value=>({value}))} automatic disabled={!model} loading={loading||saving} error={saveError||error} onChange={save} onRefresh={refresh} description="完整使用当前模型提供的档位，选择保存到此对话；自动跟随模型默认。"/>
}
