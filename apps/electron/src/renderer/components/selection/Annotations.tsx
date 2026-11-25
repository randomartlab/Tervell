import * as React from 'react';
import { createPortal } from 'react-dom';
import { useAtomValue, useStore } from 'jotai';
import { MessageSquareQuote, Trash2, Pencil, Copy, X } from 'lucide-react';
import type { ConversationAnnotation } from '@proma/shared';
import { parseAnnotations } from '@proma/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { copyTextToClipboard } from '@/lib/clipboard';
import { agentSessionsAtom, currentAgentSessionIdAtom } from '@/atoms/agent-atoms';
import { conversationsAtom } from '@/atoms/chat-atoms';
import { annotationStateAtom, loadAnnotations, changeAnnotations, rememberAnnotationSource, revealAnnotation } from './annotation-store';
import type { AnnotationOffer } from './annotation-store';
import { annotationDigest } from './annotation-source';
import { pluginMainTargetAtom } from '@/components/plugins/native-state';
import { settingsOpenAtom } from '@/atoms/settings-tab';
export function AnnotationDrafts({
  scope
}: {
  scope: string;
}): React.ReactElement | null {
  const store = useStore(),
    state = useAtomValue(annotationStateAtom),
    rows = state.drafts[scope] ?? [],
    [open, setOpen] = React.useState(false),
    [pinned, setPinned] = React.useState(false),
    [editing, setEditing] = React.useState<string | null>(null),
    [comment, setComment] = React.useState(''),
    [error, setError] = React.useState(''),
    [busy, setBusy] = React.useState(false);
  const composing = React.useRef(false);
  const save = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      await changeAnnotations(store, scope, all => all.map(row => row.id === id ? {
        ...row,
        comment
      } : row));
      setEditing(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const leave = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      if (!pinned && !editing) setOpen(false);
    }, 160);
  };
  const enter = () => clearTimeout(hoverTimer.current);
  if (!rows.length) return null;
  return <div className="px-3 pt-2" data-annotation-drafts={scope}><Popover open={open} onOpenChange={value => {
      if (!value && editing) return;
      setOpen(value);
      setPinned(value);
    }}><PopoverTrigger asChild><button type="button" onMouseEnter={() => {
          if (!editing) setOpen(true);
        }} onMouseLeave={leave} onClick={event => {
          event.preventDefault();
          setPinned(value => !value);
          setOpen(true);
        }} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-muted/70 px-3 text-xs text-muted-foreground"><MessageSquareQuote className="size-3.5" />{rows.length} 条批注</button></PopoverTrigger><PopoverContent onMouseEnter={enter} onMouseLeave={leave} onOpenAutoFocus={event => {
        if (!pinned) event.preventDefault();
      }} align="start" className="w-[min(420px,90vw)] p-0" onInteractOutside={event => {
        if (error || busy) {
          event.preventDefault();
          return;
        }
        if (editing) {
          setEditing(null);
          setError('');
        }
      }} onEscapeKeyDown={event => {
        if (editing) {
          event.preventDefault();
          setEditing(null);
        }
      }}><header className="flex items-center justify-between border-b border-border px-3 py-2 text-sm font-medium">草稿批注<Button variant="ghost" size="icon" className="size-7" aria-label="关闭批注" onClick={() => {
            setEditing(null);
            setOpen(false);
            setPinned(false);
          }}><X className="size-3.5" /></Button></header><div className="max-h-[55vh] overflow-auto divide-y divide-border">{rows.map(row => <article key={row.id} className="space-y-2 p-3"><div className="flex items-center gap-2"><button className="min-w-0 flex-1 truncate text-left text-xs text-muted-foreground hover:underline" onClick={() => void revealAnnotation(row).then(found => {
                if (!found) toast.info('原文位置已变化，批注快照仍保留');
              })}>{row.source.label}</button><Button size="icon" variant="ghost" className="size-7" aria-label="编辑评论" disabled={busy} onClick={() => {
                setPinned(true);
                setEditing(row.id);
                setComment(row.comment);
                setError('');
              }}><Pencil className="size-3.5" /></Button><Button size="icon" variant="ghost" className="size-7" aria-label="删除批注" disabled={busy} onClick={() => {
                setBusy(true);
                void changeAnnotations(store, scope, all => all.filter(a => a.id !== row.id)).catch(e => setError(String(e))).finally(() => setBusy(false));
              }}><Trash2 className="size-3.5" /></Button></div><blockquote className="max-h-32 overflow-auto border-l-2 border-primary/40 pl-2 text-sm whitespace-pre-wrap break-words">{row.quote}</blockquote>{editing === row.id ? <><Textarea aria-label="编辑批注评论" value={comment} onChange={e => setComment(e.target.value)} onCompositionStart={() => {
                composing.current = true;
              }} onCompositionEnd={() => {
                composing.current = false;
              }} onKeyDown={e => {
                if (e.nativeEvent.isComposing || composing.current) return;
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void save(row.id);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditing(null);
                }
              }} /><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={() => setEditing(null)}>取消</Button><Button size="sm" disabled={busy} onClick={() => void save(row.id)}>保存评论</Button></div></> : row.comment && <p className="text-sm whitespace-pre-wrap">{row.comment}</p>}</article>)}</div>{error && <p role="alert" className="px-3 pb-3 text-xs text-destructive">{error}；草稿保留，可重试。</p>}</PopoverContent></Popover></div>;
}
export function SentAnnotations({
  text
}: {
  text: string;
}): React.ReactElement | null {
  const rows = parseAnnotations(text).annotations;
  const [open, setOpen] = React.useState(false), target = useAtomValue(pluginMainTargetAtom), settingsOpen = useAtomValue(settingsOpenAtom);
  React.useEffect(() => { setOpen(false); }, [target, settingsOpen]);
  if (!rows.length) return null;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground"><MessageSquareQuote className="size-3.5" />{rows.length} 条批注</button></PopoverTrigger><PopoverContent className="w-[min(440px,90vw)] p-0"><header className="flex items-center justify-between px-3 py-2 text-sm font-medium border-b border-border">已发送批注<Button size="icon" variant="ghost" aria-label="复制全部批注" onClick={() => void copyTextToClipboard(rows.map(r => r.source.label + '\n' + r.quote + '\n' + r.comment).join('\n\n'))}><Copy className="size-4" /></Button></header><div className="max-h-[60vh] divide-y divide-border overflow-auto">{rows.map(row => <article key={row.id} className="p-3 space-y-2"><p className="text-xs text-muted-foreground">{row.source.label}</p><pre className="font-sans whitespace-pre-wrap break-words text-sm">{row.quote}</pre>{row.comment && <p className="text-sm whitespace-pre-wrap">{row.comment}</p>}</article>)}</div></PopoverContent></Popover>;
}
export function NativeAnnotations(): React.ReactElement | null {
  const store = useStore(),
    state = useAtomValue(annotationStateAtom),
    sessions = useAtomValue(agentSessionsAtom),
    chats = useAtomValue(conversationsAtom),
    [offer, setOffer] = React.useState<AnnotationOffer | null>(null),
    [scope, setScope] = React.useState(''),
    [comment, setComment] = React.useState(''),
    [error, setError] = React.useState(''),
    [busy, setBusy] = React.useState(false),
    composing = React.useRef(false),
    id = React.useRef('');
  const activeOffer = React.useRef(false),
    previousFocus = React.useRef<HTMLElement | null>(null),
    saving = React.useRef(false),
    recentFocus = React.useRef(new Map<string, string>());
  React.useEffect(() => {
    const remember = () => {
      const current = store.get(currentAgentSessionIdAtom),
        session = store.get(agentSessionsAtom).find(s => s.id === current);
      if (session?.workspaceId) recentFocus.current.set(session.workspaceId, session.id);
    };
    remember();
    return store.sub(currentAgentSessionIdAtom, remember);
  }, [store]);
  React.useEffect(() => {
    void loadAnnotations(store).catch(e => store.set(annotationStateAtom, all => ({
      ...all,
      error: String(e)
    })));
    const accept = (event: Event) => {
      const next = (event as CustomEvent<AnnotationOffer>).detail;
      if (!store.get(annotationStateAtom).preferences[next.source.kind]) return;
      if (activeOffer.current) {
        toast.info('请先保存或关闭当前批注；输入内容仍保留');
        return;
      }
      const available = store.get(agentSessionsAtom),
        conversations = store.get(conversationsAtom);
      if (!available.some(s => s.id === next.source.sessionId) && !conversations.some(c => c.id === next.source.sessionId)) return;
      activeOffer.current = true;
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      id.current = crypto.randomUUID();
      setOffer(next);
      setComment('');
      setError('');
      const sourceSession = available.find(s => s.id === next.source.sessionId);
      const current = store.get(currentAgentSessionIdAtom);
      const target = next.source.kind === 'chat' ? next.source.sessionId : available.find(s => s.id === (recentFocus.current.get(sourceSession?.workspaceId ?? '') ?? current) && s.workspaceId === sourceSession?.workspaceId)?.id ?? next.source.sessionId;
      setScope(conversations.some(c => c.id === target) ? 'chat:' + target : 'agent:' + target);
    };
    window.addEventListener('tervell-annotation-offer', accept);
    return () => window.removeEventListener('tervell-annotation-offer', accept);
  }, [store]);
  const close = () => {
    activeOffer.current = false;
    setOffer(null);
    previousFocus.current?.focus({
      preventScroll: true
    });
  };
  const commit = async () => {
    if (!offer || saving.current || composing.current) return;
    if (!comment.trim()) {
      close();
      return;
    }
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      if (offer.validate?.() === false) throw Error('原文已变化，请重新选择');
      let source = offer.source;
      if (source.path && ['file', 'markdown'].includes(source.kind)) {
        const file = await window.electronAPI.resolveAndReadFile(source.path, {
          sessionId: source.sessionId
        });
        if (file && !file.isTooLarge && !file.isBinary && (offer.documentText === undefined || offer.documentText === file.content)) source = {
          ...source,
          digest: await annotationDigest(file.content)
        };
      }
      if (offer.validate?.() === false) throw Error('保存期间原文已变化，请重新选择');
      const row: ConversationAnnotation = {
        id: id.current,
        quote: offer.text,
        comment,
        source
      };
      await changeAnnotations(store, scope, all => [...all.filter(r => r.id !== row.id), row]);
      rememberAnnotationSource(row.id, offer);
      close();
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      setError(String(e));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  React.useEffect(() => {
    if (!offer) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element)?.closest('[data-annotation-editor]')) void commit();
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  });
  if (!offer) return null;
  const sourceSession = sessions.find(s => s.id === offer.source.sessionId),
    targets = offer.source.kind === 'chat' && chats.some(c => c.id === offer.source.sessionId) ? chats.filter(c => c.id === offer.source.sessionId).map(c => ({
      id: 'chat:' + c.id,
      title: c.title
    })) : sessions.filter(s => s.workspaceId === sourceSession?.workspaceId && !s.archived).map(s => ({
      id: 'agent:' + s.id,
      title: s.title
    }));
  return createPortal(<div data-annotation-editor role="dialog" aria-label="添加批注" className="fixed z-[150] w-[min(380px,calc(100vw-24px))] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl" style={{
    left: Math.max(12, Math.min(offer.x, innerWidth - 392)),
    top: Math.max(12, Math.min(offer.y, innerHeight - 290))
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !error) void commit();
  }}><div className="mb-2 flex items-center gap-2"><MessageSquareQuote className="size-4" /><span className="text-sm font-medium">添加到对话</span><button aria-label="取消新批注" disabled={busy} className="ml-auto p-1" onClick={close}><X className="size-4" /></button></div><label className="text-xs text-muted-foreground">接收对话<select aria-label="接收对话" value={scope} onChange={e => setScope(e.target.value)} className="ml-2 max-w-60 rounded border border-border bg-background px-2 py-1 text-foreground">{targets.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><blockquote className="my-2 max-h-24 overflow-auto border-l-2 border-primary/40 pl-2 text-xs whitespace-pre-wrap">{offer.text}</blockquote><Textarea autoFocus aria-label="新批注评论" placeholder="写下评论；Enter 保存，Shift+Enter 换行" value={comment} onChange={e => setComment(e.target.value)} onCompositionStart={() => {
      composing.current = true;
    }} onCompositionEnd={() => {
      composing.current = false;
    }} onKeyDown={e => {
      if (composing.current || e.nativeEvent.isComposing) return;
      if (e.key === 'Enter' && !e.shiftKey || e.key === 'Escape') {
        e.preventDefault();
        void commit();
      }
    }} /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted-foreground">仅加入草稿，不发送</span><Button size="sm" disabled={busy || !state.loaded} onClick={() => void commit()}>{busy ? '保存中…' : error ? '重试保存' : '保存批注'}</Button></div>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}；输入内容已保留。</p>}</div>, document.body);
}
