import type { KernelSessionControl } from '../types/kernel-controls'

/** 标签仅用于展示，提交时始终保留服务返回的原始档位。 */
export function reasoningEffortLabel(value: string): string {
  const labels: Record<string, string> = {none:'关闭',off:'关闭',minimal:'最低',low:'低',medium:'中',high:'高',xhigh:'更高',max:'最高',ultra:'Ultra'}
  return labels[value] ?? value
}

/** ACP 的分类或控件标识声明推理能力，不按内核产品名分支。 */
export function isReasoningControl(control: KernelSessionControl): boolean {
  return /(?:reasoning|thinking|thought|effort)/i.test(`${control.category ?? ''} ${control.id}`)
}

export function uniqueReasoningEfforts(values: readonly string[]): string[] {
  return [...new Set(values.filter(value => value.trim().length > 0))]
}
