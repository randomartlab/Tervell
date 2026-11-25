import { z } from 'zod'

export const JsonValueSchema = z.json()
const RpcId = z.union([z.string().min(1), z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER)])
const RpcError = z.object({ code: z.number().int(), message: z.string(), data: z.json().optional() })
export const JsonRpcMessageSchema = z.union([
  z.strictObject({ jsonrpc: z.literal('2.0'), id: RpcId.optional(), method: z.string().min(1), params: z.union([z.record(z.string(), z.json()), z.array(z.json())]).optional() }),
  z.strictObject({ jsonrpc: z.literal('2.0'), id: RpcId, result: z.json() }),
  z.strictObject({ jsonrpc: z.literal('2.0'), id: RpcId.nullable(), error: RpcError }),
])
export type JsonRpcMessage = z.infer<typeof JsonRpcMessageSchema>
export type JsonRpcId = z.infer<typeof RpcId>
export type JsonValue = z.infer<typeof JsonValueSchema>

const ObjectJson = z.record(z.string(), z.json())
export const AcpInitializeResultSchema = z.looseObject({ protocolVersion: z.literal(1), agentCapabilities: z.looseObject({ loadSession: z.boolean().optional(), promptCapabilities: ObjectJson.optional(), mcpCapabilities: ObjectJson.optional(), sessionCapabilities: ObjectJson.optional() }).optional() })
export const AcpNewSessionResultSchema = z.looseObject({ sessionId: z.string().min(1) })
export const AcpPromptResultSchema = z.looseObject({ stopReason: z.enum(['end_turn', 'max_tokens', 'max_turn_requests', 'refusal', 'cancelled']) })
export const AcpNotificationSchema = z.looseObject({ sessionId: z.string().min(1), update: ObjectJson })
export const AcpPermissionSchema = z.looseObject({ sessionId: z.string().min(1), toolCall: z.looseObject({ toolCallId: z.string().min(1), title: z.string().nullable().optional(), kind: z.string().nullable().optional(), rawInput: z.json().optional() }), options: z.array(z.looseObject({ optionId: z.string().min(1), name: z.string().min(1), kind: z.enum(['allow_once', 'allow_always', 'reject_once', 'reject_always']) })).min(1).refine((items) => new Set(items.map((item) => item.optionId)).size === items.length, '审批optionId不得重复') })
export const AcpTextUpdateSchema = z.looseObject({ sessionUpdate: z.enum(['agent_message_chunk', 'agent_thought_chunk']), content: z.looseObject({ type: z.literal('text'), text: z.string() }), contentIndex: z.number().int().nonnegative().optional(), messageId: z.string().nullable().optional() })
export const AcpToolUpdateSchema = z.looseObject({ sessionUpdate: z.enum(['tool_call', 'tool_call_update']), toolCallId: z.string().min(1), title: z.string().nullable().optional(), name: z.string().nullable().optional(), kind: z.string().nullable().optional(), status: z.enum(['pending', 'in_progress', 'completed', 'failed']).nullable().optional(), rawInput: z.json().optional(), rawOutput: z.json().optional(), content: z.array(z.json()).nullable().optional() })
export const AcpPlanUpdateSchema = z.looseObject({ sessionUpdate: z.literal('plan'), entries: z.array(z.looseObject({ content: z.string(), priority: z.enum(['high', 'medium', 'low']), status: z.enum(['pending', 'in_progress', 'completed']) })) })
export const AcpUsageUpdateSchema = z.looseObject({ sessionUpdate: z.literal('usage_update'), used: z.number().int().nonnegative(), size: z.number().int().nonnegative(), cost: z.looseObject({ amount: z.number().nonnegative(), currency: z.string() }).nullable().optional() })

export const AcpRunEnvelopeSchema = z.strictObject({ sessionId: z.string().min(1), epoch: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), event: z.json() })

export const AcpCompactionUpdateSchema = z.looseObject({ sessionUpdate: z.literal('compaction_update'), compactionId: z.string().min(1), status: z.enum(['in_progress', 'completed', 'failed', 'cancelled']), summary: z.array(ObjectJson).nullable().optional(), error: z.string().nullable().optional(), _meta: ObjectJson.nullable().optional() })
export const AcpCompactionChunkSchema = z.looseObject({ sessionUpdate: z.literal('compaction_summary_chunk'), compactionId: z.string().min(1), content: ObjectJson })

export const AcpSessionMetadataUpdateSchema = z.union([
  z.looseObject({ sessionUpdate: z.literal('available_commands_update'), availableCommands: z.array(z.json()) }),
  z.looseObject({ sessionUpdate: z.literal('current_mode_update'), currentModeId: z.string() }),
  z.looseObject({ sessionUpdate: z.literal('config_option_update'), configOptions: z.array(z.json()) }),
  z.looseObject({ sessionUpdate: z.literal('session_info_update'), title: z.string().nullish(), updatedAt: z.string().nullish() }),
])
