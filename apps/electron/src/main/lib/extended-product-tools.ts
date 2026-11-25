import {createExtendedBackend} from '@proma/tool-bridge'
import type {ExtendedBackend} from '@proma/tool-bridge'
import {ProjectTools,PathBoundary} from '@proma/core/permission'
import {getAgentSessionMeta} from './agent-session-manager'
import {listAutomations,getAutomation,createAutomation,updateAutomation} from './automation-manager'
import {broadcastChanged} from './automation-scheduler'
import {startProductDelegation,listProductDelegations,stopProductDelegation} from './agent-collaboration-tools'
export function extendedProductBackend(cwd:string):ExtendedBackend{
 const project=new ProjectTools(cwd,new PathBoundary({cwd},()=>{}))
 const automation=(item:NonNullable<ReturnType<typeof getAutomation>>)=>({id:item.id,name:item.name,active:item.active,scheduleType:item.scheduleType,workspaceId:item.workspaceId??''})
 return createExtendedBackend({
  automations:()=>listAutomations().filter(a=>!!a.workspaceId).map(automation),
  getAutomation:id=>{const item=getAutomation(id);return item?automation(item):undefined},
  createAutomation:(input,ctx)=>{
   const session=getAgentSessionMeta(ctx.sessionId);if(!session?.channelId||session.workspaceId!==ctx.workspaceId)throw new Error('会话渠道或项目无效')
   const created=createAutomation({...input,scheduleType:'once',intervalMinutes:1,workspaceId:ctx.workspaceId,channelId:session.channelId,modelId:session.modelId,sourceSessionId:ctx.sessionId,active:false})
   broadcastChanged();return automation(created)
  },
  setActive:(id,active)=>{const changed=updateAutomation({id,active});if(!changed)throw new Error('自动化不存在');broadcastChanged();return automation(changed)},
  startDelegation:(input,ctx)=>startProductDelegation(ctx,input),
  delegations:listProductDelegations,stopDelegation:stopProductDelegation,
  project:{worktree_list:async(_input,_ctx,signal)=>({worktrees:await project.worktrees(signal)}),worktree_create:async(input,_ctx,signal)=>project.create(input.name,signal),files_search:async(input,_ctx,signal)=>project.search(input.query,input.limit,signal)},
 })
}
