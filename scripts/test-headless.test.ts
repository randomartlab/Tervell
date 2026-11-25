import { test, expect } from 'bun:test'
import { headlessTests } from './test-headless.ts'

test('Given 无桌面验证清单 When 发现测试 Then 不含Electron或apps目录', () => {
  const files = headlessTests()
  expect(files.length).toBeGreaterThan(30)
  expect(files.some((file) => file.startsWith('apps/'))).toBe(false)
  expect(files).not.toContain('packages/core/src/store/runtime.test.ts')
  expect(files).toContain('packages/kernel-host/src/kernels/pi/offline-smoke.test.ts')
  expect(files).toContain('tests/w3.integration.test.ts')
})
