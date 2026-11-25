import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { control, list, plain, native } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice } from './ui';
interface Method {
  type: string;
  label: string;
  placeholder?: string;
  keyless?: boolean;
  keyAsked?: boolean;
}
interface Subscription {
  id: string;
  providerId?: string;
  name: string;
  single?: boolean;
  methods: Method[];
  risk?: string;
  installSpec?: string;
  sites?: Array<{
    id: string;
    name: string;
  }>;
  options: Array<{
    key: string;
    label: string;
    description?: string;
    on: boolean;
    confirm?: string;
  }>;
}
interface Prompt {
  type: string;
  key: string;
  message: string;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    hint?: string;
  }>;
}
interface Flow {
  id: string;
  state: string;
  url?: string;
  code?: string;
  instructions?: string;
  error?: string;
  pasteCallback?: boolean;
  pasteCode?: boolean;
  pasteKey?: boolean;
  user?: string;
}
export function Subscriptions() {
  const [snapshot, setSnapshot] = useState<RecordValue>({}),
    [subscriptions, setSubscriptions] = useState<Subscription[]>([]),
    [selected, setSelected] = useState(''),
    [method, setMethod] = useState(0),
    [site, setSite] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [inputs, setInputs] = useState<Record<string, string>>({}),
    [prompt, setPrompt] = useState<Prompt>(),
    [answer, setAnswer] = useState(''),
    [key, setKey] = useState(''),
    [keyStep, setKeyStep] = useState(false),
    [flow, setFlow] = useState<Flow>(),
    [callback, setCallback] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const generation = useRef(0),
    currentFlow = useRef<Flow>();
  currentFlow.current = flow;
  const apply = (r: RecordValue) => {
    if (r.snapshot) {
      const next = plain(r.snapshot);
      setSnapshot(next);
      setSubscriptions(list(next.subscriptions));
    }
    if (r.signIn) setFlow(r.signIn as unknown as Flow);
  };
  const run = async (operation: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    const epoch = generation.current;
    try {
      const r = await control(operation, values);
      if (epoch === generation.current) apply(r);
      return r;
    } catch (e) {
      if (epoch === generation.current) setError(String(e));
      return undefined;
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    let alive = true;
    void control('gateway.snapshot').then(r => {
      if (alive) {
        setSnapshot(r);
        const rows = list<Subscription>(r.subscriptions);
        setSubscriptions(rows);
        setSelected(rows[0]?.id ?? '');
      }
    }).catch(e => {
      if (alive) setError(String(e));
    });
    return () => {
      alive = false;
      generation.current++;
      const active = currentFlow.current;
      if (active?.id && ['waiting', 'installing'].includes(active.state)) void control('gateway.signin.cancel', {
        id: active.id
      }).catch(() => {});
    };
  }, []);
  useEffect(() => {
    if (!flow?.id || !['waiting', 'installing'].includes(flow.state)) return;
    let active = true,
      polling = false;
    const timer = setInterval(() => {
      if (polling) return;
      polling = true;
      void control('gateway.signin.poll', {
        id: flow.id
      }).then(r => {
        if (active) apply(r);
      }).catch(e => {
        if (active) setError(String(e));
      }).finally(() => {
        polling = false;
      });
    }, 1800);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [flow?.id, flow?.state]);
  const sub = subscriptions.find(s => s.id === selected),
    privacy = plain(snapshot.privacy),
    waiting = !!flow && ['waiting', 'installing'].includes(flow.state),
    locked = busy || waiting,
    canAuth = privacy.accountDiscovery === true && !privacy.forcedOff;
  const pluginStart = async (values: Record<string, string>, secret?: string) => {
    if (!sub?.providerId) return;
    setPrompt(undefined);
    setKeyStep(false);
    const r = await run('gateway.signin.plugin', {
      provider: sub.providerId,
      method,
      inputs: values,
      ...(secret !== undefined ? {
        key: secret
      } : {})
    });
    if (r) setKey('');
  };
  const next = async (answered = false) => {
    if (!sub?.providerId) return;
    setBusy(true);
    setError('');
    const epoch = generation.current;
    try {
      const r = await control('gateway.auth-prompt', {
        provider: sub.providerId,
        method,
        inputs,
        ...(answered && prompt ? {
          key: prompt.key,
          value: answer
        } : {})
      });
      if (epoch !== generation.current) return;
      if (r.error) throw Error(String(r.error));
      const values = plain(r.inputs) as Record<string, string>;
      setInputs(values);
      setAnswer('');
      const question = r.prompt as Prompt | undefined;
      setPrompt(question ?? undefined);
      if (question) return;
      const chosen = sub.methods[method];
      if (chosen?.type === 'api' && !chosen.keyless && !chosen.keyAsked) {
        setKeyStep(true);
        return;
      }
      await pluginStart(values, chosen?.type === 'api' ? '' : undefined);
    } catch (e) {
      if (epoch === generation.current) setError(String(e));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  const start = () => {
    setFlow(undefined);
    setPrompt(undefined);
    setInputs({});
    setAnswer('');
    setKey('');
    if (sub?.providerId) void next();else if (sub) void run('gateway.signin.start', {
      agent: sub.id,
      ...(site || sub.sites?.[0]?.id ? {
        site: site || sub.sites?.[0]?.id
      } : {})
    });
  };
  return <><Notice text={error} />{busy && <Busy />}<label className="field">订阅供应商<select value={selected} disabled={locked} onChange={e => {
        generation.current++;
        setSelected(e.target.value);
        setMethod(0);
        setSite('');
        setConfirmed(false);
        setInputs({});
        setPrompt(undefined);
        setKeyStep(false);
        setKey('');
        setFlow(undefined);
        setError('');
      }}>{subscriptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {privacy.forcedOff === true ? <p className="muted">隔离验收模式禁止登录真实订阅账号。</p> : !canAuth && <div className="setting-note"><p>账号登录当前关闭。启用后可添加订阅，并读取受管环境中已有登录。</p><button disabled={busy} onClick={() => void run('gateway.privacy', {
        accountDiscovery: true
      })}>启用电脑账号登录</button></div>}
    {sub && <><p className="muted">{sub.single ? '重新登录可能替换现有账号。' : ''}授权凭据保存在电脑；手机只传递本次授权结果。</p>{sub.risk && <label className="setting-note"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{sub.risk}</label>}
      {sub.installSpec ? <div className="setting-note"><p>此供应商需要其登录插件：{sub.installSpec}</p><button disabled={busy} onClick={() => {
          if (confirm('在电脑安装该供应商的登录插件？')) void run('gateway.plugin.add', {
            spec: sub.installSpec
          });
        }}>安装登录插件</button></div> : <>
        {sub.sites?.length && <label className="field">站点<select value={site || sub.sites[0]?.id} disabled={locked} onChange={e => setSite(e.target.value)}>{sub.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
        <label className="field">登录方式<select value={method} disabled={locked} onChange={e => {
            setMethod(Number(e.target.value));
            setPrompt(undefined);
            setInputs({});
            setKeyStep(false);
          }}>{sub.methods.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select></label>
        {!prompt && !keyStep && <button className="primary full" disabled={locked || !canAuth || !!sub.risk && !confirmed} onClick={start}>开始手机授权</button>}
        {prompt && <form onSubmit={e => {
          e.preventDefault();
          void next(true);
        }}><label className="field">{prompt.message}{prompt.options.length ? <select value={answer} onChange={e => setAnswer(e.target.value)}><option value="">请选择</option>{prompt.options.map(o => <option key={o.value} value={o.value}>{o.label}{o.hint ? ' · ' + o.hint : ''}</option>)}</select> : <input type={prompt.type === 'secret' ? String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100) : 'text'} value={answer} autoComplete="off" placeholder={prompt.placeholder} onChange={e => setAnswer(e.target.value)} />}</label><button className="primary" disabled={busy || !answer}>继续</button></form>}
        {keyStep && <><label className="field">{sub.methods[method]?.placeholder || '登录密钥'}<input autoComplete="off" type={String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100)} value={key} onChange={e => setKey(e.target.value)} /></label><button className="primary" disabled={busy || !key} onClick={() => void pluginStart(inputs, key)}>完成登录</button></>}
      </>}
      {flow && <div className="setting-note"><strong>{{
            waiting: '等待供应商授权',
            installing: '正在准备授权',
            done: '授权完成',
            failed: '授权失败',
            canceled: '已取消'
          }[flow.state] ?? flow.state}</strong>{flow.user && <p>{flow.user}</p>}{flow.instructions && <p>{flow.instructions}</p>}{flow.code && <p>授权码：<code>{flow.code}</code></p>}{flow.url && /^https?:\/\//.test(flow.url) && <button onClick={() => void native('external', {
          url: flow.url
        })}><ExternalLink size={16} />在手机浏览器打开授权页</button>}{flow.error && <Notice text={flow.error} />} {waiting && (flow.pasteCallback || flow.pasteCode || flow.pasteKey) && <><label className="field">{flow.pasteCode ? '供应商授权码' : flow.pasteKey ? '供应商授权密钥' : '最终回调地址'}<input autoComplete="off" value={callback} onChange={e => setCallback(e.target.value)} /></label><button disabled={busy || !callback} onClick={() => void run('gateway.signin.callback', {
            id: flow.id,
            url: callback
          }).then(r => {
            if (r) setCallback('');
          })}>提交授权结果</button></>}{waiting && <button disabled={busy} onClick={() => void run('gateway.signin.cancel', {
          id: flow.id
        })}>取消授权</button>}</div>}
      {sub.options.map(o => <label className="setting-row" key={o.key}><span>{o.label}<small>{o.description}</small></span><input type="checkbox" checked={o.on} disabled={locked} onChange={e => {
          if (!o.confirm || confirm(o.confirm)) void run('gateway.subscription.option', {
            provider: sub.id,
            key: o.key,
            enabled: e.target.checked
          });
        }} /></label>)}
    </>}
  </>;
}
