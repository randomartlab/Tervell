import { expect, test } from 'bun:test'
import { kernelControlSelectionField, primaryKernelControl, kernelModelDependencies } from './kernel-controls'

test('Given 供应商和模型都被ACP标为model When 解析专用字段 Then 选择真实model并保留provider为独立配置', () => {
  const controls = [{ id: 'provider', category: 'model' }, { id: 'model', category: 'model' }, { id: 'mode', category: 'mode' }]
  expect(primaryKernelControl(controls, 'model')?.id).toBe('model')
  expect(kernelControlSelectionField(controls[0]!, controls)).toBeUndefined()
  expect(kernelControlSelectionField(controls[1]!, controls)).toBe('modelId')
  expect(kernelControlSelectionField(controls[2]!, controls)).toBe('modeId')
  expect(primaryKernelControl([{ id: 'provider', category: 'model' }], 'model')).toBeUndefined()
  expect(kernelModelDependencies(controls,{provider:'local',thinking:'ultra',budget:4})).toEqual({provider:'local'})
  expect(primaryKernelControl([{ id: 'llm-model', category: 'model' }], 'model')?.id).toBe('llm-model')
})
