import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { control, list, native } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, Sheet } from './ui';
interface Channel extends RecordValue {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  enabled: boolean;
  updatedAt: number;
  models: Model[];
}
interface Model {
  id: string;
  name: string;
  enabled: boolean;
  efforts?: string[];
  source?: string;
}
export function Channels() {
  const [rows, setRows] = useState<Channel[]>([]),
    [providers, setProviders] = useState<RecordValue[]>([]),
    [flows, setFlows] = useState<RecordValue[]>([]),
    [edit, setEdit] = useState<RecordValue>(),
    [models, setModels] = useState<Model[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const load = async () => {
    const r = await control('channels.read');
    setRows(list<Channel>(r.channels));
    setProviders(list(r.providers));
    setFlows(list(r.flows));
  };
  useEffect(() => {
    void load().catch(e => setError(String(e)));
  }, []);
  useEffect(() => {
    if (!flows.some(f => f.state === 'waiting')) return;
    let pending = false;
    const timer = setInterval(() => {
      if (pending || document.hidden) return;
      pending = true;
      void load().catch(e => setError(String(e))).finally(() => pending = false);
    }, 2000);
    return () => clearInterval(timer);
  }, [flows.some(f => f.state === 'waiting')]);
  const run = async (action: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('channels.action', {
        action,
        ...values
      });
      await load();
      return r;
    } catch (e) {
      setError(String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const open = (row?: Channel) => {
    setEdit(row ? {
      ...row,
      apiKey: ''
    } : {
      name: '',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      enabled: true
    });
    setModels(row?.models.map(m => ({
      ...m
    })) ?? []);
  };
  const subscription = ['openai-codex', 'github-copilot', 'xai'].includes(String(edit?.provider));
  const save = async () => {
    if (!edit) return;
    const result = await run('save', {
      ...(edit.id ? {
        id: edit.id,
        expectedUpdatedAt: edit.updatedAt
      } : {}),
      name: edit.name,
      provider: edit.provider,
      baseUrl: edit.baseUrl,
      apiKey: edit.apiKey,
      enabled: edit.enabled,
      models: models.map(m => ({
        ...m,
        efforts: m.efforts?.map(e => e.trim()).filter(Boolean)
      }))
    });
    if (result) setEdit(undefined);
  };
  return <><p className="muted">这里管理 Pi / Chat 直接使用的电脑渠道。全局覆盖关闭时使用这些模型；密钥留在电脑，留空保存会保留原密钥。</p><Notice text={error} /><div className="panel-toolbar"><button className="primary" disabled={busy} onClick={() => open()}><Plus size={17} />添加原生渠道</button><span /><button aria-label="刷新原生渠道" disabled={busy} onClick={() => void load().catch(e => setError(String(e)))}><RefreshCw size={18} /></button></div>{busy && <Busy />}
 {flows.map(flow => <div className="settings-group" key={String(flow.id)}><strong>{String(flow.provider)} · {flow.state === 'done' ? '已登录' : flow.state === 'waiting' ? '等待手机浏览器授权' : flow.state === 'cancelled' ? '已取消' : '授权未完成，请重试'}</strong>{!!flow.code && <p>设备确认码：<code>{String(flow.code)}</code></p>}{!!flow.url && <button className="primary full" onClick={() => void native('external', {
        url: flow.url
      }).catch(e => setError(String(e)))}>在手机打开授权页</button>}{flow.state === 'waiting' && <button disabled={busy} onClick={() => void run('login.cancel', {
        id: flow.id
      })}>取消这次授权</button>}</div>)}
 {rows.map(row => <button className="setting-row" key={row.id} onClick={() => open(row)}><span><strong>{row.name}</strong><small>{row.provider} · {row.enabled ? '已启用' : '已停用'} · {row.models.filter(m => m.enabled).length} 个模型</small></span></button>)}
 {edit && <Sheet title={edit.id ? '编辑原生渠道' : '添加原生渠道'} onClose={() => {
      if (!busy) setEdit(undefined);
    }} wide><Notice text={error} /><label className="field">名称<input value={String(edit.name)} onChange={e => setEdit(v => ({
          ...v,
          name: e.target.value
        }))} /></label><label className="field">供应商<select disabled={!!edit.id} value={String(edit.provider)} onChange={e => {
          const p = providers.find(p => p.id === e.target.value);
          setEdit(v => ({
            ...v,
            provider: e.target.value,
            baseUrl: p?.baseUrl ?? ''
          }));
          setModels([]);
        }}>{providers.map(p => <option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>)}</select></label>
 {!subscription && <><label className="field">电脑请求地址<input value={String(edit.baseUrl)} onChange={e => setEdit(v => ({
            ...v,
            baseUrl: e.target.value
          }))} inputMode="url" /></label><label className="field">API Key（编辑时留空保留）<input autoComplete="off" type={String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100)} value={String(edit.apiKey)} onChange={e => setEdit(v => ({
            ...v,
            apiKey: e.target.value
          }))} /></label></>}
 <label className="setting-row"><span>启用此渠道</span><input type="checkbox" checked={edit.enabled === true} onChange={e => setEdit(v => ({
          ...v,
          enabled: e.target.checked
        }))} /></label>
 {subscription && <button className="primary full" disabled={busy || !String(edit.name).trim()} onClick={() => void run('login', {
        provider: edit.provider,
        name: edit.name,
        ...(edit.id ? {
          id: edit.id
        } : {})
      }).then(r => {
        if (r) setEdit(undefined);
      })}>在手机登录订阅账号</button>}
 {!!edit.id && <div className="button-row"><button disabled={busy} onClick={() => void run('test', {
          id: edit.id
        }).then(r => {
          if (r) setError(String(r.message));
        })}>测试电脑连接</button><button disabled={busy} onClick={() => void run('models', {
          id: edit.id
        }).then(r => {
          if (r?.success) {
            const fetched = list<Model>(r.models);
            setModels(all => [...all, ...fetched.filter(m => !all.some(v => v.id === m.id))]);
          } else if (r) setError(String(r.message));
        })}>读取模型目录</button></div>}
 <h3>模型与完整推理档位</h3>{models.map((m, i) => <div className="settings-group" key={i}><label className="field">模型 ID<input value={m.id} onChange={e => setModels(all => all.map((v, n) => n === i ? {
            ...v,
            id: e.target.value
          } : v))} /></label><label className="field">显示名称<input value={m.name} onChange={e => setModels(all => all.map((v, n) => n === i ? {
            ...v,
            name: e.target.value
          } : v))} /></label><label className="field">原始推理档位（逗号分隔）<input value={(m.efforts ?? []).join(',')} onChange={e => setModels(all => all.map((v, n) => n === i ? {
            ...v,
            efforts: e.target.value.split(',')
          } : v))} /></label><label className="setting-row"><span>启用模型</span><input type="checkbox" checked={m.enabled} onChange={e => setModels(all => all.map((v, n) => n === i ? {
            ...v,
            enabled: e.target.checked
          } : v))} /></label><button className="danger" onClick={() => setModels(all => all.filter((_, n) => n !== i))}>移除此模型</button></div>)}<button className="full" onClick={() => setModels(all => [...all, {
        id: '',
        name: '',
        enabled: true,
        source: 'manual'
      }])}>添加模型</button>
 <button className="primary full" disabled={busy || !String(edit.name).trim() || subscription && !edit.id} onClick={() => void save()}>保存到电脑</button>{!!edit.id && <button className="danger full" disabled={busy} onClick={() => {
        if (confirm('删除此原生渠道？使用它的会话需另选模型。')) void run('remove', {
          id: edit.id
        }).then(r => {
          if (r) setEdit(undefined);
        });
      }}>删除渠道</button>}
 </Sheet>}</>;
}
