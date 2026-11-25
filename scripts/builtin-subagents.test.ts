import{test,expect}from'bun:test'
import{mkdtempSync,writeFileSync,appendFileSync,rmSync}from'node:fs'
import{tmpdir}from'node:os'
import{join}from'node:path'
import{readBuiltinSubagents}from'../apps/electron/src/main/lib/builtin-subagents'

test('Given 长正文与子任务生命周期 When 看板反复读取 Then 摘要保持真实且追加和替换均刷新',()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-subagents-')),path=join(root,'history.jsonl')
 try{
  writeFileSync(path,[{type:'assistant',message:{content:[{type:'text',text:'正文'.repeat(300000)}]}},{type:'system',subtype:'task_started',task_id:'child',task_type:'检查文件',description:'只读检查',timestamp:'2026-11-25T00:00:00Z'}].map(x=>JSON.stringify(x)).join('\n')+'\n')
  const first=readBuiltinSubagents(path,'parent','codex');expect(first).toEqual([{id:'child',parentAgentId:'parent',provider:'codex',title:'检查文件',description:'只读检查',status:'running',createdAt:'2026-11-25T00:00:00Z',updatedAt:'2026-11-25T00:00:00Z',subtitle:null}]);expect(JSON.stringify(first)).not.toContain('正文')
  expect(readBuiltinSubagents(path,'parent','codex')).toEqual(first)
  appendFileSync(path,JSON.stringify({type:'system',subtype:'task_notification',task_id:'child',status:'failed',timestamp:'2026-11-25T00:00:01Z'})+'\n')
  expect(readBuiltinSubagents(path,'parent','codex')[0]).toMatchObject({status:'failed',createdAt:'2026-11-25T00:00:00Z',updatedAt:'2026-11-25T00:00:01Z'})
  writeFileSync(path,JSON.stringify({type:'user',message:{content:'历史已替换'}})+'\n');expect(readBuiltinSubagents(path,'parent','codex')).toEqual([])
  rmSync(path);expect(readBuiltinSubagents(path,'parent','codex')).toEqual([])
 }finally{rmSync(root,{recursive:true,force:true})}
})
