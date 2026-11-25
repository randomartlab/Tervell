import {permissionService} from '../agent-permission-service';
import {paseoConfig,patchPaseoConfig} from './config';
import {pluginConnectionOperation,closePluginRoutes,closePluginConnections} from './connections';
import { paseoCatalogOperation } from './catalog';
import { paseoProviderDiagnostic } from './provider-diagnostic';
import { paseoAgent, paseoWorkspace, paseoControls } from './projection';
import { cachedKernelCatalog,cachedKernelCommands } from '../desktop-kernel-catalog';
import { replacePluginRegistrations, pluginUsageDescriptors } from './registry';
import { observePluginWorkspaceEvents } from './workspace-events';
import { encodePluginFrame, decodePluginFrame } from './wire';
import { DESKTOP_EXTENSION_IPC } from '@proma/shared';
import { setPluginStatusSnapshot } from './status';
import { readDesktopPluginEntries } from '../desktop-extension-service';
import { app } from 'electron';
import { pluginSandboxProfile, assertPluginSession } from './security';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { getProjectFilesPath } from '../agent-workspace-manager';
import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { realpathSync as requirePath } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { PathBoundary } from '@proma/core/permission';
import { writeTextFileAtomic, writeBytesFileAtomic } from '../safe-file';
import type { DesktopPluginEntry, DesktopPluginStatus } from '@proma/shared';
import { hostResources, compilePlugin } from './compiler';
import { pluginDirectory } from './packages';
import { getAgentSessionMeta, getAgentSessionSDKMessages, getAgentSessionSDKMessagesStrict, getAgentSessionUsageSummary, updateAgentSessionMeta, resolveAgentCwd } from '../agent-session-manager';
import { getAgentWorkspace, listAgentWorkspaces } from '../agent-workspace-manager';
import { getSettings } from '../settings-service';
import { pluginTimelinePage } from './timeline';
import { desktopCliEnvironment, resolveDesktopCommand } from '../desktop-extension-service';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import { observePluginSessionEvents, observePluginPermissionEvents, setPluginBeforeHook } from './session-events';
interface ToolRow {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}
interface Snapshot {
  tools: ToolRow[];
  hooks: string[];
  rpcs: string[];
  errors: string[];
  providers?: Array<{
    id: string;
    label: string;
    description?: string;
    command?: string[];
  }>;
  usageSources?: Array<{
    id: string;
    label: string;
  }>;
  env?: Record<string, string>;
  appendSystemPrompt?: string[];
  mcpServers?: Record<string, unknown>;
}
interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}
interface HostProcess {
  server:boolean;
  child: ChildProcessWithoutNullStreams;
  pending: Map<string, Pending>;
  snapshot: Snapshot;
  status: DesktopPluginStatus;
  call: (method: string, input: unknown, signal?: AbortSignal) => Promise<unknown>;
}
const failures = new Map<string, DesktopPluginStatus>();
const pluginRuns = new Map<string, Promise<void>>();
const pluginRunErrors=new Map<string,string>();
const processes = new Map<string, HostProcess>(),
  starts = new Map<string, Promise<HostProcess>>();
