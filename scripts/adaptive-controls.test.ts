import{test,expect}from'bun:test'
import{sessionControls,validateControlValue}from'../packages/kernel-host/src/acp/controls'
import{KernelRegistry}from'../packages/kernel-host/src/registry'
import{acpDialect}from'../packages/kernel-host/src/acp/dialects'
import{routedModel,MAGPIE_AGENT_ADAPTERS}from'../packages/auth-bridge/src/agent-routing'
import{isReasoningControl}from'../packages/shared/src/utils/reasoning-options'
test('Given 全部注册内核 When 单独覆盖且全局关闭 Then 路由解析一致且原生推理控件完整',()=>{
 const levels=['none','minimal','low','medium','high','xhigh','max','ultra','vendor-future']
 for(const id of new Set(['pi',...new KernelRegistry().list().map(k=>k.id),...Object.keys(MAGPIE_AGENT_ADAPTERS)])){
  const policy={enabled:false,defaultModel:'',rules:[{kernelId:id,mode:'override' as const,model:'provider/model'}]}
  expect(routedModel(policy,id)).toBe('provider/model')
  expect(routedModel({...policy,rules:[{kernelId:id,mode:'native'}]},id)).toBeUndefined()
  const controls=sessionControls({configOptions:[{id:'reasoning',category:'thought_level',name:id,type:'select',currentValue:'ultra',options:levels.map(value=>({value,name:value}))}]})
  expect(controls.filter(isReasoningControl)[0]?.options?.map(option=>option.value)).toEqual(levels)
  for(const level of levels)expect(()=>validateControlValue(controls[0]!,level)).not.toThrow()
 }
})
test('Given 全部ACP默认目录 When 使用通用配置协议 Then 都支持模型/审批/Fast等自描述控件且不依赖产品名',()=>{
 const definitions=new KernelRegistry().list().filter(d=>d.acp)
 expect(definitions.length).toBeGreaterThanOrEqual(49);expect(new Set(definitions.map(d=>d.id)).size).toBe(definitions.length)
 for(const def of definitions){const controls=sessionControls({configOptions:[{id:'engine',category:'model',name:'Model',type:'select',currentValue:'a',options:[{name:'Group',options:[{value:'a',name:def.name}]}]},{id:'fast',name:'Fast',type:'boolean',currentValue:false}]});expect(controls[0]?.options?.[0]?.name).toBe(def.name);expect(()=>validateControlValue(controls[1]!,true)).not.toThrow();expect(()=>validateControlValue(controls[0]!,'fake')).toThrow()}
 expect(acpDialect('grok').catalog?.read({result:{availableModels:[{modelId:'grok-reported',name:'Reported'}],currentModelId:'grok-reported'}}).models[0]?.id).toBe('grok-reported')
})
test('Given 旧ACP模式与未知控件 When 生成表单 Then 旧目录保留且未知字段只读不猜写法',()=>{
 const controls=sessionControls({models:{availableModels:[{modelId:'legacy',name:'Legacy'}]},modes:{availableModes:[{id:'ask',name:'Ask'}]},configOptions:[{id:'future',name:'Future',type:'future-widget'}]})
 expect(controls.map(c=>c.method)).toEqual(['config','model','mode']);expect(controls[0]?.readOnly).toBe(true);expect(()=>validateControlValue(controls[0]!,'x')).toThrow()
})

test('Given 会话配置的广播缓存 When 另一会话或内核查询 Then 不串台且原模型响应保留',async()=>{
 const {rememberKernelCatalog,cachedKernelCatalog}=await import('../apps/electron/src/main/lib/desktop-kernel-catalog')
 rememberKernelCatalog('s1','codex',{models:[{id:'reported',name:'Reported'}],modes:[],currentModelId:'reported',currentModeId:null,controls:[{id:'speed',name:'Fast',type:'select',options:[{value:'fast',name:'Fast'}],method:'config'}]})
 expect(cachedKernelCatalog('s1','codex')?.controls?.[0]?.name).toBe('Fast');expect(cachedKernelCatalog('s1','grok')).toBeUndefined();expect(cachedKernelCatalog('s2','codex')).toBeUndefined()
})
