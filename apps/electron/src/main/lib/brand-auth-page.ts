import { APP_NAME, BRAND_COLORS, brandMarkSvg } from '@proma/shared/config'

/** 授权回调只输出固定状态，不嵌入查询参数、授权码或账号信息。 */
export function brandAuthPage(success: boolean): string {
  const title = success ? '授权完成' : '授权未完成'
  const message = success ? '可以关闭此页面，返回 Tervell 继续。' : '请返回 Tervell 检查连接，然后重试。'
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · ${APP_NAME}</title><style>
  :root{color-scheme:light dark;--bg:${BRAND_COLORS.paper};--fg:${BRAND_COLORS.ink};--accent:${BRAND_COLORS.mineral}}
  @media(prefers-color-scheme:dark){:root{--bg:${BRAND_COLORS.ink};--fg:${BRAND_COLORS.paper};--accent:${BRAND_COLORS.mint}}}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,"PingFang SC",sans-serif}
  main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center}
  .mark{width:64px;height:64px;color:var(--accent);margin-bottom:24px}.name{font-weight:500;font-size:20px;letter-spacing:-.02em;margin:0 0 36px}
  h1{font-size:26px;font-weight:600;letter-spacing:-.03em;margin:0 0 12px}p{margin:0;max-width:360px}.message{opacity:.8}
  </style></head><body><main><div class="mark" aria-hidden="true">${brandMarkSvg('fold', 'currentColor')}</div><p class="name">${APP_NAME}</p><h1>${title}</h1><p class="message">${message}</p></main></body></html>`
}
