import type {ExtensionAPI} from '@earendil-works/pi-coding-agent'
import type {ProviderType} from '@proma/shared'
import {applyReasoningSelection} from '@proma/core'

/** 在 Pi 原生有限枚举处理之后落实已验证的原始档位，不丢失 ultra 或后续新值。 */
export function createExplicitReasoningExtension(provider:ProviderType,model:string,effort:string,raw=false):(pi:ExtensionAPI)=>void{
 return pi=>{pi.on('before_provider_request',event=>{
  if(!event.payload||typeof event.payload!=='object'||Array.isArray(event.payload))return
  return applyReasoningSelection(event.payload as Record<string,unknown>,provider,model,effort,raw)
 })}
}
