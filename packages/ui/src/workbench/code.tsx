import { Children, isValidElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
interface HighlightTokensResult { lines: Array<Array<{ content: string; color?: string }>> }

function plainText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(plainText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return plainText(node.props.children)
  return ''
}
export function codeContent(children: ReactNode): { text: string; language: string } {
  const child = Children.toArray(children).find(node => isValidElement(node))
  const className = isValidElement<{ className?: string }>(child) ? child.props.className : ''
  return { text: plainText(children).replace(/\n$/, ''), language: className?.match(/language-([\w+-]+)/)?.[1] ?? 'text' }
}
export function WorkbenchCode({ children, onCopy }: { children: ReactNode; onCopy?: (text: string) => Promise<void> }) {
  const { text, language } = codeContent(children)
  const [theme, setTheme] = useState<'github-dark' | 'github-light'>('github-light')
  const [tokens, setTokens] = useState<{ text: string; theme: string; result: HighlightTokensResult }>()
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'github-dark' : 'github-light')
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (text.length > 64000 || language === 'text') return
    let active = true
    const timer = setTimeout(() => {
      void import('./highlight.ts').then(async highlighter => {
        const lines = await highlighter.highlightWorkbenchCode(text, language, theme)
        if (active) setTokens({ text, theme, result: { lines } })
      }).catch(() => { /* 高亮是渐进增强；失败时始终保留可读、可复制的原始代码。 */ })
    }, 100)
    return () => { active = false; clearTimeout(timer) }
  }, [text, language, theme])
  const highlighted = tokens?.text === text && tokens.theme === theme ? tokens.result : undefined
  const copy = async () => {
    try { await (onCopy ? onCopy(text) : navigator.clipboard.writeText(text)); setNotice('代码已复制') }
    catch { setNotice('复制失败，请选择代码后复制') }
  }
  return <div className="workbench-code">
    <div className="code-toolbar"><span>{language}</span><button type="button" aria-label="复制代码" onClick={() => void copy()}>复制代码</button></div>
    <pre tabIndex={0} aria-label={`${language} 代码`}><code>{highlighted ? highlighted.lines.map((line, index) => <span className="code-line" key={index}>{index > 0 && '\n'}{line.map((token, i) => <span key={i} style={token.color ? { color: token.color } : undefined}>{token.content}</span>)}</span>) : text}</code></pre>
    {text.length > 64000 && <p className="code-notice">代码较长，已保留原文并暂停语法高亮。</p>}
    <span className="code-notice" role="status">{notice}</span>
  </div>
}
