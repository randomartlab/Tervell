import type { SVGProps } from 'react'
import { APP_NAME, APP_TAGLINE, BRAND_MARKS, BRAND_MARK_TRANSFORM, DEFAULT_BRAND_MARK } from '@proma/shared/config'
import type { BrandMarkVariant } from '@proma/shared/config'

export function BrandMark({ title, variant = DEFAULT_BRAND_MARK, monochrome = false, ...props }: SVGProps<SVGSVGElement> & { title?: string; variant?: BrandMarkVariant; monochrome?: boolean }) {
  return <svg viewBox="0 0 100 100" fill="currentColor" focusable="false" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} {...props}>
    {title && <title>{title}</title>}
    <g transform={BRAND_MARK_TRANSFORM}>{BRAND_MARKS[variant].paths.map((path,index)=><path key={path} d={path} opacity={!monochrome && index === 1 ? .62 : 1}/>)}</g>
  </svg>
}

export function BrandLockup({ className = '', variant = DEFAULT_BRAND_MARK }: { className?: string; variant?: BrandMarkVariant }) {
  return <span className={`inline-flex items-center gap-2 ${className}`}><BrandMark variant={variant} width={28} height={28}/><span>{APP_NAME}</span></span>
}

/** 启动期只显示状态，不提供会抢走键盘焦点的装饰控件。 */
export function BrandSplash() {
  return <main className="tervell-splash" aria-busy="true">
    <div className="tervell-splash-content">
      <BrandMark className="tervell-splash-mark"/>
      <h1 className="tervell-splash-name">{APP_NAME}</h1>
      <p className="tervell-splash-slogan">{APP_TAGLINE}</p>
      <div className="tervell-splash-progress" aria-hidden="true"/>
      <p className="tervell-splash-status" role="status">正在启动 {APP_NAME}</p>
    </div>
    <p className="tervell-splash-footer">PERSONAL AGENT WORKSPACE</p>
  </main>
}

/** 首次引导的品牌区，不伪装成功能截图。 */
export function BrandArtwork() {
  return <section className="tervell-artwork" aria-label="Tervell 品牌">
    <div className="tervell-artwork-lockup"><BrandMark width={28} height={28}/><span>{APP_NAME}</span></div>
    <div className="tervell-artwork-center" aria-hidden="true"><BrandMark className="tervell-artwork-mark"/></div>
    <div><p className="tervell-artwork-message">为重要的工作<br/>留出空间。</p><p className="tervell-artwork-caption">PERSONAL AGENT WORKSPACE</p></div>
  </section>
}
