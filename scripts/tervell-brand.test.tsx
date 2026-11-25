import { expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { APP_NAME, APP_ID, ALPHA_APP_ID, BRAND_MARKS, BRAND_COLORS, brandMarkSvg, LEGACY_ICON_VARIANTS } from '../packages/shared/src/config/brand.ts'
import { releasePolicy } from '../packages/shared/src/config/release-channel.ts'
import { appIconPath } from '../apps/electron/src/main/lib/app-icon-path'
import { contrastRatio,hslToken } from '@proma/shared/utils'
import { BrandMark, BrandLockup, BrandSplash, BrandArtwork } from '../packages/ui/src/brand/index.tsx'
import { brandAuthPage } from '../apps/electron/src/main/lib/brand-auth-page'
import { buildAgentReplyCard, buildErrorCard, buildHelpCard } from '../apps/electron/src/main/lib/feishu-message'
import { renderSlackMessage } from '../apps/electron/src/main/lib/slack/block-kit'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const bytes = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url))

test('Given 已批准Tervell When 渲染共享品牌 Then 名称与矢量一致且装饰图形不重复播报', () => {
  expect(APP_NAME).toBe('Tervell')
  expect(APP_ID).toBe('art.randomai.tervell')
  expect(ALPHA_APP_ID).toBe(`${APP_ID}.alpha`)
  const decorative = renderToStaticMarkup(<BrandMark width={24} height={24}/>)
  expect(decorative).toContain('aria-hidden="true"')
  for(const path of BRAND_MARKS.fold.paths)expect(decorative).toContain(path)
  expect(renderToStaticMarkup(<BrandMark title="Tervell 标志"/>)).toContain('aria-label="Tervell 标志"')
  expect(renderToStaticMarkup(<BrandLockup/>)).toContain('Tervell')
  for(const file of ['apps/electron/resources/icon.svg','apps/web/public/tervell.svg'])for(const path of BRAND_MARKS.fold.paths)expect(read(file)).toContain(path)
  expect(Object.keys(BRAND_MARKS)).toEqual(['fold'])
  expect(renderToStaticMarkup(<BrandMark monochrome/>)).not.toContain('opacity="0.62"')
})

test('Given 发布图标 When 核对PNG ICO ICNS Then 使用实际有效尺寸与格式而非旧资源', async () => {
  const png = bytes('apps/electron/resources/icon.png')
  expect(await sharp(png).metadata()).toMatchObject({ format: 'png', width: 1024, height: 1024, hasAlpha: true })
  const ico = bytes('apps/electron/resources/icon.ico')
  expect(ico.readUInt16LE(0)).toBe(0)
  expect(ico.readUInt16LE(2)).toBe(1)
  const count = ico.readUInt16LE(4)
  expect(count).toBe(6)
  for (let index = 0; index < count; index++) {
    const position = 6 + index * 16, width = ico[position] || 256, size = ico.readUInt32LE(position + 8), offset = ico.readUInt32LE(position + 12)
    expect(offset + size).toBeLessThanOrEqual(ico.length)
    expect(await sharp(ico.subarray(offset, offset + size)).metadata()).toMatchObject({ width, height: width })
  }
  const icns = bytes('apps/electron/resources/icon.icns')
  expect(icns.subarray(0, 4).toString()).toBe('icns')
  expect(icns.readUInt32BE(4)).toBe(icns.length)
  for (const scale of [1, 2, 3]) expect(await sharp(bytes(`apps/electron/resources/proma-logos/iconTemplate${scale === 1 ? '' : '@' + scale + 'x'}.png`)).metadata()).toMatchObject({ width: 22 * scale, height: 22 * scale, hasAlpha: true })
})

test('Given 产品更名 When 核对外壳与帮助 Then 保留数据兼容同时阻止上游自动更新', () => {
  const config = read('apps/electron/electron-builder.yml'), alpha = read('apps/electron/electron-builder.alpha.yml')
  expect(config).toContain(`appId: ${APP_ID}`)
  expect(config).toContain('productName: Tervell')
  expect(config).toContain('publish: null')
  expect(alpha).toContain(`appId: ${ALPHA_APP_ID}`)
  expect(alpha).toContain('productName: Tervell Alpha')
  expect(alpha).toContain('Tervell-Alpha-${version}-mac-${arch}')
  expect(releasePolicy('alpha')).toMatchObject({ configDirectory: '.project-workbench-alpha', automaticUpdates: false })
  expect(releasePolicy('stable')).toMatchObject({ configDirectory: '.proma', automaticUpdates: false })
  expect(read('apps/electron/src/renderer/components/settings/AboutSettings.tsx')).toContain('github.com/proma-ai/Proma')
  expect(read('apps/electron/resources/startup-splash/index.html')).toContain('正在启动 Tervell')
  expect(read('apps/electron/src/main/menu.ts')).toContain('关于 Tervell')
})

