import { test, expect } from 'bun:test'
import { fileURLToPath } from 'node:url'
import { ACP_DIALECTS } from './index.ts'
import { AcpKernel } from '../kernel.ts'
import { AcpTraceRecorder } from '../recorder.ts'
import { replayAcpTrace } from '../replay.ts'
import type { KernelEvent } from '@proma/protocol'

for (const dialect of ACP_DIALECTS) test(`Given ${dialect.id}脚本剧本 When read→edit→bash→approve Then 录制回放闭环`, async () => {
  const recorder = new AcpTraceRecorder({ kernelId: dialect.id, origin: 'scripted', agentVersion: 'scripted-1', source: 'dialect-server:source-shaped-scripted' })
  const kernel = new AcpKernel(dialect.id, { command: process.execPath, args: [fileURLToPath(new URL('../test-fixtures/dialect-server.ts', import.meta.url)), dialect.id], dialect, timeoutMs: 2000, trace: (direction, message) => recorder.record(direction, message) })
  const handle = await kernel.createSession({ sessionId: 's1', cwd: process.cwd(), systemPrompt: '' })
  try {
    const catalog = await kernel.modelCatalog(handle); expect(catalog.models).toHaveLength(1)
    const events: KernelEvent[] = []
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'run scripted scenario' }, { signal: new AbortController().signal })) {
      events.push(event)
      if (event.t === 'permission.request') {
        // 明确选择最后一个allow问题答案，不自动取第一个；工具/计划则显式选择相应允许项。
        const allows = event.req.actions.filter((action) => action.behavior === 'allow'); const action = allows.at(-1)!
        await kernel.respondPermission(handle, event.req.requestId, { actionId: action.id, behavior: 'allow' })
      }
    }
    expect(events.filter((event) => event.t === 'tool.call').map((event) => event.call.kind)).toEqual(['read', 'edit', 'execute'])
    expect(events.some((event) => event.t === 'error')).toBe(false)
    expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
    const trace = recorder.snapshot(); expect(trace.origin).toBe('scripted')
    expect(recorder.export()).not.toContain('/private/project/fixture.txt')
    const replayed = replayAcpTrace(trace, dialect)
    expect(replayed).toHaveLength(1)
    expect(replayed[0]!.filter((event) => event.t === 'tool.call').map((event) => event.call.kind)).toEqual(['read', 'edit', 'execute'])
    expect(JSON.stringify(replayAcpTrace(trace, dialect))).toBe(JSON.stringify(replayed))
    const corrupt = structuredClone(trace); corrupt.frames.pop(); expect(() => replayAcpTrace(corrupt, dialect)).toThrow('不完整')
  } finally { await kernel.close(handle) }
}, 10000)
