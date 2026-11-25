import { pluginAttachmentsAtom, addPluginAttachment } from './native-attachments';
import type { PluginResource } from './native-attachments';
import { routedModel } from '@proma/auth-bridge/agent-routing';
import { modelRoutingConfigAtom, modelRoutingSupportAtom } from '@/atoms/desktop-extensions';
import type { Store } from 'jotai/vanilla/store';
import type { Installation } from './native-registry';
import { agentSessionsAtom, agentSessionChannelMapAtom, agentSessionModelMapAtom, agentChannelIdAtom, agentModelIdAtom, agentSessionDraftsAtom, agentSessionDraftSyncVersionsAtom, currentAgentSessionIdAtom } from '@/atoms/agent-atoms';
const EMPTY = Object.freeze([]);
const sources = new WeakMap<Installation, ReturnType<typeof source>>();
function source(installation: Installation, store: Store) {
  const handles = new Map<string, {
    signature: string;
    value: Record<string, unknown>;
    list: readonly unknown[];
  }>();
  const named = (selector: {
    agentId?: string;
    focused?: boolean;
  }) => selector.agentId ?? store.get(currentAgentSessionIdAtom);
  const resolve = (selector: {
    agentId?: string;
    focused?: boolean;
  }) => {
    const id = named(selector),
      session = store.get(agentSessionsAtom).find(s => s.id === id);
    if (!session || !installation.entry.access?.workspaceIds.includes(session.workspaceId ?? '')) return EMPTY;
    const prompt = store.get(agentSessionDraftsAtom).get(session.id) ?? '',
      signature = JSON.stringify([session, prompt, store.get(pluginAttachmentsAtom)[session.id]]),
      cached = handles.get(session.id);
    if (cached?.signature === signature) return cached.list;
    const replace = (next: typeof session) => store.set(agentSessionsAtom, all => all.map(s => s.id === next.id ? next : s));
    const select = async (patch: Record<string, unknown>) => replace(await window.electronAPI.setSessionKernel(session.id, {
      kernelId: session.kernelId ?? 'pi',
      modelId: session.kernelModelId,
      modeId: session.kernelModeId,
      configValues: session.kernelConfigValues ?? {},
      autoApprove: session.kernelAutoApprove ?? false,
      ...patch
    }));
    const value = {
      context: session.isDraft ? 'draft' : 'agent',
      prompt,
      attachments: (store.get(pluginAttachmentsAtom)[session.id] ?? []).filter(a => a.pluginId === installation.id).map(({
        sourceId,
        item
      }) => ({
        sourceId,
        item
      })),
      addAttachment: (value: {
        sourceId: string;
        item: PluginResource;
      }) => addPluginAttachment(store, session.id, {
        ...value,
        pluginId: installation.id
      }),
      removeAttachment: (input: {
        sourceId: string;
        itemId: string;
      }) => store.set(pluginAttachmentsAtom, all => ({
        ...all,
        [session.id]: (all[session.id] ?? []).filter(a => a.pluginId !== installation.id || a.sourceId !== input.sourceId || a.item.id !== input.itemId)
      })),
      agent: {
        provider: session.kernelId ?? 'pi',
        model: session.kernelModelId ?? session.modelId ?? null,
        mode: session.kernelModeId ?? null,
        thinking: session.gatewayReasoning?.effort ?? session.modelReasoning?.effort ?? session.reasoningLevel ?? null,
        options: {
          ...session.kernelConfigValues,
          ...session.pluginProviderOptions
        },
        metadata: session.pluginMetadata ?? {}
      },
      setPrompt: (text: string) => {
        store.set(agentSessionDraftsAtom, all => new Map(all).set(session.id, text));
        store.set(agentSessionDraftSyncVersionsAtom, all => new Map(all).set(session.id, (all.get(session.id) ?? 0) + 1));
      },
      insertText: (text: string) => {
        const detail = {
          sessionId: session.id,
          text,
          handled: false
        };
        window.dispatchEvent(new CustomEvent('tervell-plugin-insert-text', {
          detail
        }));
        if (!detail.handled) {
          store.set(agentSessionDraftsAtom, all => new Map(all).set(session.id, (all.get(session.id) ?? '') + text));
          store.set(agentSessionDraftSyncVersionsAtom, all => new Map(all).set(session.id, (all.get(session.id) ?? 0) + 1));
        }
      },
      focus: async (options?: {
        selection?: {
          start: number;
          end: number;
        };
      }) => {
        window.dispatchEvent(new CustomEvent('tervell-native-open-agent', {
          detail: {
            agentId: session.id
          }
        }));
        await new Promise<void>((resolve, reject) => {
          const requestId = crypto.randomUUID();
          let frame = 0;
          const cleanup = () => {
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            window.removeEventListener('tervell-plugin-focus-complete', done);
            installation.lifetime.signal.removeEventListener('abort', aborted);
          };
          const done = (event: Event) => {
            const input = (event as CustomEvent<{
              requestId: string;
            }>).detail;
            if (input.requestId !== requestId) return;
            cleanup();
            resolve();
          };
          const aborted = () => {
            cleanup();
            reject(Error('插件已停止'));
          };
          const timer = setTimeout(() => {
            cleanup();
            reject(Error('无法聚焦此会话输入框'));
          }, 3000);
          const attempt = () => {
            frame = requestAnimationFrame(attempt);
            window.dispatchEvent(new CustomEvent('tervell-plugin-focus-input', {
              detail: {
                sessionId: session.id,
                requestId,
                selection: options?.selection
              }
            }));
          };
          window.addEventListener('tervell-plugin-focus-complete', done);
          installation.lifetime.signal.addEventListener('abort', aborted, {
            once: true
          });
          if (installation.lifetime.signal.aborted) aborted();else frame = requestAnimationFrame(attempt);
        });
      },
      setMetadata: async (metadata: Record<string, unknown>) => replace((await window.electronAPI.desktopPluginHostCall(installation.id, 'agent.metadata', {
        id: session.id,
        metadata
      })) as typeof session),
      setProvider: (provider: string) => select({
        kernelId: provider
      }),
      setModel: async (modelId: string) => {
        if ((session.kernelId ?? 'pi') !== 'pi') {
          await select({
            modelId
          });
          return;
        }
        if (routedModel(store.get(modelRoutingConfigAtom), 'pi')) throw Error('全局路由已覆盖模型，请在全局模型路由中选择');
        const channelId = store.get(agentSessionChannelMapAtom).get(session.id) ?? session.channelId ?? store.get(agentChannelIdAtom);
        if (!channelId) throw Error('请先选择渠道');
        replace(await window.electronAPI.updateAgentSessionModel(session.id, channelId, modelId));
        store.set(agentSessionModelMapAtom, all => new Map(all).set(session.id, modelId));
      },
      setMode: (modeId: string) => select({
        modeId
      }),
      setOptions: async (patch: Record<string, unknown>) => {
        await window.electronAPI.desktopPluginHostCall(installation.id, 'agent.options', {
          id: session.id,
          patch
        });
        const sessions = await window.electronAPI.listAgentSessions();
        store.set(agentSessionsAtom, sessions);
      },
      setThinking: async (effort: string) => {
        const kernel = session.kernelId ?? 'pi',
          routed = store.get(modelRoutingSupportAtom).some(s => s.kernelId === kernel && s.method !== 'unavailable') ? routedModel(store.get(modelRoutingConfigAtom), kernel) : undefined;
        if (routed) {
          replace(await window.electronAPI.setSessionGatewayReasoning(session.id, {
            model: routed,
            effort: effort || undefined
          }));
          return;
        }
        if (kernel === 'pi') {
          const channelId = store.get(agentSessionChannelMapAtom).get(session.id) ?? session.channelId ?? store.get(agentChannelIdAtom),
            model = store.get(agentSessionModelMapAtom).get(session.id) ?? session.modelId ?? store.get(agentModelIdAtom);
          if (!channelId || !model) throw Error('请先选择渠道与模型');
          replace(await window.electronAPI.setSessionModelReasoning(session.id, {
            channelId,
            model,
            effort: effort || undefined
          }));
          return;
        }
        const catalog = await window.electronAPI.sessionKernelCatalog(session.id, true),
          control = catalog.controls?.find(c => c.category === 'reasoning' || /thinking|reasoning|effort/i.test(c.id));
        if (!control) throw Error('当前内核未返回可写入的推理配置');
        await select({
          configValues: {
            ...session.kernelConfigValues,
            [control.id]: effort
          }
        });
      }
    };
    const list = Object.freeze([value]);
    handles.set(session.id, {
      signature,
      value,
      list
    });
    return list;
  };
  return {
    resolve,
    subscribe: (_selector: unknown, listener: () => void) => {
      const off = [store.sub(agentSessionsAtom, listener), store.sub(agentSessionDraftsAtom, listener), store.sub(currentAgentSessionIdAtom, listener), store.sub(pluginAttachmentsAtom, listener)];
      return () => off.forEach(fn => fn());
    }
  };
}
export function composerSource(installation: Installation, store: Store): ReturnType<typeof source> {
  let value = sources.get(installation);
  if (!value) {
    value = source(installation, store);
    sources.set(installation, value);
  }
  return value;
}
