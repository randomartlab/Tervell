import { z } from 'zod';
export declare const CapabilitySchema: z.ZodEnum<{
    clipboard: "clipboard";
    kernels: "kernels";
    network: "network";
    notifications: "notifications";
    panels: "panels";
    screens: "screens";
    secrets: "secrets";
    "sessions:read": "sessions:read";
    "sessions:write": "sessions:write";
    tools: "tools";
    "workspace:read": "workspace:read";
    "workspace:write": "workspace:write";
}>;
export type Capability = z.infer<typeof CapabilitySchema>;
/** package.json.proma；包管理器自己的顶层字段由包管理器处理。 */
export declare const PluginManifestSchema: z.ZodObject<{
    api: z.ZodLiteral<1>;
    engines: z.ZodObject<{
        proma: z.ZodString;
    }, z.core.$strict>;
    display: z.ZodObject<{
        title: z.ZodUnion<readonly [
            z.ZodString,
            z.ZodRecord<z.ZodString, z.ZodString>
        ]>;
        description: z.ZodOptional<z.ZodUnion<readonly [
            z.ZodString,
            z.ZodRecord<z.ZodString, z.ZodString>
        ]>>;
        icon: z.ZodOptional<z.ZodString>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString>>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
    capabilities: z.ZodArray<z.ZodEnum<{
        clipboard: "clipboard";
        kernels: "kernels";
        network: "network";
        notifications: "notifications";
        panels: "panels";
        screens: "screens";
        secrets: "secrets";
        "sessions:read": "sessions:read";
        "sessions:write": "sessions:write";
        tools: "tools";
        "workspace:read": "workspace:read";
        "workspace:write": "workspace:write";
    }>>;
    data: z.ZodOptional<z.ZodObject<{
        themes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        icons: z.ZodOptional<z.ZodArray<z.ZodString>>;
        fonts: z.ZodOptional<z.ZodArray<z.ZodString>>;
        grammars: z.ZodOptional<z.ZodArray<z.ZodString>>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString>>;
        templates: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    ui: z.ZodOptional<z.ZodObject<{
        entry: z.ZodString;
        platform: z.ZodArray<z.ZodEnum<{
            desktop: "desktop";
            mobile: "mobile";
            web: "web";
        }>>;
        contributes: z.ZodOptional<z.ZodObject<{
            screens: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                icon: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>;
            workspacePanels: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                icon: z.ZodOptional<z.ZodString>;
                location: z.ZodEnum<{
                    bottom: "bottom";
                    left: "left";
                    right: "right";
                }>;
            }, z.core.$strict>>>;
            sidebarItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                icon: z.ZodOptional<z.ZodString>;
                section: z.ZodString;
            }, z.core.$strict>>>;
            commands: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                icon: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>;
            composerItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                icon: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>;
            statusBar: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                align: z.ZodEnum<{
                    left: "left";
                    right: "right";
                }>;
            }, z.core.$strict>>>;
            settings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                icon: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    host: z.ZodOptional<z.ZodObject<{
        entry: z.ZodString;
        contributes: z.ZodOptional<z.ZodObject<{
            kernels: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodUnion<readonly [
                    z.ZodString,
                    z.ZodRecord<z.ZodString, z.ZodString>
                ]>;
                protocol: z.ZodEnum<{
                    acp: "acp";
                    "native-sdk": "native-sdk";
                    pty: "pty";
                }>;
            }, z.core.$strict>>>;
            tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
            }, z.core.$strict>>>;
            hooks: z.ZodOptional<z.ZodArray<z.ZodString>>;
            rpc: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    compat: z.ZodOptional<z.ZodObject<{
        paseo: z.ZodOptional<z.ZodObject<{
            entry: z.ZodString;
            mode: z.ZodLiteral<"shim">;
        }, z.core.$strict>>;
        dsh: z.ZodOptional<z.ZodObject<{
            bundle: z.ZodString;
            mode: z.ZodLiteral<"adapter">;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
