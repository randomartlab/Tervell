import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'
import { Command, Focus, Menu, PanelLeft, PanelRight, ShieldCheck } from 'lucide-react'
import { CoreRpc, WorkbenchClient, parseRoute, sessionPath } from '@proma/client'
import { WorkbenchFrame } from '@proma/ui/workbench/frame'
import '@proma/ui/workbench/frame.css'
import { WorkbenchDialog } from '@proma/ui/workbench'
import { CommandPalette, shortcuts } from './commands.tsx'
import type { Command as PaletteCommand } from './commands.tsx'
import { ConversationView } from './conversation.tsx'
import { Navigation } from './navigation.tsx'
import { SessionContext } from './context.tsx'
import { SessionApproval } from './approval.tsx'
import { SettingsPage } from './settings.tsx'
import { useAppearance } from './appearance.ts'
export function App() {
  const client = useMemo(() => new WorkbenchClient(new CoreRpc(location.origin)), [])
  const state = useAtomValue(client.state, { store: client.store })
  const [route, setRoute] = useState(() => parseRoute(location.pathname))
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)
  const [transfer, setTransfer] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [connection, setConnection] = useState(false)
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [filter, setFilter] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [linkNotice, setLinkNotice] = useState('')
  const [notice, setNotice] = useState('')
  const { appearance, setAppearance, saveError } = useAppearance()
  const drawerAction = useRef<(() => void) | undefined>()
  const selected = state.sessions.find(session => session.id === route.sessionId && session.workspaceId === route.workspaceId)
  const modalOpen = palette || help || connection || transfer || mobileNav || contextOpen
  const navigate = useCallback((path: string) => { history.pushState({}, '', path); setRoute(parseRoute(path)); setMobileNav(false); setContextOpen(false); setLinkNotice('') }, [])
  useEffect(() => { const changed = () => setRoute(parseRoute(location.pathname)); window.addEventListener('popstate', changed); return () => window.removeEventListener('popstate', changed) }, [])
  useEffect(() => { void client.connect().catch(() => setConnection(true)); return () => client.disconnect() }, [client])
  useEffect(() => {
    if (state.status === 'disconnected' || state.status === 'connecting') return
    if (selected) void client.select(selected.id)
    else if (!route.sessionId && state.sessions[0] && route.view === 'sessions') navigate(sessionPath(state.sessions[0].workspaceId!, state.sessions[0].id))
    else if (route.view === 'sessions' && !selected) client.clearSelection()
  }, [client, selected?.id, route.sessionId, route.view, state.status, state.sessions.length, navigate])
  const openComposer = useCallback(() => { document.getElementById('composer')?.focus() }, [])
  const commands: PaletteCommand[] = [
    { id: 'approvals', label: '打开审批中心', hint: '⌘ ⇧ A', run: () => navigate('/approvals') },
    { id: 'compose', label: '聚焦消息输入', hint: '⌘ ⇧ L', run: openComposer },
    { id: 'context', label: '打开会话工作区', run: () => setContextOpen(true) },
    { id: 'focus', label: focused ? '退出专注模式' : '进入专注模式', run: () => setFocused(value => !value) },
    { id: 'settings', label: '外观与连接设置', run: () => navigate('/settings') },
    { id: 'shortcuts', label: '查看快捷键', hint: '⌘ /', run: () => setHelp(true) },
    ...state.sessions.map(session => ({ id: `session-${session.id}`, label: session.title || session.id, hint: session.workspaceId, run: () => navigate(sessionPath(session.workspaceId!, session.id)) })),
  ]
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return
      const modifier = event.metaKey || event.ctrlKey
      if (modalOpen) { if (palette && modifier && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(false) }; return }
      if (modifier && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(true) }
      if (modifier && event.key === '/') { event.preventDefault(); setHelp(true) }
      if (modifier && event.shiftKey && event.key.toLowerCase() === 'a') { event.preventDefault(); navigate('/approvals') }
      if (modifier && event.shiftKey && event.key.toLowerCase() === 'l') { event.preventDefault(); openComposer() }
      if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); const index = state.sessions.findIndex(session => session.id === route.sessionId), next = state.sessions[index + (event.key === 'ArrowDown' ? 1 : -1)]
        if (next) navigate(sessionPath(next.workspaceId!, next.id))
      }
    }
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown)
  }, [state.sessions, route.sessionId, navigate, openComposer, modalOpen, palette])
  const showFailure = (error: unknown) => setNotice(error instanceof Error ? error.message : '操作未完成，请重试')
  const connect = async () => { setConnecting(true); try { await client.connect(token); setToken(''); setConnection(false) } catch (error) { showFailure(error) } finally { setConnecting(false) } }
  const afterDrawer = (action: () => void) => {
    if (mobileNav || contextOpen) { drawerAction.current = action; setMobileNav(false); setContextOpen(false) }
    else action()
  }
  const drawerClosed = () => { const action = drawerAction.current; drawerAction.current = undefined; if (action) requestAnimationFrame(action) }
  const connectionLabel = ({ online: '已连接电脑', connecting: '正在连接…', reconnecting: '正在恢复连接…', disconnected: '未连接' })[state.status]
  const navigation = <Navigation
    sessions={state.sessions}
    selected={selected}
    view={route.view}
    status={state.status}
    version={state.host?.version}
    approvalCount={state.approvals.length}
    runningId={state.conversation.running ? state.selected : undefined}
    filter={filter}
    setFilter={setFilter}
    navigate={navigate}
    connectionLabel={connectionLabel}
    openPalette={() => afterDrawer(() => setPalette(true))}
    openHelp={() => afterDrawer(() => setHelp(true))}
    openConnection={() => afterDrawer(() => setConnection(true))} />
  const copyLink = () => {
    if (!selected) return
    void navigator.clipboard.writeText(location.origin + sessionPath(selected.workspaceId!, selected.id)).then(() => setLinkNotice('会话链接已复制'), () => setLinkNotice('无法复制，请从地址栏复制链接'))
  }
  const context = <SessionContext
    state={state}
    session={selected}
    client={client}
    transfer={() => afterDrawer(() => setTransfer(true))}
    copyLink={copyLink}
    linkNotice={linkNotice}
    locatePlan={() => afterDrawer(() => {
      const blocks = client.store.get(client.state).conversation.blocks
      const plan = blocks.findLast(block => block.kind === 'plan')
      const target = Array.from(document.querySelectorAll<HTMLElement>('[data-plan-id]')).find(element => element.dataset.planId === plan?.id)
      target?.scrollIntoView({ block: 'center', behavior: 'instant' }); target?.focus()
    })} />
  const showNav = !focused && !appearance.sidebarCollapsed
  const showContext = !focused && !appearance.panelCollapsed && route.view === 'sessions'
  const actions = <div className="workspace-actions" aria-label="工作台布局与操作">
    <button
      className="icon-button nav-toggle"
      aria-label="打开导航"
      aria-expanded={mobileNav}
      onClick={() => setMobileNav(true)}><Menu size={18} aria-hidden="true" /></button>
    <button
      className="icon-button desktop-nav-toggle"
      aria-label={showNav ? '折叠导航' : '展开导航'}
      aria-pressed={showNav}
      onClick={() => { setFocused(false); setAppearance({ ...appearance, sidebarCollapsed: showNav }) }}><PanelLeft size={17} aria-hidden="true" /></button>
    <button className="icon-button" aria-label="打开命令面板" onClick={() => setPalette(true)}><Command size={17} aria-hidden="true" /></button>
    <button
      className="icon-button focus-toggle"
      aria-label={focused ? '退出专注模式' : '进入专注模式'}
      aria-pressed={focused}
      onClick={() => setFocused(value => !value)}><Focus size={17} aria-hidden="true" /></button>
    {route.view === 'sessions' && <>
      <button className="icon-button context-toggle" aria-label="打开会话工作区" onClick={() => setContextOpen(true)}><PanelRight size={17} aria-hidden="true" /></button>
      <button
        className="icon-button desktop-context-toggle"
        aria-label={showContext ? '折叠会话工作区' : '展开会话工作区'}
        aria-pressed={showContext}
        onClick={() => { setFocused(false); setAppearance({ ...appearance, panelCollapsed: showContext }) }}><PanelRight size={17} aria-hidden="true" /></button>
    </>}
  </div>
  return <>
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <WorkbenchFrame className={`web-workbench ${!showNav ? 'nav-collapsed' : ''} ${!showContext ? 'context-collapsed' : ''}`} navigation={navigation} workspace={<aside className="context-panel" aria-label="会话工作区">
      <header><h2>工作区</h2><span className="muted">进展与操作</span></header>{context}
    </aside>}>
        {(state.error || notice) && <div className="error-banner" role="alert">
          <span>{state.error || notice}</span>
          <button onClick={() => { setNotice(''); void client.refresh().catch(showFailure) }}>刷新</button>
        </div>}
        {route.sessionId && !selected && state.status === 'online' && <div className="error-banner" role="alert">深链中的会话不存在或不在此项目授权范围内。</div>}
        {route.view !== 'sessions' && <header className="page-toolbar">
          <span>Tervell / {route.view === 'approvals' ? '需要你' : '偏好设置'}
          </span>{actions}
        </header>}
        {route.view === 'sessions' ? <ConversationView
          state={state}
          client={client}
          session={selected}
          actions={actions}
          draft={selected ? drafts[selected.id] ?? '' : ''}
          setDraft={(text, expected) => { if (selected) setDrafts(current => expected !== undefined && current[selected.id] !== expected ? current : ({ ...current, [selected.id]: text })) }} />
          : route.view === 'approvals' ? <main id="main-content" tabIndex={-1} className="page-content">
            <div className="eyebrow">需要你</div>
            <h1>审批中心
              <span className="count">{state.approvals.length}</span>
            </h1>
            <p className="muted">核对具体操作，再选择批准范围。所有设备共享同一审批结果。</p>{state.approvals.map(approval => <SessionApproval
              key={approval.id}
              approval={approval}
              state={state}
              client={client} />)}{!state.approvals.length && <div className="empty">
                <ShieldCheck size={30} aria-hidden="true" />
                <h2>目前没有待审批操作</h2>
                <p>Agent 需要确认时，会在这里等待你。</p>
              </div>}
          </main>
            : <SettingsPage
              appearance={appearance}
              change={setAppearance}
              connectionLabel={connectionLabel}
              openConnection={() => setConnection(true)}
              disconnect={() => { client.disconnect(); setDrafts({}); navigate('/settings') }}
              saveError={saveError} />}
    </WorkbenchFrame>
    <WorkbenchDialog
      variant="navigation"
      open={mobileNav}
      onOpenChange={setMobileNav}
      onClosed={drawerClosed}
      title="主导航"
      description="选择项目、会话或打开工作台设置。">{navigation}</WorkbenchDialog>
    <WorkbenchDialog
      variant="context"
      open={contextOpen}
      onOpenChange={setContextOpen}
      onClosed={drawerClosed}
      title="会话工作区"
      description="查看计划、处理审批和管理会话输入权。">{context}</WorkbenchDialog>
    <CommandPalette open={palette} close={() => setPalette(false)} commands={commands} />
    <WorkbenchDialog
      open={help}
      onOpenChange={setHelp}
      title="键盘快捷键"
      description="Mac 使用 ⌘，其他系统使用 Ctrl。审批只在明确聚焦的按钮上确认。"><dl className="shortcuts">{shortcuts.map(([key, label]) => <div key={key}>
        <dt>{label}</dt>
        <dd><kbd>{key}</kbd></dd>
      </div>)}</dl></WorkbenchDialog>
    <WorkbenchDialog
      open={connection}
      onOpenChange={setConnection}
      title="连接你的电脑"
      description="本机可直接连接；其他设备请使用电脑签发的 Web 设备凭据。"><form onSubmit={event => { event.preventDefault(); void connect() }}>
        <label htmlFor="device-token">Web 设备凭据</label>
        <input
          id="device-token"
          type="password"
          autoComplete="off"
          value={token}
          onChange={event => setToken(event.target.value)}
          placeholder="本机连接可留空" />{state.error && <p role="alert">{state.error}</p>}
        <button className="primary" disabled={connecting}>{connecting ? '连接中…' : '连接'}</button>
      </form></WorkbenchDialog>
    <WorkbenchDialog
      open={transfer}
      onOpenChange={value => { if (!transferring) setTransfer(value) }}
      title="接管此会话的输入？"
      description="这会中止另一设备的当前运行并取消其排队消息，再将输入权交给当前浏览器。">
      <div className="button-row">
        <button disabled={transferring} onClick={() => setTransfer(false)}>取消</button>
        <button className="primary" disabled={transferring} onClick={() => { setTransferring(true); void client.transfer().then(() => setTransfer(false), showFailure).finally(() => setTransferring(false)) }}>{transferring ? '正在接管…' : '确认接管'}</button>
      </div>{state.error && <p role="alert">{state.error}</p>}
    </WorkbenchDialog>
  </>
}
