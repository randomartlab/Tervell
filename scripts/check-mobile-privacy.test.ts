import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

test('Given 手机连接产品入口 When 审查可见字段 Then 不暴露节点地址、登记密钥或原始配对JSON', () => {
  const settings = readFileSync(new URL('../apps/electron/src/renderer/components/settings/RemoteSettings.tsx', import.meta.url), 'utf8')
  expect(settings).not.toMatch(/randomai\.art|enrollmentToken|SettingsSecretInput|SettingsInput|value=\{pairing\}|value\.relay/)
  const status = readFileSync(new URL('../packages/shared/src/types/remote.ts', import.meta.url), 'utf8')
  expect(status).not.toMatch(/relay:|clientId:|sshHost:|targetPort:/)
  const mobile = readFileSync(new URL('../apps/mobile/app/src/main/java/art/randomai/proma/MainActivity.java', import.meta.url), 'utf8')
  expect(mobile).not.toMatch(/randomai\.art|VLESS|FlClash|WireGuard|e\.getMessage\(\)/)
  expect(mobile).toContain('配对')
})
