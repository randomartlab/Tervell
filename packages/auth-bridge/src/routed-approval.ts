/** 通用BYOK模型不保证支持CLI私有安全分类格式；未指定模式时交给真实用户审批。 */
export function routedApprovalDefault(kernelId:string,routed:boolean,explicitMode:string|undefined,offered:readonly unknown[]):string|undefined{
  if(!routed||explicitMode)return undefined
  const modes:Record<string,string>={codex:'workspace-write',qwen:'default',claude:'default'}
  const mode=modes[kernelId]
  return mode&&offered.includes(mode)?mode:undefined
}
