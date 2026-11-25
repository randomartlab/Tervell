import { describe, expect, test } from 'bun:test'
import { KernelLauncher, KernelNotFoundError, KernelRegistry } from './index.ts'

/** 假 PATH：只有列出的命令存在 */
const fakeWhich = (installed: string[]) => (cmd: string) => (installed.includes(cmd) ? `/bin/${cmd}` : null)

describe('KernelRegistry', () => {
  test('Given 内置清单 When 列出 Then 覆盖用户点名的内核', () => {
    const ids = new KernelRegistry().list().map((d) => d.id)
    for (const id of ['kimi', 'antigravity', 'deepseek', 'mcode', 'codex', 'hermes', 'claude', 'dsh']) {
      expect(ids).toContain(id)
    }
  })

  test('Given 用户自定义内核 When 注册 Then 可用且可覆盖内置项', () => {
    const reg = new KernelRegistry([
      { id: 'my-agent', name: 'My Agent', tier: 'acp-native', cli: 'my-agent', acp: { args: ['--acp'] } },
      { id: 'kimi', name: 'Kimi（自定义）', tier: 'acp-native', cli: 'kimi', acp: { args: ['acp', '--debug'] } },
    ])
    expect(reg.get('my-agent')?.acp?.args).toEqual(['--acp'])
    expect(reg.get('kimi')?.acp?.args).toEqual(['acp', '--debug'])
  })

  test('Given 适配器内核缺适配器命令 When 注册 Then 拒绝', () => {
    expect(() => new KernelRegistry([{ id: 'bad', name: 'Bad', tier: 'acp-adapter', cli: 'bad', acp: {} }])).toThrow()
  })
})

describe('KernelLauncher', () => {
  test('Given grok When 解析 ACP Then 参数拆成两个 argv（不是一个带空格的字符串）', () => {
    const launcher = new KernelLauncher(new KernelRegistry(), fakeWhich(['grok']))
    expect(launcher.resolve('grok', { transport: 'acp', env: {} }).args).toEqual(['agent', 'stdio'])
  })

  test('Given claude 只装了本体 When 探测 Then 仅 pty 可用并给出适配器安装提示', () => {
    const launcher = new KernelLauncher(new KernelRegistry(), fakeWhich(['claude']))
    const d = launcher.detect('claude')
    expect(d.transports).toEqual(['pty'])
    expect(d.acpPath).toBeNull()
    expect(() => launcher.resolve('claude', { transport: 'acp', env: {} })).toThrow(/claude-agent-acp/)
  })

  test('Given omp When 解析 Then 清单 env 与调用方 env 合并且调用方优先', () => {
    const launcher = new KernelLauncher(new KernelRegistry(), fakeWhich(['omp']))
    const spec = launcher.resolve('omp', {
      transport: 'acp',
      env: { ANTHROPIC_BASE_URL: 'http://127.0.0.1:3425' },
      extraArgs: ['--model', 'x'],
    })
    expect(spec.command).toBe('/bin/omp')
    expect(spec.args).toEqual(['acp', '--model', 'x'])
    expect(spec.env).toEqual({ PI_NO_PTY: '1', ANTHROPIC_BASE_URL: 'http://127.0.0.1:3425' })
  })

  test('Given dsh When 解析 PTY Then 使用 dsh-tui 而非 dsh', () => {
    const launcher = new KernelLauncher(new KernelRegistry(), fakeWhich(['dsh', 'dsh-tui']))
    const spec = launcher.resolve('dsh', { transport: 'pty', env: {} })
    expect(spec.command).toBe('/bin/dsh-tui')
    expect(spec.args).toEqual(['.'])
  })

  test('Given 未注册 id 或纯 PTY 内核请求 ACP When 解析 Then 抛 KernelNotFoundError', () => {
    const launcher = new KernelLauncher(new KernelRegistry(), fakeWhich(['aider']))
    expect(() => launcher.resolve('nope', { transport: 'acp', env: {} })).toThrow(KernelNotFoundError)
    expect(() => launcher.resolve('aider', { transport: 'acp', env: {} })).toThrow(/不支持 acp/)
  })
})
