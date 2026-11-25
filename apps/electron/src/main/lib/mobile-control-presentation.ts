import type { GatewayProvider,DesktopKernelCatalog,KernelSessionSelection } from '@proma/shared'

/** 探测不会修改真实会话；表单必须保留用户刚选的模型和模式。 */
export function mobileKernelCatalog(catalog:DesktopKernelCatalog,selection:KernelSessionSelection):DesktopKernelCatalog{
  return {...catalog,controls:catalog.controls?.map(control=>{
    const selected=control.category==='model'||control.id==='model'?selection.modelId:control.category==='mode'||control.id==='mode'?selection.modeId:selection.configValues?.[control.id]
    if(selected===undefined||control.type==='select'&&!control.options?.some(option=>option.value===selected))return control
    return {...control,currentValue:selected}
  })}
}

/** 单项编辑使用完整模型标识；快照中的展示摘要不能作为保存表单。 */
export function mobileProviderDraft(provider: GatewayProvider) {
  return {
    id: provider.id,
    name: provider.name,
    preset: provider.preset,
    chat: provider.chat,
    responses: provider.responses,
    anthropic: provider.anthropic,
    gemini: provider.gemini,
    models: provider.models.filter(model => model.enabled).map(model => model.id),
    routing: provider.routing,
    fallback: provider.fallback,
    create: false,
  }
}
