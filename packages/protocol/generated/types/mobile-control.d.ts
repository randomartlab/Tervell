import { z } from 'zod';
export declare const MobileControlFieldSchema: z.ZodObject<{
    key: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<{
        boolean: "boolean";
        json: "json";
        multiline: "multiline";
        number: "number";
        secret: "secret";
        select: "select";
        text: "text";
    }>;
    required: z.ZodOptional<z.ZodBoolean>;
    value: z.ZodOptional<z.ZodJSONSchema>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, z.core.$strict>>>;
    hint: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const MobileControlActionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    group: z.ZodString;
    scope: z.ZodEnum<{
        management: "management";
        project: "project";
        session: "session";
    }>;
    effect: z.ZodEnum<{
        read: "read";
        write: "write";
    }>;
    description: z.ZodString;
    fields: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<{
            boolean: "boolean";
            json: "json";
            multiline: "multiline";
            number: "number";
            secret: "secret";
            select: "select";
            text: "text";
        }>;
        required: z.ZodOptional<z.ZodBoolean>;
        value: z.ZodOptional<z.ZodJSONSchema>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, z.core.$strict>>>;
        hint: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    confirm: z.ZodOptional<z.ZodBoolean>;
    requiresManagement: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const MobileControlCallSchema: z.ZodObject<{
    operation: z.ZodString;
    workspaceId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    values: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
}, z.core.$strict>;
export type MobileControlField = z.infer<typeof MobileControlFieldSchema>;
export type MobileControlAction = z.infer<typeof MobileControlActionSchema>;
export type MobileControlCall = z.infer<typeof MobileControlCallSchema>;
