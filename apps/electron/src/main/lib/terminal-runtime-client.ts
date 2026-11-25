import { join } from 'node:path'
import { MessageChannelMain, utilityProcess, type MessagePortMain, type UtilityProcess } from 'electron'
import { startUtilityProcessWithRetry } from './utility-process-startup'
import type {
  TerminalCreateInput,
  TerminalExitEvent,
  TerminalInput,
  TerminalOutputAck,
  TerminalOutputEvent,
  TerminalResizeInput,
  TerminalState,
} from '@proma/shared'

type RuntimePort = Pick<MessagePortMain, 'close' | 'postMessage' | 'start'> & {
  on(event: 'message', listener: (event: { data: unknown }) => void): void
}

type PendingCreate = {
  promise: Promise<TerminalState>
  resolve: (state: TerminalState) => void
  reject: (reason: Error) => void
}

type RuntimeTerminalCreateInput = TerminalCreateInput & {
  strictCwd?: boolean
  managedProcess?: { file: string; args: string[]; env: Record<string,string>; title: string; inheritEnv?: boolean }
}

type RuntimeMessage =
  | { type: 'terminal.ready'; pid: number }
  | { type: 'terminal.created'; state: TerminalState }
  | { type: 'terminal.output'; event: TerminalOutputEvent }
  | { type: 'terminal.exit'; event: TerminalExitEvent }
  | { type: 'terminal.error'; terminalId: string; message: string }

const STARTUP_TIMEOUT_MS = 10_000

/**
 * 一个 utility process 管理全部本地 PTY：与 Agent runtime 隔离，又不会为每个 Tab
 * 创建一个 Node 进程。Renderer 始终经由此 client 接收已批处理的输出。
 */
export class TerminalRuntimeClient {
  private runtimeProcess: UtilityProcess | undefined
  private port: RuntimePort | undefined
  private starting: Promise<void> | undefined
  private generation = 0
  private readonly managedPids = new Map<string,number>()
  private readonly managedRequests = new Set<string>()
  private readonly pendingCreates = new Map<string, PendingCreate>()
  private readonly outputListeners = new Set<(event: TerminalOutputEvent) => void>()
  private readonly exitListeners = new Set<(event: TerminalExitEvent) => void>()

  onOutput(listener: (event: TerminalOutputEvent) => void): () => void {
    this.outputListeners.add(listener)
    return () => this.outputListeners.delete(listener)
  }

  onExit(listener: (event: TerminalExitEvent) => void): () => void {
    this.exitListeners.add(listener)
    return () => this.exitListeners.delete(listener)
  }

  async create(input: TerminalCreateInput, options: { strictCwd?: boolean; managedProcess?: RuntimeTerminalCreateInput['managedProcess'] } = {}): Promise<TerminalState> {
    await this.start()
    const pending = this.pendingCreates.get(input.terminalId)
    if (pending) return pending.promise

    let resolveCreate!: (state: TerminalState) => void
    let rejectCreate!: (reason: Error) => void
    const promise = new Promise<TerminalState>((resolve, reject) => {
      resolveCreate = resolve
      rejectCreate = reject
    })
    this.pendingCreates.set(input.terminalId, { promise, resolve: resolveCreate, reject: rejectCreate })
    // 不转发 renderer 可能夹带的 managedProcess 字段；仅可信主进程 options 可指定安装进程。
    const runtimeInput: RuntimeTerminalCreateInput = {
      terminalId: input.terminalId,sessionId: input.sessionId,cwd: input.cwd,profile: input.profile,cols: input.cols,rows: input.rows,
      ...(options.strictCwd?{strictCwd:true}:{}),...(options.managedProcess?{managedProcess:options.managedProcess}:{}),
    }
    if(options.managedProcess)this.managedRequests.add(input.terminalId)
    this.port?.postMessage({ type: 'terminal.create', input: runtimeInput })
    return promise
  }

  async input(input: TerminalInput): Promise<void> {
    await this.start()
    this.port?.postMessage({ type: 'terminal.input', input })
  }

  async resize(input: TerminalResizeInput): Promise<void> {
    await this.start()
    this.port?.postMessage({ type: 'terminal.resize', input })
  }

  acknowledgeOutput(input: TerminalOutputAck): void {
    this.port?.postMessage({ type: 'terminal.ack-output', input })
  }

  kill(terminalId: string): void {
    const pid=this.managedPids.get(terminalId)
    if(pid&&process.platform!=='win32'){
      try{process.kill(-pid,'SIGTERM')}catch{/* 进程组可能已退出。 */}
      setTimeout(()=>{try{process.kill(-pid,'SIGKILL')}catch{/* 已回收。 */}},500).unref()
      this.managedPids.delete(terminalId)
    }
    this.port?.postMessage({ type: 'terminal.kill', terminalId })
  }

