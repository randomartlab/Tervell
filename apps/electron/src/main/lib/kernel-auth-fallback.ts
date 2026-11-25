import { isKernelAuthenticationRequired } from '@proma/kernel-host';
import type { GatewayReasoningSelection } from '@proma/shared';
import { MAGPIE_AGENT_ADAPTERS, MAGPIE_ACCOUNT_REQUIRED_KERNELS, environmentRoutedKernel, selectAuthenticationFallbackModel } from '@proma/auth-bridge';
import {
  modelRoutingConfig, prepareRoutedKernel, refreshRoutingModels,
  saveModelRouting, startModelRouting,
} from './model-routing-service';
import { getMainWindow } from './main-window-store';
import { MODEL_ROUTING_IPC } from '@proma/shared';
import { assertKernelNativeAuthentication } from './kernel-native-auth';

export const KERNEL_ACCOUNT_HINT = '已有官方账号可到设置 → 全局模型路由 → 订阅与账号登录。';
export type PreparedKernelRoute = Awaited<ReturnType<typeof prepareRoutedKernel>>;

interface AuthenticationFallbackOptions<T> {
  kernelId: string;
  base: Record<string, string>;
  scope: string;
  selection?: GatewayReasoningSelection;
  signal?: AbortSignal;
  /** 仅创建进程/会话；不得在这里发 prompt 或执行工具。失败的进程由调用者清理。 */
  open: (route: PreparedKernelRoute) => Promise<T>;
}

/** 同一入口用于设置探测、桌面/手机发送、自动化和协作；只重试一次会话创建。 */
export async function openKernelWithAuthenticationFallback<T>(options: AuthenticationFallbackOptions<T>): Promise<{
  value: T; route: PreparedKernelRoute; notice?: string;
}> {
  const { kernelId, base, scope, selection, signal, open } = options;
  const before = modelRoutingConfig(), signature = JSON.stringify(before);
  const route = await prepareRoutedKernel(kernelId, base, scope, selection);
  signal?.throwIfAborted();
  try { assertKernelNativeAuthentication(kernelId,route.env); return { value: await open(route), route }; }
  catch (error) {
    signal?.throwIfAborted();
    if (!isKernelAuthenticationRequired(error)) throw error;
    if (MAGPIE_ACCOUNT_REQUIRED_KERNELS[kernelId]) throw Error(MAGPIE_ACCOUNT_REQUIRED_KERNELS[kernelId]+KERNEL_ACCOUNT_HINT);
    if (route.model) throw Error('Magpie 已接管，但此内核仍要求厂商认证。' + KERNEL_ACCOUNT_HINT);
    if (!MAGPIE_AGENT_ADAPTERS[kernelId] && !environmentRoutedKernel(kernelId)) {
      throw Error('此内核要求厂商账号且未开放可用的 Magpie 接管接口。可切换到内置 Pi 使用全局模型。' + KERNEL_ACCOUNT_HINT);
    }
    await startModelRouting(base.PATH ?? '');
    const state = await refreshRoutingModels();
    const model = selectAuthenticationFallbackModel(before.defaultModel, state.models.map(row => row.id));
    if (!model) throw Error('内核尚未登录。请在全局模型路由配置并选择默认模型，之后会自动由 Magpie 接管。' + KERNEL_ACCOUNT_HINT);
    signal?.throwIfAborted();
    if (JSON.stringify(modelRoutingConfig()) !== signature) throw Error('模型路由已在其他窗口变化，请重新检查连接');
    const fallback = await prepareRoutedKernel(kernelId, base, scope, selection, model);
    signal?.throwIfAborted();
    let value: T;
    try { value = await open(fallback); }
    catch (retryError) {
      if (isKernelAuthenticationRequired(retryError)) throw Error('已尝试 Magpie 接管，此内核仍要求厂商账号。' + KERNEL_ACCOUNT_HINT);
      throw retryError;
    }
    // 只在真实会话创建成功后记录。并发编辑获胜，本轮已创建的进程继续使用自己的环境。
    if (JSON.stringify(modelRoutingConfig()) === signature) {
      const next = saveModelRouting({ ...before, rules: [...before.rules.filter(row => row.kernelId !== kernelId), { kernelId, mode: 'override', model }] });
      const win = getMainWindow();
      if (win && !win.isDestroyed()) win.webContents.send(MODEL_ROUTING_IPC.changed, next);
    }
    return { value, route: fallback, notice: '内核未登录，已由 Magpie 接管模型：' + model + '。' + KERNEL_ACCOUNT_HINT };
  }
}

