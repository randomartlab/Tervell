import { z } from 'zod'
import { KernelIdSchema, KernelTransportSchema } from './kernel.ts'

export const CapabilitySchema = z.enum([
  'workspace:read', 'workspace:write', 'sessions:read', 'sessions:write', 'panels', 'screens',
  'tools', 'kernels', 'network', 'secrets', 'clipboard', 'notifications',
])
export type Capability = z.infer<typeof CapabilitySchema>

const PathSchema = z.string().min(1).refine((value) =>
  !value.startsWith('/') && !/[\\:\u0000-\u001f]/.test(value) &&
  !value.split('/').some((part) => part === '..' || part === ''), '必须是包内相对路径')
const IdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/)
const TextSchema = z.string().min(1)
const LocalizedSchema = z.union([TextSchema, z.record(TextSchema, TextSchema).refine((value) => Object.keys(value).length > 0, '本地化文本不能为空')])
const ContributionSchema = z.strictObject({ id: IdSchema, title: LocalizedSchema, icon: PathSchema.optional() })
const uniqueIds = <T extends { id: string }>(items: T[]) => new Set(items.map((item) => item.id)).size === items.length
const Contributions = <T extends z.ZodType<{ id: string }>>(schema: T) => z.array(schema).refine(uniqueIds, '贡献 ID 不得重复')
const UiContributionsSchema = z.strictObject({
  screens: Contributions(ContributionSchema).optional(),
  workspacePanels: Contributions(ContributionSchema.extend({ location: z.enum(['left', 'right', 'bottom']) })).optional(),
  sidebarItems: Contributions(ContributionSchema.extend({ section: TextSchema })).optional(),
  commands: Contributions(ContributionSchema).optional(), composerItems: Contributions(ContributionSchema).optional(),
  statusBar: Contributions(z.strictObject({ id: IdSchema, align: z.enum(['left', 'right']) })).optional(),
  settings: Contributions(ContributionSchema).optional(),
})
const HostContributionsSchema = z.strictObject({
  kernels: Contributions(z.strictObject({ id: KernelIdSchema, title: LocalizedSchema, protocol: KernelTransportSchema })).optional(),
  tools: Contributions(z.strictObject({ id: IdSchema })).optional(), hooks: z.array(TextSchema).optional(), rpc: z.array(IdSchema).optional(),
})

/** package.json.proma；包管理器自己的顶层字段由包管理器处理。 */
export const PluginManifestSchema = z.strictObject({
  api: z.literal(1), engines: z.strictObject({ proma: TextSchema }),
  display: z.strictObject({
    title: LocalizedSchema, description: LocalizedSchema.optional(), icon: PathSchema.optional(),
    categories: z.array(TextSchema).optional(), labels: z.array(TextSchema).optional(),
  }),
  capabilities: z.array(CapabilitySchema).refine((items) => new Set(items).size === items.length, '能力不得重复'),
  data: z.strictObject({
    themes: z.array(PathSchema).min(1).optional(), icons: z.array(PathSchema).min(1).optional(),
    fonts: z.array(PathSchema).min(1).optional(), grammars: z.array(PathSchema).min(1).optional(),
    languages: z.array(PathSchema).min(1).optional(), templates: z.array(PathSchema).min(1).optional(),
  }).refine((data) => Object.values(data).some((value) => value !== undefined), 'data 不能为空').optional(),
  ui: z.strictObject({
    entry: PathSchema, platform: z.array(z.enum(['web', 'desktop', 'mobile'])).min(1)
      .refine((items) => new Set(items).size === items.length, '平台不得重复'),
    contributes: UiContributionsSchema.optional(),
  }).optional(),
  host: z.strictObject({ entry: PathSchema, contributes: HostContributionsSchema.optional() }).optional(),
  compat: z.strictObject({
    paseo: z.strictObject({ entry: PathSchema, mode: z.literal('shim') }).optional(),
    dsh: z.strictObject({ bundle: PathSchema, mode: z.literal('adapter') }).optional(),
  }).optional(),
}).superRefine((manifest, ctx) => {
  if (!manifest.data && !manifest.ui && !manifest.host) ctx.addIssue({ code: 'custom', message: '至少声明一种运行面' })
  const requireCapability = (hasContribution: boolean, capability: Capability) => {
    if (hasContribution && !manifest.capabilities.includes(capability)) {
      ctx.addIssue({ code: 'custom', path: ['capabilities'], message: `贡献需要 ${capability} 能力` })
    }
  }
  const ui = manifest.ui?.contributes
  requireCapability(Boolean(ui?.screens?.length), 'screens')
  requireCapability(Boolean(ui?.workspacePanels?.length || ui?.sidebarItems?.length || ui?.composerItems?.length || ui?.statusBar?.length || ui?.settings?.length || ui?.commands?.length), 'panels')
  requireCapability(Boolean(manifest.host?.contributes?.tools?.length), 'tools')
  requireCapability(Boolean(manifest.host?.contributes?.kernels?.length), 'kernels')
})
export type PluginManifest = z.infer<typeof PluginManifestSchema>
