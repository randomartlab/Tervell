import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseAppearance } from '../apps/web/src/appearance.ts'
import { Navigation } from '../apps/web/src/navigation.tsx'
import { SessionSchema } from '../packages/protocol/src/index.ts'

const brandCss = readFileSync(new URL('../packages/ui/src/brand/palette.css', import.meta.url), 'utf8')
const brandValues=Object.fromEntries([...brandCss.matchAll(/--([\w-]+): #([a-f\d]{6});/gi)].map(match=>[match[1],match[2]!]))
const theme = readFileSync(new URL('../packages/ui/src/workbench/theme.css', import.meta.url), 'utf8')
const luminance = (hex: string): number => {
  const rgb = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
  return rgb[0]! * .2126 + rgb[1]! * .7152 + rgb[2]! * .0722
}
const contrast = (a: string, b: string): number => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }

test('Given 浅深主题语义token When 校验真实可用配对 Then 文字与必要控件达到产品对比度门槛', () => {
  for (const definition of theme.split(':root[data-theme="dark"]')) {
    const colors = Object.fromEntries([...definition.matchAll(/--([\w-]+): (?:#([a-f\d]{6})|var\(--([\w-]+)\));/gi)].map(match => [match[1],match[2]??brandValues[match[3]!]!]))
    for (const foreground of ['fg', 'fg-2', 'fg-muted']) for (const background of ['bg', 'surface', 'surface-2', 'surface-3']) expect(contrast(colors[foreground]!, colors[background]!)).toBeGreaterThanOrEqual(4.5)
    for (const [foreground, background] of [['primary', 'primary-soft'], ['primary-fg', 'primary'], ['warn', 'warn-soft'], ['danger', 'danger-soft']]) expect(contrast(colors[foreground!]!, colors[background!]!)).toBeGreaterThanOrEqual(4.5)
    for (const background of ['surface', 'surface-2']) expect(contrast(colors['border-2']!, colors[background]!)).toBeGreaterThanOrEqual(3)
  }
})

test('Given 外观偏好过期或被篡改 When 恢复 Then 有界缩放且只保存非凭据偏好', () => {
  expect(parseAppearance(null).bodySize).toBe(16)
  expect(parseAppearance({ uiScale: 900, bodySize: -2, codeSize: Number.NaN, density: 'invisible' })).toMatchObject({ uiScale: 150, bodySize: 16, codeSize: 13, density: 'comfortable' })
  expect(parseAppearance({ token: 'secret', server: 'private', panelWidth: 500, theme: 'dark' })).toMatchObject({ panelWidth: 420, theme: 'dark' })
  expect(JSON.stringify(parseAppearance({ token: 'secret' }))).not.toContain('secret')
})

test('Given 选中会话尚未运行 When 渲染导航 Then 选中与执行状态不混淆', () => {
  const session = SessionSchema.parse({ schemaVersion: 2, id: 's1', title: '资料研究', kernelId: 'scripted', workspaceId: 'p', createdAt: 1, updatedAt: 1 })
  const props = { sessions: [session], selected: session, view: 'sessions', status: 'online' as const, approvalCount: 0, filter: '', setFilter: () => {}, navigate: () => {}, openPalette: () => {}, openHelp: () => {}, openConnection: () => {}, connectionLabel: '已连接' }
  const idle = renderToStaticMarkup(<Navigation {...props}/>)
  expect(idle).toContain('aria-current="page"')
  expect(idle).not.toContain('session-running')
  expect(renderToStaticMarkup(<Navigation {...props} runningId="s1"/>)).toContain('aria-label="运行中"')
})
