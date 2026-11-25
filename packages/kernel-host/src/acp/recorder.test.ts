import { test, expect } from 'bun:test'
import { AcpTraceRecorder } from './recorder.ts'

test('Given 多层密钥/文本/路径/错误 When 录制 Then 脱敏前不存储且控制结构不丢失', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '18.19.0', source: 'unit-test', secrets: ['test-personal-secret'] })
  recorder.record('client', { jsonrpc: '2.0', id: 'r1', method: 'session/prompt', params: { sessionId: 's1', prompt: [{ type: 'text', text: '私有提示 test-personal-secret' }], apiKey: 'secret-key', nested: { authorization: 'Bearer abcdef', refresh_token: 'refresh-secret', cwd: '/Users/person/work' } } })
  recorder.record('agent', { jsonrpc: '2.0', id: 'r1', result: { stopReason: 'end_turn', usage: { inputTokens: 2, outputTokens: 3 }, opaque: 'test-personal-secret' } })
  const text = recorder.export()
  for (const privateValue of ['test-personal-secret', 'secret-key', 'abcdef', 'refresh-secret', '/Users/person', '私有提示']) expect(text).not.toContain(privateValue)
  expect(recorder.snapshot().frames[0]?.message).toMatchObject({ method: 'session/prompt', params: { prompt: [{ type: 'text' }] } })
  expect(recorder.snapshot().frames[1]?.message).toMatchObject({ result: { usage: { inputTokens: 2, outputTokens: 3 } } })
  expect(new AcpTraceRecorder({ kernelId: 'omp', origin: 'live', agentVersion: '1', source: 'x' }).snapshot().frames).toEqual([])
})
test('Given 大量消息或无效信封 When 录制 Then 明确失败不部分添加', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'test', maxFrames: 1 })
  recorder.record('agent', { jsonrpc: '2.0', method: 'x', params: {} })
  expect(() => recorder.record('agent', { jsonrpc: '2.0', method: 'x', params: {} })).toThrow('上限')
  expect(recorder.snapshot().frames).toHaveLength(1)
  expect(() => recorder.record('agent', { type: 'log' })).toThrow()
})

test('Given 任意未知key和数组中的私密值 When 脱敏 Then 仍遮蔽而不依赖字段黑名单', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'test' })
  recorder.record('agent', { jsonrpc: '2.0', id: 'x', result: { randomVendorField: 'very-private-value', arbitrary: ['personal-data'], content: [{ type: 'text', text: 'nested-private-text' }] } })
  for (const value of ['very-private-value', 'personal-data', 'nested-private-text']) expect(recorder.export()).not.toContain(value)
})

test('Given 私密数字/标识符和低熵文本 When 两次录制 Then 隐去非协议数据且不同记录不能字典对照', () => {
  const options = { kernelId: 'omp', origin: 'scripted' as const, agentVersion: '1', source: 'test' }
  const a = new AcpTraceRecorder(options); const b = new AcpTraceRecorder(options)
  for (const recorder of [a, b]) recorder.record('agent', { jsonrpc: '2.0', id: 123456789, result: { accountNumber: 987654321, text: 'yes', usage: { inputTokens: 2 } } })
  expect(a.export()).not.toContain('123456789'); expect(a.export()).not.toContain('987654321'); expect(a.export()).not.toContain('"yes"')
  expect(a.export()).not.toBe(b.export()); expect(a.snapshot().frames[0]?.message).toMatchObject({ result: { usage: { inputTokens: 2 } } })
})

test('Given 标识符中的路径/数字/secret及对象key When 脱敏 Then 都不可从导出恢复', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'safe-label', secrets: ['exact-secret'] })
  recorder.record('agent', { jsonrpc: '2.0', method: 'session/update', params: { sessionId: '/private/custom/session', update: { sessionUpdate: 'tool_call', toolCallId: 'exact-secret', rawInput: { '/private/example/file': 123456, id: 987654 } } } })
  for (const value of ['/private/custom', '/private/example', 'exact-secret', '123456', '987654']) expect(recorder.export()).not.toContain(value)
})

test('Given rawOutput对象键包含私密文件名 When 导出 Then 未知键也HMAC化', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'test' })
  recorder.record('agent', { jsonrpc: '2.0', method: 'x', params: { rawOutput: { 'private-personal-file.txt': 'private body', content: [{ type: 'text', text: 'output' }] } } })
  expect(recorder.export()).not.toContain('private-personal-file.txt'); expect(recorder.export()).not.toContain('private body')
})

