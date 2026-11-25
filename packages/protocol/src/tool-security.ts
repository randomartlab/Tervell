import { z } from 'zod'
import { EntityIdSchema } from './session.ts'
export const ToolApprovalDecisionSchema = z.enum(['allow-once', 'allow-session', 'deny'])
export type ToolApprovalDecision = z.infer<typeof ToolApprovalDecisionSchema>
export const ToolAuditSchema = z.strictObject({
  id: z.string().uuid(), sessionId: EntityIdSchema, workspaceId: EntityIdSchema,
  tool: z.string().min(1).max(160), inputHash: z.string().regex(/^[a-f0-9]{64}$/),
  phase: z.enum(['decision', 'result']), outcome: z.enum(['allow', 'deny', 'cancelled', 'succeeded', 'failed']),
  risk: z.enum(['read', 'review', 'dangerous']), at: z.number().int().nonnegative(),
})
export type ToolAudit = z.infer<typeof ToolAuditSchema>
const Session = { sessionId: z.string().min(1) }
export const AcpReadFileSchema = z.object({ ...Session, path: z.string().min(1), line: z.number().int().positive().nullable().optional(), limit: z.number().int().positive().max(10000).nullable().optional() })
export const AcpWriteFileSchema = z.object({ ...Session, path: z.string().min(1), content: z.string().max(1024 * 1024) })
export const AcpCreateTerminalSchema = z.object({ ...Session, command: z.string().min(1).max(65536), args: z.array(z.string().max(262144)).max(512).nullish(), cwd: z.string().nullable().optional(), env: z.array(z.object({ name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/), value: z.string().max(65536).refine(value=>!value.includes('\0')) })).max(512).nullish(), outputByteLimit: z.number().int().nonnegative().nullable().optional() })
export const AcpTerminalIdSchema = z.object({ ...Session, terminalId: z.string().uuid() })
