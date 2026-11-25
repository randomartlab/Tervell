import { z } from 'zod';
/**
 * 会话契约层（对标 RAE/03 §9.2–9.3）
 *
 * 定义会话、轮次、消息、工具调用、批准的数据模型。
 * 这些类型是跨包共享的唯一真源（I-05），不得在业务包中复制定义。
 *
 * schemaVersion = 2（与 03 §9.2 一致；迁移由 ST-01 负责）
 * 轮次与事件不内嵌在 Session 里，事件日志是独立真源（03 §9.3）。
 */
export declare const SCHEMA_VERSION = 2;
export declare const EntityIdSchema: z.ZodString;
export type EntityId = z.infer<typeof EntityIdSchema>;
export declare const TimestampSchema: z.ZodNumber;
export type Timestamp = z.infer<typeof TimestampSchema>;
/** 客户端类型（API-03 方法白名单按此裁剪） */
export declare const ClientKindSchema: z.ZodEnum<{
    cli: "cli";
    desktop: "desktop";
    mobile: "mobile";
    web: "web";
}>;
export type ClientKind = z.infer<typeof ClientKindSchema>;
/** 权限四档 + plan（SEC-01；与 03 §9.2 permissionMode 一致） */
export declare const PermissionModeSchema: z.ZodEnum<{
    "accept-edits": "accept-edits";
    ask: "ask";
    auto: "auto";
    plan: "plan";
    "read-only": "read-only";
}>;
export type PermissionMode = z.infer<typeof PermissionModeSchema>;
export declare const ContentPartSchema: z.ZodDiscriminatedUnion<[
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
], "type">;
export type ContentPart = z.infer<typeof ContentPartSchema>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodEnum<{
        assistant: "assistant";
        user: "user";
    }>;
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
}, z.core.$strip>;
export type Message = z.infer<typeof MessageSchema>;
/** 工具类别：权限判定与审查的维度 */
export declare const ToolKindSchema: z.ZodEnum<{
    delete: "delete";
    edit: "edit";
    execute: "execute";
    fetch: "fetch";
    other: "other";
    read: "read";
    search: "search";
}>;
export type ToolKind = z.infer<typeof ToolKindSchema>;
export declare const ToolCallStatusSchema: z.ZodEnum<{
    failed: "failed";
    pending: "pending";
    rejected: "rejected";
    running: "running";
    succeeded: "succeeded";
}>;
export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;
export declare const ToolCallSchema: z.ZodObject<{
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
export type ToolCall = z.infer<typeof ToolCallSchema>;
export declare const ApprovalOutcomeSchema: z.ZodEnum<{
    approved: "approved";
    "auto-approved": "auto-approved";
    rejected: "rejected";
}>;
export type ApprovalOutcome = z.infer<typeof ApprovalOutcomeSchema>;
export declare const ApprovalSchema: z.ZodObject<{
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
    toolCallId: z.ZodString;
    request: z.ZodString;
    scope: z.ZodOptional<z.ZodEnum<{
        once: "once";
        session: "session";
    }>>;
    outcome: z.ZodOptional<z.ZodEnum<{
        approved: "approved";
        "auto-approved": "auto-approved";
        rejected: "rejected";
    }>>;
    reason: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
    respondedAt: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type Approval = z.infer<typeof ApprovalSchema>;
export declare const TurnSchema: z.ZodObject<{
    id: z.ZodString;
    seq: z.ZodNumber;
    userMessageIndex: z.ZodNumber;
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<{
            assistant: "assistant";
            user: "user";
        }>;
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
    }, z.core.$strip>>;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
    }, z.core.$strip>>>;
    approvals: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
        toolCallId: z.ZodString;
        request: z.ZodString;
        scope: z.ZodOptional<z.ZodEnum<{
            once: "once";
            session: "session";
        }>>;
        outcome: z.ZodOptional<z.ZodEnum<{
            approved: "approved";
            "auto-approved": "auto-approved";
            rejected: "rejected";
        }>>;
        reason: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodNumber;
        respondedAt: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    createdAt: z.ZodNumber;
    completedAt: z.ZodOptional<z.ZodNumber>;
    stopReason: z.ZodOptional<z.ZodEnum<{
        error: "error";
        "max-tokens": "max-tokens";
        stop: "stop";
        "tool-use": "tool-use";
    }>>;
    usage: z.ZodOptional<z.ZodObject<{
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Turn = z.infer<typeof TurnSchema>;
export declare const SessionSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<2>;
    id: z.ZodString;
    title: z.ZodString;
    workspaceId: z.ZodOptional<z.ZodString>;
    kernelId: z.ZodString;
    kernelSessionRef: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        modelId: z.ZodString;
        reasoning: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    permissionMode: z.ZodDefault<z.ZodEnum<{
        "accept-edits": "accept-edits";
        ask: "ask";
        auto: "auto";
        plan: "plan";
        "read-only": "read-only";
    }>>;
    cwdMode: z.ZodDefault<z.ZodEnum<{
        project: "project";
        session: "session";
    }>>;
    worktree: z.ZodOptional<z.ZodObject<{
        path: z.ZodString;
        base: z.ZodString;
        branch: z.ZodString;
    }, z.core.$strip>>;
    attachedDirectories: z.ZodDefault<z.ZodArray<z.ZodString>>;
    attachedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    relations: z.ZodOptional<z.ZodObject<{
        parentSessionId: z.ZodOptional<z.ZodString>;
        explorationOf: z.ZodOptional<z.ZodObject<{
            sessionId: z.ZodString;
            messageId: z.ZodString;
        }, z.core.$strip>>;
        delegationOf: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    flags: z.ZodDefault<z.ZodObject<{
        pinned: z.ZodOptional<z.ZodBoolean>;
        starred: z.ZodOptional<z.ZodBoolean>;
        archived: z.ZodOptional<z.ZodBoolean>;
        draft: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionInput = z.input<typeof SessionSchema>;
