import { z } from 'zod';
export declare const ServiceEventSchema: z.ZodObject<{
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
}, z.core.$strict>;
export declare const PublicLeaseSchema: z.ZodObject<{
    holderId: z.ZodString;
    fence: z.ZodNumber;
    expiresAt: z.ZodNumber;
    mine: z.ZodBoolean;
}, z.core.$strict>;
export declare const SERVICE_API_CONTRACTS: {
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
export type ServiceApiMethod = keyof typeof SERVICE_API_CONTRACTS;
