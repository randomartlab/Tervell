import * as React from 'react'
import { buildNewSkillContent } from '@proma/shared/utils'
import type { SkillMeta } from '@proma/shared'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useCapabilityDraftGuard } from '@/hooks/useCapabilityDraftGuard'
import { Button } from '@/components/ui/button'
import { SettingsInput, SettingsTextarea } from '@/components/settings/primitives'

interface CreateSkillDialogProps {
  open: boolean
  workspaceSlug: string
  onOpenChange: (open: boolean) => void
  onCreated: (skill: SkillMeta) => void
}
export function CreateSkillDialog({ open, workspaceSlug, onOpenChange, onCreated }: CreateSkillDialogProps): React.ReactElement {
  const [slug, setSlug] = React.useState('')
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [body, setBody] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [discard, setDiscard] = React.useState(false)
  const inFlight = React.useRef(false)
  const scope = React.useRef({ workspaceSlug, open })
  scope.current = { workspaceSlug, open }
  const errorRef = React.useRef<HTMLDivElement>(null)
  const dirty = Boolean(slug || name || description || body)
  useCapabilityDraftGuard(open && (dirty || saving))
  React.useEffect(() => {
    if (!open) { setSlug(''); setName(''); setDescription(''); setBody(''); setError(''); setDiscard(false) }
  }, [open])
  const close = (next: boolean) => {
    if (saving) return
    if (!next && dirty) setDiscard(true)
    else onOpenChange(next)
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (inFlight.current) return
    const target = workspaceSlug
    const input = { slug: slug.trim(), name, description, body }
    try {
      buildNewSkillContent(input)
      inFlight.current = true; setSaving(true); setError('')
      const skill = await window.electronAPI.createWorkspaceSkill(target, input)
      if (scope.current.workspaceSlug !== target || !scope.current.open) return
      onCreated(skill); onOpenChange(false)
    } catch (failure) {
      if (scope.current.workspaceSlug !== target || !scope.current.open) return
      setError(failure instanceof Error ? failure.message : '创建技能失败，请重试。')
      requestAnimationFrame(() => errorRef.current?.focus())
    } finally { inFlight.current = false; setSaving(false) }
  }
  return <><Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>新建项目技能</DialogTitle><DialogDescription>技能只保存在当前项目，创建后默认关闭。检查指令后可在技能详情中启用。</DialogDescription></DialogHeader>
    <form onSubmit={event => void save(event)}>
      {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mb-3 rounded-md bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      <SettingsInput label="技能标识" description="小写字母、数字或连字符，创建后用作技能目录名称。" value={slug} onChange={setSlug} placeholder="例如 research-notes" required disabled={saving}/>
      <SettingsInput label="技能名称" value={name} onChange={setName} placeholder="例如 研究笔记整理" required disabled={saving}/>
      <SettingsInput label="用途说明" value={description} onChange={setDescription} placeholder="说明何时使用这项技能" required disabled={saving}/>
      <SettingsTextarea label="技能指令" description="写清目标、执行步骤、输出要求与边界。" value={body} onChange={setBody} minHeight={180} disabled={saving}/>
      <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => close(false)}>取消</Button><Button type="submit" disabled={saving}>{saving ? '正在创建…' : '创建技能草稿'}</Button></div>
    </form>
  </DialogContent></Dialog>
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title="放弃技能草稿？" description="尚未创建的内容会丢失，已安装的技能不会受到影响。" confirmLabel="放弃草稿" onConfirm={() => { setDiscard(false); onOpenChange(false) }}/>
  </>
}
