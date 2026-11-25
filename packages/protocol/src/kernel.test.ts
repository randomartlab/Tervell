import { describe, expect, test } from 'bun:test'
import {
  KernelCapabilitiesSchema,
  KernelDefinitionSchema,
  KernelProjectionSchema,
} from './kernel.ts'

const completeContext = {
  systemPrompt: 'native' as const,
  skills: 'native' as const,
  instructionsFile: 'AGENTS.md',
}

describe('KernelCapabilitiesSchema', () => {
  test('Given 部分能力 When 解析 Then 补齐子字段并保留显式 false', () => {
    const parsed = KernelCapabilitiesSchema.parse({
      context: { instructionsFile: null }, streaming: { text: false }, session: { create: false },
      tools: { native: false }, usage: { cost: true }, protocol: {},
    })
    expect(parsed.streaming).toEqual({ text: false, thinking: false, toolProgress: false })
    expect(parsed.session.create).toBe(false)
    expect(parsed.session.close).toBe(true)
    expect(parsed.tools).toEqual({ native: false, mcp: false, perSessionMcp: false })
    expect(parsed.usage).toEqual({ tokens: false, cost: true, contextWindow: false })
    expect(parsed.protocol.version).toBe('1')
  })

  for (const field of ['protocol', 'streaming', 'session', 'tools', 'usage'] as const) {
    test(`Given ${field}=null When 解析 Then 拒绝而非吞错补默认`, () => {
      expect(KernelCapabilitiesSchema.safeParse({ context: completeContext, [field]: null }).success).toBe(false)
    })
  }

  test('Given 非布尔能力 When 解析 Then 拒绝', () => {
    expect(KernelCapabilitiesSchema.safeParse({ context: completeContext, streaming: { text: 'true' } }).success).toBe(false)
  })

  for (const [field, values] of Object.entries({
    compaction: ['native', 'tool', 'none'], models: ['kernel-owned', 'registry'],
    fs: ['kernel-owned', 'client-bridge'], terminal: ['kernel-owned', 'client-bridge', 'none'],
  })) {
    test(`Given ${field} 各枚举值 When 解析 Then 保留`, () => {
      for (const value of values) {
        expect(KernelCapabilitiesSchema.parse({ context: completeContext, [field]: value })).toHaveProperty(field, value)
      }
    })
  }

  test('Given context 各枚举值 When 解析 Then 保留', () => {
    for (const systemPrompt of ['native', 'meta', 'prepend', 'file'] as const) {
      expect(KernelCapabilitiesSchema.parse({ context: { ...completeContext, systemPrompt } }).context.systemPrompt).toBe(systemPrompt)
    }
    for (const skills of ['native', 'prompt', 'none'] as const) {
      expect(KernelCapabilitiesSchema.parse({ context: { ...completeContext, skills } }).context.skills).toBe(skills)
    }
  })
  test('fills legacy defaults while requiring explicit instructionsFile', () => {
    const parsed = KernelCapabilitiesSchema.parse({ context: { instructionsFile: null } })
    expect(parsed.protocol.version).toBe('1')
    expect(parsed.streaming).toEqual({ text: true, thinking: false, toolProgress: false })
    expect(parsed.session.create).toBe(true)
    expect(parsed.session.fork).toBe(false)
    expect(parsed.permission).toBe('none')
    expect(parsed.context.instructionsFile).toBeNull()
    expect(parsed.transport).toBe('stdio')
  })

  test('accepts each declared enum variant', () => {
    const plans = ['native-mode', 'client-tool', 'prompt-only', 'none'] as const
    const permissions = ['callback', 'mode-only', 'none'] as const
    const transports = ['stdio', 'http', 'in-process', 'pty'] as const
    for (const plan of plans) {
      expect(KernelCapabilitiesSchema.parse({ plan, context: completeContext }).plan).toBe(plan)
    }
    for (const permission of permissions) {
      expect(KernelCapabilitiesSchema.parse({ permission, context: completeContext }).permission).toBe(permission)
    }
    for (const transport of transports) {
      expect(KernelCapabilitiesSchema.parse({ transport, context: completeContext }).transport).toBe(transport)
    }
  })

  test('rejects invalid enum and missing context instructionsFile', () => {
    expect(KernelCapabilitiesSchema.safeParse({ plan: 'automatic', context: completeContext }).success).toBe(false)
    expect(KernelCapabilitiesSchema.safeParse({ context: {} }).success).toBe(false)
  })

  test('parses explicit capability values', () => {
    const parsed = KernelCapabilitiesSchema.parse({
      protocol: { version: '0.20' },
      streaming: { text: true, thinking: true, toolProgress: true },
      session: { create: true, load: true, resume: true, list: true, fork: true, rewind: true, close: true },
      tools: { native: true, mcp: true, perSessionMcp: true },
      context: { systemPrompt: 'meta', skills: 'prompt', instructionsFile: 'CLAUDE.md' },
      usage: { tokens: true, cost: true, contextWindow: true },
      plan: 'client-tool',
      steer: true,
      permission: 'callback',
      compaction: 'tool',
      models: 'registry',
      fs: 'client-bridge',
      terminal: 'client-bridge',
      transport: 'http',
    })
    expect(parsed.streaming.thinking).toBe(true)
    expect(parsed.tools.perSessionMcp).toBe(true)
    expect(parsed.context.instructionsFile).toBe('CLAUDE.md')
  })
})

