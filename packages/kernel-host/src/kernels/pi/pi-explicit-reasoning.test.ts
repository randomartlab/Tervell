import {test,expect} from 'bun:test'
import type {ExtensionAPI} from '@earendil-works/pi-coding-agent'
import {createExplicitReasoningExtension} from './pi-explicit-reasoning'

test('Given Pi默认档位已编码 When 执行最终请求扩展 Then ultra和自定义档位不被SDK枚举裁剪',()=>{
 for(const effort of ['none','minimal','ultra','vendor-future']){
  let handle:((event:{payload:unknown})=>unknown)|undefined
  const api={on:(name:string,handler:(event:{payload:unknown})=>unknown)=>{expect(name).toBe('before_provider_request');handle=handler}} as unknown as ExtensionAPI
  createExplicitReasoningExtension('openai','fixture',effort)(api)
  expect(handle?.({payload:{model:'fixture',reasoning_effort:'high',messages:[]}})).toMatchObject({reasoning_effort:effort})
 }
})
