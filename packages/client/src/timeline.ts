import type { ConversationBlock } from './conversation.ts'

export interface ConversationTurn { id: string; blocks: ConversationBlock[] }
export interface TimelineGroup { id: string; kind: 'tools' | 'block'; blocks: ConversationBlock[] }

/** 分组只改变呈现，不改变 journal 顺序；不同轮次中相同工具名称也不能合并。 */
export function conversationTurns(blocks: readonly ConversationBlock[]): ConversationTurn[] {
  const turns: ConversationTurn[] = []
  for (const block of blocks) {
    let turn = turns.at(-1)
    if (!turn || turn.id !== block.turnId) { turn = { id: block.turnId, blocks: [] }; turns.push(turn) }
    turn.blocks.push(block)
  }
  return turns
}
export function timelineGroups(blocks: readonly ConversationBlock[]): TimelineGroup[] {
  const groups: TimelineGroup[] = []
  for (const block of blocks) {
    const previous = groups.at(-1)
    if (block.kind === 'tool' && previous?.kind === 'tools') previous.blocks.push(block)
    else groups.push({ id: block.id, kind: block.kind === 'tool' ? 'tools' : 'block', blocks: [block] })
  }
  return groups
}
export function quoteMessage(text: string): string {
  return `${text.split('\n').map(line => `> ${line}`).join('\n')}\n\n`
}
