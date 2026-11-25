import {AnnotationAction,SentAnnotations,RewindAction} from './Annotations';
import React, { useEffect, useState } from 'react';
import { Brain, ChevronRight, Terminal, FileText, FilePenLine, Search, Globe, Check, AlertTriangle, GitFork, Copy, ArrowDownToLine, LoaderCircle, MessageSquarePlus } from 'lucide-react';
import type { TimelineEntry, Activity, LocalSettings } from './model';
import { cleanMessage } from './model';
import { Markdown, Code } from './Markdown';
import { CopyButton } from './ui';
import { control, plain, readable, list } from './bridge';
import {MobileTimelineItem} from './Plugins';
function ToolIcon({
  kind
}: {
  kind: string;
}) {
  const Icon = kind === 'reasoning' ? Brain : kind === 'shell' ? Terminal : kind === 'edit' || kind === 'write' ? FilePenLine : kind === 'search' ? Search : kind === 'fetch' ? Globe : FileText;
  return <Icon size={16} />;
}
function ToolBody({
  detail
}: {
  detail: Record<string, unknown>;
}) {
  const kind = detail.type;
  if (kind === 'read' || kind === 'write') return <><div className="file-caption">{String(detail.filePath ?? '文件')}</div><Code source={String(detail.content ?? '')} language={String(detail.filePath ?? '').split('.').at(-1)} /></>;
  if (kind === 'edit') return <div className="diff-body"><pre className="removed">{String(detail.oldString ?? '')}</pre><pre className="added">{String(detail.newString ?? '')}</pre></div>;
  if (kind === 'shell') return <><Code source={String(detail.command ?? '')} language="bash" /><pre className="tool-output">{String(detail.output ?? '')}</pre></>;
  if (kind === 'search' || kind === 'fetch') return <><div className="file-caption">{String(detail.query ?? detail.url ?? '结果')}</div><pre className="tool-output">{String(detail.content ?? detail.result ?? '')}</pre></>;
  return <pre className="tool-output">{readable(detail)}</pre>;
}
export function Process({
  id,
  kind,
  label,
  status,
  body,
  detail,
  preferences,
  sessionId
}: {
  id: string;
  kind: string;
  label: string;
  status: string;
  body: string;
  detail?: Record<string, unknown>;
  preferences: LocalSettings;
  sessionId: string;
}) {
  const policy = kind === 'reasoning' ? preferences.reasoning : preferences.tools;
  const initial = policy === 'expanded' || policy === 'balanced' && (status === 'running' || status === 'failed');
  const [open, setOpen] = useState(initial),
    [translation, setTranslation] = useState(''),
    [original, setOriginal] = useState(false),
    [translating, setTranslating] = useState(false),
    [error, setError] = useState('');
  useEffect(() => setOpen(initial), [policy, status]);
  const translate = async () => {
    setTranslating(true);
    setError('');
    try {
      let job = await control('activity.mobile-translate', {
        text: body.slice(0, 12000)
      }, {
        sessionId
      });
      while (job.phase === 'running' || job.phase === 'queued') {
        await new Promise(r => setTimeout(r, 700));
        job = await control('activity.mobile-status', {
          id: job.id
        }, {
          sessionId
        });
      }
      if (job.phase !== 'done') throw Error(String(job.error ?? '翻译未完成'));
      setTranslation(String(job.translation));
      setOriginal(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setTranslating(false);
    }
  };
  return <section className={'process process-' + kind + ' status-' + status} data-entry-id={id}><button className="process-heading" onClick={() => setOpen(!open)} aria-expanded={open}><ToolIcon kind={kind} /><span>{label}</span>{status === 'running' ? <LoaderCircle size={14} className="spin" /> : status === 'failed' ? <AlertTriangle size={14} /> : <Check size={13} />}<ChevronRight size={14} className={open ? 'rotate' : ''} /></button>{open && <div className="process-content">{kind === 'reasoning' ? <>{translation && <div className="translation-label">中文译文 · 原文保留<button onClick={() => setOriginal(!original)}>{original ? '查看中文' : '查看原文'}</button></div>}<Markdown text={translation && !original ? translation : body} />{!translation && <button className="text-button" disabled={translating || status === 'running'} onClick={() => void translate()}>{translating ? '正在翻译…' : '中文显示（需电脑开启并选择翻译模型）'}</button>}{error && <small className="error">{error}</small>}</> : detail ? <ToolBody detail={detail} /> : <pre className="tool-output">{body}</pre>}</div>}</section>;
}
function MessageImages({
  text,
  entryId,
  sessionId
}: {
  text: string;
  entryId: string;
  sessionId: string;
}) {
  const hasAttachments = text.includes('[[tervell-asset:'),
    [rows, setRows] = useState<Array<{
      id: string;
      label: string;
      mediaType: string;
    }>>([]),
    [images, setImages] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    if (!hasAttachments) return;
    let alive = true;
    void control('session.attachments', {
      entryId
    }, {
      sessionId
    }).then(r => {
      if (alive) setRows(list(r.entries));
    }).catch(e => {
      if (alive) setError(String(e));
    });
    return () => {
      alive = false;
    };
  }, [entryId, sessionId, hasAttachments]);
  const imageUrls = React.useRef(new Set<string>());
  const open = async (id: string) => {
    setBusy(id);
    setError('');
    try {
      let offset = 0,
        parts: string[] = [],
        media = '';
      for (;;) {
        const r = await control('session.attachment-bytes', {
          entryId,
          attachmentId: id,
          offset
        }, {
          sessionId
        });
        parts.push(atob(String(r.data)));
        media = String(r.mediaType);
        if (!r.hasMore) break;
        offset = Number(r.nextOffset);
      }
      const bytes = Uint8Array.from(parts.join(''), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], {
        type: media
      }));
      imageUrls.current.add(url);
      setImages(v => ({
        ...v,
        [id]: url
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy('');
    }
  };
  useEffect(() => () => {
    for (const url of imageUrls.current) URL.revokeObjectURL(url);
  }, []);
  if (!hasAttachments) return null;
  return <div className="message-images">{rows.filter(r => r.mediaType?.startsWith('image/')).map(row => images[row.id] ? <a key={row.id} href={images[row.id]} onClick={e => e.preventDefault()}><img src={images[row.id]} alt={row.label} /></a> : <button key={row.id} onClick={() => void open(row.id)} disabled={!!busy}>{busy === row.id ? '读取图片…' : '查看图片 · ' + row.label}</button>)}{error && <small className="error">{error}</small>}</div>;
}
export function Entry(props: {
  entry: TimelineEntry; preferences: LocalSettings; sessionId: string;
  onFork: (id: string) => void; onQuote: (text: string) => void;
}) {
  const {entry, sessionId} = props, text = String(entry.item.text ?? '');
  const actions = ['assistant_message', 'user_message'].includes(entry.item.type) ? <footer className="message-actions"><CopyButton text={cleanMessage(text)} /><AnnotationAction text={text} messageId={String(entry.item.messageId??entry.id.replace(/:\d+$/,''))}/><button onClick={() => props.onQuote(cleanMessage(text))}><MessageSquarePlus size={14} />引用</button>{entry.item.type === 'assistant_message' && <button aria-label="从此处分叉" onClick={() => props.onFork(String(entry.item.messageId ?? entry.id.replace(/:\d+$/, '')))}><GitFork size={14} />分叉</button>}{entry.item.type==='assistant_message'&&<RewindAction messageId={String(entry.item.messageId??entry.id.replace(/:\d+$/,''))}/>}</footer> : undefined;
  return <MobileTimelineItem id={entry.id} item={entry.item} sessionId={sessionId} timestamp={entry.timestamp} fallback={<NativeEntry {...props} />} actions={actions} />;
}
function NativeEntry({
  entry,
  preferences,
  sessionId,
  onFork,
  onQuote
}: {
  entry: TimelineEntry;
  preferences: LocalSettings;
  sessionId: string;
  onFork: (id: string) => void;
  onQuote: (text: string) => void;
}) {
  const item = entry.item,
    [full, setFull] = useState(''),
    [loading, setLoading] = useState(false),
    [more, setMore] = useState(!!item.truncated),
    [offset, setOffset] = useState(0),
    [revision, setRevision] = useState(''),
    [readError, setReadError] = useState('');
  const text = full || String(item.text ?? item.message ?? ''),
    user = item.type === 'user_message';
  const expand = async () => {
    setLoading(true);
    try {
      const r = await control('session.entry', {
        entryId: entry.id,
        offset,
        ...(revision ? {
          revision
        } : {})
      }, {
        sessionId
      });
      setFull(v => v + String(r.content ?? ''));
      setOffset(Number(r.nextOffset));
      setRevision(String(r.revision));
      setMore(Boolean(r.hasMore));
    } catch (error) {
      setReadError(String(error));
    } finally {
      setLoading(false);
    }
  };
  if (item.type === 'reasoning' || item.type === 'tool_call') {
    const detail = plain(item.detail);
    return <><Process id={entry.id} kind={item.type === 'reasoning' ? 'reasoning' : String(detail.type ?? 'tool')} label={item.type === 'reasoning' ? '思考过程' : String(detail.filePath ?? detail.command ?? item.name ?? '工具调用')} status={String(item.status ?? 'completed')} body={text} detail={item.type === 'tool_call' ? detail : undefined} preferences={preferences} sessionId={sessionId} />{readError && <small role="alert">{readError}</small>}{more && <button className="text-button" onClick={() => void expand()} disabled={loading}>读取完整过程</button>}{full && item.type === 'tool_call' && <pre className="tool-output">{full}</pre>}</>;
  }
  if (item.type === 'compaction') return <div className="timeline-event">上下文已整理</div>;
  if (!['user_message', 'assistant_message'].includes(item.type)) return <div className={'timeline-event ' + (item.type === 'error' ? 'error' : '')}><Markdown text={text || readable(item)} /></div>;
  return <article className={'message ' + (user ? 'user-message' : 'assistant-message')} data-entry-id={entry.id}><div className="message-label">{user ? '你' : 'Tervell'}<time>{new Date(entry.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}</time></div><Markdown text={cleanMessage(text)} /><SentAnnotations text={text}/><MessageImages text={text} entryId={entry.id} sessionId={sessionId} />{readError && <small role="alert">{readError}</small>}{more && <button className="text-button" disabled={loading} onClick={() => void expand()}><ArrowDownToLine size={14} />{loading ? '读取中…' : '读取后续完整内容'}</button>}<footer className="message-actions"><CopyButton text={cleanMessage(text)} /><AnnotationAction text={text} messageId={String(item.messageId??entry.id.replace(/:\d+$/,''))}/><button onClick={() => onQuote(cleanMessage(text))}><MessageSquarePlus size={14} />引用</button>{!user && <button aria-label="从此处分叉" onClick={() => onFork(String(item.messageId ?? entry.id.replace(/:\d+$/, '')))}><GitFork size={14} />分叉</button>}{!user&&<RewindAction messageId={String(item.messageId??entry.id.replace(/:\d+$/,''))}/>}</footer></article>;
}
export function LiveProcesses({
  rows,
  preferences,
  sessionId
}: {
  rows: Activity[];
  preferences: LocalSettings;
  sessionId: string;
}) {
  return <>{rows.filter(row => row.status === 'running').map(row => <MobileTimelineItem key={row.id} id={row.id} item={{type: row.kind === 'reasoning' ? 'reasoning' : 'tool_call', text: row.body, name: row.label, status: row.status}} sessionId={sessionId} timestamp={row.createdAt} streaming fallback={<Process id={row.id} kind={row.kind} label={row.label} status={row.status} body={row.translation ?? row.body} preferences={preferences} sessionId={sessionId} />} />)}</>;
}
