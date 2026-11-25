import { safeStorage } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { EncryptedSecretStore, DiagnosticRedactor } from '@proma/auth-bridge'
import { getConfigDir } from './config-paths'
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file'

function requireEncryption(): void {
  if (!safeStorage.isEncryptionAvailable() || (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) throw new Error('系统凭据存储不可用，请解锁 Keychain 或系统密钥环')
}
/** 无 renderer 明文读取接口；供主进程构建内核环境与后续 MCP 连接器使用。 */
export const credentialVault = new EncryptedSecretStore({
  read: async () => {
    const path = join(getConfigDir(), 'credential-vault.json')
    const raw = readJsonFileSafe<{ version: number; values: Record<string, string> }>(path)
    if (!raw && !existsSync(path)) return {}
    if (!raw || raw.version !== 1 || !raw.values || typeof raw.values !== 'object' || Array.isArray(raw.values) || Object.entries(raw.values).some(([key, value]) => !/^[a-zA-Z0-9._:-]{1,128}$/.test(key) || typeof value !== 'string')) throw new Error('凭据存储格式无效，请恢复备份')
    return raw.values
  },
  write: async (values) => { requireEncryption(); writeJsonFileAtomic(join(getConfigDir(), 'credential-vault.json'), { version: 1, values }) },
}, {
  encrypt: (value) => { requireEncryption(); return safeStorage.encryptString(value).toString('base64') },
  decrypt: (value) => { requireEncryption(); return safeStorage.decryptString(Buffer.from(value, 'base64')) },
})
export function exportSafeDiagnostics(input: Parameters<DiagnosticRedactor['export']>[0]): string {
  return new DiagnosticRedactor().export(input)
}
