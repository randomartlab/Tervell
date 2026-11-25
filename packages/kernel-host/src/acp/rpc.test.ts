import { test, expect } from 'bun:test'
import { PassThrough, Writable } from 'node:stream'
import { JsonRpcPeer } from './rpc.ts'

test('Given 多帧/分片/UTF8大chunk When 传输 Then 不粘包丢字且反向请求可重入', async () => {
  const a = new PassThrough(); const b = new PassThrough()
  const server = new JsonRpcPeer(a, b, { onRequest: async (method, params) => method === 'nested' ? client.request('reverse', params) : params ?? null })
  const client = new JsonRpcPeer(b, a, { onRequest: async (_method, params) => params ?? null })
  try {
    const large = '中文😀'.repeat(100000)
    expect(await client.request('echo', { text: large })).toEqual({ text: large })
    expect(await client.request('nested', { ok: true })).toEqual({ ok: true })
    const seen: unknown[] = []; const input = new PassThrough(); const output = new PassThrough(); const peer = new JsonRpcPeer(input, output, { onNotification: (_method, params) => seen.push(params) })
    const bytes = Buffer.from('{"jsonrpc":"2.0","method":"x","params":{"text":"😀"}}\n{"jsonrpc":"2.0","method":"x","params":{"value":2}}\n')
    for (const byte of bytes) input.write(Buffer.from([byte]))
    expect(seen).toEqual([{ text: '😀' }, { value: 2 }]); peer.close()
  } finally { client.close(); server.close() }
})
test('Given 慢Writable When 连续发送 Then 顺序/背压上限被执行', async () => {
  const frames: string[] = []; let active = 0; let maximum = 0
  const output = new Writable({ highWaterMark: 1, write(chunk: Buffer, _encoding, callback) { active++; maximum = Math.max(maximum, active); setTimeout(() => { frames.push(chunk.toString()); active--; callback() }, 5) } })
  const peer = new JsonRpcPeer(new PassThrough(), output, { maxQueueBytes: 180 })
  try {
    const first = peer.notify('a', { n: 1 }); const second = peer.notify('b', { n: 2 })
    await expect(peer.notify('x', { text: 'z'.repeat(1000) })).rejects.toThrow('上限')
    await Promise.all([first, second]); expect(maximum).toBe(1); expect(frames.map((frame) => JSON.parse(frame).method)).toEqual(['a', 'b'])
  } finally { peer.close(); output.destroy() }
})
test('Given 超时/取消/关闭 When 等待响应 Then 全部释放且迟到响应无效', async () => {
  const input = new PassThrough(); const peer = new JsonRpcPeer(input, new PassThrough(), { timeoutMs: 10 })
  await expect(peer.request('timeout')).rejects.toThrow('超时')
  const controller = new AbortController(); const pending = peer.request('abort', {}, controller.signal); controller.abort()
  await expect(pending).rejects.toThrow('取消')
  input.write('{"jsonrpc":"2.0","id":"proma:2","result":42}\n')
  const closed = peer.request('close'); peer.close(); await expect(closed).rejects.toThrow('关闭')
})
for (const frame of ['not json\n', '{"jsonrpc":"1.0","method":"x"}\n', '{"jsonrpc":"2.0","id":1,"result":1,"error":{"code":1,"message":"x"}}\n', Buffer.from([255, 10]), 'x'.repeat(101)]) {
  test('Given 坏JSON/信封/UTF8/超限 When 读入 Then 拒绝等待中的请求', async () => {
    const input = new PassThrough(); const peer = new JsonRpcPeer(input, new PassThrough(), { maxFrameBytes: 100 })
    const pending = peer.request('x'); input.write(frame); await expect(pending).rejects.toThrow()
  })
}

test('Given 排队请求取消 When 前一帧释放 Then 已取消帧不再发出', async () => {
  const frames: string[] = []; let release: (() => void) | undefined
  const output = new Writable({ write(chunk: Buffer, _encoding, callback) { frames.push(chunk.toString()); release = callback } })
  const peer = new JsonRpcPeer(new PassThrough(), output)
  const first = peer.notify('blocking'); await Promise.resolve(); await Promise.resolve()
  const controller = new AbortController(); const pending = peer.request('cancelled', {}, controller.signal); controller.abort()
  await expect(pending).rejects.toThrow('取消'); release?.(); await first
  await new Promise((resolve) => setTimeout(resolve, 2))
  expect(frames).toHaveLength(1); peer.close(); output.destroy()
})
test('Given 同步回调抛错 When 反向请求 Then 返回RPC error而非破坏连接', async () => {
  const a = new PassThrough(); const b = new PassThrough()
  const server = new JsonRpcPeer(a, b, { onRequest: () => { throw new Error('拒绝') } }); const client = new JsonRpcPeer(b, a)
  try { await expect(client.request('throw')).rejects.toThrow('拒绝'); await expect(client.request('again')).rejects.toThrow('拒绝') }
  finally { server.close(); client.close() }
})