test('Given 协议外显字段含Bearer和明确secret When 保存文件 Then 文件权限私有且内容已脱敏', async () => {
  const { mkdtempSync, readFileSync, statSync, rmSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const { join } = await import('node:path')
  const directory = mkdtempSync(join(tmpdir(), 'proma-trace-private-'))
  try {
    const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'unit', secrets: ['secret-value'] })
    recorder.record('agent', { jsonrpc: '2.0', method: 'x', params: { message: 'Bearer private-token', secret: 'secret-value' } })
    const path = join(directory, 'trace.json'); recorder.save(path)
    expect(readFileSync(path, 'utf8')).not.toContain('private-token'); expect(readFileSync(path, 'utf8')).not.toContain('secret-value')
    if (process.platform === 'win32') {
      const { execFileSync } = await import('node:child_process')
      const script = "$ErrorActionPreference='Stop'; $acl=[System.IO.File]::GetAccessControl($env:TERVELL_TRACE_ACL_TEST); $rules=$acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]); @{protected=$acl.AreAccessRulesProtected; sids=@($rules|ForEach-Object {$_.IdentityReference.Value}); inherited=@($rules|Where-Object {$_.IsInherited}).Count; user=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value}|ConvertTo-Json -Compress"
      const acl = JSON.parse(execFileSync(join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', windowsHide: true, env: { ...process.env, TERVELL_TRACE_ACL_TEST: path } })) as { protected: boolean; sids: string[]; inherited: number; user: string }
      expect(acl.protected).toBe(true)
      expect(acl.inherited).toBe(0)
      expect(new Set(acl.sids)).toEqual(new Set([acl.user, 'S-1-5-18']))
    } else expect(statSync(path).mode & 0o777).toBe(0o600)
  } finally { rmSync(directory, { recursive: true, force: true }) }
}, 30000)

test('Given RPC id数字1与字符串1 When 同一记录器脱敏 Then 保持类型身份不冲突', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'unit' })
  recorder.record('client', { jsonrpc: '2.0', id: 1, method: 'a', params: {} })
  recorder.record('client', { jsonrpc: '2.0', id: '1', method: 'b', params: {} })
  const frames = recorder.snapshot().frames
  if ('id' in frames[0]!.message && 'id' in frames[1]!.message) expect(frames[0]!.message.id).not.toBe(frames[1]!.message.id)
})

test('Given 显式secret作为对象键 When 导出 Then key同样不泄露', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'unit', secrets: ['secret-object-key'] })
  recorder.record('agent', { jsonrpc: '2.0', method: 'x', params: { 'secret-object-key': 'value' } })
  expect(recorder.export()).not.toContain('secret-object-key')
})

test('Given observer抛出录制失败 When 发送请求 Then 请求拒绝且不能留下挂起名额', async () => {
  const { PassThrough } = await import('node:stream'); const { JsonRpcPeer } = await import('./rpc.ts')
  const peer = new JsonRpcPeer(new PassThrough(), new PassThrough(), { maxPending: 1, onMessage: () => { throw new Error('录制磁盘/配额失败') } })
  await expect(peer.request('x', {})).rejects.toThrow('录制')
  await expect(peer.request('y', {})).rejects.toThrow('录制'); peer.close()
})

test('Given 非法type/status或未知对象key藏私密字符串 When 默认脱敏 Then 不能借控制字段泄漏', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'unit' })
  recorder.record('agent', { jsonrpc: '2.0', method: 'private-extension-secret', params: { status: 'private-status-secret', type: 'private-type-secret', 'private-file-name.txt': 'body' } })
  for (const value of ['private-extension-secret','private-status-secret','private-type-secret','private-file-name.txt']) expect(recorder.export()).not.toContain(value)
})

test('Given version控制字段被滥用为自由文本 When 录制 Then 仅合法版本形式保留', () => {
  const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'scripted', agentVersion: '1', source: 'unit' })
  recorder.record('agent', { jsonrpc: '2.0', id: 'x', result: { agentInfo: { version: 'private-version-secret' } } })
  expect(recorder.export()).not.toContain('private-version-secret')
})
