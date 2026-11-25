import { atom, createStore } from 'jotai/vanilla'
import { API_CONTRACTS } from '@proma/protocol'
import type { ApiResult, Session } from '@proma/protocol'
import { CoreRpc, ApiError } from './rpc.ts'
import { emptyConversation, applyEventPage } from './conversation.ts'
import type { Conversation } from './conversation.ts'

export interface ClientState {
  status: 'disconnected' | 'connecting' | 'online' | 'reconnecting'
  sessions: Session[]
  selected?: string
  conversation: Conversation
  approvals: ApiResult<'approval.list'>['approvals']
  lease: ApiResult<'lease.status'>['lease']
  host?: ApiResult<'host.status'>
  busy: boolean
  respondingApprovals: string[]
  approvalErrors: Record<string, string>
  error?: string
}
export class WorkbenchClient {
  readonly state = atom<ClientState>({ status: 'disconnected', sessions: [], conversation: emptyConversation(), approvals: [], lease: null, busy: false, respondingApprovals: [], approvalErrors: {} })
  readonly store = createStore()
  private lifetime = new AbortController()
  private selection = new AbortController()
  private socket?: WebSocket
  private interval?: ReturnType<typeof setInterval>
  private reconnect?: ReturnType<typeof setTimeout>
  private selectionVersion = 0
  private refreshing?: AbortSignal
  private syncing?: number
  private sendAttempt?: { id: string; text: string; queue: boolean; messageId: string }
  constructor(readonly rpc: CoreRpc, private readonly socketFactory: (url: string) => WebSocket = url => new WebSocket(url)) {}
  private update(patch: Partial<ClientState>): void { this.store.set(this.state, current => ({ ...current, ...patch })) }
  private failure(error: unknown): void {
    if (this.lifetime.signal.aborted) return
    this.update({ error: error instanceof Error ? error.message : '连接未能完成' })
    if (error instanceof ApiError && [401, 403].includes(error.status) && ['UNAUTHORIZED', 'AUTH_REQUIRED', 'WS_AUTH_FAILED', 'CLIENT_MISMATCH'].includes(error.code)) this.disconnect()
  }
  async connect(token = ''): Promise<void> {
    this.disconnect()
    this.lifetime = new AbortController()
    const signal = this.lifetime.signal
    this.rpc.useToken(token)
    this.update({ status: 'connecting', error: undefined, sessions: [], approvals: [], host: undefined, selected: undefined, conversation: emptyConversation() })
    try {
      if (!token.trim()) {
        try { await this.rpc.call('host.status', {}, signal) }
        catch (error) { if (error instanceof ApiError && error.status === 401) await this.rpc.localSession(signal); else throw error }
      }
      await this.refresh(signal)
      if (signal.aborted) return
      this.update({ status: 'online' })
      this.interval = setInterval(() => { void this.refresh(signal).catch(error => this.failure(error)) }, 5000)
    } catch (error) { if (!signal.aborted) { this.update({ status: 'disconnected' }); this.failure(error) }; throw error }
  }
  disconnect(): void {
    this.lifetime.abort(); this.selection.abort(); this.selectionVersion++
    clearInterval(this.interval); clearTimeout(this.reconnect)
    this.socket?.close(); this.socket = undefined
    this.rpc.useToken('')
    this.sendAttempt = undefined
    this.update({ status: 'disconnected', selected: undefined, sessions: [], host: undefined, conversation: emptyConversation(), approvals: [], lease: null, busy: false, respondingApprovals: [], approvalErrors: {} })
  }
  async refresh(signal = this.lifetime.signal): Promise<void> {
    if (signal.aborted || this.refreshing === signal) return
    this.refreshing = signal
    try {
      const sessions: Session[] = []
      let cursor: string | undefined
      const seen = new Set<string>()
      do {
        const page = await this.rpc.call('session.list', { limit: 200, cursor }, signal)
        sessions.push(...page.entries)
        cursor = page.pageInfo.hasMore ? page.pageInfo.nextCursor : undefined
        if (page.pageInfo.hasMore && (!cursor || seen.has(cursor))) throw new Error('会话目录游标未推进')
        if (cursor) seen.add(cursor)
        if (sessions.length > 10000) throw new Error('会话过多，请在宿主归档后重试')
      } while (cursor)
      const host = await this.rpc.call('host.status', {}, signal)
      let approvals: ClientState['approvals'] = []
      try { approvals = (await this.rpc.call('approval.list', {}, signal)).approvals } catch (error) { if (!(error instanceof ApiError && error.code === 'READ_ONLY_DEVICE')) throw error }
      if (!signal.aborted) {
        this.update({ sessions: [...new Map(sessions.map(session => [session.id, session])).values()], host, approvals, error: undefined })
        const selected = this.store.get(this.state).selected
        if (selected && !sessions.some(session => session.id === selected)) { this.clearSelection(); this.update({ error: '此会话已移除或不再授权' }) }
        else if (selected) await this.catchUp()
      }
    } finally { if (this.refreshing === signal) this.refreshing = undefined }
  }
  clearSelection(): void {
    this.selection.abort(); this.selectionVersion++; this.socket?.close(); this.socket = undefined
    clearTimeout(this.reconnect)
    this.update({ selected: undefined, conversation: emptyConversation(), lease: null })
  }
  async select(id: string): Promise<void> {
    if (id === this.store.get(this.state).selected) return
    this.clearSelection(); this.selection = new AbortController()
    const version = this.selectionVersion
    const signal = AbortSignal.any([this.selection.signal, this.lifetime.signal])
    this.update({ selected: id, conversation: { ...emptyConversation(), loading: true }, error: undefined, lease: null })
    try {
      await this.loadEvents(id, signal, version)
      const lease = await this.rpc.call('lease.status', { id }, signal)
      if (signal.aborted || version !== this.selectionVersion) return
      this.update({ lease: lease.lease })
      await this.openSocket(id, signal, version)
    } catch (error) {
      if (!signal.aborted && version === this.selectionVersion) {
        this.update({ conversation: { ...this.store.get(this.state).conversation, loading: false } }); this.failure(error)
        this.retrySocket(id, signal, version)
      }
    }
  }
  private async loadEvents(id: string, signal: AbortSignal, version: number): Promise<void> {
    for (let pageIndex = 0; pageIndex < 1000; pageIndex++) {
      const current = this.store.get(this.state).conversation
      const page = await this.rpc.call('session.events', { id, afterSeq: current.seq, epoch: current.epoch || undefined, limit: 200 }, signal)
      if (signal.aborted || version !== this.selectionVersion) return
      const latest = this.store.get(this.state).conversation
      const next = applyEventPage(latest, page)
      this.update({ conversation: { ...next, loading: false } })
      if (!page.hasMore) return
      if (next.seq <= current.seq && !page.reset) throw new Error('事件分页未推进')
    }
    throw new Error('会话事件过多，请在宿主归档后重试')
  }
  async catchUp(): Promise<void> {
    if (this.syncing === this.selectionVersion) return
    const { selected } = this.store.get(this.state)
    if (!selected) return
    const version = this.selectionVersion
    this.syncing = version
    const signal = AbortSignal.any([this.selection.signal, this.lifetime.signal])
    try {
      await this.loadEvents(selected, signal, version)
      const lease = await this.rpc.call('lease.status', { id: selected }, signal)
      if (!signal.aborted && version === this.selectionVersion) this.update({ lease: lease.lease })
    } catch (error) { if (!signal.aborted && version === this.selectionVersion) this.failure(error) }
    finally { if (this.syncing === version) this.syncing = undefined }
  }
  private async openSocket(id: string, signal: AbortSignal, version: number): Promise<void> {
    const ticket = await this.rpc.ticket(signal)
    if (signal.aborted || version !== this.selectionVersion) return
    const url = new URL('/events', this.rpc.base); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'; url.searchParams.set('ticket', ticket)
    const socket = this.socketFactory(url.href); this.socket = socket
    socket.addEventListener('open', () => {
      if (signal.aborted || version !== this.selectionVersion) { socket.close(); return }
      const current = this.store.get(this.state).conversation
      socket.send(JSON.stringify({ clientKind: 'web', requestId: crypto.randomUUID(), method: 'session.subscribe', params: { ids: [id], cursors: { [id]: { epoch: current.epoch, seq: current.seq } } } }))
      this.update({ status: 'online' })
    })
    socket.addEventListener('message', message => {
      if (signal.aborted || version !== this.selectionVersion) return
      try {
        const raw: unknown = JSON.parse(String(message.data))
        if (raw && typeof raw === 'object' && 'ok' in raw && raw.ok === false) {
          this.update({ error: '事件订阅被宿主拒绝，请刷新会话权限或重新连接' }); socket.close(); return
        }
        if (!raw || typeof raw !== 'object' || !('type' in raw) || raw.type !== 'session.events') return
        const { type: _type, ...payload } = raw
        const page = API_CONTRACTS['session.events'].response.parse(payload)
        if (page.id !== id) throw new Error('事件流返回了其他会话')
        this.update({ conversation: applyEventPage(this.store.get(this.state).conversation, page) })
      } catch (error) { this.update({ error: error instanceof Error ? error.message : '事件流无效，正在重新同步' }); void this.catchUp() }
    })
    socket.addEventListener('error', () => socket.close())
    socket.addEventListener('close', () => {
      if (signal.aborted || version !== this.selectionVersion) return
      this.retrySocket(id, signal, version)
    })
  }
  private retrySocket(id: string, signal: AbortSignal, version: number): void {
    if (signal.aborted || version !== this.selectionVersion) return
    clearTimeout(this.reconnect)
    this.update({ status: 'reconnecting' })
    this.reconnect = setTimeout(() => {
      void this.catchUp().then(() => this.openSocket(id, signal, version)).catch(error => { this.failure(error); this.retrySocket(id, signal, version) })
    }, 2000)
  }
  async send(text: string, queue = false): Promise<void> {
    const current = this.store.get(this.state), id = current.selected
    if (!id || current.busy || !text.trim()) throw new Error('请等待当前发送完成，或先选择会话并输入消息')
    const version = this.selectionVersion
    if (!this.sendAttempt || this.sendAttempt.id !== id || this.sendAttempt.text !== text) this.sendAttempt = { id, text, queue, messageId: crypto.randomUUID() }
    const attempt = this.sendAttempt
    const signal = this.lifetime.signal
    this.update({ busy: true, error: undefined })
    try {
      if (attempt.queue) await this.rpc.call('session.queue', { id, text, clientMessageId: attempt.messageId }, signal)
      else {
        const result = await this.rpc.call('session.send', { id, text, clientMessageId: attempt.messageId }, signal)
        if (!result.accepted) throw new ApiError('NOT_ACCEPTED', '宿主尚未接受此消息，请保留草稿重试', 409)
      }
      this.sendAttempt = undefined
      if (version === this.selectionVersion) await this.catchUp()
    } catch (error) { if (error instanceof ApiError && error.status >= 400 && error.status < 500) this.sendAttempt = undefined; if (version === this.selectionVersion) this.failure(error); throw error }
    finally { if (!signal.aborted) this.update({ busy: false }) }
  }
  async respond(requestId: string, decision: 'allow' | 'allow-session' | 'deny'): Promise<void> {
    const current = this.store.get(this.state)
    if (current.respondingApprovals.includes(requestId)) return
    const signal = this.lifetime.signal
    const errors = { ...current.approvalErrors }
    delete errors[requestId]
    this.update({ respondingApprovals: [...current.respondingApprovals, requestId], approvalErrors: errors })
    try {
      const result = await this.rpc.call('approval.respond', { requestId, decision }, signal)
      if (signal.aborted) return
      if (!result.resolved) throw new ApiError('APPROVAL_EXPIRED', '此审批已由其他端处理或已失效，请刷新审批列表。', 409)
      this.update({ approvals: this.store.get(this.state).approvals.filter(approval => approval.id !== requestId) })
      const approvals = (await this.rpc.call('approval.list', {}, signal)).approvals
      if (signal.aborted) return
      this.update({ approvals })
      await this.catchUp()
    } catch (error) {
      if (!signal.aborted) {
        this.update({ approvalErrors: { ...this.store.get(this.state).approvalErrors, [requestId]: error instanceof Error ? error.message : '审批未完成，请重试' } })
        this.failure(error)
      }
      throw error
    } finally {
      if (!signal.aborted) this.update({ respondingApprovals: this.store.get(this.state).respondingApprovals.filter(id => id !== requestId) })
    }
  }
  async interrupt(): Promise<void> {
    const id = this.store.get(this.state).selected
    if (id) { try { await this.rpc.call('session.interrupt', { id }, this.lifetime.signal); await this.catchUp() } catch (error) { this.failure(error); throw error } }
  }
  async transfer(): Promise<void> {
    const { selected, lease } = this.store.get(this.state)
    if (!selected || !lease) throw new ApiError('LEASE_CHANGED', '输入权已变化，请刷新会话后重试。', 409)
    try { const result = await this.rpc.call('lease.transfer', { id: selected, expectedFence: lease.fence, confirm: 'transfer-writer' }, this.lifetime.signal); if (selected === this.store.get(this.state).selected) this.update({ lease: result.lease, error: undefined }) }
    catch (error) { this.failure(error); throw error }
  }
}
