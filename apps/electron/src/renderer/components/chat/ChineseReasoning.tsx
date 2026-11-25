import * as React from 'react'
import {reasoningNeedsChinese,reasoningTranslationChunks} from '@proma/shared'
import {useActivityPreferences} from '@/components/plugins/activity-display'
import {useMessageSessionId,MessageResponse} from '@/components/ai-elements/message'
interface Job {id:string;phase:'queued'|'running'|'done'|'error';translation?:string;error?:string;model:string}
export function ChineseReasoning({text,streaming=false,sessionId:explicitSessionId,children}:{text:string;streaming?:boolean;sessionId?:string;children:React.ReactNode}):React.ReactElement {
 const preferences=useActivityPreferences(),contextId=useMessageSessionId(),sessionId=explicitSessionId??contextId,[original,setOriginal]=React.useState(false),[retry,setRetry]=React.useState(0),[state,setState]=React.useState<{source:string;translation?:string;error?:string;busy?:boolean}>({source:''})
 const needed=preferences.chineseReasoning&&reasoningNeedsChinese(text)
 React.useEffect(()=>{if(!needed||streaming||!sessionId)return;let alive=true,timer:ReturnType<typeof setTimeout>|undefined,releaseWait:(()=>void)|undefined
  const wait=()=>new Promise<void>(resolve=>{releaseWait=resolve;timer=setTimeout(resolve,700)})
  setState({source:text,busy:true})
  void(async()=>{try{const translated:string[]=[];for(const chunk of reasoningTranslationChunks(text)){if(!alive)return;if(!reasoningNeedsChinese(chunk)){translated.push(chunk);continue}let job=await window.electronAPI.builtinFeatureCall('activity.translate',{sessionId,text:chunk,...(retry?{retry:true}:{})})as Job;while(alive&&(job.phase==='queued'||job.phase==='running')){await wait();if(!alive)return;job=await window.electronAPI.builtinFeatureCall('activity.translation-status',job.id)as Job}if(job.phase!=='done')throw Error(job.error??'翻译未完成');translated.push(job.translation??chunk)}if(alive)setState({source:text,translation:translated.join('')})}catch(error){if(alive)setState({source:text,error:String(error)})}})()
  return()=>{alive=false;if(timer)clearTimeout(timer);releaseWait?.()}
 },[needed,streaming,sessionId,text,retry,preferences.translationModel?.channelId,preferences.translationModel?.modelId])
 if(!needed)return <>{children}</>
 const valid=state.source===text
 return <div data-reasoning-language={valid&&state.translation&&!original?'zh-CN':'original'}><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><span>{streaming?'原始推理正在生成，完成后翻译':valid&&state.busy?'正在翻译为中文…':valid&&state.translation?'中文译文 · 原文保留':'原文 · 译文暂不可用'}</span>{valid&&state.translation&&<button type="button" className="hover:text-foreground" onClick={()=>setOriginal(value=>!value)}>{original?'查看中文':'查看原文'}</button>}{valid&&state.error&&<button type="button" title={state.error} className="hover:text-foreground" onClick={()=>setRetry(value=>value+1)}>重试翻译</button>}</div>{valid&&state.translation&&!original?<MessageResponse className="text-[14px] font-normal prose-strong:font-normal">{state.translation}</MessageResponse>:children}{valid&&state.error&&<p role="status" className="mt-1 text-xs text-muted-foreground">{state.error}</p>}</div>
}
