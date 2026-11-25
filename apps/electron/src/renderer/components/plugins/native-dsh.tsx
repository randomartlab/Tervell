import { createDshSlotHost } from './dsh-slot-host';
import '@/lib/third-party/paseo-client/dsh-tokens.css';
import * as React from 'react';
import { atom } from 'jotai';
import { currentAgentSessionIdAtom } from '@/atoms/agent-atoms';
import type { Installation } from './native-registry';
import type { Evaluated } from '@/lib/third-party/paseo-client/runtime';
import { ReactNative } from '@/lib/third-party/paseo-client/runtime';
import { primitives as ui } from '@/lib/third-party/paseo-client/dsh-ui';
import '@/lib/third-party/paseo-client/dsh-ui.css';
export const dshInteractionAtom = atom<{
  requestId: string;
  sessionId: string;
  workspaceId: string;
  detail: string;
} | null>(null);
/** DSH 的 Slot 贡献映射到同语义的 Tervell 宿主位置；未知 Slot 拒绝注册。 */
export async function createDshContributions(installation: Installation, source: string, notify: () => void): Promise<Evaluated> {
  const result: Evaluated = {
    id: installation.id,
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
  };
  let currentSession: {
    key: string | null;
  } = {
    key: null
  };
  const effects: Array<() => unknown> = [],
    dictionary = new Map<string, Record<string, Record<string, string>>>(),
    forms = new Map<string, unknown>();
  const rpc = (name: string, payload?: unknown, channel = '/api') => installation.invoke('__tervell_dsh', {
    name,
    payload,
    channel
  });
  const configForm = (id: string) => {
    if (forms.has(id)) return forms.get(id);
    let value: Record<string, unknown> = {
      status: 'loading',
      writable: false
    };
    const listeners = new Set<() => void>();
    const read = async () => {
      value = (await rpc('settings.read')) as Record<string, unknown>;
      for (const fn of listeners) fn();
    };
    const form = {
      getSnapshot: () => value,
      subscribe: (fn: () => void) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      mutate: async (ops: unknown, revision = value.revision) => {
        const saved = await rpc('settings.write', {
          ops,
          revision
        });
        await read();
        return saved;
      }
    };
    forms.set(id, form);
    void read();
    return form;
  };
  let ctx: Record<string, unknown>;
  const tabKinds = new Map<string, string>();
  const locale = {
    getLocale: () => ({
      id: 'zh',
      locales: [{
        id: 'zh'
      }, {
        id: 'en'
      }]
    }),
    addLanguage: () => {},
    register: (ns: string, data: Record<string, Record<string, string>>) => {
      dictionary.set(ns, data);
      return () => dictionary.delete(ns);
    },
    bind: (ns: string) => (key: string, args: Record<string, unknown> = {}) => String((dictionary.get(ns)?.zh ?? dictionary.get(ns)?.['zh-CN'] ?? dictionary.get(ns)?.en ?? {})[key] ?? key).replace(/\{([^}]+)\}/g, (_, name: string) => String(args[name] ?? name))
  };
  ctx = {
    locale,
    configForms: {
      get: configForm
    },
    connection: {
      rpc: {
        call: (channel: string, name: string, payload: unknown) => rpc(name, payload, channel)
      }
    },
    uiSession: {
      adapter: {
        current: {
          subscribe: (fn: () => void) => installation.store.sub(currentAgentSessionIdAtom, fn),
          getSnapshot: () => {
            const key = installation.store.get(currentAgentSessionIdAtom);
            if (currentSession.key !== key) currentSession = {
              key
            };
            return currentSession;
          }
        }
      }
    },
    sidebarRightTabs: {
      register: (def: Record<string, unknown>) => {
        const id = String(def.id ?? def.kind);
        tabKinds.set(String(def.kind), id);
        return () => tabKinds.delete(String(def.kind));
      }
    },
    sidebarRight: {
      openTab: (kind: string) => {
        const row = result.workspacePanels.find(r => r.id === tabKinds.get(kind) || r.id.includes(kind));
        if (row) window.dispatchEvent(new CustomEvent('tervell-native-plugin-open', {
          detail: {
            pluginId: installation.id,
            id: row.id,
            kind: 'panel',
            location: 'explorer'
          }
        }));
      }
    },
    effect: (fn: () => unknown) => {
      const release = fn();
      if (typeof release === 'function') effects.push(release as () => unknown);
      return release;
    },
    inject: (names: string[], fn: (context: Record<string, unknown>) => unknown) => {
      for (const name of names) if (!ctx[name]) throw Error('DSH 客户端服务尚未接入：' + name);
      return fn(ctx);
    },
    get: (name: string) => ctx[name]
  };
  const modules: Record<string, unknown> = {
    react: React,
    'react-native': ReactNative,
    '@deepseek-ai/dsh-client-ui-primitives': ui
  };
  let plugin: {
    apply?: (ctx: Record<string, unknown>) => unknown;
    inject?: string[];
  } | undefined;
  const loader = {
    load: (definition: {
      factory: (require: (name: string) => unknown) => unknown;
    }) => {
      const exp = definition.factory(name => {
        if (!(name in modules)) throw Error('缺少DSH客户端模块：' + name);
        return modules[name];
      });
      const value = exp as {
        default?: unknown;
      };
      plugin = (value.default ?? exp) as typeof plugin;
    }
  };
  const clientWindow = new Proxy(window, {
    get: (target, key) => key === '__ModuleLoader__' ? loader : Reflect.get(target, key, target),
    set: (target, key, value) => Reflect.set(target, key, value, target)
  });
  const evaluate = new Function('window', 'source', 'return eval(source)');
  const factory = evaluate(clientWindow, source);
  if (typeof factory !== 'function') throw Error('DSH客户端不是可执行工厂');
  factory((name: string) => {
    if (!(name in modules)) throw Error('缺少DSH客户端模块：' + name);
    return modules[name];
  });
  if (!plugin) throw Error('DSH 客户端未导出插件');
  const slotHost = await createDshSlotHost(installation, ctx, result, notify);
  try {
    await slotHost.start(plugin);
  } catch (error) {
    await slotHost.dispose();
    throw error;
  }
  result.cleanup = async () => {
    await slotHost.dispose();
    for (const release of effects.reverse()) release();
    for (const list of [result.surfaces, result.settingsScreens, result.workspacePanels, result.composerItems]) list.length = 0;
  };
  return result;
}
