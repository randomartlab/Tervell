import { z } from 'zod';
import type { ClientKind } from './session.ts';
export declare const TimelineRowSchema: z.ZodObject<{
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
}, z.core.$strict>;
/** W1 最小领域面；每个方法同时持有请求和响应，后续领域在此追加。 */
export declare const API_CONTRACTS: {
    readonly 'session.list': {
        readonly request: z.ZodObject<{
            generation: z.ZodOptional<z.ZodString>;
            afterSeq: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            generation: z.ZodString;
            headSeq: z.ZodNumber;
            mode: z.ZodEnum<{
                changes: "changes";
                snapshot: "snapshot";
            }>;
            entries: z.ZodArray<z.ZodObject<{
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
            }, z.core.$strip>>;
            removals: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                seq: z.ZodNumber;
            }, z.core.$strict>>;
            pageInfo: z.ZodObject<{
                hasMore: z.ZodBoolean;
                nextCursor: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
        }, z.core.$strict>;
    };
    readonly 'session.detail': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            session: z.ZodNullable<z.ZodObject<{
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
            }, z.core.$strip>>;
        }, z.core.$strict>;
    };
    readonly 'session.timeline': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            direction: z.ZodEnum<{
                after: "after";
                before: "before";
                tail: "tail";
            }>;
            cursor: z.ZodOptional<z.ZodObject<{
                epoch: z.ZodString;
                seq: z.ZodNumber;
            }, z.core.$strict>>;
            limit: z.ZodNumber;
            wholeTurns: z.ZodLiteral<true>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            epoch: z.ZodString;
            rows: z.ZodArray<z.ZodObject<{
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
            }, z.core.$strict>>;
            hasOlder: z.ZodBoolean;
            hasNewer: z.ZodBoolean;
            endCursor: z.ZodOptional<z.ZodObject<{
                epoch: z.ZodString;
                seq: z.ZodNumber;
            }, z.core.$strict>>;
            reset: z.ZodOptional<z.ZodBoolean>;
            gap: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>;
    };
    readonly 'session.send': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            clientMessageId: z.ZodString;
            attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                mimeType: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            clientMessageId: z.ZodString;
            accepted: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly 'session.queue': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            clientMessageId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            queuedMessageId: z.ZodString;
        }, z.core.$strict>;
    };
    readonly 'session.interrupt': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            interrupted: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly 'session.subscribe': {
        readonly request: z.ZodObject<{
            ids: z.ZodArray<z.ZodString>;
            cursors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                epoch: z.ZodString;
                seq: z.ZodNumber;
            }, z.core.$strict>>>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            subscriptionId: z.ZodString;
        }, z.core.$strict>;
    };
    readonly 'approval.list': {
        readonly request: z.ZodObject<{}, z.core.$strict>;
        readonly response: z.ZodObject<{
            approvals: z.ZodArray<z.ZodObject<{
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
                sessionId: z.ZodString;
                allowedDecisions: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                    allow: "allow";
                    "allow-session": "allow-session";
                    deny: "deny";
                }>>>;
            }, z.core.$strip>>;
        }, z.core.$strict>;
    };
    readonly 'approval.respond': {
        readonly request: z.ZodObject<{
            requestId: z.ZodString;
            decision: z.ZodEnum<{
                allow: "allow";
                "allow-session": "allow-session";
                deny: "deny";
            }>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            requestId: z.ZodString;
            resolved: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly 'revision.probe': {
        readonly request: z.ZodObject<{
            entity: z.ZodEnum<{
                automations: "automations";
                connections: "connections";
                projects: "projects";
                sessions: "sessions";
                skills: "skills";
                workspaces: "workspaces";
            }>;
            scope: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            revision: z.ZodString;
        }, z.core.$strict>;
    };
    readonly 'host.status': {
        readonly request: z.ZodObject<{}, z.core.$strict>;
        readonly response: z.ZodObject<{
            hostId: z.ZodString;
            status: z.ZodEnum<{
                degraded: "degraded";
                offline: "offline";
                online: "online";
            }>;
            version: z.ZodString;
        }, z.core.$strict>;
    };
    readonly 'session.events': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            afterSeq: z.ZodDefault<z.ZodNumber>;
            epoch: z.ZodOptional<z.ZodString>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            id: z.ZodString;
            epoch: z.ZodString;
            headSeq: z.ZodNumber;
            events: z.ZodArray<z.ZodObject<{
                seq: z.ZodNumber;
                ts: z.ZodNumber;
                turnId: z.ZodString;
                event: z.ZodJSONSchema;
                truncated: z.ZodBoolean;
                userMessage: z.ZodOptional<z.ZodObject<{
                    id: z.ZodString;
                    text: z.ZodString;
                    createdAt: z.ZodNumber;
                    truncated: z.ZodBoolean;
                }, z.core.$strict>>;
            }, z.core.$strict>>;
            hasMore: z.ZodBoolean;
            reset: z.ZodBoolean;
            executionStatus: z.ZodOptional<z.ZodEnum<{
                "capacity-exceeded": "capacity-exceeded";
                completed: "completed";
                failed: "failed";
                idle: "idle";
                interrupted: "interrupted";
                queued: "queued";
                running: "running";
            }>>;
        }, z.core.$strict>;
    };
    readonly 'lease.status': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            lease: z.ZodNullable<z.ZodObject<{
                holderId: z.ZodString;
                fence: z.ZodNumber;
                expiresAt: z.ZodNumber;
                mine: z.ZodBoolean;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'lease.acquire': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            lease: z.ZodNullable<z.ZodObject<{
                holderId: z.ZodString;
                fence: z.ZodNumber;
                expiresAt: z.ZodNumber;
                mine: z.ZodBoolean;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'lease.renew': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            fence: z.ZodNumber;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            lease: z.ZodNullable<z.ZodObject<{
                holderId: z.ZodString;
                fence: z.ZodNumber;
                expiresAt: z.ZodNumber;
                mine: z.ZodBoolean;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'lease.release': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            fence: z.ZodNumber;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            lease: z.ZodNullable<z.ZodObject<{
                holderId: z.ZodString;
                fence: z.ZodNumber;
                expiresAt: z.ZodNumber;
                mine: z.ZodBoolean;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'lease.transfer': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            expectedFence: z.ZodNumber;
            confirm: z.ZodLiteral<"transfer-writer">;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            lease: z.ZodNullable<z.ZodObject<{
                holderId: z.ZodString;
                fence: z.ZodNumber;
                expiresAt: z.ZodNumber;
                mine: z.ZodBoolean;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'module.catalog': {
        readonly request: z.ZodObject<{
            clientKind: z.ZodEnum<{
                cli: "cli";
                desktop: "desktop";
                mobile: "mobile";
                web: "web";
            }>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            modules: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                state: z.ZodEnum<{
                    "read-only": "read-only";
                    ready: "ready";
                    unavailable: "unavailable";
                }>;
                badge: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'files.tree': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            path: z.ZodDefault<z.ZodString>;
            depth: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            entries: z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                kind: z.ZodEnum<{
                    directory: "directory";
                    file: "file";
                }>;
                size: z.ZodNumber;
            }, z.core.$strict>>;
            truncated: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly 'files.diff': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            path: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            diff: z.ZodString;
            truncated: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly 'terminal.list': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            terminals: z.ZodArray<z.ZodObject<{
                termId: z.ZodString;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'terminal.create': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            termId: z.ZodString;
        }, z.core.$strict>;
    };
    readonly 'terminal.attach': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            termId: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            output: z.ZodString;
            truncated: z.ZodBoolean;
            exitStatus: z.ZodOptional<z.ZodObject<{
                exitCode: z.ZodOptional<z.ZodNumber>;
                signal: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly 'terminal.kill': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            termId: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            stopped: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly 'terminal.release': {
        readonly request: z.ZodObject<{
            id: z.ZodString;
            termId: z.ZodString;
        }, z.core.$strict>;
        readonly response: z.ZodObject<{
            released: z.ZodBoolean;
        }, z.core.$strict>;
    };
};
export type ApiMethod = keyof typeof API_CONTRACTS;
export type ApiParams<M extends ApiMethod> = z.input<(typeof API_CONTRACTS)[M]['request']>;
export type ApiResult<M extends ApiMethod> = z.output<(typeof API_CONTRACTS)[M]['response']>;
export declare const ApiMethodSchema: z.ZodEnum<{
    "approval.list": "approval.list";
    "approval.respond": "approval.respond";
    "files.diff": "files.diff";
    "files.tree": "files.tree";
    "host.status": "host.status";
    "lease.acquire": "lease.acquire";
    "lease.release": "lease.release";
    "lease.renew": "lease.renew";
    "lease.status": "lease.status";
    "lease.transfer": "lease.transfer";
    "module.catalog": "module.catalog";
    "revision.probe": "revision.probe";
    "session.detail": "session.detail";
    "session.events": "session.events";
    "session.interrupt": "session.interrupt";
    "session.list": "session.list";
    "session.queue": "session.queue";
    "session.send": "session.send";
    "session.subscribe": "session.subscribe";
    "session.timeline": "session.timeline";
    "terminal.attach": "terminal.attach";
    "terminal.create": "terminal.create";
    "terminal.kill": "terminal.kill";
    "terminal.list": "terminal.list";
    "terminal.release": "terminal.release";
}>;
export declare const CLIENT_METHODS: Readonly<Record<ClientKind, readonly ApiMethod[]>>;
export declare function assertApiMethodAllowed(clientKind: string, method: string): asserts method is ApiMethod;
export declare const ApiRequestSchema: z.ZodDiscriminatedUnion<[
    z.ZodObject<{
        method: z.ZodLiteral<"session.events">;
        params: z.ZodObject<{
            id: z.ZodString;
            afterSeq: z.ZodDefault<z.ZodNumber>;
            epoch: z.ZodOptional<z.ZodString>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"lease.status">;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"lease.acquire">;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"lease.renew">;
        params: z.ZodObject<{
            id: z.ZodString;
            fence: z.ZodNumber;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"lease.release">;
        params: z.ZodObject<{
            id: z.ZodString;
            fence: z.ZodNumber;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"lease.transfer">;
        params: z.ZodObject<{
            id: z.ZodString;
            expectedFence: z.ZodNumber;
            confirm: z.ZodLiteral<"transfer-writer">;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"module.catalog">;
        params: z.ZodObject<{
            clientKind: z.ZodEnum<{
                cli: "cli";
                desktop: "desktop";
                mobile: "mobile";
                web: "web";
            }>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"files.tree">;
        params: z.ZodObject<{
            id: z.ZodString;
            path: z.ZodDefault<z.ZodString>;
            depth: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"files.diff">;
        params: z.ZodObject<{
            id: z.ZodString;
            path: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"terminal.list">;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"terminal.create">;
        params: z.ZodObject<{
            id: z.ZodString;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"terminal.attach">;
        params: z.ZodObject<{
            id: z.ZodString;
            termId: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"terminal.kill">;
        params: z.ZodObject<{
            id: z.ZodString;
            termId: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"terminal.release">;
        params: z.ZodObject<{
            id: z.ZodString;
            termId: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.list">;
        params: z.ZodObject<{
            generation: z.ZodOptional<z.ZodString>;
            afterSeq: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.detail">;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.timeline">;
        params: z.ZodObject<{
            id: z.ZodString;
            direction: z.ZodEnum<{
                after: "after";
                before: "before";
                tail: "tail";
            }>;
            cursor: z.ZodOptional<z.ZodObject<{
                epoch: z.ZodString;
                seq: z.ZodNumber;
            }, z.core.$strict>>;
            limit: z.ZodNumber;
            wholeTurns: z.ZodLiteral<true>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.send">;
        params: z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            clientMessageId: z.ZodString;
            attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                mimeType: z.ZodString;
            }, z.core.$strict>>>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.queue">;
        params: z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            clientMessageId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.interrupt">;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"session.subscribe">;
        params: z.ZodObject<{
            ids: z.ZodArray<z.ZodString>;
            cursors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                epoch: z.ZodString;
                seq: z.ZodNumber;
            }, z.core.$strict>>>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"approval.list">;
        params: z.ZodObject<{}, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"approval.respond">;
        params: z.ZodObject<{
            requestId: z.ZodString;
            decision: z.ZodEnum<{
                allow: "allow";
                "allow-session": "allow-session";
                deny: "deny";
            }>;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"revision.probe">;
        params: z.ZodObject<{
            entity: z.ZodEnum<{
                automations: "automations";
                connections: "connections";
                projects: "projects";
                sessions: "sessions";
                skills: "skills";
                workspaces: "workspaces";
            }>;
            scope: z.ZodString;
        }, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"host.status">;
        params: z.ZodObject<{}, z.core.$strict>;
        clientKind: z.ZodEnum<{
            cli: "cli";
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>;
        requestId: z.ZodString;
    }, z.core.$strict>
], "method">;
export type ApiRequest = z.infer<typeof ApiRequestSchema>;
export declare function parseApiResponse<M extends ApiMethod>(method: M, clientKind: ClientKind, input: unknown): ApiResult<M>;
