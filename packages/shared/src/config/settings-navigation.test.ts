import { expect, test } from 'bun:test'
import { SETTINGS_SECTIONS, searchSettingsSections } from './settings-navigation.ts'

test('Given 电脑端设置目录 When 搜索MCP、技能或偏好 Then 入口覆盖且无重复标识', () => {
  expect(new Set(SETTINGS_SECTIONS.map(entry => entry.id)).size).toBe(SETTINGS_SECTIONS.length)
  expect(searchSettingsSections('ＭＣＰ').map(entry => entry.id)).toContain('mcp')
  expect(searchSettingsSections('技能').map(entry => entry.id)).toEqual(['skills'])
  expect(searchSettingsSections('主题').map(entry => entry.id)).toContain('appearance')
  expect(searchSettingsSections('不存在的设置')).toEqual([])
  expect(SETTINGS_SECTIONS.some(entry=>entry.id==='channels')).toBe(false)
  expect(searchSettingsSections('模型配置').map(entry=>entry.id)).toEqual(['routing'])
  expect(searchSettingsSections('  ')).toHaveLength(17)
})
