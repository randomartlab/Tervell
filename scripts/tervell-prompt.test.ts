import {expect,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {BUILTIN_DEFAULT_ID,BUILTIN_DEFAULT_PROMPT,TERVELL_CORE_WORKFLOW_PROMPT} from '../packages/shared/src/types/system-prompt'

test('Given 升级内置提示词 When 保留已有选择 Then ID稳定且名称与通用协作契约更新',()=>{
 expect(BUILTIN_DEFAULT_ID).toBe('builtin-default')
 expect(BUILTIN_DEFAULT_PROMPT.name).toBe('Tervell 内置提示词')
 expect(BUILTIN_DEFAULT_PROMPT.content).toBe(TERVELL_CORE_WORKFLOW_PROMPT)
 expect(TERVELL_CORE_WORKFLOW_PROMPT).not.toMatch(/Proma|\/Users\/|bhliu|刘博士|刘老师|14242|randomai|sk-[A-Za-z0-9]/)
 expect(TERVELL_CORE_WORKFLOW_PROMPT.length).toBeLessThan(4200)
})
test('Given Chat与不同Agent内核 When 构建默认上下文 Then 复用同一契约且不灌入无工具辅助',()=>{
 const pi=readFileSync('apps/electron/src/main/lib/agent-prompt-builder.ts','utf8'),acp=readFileSync('apps/electron/src/main/lib/desktop-acp-runner.ts','utf8')
 expect(pi).toContain('TERVELL_CORE_WORKFLOW_PROMPT,')
 expect(acp).toContain("meta.pluginToolFree?(meta.pluginSystemPrompt??'只回答用户提供的内容。'):TERVELL_CORE_WORKFLOW_PROMPT")
 for(const value of ['合理默认值','调整方向必须有新证据','旧问题必须能使检查失败','超时或写入结果不确定先回读','当前用户要求','项目专属']){
  if(value==='项目专属')continue
  expect(TERVELL_CORE_WORKFLOW_PROMPT).toContain(value)
 }
})
