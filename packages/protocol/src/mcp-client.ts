import { z } from 'zod'
import { EntityIdSchema } from './session.ts'
import { SecretRefSchema } from './auth.ts'
const Url=z.string().url().refine((raw)=>{const u=new URL(raw);return !u.username&&!u.password&&!u.hash&&!u.search&&(u.protocol==='https:'||(u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname)))},'MCP必须使用HTTPS或显式本机回环地址')
export const McpConnectionSchema=z.discriminatedUnion('transport',[
 z.strictObject({id:EntityIdSchema,transport:z.literal('stdio'),command:z.string().min(1),args:z.array(z.string()).default([])}),
 z.strictObject({id:EntityIdSchema,transport:z.enum(['http','sse']),url:Url,apiKeyRef:SecretRefSchema.optional()}),
])
export type McpConnection=z.infer<typeof McpConnectionSchema>
