// 真实子进程 fixture；刻意覆盖错 run、崩溃与挂起。
import { KernelHostCommandSchema } from '@proma/protocol'
process.on('message', (raw) => {
  const request = KernelHostCommandSchema.parse(raw)
  const { runId, prompt } = request.input
  if (prompt === 'hang') return
  if (prompt === 'crash-always' || (prompt === 'crash-once' && request.method === 'prompt')) {
    process.send?.({ method: 'event', event: { t: 'message.delta', runId, seq: request.method === 'resume' ? request.fromSeq + 1 : 1, index: 0, text: '已确认' } })
    setTimeout(() => process.exit(7), 10); return
  }
  if (prompt === 'wrong-run') {
    process.send?.({ method: 'event', event: { t: 'done', runId: 'wrong', seq: 1, reason: 'stop' } }); return
  }
  const seq = request.method === 'resume' ? request.fromSeq + 1 : 1
  process.send?.({ method: 'event', event: { t: 'message.delta', runId, seq, index: 0, text: request.method === 'resume' ? '续跑' : prompt } })
  process.send?.({ method: 'event', event: { t: 'done', runId, seq: seq + 1, reason: 'stop' } })
})
process.send?.({ method: 'ready' })
