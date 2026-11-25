import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdirSync,existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {getConfigDir} from '../config-paths';
import {writeJsonFileAtomic} from '../safe-file';
import {hostResources} from './compiler';
import type {DesktopPluginEntry} from '@proma/shared';
interface RouteInput {serverId:string;scopeId:string;sourceId:string;originSessionId:string;permissions:readonly string[];signal:AbortSignal;frame:(data:string|Uint8Array)=>void;ended:(code:string,message:string)=>void}
interface Connector {
 list:()=>Promise<unknown>;
 add:(input:unknown,actor:object)=>Promise<unknown>;
 update:(id:string,input:unknown,actor:object)=>Promise<unknown>;
 remove:(id:string,actor:object)=>Promise<void>;
 openRoute:(input:RouteInput)=>Promise<{send:(data:string|Uint8Array)=>void;close:()=>void}>;
 close:()=>Promise<void>;
}
const nativeRequire=createRequire(typeof __filename==='string'?__filename:import.meta.url);
let manager:Connector|undefined,permissions:string[]=[];
const rows=new Map<string,{pluginId:string;scopeId:string;abort:AbortController;send?:(data:string|Uint8Array)=>void;close?:()=>void}>();
const queues=new Map<string,Array<{message?:unknown;frame?:{routeId:string;payload:Uint8Array}}>>();
function connections():Connector{
 if(manager)return manager;
 const home=join(getConfigDir(),'paseo-connections');mkdirSync(home,{recursive:true});
 const identity=join(home,'identity.json');
 if(!existsSync(identity))writeJsonFileAtomic(identity,{serverId:'tervell-'+randomUUID()});
 const {ConnectedHosts,DAEMON_PERMISSIONS}=nativeRequire(join(hostResources(),'paseo-connections.cjs')) as {ConnectedHosts:new(home:string,self:object)=>Connector;DAEMON_PERMISSIONS:string[]};
 permissions=DAEMON_PERMISSIONS;
 manager=new ConnectedHosts(home,{serverId:JSON.parse(readFileSync(identity,'utf8')).serverId,label:'Tervell 本机'});
 return manager;
}
function push(id:string,event:{message?:unknown;frame?:{routeId:string;payload:Uint8Array}}):void{
 const queue=queues.get(id)??[];
 const bytes=(row:typeof event)=>row.frame?.payload.byteLength??Buffer.byteLength(JSON.stringify(row));
 if(queue.length>=512||queue.reduce((sum,row)=>sum+bytes(row),0)+bytes(event)>48*1024*1024){void closePluginRoutes(id);throw Error('主机路由消费者过慢');}
 queue.push(event);queues.set(id,queue);
}
export async function pluginConnectionOperation(entry:DesktopPluginEntry,method:string,input:Record<string,unknown>):Promise<unknown>{
 const connector=connections(),id=entry.manifest.id;
 if(method==='hosts.list')return connector.list();
 if(entry.access?.runtime!=='trusted')throw Error('跨主机连接需要标准受信任插件授权');
 const actor={sourceId:'plugin:'+id,manageSources:false};
 if(method==='hosts.add')return connector.add(input,actor);
 if(method==='hosts.update')return connector.update(String(input.id),input.patch,actor);
 if(method==='hosts.remove')return connector.remove(String(input.id),actor);
 if(method==='hosts.route.poll'){const result=queues.get(id)??[];queues.set(id,[]);return result;}
 if(method==='hosts.route.open'){
  const routeId=randomUUID(),scopeId=String(input.scopeId),abort=new AbortController();
  const owner={pluginId:id,scopeId,abort} as {pluginId:string;scopeId:string;abort:AbortController;send?:(data:string|Uint8Array)=>void;close?:()=>void};rows.set(routeId,owner);
  try{
   const route=await connector.openRoute({serverId:String(input.serverId),scopeId,sourceId:actor.sourceId,originSessionId:id,permissions,signal:abort.signal,
    frame:data=>push(id,typeof data==='string'?{message:{type:'hosts.route.frame',payload:{subscriptionId:routeId,data,binary:false}}}:{frame:{routeId,payload:data}}),
    ended:(code,message)=>{rows.delete(routeId);push(id,{message:{type:'hosts.route.closed',payload:{subscriptionId:routeId,code,message}}})}});
   owner.send=route.send;owner.close=route.close;return routeId;
  }catch(error){rows.delete(routeId);throw error;}
 }
 if(method==='hosts.route.send'){
  const owner=rows.get(String(input.routeId));if(owner?.pluginId!==id||!owner.send)throw Error('主机路由不存在');
  const data=typeof input.data==='string'?input.data:Uint8Array.from(Buffer.from(String(input.base64),'base64'));owner.send(data);return true;
 }
 if(method==='hosts.route.close'){
  for(const [routeId,row] of rows)if(row.pluginId===id&&(routeId===input.routeId||row.scopeId===input.scopeId)){row.abort.abort();row.close?.();rows.delete(routeId);}return true;
 }
 throw Error('未知主机路由方法');
}
export async function closePluginRoutes(pluginId:string):Promise<void>{
 for(const [id,row]of rows)if(row.pluginId===pluginId){row.abort.abort();row.close?.();rows.delete(id);}
 queues.delete(pluginId);
}
export async function closePluginConnections():Promise<void>{for(const id of new Set([...rows.values()].map(r=>r.pluginId)))await closePluginRoutes(id);await manager?.close();manager=undefined;}
