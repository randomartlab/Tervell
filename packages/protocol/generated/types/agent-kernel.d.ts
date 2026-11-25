import { z } from 'zod';
export declare const KernelSessionHandleSchema: z.ZodObject<{
    kernelId: z.ZodString;
    sessionId: z.ZodString;
    kernelSessionRef: z.ZodString;
}, z.core.$strict>;
export declare const KernelSessionCreateSchema: z.ZodObject<{
    sessionId: z.ZodString;
    cwd: z.ZodString;
    systemPrompt: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export declare const KernelPromptInputSchema: z.ZodObject<{
    runId: z.ZodString;
    text: z.ZodString;
    history: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    }, z.core.$strip>>>;
    summary: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const KernelPermissionResponseSchema: z.ZodObject<{
    actionId: z.ZodString;
    behavior: z.ZodEnum<{
        allow: "allow";
        deny: "deny";
    }>;
}, z.core.$strict>;
export declare const KernelProbeResultSchema: z.ZodObject<{
    available: z.ZodBoolean;
    capabilities: z.ZodObject<{
        protocol: z.ZodPrefault<z.ZodObject<{
            version: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        streaming: z.ZodPrefault<z.ZodObject<{
            text: z.ZodDefault<z.ZodBoolean>;
            thinking: z.ZodDefault<z.ZodBoolean>;
            toolProgress: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        plan: z.ZodDefault<z.ZodEnum<{
            "client-tool": "client-tool";
            "native-mode": "native-mode";
            none: "none";
            "prompt-only": "prompt-only";
        }>>;
        session: z.ZodPrefault<z.ZodObject<{
            create: z.ZodDefault<z.ZodBoolean>;
            load: z.ZodDefault<z.ZodBoolean>;
            resume: z.ZodDefault<z.ZodBoolean>;
            list: z.ZodDefault<z.ZodBoolean>;
            fork: z.ZodDefault<z.ZodBoolean>;
            rewind: z.ZodDefault<z.ZodBoolean>;
            close: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        steer: z.ZodDefault<z.ZodBoolean>;
        permission: z.ZodDefault<z.ZodEnum<{
            callback: "callback";
            "mode-only": "mode-only";
            none: "none";
        }>>;
        tools: z.ZodPrefault<z.ZodObject<{
            native: z.ZodDefault<z.ZodBoolean>;
            mcp: z.ZodDefault<z.ZodBoolean>;
            perSessionMcp: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        context: z.ZodObject<{
            systemPrompt: z.ZodDefault<z.ZodEnum<{
                file: "file";
                meta: "meta";
                native: "native";
                prepend: "prepend";
            }>>;
            skills: z.ZodDefault<z.ZodEnum<{
                native: "native";
                none: "none";
                prompt: "prompt";
            }>>;
            instructionsFile: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>;
        compaction: z.ZodDefault<z.ZodEnum<{
            native: "native";
            none: "none";
            tool: "tool";
        }>>;
        models: z.ZodDefault<z.ZodEnum<{
            "kernel-owned": "kernel-owned";
            registry: "registry";
        }>>;
        fs: z.ZodDefault<z.ZodEnum<{
            "client-bridge": "client-bridge";
            "kernel-owned": "kernel-owned";
        }>>;
        terminal: z.ZodDefault<z.ZodEnum<{
            "client-bridge": "client-bridge";
            "kernel-owned": "kernel-owned";
            none: "none";
        }>>;
        usage: z.ZodPrefault<z.ZodObject<{
            tokens: z.ZodDefault<z.ZodBoolean>;
            cost: z.ZodDefault<z.ZodBoolean>;
            contextWindow: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        transport: z.ZodDefault<z.ZodEnum<{
            http: "http";
            "in-process": "in-process";
            pty: "pty";
            stdio: "stdio";
        }>>;
    }, z.core.$strip>;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type KernelSessionHandle = z.infer<typeof KernelSessionHandleSchema>;
export type KernelSessionCreate = z.infer<typeof KernelSessionCreateSchema>;
export type KernelPromptInput = z.input<typeof KernelPromptInputSchema>;
export type KernelPermissionResponse = z.infer<typeof KernelPermissionResponseSchema>;
export type KernelProbeResult = z.infer<typeof KernelProbeResultSchema>;
