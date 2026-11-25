declare module 'ws' {
  import { EventEmitter } from 'node:events'
  import type { Server } from 'node:http'

  export default class WebSocket extends EventEmitter {
    static readonly OPEN: number
    readonly readyState: number
    constructor(url: string, options?: { headers?: Record<string, string>; handshakeTimeout?: number; perMessageDeflate?: boolean; maxPayload?: number })
    send(data: string | Buffer | ArrayBuffer | Uint8Array): void
    close(code?: number, reason?: string): void
    terminate(): void
  }
  export class WebSocketServer extends EventEmitter {
    constructor(options: { server: Server })
    clients: Set<WebSocket>
    close(callback?: () => void): void
  }
}
