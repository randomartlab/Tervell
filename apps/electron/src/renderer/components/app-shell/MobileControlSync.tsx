import { useEffect } from 'react'
import { useStore } from 'jotai'
import { agentSessionsAtom, agentWorkspacesAtom, agentSessionMessageQueueAtom, workspaceCapabilitiesVersionAtom, workspaceFilesVersionAtom, workspaceGitDiffRefreshVersionAtom } from '@/atoms/agent-atoms'
import { longTextPasteAsAttachmentEnabledAtom, richTextRenderingEnabledAtom } from '@/atoms/ui-preferences'
import { notificationsEnabledAtom } from '@/atoms/notifications'
import { createAgentQueuedMessage } from '@/lib/agent-message-queue'
import {typographyAtom,applyTypography} from '@/atoms/typography'
import {normalizeTypography} from '@proma/shared'
import {channelsAtom,channelsLoadedAtom,conversationsAtom,chatMessageRefreshAtom} from '@/atoms/chat-atoms'
import {vaultRefreshTokenAtom} from '@/atoms/vault-atoms'
import {promptConfigAtom} from '@/atoms/system-prompt-atoms'
import {loadAnnotations} from '@/components/selection/annotation-store'
import {agentMessageRefreshAtom} from '@/atoms/agent-atoms'
import { toast } from 'sonner'

/** 手机改动只触发已有安全读取；不把控制表单或账号秘密广播给界面。 */
export function MobileControlSync(): null {
  const store = useStore()
  useEffect(() => {
    let alive = true
    const revisions = new Map<string, number>()
    const refresh = async (change: { operation: string; sessionId?: string }) => {
      if(change.operation==='annotations.mobile-write')await loadAnnotations(store)
      if(change.operation==='session.rewind'&&change.sessionId)store.set(agentMessageRefreshAtom,previous=>{const next=new Map(previous);next.set(change.sessionId!, (next.get(change.sessionId!)??0)+1);return next})
      const key = change.operation.startsWith('channels.')?'channels':change.operation.startsWith('vault.')?'vault':change.operation.startsWith('chat.')?'chat':change.operation.startsWith('prompts.')?'prompts':(change.operation.startsWith('queue.')||change.operation==='session.queue') ? 'queue:' + change.sessionId : ['settings.save','display.save'].includes(change.operation) ? 'settings' : 'projects'
      const current = (revisions.get(key) ?? 0) + 1
      revisions.set(key, current)
      if (/^(?:session\.|sessions\.|worktrees\.|workspace\.)/.test(change.operation)) {
        const [sessions, workspaces] = await Promise.all([window.electronAPI.listAgentSessions(), window.electronAPI.listAgentWorkspaces()])
        if (!alive || current !== revisions.get(key)) return
        store.set(agentSessionsAtom, previous => sessions.map(session => {
          const existing = previous.find(item => item.id === session.id)
          return existing && existing.updatedAt > session.updatedAt ? existing : session
        }))
        store.set(agentWorkspacesAtom, workspaces)
      }
      if(change.operation.startsWith('channels.')){
        const channels=await window.electronAPI.listChannels()
        if(!alive||current!==revisions.get(key))return
        store.set(channelsAtom,channels);store.set(channelsLoadedAtom,true)
      }
      if(change.operation.startsWith('vault.'))store.set(vaultRefreshTokenAtom,value=>value+1)
      if(change.operation.startsWith('chat.')){
        const rows=await window.electronAPI.listConversations()
        if(!alive||current!==revisions.get(key))return
        store.set(conversationsAtom,rows)
        store.set(chatMessageRefreshAtom,previous=>{const next=new Map(previous);for(const row of rows)next.set(row.id,(next.get(row.id)??0)+1);return next})
      }
      if(change.operation.startsWith('prompts.')){
        const config=await window.electronAPI.getSystemPromptConfig()
        if(!alive||current!==revisions.get(key))return
        store.set(promptConfigAtom,config)
      }
      if ((change.operation.startsWith('queue.')||change.operation==='session.queue') && change.sessionId) {
        const id = change.sessionId, snapshots = await window.electronAPI.getQueuedAgentMessages(id)
        if (!alive || current !== revisions.get(key)) return
        store.set(agentSessionMessageQueueAtom, previous => {
          const next = new Map(previous), existing = previous.get(id) ?? []
          next.set(id, snapshots.map(({ input, queuedAt }) => existing.find(item => item.id === input.queueMessageId) ?? createAgentQueuedMessage(input.rawUserMessage ?? input.userMessage, input.queueMessageId, queuedAt, null, { additionalDirectories: input.additionalDirectories })))
          return next
        })
      }
      if (/^(?:skills\.|mcp\.|memory\.)/.test(change.operation)) store.set(workspaceCapabilitiesVersionAtom, value => value + 1)
      if (/^(?:files\.|project\.|worktrees\.)/.test(change.operation)) {
        store.set(workspaceFilesVersionAtom, value => value + 1)
        store.set(workspaceGitDiffRefreshVersionAtom, value => value + 1)
      }
      if (['settings.save','display.save'].includes(change.operation)) {
        const settings = await window.electronAPI.getSettings()
        if (!alive || current !== revisions.get(key)) return
        store.set(longTextPasteAsAttachmentEnabledAtom, settings.longTextPasteAsAttachmentEnabled ?? false)
        store.set(richTextRenderingEnabledAtom, settings.richTextRenderingEnabled ?? false)
        store.set(notificationsEnabledAtom, settings.notificationsEnabled ?? true)
        const typography=normalizeTypography(settings.typography);store.set(typographyAtom,typography);applyTypography(typography)
      }
    }
    const unsubscribe = window.electronAPI.onRemoteControlChanged(change => {
      void refresh(change).catch(() => toast.error('手机改动已保存，电脑界面同步失败，请刷新当前页面'))
    })
    return () => { alive = false; unsubscribe() }
  }, [store])
  return null
}
