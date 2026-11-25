import * as React from 'react'
import {useStore} from 'jotai'
import {Split} from 'lucide-react'
import {toast} from 'sonner'
import type {AgentSessionMeta} from '@proma/shared'
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Button} from '@/components/ui/button'
import {useMessageSessionId} from '@/components/ai-elements/message'
import {agentSessionsAtom,agentWorkspacesAtom,agentSessionDraftsAtom,agentSessionDraftSyncVersionsAtom} from '@/atoms/agent-atoms'
import {useOpenSession} from '@/hooks/useOpenSession'
export function QuickForkMenu({uuid,onExplore}:{uuid:string;onExplore?:()=>void}):React.ReactElement|null {
 const id=useMessageSessionId(),store=useStore(),openSession=useOpenSession(),[busy,setBusy]=React.useState(false)
 if(!id||id.startsWith('chat:'))return null
 const fork=async(target:'tab'|'workspace')=>{setBusy(true);try{const result=await window.electronAPI.builtinFeatureCall('history.fork',{sourceId:id,upTo:uuid,target})as {session:AgentSessionMeta;native:boolean;marker?:string}|null;if(!result)return;const {session}=result;store.set(agentSessionsAtom,all=>[session,...all.filter(s=>s.id!==session.id)]);store.set(agentWorkspacesAtom,await window.electronAPI.listAgentWorkspaces());if(result.marker){store.set(agentSessionDraftsAtom,all=>new Map(all).set(session.id,result.marker!));store.set(agentSessionDraftSyncVersionsAtom,all=>new Map(all).set(session.id,(all.get(session.id)??0)+1))}openSession('agent',session.id,session.title,{keepExistingTabs:true});toast.success(result.native?'已从此处分叉，保留原生上下文':'已创建分叉，历史已放入输入区',{description:result.native?undefined:'当前内核以历史上下文续聊；源会话保持完整。'})}catch(e){toast.error('分叉失败',{description:String(e)})}finally{setBusy(false)}}
 return <DropdownMenu><DropdownMenuTrigger asChild><Button data-testid="quick-fork" size="icon-sm" variant="ghost" aria-label="从此处分叉会话" title="从此处分叉会话" disabled={busy}><Split className="size-3.5"/></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onSelect={()=>void fork('tab')}>分叉到新标签页</DropdownMenuItem><DropdownMenuItem onSelect={()=>void fork('workspace')}>分叉到新工作区…</DropdownMenuItem>{onExplore&&<DropdownMenuItem onSelect={onExplore}>在右侧探索分支</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
}
