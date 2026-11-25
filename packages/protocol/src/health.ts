import { z } from 'zod'
import { KernelIdSchema } from './kernel.ts'
export const KernelHealthSchema = z.strictObject({
  kernelId: KernelIdSchema, status: z.enum(['verified', 'unverified', 'degraded']),
  reason: z.enum(['matched', 'missing-baseline', 'version-drift', 'trace-drift', 'scenario-failed', 'invalid-trace']),
  expectedVersion: z.string().optional(), observedVersion: z.string().optional(),
  evidence: z.enum(['scripted', 'live']).optional(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
})
export type KernelHealth = z.infer<typeof KernelHealthSchema>
