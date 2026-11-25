import { AcpReadFileSchema, AcpWriteFileSchema, AcpCreateTerminalSchema, AcpTerminalIdSchema } from '@proma/protocol'
import type { JsonValue, KernelSessionCreate } from '@proma/protocol'
import { GatedFiles, GatedTerminals, PathBoundary, ToolGate } from '@proma/core/permission'
import type { GateOptions } from '@proma/core/permission'
export interface AcpClientBridge { request(method: string, params: JsonValue | undefined, signal: AbortSignal): Promise<JsonValue>; close(): Promise<void> }
export function createAcpClientBridge(input: KernelSessionCreate, options: Omit<GateOptions, 'signal'>, boundary: PathBoundary, gate: ToolGate,terminalEnvironment:Record<string,string>={}): AcpClientBridge {
  const files = new GatedFiles(boundary, gate), terminals = new GatedTerminals(boundary, gate,terminalEnvironment)
  return {
    async request(method, raw, signal): Promise<JsonValue> {
      const execution = { ...options, signal }
      if (method === 'fs/read_text_file') { const p = AcpReadFileSchema.parse(raw); return { content: await files.read(p.path, execution, p.line??undefined, p.limit??undefined) } }
      if (method === 'fs/write_text_file') { const p = AcpWriteFileSchema.parse(raw); await files.write(p.path, p.content, execution); return {} }
      if (method === 'terminal/create') { const p = AcpCreateTerminalSchema.parse(raw); return { terminalId: await terminals.create({ ...p, cwd: p.cwd ?? input.cwd, args:p.args??[],env:p.env??[], outputByteLimit:p.outputByteLimit??undefined }, execution) } }
      const p = AcpTerminalIdSchema.parse(raw)
      switch (method) {
        case 'terminal/output': return gate.run({name:'TerminalOutput',kind:'read',effect:'read'},{id:p.terminalId},execution,()=>terminals.output(p.terminalId))
        case 'terminal/wait_for_exit': return gate.run({name:'TerminalWait',kind:'read',effect:'read'},{id:p.terminalId},execution,()=>terminals.wait(p.terminalId,signal))
        case 'terminal/kill': await gate.run({name:'TerminalKill',kind:'read',effect:'read'},{id:p.terminalId},execution,()=>terminals.kill(p.terminalId)); return {}
        case 'terminal/release': await gate.run({name:'TerminalRelease',kind:'read',effect:'read'},{id:p.terminalId},execution,()=>terminals.release(p.terminalId)); return {}
        default: throw new Error('客户端回调未实现')
      }
    },
    close: () => terminals.close(),
  }
}
