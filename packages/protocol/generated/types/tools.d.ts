import { z } from 'zod';
export declare const ToolContextSchema: z.ZodObject<{
    sessionId: z.ZodString;
    workspaceId: z.ZodString;
    permission: z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<{
            "accept-edits": "accept-edits";
            ask: "ask";
            auto: "auto";
            "read-only": "read-only";
        }>>;
        plan: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>;
    triggeredBy: z.ZodEnum<{
        automation: "automation";
        delegation: "delegation";
        external: "external";
        user: "user";
    }>;
}, z.core.$strict>;
export type ToolContext = z.infer<typeof ToolContextSchema>;
export declare const ToolMetadataSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    kind: z.ZodEnum<{
        delete: "delete";
        edit: "edit";
        execute: "execute";
        fetch: "fetch";
        other: "other";
        read: "read";
        search: "search";
    }>;
    effect: z.ZodEnum<{
        delete: "delete";
        external: "external";
        read: "read";
        write: "write";
    }>;
}, z.core.$strict>;
export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;
export declare const AcpStdioMcpServerSchema: z.ZodObject<{
    name: z.ZodLiteral<"proma">;
    command: z.ZodString;
    args: z.ZodArray<z.ZodString>;
    env: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type AcpStdioMcpServer = z.infer<typeof AcpStdioMcpServerSchema>;
export declare const ProductTodoSchema: z.ZodObject<{
    id: z.ZodString;
    workspaceId: z.ZodString;
    title: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        completed: "completed";
        open: "open";
    }>;
    dueAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    updatedAt: z.ZodNumber;
}, z.core.$strict>;
export declare const ProductCalendarEventSchema: z.ZodObject<{
    id: z.ZodString;
    workspaceId: z.ZodString;
    title: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    startAt: z.ZodNumber;
    endAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    updatedAt: z.ZodNumber;
}, z.core.$strict>;
export type ProductTodo = z.infer<typeof ProductTodoSchema>;
export type ProductCalendarEvent = z.infer<typeof ProductCalendarEventSchema>;
export declare const PRODUCT_TOOL_CONTRACTS: {
    readonly todo_list: {
        readonly input: z.ZodObject<{}, z.core.$strict>;
        readonly output: z.ZodObject<{
            todos: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                workspaceId: z.ZodString;
                title: z.ZodString;
                notes: z.ZodOptional<z.ZodString>;
                status: z.ZodEnum<{
                    completed: "completed";
                    open: "open";
                }>;
                dueAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                updatedAt: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly todo_create: {
        readonly input: z.ZodObject<{
            title: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            dueAt: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            workspaceId: z.ZodString;
            title: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<{
                completed: "completed";
                open: "open";
            }>;
            dueAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            updatedAt: z.ZodNumber;
        }, z.core.$strict>;
    };
    readonly todo_update: {
        readonly input: z.ZodObject<{
            id: z.ZodString;
            expectedUpdatedAt: z.ZodNumber;
            title: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                completed: "completed";
                open: "open";
            }>>;
            dueAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            workspaceId: z.ZodString;
            title: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<{
                completed: "completed";
                open: "open";
            }>;
            dueAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            updatedAt: z.ZodNumber;
        }, z.core.$strict>;
    };
    readonly todo_delete: {
        readonly input: z.ZodObject<{
            id: z.ZodString;
            expectedUpdatedAt: z.ZodNumber;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            deleted: z.ZodBoolean;
        }, z.core.$strict>;
    };
    readonly calendar_list: {
        readonly input: z.ZodObject<{}, z.core.$strict>;
        readonly output: z.ZodObject<{
            events: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                workspaceId: z.ZodString;
                title: z.ZodString;
                notes: z.ZodOptional<z.ZodString>;
                startAt: z.ZodNumber;
                endAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                updatedAt: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    };
    readonly calendar_create: {
        readonly input: z.ZodObject<{
            title: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            startAt: z.ZodNumber;
            endAt: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            workspaceId: z.ZodString;
            title: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            startAt: z.ZodNumber;
            endAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            updatedAt: z.ZodNumber;
        }, z.core.$strict>;
    };
    readonly calendar_update: {
        readonly input: z.ZodObject<{
            id: z.ZodString;
            expectedUpdatedAt: z.ZodNumber;
            title: z.ZodOptional<z.ZodString>;
            startAt: z.ZodOptional<z.ZodNumber>;
            endAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            id: z.ZodString;
            workspaceId: z.ZodString;
            title: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            startAt: z.ZodNumber;
            endAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            updatedAt: z.ZodNumber;
        }, z.core.$strict>;
    };
    readonly calendar_delete: {
        readonly input: z.ZodObject<{
            id: z.ZodString;
            expectedUpdatedAt: z.ZodNumber;
        }, z.core.$strict>;
        readonly output: z.ZodObject<{
            deleted: z.ZodBoolean;
        }, z.core.$strict>;
    };
};
export type ProductToolMethod = keyof typeof PRODUCT_TOOL_CONTRACTS;
export type ProductToolInput<M extends ProductToolMethod> = z.infer<(typeof PRODUCT_TOOL_CONTRACTS)[M]['input']>;
export type ProductToolOutput<M extends ProductToolMethod> = z.infer<(typeof PRODUCT_TOOL_CONTRACTS)[M]['output']>;
