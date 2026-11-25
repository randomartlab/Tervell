import type { KernelSessionControl, KernelConfigValue } from '../types/kernel-controls'

interface CategorizedControl {
  id: string
  category?: string
  method?: string
}

/** 某些 ACP 同时把 provider 和 model 标成 model 类别；供应商仍须作为独立配置提交。 */
export function primaryKernelControl<T extends CategorizedControl>(controls: readonly T[], kind: 'model' | 'mode'): T | undefined {
  return controls.find(control => control.id === kind)
    ?? controls.find(control => control.method === kind)
    ?? controls.find(control => control.category === kind && (kind !== 'model' || !/(?:^|[._/\-])provider(?:$|[._/\-])/i.test(control.id)))
}

export function kernelControlSelectionField(control: CategorizedControl, controls: readonly CategorizedControl[]): 'modelId' | 'modeId' | undefined {
  if (primaryKernelControl(controls, 'model')?.id === control.id) return 'modelId'
  if (primaryKernelControl(controls, 'mode')?.id === control.id) return 'modeId'
  return undefined
}

export function isKernelModelControl(control: KernelSessionControl, controls: readonly KernelSessionControl[]): boolean {
  return kernelControlSelectionField(control, controls) === 'modelId'
}

export function isKernelModelDependency(control: CategorizedControl, controls: readonly CategorizedControl[]): boolean {
  return !kernelControlSelectionField(control, controls) && (control.category === 'model' || /(?:^|[._/\-])provider(?:$|[._/\-])/i.test(control.id) || /(?:^|[._/\-])provider(?:$|[._/\-])/i.test(control.category??''))
}

/** 切换模型时保留其供应商，清除旧模型的推理、预算等从属选项。 */
export function kernelModelDependencies<T extends CategorizedControl>(controls: readonly T[], values: Readonly<Record<string, KernelConfigValue>> = {}): Record<string, KernelConfigValue> {
  return Object.fromEntries(Object.entries(values).filter(([id]) => {
    const control = controls.find(row => row.id === id)
    return !!control && isKernelModelDependency(control, controls)
  }))
}
