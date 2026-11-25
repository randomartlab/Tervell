import {mobileReasoningTranslation} from './reasoning-translation'
import {MobileLiveActivity} from './mobile-live-activity'
const mobileActivity=new MobileLiveActivity()
import {mobileMessages,mobileActivityPreferences} from './mobile-activity'
import {prepareMobileMessage} from './mobile-control-attachments'
import {hostedRemote} from './hosted-remote-service'
import {nativeDirectDiscovery,nativeDirectCertificate,nativeDirectPreferences,nativeDirectStatus,onNativeDirectRestart,nativeDirectListenPort,rememberNativeDirectPort} from './native-direct-service'
import {getAgentSessionWorkspacePath} from './config-paths'
import {mobileControl,mobileControlRead,authorizeMobileControl,setMobileControlAuthority} from './mobile-control-service'
import {desktopKernelState} from './desktop-extension-service'
import {modelRoutingConfig} from './model-routing-service'
import {routedModel} from '@proma/auth-bridge/agent-routing'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { safeStorage } from 'electron'
import { RemoteConfigureSchema, RemoteTunnelProfileSchema } from '@proma/protocol'
import type { RemoteSettingsInput, RemoteStatus } from '@proma/shared'
import { RemoteHost, createTunnelDevice, createDirectDevice, createHostedDevice, remoteWorkspaceIds } from '@proma/core/remote/host'
import type { RemoteState, RemoteAdapter } from '@proma/core/remote/host'
import { DirectRemoteServer } from '@proma/core/remote/direct-server'
import { SshRemoteTunnel } from '@proma/core/remote/ssh-tunnel'
import { remotePairingLink } from '@proma/core/remote/pairing'
import { getConfigDir } from './config-paths'
import { readJsonFileSafe, writeJsonFileAtomic } from './safe-file'
import { createAgentSessionWithPlugins, listAgentSessions, getAgentSessionMessages, getAgentSessionMeta } from './agent-session-manager'
import { getAgentWorkspace,listAgentWorkspacesByUpdatedAt } from './agent-workspace-manager'
import { runAgentHeadless, stopAgent, isAgentSessionActive, agentEventBus } from './agent-service'
import { askUserService } from './agent-ask-user-service'
import { exitPlanService } from './agent-exit-plan-service'
import { remoteApprovalPreview } from '@proma/core/remote/approval-preview'
import { remotePlanPreview } from '@proma/core/remote/plan-preview'
import { permissionService } from './agent-permission-service'
import { getSettings } from './settings-service'

