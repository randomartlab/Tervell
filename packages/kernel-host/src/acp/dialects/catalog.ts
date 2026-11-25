import { AcpModelCatalogSchema } from '@proma/protocol'
import type { AcpModelCatalog } from '@proma/protocol'
import { record, array } from './types.ts'
import { primaryKernelControl } from '@proma/shared'

/** ACP旧models与新configOptions都允许；绝不选当前模型探测目录，以免写CLI偏好。 */
export function readSessionCatalog(raw: unknown): AcpModelCatalog {
  const session = record(raw); const state = record(session.models)
  const options = array(session.configOptions).map(record).map((option,index)=>typeof option.id==='string'?option:{...option,id:'unnamed-'+index})
  const config = primaryKernelControl(options.filter((option): option is Record<string, unknown> & {id:string;category?:string} => typeof option.id === 'string' && (option.category === undefined || typeof option.category === 'string')), 'model')
  let visited = 0
  const flatten = (items: unknown[], depth = 0): Array<{ id: string; name: string }> => {
    visited += items.length
    if (depth > 8 || visited > 10000) throw new Error('模型目录嵌套或数量超过上限')
    return items.flatMap((item) => {
      const option = record(item)
      if (Array.isArray(option.options)) return flatten(option.options, depth + 1)
      const value = option.value ?? option.modelId
      return typeof value === 'string' && value ? [{ id: value, name: typeof option.name === 'string' ? option.name : value }] : []
    })
  }
  const models = config ? flatten(array(config.options)) : array(state.availableModels).flatMap((item) => {
    const model = record(item); return typeof model.modelId === 'string' ? [{ id: model.modelId, name: typeof model.name === 'string' ? model.name : model.modelId }] : []
  })
  const seen = new Set<string>()
  return AcpModelCatalogSchema.parse({ models: models.filter((model) => !seen.has(model.id) && seen.add(model.id)), currentModelId: typeof config?.currentValue === 'string' ? config.currentValue : typeof state.currentModelId === 'string' ? state.currentModelId : null })
}
export function readCursorCatalog(raw: unknown): AcpModelCatalog {
  const rows = array(record(raw).models)
  if (!rows.length) throw new Error('Cursor目录响应缺失或为空，不能回退到猜测模型')
  return AcpModelCatalogSchema.parse({ models: rows.map((item) => {
    const row = record(item)
    return { id: row.value, name: row.name, configOptions: array(row.configOptions) }
  }), currentModelId: null })
}
