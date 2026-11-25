import { z } from 'zod';
/**
 * 内核凭据与网络配置（不做封闭认证）
 *
 * 三种凭据来源：
 * - cli-native：Proma 不注入任何凭据或端点，CLI 使用自己的登录与配置文件。
 *   cc-switch 这类改写 CLI 配置的工具在此模式下直接生效；用户 shell 里已有的
 *   ANTHROPIC_BASE_URL 等变量也原样透传。默认值。
 * - gateway：把 CLI 指向本地/自建网关（如 magpie 的 127.0.0.1:3425），
 *   按协议族注入 *_BASE_URL；网关 key 可选，从 SecretStore 引用读取。
 * - proma：由 Proma 从 SecretStore 注入 API key。
 *
 * 配置里只保存密钥的引用名（secretRef），从不保存密钥本身（I-08）。
 */
/** 上游线协议族：决定注入哪组环境变量 */
export declare const WireProtocolSchema: z.ZodEnum<{
    anthropic: "anthropic";
    gemini: "gemini";
    openai: "openai";
}>;
export type WireProtocol = z.infer<typeof WireProtocolSchema>;
export declare const CredentialSourceSchema: z.ZodEnum<{
    "cli-native": "cli-native";
    gateway: "gateway";
    proma: "proma";
}>;
export type CredentialSource = z.infer<typeof CredentialSourceSchema>;
/** SecretStore 中的键名，不是密钥值 */
export declare const SecretRefSchema: z.ZodString;
export declare const GatewayConfigSchema: z.ZodObject<{
    baseUrls: z.ZodObject<{
        anthropic: z.ZodOptional<z.ZodURL>;
        openai: z.ZodOptional<z.ZodURL>;
        gemini: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>;
    apiKeySecretRef: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
/** 网络代理（HTTP/HTTPS/SOCKS5 URL 均可），与凭据来源正交 */
export declare const NetworkProxySchema: z.ZodObject<{
    http: z.ZodOptional<z.ZodURL>;
    https: z.ZodOptional<z.ZodURL>;
    noProxy: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type NetworkProxy = z.infer<typeof NetworkProxySchema>;
export declare const KernelAuthConfigSchema: z.ZodObject<{
    kernelId: z.ZodString;
    source: z.ZodDefault<z.ZodEnum<{
        "cli-native": "cli-native";
        gateway: "gateway";
        proma: "proma";
    }>>;
    gateway: z.ZodOptional<z.ZodObject<{
        baseUrls: z.ZodObject<{
            anthropic: z.ZodOptional<z.ZodURL>;
            openai: z.ZodOptional<z.ZodURL>;
            gemini: z.ZodOptional<z.ZodURL>;
        }, z.core.$strip>;
        apiKeySecretRef: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    secretRef: z.ZodOptional<z.ZodString>;
    wire: z.ZodOptional<z.ZodEnum<{
        anthropic: "anthropic";
        gemini: "gemini";
        openai: "openai";
    }>>;
    networkProxy: z.ZodOptional<z.ZodObject<{
        http: z.ZodOptional<z.ZodURL>;
        https: z.ZodOptional<z.ZodURL>;
        noProxy: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    extraEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export type KernelAuthConfig = z.infer<typeof KernelAuthConfigSchema>;
export type KernelAuthConfigInput = z.input<typeof KernelAuthConfigSchema>;
/** 凭据审计事件：只记录键名与结果，绝不含密钥值 */
export declare const AuthEventSchema: z.ZodObject<{
    type: z.ZodEnum<{
        "credential.missing": "credential.missing";
        "env.built": "env.built";
    }>;
    kernelId: z.ZodString;
    source: z.ZodEnum<{
        "cli-native": "cli-native";
        gateway: "gateway";
        proma: "proma";
    }>;
    at: z.ZodNumber;
    ok: z.ZodBoolean;
    injectedKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AuthEvent = z.infer<typeof AuthEventSchema>;
