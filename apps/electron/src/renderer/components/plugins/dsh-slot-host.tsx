import * as React from 'react';
import { Context, SlotRegistry, createSlotRenderer } from '@/lib/third-party/paseo-client/dsh-ui';
import { currentAgentSessionIdAtom } from '@/atoms/agent-atoms';
import type { Installation } from './native-registry';
import type { Contribution, Evaluated } from '@/lib/third-party/paseo-client/runtime';
interface Entry {
  options: {
    id?: string;
    key?: string;
    label?: string | (() => string);
  };
  select?: (props: Record<string, unknown>) => unknown;
}
interface SlotApi {
  register: (definition: object, component: unknown) => () => void;
  entries: (name: string) => Entry[];
  install: (renderer: unknown) => void;
  installLocale: (locale: object) => void;
  installScope: (name: string, scope: object) => void;
  provideRoot: (value: object) => () => void;
  renderSlot: (name: string, owner: object) => React.ReactNode;
  getVersion: (name: string) => number;
}
interface ContextApi {
  provide: (name: string, value: unknown) => unknown;
  on: (name: string, handler: (key: string) => void) => () => void;
  plugin: (plugin: unknown, config?: object) => {
    await: () => Promise<void>;
    dispose: () => Promise<void>;
    _error?: unknown;
    state: number;
  };
  fiber: {
    dispose: () => Promise<void>;
  };
}
interface Locale {
  bind: (ns: string) => (key: string, args?: Record<string, unknown>) => string;
}
const declarations = {
  'settings.section': {
    kind: 'list',
    scope: 'root'
  },
  'conversation.composer': {
    kind: 'chain',
    scope: 'session-maybe'
  },
  'sidebar.right.pane.tab': {
    kind: 'keyed',
    scope: 'session'
  }
} as const;
/** 上游SlotRegistry+React renderer负责排序、选择、嵌套、store、注入和卸载；这里只映射产品入口。 */
export async function createDshSlotHost(installation: Installation, services: Record<string, unknown>, result: Evaluated, notify: () => void): Promise<{
  context: ContextApi;
  start: (plugin: unknown) => Promise<void>;
  dispose: () => Promise<void>;
}> {
  const context = new Context() as ContextApi,
    slots = new SlotRegistry(context) as SlotApi,
    locale = services.locale as Locale;
  const localeState = {
    revision: 0
  };
  slots.install(createSlotRenderer());
  slots.installLocale({
    ...locale,
    getSnapshot: () => localeState,
    subscribe: () => () => {}
  });
  let scopeId: string | null = null,
    scope: Record<string, unknown> = {
      key: undefined,
      hooks: {},
      keyedHooks: {},
      props: {}
    };
  const listeners = new Set<() => void>();
  const refresh = () => {
    const next = installation.store.get(currentAgentSessionIdAtom);
    if (next === scopeId) return;
    scopeId = next;
    scope = {
      key: next ?? undefined,
      ctx: context,
      hooks: {},
      keyedHooks: {},
      props: {
        sessionId: next
      }
    };
    for (const fn of listeners) fn();
  };
  refresh();
  const offSession = installation.store.sub(currentAgentSessionIdAtom, refresh);
  const current = {
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot: () => scope
  };
  slots.installScope('session', {
    current,
    bindingSource: () => current,
    renderArea: (binding: {
      key?: string;
    }, props: {
      children: React.ReactNode;
      empty?: () => React.ReactNode;
    }) => binding.key ? props.children : props.empty?.() ?? null
  });
  slots.provideRoot({
    props: {
      ctx: context
    }
  });
  interface FrameProps {
    slot: string;
    owner: Record<string, unknown>;
    options?: Record<string, unknown>;
    renderSlot: (name: string, owner: object, options?: object) => React.ReactNode;
    renderSlotChain: (name: string, owner: object, options?: object) => React.ReactNode;
  }
  const Frame = (props: FrameProps) => props.slot === 'conversation.composer' ? props.renderSlotChain(props.slot, props.owner, props.options) : props.renderSlot(props.slot, props.owner, props.options);
  const offRoot = slots.register({
    name: 'root',
    children: declarations
  }, Frame);
  for (const [key, value] of Object.entries(services)) if (key !== 'slots' && key !== 'effect' && key !== 'inject' && key !== 'get') context.provide(key, value);
  const components = new Map<string, React.ComponentType<Record<string, unknown>>>();
  const project = () => {
    const mappings = [['settings.section', result.settingsScreens], ['conversation.composer', result.composerItems], ['sidebar.right.pane.tab', result.workspacePanels]] as const;
    for (const [name, rows] of mappings) {
      const next = slots.entries(name).map(entry => {
        const id = entry.options.id ?? entry.options.key ?? name,
          key = name + '/' + id;
        let Component = components.get(key);
        if (!Component) {
          Component = props => slots.renderSlot('root', {
            slot: name,
            owner: props,
            options: name === 'sidebar.right.pane.tab' ? {
              entryKey: id
            } : {
              only: id
            }
          });
          components.set(key, Component);
        }
        return {
          id,
          title: typeof entry.options.label === 'function' ? entry.options.label() : entry.options.label ?? id,
          Component,
          ...(name === 'conversation.composer' ? {
            matches: (props: Record<string, unknown>) => entry.select ? !!entry.select(props) : true
          } : {}),
          ...(name === 'sidebar.right.pane.tab' ? {
            context: 'agent',
            locations: ['explorer']
          } : {})
        } as Contribution;
      });
      rows.splice(0, rows.length, ...next);
    }
    notify();
  };
  const offChange = context.on('slots/changed', () => project());
  return {
    context,
    async start(plugin) {
      const fiber = context.plugin(plugin);
      await fiber.await();
      if (fiber._error) throw fiber._error;
      if (fiber.state !== 2) throw Error('DSH客户端等待未提供的宿主服务：' + JSON.stringify((plugin as {
        inject?: unknown;
      }).inject ?? []));
      project();
    },
    async dispose() {
      offSession();
      offChange();
      offRoot();
      listeners.clear();
      await context.fiber.dispose();
    }
  };
}
