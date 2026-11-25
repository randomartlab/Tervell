import { CheckCircle2, Circle, Copy, ShieldCheck } from 'lucide-react'
import type { ClientState, WorkbenchClient } from '@proma/client'
import type { Session } from '@proma/protocol'
import { SessionApproval } from './approval.tsx'
import { permissionLabel } from './labels.ts'
interface ContextProps {
  state: ClientState
  session?: Session
  client: WorkbenchClient
  transfer: () => void
  copyLink: () => void
  linkNotice: string
  locatePlan?: () => void
}
export function SessionContext({ state, session, client, transfer, copyLink, linkNotice, locatePlan }: ContextProps) {
  const approvals = state.approvals.filter(approval => approval.sessionId === session?.id)
  const plan = state.conversation.blocks.findLast(block => block.kind === 'plan')
  const tools = state.conversation.blocks.filter(block => block.kind === 'tool')
  return <div className="context-content">{session ? <>
    <section className="context-actions">
      <div className="section-heading">
        <h2>会话操作</h2>
        <ShieldCheck size={16} aria-hidden="true" />
      </div>
      <p className="muted">{state.lease ? state.lease.mine ? '当前浏览器持有输入权' : '另一设备持有输入权' : '输入权空闲，发送时获取'}</p>
      <div className="button-row">
        <button onClick={copyLink}>
          <Copy size={14} aria-hidden="true" />复制会话链接
        </button>{state.lease && !state.lease.mine && <button onClick={transfer}>接管输入</button>}
      </div>
      <p role="status" className="muted link-notice">{linkNotice}</p>
    </section>
    <section>
      <div className="section-heading">
        <h2>需要你</h2>
        <span className="badge">{approvals.length}</span>
      </div>
      {approvals.map(approval => <SessionApproval
        key={approval.id}
        approval={approval}
        state={state}
        client={client} />)}
      {!approvals.length && <p className="context-clear">
        <CheckCircle2 size={16} aria-hidden="true" />目前没有待确认操作
      </p>}
    </section>
    <section>
      <div className="section-heading">
        <h2>当前计划</h2>{plan && <button className="text-action" onClick={() => {
      if (locatePlan) { locatePlan(); return }
      const target = Array.from(document.querySelectorAll<HTMLElement>('[data-plan-id]')).find(element => element.dataset.planId === plan.id)
      target?.scrollIntoView({ block: 'center', behavior: 'instant' }); target?.focus()
    }}>定位计划</button>}{plan?.steps && <span className="muted">{plan.steps.filter(step => step.status === 'completed').length}/{plan.steps.length}
        </span>}
      </div>
      {plan?.steps?.length ? <ol className="context-plan">{plan.steps.map(step => <li key={step.id}>{step.status === 'completed' ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}
        <span>{step.title}
          <small>{step.status === 'completed' ? '已完成' : step.status === 'running' ? '进行中' : '待处理'}</small>
        </span>
      </li>)}</ol> : <p className="muted">Agent 提供计划后会显示在这里。</p>}
    </section>
    <section>
      <h2>最近的工具操作</h2>{tools.length ? <ul className="context-tools">{tools.slice(-4).reverse().map(tool => <li key={tool.id}>
        <span>{tool.title}</span>
        <small>{tool.status === 'succeeded' ? '已完成' : tool.status === 'failed' ? '失败' : tool.status === 'running' ? '进行中' : '待处理'}</small>
      </li>)}</ul> : <p className="muted">工具执行后可在时间线查看详情。</p>}
    </section>
    <details className="session-details">
      <summary>会话信息</summary>
      <dl>
        <dt>项目</dt>
        <dd>{session.workspaceId}</dd>
        <dt>内核</dt>
        <dd>{session.kernelId}</dd>
        <dt>权限</dt>
        <dd>{permissionLabel(session.permissionMode)}</dd>
        <dt>同步位置</dt>
        <dd>#{state.conversation.seq}
        </dd>
      </dl>
    </details>
  </> : <div className="empty">选择会话后查看任务进展</div>}</div>
}
