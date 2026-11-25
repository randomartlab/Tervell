import { z } from 'zod';
export declare const McpConnectionSchema: z.ZodDiscriminatedUnion<[
    z.ZodObject<{
        id: z.ZodString;
        transport: z.ZodLiteral<"stdio">;
        command: z.ZodString;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>,
    z.ZodObject<{
        id: z.ZodString;
        transport: z.ZodEnum<{
            http: "http";
            sse: "sse";
        }>;
        url: z.ZodString;
        apiKeyRef: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>
], "transport">;
export type McpConnection = z.infer<typeof McpConnectionSchema>;
