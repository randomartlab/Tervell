import {z} from 'zod'
import type {MobileControlAction,MobileControlCall} from '@proma/protocol'
export interface MobileController {id:string;workspaceIds:string[];management:boolean}
export interface MobileContext {device:MobileController;workspaceId?:string;sessionId?:string;assertCurrent:()=>void}
export interface MobileOperation {action:MobileControlAction;schema:z.ZodType;run:(values:Record<string,unknown>,context:MobileContext)=>unknown|Promise<unknown>}
/** 可测的权限分发层；不信任手机的scope/effect声明，重试缓存也重新执行授权。 */
export class MobileControlRegistry {
 private readonly operations=new Map<string,MobileOperation>()
 constructor(private readonly sessionWorkspace:(id:string)=>string|undefined){}
 add(operation:MobileOperation):void{if(this.operations.has(operation.action.id))throw new Error('重复控制操作');this.operations.set(operation.action.id,operation)}
 isRead(id:string):boolean{return id==='catalog'||this.operations.get(id)?.action.effect==='read'}
 authorize(device:MobileController,call:MobileControlCall):void{
  if(call.operation==='catalog'||['connection.discovery','connection.forward','connection.report'].includes(call.operation))return
  const operation=this.operations.get(call.operation);if(!operation)throw new Error('此操作不可用')
  if((operation.action.scope==='management'||operation.action.requiresManagement)&&!device.management)throw new Error('整机管理未授权')
  if((['session.kernel','session.probe'].includes(call.operation)&&call.values.autoApprove===true||call.operation==='session.configuration'&&typeof call.values.selection==='object'&&call.values.selection!==null&&!Array.isArray(call.values.selection)&&call.values.selection.autoApprove===true)&&!device.management)throw new Error('整机管理未授权')
  if(call.workspaceId&&!device.workspaceIds.includes(call.workspaceId))throw new Error('项目未授权')
  if(call.sessionId){const workspace=this.sessionWorkspace(call.sessionId);if(!workspace||!device.workspaceIds.includes(workspace)||call.workspaceId&&workspace!==call.workspaceId)throw new Error('会话未授权或不存在')}
  if(operation.action.scope==='project'&&!call.workspaceId)throw new Error('请选择项目')
  if(operation.action.scope==='session'&&!call.sessionId)throw new Error('请选择会话')
 }
 async execute(device:MobileController,call:MobileControlCall):Promise<unknown>{
  this.authorize(device,call)
  if(call.operation==='catalog')return {version:1,management:device.management,actions:[...this.operations.values()].filter(o=>device.management||o.action.scope!=='management'&&!o.action.requiresManagement).map(o=>({...o.action,fields:o.action.fields.filter(field=>device.management||field.key!=='autoApprove')}))}
  const operation=this.operations.get(call.operation)!;const parsed=operation.schema.parse(call.values) as Record<string,unknown>
  this.authorize(device,call);return operation.run(parsed,{device,workspaceId:call.workspaceId,sessionId:call.sessionId,assertCurrent:()=>this.authorize(device,call)})
 }
}
