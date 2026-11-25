import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { RemoteRequestSchema } from '@proma/protocol'
import type { RemotePairing, RemoteRequest, RemoteResponse, RemoteTunnelDescriptor, ApiRequest,MobileControlCall } from '@proma/protocol'
import { openRemote, sealRemote } from './crypto'

export interface RemoteDevice {
  pairing: RemotePairing
  hostToken: string
  bootstrap?: RemotePairing
  pairRequestId?: string
  workspaceIds: string[]
  /** 全项目授权按请求解析，自动覆盖配对后新建的工作区。 */
  allWorkspaces?: boolean
  paired: boolean
  revoked: boolean
  rx: number
  tx: number
  replies: RemoteResponse[]
  signatures: Record<string, string>
  operationIds: string[]
  coreDeviceId?: string
  management?: boolean
  pairedAt?: number
  lastSeenAt?: number
}
export interface RemoteState {
  hostId: string
  devices: RemoteDevice[]
  sent: Array<{ key: string; text: string }>
}
export function remoteWorkspaceIds(device: Pick<RemoteDevice,'workspaceIds'|'allWorkspaces'>, current: string[]): string[] {
  return device.allWorkspaces ? [...new Set(current)] : device.workspaceIds.filter(id => current.includes(id))
}
export interface RemoteSession { id: string; title: string; workspaceId?: string; updatedAt: number }
export interface RemoteApproval { requestId: string; sessionId: string; toolName: string; description: string; command?: string; inputPreview?: string; canApprove?: boolean }
export interface RemoteInteraction {
  requestId: string
  sessionId: string
  kind: 'question' | 'plan'
  questions?: Array<{ question: string; options: Array<{ label: string; description?: string }>; multiSelect?: boolean }>
  planText?: string
  canApprove?: boolean
}
export interface RemoteAdapter {
  sessions(): RemoteSession[]
  workspaces(): Array<{ id: string; name: string }>
  create(workspaceId: string, title?: string): Promise<RemoteSession>
  messages(id: string): Array<{ id: string; role: string; content: string; createdAt: number; activity?:Array<{id:string;kind:string;label:string;status:string;body:string;createdAt:number}> }>
  liveActivity?(id:string):Array<{id:string;kind:string;label:string;status:string;body:string;createdAt:number}>
  translateReasoning?(id:string,text:string,running:boolean):{translation?:string;translationStatus?:string;translationError?:string}
  activityPreferences?():{reasoning:string;operations:string}
  send(id: string, text: string, messageId: string, device?:{id:string;management:boolean}): void
  stop(id: string): void
  approvals(): RemoteApproval[]
  approve(id: string, decision: 'allow' | 'deny'): boolean
  running(id: string): boolean
  liveText?(id: string): string
  interactions?(): RemoteInteraction[]
  answer?(id: string, answers: Record<string, string>): boolean
  plan?(id: string, decision: 'allow' | 'deny'): boolean
  rpc?(device: { id: string; workspaceIds: string[] }, request: ApiRequest): Promise<unknown>
  authorizeRpc?(device: { id: string; workspaceIds: string[] }, request: ApiRequest): Promise<void>
  control?(device:{id:string;workspaceIds:string[];management:boolean},call:MobileControlCall):Promise<unknown>
  authorizeControl?(device:{id:string;workspaceIds:string[];management:boolean},call:MobileControlCall):void|Promise<void>
  controlRead?(operation:string):boolean
  managementEnabled?():boolean
  remoteProtocol?: 'core'
  connectionMetadata?():unknown
}
export function createRemoteDevice(state: RemoteState, relay: string, workspaceIds: string[], now = Date.now()): RemoteDevice {
  const hex = () => randomBytes(32).toString('hex')
  if (state.devices.filter((d) => !d.revoked && d.pairing.expiresAt > now).length >= 5) throw new Error('最多配对 5 台设备，请先撤销旧设备')
  const device: RemoteDevice = { pairing: { v: 1, relay, room: hex(), token: hex(), key: hex(), hostId: state.hostId, deviceId: randomUUID(), expiresAt: now + 300000 }, hostToken: hex(), workspaceIds: [...workspaceIds], paired: false, revoked: false, rx: 0, tx: 0, replies: [], signatures: {}, operationIds: [] }
  state.devices.push(device)
  return device
}
export function createTunnelDevice(state: RemoteState, tunnel: RemoteTunnelDescriptor, workspaceIds: string[], now = Date.now()): RemoteDevice {
  const device = createRemoteDevice(state, 'https://localhost/', workspaceIds, now)
  const { relay: _relay, v: _version, ...pairing } = device.pairing as Extract<RemotePairing, { v: 1 }>
  device.pairing = { ...pairing, v: 2, tunnel }
  return device
}
export function createDirectDevice(state:RemoteState,direct:Extract<RemotePairing,{v:3}>['direct'],workspaceIds:string[],now=Date.now()):RemoteDevice {
  const device=createRemoteDevice(state,'https://localhost/',workspaceIds,now)
  const {relay:_relay,v:_version,...pairing}=device.pairing as Extract<RemotePairing,{v:1}>
  device.pairing={...pairing,v:3,direct};return device
}
export function createHostedDevice(state: RemoteState, workspaceIds: string[], now = Date.now()): RemoteDevice {
  const device = createRemoteDevice(state, 'https://randomai.art/connect/', workspaceIds, now)
  const { relay: _relay, v: _version, ...pairing } = device.pairing as Extract<RemotePairing, { v: 1 }>
  device.pairing = { ...pairing, v: 4, service: 'random-market' }
  return device
}
export class RemoteHost {
  constructor(readonly state: RemoteState, private adapter: RemoteAdapter, private save: () => void, private currentWorkspaces: () => string[]) {}
  async receive(device: RemoteDevice, packet: unknown, now = Date.now()): Promise<ReturnType<typeof sealRemote> | null> {
    if (device.revoked || now > device.pairing.expiresAt) throw new Error('设备已撤销或过期')
    let decoded
    try { decoded = openRemote(device.pairing, 'to-host', 0, packet) } catch (error) {
      if (!device.bootstrap) throw error
      decoded = openRemote(device.bootstrap, 'to-host', 0, packet)
      const retry = RemoteRequestSchema.parse(decoded.value)
      if (retry.method !== 'pair' || retry.id !== device.pairRequestId) throw error
    }
    const request = RemoteRequestSchema.parse(decoded.value)
    if (Math.abs(now - request.sentAt) > 120000) throw new Error('请求已过期，请检查设备时间')
    device.lastSeenAt = now
    const { sentAt: _sentAt, ...identity } = request
    const signature = createHash('sha256').update(JSON.stringify(identity)).digest('hex')
    if (device.signatures[request.id] && device.signatures[request.id] !== signature) throw new Error('重复请求 ID 的参数不一致')
    const recovering = !!device.signatures[request.id]
    let response = device.replies.find((reply) => reply.id === request.id)
    // 权限收紧后旧结果不得继续从缓存返回。
    if (response && device.paired && request.method !== 'pair') {
      const allowed = new Set(remoteWorkspaceIds(device,this.currentWorkspaces()))
      const scoped = this.adapter.sessions().filter((s) => s.workspaceId && allowed.has(s.workspaceId))
      if ('workspaceId' in request && !allowed.has(request.workspaceId)) response = { id: request.id, ok: false, error: '项目未授权' }
      if ('sessionId' in request && !scoped.some((s) => s.id === request.sessionId)) response = { id: request.id, ok: false, error: '会话未授权或不存在' }
      if (['sessions', 'approvals', 'status', 'interactions'].includes(request.method)) response = { id: request.id, ok: true, data: await this.execute(device, request, now) }
      if(request.method==='control'){
        try{await this.controlAccess(device,request.call,allowed);if(this.adapter.controlRead?.(request.call.operation))response=undefined}catch{response={id:request.id,ok:false,error:'操作未授权或设备已失效'}}
      }
      if (request.method === 'rpc') {
        const readMethods = ['session.list', 'session.detail', 'session.timeline', 'session.events', 'approval.list', 'host.status', 'lease.status', 'revision.probe', 'module.catalog', 'files.tree', 'files.diff', 'terminal.list', 'terminal.attach']
        try {
          if (!this.adapter.authorizeRpc) throw new Error('授权不可用')
          await this.adapter.authorizeRpc({ id: device.pairing.deviceId, workspaceIds: [...allowed] }, request.request)
          if (readMethods.includes(request.request.method)) response = undefined
        } catch { response = { id: request.id, ok: false, error: '项目未授权或设备已失效' } }
      }
    }
    if (!response && !recovering && decoded.seq <= device.rx) throw new Error('请求已处理，结果不可用；请刷新会话确认')
    const rpcWrites = ['session.send', 'session.queue', 'session.interrupt', 'approval.respond', 'lease.acquire', 'lease.renew', 'lease.release', 'lease.transfer', 'terminal.create', 'terminal.kill', 'terminal.release']
    const mutating = request.method==='control'?!this.adapter.controlRead?.(request.call.operation):['pair', 'create', 'send', 'stop', 'approve', 'answer', 'plan'].includes(request.method) || (request.method === 'rpc' && rpcWrites.includes(request.request.method))
    if (mutating && device.operationIds.length >= 10000 && !recovering) throw new Error('设备操作记录已满，请重新配对')
    device.rx = Math.max(device.rx, decoded.seq)
    device.signatures[request.id] = signature
    if (mutating && !recovering) device.operationIds.push(request.id)
    this.save()
    const recoverableRpc = request.method==='control'&&!!this.adapter.controlRead?.(request.call.operation)||request.method === 'rpc' && (!mutating || ['session.send', 'session.queue'].includes(request.request.method))
    if (!response && recovering && !recoverableRpc) response = { id: request.id, ok: false, error: '上次操作的完成状态不确定，请刷新会话确认，勿重复发送' }
    if (!response) {
      try {
        if (!device.paired && request.method !== 'pair') throw new Error('请先完成配对')
        response = { id: request.id, ok: true, data: await this.execute(device, request, now) }
      } catch (error) {
        const safeMessages = ['配对凭据已使用', '项目未授权', '会话未授权或不存在', '重复消息 ID 的正文不一致', '会话正在运行，请结束后重试', '发送记录已达上限，请在电脑清理设备记录', '审批已处理或不存在', '交互已处理或不存在', '交互类型不匹配', '请回答全部问题', '请在电脑查看完整有效计划后审批', '请在电脑查看完整工具参数后批准', '请先完成配对']
        response = { id: request.id, ok: false, error: error instanceof Error && safeMessages.includes(error.message) ? error.message : '操作未完成，请检查项目授权与会话状态后重试' }
      }
      const responseId = response.id
      device.replies = device.replies.filter(reply => reply.id !== responseId)
      device.replies.push(response)
      const evicted = device.replies.slice(0, -4)
      device.replies = device.replies.slice(-4)
      for (const reply of evicted) if (!device.operationIds.includes(reply.id)) delete device.signatures[reply.id]
    }
    if(request.method==='control'&&device.paired){
      try{if(device.revoked||device.pairing.expiresAt<=Date.now())throw new Error();await this.controlAccess(device,request.call,new Set(remoteWorkspaceIds(device,this.currentWorkspaces())))}catch{response={id:request.id,ok:false,error:'操作未授权或设备已失效'}}
    }
    if (JSON.stringify(response).length > 140000) response = { id: request.id, ok: false, error: '响应过大，请在电脑查看完整内容' }
    device.tx++
    this.save()
    return sealRemote(device.pairing, 'to-device', device.tx, response)
  }
  private async controlAccess(device:RemoteDevice,call:MobileControlCall,allowed:Set<string>):Promise<void>{
    if(!this.adapter.control||!this.adapter.authorizeControl)throw new Error('控制能力不可用')
    await this.adapter.authorizeControl({id:device.pairing.deviceId,workspaceIds:[...allowed],management:device.management===true&&this.adapter.managementEnabled?.()===true},call)
  }
  private async execute(device: RemoteDevice, request: RemoteRequest, now: number): Promise<unknown> {
    const allowed = new Set(remoteWorkspaceIds(device,this.currentWorkspaces()))
    const sessions = this.adapter.sessions().filter((s) => s.workspaceId && allowed.has(s.workspaceId))
    const assertSession = (id: string) => { if (!sessions.some((s) => s.id === id)) throw new Error('会话未授权或不存在') }
    if ('sessionId' in request) assertSession(request.sessionId)
    switch (request.method) {
      case 'pair':
        if (device.paired) throw new Error('配对凭据已使用')
        device.bootstrap = { ...device.pairing }
        device.pairRequestId = request.id
        device.paired = true
        device.pairedAt = now
        device.pairing.key = request.deviceKey
        device.pairing.token = request.deviceToken
        device.pairing.expiresAt = now + 90 * 86400000
        return { deviceId: device.pairing.deviceId, expiresAt: device.pairing.expiresAt, controlAvailable:!!this.adapter.control,...(this.adapter.remoteProtocol ? { protocol: this.adapter.remoteProtocol } : {}) }
      case 'control':await this.controlAccess(device,request.call,allowed);return this.adapter.control!({id:device.pairing.deviceId,workspaceIds:[...allowed],management:device.management===true&&this.adapter.managementEnabled?.()===true},request.call)
      case 'status': return { online: true,controlAvailable:!!this.adapter.control,management:device.management===true&&this.adapter.managementEnabled?.()===true, workspaces: this.adapter.workspaces().filter((w) => allowed.has(w.id)),...(this.adapter.connectionMetadata?{direct:this.adapter.connectionMetadata()}:{} ) }
      case 'rpc':
        if (request.request.clientKind !== 'mobile' || !this.adapter.rpc) throw new Error('此连接不支持该操作')
        if (request.request.method === 'session.send' || request.request.method === 'session.queue') request.request.params.clientMessageId ??= request.request.requestId
        return this.adapter.rpc({ id: device.pairing.deviceId, workspaceIds: [...allowed] }, request.request)
      case 'sessions': return { sessions: sessions.slice(0, 100).map((s) => ({ ...s, title: s.title.slice(0, 200), running: this.adapter.running(s.id) })), hasMore: sessions.length > 100 }
      case 'create':
        if (!allowed.has(request.workspaceId)) throw new Error('项目未授权')
        return this.adapter.create(request.workspaceId, request.title)
      case 'messages': {
        const messages = this.adapter.messages(request.sessionId)
        const end = Math.min(request.before ?? messages.length, messages.length)
        const start = Math.max(0, end - 20)
        const page = messages.slice(start, end).map((m) => ({ id: m.id, role: m.role, content: m.content.slice(0,32000), createdAt: m.createdAt, truncated:m.content.length>32000, ...(m.activity?.length?{activity:m.activity.slice(-20).map(row=>({...row,body:row.body.slice(0,1200),truncated:row.body.length>1200}))}:{}) }))
        while (JSON.stringify(page).length > 65000 && page.length > 1) page.shift()
        let translationBudget=50000
        const translate=(row:{kind:string;body:string;status:string})=>{
         if(row.kind!=='reasoning'||translationBudget<=0)return {}
         const result=this.adapter.translateReasoning?.(request.sessionId,row.body,row.status==='running')??{}
         if(result.translation){const available=Math.min(2400,translationBudget);translationBudget-=available;return {...result,translation:result.translation.slice(0,available)}}
         return result
        }
        const result = { liveActivity:this.adapter.liveActivity?.(request.sessionId).slice(-20).map(row=>({...row,body:row.body.slice(-1200),truncated:row.body.length>1200,...translate({...row,body:row.body.slice(-1200)})})), activityPreferences:this.adapter.activityPreferences?.(), messages: page.map((m) => ({ ...m, content: m.content.slice(0, 32000), truncated: m.truncated,...(m.activity?{activity:m.activity.map(row=>({...row,...translate(row)}))}:{}) })), before: end - page.length, hasOlder: end > page.length, running: this.adapter.running(request.sessionId), liveText: this.adapter.liveText?.(request.sessionId)?.slice(-5000) ?? '' }
        while(JSON.stringify(result).length>135000&&result.messages.length>1){result.messages.shift();result.before=end-result.messages.length;result.hasOlder=true}
        const revision = createHash('sha256').update(JSON.stringify(result)).digest('hex')
        return request.knownRevision === revision ? { unchanged: true, revision } : { ...result, revision }
      }
      case 'send': {
        const key = `${request.sessionId}:${request.clientMessageId}`
        const sent = this.state.sent.find((s) => s.key === key)
        if (sent) {
          if (sent.text !== createHash('sha256').update(request.text).digest('hex')) throw new Error('重复消息 ID 的正文不一致')
          return { accepted: true, duplicate: true }
        }
        if (this.adapter.running(request.sessionId)) throw new Error('会话正在运行，请结束后重试')
        if (this.state.sent.length >= 10000) throw new Error('发送记录已达上限，请在电脑清理设备记录')
        this.state.sent.push({ key, text: createHash('sha256').update(request.text).digest('hex') })
        this.save() // 先记录，再启动；崩溃后不自动重复执行有副作用的消息。
        this.adapter.send(request.sessionId, request.text, request.clientMessageId,{id:device.pairing.deviceId,management:device.management===true&&this.adapter.managementEnabled?.()===true})
        return { accepted: true }
      }
      case 'stop': this.adapter.stop(request.sessionId); return { stopped: true }
      case 'approvals': return { approvals: this.adapter.approvals().filter((r) => sessions.some((s) => s.id === r.sessionId)).slice(0, 10) }
      case 'interactions': return { interactions: (this.adapter.interactions?.() ?? []).filter((r) => sessions.some((s) => s.id === r.sessionId)).slice(0, 10) }
      case 'answer':
      case 'plan': {
        const interaction = this.adapter.interactions?.().find((r) => r.requestId === request.requestId)
        if (!interaction) throw new Error('交互已处理或不存在')
        assertSession(interaction.sessionId)
        if (request.method === 'answer') {
          if (interaction.kind !== 'question') throw new Error('交互类型不匹配')
          if (!interaction.questions?.every((q) => typeof request.answers[q.question] === 'string' && request.answers[q.question]!.trim())) throw new Error('请回答全部问题')
          return { resolved: this.adapter.answer?.(request.requestId, request.answers) ?? false }
        }
        if (interaction.kind !== 'plan') throw new Error('交互类型不匹配')
        if (request.decision === 'allow' && interaction.canApprove === false) throw new Error('请在电脑查看完整有效计划后审批')
        return { resolved: this.adapter.plan?.(request.requestId, request.decision) ?? false }
      }
      case 'approve': {
        const approval = this.adapter.approvals().find((r) => r.requestId === request.requestId)
        if (!approval) throw new Error('审批已处理或不存在')
        assertSession(approval.sessionId)
        if (request.decision === 'allow' && approval.canApprove === false) throw new Error('请在电脑查看完整工具参数后批准')
        return { resolved: this.adapter.approve(request.requestId, request.decision) }
      }
    }
  }
}
