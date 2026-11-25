import { z } from 'zod'
import { JsonRpcMessageSchema } from './acp.ts'
import { KernelIdSchema } from './kernel.ts'
export const AcpTraceSchema = z.strictObject({
  format: z.literal('proma-acp-trace'), version: z.literal(1), kernelId: KernelIdSchema, dialectId: KernelIdSchema.optional(),
  origin: z.enum(['scripted', 'live']), agentVersion: z.string().min(1), source: z.string().min(1),
  frames: z.array(z.strictObject({ seq: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), direction: z.enum(['client', 'agent']), message: JsonRpcMessageSchema })).max(100000),
}).superRefine((trace, ctx) => {
  trace.frames.forEach((frame, index) => { if (frame.seq !== index + 1) ctx.addIssue({ code: 'custom', path: ['frames', index, 'seq'], message: 'trace序号必须连续' }) })
})
export type AcpTrace = z.infer<typeof AcpTraceSchema>
export const AcpModelCatalogSchema = z.strictObject({
  models: z.array(z.strictObject({ id: z.string().min(1), name: z.string(), configOptions: z.array(z.json()).optional() })).max(10000).refine((models) => new Set(models.map((model) => model.id)).size === models.length, '模型id不得重复'),
  currentModelId: z.string().nullable(),
})
export type AcpModelCatalog = z.infer<typeof AcpModelCatalogSchema>
