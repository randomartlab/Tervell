export interface RelayCredentials { relay: string; room: string; token: string }
/** 一次取一帧，处理完成再确认。断线重取保留原帧，避免 HTTP 响应丢失吞消息。 */
export async function relayCall(credentials: RelayCredentials, role: 'host' | 'device', action: 'poll' | 'push' | 'ack' | 'register' | 'delete', body?: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${credentials.relay}v1/rooms/${credentials.room}/${role}/${action}`, {
    method: 'POST', headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000), redirect: 'error',
  })
  if (!response.ok) throw new Error(`中转服务 ${response.status}`)
  return response.json() as Promise<unknown>
}
