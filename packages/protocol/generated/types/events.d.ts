import { z } from 'zod';
export declare const EventPositionSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
}, z.core.$strip>;
export declare const UsageSchema: z.ZodObject<{
    inputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    contextTokens: z.ZodOptional<z.ZodNumber>;
    contextWindow: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    costScope: z.ZodOptional<z.ZodEnum<{
        session: "session";
        turn: "turn";
    }>>;
    tokenScope: z.ZodOptional<z.ZodEnum<{
        session: "session";
        turn: "turn";
    }>>;
    model: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PlanStepSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        pending: "pending";
        running: "running";
        skipped: "skipped";
    }>;
    result: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PermissionActionSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    behavior: z.ZodEnum<{
        allow: "allow";
        deny: "deny";
        variant: "variant";
    }>;
    variant: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PermissionRequestSchema: z.ZodObject<{
    requestId: z.ZodString;
    kind: z.ZodEnum<{
        delete: "delete";
        edit: "edit";
        execute: "execute";
        fetch: "fetch";
        other: "other";
        read: "read";
        search: "search";
    }>;
    tool: z.ZodString;
    input: z.ZodRecord<z.ZodString, z.ZodJSONSchema>;
    summary: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        behavior: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
            variant: "variant";
        }>;
        variant: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ToolPatchSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        failed: "failed";
        pending: "pending";
        rejected: "rejected";
        running: "running";
        succeeded: "succeeded";
    }>>;
    result: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    progress: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kind: z.ZodOptional<z.ZodEnum<{
        delete: "delete";
        edit: "edit";
        execute: "execute";
        fetch: "fetch";
        other: "other";
        read: "read";
        search: "search";
    }>>;
    input: z.ZodOptional<z.ZodJSONSchema>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
    locations: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodJSONSchema>>>;
}, z.core.$strip>;
export declare const CompactionInfoSchema: z.ZodObject<{
    strategy: z.ZodEnum<{
        "drop-middle": "drop-middle";
        summarize: "summarize";
        "tool-only": "tool-only";
    }>;
    compactionId: z.ZodOptional<z.ZodString>;
    summaryContent: z.ZodOptional<z.ZodArray<z.ZodJSONSchema>>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
    status: z.ZodOptional<z.ZodEnum<{
        cancelled: "cancelled";
        completed: "completed";
        failed: "failed";
        in_progress: "in_progress";
    }>>;
    originalTokens: z.ZodOptional<z.ZodNumber>;
    compactedTokens: z.ZodOptional<z.ZodNumber>;
    summary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const KernelErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    recoverable: z.ZodBoolean;
    raw: z.ZodOptional<z.ZodJSONSchema>;
}, z.core.$strip>;
export declare const DoneReasonSchema: z.ZodEnum<{
    cancelled: "cancelled";
    error: "error";
    "max-tokens": "max-tokens";
    stop: "stop";
    "tool-use": "tool-use";
}>;
export declare const MessageDeltaEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"message.delta">;
    index: z.ZodNumber;
    text: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<{
        text: "text";
        thinking: "thinking";
    }>>;
}, z.core.$strip>;
export declare const MessageFinalEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"message.final">;
    message: z.ZodObject<{
        id: z.ZodString;
        content: z.ZodArray<z.ZodDiscriminatedUnion<[
            z.ZodObject<{
                type: z.ZodLiteral<"thinking">;
                text: z.ZodString;
            }, z.core.$strip>,
            z.ZodObject<{
                type: z.ZodLiteral<"tool-call">;
                toolCallId: z.ZodString;
                name: z.ZodString;
                input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, z.core.$strip>,
            z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>,
            z.ZodObject<{
                type: z.ZodLiteral<"image">;
                url: z.ZodURL;
                mimeType: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>,
            z.ZodObject<{
                type: z.ZodLiteral<"tool-result">;
                toolUseId: z.ZodString;
                content: z.ZodString;
                isError: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>
        ], "type">>;
        createdAt: z.ZodNumber;
        role: z.ZodLiteral<"assistant">;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ToolCallEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"tool.call">;
    call: z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            delete: "delete";
            edit: "edit";
            execute: "execute";
            fetch: "fetch";
            other: "other";
            read: "read";
            search: "search";
        }>;
        name: z.ZodString;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        status: z.ZodEnum<{
            failed: "failed";
            pending: "pending";
            rejected: "rejected";
            running: "running";
            succeeded: "succeeded";
        }>;
        result: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        executedAt: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ToolUpdateEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"tool.update">;
    callId: z.ZodString;
    patch: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            failed: "failed";
            pending: "pending";
            rejected: "rejected";
            running: "running";
            succeeded: "succeeded";
        }>>;
        result: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        progress: z.ZodOptional<z.ZodNumber>;
        name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kind: z.ZodOptional<z.ZodEnum<{
            delete: "delete";
            edit: "edit";
            execute: "execute";
            fetch: "fetch";
            other: "other";
            read: "read";
            search: "search";
        }>>;
        input: z.ZodOptional<z.ZodJSONSchema>;
        metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
        locations: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodJSONSchema>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const PlanUpdateEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"plan.update">;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            pending: "pending";
            running: "running";
            skipped: "skipped";
        }>;
        result: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const PermissionRequestEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"permission.request">;
    req: z.ZodObject<{
        requestId: z.ZodString;
        kind: z.ZodEnum<{
            delete: "delete";
            edit: "edit";
            execute: "execute";
            fetch: "fetch";
            other: "other";
            read: "read";
            search: "search";
        }>;
        tool: z.ZodString;
        input: z.ZodRecord<z.ZodString, z.ZodJSONSchema>;
        summary: z.ZodString;
        actions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            behavior: z.ZodEnum<{
                allow: "allow";
                deny: "deny";
                variant: "variant";
            }>;
            variant: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UsageEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"usage">;
    usage: z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        contextTokens: z.ZodOptional<z.ZodNumber>;
        contextWindow: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        costScope: z.ZodOptional<z.ZodEnum<{
            session: "session";
            turn: "turn";
        }>>;
        tokenScope: z.ZodOptional<z.ZodEnum<{
            session: "session";
            turn: "turn";
        }>>;
        model: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CompactionEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"compaction">;
    info: z.ZodObject<{
        strategy: z.ZodEnum<{
            "drop-middle": "drop-middle";
            summarize: "summarize";
            "tool-only": "tool-only";
        }>;
        compactionId: z.ZodOptional<z.ZodString>;
        summaryContent: z.ZodOptional<z.ZodArray<z.ZodJSONSchema>>;
        error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
        status: z.ZodOptional<z.ZodEnum<{
            cancelled: "cancelled";
            completed: "completed";
            failed: "failed";
            in_progress: "in_progress";
        }>>;
        originalTokens: z.ZodOptional<z.ZodNumber>;
        compactedTokens: z.ZodOptional<z.ZodNumber>;
        summary: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RetryEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"retry">;
    attempt: z.ZodNumber;
    reason: z.ZodString;
    maxAttempts: z.ZodOptional<z.ZodNumber>;
    retryAfterMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ErrorEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"error">;
    err: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        recoverable: z.ZodBoolean;
        raw: z.ZodOptional<z.ZodJSONSchema>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const DoneEventSchema: z.ZodObject<{
    runId: z.ZodString;
    seq: z.ZodNumber;
    t: z.ZodLiteral<"done">;
    reason: z.ZodEnum<{
        cancelled: "cancelled";
        error: "error";
        "max-tokens": "max-tokens";
        stop: "stop";
        "tool-use": "tool-use";
    }>;
}, z.core.$strip>;
/** RAE/14 §6：每个 run 内 seq 严格递增，由事件流持有者检查顺序。 */
export declare const KernelEventSchema: z.ZodDiscriminatedUnion<[
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"message.delta">;
        index: z.ZodNumber;
        text: z.ZodString;
        kind: z.ZodDefault<z.ZodEnum<{
            text: "text";
            thinking: "thinking";
        }>>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"message.final">;
        message: z.ZodObject<{
            id: z.ZodString;
            content: z.ZodArray<z.ZodDiscriminatedUnion<[
                z.ZodObject<{
                    type: z.ZodLiteral<"thinking">;
                    text: z.ZodString;
                }, z.core.$strip>,
                z.ZodObject<{
                    type: z.ZodLiteral<"tool-call">;
                    toolCallId: z.ZodString;
                    name: z.ZodString;
                    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
                }, z.core.$strip>,
                z.ZodObject<{
                    type: z.ZodLiteral<"text">;
                    text: z.ZodString;
                }, z.core.$strip>,
                z.ZodObject<{
                    type: z.ZodLiteral<"image">;
                    url: z.ZodURL;
                    mimeType: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>,
                z.ZodObject<{
                    type: z.ZodLiteral<"tool-result">;
                    toolUseId: z.ZodString;
                    content: z.ZodString;
                    isError: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>
            ], "type">>;
            createdAt: z.ZodNumber;
            role: z.ZodLiteral<"assistant">;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"tool.call">;
        call: z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodEnum<{
                delete: "delete";
                edit: "edit";
                execute: "execute";
                fetch: "fetch";
                other: "other";
                read: "read";
                search: "search";
            }>;
            name: z.ZodString;
            input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            status: z.ZodEnum<{
                failed: "failed";
                pending: "pending";
                rejected: "rejected";
                running: "running";
                succeeded: "succeeded";
            }>;
            result: z.ZodOptional<z.ZodString>;
            error: z.ZodOptional<z.ZodString>;
            executedAt: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"tool.update">;
        callId: z.ZodString;
        patch: z.ZodObject<{
            status: z.ZodOptional<z.ZodEnum<{
                failed: "failed";
                pending: "pending";
                rejected: "rejected";
                running: "running";
                succeeded: "succeeded";
            }>>;
            result: z.ZodOptional<z.ZodString>;
            error: z.ZodOptional<z.ZodString>;
            progress: z.ZodOptional<z.ZodNumber>;
            name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kind: z.ZodOptional<z.ZodEnum<{
                delete: "delete";
                edit: "edit";
                execute: "execute";
                fetch: "fetch";
                other: "other";
                read: "read";
                search: "search";
            }>>;
            input: z.ZodOptional<z.ZodJSONSchema>;
            metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
            locations: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodJSONSchema>>>;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"plan.update">;
        steps: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            status: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                pending: "pending";
                running: "running";
                skipped: "skipped";
            }>;
            result: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"permission.request">;
        req: z.ZodObject<{
            requestId: z.ZodString;
            kind: z.ZodEnum<{
                delete: "delete";
                edit: "edit";
                execute: "execute";
                fetch: "fetch";
                other: "other";
                read: "read";
                search: "search";
            }>;
            tool: z.ZodString;
            input: z.ZodRecord<z.ZodString, z.ZodJSONSchema>;
            summary: z.ZodString;
            actions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                behavior: z.ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    variant: "variant";
                }>;
                variant: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"usage">;
        usage: z.ZodObject<{
            inputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            contextTokens: z.ZodOptional<z.ZodNumber>;
            contextWindow: z.ZodOptional<z.ZodNumber>;
            cost: z.ZodOptional<z.ZodNumber>;
            costScope: z.ZodOptional<z.ZodEnum<{
                session: "session";
                turn: "turn";
            }>>;
            tokenScope: z.ZodOptional<z.ZodEnum<{
                session: "session";
                turn: "turn";
            }>>;
            model: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"compaction">;
        info: z.ZodObject<{
            strategy: z.ZodEnum<{
                "drop-middle": "drop-middle";
                summarize: "summarize";
                "tool-only": "tool-only";
            }>;
            compactionId: z.ZodOptional<z.ZodString>;
            summaryContent: z.ZodOptional<z.ZodArray<z.ZodJSONSchema>>;
            error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>>;
            status: z.ZodOptional<z.ZodEnum<{
                cancelled: "cancelled";
                completed: "completed";
                failed: "failed";
                in_progress: "in_progress";
            }>>;
            originalTokens: z.ZodOptional<z.ZodNumber>;
            compactedTokens: z.ZodOptional<z.ZodNumber>;
            summary: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"retry">;
        attempt: z.ZodNumber;
        reason: z.ZodString;
        maxAttempts: z.ZodOptional<z.ZodNumber>;
        retryAfterMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"error">;
        err: z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            recoverable: z.ZodBoolean;
            raw: z.ZodOptional<z.ZodJSONSchema>;
        }, z.core.$strip>;
    }, z.core.$strip>,
    z.ZodObject<{
        runId: z.ZodString;
        seq: z.ZodNumber;
        t: z.ZodLiteral<"done">;
        reason: z.ZodEnum<{
            cancelled: "cancelled";
            error: "error";
            "max-tokens": "max-tokens";
            stop: "stop";
            "tool-use": "tool-use";
        }>;
    }, z.core.$strip>
], "t">;
export type KernelEvent = z.infer<typeof KernelEventSchema>;
export type MessageDeltaEvent = z.infer<typeof MessageDeltaEventSchema>;
export type MessageFinalEvent = z.infer<typeof MessageFinalEventSchema>;
export type ToolCallEvent = z.infer<typeof ToolCallEventSchema>;
export type ToolUpdateEvent = z.infer<typeof ToolUpdateEventSchema>;
export type PlanUpdateEvent = z.infer<typeof PlanUpdateEventSchema>;
export type PermissionRequestEvent = z.infer<typeof PermissionRequestEventSchema>;
export type UsageEvent = z.infer<typeof UsageEventSchema>;
export type CompactionEvent = z.infer<typeof CompactionEventSchema>;
export type RetryEvent = z.infer<typeof RetryEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type DoneEvent = z.infer<typeof DoneEventSchema>;
export type PermissionRequest = z.infer<typeof PermissionRequestSchema>;
export type Usage = z.infer<typeof UsageSchema>;
export type ToolPatch = z.infer<typeof ToolPatchSchema>;
export type PlanStep = z.infer<typeof PlanStepSchema>;
export type KernelError = z.infer<typeof KernelErrorSchema>;
export type CompactionInfo = z.infer<typeof CompactionInfoSchema>;
export type DoneReason = z.infer<typeof DoneReasonSchema>;
export declare function assertNever(value: never): never;
export declare function eventTypeOf(event: KernelEvent): KernelEvent['t'];
/** 未知/损坏的 JSON 事件必须可观测，并保留上游原文。 */
export declare function normalizeKernelEvent(input: unknown, position: z.infer<typeof EventPositionSchema>): KernelEvent;
