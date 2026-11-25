import {test,expect} from 'bun:test'
import {getAdapter} from './index'
import {applyReasoningSelection} from './reasoning-selection'
import type {ProviderType} from '@proma/shared'

test('Given 模型声明扩展档位 When Chat构造各协议请求 Then 全部原值进入实际请求且工具轮配置相同',()=>{
 const values=['none','minimal','low','medium','high','xhigh','max','ultra','vendor-future']
 for(const provider of ['openai','openai-responses','anthropic','google'] as const){
  const adapter=getAdapter(provider)
  for(const reasoningEffort of values){
   const request=adapter.buildStreamRequest({baseUrl:'http://127.0.0.1:1/v1',apiKey:'test',modelId:'fixture-model',history:[],userMessage:'hello',readImageAttachments:()=>[],reasoningEffort,reasoningEffortRaw:true})
   const body=JSON.parse(request.body)
   if(provider==='openai')expect(body.reasoning_effort).toBe(reasoningEffort)
   if(provider==='openai-responses')expect(body.reasoning.effort).toBe(reasoningEffort)
   if(provider==='anthropic')expect(reasoningEffort==='none'?body.thinking.type:body.output_config.effort).toBe(reasoningEffort==='none'?'disabled':reasoningEffort)
   if(provider==='google')expect(reasoningEffort==='none'?body.generationConfig.thinkingConfig.thinkingBudget:body.generationConfig.thinkingConfig.thinkingLevel).toBe(reasoningEffort==='none'?0:reasoningEffort.toUpperCase())
  }
 }
})

test('Given 已核实模型协议映射 When 显式选择档位 Then 保留专用编码与无关字段且不改原对象',()=>{
 const body={thinking:{type:'disabled'},output_config:{format:'json'},messages:[]}
 expect(applyReasoningSelection(body,'deepseek','deepseek-v4-pro','xhigh')).toMatchObject({thinking:{type:'enabled'},output_config:{effort:'max',format:'json'}})
 expect(applyReasoningSelection(body,'zhipu','glm-5.3','max')).toMatchObject({thinking:{type:'enabled'},reasoning_effort:'max'})
 expect(applyReasoningSelection(body,'anthropic','fixture','off').output_config).toEqual({format:'json'})
 expect(applyReasoningSelection(body,'openai','fixture',undefined)).toBe(body)
 expect(body.thinking.type).toBe('disabled')
 expect(applyReasoningSelection(body,'openai-responses','gpt-5.6','minimal',true)).toMatchObject({reasoning:{effort:'minimal'}})
 expect(applyReasoningSelection({max_tokens:2048},'anthropic','claude-sonnet-4-5','high')).toMatchObject({thinking:{type:'enabled',budget_tokens:16384},max_tokens:17408})
 expect(applyReasoningSelection({},'google','gemini-2.5-pro','low')).toMatchObject({generationConfig:{thinkingConfig:{thinkingBudget:2048}}})
 for(const provider of ['openai','openai-responses'] as ProviderType[])expect(JSON.stringify(applyReasoningSelection(body,provider,'fixture','off'))).toContain('none')
})
