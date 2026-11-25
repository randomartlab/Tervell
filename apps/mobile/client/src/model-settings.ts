import {kernelControlSelectionField} from '@proma/shared';
import type {RecordValue} from './bridge';
export interface MobileControlRow {
  id: string; name: string; category?: string; type: string;
  currentValue?: string | number | boolean; readOnly?: boolean;
  minimum?: number; maximum?: number;
  options?: Array<{value: string | number | boolean; name: string}>;
}
/** 把内核实际当前值带回表单；不把另一内核的选择带入新目录。 */
export function kernelFormValues(catalog: RecordValue, detail: RecordValue = {}) {
  const config: RecordValue = {};
  const controls=(Array.isArray(catalog.controls) ? catalog.controls : []) as MobileControlRow[];
  for (const row of controls) {
    if (row.currentValue !== undefined && !kernelControlSelectionField(row,controls)) config[row.id] = row.currentValue;
  }
  const saved = detail.configValues;
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) Object.assign(config, saved);
  return {
    model: String(catalog.routedModel || detail.modelId || catalog.currentModelId || ''),
    mode: String(detail.modeId ?? catalog.currentModeId ?? ''),
    config
  };
}
