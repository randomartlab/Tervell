import { expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { SDKMessage } from '@proma/shared'
import type { Message } from '@proma/protocol'
import { prepareDesktopAcpHistory } from '../apps/electron/src/main/lib/desktop-acp-history'

const project=(message:SDKMessage,index:number):Message[]=>[{id:'m'+index,role:'assistant',createdAt:0,content:[{type:'text',text:String((message as {message?:{content?:unknown}}).message?.content??'')}]}]
test('Given 短ACP上下文 When 恢复 Then 全文内联且不留下多余快照',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-acp-short-')),path=join(root,'recovery.md')
 try{const result=await prepareDesktopAcpHistory((async function*(){yield {type:'user',uuid:'a',message:{content:'完整短上下文'}} as SDKMessage})(),path,project,new AbortController().signal);expect(result.summary).toBeUndefined();expect(JSON.stringify(result.history)).toContain('完整短上下文');expect(existsSync(path)).toBe(false)}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 长ACP历史 When 流式恢复 Then 完整文件保留早期内容且直接注入与尾部缓存有界',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-acp-long-')),path=join(root,'recovery.md'),rows=300
 try{const result=await prepareDesktopAcpHistory((async function*(){for(let i=0;i<rows;i++)yield {type:'user',uuid:'m'+i,message:{content:'消息_'+i+' '+'中'.repeat(1500)}} as SDKMessage})(),path,project,new AbortController().signal);const text=readFileSync(path,'utf8');expect(text).toContain('消息_0 ');expect(text).toContain('消息_299 ');expect(result.summary).toContain('300 条完整历史');expect(result.summary).toContain(JSON.stringify(path));expect(result.history.length).toBeLessThanOrEqual(12);expect(Buffer.byteLength(JSON.stringify(result.history))).toBeLessThan(34000)}finally{rmSync(root,{recursive:true,force:true})}
})
test('Given 历史读到一半取消 When 恢复 Then 不产生部分可用快照',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-acp-abort-')),path=join(root,'recovery.md'),controller=new AbortController()
 try{await expect(prepareDesktopAcpHistory((async function*(){yield {type:'user',uuid:'a',message:{content:'first'}} as SDKMessage;controller.abort();yield {type:'user',uuid:'b',message:{content:'second'}} as SDKMessage})(),path,project,controller.signal)).rejects.toThrow();expect(existsSync(path)).toBe(false)}finally{rmSync(root,{recursive:true,force:true})}
})
