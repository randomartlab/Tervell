import { spawn } from 'node:child_process'
const spawnPortable: typeof spawn = require('cross-spawn')
import type { ChildProcess } from 'node:child_process'
import { randomUUID, createHash } from 'node:crypto'
import { statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PathBoundary } from './boundary.ts'
import { commandFacts } from './rules.ts'
import { ToolGate } from './gate.ts'
import type { GateOptions } from './gate.ts'
import type {JsonValue}from'@proma/protocol'
interface Terminal { child: ChildProcess; output: Buffer; truncated: boolean; done: Promise<void>; exitCode?: number; signal?: string; stop: () => void; ended: boolean }
/** ACP 允许不带 args 的完整命令；有参数时仍按 argv 启动。路径含空格的可执行文件不当作脚本。 */
export function resolveAcpTerminalCommand(command: string, args: string[], platform = process.platform as string, env: NodeJS.ProcessEnv = process.env): { command: string; args: string[] } {
  if (args.length || !/[\s;&|<>()$`"']/.test(command.trim()) || existsSync(command)) return { command, args }
  return platform === 'win32'
    ? { command: env.ComSpec || env.COMSPEC || join(env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe'), args: ['/d', '/s', '/c', command] }
    : { command: '/bin/sh', args: ['-c', command] }
}
/** cmd.exe /c使用原生命令字符串；Node的C argv反斜杠转义会破坏脚本内的双引号。 */
export function acpTerminalWindowsArguments(command:string,args:string[],platform:string=process.platform):{args:string[];windowsVerbatimArguments?:boolean}{
  if(platform!=='win32'||!/(?:^|[\\/])cmd(?:\.exe)?$/i.test(command))return {args}
  const at=args.findIndex(arg=>/^\/[ck]$/i.test(arg))
  if(at<0||at!==args.length-2)return {args}
  return {args:[...args.slice(0,at+1),'"'+args[at+1]+'"'],windowsVerbatimArguments:true}
}
/** shell:false；环境修改进入同一精确审批，终端句柄仅属于此会话桥。 */
export class GatedTerminals {
  private generation=0
  private starting=0
  private readonly items = new Map<string, Terminal>()
  constructor(private readonly boundary: PathBoundary, private readonly gate: ToolGate, private readonly env: Record<string, string> = {}) {}
  async create(input: { command: string; args: string[]; cwd: string; env: Array<{name: string; value: string}>; outputByteLimit?: number }, options: GateOptions): Promise<string> {
    if (this.items.size+this.starting >= 8) throw new Error('此会话最多同时保留 8 个终端，请先释放不用的终端')
    if (!input.command.trim() || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.command) || input.args.some((arg) => arg.includes('\0'))) throw new Error('终端命令或参数含无效字符')
    if (input.env.length>512 || input.env.some(row=>!/^[A-Za-z_][A-Za-z0-9_]*$/.test(row.name)||row.value.includes('\0')) || Buffer.byteLength(JSON.stringify(input.env))>1024*1024) throw new Error('终端环境变量名称、内容或大小无效')
    if(input.outputByteLimit!==undefined&&(!Number.isSafeInteger(input.outputByteLimit)||input.outputByteLimit<0))throw new Error('终端输出保留上限无效')
    const generation=this.generation
    const command = [input.command, ...input.args.map((arg) => /^[a-zA-Z0-9_./=-]+$/.test(arg) ? arg : JSON.stringify(arg))].join(' ')
    const environment=Object.fromEntries(input.env.map(row=>[row.name,row.value]))
    // 审批和日志只显示变量名与不可逆摘要；值仍参与精确授权，不能泄露API Key。
    const environmentInput:Record<string,JsonValue>=input.env.length?{environmentNames:Object.keys(environment).sort(),environmentSha256:createHash('sha256').update(JSON.stringify(Object.entries(environment).sort(([a],[b])=>a.localeCompare(b)))).digest('hex')}:{}
    return this.gate.run({ name: /pwsh|powershell/i.test(input.command) ? 'PowerShell' : 'execute', kind: 'execute', effect: commandFacts(command).risk === 'read'&&!input.env.length ? 'read' : 'write', command,forceAsk:!!input.env.length }, { command, cwd:input.cwd,...environmentInput }, options, async () => {
      if(generation!==this.generation||options.signal.aborted)throw new Error('终端会话已关闭或取消')
      if(this.items.size+this.starting>=8)throw new Error('终端数量超限')
      const cwd = this.boundary.assert(input.cwd, 'read'); if (!statSync(cwd).isDirectory()) throw new Error('cwd不是目录')
      this.starting++
      const launchEnv = { PATH: process.env.PATH ?? '', ...this.env, ...environment }
      const launch = resolveAcpTerminalCommand(input.command, input.args, process.platform, launchEnv)
      const windows=acpTerminalWindowsArguments(launch.command,launch.args)
      let child: ChildProcess
      try { child = spawnPortable(launch.command, windows.args, { cwd, env: launchEnv, shell: false,...(windows.windowsVerbatimArguments?{windowsVerbatimArguments:true}:{}), detached: process.platform !== 'win32',windowsHide:true, stdio: ['ignore', 'pipe', 'pipe'] }) }
      catch (error) { this.starting--; throw error }
      const kill = () => { try { if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL'); else if(!item?.ended&&child.pid){const killer=spawn('taskkill.exe',['/pid',String(child.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});killer.on('error',()=>child.kill('SIGKILL'));}else if(!item?.ended)child.kill('SIGKILL') } catch { /* 已退出；POSIX根进程退出后仍须回收同组后台子进程。 */ } }
      let finish: () => void = () => {}
      const item: Terminal = { child, output: Buffer.alloc(0), truncated: false, done: new Promise<void>((resolve) => { finish = resolve }), stop: kill, ended:false }
      // 接受上游保留量请求，宿主仍按预算保留尾部并如实报告 truncated。
      const max = Math.min(input.outputByteLimit ?? 65536, 1024 * 1024)
      const collect = (bytes: Buffer) => { const next = Buffer.concat([item.output, bytes]); item.truncated ||= next.length > max; let start=Math.max(0,next.length-max);while(start<next.length&&(next[start]!&0xc0)===0x80)start++;item.output=Buffer.from(next.subarray(start)) }
      child.stdout?.on('data', collect); child.stderr?.on('data', collect)
      // ACP终端由Agent显式wait/kill/release或用户停止管理，不按固定两分钟杀掉构建。
      child.once('close', (code, signal) => { item.ended=true; options.signal.removeEventListener('abort', kill); if (code !== null) item.exitCode = code; if (signal) item.signal = signal; finish() })
      child.once('error', () => { item.ended=true;options.signal.removeEventListener('abort',kill);finish() })
      options.signal.addEventListener('abort', kill, { once: true }); if (options.signal.aborted) kill()
      try{await new Promise<void>((resolve, reject) => { child.once('spawn', resolve); child.once('error', (error:NodeJS.ErrnoException) => reject(new Error(error.code==='ENOENT'?'找不到终端可执行程序，请在内核设置检查命令和 PATH':error.code==='EACCES'?'终端程序没有执行权限':'终端启动失败，请检查当前命令与工作目录'))) })}finally{this.starting--}
      if(generation!==this.generation||options.signal.aborted){kill();await item.done;throw new Error('终端已取消')}
      const id = randomUUID(); this.items.set(id, item); return id
    })
  }
  private get(id: string): Terminal { const item = this.items.get(id); if (!item) throw new Error('终端不属于此会话'); return item }
  output(id: string): { output: string; truncated: boolean; exitStatus?: { exitCode?: number; signal?: string } } {
    const item = this.get(id)
    return { output: new TextDecoder('utf-8').decode(item.output,{stream:true}), truncated: item.truncated, ...(item.exitCode !== undefined || item.signal ? { exitStatus: { ...(item.exitCode === undefined ? {} : {exitCode:item.exitCode}), ...(item.signal ? {signal:item.signal} : {}) } } : {}) }
  }
  async wait(id: string, signal: AbortSignal): Promise<{ exitCode?: number; signal?: string }> {
    const item = this.get(id)
    let stop:(()=>void)|undefined
    try{await Promise.race([item.done,new Promise<never>((_resolve,reject)=>{stop=()=>reject(new Error('等待已取消'));signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop()})])}
    finally{if(stop)signal.removeEventListener('abort',stop)}
    if (signal.aborted) throw new Error('等待已取消')
    if (item.exitCode === undefined && !item.signal) throw new Error('终端未提供退出状态')
    return { ...(item.exitCode === undefined ? {} : { exitCode:item.exitCode }), ...(item.signal ? {signal:item.signal} : {}) }
  }
  async kill(id: string): Promise<void> { const item = this.get(id); item.stop(); await item.done }
  async release(id: string): Promise<void> { await this.kill(id); this.items.delete(id) }
  async close(): Promise<void> { this.generation++;for (const id of [...this.items.keys()]) await this.release(id) }
}
