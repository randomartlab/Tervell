import { z } from 'zod';
export declare const JsonValueSchema: z.ZodJSONSchema;
declare const RpcId: z.ZodUnion<readonly [
    z.ZodString,
    z.ZodNumber
]>;
export declare const JsonRpcMessageSchema: z.ZodUnion<readonly [
    z.ZodObject<{
        jsonrpc: z.ZodLiteral<"2.0">;
        id: z.ZodOptional<z.ZodUnion<readonly [
            z.ZodString,
            z.ZodNumber
        ]>>;
        method: z.ZodString;
        params: z.ZodOptional<z.ZodUnion<readonly [
            z.ZodRecord<z.ZodString, z.ZodJSONSchema>,
            z.ZodArray<z.ZodJSONSchema>
        ]>>;
    }, z.core.$strict>,
    z.ZodObject<{
        jsonrpc: z.ZodLiteral<"2.0">;
        id: z.ZodUnion<readonly [
            z.ZodString,
            z.ZodNumber
        ]>;
        result: z.ZodJSONSchema;
    }, z.core.$strict>,
    z.ZodObject<{
        jsonrpc: z.ZodLiteral<"2.0">;
        id: z.ZodNullable<z.ZodUnion<readonly [
            z.ZodString,
            z.ZodNumber
        ]>>;
        error: z.ZodObject<{
            code: z.ZodNumber;
            message: z.ZodString;
            data: z.ZodOptional<z.ZodJSONSchema>;
        }, z.core.$strip>;
    }, z.core.$strict>
]>;
export type JsonRpcMessage = z.infer<typeof JsonRpcMessageSchema>;
export type JsonRpcId = z.infer<typeof RpcId>;
export type JsonValue = z.infer<typeof JsonValueSchema>;
export declare const AcpInitializeResultSchema: z.ZodObject<{
    protocolVersion: z.ZodLiteral<1>;
    agentCapabilities: z.ZodOptional<z.ZodObject<{
        loadSession: z.ZodOptional<z.ZodBoolean>;
        promptCapabilities: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
        mcpCapabilities: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
        sessionCapabilities: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const AcpNewSessionResultSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, z.core.$loose>;
export declare const AcpPromptResultSchema: z.ZodObject<{
    stopReason: z.ZodEnum<{
        cancelled: "cancelled";
        end_turn: "end_turn";
        max_tokens: "max_tokens";
        max_turn_requests: "max_turn_requests";
        refusal: "refusal";
    }>;
}, z.core.$loose>;
export declare const AcpNotificationSchema: z.ZodObject<{
    sessionId: z.ZodString;
    update: z.ZodRecord<z.ZodString, z.ZodJSONSchema>;
}, z.core.$loose>;
export declare const AcpPermissionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    toolCall: z.ZodObject<{
        toolCallId: z.ZodString;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kind: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        rawInput: z.ZodOptional<z.ZodJSONSchema>;
    }, z.core.$loose>;
    options: z.ZodArray<z.ZodObject<{
        optionId: z.ZodString;
        name: z.ZodString;
        kind: z.ZodEnum<{
            allow_always: "allow_always";
            allow_once: "allow_once";
            reject_always: "reject_always";
            reject_once: "reject_once";
        }>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const AcpTextUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodEnum<{
        agent_message_chunk: "agent_message_chunk";
        agent_thought_chunk: "agent_thought_chunk";
    }>;
    content: z.ZodObject<{
        type: z.ZodLiteral<"text">;
        text: z.ZodString;
    }, z.core.$loose>;
    contentIndex: z.ZodOptional<z.ZodNumber>;
    messageId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$loose>;
export declare const AcpToolUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodEnum<{
        tool_call: "tool_call";
        tool_call_update: "tool_call_update";
    }>;
    toolCallId: z.ZodString;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kind: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        in_progress: "in_progress";
        pending: "pending";
    }>>>;
    rawInput: z.ZodOptional<z.ZodJSONSchema>;
    rawOutput: z.ZodOptional<z.ZodJSONSchema>;
    content: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodJSONSchema>>>;
}, z.core.$loose>;
export declare const AcpPlanUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"plan">;
    entries: z.ZodArray<z.ZodObject<{
        content: z.ZodString;
        priority: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
        }>;
        status: z.ZodEnum<{
            completed: "completed";
            in_progress: "in_progress";
            pending: "pending";
        }>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const AcpUsageUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"usage_update">;
    used: z.ZodNumber;
    size: z.ZodNumber;
    cost: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, z.core.$loose>>>;
}, z.core.$loose>;
export declare const AcpRunEnvelopeSchema: z.ZodObject<{
    sessionId: z.ZodString;
    epoch: z.ZodNumber;
    event: z.ZodJSONSchema;
}, z.core.$strict>;
export declare const AcpCompactionUpdateSchema: z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"compaction_update">;
    compactionId: z.ZodString;
    status: z.ZodEnum<{
        cancelled: "cancelled";
        completed: "completed";
        failed: "failed";
        in_progress: "in_progress";
    }>;
    summary: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    _meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
}, z.core.$loose>;
export declare const AcpCompactionChunkSchema: z.ZodObject<{
    sessionUpdate: z.ZodLiteral<"compaction_summary_chunk">;
    compactionId: z.ZodString;
    content: z.ZodRecord<z.ZodString, z.ZodJSONSchema>;
}, z.core.$loose>;
export declare const AcpSessionMetadataUpdateSchema: z.ZodUnion<readonly [
    z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"available_commands_update">;
        availableCommands: z.ZodArray<z.ZodJSONSchema>;
    }, z.core.$loose>,
    z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"current_mode_update">;
        currentModeId: z.ZodString;
    }, z.core.$loose>,
    z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"config_option_update">;
        configOptions: z.ZodArray<z.ZodJSONSchema>;
    }, z.core.$loose>,
    z.ZodObject<{
        sessionUpdate: z.ZodLiteral<"session_info_update">;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        updatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$loose>
]>;
export {};
