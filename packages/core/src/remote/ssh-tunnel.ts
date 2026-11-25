import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { RemoteTunnelProfileSchema } from '@proma/protocol'
import type { RemoteTunnelProfile } from '@proma/protocol'

export function tunnelArguments(input: RemoteTunnelProfile, localPort: number): string[] {
  const profile = RemoteTunnelProfileSchema.parse(input)
  if (!Number.isInteger(localPort) || localPort < 1 || localPort > 65535) throw new Error('手机连接端口无效')
  return ['-v', '-N', '-T', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ExitOnForwardFailure=yes', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', '-o', 'ConnectTimeout=10', '-R', `127.0.0.1:${profile.tunnel.targetPort}:127.0.0.1:${localPort}`, profile.sshHost]
}
export class SshRemoteTunnel {
  private child?: ChildProcess
  private retry?: ReturnType<typeof setTimeout>
  private stopped = false
  private online = false
  private stopping?: Promise<void>
  constructor(private readonly profile: RemoteTunnelProfile, private readonly port: number, private readonly changed: (online: boolean) => void, private readonly launch: typeof spawn = spawn) {}
  get connected(): boolean { return this.online }
  start(): void {
    if (this.stopped || this.child) return
    const executable=process.platform==='win32'?'ssh.exe':'/usr/bin/ssh'
    const child = this.launch(executable, tunnelArguments(this.profile, this.port), { stdio: ['ignore', 'ignore', 'pipe'],windowsHide:true }); this.child = child
    let pending = ''
    child.stderr?.on('data', (chunk: Buffer) => {
      pending = (pending + chunk.toString('utf8')).slice(-4096)
      if (!this.stopped && this.child === child && pending.includes('remote forward success for:')) { this.online = true; this.changed(true) }
    })
    const ended = () => {
      if (this.child !== child) return
      this.child = undefined; this.online = false; this.changed(false)
      if (!this.stopped) this.retry = setTimeout(() => this.start(), 5000)
    }
    child.once('error', ended); child.once('exit', ended)
  }
  stop(): void { this.stopped = true; clearTimeout(this.retry); this.online = false; this.child?.kill('SIGTERM'); this.changed(false) }
  close(): Promise<void> {
    if (this.stopping) return this.stopping
    const child = this.child
    this.stop()
    if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
    this.stopping = new Promise(resolve => {
      const timer = setTimeout(() => { child.kill('SIGKILL'); resolve() }, 3000)
      child.once('exit', () => { clearTimeout(timer); resolve() })
    })
    return this.stopping
  }
}
