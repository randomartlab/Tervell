import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { FolderOpen } from 'lucide-react'
import { capabilityDiscardRevisionAtom, settingsUnsavedChangesAtom } from '@/atoms/settings-tab'
import { useProjectActions } from '@/hooks/useProjectActions'
import { AgentSkillsView } from '@/components/agent-skills/AgentSkillsView'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'

/** 设置入口按项目复用能力中心；没有活动会话时也能管理已授权项目。 */
export function ProjectCapabilitySettings({ tab }: { tab: 'skills' | 'mcp' }): React.ReactElement {
  const { workspaces, currentWorkspaceId, selectProject, createProjectFromFolder } = useProjectActions()
  const dirty = useAtomValue(settingsUnsavedChangesAtom)
  const discard = useSetAtom(capabilityDiscardRevisionAtom)
  const [pendingProject, setPendingProject] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const id = React.useId()
  const select = (value: string) => {
    if (!value || value === currentWorkspaceId) return
    if (dirty) setPendingProject(value)
    else selectProject(value, { resetView: false })
  }
  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-5 py-3">
      <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-muted-foreground"><FolderOpen size={16} aria-hidden="true"/>管理项目</label>
      <select id={id} value={currentWorkspaceId ?? ''} onChange={event => select(event.target.value)} className="min-w-0 max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {!currentWorkspaceId && <option value="">选择项目</option>}{workspaces.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      {!workspaces.length && <Button type="button" variant="outline" disabled={creating} onClick={() => { setCreating(true); void createProjectFromFolder().finally(() => setCreating(false)) }}>{creating ? '正在打开…' : '选择本地项目文件夹'}</Button>}
    </div>
    <div className="min-h-0 flex-1"><AgentSkillsView key={`${currentWorkspaceId}:${tab}`} embedded componentTab={tab}/></div>
    <ConfirmDialog open={pendingProject !== null} onOpenChange={open => { if (!open) setPendingProject(null) }} title="放弃草稿并切换项目？" description="当前能力编辑器仍有未保存内容。已保存的配置不会撤销。" confirmLabel="放弃并切换" onConfirm={() => {
      if (pendingProject) { discard(value => value + 1); selectProject(pendingProject, { resetView: false }) }
      setPendingProject(null)
    }}/>
  </div>
}
