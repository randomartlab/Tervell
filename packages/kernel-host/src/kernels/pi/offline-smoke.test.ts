import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PiKernel } from './kernel.ts'

// 实际已安装 Pi SDK + 回环 HTTP 假模型；不连接远程服务、不启动桌面。
test('Given 真实 Pi SDK When 离线 SSE 执行两轮 Then 流式/usage/恢复/清理均通过', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-pi-smoke-')); const bodies: unknown[] = []
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', async fetch(request) {
    bodies.push(await request.json())
    const events = [
      { type: 'message_start', message: { id: `msg${bodies.length}`, type: 'message', role: 'assistant', content: [], model: 'offline', stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '离线完成' } },
      { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } }, { type: 'message_stop' },
    ]
    return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } })
  } })
  const kernel = new PiKernel(() => ({ sessionId: 's1', prompt: '', apiKey: 'offline-fixture', baseUrl: `http://127.0.0.1:${server.port}`, provider: 'anthropic', model: 'offline-model', permissionMode: 'plan', systemPrompt: '', piAgentDir: join(directory, 'agent'), piSessionDir: join(directory, 'sessions') }))
  const handle = await kernel.createSession({ sessionId: 's1', cwd: directory, systemPrompt: '离线测试' })
  try {
    for (const runId of ['r1', 'r2']) {
      const events = []; for await (const event of kernel.prompt(handle, { runId, text: '测试' }, { signal: new AbortController().signal })) events.push(event)
      expect(events.some((event) => event.t === 'message.delta')).toBe(true)
      expect(events.find((event) => event.t === 'message.final')?.message.content).toEqual([{ type: 'text', text: '离线完成' }])
      expect(events.some((event) => event.t === 'usage')).toBe(true)
      expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop', runId })
      expect(events.some((event) => event.t === 'error')).toBe(false)
    }
    expect(bodies).toHaveLength(2)
    expect(kernel.describePersistence(handle)?.kernelSessionRef).toBeString()
    expect(JSON.stringify(bodies[1])).toContain('离线完成')
  } finally { await kernel.close(handle); server.stop(true); rmSync(directory, { recursive: true, force: true }) }
}, 15000)
