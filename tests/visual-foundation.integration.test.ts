import { expect, test } from 'bun:test'
import { WorkbenchClient, CoreRpc } from '../packages/client/src/index.ts'
import { fixture } from '../packages/core-server/src/test-fixtures/fixture.ts'

test('Given 两个授权Web设备争用同一会话 When 显式接管 Then 输入权转移且旧端不能发送', async () => {
  const host = await fixture()
  const first = new WorkbenchClient(new CoreRpc(host.server.url)), second = new WorkbenchClient(new CoreRpc(host.server.url))
  const other = host.issue('web')
  try {
    await first.connect(host.b.token); await second.connect(other.token)
    await first.select('s1'); await second.select('s1')
    await first.send('第一台设备发送'); await host.settled(); await second.catchUp()
    expect(second.store.get(second.state).lease?.mine).toBe(false)
    await second.transfer()
    expect(second.store.get(second.state).lease?.mine).toBe(true)
    await expect(first.send('旧设备不能继续写入')).rejects.toThrow()
    await second.send('接管后继续'); await host.settled()
    expect(host.runs()).toBe(2)
  } finally { first.disconnect(); second.disconnect(); await host.close() }
})

test('Given 输入权已被其他设备再次转移 When 使用旧fence接管 Then 拒绝并显示刷新提示而非伪造成功', async () => {
  const host = await fixture(), client = new WorkbenchClient(new CoreRpc(host.server.url))
  try {
    host.repository.leases.claim('s1', host.a.device.id)
    await client.connect(host.b.token); await client.select('s1')
    const oldFence = client.store.get(client.state).lease!.fence
    host.repository.leases.claim('s1', 'another-writer', true)
    await expect(client.transfer()).rejects.toThrow()
    expect(client.store.get(client.state).lease?.fence).toBe(oldFence)
    expect(client.store.get(client.state).lease?.mine).toBe(false)
  } finally { client.disconnect(); await host.close() }
})
