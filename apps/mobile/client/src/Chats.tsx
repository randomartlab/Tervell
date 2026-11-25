import {AnnotationProvider,AnnotationDrafts,AnnotationAction,SentAnnotations,parseAnnotations} from './Annotations';
import type {AnnotationContext} from './Annotations';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Settings, Square, ArrowUp, Download, GitFork, ArrowLeft, Paperclip, X } from 'lucide-react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import { exportMobileText } from './export-file';
import type { LocalSettings } from './model';
import { Busy, Notice, Empty, IconButton, SearchBox, CopyButton } from './ui';
import { Markdown } from './Markdown';
import { mobileSendIdentity } from './send-identity';
import { readChat } from './chat-client';
import type { MobileConversation, MobileChatMessage } from './chat-client';
import { ChatAsset, uploadChatFile } from './ChatAttachments';
import type { ChatAttachment } from './ChatAttachments';
import { ChatSettings } from './ChatSettings';
export function Chats({
  hostId,
  preferences
}: {
  hostId: string;
  preferences: LocalSettings;
}) {
  const [rows, setRows] = useState<MobileConversation[]>([]);
  const [selected, setSelected] = useState<MobileConversation>();
  const [messages, setMessages] = useState<MobileChatMessage[]>([]);
  const [live, setLive] = useState<RecordValue>();
  const [running, setRunning] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [progress, setProgress] = useState('');
  const [annotationCount,setAnnotationCount]=useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [enabledTools, setEnabledTools] = useState<string[]>();
  const annotationRef=useRef<AnnotationContext>();
  const active = useRef('');
  const polling = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const before = useRef(0);
  const total = useRef(0);
  const loaded = useRef(false);
  const draftKey = 'tervell-chat-draft:' + hostId + ':' + (selected?.id ?? '');
  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(draftKey + ':attachments', JSON.stringify(attachments));
    } catch {
      setError('附件草稿保存失败，请先发送或复制消息。');
    }
  }, [attachments, draftKey]);
  const loadDirectory = async () => {
    const result = await readChat({
      action: 'list'
    });
    setRows(list(result.conversations));
  };
  const load = async (id: string, older = false) => {
    const result = await readChat({
      action: 'read',
      id,
      ...(older ? {
        before: before.current
      } : {})
    });
    if (active.current !== id) return;
    const incoming = list<MobileChatMessage>(result.messages);
    const shortened = Number(result.total) < total.current;
    total.current = Number(result.total);
    setSelected(result.conversation as unknown as MobileConversation);
    setMessages(all => {
      if (shortened) return incoming;
      const merged = new Map(all.map(m => [m.id, m]));
      for (const m of incoming) merged.set(m.id, m);
      return [...merged.values()].sort((a, b) => a.createdAt - b.createdAt);
    });
    if (older || shortened || !loaded.current) {
      before.current = Number(result.before);
      setHasOlder(Boolean(result.hasOlder));
    }
    loaded.current = true;
    setLive(result.live ? plain(result.live) : undefined);
    setRunning(result.running === true);
    if (result.error) setError(String(result.error));
  };
  useEffect(() => {
    void loadDirectory().catch(e => setError(String(e)));
    return () => {
      active.current = '';
    };
  }, [hostId]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden || polling.current) return;
      polling.current = true;
      void (active.current ? load(active.current) : loadDirectory()).catch(e => setError(String(e))).finally(() => {
        polling.current = false;
      });
    }, 1600);
    return () => clearInterval(timer);
  }, [selected?.id, messages.length]);
  useEffect(() => {
    if (follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, live]);
  const open = async (row: MobileConversation) => {
    active.current = row.id;
    follow.current = true;
    before.current = 0;
    total.current = 0;
    loaded.current = false;
    setSelected(row);
    setMessages([]);
    setLive(undefined);
    setHasOlder(false);
    setError('');
    try {
      try {
        const saved = JSON.parse(localStorage.getItem('tervell-chat-draft:' + hostId + ':' + row.id + ':attachments') ?? '[]');
        setAttachments(Array.isArray(saved) ? saved.filter(a => typeof a?.id === 'string' && typeof a.filename === 'string') : []);
      } catch {
        setAttachments([]);
      }
      setDraft(localStorage.getItem('tervell-chat-draft:' + hostId + ':' + row.id) ?? '');
      let saved: unknown = null;
      try {
        saved = JSON.parse(localStorage.getItem('tervell-chat-tools:' + hostId + ':' + row.id) ?? 'null');
      } catch {/* 工具选择损坏时沿用电脑默认。 */}
      setEnabledTools(Array.isArray(saved) ? saved.filter((s): s is string => typeof s === 'string') : undefined);
      await load(row.id);
    } catch (e) {
      setError(String(e));
    }
  };
  const run = async (action: string, values: RecordValue = {}) => {
    setBusy(true);
    setError('');
    try {
      return await control('chat.action', {
        action,
        ...values
      });
    } catch (e) {
      setError(String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const create = async () => {
    const result = await run('create');
    if (result) {
      await open(result.conversation as unknown as MobileConversation);
      setSettings(true);
    }
  };
  const send = async () => {
    if (!selected || !draft.trim() && !attachments.length && !annotationCount) return;
    const submittedDraft = draft,
      submittedAttachments = attachments;
    const annotationsController=annotationRef.current;
    const submittedAnnotations=await annotationsController?.prepareSubmission().catch(e=>{setError(String(e));return undefined;});
    if(!submittedAnnotations)return;
    const text=[draft.trim(),submittedAnnotations.marker].filter(Boolean).join('\n\n'),
      identityKey = draftKey + ':send';
    let identity;
    try {
      identity = mobileSendIdentity(localStorage.getItem(identityKey), JSON.stringify({
        text,
        tools: enabledTools ?? null,
        attachments: attachments.map(a => a.id)
      }), () => crypto.randomUUID());
      localStorage.setItem(identityKey, JSON.stringify(identity));
    } catch {
      setError('手机存储不可用，未发送；请先恢复本地草稿存储。');
      return;
    }
    const result = await run('send', {
      id: selected.id,
      text,
      attachmentIds: attachments.map(a => a.id),
      clientMessageId: identity.id,
      ...(enabledTools ? {
        enabledToolIds: enabledTools
      } : {})
    });
    if (!result) return;
    if (result.duplicate && result.status === 'failed') {
      setError('这条消息上次发送未完成，请先核对历史；需要重新发送时修改正文后再提交。');
      return;
    }
    await annotationsController?.clearSubmitted(submittedAnnotations.rows).catch(()=>setError('消息已发送，批注清理未完成；请核对待发送批注。'));
    setDraft(value => value === submittedDraft ? '' : value);
    setAttachments(all => all.filter(a => !submittedAttachments.some(v => v.id === a.id)));
    if (localStorage.getItem(draftKey) === submittedDraft) localStorage.removeItem(draftKey);
    localStorage.removeItem(identityKey);
    await load(selected.id);
  };
  const attach = async (files: File[]) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      for (const file of files.slice(0, 30 - attachments.length)) {
        const attachment = await uploadChatFile(selected.id, file, setProgress);
        const key = 'tervell-chat-draft:' + hostId + ':' + selected.id + ':attachments';
        const saved: ChatAttachment[] = JSON.parse(localStorage.getItem(key) ?? '[]');
        localStorage.setItem(key, JSON.stringify([...saved, attachment]));
        setAttachments(all => [...all, attachment]);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
      setProgress('');
      if (fileInput.current) fileInput.current.value = '';
    }
  };
  const exportChat = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      let content = '',
        offset = 0,
        revision = '';
      for (;;) {
        const part = await control('chat.read', {
          action: 'export',
          id: selected.id,
          format: 'markdown',
          offset,
          ...(revision ? {
            revision
          } : {})
        });
        content += String(part.content);
        if (!part.hasMore) break;
        offset = Number(part.nextOffset);
        revision = String(part.revision);
      }
      await exportMobileText(selected.title.replace(/[\\/:*?"<>|]/g, '-') + '.md', 'text/markdown', content);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const back = () => {
    active.current = '';
    setSelected(undefined);
    setSettings(false);
    void loadDirectory().catch(e => setError(String(e)));
  };
  if (!selected) return <div className="chat-directory">
    <div className="panel-toolbar"><h2>Chat 对话</h2><span /><button className="primary" disabled={busy} onClick={() => void create()}><Plus size={17} />新建 Chat</button></div>
    <p className="muted">与电脑 Chat 模式共享对话。Agent 和各 CLI 内核在“工作区会话”中操作。</p>
    <SearchBox value={query} onChange={setQuery} placeholder="搜索 Chat 对话" /><Notice text={error} />
    {rows.filter(c => c.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt).map(c => <button className="setting-row" key={c.id} onClick={() => void open(c)}><span><strong>{c.title}</strong><small>{c.running ? '正在回复' : c.modelId ?? '尚未选择模型'}{c.archived ? ' · 已归档' : ''}</small></span></button>)}
    {!rows.length && <Empty title="还没有 Chat 对话" detail="新建后选择电脑已配置的供应商和完整模型推理档位。" />}
  </div>;
  return <AnnotationProvider key={hostId+selected.id} hostId={hostId} kind="chat" id={selected.id} controllerRef={annotationRef} onCountChanged={setAnnotationCount} onQuestion={result=>{if(result.conversation)void open(result.conversation as unknown as MobileConversation);}}><div className="mobile-chat">
    <div className="panel-toolbar"><IconButton label="返回 Chat 列表" disabled={busy} onClick={back}><ArrowLeft size={20} /></IconButton>
      <span><strong>{selected.title}</strong><small>{selected.modelId ?? '请先选择模型'}</small></span>
      <IconButton label="导出 Chat" disabled={busy} onClick={() => void exportChat()}><Download size={20} /></IconButton>
      <IconButton label="Chat 模型与选项" onClick={() => setSettings(true)}><Settings size={20} /></IconButton>
    </div><Notice text={error} />
    <div className="mobile-chat-history" ref={scroll} onScroll={() => {
      if (scroll.current) follow.current = scroll.current.scrollHeight - scroll.current.scrollTop - scroll.current.clientHeight < 90;
    }}>
      {hasOlder && <button className="full" disabled={busy} onClick={() => void load(selected.id, true).catch(e => setError(String(e)))}>读取更早消息</button>}
      {messages.map(message => <article key={message.id} className={'chat-message chat-' + message.role}>
        <div className="section-caption">{message.role === 'user' ? '你' : message.role === 'assistant' ? '助手' : '系统'}<small>{new Date(message.createdAt).toLocaleString()}</small></div>
        {message.reasoning && <details className="process process-reasoning" open={preferences.reasoning === 'expanded'}><summary>推理过程</summary><Markdown text={message.reasoning} /></details>}
        <Markdown text={parseAnnotations(message.content).text} /><SentAnnotations text={message.content}/>
        {!!message.toolActivities?.length && <details className="process process-shell" open={preferences.tools === 'expanded'}><summary>工具与操作</summary>
          {message.toolActivities.map((t, index) => <div key={index}><strong>{String(t.toolName)}</strong>{t.type === 'result' && <pre className="tool-output">{String(t.result ?? '')}</pre>}</div>)}
        </details>}
        {message.attachments?.map(a => <ChatAsset key={a.id} conversationId={selected.id} messageId={message.id} attachment={a} />)}
        {message.error && <Notice text={message.error} />}
        <div className="button-row"><CopyButton text={parseAnnotations(message.content).text} /><AnnotationAction text={message.content} messageId={message.id}/><button className="text-button" disabled={busy} onClick={() => void run('fork', {
            id: selected.id,
            messageId: message.id
          }).then(r => {
            if (r) void open(r.conversation as unknown as MobileConversation);
          })}><GitFork size={15} />从这里分叉</button></div>
      </article>)}
      {live && <article className="chat-message chat-assistant">
        {live.truncated === true && <Notice text="本次实时快照过长，暂显示尾部；回复完成后可读取全部落盘记录。" />}
        {!!live.reasoning && <details className="process process-reasoning" open={preferences.reasoning !== 'collapsed'}><summary>正在推理</summary><Markdown text={String(live.reasoning)} /></details>}
        <Markdown text={String(live.content ?? '')} />
        {list(live.toolActivities).map((t, i) => <p className="muted" key={i}>{String(t.toolName)} · {t.type === 'result' ? '已完成' : '运行中'}</p>)}
      </article>}
      {running && <Busy text="电脑正在回复，可离开后继续查看…" />}
    </div>
    <div className="chat-composer"><AnnotationDrafts/>{progress && <Busy text={progress} />}
      <div className="button-row">{attachments.map(a => <button key={a.id} disabled={busy} aria-label={'移除附件 ' + a.filename} onClick={() => setAttachments(all => all.filter(v => v.id !== a.id))}><Paperclip size={14} />{a.filename}<X size={14} /></button>)}</div>
      <input hidden multiple type="file" ref={fileInput} onChange={e => void attach(Array.from(e.target.files ?? []))} /><textarea aria-label="Chat 消息" rows={3} value={draft} onChange={e => {
        setDraft(e.target.value);
        try {
          localStorage.setItem(draftKey, e.target.value);
        } catch {
          setError('草稿保存失败，请先发送或复制正文。');
        }
      }} placeholder="发送到桌面 Chat…" />
      <div className="panel-toolbar"><IconButton label="添加 Chat 文件或图片" disabled={busy || attachments.length >= 30} onClick={() => fileInput.current?.click()}><Paperclip size={19} /></IconButton><button disabled={busy} onClick={() => setSettings(true)}>{selected.modelId ?? '选择模型'}{selected.reasoning?.effort ? ' · ' + selected.reasoning.effort : ''}</button><span />
        {running ? <button disabled={busy} onClick={() => void run('stop', {
          id: selected.id
        })}><Square size={18} />停止</button> : <button className="primary" disabled={busy || !draft.trim() && !attachments.length && !annotationCount || !selected.modelId} onClick={() => void send()}><ArrowUp size={20} />发送</button>}
      </div>
    </div>
    {settings && <ChatSettings enabledTools={enabledTools} conversation={{
      ...selected,
      running
    }} onClose={() => setSettings(false)} onDeleted={back} onChanged={(row, tools) => {
      setSelected(row);
      setEnabledTools(tools);
      try {
        localStorage.setItem('tervell-chat-tools:' + hostId + ':' + row.id, JSON.stringify(tools));
      } catch {
        setError('工具选择未能保存在手机；当前页面仍按所选工具执行。');
      }
    }} />}
  </div></AnnotationProvider>;
}
