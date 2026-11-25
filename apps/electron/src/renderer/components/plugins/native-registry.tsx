import {createNativeHostAccess} from './native-hosts';
import {conversationsAtom} from '@/atoms/chat-atoms';
import {browserPanelOpenMapAtom,browserPanelMinimizedMapAtom,browserStateMapAtom,browserPendingNavigationMapAtom} from '@/atoms/browser-atoms';
import {BROWSER_RISK_DISCLAIMER_VERSION} from '@/types/settings';
import {createPaseoApi} from '@/lib/third-party/paseo-client/api';
import {createLocalPaseoDriver} from '@/lib/third-party/paseo-client/driver';
import { resolvePanelLocation } from './placement-policy';
import { composerSource } from './native-composers';
import * as React from 'react';
import { useAtomValue, useStore } from 'jotai';
import type { DesktopPluginEntry } from '@proma/shared';
import { desktopPluginStateAtom } from '@/atoms/desktop-themes';
import { tabsAtom, activeTabIdAtom, openTab } from '@/atoms/tab-atoms';
import { appModeAtom } from '@/atoms/app-mode';
import { activeViewAtom } from '@/atoms/active-view';
import { settingsOpenAtom } from '@/atoms/settings-tab';
import { agentSessionsAtom, agentWorkspacesAtom, currentAgentSessionIdAtom, currentAgentWorkspaceIdAtom, currentSessionSidePanelOpenAtom, agentDiffPanelTabAtom, agentTerminalTabsAtom, agentStreamingStatesAtom, agentSDKMessagesCacheAtom, agentMessageRefreshAtom } from '@/atoms/agent-atoms';
import { runPluginClientBundle, pluginHost, pluginShared, QueryClient, QueryClientProvider } from '@/lib/third-party/paseo-client/runtime';
import type { Evaluated, Contribution, TranslationRuntime } from '@/lib/third-party/paseo-client/runtime';
import { Icon,PluginUiTitleContext } from './native-ui';
import { createDshContributions } from './native-dsh';
import { pluginWorkspaceTargetsAtom, pluginMainTargetAtom, pluginSidebarViewTargetAtom, pluginSettingsTargetAtom, pluginExplorerTargetsAtom, pluginDiagnosticAtom, pluginTabStatesAtom } from './native-state';
import type { PluginTarget } from './native-state';
import {resolvePluginText} from './display-text';
export * from './native-state';
export function pluginText(installation:Installation,value:unknown,fallback='',params:Record<string,unknown>={}):string {return resolvePluginText(installation.i18n,value,fallback,params)}
export interface PluginButton {
  id: string;
  key: number;
  workspaceId: string;
  agentId?: string;
  placement: 'header' | 'composer';
  button: {
    title?: string;
    label?: string;
    icon?: unknown;
    disabled?: boolean;
    visible?: boolean;
    behavior?: {
      kind: string;
      onPress?: () => unknown;
      items?: Array<Record<string, unknown>>;
      Content?: React.ComponentType<Record<string, unknown>>;
    };
  };
}
export interface Installation extends Evaluated {
  entry: DesktopPluginEntry;
  invoke: (name: string, input: unknown) => Promise<unknown>;
  paseo: Record<string, unknown>;
  state: Record<string, unknown>;
  i18n: TranslationRuntime;
  query: QueryClient;
  buttons: PluginButton[];
  error?: string;
  lifetime: AbortController;
  hosts?: ReturnType<typeof createNativeHostAccess>;
  themeSignature?: string;
  store: ReturnType<typeof useStore>;
}
let snapshot: Installation[] = [];
let revision = 0;
let reconcile: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>(),
  refs = pluginHost.createEntityRefs();
