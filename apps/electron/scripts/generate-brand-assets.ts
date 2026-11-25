#!/usr/bin/env bun
/** 将已确认的矢量 Logo 导出成品牌资源；不构建或启动桌面应用。 */
import sharp from 'sharp'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { BRAND_COLORS, BRAND_MARKS, brandMarkSvg } from '@proma/shared/config'
import type { BrandMarkVariant } from '@proma/shared/config'
import { hslToken } from '@proma/shared/utils'

const root = resolve(import.meta.dir, '../../..'), resources = join(root, 'apps/electron/resources')
const assetDir = join(root, 'packages/ui/src/brand/assets')
function vector(foreground: string, background?: string, variant: BrandMarkVariant = 'fold', foldColor = foreground): string {
  return brandMarkSvg(variant, foreground, background, foldColor)
}
async function exportAssets(): Promise<void> {
  for (const dir of [assetDir, join(resources, 'brand'), join(resources, 'proma-logos'), join(root, 'apps/web/public')]) await mkdir(dir, { recursive: true })
  const light = vector(BRAND_COLORS.paper, BRAND_COLORS.mineral, 'fold', BRAND_COLORS.mint), dark = vector(BRAND_COLORS.ink, BRAND_COLORS.mint, 'fold', BRAND_COLORS.mineral), mono = vector('currentColor')
  const assets:Record<string,string> = {
    'tervell-light.svg': light, 'tervell-dark.svg': dark,
    'tervell-mono.svg': mono, 'tervell-white.svg': vector('#ffffff'),
    'tervell-color.svg': vector(BRAND_COLORS.mineral, undefined, 'fold', BRAND_COLORS.mint),
    'tervell-ink.svg': vector(BRAND_COLORS.ink),
    'tervell-reverse.svg': vector(BRAND_COLORS.paper, undefined, 'fold', BRAND_COLORS.mint),
    'tervell-fold.svg': light, 'tervell-fold-mono.svg': mono,
    'tervell-fold-color.svg': vector(BRAND_COLORS.mineral, undefined, 'fold', BRAND_COLORS.mint),
  }
  for (const mode of ['light','dark'] as const) {
    const color = mode === 'light' ? BRAND_COLORS.mineral : BRAND_COLORS.mint
    const text = mode === 'light' ? BRAND_COLORS.ink : BRAND_COLORS.paper
    assets[`tervell-wordmark-${mode}.svg`] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 100" role="img" aria-label="Tervell"><title>Tervell</title><g fill="${color}" transform="translate(-3 -4)">${BRAND_MARKS.fold.paths.map((path,index)=>`<path d="${path}" opacity="${index === 1 ? '.62' : '1'}"/>`).join('')}</g><text x="108" y="70" fill="${text}" font-size="64" font-weight="500" letter-spacing="-3" font-family="Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif">Tervell</text></svg>\n`
  }
  // 已归档门径资源不得因旧工作区残留重新进入应用包。
  for (const dir of [assetDir, join(resources, 'brand')]) for (const suffix of ['.svg','-mono.svg','-color.svg','.png']) await rm(join(dir, `tervell-threshold${suffix}`), { force: true })
  await rm(join(resources, 'proma-logos/proma-threshold.png'), { force: true })
  for (const [name, source] of Object.entries(assets)) {
    await writeFile(join(assetDir, name), source)
    await writeFile(join(resources, 'brand', name), source)
  }
  // macOS Dock 留出约10%画布边距，与系统应用图标的视觉尺寸一致。
  const appIcon = light.replace(/(<title>[^<]+<\/title>)/, '$1<g transform="translate(6 6) scale(.88)">').replace('</svg>', '</g></svg>')
  await writeFile(join(resources, 'icon.svg'), appIcon)
  await writeFile(join(root, 'apps/web/public/tervell.svg'), light)
  await writeFile(join(root, 'apps/web/public/tervell-mask.svg'), mono)
  await sharp(Buffer.from(light)).resize(180).png().toFile(join(root, 'apps/web/public/apple-touch-icon.png'))
  await sharp(Buffer.from(light)).resize(32).png().toFile(join(root, 'apps/web/public/favicon-32.png'))
  await sharp(Buffer.from(light)).resize(1024).png().toFile(join(resources, 'brand/tervell-fold.png'))
  await sharp(Buffer.from(appIcon)).resize(512).png().toFile(join(resources, 'proma-logos/proma-fold.png'))
  await rm(join(root, 'apps/electron/src/renderer/assets/onboarding/proma-mark-white.svg'), { force: true })
  await rm(join(resources, 'startup-splash/proma-mark-white.svg'), { force: true })
  await writeFile(join(resources, 'startup-splash/tervell-reverse.svg'), assets['tervell-reverse.svg']!)
  const web=join(root,'apps/web/index.html')
  await writeFile(web,(await readFile(web,'utf8')).replace(/name="theme-color" content="#[a-f\d]{6}"/,`name="theme-color" content="${BRAND_COLORS.mineral}"`))
  const png = await sharp(Buffer.from(appIcon)).resize(1024, 1024).png().toBuffer()
  await writeFile(join(resources, 'icon.png'), png)
  await sharp(Buffer.from(light)).resize(1024).png().toFile(join(resources, 'brand/tervell-light.png'))
  await sharp(Buffer.from(dark)).resize(1024).png().toFile(join(resources, 'brand/tervell-dark.png'))
  for (const name of ['color','reverse','ink','white']) await sharp(Buffer.from(assets[`tervell-${name}.svg`]!)).resize(1024).png().toFile(join(resources, `brand/tervell-${name}.png`))
  // 既有变体ID继续有效；换为同一Tervell标志，避免旧偏好恢复原Proma图形。
  const variants: Record<string, [string, string | undefined]> = {
    black: ['#f7f7ed', '#202a24'], white: ['#345d49', '#f7f7ed'], blue: ['#f7f7ed', '#405d86'], purple: ['#f7f7ed', '#6b5aa8'],
    gradient: [BRAND_COLORS.paper, BRAND_COLORS.mineral], transparent: [BRAND_COLORS.mineral, undefined], coral: ['#202a24', '#eaac98'], 'veri-peri': ['#f7f7ed', '#6667ab'],
    'viva-magenta': ['#f7f7ed', '#9c3458'], 'mocha-mousse': ['#f7f7ed', '#805c48'], emerald: ['#f7f7ed', '#345d49'],
    '8bit': ['#b4d5b2', '#1c2820'], cyberpunk: ['#b4d5b2', '#15231d'], futuristic: ['#202a24', '#bec9c0'],
  }
  for (const [id, [foreground, background]] of Object.entries(variants)) {
    const variant = await sharp(Buffer.from(vector(foreground, background))).resize(512).png().toBuffer()
    await writeFile(join(resources, `proma-logos/proma-${id}.png`), variant)
    await writeFile(join(root, `apps/electron/src/renderer/assets/bots/proma-logos/proma-${id}.png`), variant)
  }
  // 未识别供应商用中性服务器图标；有实际品牌的供应商继续显示各自 Logo。
  const genericProvider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="24" fill="${BRAND_COLORS.paper}"/><g fill="none" stroke="${BRAND_COLORS.ink}" stroke-width="4" stroke-linejoin="round"><rect x="23" y="24" width="54" height="21" rx="6"/><rect x="23" y="55" width="54" height="21" rx="6"/><path d="M35 34.5h.1M35 65.5h.1M48 34.5h16M48 65.5h16" stroke-linecap="round"/></g></svg>`
  await sharp(Buffer.from(genericProvider)).resize(128).png().toFile(join(root,'apps/electron/src/renderer/assets/models/default.png'))
  // Template 图标只含黑色透明标志，由系统适配菜单栏浅深色。
  await writeFile(join(resources, 'proma-logos/icon.svg'), vector('#000000'))
  for (const scale of [1, 2, 3]) await sharp(Buffer.from(vector('#000000'))).resize(22 * scale).png().toFile(join(resources, `proma-logos/iconTemplate${scale === 1 ? '' : '@' + scale + 'x'}.png`))
  const paletteEntries={mineral:BRAND_COLORS.mineral,mint:BRAND_COLORS.mint,paper:BRAND_COLORS.paper,ink:BRAND_COLORS.ink,...Object.fromEntries((['light','dark'] as const).flatMap(mode=>Object.entries(BRAND_COLORS[mode]).map(([key,value])=>[`${mode}-${key}`,value])))}
  const paletteCss='/* 自动生成：packages/shared/src/config/brand.ts 为唯一品牌色来源。 */\n:root {\n'+Object.entries(paletteEntries).map(([key,value])=>`  --tervell-brand-${key}: ${value};\n  --tervell-brand-${key}-hsl: ${hslToken(value)};`).join('\n')+'\n}\n'
  await writeFile(join(assetDir,'../palette.css'),paletteCss)
  await writeFile(join(resources,'brand/palette.css'),paletteCss)
  await writeFile(join(resources,'startup-splash/palette.css'),paletteCss)
  await writeFile(join(resources,'startup-splash/surfaces.css'),await readFile(join(assetDir,'../surfaces.css'),'utf8'))
  const android=join(root,'apps/mobile/app/src/main/res')
  const colors=(night:boolean)=>`<resources>\n    <color name="brand_background">${BRAND_COLORS.mineral}</color>\n    <color name="brand_foreground">${BRAND_COLORS.paper}</color>\n    <color name="brand_fold">${BRAND_COLORS.mint}</color>\n    <color name="brand_accent">${BRAND_COLORS[night?'dark':'light'].primary}</color>\n    <color name="brand_chip">${BRAND_COLORS[night?'dark':'light'].soft}</color>\n</resources>\n`
  await writeFile(join(android,'values/colors.xml'),colors(false));await writeFile(join(android,'values-night/colors.xml'),colors(true))
  const androidVector=`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="100" android:viewportHeight="100">\n    <group android:scaleX="0.65" android:scaleY="0.65" android:translateX="17.5" android:translateY="15">\n${BRAND_MARKS.fold.paths.map((path,index)=>`        <path android:fillColor="@color/${index===1?'brand_fold':'brand_foreground'}" android:pathData="${path}" />`).join('\n')}\n    </group>\n</vector>\n`
  await writeFile(join(android,'drawable/ic_launcher_foreground.xml'),androidVector)
  await writeFile(join(android,'drawable/tervell_brand_mark.xml'), `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="32dp" android:height="32dp" android:viewportWidth="100" android:viewportHeight="100">\n    <group android:translateX="-3" android:translateY="-4">\n${BRAND_MARKS.fold.paths.map((path,index)=>`        <path android:fillColor="@color/brand_accent" android:fillAlpha="${index === 1 ? '0.62' : '1'}" android:pathData="${path}" />`).join('\n')}\n    </group>\n</vector>\n`)
  // 原生 Swift 状态窗与 TS/CSS 使用同一份路径和色板；不依赖在线图片。
  const swiftPath = (path: string): string => {
    const tokens = path.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? []
    let index = 0, command = '', x = 0, y = 0
    const n = (): number => { const value = Number(tokens[index++]); if (!Number.isFinite(value)) throw new Error('无效品牌路径'); return value }
    const point = (px: number, py: number): string => `CGPoint(x: ${px}, y: ${py})`
    const lines: string[] = []
    while (index < tokens.length) {
      if (/^[A-Za-z]$/.test(tokens[index]!)) command = tokens[index++]!
      if (command === 'Z') { lines.push('path.closeSubpath()'); command = ''; continue }
      if (command === 'M' || command === 'L') { x = n(); y = n(); lines.push(`path.${command === 'M' ? 'move' : 'addLine'}(to: ${point(x,y)})`); if(command === 'M') command = 'L' }
      else if(command === 'H') { x = n(); lines.push(`path.addLine(to: ${point(x,y)})`) }
      else if(command === 'V') { y = n(); lines.push(`path.addLine(to: ${point(x,y)})`) }
      else if(command === 'C') { const x1=n(),y1=n(),x2=n(),y2=n(); x=n();y=n();lines.push(`path.addCurve(to: ${point(x,y)}, control1: ${point(x1,y1)}, control2: ${point(x2,y2)})`) }
      else throw new Error(`不支持品牌路径命令 ${command}`)
    }
    return lines.map(line => `      ${line}`).join('\n')
  }
  const mintRgb = [1,3,5].map(index=>parseInt(BRAND_COLORS.mint.slice(index,index+2),16)/255)
  const swift=`// 自动生成：packages/shared/src/config/brand.ts。\nimport SwiftUI\n\nstruct TervellBrandMark: View {\n  static let accent = Color(red: ${mintRgb[0]}, green: ${mintRgb[1]}, blue: ${mintRgb[2]})\n  var body: some View {\n    GeometryReader { proxy in\n      ZStack {\n${BRAND_MARKS.fold.paths.map((path,index)=>`        FoldFace(face: ${index}).fill(Self.accent.opacity(${index === 1 ? '0.62' : '1'}))`).join('\n')}\n      }.frame(width: proxy.size.width, height: proxy.size.height)\n    }.accessibilityHidden(true)\n  }\n  private struct FoldFace: Shape {\n    let face: Int\n    func path(in rect: CGRect) -> Path {\n      var path = Path()\n      switch face {\n${BRAND_MARKS.fold.paths.map((path,index)=>`      case ${index}:\n${swiftPath(path)}`).join('\n')}\n      default: break\n      }\n      return path.applying(CGAffineTransform(translationX: -3, y: -4).concatenating(CGAffineTransform(scaleX: rect.width / 100, y: rect.height / 100)))\n    }\n  }\n}\n`
  await writeFile(join(root,'apps/electron/native/agent-island/TervellBrandMark.swift'),swift)
  const sizes = [16, 32, 48, 64, 128, 256]
  const frames = await Promise.all(sizes.map(size => sharp(png).resize(size).png().toBuffer()))
  const header = Buffer.alloc(6 + 16 * frames.length); header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4)
  let offset = header.length
  for (const [index, frame] of frames.entries()) {
    const size = sizes[index]!, pos = 6 + index * 16
    header[pos] = size === 256 ? 0 : size; header[pos + 1] = size === 256 ? 0 : size
    header.writeUInt16LE(1, pos + 4); header.writeUInt16LE(32, pos + 6); header.writeUInt32LE(frame.length, pos + 8); header.writeUInt32LE(offset, pos + 12); offset += frame.length
  }
  await writeFile(join(resources, 'icon.ico'), Buffer.concat([header, ...frames]))
  if (process.platform === 'darwin') {
    const temp = await mkdtemp(join(tmpdir(), 'tervell-icons-')), iconset = join(temp, 'Tervell.iconset')
    try {
      await mkdir(iconset)
      for (const size of [16, 32, 128, 256, 512]) for (const scale of [1, 2]) await sharp(png).resize(size * scale).png().toFile(join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`))
      execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', join(resources, 'icon.icns')])
    } finally { await rm(temp, { recursive: true, force: true }) }
  }
  const brandKit = join(root,'docs/brand/alpha-concept')
  await mkdir(brandKit, { recursive: true })
  for(const name of ['tervell-light.svg','tervell-dark.svg','tervell-mono.svg','tervell-color.svg','tervell-reverse.svg','tervell-white.svg','tervell-ink.svg','tervell-wordmark-light.svg','tervell-wordmark-dark.svg'])await writeFile(join(brandKit,name),assets[name]!)
  await writeFile(join(brandKit,'tervell-icon-1024.png'),png)
  await writeFile(join(brandKit,'tervell.ico'),await readFile(join(resources,'icon.ico')))
  if(process.platform === 'darwin')await writeFile(join(brandKit,'tervell.icns'),await readFile(join(resources,'icon.icns')))
  console.log('Tervell SVG、1024px PNG、ICO、ICNS、托盘与既有图标变体已生成。')
}
if (import.meta.main) await exportAssets()
