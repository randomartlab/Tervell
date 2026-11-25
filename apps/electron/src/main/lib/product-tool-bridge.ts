import { ToolGate, PathBoundary } from '@proma/core/permission'
import { createAcpClientBridge } from '@proma/kernel-host'
import { ToolContextSchema } from '@proma/protocol'
import { registerExtendedTools } from '@proma/tool-bridge'
import { extendedProductBackend } from './extended-product-tools'
import { join } from 'node:path'
import { getConfigDir } from './config-paths'
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file'
import { buildKernelEnv } from '@proma/auth-bridge'
import { resolveDialectKernel } from '@proma/kernel-host'
import type { KernelAuthConfigInput } from '@proma/protocol'
import { credentialVault } from './credential-vault'
import { createPlanningBackend, registerPlanningTools, SessionToolServer, ToolCatalog } from '@proma/tool-bridge'
import type { ToolContext } from '@proma/protocol'
import * as planning from './planning-manager'
import { broadcastPlanningChanged } from './planning-events'
import { permissionService } from './agent-permission-service'
import { agentEventBus } from './agent-service'
import { getAgentSessionMeta } from './agent-session-manager'

/** 仅由宿主创建的ACP会话调用；运行时路径由打包层显式提供，不调用安装器。 */
export async function openProductToolBridge(context: ToolContext, runtime: { command: string; args: string[] }, gate = productToolGate, cwd?:string): Promise<{ config: ReturnType<SessionToolServer['config']>; close(): Promise<void> }> {
  const session = getAgentSessionMeta(context.sessionId)
  if (!session || session.workspaceId !== context.workspaceId) throw new Error('工具桥会话项目不匹配')
  const catalog = new ToolCatalog(gate)
  registerPlanningTools(catalog, createPlanningBackend(planning, (kind) => broadcastPlanningChanged(kind === 'todo' ? ['todos'] : ['calendar_events'])))
  if(cwd)registerExtendedTools(catalog,extendedProductBackend(cwd))
  const host = await SessionToolServer.open({
    context, runtime, catalog,
    assertContext: (current) => {
      const meta = getAgentSessionMeta(current.sessionId)
      if (!meta || meta.workspaceId !== current.workspaceId || (meta.permissionMode === 'plan' && !current.permission.plan)) throw new Error('会话项目已变更，请重新创建工具桥')
    },
    authorize: async (request) => {
      const meta = getAgentSessionMeta(context.sessionId)
      if (!meta || meta.workspaceId !== context.workspaceId) return false
      const input = request.input && typeof request.input === 'object' && !Array.isArray(request.input) ? request.input : {}
      const result = await permissionService.requestGateApproval(context.sessionId, request.tool.name, input, { signal: request.signal, toolUseID: request.tool.name }, request.whitelistable === true, (req) => {
        // 服务先登记 pending，再通知监听者，避免同步答复早于登记。
        queueMicrotask(() => { if (!request.signal.aborted) agentEventBus.emit(context.sessionId, { kind: 'proma_event', event: { type: 'permission_request', request: req } }) })
      })
      const current = getAgentSessionMeta(context.sessionId)
      return result.behavior === 'allow' && current?.workspaceId === context.workspaceId ? result.decisionClassification === 'user_permanent' ? 'allow-session' : 'allow-once' : 'deny'
    },
  })
  return { config: host.config(), close: async() => {await host.close();gate.clearSession(context.sessionId)} }
}

/** Core/API 层复用的显式组合入口；不会注册 UI、执行安装或自动选择内核。 */
export const productToolGate = new ToolGate((event)=>{
  const path=join(getConfigDir(),'tool-audit.json')
  const current=readJsonFileSafe<{events:unknown[]}>(path)
  writeJsonFileAtomic(path,{version:1,events:[...(current?.events??[]).slice(-1999),event]})
})
export async function createProductAcpKernel(input: { kernelId: string; version?: string; cwd: string; context: ToolContext; auth: KernelAuthConfigInput; baseEnv: Record<string, string | undefined>; runtime: { command: string; args: string[] } }): Promise<ReturnType<typeof resolveDialectKernel>> {
  if (input.auth.kernelId !== input.kernelId) throw new Error('凭据配置与内核归属不匹配')
  const context=ToolContextSchema.parse(input.context)
  const { env } = await buildKernelEnv(input.auth, { baseEnv: input.baseEnv, secrets: credentialVault })
  const assertContext=()=>{const session=getAgentSessionMeta(context.sessionId);if(session?.workspaceId!==context.workspaceId||(session.permissionMode==='plan'&&!context.permission.plan))throw new Error('会话项目或权限已改变')}
  const authorize=async(request:import('@proma/core/permission').GateApproval)=>{
    const values=request.input&&typeof request.input==='object'&&!Array.isArray(request.input)?request.input:{}
    const result=await permissionService.requestGateApproval(context.sessionId,request.tool.name,values,{signal:request.signal,toolUseID:request.tool.name},request.whitelistable,req=>queueMicrotask(()=>{if(!request.signal.aborted)agentEventBus.emit(context.sessionId,{kind:'proma_event',event:{type:'permission_request',request:req}})}))
    return result.behavior==='allow'?result.decisionClassification==='user_permanent'?'allow-session' as const:'allow-once' as const:'deny' as const
  }
  return resolveDialectKernel({ kernelId: input.kernelId, version: input.version, cwd: input.cwd, env,
    openToolBridge: (session) => {
      if (session.sessionId !== context.sessionId) throw new Error('工具桥不属于当前内核会话')
      return openProductToolBridge(context, input.runtime,productToolGate,input.cwd)
    },
    openClientBridge:async(session)=>createAcpClientBridge(session,{context,assertContext,authorize},new PathBoundary({cwd:input.cwd},()=>{}),productToolGate),
    approve:async(request,signal)=>{
      if(request.sessionId!==context.sessionId)return null
      try{
        await productToolGate.run({name:request.command?'execute':request.tool,kind:request.command?'execute':request.kind,effect:request.kind==='read'||request.kind==='search'?'read':request.kind==='delete'?'delete':request.kind==='fetch'?'external':'write',command:request.command,forceAsk:true},request.input,{context,signal,authorize,assertContext},()=>{})
        return request.options.find(o=>o.kind==='allow_once')?.optionId??null
      }catch{return request.options.find(o=>o.kind==='reject_once')?.optionId??null}
    },
  })
}
