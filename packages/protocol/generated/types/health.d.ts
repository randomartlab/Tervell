import { z } from 'zod';
export declare const KernelHealthSchema: z.ZodObject<{
    kernelId: z.ZodString;
    status: z.ZodEnum<{
        degraded: "degraded";
        unverified: "unverified";
        verified: "verified";
    }>;
    reason: z.ZodEnum<{
        "invalid-trace": "invalid-trace";
        matched: "matched";
        "missing-baseline": "missing-baseline";
        "scenario-failed": "scenario-failed";
        "trace-drift": "trace-drift";
        "version-drift": "version-drift";
    }>;
    expectedVersion: z.ZodOptional<z.ZodString>;
    observedVersion: z.ZodOptional<z.ZodString>;
    evidence: z.ZodOptional<z.ZodEnum<{
        live: "live";
        scripted: "scripted";
    }>>;
    fingerprint: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type KernelHealth = z.infer<typeof KernelHealthSchema>;
