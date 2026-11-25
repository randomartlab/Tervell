import { expect, test } from 'bun:test'
import { conversationTurns, timelineGroups, quoteMessage } from './timeline.ts'
import type { ConversationBlock } from './conversation.ts'
const block = (id: string, kind: ConversationBlock['kind'], turnId = 'one'): ConversationBlock => ({ id, kind, turnId, role: 'assistant', text: id, runId: 'run', startSeq: 1, endSeq: 1 })
test('Given 连续工具、计划与多轮消息 When 分组 Then 不重排原始事件也不跨轮合并工具', () => {
  const source = [block('text','text'), block('a','tool'), block('b','tool'), block('plan','plan'), block('c','tool'), block('d','tool','two')]
  const snapshot = JSON.stringify(source), turns = conversationTurns(source)
  expect(turns).toHaveLength(2)
  const groups = timelineGroups(turns[0]!.blocks)
  expect(groups.map(group => [group.kind,group.blocks.length])).toEqual([['block',1],['tools',2],['block',1],['tools',1]])
  expect(groups.flatMap(group => group.blocks.map(item => item.id))).toEqual(['text','a','b','plan','c'])
  expect(JSON.stringify(source)).toBe(snapshot)
  expect(quoteMessage('第一行\n\n第二行')).toBe('> 第一行\n> \n> 第二行\n\n')
})
