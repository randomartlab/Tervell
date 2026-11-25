/** 所有内核共享显示策略；展开只影响视图，不删除推理或工具记录。 */
export type ActivityDisplayMode = 'expanded' | 'balanced' | 'collapsed'
export interface ActivityDisplayPreferences { reasoning: ActivityDisplayMode; operations: ActivityDisplayMode; chineseReasoning?:boolean; translationModel?:{channelId:string;modelId:string} }
export const DEFAULT_ACTIVITY_DISPLAY: ActivityDisplayPreferences = { reasoning:'balanced', operations:'balanced' }
export function normalizeActivityDisplay(value:unknown):ActivityDisplayPreferences {
 const row=value&&typeof value==='object'?value as Record<string,unknown>:{}
 const mode=(v:unknown):ActivityDisplayMode=>v==='expanded'||v==='collapsed'?v:'balanced'
 const conn=row.translationModel&&typeof row.translationModel==='object'?row.translationModel as Record<string,unknown>:undefined
 return {reasoning:mode(row.reasoning),operations:mode(row.operations),...(row.chineseReasoning===true?{chineseReasoning:true}:{}),...(conn&&typeof conn.channelId==='string'&&typeof conn.modelId==='string'?{translationModel:{channelId:conn.channelId,modelId:conn.modelId}}:{})}
}
export function activityStartsExpanded(mode:ActivityDisplayMode,running:boolean,failed=false):boolean {
 return mode==='expanded'||mode==='balanced'&&(running||failed)
}
