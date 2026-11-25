import { test, expect } from 'bun:test'
import { ACP_DIALECTS, acpDialect, readSessionCatalog } from './index.ts'
import { AcpEventMapper } from '../mapper.ts'

test('Given 首批方言与Grok模型发现扩展 When 查询 Then 配置明确且未知id拒绝', () => {
  expect(ACP_DIALECTS.map((item) => item.id)).toEqual(['claude-code', 'gemini-cli', 'opencode-1', 'opencode-2', 'cursor-agent', 'omp', 'codex','grok'])
  expect(() => acpDialect('unknown')).toThrow('未注册')
})
for (const [id, scope] of [['claude-code', 'turn'], ['gemini-cli', 'turn'], ['omp', 'turn']]) test(`Given ${id}promptUsage When 归一 Then scope=${scope}不混算`, () => {
  const events = new AcpEventMapper('r1', acpDialect(id!)).finish({ stopReason: 'end_turn', usage: { inputTokens: 3, outputTokens: 4 } })
  expect(events[0]).toMatchObject({ t: 'usage', usage: { inputTokens: 3, outputTokens: 4, tokenScope: scope } })
})
for (const id of ['opencode-1', 'opencode-2']) test(`Given ${id}metadata命令结果 When 归一 Then stdout/exitCode取实际值不覆盖已有值`, () => {
  const dialect = acpDialect(id)
  expect(dialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { metadata: { output: '真实输出', exit: 7 } } })).toMatchObject({ rawOutput: { stdout: '真实输出', exitCode: 7 } })
  expect(dialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { stdout: '原字段', exitCode: 3, metadata: { output: '次级', exit: 0 } } })).toMatchObject({ rawOutput: { stdout: '原字段', exitCode: 3 } })
})
test('Given OMP后台工具无退出码 When 归一 Then 不伪造exitCode0', () => {
  const result = acpDialect('omp').normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', rawOutput: { content: [{ type: 'text', text: '服务启动' }], details: { async: true } } })
  expect(result).toMatchObject({ rawOutput: { stdout: '服务启动' } }); expect(JSON.stringify(result)).not.toContain('exitCode')
})
test('Given 新旧ACP模型目录 When 读取 Then 去重保留复合modelId且不切换默认模型', () => {
  expect(readSessionCatalog({ models: { currentModelId: 'p/m', availableModels: [{ modelId: 'p/m', name: 'M' }] } })).toEqual({ models: [{ id: 'p/m', name: 'M' }], currentModelId: 'p/m' })
  expect(readSessionCatalog({ configOptions: [{ id: 'model', currentValue: 'p/m/high', options: [{ name: 'P', options: [{ value: 'p/m/high', name: 'High' }, { value: 'p/m/high', name: 'Duplicate' }] }] }] }).models).toEqual([{ id: 'p/m/high', name: 'High' }])
})
test('Given Cursor模型目录/新文件diff/问题和计划 When 解释 Then 显式选项且绝不自动接受', () => {
  const dialect = acpDialect('cursor-agent')
  expect(dialect.catalog?.read({ models: [{ value: 'm1', name: 'M', configOptions: [] }] }).currentModelId).toBeNull()
  expect(() => dialect.catalog?.read({ models: [] })).toThrow('为空')
  expect(dialect.normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', content: [{ type: 'diff', oldText: '-- /dev/null', newText: '++ b/a.txt\n正文' }] })).toMatchObject({ content: [{ type: 'diff', oldText: null, newText: '正文' }] })
  const question = dialect.interaction?.('cursor/ask_question', { questions: [{ id: 'q1', prompt: '颜色', options: [{ id: 'red', label: '红' }], allowMultiple: false }] })!
  expect(question.reply(null)).toEqual({ outcome: { outcome: 'cancelled' } }); expect(question.reply('red')).toEqual({ outcome: { outcome: 'answered', answers: [{ questionId: 'q1', selectedOptionIds: ['red'] }] } })
  expect(() => dialect.interaction?.('cursor/ask_question', { questions: [{ id: 'q', prompt: 'x', allowMultiple: true, options: [{ id: 'a', label: 'A' }] }] })).toThrow('不支持')
  const plan = dialect.interaction?.('cursor/create_plan', { plan: '计划正文' })!
  expect(plan.reply(null)).toEqual({ outcome: { outcome: 'cancelled' } }); expect(plan.reply('save')).toEqual({ outcome: { outcome: 'accepted' } })
})

test('Given Gemini明确reset/retry When 新输出重启 Then 不把失败片段与新文本拼接', () => {
  const mapper = new AcpEventMapper('r1', acpDialect('gemini-cli'))
  mapper.update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '失败残片' } })
  expect(mapper.update({ sessionUpdate: 'agent_message_chunk', _meta: { retry: true, reset: true }, content: { type: 'text', text: '恢复后' } })).toEqual([])
  expect(mapper.update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '完整回答' } })).toEqual([])
  expect(mapper.finish({ stopReason: 'end_turn' })[0]).toMatchObject({ t: 'message.final', message: { content: [{ type: 'text', text: '恢复后完整回答' }] } })
})

