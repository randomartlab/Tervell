import { z } from 'zod'
import { EntityIdSchema, MessageSchema } from './session.ts'
import { KernelIdSchema, KernelCapabilitiesSchema } from './kernel.ts'

export const KernelSessionHandleSchema = z.strictObject({ kernelId: KernelIdSchema, sessionId: EntityIdSchema, kernelSessionRef: z.string().min(1) })
export const KernelSessionCreateSchema = z.strictObject({ sessionId: EntityIdSchema, cwd: z.string().min(1), systemPrompt: z.string().default('') })
export const KernelPromptInputSchema = z.strictObject({ runId: EntityIdSchema, text: z.string(), history: z.array(MessageSchema).default([]), summary: z.string().optional() })
export const KernelPermissionResponseSchema = z.strictObject({ actionId: EntityIdSchema, behavior: z.enum(['allow', 'deny']) })
export const KernelProbeResultSchema = z.strictObject({ available: z.boolean(), capabilities: KernelCapabilitiesSchema, version: z.string().optional() })
export type KernelSessionHandle = z.infer<typeof KernelSessionHandleSchema>
export type KernelSessionCreate = z.infer<typeof KernelSessionCreateSchema>
export type KernelPromptInput = z.input<typeof KernelPromptInputSchema>
export type KernelPermissionResponse = z.infer<typeof KernelPermissionResponseSchema>
export type KernelProbeResult = z.infer<typeof KernelProbeResultSchema>
