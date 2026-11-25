import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ConversationBlock } from '@proma/client'
import { WorkbenchCode } from './code.tsx'
export { ConversationTimeline } from './timeline.tsx'
import type { ApiResult } from '@proma/protocol'
export function ConversationItem({ block }: { block: ConversationBlock }) {
  if (block.role === 'user') return <article className="message user-message" aria-label="你的消息"><p>{block.text}</p></article>
  if (block.kind === 'tool') return <details className={`trace trace-tool trace-${block.status ?? 'pending'}`}>
    <summary>
      <span aria-hidden="true">↳</span> {block.title ?? '工具调用'}
      <small>{toolStatus(block.status)}</small>
    </summary>{block.input && <pre aria-label="工具输入">{block.input}</pre>}{block.text && <pre aria-label="工具输出">{block.text}</pre>}
  </details>
  if (block.kind === 'plan') return <section className="trace trace-plan" data-plan-id={block.id} tabIndex={-1} aria-label="执行计划">
    <h3>执行计划</h3>
    <ol>{block.steps?.map(step => <li key={step.id} data-status={step.status}>
      <span>{toolStatus(step.status)}</span> {step.title}{step.result && <p>{step.result}</p>}
    </li>)}</ol>
  </section>
  if (block.kind === 'thinking') return <details className="trace trace-thinking">
    <summary>思考过程</summary>
    <p>{block.text}</p>
  </details>
  if (block.kind === 'approval') return <p className="trace trace-approval">审批请求 · {block.title} — {block.text}
  </p>
  if (block.kind === 'error') return <p className="trace trace-error" role="alert">{block.title} · {block.text}
  </p>
  if (block.kind === 'status') return <p className="trace trace-status">{block.text}</p>
  return <article className="message assistant-message" aria-label="助手消息">
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ pre: ({ children }) => <WorkbenchCode>{children}</WorkbenchCode>, a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>, img: () => <span>图片内容请在宿主查看</span> }}>{block.text}</ReactMarkdown>{block.truncated && <small>内容已裁剪，请在宿主查看完整版。</small>}
  </article>
}
function toolStatus(status?: string): string { return ({ running: '进行中', pending: '待处理', succeeded: '已完成', completed: '已完成', failed: '失败', rejected: '已拒绝', skipped: '已跳过' } as Record<string, string>)[status ?? ''] ?? status ?? '' }
type PendingApproval = ApiResult<'approval.list'>['approvals'][number]
export function ApprovalCard({ approval, onRespond, pending, error }: { approval: PendingApproval; onRespond: (decision: 'allow' | 'allow-session' | 'deny') => Promise<void>; pending?: boolean; error?: string }) {
  const submitting = useRef(false)
  const [localPending, setLocalPending] = useState(false)
  const [localError, setLocalError] = useState('')
  const busy = pending ?? localPending
  const respond = async (decision: 'allow' | 'allow-session' | 'deny') => {
    if (busy || submitting.current) return
    submitting.current = true; setLocalPending(true); setLocalError('')
    try { await onRespond(decision) }
    catch (failure) { setLocalError(failure instanceof Error ? failure.message : '审批未完成，请重试') }
    finally { submitting.current = false; setLocalPending(false) }
  }
  const decisions = approval.allowedDecisions ?? ['allow', 'deny']
  const kind = ({ read: '读取', edit: '修改', delete: '删除', execute: '执行命令', fetch: '网络访问', search: '搜索', other: '工具操作' })[approval.kind]
  return <article className="approval-card" aria-label={`审批 ${approval.id}`} aria-busy={busy}>
    <div className="eyebrow">需要你的确认 · {kind}
    </div>
    <pre>{approval.request}</pre>
    <p className="muted">核对操作内容，再选择允许范围。本会话允许不会扩展到其他会话。</p>
    <div className="button-row">{(['allow', 'allow-session', 'deny'] as const).map(decision => <button
      type="button"
      key={decision}
      disabled={busy || !decisions.includes(decision)}
      title={!decisions.includes(decision) ? '内核或当前策略不支持此决策' : undefined}
      className={decision === 'allow' ? 'primary' : ''}
      onClick={() => void respond(decision)}>{decision === 'allow' ? '仅此一次' : decision === 'allow-session' ? '本会话允许' : '拒绝'}</button>)}</div>
    {busy && <p role="status">正在提交审批，请稍候…</p>}{(error || localError) && <p role="alert">{error || localError}</p>}
  </article>
}
interface WorkbenchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: React.ReactNode
  onClosed?: () => void
  variant?: 'dialog' | 'navigation' | 'context'
}
export function WorkbenchDialog({ open, onOpenChange, title, description, children, onClosed, variant = 'dialog' }: WorkbenchDialogProps) {
  const previousFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  if (open && !wasOpen.current && typeof document !== 'undefined') previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  wasOpen.current = open
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content className={`dialog-content ${variant !== 'dialog' ? `drawer drawer-${variant}` : ''}`} onCloseAutoFocus={event => {
      event.preventDefault()
      if (previousFocus.current?.isConnected) previousFocus.current.focus()
      else document.getElementById('main-content')?.focus()
      onClosed?.()
    }}>
      <Dialog.Title className={variant === 'navigation' ? 'sr-only' : undefined}>{title}</Dialog.Title>
      <Dialog.Description className={variant === 'navigation' ? 'sr-only' : 'muted'}>{description}</Dialog.Description>
      {children}
      <Dialog.Close className="dialog-close" aria-label="关闭对话框">×</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
}

export { WorkbenchFrame } from './frame.tsx'
