import { expect, test } from 'bun:test'
import { CoreRpc } from './rpc.ts'

test('Given 服务地址 When 非HTTPS远程或内嵌凭据 Then 拒绝建立客户端', () => {
  for (const base of ['http://remote.test', 'https://user@remote.test', 'https://remote.test/path', 'https://remote.test/?token=secret']) expect(() => new CoreRpc(base)).toThrow()
  expect(new CoreRpc('http://127.0.0.1:8080').base).toBe('http://127.0.0.1:8080')
})
test('Given RPC When 返回错误、错requestId或非法响应 Then 不作为成功接受', async () => {
  for (const reply of [{ ok: false, error: { code: 'DENIED', message: '拒绝访问' } }, { ok: true, requestId: 'wrong', data: {} }]) {
    const client = new CoreRpc('https://core.test', async () => Response.json(reply))
    await expect(client.call('host.status', {})).rejects.toThrow()
  }
})
test('Given 内存设备凭据 When 调用RPC Then 使用web身份并解析权威响应', async () => {
  const client = new CoreRpc('https://core.test', async (_url, init) => {
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer device-secret')
    const body = JSON.parse(String(init?.body)) as { requestId: string; clientKind: string }
    expect(body.clientKind).toBe('web')
    return Response.json({ ok: true, requestId: body.requestId, data: { hostId: 'host', status: 'online', version: '1.0' } })
  })
  client.useToken('device-secret')
  expect((await client.call('host.status', {})).hostId).toBe('host')
  client.useToken('')
  expect(client.headers().Authorization).toBeUndefined()
})

test('Given 同一审批出现在多个面板 When 同时批准与拒绝 Then 只发送一次并共享提交状态', async () => {
  const { WorkbenchClient } = await import('./controller.ts')
  let release: () => void = () => {}
  const wait = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  const rpc = new CoreRpc('https://core.test', async (_url, init) => {
    const request = JSON.parse(String(init?.body)) as { method: string; requestId: string }
    if (request.method === 'approval.respond') { requests++; await wait }
    return Response.json({ ok: true, requestId: request.requestId, data: request.method === 'approval.respond' ? { requestId: 'approval', resolved: true } : { approvals: [] } })
  })
  const client = new WorkbenchClient(rpc)
  const first = client.respond('approval', 'allow')
  expect(client.store.get(client.state).respondingApprovals).toEqual(['approval'])
  await client.respond('approval', 'deny')
  expect(requests).toBe(1)
  release(); await first
  expect(client.store.get(client.state).respondingApprovals).toEqual([])
  client.disconnect()
})

test('Given 审批已失效或响应丢失 When 提交失败 Then 没有虚假成功且释放共享禁用以便重试', async () => {
  const { WorkbenchClient } = await import('./controller.ts')
  for (const resolved of [false, undefined]) {
    const client = new WorkbenchClient(new CoreRpc('https://core.test', async (_url, init) => {
      if (resolved === undefined) throw new Error('连接中断')
      const request = JSON.parse(String(init?.body)) as { requestId: string }
      return Response.json({ ok: true, requestId: request.requestId, data: { requestId: 'approval', resolved } })
    }))
    await expect(client.respond('approval', 'allow')).rejects.toThrow()
    expect(client.store.get(client.state).respondingApprovals).toEqual([])
    expect(client.store.get(client.state).approvalErrors.approval).toBeTruthy()
    client.disconnect()
  }
})

test('Given 审批提交未结束 When 断开并重连 Then 旧响应不污染新设备的审批状态', async () => {
  const { WorkbenchClient } = await import('./controller.ts')
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => { release = resolve })
  const client = new WorkbenchClient(new CoreRpc('https://core.test', async (_url, init) => {
    const request = JSON.parse(String(init?.body)) as { requestId: string }
    await waiting
    return Response.json({ ok: true, requestId: request.requestId, data: { requestId: 'old-approval', resolved: true } })
  }))
  const pending = client.respond('old-approval', 'allow').catch(() => {})
  client.disconnect(); release(); await pending
  expect(client.store.get(client.state).respondingApprovals).toEqual([])
  expect(client.store.get(client.state).approvalErrors).toEqual({})
  expect(client.store.get(client.state).approvals).toEqual([])
})
