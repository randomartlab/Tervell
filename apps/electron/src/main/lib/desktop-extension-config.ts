import {DesktopThemePresetSchema} from './desktop-theme-schema'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import type { DesktopPluginManifest } from '@proma/shared'
export const DesktopKernelConfigSchema = z.strictObject({ id: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/), name: z.string().trim().min(1).max(100), command: z.string().trim().min(1).max(4096).refine(v=>!/[\0\r\n]/.test(v)), args: z.array(z.string().max(8192).refine(v=>!v.includes('\0'))).max(128), enabled: z.boolean() })
export const DesktopPluginSchema = z.strictObject({
 id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),name:z.string().min(1).max(100),version:z.string().regex(/^\d+\.\d+\.\d+$/),description:z.string().min(1).max(2000),
 capabilities:z.array(z.enum(['kernels','theme','panel','runtime'])).max(4).refine(v=>new Set(v).size===v.length),
 runtime:z.strictObject({ecosystem:z.enum(['paseo','dsh']),bundleId:z.string().regex(/^[a-f0-9]{64}$/),serverEntry:z.string().max(512).optional(),clientEntry:z.string().max(512).optional(),discoverEntriesAfterBuild:z.boolean().optional()}).optional(),
 kernels:z.array(DesktopKernelConfigSchema).max(20).optional(),
 theme:z.record(z.string().regex(/^--(?:primary|primary-foreground|ring|accent|accent-foreground)$/),z.string().regex(/^#[0-9a-fA-F]{6}$/)).optional(),
 themes:z.array(DesktopThemePresetSchema).max(128).optional(),
 panel:z.string().max(256000).optional(),
}).superRefine((v,ctx)=>{
 for(const [key,capability] of [['kernels','kernels'],['theme','theme'],['themes','theme'],['panel','panel'],['runtime','runtime']] as const)if(v[key]&&!v.capabilities.includes(capability))ctx.addIssue({code:'custom',message:`缺少 ${capability} 权限`})
 if(!v.kernels?.length&&!v.theme&&!v.themes?.length&&!v.panel&&!v.runtime)ctx.addIssue({code:'custom',message:'插件没有可用贡献'})
 if(v.kernels?.some(k=>k.id==='pi')||new Set(v.kernels?.map(k=>k.id)).size!==(v.kernels?.length??0))ctx.addIssue({code:'custom',message:'插件内核标识重复或占用 Pi'})
})
export const DesktopKernelSelectionSchema = z.strictObject({
 configValues:z.record(z.string().min(1).max(512),z.union([z.string().max(8192),z.number().finite(),z.boolean()])).refine(v=>Object.keys(v).length<=128).optional(),
 autoApprove:z.boolean().optional(),
 kernelId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/),
 modelId: z.string().min(1).max(512).optional(),
 modeId: z.string().min(1).max(512).optional(),
})
export const DesktopExtensionConfigSchema = z.strictObject({
 version: z.literal(1),
 selectedThemeId:z.string().max(300).nullable().optional(),
 defaultKernelId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/),
 kernels: z.array(DesktopKernelConfigSchema).max(200).refine(items=>new Set(items.map(item=>item.id)).size===items.length && items.every(item=>item.id!=='pi'),'内核标识重复或占用 Pi'),
 plugins: z.array(z.strictObject({
  manifest: DesktopPluginSchema, enabled: z.boolean(), source: z.string().min(1),
  digest: z.string().regex(/^[a-f0-9]{64}$/), installedAt: z.number().int().nonnegative(),
  config:z.record(z.string(),z.unknown()).optional(),
  access:z.strictObject({workspaceIds:z.array(z.string().max(200)).max(200),network:z.boolean(),runtime:z.enum(['restricted','trusted']).optional(),allWorkspaces:z.boolean().optional(),cli:z.array(z.enum(['claude'])).max(1).optional()}).optional(),
 })).max(200).refine(items=>new Set(items.map(item=>item.manifest.id)).size===items.length,'插件标识重复'),
})
export function pluginDigest(manifest: DesktopPluginManifest): string {return createHash('sha256').update(JSON.stringify(manifest)).digest('hex')}
export const BUILTIN_PLUGIN_CATALOG: DesktopPluginManifest[] = [
 {id:'focus-notes',name:'项目检查清单',version:'1.0.0',description:'独立面板提供项目交付检查项。纯静态内容，无文件或网络访问。',capabilities:['panel'],panel:'<h1>项目交付检查</h1><p>先明确目标，再检查产物。</p><ul><li>核对范围与验收标准</li><li>检查文件、变更与测试结果</li><li>记录尚未完成与待授权事项</li></ul>'},
 {id:'moss-accent',name:'苔绿强调色',version:'1.0.0',description:'更改工作台强调色；停用后恢复当前主题。',capabilities:['theme'],theme:{'--primary':'#36725c','--primary-foreground':'#ffffff','--ring':'#6a9b83'}},
]
