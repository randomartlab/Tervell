/** 会话控件以 CLI 实际回报为准，不按产品名称猜测 Fast、推理或审批能力。 */
export type KernelConfigValue = string | number | boolean
export interface KernelControlChoice { value: KernelConfigValue; name: string; description?: string; group?: string }
export interface KernelSessionControl {
 id: string; name: string; description?: string; category?: string
 type: 'select' | 'boolean' | 'number' | 'string' | 'unsupported'
 currentValue?: KernelConfigValue; options?: KernelControlChoice[]; minimum?: number; maximum?: number
 method: 'config' | 'model' | 'mode'; readOnly?: boolean
}
export interface KernelSessionSelection { modelId?: string; modeId?: string; configValues?: Record<string, KernelConfigValue> }