describe('KernelProjectionSchema', () => {
  const base = {
    transport: 'acp' as const,
    mcp: 'native' as const,
    fsCallback: true,
    terminalCallback: true,
    permissionGate: 'full' as const,
    usageDetail: 'token+cost' as const,
    systemPromptInjection: 'native' as const,
  }

  test('accepts complete explicit projection', () => {
    expect(KernelProjectionSchema.parse(base)).toEqual(base)
  })

  test('accepts the three supported transports', () => {
    for (const transport of ['acp', 'native-sdk', 'pty'] as const) {
      expect(KernelProjectionSchema.parse({ ...base, transport }).transport).toBe(transport)
    }
  })

  test('accepts all projection enum variants', () => {
    expect(KernelProjectionSchema.parse({ ...base, mcp: 'none' }).mcp).toBe('none')
    for (const permissionGate of ['full', 'mcp-only', 'none'] as const) {
      expect(KernelProjectionSchema.parse({ ...base, permissionGate }).permissionGate).toBe(permissionGate)
    }
    for (const usageDetail of ['token+cost', 'token', 'none'] as const) {
      expect(KernelProjectionSchema.parse({ ...base, usageDetail }).usageDetail).toBe(usageDetail)
    }
    for (const systemPromptInjection of ['native', 'prepend-text', 'none'] as const) {
      expect(KernelProjectionSchema.parse({ ...base, systemPromptInjection }).systemPromptInjection).toBe(systemPromptInjection)
    }
  })

  test('rejects missing fields and invalid enum values', () => {
    const { terminalCallback: _terminalCallback, ...missing } = base
    expect(KernelProjectionSchema.safeParse(missing).success).toBe(false)
    expect(KernelProjectionSchema.safeParse({ ...base, permissionGate: 'partial' }).success).toBe(false)
  })
})

describe('KernelDefinition capabilities integration', () => {
  test('Given 旧内核配置 When 无 capabilities Then 保持未声明', () => {
    expect(KernelDefinitionSchema.parse({ id: 'legacy', name: '旧配置', tier: 'pty', cli: 'legacy', pty: {} }).capabilities).toBeUndefined()
  })
  test('retains capability declaration on a kernel definition', () => {
    const parsed = KernelDefinitionSchema.parse({
      id: 'fixture',
      name: 'Fixture',
      tier: 'pty',
      cli: 'fixture',
      pty: {},
      capabilities: {
        context: completeContext,
        permission: 'mode-only',
        transport: 'pty',
      },
    })
    expect(parsed.capabilities?.permission).toBe('mode-only')
    expect(parsed.capabilities?.transport).toBe('pty')
  })
})