test('Given 在途write永不回调 When close Then notify也能拒绝不永久挂起', async () => {
  const output = new Writable({ write(_chunk, _encoding, _callback) { /* 刻意不完成 */ } })
  const peer = new JsonRpcPeer(new PassThrough(), output)
  const notification = peer.notify('hang'); await Promise.resolve(); await Promise.resolve(); peer.close(new Error('手动关闭'))
  await expect(notification).rejects.toThrow('关闭'); output.destroy()
})
test('Given 大帧被逐字节打散 When 读取 Then 线性增长缓冲且完整恢复', () => {
  const input = new PassThrough(); const seen: unknown[] = []
  const peer = new JsonRpcPeer(input, new PassThrough(), { onNotification: (_method, params) => seen.push(params) })
  const expected = '中文😀'.repeat(3000); const bytes = Buffer.from(JSON.stringify({ jsonrpc: '2.0', method: 'data', params: { text: expected } }) + '\n')
  for (const byte of bytes) input.write(Buffer.from([byte]))
  expect(seen).toEqual([{ text: expected }]); peer.close()
})

test('Given params不是对象或数组 When 发送 Then 立即拒绝且不占待响应名额', async () => {
  const peer = new JsonRpcPeer(new PassThrough(), new PassThrough(), { maxPending: 1 })
  await expect(peer.request('invalid', 'scalar')).rejects.toThrow()
  const next = peer.request('valid', {}); peer.close(); await expect(next).rejects.toThrow('关闭')
})
test('Given 帧未换行而流结束 When 读取 Then 报截断而非永久等待', async () => {
  const input = new PassThrough(); const peer = new JsonRpcPeer(input, new PassThrough())
  const pending = peer.request('pending'); input.end('{"jsonrpc":"2.0"')
  await expect(pending).rejects.toThrow('截断')
})

test('Given prompt响应后同chunk有迟到notification When dispatch Then 同步终态钩子先执行', async () => {
  const input = new PassThrough(); let closed = false; const accepted: unknown[] = []
  const peer = new JsonRpcPeer(input, new PassThrough(), { onNotification: (_method, params) => { if (!closed) accepted.push(params) } })
  const pending = peer.request('prompt', {}, undefined, () => { closed = true })
  input.write('{"jsonrpc":"2.0","id":"proma:1","result":{}}\n{"jsonrpc":"2.0","method":"late","params":{}}\n')
  await pending; expect(accepted).toEqual([]); peer.close()
})

test('Given response钩子抛异常 When 响应到达 Then 原始请求也必须拒绝', async () => {
  const input = new PassThrough(); const peer = new JsonRpcPeer(input, new PassThrough())
  const pending = peer.request('x', {}, undefined, () => { throw new Error('钩子失败') })
  input.write('{"jsonrpc":"2.0","id":"proma:1","result":{}}\n'); await expect(pending).rejects.toThrow('钩子失败')
})




test('Given JSON-RPC request/通知混合batch When 收到 Then 响应也为单batch且不回复通知', async () => {
  const input = new PassThrough(); const output = new PassThrough(); const frames: unknown[] = []
  output.on('data', (buffer: Buffer) => frames.push(JSON.parse(buffer.toString())))
  const peer = new JsonRpcPeer(input, output, { onRequest: async (_method, params) => params ?? null })
  input.write(JSON.stringify([{ jsonrpc: '2.0', id: 'one', method: 'x', params: { n: 1 } }, { jsonrpc: '2.0', method: 'notify' }, { jsonrpc: '2.0', id: 'two', method: 'x', params: { n: 2 } }]) + '\n')
  await new Promise((resolve) => setTimeout(resolve, 3))
  expect(frames).toHaveLength(1); expect(frames[0]).toEqual([{ jsonrpc: '2.0', id: 'one', result: { n: 1 } }, { jsonrpc: '2.0', id: 'two', result: { n: 2 } }])
  peer.close()
})

test('Given 重复反向请求ID或过多并发 When 读取 Then 不执行第二个冲突请求', async () => {
  for (const repeated of [true, false]) {
    const input = new PassThrough(); const peer = new JsonRpcPeer(input, new PassThrough(), { maxInbound: 1, onRequest: async () => new Promise(() => {}) })
    const pending = peer.request('waiting')
    input.write(JSON.stringify({ jsonrpc: '2.0', id: 'remote1', method: 'hold' }) + '\n')
    input.write(JSON.stringify({ jsonrpc: '2.0', id: repeated ? 'remote1' : 'remote2', method: 'hold' }) + '\n')
    await expect(pending).rejects.toThrow('并发')
  }
})
