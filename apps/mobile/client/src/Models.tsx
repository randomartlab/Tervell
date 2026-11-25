import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, ChevronRight, Settings, Radio, KeyRound, Trash2, ExternalLink } from 'lucide-react';
import { control, list, plain, native } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, SearchBox, Sheet } from './ui';
import {Channels} from './Channels';
import { Subscriptions } from './Subscriptions';
interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  ready: boolean;
  keyMasked: string;
  models: Array<{
    id: string;
    name: string;
    enabled: boolean;
    efforts: string[];
  }>;
  accounts: Array<{
    id: string;
    name: string;
    masked: string;
    enabled: boolean;
  }>;
  subscription: boolean;
}
interface Route {
  enabled: boolean;
  defaultModel: string;
  rules: Array<{
    kernelId: string;
    mode: string;
    model?: string;
  }>;
}
export function Models() {
  const [providers, setProviders] = useState<Provider[]>([]),
    [models, setModels] = useState<Array<{
      id: string;
      name: string;
      providerName?: string;
    }>>([]),
    [kernels, setKernels] = useState<RecordValue[]>([]),
    [support,setSupport] = useState<RecordValue[]>([]),
    [route, setRoute] = useState<Route>({
      enabled: false,
      defaultModel: '',
      rules: []
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [query, setQuery] = useState(''),
    [tab, setTab] = useState('routing'),
    [editor, setEditor] = useState<RecordValue>(),
    [provider, setProvider] = useState<Provider>(),
    [key, setKey] = useState(''),
    [keyName, setKeyName] = useState('手机新增'),
    [modelEdit, setModelEdit] = useState<{
      id: string;
      name: string;
      efforts: string[];
    }>(),
    [modelName, setModelName] = useState(''),
    [efforts, setEfforts] = useState('');
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const snapshot = await control('gateway.snapshot'),
        routing = await control('routing.state'),
        state = await control('kernels.list');
      setProviders(list(snapshot.providers));
      setProvider(current => current ? list<Provider>(snapshot.providers).find(p => p.id === current.id) : undefined);
      setModels(list(routing.models));
      setRoute(routing.config as unknown as Route);
      setKernels(list(state.entries));
      setSupport(list(routing.support));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const run = async (operation: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const result = await control(operation, values);
      setNotice(String(result.message ?? '已保存到电脑'));
      await load();
      return result;
    } catch (e) {
      setError(String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const edit = async (p: Provider) => {
    setBusy(true);
    try {
      const r = await control('gateway.provider-detail', {
        id: p.id
      });
      setEditor(plain(r.providerDraft));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><div className="button-row"><button className={tab === 'routing' ? 'selected' : ''} onClick={() => setTab('routing')}><Radio size={17} />全局路由</button><button className={tab === 'providers' ? 'selected' : ''} onClick={() => setTab('providers')}>供应商</button><button className={tab === 'channels' ? 'selected' : ''} onClick={() => setTab('channels')}>Pi / Chat 渠道</button><button className={tab === 'accounts' ? 'selected' : ''} onClick={() => setTab('accounts')}>订阅与账号</button><button className="icon-button" aria-label="刷新电脑模型" disabled={busy} onClick={() => void load()}><RefreshCw size={18} /></button></div><Notice text={error} />{notice && <p className="muted">{notice}</p>}{busy && <Busy />}{tab === 'channels' ? <Channels /> : tab === 'accounts' ? <Subscriptions /> : tab === 'routing' ? <><label className="setting-row"><span>启用全局模型覆盖</span><input type="checkbox" checked={route.enabled} onChange={e => setRoute(r => ({
          ...r,
          enabled: e.target.checked
        }))} /></label><label className="field">全局默认模型<select value={route.defaultModel} onChange={e => setRoute(r => ({
          ...r,
          defaultModel: e.target.value
        }))}><option value="">请选择模型</option>{models.map(m => <option key={m.id} value={m.id}>{m.name} · {m.providerName ?? m.id}</option>)}</select></label><h3>逐内核例外</h3>{kernels.filter(k => k.enabled).map(k => {
        const id = String(k.id),
          rule = route.rules.find(r => r.kernelId === id), capability=support.find(row=>row.kernelId===id),available=capability&&capability.method!=='unavailable';
        return <div className="settings-group" key={id}><strong>{String(k.name)}</strong><label className="field">路由方式<select value={rule?.mode ?? (available?'global':'native')} onChange={e => setRoute(r => ({
              ...r,
              rules: [...r.rules.filter(rule => rule.kernelId !== id), ...(e.target.value === 'global' ? [] : [{
                kernelId: id,
                mode: e.target.value,
                ...(e.target.value === 'override' ? {
                  model: models[0]?.id ?? ''
                } : {})
              }])]
            }))}><option value="global" disabled={!available}>跟随全局</option><option value="native">内核原生模型与账号</option><option value="override" disabled={!available}>单独覆盖</option></select></label>{(!available||capability?.requiresAccount===true)&&<p className="muted">{String(capability?.reason??'此内核使用原生模型与认证。')}</p>}{rule?.mode === 'override' && <label className="field">覆盖模型<select value={rule.model ?? ''} onChange={e => setRoute(r => ({
              ...r,
              rules: r.rules.map(rule => rule.kernelId === id ? {
                ...rule,
                model: e.target.value
              } : rule)
            }))}><option value="">选择模型</option>{models.map(m => <option key={m.id} value={m.id}>{m.name} · {m.providerName ?? m.id}</option>)}</select></label>}</div>;
      })}<button className="primary full" disabled={busy} onClick={() => void run('routing.save', {
        enabled: route.enabled,
        defaultModel: route.defaultModel,
        rules: route.rules
      })}>保存电脑全局路由</button><button className="full" disabled={busy} onClick={() => void run('routing.refresh', {})}>同步全部模型能力</button></> : <><SearchBox value={query} onChange={setQuery} placeholder="搜索供应商与模型" /><button className="primary full" onClick={() => {
        setKey('');
        setEditor({
          id: '',
          name: '',
          chat: '',
          responses: '',
          anthropic: '',
          gemini: '',
          models: [],
          routing: 'order',
          fallback: [],
          create: true
        });
      }}><Plus size={17} />添加 API 供应商</button><button className="full" onClick={() => void native('external', {
        url: 'https://randomai.art/'
      })}><ExternalLink size={17} />Random创造集市 · 注册与模型服务</button>{providers.filter(p => (p.name + ' ' + p.models.map(m => m.id).join(' ')).toLowerCase().includes(query.toLowerCase())).map(p => <div className="workspace-card" key={p.id}><button className="plain-row" onClick={() => {
          setKey('');
          setProvider(p);
        }}><span><strong>{p.name}</strong><small>{p.ready ? '已就绪' : '尚未就绪'} · {p.models.length} 个模型</small><small>{p.keyMasked || '未设置密钥'}{p.subscription ? ' · 订阅账号' : ''}</small></span><ChevronRight size={17} /></button><input aria-label={'启用 ' + p.name} type="checkbox" checked={p.enabled} disabled={busy} onChange={e => void run('gateway.provider.toggle', {
          id: p.id,
          enabled: e.target.checked
        })} /></div>)}</>}{editor && <Sheet title={editor.create ? '添加供应商' : '编辑供应商'} onClose={() => setEditor(undefined)}><Notice text={error} />{(['id', 'name', 'chat', 'responses', 'anthropic', 'gemini'] as const).map(k => <label className="field" key={k}>{{
          id: '标识',
          name: '名称',
          chat: 'Chat API 地址',
          responses: 'Responses 地址',
          anthropic: 'Anthropic 地址',
          gemini: 'Gemini 地址'
        }[k]}<input value={String(editor[k] ?? '')} readOnly={k === 'id' && !editor.create} onChange={e => setEditor(v => ({
          ...v,
          [k]: e.target.value
        }))} /></label>)}<label className="field">启用的模型 ID（每行一个）<textarea rows={7} value={list<string>(editor.models).join('\n')} onChange={e => setEditor(v => ({
          ...v,
          models: e.target.value.split('\n')
        }))} /></label><label className="field">API Key（留空保留原密钥）<input autoComplete="off" type={String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100)} value={key} onChange={e => setKey(e.target.value)} /></label><button className="primary full" disabled={busy} onClick={() => void run('gateway.provider.save', {
        provider: {
          ...editor,
          models: list<string>(editor.models).map(m => m.trim()).filter(Boolean),
          ...(key ? {
            key
          } : {})
        }
      }).then(r => {
        if (r) {
          setKey('');
          setEditor(undefined);
        }
      })}>保存供应商</button></Sheet>}{provider && <Sheet title={provider.name} onClose={() => setProvider(undefined)}><Notice text={error} /><div className="button-row"><button disabled={busy || provider.subscription} onClick={() => void edit(provider)}><Settings size={16} />编辑连接</button><button disabled={busy} onClick={() => void run('gateway.provider.refresh', {
          id: provider.id
        })}>同步模型</button><button disabled={busy} onClick={() => void run('gateway.provider.test', {
          id: provider.id
        })}>测试连接</button></div><h3>账号与密钥</h3>{provider.accounts.map(a => <div className="extension-row" key={a.id}><span><strong>{a.name}</strong><small>{a.masked}</small></span><input type="checkbox" checked={a.enabled} onChange={e => void run('gateway.account.toggle', {
          id: provider.id,
          ref: a.id,
          enabled: e.target.checked
        })} /><button aria-label={'删除账号 ' + a.name} onClick={() => {
          if (confirm('移除该账号？')) void run('gateway.account.delete', {
            id: provider.id,
            ref: a.id
          });
        }}><Trash2 size={16} /></button></div>)}<label className="field">新账号名称<input value={keyName} onChange={e => setKeyName(e.target.value)} /></label><label className="field">新账号 API Key<input type={String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100)} value={key} onChange={e => setKey(e.target.value)} autoComplete="off" /></label><button disabled={busy || !key} onClick={() => void run('gateway.account.add', {
        id: provider.id,
        name: keyName,
        key
      }).then(r => {
        if (r) setKey('');
      })}><KeyRound size={16} />添加密钥</button><h3>模型与推理能力</h3>{provider.models.filter(m => (m.name + ' ' + m.id).toLowerCase().includes(query.toLowerCase())).map(m => <button className="setting-row" key={m.id} onClick={() => {
        setModelEdit(m);
        setModelName(m.name);
        setEfforts(m.efforts.join('\n'));
      }}><span>{m.name}<small>{m.id} · {m.efforts.join(' / ') || '未声明推理档位'}</small></span><ChevronRight size={17} /></button>)}</Sheet>}{provider && modelEdit && <Sheet title="模型名称与完整推理档位" onClose={() => setModelEdit(undefined)}><label className="field">显示名称<input value={modelName} onChange={e => setModelName(e.target.value)} /></label><label className="field">模型原始推理选项（每行一个）<textarea rows={8} value={efforts} onChange={e => setEfforts(e.target.value)} /></label><Notice text={error} /><button className="primary full" disabled={busy} onClick={() => void run('gateway.model.preferences', {
        id: provider.id,
        model: modelEdit.id,
        name: modelName,
        efforts: efforts.split('\n').map(v => v.trim()).filter(Boolean)
      }).then(r => {
        if (r) setModelEdit(undefined);
      })}>保存模型能力</button></Sheet>}</>;
}
