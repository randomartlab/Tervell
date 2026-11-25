import { z } from 'zod';
/**
 * 内核协议层（跨包共享的内核标识与启动描述）
 *
 * 内核 id 是开放字符串而不是枚举：内核由注册表与用户自定义清单提供（I-06），
 * protocol 不得硬编码任何内核名。
 */
/** 内核 id：小写字母/数字/连字符/点/下划线，1–128 位 */
export declare const KernelIdSchema: z.ZodString;
export type KernelId = z.infer<typeof KernelIdSchema>;
/** 内核传输方式（对应 14 §6 KernelProjection.transport） */
export declare const KernelTransportSchema: z.ZodEnum<{
    acp: "acp";
    "native-sdk": "native-sdk";
    pty: "pty";
}>;
export type KernelTransport = z.infer<typeof KernelTransportSchema>;
/** 一次子进程启动所需的完整描述（已解析为绝对命令） */
export declare const KernelLaunchSpecSchema: z.ZodObject<{
    kernelId: z.ZodString;
    transport: z.ZodEnum<{
        acp: "acp";
        "native-sdk": "native-sdk";
        pty: "pty";
    }>;
    command: z.ZodString;
    args: z.ZodArray<z.ZodString>;
    env: z.ZodRecord<z.ZodString, z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type KernelLaunchSpec = z.infer<typeof KernelLaunchSpecSchema>;
/** 本机探测结果 */
export declare const KernelDetectionSchema: z.ZodObject<{
    kernelId: z.ZodString;
    cliPath: z.ZodNullable<z.ZodString>;
    acpPath: z.ZodNullable<z.ZodString>;
    transports: z.ZodArray<z.ZodEnum<{
        acp: "acp";
        "native-sdk": "native-sdk";
        pty: "pty";
    }>>;
    installHint: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type KernelDetection = z.infer<typeof KernelDetectionSchema>;
/** 内核分级：T1 原生 ACP / T2 ACP 适配器 / T3 仅 PTY */
export declare const KernelTierSchema: z.ZodEnum<{
    "acp-adapter": "acp-adapter";
    "acp-native": "acp-native";
    pty: "pty";
}>;
export type KernelTier = z.infer<typeof KernelTierSchema>;
/** 内核自身支持的功能声明（RAE/09 §3） */
export declare const KernelCapabilitiesSchema: z.ZodObject<{
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
export type KernelCapabilities = z.infer<typeof KernelCapabilitiesSchema>;
export type KernelCapabilitiesInput = z.input<typeof KernelCapabilitiesSchema>;
/** 插件对指定内核的可见性和访问投影（RAE/03 §K-07） */
export declare const KernelProjectionSchema: z.ZodObject<{
    transport: z.ZodEnum<{
        acp: "acp";
        "native-sdk": "native-sdk";
        pty: "pty";
    }>;
    mcp: z.ZodEnum<{
        native: "native";
        none: "none";
    }>;
    fsCallback: z.ZodBoolean;
    terminalCallback: z.ZodBoolean;
    permissionGate: z.ZodEnum<{
        full: "full";
        "mcp-only": "mcp-only";
        none: "none";
    }>;
    usageDetail: z.ZodEnum<{
        none: "none";
        token: "token";
        "token+cost": "token+cost";
    }>;
    systemPromptInjection: z.ZodEnum<{
        native: "native";
        none: "none";
        "prepend-text": "prepend-text";
    }>;
}, z.core.$strip>;
export type KernelProjection = z.infer<typeof KernelProjectionSchema>;
/**
 * 内核定义：内置清单与用户自定义清单共用同一结构（I-06）
 * 用户可在清单里新增任何 CLI，无需改代码。
 */
export declare const KernelDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    tier: z.ZodEnum<{
        "acp-adapter": "acp-adapter";
        "acp-native": "acp-native";
        pty: "pty";
    }>;
    cli: z.ZodString;
    acp: z.ZodOptional<z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
        env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    pty: z.ZodOptional<z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
        env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    installHint: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodBoolean>;
    capabilities: z.ZodOptional<z.ZodObject<{
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
    }, z.core.$strip>>;
}, z.core.$strip>;
export type KernelDefinition = z.infer<typeof KernelDefinitionSchema>;
export type KernelDefinitionInput = z.input<typeof KernelDefinitionSchema>;
