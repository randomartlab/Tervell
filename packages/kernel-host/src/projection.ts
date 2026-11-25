import { KernelCapabilitiesSchema, KernelProjectionSchema } from '@proma/protocol'
import type { KernelCapabilities, KernelProjection, KernelTransport } from '@proma/protocol'

/** 映射依据能力和宿主实际桥接状态，禁止按内核名称判断。 */
export function projectKernel(raw: KernelCapabilities, transport: KernelTransport, bridges = { fs: false, terminal: false }): KernelProjection {
  const capabilities = KernelCapabilitiesSchema.parse(raw)
  const validTransport = transport === 'pty' ? capabilities.transport === 'pty'
    : transport === 'native-sdk' ? capabilities.transport === 'in-process'
      : capabilities.transport === 'stdio' || capabilities.transport === 'http'
  if (!validTransport) throw new Error('传输与已协商能力不匹配')
  const pty = transport === 'pty'
  const mcp = !pty && capabilities.tools.mcp ? 'native' : 'none'
  const fsCallback = !pty && bridges.fs && capabilities.fs === 'client-bridge'
  const terminalCallback = !pty && bridges.terminal && capabilities.terminal === 'client-bridge'
  const callback = capabilities.permission === 'callback'
  return KernelProjectionSchema.parse({
    transport, mcp, fsCallback, terminalCallback,
    permissionGate: callback && fsCallback && terminalCallback ? 'full' : callback && mcp === 'native' ? 'mcp-only' : 'none',
    usageDetail: !pty && capabilities.usage.tokens ? capabilities.usage.cost ? 'token+cost' : 'token' : 'none',
    systemPromptInjection: capabilities.context.systemPrompt === 'prepend' ? 'prepend-text'
      : !pty && ['native', 'meta'].includes(capabilities.context.systemPrompt) ? 'native' : 'none',
  })
}
