import { expect, test } from 'bun:test'
import { resolveLocalProfile } from './local-profile.ts'

test('Given 显式测试目录 When 解析本机配置空间 Then 配置和Chromium都隔离且不改变默认路径', () => {
  expect(resolveLocalProfile(undefined)).toBeUndefined()
  expect(resolveLocalProfile('/tmp/tervell qa')).toEqual({ root: '/tmp/tervell qa', configDirectory: '/tmp/tervell qa/config', chromiumDirectory: '/tmp/tervell qa/chromium' })
  expect(() => resolveLocalProfile('.')).toThrow('绝对路径')
  expect(() => resolveLocalProfile('/')).toThrow('根目录')
  expect(() => resolveLocalProfile('/tmp/a\0')).toThrow('有效绝对路径')
})
