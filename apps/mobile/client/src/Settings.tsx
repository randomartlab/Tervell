import React, { useEffect, useState } from 'react';
import { ChevronRight, Puzzle, Server, Palette, Brain, Folder, Wifi, ShieldCheck, Download, LogOut } from 'lucide-react';
import type { LocalSettings, Catalog, Workspace, Action } from './model';
import { control, native, plain, list, readable } from './bridge';
import type { RecordValue } from './bridge';
import { ActionForm } from './Panels';
import { Sheet, Notice, SearchBox, PageHeader, Busy, Empty } from './ui';
import { ProjectTools } from './ProjectTools';
import {Planning} from './Planning';
import {Vault} from './Vault';
import { Bots } from './Bots';
import { Models } from './Models';
import { ComputerDisplay } from './ComputerDisplay';
import { Kernels } from './Kernels';
import { Markdown } from './Markdown';
export function Settings({
  hostId,
  preferences,
  setPreferences,
  catalog,
  workspaces,
  project,
  sessionId,
  pair,
  disconnect,
  onHostChanged
}: {
  hostId:string;
  preferences: LocalSettings;
  setPreferences: (v: LocalSettings) => void;
  catalog: Catalog;
  workspaces: Workspace[];
  project: string;
  sessionId?: string;
  pair: () => void;
  disconnect: () => void;
  onHostChanged: () => void;
}) {
  const [page, setPage] = useState(''),
    [action, setAction] = useState<Action>(),
    [query, setQuery] = useState(''),
    [error, setError] = useState(''),
    [plugins, setPlugins] = useState<RecordValue[]>([]),
    [direct, setDirect] = useState<RecordValue>(),
    [themeBusy, setThemeBusy] = useState(false),
    [actionWorkspace, setActionWorkspace] = useState(''),
    [actionSession, setActionSession] = useState(''),
    [scopeSessions, setScopeSessions] = useState<RecordValue[]>([]);
  useEffect(() => {
    if (page === 'plugins') void control('plugins.desktop').then(r => setPlugins(list(r.installed))).catch(e => setError(String(e)));
    if (page === 'hosts') void native('direct').then(setDirect).catch(e => setError(String(e)));
  }, [page]);
  useEffect(() => {
    if (!action) return;
    const initial = project || workspaces[0]?.id || '';
    setActionWorkspace(initial);
    setActionSession(sessionId ?? '');
  }, [action?.id]);
  useEffect(() => {
    let alive = true;
    if (!action || !actionWorkspace) return;
    void control('workspace.mobile', {}, {
      workspaceId: actionWorkspace
    }).then(r => {
      if (alive) {
        const rows = list(r.sessions);
        setScopeSessions(rows);
        setActionSession(id => rows.some(s => s.id === id) ? id : String(rows[0]?.id ?? ''));
      }
    }).catch(e => {
      if (alive) setError(String(e));
    });
    return () => {
      alive = false;
    };
  }, [action?.id, actionWorkspace]);
  const groups = [...new Set(catalog.actions.map(a => a.group))];
  const body = page === '待办与自动化' ? <Planning workspaces={workspaces} initialWorkspace={project}/> : page === '知识库' ? <Vault hostId={hostId}/> : page === '连接与机器人' ? <Bots workspaces={workspaces} /> : page === '模型与账号' ? <><Models /><details className="settings-group"><summary>高级功能与账号授权</summary>{catalog.actions.filter(a => a.group === '模型与账号').map(a => <button className="setting-row" key={a.id} onClick={() => setAction(a)}><span>{a.title}</span><ChevronRight size={17} /></button>)}</details></> : page === '内核' ? <Kernels /> : page === 'computer-display' ? <ComputerDisplay /> : page === 'appearance' ? <><h3>手机外观</h3><button className="full" onClick={() => setPage('computer-display')}>调整已连接电脑的主题、字体与过程展示<ChevronRight size={16} /></button><label className="field">主题<select value={preferences.theme} onChange={e => setPreferences({
        ...preferences,
        theme: e.target.value as LocalSettings['theme']
      })}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label>{([['uiSize', '界面字号', 12, 22], ['bodySize', '对话字号', 13, 26], ['codeSize', '代码字号', 10, 22]] as const).map(([key, label, min, max]) => <label className="field" key={key}>{label} · {preferences[key]}px<input type="range" min={min} max={max} value={preferences[key]} onChange={e => setPreferences({
        ...preferences,
        [key]: Number(e.target.value)
      })} /></label>)}<div className="setting-note">手机排版沿用 Tervell 的岩青、雾薄荷和原生对话层次。字体使用 Android 已安装字体，代码独立等宽。</div></> : page === 'activity' ? <><h3>推理与操作过程</h3>{(['reasoning', 'tools'] as const).map(key => <label className="field" key={key}>{key === 'reasoning' ? '推理过程' : '工具与操作'}<select value={preferences[key]} onChange={e => setPreferences({
        ...preferences,
        [key]: e.target.value as LocalSettings['reasoning']
      })}><option value="expanded">全部展开</option><option value="balanced">适中：运行显示、完成收起</option><option value="collapsed">默认折叠</option></select></label>)}<p>中文译文使用电脑配置的翻译模型，原文保留；需要额外 API 用量。手机可在每段推理下请求翻译。</p></> : page === 'hosts' ? <><div className="setting-note"><strong>{String(direct?.transport ?? '正在读取连接')}</strong><p>配对密钥存储在 Android Keystore。服务器只转发端到端密文。</p></div><button className="full" onClick={() => void native('retry').then(() => onHostChanged()).catch(e => setError(String(e)))}>重新连接当前电脑</button><button className="full" onClick={pair}>添加另一台电脑</button>{list<{
      id: string;
    }>(direct?.hosts).map(h => <button className="setting-row" key={h.id} onClick={() => void native('switchHost', {
      id: h.id
    }).then(onHostChanged).catch(e => setError(String(e)))}><Server /><span>切换电脑 · {h.id.slice(0, 10)}</span><ChevronRight /></button>)}<button onClick={() => void native('pauseDirect').then(setDirect).catch(e => setError(String(e)))}>60 秒仅使用原有公网通路</button><button className="danger" onClick={() => {
      if (confirm('清除这台手机上的当前配对？电脑端授权请另外撤销。')) disconnect();
    }}>清除当前配对</button></> : page === 'MCP 与 Skills' ? <>{workspaces.length > 1 && <p className="muted">当前项目：{workspaces.find(w => w.id === (project || workspaces[0]?.id))?.name}</p>}{workspaces.length ? <ProjectTools key={project || workspaces[0]!.id} workspaceId={project || workspaces[0]!.id} management={catalog.management} /> : <Empty title="电脑尚未授权项目" />}</> : page === 'plugins' ? <><p className="muted">电脑安装的插件在所属项目运行。功能入口按贡献类型进入手机面板，安装和变更需要整机授权。</p>{plugins.map(p => <div className="plugin-card" key={String(p.id)}><Puzzle size={22} /><div><strong>{String(p.name)}</strong><small>{String(p.version)} · {p.enabled ? '已启用' : '已停用'}</small></div><button disabled={!catalog.management} onClick={() => void control('plugins.toggle', {
        id: p.id,
        enabled: !p.enabled
      }).then(() => setPlugins(all => all.map(x => x.id === p.id ? {
        ...x,
        enabled: !p.enabled
      } : x))).catch(e => setError(String(e)))}>{p.enabled ? '停用' : '启用'}</button></div>)}<button className="full" onClick={() => setPage('插件与主题')}>浏览与安装市场插件<ChevronRight size={16} /></button></> : <><SearchBox value={query} onChange={setQuery} placeholder="搜索电脑功能" />{catalog.actions.filter(a => a.group === page && a.title.toLowerCase().includes(query.toLowerCase())).filter(a => !a.id.startsWith('attachments.') && !a.id.includes('.mobile-') && !['session.entry', 'session.timeline', 'chat.read', 'chat.action', 'control.result','channels.read','channels.action'].includes(a.id)).map(a => <button className="setting-row" key={a.id} onClick={() => setAction(a)}><span>{a.title}<small>{a.scope === 'management' ? '电脑设置' : a.scope === 'session' ? '当前会话' : '当前项目'}</small></span><ChevronRight size={17} /></button>)}</>;
  return <><PageHeader title={page ? {
      appearance: '外观',
      'computer-display': '电脑外观与过程',
      activity: '过程显示',
      hosts: '电脑与连接',
      plugins: '插件与扩展'
    }[page] ?? page : '设置'} subtitle={catalog.management ? '已获整机管理授权' : '当前为项目访问授权'} onBack={page ? () => {
      setPage('');
      setError('');
    } : undefined} /><div className="page-scroll settings-page"><Notice text={error} />{page ? body : <><div className="settings-group"><button className="setting-row" onClick={() => setPage('hosts')}><Wifi /><span>电脑与连接<small>切换电脑、重连和配对</small></span><ChevronRight /></button><button className="setting-row" onClick={() => setPage('appearance')}><Palette /><span>外观<small>主题、对话与代码字号</small></span><ChevronRight /></button><button className="setting-row" onClick={() => setPage('activity')}><Brain /><span>推理与操作过程<small>展开策略与中文译文</small></span><ChevronRight /></button><button className="setting-row" onClick={() => setPage('plugins')}><Puzzle /><span>插件与扩展<small>内置增强与电脑插件</small></span><ChevronRight /></button></div><h3>电脑能力</h3>{groups.filter(g => !['概览', '会话', 'Chat'].includes(g)).map(g => <button className="setting-row" key={g} onClick={() => setPage(g)}><Folder size={19} /><span>{g}</span><ChevronRight /></button>)}<p className="muted settings-footnote">Tervell · 本地优先的移动工作区<br />所有模型执行、文件与终端均在授权电脑运行。</p></>}</div>{action && <Sheet title={action.title} onClose={() => setAction(undefined)}>{action.scope !== 'management' && <label className="field">操作工作区<select value={actionWorkspace} onChange={e => setActionWorkspace(e.target.value)}>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}{action.scope === 'session' && <label className="field">会话<select value={actionSession} onChange={e => setActionSession(e.target.value)}>{scopeSessions.map(s => <option key={String(s.id)} value={String(s.id)}>{String(s.title)}</option>)}</select></label>}<ActionForm key={action.id + actionWorkspace + actionSession} action={action} sessionId={actionSession} workspaceId={action.scope === 'management' ? undefined : actionWorkspace} /></Sheet>}</>;
}
