import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import type { MessagePort } from 'node:worker_threads'
import { KernelHostCommandSchema, KernelHostMessageSchema, KernelHostRunSchema } from '@proma/protocol'
import type { KernelEvent, KernelHostRun } from '@proma/protocol'

class ProcessCrashed extends Error {}
export interface ProcessHostOptions { entry: string; executable: string; args?: string[]; env?: Record<string, string>; timeoutMs?: number; startupTimeoutMs?: number; recoverOnce?: boolean }
export class KernelProcessHost {
  private child?: ChildProcess
  private completion?: Promise<KernelEvent[]>
  private cancel?: () => void
  restarts = 0
  lastPid?: number
  get pid(): number | undefined { return this.child?.pid }
  constructor(private readonly options: ProcessHostOptions) {}
  async run(input: KernelHostRun, onEvent: (event: KernelEvent) => void = () => {}): Promise<KernelEvent[]> {
    if (this.completion) throw new Error('宿主已有运行中的任务')
    const parsed = KernelHostRunSchema.parse(input)
    this.restarts = 0
    const events: KernelEvent[] = []
    const completion = this.execute(parsed, (event) => { events.push(event); onEvent(event) }, 0).catch(async (error: unknown) => {
      if (!(error instanceof ProcessCrashed) || !this.options.recoverOnce || !parsed.resumeToken) throw error
      this.restarts = 1
      await this.execute(parsed, (event) => { events.push(event); onEvent(event) }, events.at(-1)?.seq ?? 0, true)
      return events
    })
    this.completion = completion
    try { await completion; return events } finally { this.completion = undefined; this.cancel = undefined }
  }
  private execute(input: KernelHostRun, onEvent: (event: KernelEvent) => void, fromSeq: number, resume = false): Promise<KernelEvent[]> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.options.executable, [...(this.options.args ?? []), this.options.entry], {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'], env: { ...process.env, ...this.options.env },
      })
      this.child = child; this.lastPid = child.pid
      let finished = false; let ready = false; let failure: Error | undefined
      const events: KernelEvent[] = []; let lastSeq = fromSeq
      const shutdown = (error?: Error) => {
        if (finished) return
        finished = true; failure = error
        clearTimeout(startup); clearTimeout(deadline)
        // 专用单会话子进程：结束后直接等待退出，避免取消/超时遗留句柄。
        child.kill('SIGKILL')
      }
      const startup = setTimeout(() => shutdown(new Error('内核启动超时')), this.options.startupTimeoutMs ?? 5000)
      const deadline = setTimeout(() => shutdown(new Error('内核运行超时')), this.options.timeoutMs ?? 120000)
      this.cancel = () => shutdown(new Error('内核运行已取消'))
      child.on('error', (error) => { failure = error; shutdown(error) })
      child.on('message', (raw) => {
        if (finished) return
        const parsed = KernelHostMessageSchema.safeParse(raw)
        if (!parsed.success) { shutdown(new Error('内核消息契约无效')); return }
        const message = parsed.data
        if (message.method === 'ready') {
          if (ready) { shutdown(new Error('重复 ready')); return }
          ready = true; clearTimeout(startup)
          child.send(resume ? { method: 'resume', input, fromSeq } : { method: 'prompt', input }, (error) => { if (error) shutdown(error) }); return
        }
        const event = message.event
        if (!ready || event.runId !== input.runId || event.seq <= lastSeq) { shutdown(new Error('内核 run 或事件序号不匹配')); return }
        lastSeq = event.seq; events.push(event)
        try { onEvent(event) } catch (error) { shutdown(error instanceof Error ? error : new Error(String(error))); return }
        if (event.t === 'done') shutdown()
      })
      child.on('close', (code, signal) => {
        clearTimeout(startup); clearTimeout(deadline)
        if (this.child === child) this.child = undefined
        if (failure) reject(failure)
        else if (!finished) reject(ready ? new ProcessCrashed(`内核意外退出：${code ?? signal}`) : new Error(`内核启动前退出：${code ?? signal}`))
        else resolve(events)
      })
    })
  }
  async stop(): Promise<void> {
    this.cancel?.()
    if (this.completion) { try { await this.completion } catch (error) { if (!(error instanceof Error) || !error.message.includes('取消')) throw error } }
  }
  bind(port: MessagePort): () => void {
    const listener = (raw: unknown) => {
      const parsed = KernelHostCommandSchema.safeParse(raw)
      if (!parsed.success || parsed.data.method !== 'prompt') { port.postMessage({ method: 'failure', message: '无效宿主请求' }); return }
      void this.run(parsed.data.input, (event) => port.postMessage({ method: 'event', event }))
        .catch((error: unknown) => port.postMessage({ method: 'failure', message: error instanceof Error ? error.message : String(error) }))
    }
    port.on('message', listener); port.start()
    return () => { port.off('message', listener) }
  }
}