test('Given 已确认品牌与手机客户端 When 读取入口 Then 只展示Tervell且不迁移配对协议', () => {
  const identity = JSON.parse(read('docs/brand/alpha-concept/identity.json')) as { status: string; name: string; candidates: Array<{ name: string }> }
  expect(identity.status).toBe('approved')
  expect(identity.name).toBe('Tervell')
  expect(identity.candidates.map(candidate => candidate.name)).toEqual(['Tervell'])
  expect(read('apps/mobile/app/src/main/res/values/strings.xml')).toContain('>Tervell<')
  expect(read('apps/mobile/app/src/main/AndroidManifest.xml')).toContain('@mipmap/ic_launcher')
  expect(read('apps/mobile/app/src/main/java/art/randomai/proma/MainActivity.java')).not.toContain('Proma 远程')
  expect(read('packages/core/src/remote/pairing.ts')).toContain('tervell://pair')
})


test('Given 折页共用精确品牌色 When 核对生成的CSS和安卓资源 Then 默认主题、标志与原生强调色一致',()=>{
 const css=read('packages/ui/src/brand/palette.css')
 for(const mode of ['light','dark'] as const){
  const palette=BRAND_COLORS[mode]
  for(const [key,value]of Object.entries(palette)){expect(css).toContain(`--tervell-brand-${mode}-${key}: ${value};`);expect(css).toContain(`--tervell-brand-${mode}-${key}-hsl: ${hslToken(value)};`)}
  expect(contrastRatio(palette.primary,palette.foreground)).toBeGreaterThanOrEqual(4.5)
  expect(contrastRatio(palette.primary,palette.soft)).toBeGreaterThanOrEqual(4.5)
  const native=read(`apps/mobile/app/src/main/res/${mode==='dark'?'values-night':'values'}/colors.xml`)
  expect(native).toContain(`<color name="brand_accent">${palette.primary}</color>`)
  expect(native).toContain(`<color name="brand_background">${BRAND_COLORS.mineral}</color>`)
 }
 for(const variant of ['fold'] as const){
  const generated=read(`packages/ui/src/brand/assets/tervell-${variant}.svg`)
  expect(generated).toBe(brandMarkSvg(variant,BRAND_COLORS.paper,BRAND_COLORS.mineral,BRAND_COLORS.mint))
  expect(read(`apps/electron/resources/brand/tervell-${variant}.svg`)).toBe(generated)
 }
 const desktop=read('apps/electron/src/renderer/styles/globals.css'),web=read('packages/ui/src/workbench/theme.css')
 for(const mode of ['light','dark']){expect(desktop).toContain(`--primary: var(--tervell-brand-${mode}-primary-hsl)`);expect(web).toContain(`--primary: var(--tervell-brand-${mode}-primary)`)}
 for(const variant of ['values','values-night'])expect(read(`apps/mobile/app/src/main/res/${variant}/styles.xml`)).toContain('name="android:colorAccent">@color/brand_accent')
 for(const path of BRAND_MARKS.fold.paths)expect(read('apps/mobile/app/src/main/res/drawable/ic_launcher_foreground.xml')).toContain(path)
})

test('Given 已归档门径与既有偏好 When 解析图标路径 Then 旧ID映射到折页且拒绝任意目录',()=>{
 expect(appIconPath('/resources','default')).toBe('/resources/icon.png');expect(appIconPath('/resources','fold')).toBe('/resources/icon.png')
 expect(appIconPath('/resources','threshold')).toBe('/resources/icon.png')
 for(const id of LEGACY_ICON_VARIANTS)expect(appIconPath('/resources',id)).toBe(`/resources/proma-logos/proma-${id}.png`)
 for(const id of ['../../secret','../../../icon','unknown','/tmp/x'])expect(appIconPath('/resources',id)).toBeNull()
 for(const file of ['AppearanceSettings.tsx','PromaLogoSettings.tsx']) {
  const view=read(`apps/electron/src/renderer/components/settings/${file}`)
  expect(view).not.toContain("id: 'threshold'")
  expect(view).not.toContain('tervell-threshold.svg')
 }
 for(const file of ['packages/ui/src/brand/assets/tervell-threshold.svg','apps/electron/resources/brand/tervell-threshold.png','apps/electron/resources/proma-logos/proma-threshold.png'])expect(existsSync(new URL(`../${file}`,import.meta.url))).toBe(false)
})

