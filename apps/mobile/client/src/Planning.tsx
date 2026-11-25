import React, { useEffect, useRef, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { control, list } from './bridge';
import type { RecordValue } from './bridge';
import type { Workspace } from './model';
import { Busy, Notice, SearchBox, Empty } from './ui';
import { planningDraft } from './planning-form';
import { PlanningEditor } from './PlanningEditor';
export function Planning({
  workspaces,
  initialWorkspace
}: {
  workspaces: Workspace[];
  initialWorkspace: string;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace || workspaces[0]?.id || ''),
    [tab, setTab] = useState('todos'),
    [snapshot, setSnapshot] = useState<RecordValue>({}),
    [query, setQuery] = useState(''),
    [edit, setEdit] = useState<RecordValue>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const generation = useRef(0);
  const load = async () => {
    if (!workspace) return;
    const epoch = ++generation.current;
    setBusy(true);
    try {
      const r = await control('planning.read', {}, {
        workspaceId: workspace
      });
      if (epoch === generation.current) setSnapshot(r);
    } catch (e) {
      if (epoch === generation.current) setError(String(e));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [workspace]);
  const run = async (values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('planning.action', values, {
        workspaceId: workspace
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
  const kind = tab === 'todos' ? 'todo' : tab === 'calendar' ? 'calendar' : 'automation',
    rows = list(snapshot[tab]).filter(row => String(row.title ?? row.name).toLowerCase().includes(query.toLowerCase()));
  return <><label className="field">工作区<select value={workspace} onChange={e => {
        setWorkspace(e.target.value);
        setSnapshot({});
      }}>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label><div className="button-row">{[['todos', '待办'], ['calendar', '日程'], ['automations', '自动化']].map(([id, label]) => <button key={id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>{label}</button>)}<button aria-label="刷新项目规划" disabled={busy} onClick={() => void load()}><RefreshCw size={17} /></button></div><Notice text={error} />{busy && <Busy />}<button className="primary full" disabled={!workspace} onClick={() => setEdit(planningDraft(kind))}><Plus size={17} />新建{kind === 'todo' ? '待办' : kind === 'calendar' ? '日程' : '自动化'}</button><SearchBox value={query} onChange={setQuery} placeholder="搜索项目规划" />
 {rows.map(row => <div className="settings-group" key={String(row.id)}><button className="setting-row" onClick={() => setEdit(planningDraft(kind, row))}><span><strong>{String(row.title ?? row.name)}</strong><small>{kind === 'todo' ? row.status === 'completed' ? '已完成' : '未完成' : kind === 'calendar' ? new Date(Number(row.startAt)).toLocaleString() : String(row.scheduleType) + ' · ' + (row.active ? '已启用' : '草稿 / 已停用')}</small></span></button><div className="button-row">{kind === 'automation' && <button disabled={busy} onClick={() => {
          if (confirm('立即在电脑执行此自动化？')) void run({
            action: 'automation.run',
            id: row.id
          });
        }}>立即执行</button>}<button className="danger" disabled={busy} onClick={() => {
          if (confirm('删除此项规划？')) void run({
            action: 'remove',
            kind,
            id: row.id
          });
        }}>删除</button></div></div>)}{!rows.length && !busy && <Empty title="当前工作区暂无此类规划" />}
 <details className="settings-group"><summary>分组与标签</summary>{(['todo', 'calendar'] as const).map(scope => <div key={scope}><h3>{scope === 'todo' ? '待办分组' : '日程分组'}</h3>{list(snapshot.groups).filter(g => g.scope === scope).map(g => <div className="button-row" key={String(g.id)}><button onClick={() => {
            const name = prompt('分组名称', String(g.name));
            if (name?.trim()) void run({
              action: 'group.save',
              scope,
              id: g.id,
              name: name.trim()
            });
          }}>{String(g.name)}</button><button className="danger" onClick={() => {
            if (confirm('移除此分组？分组内项目保留。')) void run({
              action: 'group.remove',
              scope,
              id: g.id
            });
          }}>移除</button></div>)}<button onClick={() => {
          const name = prompt('新分组名称');
          if (name?.trim()) void run({
            action: 'group.save',
            scope,
            name: name.trim()
          });
        }}>添加分组</button></div>)}<h3>标签</h3>{list(snapshot.tags).map(t => <div className="button-row" key={String(t.id)}><button onClick={() => {
          const name = prompt('标签名称', String(t.name));
          if (name?.trim()) void run({
            action: 'tag.save',
            id: t.id,
            name: name.trim()
          });
        }}>{String(t.name)}</button><button className="danger" onClick={() => {
          if (confirm('移除此标签？')) void run({
            action: 'tag.remove',
            id: t.id
          });
        }}>移除</button></div>)}<button onClick={() => {
        const name = prompt('新标签名称');
        if (name?.trim()) void run({
          action: 'tag.save',
          name: name.trim()
        });
      }}>添加标签</button></details>
 {list(snapshot.reminders).length > 0 && <div className="settings-group"><h3>待确认提醒</h3>{list(snapshot.reminders).map(r => <div key={String(r.id)}><p>{String(r.targetTitle)} · {new Date(Number(r.triggerAt)).toLocaleString()}</p><div className="button-row"><button onClick={() => void run({
            action: 'reminder.acknowledge',
            id: r.id
          })}>已知悉</button><button onClick={() => void run({
            action: 'reminder.snooze',
            id: r.id,
            minutes: 15
          })}>15 分钟后提醒</button></div></div>)}</div>}
 {edit && <PlanningEditor initial={edit} workspaceId={workspace} groups={list(snapshot.groups)} tags={list(snapshot.tags)} onClose={() => setEdit(undefined)} onSaved={() => void load()} />}</>;
}
