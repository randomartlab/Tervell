import type { Readable, Writable } from 'node:stream'
import { JsonRpcMessageSchema } from '@proma/protocol'
import type { JsonRpcId, JsonValue, JsonRpcMessage } from '@proma/protocol'

interface Pending { resolve: (value: JsonValue) => void; reject: (error: Error) => void; cleanup: () => void; received?: () => void }
export interface RpcOptions {
  timeoutMs?: number; maxFrameBytes?: number; maxQueueBytes?: number; maxPending?: number; maxInbound?: number
  onNotification?: (method: string, params: JsonValue | undefined) => void
  onRequest?: (method: string, params: JsonValue | undefined, id: JsonRpcId) => Promise<JsonValue>
  onMessage?: (direction: 'client' | 'agent', message: JsonRpcMessage) => void
  onClose?: (error: Error) => void
}
export class RpcRemoteError extends Error {
  constructor(readonly code: number, message: string, readonly data?: JsonValue) { super(message) }
}
/** ACP v1 stdio：每行一个JSON-RPC消息；stdout日志污染、坏UTF-8和超大帧均明确失败。 */
export class JsonRpcPeer {
  private readonly pending = new Map<JsonRpcId, Pending>()
  private frameBuffer = Buffer.alloc(4096)
  private fragmentBytes = 0
  private queuedBytes = 0
  private tail = Promise.resolve()
  private counter = 0
  private inbound = 0
  private readonly inboundIds = new Set<JsonRpcId>()
  private readonly writeStops = new Set<(error: Error) => void>()
  private closed?: Error
  private readonly decoder = new TextDecoder('utf-8', { fatal: true })
  constructor(private readonly input: Readable, private readonly output: Writable, private readonly options: RpcOptions = {}) {
    input.on('data', this.receive); input.on('end', this.ended); input.on('close', this.ended); output.on('close', this.ended); input.on('error', this.failed); output.on('error', this.failed)
  }
  private failed = (error: Error) => this.close(error)
  private ended = () => this.close(new Error(this.fragmentBytes ? 'ACP 帧在换行前截断' : 'ACP 连接已关闭'))
  private receive = (chunk: Buffer | string) => {
    if (this.closed) return
    try {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      let start = 0
      for (;;) {
        const newline = buffer.indexOf(10, start)
        const part = buffer.subarray(start, newline < 0 ? buffer.length : newline)
        this.fragmentBytes += part.length
        if (this.fragmentBytes > (this.options.maxFrameBytes ?? 8 * 1024 * 1024)) throw new Error('ACP 帧超过字节上限')
        if (this.fragmentBytes > this.frameBuffer.length) { const next = Buffer.alloc(Math.max(this.fragmentBytes, this.frameBuffer.length * 2)); this.frameBuffer.copy(next, 0, 0, this.fragmentBytes - part.length); this.frameBuffer = next }
        part.copy(this.frameBuffer, this.fragmentBytes - part.length)
        if (newline < 0) break
        const line = this.decoder.decode(this.frameBuffer.subarray(0, this.fragmentBytes))
        this.fragmentBytes = 0
        if (!line.trim()) throw new Error('ACP 空行不是合法JSON-RPC消息')
        const raw: unknown = JSON.parse(line)
        if (Array.isArray(raw)) {
          if (!raw.length || raw.length > 32) throw new Error('ACP JSON-RPC batch大小无效')
          const messages = raw.map((item) => JsonRpcMessageSchema.parse(item))
          let remaining = messages.filter((item) => 'method' in item && item.id !== undefined).length
          const replies: unknown[] = []
          const reply = async (message: unknown) => { replies.push(message); if (--remaining === 0) await this.send(replies) }
          for (const message of messages) { this.dispatch(message, reply); if (this.closed) return }
        } else this.dispatch(raw)
        if (this.closed) return; start = newline + 1
        if (start === buffer.length) break
      }
    } catch (error) { this.close(error instanceof Error ? error : new Error(String(error))) }
  }
  private dispatch(raw: unknown, reply: (message: unknown) => Promise<void> = (message) => this.send(message)): void {
    const message = JsonRpcMessageSchema.parse(raw)
    this.options.onMessage?.('agent', message)
    if ('method' in message) {
      if (message.id === undefined) { this.options.onNotification?.(message.method, message.params); return }
      const id = message.id
      if (this.inbound >= (this.options.maxInbound ?? 32)) throw new Error('ACP反向请求并发超过上限')
      if (this.inboundIds.has(id)) throw new Error('ACP反向请求ID重复')
      this.inbound++; this.inboundIds.add(id)
      const operation = Promise.resolve().then(() => this.options.onRequest ? this.options.onRequest(message.method, message.params, id) : Promise.reject(new RpcRemoteError(-32601, '方法未实现')))
      void operation.then((result) => reply({ jsonrpc: '2.0', id, result }),
        (error: unknown) => reply({ jsonrpc: '2.0', id, error: { code: error instanceof RpcRemoteError ? error.code : -32603, message: error instanceof Error ? error.message : String(error) } }))
        .finally(() => { this.inbound--; this.inboundIds.delete(id) })
        .catch((error: unknown) => this.close(error instanceof Error ? error : new Error(String(error))))
      return
    }
    if (message.id === null) throw new Error('对端返回无关联ID的RPC错误')
    const entry = this.pending.get(message.id)
    if (!entry) return // 超时/取消后的迟到响应不能重新激活请求。
    this.pending.delete(message.id); entry.cleanup()
    try { entry.received?.() } catch (error) { const failure = error instanceof Error ? error : new Error(String(error)); entry.reject(failure); throw failure }
    if ('error' in message) entry.reject(new RpcRemoteError(message.error.code, message.error.message, message.error.data))
    else entry.resolve(message.result)
  }
  private async send(message: unknown, stillNeeded: () => boolean = () => true): Promise<void> {
    if (this.closed) return Promise.reject(this.closed)
    const frame = Buffer.from(JSON.stringify(Array.isArray(message) ? message.map((item) => JsonRpcMessageSchema.parse(item)) : JsonRpcMessageSchema.parse(message)) + '\n')
    if (frame.length > (this.options.maxFrameBytes ?? 8 * 1024 * 1024) || this.queuedBytes + frame.length > (this.options.maxQueueBytes ?? 16 * 1024 * 1024)) return Promise.reject(new Error('ACP 发送队列超过背压上限'))
    this.queuedBytes += frame.length
    const operation = this.tail.then(() => new Promise<void>((resolve, reject) => {
      if (this.closed) { reject(this.closed); return }
      if (!stillNeeded()) { resolve(); return }
      const messages = Array.isArray(message) ? message : [message]
      for (const raw of messages) this.options.onMessage?.('client', JsonRpcMessageSchema.parse(raw))
      const stop = (error: Error) => { this.writeStops.delete(stop); reject(error) }
      this.writeStops.add(stop)
      // callback在Writable处理完本帧后触发；串行等待使false/drain期间不继续堆写。
      this.output.write(frame, (error) => { this.writeStops.delete(stop); error ? reject(error) : resolve() })
    })).finally(() => { this.queuedBytes -= frame.length })
    this.tail = operation.then(() => undefined, () => undefined) // 每个调用仍持有原始拒绝；队列继续可用于其他请求。
    return operation
  }
  request(method: string, params?: JsonValue, signal?: AbortSignal, received?: () => void,timeoutMs?:number|null): Promise<JsonValue> {
    if (this.closed) return Promise.reject(this.closed)
    if (signal?.aborted) return Promise.reject(new Error('ACP 请求已取消'))
    if (this.pending.size >= (this.options.maxPending ?? 128)) return Promise.reject(new Error('ACP 待响应请求过多'))
    const id = `proma:${++this.counter}`
    return new Promise((resolve, reject) => {
      const fail = (error: Error) => { const current = this.pending.get(id); if (!current) return; this.pending.delete(id); current.cleanup(); reject(error) }
      const abort = () => fail(new Error('ACP 请求已取消'))
      const deadline=timeoutMs===undefined?this.options.timeoutMs??30000:timeoutMs
      const timer = deadline===null?undefined:setTimeout(() => fail(new Error(`ACP 请求超时：${method}`)), deadline)
      this.pending.set(id, { resolve, reject, received, cleanup: () => { clearTimeout(timer); signal?.removeEventListener('abort', abort) } })
      signal?.addEventListener('abort', abort, { once: true })
      void this.send({ jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) }, () => this.pending.has(id)).catch((error: unknown) => fail(error instanceof Error ? error : new Error(String(error))))
    })
  }
  notify(method: string, params?: JsonValue): Promise<void> { return this.send({ jsonrpc: '2.0', method, ...(params === undefined ? {} : { params }) }) }
  close(error = new Error('ACP 连接已关闭')): void {
    if (this.closed) return
    this.closed = error
    this.input.off('data', this.receive); this.input.off('end', this.ended); this.input.off('close', this.ended); this.output.off('close', this.ended)
    // 保留流error处理器直到流销毁，避免取消时在途write触发未处理EPIPE。
    for (const stop of [...this.writeStops]) stop(error)
    this.fragmentBytes = 0; this.frameBuffer = Buffer.alloc(0)
    for (const entry of this.pending.values()) { entry.cleanup(); entry.reject(error) }
    this.pending.clear(); this.options.onClose?.(error)
  }
}
