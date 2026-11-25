import {PluginButtons,PluginPanelMenu} from '@/components/plugins/native-placements'
import {BuiltinExportButton} from '@/components/plugins/BuiltinExportButton'
/**
 * AgentHeader — Agent 会话头部
 *
 * 显示会话标题；通过标题下拉菜单进入重命名。
 */

import * as React from 'react'
import { WorkbenchHeading } from '@proma/ui/workbench/heading'
import '@proma/ui/workbench/heading.css'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Check, ChevronDown, PanelRight, Pencil, Split, X } from 'lucide-react'
import { agentSessionsAtom, agentWorkspacesAtom, agentSessionIndicatorMapAtom, agentSideTemporaryAgentMapAtom, agentDiffPanelTabAtom, currentSessionSidePanelOpenAtom, getExplorationSidePanelTab } from '@/atoms/agent-atoms'
import { tabsAtom, updateTabTitle } from '@/atoms/tab-atoms'
import { replaceAgentSessionInFreshnessOrder } from '@/lib/agent-session-list'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** AgentHeader 属性接口 */
interface AgentHeaderProps {
  sessionId: string
}

export function AgentHeader({ sessionId }: AgentHeaderProps): React.ReactElement | null {
  const sessions = useAtomValue(agentSessionsAtom)
  const workspaces = useAtomValue(agentWorkspacesAtom)
  const indicator = useAtomValue(agentSessionIndicatorMapAtom).get(sessionId) ?? 'idle'
  const session = sessions.find((s) => s.id === sessionId) ?? null
  const setAgentSessions = useSetAtom(agentSessionsAtom)
  const setTabs = useSetAtom(tabsAtom)
  const setSideTemporaryAgentMap = useSetAtom(agentSideTemporaryAgentMapAtom)
  const setSidePanelTabMap = useSetAtom(agentDiffPanelTabAtom)
  const [isRightPanelOpen, setRightPanelOpen] = useAtom(currentSessionSidePanelOpenAtom)
  const [editing, setEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const explorationBranches = React.useMemo(() => sessions
    .filter((item) => item.explorationParentSessionId === sessionId && item.explorationSourceMessageId)
    .sort((a, b) => b.updatedAt - a.updatedAt), [sessionId, sessions])

  const reopenExploration = React.useCallback((branch: typeof explorationBranches[number]): void => {
    const sourceMessageId = branch.explorationSourceMessageId
    if (!sourceMessageId) return
    setSideTemporaryAgentMap((prev) => {
      const openBranches = prev.get(sessionId) ?? []
      if (openBranches.some((item) => item.sessionId === branch.id)) return prev
      const next = new Map(prev)
      next.set(sessionId, [...openBranches, {
        sessionId: branch.id,
        sourceMessageId,
        sourceLabel: branch.explorationSourceLabel || '主线探索节点',
      }])
      return next
    })
    setRightPanelOpen(true)
    setSidePanelTabMap((prev) => new Map(prev).set(sessionId, getExplorationSidePanelTab(branch.id)))
  }, [sessionId, setRightPanelOpen, setSidePanelTabMap, setSideTemporaryAgentMap])

  if (!session) return null

  const project = workspaces.find(workspace => workspace.id === session.workspaceId)

  /** 进入编辑模式 */
  const startEdit = (): void => {
    setEditTitle(session.title)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  /** 保存标题 */
  const saveTitle = async (): Promise<void> => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === session.title) {
      setEditing(false)
      return
    }

    try {
      const updated = await window.electronAPI.updateAgentSessionTitle(session.id, trimmed)
      // 同步更新标签页标题
      setTabs((prev) => updateTabTitle(prev, updated.id, updated.title))
      // 同步更新侧边栏会话列表
      setAgentSessions((prev) => replaceAgentSessionInFreshnessOrder(prev, updated))
    } catch (error) {
      console.error('[AgentHeader] 更新标题失败:', error)
    }
    setEditing(false)
  }

  /** 键盘事件 */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveTitle()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  return (
    <WorkbenchHeading
      className="relative z-[51] titlebar-drag-region"
      breadcrumbs={<><span>{project?.name ?? '项目工作台'}</span><span aria-hidden="true">/</span><span>会话</span></>}
      status={{ kind: indicator === 'blocked' ? 'blocked' : indicator === 'running' ? 'running' : 'ready', label: indicator === 'blocked' ? '需要你确认' : indicator === 'running' ? '运行中' : indicator === 'completed' ? '已完成' : '就绪' }}
      title={<>
      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0 titlebar-no-drag">
          <input
            ref={inputRef}
            aria-label="会话标题"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveTitle}
            className="flex-1 bg-transparent text-[15px] font-normal border-b border-primary/50 outline-none px-0 py-0.5 min-w-0"
            maxLength={100}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={saveTitle}
            aria-label="保存会话标题"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setEditing(false)}
            aria-label="取消重命名"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <h1 className="min-w-0"><DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="titlebar-no-drag group flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/60"
              aria-label={`会话菜单：${session.title}`}
            >
              <span className="truncate text-lg font-semibold text-foreground">{session.title}</span>
              <ChevronDown className="size-3 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-[100] min-w-40 titlebar-no-drag">
            <DropdownMenuItem onSelect={startEdit}>
              <Pencil className="size-3.5" />
              重命名
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu></h1>
      )}
      </>}
      actions={<>
      <BuiltinExportButton id={sessionId} workspaceId={session.workspaceId}/>
      {explorationBranches.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="titlebar-no-drag inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-[0.96]"
              aria-label={`打开 ${explorationBranches.length} 个探索分支`}
              title={`打开探索分支（${explorationBranches.length}）`}
            >
              <Split className="size-3.5" />
              <span className="hidden sm:inline">探索</span>
              {explorationBranches.length > 1 && <span className="tabular-nums">{explorationBranches.length}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[100] w-64 titlebar-no-drag"
            // 选择或失焦关闭后不要把焦点回跳到「探索」触发器，避免出现残留 focus 框。
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            {explorationBranches.map((branch) => (
              <DropdownMenuItem key={branch.id} onSelect={() => reopenExploration(branch)} className="flex items-center gap-2 py-2">
                <Split className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate">{branch.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <PluginButtons placement="header" sessionId={sessionId}/><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label="添加工作区面板" title="添加工作区面板：导出、插件工具等" className="titlebar-no-drag inline-flex items-center gap-1 rounded p-2 text-xs hover:bg-muted"><span aria-hidden="true">+</span><span className="hidden sm:inline">面板</span></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="titlebar-no-drag"><PluginPanelMenu location="workspace" sessionId={sessionId}/></DropdownMenuContent></DropdownMenu>
      {!isRightPanelOpen && (
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          className="titlebar-no-drag ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-[0.96]"
          aria-label="展开右侧工作区"
        >
          <PanelRight className="size-4" />
        </button>
      )}
      </>}
    />
  )
}
