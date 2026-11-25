import {gatewayPluginEntries} from './gateway-extension-adapter'
import type {GatewaySnapshot,GatewayProvider,GatewayGroup,GatewayUsage,GatewayPlugin,GatewayPreset,GatewayPlatformLogin} from '@proma/shared'
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const list=(value:unknown):unknown[]=>Array.isArray(value)?value:[]
const text=(value:unknown)=>typeof value==='string'?value:''
const num=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:0
const strings=(value:unknown)=>list(value).filter((item):item is string=>typeof item==='string')
export function gatewayProviders(raw:unknown):GatewayProvider[]{return list(record(raw).providers).map(value=>{const p=record(value),key=record(p.key);return {id:text(p.id),name:text(p.name),icon:text(p.icon),website:text(p.website),keysUrl:text(p.keysUrl),preset:text(p.preset),chat:text(p.chat),responses:text(p.responses),anthropic:text(p.anthropic),gemini:text(p.gemini),enabled:p.off!==true,ready:p.ready===true,keySet:key.set===true,keyMasked:text(key.masked),routing:text(p.routing),fallback:strings(p.fallback),subscription:!!p.account||p.login===true,subscriptionId:text(record(p.account).agent)||undefined,platformLogins:platformLogins(p),logins:list(record(p.account).logins).map(value=>{const l=record(value);return {user:text(l.user),plan:text(l.plan),active:l.active===true,enabled:l.on===true,lapsed:text(l.lapsed),accessOnly:l.accessOnly===true}}),models:list(p.models).map(value=>{const m=record(value);return {id:text(m.id),name:text(m.name)||text(m.id),enabled:m.on===true,efforts:strings(m.efforts),images:m.images===true,context:num(m.context)||num(m.listed),output:num(m.output)||num(m.listedOutput)}}),accounts:list(p.keyList).map(value=>{const k=record(value);return {id:text(k.id),name:text(k.name)||text(k.id),masked:text(k.masked),enabled:k.on===true,weight:num(k.weight)}})}})}
export function gatewayPresets(raw:unknown):GatewayPreset[]{return list(record(raw).presets).map(value=>{
 const p=record(value)
 return {id:text(p.id),name:text(p.name),icon:text(p.icon),kind:text(p.kind),note:text(p.note),added:p.added===true,website:text(p.website),keysUrl:text(p.keysUrl),keyHint:text(p.keyHint),regionLabel:text(p.regionLabel),models:strings(p.models),regions:list(p.regions).map(value=>{const r=record(value);return {id:text(r.id),name:text(r.name),chat:text(r.chat),responses:text(r.responses),anthropic:text(r.anthropic),gemini:text(r.gemini),models:strings(r.models),keysUrl:text(r.keysUrl)}}),chat:text(p.chat),responses:text(p.responses),anthropic:text(p.anthropic),gemini:text(p.gemini),noKey:p.noKey===true}
})}
export function gatewayGroups(raw:unknown):GatewayGroup[]{return list(record(raw).groups).map(value=>{const g=record(value);return {id:text(g.id),name:text(g.name),ref:text(g.ref)||`group/${text(g.id)}`,members:strings(g.members),routing:text(g.routing),enabled:g.off!==true,ready:g.ready===true,efforts:strings(g.offers),note:text(g.note)}})}
export function gatewayUsage(raw:unknown):GatewayUsage{const u=record(raw);return {calls:num(u.calls),errors:num(u.errors),input:num(u.input),output:num(u.output),reasoning:num(u.reasoning),cost:num(u.cost),unpriced:num(u.unpriced),models:list(u.models).map(value=>{const m=record(value);return {id:text(m.id),name:text(m.name)||text(m.id),calls:num(m.calls),cost:num(m.cost)}})}}
export const gatewayPlugins=gatewayPluginEntries
export function gatewayPrivacy(raw:unknown):GatewaySnapshot['privacy']{const s=record(raw);return {accountDiscovery:s.noAccountDiscovery!==true,forcedOff:s.noAccountsEnv===true,telemetryOff:s.agentTelemetryOff===true,redact:s.redact===true,words:strings(s.redactWords),allow:strings(s.redactAllow),rules:list(s.redactRules).map(value=>{const rule=record(value);return {kind:text(rule.kind),prefix:text(rule.prefix)||undefined,regex:text(rule.regex)||undefined}})}}

interface RoutingModelMetadata {id:string;name?:string;display_name?:string;reasoning?:boolean;native_endpoints?:string[];magpie_prefers?:string;reasoning_levels?:string[];supported_reasoning_levels?:Array<{effort:string}>;context_length?:number;context_window?:number;max_output_tokens?:number}
/** 模型别名/自定义上限会让通用目录缺失能力；供应商详情仍保留原始能力与显式保留范围。 */
export function gatewayRoutingModels(catalog:RoutingModelMetadata[],raw:unknown):import('@proma/shared').ModelRoutingState['models']{
 const providers=list(record(raw).providers)
 return catalog.map(model=>{
  const slash=model.id.indexOf('/'),providerId=model.id.slice(0,slash),modelId=model.id.slice(slash+1)
  const provider=record(providers.find(value=>record(value).id===providerId)),detail=record(list(provider.models).find(value=>record(value).id===modelId))
  const kept=strings(detail.kept),full=detail.efforts
  // given 是网关编辑器提供的可填写候选，并非供应商声明的真实能力。
  const efforts=kept.length?kept:detail.given===true?(model.reasoning_levels??model.supported_reasoning_levels?.map(level=>level.effort)??[]):Array.isArray(full)?strings(full):model.reasoning_levels??model.supported_reasoning_levels?.map(level=>level.effort)??[]
  const capacity=(...values:unknown[])=>values.find((value):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0)
  return {id:model.id,name:model.name??model.display_name??model.id,reasoning:model.reasoning||!!efforts.length,icon:text(provider.icon)||undefined,providerName:text(provider.name)||undefined,nativeEndpoints:model.native_endpoints,preferredEndpoint:model.magpie_prefers,efforts,contextWindow:capacity(detail.context,detail.listed,model.context_length,model.context_window),maxOutputTokens:capacity(detail.output,detail.listedOutput,model.max_output_tokens),images:typeof detail.images==='boolean'?detail.images:undefined}
 })
}

function platformLogins(provider:Record<string,unknown>):GatewayPlatformLogin[]{
 return (['stepfun','qianfan','qianwen'] as const).flatMap(kind=>{const field=kind==='stepfun'?'stepPlan':kind==='qianfan'?'qianfanPlan':'qianwenPlan';const value=provider[field];if(!value)return [];const p=record(value);return [{kind,signedIn:p.signedIn===true,url:text(p.url),bookmarklet:text(p.bookmarklet),account:text(p.account),ended:p.ended===true}]})
}
