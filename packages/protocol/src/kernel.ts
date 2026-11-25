import { z } from 'zod'

/**
 * 内核协议层（跨包共享的内核标识与启动描述）
 *
 * 内核 id 是开放字符串而不是枚举：内核由注册表与用户自定义清单提供（I-06），
 * protocol 不得硬编码任何内核名。
 */

/** 内核 id：小写字母/数字/连字符/点/下划线，1–128 位 */
export const KernelIdSchema = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/, '内核 id 只能包含小写字母、数字、点、下划线和连字符')
export type KernelId = z.infer<typeof KernelIdSchema>

/** 内核传输方式（对应 14 §6 KernelProjection.transport） */
export const KernelTransportSchema = z.enum(['acp', 'native-sdk', 'pty'])
export type KernelTransport = z.infer<typeof KernelTransportSchema>

/** 一次子进程启动所需的完整描述（已解析为绝对命令） */
export const KernelLaunchSpecSchema = z.object({
  kernelId: KernelIdSchema,
  transport: KernelTransportSchema,
  command: z.string().min(1),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()),
  cwd: z.string().min(1).optional(),
})
export type KernelLaunchSpec = z.infer<typeof KernelLaunchSpecSchema>

/** 本机探测结果 */
export const KernelDetectionSchema = z.object({
  kernelId: KernelIdSchema,
  /** 内核 CLI 本体路径（未找到为 null） */
  cliPath: z.string().nullable(),
  /** ACP 入口路径：原生 ACP 时等于 cliPath，适配器模式时是适配器路径 */
  acpPath: z.string().nullable(),
  /** 当前可用的传输方式 */
  transports: z.array(KernelTransportSchema),
  /** 缺失时给用户的安装提示 */
  installHint: z.string().optional(),
})
export type KernelDetection = z.infer<typeof KernelDetectionSchema>


/** 内核分级：T1 原生 ACP / T2 ACP 适配器 / T3 仅 PTY */
export const KernelTierSchema = z.enum(['acp-native', 'acp-adapter', 'pty'])
export type KernelTier = z.infer<typeof KernelTierSchema>

const CommandSpecSchema = z.object({
  /** 可执行文件名或绝对路径；省略时使用 cli */
  command: z.string().min(1).optional(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).default({}),
})

/** Streaming 能力子集 */
const StreamingCapabilitiesSchema = z.object({
  text: z.boolean().default(true),
  thinking: z.boolean().default(false),
  toolProgress: z.boolean().default(false),
})

/** 会话管理能力子集 */
const SessionCapabilitiesSchema = z.object({
  create: z.boolean().default(true),
  load: z.boolean().default(false),
  resume: z.boolean().default(false),
  list: z.boolean().default(false),
  fork: z.boolean().default(false),
  rewind: z.boolean().default(false),
  close: z.boolean().default(true),
})

/** 工具能力子集 */
const ToolCapabilitiesSchema = z.object({
  native: z.boolean().default(true),
  mcp: z.boolean().default(false),
  perSessionMcp: z.boolean().default(false),
})

/** 上下文与指令能力子集 */
const ContextCapabilitiesSchema = z.object({
  systemPrompt: z.enum(['native', 'meta', 'prepend', 'file']).default('prepend'),
  skills: z.enum(['native', 'prompt', 'none']).default('none'),
  instructionsFile: z.string().nullable(),
})

/** 使用量报告能力子集 */
const UsageCapabilitiesSchema = z.object({
  tokens: z.boolean().default(false),
  cost: z.boolean().default(false),
  contextWindow: z.boolean().default(false),
})

/** 内核自身支持的功能声明（RAE/09 §3） */
export const KernelCapabilitiesSchema = z.object({
  protocol: z.object({ version: z.string().default('1') }).prefault({}),
  streaming: StreamingCapabilitiesSchema.prefault({}),
  plan: z.enum(['native-mode', 'client-tool', 'prompt-only', 'none']).default('none'),
  session: SessionCapabilitiesSchema.prefault({}),
  steer: z.boolean().default(false),
  permission: z.enum(['callback', 'mode-only', 'none']).default('none'),
  tools: ToolCapabilitiesSchema.prefault({}),
  context: ContextCapabilitiesSchema,
  compaction: z.enum(['native', 'tool', 'none']).default('none'),
  models: z.enum(['kernel-owned', 'registry']).default('kernel-owned'),
  fs: z.enum(['kernel-owned', 'client-bridge']).default('kernel-owned'),
  terminal: z.enum(['kernel-owned', 'client-bridge', 'none']).default('kernel-owned'),
  usage: UsageCapabilitiesSchema.prefault({}),
  transport: z.enum(['stdio', 'http', 'in-process', 'pty']).default('stdio'),
})
export type KernelCapabilities = z.infer<typeof KernelCapabilitiesSchema>
export type KernelCapabilitiesInput = z.input<typeof KernelCapabilitiesSchema>

/** 插件对指定内核的可见性和访问投影（RAE/03 §K-07） */
export const KernelProjectionSchema = z.object({
  transport: KernelTransportSchema,
  mcp: z.enum(['native', 'none']),
  fsCallback: z.boolean(),
  terminalCallback: z.boolean(),
  permissionGate: z.enum(['full', 'mcp-only', 'none']),
  usageDetail: z.enum(['token+cost', 'token', 'none']),
  systemPromptInjection: z.enum(['native', 'prepend-text', 'none']),
})
export type KernelProjection = z.infer<typeof KernelProjectionSchema>

/**
 * 内核定义：内置清单与用户自定义清单共用同一结构（I-06）
 * 用户可在清单里新增任何 CLI，无需改代码。
 */
export const KernelDefinitionSchema = z
  .object({
    id: KernelIdSchema,
    name: z.string().min(1),
    tier: KernelTierSchema,
    /** 内核 CLI 本体（探测用） */
    cli: z.string().min(1),
    acp: CommandSpecSchema.optional(),
    pty: CommandSpecSchema.optional(),
    installHint: z.string().optional(),
    /** 启动参数是否已在真机/官方文档核实 */
    verified: z.boolean().default(false),
    /** 能力声明（可选；缺失表示尚未声明，不能据此推导投影） */
    capabilities: KernelCapabilitiesSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.tier !== 'pty' && !v.acp) {
      ctx.addIssue({ code: 'custom', path: ['acp'], message: `${v.tier} 内核必须声明 acp 启动方式` })
    }
    if (v.tier === 'acp-adapter' && !v.acp?.command) {
      ctx.addIssue({ code: 'custom', path: ['acp', 'command'], message: '适配器内核必须声明适配器命令' })
    }
    if (v.tier === 'pty' && !v.pty) {
      ctx.addIssue({ code: 'custom', path: ['pty'], message: 'pty 内核必须声明 pty 启动方式' })
    }
  })
export type KernelDefinition = z.infer<typeof KernelDefinitionSchema>
export type KernelDefinitionInput = z.input<typeof KernelDefinitionSchema>
