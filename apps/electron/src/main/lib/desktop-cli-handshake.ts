import { JsonRpcPeer, terminateAcpProcess, spawnAcpProcess, isKernelAuthenticationRequired, acpPromptFailureMessage } from '@proma/kernel-host'
import { AcpInitializeResultSchema, AcpNewSessionResultSchema } from '@proma/protocol'
import type { ManagedCli } from './desktop-cli-managed'
import { assertKernelNativeAuthentication } from './kernel-native-auth'

export interface ManagedCliVerification { protocol: 1; initialized?:boolean; session: 'ready' | 'login-required'; agentName?: string; agentVersion?: string; checkedAt: number }
/** 验证适配器及其CLI依赖能创建会话；账号缺失单独报告，不发模型请求。 */
export async function verifyManagedCliHandshake(cli: ManagedCli, cwd: string, env: Record<string, string>, signal: AbortSignal): Promise<ManagedCliVerification> {
  signal.throwIfAborted()
  const child = spawnAcpProcess(cli.command, cli.args, { cwd, env: { ...env, ...cli.env, NO_BROWSER:'true' }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' })
  let stderr = ''
  let authenticationPending=false,creatingSession=false
  child.stderr.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-8192);if(creatingSession&&isKernelAuthenticationRequired(Error(stderr))){authenticationPending=true;peer.close(Error('内核尚未登录，需要模型认证'));terminateAcpProcess(child)} })
  const exited = new Promise<void>(resolve => child.once('close', () => resolve()))
  const peer = new JsonRpcPeer(child.stdout, child.stdin, { timeoutMs: 45000 })
  child.once('error', error => peer.close(error))
  const abort = () => { peer.close(Error('安装已取消')); terminateAcpProcess(child) }
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
  try {
    const raw = AcpInitializeResultSchema.parse(await peer.request('initialize', { protocolVersion: 1, clientInfo: { name: 'tervell', version: '0.19' }, clientCapabilities: { session: { configOptions: { boolean: {} } } } }))
    const info = raw.agentInfo && typeof raw.agentInfo === 'object' && !Array.isArray(raw.agentInfo) ? raw.agentInfo as Record<string, unknown> : {}
    const result: ManagedCliVerification = { protocol: 1, initialized:true,session: 'ready', checkedAt: Date.now(), ...(typeof info.name === 'string' ? { agentName: info.name } : {}), ...(typeof info.version === 'string' ? { agentVersion: info.version } : {}) }
    try { creatingSession=true;AcpNewSessionResultSchema.parse(await peer.request('session/new', { cwd, mcpServers: [] }, signal)); assertKernelNativeAuthentication(cli.id,{...env,...cli.env}) }
    catch (error) { if (!authenticationPending&&!isKernelAuthenticationRequired(error)) throw error; result.session = 'login-required' }
    return result
  } catch (error) {
    if(!signal.aborted&&isKernelAuthenticationRequired(error))return {protocol:1,initialized:false,session:'login-required',checkedAt:Date.now()};
    const secrets = Object.entries({ ...env, ...cli.env }).filter(([key]) => /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i.test(key)).map(([, value]) => value)
    throw Error(acpPromptFailureMessage(error, secrets, stderr))
  } finally {
    signal.removeEventListener('abort', abort); peer.close(); terminateAcpProcess(child)
    await exited
  }
}
