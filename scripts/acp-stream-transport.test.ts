import { expect, test } from 'bun:test'
import type { AgentStreamEvent } from '@proma/shared'
import { createAgentStreamEventBatcher } from '../apps/electron/src/renderer/lib/agent-stream-event-batcher'
import { AgentStreamForwarder } from '../apps/electron/src/main/lib/agent-stream-forwarder'

const partial=(uuid:string):AgentStreamEvent=>({sessionId:'s',payload:{kind:'sdk_message',message:{type:'assistant',uuid,_partial:true,message:{content:[{type:'tool_use',id:uuid,name:'read',input:{}}]}}}})
const delta=(generation:number):AgentStreamEvent=>({sessionId:'s',payload:{kind:'sdk_delta',delta:{uuid:'text',runStartedAt:1,runGeneration:generation,deltas:[{type:'text_delta',contentIndex:0,delta:'内容'}]}}})
test('Given 同帧并发ACP工具预览与文本 When 合批 Then 不同UUID不覆盖且旧代际不拼入新运行',()=>{
 let flush:()=>void=()=>{};const received:AgentStreamEvent[]=[]
 const batch=createAgentStreamEventBatcher({dispatch:e=>received.push(e),requestFrame:f=>{flush=()=>f(0);return 1},cancelFrame:()=>{},scheduleFallback:()=>2,cancelFallback:()=>{}})
 batch.push(partial('first'));batch.push(partial('second'));batch.push(delta(1));batch.push(delta(2));flush()
 expect(received).toHaveLength(4);expect(received[0]).toEqual(partial('first'));expect(received[1]).toEqual(partial('second'));expect(received[2]).toEqual(delta(1));expect(received[3]).toEqual(delta(2));batch.dispose()
})
test('Given 主进程节流窗口中的多个工具UUID When 连续发包 Then 每个预览保持顺序且同UUID只保留最新',()=>{
 let timer:()=>void=()=>{};const received:AgentStreamEvent[]=[]
 const forward=new AgentStreamForwarder({now:()=>1,schedule:fn=>{timer=fn;return 1 as unknown as ReturnType<typeof setTimeout>},cancel:()=>{}})
 const send=(e:AgentStreamEvent)=>received.push(e)
 forward.forward(partial('first'),send,true);forward.forward(partial('second'),send,true);forward.forward(partial('second'),send,true);forward.forward(delta(1),send,true);timer()
 expect(received).toEqual([partial('first'),partial('second'),delta(1)]);forward.clear('s')
})
