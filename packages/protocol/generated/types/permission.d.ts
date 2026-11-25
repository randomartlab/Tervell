import { z } from 'zod';
/** 执行权限与 plan 正交；Session v2 的旧枚举仅作为兼容输入。 */
export declare const ExecutionPermissionModeSchema: z.ZodEnum<{
    "accept-edits": "accept-edits";
    ask: "ask";
    auto: "auto";
    "read-only": "read-only";
}>;
export declare const PermissionPolicySchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        "accept-edits": "accept-edits";
        ask: "ask";
        auto: "auto";
        "read-only": "read-only";
    }>>;
    plan: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const PermissionOperationSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        delete: "delete";
        edit: "edit";
        execute: "execute";
        fetch: "fetch";
        other: "other";
        read: "read";
        search: "search";
    }>;
    /** 仅接受宿主规则分类结果，不得直接信任 Agent/客户端声明；识别规则由 SEC-02 提供。 */
    readOnlyCommand: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const PermissionDecisionSchema: z.ZodEnum<{
    allow: "allow";
    ask: "ask";
    deny: "deny";
}>;
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;
export type PermissionOperation = z.infer<typeof PermissionOperationSchema>;
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>;
export type ExecutionPermissionMode = z.infer<typeof ExecutionPermissionModeSchema>;
export declare function normalizePermissionPolicy(input: unknown): PermissionPolicy;
export declare const ToolPolicyRequestSchema: z.ZodObject<{
    tool: z.ZodString;
    command: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodJSONSchema>;
}, z.core.$strict>;
export declare const ToolPolicyResultSchema: z.ZodObject<{
    decision: z.ZodEnum<{
        allow: "allow";
        ask: "ask";
        deny: "deny";
    }>;
    risk: z.ZodEnum<{
        dangerous: "dangerous";
        read: "read";
        review: "review";
    }>;
    reason: z.ZodString;
    whitelistable: z.ZodBoolean;
}, z.core.$strict>;
export declare const CommandRuleSchema: z.ZodObject<{
    executable: z.ZodString;
    args: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type ToolPolicyRequest = z.infer<typeof ToolPolicyRequestSchema>;
export type ToolPolicyResult = z.infer<typeof ToolPolicyResultSchema>;
export type CommandRule = z.infer<typeof CommandRuleSchema>;
export declare const PathBoundaryConfigSchema: z.ZodObject<{
    cwd: z.ZodString;
    attachedDirectories: z.ZodDefault<z.ZodArray<z.ZodString>>;
    worktrees: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const BoundaryAuditSchema: z.ZodObject<{
    path: z.ZodString;
    operation: z.ZodEnum<{
        read: "read";
        write: "write";
    }>;
    allowed: z.ZodBoolean;
    reason: z.ZodString;
}, z.core.$strict>;
export type PathBoundaryConfig = z.input<typeof PathBoundaryConfigSchema>;
export type BoundaryAudit = z.infer<typeof BoundaryAuditSchema>;
