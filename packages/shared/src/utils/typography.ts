/** 三组字体相互独立；默认值保持原有 Proma 视觉。 */
export interface TypographyPreferences {
 uiFont?:string; uiSize?:number; codeFont?:string; codeSize?:number; conversationFont?:string; conversationSize?:number
}
export function normalizeTypography(raw:unknown):TypographyPreferences {
 const input=raw&&typeof raw==='object'?raw as Record<string,unknown>:{},result:TypographyPreferences={}
 for(const key of ['uiFont','codeFont','conversationFont']as const){const value=input[key];if(typeof value==='string'&&value.trim()&&value.length<=100&&!/[{};<>\\\r\n]/.test(value))result[key]=value.trim()}
 for(const [key,min,max]of [['uiSize',11,24],['codeSize',10,28],['conversationSize',11,32]]as const){const value=input[key];if(typeof value==='number'&&Number.isFinite(value))result[key]=Math.min(max,Math.max(min,value))}
 return result
}
