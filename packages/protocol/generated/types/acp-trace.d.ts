import { z } from 'zod';
export declare const AcpTraceSchema: z.ZodObject<{
    format: z.ZodLiteral<"proma-acp-trace">;
    version: z.ZodLiteral<1>;
    kernelId: z.ZodString;
    dialectId: z.ZodOptional<z.ZodString>;
    origin: z.ZodEnum<{
        live: "live";
        scripted: "scripted";
    }>;
    agentVersion: z.ZodString;
    source: z.ZodString;
    frames: z.ZodArray<z.ZodObject<{
        seq: z.ZodNumber;
        direction: z.ZodEnum<{
            agent: "agent";
            client: "client";
        }>;
        message: z.ZodUnion<readonly [
            z.ZodObject<{
                jsonrpc: z.ZodLiteral<"2.0">;
                id: z.ZodOptional<z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodNumber
                ]>>;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodUnion<readonly [
                    z.ZodRecord<z.ZodString, z.ZodJSONSchema>,
                    z.ZodArray<z.ZodJSONSchema>
                ]>>;
            }, z.core.$strict>,
            z.ZodObject<{
                jsonrpc: z.ZodLiteral<"2.0">;
                id: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodNumber
                ]>;
                result: z.ZodJSONSchema;
            }, z.core.$strict>,
            z.ZodObject<{
                jsonrpc: z.ZodLiteral<"2.0">;
                id: z.ZodNullable<z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodNumber
                ]>>;
                error: z.ZodObject<{
                    code: z.ZodNumber;
                    message: z.ZodString;
                    data: z.ZodOptional<z.ZodJSONSchema>;
                }, z.core.$strip>;
            }, z.core.$strict>
        ]>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type AcpTrace = z.infer<typeof AcpTraceSchema>;
export declare const AcpModelCatalogSchema: z.ZodObject<{
    models: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        configOptions: z.ZodOptional<z.ZodArray<z.ZodJSONSchema>>;
    }, z.core.$strict>>;
    currentModelId: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type AcpModelCatalog = z.infer<typeof AcpModelCatalogSchema>;
