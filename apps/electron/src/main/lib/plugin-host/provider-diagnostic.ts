import type { DesktopKernelEntry } from '@proma/shared';

/** Paseo 公开诊断字段按单行输出；不混入环境变量、认证信息或未经验证的 PATH 候选。 */
export function paseoProviderDiagnostic(provider: DesktopKernelEntry | undefined, id: string): string {
  const line = (value: string | undefined, fallback: string) => value?.trim() && !/[\r\n\0]/.test(value) ? value.trim() : fallback;
  return [
    `Provider: ${line(id, 'unknown')}`,
    `  Status: ${provider?.available ? 'available' : 'unavailable'}`,
    `  Resolved path: ${line(provider?.resolvedCommand, 'not found')}`,
    `  Version: ${line(provider?.version, 'unknown')}`,
    ...(id === 'pi' ? ['  Managed by: Tervell application update'] : []),
    ...(provider?.diagnostic ? [`  Note: ${line(provider.diagnostic, '诊断含多行内容，请在内核设置查看')}`] : []),
  ].join('\n');
}
