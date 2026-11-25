import {KernelSetupGuide} from './KernelSetupGuide'
/**
 * Onboarding 视图组件
 *
 * 首次启动时显示的全屏引导界面。
 *
 * 流程：
 *  Step 1：欢迎（点击「进入引导界面」→ 白色闪屏淡出）
 *  Step 2：Agent vs Chat 科普（绿色指针指向界面截图中的切换按钮）
 *  Step 3：会话文件/项目文件区别
 *  Step 4：项目概念
 *  Step 5：子会话科普（图：collaboration 子会话）
 *  Step 6：自动任务科普（图：自动任务配置页）
 *  Step 7：记忆功能科普（图：Agent 技能的记忆页面）
 *  Step 8：侧边回答科普（图：历史选区问答）
 *  Step 9：FAQ 汇总页（按主题分组）
 */

import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, ChevronsRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CURRENT_ONBOARDING_VERSION } from '../../../types'
import guideVisual from '@/assets/onboarding/guide-visual.png'
import guideAgentExample from '@/assets/onboarding/guide-agent-example.png'
import guideChatExample from '@/assets/onboarding/guide-chat-example.png'
import guideAutomation from '@/assets/onboarding/guide-automation.png'
import guideMemory from '@/assets/onboarding/guide-memory.png'
import guideSideAnswer from '@/assets/onboarding/guide-side-answer.png'
import guideSubagent from '@/assets/onboarding/guide-subagent.png'
import { BrandArtwork, BrandMark } from '@proma/ui/brand'
import '@proma/ui/brand/surfaces.css'
import { AutomationGuideExamples } from './AutomationGuideExamples'
import { FileGuideExamples } from './FileGuideExamples'
import { MemoryGuideExamples } from './MemoryGuideExamples'
import { SubagentGuideExamples } from './SubagentGuideExamples'
import { FAQ_GROUPS } from './faq-content'

type OnboardingStep = 'welcome' | 'kernels' | 'guide' | 'files' | 'project' | 'automation' | 'memory' | 'sideanswer' | 'subagent' | 'faq'

interface OnboardingViewProps {
  onComplete: () => void
  /** 从设置重放时可跳过欢迎页。 */
  initialStep?: OnboardingStep
}

/** 图片内归一化锚点（0-1） */
interface GuideAnchor {
  x: number
  y: number
}

/** 镜片内截图偏移，单位为镜片直径；正值分别向右、向下移动截图 */
interface MagnifierImageOffset {
  x?: number
  y?: number
}

interface GuideFeatureStepProps {
  anchor: GuideAnchor
  title: string
  highlight?: React.ReactNode
  paragraphs: React.ReactNode[]
  nextLabel: string
  onNext: () => void
  onBack?: () => void
  /** 左侧展示的界面截图；默认 guideVisual */
  imageSrc?: string
  /** 指针模式：curve 曲线（默认）、straight 直线、none 不显示、magnifier 圆形放大镜 */
  arrowMode?: 'curve' | 'straight' | 'none' | 'magnifier'
  /** 放大镜容器水平偏移（以 320px 镜片为基准，随截图同步缩放） */
  magnifierOffsetX?: number
  /** 仅移动镜片内的截图，不移动放大镜容器 */
  magnifierImageOffset?: MagnifierImageOffset
  /** 左侧截图右缘需要隐藏的 CSS 像素数 */
  imageRightCrop?: number
  /** 放大镜缩放倍率（默认 1），>1 更大 */
  magnifierScale?: number
  /** 是否在本讲解区显示上一页/下一页导航 */
  showNavigation?: boolean
  /** 无导航时在正文下方显示的向下滚动提示；点击可滚到示例区 */
  onScrollHint?: () => void
}

interface MagnifierProps {
  imageSrc: string
  /** 锚点在图片内的归一化坐标（0-1） */
  anchorX: number
  anchorY: number
  /** 图片在容器内的实际渲染位置 */
  imgRect: { x: number; y: number; w: number; h: number }
  /** 放大镜容器水平偏移（以 320px 镜片为基准，随截图同步缩放） */
  offsetX?: number
  /** 仅移动镜片内的截图，不移动放大镜容器 */
  imageOffset?: MagnifierImageOffset
  /** 放大镜缩放倍率（默认 1），>1 更大 */
  scale?: number
}

/**
 * 圆形放大镜：覆盖在图片锚点位置，圈内放大显示被讲解的 UI 元素。
 *
 * 原理：在锚点位置放一个圆形裁剪容器（clip-path: circle），
 * 容器内再渲染同一张图片，但以锚点为中心放大 2 倍，
 * 视觉效果就像把对应区域的内容放大到圆圈里。
 */
