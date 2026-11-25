import { z } from 'zod';
export declare const RelayUrlSchema: z.ZodString;
export declare const RemoteTunnelDescriptorSchema: z.ZodObject<{
    server: z.ZodString;
    port: z.ZodLiteral<443>;
    path: z.ZodString;
    clientId: z.ZodUUID;
    targetHost: z.ZodLiteral<"127.0.0.1">;
    targetPort: z.ZodNumber;
}, z.core.$strict>;
export declare const RemoteTunnelProfileSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    tunnel: z.ZodObject<{
        server: z.ZodString;
        port: z.ZodLiteral<443>;
        path: z.ZodString;
        clientId: z.ZodUUID;
        targetHost: z.ZodLiteral<"127.0.0.1">;
        targetPort: z.ZodNumber;
    }, z.core.$strict>;
    sshHost: z.ZodString;
}, z.core.$strict>;
export type RemoteTunnelDescriptor = z.infer<typeof RemoteTunnelDescriptorSchema>;
export type RemoteTunnelProfile = z.infer<typeof RemoteTunnelProfileSchema>;
export declare const RemotePairingSchema: z.ZodDiscriminatedUnion<[
    z.ZodObject<{
        v: z.ZodLiteral<1>;
        relay: z.ZodString;
        room: z.ZodString;
        token: z.ZodString;
        key: z.ZodString;
        hostId: z.ZodString;
        deviceId: z.ZodString;
        expiresAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        token: z.ZodString;
        key: z.ZodString;
        expiresAt: z.ZodNumber;
        hostId: z.ZodString;
        room: z.ZodString;
        deviceId: z.ZodString;
        v: z.ZodLiteral<2>;
        tunnel: z.ZodObject<{
            server: z.ZodString;
            port: z.ZodLiteral<443>;
            path: z.ZodString;
            clientId: z.ZodUUID;
            targetHost: z.ZodLiteral<"127.0.0.1">;
            targetPort: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strict>,
    z.ZodObject<{
        token: z.ZodString;
        key: z.ZodString;
        expiresAt: z.ZodNumber;
        hostId: z.ZodString;
        room: z.ZodString;
        deviceId: z.ZodString;
        v: z.ZodLiteral<3>;
        direct: z.ZodObject<{
            url: z.ZodString;
            certificateSha256: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strict>,
    z.ZodObject<{
        token: z.ZodString;
        key: z.ZodString;
        expiresAt: z.ZodNumber;
        hostId: z.ZodString;
        room: z.ZodString;
        deviceId: z.ZodString;
        v: z.ZodLiteral<4>;
        service: z.ZodLiteral<"random-market">;
    }, z.core.$strict>
], "v">;
export type RemotePairing = z.infer<typeof RemotePairingSchema>;
export declare const RemotePacketSchema: z.ZodObject<{
    v: z.ZodLiteral<1>;
    hostId: z.ZodString;
    deviceId: z.ZodString;
    direction: z.ZodEnum<{
        "to-device": "to-device";
        "to-host": "to-host";
    }>;
    seq: z.ZodNumber;
    nonce: z.ZodString;
    ciphertext: z.ZodString;
}, z.core.$strict>;
export type RemotePacket = z.infer<typeof RemotePacketSchema>;
export declare const RemoteRequestSchema: z.ZodDiscriminatedUnion<[
    z.ZodObject<{
        method: z.ZodLiteral<"pair">;
        deviceKey: z.ZodString;
        deviceToken: z.ZodString;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"sessions">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"create">;
        workspaceId: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        before: z.ZodOptional<z.ZodNumber>;
        knownRevision: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodString;
        method: z.ZodLiteral<"messages">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        text: z.ZodString;
        clientMessageId: z.ZodString;
        sessionId: z.ZodString;
        method: z.ZodLiteral<"send">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        sessionId: z.ZodString;
        method: z.ZodLiteral<"stop">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"approvals">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"approve">;
        requestId: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
        }>;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"interactions">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"answer">;
        requestId: z.ZodString;
        answers: z.ZodRecord<z.ZodString, z.ZodString>;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"plan">;
        requestId: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
        }>;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"status">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"control">;
        call: z.ZodObject<{
            operation: z.ZodString;
            workspaceId: z.ZodOptional<z.ZodString>;
            sessionId: z.ZodOptional<z.ZodString>;
            values: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
        }, z.core.$strict>;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>,
    z.ZodObject<{
        method: z.ZodLiteral<"rpc">;
        request: z.ZodDiscriminatedUnion<[
            z.ZodObject<{
                method: z.ZodLiteral<"session.events">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    afterSeq: z.ZodDefault<z.ZodNumber>;
                    epoch: z.ZodOptional<z.ZodString>;
                    limit: z.ZodDefault<z.ZodNumber>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"lease.status">;
                params: z.ZodObject<{
                    id: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"lease.acquire">;
                params: z.ZodObject<{
                    id: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"lease.renew">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    fence: z.ZodNumber;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"lease.release">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    fence: z.ZodNumber;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"lease.transfer">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    expectedFence: z.ZodNumber;
                    confirm: z.ZodLiteral<"transfer-writer">;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"module.catalog">;
                params: z.ZodObject<{
                    clientKind: z.ZodEnum<{
                        cli: "cli";
                        desktop: "desktop";
                        mobile: "mobile";
                        web: "web";
                    }>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"files.tree">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    path: z.ZodDefault<z.ZodString>;
                    depth: z.ZodDefault<z.ZodNumber>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"files.diff">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    path: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"terminal.list">;
                params: z.ZodObject<{
                    id: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"terminal.create">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    command: z.ZodString;
                    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"terminal.attach">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    termId: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"terminal.kill">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    termId: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"terminal.release">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    termId: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.list">;
                params: z.ZodObject<{
                    generation: z.ZodOptional<z.ZodString>;
                    afterSeq: z.ZodOptional<z.ZodNumber>;
                    cursor: z.ZodOptional<z.ZodString>;
                    limit: z.ZodDefault<z.ZodNumber>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.detail">;
                params: z.ZodObject<{
                    id: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.timeline">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    direction: z.ZodEnum<{
                        after: "after";
                        before: "before";
                        tail: "tail";
                    }>;
                    cursor: z.ZodOptional<z.ZodObject<{
                        epoch: z.ZodString;
                        seq: z.ZodNumber;
                    }, z.core.$strict>>;
                    limit: z.ZodNumber;
                    wholeTurns: z.ZodLiteral<true>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.send">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    text: z.ZodString;
                    clientMessageId: z.ZodString;
                    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        id: z.ZodString;
                        name: z.ZodString;
                        mimeType: z.ZodString;
                    }, z.core.$strict>>>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.queue">;
                params: z.ZodObject<{
                    id: z.ZodString;
                    text: z.ZodString;
                    clientMessageId: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.interrupt">;
                params: z.ZodObject<{
                    id: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"session.subscribe">;
                params: z.ZodObject<{
                    ids: z.ZodArray<z.ZodString>;
                    cursors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                        epoch: z.ZodString;
                        seq: z.ZodNumber;
                    }, z.core.$strict>>>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"approval.list">;
                params: z.ZodObject<{}, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"approval.respond">;
                params: z.ZodObject<{
                    requestId: z.ZodString;
                    decision: z.ZodEnum<{
                        allow: "allow";
                        "allow-session": "allow-session";
                        deny: "deny";
                    }>;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"revision.probe">;
                params: z.ZodObject<{
                    entity: z.ZodEnum<{
                        automations: "automations";
                        connections: "connections";
                        projects: "projects";
                        sessions: "sessions";
                        skills: "skills";
                        workspaces: "workspaces";
                    }>;
                    scope: z.ZodString;
                }, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>,
            z.ZodObject<{
                method: z.ZodLiteral<"host.status">;
                params: z.ZodObject<{}, z.core.$strict>;
                clientKind: z.ZodEnum<{
                    cli: "cli";
                    desktop: "desktop";
                    mobile: "mobile";
                    web: "web";
                }>;
                requestId: z.ZodString;
            }, z.core.$strict>
        ], "method">;
        id: z.ZodString;
        sentAt: z.ZodNumber;
    }, z.core.$strict>
], "method">;
export type RemoteRequest = z.infer<typeof RemoteRequestSchema>;
export declare const RemoteResponseSchema: z.ZodObject<{
    id: z.ZodString;
    ok: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type RemoteResponse = z.infer<typeof RemoteResponseSchema>;
export declare const RemoteConfigureSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    workspaceIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    allWorkspaces: z.ZodOptional<z.ZodBoolean>;
    allowManagement: z.ZodOptional<z.ZodBoolean>;
    connectionMode: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        lan: "lan";
        random: "random";
    }>>;
}, z.core.$strict>;
export type RemoteSettingsInput = z.infer<typeof RemoteConfigureSchema>;
