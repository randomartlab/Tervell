import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Puzzle, ChevronRight, Terminal, Settings as SettingsIcon } from 'lucide-react';
import { runPluginClientBundle, pluginHost, QueryClient, QueryClientProvider, transformTimelineItem } from '@tervell/plugin-runtime';
import {usesNativeMessageLayout} from '@tervell/native-layout-policy';
import type { Evaluated, Contribution, TranslationRuntime } from '@tervell/plugin-runtime';
import { createLocalPaseoDriver } from '@tervell/plugin-driver';
import { createPaseoApi } from '@tervell/plugin-api';
import { control, readable, plain, native, list, unpackResult } from './bridge';
import type { RecordValue } from './bridge';
import type { Session, Workspace } from './model';
import { Busy, Notice, Empty, Sheet } from './ui';
import { mobileBundledPlugin } from './default-plugin-bundles';
import { PluginTitle } from './plugin-ui';
import {validatePluginResource} from './plugin-resources';
import type {ComposerAttachment, PluginResource} from './plugin-resources';
interface MobilePluginButton {
  id: string;
  workspaceId: string;
  agentId?: string;
  placement: 'header' | 'composer';
  button: RecordValue;
}
interface Installed extends Evaluated {
  name: string;
  digest: string;
  buttons: MobilePluginButton[];
  invoke: (name: string, input: unknown) => Promise<unknown>;
  paseo: Record<string, unknown>;
  state: RecordValue;
  i18n: TranslationRuntime;
  query: QueryClient;
  stop: () => Promise<void>;
}
function pluginText(p: Installed, value: unknown, fallback = ''): string {
  try {
    const text = typeof value === 'function' ? (value as (params: RecordValue) => unknown)({}) : value;
    if (typeof text === 'string') return text || fallback;
    return text ? p.i18n.resolve(text) : fallback;
  } catch {
    return fallback;
  }
}
const refs = pluginHost.createEntityRefs(),
  listeners = new Set<() => void>();
let revision = 0,
  instances: Installed[] = [],
  current: {
    sessions: Session[];
    workspaces: Workspace[];
    sessionId?: string;
    detail: RecordValue;
    attachments: ComposerAttachment[];
    addResource: (pluginId: string, sourceId: string, item: PluginResource) => void;
    removeResource: (pluginId: string, sourceId: string, itemId: string) => void;
    refreshDetail: () => Promise<void>;
    draft: string;
    setDraft: (text: string) => void;
    openSession: (id: string) => void;
  } = {
    sessions: [],
    workspaces: [],
    draft: '',
    detail: {},
    attachments: [],
    addResource: () => {},
    removeResource: () => {},
    refreshDetail: async () => {},
    setDraft: () => {},
    openSession: () => {}
  };
