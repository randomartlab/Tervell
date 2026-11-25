import { APP_NAME } from '@proma/shared/config'
import { BrandMark } from '@proma/ui/brand'
import { useId } from 'react'
import { ChevronDown, FolderOpen, Keyboard, MessageSquare, Search, Settings, ShieldCheck } from 'lucide-react'
import { sessionPath } from '@proma/client'
import type { ClientState } from '@proma/client'
import type { Session } from '@proma/protocol'
interface NavigationProps {
  sessions: Session[]
  selected?: Session
  view: string
  status: ClientState['status']
  version?: string
  approvalCount: number
  runningId?: string
  filter: string
  setFilter: (filter: string) => void
  navigate: (path: string) => void
  openPalette: () => void
  openHelp: () => void
  openConnection: () => void
  connectionLabel: string
}
export function Navigation({ sessions, selected, view, status, version, approvalCount, runningId, filter, setFilter, navigate, openPalette, openHelp, openConnection, connectionLabel }: NavigationProps) {
  const filterId = useId()
  const workspaces = [...new Set(sessions.map(session => session.workspaceId))]
  return <>
    <aside className="sidebar" aria-label="主导航">
      <div className="brand">
        <span className="brand-symbol" aria-hidden="true"><BrandMark width={28} height={28}/></span>
        <span>{APP_NAME}</span>
        <span className="edition">WEB</span>
      </div>
      <button className="workspace-switch" onClick={openPalette}>
        <FolderOpen aria-hidden="true" size={17} />
        <span>{selected?.workspaceId ?? '工作空间'}</span>
        <ChevronDown aria-hidden="true" size={14} />
      </button>
      <button className="search-button" onClick={() => openPalette()}>
        <Search aria-hidden="true" size={15} />
        <span>搜索与命令</span>
        <kbd>⌘ K</kbd>
      </button>
      <nav className="main-nav">
        <button className={view === 'sessions' ? 'active' : ''} onClick={() => navigate('/')}>
          <MessageSquare aria-hidden="true" size={16} />会话
        </button>
        <button className={view === 'approvals' ? 'active' : ''} onClick={() => navigate('/approvals')}>
          <ShieldCheck aria-hidden="true" size={16} />审批中心
          <span className="badge">{approvalCount}</span>
        </button>
      </nav>
      <div className="session-list-heading">
        <span>项目会话</span>
        <span>{sessions.length}</span>
      </div>
      <label className="sr-only" htmlFor={filterId}>筛选会话</label>
      <input
        id={filterId}
        className="session-filter"
        placeholder="筛选会话…"
        value={filter}
        onChange={event => setFilter(event.target.value)} />
      <div className="session-list">{workspaces.map(workspace => <section key={workspace}>
        <h2>
          <FolderOpen aria-hidden="true" size={12} />{workspace}
        </h2>{sessions.filter(session => session.workspaceId === workspace && `${session.title} ${session.id}`.toLowerCase().includes(filter.toLowerCase())).map(session => <a
          key={session.id}
          href={sessionPath(workspace!, session.id)}
          aria-current={selected?.id === session.id ? 'page' : undefined}
          title={session.title || '未命名会话'}
          onClick={event => { if (!event.metaKey && !event.ctrlKey && event.button === 0) { event.preventDefault(); navigate(sessionPath(workspace!, session.id)) } }}>
          <MessageSquare aria-hidden="true" size={14} />
          <span>{session.title || '未命名会话'}</span>{runningId === session.id && <span className="session-running" aria-label="运行中">进行中</span>}
        </a>)}
      </section>)}{!sessions.length && <p className="empty">{status === 'connecting' ? '正在同步…' : '还没有授权的会话'}</p>}
      </div>
      <div className="sidebar-bottom">
        <button onClick={() => navigate('/settings')}>
          <Settings aria-hidden="true" size={16} />外观与连接
        </button>
        <button onClick={() => openHelp()}>
          <Keyboard aria-hidden="true" size={16} />快捷键
          <span className="muted">⌘ /</span>
        </button>
        <button className="host-status" onClick={() => openConnection()}>
          <span className={`status-dot ${status === 'online' ? 'online' : ''}`} />
          <span>{connectionLabel}</span>
          <small>{version}</small>
        </button>
      </div>
    </aside>
  </>
}
