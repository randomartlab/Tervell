import { useState } from 'react'
import { conversationTurns, timelineGroups } from '@proma/client'
import type { ConversationBlock } from '@proma/client'
import { ConversationItem } from './index.tsx'

export function ConversationTimeline({ blocks, onQuote, onCopy }: { blocks: ConversationBlock[]; onQuote: (text: string) => void; onCopy?: (text: string) => Promise<void> }) {
  const [notice, setNotice] = useState('')
  const copy = async (text: string) => {
    try { await (onCopy ? onCopy(text) : navigator.clipboard.writeText(text)); setNotice('消息原文已复制') }
    catch { setNotice('无法复制，请选择正文后复制') }
  }
  return <><div className="timeline-notice" role="status">{notice}</div>{conversationTurns(blocks).map((turn, index) => <section className="conversation-turn" key={`${turn.id}:${index}`} aria-label={`第 ${index + 1} 轮协作`}>
    <div className="turn-label">第 {index + 1} 轮</div>
    {timelineGroups(turn.blocks).map(group => {
      if (group.kind === 'tools' && group.blocks.length > 1) {
        const failed = group.blocks.some(block => block.status === 'failed')
        const running = group.blocks.some(block => block.status === 'running')
        return <details className={`tool-group ${failed ? 'has-failure' : ''}`} key={group.id}><summary>{group.blocks.length} 项工具操作 <span>{running ? '进行中' : failed ? '包含失败，请检查' : '查看执行记录'}</span></summary>{group.blocks.map(block => <div data-block-id={block.id} key={block.id}><ConversationItem block={block}/></div>)}</details>
      }
      const block = group.blocks[0]!
      const message = block.kind === 'text' && (block.role === 'assistant' || block.role === 'user')
      return <div className="timeline-block" data-block-id={block.id} key={block.id}>
        <ConversationItem block={block}/>
        {message && <div className="message-actions" aria-label={block.role === 'user' ? '你的消息操作' : '助手消息操作'}><button type="button" onClick={() => void copy(block.text)}>复制消息</button><button type="button" onClick={() => onQuote(block.text)}>引用到输入框</button></div>}
      </div>
    })}
  </section>)}</>
}