const publish = () => {
  revision++;
  for (const fn of listeners) fn();
  for (const installation of snapshot) {
    if (installation.error) continue;
    const themes = installation.themes.map(t => ({
        ...t,
        name: typeof t.name === 'string' ? t.name : installation.i18n.resolve(t.name)
      })),
      signature = JSON.stringify(themes);
    if (installation.themeSignature === signature) continue;
    installation.themeSignature = signature;
    void window.electronAPI.desktopPluginHostCall(installation.id, 'plugin.themes', {
      themes
    }).catch(error => {
      installation.error = String(error);
    });
  }
};
export function getNativePlugins(): Installation[] {
  return snapshot;
}
export function usePlugins(): Installation[] {
  React.useSyncExternalStore(fn => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, () => revision);
  return snapshot;
}
let navigate: (target: PluginTarget, location?: string) => void = () => {
  throw Error('插件导航尚未就绪');
};
const stringId = (value: unknown) => typeof value === 'string' ? value : value && typeof value === 'object' ? String(Reflect.get(value, 'id') ?? '') : '';
export function pluginNavigation(installation:Installation):Record<string,unknown>{
 const store=installation.store;
 const workspace=(value:{id?:string;workspaceId?:string})=>{
   store.set(currentAgentWorkspaceIdAtom,value.workspaceId??value.id??null);
   store.set(pluginMainTargetAtom,null);store.set(settingsOpenAtom,false);
 };
 const agent=(value:{id?:string;agentId?:string})=>window.dispatchEvent(new CustomEvent('tervell-native-open-agent',{detail:{agentId:value.agentId??value.id}}));
 return {
  openAgent:agent,openWorkspace:workspace,openProject:workspace,
  openTerminal:(ref:{id:string})=>{
   const owner=[...store.get(agentTerminalTabsAtom)].find(([,rows])=>rows.some(t=>t.terminalId===ref.id));
   if(!owner)throw Error('终端已关闭');
   agent({id:owner[0]});store.set(agentDiffPanelTabAtom,all=>new Map(all).set(owner[0],`terminal:${ref.id}`));store.set(currentSessionSidePanelOpenAtom,true);
  },
  openBrowser:(input:{url:string;workspaceId:string})=>{
   const session=store.get(agentSessionsAtom).find(a=>a.workspaceId===input.workspaceId);
   if(!session)throw Error('打开项目浏览器前请先创建会话');
   void (async()=>{
    agent({id:session.id});const settings=await window.electronAPI.getSettings();
    const allowed=(settings.browserRiskDisclaimerVersion??0)>=BROWSER_RISK_DISCLAIMER_VERSION;
    const state=allowed?await window.electronAPI.createAgentBrowserTab({sessionId:session.id,url:input.url}):await window.electronAPI.openAgentBrowser(session.id);
    store.set(browserStateMapAtom,all=>new Map(all).set(session.id,state));store.set(browserPanelOpenMapAtom,all=>new Map(all).set(session.id,true));store.set(browserPanelMinimizedMapAtom,all=>new Map(all).set(session.id,false));
    if(!allowed)store.set(browserPendingNavigationMapAtom,all=>new Map(all).set(session.id,input.url));
   })().catch(error=>console.error('[插件浏览器]',error));
  }
 };
}
function createApi(installation: Installation): Record<string, unknown> {
 const driver=createLocalPaseoDriver((method,input)=>window.electronAPI.desktopPluginHostCall(installation.id,method,input),{interval:500,serverId:'local'});
 const api=createPaseoApi(driver,{signal:installation.lifetime.signal}),borrowed=createPaseoApi(driver,{signal:installation.lifetime.signal});
 installation.lifetime.signal.addEventListener('abort',()=>{void api.dispose();void borrowed.dispose();void driver.close()},{once:true});
 const hosts=createNativeHostAccess(borrowed,installation.lifetime.signal);installation.hosts=hosts;
 return pluginHost.createPluginReferenceApi({paseo:api,resolveHost:hosts.getPaseoClient,readProject:(ref:{id:string})=>(installation.state.getProject as (id:string)=>unknown)(ref.id),navigation:pluginNavigation(installation)});
}

