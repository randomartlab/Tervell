import { z } from 'zod';
export declare const ToolApprovalDecisionSchema: z.ZodEnum<{
    "allow-once": "allow-once";
    "allow-session": "allow-session";
    deny: "deny";
}>;
export type ToolApprovalDecision = z.infer<typeof ToolApprovalDecisionSchema>;
export declare const ToolAuditSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    workspaceId: z.ZodString;
    tool: z.ZodString;
    inputHash: z.ZodString;
    phase: z.ZodEnum<{
        decision: "decision";
        result: "result";
    }>;
    outcome: z.ZodEnum<{
        allow: "allow";
        cancelled: "cancelled";
        deny: "deny";
        failed: "failed";
        succeeded: "succeeded";
    }>;
    risk: z.ZodEnum<{
        dangerous: "dangerous";
        read: "read";
        review: "review";
    }>;
    at: z.ZodNumber;
}, z.core.$strict>;
export type ToolAudit = z.infer<typeof ToolAuditSchema>;
export declare const AcpReadFileSchema: z.ZodObject<{
    path: z.ZodString;
    line: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sessionId: z.ZodString;
}, z.core.$strip>;
export declare const AcpWriteFileSchema: z.ZodObject<{
    path: z.ZodString;
    content: z.ZodString;
    sessionId: z.ZodString;
}, z.core.$strip>;
export declare const AcpCreateTerminalSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    cwd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    env: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>>;
    outputByteLimit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sessionId: z.ZodString;
}, z.core.$strip>;
export declare const AcpTerminalIdSchema: z.ZodObject<{
    terminalId: z.ZodString;
    sessionId: z.ZodString;
}, z.core.$strip>;
