import {PluginSidebarFrameContext} from './native-ui';
import {pluginNavigation} from './native-registry';
import { pluginAttachmentsAtom, addPluginAttachment } from './native-attachments';
import type { PluginResource } from './native-attachments';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { registerShortcut } from '@/lib/shortcut-registry';
import { pluginTabStatesAtom, pluginTargetKey, samePluginTarget, removePluginTabState } from './native-state';
import { composerSource } from './native-composers';
import * as React from 'react';
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { currentAgentSessionAtom, currentAgentSessionIdAtom, currentAgentWorkspaceIdAtom, agentSessionsAtom, agentSessionDraftsAtom, allPendingAskUserRequestsAtom, agentTerminalTabsAtom, agentDiffPanelTabAtom, currentSessionSidePanelOpenAtom } from '@/atoms/agent-atoms';
import { settingsOpenAtom } from '@/atoms/settings-tab';
import { pluginSidebarViewTargetAtom, pluginWorkspaceTargetsAtom, pluginMainTargetAtom, pluginSettingsTargetAtom, usePlugins, pluginText, PluginComponent, PluginProvider, pluginProps, actionContext, Icon } from './native-registry';
import type { Installation, PluginTarget, PluginButton } from './native-registry';
import type { Contribution } from '@/lib/third-party/paseo-client/runtime';
import { pluginHost } from '@/lib/third-party/paseo-client/runtime';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import { toast } from 'sonner';
export function NativePluginSurface({
  target,
  embedded = false
}: {
  target: PluginTarget;
  embedded?: boolean;
}): React.ReactElement {
  const plugins = usePlugins(),
    store = useStore(),
    installation = plugins.find(p => p.id === target.pluginId),
    [tabStates, setTabStates] = useAtom(pluginTabStatesAtom),
    key = pluginTargetKey(target),
    tabState = tabStates[key],
    state = tabState?.state,
    modified = tabState?.modified ?? false;
  const setState = React.useCallback((next: unknown) => setTabStates(all => ({
    ...all,
    [key]: {
      ...all[key],
      state: typeof next === 'function' ? (next as (v: unknown) => unknown)(all[key]?.state) : next,
      modified: all[key]?.modified ?? false
    }
  })), [key, setTabStates]);
  const setModified = React.useCallback((next: boolean) => setTabStates(all => ({
    ...all,
    [key]: {
      ...all[key],
      modified: next
    }
  })), [key, setTabStates]);
  const row = installation && (target.kind === 'panel' ? installation.workspacePanels : target.kind === 'settings' ? installation.settingsScreens : target.kind === 'sidebar' ? installation.sidebarViews : installation.surfaces).find(c => c.id === target.id);
  if (!installation || !row) return <p role="status" className="p-5 text-sm text-muted-foreground">插件入口不可用，请检查插件启用状态。</p>;
  const close = () => {
    if (modified && !confirm('此插件有未保存更改，仍然关闭？')) return;
    store.set(pluginMainTargetAtom, null);
    store.set(pluginSettingsTargetAtom, null);
  };
  return <section className="flex h-full min-h-0 flex-col">{!embedded && <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4"><Icon icon={row.icon} /><h1 className="min-w-0 flex-1 truncate text-sm font-medium">{pluginText(installation,row.title,row.id,target.params)}{modified ? ' · 未保存' : ''}</h1><Button variant="ghost" size="sm" onClick={close}>关闭</Button></header>}<div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden" data-plugin-surface={target.pluginId+'/'+target.id}><PluginComponent installation={installation} row={row} props={{
        ...actionContext(installation, target.workspaceId, target.agentId),
        workspaceId: target.workspaceId,
        agentId: target.agentId,
        context: target.agentId ? 'agent' : 'workspace',
        params: {
          ...target.params,
          ...(target.agentId ? {
            agentId: target.agentId
          } : {})
        },
        revision: 0,
        tab: {
          state,
          setState,
          setModified
        },
        navigation: pluginNavigation(installation)
      }} /></div></section>;
}
export function NativePluginMain(): React.ReactElement | null {
  const target = useAtomValue(pluginMainTargetAtom);
  return target ? <NativePluginSurface target={target} /> : null;
}
export function PluginSidebarSlots({
  section,
  collapsed = false
}: {
  section: 'header' | 'footer';
  collapsed?: boolean;
}): React.ReactElement | null {
  const plugins = usePlugins(),
    target = useAtomValue(pluginMainTargetAtom),
    setTarget = useSetAtom(pluginMainTargetAtom),
    store = useStore();
  const setSidebarView = useSetAtom(pluginSidebarViewTargetAtom);
  const openScreen = (p: Installation, input: {
    screenId: string;
    params?: Record<string, unknown>;
  }) => {
    setTarget({
      pluginId: p.id,
      id: input.screenId,
      kind: 'screen',
      params: input.params
    });
    store.set(settingsOpenAtom, false);
  };
  return <div className="space-y-0.5" data-plugin-placement={'sidebar-' + section}>{plugins.filter(p => !p.error).map(p => <React.Fragment key={p.id}>{p.sidebarItems[section].map(row => <NativeSidebarItem key={row.id} installation={p} row={row} section={section} currentScreen={target?.pluginId===p.id?{screenId:target.id,params:target.params??{}}:null} openScreen={input=>openScreen(p,input)}/>)}{section === 'header' && p.legacySidebarItems.map(row => <button key={row.id} type="button" aria-label={pluginText(p,row.title,row.id)} title={pluginText(p,row.title,row.id)} onClick={() => openScreen(p, {
        screenId: row.surface!
      })} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Icon icon={row.icon} />{!collapsed && pluginText(p,row.title,row.id)}</button>)}{section === 'header' && p.sidebarViews.map(row => <button type="button" key={row.id} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setSidebarView({
        pluginId: p.id,
        id: row.id,
        kind: 'sidebar'
      })}>{!collapsed && pluginText(p,row.title,row.id)}</button>)}</React.Fragment>)}</div>;
}
function NativeSidebarItem({installation,row,section,currentScreen,openScreen}:{
 installation:Installation;row:Contribution;section:'header'|'footer';currentScreen:{screenId:string;params:Record<string,unknown>}|null;
 openScreen:(input:{screenId:string;params?:Record<string,unknown>})=>void;
}):React.ReactElement{
 const anchor=React.useRef<HTMLElement|null>(null),[Content,setContent]=React.useState<React.ComponentType<Record<string,unknown>>|null>(null);
 const title=pluginText(installation,row.title,row.id);
 const frame=React.useMemo(()=>({title,section,testID:'plugin-sidebar-'+installation.id+'-'+row.id,anchor}),[title,section,installation.id,row.id]);
 return <PluginSidebarFrameContext.Provider value={frame}><Popover open={Content!==null} onOpenChange={open=>{if(!open)setContent(null)}}><PopoverAnchor virtualRef={anchor}/><PluginComponent installation={installation} row={row} props={{title,currentScreen,openScreen,openPopover:(Component:React.ComponentType<Record<string,unknown>>)=>setContent(()=>Component)}}/>{Content&&<PopoverContent side="right" align="start" className="w-80"><PluginProvider installation={installation}><Content {...pluginProps()} close={()=>setContent(null)} openScreen={(input:{screenId:string;params?:Record<string,unknown>})=>{openScreen(input);setContent(null)}}/></PluginProvider></PopoverContent>}</Popover></PluginSidebarFrameContext.Provider>;
}