interface StoredRemote { settings: RemoteSettingsInput; state: RemoteState }
let stored: StoredRemote = { settings: { enabled: false, workspaceIds: [], allWorkspaces:true, allowManagement:true, connectionMode: 'random' }, state: { hostId: randomUUID(), devices: [], sent: [] } }
function currentWorkspaceIds():string[]{return stored.settings.allWorkspaces?listAgentWorkspacesByUpdatedAt().map(w=>w.id):stored.settings.workspaceIds}
const running = new Set<string>()
const live = new Map<string, string>()
let directServer: DirectRemoteServer | undefined
let lanServer:DirectRemoteServer|undefined
let lanGeneration = 0
let lanClosing: Promise<void> = Promise.resolve()
let tunnel: SshRemoteTunnel | undefined
let connectionGeneration = 0
let tunnelClosing: Promise<void> = Promise.resolve()
let error: string | undefined
let initialized = false
const remoteRuns = new Set<string>()
/** 手机创建的旁问同样参与授权收紧/撤销时的运行清理。 */
export function trackRemoteChildRun(id:string):()=>void {
  running.add(id);remoteRuns.add(id);let active=true;
  return ()=>{if(!active)return;active=false;running.delete(id);remoteRuns.delete(id);};
}
function save(): void {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('系统安全存储不可用，不能保存远程凭据')
  // 读取缓存只放内存，避免每次手机刷新都把大段对话重复写入配置。
  const durable: StoredRemote = { ...stored, state: { ...stored.state, devices: stored.state.devices.map((device) => {
    const operationIds = new Set(device.operationIds)
    return { ...device, replies: device.replies.filter((reply) => operationIds.has(reply.id)), signatures: Object.fromEntries(Object.entries(device.signatures).filter(([id]) => operationIds.has(id))) }
  }) } }
  const cipher = safeStorage.encryptString(JSON.stringify(durable)).toString('base64')
  writeJsonFileAtomic(join(getConfigDir(), 'remote.json'), { version: 1, cipher })
  hostedRemote.syncRoutes()
}
const adapter: RemoteAdapter = {
  connectionMetadata:nativeDirectDiscovery,
  control:mobileControl,authorizeControl:authorizeMobileControl,controlRead:mobileControlRead,managementEnabled:()=>stored.settings.allowManagement===true,
  sessions: () => listAgentSessions().filter((s) => !s.archived).map((s) => ({ id: s.id, title: s.title, workspaceId: s.workspaceId, updatedAt: s.updatedAt })),
  workspaces: () => listAgentWorkspacesByUpdatedAt().map((w) => ({ id: w.id, name: w.name })),
  create: async (workspaceId, title) => {
    const channelId = getSettings().agentChannelId
    if (!channelId&&(getAgentWorkspace(workspaceId)?.defaultKernelId??desktopKernelState().defaultKernelId)==='pi'&&!routedModel(modelRoutingConfig(),'pi')) throw new Error('请先配置模型或内核')
    const session = await createAgentSessionWithPlugins(title, channelId, workspaceId)
    return { id: session.id, title: session.title, workspaceId: session.workspaceId, updatedAt: session.updatedAt }
  },
  messages: mobileMessages,
  activityPreferences:mobileActivityPreferences,
  translateReasoning:mobileReasoningTranslation,
  liveActivity:id=>mobileActivity.snapshot(id),
  send: (id, text, messageId, device) => {
    const session = getAgentSessionMeta(id)
    const channelId = session?.channelId ?? getSettings().agentChannelId
    if (!session || !channelId&&(session.kernelId??'pi')==='pi'&&!routedModel(modelRoutingConfig(),'pi')) throw new Error('请先配置模型或内核')
    const project=session.workspaceId?getAgentWorkspace(session.workspaceId):undefined
    if(!project)throw new Error('项目未授权')
    const message=prepareMobileMessage(text,getAgentSessionWorkspacePath(project.slug,id))
    running.add(id)
    remoteRuns.add(id)
    void runAgentHeadless({ sessionId: id, ...message,userMessageUuid: messageId, workspaceId: session.workspaceId, channelId:channelId??'tervell-routing', modelId: session.modelId ?? getSettings().agentModelId, requireToolApproval: !(session.kernelAutoApprove===true&&device?.management===true) }, {
      source: 'bridge', onError: () => { error = '远程会话运行失败，请查看会话消息' }, onComplete: () => {}, onTitleUpdated: () => {},
    }).catch(() => { error = '远程会话运行失败' }).finally(() => { running.delete(id); remoteRuns.delete(id) })
  },
  stop: stopAgent,
  approvals: () => permissionService.getPendingRequests().map((r) => ({ requestId: r.requestId, sessionId: r.sessionId, toolName: r.toolName, description: r.description.slice(0, 1000), command: r.command?.slice(0, 2000), ...remoteApprovalPreview(r.toolInput) })),
  approve: (id, decision) => {
    const request = permissionService.getPendingRequests().find((r) => r.requestId === id)
    if (decision === 'allow' && (!request || !remoteApprovalPreview(request.toolInput).canApprove)) return false
    return permissionService.respondToPermission(id, decision, false) !== null
  },
  running: (id) => running.has(id) || isAgentSessionActive(id),
  liveText: (id) => live.get(id) ?? '',
  interactions: () => [
    ...askUserService.getPendingRequests().map((r) => ({ requestId: r.requestId, sessionId: r.sessionId, kind: 'question' as const, questions: r.questions.slice(0, 10).map((q) => ({ ...q, question: q.question.slice(0, 2000), options: q.options.slice(0, 20).map((o) => ({ label: o.label.slice(0, 500), description: o.description?.slice(0, 1000) })) })) })),
    ...exitPlanService.getPendingRequests().map((r) => {
      const preview = remotePlanPreview(r.planDocument)
      return { requestId: r.requestId, sessionId: r.sessionId, kind: 'plan' as const, planText: preview.text, canApprove: preview.canApprove }
    }),
  ],
  answer: (id, answers) => askUserService.respondToAskUser(id, answers) !== null,
  plan: (id, decision) => {
    const request = exitPlanService.getPendingRequests().find((r) => r.requestId === id)
    if (decision === 'allow' && !remotePlanPreview(request?.planDocument).canApprove) return false
    return exitPlanService.respondToExitPlanMode({ requestId: id, action: decision === 'allow' ? 'approve_bypass' : 'deny' }) !== null
  },
}
setMobileControlAuthority(device=>{const current=stored.state.devices.find(d=>d.pairing.deviceId===device.id);if(!stored.settings.enabled||!current?.paired||current.revoked||current.pairing.expiresAt<=Date.now())throw new Error('设备已失效');return {id:device.id,workspaceIds:remoteWorkspaceIds(current,currentWorkspaceIds()),management:current.management===true&&stored.settings.allowManagement===true}})
const host = new RemoteHost(stored.state, adapter, save, currentWorkspaceIds)
function load(): void {
  if (initialized) return
  initialized = true
  const value = readJsonFileSafe<{ cipher: string }>(join(getConfigDir(), 'remote.json'))
  if (!value) return
  try {
    const parsed = JSON.parse(safeStorage.decryptString(Buffer.from(value.cipher, 'base64'))) as StoredRemote
    const settings = RemoteConfigureSchema.parse({ enabled: parsed.settings.enabled, workspaceIds: parsed.settings.workspaceIds,allWorkspaces:parsed.settings.allWorkspaces??true,allowManagement:parsed.settings.allowManagement??true,connectionMode:parsed.settings.connectionMode })
    settings.connectionMode ??= readTunnelProfile() ? 'auto' : 'random'
    stored = { ...parsed, settings }
    host.state.hostId = parsed.state.hostId
    host.state.devices = parsed.state.devices
    host.state.sent = parsed.state.sent
    stored.state = host.state
    for(const device of stored.state.devices)device.allWorkspaces??=settings.allWorkspaces===true
    if (stored.state.devices.some(device => device.pairing.v === 1 && !device.revoked)) {
      for (const device of stored.state.devices) if (device.pairing.v === 1) device.revoked = true
      save(); error = '连接方式已更新，请在手机重新配对'
    }
  } catch { error = '远程配置无法解密，请重新保存配置'; stored.settings.enabled = false }
}
export function remoteStatus(): RemoteStatus {
  load()
  const configured = readTunnelProfile() !== undefined
  const active=stored.state.devices.filter(d=>d.paired&&!d.revoked&&d.pairing.expiresAt>Date.now())
  return { allowManagement:stored.settings.allowManagement===true,enabled: stored.settings.enabled, workspaceIds: currentWorkspaceIds(), allWorkspaces:stored.settings.allWorkspaces===true, connected: stored.settings.connectionMode==='random'?hostedRemote.snapshot().phase==='online':tunnel?.connected ?? false, configured, hosted:hostedRemote.snapshot(),error:error??nativeDirectDiscovery().error??undefined,connectionMode:stored.settings.connectionMode??'random',localReady:nativeDirectDiscovery().ready,
    pairedAt:Math.max(0,...active.map(d=>d.pairedAt??0))||undefined,lastSeenAt:Math.max(0,...active.map(d=>d.lastSeenAt??0))||undefined,
    devices: stored.state.devices.map((d) => ({ id: d.pairing.deviceId, paired: d.paired, revoked: d.revoked, expiresAt: d.pairing.expiresAt,management:d.management===true,pairedAt:d.pairedAt,lastSeenAt:d.lastSeenAt })) }
}
export function configureRemote(input: unknown): RemoteStatus {
  load()
  const settings = RemoteConfigureSchema.parse(input)
  settings.allWorkspaces ??= true
  settings.allowManagement ??= stored.settings.allowManagement ?? true
  settings.connectionMode ??= stored.settings.connectionMode ?? (readTunnelProfile() ? 'auto' : 'random')
  const ids = new Set(adapter.workspaces().map((w) => w.id))
  if (settings.workspaceIds.some((id) => !ids.has(id))) throw new Error('项目不存在')
  if(settings.allWorkspaces)settings.workspaceIds=[...ids]
  if (settings.enabled && !settings.allWorkspaces && !settings.workspaceIds.length) throw new Error('未选择项目访问范围')
  for (const id of remoteRuns) {
    const workspaceId = getAgentSessionMeta(id)?.workspaceId
    if (!settings.enabled || !workspaceId || !settings.allWorkspaces&&!settings.workspaceIds.includes(workspaceId)) stopAgent(id)
  }
  const scopeChanged = settings.allowManagement !== stored.settings.allowManagement || settings.allWorkspaces !== stored.settings.allWorkspaces ||
    [...settings.workspaceIds].sort().join('\0') !== [...stored.settings.workspaceIds].sort().join('\0')
  if (scopeChanged || !settings.enabled) {
    for (const device of stored.state.devices) if (!device.paired) device.revoked = true
  }
  const restart = settings.enabled !== stored.settings.enabled ||
    (settings.connectionMode ?? 'auto') !== (stored.settings.connectionMode ?? 'auto') ||
    (settings.enabled && (settings.connectionMode==='random' ? hostedRemote.snapshot().phase==='idle' : !directServer || (!lanServer && nativeDirectPreferences().enabled)))
  if(!settings.allWorkspaces)for(const device of stored.state.devices)if(!device.revoked&&device.allWorkspaces){device.workspaceIds=[...settings.workspaceIds];device.allWorkspaces=false}
  stored.settings = settings
  if(settings.allWorkspaces)for(const device of stored.state.devices)if(!device.revoked)device.allWorkspaces=true
  save()
  if (restart) startRemote()
  return remoteStatus()
}
export async function pairRemote(): Promise<string> {
  load()
  if (!stored.settings.enabled) throw new Error('请先启用远程连接')
  if (stored.settings.connectionMode === 'random') {
    if (hostedRemote.snapshot().phase !== 'online') throw new Error('请先完成集市账号确认，等待电脑连接就绪')
    for (const previous of stored.state.devices) if (!previous.paired && !previous.revoked) previous.revoked = true
    const device = createHostedDevice(stored.state, currentWorkspaceIds())
    device.allWorkspaces=stored.settings.allWorkspaces===true
    device.management = stored.settings.allowManagement === true
    save()
    await hostedRemote.waitForRoutes()
    return remotePairingLink(device.pairing)
  }
  const profile = stored.settings.connectionMode==='lan'?undefined:readTunnelProfile()
  if (!directServer) startRemote()
  for(let attempt=0;!profile&&!nativeDirectDiscovery().ready&&attempt<100;attempt++)await new Promise(resolve=>setTimeout(resolve,80))
  const direct=nativeDirectDiscovery(),url=direct.candidates[0]?.url
  if(!profile&&(!direct.ready||!url))throw new Error('电脑还没有可用的局域网地址。请连接 Wi-Fi 或网线后重新尝试。')
  // 新配对替换本次未使用的链接；不占满设备名额，也不撤销已配对手机。
  for(const previous of stored.state.devices)if(!previous.paired&&!previous.revoked)previous.revoked=true
  const device = profile?createTunnelDevice(stored.state, profile.tunnel, currentWorkspaceIds()):createDirectDevice(stored.state,{url:url!,certificateSha256:direct.certificateSha256},currentWorkspaceIds())
  device.allWorkspaces=stored.settings.allWorkspaces===true
  device.management=stored.settings.allowManagement===true
  save()
  if (!directServer) startRemote()
  return remotePairingLink(device.pairing)
}
export function revokeRemote(id: string): void {
  load()
  const device = stored.state.devices.find((d) => d.pairing.deviceId === id)
  if (!device) throw new Error('设备不存在')
  device.revoked = true
  const allowed=remoteWorkspaceIds(device,currentWorkspaceIds())
  for (const session of adapter.sessions()) if (session.workspaceId && allowed.includes(session.workspaceId) && remoteRuns.has(session.id)) stopAgent(session.id)
  save()
}
function readTunnelProfile() {
  const raw = readJsonFileSafe<unknown>(join(getConfigDir(), 'remote-tunnel-private.json'))
  const result = RemoteTunnelProfileSchema.safeParse(raw)
  return result.success ? result.data : undefined
}
export function startRemote(): void {
  load()
  stopRemote()
  if (!stored.settings.enabled) return
  if (stored.settings.connectionMode === 'random') { error = undefined; hostedRemote.start(host, stored.state); restartLanDirect(); return }
  const profile = stored.settings.connectionMode==='lan'?undefined:readTunnelProfile()
  error=undefined
  const generation = connectionGeneration
  const server = new DirectRemoteServer(host, stored.state, () => stored.settings.enabled && generation === connectionGeneration)
  directServer = server
  void server.listen().then(async () => {
    await tunnelClosing
    if (generation !== connectionGeneration) { await server.close(); return }
    if(profile){tunnel = new SshRemoteTunnel(profile, server.port, online => { if (generation === connectionGeneration) error = online ? undefined : '正在恢复外网连接；同一网络仍可使用直连' });tunnel.start()}
    restartLanDirect()
  }).catch(() => { if (generation === connectionGeneration) error = '暂时无法连接手机，请稍后重试' })
}
function stopLanDirect(): void {
  lanGeneration++
  const previous = lanServer
  lanServer = undefined
  if (previous) lanClosing = previous.close().catch(() => {})
  nativeDirectStatus({ port: 0, fingerprint: '' })
}
/** 地址偏好只更新局域网监听，不中断手机当前请求和原有隧道。 */
function restartLanDirect(): void {
  const enabled = stored.settings.enabled && (!!directServer || stored.settings.connectionMode==='random') && nativeDirectPreferences().enabled
  if (enabled && lanServer) return
  stopLanDirect()
  if (!enabled) return
  const generation = lanGeneration, remoteGeneration = connectionGeneration
  void (async () => {
    await lanClosing
    const identity = await nativeDirectCertificate()
    if (generation !== lanGeneration || remoteGeneration !== connectionGeneration) return
    const server = new DirectRemoteServer(host, stored.state, () => stored.settings.enabled && generation === lanGeneration && remoteGeneration === connectionGeneration, { host: '0.0.0.0', port:nativeDirectListenPort(), tls: identity })
    lanServer = server
    await server.listen()
    if (generation !== lanGeneration || remoteGeneration !== connectionGeneration) { await server.close(); return }
    rememberNativeDirectPort(server.port)
    nativeDirectStatus({ port: server.port, fingerprint: identity.fingerprint, hostId: stored.state.hostId })
  })().catch(() => {
    if (generation !== lanGeneration) return
    lanServer = undefined
    nativeDirectStatus({ port: 0, fingerprint: '', error: '局域网连接未能启动，请检查端口是否被占用，以及系统网络权限。' })
  })
}
export function stopRemote(): void { mobileActivity.clear(); connectionGeneration++; hostedRemote.stop(); stopLanDirect(); const previous = tunnel; tunnel = undefined; tunnelClosing = previous?.close() ?? tunnelClosing; const server = directServer; directServer = undefined; if (server) void server.close().catch(() => { error = '手机连接关闭未完成，请重试' }) }
export const authorizeHostedRemote = () => hostedRemote.openAuthorization()
export const reauthorizeHostedRemote = () => hostedRemote.reauthorize()
export function reconnectRemote():RemoteStatus {
  load()
  if(!stored.settings.enabled)throw Error('请先开启手机连接')
  error=undefined
  if(stored.settings.connectionMode==='random')hostedRemote.retry()
  else startRemote()
  return remoteStatus()
}
onNativeDirectRestart(restartLanDirect)
export function importRemoteConnectionProfile(raw:unknown):RemoteStatus {
  load();const profile=RemoteTunnelProfileSchema.parse(raw)
  if(stored.settings.enabled)throw new Error('请先关闭手机连接，再导入连接文件；已有配对不会迁移。')
  writeJsonFileAtomic(join(getConfigDir(),'remote-tunnel-private.json'),profile)
  return remoteStatus()
}
agentEventBus.on((id, payload) => {
  if(stored.settings.enabled)mobileActivity.update(id,payload)
  if (payload.kind === 'sdk_delta' && stored.settings.enabled) {
    let value = live.get(id) ?? ''
    for (const delta of payload.delta.deltas) if (delta.type === 'text_delta') value += delta.delta
    live.set(id, value.slice(-5000))
    if (live.size > 100) live.delete(live.keys().next().value!)
  }
  if (payload.kind !== 'proma_event') return
  if (payload.event.type === 'external_run_started' || payload.event.type === 'run_started') running.add(id)
  if (payload.event.type === 'run_completed') { running.delete(id); live.delete(id) }
})
