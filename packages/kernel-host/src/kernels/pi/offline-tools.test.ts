import { test, expect } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { PiKernel } from './kernel.ts'
import type { KernelEvent } from '@proma/protocol'

const scenarios = [
  { name: 'read', input: { path: 'fixture.txt' } },
  { name: 'write', input: { path: 'created.txt', content: '通过审批写入' } },
  { name: 'bash', input: { command: "printf '本机命令结果'" } },
]
for (const scenario of scenarios) for (const allow of [true, false]) {
  test(`Given 真实Pi工具循环 When 本机${scenario.name}被${allow ? '允许' : '拒绝'} Then 审批后可观察结果`, async () => {
    const directory = mkdtempSync(join(tmpdir(), 'proma-pi-tool-')); writeFileSync(join(directory, 'fixture.txt'), '本机工具结果')
    let requests = 0
    const server = Bun.serve({ port: 0, hostname: '127.0.0.1', async fetch(request) {
      await request.json(); requests++
      const tool = requests === 1
      const events = [
        { type: 'message_start', message: { id: `m${requests}`, type: 'message', role: 'assistant', model: 'offline', content: [], usage: { input_tokens: 1, output_tokens: 0 }, stop_reason: null, stop_sequence: null } },
        { type: 'content_block_start', index: 0, content_block: tool ? { type: 'tool_use', id: 'call1', name: scenario.name, input: {} } : { type: 'text', text: '' } },
        { type: 'content_block_delta', index: 0, delta: tool ? { type: 'input_json_delta', partial_json: JSON.stringify(scenario.input) } : { type: 'text_delta', text: '任务结束' } },
        { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: tool ? 'tool_use' : 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } }, { type: 'message_stop' },
      ]
      return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } })
    } })
    const kernel = new PiKernel(() => ({ sessionId: 's1', prompt: '', apiKey: 'offline-fixture', baseUrl: `http://127.0.0.1:${server.port}`, provider: 'anthropic', model: 'offline-model', permissionMode: 'plan', systemPrompt: '', piAgentDir: join(directory, 'agent'), piSessionDir: join(directory, 'sessions') }))
    const handle = await kernel.createSession({ sessionId: 's1', cwd: directory, systemPrompt: '' })
    try {
      const events: KernelEvent[] = []
      for await (const event of kernel.prompt(handle, { runId: 'r1', text: '读本机文件' }, { signal: new AbortController().signal })) {
        events.push(event)
        if (event.t === 'permission.request') await kernel.respondPermission(handle, event.req.requestId, { actionId: allow ? 'allow' : 'deny', behavior: allow ? 'allow' : 'deny' })
      }
      expect(events.some((event) => event.t === 'permission.request')).toBe(true)
      expect(events.some((event) => event.t === 'tool.call')).toBe(true)
      const result = events.find((event) => event.t === 'tool.update' && event.patch.status !== 'running')
      expect(result).toMatchObject({ t: 'tool.update', patch: { status: allow ? 'succeeded' : 'failed' } })
      expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
      expect(requests).toBe(2)
      if (scenario.name === 'write') {
        expect(existsSync(join(directory, 'created.txt'))).toBe(allow)
        if (allow) expect(readFileSync(join(directory, 'created.txt'), 'utf8')).toBe('通过审批写入')
      }
      if (allow && scenario.name === 'bash' && result?.t === 'tool.update') expect(result.patch.result).toContain('本机命令结果')
    } finally { await kernel.close(handle); server.stop(true); rmSync(directory, { recursive: true, force: true }) }
  }, 15000)
}
