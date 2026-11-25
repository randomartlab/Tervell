import { app } from 'electron'
import { mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file'

/** 显式集成验收：真实隔离安装、启动适配器、创建会话；不使用日常账号或付费模型。 */
const root = mkdtempSync(join(tmpdir(), 'tervell-managed-kernels-'))
process.env.TERVELL_PROFILE_DIR = root
app.setPath('userData', join(root, 'chromium'))
;(app as typeof app & { setAppPath(path: string): void }).setAppPath(resolve('apps/electron'))

async function run(): Promise<void> {
  const { desktopCliInstaller } = await import('../apps/electron/src/main/lib/desktop-cli-installer')
  const { desktopKernelState, probeDesktopKernel } = await import('../apps/electron/src/main/lib/desktop-extension-service')
  mkdirSync(join(root, 'config'), { recursive: true })
  const {stopModelRouting}=await import('../apps/electron/src/main/lib/model-routing-service')
  app.once('before-quit',()=>stopModelRouting())
  const ids = (process.env.TERVELL_QA_KERNELS ?? 'glm-acp-agent,dsh,omp').split(',').filter(Boolean)
  const results: Array<Record<string, unknown>> = []
  const project=join(root,'project');mkdirSync(project,{recursive:true})
  for (const id of ids) {
    console.log('REAL INSTALL START', id)
    const start = Date.now()
    let previous = ''
    try {
      desktopCliInstaller.start(id)
      for (;;) {
        const job = desktopCliInstaller.state()
        if (job?.phase !== previous) { console.log('STATE', id, job?.phase); previous = job?.phase ?? '' }
        if (job && ['succeeded', 'failed', 'cancelled'].includes(job.phase)) {
          if (job.phase !== 'succeeded') {writeJsonFileAtomic(join(root,id+'-failed-job.json'),job);throw Error(job.error ?? job.output.slice(-2000))}
          break
        }
        if (Date.now() - start > 10 * 60_000) { if (job) desktopCliInstaller.cancel(job.id); throw Error('真实安装验收超过10分钟') }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      const entry = desktopKernelState().entries.find(row => row.id === id)
      if (!entry?.available || !entry.enabled || !entry.managed || !entry.verification) throw Error('安装后未启用真实受管入口')
      let catalog: Awaited<ReturnType<typeof probeDesktopKernel>> | undefined, catalogError: string | undefined
      try { catalog = await probeDesktopKernel(id, project) } catch (error) { catalogError = error instanceof Error ? error.message : String(error) }
      results.push({ id, installed: true, verification: entry.verification, version: entry.version, models: catalog?.models.length ?? 0, controls: catalog?.controls?.length ?? 0, ...(catalogError ? {catalogError} : {}), elapsedMs: Date.now() - start, modelPromptTested: false })
    } catch (error) { results.push({ id, installed: false, error: error instanceof Error ? error.message : String(error), elapsedMs: Date.now() - start }) }
    writeJsonFileAtomic(join(root, 'installation-report.json'), { platform: process.platform, arch: process.arch, results })
    console.log('REAL INSTALL RESULT', JSON.stringify(results.at(-1)))
  }
  stopModelRouting()
  console.log('ISOLATED EVIDENCE', root)
  if (results.some(row => !row.installed)) throw Error('存在未通过的真实内核安装，详见逐项报告')
}
app.whenReady().then(run).then(() => app.exit(0)).catch(error => { console.error(error); app.exit(1) })
