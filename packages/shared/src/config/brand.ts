/** Tervell 产品身份。折页为唯一主标；内部 proma 协议和已有目录保持兼容。 */
export const APP_NAME = 'Tervell'
export const APP_TAGLINE = 'Make room for meaningful work.'
export const APP_DESCRIPTION = '面向个人项目的 Agent 工作台'
export const APP_ID = 'art.randomai.tervell'
export const ALPHA_APP_ID = 'art.randomai.tervell.alpha'
export const ALPHA_PRODUCT_NAME = 'Tervell Alpha'

/** Logo、默认主题和移动资源共用此色板；生图仅是方向稿，交付资产使用精确色值。 */
export const BRAND_COLORS = {
  mineral: '#285c59',
  mint: '#a5cec4',
  paper: '#f5f3ec',
  ink: '#182523',
  light: { primary: '#285c59', foreground: '#ffffff', soft: '#e3eeeb', hover: '#214e4b' },
  dark: { primary: '#a5cec4', foreground: '#152d2b', soft: '#213c39', hover: '#b8dbd2' },
} as const
export type BrandMarkVariant = 'fold'
export const DEFAULT_BRAND_MARK: BrandMarkVariant = 'fold'
/** 无底色标志扩大有效面积，保证侧栏、菜单栏与 16px 图标的辨识度。 */
export const BRAND_MARK_TRANSFORM = 'translate(-3 -4)'
export const BRAND_ICON_TRANSFORM = 'translate(10 5) scale(.8)'
export const BRAND_MARKS = {
  fold: {
    name: '折页',
    paths: [
      'M19 43C19 32 25 26 36 23L79 12C83 11 86 13 85 17L83 27C81 35 77 38 69 40L31 50C24 52 19 56 19 60Z',
      'M19 60C19 55 24 52 31 50L44 47V83L27 68C22 64 19 63 19 60Z',
      'M49 47L66 57C72 60 75 65 75 73V92C75 96 73 97 69 95L59 89C55 86 52 83 49 80Z',
    ],
  },
} as const
/** 单色版兼容入口，保持共享组件和旧资源消费者无须重建。 */
export const BRAND_MARK_PATH = BRAND_MARKS.fold.paths.join(' ')
export const LEGACY_ICON_VARIANTS = ['black','white','blue','purple','gradient','transparent','coral','veri-peri','viva-magenta','mocha-mousse','emerald','8bit','cyberpunk','futuristic'] as const
export function brandMarkSvg(variant: BrandMarkVariant = DEFAULT_BRAND_MARK, foreground: string = BRAND_COLORS.mineral, background?: string, foldColor = foreground): string {
  const mark = BRAND_MARKS[variant]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${APP_NAME}"><title>${APP_NAME}</title>${background ? `<rect x="4" y="4" width="92" height="92" rx="24" fill="${background}"/>` : ''}<g transform="${background ? BRAND_ICON_TRANSFORM : BRAND_MARK_TRANSFORM}">${mark.paths.map((path,index)=>`<path d="${path}" fill="${index === 1 ? foldColor : foreground}"/>`).join('')}</g></svg>\n`
}
/** 只标识上游开源来源，不作为 Tervell 的发布或更新地址。 */
export const UPSTREAM_SOURCE_URL = 'https://github.com/proma-ai/Proma'