export function PluginSettingsNavigation({
  search = ''
}: {
  search?: string;
}): React.ReactElement | null {
  const plugins = usePlugins(),
    [target, setTarget] = useAtom(pluginSettingsTargetAtom);
  const entries = plugins.flatMap(p => p.settingsScreens.map(row => ({
    p,
    row
  }))).filter(({
    p,row
  }) => pluginText(p,row.title,row.id).toLowerCase().includes(search.toLowerCase()));
  if (!entries.length) return null;
  return <section><h2 className="px-3 py-1.5 text-xs font-medium text-muted-foreground">插件设置</h2>{entries.map(({
      p,
      row
    }) => <button key={p.id + '/' + row.id} type="button" onClick={() => setTarget({
      pluginId: p.id,
      id: row.id,
      kind: 'settings'
    })} aria-current={target?.pluginId === p.id && target.id === row.id ? 'page' : undefined} className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted ${target?.pluginId === p.id && target.id === row.id ? 'bg-primary/10 text-primary font-medium' : ''}`}><Icon icon={row.icon} />{pluginText(p,row.title,row.id)}</button>)}</section>;
}
export function PluginPanelMenu({
  location,
  sessionId
}: {
  sessionId?: string;
  location: 'workspace' | 'explorer';
}): React.ReactElement | null {
  const plugins = usePlugins(),
    sessions = useAtomValue(agentSessionsAtom),
    activeSession = useAtomValue(currentAgentSessionAtom),
    session = sessionId ? sessions.find(s => s.id === sessionId) : activeSession,
    workspaceId = useAtomValue(currentAgentWorkspaceIdAtom);
  const entries = plugins.filter(p => p.entry.access?.workspaceIds.includes(session?.workspaceId ?? workspaceId ?? '')).flatMap(p => p.workspacePanels.filter(r => (r.locations??['workspace']).includes(location) && (!r.context || r.context === 'workspace' || !!session)).map(row => ({
    p,
    row
  })));
  if (!entries.length) return <DropdownMenuItem disabled>暂无可添加的面板，请先启用提供面板的插件</DropdownMenuItem>;
  return <>{entries.map(({
      p,
      row
    }) => <DropdownMenuItem key={p.id + '/' + row.id} onSelect={() => {
      try {
        (actionContext(p, session?.workspaceId ?? workspaceId ?? undefined, session?.id).openPanel as (id: string, opts: object) => void)(row.id, {
          location
        });
      } catch (error) {
        toast.error(String(error));
      }
    }}><Icon icon={row.icon} />{pluginText(p,row.title,row.id)}</DropdownMenuItem>)}</>;
}
interface ButtonBehavior {
  kind: string;
  onPress?: () => unknown;
  items?: Array<Record<string, unknown>>;
  Content?: React.ComponentType<Record<string, unknown>>;
}
function PluginButtonView({
  row,
  installation
}: {
  row: PluginButton;
  installation: Installation;
}): React.ReactElement | null {
  const [pending, setPending] = React.useState(false),
    [content, setContent] = React.useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const context = {
    ...pluginProps(),
    context: row.agentId ? 'agent' : 'workspace',
    workspaceId: row.workspaceId,
    agentId: row.agentId
  };
  const renderIcon = (icon: unknown): React.ReactNode => typeof icon === 'function' ? React.createElement(icon as React.ComponentType<Record<string, unknown>>, {
    ...context,
    size: 16,
    color: 'currentColor'
  }) : <Icon icon={icon} />;
  const invoke = async (behavior: ButtonBehavior) => {
    if (pending) return;
    if (behavior.kind === 'popover') {
      if (behavior.Content) setContent(() => behavior.Content!);
      return;
    }
    setPending(true);
    try {
      await behavior.onPress?.();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setPending(false);
    }
  };
  const entries = (items: Array<Record<string, unknown>>): React.ReactNode => items.filter(item => item.visible !== false).map(item => {
    const key = String(item.id);
    if (item.kind === 'separator') return <DropdownMenuSeparator key={key} />;
    const behavior = item.behavior as ButtonBehavior,
      title = pluginText(installation,item.title??item.label,String(item.id));
    if (behavior?.kind === 'menu') return <DropdownMenuSub key={key}><DropdownMenuSubTrigger disabled={item.disabled === true}>{renderIcon(item.icon)}{title}</DropdownMenuSubTrigger><DropdownMenuSubContent>{entries(behavior.items ?? [])}</DropdownMenuSubContent></DropdownMenuSub>;
    return <DropdownMenuItem key={key} disabled={pending || item.disabled === true} onSelect={() => void invoke(behavior)}>{renderIcon(item.icon)}{title}</DropdownMenuItem>;
  });
  if (row.button.visible === false) return null;
  const behavior = row.button.behavior as ButtonBehavior | undefined,
    label = pluginText(installation,row.button.label ?? (row.placement === 'composer' ? row.button.title : undefined));
  const trigger = <Button variant="ghost" size="sm" title={pluginText(installation,row.button.title)} aria-label={pluginText(installation,row.button.title)} disabled={row.button.disabled || pending} onClick={behavior?.kind === 'menu' ? undefined : () => {
    if (behavior) void invoke(behavior);
  }}>{renderIcon(row.button.icon)}{label}</Button>;
  return <PluginProvider installation={installation}><Popover open={content !== null} onOpenChange={open => {
      if (!open) setContent(null);
    }}><PopoverTrigger asChild><span className="inline-flex">{behavior?.kind === 'menu' ? <DropdownMenu><DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger><DropdownMenuContent>{entries(behavior.items ?? [])}</DropdownMenuContent></DropdownMenu> : trigger}</span></PopoverTrigger><PopoverContent align="start" className="w-[400px] max-w-[calc(100vw-24px)] max-h-[min(80vh,var(--radix-popover-content-available-height))] overflow-auto">{content && React.createElement(content, {
          ...context,
          close: () => setContent(null)
        })}</PopoverContent></Popover></PluginProvider>;
}
export function PluginButtons({
  placement,
  sessionId
}: {
  placement: 'header' | 'composer';
  sessionId: string;
}): React.ReactElement | null {
  const plugins = usePlugins(),
    sessions = useAtomValue(agentSessionsAtom),
    session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  return <>{plugins.filter(p => p.entry.access?.workspaceIds.includes(session.workspaceId ?? '')).flatMap(p => p.buttons.filter(row => row.placement === placement && row.workspaceId === session.workspaceId && (!row.agentId || row.agentId === sessionId)).map(row => <PluginButtonView key={p.id + '/' + row.key} row={row} installation={p} />))}</>;
}
export function PluginComposerItems({
  sessionId
}: {
  sessionId: string;
}): React.ReactElement | null {
  const plugins = usePlugins(),
    store = useStore(),
    sessions = useAtomValue(agentSessionsAtom),
    drafts = useAtomValue(agentSessionDraftsAtom),
    session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  return <>{plugins.filter(p => p.entry.access?.workspaceIds.includes(session.workspaceId ?? '')).flatMap(p => p.composerItems.map(row => <pluginHost.PluginComposerProvider key={p.id + '/' + row.id} composer={composerSource(p, store).resolve({
      agentId: sessionId
    })[0]}><PluginComponent installation={p} row={row} /></pluginHost.PluginComposerProvider>))}</>;
}
export async function runPluginSlash(text: string, workspaceId?: string, agentId?: string): Promise<boolean> {
  const match = text.match(/^\/([a-z][a-z0-9-]*)(?:\s+([\s\S]*))?$/);
  if (!match) return false;
  const {
    getNativePlugins
  } = await import('./native-registry');
  for (const p of getNativePlugins()) {
    if (!p.entry.access?.workspaceIds.includes(workspaceId ?? '')) continue;
    const row = p.clientSlashCommands.find(c => c.name === match[1] && (c.context !== 'agent' || agentId));
    if (!row) continue;
    await row.onSubmit?.({
      ...actionContext(p, workspaceId, agentId),
      args: match[2] ?? '',
      rawInput: text
    });
    return true;
  }
  return false;
}
export function PluginCommands(): React.ReactElement | null {
  const plugins = usePlugins(),
    session = useAtomValue(currentAgentSessionAtom),
    workspaceId = useAtomValue(currentAgentWorkspaceIdAtom),
    [open, setOpen] = React.useState(false);
  React.useEffect(() => registerShortcut('command-center', () => setOpen(true)), []);
  return <CommandDialog open={open} onOpenChange={setOpen}><CommandInput placeholder="搜索命令…" /><CommandList><CommandEmpty>没有匹配的命令</CommandEmpty><CommandGroup heading="插件命令">{plugins.flatMap(p => p.commandCenterItems.filter(row => row.context === 'global' || p.entry.access?.workspaceIds.includes(session?.workspaceId ?? workspaceId ?? '') && (row.context !== 'agent' || !!session)).map(row => <CommandItem key={p.id + '/' + row.id} onSelect={() => {
          setOpen(false);
          void Promise.resolve(row.onSelect?.(actionContext(p, session?.workspaceId ?? workspaceId ?? undefined, session?.id))).catch(error => toast.error(String(error)));
        }}><Icon icon={row.icon} />{pluginText(p,row.title,row.id)}</CommandItem>))}</CommandGroup></CommandList></CommandDialog>;
}
export function NativeWorkspaceTabs(): React.ReactElement | null {
  const [target, setTarget] = useAtom(pluginMainTargetAtom),
    [byWorkspace, setTabs] = useAtom(pluginWorkspaceTargetsAtom),
    workspaceId = useAtomValue(currentAgentWorkspaceIdAtom),
    session = useAtomValue(currentAgentSessionAtom),
    plugins = usePlugins(),
    tabStates = useAtomValue(pluginTabStatesAtom);
  const setTabStates = useSetAtom(pluginTabStatesAtom);
  const rows = (byWorkspace[workspaceId ?? ''] ?? []).filter(row => plugins.some(p => p.id === row.pluginId));
  if (!rows.length) return null;
  return <div role="tablist" aria-label="项目工作区" className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2"><button type="button" role="tab" aria-selected={!target} className="rounded px-3 py-1.5 text-sm hover:bg-muted" onClick={() => setTarget(null)}>{session?.title ?? '会话'}</button>{rows.map(row => <div className="flex shrink-0 items-center rounded hover:bg-muted" key={row.pluginId + '/' + row.id + '/' + row.agentId}><button type="button" role="tab" aria-selected={samePluginTarget(target, row)} className="px-3 py-1.5 text-sm" onClick={() => setTarget(row)}>{(()=>{const p=plugins.find(p=>p.id===row.pluginId);return p?pluginText(p,p.workspacePanels.find(c=>c.id===row.id)?.title,row.id):row.id})()}{tabStates[pluginTargetKey(row)]?.modified ? ' ·' : ''}</button><button type="button" aria-label="关闭插件标签" className="px-2 text-muted-foreground" onClick={() => {
        if (tabStates[pluginTargetKey(row)]?.modified && !confirm('此插件有未保存更改，仍然关闭？')) return;
        setTabs(all => ({
          ...all,
          [workspaceId ?? '']: (all[workspaceId ?? ''] ?? []).filter(t => t !== row)
        }));
        setTabStates(all => removePluginTabState(all, row));
        if (samePluginTarget(target, row)) setTarget(null);
      }}>×</button></div>)}</div>;
}
export function PluginSidebarView(): React.ReactElement | null {
  const [target, setTarget] = useAtom(pluginSidebarViewTargetAtom),
    plugins = usePlugins(),
    store = useStore();
  if (!target) return null;
  const p = plugins.find(p => p.id === target.pluginId),
    row = p?.sidebarViews.find(r => r.id === target.id);
  if (!p || !row) return null;
  return <div className="flex min-h-0 flex-1 flex-col overflow-auto"><div className="flex items-center justify-between px-3 py-2 text-sm"><span>{pluginText(p,row.title,row.id)}</span><Button size="sm" variant="ghost" onClick={() => setTarget(null)}>返回</Button></div><PluginComponent installation={p} row={row} props={{
      active: {
        workspace: store.get(currentAgentWorkspaceIdAtom) ? (p.state.getWorkspace as (id: string) => {
          ref: unknown;
        })(store.get(currentAgentWorkspaceIdAtom)!)?.ref : null,
        agent: store.get(currentAgentSessionIdAtom) ? (p.state.getAgent as (id: string) => {
          ref: unknown;
        })(store.get(currentAgentSessionIdAtom)!)?.ref : null
      },
      dismiss: () => setTarget(null),
      navigation: pluginNavigation(p)
    }} /></div>;
}
export function NativeWorkspaceContents(): React.ReactElement {
  const plugins = usePlugins(),
    target = useAtomValue(pluginMainTargetAtom),
    byWorkspace = useAtomValue(pluginWorkspaceTargetsAtom),
    workspaceId = useAtomValue(currentAgentWorkspaceIdAtom);
  const rows = Object.values(byWorkspace).flat().filter(row => plugins.some(p => p.id === row.pluginId));
  return <>{rows.map(row => <div key={pluginTargetKey(row)} className={row.workspaceId === workspaceId && samePluginTarget(target, row) ? 'flex-1 min-h-0' : 'hidden'}><NativePluginSurface target={row} embedded /></div>)}{target && target.kind !== 'panel' && <div className="flex-1 min-h-0"><NativePluginSurface key={pluginTargetKey(target)} target={target} /></div>}</>;
}
export function PluginSlashSuggestions({
  text,
  workspaceId,
  agentId,
  onSelect
}: {
  text: string;
  workspaceId?: string;
  agentId?: string;
  onSelect: (text: string) => void;
}): React.ReactElement | null {
  const plugins = usePlugins(),
    drafts = useAtomValue(agentSessionDraftsAtom);
  if (agentId) text = drafts.get(agentId) ?? text;
  if (!/^\/[a-z0-9-]*$/i.test(text)) return null;
  const query = text.slice(1).toLowerCase(),
    rows = plugins.filter(p => p.entry.access?.workspaceIds.includes(workspaceId ?? '')).flatMap(p => p.clientSlashCommands.filter(c => c.name?.startsWith(query) && (c.context !== 'agent' || agentId)).map(row => ({
      p,
      row
    })));
  if (!rows.length) return null;
  return <div role="listbox" aria-label="插件斜杠命令" className="mx-3 mb-1 max-h-48 overflow-auto rounded-lg border border-border bg-popover p-1">{rows.map(({
      p,
      row
    }) => <button key={p.id + '/' + row.id} type="button" role="option" aria-selected={false} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => onSelect('/' + row.name + ' ')}><span className="font-medium">/{row.name}</span><span className="truncate text-muted-foreground">{pluginText(p,row.description??row.title,row.name??row.id)}</span></button>)}</div>;
}

/** 只接管内核实际提交、且插件选择器命中的交互；其余仍使用原生问答。 */
export function PluginInteraction({
  sessionId,
  fallback
}: {
  sessionId: string;
  fallback: React.ReactNode;
}): React.ReactElement {
  const plugins = usePlugins(),
    store = useStore(),
    sessions = useAtomValue(agentSessionsAtom),
    requests = useAtomValue(allPendingAskUserRequestsAtom),
    session = sessions.find(s => s.id === sessionId),
    request = requests.get(sessionId)?.[0];
  if (!session || !request) return <>{fallback}</>;
  const raw = Array.isArray(request.toolInput.questions) ? request.toolInput.questions as Array<Record<string, unknown>> : [];
  const pendingInteraction = {
    questions: request.questions.map((q, index) => ({
      ...q,
      ...raw[index],
      id: String(raw[index]?.id ?? index),
      detail: raw[index]?.detail,
      intent: raw[index]?.intent
    })),
    answer: async (input: {
      answers: Array<{
        id: string;
        selected?: string[];
        custom?: string;
      }>;
    }) => {
      const answers: Record<string, string> = {};
      for (const a of input.answers) {
        const index = raw.findIndex((q, i) => String(q.id ?? i) === a.id),
          question = request.questions[index];
        if (!question) throw Error('问题已失效');
        answers[question.question] = a.custom?.trim() || a.selected?.join(', ') || '';
      }
      await window.electronAPI.respondAskUser({
        requestId: request.requestId,
        answers
      });
      store.set(allPendingAskUserRequestsAtom, all => {
        const next = new Map(all);
        next.set(sessionId, (next.get(sessionId) ?? []).filter(r => r.requestId !== request.requestId));
        return next;
      });
    },
    dismiss: () => window.electronAPI.stopAgent(sessionId)
  };
  const props = {
    sessionId,
    workspaceId: session.workspaceId,
    pendingInteraction
  };
  const entries = plugins.filter(p => p.entry.access?.workspaceIds.includes(session.workspaceId ?? '')).flatMap(p => p.composerItems.filter(row => typeof row.matches === 'function' && (row.matches as (v: unknown) => boolean)(props)).map(row => ({
    p,
    row
  })));
  return entries.length ? <>{entries.map(({
      p,
      row
    }) => <PluginComponent key={p.id + '/' + row.id} installation={p} row={row} props={props} />)}</> : <>{fallback}</>;
}
export function PluginAttachmentPicker({
  sessionId
}: {
  sessionId: string;
}): React.ReactElement | null {
  const plugins = usePlugins(),
    session = useAtomValue(agentSessionsAtom).find(s => s.id === sessionId),
    store = useStore(),
    [open, setOpen] = React.useState(false),
    [source, setSource] = React.useState(''),
    [query, setQuery] = React.useState(''),
    [items, setItems] = React.useState<PluginResource[]>([]),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(''),
    generation = React.useRef(0);
  const sources = plugins.filter(p => p.entry.access?.workspaceIds.includes(session?.workspaceId ?? '')).flatMap(p => p.attachmentSources.map(row => ({
      p,
      row,
      key: p.id + '/' + row.id
    }))),
    selected = sources.find(s => s.key === source) ?? sources[0];
  const search = async () => {
    if (!selected) return;
    const epoch = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const contract = selected.row.search as {
          name: string;
          output?: {
            parse: (v: unknown) => unknown;
          };
        },
        value = await selected.p.invoke(contract.name, {
          query
        }),
        parsed = (contract.output?.parse(value) ?? value) as {
          items: PluginResource[];
        };
      if (epoch === generation.current) setItems(parsed.items);
    } catch (error) {
      if (epoch === generation.current) setError(String(error));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  if (!sources.length) return null;
  return <><Button size="sm" variant="ghost" onClick={() => setOpen(true)}>插件资源</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{selected?pluginText(selected.p,selected.row.pickerTitle,'添加插件资源'):'添加插件资源'}</DialogTitle><DialogDescription>搜索并将资源正文加入当前消息。</DialogDescription></DialogHeader><label className="text-sm">资源来源<select aria-label="插件资源来源" value={selected?.key} className="ml-2 rounded border border-input bg-background p-2" onChange={e => {
            generation.current++;
            setSource(e.target.value);
            setItems([]);
            setError('');
          }}>{sources.map(s => <option key={s.key} value={s.key}>{pluginText(s.p,s.row.title,s.row.id)}</option>)}</select></label><form className="flex gap-2" onSubmit={e => {
          e.preventDefault();
          void search();
        }}><input aria-label="搜索插件资源" placeholder={String(selected?.row.searchPlaceholder ?? '搜索…')} value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 rounded border border-input bg-background p-2" /><Button disabled={busy} type="submit">{busy ? '搜索中…' : '搜索'}</Button></form>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="max-h-72 overflow-auto">{items.map(item => <button type="button" key={item.id} className="block w-full rounded p-3 text-left hover:bg-muted" onClick={() => {
            if (selected) {
              addPluginAttachment(store, sessionId, {
                pluginId: selected.p.id,
                sourceId: selected.row.id,
                item
              });
              setOpen(false);
            }
          }}><span className="text-sm font-medium">{item.identifier} · {item.title}</span><span className="block text-xs text-muted-foreground">{item.subtitle}</span></button>)}</div></DialogContent></Dialog></>;
}
export function PluginAttachmentChips({
  sessionId
}: {
  sessionId: string;
}): React.ReactElement | null {
  const [all, setAll] = useAtom(pluginAttachmentsAtom),
    items = all[sessionId] ?? [];
  if (!items.length) return null;
  return <div className="flex flex-wrap gap-2 px-3 pt-2">{items.map(item => <span key={item.pluginId + '/' + item.sourceId + '/' + item.item.id} className="inline-flex items-center gap-2 rounded border border-border bg-muted px-2 py-1 text-xs">{item.item.identifier} · {item.item.title}<button type="button" aria-label={'移除资源 ' + item.item.title} onClick={() => setAll(all => ({
        ...all,
        [sessionId]: (all[sessionId] ?? []).filter(v => v !== item)
      }))}>×</button></span>)}</div>;
}
export function PluginWorkspaceBadges({
  workspaceId
}: {
  workspaceId: string;
}): React.ReactElement | null {
  const plugins = usePlugins();
  return <>{plugins.filter(p => p.entry.access?.workspaceIds.includes(workspaceId)).flatMap(p => p.workspaceRowBadgeItems.map(row => <PluginComponent key={p.id + '/' + row.id} installation={p} row={row} props={{
      workspaceId
    }} />))}</>;
}
