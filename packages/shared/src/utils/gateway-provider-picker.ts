import type {GatewayPreset,GatewayProvider} from '../types/model-gateway'
export const GATEWAY_PRESET_GROUPS=[{id:'vendor',label:'模型厂商',hint:'使用自己的 API 密钥'},{id:'relay',label:'聚合与中转',hint:'一个入口接入多家模型'},{id:'local',label:'本机服务',hint:'连接电脑上运行的模型'},{id:'remote',label:'其他设备',hint:'连接已授权的模型服务'}] as const
export function providerPresetGroup(preset:GatewayPreset):typeof GATEWAY_PRESET_GROUPS[number]['id']{
 return preset.kind==='local'?'local':preset.kind==='remote'?'remote':preset.kind==='relay'||preset.kind==='partner'?'relay':'vendor'
}
export function providerPresetMatches(preset:GatewayPreset,query:string):boolean{
 const value=query.trim().toLocaleLowerCase();return !value||[preset.id,preset.name,preset.note,preset.chat,preset.responses,preset.anthropic,preset.kind].filter(Boolean).join(' ').toLocaleLowerCase().includes(value)
}
export function existingPresetProvider(preset:GatewayPreset,providers:GatewayProvider[]):GatewayProvider|undefined{return providers.find(provider=>provider.preset===preset.id||provider.id===preset.id)}
export function providerHost(provider:{chat?:string;responses?:string;anthropic?:string;gemini?:string}):string{
 try{return new URL(provider.chat||provider.responses||provider.anthropic||provider.gemini||'').host}catch{return ''}
}
