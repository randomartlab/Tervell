import { utilityProcess } from 'electron'
import { join } from 'node:path'

export interface PiForkRequest {
  sourcePath: string
  sessionDir: string
  sourceCwd?: string
  targetCwd: string
  entryId: string
  bindings: Record<string, string>
}
export interface PiForkResult { path: string; id: string; bindings: Record<string, string> }

let pending: Promise<unknown> = Promise.resolve()
/** 原生 SDK 保持树/compaction/label 语义；重型解析在一次性进程中串行完成。 */
export function forkPiArtifact(input: PiForkRequest): Promise<PiForkResult> {
  const result = pending.catch(() => undefined).then(() => new Promise<PiForkResult>((resolve, reject) => {
    const child = utilityProcess.fork(join(__dirname, 'pi-fork-runtime.cjs'), [], { serviceName: 'Tervell History Fork' })
    let settled = false
    const finish = (error?: Error, value?: PiForkResult) => {
      if (settled) return
      settled = true; clearTimeout(timer)
      try { child.kill() } catch { /* 已退出 */ }
      if (error) reject(error); else if (value) resolve(value)
    }
    const timer = setTimeout(() => finish(Error('长会话分叉超时；源会话保留，请重试')), 10 * 60_000)
    child.on('spawn', () => child.postMessage(input))
    child.on('message', (value: { result?: PiForkResult; error?: string }) => {
      if (value.error) finish(Error(value.error))
      else if (value.result) finish(undefined, value.result)
    })
    child.on('exit', code => { if (!settled) finish(Error(`历史分叉进程异常退出 (${code})；源会话保留`)) })
  }))
  pending = result
  return result
}
