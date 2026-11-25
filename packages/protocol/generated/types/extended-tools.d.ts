import { z } from 'zod';
export declare const ProductAutomationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    active: z.ZodBoolean;
    scheduleType: z.ZodString;
    workspaceId: z.ZodString;
}, z.core.$strict>;
export declare const ProductDelegationSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        running: "running";
        stopped: "stopped";
    }>;
    summary: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const EXTENDED_TOOL_CONTRACTS: {
    readonly automation_list: {
        readonly input: z.ZodObject<{}, z.core.$strict>;
        readonly output: z.ZodObject<{
            automations: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                active: z.ZodBoolean;
                scheduleType: z.ZodString;
                workspaceId: z.ZodString;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly automation_create: {
        readonly input: z.ZodObject<{
            name: z.ZodString;
            prompt: z.ZodString;
            scheduledAt: z.ZodNumber;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            active: z.ZodBoolean;
            scheduleType: z.ZodString;
            workspaceId: z.ZodString;
        }, z.core.$strict>;
    };
    readonly automation_set_active: {
        readonly input: z.ZodObject<{
            id: z.ZodString;
            active: z.ZodBoolean;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            active: z.ZodBoolean;
            scheduleType: z.ZodString;
            workspaceId: z.ZodString;
        }, z.core.$strict>;
    };
    readonly delegation_start: {
        readonly input: z.ZodObject<{
            task: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            sessionId: z.ZodString;
            status: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                running: "running";
                stopped: "stopped";
            }>;
            summary: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
    };
    readonly delegation_list: {
        readonly input: z.ZodObject<{}, z.core.$strict>;
        readonly output: z.ZodObject<{
            delegations: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                sessionId: z.ZodString;
                status: z.ZodEnum<{
                    completed: "completed";
                    failed: "failed";
                    running: "running";
                    stopped: "stopped";
                }>;
                summary: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly delegation_stop: {
        readonly input: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            stopped: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly worktree_list: {
        readonly input: z.ZodObject<{}, z.core.$strict>;
        readonly output: z.ZodObject<{
            worktrees: z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                branch: z.ZodString;
                current: z.ZodBoolean;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly worktree_create: {
        readonly input: z.ZodObject<{
            name: z.ZodString;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            path: z.ZodString;
            branch: z.ZodString;
        }, z.core.$strict>;
    };
    readonly files_search: {
        readonly input: z.ZodObject<{
            query: z.ZodString;
            limit: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            files: z.ZodArray<z.ZodString>;
            truncated: z.ZodBoolean;
        }, z.core.$strict>;
    };
};
export type ExtendedToolMethod = keyof typeof EXTENDED_TOOL_CONTRACTS;
export type ExtendedToolInput<M extends ExtendedToolMethod> = z.infer<(typeof EXTENDED_TOOL_CONTRACTS)[M]['input']>;
export type ExtendedToolOutput<M extends ExtendedToolMethod> = z.infer<(typeof EXTENDED_TOOL_CONTRACTS)[M]['output']>;
