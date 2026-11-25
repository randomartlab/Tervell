import React, { useEffect, useState } from 'react';
import { Folder, Plus, ChevronRight, Settings, Files, ArrowUp, Pin, Archive, FolderOpen } from 'lucide-react';
import type { Workspace, Session } from './model';
import { control, list } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Empty, Notice, SearchBox, Sheet } from './ui';
import { ProjectFiles } from './ProjectFiles';
import { ProjectTools } from './ProjectTools';
import {ProjectMemory} from './ProjectMemory';
interface Project extends Workspace {
  root: string;
  sessions: number;
  defaultKernelId?: string;
  pluginPinnedAt?: string;
  pluginArchivedAt?: string;
}
export function ComputerFolderPicker({
  initial = '',
  onPick,
  onClose
}: {
  initial?: string;
  onPick: (path: string) => void;
  onClose: () => void;
}) {
  const [path, setPath] = useState(initial),
    [location, setLocation] = useState(''),
    [parent, setParent] = useState(''),
    [rows, setRows] = useState<Array<{
      name: string;
      path: string;
    }>>([]),
    [next, setNext] = useState<number | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const load = async (offset = 0) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('host.folders', {
        path,
        offset
      });
      setLocation(String(r.path));
      setParent(String(r.parent));
      setRows(all => offset ? [...all, ...list<typeof rows[number]>(r.entries)] : list(r.entries));
      setNext(r.nextOffset === null ? null : Number(r.nextOffset));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [path]);
  return <Sheet title="选择电脑文件夹" onClose={onClose}><p className="muted">这是已配对电脑的目录，模型和文件均在该电脑运行。</p><form onSubmit={e => {
      e.preventDefault();
      setPath(location);
    }}><label className="field">电脑路径<input value={location} onChange={e => setLocation(e.target.value)} /></label><button className="full" disabled={busy}>前往此目录</button></form><div className="button-row"><button disabled={busy || parent === location} onClick={() => setPath(parent)}><ArrowUp size={17} />上级</button><button className="primary" disabled={busy || !location} onClick={() => onPick(location)}><FolderOpen size={17} />选择当前文件夹</button></div><Notice text={error} />{busy && <Busy />}{rows.map(row => <button key={row.path} className="file-row" onClick={() => setPath(row.path)}><Folder size={18} /><span>{row.name}</span><ChevronRight size={16} /></button>)}{next !== null && <button className="full" onClick={() => void load(next)}>继续读取</button>}</Sheet>;
}
export function WorkspaceCreator({
  onCreated,
  onClose
}: {
  onCreated: (workspace: Workspace, session: Session) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(''),
    [root, setRoot] = useState(''),
    [kernel, setKernel] = useState(''),
    [kernels, setKernels] = useState<RecordValue[]>([]),
    [picker, setPicker] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    void control('kernels.list').then(r => setKernels(list(r.entries))).catch(e => setError(String(e)));
  }, []);
  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await control('workspace.create', {
        name: name.trim(),
        ...(root ? {
          projectRootPath: root
        } : {}),
        ...(kernel ? {
          defaultKernelId: kernel
        } : {})
      });
      onCreated(r.workspace as unknown as Workspace, r.session as unknown as Session);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <Sheet title="新建项目 / 工作区" onClose={onClose}><label className="field">名称<input value={name} maxLength={200} onChange={e => setName(e.target.value)} placeholder="例如：产品研究、客户端开发" /></label><label className="field">项目目录<input value={root} readOnly placeholder="留空：Tervell 自动创建托管目录" /></label><div className="button-row"><button disabled={busy} onClick={() => setPicker(true)}><FolderOpen size={17} />浏览电脑文件夹</button>{root && <button onClick={() => setRoot('')}>使用托管目录</button>}</div><label className="field">默认内核<select value={kernel} onChange={e => setKernel(e.target.value)}><option value="">沿用电脑默认</option>{kernels.filter(k => k.enabled && k.available).map(k => <option value={String(k.id)} key={String(k.id)}>{String(k.name)}</option>)}</select></label><p className="muted">创建后自动连接到手机，并生成首个会话。后续会话可独立选择模型、推理和内核选项。</p><Notice text={error} /><button className="primary full" disabled={busy || !name.trim()} onClick={() => void create()}><Plus size={18} />{busy ? '正在初始化项目…' : '创建并打开'}</button>{picker && <ComputerFolderPicker initial={root} onClose={() => setPicker(false)} onPick={value => {
      setRoot(value);
      setPicker(false);
    }} />}</Sheet>;
}
export function Workspaces({
  onOpen,
  onChanged,
  management,
  hostId
}: {
  hostId: string;
  onOpen: (id: string) => void;
  onChanged: () => void;
  management: boolean;
}) {
  const [rows, setRows] = useState<Project[]>([]),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<Project>(),
    [page, setPage] = useState<'files' | 'tools' | 'settings' | 'memory'>('files'),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [name, setName] = useState(''),
    [kernels, setKernels] = useState<RecordValue[]>([]),
    [kernel, setKernel] = useState(''),
    [picker, setPicker] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      const result = await control('workspaces.directory');
      setRows(list(result.workspaces));
      onChanged();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
    void control('kernels.list').then(r => setKernels(list(r.entries))).catch(() => {});
  }, []);
  const choose = (row: Project) => {
    setSelected(row);
    setName(row.name);
    setKernel(row.defaultKernelId ?? '');
    setPage('files');
  };
  const run = async (operation: string, values: RecordValue) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const result = await control(operation, values, {
        workspaceId: selected.id
      });
      if (result.id) setSelected(row => ({
        ...row!,
        ...result
      }));
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!selected || !confirm('删除“' + selected.name + '”及其会话、自动任务和托管配置？外部项目文件夹保留。')) return;
    setBusy(true);
    setError('');
    try {
      await control('workspace.delete', {
        targetWorkspaceId: selected.id
      });
      setSelected(undefined);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><SearchBox value={query} onChange={setQuery} placeholder="搜索全部项目" /><button className="primary full" onClick={() => setCreating(true)}><Plus size={18} />新建项目 / 工作区</button><Notice text={error} />{busy && <Busy />}{rows.filter(row => row.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(!!b.pluginPinnedAt) - Number(!!a.pluginPinnedAt)).map(row => <button className="workspace-card" key={row.id} onClick={() => choose(row)}><Folder size={22} /><span><strong>{row.name}</strong><small>{row.sessions} 个会话 · {row.defaultKernelId ?? '默认内核'}{row.pluginArchivedAt ? ' · 已归档' : ''}</small><small>{row.root}</small></span><ChevronRight size={18} /></button>)}{!rows.length && !busy && <Empty title="尚无项目" detail="可以直接在手机创建，全部项目自动连接。" />}{selected && <Sheet title={selected.name} onClose={() => setSelected(undefined)} wide><div className="button-row"><button className={page === 'files' ? 'selected' : ''} onClick={() => setPage('files')}><Files size={17} />文件</button><button className={page === 'tools' ? 'selected' : ''} onClick={() => setPage('tools')}>MCP / Skills</button><button className={page==='memory'?'selected':''} onClick={()=>setPage('memory')}>项目记忆</button><button className={page === 'settings' ? 'selected' : ''} onClick={() => setPage('settings')}><Settings size={17} />项目设置</button><button onClick={() => {
          onOpen(selected.id);
          setSelected(undefined);
        }}>打开会话</button></div>{page === 'files' ? <ProjectFiles key={selected.id} workspaceId={selected.id} hostId={hostId} /> : page==='memory'?<ProjectMemory key={selected.id} workspaceId={selected.id}/>: page === 'tools' ? <ProjectTools key={selected.id} workspaceId={selected.id} management={management} /> : <><Notice text={error} /><label className="field">项目名称<input value={name} onChange={e => setName(e.target.value)} /></label><button disabled={busy || !name.trim()} onClick={() => void run('workspace.rename', {
          name: name.trim()
        })}>保存名称</button><label className="field">新会话默认内核<select value={kernel} onChange={e => setKernel(e.target.value)}><option value="">沿用电脑默认</option>{kernels.filter(k => k.enabled && k.available).map(k => <option key={String(k.id)} value={String(k.id)}>{String(k.name)}</option>)}</select></label><button disabled={busy} onClick={() => void run('workspace.kernel', {
          kernelId: kernel
        })}>保存默认内核</button><label className="field">电脑目录<input value={selected.root} readOnly /></label><button disabled={busy} onClick={() => setPicker(true)}>重新关联电脑文件夹</button><div className="button-row"><button disabled={busy} onClick={() => void run('workspace.pin', {
            pinned: !selected.pluginPinnedAt
          })}><Pin size={17} />{selected.pluginPinnedAt ? '取消固定' : '固定项目'}</button><button disabled={busy} onClick={() => void run('workspace.archive', {
            archived: !selected.pluginArchivedAt
          })}><Archive size={17} />{selected.pluginArchivedAt ? '恢复项目' : '归档项目'}</button><button className="danger" disabled={busy || !management} onClick={() => void remove()}>删除工作区</button></div></>}{picker && <ComputerFolderPicker initial={selected.root} onClose={() => setPicker(false)} onPick={path => {
        setPicker(false);
        void run('workspace.relink', {
          path
        });
      }} />}</Sheet>}{creating && <WorkspaceCreator onClose={() => setCreating(false)} onCreated={workspace => {
      setCreating(false);
      void load();
      onOpen(workspace.id);
    }} />}</>;
}