function open(installation: Installation, id: string, kind: PluginTarget['kind'], options: Record<string, unknown> = {}, location?: string): void {
  const contributions = kind === 'screen' ? installation.surfaces : kind === 'settings' ? installation.settingsScreens : kind === 'sidebar' ? installation.sidebarViews : installation.workspacePanels;
  const row = contributions.find(c => c.id === id);
  if (!row) throw Error('插件贡献不存在：' + id);
  if (kind === 'panel') {
    location = resolvePanelLocation(row, location);
    if (row.context === 'agent' && !options.agentId) throw Error('此插件面板需要明确会话');
    if (row.context !== 'agent' && location === 'workspace') {
      options = {
        ...options
      };
      delete options.agentId;
    }
  }
  navigate({
    pluginId: installation.id,
    id,
    kind,
    ...options
  }, location);
}
export function actionContext(installation: Installation, workspaceId?: string, agentId?: string): Record<string, unknown> {
  const state = installation.state as {
    getWorkspace?: (id: string) => unknown;
    getAgent?: (id: string) => unknown;
  };
  return {
    context: agentId ? 'agent' : workspaceId ? 'workspace' : 'global',
    paseo: installation.paseo,navigation:pluginNavigation(installation),
    rpc: (contract: {
      name: string;
      output?: {
        parseAsync: (v: unknown) => Promise<unknown>;
      };
    }, input: unknown) => installation.invoke(contract.name, input).then(v => contract.output ? contract.output.parseAsync(v) : v),
    workspace: workspaceId ? state.getWorkspace?.(workspaceId) : undefined,
    agent: agentId ? state.getAgent?.(agentId) : undefined,
    openPanel: (id: string, options?: {
      location?: string;
    }) => open(installation, id, 'panel', {
      workspaceId,
      agentId
    }, options?.location),
    openScreen: (value: {
      screenId: string;
      params?: Record<string, unknown>;
    }) => open(installation, value.screenId, 'screen', {
      params: value.params
    }),
    openSettings: (id: string) => open(installation, id, 'settings'),
    composers: (selector: {
      agentId?: string;
      focused?: boolean;
    }) => composerSource(installation, installation.store).resolve(selector)
  };
}
function createRuntime(installation: Installation): Record<string, unknown> {
  const context = actionContext(installation);
  const addButton = (placement: PluginButton['placement'], input: Omit<PluginButton, 'key' | 'placement'>) => {
    if (!input.workspaceId || placement === 'composer' && !input.agentId) throw Error('插件按钮缺少明确的工作区或会话');
    if (installation.buttons.some(b => b.placement === placement && b.id === input.id && b.workspaceId === input.workspaceId && b.agentId === input.agentId)) throw Error('插件按钮重复注册');
    const row = {
      ...input,
      key: Date.now() + Math.random(),
      placement
    };
    installation.buttons.push(row);
    publish();
    let active = true;
    return {
      update: (patch: Partial<PluginButton['button']>) => {
        if (active) {
          row.button = {
            ...row.button,
            ...patch
          };
          publish();
        }
      },
      remove: () => {
        if (active) {
          active = false;
          installation.buttons = installation.buttons.filter(b => b !== row);
          publish();
        }
      }
    };
  };
  return {
    ...context,
    paseo: installation.paseo,
    i18n: installation.i18n,
    openSurface: (id: string) => open(installation, id, 'screen'),
    openPanel: (id: string, options: {
      workspaceId: string;
      agentId?: string;
      location?: string;
    }) => open(installation, id, 'panel', options, options.location),
    rpc: context.rpc,
    subscribe: (contract: {
      name: string;
      input: {
        parse: (v: unknown) => unknown;
      };
      event: {
        parseAsync: (v: unknown) => Promise<unknown>;
      };
    }, input: unknown, onEvent: (v: unknown) => void) => {
      contract.input.parse(input);
      return subscribe(installation, contract.name, input, {
        event: value => {
          void contract.event.parseAsync(value).then(onEvent);
        },
        closed: () => {}
      });
    },
    playAudio: async (input: {
      base64: string;
      mimeType: string;
    }) => {
      await new Audio(`data:${input.mimeType};base64,${input.base64}`).play();
    },
    addHeaderButton: (row: Omit<PluginButton, 'key' | 'placement'>) => addButton('header', row),
    addComposerPill: (row: Omit<PluginButton, 'key' | 'placement'>) => addButton('composer', row),
    hosts: installation.hosts
  };
}
const empty = (): Evaluated => ({
  id: '',
  cleanup: () => {},
  surfaces: [],
  settingsScreens: [],
  sidebarViews: [],
  sidebarItems: {
    header: [],
    footer: []
  },
  legacySidebarItems: [],
  workspaceRowBadgeItems: [],
  filePanels: [],
  composerItems: [],
  newWorkspaceItems: [],
  workspacePanels: [],
  commandCenterItems: [],
  clientSlashCommands: [],
  attachmentSources: [],
  themes: [],
  timelineTransformers: [],
  timelineRenderers: []
});
function createState(entry: DesktopPluginEntry, store: ReturnType<typeof useStore>): Record<string, unknown> {
  let current = {
      agents: [] as Array<Record<string, unknown>>,
      workspaces: [] as Array<Record<string, unknown>>,
      projects: [] as Array<Record<string, unknown>>,
      terminals: [] as Array<Record<string, unknown>>
    },
    signature = '';
  const subscribers = new Set<() => void>(),
    paths = new Map<string, Record<string, unknown>>();
  let disposed = false;
  const refresh = () => {
    const agents = store.get(agentSessionsAtom).filter(a => entry.access?.workspaceIds.includes(a.workspaceId ?? '')).map(a => ({
      ...a,
      ref: refs.agent('local', a.id),
      hostId: 'local',
      provider: a.kernelId ?? 'pi',
      metadata: a.pluginMetadata ?? {},
      status: store.get(agentStreamingStatesAtom).get(a.id)?.running ? 'running' : 'idle',
      background: a.pluginBackground===true,
      backgroundWork: {
        count: 0
      },
      parentAgent: null,
      model: a.kernelModelId ?? a.modelId ?? null,
      currentModeId: a.kernelModeId ?? null,
      thinkingOptionId: a.gatewayReasoning?.effort ?? a.modelReasoning?.effort ?? a.reasoningLevel ?? null,
      workspace: refs.workspace('local', a.workspaceId ?? '')
    }));
    if(entry.source==='Tervell 内置功能')agents.push(...store.get(conversationsAtom).map(c=>({...c,id:'chat:'+c.id,ref:refs.agent('local','chat:'+c.id),hostId:'local',provider:'chat',metadata:{},status:'idle',background:false,backgroundWork:{count:0},parentAgent:null,model:c.modelId??null,currentModeId:null,thinkingOptionId:c.reasoning?.effort??null,workspace:refs.workspace('local','builtin-chat')})));
    const workspaces = store.get(agentWorkspacesAtom).filter(w => entry.access?.workspaceIds.includes(w.id)).map(w => ({
      ...w,
      ref: refs.workspace('local', w.id),
      hostId: 'local',
      directory: w.projectRootPath ?? paths.get(w.id)?.directory ?? '',
      projectRootPath: w.projectRootPath ?? paths.get(w.id)?.directory ?? '',
      projectKind: 'directory',
      project: refs.project('local', w.id),
      projectId: w.id,
      projectDisplayName: w.name,
      kind: 'directory',
      status: 'done',
      indicator: 'done',
      labels: w.pluginLabels??[],
      metadata:w.pluginMetadata??{},
      background: false,
      pinnedAt: w.pluginPinnedAt??null,
      branch: w.pluginBaseBranch??null,
      gitRuntime:{currentBranch:w.pluginBaseBranch??null},
      parentAgent: null,
      archivingAt: w.pluginArchivedAt??null,
      diffStat: null
    }));
    if(entry.source==='Tervell 内置功能')workspaces.push({id:'builtin-chat',name:'Chat',slug:'builtin-chat',createdAt:0,updatedAt:0,ref:refs.workspace('local','builtin-chat'),hostId:'local',directory:String(paths.get('builtin-chat')?.directory??''),projectRootPath:String(paths.get('builtin-chat')?.directory??''),projectKind:'directory',project:refs.project('local','builtin-chat'),projectId:'builtin-chat',projectDisplayName:'Chat',kind:'directory',status:'done',indicator:'done',labels:[],metadata:{},background:false,pinnedAt:null,branch:null,parentAgent:null,archivingAt:null,diffStat:null,gitRuntime:{currentBranch:null}});
    const terminals = [...store.get(agentTerminalTabsAtom)].flatMap(([id, rows]) => {
      const session = agents.find(a => a.id === id);
      return session ? rows.map(row => ({
        id: row.terminalId,
        ref: refs.terminal('local', row.terminalId),
        hostId: 'local',
        workspace: refs.workspace('local', session.workspaceId ?? ''),
        title: row.title,
        isScript: false,
        createdAt: null
      })) : [];
    });
    const next = JSON.stringify([agents, workspaces, terminals]);
    if (signature === next) return;
    signature = next;
    current = {
      agents,
      workspaces,
      projects: workspaces.map(w => ({
        ...w,
        ref: refs.project('local', w.id),
        displayName: w.name,
        rootPath: w.directory
      })),
      terminals
    };
    for (const fn of subscribers) fn();
  };
  const offA = store.sub(agentSessionsAtom, refresh),
    offW = store.sub(agentWorkspacesAtom, refresh),
    offT = store.sub(agentTerminalTabsAtom, refresh),
    offS = store.sub(agentStreamingStatesAtom, refresh),offC=store.sub(conversationsAtom,refresh);
  refresh();
  // Managed-project paths are supplied by the guarded host; never guess daily paths in renderer.
  for (const w of current.workspaces) void window.electronAPI.desktopPluginHostCall(entry.manifest.id, 'workspace.get', {
    id: w.id
  }).then(value => {
    if (disposed) return;
    paths.set(String(w.id), value as Record<string, unknown>);
    refresh();
  }).catch(() => {});
  return {
    subscribe: (fn: () => void) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    getSnapshot: () => current,
    getAgent: (id: unknown) => current.agents.find(a => a.id === stringId(id)) ?? null,
    getWorkspace: (id: unknown) => current.workspaces.find(w => w.id === stringId(id)) ?? null,
    getProject: (id: unknown) => current.projects.find(w => w.id === stringId(id)) ?? null,
    getTerminal: (id: unknown) => current.terminals.find(t => t.id === stringId(id)) ?? null,
    dispose: () => {
      disposed = true;
      offA();
      offW();
      offT();
      offS();
      offC();
      subscribers.clear();
    }
  };
}
async function dispose(installation: Installation): Promise<void> {
  installation.lifetime.abort();
  try {
    await installation.cleanup();
  } finally {
    installation.i18n.dispose();
    installation.query.clear();
    (installation.state.dispose as (() => void) | undefined)?.();
    installation.buttons = [];
  }
}
export function NativePluginHost(): null {
  const savedConfig = useAtomValue(desktopPluginStateAtom),workspaces=useAtomValue(agentWorkspacesAtom),
    store = useStore();
  const config={...savedConfig,installed:savedConfig.installed.map(p=>p.access?.runtime==='trusted'&&p.access.allWorkspaces?{...p,access:{...p.access,workspaceIds:workspaces.map(w=>w.id)}}:p)};
  React.useEffect(() => {
    navigate = (target, location) => {
      if (target.kind === 'settings') {
        store.set(pluginSettingsTargetAtom, target);
        store.set(settingsOpenAtom, true);
        return;
      }
      store.set(settingsOpenAtom, false);
      if (target.kind === 'panel' && location === 'explorer') {
        const id = target.agentId ?? store.get(currentAgentSessionIdAtom);
        if (!id) throw Error('请先打开会话再使用项目面板');
        const tab = `plugin:${target.pluginId}/${target.id}` as const;
        store.set(pluginExplorerTargetsAtom, all => ({
          ...all,
          [id]: [...(all[id] ?? []).filter(t => t.pluginId !== target.pluginId || t.id !== target.id), target]
        }));
        store.set(agentDiffPanelTabAtom, all => new Map(all).set(id, tab));
        store.set(currentSessionSidePanelOpenAtom, true);
        return;
      }
      if (target.kind === 'panel') {
        const workspace = target.workspaceId ?? store.get(currentAgentWorkspaceIdAtom);
        if (!workspace) throw Error('插件面板缺少工作区');
        target = {
          ...target,
          workspaceId: workspace
        };
        store.set(pluginWorkspaceTargetsAtom, all => ({
          ...all,
          [workspace]: [...(all[workspace] ?? []).filter(row => row.pluginId !== target.pluginId || row.id !== target.id || row.agentId !== target.agentId), {
            ...target,
            workspaceId: workspace
          }]
        }));
      }
      store.set(pluginMainTargetAtom, target);
    };
    const onAgent = (event: Event) => {
      const id = (event as CustomEvent<{
          agentId: string;
        }>).detail.agentId,
        session = store.get(agentSessionsAtom).find(row => row.id === id);
      if (!session) return;
      const next = openTab(store.get(tabsAtom), {
        type: 'agent',
        sessionId: id,
        title: session.title
      });
      store.set(tabsAtom, next.tabs);
      store.set(activeTabIdAtom, next.activeTabId);
      store.set(appModeAtom, 'agent');
      store.set(activeViewAtom, 'conversations');
      store.set(currentAgentWorkspaceIdAtom, session.workspaceId ?? null);
      store.set(currentAgentSessionIdAtom,id);
      store.set(settingsOpenAtom,false);
      store.set(pluginMainTargetAtom, null);
    };
    window.addEventListener('tervell-native-open-agent', onAgent);
    const onOpen = (event: Event) => {
      const input = (event as CustomEvent<PluginTarget & {
        location?: string;
      }>).detail;
      navigate(input, input.location);
    };
    window.addEventListener('tervell-native-plugin-open', onOpen);
    return () => {
      window.removeEventListener('tervell-native-plugin-open', onOpen);
      window.removeEventListener('tervell-native-open-agent', onAgent);
      navigate = () => {
        throw Error('插件宿主已退出');
      };
    };
  }, [store]);
  React.useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (Object.values(store.get(pluginTabStatesAtom)).some(s => s.modified)) {
        event.preventDefault();
        event.returnValue = '插件中有未保存的更改';
      }
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [store]);
  React.useEffect(() => window.electronAPI.onDesktopPluginTimelineChanged(({
    sessionId
  }) => {
    store.set(agentMessageRefreshAtom, all => new Map(all).set(sessionId, (all.get(sessionId) ?? 0) + 1));
  }), [store]);
  React.useEffect(() => {
    let previous = pluginProps(),
      frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = pluginProps();
        if (next !== previous) {
          previous = next;
          publish();
        }
      });
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    window.addEventListener('resize', refresh);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', refresh);
    };
  }, []);
  const signature = JSON.stringify(config.installed.map(p => [p.manifest.id, p.digest, p.enabled, p.access, p.config,config.runtime?.find(status=>status.id===p.manifest.id)?.client]));
  React.useEffect(() => {
    let current = true;
    const run = async () => {
      const entries = config.installed.filter(p => p.enabled && (p.manifest.runtime?.clientEntry||p.manifest.runtime?.discoverEntriesAfterBuild&&config.runtime?.some(status=>status.id===p.manifest.id&&status.client===true))),
        keep = snapshot.filter(p => entries.some(e => e.manifest.id === p.id && e.digest === p.entry.digest && JSON.stringify(e.access) === JSON.stringify(p.entry.access) && JSON.stringify(e.config) === JSON.stringify(p.entry.config)));
      const removed = snapshot.filter(p => !keep.includes(p));
      for (const p of removed) {
        store.set(pluginTabStatesAtom, all => Object.fromEntries(Object.entries(all).filter(([key]) => {
          try {
            return JSON.parse(key)[0] !== p.id;
          } catch {
            return false;
          }
        })));
        store.set(pluginWorkspaceTargetsAtom, all => Object.fromEntries(Object.entries(all).map(([id, rows]) => [id, rows.filter(row => row.pluginId !== p.id)])));
        store.set(pluginExplorerTargetsAtom, all => Object.fromEntries(Object.entries(all).map(([id, rows]) => [id, rows.filter(row => row.pluginId !== p.id)])));
        store.set(pluginDiagnosticAtom, all => {
          const next = {
            ...all
          };
          delete next[p.id];
          return next;
        });
        if (store.get(pluginMainTargetAtom)?.pluginId === p.id) store.set(pluginMainTargetAtom, null);
        if (store.get(pluginSidebarViewTargetAtom)?.pluginId === p.id) store.set(pluginSidebarViewTargetAtom, null);
        if (store.get(pluginSettingsTargetAtom)?.pluginId === p.id) store.set(pluginSettingsTargetAtom, null);
      }
      snapshot = keep;
      publish();
      await Promise.allSettled(removed.map(dispose));
      if (!current) return;
      for (const entry of entries) {
        if (!current || snapshot.some(p => p.id === entry.manifest.id)) continue;
        const installation = {
          ...empty(),
          id: entry.manifest.id,
          entry,
          store,
          query: new QueryClient(),
          buttons: [],
          lifetime: new AbortController(),
          i18n: new pluginHost.PluginTranslationRuntime({
            getLocale: () => 'zh-CN',
            subscribe: () => () => {}
          }),
          state: {},
          paseo: {},
          invoke: (name: string, input: unknown) => window.electronAPI.desktopPluginRpc(entry.manifest.id, name, input)
        } as Installation;
        try {
          installation.state = createState(entry, store);
          installation.paseo = createApi(installation);
          const source = await window.electronAPI.desktopPluginClient(entry.manifest.id);
          if (!current) {
            await dispose(installation);
            return;
          }
          const evaluated = entry.manifest.runtime?.ecosystem === 'dsh' ? await createDshContributions(installation, source, publish) : runPluginClientBundle(installation.id, source, createRuntime(installation), publish);
          Object.assign(installation, evaluated);
          snapshot = [...snapshot, installation];
          store.set(pluginDiagnosticAtom, all => ({
            ...all,
            [installation.id]: {
              placements: [...(installation.surfaces.length ? ['页面'] : []), ...(installation.workspacePanels.length ? ['工作区标签'] : []), ...(installation.settingsScreens.length ? ['设置页'] : []), ...(installation.timelineTransformers.length ? ['时间线变换'] : []), ...(installation.composerItems.length ? ['输入控件'] : []), ...(installation.filePanels.length ? ['文件查看器'] : []), ...(installation.commandCenterItems.length ? ['命令'] : []), ...(installation.legacySidebarItems.length || installation.sidebarItems.header.length || installation.sidebarViews.length ? ['侧栏'] : [])]
            }
          }));
          publish();
        } catch (error) {
          await dispose(installation).catch(() => {});
          installation.error = String(error);
          store.set(pluginDiagnosticAtom, all => ({
            ...all,
            [installation.id]: {
              error: installation.error,
              placements: []
            }
          }));
          snapshot = [...snapshot, installation];
          publish();
        }
      }
    };
    reconcile = reconcile.catch(() => {}).then(async () => {
      if (current) await run();
    });
    return () => {
      current = false;
    };
  }, [signature, store]);
  React.useEffect(() => () => {
    const all = snapshot;
    snapshot = [];
    publish();
    void Promise.allSettled(all.map(dispose));
  }, []);
  return null;
}
export function PluginProvider({
  installation,
  children
}: {
  installation: Installation;
  children: React.ReactNode;
}): React.ReactElement {
  const subscribeRpc = React.useCallback((method: string, input: unknown, observer: {
    event: (value: unknown) => void;
    closed: (error?: Error) => void;
  }) => subscribe(installation, method, input, observer), [installation]);
  return <QueryClientProvider client={installation.query}><pluginHost.PaseoApiProvider paseo={installation.paseo}><pluginHost.PluginRpcProvider invoke={installation.invoke} subscribe={subscribeRpc}><pluginHost.PluginTranslationProvider runtime={installation.i18n}><pluginHost.PluginClientStateProvider source={installation.state}><pluginHost.PluginComposersProvider source={composerSource(installation, installation.store)}>{children}</pluginHost.PluginComposersProvider></pluginHost.PluginClientStateProvider></pluginHost.PluginTranslationProvider></pluginHost.PluginRpcProvider></pluginHost.PaseoApiProvider></QueryClientProvider>;
}
class Boundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}, {
  error: string;
}> {
  override state = {
    error: ''
  };
  static getDerivedStateFromError(error: unknown) {
    return {
      error: String(error)
    };
  }
  override render() {
    return this.state.error ? this.props.fallback ?? <p role="alert" className="p-3 text-sm text-destructive">{this.state.error}</p> : this.props.children;
  }
}
export function PluginComponent({
  installation,
  row,
  props = {},
  fallback
}: {
  fallback?: React.ReactNode;
  installation: Installation;
  row: Contribution;
  props?: Record<string, unknown>;
}): React.ReactElement | null {
  const C = row.Component;

  const ref=React.useRef<HTMLDivElement>(null),[width,setWidth]=React.useState<number>();
  React.useLayoutEffect(()=>{const node=ref.current;if(!node)return;const measure=()=>setWidth(node.getBoundingClientRect().width);measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect()},[]);
  const host=pluginProps();
  if(!C)return null;
  return <Boundary key={installation.id + '/' + row.id} fallback={fallback}><PluginProvider installation={installation}><PluginUiTitleContext.Provider value={pluginText(installation,row.title,row.id)}><div ref={ref} className="flex min-h-0 min-w-0 flex-1 flex-col" data-native-plugin-component={installation.id+'/'+row.id}><C {...host} {...props} layout={{...(host.layout as object),compact:(width??innerWidth)<700}} /></div></PluginUiTitleContext.Provider></PluginProvider></Boundary>;
}
const COLOR_TOKENS = {
  surface0: 'background',
  surface1: 'card',
  surface2: 'muted',
  surface3: 'muted',
  foreground: 'foreground',
  foregroundMuted: 'muted-foreground',
  accent: 'primary',
  accentForeground: 'primary-foreground',
  border: 'border',
  statusDanger: 'destructive',
  statusSuccess: 'primary',
  statusWarning: 'foreground'
} as const;
let propsSignature = '',
  hostProps: Record<string, unknown> | undefined;
