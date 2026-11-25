import type { AgentSessionMeta, AgentWorkspace, DesktopKernelCatalog, KernelSessionControl } from '@proma/shared';

const iso = (value: number | undefined): string => new Date(value ?? 0).toISOString();
export function paseoControls(controls: KernelSessionControl[] = []): Array<Record<string, unknown>> {
  return controls.filter(c => c.type === 'boolean' || c.type === 'select').map(c => ({
    key: c.id,
    label: c.name,
    ...(c.description ? { description: c.description } : {}),
    ...(c.type === 'boolean' ? { type: 'toggle', ...(typeof c.currentValue === 'boolean' ? { defaultValue: c.currentValue } : {}) } : {
      type: 'select', choices: (c.options ?? []).map(o => ({ value: String(o.value), label: o.name, ...(o.description ? { description: o.description } : {}) }))
    })
  }));
}
export function paseoWorkspace(workspace: AgentWorkspace, directory: string): Record<string, unknown> {
  return {
    id: workspace.id, projectId: workspace.id, projectDisplayName: workspace.name,
    projectRootPath: directory, workspaceDirectory: directory, directory, cwd: directory,
    projectKind: 'directory', workspaceKind: 'directory', name: workspace.name,
    title: workspace.name, pinnedAt: workspace.pluginPinnedAt ?? null,
    labels: workspace.pluginLabels ?? [], metadata: workspace.pluginMetadata ?? {},
    status: 'done', statusEnteredAt: iso(workspace.updatedAt), activityAt: iso(workspace.updatedAt),
    createdAt: iso(workspace.createdAt), archivingAt: workspace.pluginArchivedAt ?? null,
    archivedAt: workspace.pluginArchivedAt ?? null, background: false,
    scripts: [], gitRuntime: { currentBranch: workspace.pluginBaseBranch ?? null }, githubRuntime: null
  };
}
interface AgentProjectionContext {
  cwd: string;
  running: boolean;
  turnId?: string;
  catalog?: DesktopKernelCatalog;
  pendingPermissions?: Array<Record<string, unknown>>;
}
/** SDK 数据形状由 Paseo 契约定义，不能直接把 Tervell 元数据作为 SDK 快照返回。 */
export function paseoAgent(session: AgentSessionMeta, context: AgentProjectionContext): Record<string, unknown> {
  const provider = session.kernelId ?? 'pi', model = session.kernelModelId ?? session.modelId ?? null;
  const thinking = session.gatewayReasoning?.effort ?? session.modelReasoning?.effort ?? session.kernelConfigValues?.thinkingOption ?? session.reasoningLevel ?? null;
  const options = { ...(model ? { model } : {}), ...(session.kernelModeId ? { mode: session.kernelModeId } : {}), ...session.kernelConfigValues,...session.pluginProviderOptions };
  return {
    id: session.id, ...(session.workspaceId ? { workspaceId: session.workspaceId } : {}),
    parentAgentId: session.parentSessionId ?? null, provider, cwd: context.cwd,
    model, title: session.title ?? null, createdAt: iso(session.createdAt), updatedAt: iso(session.updatedAt),
    lastUserMessageAt: session.isDraft ? null : iso(session.updatedAt),
    status: context.running ? 'running' : 'idle',
    activeTurn: context.running && context.turnId ? { turnId: context.turnId, startedAt: iso(session.updatedAt) } : null,
    toolFree:session.pluginToolFree===true,
    requiresAttention:!context.running&&(session.completedButUnconfirmed===true||!!context.pendingPermissions?.length),attentionReason:context.pendingPermissions?.length?'permission':session.completedButUnconfirmed?'finished':null,attentionTimestamp:session.completedButUnconfirmed?iso(session.updatedAt):null,
    metadata: session.pluginMetadata ?? {}, labels: {...(session.parentSessionId?{'paseo.parent-agent-id':session.parentSessionId}:{}),...session.pluginLabels}, background: session.pluginBackground === true,
    archivedAt: session.archived ? iso(session.updatedAt) : null,
    options, controls: paseoControls(context.catalog?.controls),
    currentModeId: session.kernelModeId ?? context.catalog?.currentModeId ?? null,
    availableModes: (context.catalog?.modes ?? []).map(m => ({ id: m.id, label: m.name })),
    thinkingOptionId: thinking, effectiveThinkingOptionId: thinking,
    pendingPermissions: context.pendingPermissions ?? [], backgroundWork: { count: 0 },
    persistence: session.sdkSessionId?{provider,sessionId:session.sdkSessionId}:null,
    capabilities: {
      supportsStreaming: true, supportsSessionPersistence: true,
      supportsDynamicModes: !!context.catalog?.modes?.length, supportsMcpServers: true,
      supportsReasoningStream: true, supportsToolInvocations: true,
      supportsRewindConversation: false, supportsRewindFiles: false, supportsRewindBoth: false
    }
  };
}
