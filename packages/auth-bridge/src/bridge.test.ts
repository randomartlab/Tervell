import { describe, expect, test } from 'bun:test'
import { buildKernelEnv, CredentialMissingError, MemorySecretStore } from './index.ts'

const secrets = new MemorySecretStore({ 'gw.key': 'gw-secret', 'kimi.key': 'sk-kimi' })
const now = () => 1_700_000_000_000

describe('buildKernelEnv', () => {
  test('Given cli-native When 构造 Then 原样透传 cc-switch/shell 已设置的变量且不注入任何键', async () => {
    const baseEnv = { PATH: '/usr/bin', ANTHROPIC_BASE_URL: 'http://127.0.0.1:15721' }
    const { env, event } = await buildKernelEnv({ kernelId: 'claude' }, { baseEnv, secrets, now })
    expect(env).toEqual(baseEnv)
    expect(event.injectedKeys).toEqual([])
    expect(event.source).toBe('cli-native')
  })

  test('Given magpie 网关多协议 When 构造 Then 每个协议族注入 BASE_URL 与网关 key', async () => {
    const { env, event } = await buildKernelEnv(
      {
        kernelId: 'codex',
        source: 'gateway',
        gateway: {
          baseUrls: { anthropic: 'http://127.0.0.1:3425', openai: 'http://127.0.0.1:3425/v1' },
          apiKeySecretRef: 'gw.key',
        },
      },
      { baseEnv: {}, secrets, now },
    )
    expect(env.ANTHROPIC_BASE_URL).toBe('http://127.0.0.1:3425')
    expect(env.OPENAI_BASE_URL).toBe('http://127.0.0.1:3425/v1')
    expect(env.OPENAI_API_KEY).toBe('gw-secret')
    expect(env.GOOGLE_GEMINI_BASE_URL).toBeUndefined()
    // 审计事件只含键名，不含密钥值
    expect(JSON.stringify(event)).not.toContain('gw-secret')
  })

  test('Given proma 来源 When 构造 Then 按 wire 注入 key', async () => {
    const { env } = await buildKernelEnv(
      { kernelId: 'kimi', source: 'proma', secretRef: 'kimi.key', wire: 'openai' },
      { baseEnv: {}, secrets, now },
    )
    expect(env.OPENAI_API_KEY).toBe('sk-kimi')
  })

  test('Given 密钥引用不存在 When 构造 Then 抛出 CredentialMissingError 并携带审计事件', async () => {
    const run = buildKernelEnv(
      { kernelId: 'kimi', source: 'proma', secretRef: 'missing.key', wire: 'openai' },
      { baseEnv: {}, secrets, now },
    )
    await expect(run).rejects.toBeInstanceOf(CredentialMissingError)
    await run.catch((err: CredentialMissingError) => expect(err.event.type).toBe('credential.missing'))
  })

  test('Given 网络代理与 extraEnv When 构造 Then 大小写代理变量都设置且 extraEnv 最后覆盖', async () => {
    const { env } = await buildKernelEnv(
      {
        kernelId: 'gemini',
        networkProxy: { https: 'socks5://127.0.0.1:7890', noProxy: ['localhost', '127.0.0.1'] },
        extraEnv: { https_proxy: 'http://override:1' },
      },
      { baseEnv: {}, secrets, now },
    )
    expect(env.HTTPS_PROXY).toBe('socks5://127.0.0.1:7890')
    expect(env.https_proxy).toBe('http://override:1')
    expect(env.NO_PROXY).toBe('localhost,127.0.0.1')
  })

  test('Given 构造 env When 完成 Then 不修改 process.env', async () => {
    const before = process.env.ANTHROPIC_BASE_URL
    await buildKernelEnv(
      { kernelId: 'claude', source: 'gateway', gateway: { baseUrls: { anthropic: 'http://127.0.0.1:3425' } } },
      { baseEnv: {}, secrets, now },
    )
    expect(process.env.ANTHROPIC_BASE_URL).toBe(before)
  })
})
