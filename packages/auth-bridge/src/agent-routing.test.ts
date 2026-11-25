import {expect,test} from 'bun:test'
import {routedModel,routedAgentEnvironment,MAGPIE_AGENT_ADAPTERS,kernelGatewayEnvironment} from './agent-routing'
import {selectAuthenticationFallbackModel} from './auth-fallback'
import {routedApprovalDefault}from'./routed-approval'

test('Given 未登录内核与多个供应商 When 选择Magpie接管模型 Then 用户默认优先且不擅自选择收费供应商',()=>{
 expect(selectAuthenticationFallbackModel('a/model',['a/model','b/model'])).toBe('a/model')
 expect(selectAuthenticationFallbackModel('',['a/model'])).toBe('a/model')
 expect(selectAuthenticationFallbackModel('',['a/model','b/model'])).toBeUndefined()
 expect(selectAuthenticationFallbackModel('stale/model',[])).toBeUndefined()
})
test('Given 全局覆盖和逐内核例外 When 解析路由 Then 例外优先且全局开关只控制跟随者',()=>{
 const policy={enabled:true,defaultModel:'vendor/model-a',rules:[{kernelId:'codex',mode:'override' as const,model:'group/code'},{kernelId:'grok',mode:'native' as const}]}
 expect(routedModel(policy,'claude')).toBe('vendor/model-a');expect(routedModel(policy,'codex')).toBe('group/code');expect(routedModel(policy,'grok')).toBeUndefined()
 expect(routedModel({...policy,enabled:false},'codex')).toBe('group/code')
 expect(routedModel({...policy,enabled:false},'claude')).toBeUndefined()
 expect(routedModel({...policy,enabled:false},'grok')).toBeUndefined()
 expect(MAGPIE_AGENT_ADAPTERS.mcode).toBe('minimax-code');expect(MAGPIE_AGENT_ADAPTERS.antigravity).toBe('agy');expect(MAGPIE_AGENT_ADAPTERS.cursor).toBeUndefined()
})
test('Given 全局关闭且仅 Pi 单独覆盖 When 切换内核或原生策略 Then 仅 Pi 使用指定模型',()=>{
 const policy={enabled:false,defaultModel:'',rules:[{kernelId:'pi',mode:'override' as const,model:' provider/GLM-5.3 '}]}
 expect(routedModel(policy,'pi')).toBe('provider/GLM-5.3')
 expect(routedModel(policy,'codex')).toBeUndefined()
 expect(routedModel({...policy,rules:[{kernelId:'pi',mode:'native'}]},'pi')).toBeUndefined()
 expect(routedModel({enabled:true,defaultModel:'global/model',rules:[{kernelId:'pi',mode:'override',model:'  '}]},'pi')).toBeUndefined()
})
test('Given 原生认证与工作区变量 When 生成受管环境 Then 清除供应商凭据保留必要上下文且不改原对象',()=>{
 const base={HOME:'/daily',ANTHROPIC_AUTH_TOKEN:'daily-secret',OPENAI_API_KEY:'daily-key',WORKSPACE_TAG:'project-a',PATH:'/bin',CLAUDE_CODE_USE_VERTEX:'1',OPENCODE_CONFIG:'/daily/config.json'}
 const next=routedAgentEnvironment(base,'/managed/home','/managed/config','/managed/cache','http://127.0.0.1:3999')
 expect(next.CLAUDE_CODE_USE_VERTEX).toBeUndefined();expect(next.OPENCODE_CONFIG).toBeUndefined();expect(next.ANTHROPIC_AUTH_TOKEN).toBeUndefined();expect(next.OPENAI_API_KEY).not.toBe('daily-key');expect(next.HOME).toBe('/managed/home');expect(next.WORKSPACE_TAG).toBe('project-a');expect(next.MAGPIE_NO_ACCOUNTS).toBe('1');expect(base.HOME).toBe('/daily')
})
test('Given Cline和CodeBuddy的ACP入口独立认证 When 接管 Then 传递真实启动选择而非只修改TUI配置',()=>{
 expect(kernelGatewayEnvironment('cline','http://127.0.0.1:1','provider/model')).toMatchObject({CLINE_PROVIDER:'openai-compatible',CLINE_MODEL:'provider/model'});expect(kernelGatewayEnvironment('codebuddy','http://127.0.0.1:1','provider/model').CODEBUDDY_API_KEY).toBeTruthy();expect(MAGPIE_AGENT_ADAPTERS['pi-acp']).toBe('pi')
})
test('Given Windows多个会话共用原始环境 When 接管模型 Then AppData和临时文件随受管HOME隔离',()=>{
 const base={PATH:'C:/Windows',APPDATA:'C:/daily/Roaming',LOCALAPPDATA:'C:/daily/Local',TEMP:'C:/daily/Temp',TMP:'C:/daily/Temp',SystemRoot:'C:/Windows'}
 const first=routedAgentEnvironment(base,'C:/managed/first','C:/managed/config','C:/managed/cache','http://127.0.0.1:3999','win32')
 const second=routedAgentEnvironment(base,'C:/managed/second','C:/managed/config2','C:/managed/cache2','http://127.0.0.1:3999','win32')
 expect(first.APPDATA).toBe('C:/managed/first/AppData/Roaming');expect(first.LOCALAPPDATA).toBe('C:/managed/first/AppData/Local');expect(first.TEMP).toBe('C:/managed/first/AppData/Local/Temp');expect(first.TMP).toBe(first.TEMP);expect(second.APPDATA).not.toBe(first.APPDATA);expect(first.SystemRoot).toBe('C:/Windows');expect(base.APPDATA).toBe('C:/daily/Roaming')
})
test('Given 通用模型接管且未指定审批模式 When 内核默认需要私有分类器 Then 选择真实用户审批而不改明确偏好',()=>{
 expect(routedApprovalDefault('codex',true,undefined,['agent','workspace-write','agent-full-access'])).toBe('workspace-write')
 expect(routedApprovalDefault('qwen',true,undefined,['auto','default','yolo'])).toBe('default');expect(routedApprovalDefault('claude',true,undefined,['auto','default'])).toBe('default')
 expect(routedApprovalDefault('codex',true,'agent',['agent','workspace-write'])).toBeUndefined();expect(routedApprovalDefault('codex',false,undefined,['workspace-write'])).toBeUndefined();expect(routedApprovalDefault('custom',true,undefined,['default'])).toBeUndefined();expect(routedApprovalDefault('codex',true,undefined,['agent'])).toBeUndefined()
})
