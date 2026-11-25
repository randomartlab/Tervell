import { test, expect } from 'bun:test'
import { cursorAgentDialect } from './cursor-agent.ts'
test('Given Cursor询问和计划 When 未选择 Then cancelled而非默认第一项', () => {
  const question = cursorAgentDialect.interaction?.('cursor/ask_question', { questions: [{ id: 'q', prompt: '选择', options: [{ id: 'a', label: 'A' }] }] })!
  expect(question.reply(null)).toEqual({ outcome: { outcome: 'cancelled' } })
  expect(question.reply('a')).toMatchObject({ outcome: { outcome: 'answered' } })
  expect(() => question.reply('bad')).toThrow()
  const plan = cursorAgentDialect.interaction?.('cursor/create_plan', { plan: '正文' })!
  expect(plan.reply(null)).toEqual({ outcome: { outcome: 'cancelled' } }); expect(plan.reply('save')).toEqual({ outcome: { outcome: 'accepted' } })
})
