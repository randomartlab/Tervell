import * as React from 'react'
import { useStickToBottomContext } from 'use-stick-to-bottom'

interface Registration { element: HTMLDivElement; update: (visible: boolean) => void }
const ViewportContext = React.createContext<((registration: Registration) => () => void) | null>(null)
/** 共用一个 observer；保留轻量流式占位，不让离屏 Markdown/高亮/工具树长期挂载。 */
export function TranscriptViewport({ children }: { children: React.ReactNode }): React.ReactElement {
  const { scrollRef } = useStickToBottomContext()
  const registrations = React.useRef(new Map<Element, Registration>())
  const observer = React.useRef<IntersectionObserver>()
  const register = React.useCallback((row: Registration) => {
    registrations.current.set(row.element, row)
    observer.current?.observe(row.element)
    return () => { observer.current?.unobserve(row.element); registrations.current.delete(row.element) }
  }, [])
  React.useEffect(() => {
    if (!scrollRef.current) return
    const current = new IntersectionObserver(entries => {
      for (const entry of entries) registrations.current.get(entry.target)?.update(entry.isIntersecting)
    }, { root: scrollRef.current, rootMargin: '1200px 0px' })
    observer.current = current
    for (const row of registrations.current.values()) current.observe(row.element)
    return () => { current.disconnect(); observer.current = undefined }
  }, [scrollRef])
  return <ViewportContext.Provider value={register}>{children}</ViewportContext.Provider>
}

export function TranscriptViewportRow({ id, estimate, keepMounted, initiallyVisible, children }: {
  id: string; estimate: number; keepMounted: boolean; initiallyVisible: boolean; children: React.ReactNode
}): React.ReactElement {
  const register = React.useContext(ViewportContext)
  const ref = React.useRef<HTMLDivElement>(null)
  const height = React.useRef(estimate)
  const [visible, setVisible] = React.useState(initiallyVisible)
  const [interacted, setInteracted] = React.useState(false)
  const mounted = visible || keepMounted || interacted
  React.useEffect(() => {
    const element = ref.current
    if (!element || !register) return
    const reveal = () => { setInteracted(true); setVisible(true) }
    element.addEventListener('tervell-transcript-reveal', reveal)
    const unregister = register({ element, update: next => {
      const selection = window.getSelection()
      if (!next && (element.contains(document.activeElement)
        || selection && !selection.isCollapsed && (element.contains(selection.anchorNode) || element.contains(selection.focusNode)))) return
      if (!next && element.childElementCount) height.current = element.getBoundingClientRect().height
      setVisible(next)
    } })
    return () => { unregister(); element.removeEventListener('tervell-transcript-reveal', reveal) }
  }, [register])
  React.useLayoutEffect(() => {
    const element = ref.current
    if (!mounted || !element) return
    const observer = new ResizeObserver(() => { height.current = element.getBoundingClientRect().height })
    observer.observe(element)
    return () => observer.disconnect()
  }, [mounted])
  // 轻量占位仍提供历史锚点；迷你地图、搜索和引用都能先滚动再自动挂载。
  return <div ref={ref} data-transcript-row={id} data-message-id={mounted ? undefined : id}
    onPointerDownCapture={() => setInteracted(true)}
    onKeyDownCapture={() => setInteracted(true)}
    style={mounted ? undefined : { height: height.current, contain: 'strict' }}>
    {mounted ? children : null}
  </div>
}