  async stop(): Promise<void> {
    for(const terminalId of this.managedPids.keys())this.kill(terminalId)
    this.managedRequests.clear()
    this.generation++
    const port = this.port
    const runtimeProcess = this.runtimeProcess
    this.port = undefined
    if (port) {
      port.postMessage({ type: 'terminal.shutdown' })
      port.close()
    }
    try { runtimeProcess?.kill() } catch { /* utility process may already be exiting */ }
    this.runtimeProcess = undefined
    this.starting = undefined
    this.rejectPendingCreates(new Error('终端运行时已停止'))
  }

  private async start(): Promise<void> {
    if (this.port) return
    if (this.starting) return this.starting

    const starting = this.startRuntime(++this.generation)
    this.starting = starting
    try {
      await starting
    } finally {
      if (this.starting === starting) this.starting = undefined
    }
  }

  private async startRuntime(generation: number): Promise<void> {
    const entryPath = join(__dirname, 'terminal-runtime.cjs')
    const isCurrentStartup = () => generation === this.generation
    const runtimeProcess = await startUtilityProcessWithRetry(
      () => utilityProcess.fork(entryPath, [], { serviceName: 'Proma Terminal Runtime' }),
      { shouldContinue: isCurrentStartup },
    )
    if (!isCurrentStartup()) {
      try { runtimeProcess.kill() } catch { /* utility process may already be exiting */ }
      throw new Error('终端运行时启动已取消')
    }
    this.runtimeProcess = runtimeProcess

    await new Promise<void>((resolve, reject) => {
      const channel = new MessageChannelMain()
      const port = channel.port2 as unknown as RuntimePort
      const isCurrentRuntime = () =>
        generation === this.generation
        && this.runtimeProcess === runtimeProcess
        && this.port === port
      const fail = (error: Error): void => {
        clearTimeout(timeout)
        if (isCurrentRuntime()) this.handleRuntimeFailure(error, runtimeProcess, port)
        reject(error)
      }
      const timeout = setTimeout(() => {
        if (!isCurrentRuntime()) return
        fail(new Error('终端运行时启动超时'))
      }, STARTUP_TIMEOUT_MS)
      const ready = (): void => {
        clearTimeout(timeout)
        resolve()
      }
      this.port = port
      port.on('message', ({ data }) => {
        if (!isCurrentRuntime()) return
        const message = data as RuntimeMessage
        if (message?.type === 'terminal.ready') ready()
        this.handleMessage(message)
      })
      port.start()
      runtimeProcess.on('error', (type) => fail(new Error(`终端运行时错误：${type}`)))
      const processEvents = runtimeProcess as unknown as { on(event: 'exit', listener: (code: number) => void): void }
      processEvents.on('exit', (code) => fail(new Error(`终端运行时已退出（${code}）`)))
      runtimeProcess.postMessage({ type: 'proma-terminal-runtime-port' }, [channel.port1])
    })
  }

  private handleMessage(message: RuntimeMessage): void {
    if (message.type === 'terminal.created') {
      if(this.managedRequests.has(message.state.terminalId))this.managedPids.set(message.state.terminalId,message.state.pid)
      const pending = this.pendingCreates.get(message.state.terminalId)
      this.pendingCreates.delete(message.state.terminalId)
      pending?.resolve(message.state)
    } else if (message.type === 'terminal.error') {
      this.managedRequests.delete(message.terminalId)
      const pending = this.pendingCreates.get(message.terminalId)
      this.pendingCreates.delete(message.terminalId)
      pending?.reject(new Error(message.message))
    } else if (message.type === 'terminal.output') {
      for (const listener of this.outputListeners) listener(message.event)
    } else if (message.type === 'terminal.exit') {
      this.managedPids.delete(message.event.terminalId)
      this.managedRequests.delete(message.event.terminalId)
      for (const listener of this.exitListeners) listener(message.event)
    }
  }

  private handleRuntimeFailure(
    error: Error,
    runtimeProcess: UtilityProcess | undefined = this.runtimeProcess,
    port: RuntimePort | undefined = this.port,
  ): void {
    port?.close()
    if (this.port === port) this.port = undefined
    try { runtimeProcess?.kill() } catch { /* utility process may already be exiting */ }
    if (this.runtimeProcess === runtimeProcess) this.runtimeProcess = undefined
    this.rejectPendingCreates(error)
    for(const [terminalId] of this.managedPids){for(const listener of this.exitListeners)listener({terminalId,exitCode:1})}
    this.managedPids.clear();this.managedRequests.clear()
  }

  private rejectPendingCreates(error: Error): void {
    for (const pending of this.pendingCreates.values()) pending.reject(error)
    this.pendingCreates.clear()
  }
}

export const terminalRuntimeClient = new TerminalRuntimeClient()
