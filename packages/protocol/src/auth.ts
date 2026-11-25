import { z } from 'zod'
import { KernelIdSchema } from './kernel.ts'

/**
 * 内核凭据与网络配置（不做封闭认证）
 *
 * 三种凭据来源：
 * - cli-native：Proma 不注入任何凭据或端点，CLI 使用自己的登录与配置文件。
 *   cc-switch 这类改写 CLI 配置的工具在此模式下直接生效；用户 shell 里已有的
 *   ANTHROPIC_BASE_URL 等变量也原样透传。默认值。
 * - gateway：把 CLI 指向本地/自建网关（如 magpie 的 127.0.0.1:3425），
 *   按协议族注入 *_BASE_URL；网关 key 可选，从 SecretStore 引用读取。
 * - proma：由 Proma 从 SecretStore 注入 API key。
 *
 * 配置里只保存密钥的引用名（secretRef），从不保存密钥本身（I-08）。
 */

/** 上游线协议族：决定注入哪组环境变量 */
export const WireProtocolSchema = z.enum(['anthropic', 'openai', 'gemini'])
export type WireProtocol = z.infer<typeof WireProtocolSchema>

export const CredentialSourceSchema = z.enum(['cli-native', 'gateway', 'proma'])
export type CredentialSource = z.infer<typeof CredentialSourceSchema>

/** SecretStore 中的键名，不是密钥值 */
export const SecretRefSchema = z.string().regex(/^[a-zA-Z0-9._:-]{1,128}$/, 'secretRef 只能包含字母、数字和 . _ : -')

export const GatewayConfigSchema = z.object({
  baseUrls: z.object({
    anthropic: z.url().optional(),
    openai: z.url().optional(),
    gemini: z.url().optional(),
  }),
  /** 网关自身的访问 key（可选；magpie 默认接受占位 key） */
  apiKeySecretRef: SecretRefSchema.optional(),
})
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>

/** 网络代理（HTTP/HTTPS/SOCKS5 URL 均可），与凭据来源正交 */
export const NetworkProxySchema = z.object({
  http: z.url().optional(),
  https: z.url().optional(),
  noProxy: z.array(z.string().min(1)).optional(),
})
export type NetworkProxy = z.infer<typeof NetworkProxySchema>

export const KernelAuthConfigSchema = z
  .object({
    kernelId: KernelIdSchema,
    source: CredentialSourceSchema.default('cli-native'),
    gateway: GatewayConfigSchema.optional(),
    /** source=proma 时使用：密钥引用与注入的协议族 */
    secretRef: SecretRefSchema.optional(),
    wire: WireProtocolSchema.optional(),
    networkProxy: NetworkProxySchema.optional(),
    /** 用户显式追加的环境变量（最后应用，可覆盖前面的注入） */
    extraEnv: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.source === 'gateway') {
      const urls = v.gateway?.baseUrls ?? {}
      if (!urls.anthropic && !urls.openai && !urls.gemini) {
        ctx.addIssue({ code: 'custom', path: ['gateway', 'baseUrls'], message: 'gateway 模式至少需要一个 baseUrl' })
      }
    }
    if (v.source === 'proma') {
      if (!v.secretRef) ctx.addIssue({ code: 'custom', path: ['secretRef'], message: 'proma 模式需要 secretRef' })
      if (!v.wire) ctx.addIssue({ code: 'custom', path: ['wire'], message: 'proma 模式需要 wire（注入哪组环境变量）' })
    }
  })
export type KernelAuthConfig = z.infer<typeof KernelAuthConfigSchema>
export type KernelAuthConfigInput = z.input<typeof KernelAuthConfigSchema>

/** 凭据审计事件：只记录键名与结果，绝不含密钥值 */
export const AuthEventSchema = z.object({
  type: z.enum(['env.built', 'credential.missing']),
  kernelId: KernelIdSchema,
  source: CredentialSourceSchema,
  at: z.number().int().nonnegative(),
  ok: z.boolean(),
  injectedKeys: z.array(z.string()).optional(),
  reason: z.string().optional(),
})
export type AuthEvent = z.infer<typeof AuthEventSchema>
