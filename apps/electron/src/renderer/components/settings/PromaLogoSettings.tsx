/**
 * PromaLogoSettings - Tervell 品牌 Logo 下载（组件名保留兼容）
 *
 * 展示 Tervell Logo 的浅深与单色版本，用户可下载用作机器人头像。
 */

import * as React from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SettingsSection } from './primitives/SettingsSection'
import { SettingsCard } from './primitives/SettingsCard'
import { Button } from '@/components/ui/button'

import tervellLight from '@proma/ui/brand/assets/tervell-light.svg'
import tervellDark from '@proma/ui/brand/assets/tervell-dark.svg'
import tervellInk from '@proma/ui/brand/assets/tervell-ink.svg'
import tervellColor from '@proma/ui/brand/assets/tervell-color.svg'
import tervellReverse from '@proma/ui/brand/assets/tervell-reverse.svg'
import tervellWhite from '@proma/ui/brand/assets/tervell-white.svg'
import { BrandMark } from '@proma/ui/brand'

interface LogoVariant {
  id: string
  name: string
  description: string
  src: string
  resourcePath: string
  previewBg: string
  format: 'png' | 'svg'
}
const LOGO_VARIANTS: readonly LogoVariant[] = [
  { id: 'light', name: '岩青头像', description: '默认头像 · 1024px PNG', src: tervellLight, resourcePath: 'brand/tervell-light.png', previewBg: 'bg-background', format: 'png' },
  { id: 'dark', name: '雾薄荷头像', description: '浅底头像 · 1024px PNG', src: tervellDark, resourcePath: 'brand/tervell-dark.png', previewBg: 'bg-muted', format: 'png' },
  { id: 'color', name: '标准标志', description: '岩青与雾薄荷 · 透明底 SVG', src: tervellColor, resourcePath: 'brand/tervell-color.svg', previewBg: 'bg-[var(--tervell-brand-paper)]', format: 'svg' },
  { id: 'reverse', name: '反白标志', description: '用于岩青背景 · 透明底 SVG', src: tervellReverse, resourcePath: 'brand/tervell-reverse.svg', previewBg: 'bg-[var(--tervell-brand-mineral)]', format: 'svg' },
  { id: 'ink', name: '单色墨黑', description: '印刷与单色场景 · SVG', src: tervellInk, resourcePath: 'brand/tervell-ink.svg', previewBg: 'bg-[var(--tervell-brand-paper)]', format: 'svg' },
  { id: 'white', name: '纯白标志', description: '用于深色背景 · SVG', src: tervellWhite, resourcePath: 'brand/tervell-white.svg', previewBg: 'bg-[var(--tervell-brand-ink)]', format: 'svg' },
]

// ===== 组件 =====

function LogoCard({ logo }: { logo: LogoVariant }): React.ReactElement {
  const handleDownload = React.useCallback(async () => {
    try {
      const saved = await window.electronAPI.saveResourceFileAs(
        logo.resourcePath,
        `tervell-${logo.id}.${logo.format}`,
      )
      if (saved) {
        toast.success(`${logo.name} 已保存`)
      }
    } catch {
      toast.error('保存失败，请重试')
    }
  }, [logo])

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'w-20 h-20 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center',
          logo.previewBg,
        )}
      >
        <img src={logo.src} alt={logo.name} width={80} height={80} className="w-full h-full object-contain" draggable={false}/>

      </div>
      <div className="text-center">
        <div className="text-sm font-medium">{logo.name}</div>
        <div className="text-xs text-muted-foreground">{logo.description}</div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 h-7 text-xs"
        onClick={handleDownload}
      >
        <Download size={12} />
        下载
      </Button>
    </div>
  )
}

export function PromaLogoSettings(): React.ReactElement {
  return (
    <>
      <SettingsSection
        title="品牌 Logo"
        description="下载 Tervell Logo 用作机器人头像，让用户一眼认出你的 AI 助手"
      >
        <div className="mb-6 flex items-center gap-3"><BrandMark width={38} height={38} className="text-primary"/><div><p className="font-medium">Tervell · 折页</p><p className="text-xs text-muted-foreground">统一造型，适配浅深背景与小尺寸。</p></div></div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          {LOGO_VARIANTS.map((logo) => (
            <LogoCard key={logo.id} logo={logo} />
          ))}
        </div>
      </SettingsSection>

      <div className="my-6 border-t border-border/50" />

      <SettingsSection
        title="使用提示"
        description="在机器人平台设置头像时参考"
      >
        <SettingsCard divided={false}>
          <div className="px-4 py-3 space-y-1.5 text-sm text-muted-foreground">
            <p>建议使用 PNG 格式，飞书/钉钉头像推荐 200x200 以上。</p>
            <p>透明背景版本适合需要自定义背景色的平台。</p>
            <p>折页是 Tervell 的唯一主标。默认主题与标志共用岩青和雾薄荷，社区主题仍保留自己的配色。</p>
          </div>
        </SettingsCard>
      </SettingsSection>
    </>
  )
}