const publish = () => {
  revision++;
  for (const l of listeners) l();
};
let stateSnapshot: RecordValue = {
  agents: [],
  projects: [],
  workspaces: [],
  terminals: []
};
export function updateMobilePluginContext(value: typeof current) {
  current = value;
  const workspaces = value.workspaces.map(w => ({
    ...w,
    ref: refs.workspace('local', w.id),
    hostId: 'local',
    directory: '',
    projectRootPath: '',
    kind: 'directory',
    project: refs.project('local', w.id),
    projectId: w.id,
    projectDisplayName: w.name,
    status: 'done',
    indicator: 'done',
    labels: [],
    metadata: {},
    background: false,
    diffStat: null,
    archivingAt: null
  }));
  const agents = value.sessions.map(s => ({
    ...s,
    ref: refs.agent('local', s.id),
    hostId: 'local',
    workspace: refs.workspace('local', s.workspaceId),
    provider: s.kernelId ?? 'pi',
    status: s.running ? 'running' : 'idle',
    metadata: {},
    background: false,
    parentAgent: null,
    backgroundWork: {
      count: 0
    },
    model: s.modelId ?? null
  }));
  stateSnapshot = {
    agents,
    workspaces,
    projects: workspaces,
    terminals: []
  };
  publish();
}
function identify(value: unknown) {
  return typeof value === 'string' ? value : String(plain(value).id ?? '');
}
const source = {
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot: () => stateSnapshot,
  getAgent: (ref: unknown) => list<RecordValue>(stateSnapshot.agents).find(a => a.id === identify(ref)) ?? null,
  getWorkspace: (ref: unknown) => list<RecordValue>(stateSnapshot.workspaces).find(a => a.id === identify(ref)) ?? null,
  getProject: (ref: unknown) => list<RecordValue>(stateSnapshot.projects).find(a => a.id === identify(ref)) ?? null,
  getTerminal: () => null
};
const composerCache = new Map<string, {
  signature: string;
  list: readonly unknown[];
}>();
const composerDetails = new Map<string, RecordValue>();
function composers(selector: {
  agentId?: string;
  focused?: boolean;
}, pluginId: string) {
  const id = selector.agentId ?? current.sessionId,
    session = current.sessions.find(s => s.id === id);
  if (!id || !session) return EMPTY_COMPOSERS;
  const key = pluginId + ':' + id;
  const detail = current.sessionId === id ? current.detail : {}, projected = composerDetails.get(key);
  const signature = JSON.stringify([id, current.sessionId, current.draft, session, detail, projected, current.attachments]),
    cached = composerCache.get(key);
  if (cached?.signature === signature) return cached.list;
  const input = () => document.querySelector<HTMLTextAreaElement>('.composer textarea');
  const hostCall = async (method: string, values: RecordValue) => {
    const result = await unpackResult(await control('plugins.mobile-host', {
      pluginId,
      method,
      input: {
        id,
        ...values
      }
    }));
    const refreshed = plain(await unpackResult(await control('plugins.mobile-host', {pluginId, method: 'agent.get', input: {id}})));
    composerDetails.set(key, refreshed);
    await current.refreshDetail();
    publish();
    return result;
  };
  const value = {
    context: session.status === 'draft' ? 'draft' : 'agent',
    prompt: id === current.sessionId ? current.draft : '',
    attachments: id === current.sessionId ? current.attachments.filter(row => row.pluginId === pluginId && row.item).map(row => ({sourceId: row.sourceId, item: row.item})) : [],
    agent: {
      provider: session.kernelId ?? 'pi',
      model: projected?.model ?? detail.modelId ?? session.modelId ?? null,
      mode: projected?.currentModeId ?? detail.modeId ?? null,
      thinking: projected?.thinkingOptionId ?? plain(detail.gatewayReasoning).effort ?? plain(detail.modelReasoning).effort ?? null,
      options: projected?.options ?? plain(detail.configValues),
      metadata: plain(projected?.metadata)
    },
    setPrompt: (text: string) => {
      if (id !== current.sessionId) throw Error('请先打开此会话');
      current.setDraft(text);
    },
    insertText: (text: string) => {
      if (id !== current.sessionId) throw Error('请先打开此会话');
      const el = input(),
        a = el?.selectionStart ?? current.draft.length,
        b = el?.selectionEnd ?? a;
      current.setDraft(current.draft.slice(0, a) + text + current.draft.slice(b));
      requestAnimationFrame(() => {
        input()?.setSelectionRange(a + text.length, a + text.length);
      });
    },
    focus: async (options?: {
      selection?: {
        start: number;
        end: number;
      };
    }) => {
      if (id !== current.sessionId) current.openSession(id);
      await new Promise<void>((resolve, reject) => {
        const begin = Date.now();
        const attempt = () => {
          const el = input();
          if (el && current.sessionId === id) {
            el.focus();
            if (options?.selection) el.setSelectionRange(options.selection.start, options.selection.end);
            if (document.activeElement === el) {
              resolve();
              return;
            }
          }
          if (Date.now() - begin > 2500) reject(Error('无法聚焦输入区'));else requestAnimationFrame(attempt);
        };
        attempt();
      });
    },
    setProvider: (provider: string) => control('session.kernel', {
      kernelId: provider
    }, {
      sessionId: id
    }),
    setModel: (model: string) => hostCall('agent.options', {
      patch: {
        model
      }
    }),
    setMode: (mode: string) => hostCall('agent.options', {
      patch: {
        mode
      }
    }),
    setThinking: (thinking: string) => hostCall('agent.options', {
      patch: {
        thinkingOption: thinking
      }
    }),
    setOptions: (options: RecordValue) => hostCall('agent.options', {
      patch: options
    }),
    setMetadata: (metadata: RecordValue) => hostCall('agent.metadata', {
      metadata
    }),
    addAttachment: (value: {sourceId: string; item: unknown}) => {
      if (id !== current.sessionId) throw Error('请先打开此会话');
      const owner = instances.find(p => p.id === pluginId);
      if (!owner?.attachmentSources.some(row => row.id === value.sourceId)) throw Error('插件未注册此附件源');
      current.addResource(pluginId, value.sourceId, validatePluginResource(value.item));
    },
    removeAttachment: (value: {sourceId: string; itemId: string}) => {
      if (id !== current.sessionId) throw Error('请先打开此会话');
      current.removeResource(pluginId, value.sourceId, value.itemId);
    }
  };
  const values = Object.freeze([value]);
  composerCache.set(key, {
    signature,
    list: values
  });
  return values;
}
const EMPTY_COMPOSERS = Object.freeze([]);
const composerSource = (pluginId: string) => ({
  subscribe: (_selector: unknown, fn: () => void) => source.subscribe(fn),
  resolve: (selector: {agentId?: string; focused?: boolean}) => composers(selector, pluginId)
});
interface Target {
  installation: Installed;
  row: Contribution;
}
let navigate: (target: Target | undefined) => void = () => {};
let clientLoading:Promise<void>|undefined;
export async function stopMobilePlugins() {
  const all = instances;
  instances = [];
  composerCache.clear();
  composerDetails.clear();
  publish();
  await Promise.allSettled(all.map(p => p.stop()));
}
export function pluginHostProps() {
  const style = getComputedStyle(document.documentElement),
    color = (key: string) => {
      const e = document.createElement('i');
      e.style.color = style.getPropertyValue(key);
      document.body.append(e);
      const result = getComputedStyle(e).color;
      e.remove();
      return result;
    };
  const foreground = color('--fg'),
    muted = color('--muted'),
    surface = color('--surface'),
    surface2 = color('--surface-2'),
    bg = color('--bg'),
    accent = color('--primary'),
    border = color('--border');
  return {
    theme: {
      colors: {
        foreground,
        foregroundMuted: muted,
        foregroundSubtle: muted,
        surface0: bg,
        surface1: surface,
        surface2,
        surface3: surface2,
        border,
        borderMuted: border,
        accent,
        accentForeground: color('--primary-ink'),
        statusSuccess: accent,
        statusError: color('--danger'),
        statusWarning: '#bc8b3d'
      },
      typography: {
        fontFamily: {
          ui: style.fontFamily,
          mono: 'monospace'
        },
        fontSize: {
          ui: parseFloat(style.getPropertyValue('--ui-size')) || 14,
          content: parseFloat(style.getPropertyValue('--body-size')) || 16,
          code: parseFloat(style.getPropertyValue('--code-size')) || 13
        }
      }
    },
    layout: {
      compact: innerWidth < 760,
      platform: 'web'
    },
    host: {
      id: 'local',
      label: '已配对电脑'
    },
    params: {}
  };
}
export function useMobilePlugins() {
  useSyncExternalStore(fn => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, () => revision);
  return instances;
}
export function PluginProvider({
  installation,
  children
}: {
  installation: Installed;
  children: React.ReactNode;
}) {
  const P = pluginHost;
  return <QueryClientProvider client={installation.query}><P.PluginTranslationProvider runtime={installation.i18n}><P.PaseoApiProvider paseo={installation.paseo}><P.PluginClientStateProvider source={source}><P.PluginRpcProvider invoke={installation.invoke} subscribe={(name: string, input: unknown, observer: {
            event?: (e: unknown) => void;
            closed?: () => void;
          }) => {
            let alive = true,
              timer: ReturnType<typeof setTimeout>,
              subId = '';
            const ready = installation.invoke('__tervell_subscription', {
              action: 'start',
              name,
              input
            }).then(value => {
              subId = String(plain(value).id);
              const poll = async () => {
                if (!alive) return;
                try {
                  const r = plain(await installation.invoke('__tervell_subscription', {
                    action: 'poll',
                    id: subId
                  }));
                  for (const e of list(r.events)) observer.event?.(e);
                } finally {
                  if (alive) timer = setTimeout(() => void poll(), 1000);
                }
              };
              void poll();
            });
            return {
              ready,
              unsubscribe: () => {
                alive = false;
                clearTimeout(timer);
                if (subId) void installation.invoke('__tervell_subscription', {
                  action: 'stop',
                  id: subId
                });
              }
            };
          }}><P.PluginComposersProvider source={composerSource(installation.id)}><P.PluginComposerProvider composer={current.sessionId ? composers({
                agentId: current.sessionId
              }, installation.id)[0] : null}>{children}</P.PluginComposerProvider></P.PluginComposersProvider></P.PluginRpcProvider></P.PluginClientStateProvider></P.PaseoApiProvider></P.PluginTranslationProvider></QueryClientProvider>;
}
export function PluginSurface({
  target
}: {
  target: Target;
}) {
  const C = target.row.Component;
  if (!C) return <Empty title="插件未提供页面组件" />;
  return <PluginBoundary><PluginProvider installation={target.installation}><PluginTitle.Provider value={pluginText(target.installation, target.row.title, target.row.id)}><C {...pluginHostProps()} context={current.sessionId ? 'agent' : 'workspace'} workspaceId={current.sessions.find(s => s.id === current.sessionId)?.workspaceId ?? current.workspaces[0]?.id} agentId={current.sessionId} navigation={{
          openAgent: (ref: RecordValue) => {
            navigate(undefined);
            current.openSession(String(ref.agentId ?? ref.id ?? ''));
          },
          openWorkspace: (ref: RecordValue) => {
            const next = current.sessions.find(s => s.workspaceId === String(ref.workspaceId ?? ref.id));
            if (next) {
              navigate(undefined);
              current.openSession(next.id);
            }
          },
          openProject: (ref: unknown) => {
            navigate(undefined);
            window.dispatchEvent(new CustomEvent('mobile-open-project', {detail: {id: identify(ref)}}));
          },
          openTerminal: () => window.dispatchEvent(new CustomEvent('mobile-open-terminal'))
        }} openScreen={(input: {
          screenId: string;
        }) => {
          const row = target.installation.surfaces.find(r => r.id === input.screenId);
          if (row) navigate({
            installation: target.installation,
            row
          });
        }} close={() => navigate(undefined)} /></PluginTitle.Provider></PluginProvider></PluginBoundary>;
}
export function PluginBrowser({
  visible = true,
  onClose = () => {}
}: {
  visible?: boolean;
  onClose?: () => void;
}) {
  const plugins = useMobilePlugins(),
    [target, setTarget] = useState<Target>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    navigate = t => setTarget(t);
    return () => {
      navigate = () => {};
    };
  }, []);
  const loadClients = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await control('plugins.mobile-clients');
      const activeIds = new Set(list<{
        id: string;
      }>(r.entries).map(p => p.id));
      for (const old of instances.filter(p => !activeIds.has(p.id))) {
        await old.stop();
      }
      instances = instances.filter(p => activeIds.has(p.id));
      publish();
      for (const row of list<{
        id: string;
        name: string;
        digest: string;
      }>(r.entries)) {
        if (instances.some(i => i.id === row.id && i.digest === row.digest)) continue;
        const old = instances.find(i => i.id === row.id);
        if (old) {
          await old.stop();
          instances = instances.filter(i => i !== old);
        }
        let bundle = '',
          offset = 0;
        const localBundle = mobileBundledPlugin(row.id);
        const localDigest = localBundle ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(localBundle)))).map(b => b.toString(16).padStart(2, '0')).join('') : '';
        let bundleRevision = '';
        for (let i = 0; i < 3000; i++) {
          const chunk = await control('plugins.mobile-bundle', {
            pluginId: row.id,
            offset,
            ...(bundleRevision ? {
              revision: bundleRevision
            } : {})
          });
          bundleRevision = String(chunk.revision);
          if (localBundle && localDigest === bundleRevision) {
            bundle = localBundle;
            break;
          }
          bundle += String(chunk.content ?? '');
          offset = bundle.length;
          if (!chunk.hasMore) break;
        }
        if (!bundle) throw Error('插件没有客户端代码');
        const computed = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bundle)))).map(b => b.toString(16).padStart(2, '0')).join('');
        if (computed !== bundleRevision) throw Error('插件代码完整性校验失败');
        const lifetime = new AbortController(),
          query = new QueryClient();
        const invoke = async (name: string, input: unknown) => {
          const response = await control('plugins.mobile-rpc', {
            pluginId: row.id,
            name,
            input
          });
          return unpackResult(response);
        };
        const driver = createLocalPaseoDriver(async (method, input) => {
            const r = await control('plugins.mobile-host', {
              pluginId: row.id,
              method,
              input: plain(input)
            });
            return unpackResult(r);
          }, {
            serverId: 'local',
            interval: 3000
          }),
          paseo = createPaseoApi(driver, {
            signal: lifetime.signal
          });
        pluginHost.createPluginReferenceApi({
          paseo,
          resolveHost: (id: string) => {
            if (id !== 'local') throw Error('请先在手机切换到目标电脑');
            return paseo;
          },
          readProject: source.getProject,
          navigation: {
            openAgent: (ref: unknown) => current.openSession(identify(ref)),
            openWorkspace: (ref: unknown) => {
              const next = current.sessions.find(s => s.workspaceId === identify(ref));
              if (next) current.openSession(next.id);
              else window.dispatchEvent(new CustomEvent('mobile-open-project', {detail: {id: identify(ref)}}));
            },
            openProject: (ref: unknown) => window.dispatchEvent(new CustomEvent('mobile-open-project', {detail: {id: identify(ref)}})),
            openTerminal: () => window.dispatchEvent(new CustomEvent('mobile-open-terminal'))
          }
        });
        const i18n = new pluginHost.PluginTranslationRuntime({
          getLocale: () => 'zh-CN',
          subscribe: () => () => {}
        });
        let installation: Installed;
        const open = (id: string, kind: string) => {
          const rows = kind === 'settings' ? installation.settingsScreens : kind === 'panel' ? installation.workspacePanels : installation.surfaces,
            found = rows.find(r => r.id === id);
          if (found) setTarget({
            installation,
            row: found
          });
        };
        const buttons: MobilePluginButton[] = [];
        const register = (placement: MobilePluginButton['placement'], row: Omit<MobilePluginButton, 'placement'>) => {
          const existing=buttons.find(b=>b.placement===placement&&b.id===row.id&&b.agentId===row.agentId&&b.workspaceId===row.workspaceId);
          if(existing)buttons.splice(buttons.indexOf(existing),1);
          const entry = {
            ...row,
            placement
          };
          buttons.push(entry);
          publish();
          let active = true;
          return {
            update: (patch: RecordValue) => {
              if (active) {
                entry.button = {
                  ...entry.button,
                  ...patch
                };
                publish();
              }
            },
            remove: () => {
              if (active) {
                active = false;
                const index=buttons.indexOf(entry);if(index>=0)buttons.splice(index, 1);
                publish();
              }
            }
          };
        };
        const evaluated = runPluginClientBundle(row.id, bundle, {
          paseo,
          i18n,
          rpc: (contract: {
            name: string;
          }, input: unknown) => invoke(contract.name, input),
          subscribe: (contract: {
            name: string;
            input: {
              parse: (v: unknown) => unknown;
            };
            event: {
              parseAsync: (v: unknown) => Promise<unknown>;
            };
          }, value: unknown, onEvent: (v: unknown) => void) => {
            contract.input.parse(value);
            return startSubscription(invoke, contract.name, value, {
              event: v => {
                void contract.event.parseAsync(v).then(onEvent);
              }
            });
          },
          hosts: {
            getPaseoClient: () => paseo,
            subscribe: source.subscribe,
            getSnapshot: () => [{
              serverId: 'local',
              label: '已配对电脑',
              status: 'online'
            }]
          },
          composers: (selector: {agentId?: string; focused?: boolean}) => composers(selector, row.id),
          openPanel: (id: string) => open(id, 'panel'),
          openScreen: (input: {
            screenId: string;
          }) => open(input.screenId, 'screen'),
          openSurface: (id: string) => open(id, 'screen'),
          openSettings: (id: string) => open(id, 'settings'),
          addHeaderButton: (row: Omit<MobilePluginButton, 'placement'>) => register('header', row),
          addComposerPill: (row: Omit<MobilePluginButton, 'placement'>) => register('composer', row),
          playAudio: () => Promise.reject(Error('请使用手机系统音频服务'))
        }, publish);
        installation = {
          ...evaluated,
          name: row.name,
          digest: row.digest,
          buttons,
          invoke,
          paseo,
          state: source,
          i18n,
          query,
          stop: async () => {
            lifetime.abort();
            await evaluated.cleanup();
            await driver.close();
            query.clear();
            i18n.dispose();
          }
        };
        instances.push(installation);
        publish();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const load=()=>{if(clientLoading)return clientLoading;const pending=loadClients();clientLoading=pending;return pending.finally(()=>{if(clientLoading===pending)clientLoading=undefined;});};
  useEffect(() => {
    if (!instances.length) void load();
  }, []);
  return <>{visible && <Sheet title="插件与工作区面板" onClose={onClose} wide><Notice text={error} /><p className="muted">从已授权电脑加载原始 Paseo 客户端贡献，在手机工作区内打开。需要整机授权；插件代码属于受信任代码。</p><button className="full" disabled={busy} onClick={() => void load()}>{busy ? '加载插件客户端…' : '刷新插件入口'}</button>{busy && <Busy text="首次传输插件离线代码…" />}{plugins.map(p => <section key={p.id} className="plugin-section"><h3>{p.name}</h3>{[...p.surfaces, ...p.workspacePanels, ...p.settingsScreens, ...p.sidebarViews].map(row => <button className="setting-row" key={row.id} onClick={() => setTarget({
          installation: p,
          row
        })}><Puzzle size={18} /><span>{pluginText(p, row.title, row.id)}</span><ChevronRight size={17} /></button>)}</section>)}</Sheet>}{target && <Sheet title={pluginText(target.installation, target.row.title, target.row.id)} onClose={() => setTarget(undefined)} wide><PluginSurface target={target} /></Sheet>}</>;
}
function startSubscription(invoke: Installed['invoke'], name: string, input: unknown, observer: {
  event?: (v: unknown) => void;
  closed?: (error?: Error) => void;
}) {
  let alive = true,
    id = '',
    timer: ReturnType<typeof setTimeout>;
  const ready = invoke('__tervell_subscription', {
    action: 'start',
    name,
    input
  }).then(async value => {
    id = String(plain(value).id);
    if (!alive) {
      await invoke('__tervell_subscription', {
        action: 'stop',
        id
      });
      return;
    }
    const poll = async () => {
      try {
        const r = plain(await invoke('__tervell_subscription', {
          action: 'poll',
          id
        }));
        if (alive) for (const e of list(r.events)) observer.event?.(e);
      } catch (error) {
        alive = false;
        observer.closed?.(error instanceof Error ? error : Error(String(error)));
      } finally {
        if (alive) timer = setTimeout(() => void poll(), 1500);
      }
    };
    void poll();
  });
  return {
    ready,
    unsubscribe: () => {
      alive = false;
      clearTimeout(timer);
      if (id) void invoke('__tervell_subscription', {
        action: 'stop',
        id
      }).catch(() => {});
    }
  };
}
class PluginBoundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}, {
  error: string;
}> {
  state = {
    error: ''
  };
  static getDerivedStateFromError(error: unknown) {
    return {
      error: String(error)
    };
  }
  render() {
    return this.state.error ? this.props.fallback ?? <Notice text={this.state.error} /> : this.props.children;
  }
}
export function MobilePluginControls({
  placement
}: {
  placement: 'composer' | 'header';
}) {
  const all = useMobilePlugins(),
    [error, setError] = useState(''),
    [popover, setPopover] = useState<{
      p: Installed;
      button: RecordValue;
    }>();
  const agent = current.sessions.find(s => s.id === current.sessionId);
  const run = async (p: Installed, button: RecordValue) => {
    try {
      setError('');
      const behavior = plain(button.behavior);
      if (behavior.kind === 'action') await (behavior.onPress as () => unknown)();else if (behavior.kind === 'popover') setPopover({
        p,
        button
      });else if (behavior.kind === 'menu') setPopover({
        p,
        button
      });else throw Error('插件按钮缺少行为');
    } catch (e) {
      setError(String(e));
    }
  };
  const controls = all.flatMap(p => p.buttons.filter(b => b.placement === placement && b.workspaceId === agent?.workspaceId && (!b.agentId || b.agentId === agent?.id) && b.button.visible !== false).map(b => ({
    p,
    b
  })));
  return <><Notice text={error} />{controls.map(({
      p,
      b
    }) => <button key={p.id + b.id} className="plugin-pill" disabled={b.button.disabled === true} title={pluginText(p, b.button.title, b.id)} onClick={() => void run(p, b.button)}>{pluginText(p, b.button.label ?? b.button.title, b.id)}</button>)}{popover && <Sheet title={pluginText(popover.p, popover.button.title)} onClose={() => setPopover(undefined)}><PluginProvider installation={popover.p}><PluginBoundary>{(() => {
            const b = plain(popover.button.behavior),
              C = b.Content as React.ElementType;
            return b.kind === 'popover' && C ? <C {...pluginHostProps()} workspaceId={agent?.workspaceId} agentId={agent?.id} context="agent" close={() => setPopover(undefined)} /> : list<RecordValue>(b.items).filter(i => i.kind !== 'separator' && i.visible !== false).map(i => <button className="setting-row" key={String(i.id)} onClick={() => void run(popover.p, i)}>{pluginText(popover.p, i.title)}</button>);
          })()}</PluginBoundary></PluginProvider></Sheet>}</>;
}
export async function submitMobilePluginSlash(text: string): Promise<boolean> {
  const match = /^\/([a-z][\w-]*)(?:\s+([\s\S]*))?$/.exec(text.trim());
  if (!match) return false;
  for (const p of instances) {
    const row = p.clientSlashCommands.find(r => r.name === match[1]);
    if (!row?.onSubmit) continue;
    const agent = current.sessions.find(s => s.id === current.sessionId);
    if (!agent) throw Error('请先打开会话');
    await row.onSubmit({
      context: 'agent',
      args: match[2] ?? '',
      paseo: p.paseo,
      agent: source.getAgent(agent.id),
      workspace: source.getWorkspace(agent.workspaceId),
      composers: (selector: {agentId?: string; focused?: boolean}) => composers(selector, p.id),
      rpc: (contract: {
        name: string;
      }, value: unknown) => p.invoke(contract.name, value),
      openScreen: (input: {
        screenId: string;
      }) => {
        const row = p.surfaces.find(r => r.id === input.screenId);
        if (row) navigate({
          installation: p,
          row
        });
      },
      openPanel: (id: string) => {
        const row = p.workspacePanels.find(r => r.id === id);
        if (row) navigate({
          installation: p,
          row
        });
      },
      openSettings: (id: string) => {
        const row = p.settingsScreens.find(r => r.id === id);
        if (row) navigate({
          installation: p,
          row
        });
      }
    });
    return true;
  }
  return false;
}
export function MobileSlashHints({
  text,
  onPick
}: {
  text: string;
  onPick: (text: string) => void;
}) {
  const plugins = useMobilePlugins();
  if (!/^\/[\w-]*$/.test(text)) return null;
  const prefix = text.slice(1);
  return <div className="slash-hints">{plugins.flatMap(p => p.clientSlashCommands.filter(r => String(r.name).startsWith(prefix)).map(row => <button key={p.id + String(row.name)} onClick={() => onPick('/' + row.name + ' ')}><strong>/{String(row.name)}</strong><span>{pluginText(p, row.description)}</span></button>))}</div>;
}