/** RNW 会解析颜色而非透传 CSS var；使用实际 RGB，保持主题对象在颜色未变时稳定。 */
export function pluginProps(): Record<string, unknown> {
  const root = document.documentElement,
    style = getComputedStyle(root),
    compact = innerWidth < 800,
    signature = JSON.stringify([compact,style.fontFamily,style.fontSize,style.getPropertyValue('--tervell-code-font'),style.getPropertyValue('--tervell-code-font-size'),...['--user-ui-font','--user-ui-size','--user-code-font','--user-code-size','--user-conversation-size'].map(key=>style.getPropertyValue(key)), ...Object.values(COLOR_TOKENS).map(name => style.getPropertyValue('--' + name).trim())]);
  if (hostProps && signature === propsSignature) return hostProps;
  const probe = document.createElement('span');
  probe.style.display = 'none';
  root.append(probe);
  const colors: Record<string, string> = {};
  for (const [key, token] of Object.entries(COLOR_TOKENS)) {
    probe.style.color = `hsl(var(--${token}))`;
    colors[key] = getComputedStyle(probe).color;
  }
  probe.remove();
  propsSignature = signature;
  hostProps = {
    theme: {
      colors,typography:{fontFamily:{ui:(style.getPropertyValue('--user-ui-font')||style.fontFamily).trim(),mono:(style.getPropertyValue('--user-code-font')||style.getPropertyValue('--tervell-code-font')).trim()||'ui-monospace, SFMono-Regular, Menlo, monospace'},fontSize:{ui:parseFloat(style.getPropertyValue('--user-ui-size'))||14,content:parseFloat(style.getPropertyValue('--user-conversation-size')||style.getPropertyValue('--tervell-content-font-size'))||15,code:parseFloat(style.getPropertyValue('--user-code-size')||style.getPropertyValue('--tervell-code-font-size'))||13}}
    },
    layout: {
      compact,
      platform: 'web'
    },
    host: {
      id: 'local',
      label: '本机'
    },
    params: {}
  };
  return hostProps;
}
export { Icon };
function subscribe(p: Installation, name: string, input: unknown, observer: {
  event: (v: unknown) => void;
  closed: (error?: Error) => void;
}) {
  let active = true,
    id = '',
    timer: ReturnType<typeof setTimeout> | undefined;
  const call = (action: string) => p.invoke('__tervell_subscription', {
    action,
    id,
    name,
    input
  });
  const ready = call('start').then(value => {
    id = String((value as {
      id: string;
    }).id);
    const poll = async () => {
      if (!active) return;
      try {
        const result = (await call('poll')) as {
          events: unknown[];
          closed: boolean;
          error?: string;
        };
        for (const event of result.events) observer.event(event);
        if (result.closed) {
          active = false;
          observer.closed(result.error ? new Error(result.error) : undefined);
          return;
        }
        timer = setTimeout(() => void poll(), 150);
      } catch (error) {
        active = false;
        observer.closed(error instanceof Error ? error : new Error(String(error)));
      }
    };
    void poll();
  }).catch(error => {
    active = false;
    observer.closed(error instanceof Error ? error : new Error(String(error)));
    throw error;
  });
  void ready.catch(() => {});
  const release = async () => {
    active = false;
    if (timer) clearTimeout(timer);
    await ready.catch(() => {});
    if (id) await call('stop').catch(() => {});
  };
  p.lifetime.signal.addEventListener('abort', () => void release(), {
    once: true
  });
  return Object.assign(() => void release(), {
    ready,
    release
  });
}
