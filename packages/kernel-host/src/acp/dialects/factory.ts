import type { KernelLaunchSpec } from '@proma/protocol'
import { KernelLauncher } from '../../launcher.ts'
import { KernelRegistry } from '../../registry.ts'
import type { AcpKernelOptions } from '../kernel.ts'
import { AcpKernel } from '../kernel.ts'
import { acpDialect } from './index.ts'
import { acpHealth } from '../drift.ts'
import type { AcpHealthRegistry } from '../drift.ts'
import type { AcpDialect } from './types.ts'

/** 只有注册表负责内核名→方言的绑定；OpenCode未报告版本时不猜测1.x/2.x。 */
export function dialectForKernel(kernelId: string, version?: string): AcpDialect {
  const ids: Record<string, string> = { grok:'grok',claude: 'claude-code', gemini: 'gemini-cli', cursor: 'cursor-agent', omp: 'omp', codex: 'codex', opencode2: 'opencode-2' }
  if (kernelId === 'opencode') {
    const match = version?.match(/^(?:opencode[ /])?v?(\d+)\./)
    if (!match || !['1', '2'].includes(match[1]!)) throw new Error('OpenCode需要已探测的1.x或2.x版本，不能猜测方言')
    return acpDialect(match[1] === '1' ? 'opencode-1' : 'opencode-2')
  }
  if (!Object.hasOwn(ids, kernelId)) throw new Error(`首批ACP无对应方言：${kernelId}`)
  if (kernelId === 'opencode2' && version && !/^(?:opencode2?[ /])?v?2\./.test(version)) throw new Error('opencode2别名与报告版本不一致')
  return acpDialect(ids[kernelId]!)
}
export function resolveDialectKernel(input: { kernelId: string; version?: string; env: Record<string, string>; cwd: string; health?: AcpHealthRegistry; openToolBridge?: AcpKernelOptions['openToolBridge']; openClientBridge?: AcpKernelOptions['openClientBridge']; approve?: AcpKernelOptions['approve'] }, launcher = new KernelLauncher(new KernelRegistry())): { launch: KernelLaunchSpec; dialect: AcpDialect; kernel: AcpKernel } {
  const health = input.health ?? acpHealth
  health.checkVersion(input.kernelId, input.version)
  health.assertLaunchable(input.kernelId)
  const dialect = dialectForKernel(input.kernelId, input.version)
  health.checkVersion(dialect.id, input.version)
  health.assertLaunchable(dialect.id)
  const launch = launcher.resolve(input.kernelId, { transport: 'acp', env: input.env, cwd: input.cwd })
  return { launch, dialect, kernel: new AcpKernel(input.kernelId, { command: launch.command, args: launch.args, env: launch.env, dialect, openToolBridge: input.openToolBridge, openClientBridge:input.openClientBridge, approve:input.approve }) }
}
