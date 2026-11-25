import {paseoProviderDefaults} from './config';
import {randomUUID} from 'node:crypto';
import {cachedKernelCatalog} from '../desktop-kernel-catalog';
import {listAgentSessions} from '../agent-session-manager';
import {desktopKernelState,probeDesktopKernel} from '../desktop-extension-service';
import {listChannels} from '../channel-manager';
import {modelRoutingState,modelRoutingConfig} from '../model-routing-service';
import {routedModel} from '@proma/auth-bridge/agent-routing';
import {getAgentWorkspace,getProjectFilesPath} from '../agent-workspace-manager';
import type {DesktopPluginEntry,DesktopKernelCatalog} from '@proma/shared';
import {paseoControls} from './projection';

export async function pluginCatalog(entry:DesktopPluginEntry,provider:string,input:Record<string,unknown>={}):Promise<DesktopKernelCatalog>{
  const sessions=listAgentSessions().filter(s=>(s.kernelId??'pi')===provider&&entry.access?.workspaceIds.includes(s.workspaceId??''));
  const cached=sessions.map(s=>cachedKernelCatalog(s.id,provider)).find(Boolean);
  if(provider==='pi'){
    const routed=routedModel(modelRoutingConfig(),provider),models=modelRoutingState().models;
    if(routed)return {kernelId:provider,modes:[],currentModeId:null,models:models.map(m=>({id:m.id,name:m.name})),currentModelId:routed};
    return {kernelId:provider,modes:[],currentModeId:null,currentModelId:null,...cached,models:cached?.models.length?cached.models:listChannels().filter(c=>c.enabled).flatMap(c=>c.models.filter(m=>m.enabled).map(m=>({id:c.id+'/'+m.id,name:c.name+' / '+m.name})))};
  }
  if(cached&&!input.force)return cached;
  const workspaceId=entry.access?.workspaceIds.find(id=>!!getAgentWorkspace(id)),workspace=workspaceId?getAgentWorkspace(workspaceId):undefined;
  if(!workspace)return cached??{kernelId:provider,models:[],modes:[],currentModelId:null,currentModeId:null};
  const cwd=workspace.projectRootPath??getProjectFilesPath(workspace.slug);
  if(input.cwd&&input.cwd!==cwd&&!sessions.some(s=>s.id===input.agentId))throw Error('模型探测目录未获项目授权');
  return probeDesktopKernel(provider,cwd,{modelId:typeof input.model==='string'?input.model:undefined,configValues:input.providerOptions as Record<string,string|number|boolean>|undefined});
}
export async function paseoCatalogOperation(entry:DesktopPluginEntry,method:string,input:Record<string,unknown>):Promise<unknown>{
  const provider=String(input.provider??'');
  const base={provider,requestId:randomUUID(),fetchedAt:new Date().toISOString()};
  const catalog=await pluginCatalog(entry,provider,input);
  if(method==='providers.modes')return {...base,modes:(catalog.modes??[]).map(m=>({id:m.id,label:m.name}))};
  if(method==='providers.controls'||method==='providers.features'){
    const controls=paseoControls(catalog.controls),options=Object.fromEntries((catalog.controls??[]).filter(c=>c.currentValue!==undefined).map(c=>[c.id,c.currentValue]));
    return method.endsWith('features')?{...base,features:controls.map(c=>({...c,id:c.key,value:options[String(c.key)]??null,options:c.choices}))}:{...base,controls,options};
  }
  const routed=routedModel(modelRoutingConfig(),provider),routing=modelRoutingState();
  const configured=paseoProviderDefaults(provider).additionalModels??[];
  const models=[...new Map([...catalog.models,...configured.map(m=>({id:m.id,name:m.label}))].map(m=>[m.id,m])).values()].map(m=>{
    const native=routing.models.find(v=>v.id===m.id),channel=listChannels().find(c=>c.models.some(model=>m.id===c.id+'/'+model.id)),direct=channel?.models.find(model=>m.id===channel.id+'/'+model.id),efforts=native?.efforts??direct?.efforts;
    return {provider,id:m.id,label:m.name,isSelectable:true,isDefault:m.id===routed||m.id===catalog.currentModelId,...(efforts?.length?{thinkingOptions:efforts.map(id=>({id,label:id}))}:{})};
  });
  return {...base,models};
}
export const paseoProviderAvailability=()=>desktopKernelState().entries.filter(p=>p.enabled).map(p=>({provider:p.id,label:p.name,available:p.available,...(p.diagnostic?{error:p.diagnostic}:{})}));
