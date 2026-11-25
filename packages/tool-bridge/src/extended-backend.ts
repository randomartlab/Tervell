import type {ExtendedBackend} from './extended.ts'
import type {ToolContext,ExtendedToolInput,ExtendedToolOutput} from '@proma/protocol'
export interface ExtendedStore {
 automations():Array<ExtendedToolOutput<'automation_create'>>
 getAutomation(id:string):ExtendedToolOutput<'automation_create'>|undefined
 createAutomation(input:ExtendedToolInput<'automation_create'>,context:ToolContext):ExtendedToolOutput<'automation_create'>
 setActive(id:string,active:boolean):ExtendedToolOutput<'automation_create'>
 startDelegation(input:ExtendedToolInput<'delegation_start'>,context:ToolContext):ExtendedToolOutput<'delegation_start'>|Promise<ExtendedToolOutput<'delegation_start'>>
 delegations(parentId:string):Array<ExtendedToolOutput<'delegation_start'>>
 stopDelegation(parentId:string,id:string):boolean
 project:Pick<ExtendedBackend,'worktree_list'|'worktree_create'|'files_search'>
}
/** 即使内核没有permission回调，执行端仍复核来源、权限、项目和父子会话归属。 */
export function createExtendedBackend(store:ExtendedStore):ExtendedBackend{
 const userAuto=(context:ToolContext)=>{if(context.triggeredBy!=='user'||context.permission.mode!=='auto'||context.permission.plan)throw new Error('需要用户主会话的auto权限')}
 return {
  automation_list:async(_input,ctx)=>({automations:store.automations().filter(a=>a.workspaceId===ctx.workspaceId).slice(0,200)}),
  automation_create:async(input,ctx)=>{userAuto(ctx);if(input.scheduledAt<=Date.now())throw new Error('定时时间必须在未来');return store.createAutomation(input,ctx)},
  automation_set_active:async(input,ctx)=>{const item=store.getAutomation(input.id);if(!item||item.workspaceId!==ctx.workspaceId)throw new Error('自动化不属于此项目');if(input.active)userAuto(ctx);else if(ctx.triggeredBy!=='user')throw new Error('需要用户主会话');return store.setActive(input.id,input.active)},
  delegation_start:async(input,ctx)=>{userAuto(ctx);return store.startDelegation(input,ctx)},
  delegation_list:async(_input,ctx)=>({delegations:store.delegations(ctx.sessionId).slice(0,100)}),
  delegation_stop:async(input,ctx)=>{if(!store.delegations(ctx.sessionId).some(d=>d.id===input.id))throw new Error('委派不属于此父会话');return {stopped:store.stopDelegation(ctx.sessionId,input.id)}},
  ...store.project,
 }
}
