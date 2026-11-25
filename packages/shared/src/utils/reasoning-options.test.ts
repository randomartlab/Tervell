import {test,expect} from 'bun:test'
import {isReasoningControl,uniqueReasoningEfforts} from './reasoning-options'
test('Given 不同内核自描述控件 When 识别推理入口 Then 不依赖内核名且保留未知档位',()=>{
 for(const category of ['thought_level','reasoning_effort','thinking'])expect(isReasoningControl({id:'vendor-setting',name:'Depth',type:'select',method:'config',category})).toBe(true)
 expect(isReasoningControl({id:'vendor.reasoning',name:'自定义',type:'select',method:'config'})).toBe(true)
 expect(isReasoningControl({id:'speed',name:'Fast',type:'boolean',method:'config'})).toBe(false)
 expect(uniqueReasoningEfforts(['none','minimal','ultra','vendor-future','minimal',''])).toEqual(['none','minimal','ultra','vendor-future'])
})
