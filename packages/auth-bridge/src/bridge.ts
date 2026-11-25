import { KernelAuthConfigSchema } from '@proma/protocol'
import type { AuthEvent, KernelAuthConfigInput, WireProtocol } from '@proma/protocol'

/**
 * 内核子进程环境变量构造（开放认证，可被反向代理接管）
 *
 * 只返回新的 env 对象，不修改 process.env：多个内核并行运行时各自的
 * 网关/代理配置互不干扰。
 *
 * 应用顺序（后者覆盖前者）：
 * 1. baseEnv 原样透传（cli-native 下 cc-switch 写入的配置、用户 shell 变量都保留）
 * 2. gateway / proma 注入的 *_BASE_URL 与 key
 * 3. networkProxy
 * 4. extraEnv（用户显式追加，最后应用）
 */

/** 密钥读取接口；实现由宿主提供（Keychain / 加密文件，见 SEC-03） */
export interface SecretStore {
  get(ref: string): Promise<string | undefined>
}

export interface BuildEnvOptions {
  baseEnv: Record<string, string | undefined>
  secrets: SecretStore
  now?: () => number
}

export interface BuildEnvResult {
  env: Record<string, string>
  event: AuthEvent
}

/** 各协议族对应的端点与 key 变量名（与 magpie / cc-switch 文档一致） */
const WIRE_ENV: Record<WireProtocol, { baseUrl: string; apiKey: string }> = {
  anthropic: { baseUrl: 'ANTHROPIC_BASE_URL', apiKey: 'ANTHROPIC_API_KEY' },
  openai: { baseUrl: 'OPENAI_BASE_URL', apiKey: 'OPENAI_API_KEY' },
  gemini: { baseUrl: 'GOOGLE_GEMINI_BASE_URL', apiKey: 'GEMINI_API_KEY' },
}

const WIRES: WireProtocol[] = ['anthropic', 'openai', 'gemini']

export class CredentialMissingError extends Error {
  constructor(
    readonly secretRef: string,
    readonly event: AuthEvent,
  ) {
    super(`未找到密钥引用 ${secretRef}`)
    this.name = 'CredentialMissingError'
  }
}

export async function buildKernelEnv(input: KernelAuthConfigInput, options: BuildEnvOptions): Promise<BuildEnvResult> {
  const config = KernelAuthConfigSchema.parse(input)
  const now = options.now ?? Date.now
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(options.baseEnv)) {
    if (value !== undefined) env[key] = value
  }
  const injected: string[] = []
  const set = (key: string, value: string) => {
    env[key] = value
    injected.push(key)
  }

  const requireSecret = async (ref: string): Promise<string> => {
    const value = await options.secrets.get(ref)
    if (value === undefined || value === '') {
      throw new CredentialMissingError(ref, {
        type: 'credential.missing',
        kernelId: config.kernelId,
        source: config.source,
        at: now(),
        ok: false,
        reason: `密钥引用 ${ref} 不存在`,
      })
    }
    return value
  }

  if (config.source === 'gateway' && config.gateway) {
    const gatewayKey = config.gateway.apiKeySecretRef ? await requireSecret(config.gateway.apiKeySecretRef) : undefined
    for (const wire of WIRES) {
      const url = config.gateway.baseUrls[wire]
      if (!url) continue
      set(WIRE_ENV[wire].baseUrl, url)
      if (gatewayKey) set(WIRE_ENV[wire].apiKey, gatewayKey)
    }
  }

  if (config.source === 'proma' && config.secretRef && config.wire) {
    set(WIRE_ENV[config.wire].apiKey, await requireSecret(config.secretRef))
  }

  // 大小写两种都设置：不同 CLI 读取的变量名不一致
  const proxy = config.networkProxy
  if (proxy?.http) {
    set('HTTP_PROXY', proxy.http)
    set('http_proxy', proxy.http)
  }
  if (proxy?.https) {
    set('HTTPS_PROXY', proxy.https)
    set('https_proxy', proxy.https)
  }
  if (proxy?.noProxy?.length) {
    const list = proxy.noProxy.join(',')
    set('NO_PROXY', list)
    set('no_proxy', list)
  }

  for (const [key, value] of Object.entries(config.extraEnv ?? {})) set(key, value)

  return {
    env,
    event: {
      type: 'env.built',
      kernelId: config.kernelId,
      source: config.source,
      at: now(),
      ok: true,
      injectedKeys: [...new Set(injected)],
    },
  }
}

/** 测试与开发用的内存实现 */
export class MemorySecretStore implements SecretStore {
  private readonly values: Map<string, string>

  constructor(initial: Record<string, string> = {}) {
    this.values = new Map(Object.entries(initial))
  }

  async get(ref: string): Promise<string | undefined> {
    return this.values.get(ref)
  }
}
