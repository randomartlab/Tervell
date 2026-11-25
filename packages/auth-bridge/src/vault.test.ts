import { expect, test } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { EncryptedSecretStore, aesSecretCipher } from './vault.ts'
import { DiagnosticRedactor } from './diagnostics.ts'
import { buildKernelEnv } from './bridge.ts'

test('Given 加密vault When 并发写入、轮换删除和构建env Then 落盘无明文且导出无密钥', async () => {
  let values: Record<string, string> = {}
  const persistence = { read: async () => ({ ...values }), write: async (next: Record<string, string>) => { values = next } }
  const vault = new EncryptedSecretStore(persistence, aesSecretCipher(randomBytes(32)))
  const secret = 'private-key-fixture-123456789'
  await Promise.all([vault.set('provider.one', secret), vault.set('mcp.two', 'second-private-value')])
  expect(Object.keys(values)).toHaveLength(2); expect(JSON.stringify(values)).not.toContain(secret)
  expect(await vault.get('provider.one')).toBe(secret)
  const result = await buildKernelEnv({ kernelId: 'omp', source: 'proma', wire: 'openai', secretRef: 'provider.one' }, { secrets: vault, baseEnv: {} })
  expect(result.env.OPENAI_API_KEY).toBe(secret); expect(JSON.stringify(result.event)).not.toContain(secret)
  await vault.set('provider.one', 'rotated-private-value'); expect(await vault.get('provider.one')).toBe('rotated-private-value')
  await vault.delete('provider.one'); expect(await vault.get('provider.one')).toBeUndefined()
  const encoded = encodeURIComponent(secret), base64 = Buffer.from(secret).toString('base64')
  const output = new DiagnosticRedactor([secret]).export({ environment: { platform: 'darwin', env: { OPENAI_API_KEY: secret } }, configuration: { secretRef: 'mcp.two', url: `https://user:${secret}@host/?token=${encoded}` }, logs: [{ code: 'E_FAILED', message: `${secret} ${base64}`, [secret]: secret }], traces: [{ rawInput: { anything: secret }, note: 'unknown-secret-free-text' }] })
  for (const value of [secret, encoded, base64, 'unknown-secret-free-text']) expect(output).not.toContain(value)
  expect(output).toContain('E_FAILED'); expect(output).toContain('darwin')
})
test('Given 加密不可用、写入失败、密文交换与错误主密钥 When 读写 Then 不回退明文', async () => {
  let values: Record<string, string> = {}, fail = false
  const persistence = { read: async () => ({ ...values }), write: async (next: Record<string, string>) => { if (fail) throw new Error('disk'); values = next } }
  const vault = new EncryptedSecretStore(persistence, aesSecretCipher(randomBytes(32)))
  await vault.set('a', 'secret-original'); fail = true
  await expect(vault.set('a', 'secret-new')).rejects.toThrow('disk'); expect(await vault.get('a')).toBe('secret-original')
  fail = false; values.b = values.a!
  await expect(vault.get('b')).rejects.toThrow('解密')
  const wrong = new EncryptedSecretStore(persistence, aesSecretCipher(randomBytes(32)))
  await expect(wrong.get('a')).rejects.toThrow('解密')
  const unavailable = new EncryptedSecretStore(persistence, { encrypt: () => { throw new Error('locked') }, decrypt: () => { throw new Error('locked') } })
  await expect(unavailable.set('x', 'cannot-write')).rejects.toThrow('locked'); expect(values.x).toBeUndefined()
  await expect(vault.set('a', '')).rejects.toThrow('为空')
  expect(() => aesSecretCipher(randomBytes(10))).toThrow('32')
})

test('Given 密文被单字节篡改 When 读取 Then 认证失败且不返回私密正文', async () => {
  let values: Record<string, string> = {}
  const vault = new EncryptedSecretStore({ read: async () => values, write: async (value) => { values = value } }, aesSecretCipher(randomBytes(32)))
  await vault.set('a', 'private-value')
  const bytes = Buffer.from(values.a!, 'base64'); bytes[15] = bytes[15]! ^ 1; values.a = bytes.toString('base64')
  await expect(vault.get('a')).rejects.toThrow('解密')
  const diagnostic = new DiagnosticRedactor().export({ environment: {}, configuration: {}, logs: [{ privateSecretDisguisedAsFieldName: 'hidden' }], traces: [] })
  expect(diagnostic).not.toContain('privateSecretDisguisedAsFieldName'); expect(diagnostic).not.toContain('hidden')
})