const nativeRequire = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
let getEntries: () => DesktopPluginEntry[] = readDesktopPluginEntries;
export function setPluginEntryReader(reader: () => DesktopPluginEntry[]): void {
  getEntries = reader;
}
const cleanError = (value: unknown) => (value instanceof Error ? value.message : String(value)).split('\n')[0]!.replace(/^(?:Error:\s*)+/, '').slice(0, 2000);
export function pluginStatuses(): DesktopPluginStatus[] {
  const result = [...failures.values(), ...[...processes.values()].map(host => ({
    ...host.status,
    tools: host.snapshot.tools.map(t => t.name),
    hooks: host.snapshot.hooks,
    rpcs: host.snapshot.rpcs
  }))];
  setPluginStatusSnapshot(result);
  return result;
}
export async function pluginHostOperation(pluginId: string, method: string, raw: unknown): Promise<unknown> {
  const entry = getEntries().find(e => e.enabled && e.manifest.id === pluginId);
  if (!entry) throw new Error('插件未启用');
  const input = record(raw),
    id = String(input.id ?? '');
  if(entry.source==='Tervell 内置功能'&&id.startsWith('chat:')&&['agent.get','agent.timeline'].includes(method))return (await import('../builtin-chat')).builtinChatOperation(method,input);
  if(method==='builtin.host')return (await import('../builtin-host-service')).builtinHostOperation(entry,input,key=>pluginAgent(getAgentSessionMeta(key)!));
  if (method === 'plugin.themes') {
    if (!Array.isArray(input.themes)) throw Error('插件主题列表无效');
    const {
      registerRuntimePluginThemes
    } = await import('../desktop-extension-service');
    return registerRuntimePluginThemes(pluginId, input.themes);
  }
  if (method === 'plugin.settings') {
    const {
      saveRunningPluginConfig
    } = await import('../desktop-extension-service');
    return saveRunningPluginConfig(pluginId, record(input.config));
  }
  if (method === 'agents.list') {
    const {
      listAgentSessions
    } = await import('../agent-session-manager');
    return listAgentSessions().filter(s => s.workspaceId && entry.access?.workspaceIds.includes(s.workspaceId)).map(s => pluginAgent(s));
  }
  if (method === 'workspaces.list') return listAgentWorkspaces().filter(w => entry.access?.workspaceIds.includes(w.id)).map(w => paseoWorkspace(w, w.projectRootPath ?? getProjectFilesPath(w.slug)));
  if (method === 'workspace.get') {
    if(entry.source==='Tervell 内置功能'&&id==='builtin-chat')return (await import('../builtin-chat')).builtinChatWorkspace();
    if (!entry.access?.workspaceIds.includes(id)) throw new Error('此插件未获项目授权');
    const w = getAgentWorkspace(id);
    return w ? paseoWorkspace(w, w.projectRootPath ?? getProjectFilesPath(w.slug)) : null;
  }
  if (method === 'projects.list') return {
    projects: listAgentWorkspaces().filter(w => entry.access?.workspaceIds.includes(w.id)).map(w => ({
      projectId: w.id,projectKind:'directory',
      projectDisplayName: w.name,
      projectRootPath: w.projectRootPath ?? getProjectFilesPath(w.slug)
    }))
  };
  if (method === 'config.get') return paseoConfig();
  if (['providers.models','providers.modes','providers.controls','providers.features'].includes(method)) return paseoCatalogOperation(entry,method,input);
  if (method === 'providers.usage') {
    const reports = [];
    for (const source of pluginUsageDescriptors()) {
      const owner = getEntries().find(p => p.enabled && p.manifest.id === source.pluginId);
      if (!owner || owner.access?.runtime !== 'trusted') continue;
      const host = await ensurePluginHost(owner);
      const accounts = (await host.call('usage.discover', {
        sourceId: source.id,
        scope: {
          kind: 'global'
        }
      })) as Array<{
        key: string;
        label?: string;
        input: unknown;
      }>;
      for (const account of accounts) try {
        reports.push({
          sourceId: source.id,
          label: source.label,
          accountKey: account.key,
          accountLabel: account.label,
          report: await host.call('usage.fetch', {
            sourceId: source.id,
            input: account.input
          })
        });
      } catch (error) {
        reports.push({
          sourceId: source.id,
          error: cleanError(error)
        });
      }
    }
    return {
      requestId: randomUUID(),
      fetchedAt: new Date().toISOString(),
      providers: reports.map(r => ({
        providerId: r.sourceId,
        displayName: r.label ?? r.sourceId,
        ...(r.report as object ?? {}),
        ...(r.error ? {
          status: 'error',
          error: r.error,
          planLabel: null,
          windows: []
        } : {})
      }))
    };
  }
  if (method === 'providers.available' || method === 'providers.snapshot' || method === 'providers.refresh') {
    const {
      desktopKernelState
    } = await import('../desktop-extension-service');
    const providers = desktopKernelState().entries.filter(p => p.enabled).map(p => ({
      id: p.id,
      label: p.name,
      available: p.available,
      diagnostic: p.diagnostic
    }));
    const entries = await Promise.all(providers.map(async p => ({
      provider: p.id,
      label: p.label,
      enabled: true,
      source: 'custom',supportsToolFree:p.id==='pi',
      status: p.available ? 'ready' : 'unavailable',
      ...(p.diagnostic ? {
        error: p.diagnostic
      } : {}),
      ...(p.available?record(await paseoCatalogOperation(entry,'providers.models',{provider:p.id,...input}).catch(error=>({models:[],error:cleanError(error)}))):{models:[]}),
      modes: [],fetchedAt:new Date().toISOString()
    })));
    return method === 'providers.available' ? {
      providers: providers.map(p => ({
        provider: p.id,
        label: p.label,
        available: p.available
      })),fetchedAt:new Date().toISOString(),
      requestId: randomUUID()
    } : {
      entries,
      generatedAt: new Date().toISOString(),
      snapshotHash: createHash('sha256').update(JSON.stringify(entries)).digest('hex'),
      requestId: 'tervell-local',
      ready: true
    };
  }
  if (method === 'providers.diagnostic') {
    const {
      desktopKernelState
    } = await import('../desktop-extension-service');
    let provider = desktopKernelState().entries.find(p => p.id === input.provider);
    if (provider?.id === 'pi') {
      const metadata = [join(app.getAppPath(), 'node_modules/@earendil-works/pi-coding-agent/package.json'), join(process.cwd(), 'apps/electron/node_modules/@earendil-works/pi-coding-agent/package.json')].find(existsSync);
      if (metadata) {
        const value = JSON.parse(readFileSync(metadata, 'utf8')) as { version?: unknown };
        if (typeof value.version === 'string') provider = { ...provider, version: value.version };
      }
    }
    return {
      available: provider?.available ?? false,
      diagnostic: paseoProviderDiagnostic(provider, String(input.provider)),requestId:randomUUID(),provider:String(input.provider),fetchedAt:new Date().toISOString()
    };
  }
  if (method === 'config.patch') {
    if(entry.access?.runtime!=='trusted')throw Error('修改宿主配置需要标准受信任插件授权');
    const core=nativeRequire(join(hostResources(),'paseo-core.cjs')) as {MutableDaemonConfigPatchSchema:{parse:(value:unknown)=>Record<string,unknown>}};
    const next=patchPaseoConfig(core.MutableDaemonConfigPatchSchema.parse(input.config));
    return next;
  }
  if(method.startsWith('hosts.'))return pluginConnectionOperation(entry,method,input);
  if (method === 'events.snapshot') {
    const agents = await pluginHostOperation(pluginId, 'agents.list', {}),
      workspaces = await pluginHostOperation(pluginId, 'workspaces.list', {}),
      providers = await pluginHostOperation(pluginId, 'providers.snapshot', {});
    return {
      agents,
      workspaces,
      providers,
      projects: await pluginHostOperation(pluginId, 'projects.list', {})
    };
  }
  if (method === 'workspace.title') {
    if (!entry.access?.workspaceIds.includes(id)) throw Error('此插件未获项目授权');
    const {
      updateAgentWorkspace
    } = await import('../agent-workspace-manager');
    const w=getAgentWorkspace(id);if(!w)throw Error('项目不存在');
    await updateAgentWorkspace(id, {
      name: String(input.title ?? w.name).trim()
    });
    return {title:input.title??null,requestId:randomUUID()};
  }
  if (method === 'workspace.open') {
    const cwd = String(input.cwd ?? ''),
      workspace = listAgentWorkspaces().find(w => entry.access?.workspaceIds.includes(w.id) && requirePath(w.projectRootPath ?? getProjectFilesPath(w.slug)) === requirePath(cwd));
    if (!workspace) throw Error('目录不属于插件授权项目');
    return {
      workspace: await pluginHostOperation(pluginId, 'workspace.get', {
        id: workspace.id
      })
    };
  }
  if (method === 'workspace.create') {
    if (entry.access?.runtime !== 'trusted') throw Error('创建新项目需要标准受信任插件授权');
    const source = record(input.source);
    const path = String(source.path ?? source.cwd ?? '');
    if (source.kind !== 'directory' && source.kind !== 'worktree') throw Error('未知项目来源');
    const {
      createAgentWorkspace
    } = await import('../agent-workspace-manager');
    const workspace = await createAgentWorkspace({
      name: String(input.title ?? '插件项目 ' + Date.now()),
      projectRootPath: path,
      pluginCreation: {
        source: source as NonNullable<import('@proma/shared').CreateAgentWorkspaceInput['pluginCreation']>['source'],
        metadata: record(input.metadata)
      }
    });
    // 已授权trusted代码可创建项目；宿主API使用新项目必须保存同一授权范围。
    const {
      grantRunningPluginWorkspace
    } = await import('../desktop-extension-service');
    grantRunningPluginWorkspace(pluginId, workspace.id);
    return {
      workspace: await pluginHostOperation(pluginId, 'workspace.get', {
        id: workspace.id
      })
    };
  }
  if (method === 'workspace.archive') {
    if (!entry.access?.workspaceIds.includes(id)) throw Error('此插件未获项目授权');
    const workspace = getAgentWorkspace(id);
    if (!workspace) throw Error('项目不存在');
    const archivedAt = new Date().toISOString();
    const {
      updateAgentWorkspace
    } = await import('../agent-workspace-manager');
    const updated = await updateAgentWorkspace(id, {
      name: workspace.name,
      pluginArchivedAt: archivedAt
    });
    const {
      publishPluginWorkspaceEvent
    } = await import('./workspace-events');
    publishPluginWorkspaceEvent('workspace.archive.after', updated);
    const {
      listAgentSessions
    } = await import('../agent-session-manager');
    for (const s of listAgentSessions().filter(s => s.workspaceId === id)) updateAgentSessionMeta(s.id, {
      archived: true
    });
    return {
      workspaceId: id,
      archivedAt,
      error: null
    };
  }
  if (['workspace.metadata', 'workspace.pinned', 'workspace.base-branch', 'workspace.label'].includes(method)) {
    const workspaceId = String(input.workspaceId ?? id);
    if (!entry.access?.workspaceIds.includes(workspaceId)) throw Error('此插件未获项目授权');
    const workspace = getAgentWorkspace(workspaceId);
    if (!workspace) throw Error('项目不存在');
    const patch: Partial<import('@proma/shared').AgentWorkspace> = {};
    if (method === 'workspace.metadata') {
      const metadata = {
        ...workspace.pluginMetadata
      };
      for (const [key, value] of Object.entries(record(input.metadata))) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('元数据键无效');
        if (value === null) delete metadata[key];else metadata[key] = value;
      }
      if (Buffer.byteLength(JSON.stringify(metadata)) > 64000) throw Error('元数据超过64KB');
      patch.pluginMetadata = metadata;
    }
    if (method === 'workspace.pinned') patch.pluginPinnedAt = input.pinned ? new Date().toISOString() : null;
    if (method === 'workspace.base-branch') patch.pluginBaseBranch = String(input.baseRef ?? input.baseBranch ?? input.branch ?? '');
    if (method === 'workspace.label') {
      const labels = new Set(workspace.pluginLabels ?? []),
        name = String(input.name ?? record(input.label).name ?? '');
      if (input.assigned) labels.add(name);else labels.delete(name);
      patch.pluginLabels = [...labels];
    }
    const {
      updateAgentWorkspace
    } = await import('../agent-workspace-manager');
    const updated = await updateAgentWorkspace(workspaceId, {
      name: workspace.name,
      ...patch
    });
    return method === 'workspace.metadata' ? updated.pluginMetadata : method === 'workspace.pinned' ? {
      pinnedAt: updated.pluginPinnedAt
    } : method === 'workspace.base-branch' ? {baseRef:updated.pluginBaseBranch??null} : {label:input.label,workspaceLabels:updated.pluginLabels??[],
      workspace: await pluginHostOperation(pluginId, 'workspace.get', {
        id: workspaceId
      })
    };
  }
  if (method === 'workspace.labels') return {
    labels: [...new Set(listAgentWorkspaces().filter(w => entry.access?.workspaceIds.includes(w.id)).flatMap(w => w.pluginLabels ?? []))].map(name => ({
      name,
      color: 'violet'
    }))
  };
  if (method.startsWith('terminal.') || method === 'terminals.list') {
    const terminal = await import('../terminal-service');
    const {
      createPluginTerminal,
      pluginTerminalOperation
    } = await import('./terminals');
    if (method === 'terminal.create') return createPluginTerminal(entry, input, terminal);
    return pluginTerminalOperation(entry, method, input, terminal);
  }
  if (method === 'agent.background.list' || method === 'agent.background.stop') {
    assertPluginSession(entry, id);
    const terminal = await import('../terminal-service');
    if (method === 'agent.background.stop') {
      const item = record(input.item);
      terminal.closeAgentTerminal(id, String(item.id ?? item.stopToken));
      return true;
    }
    return terminal.listAgentTerminals(id).filter(t => t.status === 'running').map(t => ({
      id: t.terminalId,
      kind: 'shell',
      description: t.title,
      startedAt: new Date(0).toISOString(),
      canStop: true,
      stopToken: t.terminalId
    }));
  }
  if (method === 'agent.archive') {
    assertPluginSession(entry, id);
    updateAgentSessionMeta(id, {
      archived: true
    });
    return {
      archivedAt: new Date().toISOString()
    };
  }
  if (method === 'agent.reload') {
    assertPluginSession(entry, id);
    const {
      isAgentSessionBusy
    } = await import('../agent-service');
    if (isAgentSessionBusy(id) || pluginRuns.has(id)) {
      const { stopAgentAndDrain } = await import('../agent-service');
      await stopAgentAndDrain(id);
      await pluginRuns.get(id);
    }
    updateAgentSessionMeta(id, {
      kernelHistoryRefresh: true
    });
    return pluginAgent(getAgentSessionMeta(id)!);
  }
  if (method === 'agent.detach') {
    assertPluginSession(entry, id);
    const {
      stopAgent
    } = await import('../agent-service');
    await stopAgent(id);
    await pluginRuns.get(id);
    await emitPluginEvent('agent.close.after', {
      agent: pluginAgent(getAgentSessionMeta(id)!)
    }, assertPluginSession(entry, id));
    return true;
  }
  if (method === 'agent.options') {
    assertPluginSession(entry, id);
    const {isAgentSessionBusy}=await import('../agent-service');
    if(isAgentSessionBusy(id)){const {applyPluginProviderOptions}=await import('./provider-kernel');if(!await applyPluginProviderOptions(id,record(input.patch)))throw Error('当前内核不支持运行中应用这些选项');}
    const patch = record(input.patch),
      meta = getAgentSessionMeta(id)!;
    const values = {
      ...meta.kernelConfigValues
    };
    const updates: Parameters<typeof updateAgentSessionMeta>[1] = {};
    const originalOptions={...meta.pluginProviderOptions};
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'model' || key === 'mode') {
        if (value !== null && typeof value !== 'string') throw Error('模型或模式必须为字符串');
        if (key === 'model') {
          if ((meta.kernelId ?? 'pi') === 'pi') updates.modelId = value ?? undefined;else updates.kernelModelId = value ?? undefined;
        } else updates.kernelModeId = value ?? undefined;
        continue;
      }
      const option = key === 'thinkingOptionId' ? 'thinkingOption' : key;
      if(value===null){delete values[option];delete originalOptions[option]}else{originalOptions[option]=value;if(['string','number','boolean'].includes(typeof value))values[option]=value as string|number|boolean;else delete values[option];}
    }
    updateAgentSessionMeta(id, {
      ...updates,
      kernelConfigValues: values,pluginProviderOptions:originalOptions
    });
    return true;
  }
  if (method === 'agent.permission') {
    assertPluginSession(entry, id);
    const {
      permissionService
    } = await import('../agent-permission-service');
    const request = permissionService.getPendingRequests().find(r => r.requestId === input.requestId && r.sessionId === id);
    if (!request) throw Error('审批请求不存在或不属于此会话');
    const response = record(input.response);
    if (response.behavior !== 'allow' && response.behavior !== 'deny') throw Error('审批结果无效');
    permissionService.respondToPermission(request.requestId, response.behavior, false);
    return true;
  }
  if (method === 'agent.wait') {
    assertPluginSession(entry, id);
    const {
      isAgentSessionBusy
    } = await import('../agent-service');
    const timeout = typeof input.timeoutMs === 'number' ? Math.min(Math.max(input.timeoutMs, 1), 3600000) : 600000,
      start = Date.now();
    while (pluginRuns.has(id) || isAgentSessionBusy(id)) {
      if (Date.now() - start > timeout) throw Error('等待Agent完成超时');
      await new Promise(r => setTimeout(r, 100));
      assertPluginSession(entry, id);
    }
    ;
    const page = pluginTimelinePage(getAgentSessionSDKMessages(id),{limit:0});
    return {
      status:pluginRunErrors.has(id)?'error':'idle',
      error:pluginRunErrors.get(id)??null,
      lastMessage:page.entries.filter(e=>e.turnId===page.entries.at(-1)?.turnId&&e.item.type==='assistant_message').map(e=>e.item.text).join('')||null,
      final: pluginAgent(getAgentSessionMeta(id)!),
      finalText: page.entries.filter(e => e.turnId === page.entries.at(-1)?.turnId && e.item.type === 'assistant_message').map(e => e.item.text).join(''),
      timeline: page.entries.map(e => e.item),
      canceled: getAgentSessionMeta(id)?.stoppedByUser ?? false
    };
  }
  if (method === 'agent.commands') {
    assertPluginSession(entry, id);
    const meta=getAgentSessionMeta(id)!,commands=cachedKernelCommands(id,meta.kernelId??'pi');
    return {agentId:id,requestId:typeof input.requestId==='string'?input.requestId:randomUUID(),commands:commands??[],error:commands?null:'当前提供商尚未返回此会话实际加载的命令'};
  }
  if (method === 'agent.create') {
    const config = record(input.config),
      cwd = String(config.cwd ?? '');
    const workspaceId = typeof input.workspaceId === 'string' ? input.workspaceId : listAgentWorkspaces().find(w => entry.access?.workspaceIds.includes(w.id) && requirePath(w.projectRootPath ?? getProjectFilesPath(w.slug)) === requirePath(cwd))?.id;
    if (!workspaceId || !entry.access?.workspaceIds.includes(workspaceId)) throw Error('此插件未获创建目标项目授权');
    const {
      createAgentSessionWithPlugins
    } = await import('../agent-session-manager');
    const parent=typeof input.callerAgentId==='string'?getAgentSessionMeta(input.callerAgentId):undefined;
    let inheritedChannel=parent?.channelId??getSettings().agentChannelId;
    if(config.provider==='pi'&&typeof config.model==='string'){
      const {listChannels}=await import('../channel-manager');
      const selected=listChannels().filter(c=>c.enabled).find(c=>c.models.some(m=>m.enabled&&config.model===c.id+'/'+m.id));
      if(selected){inheritedChannel=selected.id;config.model=config.model.slice(selected.id.length+1);}
      else if(!inheritedChannel){const candidates=listChannels().filter(c=>c.enabled&&c.models.some(m=>m.enabled&&m.id===config.model));if(candidates.length===1)inheritedChannel=candidates[0]!.id;}
    }
    const session = await createAgentSessionWithPlugins(typeof config.title === 'string' ? config.title : undefined, inheritedChannel, workspaceId, typeof config.model === 'string' ? config.model : undefined, undefined, undefined, undefined, {
      config,
      env: record(input.env) as Record<string, string>,
      metadata: record(input.metadata),
      background: input.background === true,
      parentSessionId: typeof input.callerAgentId === 'string' ? input.callerAgentId : undefined
    });
    if(input.labels)updateAgentSessionMeta(session.id,{pluginLabels:record(input.labels) as Record<string,string>});
    if(typeof config.thinkingOptionId==='string'){
      const model=typeof config.model==='string'?config.model:session.modelId;
      if(model){const {routedModel}=await import('@proma/auth-bridge/agent-routing');const {modelRoutingConfig}=await import('../model-routing-service');if(routedModel(modelRoutingConfig(),session.kernelId??'pi')===model)updateAgentSessionMeta(session.id,{gatewayReasoning:{model,effort:config.thinkingOptionId}});else if(session.kernelId==='pi'&&session.channelId)updateAgentSessionMeta(session.id,{modelReasoning:{channelId:session.channelId,model,effort:config.thinkingOptionId}});}
    }
    if (typeof input.initialPrompt === 'string' && input.initialPrompt.trim()) await pluginHostOperation(pluginId, 'agent.send', {
      id: session.id,
      text: input.initialPrompt
    });
    return pluginAgent(getAgentSessionMeta(session.id)!);
  }
  const context = assertPluginSession(entry, id);
  if (method === 'file.read' || method === 'file.write') {
    const boundary = new PathBoundary({
      cwd: context.cwd,
      attachedDirectories: []
    }, () => {});
    const path = String(input.path ?? '');
    const safe = boundary.assert(path, method === 'file.write' ? 'write' : 'read');
    const bytes = readFileSync(safe);
    if (bytes.length > 8 * 1024 * 1024) throw new Error('插件文件超过8MB');
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (method === 'file.write') {
      if (input.force !== true && input.expected !== digest) throw new Error('PluginFileConflictError: 文件已变化，请刷新');
      if (typeof input.base64 === 'string') {
        if (input.base64.length > 12 * 1024 * 1024 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.base64)) throw new Error('文件字节无效');
        const value = Buffer.from(input.base64, 'base64');
        if (value.length > 8 * 1024 * 1024) throw new Error('插件文件超过8MB');
        writeBytesFileAtomic(safe, value);
      } else {
        if (typeof input.text !== 'string' || Buffer.byteLength(input.text) > 8 * 1024 * 1024) throw new Error('文件内容无效');
        writeTextFileAtomic(safe, bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191 ? '\uFEFF' + input.text.replace(/^\uFEFF/, '') : input.text);
      }
      ;
      return true;
    }
    const stat = statSync(safe);
    return {
      base64: bytes.toString('base64'),
      size: stat.size,
      modifiedAt: stat.mtimeMs,
      digest
    };
  }
  if (method === 'agent.timeline.append') {
    const item = record(input.item);
    if (item.type !== 'plugin' || typeof item.kind !== 'string' || !Number.isInteger(item.version) || Buffer.byteLength(JSON.stringify(item)) > 65536) throw new Error('插件时间线内容无效或超过64KB');
    const prior = typeof item.id === 'string' ? getAgentSessionSDKMessages(id).find(raw => {
      const row = record(raw);
      return row.type === 'system' && row.subtype === 'plugin_timeline' && row.pluginId === pluginId && record(row.item).id === item.id;
    }) : undefined;
    const message = {
      type: 'system' as const,
      subtype: 'plugin_timeline',
      session_id: id,
      uuid: typeof record(prior).uuid === 'string' ? String(record(prior).uuid) : randomUUID(),
      pluginId,
      item,
      timestamp: typeof record(prior).timestamp === 'string' ? String(record(prior).timestamp) : new Date().toISOString()
    };
    const {
      appendSDKMessages
    } = await import('../agent-session-manager');
    appendSDKMessages(id, [message]);
    const {
      agentEventBus
    } = await import('../agent-service');
    agentEventBus.emit(id, {
      kind: 'sdk_message',
      message
    });
    const {
      getMainWindow
    } = await import('../main-window-store');
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send(DESKTOP_EXTENSION_IPC.pluginTimelineChanged, {
      sessionId: id
    });
    return {
      seq: pluginTimelinePage(getAgentSessionSDKMessages(id), { limit: 0 }).entries.find(e => e.id === message.uuid)?.seqEnd ?? 0,
      epoch: pluginTimelinePage(getAgentSessionSDKMessages(id)).epoch
    };
  }
  if (method === 'agent.get') return pluginAgent(getAgentSessionMeta(id)!);
  if (method === 'agent.timeline') return pluginTimelinePage(pluginId==='builtin-conversation-export'?getAgentSessionSDKMessagesStrict(id):getAgentSessionSDKMessages(id), { ...record(input.options), provider: context.kernelId, agentId: id });
  if (method === 'agent.send') {
    const options=record(input.options);
    const {
      isAgentSessionBusy
    } = await import('../agent-service');
    if(isAgentSessionBusy(id)||pluginRuns.has(id)){
      if(options.activeTurnBehavior==='interrupt'){const {stopAgentAndDrain}=await import('../agent-service');await stopAgentAndDrain(id);await pluginRuns.get(id);}
      else await pluginHostOperation(pluginId,'agent.wait',{id,timeoutMs:1800000});
    }
    let text = typeof input.text === 'string' ? input.text : '';
    for(const asset of Array.isArray(options.attachments)?options.attachments:[]){const a=record(asset);if(a.type==='text')text+='\n'+String(a.text??'');else if(a.url)text+='\n'+String(a.url);}
    if (!text.trim() || text.length > 1024*1024) throw new Error('插件消息为空或过长');
    const {
      runAgentHeadless
    } = await import('../agent-service');
    const session = getAgentSessionMeta(id)!;
    const images=Array.isArray(options.images)?options.images:[];
    if(images.length){const workspace=getAgentWorkspace(session.workspaceId!);if(!workspace)throw Error('项目不存在');const {saveFilesToAgentSession}=await import('../agent-service');const {serializeInlineAttachment}=await import('@proma/shared');const files=saveFilesToAgentSession({workspaceSlug:workspace.slug,sessionId:id,files:images.map((raw,index)=>{const image=record(raw);return {filename:'plugin-image-'+index+'.'+(image.mimeType==='image/jpeg'?'jpg':'png'),mediaType:String(image.mimeType),data:String(image.data)}})});text+='\n'+files.map((f,index)=>serializeInlineAttachment({id:randomUUID(),label:f.filename,mediaType:String(record(images[index]).mimeType),path:f.targetPath})).join('\n');}
    if (pluginRuns.has(id)) throw Error('会话正在启动或运行中');
    pluginRunErrors.delete(id);if(pluginRunErrors.size>256)pluginRunErrors.delete(pluginRunErrors.keys().next().value!);
    const run = Promise.resolve().then(() => runAgentHeadless({
      sessionId: id,
      channelId: session.channelId ?? '',
      modelId: session.modelId,
      workspaceId: session.workspaceId,
      userMessage: text,
      rawUserMessage: text,
      ...(typeof options.messageId==='string'?{userMessageUuid:options.messageId}:{}),
      requireToolApproval: true
    }, {
      source: 'bridge',
      onError: message => {pluginRunErrors.set(id,message)},
      onComplete: () => {},
      onTitleUpdated: () => {}
    })).catch(error=>{pluginRunErrors.set(id,cleanError(error));throw error}).finally(() => { if (pluginRuns.get(id) === run) pluginRuns.delete(id); });
    pluginRuns.set(id, run);
    void run.catch(error => console.warn('[插件Agent调用]', cleanError(error)));
    return {
      accepted: true
    };
  }
  if (method === 'agent.stop') {
    const {
      stopAgent
    } = await import('../agent-service');
    return stopAgent(id);
  }
  if (method === 'agent.metadata') {
    const metadata = record(input.metadata);
    if (Buffer.byteLength(JSON.stringify(metadata)) > 64000) throw new Error('插件元数据超过上限');
    const current = getAgentSessionMeta(id)!.pluginMetadata ?? {},
      next = {
        ...current
      };
    for (const [key, value] of Object.entries(metadata)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('元数据键无效');
      if (value === null) delete next[key];else next[key] = value;
    }
    return updateAgentSessionMeta(id, {
      pluginMetadata: next
    });
  }
  if (method === 'agent.update') {
    const title = record(input.updates).title;
    if (typeof title !== 'string' || !title.trim() || title.length > 200) throw new Error('只支持修改插件已授权会话的标题');
    return updateAgentSessionMeta(id, {
      title
    });
  }
  throw new Error('插件请求了尚未实现的宿主操作：' + method);
}
async function start(entry: DesktopPluginEntry): Promise<HostProcess> {
  const runtime = entry.manifest.runtime!;
  const directory = pluginDirectory(entry.manifest.id);
  const compiled=await compilePlugin(directory, runtime, entry.access?.runtime === 'trusted');
  const resources = hostResources();
  const data = join(directory, 'data');
  mkdirSync(data, {
    recursive: true
  });
  const trusted = entry.access?.runtime === 'trusted';
  const cliGrants: Record<string, string> = {},
    cliRead: string[] = [],
    cliWrite: string[] = [];
  const allCliEnv = desktopCliEnvironment();
  const cliEnv = Object.fromEntries(Object.entries(allCliEnv).filter(([key]) => ['HOME', 'USERPROFILE', 'PATH', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'CLAUDE_CONFIG_DIR', 'LANG', 'LC_ALL', 'TMPDIR'].includes(key) || /^ANTHROPIC_(?:BASE_URL|API_KEY|AUTH_TOKEN|MODEL)$/.test(key)));
  cliEnv.TMPDIR = data;
  if (!trusted && entry.access?.cli?.includes('claude')) {
    const command = resolveDesktopCommand('claude');
    if (!command) throw new Error('已授权 Claude Code，但本机未安装或无法发现 claude；请先在 Agent 内核中安装并登录');
    cliGrants.claude = command;
    // 只开放用户明确授权的 CLI 程序目录与该 CLI 配置，不开放整个 HOME。
    cliRead.push(dirname(requirePath(command)));
    const node = resolveDesktopCommand('node');
    if (node) cliRead.push(dirname(requirePath(node)));
    const config = cliEnv.CLAUDE_CONFIG_DIR ?? join(cliEnv.HOME ?? homedir(), '.claude');
    mkdirSync(config, {
      recursive: true,
      mode: 0o700
    });
    cliWrite.push(config);
    const legacy = join(cliEnv.HOME ?? homedir(), '.claude.json');
    if (existsSync(legacy)) cliWrite.push(legacy);
  }
  const roots = listAgentWorkspaces().filter(w => entry.access?.workspaceIds.includes(w.id)).map(w => w.projectRootPath ?? getProjectFilesPath(w.slug));
  for (const root of roots) mkdirSync(root, {
    recursive: true
  });
  if (!trusted && process.platform !== 'darwin') throw new Error('此运行时当前要求 macOS 项目隔离，当前系统尚未适配');
  const profile = trusted ? '' : pluginSandboxProfile({
      directory,
      resources,
      executable: process.execPath,
      appPath: app.getAppPath(),
      roots,
      network: entry.access?.network === true,
      cliRead,
      cliWrite
    }),
    child = spawn(trusted ? process.execPath : '/usr/bin/sandbox-exec', trusted ? [join(resources, 'worker.cjs')] : ['-p', profile, process.execPath, join(resources, 'worker.cjs')], {
      cwd: data,
      env: {
        ...(trusted ? allCliEnv : {}),
        PATH: [join(directory, 'source/node_modules/.bin'), ...(trusted ? (allCliEnv.PATH ?? '').split(require('node:path').delimiter) : []), ...['/Library/Developer/CommandLineTools/usr/bin', '/Applications/Xcode.app/Contents/Developer/usr/bin'].filter(existsSync), '/usr/bin', '/bin', '/usr/sbin', '/sbin'].filter(Boolean).join(require('node:path').delimiter),
        HOME: trusted ? allCliEnv.HOME : data,
        USERPROFILE: trusted ? allCliEnv.USERPROFILE : data,
        XDG_CONFIG_HOME: trusted ? allCliEnv.XDG_CONFIG_HOME : data,
        XDG_CACHE_HOME: trusted ? allCliEnv.XDG_CACHE_HOME : data,
        ELECTRON_RUN_AS_NODE: '1',
        DSH_HOME: data,
        PASEO_HOME: data,
        TMPDIR: data,
        LANG: process.env.LANG ?? 'en_US.UTF-8',
        TERVELL_PLUGIN_CLI_GRANTS: JSON.stringify(cliGrants),
        TERVELL_PLUGIN_CLI_ENV: JSON.stringify(Object.keys(cliGrants).length ? cliEnv : {}),
        TERVELL_PLUGIN_TRUSTED: trusted ? '1' : '0',
        TERVELL_PLUGIN_NETWORK: entry.access?.network === true ? '1' : '0'
      },
      stdio: 'pipe',
      windowsHide: true,
      detached: true
    });
  const host: HostProcess = {
    server:compiled.server,
    child,
    pending: new Map(),
    snapshot: {
      tools: [],
      hooks: [],
      rpcs: [],
      errors: []
    },
    status: {
      id: entry.manifest.id,
      phase: 'starting',
      client:compiled.client,
      tools: [],
      hooks: [],
      rpcs: [],
      logs: []
    },
    call(method, input, signal) {
      return new Promise((resolve, reject) => {
        if (child.exitCode !== null || child.killed || signal?.aborted) {
          reject(new Error('插件进程已停止或调用取消'));
          return;
        }
        const id = randomUUID();
        const abort = () => {
          child.stdin.write(encodePluginFrame({
            cancel: id
          }) + '\n');
          clearTimeout(timer);
          signal?.removeEventListener('abort', abort);
          if (runtime.ecosystem === 'paseo') {
            const pending = host.pending.get(id);
            if (pending) pending.timer = setTimeout(() => {
              if (host.pending.delete(id)) {
                host.status.phase = 'failed';
                host.status.error = '插件未在取消后释放调用';
                killPluginProcess(child);
              }
            }, 2000);
          } else {
            host.pending.delete(id);
            host.status.phase = 'failed';
            host.status.error = '插件调用取消，进程已回收';
            killPluginProcess(child);
          }
          reject(new Error('插件调用取消'));
        };
        const timer = setTimeout(() => {
          host.pending.delete(id);
          host.status.phase = 'failed';
          host.status.error = '插件操作超时：' + method;
          killPluginProcess(child);
          reject(new Error(host.status.error));
        }, ['rpc','execute','hook','settle','provider.send'].includes(method) ? 1800000 : 60000);
        signal?.addEventListener('abort', abort, {
          once: true
        });
        host.pending.set(id, {
          resolve: value => {
            signal?.removeEventListener('abort', abort);
            resolve(value);
          },
          reject: error => {
            signal?.removeEventListener('abort', abort);
            reject(error);
          },
          timer
        });
        child.stdin.write(encodePluginFrame({
          id,
          method,
          input
        }) + '\n');
      });
    }
  };
  processes.set(entry.manifest.id, host);
  child.on('error', error => {
    host.status.phase = 'failed';
    host.status.error = cleanError(error);
  });
  child.stdin.on('error', () => {});
  child.stderr.on('data', data => {
    host.status.logs = [...host.status.logs, String(data).slice(0, 4000)].slice(-40);
  });
  child.on('exit', () => {
    replacePluginRegistrations(entry.manifest.id, {});
    if (host.status.phase !== 'failed') {
      host.status.phase = 'failed';
      host.status.error = '插件进程意外结束';
    }
    ;
    for (const p of host.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('插件进程已结束'));
    }
    host.pending.clear();
  });
  createInterface({
    input: child.stdout
  }).on('line', line => {
    if (Buffer.byteLength(line) > 48 * 1024 * 1024) {
      killPluginProcess(child);
      return;
    }
    try {
      const message = decodePluginFrame(line) as {
        id?: string;
        value?: unknown;
        error?: string;
        hostCall?: string;
        method?: string;
        params?: unknown;
        diagnostic?: {
          hook?: string;
          error?: string;
        };
      };
      if (message.diagnostic) {
        host.status.error = `插件事件 ${message.diagnostic.hook ?? ''}：${message.diagnostic.error ?? '执行失败'}`;
        pluginStatuses();
        return;
      }
      if (message.hostCall) {
        void pluginHostOperation(entry.manifest.id, message.method ?? '', message.params).then(value => child.stdin.write(encodePluginFrame({
          hostReply: message.hostCall,
          value
        }) + '\n'), error => child.stdin.write(encodePluginFrame({
          hostReply: message.hostCall,
          error: cleanError(error)
        }) + '\n'));
        return;
      }
      const pending = host.pending.get(message.id ?? '');
      if (pending) {
        host.pending.delete(message.id!);
        clearTimeout(pending.timer);
        if (message.error) {
          host.status.logs = [...host.status.logs, message.error.slice(0, 4000)].slice(-40);
          pending.reject(new Error(cleanError(message.error)));
        } else pending.resolve(message.value);
      }
    } catch {/* 插件日志不应污染控制协议。 */}
  });
  try {
    if (compiled.server) host.snapshot = (await host.call('load', {
      ecosystem: runtime.ecosystem,
      builtin: entry.source==='Tervell 内置功能',
      pluginId: entry.manifest.id,
      packageName: existsSync(join(directory, 'source/package.json')) ? JSON.parse(readFileSync(join(directory, 'source/package.json'), 'utf8')).name ?? entry.manifest.id : entry.manifest.id,
      serverFile: join(directory, 'compiled/server.cjs'),
      dataDir: join(directory, 'data'),
      cordis: join(resources, 'cordis.cjs'),
      zod: nativeRequire.resolve('zod'),
      config: entry.config ?? {}
    })) as Snapshot;
    replacePluginRegistrations(entry.manifest.id, host.snapshot);
    (await import('../desktop-extension-service')).publishPluginKernelChange();
    host.status.phase = 'ready';
    pluginStatuses();
    return host;
  } catch (error) {
    host.status.phase = 'failed';
    host.status.error = cleanError(error);
    killPluginProcess(child);
    host.status.phase = 'failed';
    pluginStatuses();
    throw error;
  }
}
export async function ensurePluginHost(entry: DesktopPluginEntry): Promise<HostProcess> {
  const id = entry.manifest.id,
    existing = processes.get(id);
  if (existing?.status.phase === 'ready') return existing;
  if (existing?.status.phase === 'failed') throw new Error(existing.status.error ?? '插件启动失败，请停用后重试');
  if (failures.has(id)) throw new Error(failures.get(id)!.error ?? '插件启动失败');
  if (starts.has(id)) return starts.get(id)!;
  failures.delete(id);
  const job = start(entry).catch(error => {
    if (!processes.has(id)) failures.set(id, {
      id,
      phase: 'failed',
      tools: [],
      hooks: [],
      rpcs: [],
      logs: [],
      error: cleanError(error)
    });
    pluginStatuses();
    throw error;
  }).finally(() => starts.delete(id));
  starts.set(id, job);
  return job;
}
export async function stopPluginHost(id: string, retainFailure = false): Promise<void> {
  await closePluginRoutes(id);
  const previous = pluginStatuses().find(row => row.id === id);
  failures.delete(id);
  const {
    closePluginTerminals
  } = await import('./terminals');
  await closePluginTerminals(id);
  replacePluginRegistrations(id, {});
  (await import('../desktop-extension-service')).publishPluginKernelChange();
  const host = processes.get(id);
  if (host) {
    try {
      if (host.status.phase === 'ready') await host.call('dispose', {});
    } catch {}
    killPluginProcess(host.child);
    processes.delete(id);
  }
  // 编译失败时尚未创建进程，清理仍须保留这次失败，供界面诊断和显式重试。
  if (retainFailure && previous?.phase === 'failed') failures.set(id, previous);
  pluginStatuses();
}
export async function syncPluginHosts(): Promise<void> {
  const entries = getEntries().filter(entry => entry.enabled && entry.manifest.runtime);
  for (const id of new Set([...processes.keys(), ...failures.keys()])) if (!entries.some(entry => entry.manifest.id === id) && (processes.has(id) || !getEntries().some(entry => entry.manifest.id === id))) await stopPluginHost(id);
  await Promise.allSettled(entries.map(ensurePluginHost));
}
export interface PluginSessionContext {
  id: string;
  workspaceId?: string;
  cwd: string;
  kernelId: string;
  title?: string;
  labels?: Record<string, string>;
}
export async function preparePluginSession(context: PluginSessionContext): Promise<{
  tools: Array<ToolRow & {
    pluginId: string;
  }>;
  env: Record<string, string>;
  appendSystemPrompt: string[];
  mcpServers: Record<string, unknown>;
}> {
  await syncPluginHosts();
  const session = getAgentSessionMeta(context.id);
  const activeConfiguration = session?.pluginConfigurationOwners === undefined || session.pluginConfigurationOwners.every(id => getEntries().some(entry => entry.enabled && entry.manifest.id === id && entry.access?.workspaceIds.includes(context.workspaceId ?? '')));
  const defaults=paseoConfig(),providerDefaults=defaults.providers[context.kernelId]??{};
  const result = {
    tools: [] as Array<ToolRow & {
      pluginId: string;
    }>,
    env: {
      ...defaults.envOverrides,...providerDefaults.env,
      ...(activeConfiguration ? session?.pluginEnvironment : {})
    } as Record<string, string>,
    appendSystemPrompt: [defaults.appendSystemPrompt,...(activeConfiguration && session?.pluginSystemPrompt ? [session.pluginSystemPrompt] : [])].filter(Boolean) as string[],
    mcpServers: {
      ...(activeConfiguration ? session?.pluginMcpServers : {})
    } as Record<string, unknown>
  };
  for (const entry of getEntries().filter(e => e.enabled && (e.manifest.runtime?.serverEntry||e.manifest.runtime?.discoverEntriesAfterBuild) && context.workspaceId && e.access?.workspaceIds.includes(context.workspaceId))) {
    assertPluginSession(entry, context.id);
    let host: HostProcess;
    try {
      host = await ensurePluginHost(entry);
    } catch (error) {
      throw new Error('已启用插件启动失败：' + entry.manifest.name + '；' + cleanError(error));
    }
    if(!host.server)continue;
    const snapshot = (await host.call('prepare', {
      ...context,
      reason:session?.kernelHistoryRefresh?'refresh':session?.sdkSessionId?'resume':'create',
      background:session?.pluginBackground===true,
      labels:session?.pluginLabels??context.labels??entry.config?.labels??{},
      metadata: session?.pluginMetadata ?? {}
    })) as Snapshot;
    host.snapshot = snapshot;
    result.tools.push(...snapshot.tools.map(tool => ({
      ...tool,
      pluginId: entry.manifest.id
    })));
    for (const [key, value] of Object.entries(snapshot.env ?? {})) {
      if (entry.access?.runtime !== 'trusted' && /^(?:LD_|DYLD_|NODE_|ELECTRON_|BASH_ENV|ENV$|HOME$|PATH$|.*(?:API_KEY|AUTH_TOKEN|ACCESS_TOKEN|SECRET|PASSWORD)$)/.test(key)) throw new Error('插件尝试设置受保护环境变量：' + key);
      result.env[key] = value;
    }
    result.appendSystemPrompt.push(...(snapshot.appendSystemPrompt ?? []));
    if (Object.keys(snapshot.mcpServers ?? {}).length && entry.access?.runtime !== 'trusted') throw Error('插件提供MCP启动器，需要明确授权标准受信任运行模式：' + entry.manifest.name);
    for (const [name, server] of Object.entries(snapshot.mcpServers ?? {})) {
      if (result.mcpServers[name]) throw Error('插件MCP名称冲突：' + name);
      result.mcpServers[name] = server;
    }
  }
  return result;
}
export async function executePluginTool(id: string, name: string, args: unknown, context: PluginSessionContext, signal?: AbortSignal): Promise<unknown> {
  const entry = getEntries().find(e => e.enabled && e.manifest.id === id);
  if (!entry) throw new Error('插件已停用');
  const verified = assertPluginSession(entry, context.id);
  if (context.workspaceId !== verified.workspaceId || context.cwd !== verified.cwd && requirePath(context.cwd) !== verified.cwd) throw new Error('插件上下文与项目目录不一致');
  return (await ensurePluginHost(entry)).call('execute', {
    name,
    args,
    context
  }, signal);
}
export async function pluginRpc(id: string, name: string, input: unknown): Promise<unknown> {
  const entry = getEntries().find(e => e.enabled && e.manifest.id === id);
  if (!entry) throw new Error('插件已停用');
  if (name === '__tervell_subscription') {
    const value = record(input);
    if (!['start', 'poll', 'stop'].includes(String(value.action))) throw new Error('订阅操作无效');
    return (await ensurePluginHost(entry)).call('subscribe-' + String(value.action), {
      name: value.name,
      input: value.input,
      id: value.id
    });
  }
  if (name === '__tervell_dsh') {
    const request = record(input),
      payload = record(request.payload);
    if (typeof payload.sessionId === 'string') assertPluginSession(entry, payload.sessionId);
    return (await ensurePluginHost(entry)).call('dsh', request);
  }
  return (await ensurePluginHost(entry)).call('rpc', {
    name,
    input
  });
}
export async function pluginProviderOperation(pluginId: string, method: string, input: unknown): Promise<unknown> {
  const entry = getEntries().find(e => e.enabled && e.manifest.id === pluginId);
  if (!entry) throw Error('插件已停用');
  return (await ensurePluginHost(entry)).call('provider.' + method, input);
}
export async function emitPluginEvent(name: string, payload: unknown, context?: PluginSessionContext): Promise<void> {
  await syncPluginHosts();
  for (const [id, host] of processes) if (host.status.phase === 'ready' && (!context || getEntries().some(e => e.manifest.id === id && context.workspaceId && e.access?.workspaceIds.includes(context.workspaceId)))) try {
    await host.call('event', {
      name,
      payload,
      context
    });
  } catch (error) {
    host.status.error = cleanError(error);
  }
}
const sessionEvents = new Map<string, Array<{
  seq: number;
  type: string;
  time: number;
  data: unknown;
}>>();
export async function recordPluginSessionEvent(context: PluginSessionContext, type: string, data: unknown): Promise<void> {
  const events = sessionEvents.get(context.id) ?? [];
  if (type === 'turn/start') events.length = 0;
  const event = {
    seq: events.length,
    type,
    time: Date.now(),
    data
  };
  events.push(event);
  sessionEvents.set(context.id, events);
  if (sessionEvents.size > 100) {
    const oldest = sessionEvents.keys().next().value;
    if (oldest) sessionEvents.delete(oldest);
  }
  await syncPluginHosts();
  for (const [id, host] of processes) if (host.status.phase === 'ready' && getEntries().some(e => e.manifest.id === id && context.workspaceId && e.access?.workspaceIds.includes(context.workspaceId))) try {
    await host.call('event', {
      session: {
        id: context.id,
        events
      },
      event,
      context
    });
  } catch (error) {
    host.status.error = cleanError(error);
  }
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
setPluginBeforeHook(async (name, request, context) => {
  await syncPluginHosts();
  let value = request;
  for (const entry of getEntries().filter(e => e.enabled && e.manifest.runtime?.ecosystem === 'paseo' && (context.workspaceId ? e.access?.workspaceIds.includes(context.workspaceId) : e.access?.runtime === 'trusted'))) {
    const host = await ensurePluginHost(entry);
    if (!host.snapshot.hooks.includes(name)) continue;
    const changed = await host.call('hook', {
      name,
      request: value
    });
    if (name.endsWith('.before')) {
      value = record(changed);
      context.onApplied?.(entry.manifest.id, value);
      if (entry.access?.runtime !== 'trusted') {
        if (Object.keys(record(record(value.config).mcpServers)).length) throw Error('插件MCP启动需要标准受信任授权');
        for (const key of Object.keys(record(value.env))) if (/^(?:LD_|DYLD_|NODE_|ELECTRON_|BASH_ENV|ENV$|HOME$|PATH$|.*(?:API_KEY|AUTH_TOKEN|ACCESS_TOKEN|SECRET|PASSWORD)$)/.test(key)) throw Error('受限插件不能保存保护环境变量：' + key);
      }
    }
  }
  return value;
});
observePluginWorkspaceEvents((name, workspace) => {
  const cwd = workspace.projectRootPath ?? getProjectFilesPath(workspace.slug),
    payload = {
      workspace: {
        id: workspace.id,
        projectId: workspace.id,
        cwd,
        name: workspace.name,
        archivedAt: name === 'workspace.archive.after' ? new Date().toISOString() : null,
        metadata: workspace.pluginMetadata??{}
      }
    };
  void emitPluginEvent(name, payload, {
    id: '',
    workspaceId: workspace.id,
    cwd,
    kernelId: 'pi'
  }).catch(error => console.warn('[插件项目通知]', String(error)));
});
const pluginTurns = new Map<string, {
  id: string;
  finished: boolean;
}>();
export function pluginAgent(session: import('@proma/shared').AgentSessionMeta): Record<string, unknown> {
  const workspace = session.workspaceId ? getAgentWorkspace(session.workspaceId) : undefined;
  const projection=paseoAgent(session, {
    cwd: resolveAgentCwd(workspace, session.id, session.agentCwdMode, session.activeWorktree) ?? '',
    running: pluginTurns.get(session.id)?.finished === false || pluginRuns.has(session.id),
    turnId: pluginTurns.get(session.id)?.id,
    catalog: cachedKernelCatalog(session.id, session.kernelId ?? 'pi'),
    pendingPermissions: (()=>{try{return permissionService.getPendingRequests().filter((r:{sessionId:string})=>r.sessionId===session.id).map((r:{requestId:string;toolName:string;description:string;toolInput:Record<string,unknown>})=>({id:r.requestId,provider:session.kernelId??'pi',name:r.toolName,kind:'tool',description:r.description,input:r.toolInput}));}catch{return[]}})()
  });
  if((session.kernelId??'pi')==='pi'&&session.channelId&&session.channelId!=='tervell-routing'&&session.modelId){projection.model=session.channelId+'/'+session.modelId;projection.options={...record(projection.options),model:projection.model};}
  const result=getAgentSessionUsageSummary(session.id).last;
  if(result){const value=record(result),usage=record(value.usage);projection.lastUsage={inputTokens:Number(usage.input_tokens??0)+Number(usage.cache_read_input_tokens??0)+Number(usage.cache_creation_input_tokens??0),cachedInputTokens:Number(usage.cache_read_input_tokens??0),outputTokens:Number(usage.output_tokens??0),...(typeof value.total_cost_usd==='number'?{totalCostUsd:value.total_cost_usd}:{})};}
  return projection;
}
observePluginSessionEvents(({
  name,
  session
}) => {
  const agent = pluginAgent(session);
  if (!session.workspaceId || !agent.cwd) return;
  void emitPluginEvent(name, {
    agent,
    ...(name === 'agent.archive.after' ? {
      archivedAt: new Date().toISOString()
    } : {})
  }, {
    id: session.id,
    workspaceId: session.workspaceId,
    cwd: String(agent.cwd),
    kernelId: session.kernelId ?? 'pi',
    title: session.title
  }).catch(error => console.warn('[插件会话通知]', String(error)));
});
observePluginPermissionEvents(({
  name,
  sessionId,
  request,
  resolution
}) => {
  const session = getAgentSessionMeta(sessionId);
  if (!session?.workspaceId) return;
  const agent = pluginAgent(session),
    context = {
      id: sessionId,
      workspaceId: session.workspaceId,
      cwd: String(agent.cwd),
      kernelId: session.kernelId ?? 'pi'
    };
  const payload = name === 'agent.permission.before' ? {
    agent,
    request: {
      id: request.requestId,
      provider: agent.provider,
      name: request.toolName,
      kind: 'tool',
      description: request.description,
      input: request.toolInput
    }
  } : {
    agent,
    requestId: request.requestId,
    resolution
  };
  void emitPluginEvent(name, payload, context).catch(error => console.warn('[插件审批通知]', String(error)));
});
export async function beginPluginTurn(context: PluginSessionContext): Promise<string> {
  const user = [...getAgentSessionSDKMessages(context.id)].reverse().find(raw => {
    const m = record(raw),
      parts = record(m.message).content;
    return m.type === 'user' && (typeof parts === 'string' || Array.isArray(parts) && parts.some(p => record(p).type === 'text'));
  });
  const turnId = typeof record(user).uuid === 'string' ? String(record(user).uuid) : randomUUID();
  pluginTurns.set(context.id, {
    id: turnId,
    finished: false
  });
  await recordPluginSessionEvent(context, 'turn/start', {
    turn: Date.now(),
    turnId
  });
  const session = getAgentSessionMeta(context.id);
  if (session) await emitPluginEvent('agent.turn.before', {
    agent: pluginAgent(session),
    turnId
  }, context);
  return turnId;
}
export async function settlePluginNotifications(id: string): Promise<void> {
  const host = processes.get(id);
  if (host?.status.phase === 'ready') await host.call('settle', {});
}
export async function finishPluginTurn(id: string, failed = false, canceled = false): Promise<void> {
  const turn = pluginTurns.get(id);
  if (!turn || turn.finished) return;
  turn.finished = true;
  const session = getAgentSessionMeta(id);
  if (!session?.workspaceId) return;
  const agent = pluginAgent(session),
    context = {
      id,
      workspaceId: session.workspaceId,
      cwd: String(agent.cwd),
      kernelId: session.kernelId ?? 'pi',
      title: session.title
    };
  if (!context.cwd) return;
  const start = [...(sessionEvents.get(id) ?? [])].reverse().find(event => event.type === 'turn/start');
  await recordPluginSessionEvent(context, 'turn/end', {
    turn: record(start?.data).turn ?? 0,
    reason: {
      kind: canceled ? 'canceled' : failed ? 'error' : 'completed'
    }
  });
  const outcome = canceled ? {
    kind: 'canceled',
    reason: '用户已停止'
  } : failed ? {
    kind: 'failed',
    error: {
      message: 'Agent 回合执行失败'
    }
  } : {
    kind: 'completed'
  };
  await emitPluginEvent('agent.turn.after', {
    agent,
    turnId: turn.id,
    timeline: pluginTimelinePage(getAgentSessionSDKMessages(id), {limit:0}).entries.filter(row => row.turnId === turn.id).map(row => row.item),
    outcome
  }, context);
}
function killPluginProcess(child: ChildProcessWithoutNullStreams): void {
  try {
    if (child.pid) process.kill(-child.pid, 'SIGTERM');else child.kill();
  } catch {
    child.kill();
  }
}
export async function stopAllPluginHosts(): Promise<void> {
  await Promise.allSettled([...processes.keys()].map(id => stopPluginHost(id)));
  await closePluginConnections();
  sessionEvents.clear();
  pluginTurns.clear();
}

/** 转换完整消息；partial与重放不重复生成审计事件。 */
export async function recordPluginMessage(context: PluginSessionContext, message: unknown): Promise<void> {
  const value = record(message),
    payload = record(value.message);
  if (value._partial || value.isReplay) return;
  if (!Array.isArray(payload.content)) return;
  for (const raw of payload.content) {
    const part = record(raw);
    if (value.type === 'assistant' && part.type === 'tool_use') await recordPluginSessionEvent(context, 'tool/call', {
      callId: String(part.id),
      name: String(part.name),
      arguments: part.input ?? {}
    });
    if (value.type === 'user' && part.type === 'tool_result') await recordPluginSessionEvent(context, 'tool/result', {
      message: {
        content: [{
          type: 'tool-result',
          toolCallId: String(part.tool_use_id),
          isError: part.is_error === true,
          content: part.content
        }]
      }
    });
  }
}
export async function pluginToolDecision(context: PluginSessionContext, name: string, args: unknown, signal: AbortSignal): Promise<string | undefined> {
  for (const entry of getEntries().filter(p => p.enabled && p.manifest.runtime?.ecosystem === 'dsh' && context.workspaceId && p.access?.workspaceIds.includes(context.workspaceId))) {
    assertPluginSession(entry, context.id);
    const host = await ensurePluginHost(entry);
    const decision = record(await host.call('policy', {
      context,
      name: name === 'Bash' ? 'bash' : name,
      args
    }, signal));
    if (decision.kind !== 'allow') return String(decision.reason ?? '插件流程拒绝此操作');
  }
  return undefined;
}
