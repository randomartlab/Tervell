import { test, expect } from 'bun:test'
import { geminiCliDialect } from './gemini-cli.ts'
import { AcpEventMapper } from '../mapper.ts'
test('Given Gemini retry/reset When 累计流重开 Then final只含恢复后文本', () => {
  const mapper = new AcpEventMapper('r1', geminiCliDialect)
  mapper.update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '失败' } })
  expect(mapper.update({ sessionUpdate: 'agent_message_chunk', _meta: { reset: true, retry: true }, content: { type: 'text', text: '恢复' } })).toEqual([])
  expect(mapper.finish({ stopReason: 'end_turn' })[0]).toMatchObject({ t: 'message.final', message: { content: [{ type: 'text', text: '恢复' }] } })
})

test('Given 非法retry/reset内容 When 校验失败 Then 不破坏先前可恢复文本', () => {
  const mapper = new AcpEventMapper('r1', geminiCliDialect)
  mapper.update({ sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '已有输出' } })
  expect(mapper.update({ sessionUpdate: 'agent_message_chunk', _meta: { reset: true, retry: true }, content: { type: 'image', data: 'unsupported' } })[0]).toMatchObject({ t: 'error' })
  expect(mapper.finish({ stopReason: 'end_turn' })[0]).toMatchObject({ t: 'message.final', message: { content: [{ type: 'text', text: '已有输出' }] } })
})
