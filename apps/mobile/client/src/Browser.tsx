import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Plus, Camera, X, MousePointer2 } from 'lucide-react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, IconButton } from './ui';
interface Element {
  ref: string;
  role: string;
  name: string;
  editable: boolean;
}
interface Tab {
  tabId: string;
  title: string;
  url: string;
  openedByAgent: boolean;
}
export function Browser({
  sessionId
}: {
  sessionId: string;
}) {
  const [state, setState] = useState<RecordValue>(),
    [acknowledged, setAcknowledged] = useState(false),
    [url, setUrl] = useState(''),
    [elements, setElements] = useState<Element[]>([]),
    [image, setImage] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [query, setQuery] = useState('');
  const generation = useRef(0),
    tab = String(state?.activeTabId ?? ''),
    tabs = list<Tab>(state?.tabs);
  const read = async () => {
    const epoch = ++generation.current;
    setBusy(true);
    try {
      const r = await control('browser.read', {
        action: 'state'
      }, {
        sessionId
      });
      if (epoch === generation.current) {
        setAcknowledged(r.acknowledged === true);
        setState(r.state ? plain(r.state) : undefined);
        setUrl(String(plain(r.state).url ?? ''));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    void read();
    return () => {
      generation.current++;
    };
  }, [sessionId]);
  const run = async (action: string, values: RecordValue = {}) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('browser.action', {
        action,
        ...(['navigate', 'select', 'tab-close', 'back', 'forward', 'reload', 'click', 'fill', 'press', 'scroll'].includes(action) && tab ? {
          tabId: tab
        } : {}),
        ...values
      }, {
        sessionId
      });
      if (r.acknowledged) setAcknowledged(true);
      const s = r.state ? plain(r.state) : action === 'open' ? r : undefined;
      if (s) {
        setState(s);
        setUrl(String(s.url ?? ''));
      }
      setElements([]);
      setImage('');
      return r;
    } catch (e) {
      setError(String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const observe = async (screenshot = false) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('browser.read', {
        action: screenshot ? 'screenshot' : 'observe',
        ...(tab ? {
          tabId: tab
        } : {})
      }, {
        sessionId
      });
      if (screenshot) setImage('data:' + String(r.mimeType) + ';base64,' + String(r.base64));else setElements(list(r.elements));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  if (!acknowledged) return <><h3>使用电脑受管浏览器</h3><p>网页在已配对电脑中打开，使用该工作区的浏览器登录状态。手机点击、填写、提交和下载会实际操作电脑网页。请仅在可信电脑和页面上继续。</p><Notice text={error} /><button className="primary full" disabled={busy} onClick={() => void run('acknowledge').then(r => {
      if (r) void read();
    })}>我已了解，启用此电脑浏览器</button></>;
  return <div className="mobile-browser"><Notice text={error} />{busy && <Busy text="电脑浏览器正在处理…" />}
    <div className="button-row"><button disabled={busy} onClick={() => void run('open')}>打开电脑浏览器</button><button disabled={busy || !state} onClick={() => void run('tab', {
        url: url || undefined
      })}><Plus size={17} />新标签</button><button className="danger" disabled={busy || !state} onClick={() => {
        if (confirm('关闭这个会话的全部电脑浏览器标签？')) void run('close').then(() => setState(undefined));
      }}>关闭浏览器</button></div>
    <div className="browser-tabs">{tabs.map(t => <div className="browser-tab" key={t.tabId}><button className={tab === t.tabId ? 'selected' : ''} disabled={busy} onClick={() => void run('select', {
          tabId: t.tabId
        })}>{t.title || '新标签'}{t.openedByAgent ? ' · Agent' : ''}</button><IconButton label={'关闭标签 ' + t.title} disabled={busy} onClick={() => void run('tab-close', {
          tabId: t.tabId
        })}><X size={15} /></IconButton></div>)}</div>
    {state && <><form onSubmit={e => {
        e.preventDefault();
        void run('navigate', {
          url
        });
      }}><label className="field">电脑网页地址<input value={url} onChange={e => setUrl(e.target.value)} inputMode="url" placeholder="https://…" /></label><button className="primary full" disabled={busy || !url.trim()}>在电脑打开</button></form>
      <div className="button-row"><IconButton label="网页后退" disabled={busy || !state.canGoBack} onClick={() => void run('back')}><ArrowLeft size={18} /></IconButton><IconButton label="网页前进" disabled={busy || !state.canGoForward} onClick={() => void run('forward')}><ArrowRight size={18} /></IconButton><IconButton label="刷新电脑网页" disabled={busy} onClick={() => void run('reload')}><RefreshCw size={18} /></IconButton><button disabled={busy} onClick={() => void observe()}><MousePointer2 size={17} />读取可操作元素</button><button disabled={busy} onClick={() => void observe(true)}><Camera size={17} />查看电脑页面</button></div>
      {image && <img className="browser-screenshot" src={image} alt="当前电脑会话网页的真实截图" />}
      <div className="button-row"><button disabled={busy} onClick={() => void run('scroll', {
          deltaY: -600
        })}>向上滚动</button><button disabled={busy} onClick={() => void run('scroll', {
          deltaY: 600
        })}>向下滚动</button><button disabled={busy} onClick={() => void run('press', {
          key: 'Enter'
        })}>Enter</button><button disabled={busy} onClick={() => void run('press', {
          key: 'Escape'
        })}>Esc</button></div>
      {!!elements.length && <><label className="field">搜索网页元素<input value={query} onChange={e => setQuery(e.target.value)} /></label><p className="muted">页面更新后重新读取元素；输入和点击作用于电脑网页。</p>{elements.filter(e => (e.name + ' ' + e.role).toLowerCase().includes(query.toLowerCase())).map(e => <div className="browser-element" key={e.ref}><span><strong>{e.name || '未命名元素'}</strong><small>{e.role} · {e.ref}</small></span>{e.editable ? <button disabled={busy} onClick={() => {
            const text = prompt('填写电脑网页：' + (e.name || e.role));
            if (text !== null) void run('fill', {
              ref: e.ref,
              text
            });
          }}>填写</button> : <button disabled={busy} onClick={() => void run('click', {
            ref: e.ref
          })}>点击</button>}</div>)}</>}
    </>}
  </div>;
}
