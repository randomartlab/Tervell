import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openCoreService } from '../packages/core-server/src/open.ts'
import type { AgentKernel } from '../packages/kernel-host/src/index.ts'
import { KernelCapabilitiesSchema, SessionSchema } from '../packages/protocol/src/index.ts'
import type { KernelEvent, KernelPromptInput, KernelSessionHandle } from '../packages/protocol/src/index.ts'

if (!process.argv.includes('--qa')) throw new Error('仅供 Web 验证：bun scripts/web-fixture.ts --qa；不会接入真实内核或桌面数据')
const directory = mkdtempSync(join(tmpdir(), 'proma-web-qa-'))
const project = join(directory, 'project'); mkdirSync(project)
class WebFixtureKernel implements AgentKernel {
  readonly id = 'scripted'
  readonly protocol = 'native' as const
  readonly capabilities = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null }, transport: 'in-process' })
  private finish?: () => void
  private answer = ''
  async createSession(input: { sessionId: string }) { return { kernelId: this.id, sessionId: input.sessionId, kernelSessionRef: input.sessionId } }
  async *prompt(_handle: KernelSessionHandle, input: KernelPromptInput, { signal }: { signal: AbortSignal }): AsyncIterable<KernelEvent> {
    let sequence = 0
    const position = () => ({ runId: input.runId, seq: ++sequence })
    yield { ...position(), t: 'plan.update', steps: [{ id: 'inspect', title: '核对会话与当前上下文', status: 'completed' }, { id: 'respond', title: '生成回复并同步到 Web', status: 'running' }] }
    if (input.text.includes('审批')) {
      const requestId = `approval_${input.runId}`
      const waiting = new Promise<void>(resolve => { this.finish = resolve; signal.addEventListener('abort', () => resolve(), { once: true }) })
      yield { ...position(), t: 'permission.request', req: { requestId, kind: 'edit', tool: 'Write', input: { path: 'notes.md', content: 'W9 浏览器验证' }, summary: '在验证目录写入 notes.md（脚本审批演示）', actions: [{ id: 'once', label: '仅此一次', behavior: 'allow' }, { id: 'session', label: '本会话允许', behavior: 'allow', variant: 'session' }, { id: 'deny', label: '拒绝', behavior: 'deny' }] } }
      await waiting
    }
    if (signal.aborted) throw new Error('验证运行已取消')
    const text = input.text.includes('审批') ? `审批结果已同步：${this.answer || '取消'}。这是验证脚本，没有修改项目文件。` : `已收到「${input.text}」。\n\n这条回复通过 **Core Service → WebSocket → Web** 流式传输。当前使用 scripted 验证内核。`
    for (let offset = 0; offset < text.length; offset += 12) {
      if (signal.aborted) throw new Error('验证运行已取消')
      yield { ...position(), t: 'message.delta', index: 0, kind: 'text', text: text.slice(offset, offset + 12) }
      await Bun.sleep(35)
    }
    yield { ...position(), t: 'message.final', message: { id: `message_${input.runId}`, role: 'assistant', content: [{ type: 'text', text }], createdAt: Date.now() } }
    yield { ...position(), t: 'plan.update', steps: [{ id: 'inspect', title: '核对会话与当前上下文', status: 'completed' }, { id: 'respond', title: '生成回复并同步到 Web', status: 'completed' }] }
    yield { ...position(), t: 'done', reason: 'stop' }
  }
  async respondPermission(_handle: KernelSessionHandle, _id: string, response: { actionId: string }) { this.answer = response.actionId; this.finish?.() }
  async cancel() { this.finish?.() }
  async close() { this.finish?.() }
}
let devices: unknown = []
const service = await openCoreService({ directory, devices: { read: () => devices, write: records => { devices = records } }, cwd: () => project, kernel: async () => new WebFixtureKernel(), authorizeTool: async () => 'deny', sessions: [
  SessionSchema.parse({ schemaVersion: 2, id: 'web-welcome', title: 'W9 · Web 工作台联调', kernelId: 'scripted', workspaceId: 'Proma', createdAt: 1, updatedAt: 1 }),
  SessionSchema.parse({ schemaVersion: 2, id: 'web-approval', title: '工具权限与跨端审批', kernelId: 'scripted', workspaceId: 'Proma', createdAt: 1, updatedAt: 1 }),
  SessionSchema.parse({ schemaVersion: 2, id: 'web-notes', title: '会话草稿与键盘操作', kernelId: 'scripted', workspaceId: 'Personal', createdAt: 1, updatedAt: 1 }),
], network: { staticRoot: fileURLToPath(new URL('../apps/web/dist', import.meta.url)), local: { workspaceIds: ['Proma', 'Personal'], control: true } } })
const seed: KernelEvent[] = [
  { t: 'message.delta', runId: 'seed', seq: 1, index: 0, kind: 'text', text: '我先检查当前的工作台状态。' },
  { t: 'message.final', runId: 'seed', seq: 2, message: { id: 'intro', role: 'assistant', content: [{ type: 'text', text: 'W9 工作台已接通。你可以在这里继续会话、查看工具执行过程，并处理待确认的操作。\n\n我已核对本轮需要交付的几个环节：' }], createdAt: 1 } },
  { t: 'tool.call', runId: 'seed', seq: 3, call: { id: 'read', kind: 'read', name: '读取工作台契约', status: 'running', input: { path: 'packages/protocol/src/api.ts' } } },
  { t: 'tool.update', runId: 'seed', seq: 4, callId: 'read', patch: { status: 'succeeded', result: '会话、事件、审批与写入租约契约均可用。' } },
  { t: 'plan.update', runId: 'seed', seq: 5, steps: [{ id: 'shell', title: '三栏、深链和主题', status: 'completed' }, { id: 'stream', title: '消息流与工具、计划渲染', status: 'completed' }, { id: 'keyboard', title: '键盘操作与审批验证', status: 'pending' }] },
  { t: 'message.final', runId: 'seed', seq: 6, message: { id: 'summary', role: 'assistant', content: [{ type: 'text', text: '发送一条消息试试，或输入「审批」查看确认流程。\n\n这是隔离临时目录中的 **scripted 验证会话**；真实内核、桌面与公网部署的验收仍在后续进行。' }], createdAt: 1 } },
  { t: 'done', runId: 'seed', seq: 7, reason: 'stop' },
]
seed.push(
  { t: 'tool.call', runId: 'reading', seq: 1, call: { id: 'scan', kind: 'search', name: '查找项目资料', status: 'succeeded', result: '找到 3 条验证记录。' } },
  { t: 'tool.call', runId: 'reading', seq: 2, call: { id: 'review', kind: 'read', name: '核对来源与说明', status: 'succeeded', result: '已保留来源与权限说明。' } },
  { t: 'message.final', runId: 'reading', seq: 3, message: { id: 'code-sample', role: 'assistant', content: [{ type: 'text', text: '可以复制这段代码，也可以引用这条消息继续讨论。\n\n```typescript\nconst workspace = "Proma";\nconst result = { workspace, ready: true };\nconsole.log(result);\n```\n\n代码内容与复制按钮文案分开处理。' }], createdAt: 2 } },
  { t: 'done', runId: 'reading', seq: 4, reason: 'stop' },
)
const proof = service.repository.leases.claim('web-welcome', 'seed')
service.repository.append(proof, seed.map(event => ({ ts: 1, turnId: 'seed', kernelEvent: event })))
service.repository.leases.release(proof)
let closing = false
const close = async () => { if (closing) return; closing = true; await service.close(); rmSync(directory, { recursive: true, force: true }); process.exit(0) }
process.once('SIGINT', () => void close()); process.once('SIGTERM', () => void close())
console.log(JSON.stringify({ purpose: 'W9 Web browser QA · scripted', url: service.server.url, directory }))
