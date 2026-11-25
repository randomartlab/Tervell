import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { SecretRefSchema } from '@proma/protocol'
import type { SecretStore } from './bridge.ts'

export interface SecretCipher { encrypt(plain: string): string; decrypt(encrypted: string): string }
export interface VaultPersistence { read(): Promise<Record<string, string>>; write(values: Record<string, string>): Promise<void> }
/** 宿主提供 Keychain/safeStorage 或外部主密钥；禁止加密不可用时静默明文降级。 */
export class EncryptedSecretStore implements SecretStore {
  private tail = Promise.resolve()
  constructor(private readonly persistence: VaultPersistence, private readonly cipher: SecretCipher) {}
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation)
    this.tail = result.then(() => {}, () => {})
    return result
  }
  get(ref: string): Promise<string | undefined> {
    SecretRefSchema.parse(ref)
    return this.serialize(async () => {
      const values = await this.persistence.read(); const encrypted = Object.hasOwn(values, ref) ? values[ref] : undefined
      if (encrypted === undefined) return undefined
      try {
        const raw: unknown = JSON.parse(this.cipher.decrypt(encrypted))
        if (!raw || typeof raw !== 'object' || !('ref' in raw) || raw.ref !== ref || !('value' in raw) || typeof raw.value !== 'string') throw new Error()
        return raw.value
      } catch { throw new Error('凭据解密失败，请重新授权') }
    })
  }
  set(ref: string, value: string): Promise<void> {
    SecretRefSchema.parse(ref)
    if (!value || Buffer.byteLength(value) > 65536) return Promise.reject(new Error('凭据为空或超过大小上限'))
    return this.serialize(async () => {
      const values = await this.persistence.read()
      const plain = JSON.stringify({ ref, value })
      const encrypted = this.cipher.encrypt(plain)
      if (!encrypted || encrypted === plain || encrypted === value) throw new Error('凭据加密未产生安全结果')
      await this.persistence.write({ ...values, [ref]: encrypted })
    })
  }
  delete(ref: string): Promise<void> {
    SecretRefSchema.parse(ref)
    return this.serialize(async () => { const values = { ...await this.persistence.read() }; delete values[ref]; await this.persistence.write(values) })
  }
}
/** 服务端使用：主密钥必须来自独立受保护来源，不与 vault 文件一同写出。 */
export function aesSecretCipher(rawKey: Uint8Array): SecretCipher {
  if (rawKey.length !== 32) throw new Error('Vault 主密钥必须为 32 字节')
  const key = Buffer.from(rawKey)
  return {
    encrypt: (plain) => {
      const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, nonce)
      cipher.setAAD(Buffer.from('proma-vault-v1'))
      return Buffer.concat([nonce, cipher.update(plain, 'utf8'), cipher.final(), cipher.getAuthTag()]).toString('base64')
    },
    decrypt: (encrypted) => {
      const bytes = Buffer.from(encrypted, 'base64')
      if (bytes.length < 28 || bytes.toString('base64') !== encrypted) throw new Error('凭据格式无效')
      const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12))
      cipher.setAAD(Buffer.from('proma-vault-v1')); cipher.setAuthTag(bytes.subarray(-16))
      return Buffer.concat([cipher.update(bytes.subarray(12, -16)), cipher.final()]).toString('utf8')
    },
  }
}
