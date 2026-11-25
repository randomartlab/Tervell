import {test,expect} from 'bun:test'
import {normalizeActivityDisplay,activityStartsExpanded,inlineAttachmentsForModel,serializeInlineAttachment} from '@proma/shared'
import {MobileLiveActivity} from '../apps/electron/src/main/lib/mobile-live-activity'
import {RemoteHost,createDirectDevice} from '../packages/core/src/remote/host'
import type {RemoteState} from '../packages/core/src/remote/host'
import {sealRemote,openRemote} from '../packages/core/src/remote/crypto'
import {randomUUID} from 'node:crypto'
test('Given 旧设置 When 打开过程显示 Then 默认适中且三档不改变原始内容',()=>{
 expect(normalizeActivityDisplay(null)).toEqual({reasoning:'balanced',operations:'balanced'})
 expect(activityStartsExpanded('expanded',false)).toBe(true);expect(activityStartsExpanded('collapsed',true)).toBe(false)
 expect(activityStartsExpanded('balanced',true)).toBe(true);expect(activityStartsExpanded('balanced',false,true)).toBe(true)
 const marker=serializeInlineAttachment({id:'a',label:'对话历史',mediaType:'application/x-tervell-history',path:'/owned/history'})
 expect(inlineAttachmentsForModel(marker)).toBe(marker)
})
test('Given 手机当前运行 When 推理与工具结果更新 Then 实时快照保留结构并在完成清空',()=>{
 const state=new MobileLiveActivity()
 state.update('s',{kind:'sdk_delta',delta:{uuid:'answer',runGeneration:2,deltas:[{type:'thinking_start',contentIndex:0},{type:'thinking_delta',contentIndex:0,delta:'分析中'},{type:'toolcall_start',contentIndex:1,toolCall:{id:'tool',name:'read',arguments:{path:'a.ts'}}}]}})
 expect(state.snapshot('s').map(r=>r.kind)).toEqual(['reasoning','read'])
 state.update('s',{kind:'sdk_delta',delta:{uuid:'answer',runGeneration:1,deltas:[{type:'thinking_delta',contentIndex:0,delta:'旧运行'}]}})
 expect(state.snapshot('s')[0]?.body).toBe('分析中')
 state.update('s',{kind:'sdk_message',message:{type:'user',message:{content:[{type:'tool_result',tool_use_id:'tool',content:'文件内容'}]}}})
 expect(state.snapshot('s')[1]?.status).toBe('completed');expect(state.snapshot('s')[1]?.body).toContain('文件内容')
 const snapshot=state.snapshot('s');snapshot[0]!.body='外部修改';expect(state.snapshot('s')[0]?.body).toBe('分析中')
 state.update('s',{kind:'proma_event',event:{type:'run_completed',source:'desktop',stoppedByUser:false}});expect(state.snapshot('s')).toEqual([])
})
test('Given 单条巨大工具结果 When 手机请求 Then 密文前响应有界且提示裁剪',async()=>{
 const state:RemoteState={hostId:'host',devices:[],sent:[]};const device=createDirectDevice(state,{url:'https://127.0.0.1:9999',certificateSha256:'a'.repeat(64)},['w']);device.paired=true
 const host=new RemoteHost(state,{sessions:()=>[{id:'s',title:'test',workspaceId:'w',updatedAt:1}],workspaces:()=>[],create:async()=>{throw Error()},messages:()=>[{id:'a',role:'assistant',content:'x'.repeat(1000000),createdAt:1,activity:Array.from({length:200},(_,i)=>({id:String(i),kind:'shell',label:'command',body:'x'.repeat(1000000),status:'completed',createdAt:1}))}],send:()=>{},stop:()=>{},approvals:()=>[],approve:()=>false,running:()=>false},()=>{},()=>['w'])
 const packet=sealRemote(device.pairing,'to-host',1,{id:randomUUID(),sentAt:Date.now(),method:'messages',sessionId:'s'})
 const reply=await host.receive(device,packet)
 const opened=openRemote(device.pairing,'to-device',0,reply).value as {ok:boolean;data:{messages:Array<{truncated:boolean;activity:Array<{truncated:boolean}>}>}}
 expect(opened.ok).toBe(true);expect(opened.data.messages[0]?.truncated).toBe(true);expect(opened.data.messages[0]?.activity[0]?.truncated).toBe(true);expect(JSON.stringify(opened).length).toBeLessThan(100000)
})
import {reasoningNeedsChinese,reasoningTranslationChunks} from '@proma/shared'
import {usesNativeMessageLayout} from '../apps/electron/src/renderer/components/plugins/native-timeline-policy'
test('Given Vivid与Better默认启用 When 显示原生会话 Then 字体布局与动作由Proma持有且外部贡献保留',()=>{
 for(const id of ['builtin-vivid-activity','builtin-better-conversation'])for(const type of ['assistant_message','user_message','reasoning','tool_call'])expect(usesNativeMessageLayout(id,type)).toBe(true)
 expect(usesNativeMessageLayout('third-party-plugin','reasoning')).toBe(false)
 expect(usesNativeMessageLayout('builtin-vivid-activity','external-plugin-item')).toBe(false)
})
test('Given 中文推理与代码 When 判断与拆段 Then 不翻译代码本身且长文本无遗漏',()=>{
 expect(reasoningNeedsChinese('先读取文件，再核对返回的结果。')).toBe(false)
 expect(reasoningNeedsChinese('Let me inspect the file before changing the implementation.')).toBe(true)
 expect(reasoningNeedsChinese('```ts\nconst longExample = fetch("https://example.org");\n```')).toBe(false)
 const source=('First inspect files and then verify all results.\n\n').repeat(300)
 const chunks=reasoningTranslationChunks(source,1000);expect(chunks.join('')).toBe(source);expect(chunks.every(c=>c.length<=1000)).toBe(true)
})
test('Given 非英语推理和围栏代码 When 中文展示预处理 Then 识别外语且代码不进入翻译任务',()=>{
 expect(reasoningNeedsChinese('まずファイルを確認してから変更します')).toBe(true)
 expect(reasoningNeedsChinese('Проверить исходный файл')).toBe(true)
 const code='```ts\n'+('const exampleIdentifier = "preserve source code";\n').repeat(50)+'```\n'
 const chunks=reasoningTranslationChunks('First check files.\n\n'+code+'Next verify all results.',200)
 expect(chunks.join('')).toBe('First check files.\n\n'+code+'Next verify all results.')
 expect(chunks.filter(c=>c===code)).toHaveLength(1)
 expect(reasoningNeedsChinese(code)).toBe(false)
})
import {normalizeTypography} from '@proma/shared'
test('Given 用户三组字体偏好 When 保存 Then 相互独立且非法CSS不进入DOM',()=>{
 expect(normalizeTypography({uiFont:'PingFang SC',uiSize:18,codeFont:'Consolas',codeSize:13,conversationSize:20})).toEqual({uiFont:'PingFang SC',codeFont:'Consolas',uiSize:18,codeSize:13,conversationSize:20})
 expect(normalizeTypography({uiFont:'bad; color:red',uiSize:Infinity,codeSize:100,conversationSize:1})).toEqual({codeSize:28,conversationSize:11})
 expect(normalizeTypography({})).toEqual({})
})
