import type { KernelDefinition, KernelDetection, KernelLaunchSpec, KernelTransport } from '@proma/protocol'
import type { KernelRegistry } from './registry.ts'

/**
 * 内核探测与启动描述构造
 *
 * 只负责"找到可执行文件 + 组装 KernelLaunchSpec"，真正的子进程生命周期由 KH-01 负责。
 * env 由调用方传入（通常来自 auth-bridge 的 buildKernelEnv），这里不读写 process.env。
 */

/** 可执行文件查找；默认用 Bun.which，测试时可注入 */
export type Which = (command: string) => string | null

export interface ResolveOptions {
  transport: Exclude<KernelTransport, 'native-sdk'>
  env: Record<string, string>
  cwd?: string
  /** 追加到清单参数之后的用户参数 */
  extraArgs?: string[]
}

export class KernelNotFoundError extends Error {
  constructor(
    readonly kernelId: string,
    message: string,
  ) {
    super(message)
    this.name = 'KernelNotFoundError'
  }
}

export class KernelLauncher {
  constructor(
    private readonly registry: KernelRegistry,
    private readonly which: Which = (cmd) => Bun.which(cmd),
  ) {}

  detect(id: string): KernelDetection {
    const def = this.requireDef(id)
    const cliPath = this.which(def.cli)
    const acpPath = def.acp ? this.which(def.acp.command ?? def.cli) : null
    const transports: KernelDetection['transports'] = []
    if (acpPath) transports.push('acp')
    if (cliPath && def.pty) transports.push('pty')
    return {
      kernelId: def.id,
      cliPath,
      acpPath,
      transports,
      ...(def.installHint && transports.length === 0 ? { installHint: def.installHint } : {}),
    }
  }

  detectAll(): KernelDetection[] {
    return this.registry.list().map((def) => this.detect(def.id))
  }

  resolve(id: string, options: ResolveOptions): KernelLaunchSpec {
    const def = this.requireDef(id)
    const spec = options.transport === 'acp' ? def.acp : def.pty
    if (!spec) throw new KernelNotFoundError(id, `${def.name} 不支持 ${options.transport} 模式`)

    const command = options.transport === 'pty' ? (spec.command ?? def.cli) : (spec.command ?? def.cli)
    const path = this.which(command)
    if (!path) {
      const hint = def.installHint ? `；安装：${def.installHint}` : ''
      throw new KernelNotFoundError(id, `未找到 ${command}${hint}`)
    }

    return {
      kernelId: def.id,
      transport: options.transport,
      command: path,
      args: [...spec.args, ...(options.extraArgs ?? [])],
      // 清单 env 先应用，调用方 env（含凭据/代理）后应用
      env: { ...spec.env, ...options.env },
      ...(options.cwd ? { cwd: options.cwd } : {}),
    }
  }

  private requireDef(id: string): KernelDefinition {
    const def = this.registry.get(id)
    if (!def) throw new KernelNotFoundError(id, `未注册的内核：${id}`)
    return def
  }
}
