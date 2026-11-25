import React, {useEffect, useRef, useState} from 'react';
import {control, list} from './bridge';
import type {RecordValue} from './bridge';
import {readChat} from './chat-client';
import type {MobileConversation, MobileChatChannel, MobileChatTool} from './chat-client';
import {Busy, Notice, Sheet} from './ui';

export function ChatSettings({conversation, onClose, onChanged, onDeleted, enabledTools}: {enabledTools?:string[];
  conversation: MobileConversation;
  onClose: () => void;
  onChanged: (row: MobileConversation, tools: string[]) => void;
  onDeleted: () => void;
}) {
  const [channels, setChannels] = useState<MobileChatChannel[]>([]);
  const [tools, setTools] = useState<MobileChatTool[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [channel, setChannel] = useState(conversation.channelId ?? '');
  const [model, setModel] = useState(conversation.modelId ?? '');
  const [effort, setEffort] = useState(conversation.reasoning?.effort ?? '');
  const [efforts, setEfforts] = useState<string[]>([]);
  const [title, setTitle] = useState(conversation.title);
  const [context, setContext] = useState(String(conversation.contextLength ?? 'infinite'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(() => {
    let alive = true;
    setBusy(true);
    void readChat({action: 'models'}).then(result => {
      if (!alive) return;
      setChannels(list(result.channels));
      const rows = list<MobileChatTool>(result.tools);
      setTools(rows);
      setSelectedTools(enabledTools??rows.filter(t => t.enabled && t.available).map(t => t.id));
      if (result.routingError) setError(String(result.routingError));
    }).catch(e => {if (alive) setError(String(e));}).finally(() => {if (alive) setBusy(false);});
    return () => {alive = false; generation.current++;};
  }, []);
  useEffect(() => {
    const epoch = ++generation.current;
    setEfforts([]);
    if (!channel || !model) return;
    void readChat({action: 'capabilities', channelId: channel, modelId: model}).then(r => {
      if (generation.current === epoch) setEfforts(list(r.efforts));
    }).catch(e => {if (generation.current === epoch) setError(String(e));});
  }, [channel, model]);
  const save = async (extra: RecordValue = {}, close = true) => {
    setBusy(true); setError('');
    try {
      const count = context === 'infinite' ? 'infinite' : Number(context);
      if (count !== 'infinite' && (!Number.isSafeInteger(count) || count < 0)) throw Error('上下文请填写非负整数，或 infinite');
      const result = await control('chat.action', {
        action: 'configure', id: conversation.id, title: title.trim(), channelId: channel, modelId: model,
        ...(effort ? {effort} : {}), contextLength: count, ...extra
      });
      onChanged(result.conversation as unknown as MobileConversation, selectedTools);
      if (close) onClose();
    } catch (e) {setError(String(e));} finally {setBusy(false);}
  };
  const remove = async () => {
    if (!confirm('永久删除此 Chat 对话及消息？')) return;
    setBusy(true);
    try {await control('chat.action', {action: 'delete', id: conversation.id}); onDeleted();}
    catch (e) {setError(String(e));} finally {setBusy(false);}
  };
  return <Sheet title="Chat 模型与选项" onClose={onClose}>
    <Notice text={error}/>{busy && <Busy/>}
    <label className="field">对话名称<input value={title} maxLength={200} onChange={e => setTitle(e.target.value)}/></label>
    <label className="field">供应商<select value={channel} disabled={busy} onChange={e => {setChannel(e.target.value);setModel('');setEffort('');}}>
      <option value="">选择供应商</option>{channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select></label>
    <label className="field">模型<select value={model} disabled={busy} onChange={e => {setModel(e.target.value);setEffort('');}}>
      <option value="">选择模型</option>{channels.find(c => c.id === channel)?.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select></label>
    {efforts.length > 0 && <label className="field">原始推理档位<select value={effort} disabled={busy} onChange={e => setEffort(e.target.value)}>
      <option value="">自动</option>{efforts.map(e => <option key={e} value={e}>{e}</option>)}
    </select></label>}
    <label className="field">上下文轮数<input value={context} onChange={e => setContext(e.target.value)} placeholder="infinite = 全部；0 = 不带历史"/></label>
    {tools.map(t => <label className="setting-row" key={t.id}><span>{t.name}<small>{t.available ? '本次手机会话可用' : '电脑尚未就绪'}</small></span>
      <input type="checkbox" checked={selectedTools.includes(t.id)} disabled={!t.available || busy} onChange={e => setSelectedTools(all => e.target.checked ? [...all, t.id] : all.filter(id => id !== t.id))}/>
    </label>)}
    <button className="primary full" disabled={busy || !channel || !model || !title.trim()} onClick={() => void save()}>保存并使用</button>
    <div className="button-row">
      <button disabled={busy || !channel || !model} onClick={() => void save({pinned: !conversation.pinned}, false)}>{conversation.pinned ? '取消置顶' : '置顶对话'}</button>
      <button disabled={busy || !channel || !model} onClick={() => void save({archived: !conversation.archived}, false)}>{conversation.archived ? '恢复对话' : '归档对话'}</button>
      <button className="danger" disabled={busy || conversation.running} onClick={() => void remove()}>删除对话</button>
    </div>
  </Sheet>;
}
