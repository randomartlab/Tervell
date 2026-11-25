import { test, expect } from 'bun:test'
import { KernelLauncher } from '../../launcher.ts'
import { KernelRegistry } from '../../registry.ts'
import { dialectForKernel, resolveDialectKernel } from './factory.ts'

test('Given 首批注册内核 When 解析 Then 使用既有ACP入口且代理env不被方言覆盖', () => {
  const launcher = new KernelLauncher(new KernelRegistry(), (command) => `/verified/${command}`)
  for (const [kernelId, version, id] of [['claude', undefined, 'claude-code'], ['gemini', undefined, 'gemini-cli'], ['cursor', undefined, 'cursor-agent'], ['omp', undefined, 'omp'], ['codex', undefined, 'codex'], ['opencode', '1.18.31', 'opencode-1'], ['opencode', '2.0.14', 'opencode-2'], ['opencode2', '2.0.14', 'opencode-2']]) {
    const resolved = resolveDialectKernel({ kernelId: kernelId!, version, cwd: '/tmp', env: { HTTPS_PROXY: 'http://127.0.0.1:1234' } }, launcher)
    expect(resolved.dialect.id).toBe(id!); expect(resolved.launch.env.HTTPS_PROXY).toBe('http://127.0.0.1:1234')
    if (kernelId === 'omp') expect(resolved.launch.env.PI_NO_PTY).toBe('1')
    if (kernelId === 'opencode' || kernelId === 'opencode2') { expect(resolved.launch.args).toEqual(['acp']); expect(resolved.launch.env.OPENCODE_ENABLE_QUESTION_TOOL).toBe('false') }
    if (kernelId === 'cursor') expect(resolved.launch.args).toEqual(['acp'])
  }
})
test('Given 未知/不支持版本/未安装适配器 When 解析 Then 明确拒绝不触发安装器', () => {
  for (const [id, version] of [['opencode', undefined], ['opencode', '3.0.0'], ['opencode2', '1.2.3'], ['toString', undefined], ['constructor', undefined]]) expect(() => dialectForKernel(id!, version)).toThrow()
  const launcher = new KernelLauncher(new KernelRegistry(), () => null)
  expect(() => resolveDialectKernel({ kernelId: 'claude', env: {}, cwd: '/tmp' }, launcher)).toThrow('未找到')
})
