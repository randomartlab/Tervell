import {expect,test}from'bun:test'
import{mkdtempSync,writeFileSync,appendFileSync,rmSync}from'node:fs'
import{tmpdir}from'node:os'
import{join}from'node:path'
import{readJsonlPage}from'../apps/electron/src/main/lib/jsonl-page'
import{loadAgentHistory}from'../apps/electron/src/renderer/lib/agent-history-loader'
import type{SDKMessage}from'@proma/shared'
test('Given 跨字节Unicode、超单页记录和无末尾换行 When 分页读取 Then 全文顺序不丢失不截断',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-jsonl-page-')),path=join(root,'history.jsonl')
 try{const expected=['中'.repeat(30000),'😀'.repeat(40000),'tail'];writeFileSync(path,expected.join('\r\n'));let page=await readJsonlPage(path,undefined,65536);const actual=page.lines.map(x=>x.line),numbers=page.lines.map(x=>x.number);let count=1;while(page.next){page=await readJsonlPage(path,page.next,65536);actual.push(...page.lines.map(x=>x.line));numbers.push(...page.lines.map(x=>x.number));count++}expect(actual).toEqual(expected);expect(numbers).toEqual([1,2,3]);expect(count).toBeGreaterThan(1)}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 首页返回后历史追加 When 继续旧游标 Then 明确拒绝混合两个版本',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-jsonl-revision-')),path=join(root,'history.jsonl');try{writeFileSync(path,'one\ntwo\n');const page=await readJsonlPage(path,undefined,1);expect(page.next).not.toBeNull();appendFileSync(path,'three\n');await expect(readJsonlPage(path,page.next!)).rejects.toThrow('已变化')}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 分页中的插件行被后续修改 When 组装完整历史 Then 合并为最后值且保留首次位置和身份',async()=>{
 let n=0;const messages=await loadAgentHistory(async()=>++n===1?{messages:[{type:'system',subtype:'plugin_timeline',pluginId:'p',uuid:'first',timestamp:'original',item:{id:'row',text:'one'}}as unknown as SDKMessage],next:{revision:'r',offset:10,line:1}}:{messages:[{type:'user',uuid:'user',message:{content:'kept'}},{type:'system',subtype:'plugin_timeline',pluginId:'p',uuid:'last',item:{id:'row',text:'two'}}]as unknown as SDKMessage[],next:null},()=>false)
 expect(messages).toHaveLength(2);expect(messages[0]).toMatchObject({uuid:'first',timestamp:'original',item:{text:'two'}});expect(messages[1]).toMatchObject({uuid:'user'})
})
test('Given 用户已切换会话 When 批次返回 Then 停止后续IPC且不采用迟到历史',async()=>{
 let cancelled=false,calls=0;const messages=await loadAgentHistory(async()=>{calls++;cancelled=true;return {messages:[],next:{revision:'r',offset:1,line:1}}},()=>cancelled);expect(calls).toBe(1);expect(messages).toEqual([])
})
