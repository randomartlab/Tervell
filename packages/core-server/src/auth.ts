import {randomBytes,randomUUID,createHash,timingSafeEqual} from 'node:crypto'
import {z} from 'zod'
import {ClientKindSchema,EntityIdSchema} from '@proma/protocol'
import type {ClientKind} from '@proma/protocol'
import {fail} from './errors.ts'
const Device=z.strictObject({id:EntityIdSchema,name:z.string().min(1).max(100),kind:ClientKindSchema,workspaceIds:z.array(EntityIdSchema).max(100),control:z.boolean(),tokenHash:z.string().regex(/^[a-f0-9]{64}$/),expiresAt:z.number().int().positive(),revoked:z.boolean()})
export type DeviceRecord=z.infer<typeof Device>
export interface Principal {deviceId:string;kind:ClientKind;workspaceIds:readonly string[];control:boolean}
export interface DevicePersistence {read():unknown;write(records:DeviceRecord[]):void}
const digest=(token:string)=>createHash('sha256').update(token).digest('hex')
/** 只有宿主调用issue/revoke；网络RPC不暴露创建设备或提升授权的入口。 */
export class DeviceAuth {
 private records:DeviceRecord[]
 private readonly listeners=new Set<(id:string)=>void>()
 constructor(private readonly persistence:DevicePersistence,private readonly clock=Date.now){this.records=z.array(Device).max(1000).refine(records=>new Set(records.map(r=>r.id)).size===records.length&&new Set(records.map(r=>r.tokenHash)).size===records.length,'设备ID或tokenHash重复').parse(persistence.read()??[])}
 issue(input:{name:string;kind:ClientKind;workspaceIds:string[];control:boolean;ttlMs?:number}):{token:string;device:Omit<DeviceRecord,'tokenHash'>}{
  const ttl=input.ttlMs??30*86400000;if(!Number.isSafeInteger(ttl)||ttl<=0||ttl>90*86400000)fail(400,'INVALID_TTL','设备期限无效')
  const token=randomBytes(32).toString('base64url'),record=Device.parse({name:input.name,kind:input.kind,workspaceIds:input.workspaceIds,control:input.control,id:randomUUID(),expiresAt:this.clock()+ttl,revoked:false,tokenHash:digest(token)})
  const next=[...this.records.filter(r=>!r.revoked&&r.expiresAt>this.clock()),record];if(next.length>1000)fail(409,'DEVICE_LIMIT','设备数已达上限')
  this.persistence.write(structuredClone(next));this.records=next
  const {tokenHash:_hash,...device}=record;return {token,device}
 }
 authenticate(token:string|undefined):Principal{
  if(!token||token.length>200)fail(401,'UNAUTHORIZED','需要有效设备凭据')
  const hash=digest(token),record=this.records.find(r=>timingSafeEqual(Buffer.from(r.tokenHash),Buffer.from(hash)))
  if(!record||record.revoked||record.expiresAt<=this.clock())fail(401,'UNAUTHORIZED','设备凭据已失效')
  return {deviceId:record.id,kind:record.kind,workspaceIds:[...record.workspaceIds],control:record.control}
 }
 check(principal:Principal):Principal{
  const record=this.records.find(r=>r.id===principal.deviceId)
  if(!record||record.revoked||record.expiresAt<=this.clock())fail(401,'UNAUTHORIZED','设备授权已失效')
  return {deviceId:record.id,kind:record.kind,workspaceIds:[...record.workspaceIds],control:record.control}
 }
 revoke(id:string):void{EntityIdSchema.parse(id);const next=this.records.map(r=>r.id===id?{...r,revoked:true}:r);this.persistence.write(structuredClone(next));this.records=next;for(const listener of this.listeners){try{listener(id)}catch{/*撤销已持久化，监听者失败不能回滚安全状态*/}}}
 onRevoke(listener:(id:string)=>void):()=>void{this.listeners.add(listener);return ()=>{this.listeners.delete(listener)}}
 devices():Array<Omit<DeviceRecord,'tokenHash'>>{return this.records.map(({tokenHash:_hash,...record})=>structuredClone(record))}
}