test('Given promptUsage非法 When 归一 Then 仍保留已flush的final且seq无洞', () => {
  const mapper = new AcpEventMapper('r1', acpDialect('omp'))
  mapper.update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '已有文本' } })
  const result = mapper.finish({ stopReason: 'end_turn', usage: { inputTokens: -1 } })
  expect(result.map((event) => event.t)).toEqual(['message.final', 'error', 'done'])
  expect(result.map((event) => event.seq)).toEqual([2, 3, 4])
})

test('Given Codex只上报context使用量 When 归一 Then 不猜测input/output token或cost', () => {
  const mapper = new AcpEventMapper('r1', acpDialect('codex'))
  const events = [...mapper.update({ sessionUpdate: 'usage_update', used: 50, size: 100 }), ...mapper.finish({ stopReason: 'end_turn', usage: { inputTokens: 1, outputTokens: 2 } })]
  const usage = events.find((event) => event.t === 'usage')!
  expect(usage.usage).toEqual({ contextTokens: 50, contextWindow: 100 }); expect(events.filter((event) => event.t === 'usage')).toHaveLength(1)
})

test('Given 递归模型目录/重复Cursor选项 When 解释 Then 拒绝而非无限递归或选项歧义', () => {
  let options: unknown[] = [{ value: 'm1', name: 'M' }]
  for (let index = 0; index < 10; index++) options = [{ name: 'group', options }]
  expect(() => readSessionCatalog({ configOptions: [{ category: 'model', options }] })).toThrow('嵌套')
  expect(() => acpDialect('cursor-agent').interaction?.('cursor/ask_question', { questions: [{ id: 'q1', prompt: 'x', options: [{ id: 'same', label: 'A' }, { id: 'same', label: 'B' }] }] })).toThrow('无效')
})

test('Given OMP真实报告非零退出码 When 转换 Then 不以completed状态伪造成功退出', () => {
  expect(acpDialect('omp').normalizeUpdate?.({ sessionUpdate: 'tool_call_update', toolCallId: 't', status: 'completed', rawOutput: { content: [{ type: 'text', text: '命令失败' }], details: { exitCode: 7, wallTimeMs: 2 } } })).toMatchObject({ rawOutput: { stdout: '命令失败', exitCode: 7 } })
})

test('Given Gemini reset同时改变messageId When 归一 Then 仍替换旧片段而非flush失败旧final', () => {
  const mapper = new AcpEventMapper('r1', acpDialect('gemini-cli'))
  mapper.update({ sessionUpdate: 'agent_message_chunk', messageId: 'before', content: { type: 'text', text: '失败' } })
  expect(mapper.update({ sessionUpdate: 'agent_message_chunk', messageId: 'after', _meta: { retry: true, reset: true }, content: { type: 'text', text: '成功' } })).toEqual([])
  expect(mapper.finish({ stopReason: 'end_turn' })[0]).toMatchObject({ t: 'message.final', message: { content: [{ type: 'text', text: '成功' }] } })
})