test('Given 冷启动与首次引导 When 渲染品牌表面 Then 共享折页与色板且支持减少动态效果',()=>{
 const splash=renderToStaticMarkup(<BrandSplash/>),artwork=renderToStaticMarkup(<BrandArtwork/>)
 for(const path of BRAND_MARKS.fold.paths){expect(splash).toContain(path);expect(artwork).toContain(path)}
 expect(splash).toContain('role="status"')
 expect(splash).toContain('正在启动 Tervell')
 const standalone=read('apps/electron/resources/startup-splash/index.html')
 expect(standalone).not.toContain('artwork.jpg')
 expect(standalone).toContain('tervell-reverse.svg')
 expect(read('apps/electron/resources/startup-splash/surfaces.css')).toBe(read('packages/ui/src/brand/surfaces.css'))
 expect(read('apps/electron/resources/startup-splash/palette.css')).toBe(read('packages/ui/src/brand/palette.css'))
 expect(read('packages/ui/src/brand/surfaces.css')).toContain('prefers-reduced-motion: reduce')
 const guide=read('apps/electron/src/renderer/components/onboarding/OnboardingView.tsx')
 expect(guide).toContain('早期界面示例')
 expect(guide).not.toContain('hopper-seaside-white-house')
})

test('Given 原生端与可下载资源 When 检查实际导出 Then 透明版有有效图形且原生窗不再显示旧品牌',async()=>{
 for(const variant of ['color','reverse','ink','white']) {
  const svg=read(`apps/electron/resources/brand/tervell-${variant}.svg`)
  expect(svg).not.toContain('<rect')
  const image=sharp(bytes(`apps/electron/resources/brand/tervell-${variant}.png`))
  expect(await image.metadata()).toMatchObject({width:1024,height:1024,hasAlpha:true})
  const alpha=(await image.stats()).channels[3]!
  expect(alpha.min).toBe(0);expect(alpha.max).toBe(255)
 }
 for(const file of ['values-v31/styles.xml','values-night-v31/styles.xml'])expect(read(`apps/mobile/app/src/main/res/${file}`)).toContain('@drawable/ic_launcher_foreground')
 for(const path of BRAND_MARKS.fold.paths)expect(read('apps/mobile/app/src/main/res/drawable/tervell_brand_mark.xml')).toContain(path)
 const native=read('apps/electron/native/agent-island/macos-agent-island-helper.swift')
 expect(native).not.toContain('Text("打开 Proma")')
 expect(native).not.toContain('"PROMA ·')
 expect(native).toContain('TervellBrandMark().frame')
 expect(read('apps/electron/scripts/build-agent-island-native.ts')).toContain('source, brandSource')
})

test('Given 授权完成或失败 When 返回固定页面 Then 状态清楚且品牌资源离线可用',()=>{
 for(const success of [true,false]) {
  const page=brandAuthPage(success)
  expect(page).toContain(success?'授权完成':'授权未完成')
  expect(page).toContain('<html lang="zh-CN">')
  expect(page).toContain('prefers-color-scheme:dark')
  expect(page).not.toContain('Proma')
  expect(page).not.toMatch(/<script|<img|(?:src|href)="https?:/)
  for(const path of BRAND_MARKS.fold.paths)expect(page).toContain(path)
 }
})

test('Given 远程消息卡片 When 渲染标题与长文提示 Then 使用Tervell且不改变错误语义',()=>{
 const reply=buildAgentReplyCard({text:'任务完成',toolSummaries:[],duration:100})
 const error=buildErrorCard('操作未完成')
 for(const card of [reply,error,buildHelpCard()]) {expect(JSON.stringify(card)).toContain('Tervell');expect(JSON.stringify(card)).not.toContain('Proma')}
 expect(JSON.stringify(error)).toContain('"template":"red"')
 const long=renderSlackMessage('a'.repeat(200000))
 expect(long.truncated).toBe(true)
 expect(JSON.stringify(long.blocks.at(-1))).toContain('Tervell')
 expect(JSON.stringify(long.blocks.at(-1))).not.toContain('Proma')
})
