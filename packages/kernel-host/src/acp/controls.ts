import type { KernelSessionControl, KernelControlChoice, KernelConfigValue } from '@proma/shared'
import { primaryKernelControl } from '@proma/shared'
import { array, record } from './dialects/types.ts'
const scalar=(v:unknown):v is KernelConfigValue=>typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)
export function flattenConfigChoices(raw:unknown,group?:string,depth=0):KernelControlChoice[]{
 if(depth>8)return []
 return array(raw).slice(0,10000).flatMap(v=>{const o=record(v);if(Array.isArray(o.options))return flattenConfigChoices(o.options,typeof o.name==='string'?o.name:group,depth+1);const value=o.value??o.modelId??o.id;return scalar(value)?[{value,name:typeof o.name==='string'?o.name:String(value),...(typeof o.description==='string'?{description:o.description}:{}),...(group?{group}:{})}]:[]})
}
export function sessionControls(raw:unknown):KernelSessionControl[]{
 const metadata=record(raw),controls:KernelSessionControl[]=[]
 for(const value of array(metadata.configOptions).slice(0,128)){
  const o=record(value);if(typeof o.id!=='string'||!o.id||o.id.length>512)continue
  const options=flattenConfigChoices(o.options),currentValue=scalar(o.currentValue)?o.currentValue:undefined
  const type:KernelSessionControl['type']=o.type==='select'?'select':o.type==='boolean'||o.type==='toggle'?'boolean':o.type==='number'?'number':o.type==='string'?'string':'unsupported'
  controls.push({id:o.id,name:typeof o.name==='string'?o.name:o.id,description:typeof o.description==='string'?o.description:undefined,category:typeof o.category==='string'?o.category:undefined,type,currentValue,options:type==='select'?options:undefined,minimum:typeof o.min==='number'?o.min:undefined,maximum:typeof o.max==='number'?o.max:undefined,method:'config',readOnly:type==='unsupported'||type==='select'&&!options.length})
 }
 for(const kind of ['model','mode'] as const){if(primaryKernelControl(controls,kind))continue
  const state=record(metadata[kind==='model'?'models':'modes']),options=flattenConfigChoices(state[kind==='model'?'availableModels':'availableModes'])
  if(options.length)controls.push({id:kind,name:kind==='model'?'模型':'模式',category:kind,type:'select',currentValue:scalar(state[kind==='model'?'currentModelId':'currentModeId'])?state[kind==='model'?'currentModelId':'currentModeId'] as KernelConfigValue:undefined,options,method:kind})
 }
 return [...new Map(controls.map(c=>[c.id,c])).values()]
}
export function validateControlValue(control:KernelSessionControl,value:KernelConfigValue):void{
 if(control.readOnly)throw new Error(`${control.name} 暂不可修改`)
 const valid=control.type==='select'?control.options?.some(o=>o.value===value):control.type==='boolean'?typeof value==='boolean':control.type==='number'?typeof value==='number'&&Number.isFinite(value)&&(control.minimum===undefined||value>=control.minimum)&&(control.maximum===undefined||value<=control.maximum):control.type==='string'?typeof value==='string'&&value.length<=8192:false
 if(!valid)throw new Error(`${control.name} 的值不在内核返回的可用范围`)
}
