import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MessageSquareQuote, MessageCircleQuestion, Pencil, Trash2, Undo2 } from 'lucide-react';
import type { ConversationAnnotation } from '@proma/shared';
import { annotationMarker, parseAnnotations } from '@proma/shared';
import { rebaseMobileAnnotations } from './annotation-drafts';
import { control } from './bridge';
import type { RecordValue } from './bridge';
import { Sheet, Notice, CopyButton } from './ui';
interface State {
  revision: string;
  annotations: ConversationAnnotation[];
  preferences: Record<string, boolean>;
}
interface Offer {
  quote: string;
  messageId?: string;
  label: string;
  source?: ConversationAnnotation['source'];
}
export interface AnnotationContext {
  id: string;
  prepareSubmission: () => Promise<{
    marker: string;
    rows: ConversationAnnotation[];
  }>;
  rows: ConversationAnnotation[];
  busy: boolean;
  error: string;
  offer: (value: Offer) => void;
  clearSubmitted: (rows: ConversationAnnotation[]) => Promise<void>;
  marker: () => string;
  change: (fn: (rows: ConversationAnnotation[]) => ConversationAnnotation[]) => Promise<void>;
  edit: (row: ConversationAnnotation) => void;
  rewind?: (messageId: string) => Promise<void>;
}
const Context = createContext<AnnotationContext | undefined>(undefined);
export function useMobileAnnotations() {
  return useContext(Context);
}
export function AnnotationProvider({
  hostId,
  kind,
  id,
  children,
  onQuestion,
  onRewind,
  controllerRef,
  onCountChanged
}: {
  hostId: string;
  kind: 'agent' | 'chat';
  id: string;
  children: React.ReactNode;
  onQuestion: (result: RecordValue) => void;
  onRewind?: (messageId: string) => Promise<void>;
  controllerRef?: React.MutableRefObject<AnnotationContext | undefined>;
  onCountChanged?: (count: number) => void;
}) {
  const [state, setState] = useState<State>({
      revision: '',
      annotations: [],
      preferences: {}
    }),
    [offer, setOffer] = useState<Offer>(),
    [editId, setEditId] = useState(''),
    [comment, setComment] = useState(''),
    [question, setQuestion] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const current = useRef(state),
    epoch = useRef(0),
    writes = useRef<Promise<unknown>>(Promise.resolve());
  current.current = state;
  useEffect(() => {
    onCountChanged?.(state.annotations.length);
    return () => onCountChanged?.(0);
  }, [state.annotations.length, onCountChanged]);
  useEffect(() => {
    let active = true,
      polling = false;
    const timer = setInterval(() => {
      if (document.hidden || offer || busy || polling) return;
      polling = true;
      const before = current.current.revision;
      void read().then(value => {
        if (active && current.current.revision === before && value.revision !== current.current.revision) {
          current.current = value;
          setState(value);
        }
      }).catch(() => {}).finally(() => {
        polling = false;
      });
    }, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, offer, busy]);
  const editBaseline = useRef<ConversationAnnotation>();
  const localKey = 'tervell-annotation-input:' + hostId + ':' + kind + ':' + id;
  const read = () => control<State>('annotations.mobile-read', {
    kind,
    id
  });
  useEffect(() => {
    const e = ++epoch.current;
    void read().then(v => {
      if (e === epoch.current) setState(v);
    }).catch(e => setError(String(e)));
    return () => {
      epoch.current++;
    };
  }, [hostId, kind, id]);
  const change = (fn: (rows: ConversationAnnotation[]) => ConversationAnnotation[]): Promise<void> => {
    const e = epoch.current;
    const job = writes.current.catch(() => {}).then(async () => {
      const before = current.current.revision ? current.current : await read(),
        desired = fn(before.annotations);
      let saved: State;
      try {
        saved = await control<State>('annotations.mobile-write', {
          kind,
          id,
          revision: before.revision,
          annotations: desired
        });
      } catch (cause) {
        const fresh = await read();
        if (e === epoch.current) {
          current.current = fresh;
          setState(fresh);
        }
        if (fresh.revision === before.revision) throw cause;
        const merged = rebaseMobileAnnotations(before.annotations, desired, fresh.annotations);
        saved = await control<State>('annotations.mobile-write', {
          kind,
          id,
          revision: fresh.revision,
          annotations: merged
        });
      }
      if (e === epoch.current) {
        current.current = saved;
        setState(saved);
        setError('');
      }
    });
    const checked = job.catch(error => {
      if (e === epoch.current) setError(String(error));
      throw error;
    });
    writes.current = checked;
    return checked;
  };
  const open = (value: Offer, row?: ConversationAnnotation) => {
    if (!current.current.revision) {
      setError('正在同步电脑批注，请稍后重试。');
      return;
    }
    if (current.current.preferences[value.source?.kind ?? 'chat'] === false) {
      setError('电脑已关闭此类来源的批注，请在电脑的内置功能设置中开启。');
      return;
    }
    editBaseline.current = row;
    setOffer(value);
    setEditId(row?.id ?? '');
    setComment(row?.comment ?? '');
    setQuestion('');
    setError('');
    try {
      const saved = JSON.parse(localStorage.getItem(localKey) ?? 'null');
      if (!row && saved?.quote === value.quote) {
        setComment(String(saved.comment ?? ''));
        setQuestion(String(saved.question ?? ''));
      }
    } catch {/* 保留电脑草稿。 */}
  };
  useEffect(() => {
    if (!offer) return;
    try {
      localStorage.setItem(localKey, JSON.stringify({
        quote: offer.quote,
        comment,
        question
      }));
    } catch {
      setError('手机输入暂不能持久保存，请先复制内容。');
    }
  }, [offer, comment, question, localKey]);
  const save = async () => {
    if (!offer) return;
    setBusy(true);
    setError('');
    try {
      const row: ConversationAnnotation = {
        id: editId || crypto.randomUUID(),
        quote: offer.quote,
        comment,
        source: offer.source ?? {
          kind: 'chat',
          label: offer.label,
          sessionId: id,
          messageId: offer.messageId
        }
      };
      await change(rows => {
        if (editId && JSON.stringify(rows.find(r => r.id === editId)) !== JSON.stringify(editBaseline.current)) throw Error('这条批注已更新或被移除，手机输入保留，请核对后重试。');
        return editId ? rows.map(r => r.id === editId ? row : r) : [...rows, row];
      });
      localStorage.removeItem(localKey);
      setOffer(undefined);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const questionIdentity = useRef<{
    key: string;
    id: string;
  }>();
  const ask = async () => {
    if (!offer || !question.trim()) return;
    setBusy(true);
    setError('');
    try {
      const key = JSON.stringify([offer.messageId, offer.quote, question.trim()]);
      if (questionIdentity.current?.key !== key) questionIdentity.current = {
        key,
        id: crypto.randomUUID()
      };
      const result = await control('annotations.mobile-question', {
        kind,
        id,
        messageId: offer.messageId,
        quote: offer.quote,
        question: question.trim(),
        clientMessageId: questionIdentity.current.id
      });
      localStorage.removeItem(localKey);
      setOffer(undefined);
      onQuestion(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const context: AnnotationContext = {
    id,
    rows: state.annotations,
    busy,
    error,
    offer: v => open(v),
    edit: r => open({
      quote: r.quote,
      label: r.source.label,
      messageId: r.source.messageId,
      source: r.source
    }, r),
    change,
    clearSubmitted: submitted => change(rows => rows.filter(row => !submitted.some(sent => sent.id === row.id && JSON.stringify(sent) === JSON.stringify(row)))),
    marker: () => annotationMarker(current.current.annotations),
    prepareSubmission: async () => {
      await writes.current.catch(() => {});
      const fresh = await read();
      current.current = fresh;
      setState(fresh);
      return {
        rows: fresh.annotations,
        marker: annotationMarker(fresh.annotations)
      };
    },
    rewind: onRewind
  };
  if (controllerRef) controllerRef.current = context;
  useEffect(() => () => {
    if (controllerRef?.current?.id === id) controllerRef.current = undefined;
  }, [id]);
  return <Context.Provider value={context}>{children}{offer && <Sheet title={editId ? '编辑批注' : '批注与旁问'} onClose={() => {
      if (!busy && (!comment && !question || confirm('暂时关闭？本次输入保存在手机，电脑批注不会丢失。'))) setOffer(undefined);
    }}><small className="muted">{offer.label}</small><blockquote className="annotation-quote">{offer.quote}</blockquote><label className="field">批注评论<textarea aria-label="批注评论" rows={4} value={comment} onChange={e => setComment(e.target.value)} /></label><Notice text={error} /><button className="primary full" disabled={busy} onClick={() => void save()}><MessageSquareQuote size={17} />保存到当前会话批注</button><p className="muted">批注保存在电脑，与桌面共享；随下一条消息发送，失败时保留。</p><label className="field">围绕这段内容旁问<textarea aria-label="旁问问题" rows={3} value={question} onChange={e => setQuestion(e.target.value)} /></label><button className="full" disabled={busy || !question.trim()} onClick={() => void ask()}><MessageCircleQuestion size={17} />新建独立旁问</button><p className="muted">继承当前会话模型与推理选项，主会话继续保留。Agent 工具操作仍需批准。</p></Sheet>}</Context.Provider>;
}
export function AnnotationAction({
  text,
  messageId,
  label = '对话消息',
  source
}: {
  text: string;
  messageId?: string;
  label?: string;
  source?: ConversationAnnotation['source'];
}) {
  const context = useMobileAnnotations();
  if (!context || !text || !parseAnnotations(text).text.trim()) return null;
  return <button onPointerDown={e => e.preventDefault()} onClick={() => {
    const selection = window.getSelection(),
      selected = selection?.toString().trim(),
      quote = selected && text.includes(selected) ? selected : text;
    context.offer({
      quote: parseAnnotations(quote).text,
      messageId,
      label,
      source
    });
  }}><MessageSquareQuote size={14} />批注 / 旁问</button>;
}
export function AnnotationDrafts() {
  const context = useMobileAnnotations();
  if (!context) return null;
  return <>{context.error && <Notice text={context.error} />} {!!context.rows.length && <details className="annotation-drafts"><summary><MessageSquareQuote size={16} />{context.rows.length} 条待发送批注</summary>{context.rows.map(row => <article key={row.id}><small>{row.source.label}</small><blockquote>{row.quote}</blockquote>{row.comment && <p>{row.comment}</p>}<div className="button-row"><button onClick={() => context.edit(row)}><Pencil size={15} />编辑</button><button disabled={context.busy} onClick={() => void context.change(rows => rows.filter(r => r.id !== row.id)).catch(() => {})}><Trash2 size={15} />删除</button><CopyButton text={row.quote + (row.comment ? '\n\n' + row.comment : '')} /></div></article>)}</details>}</>;
}
export function SentAnnotations({
  text
}: {
  text: string;
}) {
  const rows = parseAnnotations(text).annotations;
  if (!rows.length) return null;
  return <details className="annotation-drafts"><summary><MessageSquareQuote size={15} />{rows.length} 条已发送批注</summary>{rows.map(row => <article key={row.id}><small>{row.source.label}</small><blockquote>{row.quote}</blockquote>{row.comment && <p>{row.comment}</p>}<CopyButton text={row.quote + (row.comment ? '\n\n' + row.comment : '')} /></article>)}</details>;
}
export function RewindAction({
  messageId
}: {
  messageId: string;
}) {
  const c = useMobileAnnotations();
  if (!c?.rewind) return null;
  return <button onClick={() => {
    if (confirm('回退对话到此处？后续对话会被移除，项目文件保持不变。')) void c.rewind!(messageId);
  }}><Undo2 size={14} />回退</button>;
}
export { annotationMarker, parseAnnotations };
export function FileAnnotationAction({
  content,
  path,
  digest,
  kind = 'file'
}: {
  content: string;
  path: string;
  digest?: string;
  kind?: 'file' | 'markdown' | 'diff';
}) {
  const c = useMobileAnnotations();
  if (!c || !content) return null;
  return <AnnotationAction text={content} label={path} source={{
    kind,
    label: path,
    sessionId: c.id,
    path,
    ...(digest && /^[a-f0-9]{64}$/.test(digest) ? {
      digest
    } : {})
  }} />;
}
