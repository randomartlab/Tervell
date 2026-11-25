/**
 * ChatToolActivityIndicator - Chat 模式工具活动指示器
 *
 * 将 ChatToolActivity[] 的 start/result 事件合并后，
 * 使用 ChatToolBlock 渲染（ContentBlock 风格）。
 * 保持外部接口不变。
 */

import * as React from 'react'
import { ChatToolBlock } from './ChatToolBlock'
import type { ChatToolActivity } from '@proma/shared'
import {paseoToolDetail} from '@proma/shared'
import {PluginSemanticItem} from '@/components/plugins/native-timeline'

interface MergedActivity {
  toolName: string
  done: boolean
  isError?: boolean
  result?: string
  input: Record<string, unknown>
}

export function ChatToolActivityIndicator({
  activities,
  isStreaming = false,
  conversationId,
}: {
  activities: ChatToolActivity[]
  isStreaming?: boolean
  conversationId?:string
}): React.ReactElement | null {
  const merged = React.useMemo(() => {
    const map = new Map<string, MergedActivity>()
    for (const a of activities) {
      const existing = map.get(a.toolCallId)
      if (a.type === 'start') {
        map.set(a.toolCallId, {
          toolName: a.toolName,
          done: false,
          input: a.input ?? existing?.input ?? {},
        })
      } else if (a.type === 'result') {
        map.set(a.toolCallId, {
          toolName: existing?.toolName ?? a.toolName,
          done: true,
          isError: a.isError,
          result: a.result,
          input: a.input ?? existing?.input ?? {},
        })
      }
    }
    return Array.from(map.entries())
  }, [activities])

  if (merged.length === 0) return null

  return (
    <div className="space-y-0.5 mb-2">
      {merged.map(([callId, item], idx) => (
        <PluginSemanticItem key={callId} sessionId={conversationId?'chat:'+conversationId:undefined} id={callId} item={{type:'tool_call',callId,name:item.toolName,status:item.done?item.isError?'failed':'completed':'running',error:item.isError?item.result:null,detail:paseoToolDetail(item.toolName,item.input,item.result)}} streaming={isStreaming&&!item.done} fallback={<ChatToolBlock
          key={callId}
          toolName={item.toolName}
          input={item.input}
          result={item.result}
          isError={item.isError}
          isCompleted={item.done}
          animate={isStreaming}
          index={idx}
        />}/>
      ))}
    </div>
  )
}
