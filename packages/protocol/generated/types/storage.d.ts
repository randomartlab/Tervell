import { z } from 'zod';
export declare const LeaseProofSchema: z.ZodObject<{
    sessionId: z.ZodString;
    holderId: z.ZodString;
    fence: z.ZodNumber;
    claimKeyId: z.ZodString;
}, z.core.$strict>;
export declare const SessionLeaseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    holderId: z.ZodString;
    fence: z.ZodNumber;
    claimKeyId: z.ZodString;
    expiresAt: z.ZodNumber;
}, z.core.$strict>;
export type LeaseProof = z.infer<typeof LeaseProofSchema>;
export type SessionLease = z.infer<typeof SessionLeaseSchema>;
export declare const StoredEventSchema: z.ZodObject<{
    sessionId: z.ZodString;
    seq: z.ZodNumber;
    ts: z.ZodNumber;
    turnId: z.ZodString;
    kernelEvent: z.ZodDiscriminatedUnion<[
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
}, z.core.$strict>;
export type StoredEvent = z.infer<typeof StoredEventSchema>;
export declare const AppendEventInputSchema: z.ZodObject<{
    ts: z.ZodNumber;
    turnId: z.ZodString;
    kernelEvent: z.ZodDiscriminatedUnion<[
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
}, z.core.$strict>;
export declare const AppendResultSchema: z.ZodObject<{
    fromSeq: z.ZodNumber;
    toSeq: z.ZodNumber;
    count: z.ZodNumber;
}, z.core.$strict>;
export declare const JournalVolumeSchema: z.ZodObject<{
    sessionId: z.ZodString;
    number: z.ZodNumber;
    firstSeq: z.ZodNumber;
    lastSeq: z.ZodNumber;
    archived: z.ZodBoolean;
}, z.core.$strict>;
export type AppendEventInput = z.input<typeof AppendEventInputSchema>;
export type AppendResult = z.infer<typeof AppendResultSchema>;
export type JournalVolume = z.infer<typeof JournalVolumeSchema>;
export declare const ProjectedTimelineRowSchema: z.ZodObject<{
    id: z.ZodString;
    turnId: z.ZodString;
    seqStart: z.ZodNumber;
    seqEnd: z.ZodNumber;
    kind: z.ZodEnum<{
        approval: "approval";
        error: "error";
        plan: "plan";
        status: "status";
        text: "text";
        thinking: "thinking";
        tool: "tool";
    }>;
    summary: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        assistant: "assistant";
        system: "system";
        user: "user";
    }>>;
    sourceSeqRanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, z.core.$strict>>>;
    sessionId: z.ZodString;
    runId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<{
        failed: "failed";
        pending: "pending";
        rejected: "rejected";
        running: "running";
        succeeded: "succeeded";
    }>>;
    progress: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type ProjectedTimelineRow = z.infer<typeof ProjectedTimelineRowSchema>;
export declare const ProjectionCheckpointSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    sessionId: z.ZodString;
    head: z.ZodNumber;
    seen: z.ZodArray<z.ZodTuple<[
        z.ZodNumber,
        z.ZodString
    ], null>>;
    runHeads: z.ZodArray<z.ZodTuple<[
        z.ZodString,
        z.ZodNumber
    ], null>>;
    items: z.ZodArray<z.ZodTuple<[
        z.ZodString,
        z.ZodObject<{
            id: z.ZodString;
            turnId: z.ZodString;
            seqStart: z.ZodNumber;
            seqEnd: z.ZodNumber;
            kind: z.ZodEnum<{
                approval: "approval";
                error: "error";
                plan: "plan";
                status: "status";
                text: "text";
                thinking: "thinking";
                tool: "tool";
            }>;
            summary: z.ZodString;
            role: z.ZodOptional<z.ZodEnum<{
                assistant: "assistant";
                system: "system";
                user: "user";
            }>>;
            sourceSeqRanges: z.ZodOptional<z.ZodArray<z.ZodObject<{
                start: z.ZodNumber;
                end: z.ZodNumber;
            }, z.core.$strict>>>;
            sessionId: z.ZodString;
            runId: z.ZodString;
            status: z.ZodOptional<z.ZodEnum<{
                failed: "failed";
                pending: "pending";
                rejected: "rejected";
                running: "running";
                succeeded: "succeeded";
            }>>;
            progress: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>
    ], null>>;
}, z.core.$strict>;
export type ProjectionCheckpoint = z.infer<typeof ProjectionCheckpointSchema>;
export declare const JournalArchiveHeaderSchema: z.ZodObject<{
    format: z.ZodLiteral<"proma-journal">;
    version: z.ZodLiteral<1>;
    session: z.ZodObject<{
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
}, z.core.$strict>;
export type JournalArchiveHeader = z.infer<typeof JournalArchiveHeaderSchema>;
export declare const JournalRetentionPolicySchema: z.ZodObject<{
    maxEventBytes: z.ZodDefault<z.ZodNumber>;
    maxSessionBytes: z.ZodDefault<z.ZodNumber>;
    maxTotalBytes: z.ZodDefault<z.ZodNumber>;
    maxSessionEvents: z.ZodDefault<z.ZodNumber>;
    archivedAfterMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type JournalRetentionPolicy = z.input<typeof JournalRetentionPolicySchema>;
