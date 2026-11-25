import { z } from 'zod'
import { EntityIdSchema } from './session.ts'
import { KernelEventSchema } from './events.ts'
export const KernelHostRunSchema = z.strictObject({ sessionId: EntityIdSchema, runId: EntityIdSchema, prompt: z.string(), resumeToken: z.string().optional() })
export const KernelHostCommandSchema = z.discriminatedUnion('method', [
  z.strictObject({ method: z.literal('prompt'), input: KernelHostRunSchema }),
  z.strictObject({ method: z.literal('resume'), input: KernelHostRunSchema, fromSeq: z.number().int().nonnegative() }),
])
export const KernelHostMessageSchema = z.discriminatedUnion('method', [
  z.strictObject({ method: z.literal('ready') }),
  z.strictObject({ method: z.literal('event'), event: KernelEventSchema }),
])
export type KernelHostRun = z.infer<typeof KernelHostRunSchema>
export type KernelHostCommand = z.infer<typeof KernelHostCommandSchema>
export type KernelHostMessage = z.infer<typeof KernelHostMessageSchema>
export const KernelHostFailureSchema = z.strictObject({ method: z.literal('failure'), message: z.string() })
