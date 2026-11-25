import {z} from 'zod'
const Option=z.strictObject({value:z.string().max(512),label:z.string().max(300)})
export const MobileControlFieldSchema=z.strictObject({key:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,80}$/),label:z.string().max(200),type:z.enum(['text','secret','multiline','json','boolean','number','select']),required:z.boolean().optional(),value:z.json().optional(),options:z.array(Option).max(1000).optional(),hint:z.string().max(1000).optional()})
export const MobileControlActionSchema=z.strictObject({id:z.string().regex(/^[a-z][a-z0-9.-]{0,100}$/),title:z.string().max(200),group:z.string().max(100),scope:z.enum(['project','session','management']),effect:z.enum(['read','write']),description:z.string().max(1500),fields:z.array(MobileControlFieldSchema).max(50),confirm:z.boolean().optional(),requiresManagement:z.boolean().optional()})
export const MobileControlCallSchema=z.strictObject({operation:z.string().regex(/^[a-z][a-z0-9.-]{0,100}$/),workspaceId:z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).optional(),sessionId:z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).optional(),values:z.record(z.string().max(100),z.json()).refine(value=>JSON.stringify(value).length<180000,'操作参数过大').default({})})
export type MobileControlField=z.infer<typeof MobileControlFieldSchema>
export type MobileControlAction=z.infer<typeof MobileControlActionSchema>
export type MobileControlCall=z.infer<typeof MobileControlCallSchema>
