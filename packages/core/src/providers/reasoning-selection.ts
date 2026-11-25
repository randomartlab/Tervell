import {getGeminiModelCapability,inferReasoningTransport,resolveReasoningProfile} from '@proma/shared'
import type {AgentThinkingLevel,ProviderType} from '@proma/shared'
import {detectThinkingCapability} from './thinking-capability'

/** 显式选择的原值在最后一层编码；未选择时不改 adapter 的默认请求。 */
export function applyReasoningSelection(body:Record<string,unknown>,provider:ProviderType,model:string,effort:string|undefined,raw=false):Record<string,unknown>{
 if(!effort)return body
 const next={...body},disabled=effort==='off'||effort==='none',transport=inferReasoningTransport(provider)
 const profile=resolveReasoningProfile({modelId:model,transport}),encoding=profile?.encodings[transport]
 const mapped=raw?undefined:encoding?.effortMap[effort as AgentThinkingLevel],value=disabled?'none':typeof mapped==='string'?mapped:effort
 if(transport==='openai-responses')next.reasoning={...object(body.reasoning),effort:value}
 else if(transport==='openai-completions'){
  next.reasoning_effort=value
  if(encoding?.kind==='zai-thinking-effort')next.thinking={type:disabled?'disabled':'enabled'}
 }else if(provider==='google'){
  const thinkingConfig=disabled?{thinkingBudget:0}:raw||getGeminiModelCapability(model)?{thinkingLevel:value.toUpperCase()}:{thinkingBudget:thinkingBudget(effort)}
  next.generationConfig={...object(body.generationConfig),thinkingConfig}
 }else{
  const capability=detectThinkingCapability(provider,model),manual=!raw&&!encoding&&capability.mode==='manual-only'
  next.thinking=disabled?{type:'disabled'}:encoding?.kind==='deepseek-output-effort'?{type:'enabled'}:manual?{type:'enabled',budget_tokens:thinkingBudget(effort)}:{...object(body.thinking),type:'adaptive'}
  if(disabled&&capability.disableStrategy==='omit-field')delete next.thinking
  if(manual&&!disabled)next.max_tokens=Math.max(typeof body.max_tokens==='number'?body.max_tokens:0,thinkingBudget(effort)+1024)
  if(disabled){const output={...object(body.output_config)};delete output.effort;if(Object.keys(output).length)next.output_config=output;else delete next.output_config}
  else if(!manual)next.output_config={...object(body.output_config),effort:value}
 }
 return next
}
function object(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}}
/** 与随包 Pi SDK 的旧版预算模式保持一致，旧模型不接受 adaptive effort。 */
function thinkingBudget(effort:string):number{return ({minimal:1024,low:2048,medium:8192,high:16384,xhigh:16384,max:16384} as Record<string,number>)[effort]??16384}
