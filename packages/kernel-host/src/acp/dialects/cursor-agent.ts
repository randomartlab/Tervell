import type { AcpDialect } from './types.ts'
import { array, record, json } from './types.ts'
import { readCursorCatalog } from './catalog.ts'

export const cursorAgentDialect: AcpDialect = {
  id: 'cursor-agent', clientMeta: { parameterizedModelPicker: true },
  sources: ['orca-src/src/main/acp/acp-dialects/cursor-dialect.ts', 'orca-src/src/main/acp/session/acp-structured-cursor.test.ts:2026.11.11'],
  catalog: { method: 'cursor/list_available_models', sessionless: true, read: readCursorCatalog },
  normalizeUpdate(value) {
    const update = record(value)
    if (!['tool_call', 'tool_call_update'].includes(String(update.sessionUpdate)) || !Array.isArray(update.content)) return value
    return json({ ...update, content: array(update.content).map((part) => {
      const block = record(part)
      return block.type === 'diff' && block.oldText === '-- /dev/null' && typeof block.newText === 'string'
        ? { ...block, oldText: null, newText: block.newText.replace(/^\+\+ b\/[^\n]*\n?/, '') } : part
    }) })
  },
  interaction(method, params) {
    const input = record(params)
    if (method === 'cursor/ask_question') {
      const questions = array(input.questions).map(record)
      if (questions.length !== 1 || questions[0]?.allowMultiple === true) throw new Error('当前产品响应契约仅支持单题单选；分组/多选明确不支持')
      const question = questions[0]!
      const choices = array(question.options).map(record)
      if (typeof question.id !== 'string' || !question.id || typeof question.prompt !== 'string' || !question.prompt || !choices.length || choices.length > 100 || new Set(choices.map((choice) => choice.id)).size !== choices.length || choices.some((choice) => typeof choice.id !== 'string' || !choice.id || typeof choice.label !== 'string' || !choice.label)) throw new Error('无效Cursor问题')
      return {
        toolCall: { toolCallId: String(input.toolCallId ?? 'cursor-question'), title: question.prompt, kind: 'other' },
        options: choices.map((choice) => ({ optionId: choice.id as string, name: choice.label as string, kind: 'allow_once' as const })),
        reply: (id) => {
          if (id !== null && !choices.some((choice) => choice.id === id)) throw new Error('Cursor答案不在选项中')
          return json(id === null ? { outcome: { outcome: 'cancelled' } } : { outcome: { outcome: 'answered', answers: [{ questionId: question.id as string, selectedOptionIds: [id] }] } })
        },
      }
    }
    if (method === 'cursor/create_plan') {
      const plan = typeof input.plan === 'string' ? input.plan : typeof input.overview === 'string' ? input.overview : undefined
      if (!plan) throw new Error('Cursor计划缺少正文')
      return { plan, toolCall: { toolCallId: String(input.toolCallId ?? 'cursor-plan'), title: '确认保存Cursor计划（不执行）', kind: 'other', rawInput: json({ plan }) },
        options: [{ optionId: 'save', name: '保存计划', kind: 'allow_once' }, { optionId: 'reject', name: '拒绝', kind: 'reject_once' }],
        reply: (id) => { if (id !== null && id !== 'save' && id !== 'reject') throw new Error('Cursor计划选项无效'); return { outcome: { outcome: id === 'save' ? 'accepted' : 'cancelled' } } },
      }
    }
    return undefined
  },
}