export function MobileComposerItems() {
  const plugins = useMobilePlugins();
  if (!current.sessionId) return null;
  return <>{plugins.flatMap(p => p.composerItems.filter(row => row.Component && typeof row.matches !== 'function').map(row => {
    const Component = row.Component!;
    return <PluginBoundary key={p.id + ':' + row.id}><PluginProvider installation={p}><Component {...pluginHostProps()} /></PluginProvider></PluginBoundary>;
  }))}</>;
}

export function MobileResourcePicker() {
  const plugins = useMobilePlugins();
  const sources = plugins.flatMap(p => p.attachmentSources.map(row => ({p, row, key: p.id + ':' + row.id})));
  const [open, setOpen] = useState(false), [selectedKey, setSelectedKey] = useState(''), [query, setQuery] = useState(''),
    [items, setItems] = useState<PluginResource[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const generation = React.useRef(0);
  const selected = sources.find(row => row.key === selectedKey) ?? sources[0];
  const close = () => { generation.current++; setOpen(false); setBusy(false); };
  const search = async () => {
    if (!selected || !current.sessionId) return;
    const epoch = ++generation.current;
    setBusy(true); setError('');
    try {
      const contract = selected.row.search as {name: string; output?: {parse: (value: unknown) => unknown}};
      const result = await selected.p.invoke(contract.name, {query});
      const parsed = plain(contract.output?.parse(result) ?? result);
      const rows = list<unknown>(parsed.items).map(validatePluginResource);
      if (epoch === generation.current) setItems(rows);
    } catch (error) {
      if (epoch === generation.current) setError(error instanceof Error ? error.message : String(error));
    } finally { if (epoch === generation.current) setBusy(false); }
  };
  if (!sources.length) return null;
  return <><button className="plugin-pill" onClick={() => setOpen(true)}>插件资源</button>{open && <Sheet title={selected ? pluginText(selected.p, selected.row.pickerTitle, '添加插件资源') : '添加插件资源'} onClose={close}>
    <label className="field">资源来源<select value={selected?.key} onChange={event => {
      generation.current++; setSelectedKey(event.target.value); setItems([]); setError(''); setBusy(false);
    }}>{sources.map(source => <option key={source.key} value={source.key}>{pluginText(source.p, source.row.title, source.row.id)}</option>)}</select></label>
    <form onSubmit={event => {event.preventDefault(); void search();}}><label className="field">搜索资源<input value={query} onChange={event => setQuery(event.target.value)} placeholder={selected ? pluginText(selected.p, selected.row.searchPlaceholder, '搜索…') : '搜索…'} /></label><button className="primary full" disabled={busy || !selected}>{busy ? '搜索中…' : '搜索'}</button></form>
    <Notice text={error} />{items.map(item => <button className="setting-row resource-result" key={item.id} onClick={() => {
      if (!selected) return;
      try {current.addResource(selected.p.id, selected.row.id, item); close();} catch (error) {setError(String(error));}
    }}><span><strong>{item.identifier} · {item.title}</strong><small>{item.subtitle ?? item.url}</small></span><ChevronRight size={16} /></button>)}
    <p className="muted">选中内容随这条消息上传到当前会话，发送前可移除。搜索和模型执行在授权电脑完成。</p>
  </Sheet>}</>;
}

/** 原生排版保留为默认；外部插件按原始注册契约变换和渲染语义条目。 */
export function MobileTimelineItem({item, id, sessionId, timestamp, streaming = false, fallback, actions}: {
  item: RecordValue; id: string; sessionId: string; timestamp: string | number;
  streaming?: boolean; fallback: React.ReactNode; actions?: React.ReactNode;
}) {
  const plugins = useMobilePlugins();
  if (item.truncated || typeof item.text === 'string' && (item.text.includes('[[tervell-asset:')||item.text.includes('[[tervell-annotations:'))) return <>{fallback}</>;
  const eligible = plugins.filter(plugin => !usesNativeMessageLayout(plugin.id, String(item.type)));
  const transformed = item.type === 'plugin' && typeof item.pluginId === 'string' ? [{
    id, pluginId: item.pluginId, kind: String(item.kind), version: Number(item.version), data: item.data
  }] : transformTimelineItem({item, sourceId: id, phase: streaming ? 'streaming' : 'complete', plugins: eligible});
  if (transformed === undefined) return <>{fallback}</>;
  const content = transformed.map(part => {
    const installation = plugins.find(plugin => plugin.id === part.pluginId);
    const renderer = installation?.timelineRenderers.find(row => row.kind === part.kind && row.version === part.version);
    const parsed = renderer?.schema?.safeParse(part.data), Component = renderer?.Component;
    if (!installation || !Component || !parsed?.success) return <React.Fragment key={part.id}>{fallback}</React.Fragment>;
    return <PluginBoundary key={part.id} fallback={fallback}><PluginProvider installation={installation}><Component {...pluginHostProps()} agentId={sessionId} timestamp={new Date(timestamp)} item={{type: 'plugin', kind: part.kind, version: part.version, data: parsed.data}} composer={{appendText: (text: string) => {
      if (current.sessionId !== sessionId) return false;
      current.setDraft(current.draft + text); return true;
    }}} /></PluginProvider></PluginBoundary>;
  });
  return <div className="mobile-plugin-timeline" data-plugin-entry={id}>{content}{content.length > 0 && actions}</div>;
}
