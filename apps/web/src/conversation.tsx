import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Square, Send } from 'lucide-react'
import { WorkbenchHeading } from '@proma/ui/workbench/heading'
import '@proma/ui/workbench/heading.css'
import { ConversationTimeline } from '@proma/ui/workbench'
import { BrandMark } from '@proma/ui/brand'
import { quoteMessage } from '@proma/client'
import type { ClientState, WorkbenchClient } from '@proma/client'
import type { ReactNode } from 'react'
import { permissionLabel } from './labels.ts'
import type { Session } from '@proma/protocol'
export function ConversationView({ state, client, session, draft, setDraft, actions }: { state: ClientState; client: WorkbenchClient; session?: Session; actions: ReactNode; draft: string; setDraft: (text: string, expected?: string) => void }) {
  const viewport = useRef<HTMLDivElement>(null)
  const anchor = useRef<{ id: string; offset: number }>()
  const follow = useRef(true)
  const [newContent, setNewContent] = useState(false)
  const [notice, setNotice] = useState('')
  const { conversation } = state
  useEffect(() => { follow.current = true; setNewContent(false); setNotice('') }, [session?.id])
  useLayoutEffect(() => {
    const area = viewport.current
    if (!area) return
    if (follow.current) area.scrollTop = area.scrollHeight
    else {
      setNewContent(true)
      const saved = anchor.current
      if (saved) {
        const block = Array.from(area.querySelectorAll<HTMLElement>('[data-block-id]')).find(item => item.dataset.blockId === saved.id)
        if (block) area.scrollTop += block.getBoundingClientRect().top - area.getBoundingClientRect().top - saved.offset
      }
    }
  }, [conversation.seq, session?.id])
  useEffect(() => {
    const area = viewport.current
    if (!area) return
    const observer = new ResizeObserver(() => {
      if (follow.current) area.scrollTop = area.scrollHeight
      else if (anchor.current) {
        const saved = anchor.current
        const block = Array.from(area.querySelectorAll<HTMLElement>('[data-block-id]')).find(item => item.dataset.blockId === saved.id)
        if (block) area.scrollTop += block.getBoundingClientRect().top - area.getBoundingClientRect().top - saved.offset
      }
    })
    observer.observe(area)
    const content = area.querySelector('.transcript-inner')
    if (content) observer.observe(content)
    return () => observer.disconnect()
  }, [session?.id])
  const quote = (text: string) => {
    const next = `${draft}${draft.trim() ? '\n\n' : ''}${quoteMessage(text)}`
    if (next.length > 32000) { setNotice('引用后超过输入上限，请先选择需要引用的片段。'); return }
    setDraft(next)
    requestAnimationFrame(() => document.getElementById('composer')?.focus())
  }
  const send = async () => {
    if (!draft.trim() || state.busy || !session) return
    const submitted = draft
    try { await client.send(submitted, conversation.running); setDraft('', submitted); setNotice(conversation.running ? '消息已排队' : '消息已发送') } catch { setNotice('发送未完成，草稿已保留，可重试') }
  }
  if (!session) return <main id="main-content" className="conversation" tabIndex={-1}>
    <header className="page-toolbar">
      <span>Tervell</span>{actions}
    </header>
    <div className="empty-workspace">
      <BrandMark width={48} height={48} className="empty-brand-mark"/>
      <h1>给想法一个工作空间</h1>
      <p>从导航选择会话，继续与你的 Agent 协作。</p>
      <p className="muted">会话由电脑创建并按项目授权同步到这里。</p>
    </div>
  </main>
  return <main id="main-content" className="conversation" tabIndex={-1}>
    <WorkbenchHeading
      className="conversation-header"
      breadcrumbs={<><span>{session.workspaceId}</span><span aria-hidden="true">/</span><span>{permissionLabel(session.permissionMode)}</span></>}
      title={<h1 title={session.title}>{session.title || '未命名会话'}</h1>}
      status={{ kind: conversation.running ? 'running' : 'ready', label: conversation.running ? '运行中' : '就绪' }}
      actions={actions}
    />
    <div
      className="transcript"
      ref={viewport}
      role="region"
      aria-label="会话时间线"
      tabIndex={0}
      aria-busy={conversation.loading}
      onScroll={() => {
        const area = viewport.current
        if (!area) return
        follow.current = area.scrollHeight - area.scrollTop - area.clientHeight < 70
        if (follow.current) setNewContent(false)
        const top = area.getBoundingClientRect().top
        const block = Array.from(area.querySelectorAll<HTMLElement>('[data-block-id]')).find(item => item.getBoundingClientRect().bottom > top)
        if (block?.dataset.blockId) anchor.current = { id: block.dataset.blockId, offset: block.getBoundingClientRect().top - top }
      }}>
      <div className="transcript-inner">
        <div className="conversation-start">
          <span>与你的 Agent 协作</span>
          <span>{session.model?.modelId ?? '使用电脑模型'}</span>
        </div>{conversation.loading && <p role="status">正在读取会话…</p>}{conversation.error && <p className="trace trace-error" role="alert">{conversation.error}</p>}{!conversation.loading && !conversation.blocks.length && <div className="empty">
          <h2>开始这一轮协作</h2>
          <p>描述目标、问题或需要处理的任务。</p>
        </div>}{<ConversationTimeline blocks={conversation.blocks} onQuote={quote}/>}
        <div className="stream-indicator" role="status" aria-live="polite">{conversation.running ? 'Agent 正在处理…' : ''}</div>
      </div>
    </div>
    {newContent && <button className="new-content" onClick={() => { follow.current = true; if (viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight; setNewContent(false) }}>
      <ArrowDown size={14} /> 有新内容
    </button>}
    <div className="composer-wrap">
      <form className="composer" onSubmit={event => { event.preventDefault(); void send() }}>
        <label className="sr-only" htmlFor="composer">发送给 Agent 的消息</label>
        <textarea
          id="composer"
          placeholder="描述你想完成的工作…"
          value={draft}
          maxLength={32000}
          rows={2}
          disabled={state.status === 'disconnected'}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} />
        <div className="composer-toolbar">
          <span className="muted">{conversation.running ? '发送后加入本会话队列' : '⌘ / Ctrl + Enter 发送'}</span>
          <div className="button-row">{conversation.running && <button type="button" aria-label="停止当前运行" onClick={() => void client.interrupt().catch(error => setNotice(error instanceof Error ? error.message : '停止未完成'))}>
            <Square size={13} />停止
          </button>}
            <button className="primary send-button" disabled={!draft.trim() || state.busy || state.status === 'disconnected'} type="submit">{conversation.running ? <ArrowUp size={15} /> : <Send size={15} />} {state.busy ? '发送中…' : conversation.running ? '排队' : '发送'}
            </button>
          </div>
        </div>
      </form>
      <p className="composer-footnote" aria-live="polite">{notice || '操作由宿主执行，需确认的工具调用会出现在审批中心。'}</p>
    </div>
  </main>
}
