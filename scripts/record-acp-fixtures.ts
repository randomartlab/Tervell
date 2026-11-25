import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { ACP_DIALECTS } from '../packages/kernel-host/src/acp/dialects/index.ts'
import { AcpKernel } from '../packages/kernel-host/src/acp/kernel.ts'
import { AcpTraceRecorder } from '../packages/kernel-host/src/acp/recorder.ts'
import { replayAcpTrace } from '../packages/kernel-host/src/acp/replay.ts'

const directory = fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/dialects/', import.meta.url)); mkdirSync(directory, { recursive: true })
for (const dialect of ACP_DIALECTS) {
  const recorder = new AcpTraceRecorder({ kernelId: dialect.id, origin: 'scripted', agentVersion: 'scripted-1', source: 'dialect-server:source-shaped-scripted;not-vendor-recording' })
  const kernel = new AcpKernel(dialect.id, { command: process.execPath, args: [fileURLToPath(new URL('../packages/kernel-host/src/acp/test-fixtures/dialect-server.ts', import.meta.url)), dialect.id], dialect, timeoutMs: 2000, trace: (direction, message) => recorder.record(direction, message) })
  const handle = await kernel.createSession({ sessionId: 'scripted-product-session', cwd: process.cwd(), systemPrompt: '' })
  try {
    await kernel.modelCatalog(handle)
    for await (const event of kernel.prompt(handle, { runId: 'scripted-run', text: 'scripted read/edit/bash' }, { signal: new AbortController().signal })) {
      if (event.t === 'error') throw new Error(`脚本录制出现错误：${event.err.code}`)
      if (event.t === 'permission.request') {
        const action = event.req.actions.filter((option) => option.behavior === 'allow').at(-1)
        if (!action) throw new Error('脚本无明确允许选项')
        await kernel.respondPermission(handle, event.req.requestId, { actionId: action.id, behavior: 'allow' })
      }
    }
    replayAcpTrace(recorder.snapshot(), dialect)
    recorder.save(join(directory, `${dialect.id}-scripted.json`))
    console.log(`${dialect.id}: scripted trace generated and replayed`)
  } finally { await kernel.close(handle) }
}
