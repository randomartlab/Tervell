import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { applyServiceEvent, emptyConversation } from '@proma/client'
import type { KernelEvent } from '@proma/protocol'
import { ApprovalCard, ConversationItem } from './index.tsx'

test('Given 相同trace实时与整批回放 When 渲染共享组件 Then 语义颜色类、正文、工具状态逐字节一致', () => {
  const events: KernelEvent[] = [
    { t: 'message.delta', seq: 1, runId: 'run', text: '草稿', kind: 'text', index: 0 },
    { t: 'message.final', seq: 2, runId: 'run', message: { id: 'm1', role: 'assistant', content: [{ type: 'text', text: '**完成**\n\n<script>alert(1)</script>\n\n[安全](javascript:alert(1))' }], createdAt: 1 } },
    { t: 'tool.call', seq: 3, runId: 'run', call: { id: 'call', name: 'Read', kind: 'read', status: 'running' } },
    { t: 'tool.update', seq: 4, runId: 'run', callId: 'call', patch: { status: 'succeeded', result: '内容' } },
    { t: 'plan.update', seq: 5, runId: 'run', steps: [{ id: 'step', title: '验证', status: 'completed' }] },
    { t: 'done', seq: 6, runId: 'run', reason: 'stop' },
  ]
  const replay = () => {
    const state = events.reduce((current, event, index) => applyServiceEvent(current, { seq: index + 1, ts: 1, turnId: 'turn', event, truncated: false }), emptyConversation())
    return renderToStaticMarkup(<>{state.blocks.map(block => <ConversationItem key={block.id} block={block}/>)}</>)
  }
  const html = replay()
  expect(html).toBe(replay())
  expect(html).toContain('trace-succeeded')
  expect(html).toContain('trace-plan')
  expect(html).toContain('<strong>完成</strong>')
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('javascript:')
})
test('Given 审批只允许一次和拒绝 When 渲染卡片 Then 不伪造本会话授权能力', () => {
  const html = renderToStaticMarkup(<ApprovalCard approval={{ id: 'a1', sessionId: 's1', kind: 'edit', toolCallId: 'tool', request: '修改文件', createdAt: 1, allowedDecisions: ['allow', 'deny'] }} onRespond={async () => {}}/>)
  expect(html).toMatch(/disabled=""[^>]*>本会话允许/)
  expect(html).toContain('仅此一次')
  expect(html).toContain('拒绝')
})

test('Given 正在提交或已失败的审批 When 多处渲染 Then 全部动作禁用并展示真实状态', () => {
  const approval = { id: 'a', sessionId: 's', kind: 'edit' as const, toolCallId: 't', request: '修改 notes.md', createdAt: 1 }
  const pending = renderToStaticMarkup(<ApprovalCard approval={approval} pending onRespond={async () => {}}/>)
  expect(pending.match(/disabled=""/g)).toHaveLength(3)
  expect(pending).toContain('正在提交审批')
  const failed = renderToStaticMarkup(<ApprovalCard approval={approval} error="审批已由其他端处理" onRespond={async () => {}}/>)
  expect(failed).toContain('role="alert"')
  expect(failed).toContain('审批已由其他端处理')
  expect(failed).not.toContain('autofocus')
})

test('Given 有代码的消息和多工具轮次 When 渲染 Then 代码原文可提取且工具归组不隐藏失败', async () => {
  const { codeContent } = await import('./code.tsx')
  const { ConversationTimeline } = await import('./timeline.tsx')
  expect(codeContent(<code className="language-ts">{'const value = "复制";\n'}</code>)).toEqual({ text: 'const value = "复制";', language: 'ts' })
  const base = { turnId: 'turn', runId: 'run', role: 'assistant' as const, startSeq: 1, endSeq: 1 }
  const html = renderToStaticMarkup(<ConversationTimeline blocks={[
    { ...base, id: 'a', kind: 'tool', status: 'succeeded', title: 'Read', text: 'ok' },
    { ...base, id: 'b', kind: 'tool', status: 'failed', title: 'Write', text: 'failed' },
    { ...base, id: 'c', kind: 'text', text: '```ts\nconst value = 1;\n```' },
  ]} onQuote={() => {}}/>)
  expect(html).toContain('2 项工具操作')
  expect(html).toContain('包含失败，请检查')
  expect(html).toContain('复制代码')
  expect(html).toContain('引用到输入框')
  expect(html).toContain('const value = 1;')
})

test('Given 常用代码与不支持语言 When 懒加载高亮 Then 保留原始内容且主题切换产生不同颜色', async () => {
  const { highlightWorkbenchCode } = await import('./highlight.ts')
  const source = 'const n = "value";'
  const light = await highlightWorkbenchCode(source, 'typescript', 'github-light')
  const dark = await highlightWorkbenchCode(source, 'typescript', 'github-dark')
  expect(light.flat().map(token => token.content).join('')).toBe(source)
  expect(dark.flat().map(token => token.content).join('')).toBe(source)
  expect(light.flat().map(token => token.color)).not.toEqual(dark.flat().map(token => token.color))
  expect((await highlightWorkbenchCode(source, 'not-a-language', 'github-light')).flat().map(token => token.content).join('')).toBe(source)
})
