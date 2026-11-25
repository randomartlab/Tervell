import { randomUUID } from 'node:crypto'
import type { DesktopCliInstall } from '@proma/shared'

export interface InstallJobDependencies {
  run: (job: DesktopCliInstall, output: (text: string) => void) => Promise<{ exit: Promise<number>; cancel: () => void }>
  verify: (id: string, signal: AbortSignal) => Promise<boolean>
  changed: (job: DesktopCliInstall) => void
}
/** 安装退出与可用性分开；取消后迟到的退出/探测不能再宣告成功。 */
export class DesktopCliInstallJob {
  private job: DesktopCliInstall | null = null
  private cancelRun?: () => void
  private controller?: AbortController
  private settling = false
  constructor(private readonly deps: InstallJobDependencies) {}
  state(): DesktopCliInstall | null { return this.job ? { ...this.job } : null }
  start(kernelId: string): DesktopCliInstall {
    if (this.job && ['installing','verifying'].includes(this.job.phase)) {
      if (this.job.kernelId !== kernelId) throw new Error('请先等待当前安装结束，或取消当前安装')
      return { ...this.job }
    }
    if(this.settling)throw new Error('正在回收上一次安装进程，请稍后重试')
    this.settling = true
    const job: DesktopCliInstall = { id: randomUUID(), kernelId, phase: 'installing', output: '', startedAt: Date.now() }
    this.controller = new AbortController(); this.job = job; this.emit(); void this.execute(job,this.controller.signal)
    return { ...job }
  }
  cancel(id: string): DesktopCliInstall | null {
    if (this.job?.id === id && ['installing','verifying'].includes(this.job.phase)) {
      this.controller?.abort(); this.job.phase = 'cancelled'; this.job.finishedAt = Date.now(); this.cancelRun?.(); this.emit()
    }
    return this.state()
  }
  private emit(): void { if (this.job) this.deps.changed({ ...this.job }) }
  private async execute(job: DesktopCliInstall, signal: AbortSignal): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      const handle = await this.deps.run(job, text => { if (this.job !== job || job.phase !== 'installing') return; job.output = (job.output + text).slice(-160000); this.emit() })
      if (job.phase === 'cancelled') { handle.cancel(); return }
      this.cancelRun = handle.cancel
      const code = await Promise.race([handle.exit, new Promise<never>((_, reject) => { timeout = setTimeout(() => { handle.cancel(); reject(new Error('安装超过 15 分钟，已停止；可重新尝试。')) }, 15*60*1000) })])
      job.exitCode = code
      if (job.phase !== 'installing') return
      if (code !== 0) throw new Error(`安装进程退出（${code}），请查看上方输出后重试。`)
      job.phase = 'verifying'; this.emit()
      const available = await this.deps.verify(job.kernelId,signal)
      if (this.job !== job || job.phase !== 'verifying') return
      if (!available) throw new Error('安装结束，但 CLI 或 ACP 适配器未通过检查；可直接重试安装。')
      job.phase = 'succeeded'
    } catch (error) {
      if (this.job !== job || job.phase === 'cancelled') return
      job.phase = 'failed'; job.error = error instanceof Error ? error.message : String(error)
    } finally {
      if (timeout) clearTimeout(timeout)
      this.settling = false
      if (this.job === job) { this.cancelRun = undefined; job.finishedAt = Date.now(); this.emit() }
    }
  }
}
