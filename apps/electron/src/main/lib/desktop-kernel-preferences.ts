import {z} from 'zod';
import {join} from 'node:path';
import {existsSync} from 'node:fs';
import type {DesktopKernelSelection,KernelSessionSelection} from '@proma/shared';
import {getConfigDir} from './config-paths';
import {readJsonFileSafe,writeJsonFileAtomic} from './safe-file';
const value=z.union([z.string().max(8192),z.number().finite(),z.boolean()]);
export const KernelDefaultsSchema=z.strictObject({modelId:z.string().min(1).max(512).optional(),modeId:z.string().min(1).max(512).optional(),configValues:z.record(z.string().min(1).max(512),value).refine(values=>Object.keys(values).length<=128).optional(),autoApprove:z.boolean().optional()});
const definitions=z.record(z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/),KernelDefaultsSchema),schema=z.strictObject({version:z.literal(1),global:definitions,projects:z.record(z.string(),definitions)});
export interface KernelDefaults extends KernelSessionSelection {autoApprove?:boolean}
export interface KernelPreferenceState {global:KernelDefaults;project:KernelDefaults;effective:KernelDefaults;kernelId:string;workspaceId?:string}
function file(){return join(getConfigDir(),'kernel-preferences.json');}
function read(){const raw=readJsonFileSafe<unknown>(file());if(raw===null&&existsSync(file()))throw Error('内核偏好文件损坏，原配置保留');return schema.parse(raw??{version:1,global:{},projects:{}});}
export function mergeKernelDefaults(global:KernelDefaults,project:KernelDefaults={}):KernelDefaults{const modelChanged=project.modelId!==undefined&&project.modelId!==global.modelId;return {...global,...project,configValues:{...(modelChanged?{}:global.configValues),...project.configValues}};}
export function kernelPreferences(kernelId:string,workspaceId?:string):KernelPreferenceState {
 const state=read(),global=state.global[kernelId]??{},project=workspaceId?state.projects[workspaceId]?.[kernelId]??{}:{};
 return {kernelId,workspaceId,global,project,effective:mergeKernelDefaults(global,project)};
}
export function saveKernelPreferences(kernelId:string,workspaceId:string|undefined,raw:unknown):KernelPreferenceState {
 const values=KernelDefaultsSchema.parse(raw),state=read();
 if(workspaceId){state.projects[workspaceId]??={};state.projects[workspaceId]![kernelId]=values;}else state.global[kernelId]=values;
 writeJsonFileAtomic(file(),state);return kernelPreferences(kernelId,workspaceId);
}
export function defaultSessionKernelSelection(kernelId:string,workspaceId?:string):DesktopKernelSelection {return {kernelId,...kernelPreferences(kernelId,workspaceId).effective};}
