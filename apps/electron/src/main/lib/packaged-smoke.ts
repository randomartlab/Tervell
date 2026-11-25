import { app } from 'electron'
import type { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { writeJsonFileAtomic } from './safe-file'
import { resolveLocalProfile } from '@proma/shared/config/local-profile'
import { AgentRuntimeClient } from './agent-runtime-client'
import { terminalRuntimeClient } from './terminal-runtime-client'
import { unpackedResourcePath } from './packaged-path'

/** 只在安装产物的显式隔离配置中运行，不接受任意输出路径或脚本。 */
export async function runPackagedSmoke(window: BrowserWindow): Promise<void> {
  const profile = resolveLocalProfile(process.env.TERVELL_PROFILE_DIR)
  if (!app.isPackaged || !profile || !process.argv.includes('--tervell-runtime-smoke')) throw Error('安装验收需要已打包应用和隔离配置')
  const checks: Record<string, unknown> = {}
  const runtime = new AgentRuntimeClient({ sessionId: 'packaged-smoke' })
  const terminalId = 'packaged-smoke-terminal'
  const report = join(profile.root, 'runtime-smoke.json')
  let ok = false
  const checkpoint = (stage: string) => {
    console.log('[安装验收]', stage)
    writeJsonFileAtomic(report, { ok: false, stage, version: app.getVersion(), platform: process.platform, arch: process.arch, checks })
  }
  async function bounded<T>(task: Promise<T>, label: string, milliseconds = 30000): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try { return await Promise.race([task, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(Error(label + '超时')), milliseconds) })]) }
    finally { if (timer) clearTimeout(timer) }
  }
  try {
    checkpoint('等待实际窗口')
    window.webContents.setBackgroundThrottling(false)
    window.show()
    const started = Date.now()
    while (window.webContents.isLoading() || !(await bounded(window.webContents.executeJavaScript('Boolean(window.electronAPI && document.querySelector("#root")?.childElementCount)'), 'Renderer 执行', 10000))) {
      if (Date.now() - started > 90_000) throw Error('界面或 preload 未加载')
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    checkpoint('界面 IPC')
    checks.renderer = await bounded(window.webContents.executeJavaScript('(async()=>({settings:!!await window.electronAPI.getSettings(),workspaces:Array.isArray(await window.electronAPI.listAgentWorkspaces()),body:document.body.innerText.length}))()'), '界面 IPC')
    checkpoint('原生模块')
    const nativeRequire = createRequire(join(app.getAppPath(), 'package.json'))
    const sharp = (await import('sharp')).default
    const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#ffffff' } }).png().toBuffer()
    if (png.length < 20) throw Error('sharp 原生运行失败')
    checks.sharp = true
    const canvas = nativeRequire('@napi-rs/canvas') as { createCanvas(width: number, height: number): { toBuffer(format: 'image/png'): Buffer } }
    if (canvas.createCanvas(2, 2).toBuffer('image/png').length < 20) throw Error('canvas 原生模块运行失败')
    checks.canvas = true
    const { SessionManager } = await import('@earendil-works/pi-coding-agent')
    const pi = SessionManager.create(profile.root, join(profile.root, 'pi-smoke'))
    if (!pi.getSessionId()) throw Error('Pi SDK 无法创建会话')
    checks.piSdk = true
    const esbuild = nativeRequire(unpackedResourcePath(nativeRequire.resolve('esbuild'))) as typeof import('esbuild')
    const transformed = await esbuild.transform('const n: number = 42', { loader: 'ts' })
    if (!transformed.code.includes('42')) throw Error('esbuild 原生运行失败')
    checks.esbuild = true
    checkpoint('Pi utility process')
    const state = await runtime.start()
    if (state.status !== 'ready') throw Error('Pi utility process 未就绪')
    checks.piRuntime = { status: state.status, pid: state.pid }
    let output = ''
    checkpoint('PTY 命令输出')
    const unsubscribe = terminalRuntimeClient.onOutput(event => {
      if (event.terminalId !== terminalId) return
      output += event.data
      terminalRuntimeClient.acknowledgeOutput({ terminalId, sequence: event.sequence })
    })
    try {
      await terminalRuntimeClient.create({ terminalId, sessionId: 'packaged-smoke', cwd: profile.root, cols: 100, rows: 30,
        profile: process.platform === 'win32' ? 'powershell' : 'bash' })
      await terminalRuntimeClient.input({ terminalId, data: process.platform === 'win32'
        ? "Write-Output ('TERVELL_PACKAGED_'+'PTY_OK')\r"
        : "printf '%s%s\\n' TERVELL_PACKAGED_ PTY_OK\r" })
      const deadline = Date.now() + 15_000
      while (!output.includes('TERVELL_PACKAGED_PTY_OK') && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100))
      if (!output.includes('TERVELL_PACKAGED_PTY_OK')) throw Error('ConPTY 未返回命令输出')
      checks.terminal = true
    } finally { unsubscribe(); terminalRuntimeClient.kill(terminalId) }
    for (const [name, relative] of Object.entries({ bun: `third-party/plugin-runtime/${process.platform}-${process.arch}/bun${process.platform === 'win32' ? '.exe' : ''}`, gateway: `model-gateway/magpie${process.platform === 'win32' ? '.exe' : ''}` })) {
      checkpoint(name)
      checks[name] = await new Promise<string>((resolve, reject) => execFile(join(process.resourcesPath, relative), ['--version'], {
        timeout: 20_000, windowsHide: true, env: { ...process.env, HOME: profile.root, USERPROFILE: profile.root },
      }, (error, stdout) => error ? reject(error) : resolve(stdout.trim().slice(0, 120))))
    }
    ok = true
  } catch (error) { checks.error = error instanceof Error ? error.message : String(error) }
  finally {
    await runtime.stop().catch(() => undefined)
    await terminalRuntimeClient.stop().catch(() => undefined)
    writeJsonFileAtomic(report, { ok, version: app.getVersion(), platform: process.platform, arch: process.arch, checks })
    app.exit(ok ? 0 : 1)
  }
}