function Magnifier({ imageSrc, anchorX, anchorY, imgRect, offsetX = 0, imageOffset = {}, scale = 1 }: MagnifierProps) {
  const ZOOM = 2.2 // 放大倍数
  const SOURCE_CROP_WIDTH = 0.1765 // 每次展示原截图横向约 17.65% 的区域
  const REFERENCE_DIAMETER = 320
  const DIAMETER = imgRect.w * ZOOM * SOURCE_CROP_WIDTH * scale
  const RADIUS = DIAMETER / 2

  const cx = imgRect.x + anchorX * imgRect.w
  const cy = imgRect.y + anchorY * imgRect.h
  const scaledOffsetX = offsetX * (DIAMETER / REFERENCE_DIAMETER)

  const zoomedWidth = imgRect.w * ZOOM
  const zoomedHeight = imgRect.h * ZOOM

  // 默认将取景限制在放大图内，避免透明区域透出底下的原尺寸截图。
  // 有明确焦点偏移时允许在起始边缘留出镜片底色，以便边缘元素仍可落在镜片中心。
  const clampToLens = (position: number, contentSize: number) =>
    Math.min(0, Math.max(DIAMETER - contentSize, position))
  const applyImageOffset = (position: number, contentSize: number, offset: number) =>
    Math.max(DIAMETER - contentSize, offset > 0 ? position + offset : Math.min(0, position + offset))
  const baseLeft = clampToLens(RADIUS - anchorX * zoomedWidth, zoomedWidth)
  const baseTop = clampToLens(RADIUS - anchorY * zoomedHeight, zoomedHeight)
  const innerLeft = applyImageOffset(baseLeft, zoomedWidth, (imageOffset.x ?? 0) * DIAMETER)
  const innerTop = applyImageOffset(baseTop, zoomedHeight, (imageOffset.y ?? 0) * DIAMETER)

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: cx - RADIUS + scaledOffsetX,
        top: cy - RADIUS,
        width: DIAMETER,
        height: DIAMETER,
        backgroundColor: 'hsl(var(--accent))',
        clipPath: `circle(${RADIUS}px at ${RADIUS}px ${RADIUS}px)`,
        overflow: 'hidden',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
      }}
    >
      {/* 圈内放大后的图片：边缘锚点时仍完整覆盖整个圆盘 */}
      <img
        src={imageSrc}
        alt=""
        draggable={false}
        className="max-w-none"
        style={{
          position: 'absolute',
          left: innerLeft,
          top: innerTop,
          width: zoomedWidth,
          height: zoomedHeight,
          objectFit: 'fill',
        }}
      />
      {/* 圆圈边框 */}
      <div
        className="absolute inset-0 rounded-full border-[3px] border-primary"
        style={{ clipPath: `circle(${RADIUS}px at ${RADIUS}px ${RADIUS}px)` }}
      />
      {/* 放大镜把手装饰（可选） */}
      <div
        className="absolute bottom-[-6px] right-[-6px] h-8 w-8 rounded-full border-[4px] border-primary"
        style={{
          clipPath: 'none',
          background: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          transform: 'rotate(-45deg)',
        }}
      />
    </div>
  )
}

/** 章节标记：标题上方，左侧为线条与圆点，右侧为章节文字。 */
function ChapterMarker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex w-full max-w-lg self-start items-center justify-end gap-4 text-sm font-medium tracking-[0.08em] text-primary">
      <span className="relative h-px flex-1 bg-primary/25">
        <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
      </span>
      <span className="shrink-0 whitespace-nowrap">{children}</span>
    </div>
  )
}

