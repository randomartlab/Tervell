import {z} from 'zod'
import {getGeminiModelCapability,uniqueReasoningEfforts} from '@proma/shared'
import type {ChatReasoningSelection,ModelReasoningOptions} from '@proma/shared'
import {getChannelById} from './channel-manager'
import {resolvePiReasoningCapability} from './adapters/pi-model-registry'
import {startModelRouting,refreshRoutingModels} from './model-routing-service'

export async function modelReasoningOptions(channelId:string,model:string):Promise<ModelReasoningOptions>{
 if(channelId==='tervell-routing'){
  await startModelRouting(process.env.PATH??'')
  const state=await refreshRoutingModels(),entry=state.models.find(item=>item.id===model)
  if(!entry)throw new Error('模型已不可用，请重新同步并选择模型')
  return {efforts:uniqueReasoningEfforts(entry.efforts??[]),source:'gateway'}
 }
 const channel=getChannelById(channelId),entry=channel?.models.find(item=>item.id===model&&item.enabled)
 if(!channel?.enabled||!entry)throw new Error('渠道或模型未启用，请重新选择')
 if(entry.efforts)return {efforts:uniqueReasoningEfforts(entry.efforts),source:'provider'}
 const gemini=channel.provider==='google'?getGeminiModelCapability(model):undefined
 if(gemini)return {efforts:[...gemini.thinkingLevels],defaultEffort:gemini.defaultThinkingLevel,source:'catalog'}
 const capability=await resolvePiReasoningCapability(channel.provider,model)
 if(capability)return {efforts:[...capability.levels],defaultEffort:capability.defaultLevel,source:'catalog'}
 return {efforts:[],source:'unavailable'}
}

const Selection=z.strictObject({channelId:z.string().trim().min(1).max(512),model:z.string().trim().min(1).max(512),effort:z.string().min(1).max(64).optional()})
export async function validateChatReasoning(raw:unknown):Promise<ChatReasoningSelection>{
 const value=Selection.parse(raw)
 if(value.effort){const options=await modelReasoningOptions(value.channelId,value.model);if(!options.efforts.includes(value.effort))throw new Error('该推理档位已不在当前模型能力中，请重新选择')}
 return value
}