function GuideNavigation({ nextLabel, onNext, onBack }: { nextLabel: string; onNext: () => void; onBack?: () => void }) {
  return (
    <div className="flex w-full items-center justify-between border-t border-primary/20 pt-6">
      {onBack ? (
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          上一个
        </Button>
      ) : (
        <span />
      )}
      <button
        onClick={onNext}
        className="flex h-14 items-center justify-center gap-1.5 rounded-md bg-primary px-9 text-base font-medium text-primary-foreground shadow-[0_8px_18px_hsl(var(--foreground)/0.1)] transition-all hover:bg-primary/90 active:translate-y-0.5 active:shadow-none"
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * 引导科普页：左侧显示界面截图，从锚点画绿色指针指向右侧讲解区。
 */
function GuideFeatureStep({ anchor, title, highlight, paragraphs, nextLabel, onNext, onBack, imageSrc = guideVisual, arrowMode = 'none', magnifierOffsetX = 0, magnifierImageOffset = {}, imageRightCrop = 0, magnifierScale = 1, showNavigation = true, onScrollHint }: GuideFeatureStepProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgRect, setImgRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const update = () => {
      const ctr = containerRef.current
      if (!ctr) return
      const ir = img.getBoundingClientRect()
      const cr = ctr.getBoundingClientRect()
      setImgRect({
        x: ir.left - cr.left,
        y: ir.top - cr.top,
        w: ir.width,
        h: ir.height,
      })
    }
    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(img)
    const t = setTimeout(update, 60)
    window.addEventListener('resize', update)
    return () => {
      resizeObserver.disconnect()
      clearTimeout(t)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="flex h-full w-full items-stretch">
      {/* 左侧：界面截图 + 指针 */}
      <div ref={containerRef} className="relative flex h-full w-[calc(58%+80px)] shrink-0 items-center justify-center overflow-visible p-6">
        {/* 左侧截图的四角定位标记，仅作为视觉边界，不参与图片布局。 */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-[10%] bottom-[10%] z-0">
          <span className="absolute left-0 top-0 h-7 w-7 border-l-2 border-t-2 border-primary/70" />
          <span className="absolute right-0 top-0 h-7 w-7 border-r-2 border-t-2 border-primary/70" />
          <span className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-primary/70" />
          <span className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-primary/70" />
        </div>

        <img
          ref={imgRef}
          src={imageSrc}
          alt="早期版本功能示例，布局与当前版本可能不同"
          className="max-h-full max-w-full rounded-lg border border-border bg-muted object-contain shadow-[0_14px_30px_hsl(var(--foreground)/0.08)]"
          style={imageRightCrop > 0 ? { clipPath: `inset(0 ${imageRightCrop}px 0 0)` } : undefined}
        />

        {/* 圆形放大镜：覆盖在图片对应区域，圈内放大显示被讲解的 UI */}
        {imgRect && arrowMode === 'magnifier' && (
          <Magnifier
            imageSrc={imageSrc}
            anchorX={anchor.x}
            anchorY={anchor.y}
            imgRect={imgRect}
            offsetX={magnifierOffsetX}
            imageOffset={magnifierImageOffset}
            scale={magnifierScale}
          />
        )}

        {/* 绿色指针：从图片锚点指向右侧讲解区（curve 曲线 / straight 直线 / none 无） */}
        {imgRect && arrowMode !== 'none' && arrowMode !== 'magnifier' && (
          <svg
            className="pointer-events-none absolute inset-y-0 left-0 z-10 h-full w-[calc(100%+70px)]"
            viewBox={`0 0 ${imgRect.x + imgRect.w + 94} ${imgRect.y + imgRect.h + 24}`}
            fill="none"
          >
            {/* 锚点圆点 */}
            <circle
              cx={imgRect.x + anchor.x * imgRect.w}
              cy={imgRect.y + anchor.y * imgRect.h}
              r="14"
              fill="hsl(var(--primary))"
              opacity="0.18"
            />
            <circle
              cx={imgRect.x + anchor.x * imgRect.w}
              cy={imgRect.y + anchor.y * imgRect.h}
              r="6"
              fill="hsl(var(--primary))"
            />
            {arrowMode === 'curve' ? (
              <>
                {/* 曲线：锚点 → 图片右缘向右延长 */}
                <path
                  d={`M ${imgRect.x + anchor.x * imgRect.w + 14} ${imgRect.y + anchor.y * imgRect.h} C ${imgRect.x + imgRect.w * 0.45} ${imgRect.y + anchor.y * imgRect.h}, ${imgRect.x + imgRect.w * 0.55} ${imgRect.y + imgRect.h * 0.18}, ${imgRect.x + imgRect.w + 30} ${imgRect.y + imgRect.h * 0.16}`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* 箭头头部（向右延长后保持在容器内） */}
                <polygon
                  points={`${imgRect.x + imgRect.w + 30},${imgRect.y + imgRect.h * 0.16 - 9} ${imgRect.x + imgRect.w + 42},${imgRect.y + imgRect.h * 0.16} ${imgRect.x + imgRect.w + 30},${imgRect.y + imgRect.h * 0.16 + 9}`}
                  fill="hsl(var(--primary))"
                />
              </>
            ) : (
              <>
                {/* 直线：从锚点水平向右延长 */}
                <line
                  x1={imgRect.x + anchor.x * imgRect.w + 14}
                  y1={imgRect.y + anchor.y * imgRect.h}
                  x2={imgRect.x + imgRect.w + 30}
                  y2={imgRect.y + anchor.y * imgRect.h}
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* 直线箭头头部 */}
                <polygon
                  points={`${imgRect.x + imgRect.w + 30},${imgRect.y + anchor.y * imgRect.h - 9} ${imgRect.x + imgRect.w + 42},${imgRect.y + anchor.y * imgRect.h} ${imgRect.x + imgRect.w + 30},${imgRect.y + anchor.y * imgRect.h + 9}`}
                  fill="hsl(var(--primary))"
                />
              </>
            )}
          </svg>
        )}
      </div>

      {/* 右侧：科普讲解，保持章节标记、标题、正文和操作区的阅读节奏。 */}
      <div
        className="relative flex flex-1 flex-col items-center justify-start px-8 pt-20 md:px-12 md:pt-24"
        style={{ transform: 'translateY(clamp(0px, calc(133.333vh - 1000px), 200px))' }}
      >
        {highlight && <ChapterMarker>{highlight}</ChapterMarker>}
        <h2 className="w-full max-w-lg text-left text-3xl font-light tracking-tight text-foreground md:text-4xl">{title}</h2>
        <div className="mt-9 w-full max-w-lg space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base leading-[1.65] text-muted-foreground md:text-lg">
              {p}
            </p>
          ))}
        </div>

        {showNavigation && (
          <div className="mt-12 w-full max-w-lg">
            <GuideNavigation nextLabel={nextLabel} onNext={onNext} onBack={onBack} />
          </div>
        )}

        {/* 无导航的首屏：用一行文字承接阅读动线，说明下方还有内容。 */}
        {!showNavigation && onScrollHint && (
          <div className="mt-12 w-full max-w-lg border-t border-primary/20 pt-5">
            <button
              type="button"
              onClick={onScrollHint}
              className="text-left text-sm leading-6 text-muted-foreground transition-colors hover:text-primary"
            >
              继续向下滚动，查看这一步的历史功能示例
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

type GuideExamplesIntroProps = Omit<GuideFeatureStepProps, 'nextLabel' | 'onNext' | 'onBack' | 'showNavigation' | 'onScrollHint'>

function GuideExamplesPage({ intro, nextLabel, onNext, onBack, children, showScrollHint = false }: {
  intro: GuideExamplesIntroProps
  nextLabel: string
  onNext: () => void
  onBack: () => void
  children: React.ReactNode
  /** 首个讲解页在正文下方提示继续向下滚动，避免底部进度地图被误解为横向翻页。 */
  showScrollHint?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  /** 点击提示推进约一屏，避免与首屏高度、示例区负 margin 耦合。 */
  const handleScrollHint = () => {
    const container = scrollRef.current
    if (!container) return
    container.scrollBy({ top: container.clientHeight * 0.82, behavior: 'smooth' })
  }

  return (
    <div className="relative h-full w-full">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto">
        <div className="h-[1100px] lg:h-[calc(100vh-4rem)] lg:min-h-[660px]">
          <GuideFeatureStep
            {...intro}
            nextLabel={nextLabel}
            onNext={onNext}
            onBack={onBack}
            showNavigation={false}
            onScrollHint={showScrollHint ? handleScrollHint : undefined}
          />
        </div>

        <div className="mx-auto w-full max-w-[calc(58vw+504px)] px-6 pb-28 pt-6 md:px-10">
          {children}
          <GuideNavigation nextLabel={nextLabel} onNext={onNext} onBack={onBack} />
        </div>
      </div>
    </div>
  )
}

/** Agent / Chat 首章：保留模式说明，并在同页继续展示真实工作流。 */
function AgentChatGuidePage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <GuideExamplesPage
      showScrollHint
      intro={{
        anchor: { x: 0.073, y: 0.049 },
        arrowMode: 'magnifier',
        magnifierOffsetX: 70,
        magnifierImageOffset: { x: 0.09, y: 0.33 },
        highlight: '入门篇 · 第 1 步',
        title: 'Agent 和 Chat 模式的区别',
        paragraphs: [
          <>左边栏顶部是 Tervell 的<b className="font-medium text-foreground">模式切换</b>：Agent 与 Chat。</>,
          <>
            <b className="font-medium text-foreground">Chat</b> 是一问一答的对话——快速提问、不涉及任何对电脑的操作，
            核心偏向满足好奇心和完成简单的文字工作。
          </>,
          <>
            <b className="font-medium text-foreground">Agent</b> 则能自主规划做调研、操作电脑、写代码、PPT 和文档，
            为你的想法赋形。
          </>,
        ],
      }}
      nextLabel="下一个"
      onNext={onNext}
      onBack={onBack}
    >
      <section className="-mt-[150px] pb-16 pt-6 md:pb-20 md:pt-10">
        <div className="space-y-16 md:space-y-20">
          <article className="grid gap-10 border-t border-primary/15 pt-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
            <figure className="overflow-hidden rounded-lg bg-muted shadow-[0_14px_30px_hsl(var(--foreground)/0.08)]">
              <img src={guideChatExample} alt="Chat 解释 RAG 搜索原理的示例" className="block h-auto w-full" />
            </figure>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary">示例 01 · Chat</div>
              <h3 className="mt-3 text-2xl font-medium text-foreground md:text-3xl">快速厘清一个概念用 Chat</h3>
              <p className="mt-4 text-base leading-[1.7] text-muted-foreground md:text-lg">
                AI 最常见的场景，随意询问一件事，得到简单快速的解释。Chat 专注对话和文字回答，不会有任何产出。
              </p>
              <div className="mt-5 border-l-2 border-primary/35 pl-4">
                <div className="text-base font-medium leading-7 text-primary">你可以这样说</div>
                <p className="mt-1 text-base leading-7 text-muted-foreground">“用通俗的话帮我解释一下 RAG 的搜索原理。”</p>
              </div>
            </div>
          </article>

          <article className="grid gap-10 border-t border-primary/15 pt-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-center">
            <div className="lg:order-1">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary">示例 02 · Agent</div>
              <h3 className="mt-3 text-2xl font-medium text-foreground md:text-3xl">
                复杂<b className="font-medium text-foreground">调研/写代码/做PPT</b>等需要产出成果时用 Agent
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-muted-foreground md:text-lg">
                例如，请它研究一个概念或者行业并将结论做成 PPT/文档。Agent 会拆解任务、调用工具、持续推进，再把成果保留在当前工作区。
              </p>
              <div className="mt-5 border-l-2 border-primary/35 pl-4">
                <div className="text-base font-medium leading-7 text-primary">这样告诉 Agent</div>
                <p className="mt-1 text-base leading-7 text-muted-foreground">“帮我研究一下什么是 RAG，然后把研究结果写成一个文件/PPT放到会话文件里。”</p>
              </div>
            </div>
            <figure className="overflow-hidden rounded-lg bg-muted shadow-[0_14px_30px_hsl(var(--foreground)/0.08)] lg:order-2">
              <img src={guideAgentExample} alt="Agent 研究 RAG 并写入会话文件的示例" className="block h-auto w-full" />
            </figure>
          </article>
        </div>
      </section>
    </GuideExamplesPage>
  )
}

/** FAQ 主题分组 */

/**
 * FAQ 页面：左侧可点击目录地图 + 右侧按主题展开全部问题。
 */
function FaqPage({ nextLabel, onNext, onBack, highlight }: { nextLabel: string; onNext: () => void; onBack?: () => void; highlight?: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToGroup = (topic: string) => {
    const el = document.getElementById(`faq-${topic}`)
    if (!el || !scrollRef.current) return
    const container = scrollRef.current
    const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 24
    container.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="flex h-full w-full items-stretch">
      {/* 左侧：本页目录地图（垂直居中，整体上移 20px） */}
      <div className="hidden w-56 shrink-0 border-r border-border/80 px-4 py-4 md:flex md:flex-col md:justify-center -translate-y-5">
        <div className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">本页目录</div>
        <nav className="mt-4 space-y-1">
          {FAQ_GROUPS.map((group) => (
            <button
              key={group.topic}
              onClick={() => scrollToGroup(group.topic)}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
              {group.topic}
            </button>
          ))}
        </nav>
      </div>

      {/* 右侧：FAQ 内容（flex-col + m-auto 实现居中，超高时可正常滚动不裁剪） */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-32 md:px-10">
        <div className="m-auto w-full max-w-4xl py-10">
          {highlight && <ChapterMarker>{highlight}</ChapterMarker>}
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-light tracking-tight text-foreground md:text-4xl">常见问题</h2>
            <span className="text-2xl font-light tracking-[0.3em] text-primary/60 md:text-3xl">FAQ</span>
          </div>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            常见问题已经全部展开，方便你快速浏览和搜索。点击左侧目录可跳转到对应主题。
          </p>

          <div className="mt-10 space-y-10">
            {FAQ_GROUPS.map((group, groupIndex) => (
              <section key={group.topic} aria-labelledby={`faq-${group.topic}`}>
                <div className="flex items-end gap-3 border-b border-border pb-3">
                  <span className="text-xs font-medium tracking-[0.16em] text-primary">
                    {String(groupIndex + 1).padStart(2, '0')}
                  </span>
                  <h3 id={`faq-${group.topic}`} className="text-lg font-medium text-foreground">
                    {group.topic}
                  </h3>
                </div>

                <div className="divide-y divide-neutral-200/80">
                  {group.items.map((item) => (
                    <article key={item.q} className="border-l-2 border-primary/25 py-4 pl-4">
                      <h4 className="text-sm font-semibold tracking-wide text-primary">{item.q}</h4>
                      <p className="mt-2 max-w-3xl text-[15px] leading-7 text-muted-foreground">{item.a}</p>
                    </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex w-full items-center justify-between border-t border-primary/20 pt-6">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一个
            </Button>
          ) : (
            <span />
          )}
          <button
            onClick={onNext}
            className="flex h-14 items-center justify-center gap-1.5 rounded-md bg-primary px-9 text-base font-medium text-primary-foreground shadow-[0_8px_18px_hsl(var(--foreground)/0.1)] transition-all hover:bg-primary/90 active:translate-y-0.5 active:shadow-none"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

/** 引导步骤标题（欢迎页独立，不在地图中显示） */
const STEP_LABELS: Array<{ step: Exclude<OnboardingStep, 'welcome'>; label: string }> = [
  {step:'kernels',label:'准备内核'},
  { step: 'guide', label: 'Agent / Chat' },
  { step: 'project', label: '项目' },
  { step: 'files', label: '文件' },
  { step: 'subagent', label: '子会话' },
  { step: 'automation', label: '自动任务' },
  { step: 'memory', label: '记忆' },
  { step: 'sideanswer', label: '侧边回答' },
  { step: 'faq', label: 'FAQ' },
]

const BEGINNER_STEP_LABELS = STEP_LABELS.slice(0, 4)
const ADVANCED_STEP_LABELS = STEP_LABELS.slice(4)

/**
 * 底部进度地图：仅显示当前章节的步骤，并保持章节内的宽松间距。
 */
function ProgressMap({ current }: { current: Exclude<OnboardingStep, 'welcome'> }) {
  const isBeginner = BEGINNER_STEP_LABELS.some((step) => step.step === current)
  const visibleSteps = isBeginner ? BEGINNER_STEP_LABELS : ADVANCED_STEP_LABELS
  const activeIdx = visibleSteps.findIndex((step) => step.step === current)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-start justify-center bg-background/90 px-8 pb-5 pt-2 md:px-12">
      <div className={`w-full ${isBeginner ? 'max-w-3xl' : 'max-w-5xl'}`}>
        <div className="flex items-start">
          {visibleSteps.map((item, index) => {
            const done = index < activeIdx
            const isCurrent = index === activeIdx
            return (
              <div key={item.step} className="flex flex-1 flex-col items-center">
                <span
                  className={`text-[11px] leading-tight tracking-[0.04em] md:text-sm ${
                    isCurrent
                      ? 'font-medium text-primary'
                      : done
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
                <div className="mt-1.5 flex h-3 w-full items-center">
                  <div
                    className={`h-px flex-1 ${
                      index === 0
                        ? 'bg-transparent'
                        : done || isCurrent
                          ? 'bg-primary/50'
                          : 'bg-muted'
                    }`}
                  />
                  <div
                    className={`mx-1.5 h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-300 ${
                      isCurrent
                        ? 'bg-primary ring-4 ring-primary/15'
                        : done
                          ? 'bg-primary/70'
                          : 'bg-muted-foreground/35'
                    }`}
                  />
                  <div
                    className={`h-px flex-1 ${
                      index === visibleSteps.length - 1
                        ? 'bg-transparent'
                        : index < activeIdx
                          ? 'bg-primary/50'
                          : 'bg-muted'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function OnboardingView({ onComplete, initialStep = 'welcome' }: OnboardingViewProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep)
  const [flash, setFlash] = useState(false)
  const [fading, setFading] = useState(false)
  const [faqBackStep, setFaqBackStep] = useState<'subagent' | 'sideanswer'>('sideanswer')
  const handleFinish = async () => {
    await window.electronAPI.updateSettings({
      onboardingCompleted: true,
      onboardingVersion: CURRENT_ONBOARDING_VERSION,
    })
    onComplete()
  }

  /**
   * 页面切换：
   * - welcome 进出以背景过渡衔接品牌面板
   * - guide 之后的科普页之间用淡入淡出
   */
  const transitionTo = (next: OnboardingStep) => {
    const useFlash = step === 'welcome' || next === 'welcome'
    setFading(true)
    if (useFlash) setFlash(true)
    setTimeout(() => {
      setStep(next)
      requestAnimationFrame(() => {
        setFading(false)
        setFlash(false)
      })
    }, 250)
  }

  const handleEnterGuide = () => transitionTo('kernels')
  const handleNextFromGuide = () => transitionTo('project')
  const handleNextFromProject = () => transitionTo('files')
  const handleNextFromFiles = () => transitionTo('subagent')
  const handleNextFromAutomation = () => transitionTo('memory')
  const handleNextFromMemory = () => transitionTo('sideanswer')
  const handleNextFromSideAnswer = () => {
    setFaqBackStep('sideanswer')
    transitionTo('faq')
  }
  const handleNextFromSubagent = () => transitionTo('automation')
  const handleJumpToFaq = () => {
    setFaqBackStep('subagent')
    transitionTo('faq')
  }
  const handleNextFromFaq = () => handleFinish()

  const currentMapIndex = STEP_LABELS.findIndex((item) => item.step === step)
  const stepIndex = currentMapIndex + 1
  const totalSteps = STEP_LABELS.length

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">

      {step === 'welcome' && (
        <div className="h-60 shrink-0 md:h-auto md:w-[48%]">
          <BrandArtwork />
        </div>
      )}
      {step !== 'welcome' && step !== 'faq' && step !== 'kernels' && (
        <div className="absolute right-8 top-12 z-30 flex items-center gap-2 rounded-md bg-background/95 px-2 py-1 text-xs text-muted-foreground">
          <BrandMark width={18} height={18} className="text-primary" />
          <span>功能导览 · 早期界面示例</span>
        </div>
      )}

      {/* ===== 内容面板（引导页清屏后占满全宽，切换时淡入淡出） ===== */}
      <div
        className={`relative flex min-h-0 flex-1 ${step==='kernels'?'items-stretch overflow-hidden':'items-center justify-center overflow-y-auto'} transition-opacity duration-300 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* 右上角步骤指示 */}
        {step !== 'welcome' && (
          <div className="absolute right-8 top-6 text-xs uppercase tracking-[0.3em] text-muted-foreground md:right-10 md:top-8">
            {String(stepIndex).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </div>
        )}

        {step === 'welcome' && (
          <div className="w-full max-w-xl px-6 py-10 md:px-10">
            {/* 状态徽章 */}
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check size={13} strokeWidth={3} />
              </span>
              <span className="text-sm font-medium text-muted-foreground">从这里开始</span>
            </div>

            <h1 className="text-3xl font-light tracking-tight text-foreground md:text-4xl">
              欢迎使用 Tervell
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
              面向个人项目的 Agent 工作台
            </p>

            {/* 主操作 */}
            <div className="mt-8">
              <button
                onClick={handleEnterGuide}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-sm bg-primary text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-0.5 active:shadow-none"
              >
                进入引导界面
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step==='kernels'&&<KernelSetupGuide onNext={()=>transitionTo('guide')} onBack={()=>transitionTo('welcome')}/>}
        {step === 'guide' && (
          <AgentChatGuidePage
            onNext={handleNextFromGuide}
            onBack={() => transitionTo('kernels')}
          />
        )}

        {step === 'files' && (
          <GuideExamplesPage
            intro={{
              anchor: { x: 0.91, y: 0.07 },
              arrowMode: 'magnifier',
              magnifierOffsetX: -40,
              highlight: '入门篇 · 第 3 步',
              title: '会话文件和项目文件',
              paragraphs: [
                <>右侧预览面板顶部有<b className="font-medium text-foreground">会话文件</b>和<b className="font-medium text-foreground">项目文件</b>两个页签。</>,
                <>
                  <b className="font-medium text-foreground">会话文件</b>属于这一次对话——附件、截图、临时引用等。
                </>,
                <>
                  <b className="font-medium text-foreground">项目文件</b>属于整个项目——所有项目内的会话共享这些文件，
                  是团队/长期项目真正的工作台。
                </>,
              ],
            }}
            nextLabel="开始进阶篇"
            onNext={handleNextFromFiles}
            onBack={() => transitionTo('project')}
          >
            <section className="border-t border-primary/20 py-16 md:py-20">
              <FileGuideExamples />
            </section>
          </GuideExamplesPage>
        )}

        {step === 'project' && (
          <GuideFeatureStep
            anchor={{ x: 0.012, y: 0.22 }}
            arrowMode="magnifier"
            magnifierOffsetX={130}
            magnifierImageOffset={{ x: 0.08, y: 0.05 }}
            highlight="入门篇 · 第 2 步"
            title="项目的概念"
            paragraphs={[
              <>左侧边栏的<b className="font-medium text-foreground">项目</b>是你为特定工作建立的独立空间。</>,
              <>
                每个项目有自己的<b className="font-medium text-foreground">项目文件</b>、
                <b className="font-medium text-foreground">上下文、Skills/MCP 与记忆</b>，互不干扰。
              </>,
              <>
                比如图中的「广告投放项目」「代码分析」，都各是一个独立的项目工作区，用于做完全不同的事。
              </>,
            ]}
            nextLabel="下一个"
            onNext={handleNextFromProject}
            onBack={() => transitionTo('guide')}
          />
        )}

        {step === 'subagent' && (
          <GuideExamplesPage
            intro={{
              anchor: { x: 0.075, y: 0.38 },
              arrowMode: 'magnifier',
              magnifierOffsetX: 80,
              magnifierImageOffset: { x: 0.075 },
              imageSrc: guideSubagent,
              highlight: '进阶指南 · 第 1 步',
              title: '子会话功能',
              paragraphs: [
                <>
                  子会话（Collaboration）是 Agent 派生的<b className="font-medium text-foreground">独立研究小分队</b>——
                  你用一句自然语言就能启动，比如「启动 3 个子会话研究躺平现象」。
                </>,
                <>
                  每个子会话可以用自然语言<b className="font-medium text-foreground">指定不同模型</b>（如 GLM、DeepSeek），
                  拥有<b className="font-medium text-foreground">独立的上下文</b>，各自专注一个方向并行研究。
                </>,
                <>
                  结果再汇回父会话——
                  <b className="font-medium text-foreground">既节省父会话的上下文，又能省时并行干更多的活</b>。
                </>,
              ],
            }}
            nextLabel="下一个"
            onNext={handleNextFromSubagent}
            onBack={() => transitionTo('files')}
          >
            <SubagentGuideExamples />
          </GuideExamplesPage>
        )}

        {step === 'automation' && (
          <GuideExamplesPage
            intro={{
              anchor: { x: 0.21, y: 0.019 },
              arrowMode: 'none',
              imageSrc: guideAutomation,
              imageRightCrop: 2,
              highlight: '进阶指南 · 第 2 步',
              title: '自动任务功能',
              paragraphs: [
                <>
                  打开<b className="font-medium text-foreground">自动任务</b>，你可以让 Tervell 定时自动执行一件事。
                  在任务描述里用自然语言写清楚「做什么、什么时候做」，再配置频率与模型，
                  <b className="font-medium text-foreground">无人值守</b>也能完成。
                  你也可以用自然语言直接让 Agent 帮你创建自动任务。
                </>,
              ],
            }}
            nextLabel="下一个"
            onNext={handleNextFromAutomation}
            onBack={() => transitionTo('subagent')}
          >
            <section className="border-t border-primary/20 py-16 md:py-20">
              <AutomationGuideExamples />
            </section>
          </GuideExamplesPage>
        )}

        {step === 'memory' && (
          <GuideExamplesPage
            intro={{
              anchor: { x: 0.49, y: 0.18 },
              arrowMode: 'none',
              imageSrc: guideMemory,
              highlight: '进阶指南 · 第 3 步',
              title: '建立项目地图与协作记忆',
              paragraphs: [
                <>
                  <b className="font-medium text-foreground">项目地图</b>放在两层 AGENTS.md，减少重复探索；<b className="font-medium text-foreground">协作记忆</b>只保留你的稳定偏好与避免重犯的经验。
                </>,
              ],
            }}
            nextLabel="下一个"
            onNext={handleNextFromMemory}
            onBack={() => transitionTo('automation')}
          >
            <section className="border-t border-primary/20 py-16 md:py-20">
              <MemoryGuideExamples />
            </section>
          </GuideExamplesPage>
        )}

        {step === 'sideanswer' && (
          <GuideFeatureStep
            anchor={{ x: 0.66, y: 0.044 }}
            arrowMode="none"
            imageSrc={guideSideAnswer}
            highlight="进阶指南 · 第 4 步"
            title="侧边回答"
            paragraphs={[
              <>在 Agent 对话中，可以选中一段文字，然后打开侧边回答。</>,
              <>这会打开<b className="font-medium text-foreground">右侧问答面板</b>，
                围绕你选中的内容讲解，不打断主对话也不占用上下文。
              </>,
              <>适合查词、解释概念、拆解长文。
              </>,
            ]}
            nextLabel="下一个"
            onNext={handleNextFromSideAnswer}
            onBack={() => transitionTo('memory')}
          />
        )}

        {step === 'faq' && (
          <FaqPage
            highlight="进阶指南 · 第 5 步"
            nextLabel="开始使用"
            onNext={handleNextFromFaq}
            onBack={() => transitionTo(faqBackStep)}
          />
        )}

      </div>

      {step !== 'welcome' && step !== 'kernels' && <ProgressMap current={step} />}

      {step === 'subagent' && (
        <button
          onClick={handleJumpToFaq}
          className="absolute bottom-5 right-[30px] z-30 flex h-8 items-center gap-1 px-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          跳到 FAQ
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}

      {/* ===== 白色闪屏遮罩 ===== */}
      <div
        className={`pointer-events-none absolute inset-0 z-50 bg-background transition-opacity duration-300 ${
          flash ? 'opacity-100' : 'opacity-0'
        }`}
      />

    </div>
  )
}
