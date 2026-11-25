import React, { useState } from 'react';
import { control, list } from './bridge';
import type { RecordValue } from './bridge';
import { Sheet, Notice } from './ui';
import { planningValues } from './planning-form';
export function PlanningEditor({
  initial,
  workspaceId,
  groups,
  tags,
  onClose,
  onSaved
}: {
  initial: RecordValue;
  workspaceId: string;
  groups: RecordValue[];
  tags: RecordValue[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [edit, setEdit] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const field = (key: string, label: string, type = 'text') => <label className="field" key={key}>{label}<input type={type} value={String(edit[key] ?? '')} onChange={e => setEdit(v => ({
      ...v,
      [key]: e.target.value
    }))} /></label>;
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await control('planning.action', planningValues(edit), {
        workspaceId
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <Sheet title={edit.id ? '编辑规划' : '新建规划'} onClose={() => {
    if (JSON.stringify(initial) === JSON.stringify(edit) || confirm('放弃未保存的规划修改？')) onClose();
  }}><Notice text={error} />{field('title', '名称')}{edit.kind === 'automation' ? <>
 <label className="field">执行指令<textarea rows={8} value={String(edit.prompt)} onChange={e => setEdit(v => ({
          ...v,
          prompt: e.target.value
        }))} /></label>
 <label className="field">执行周期<select value={String(edit.scheduleType)} onChange={e => setEdit(v => ({
          ...v,
          scheduleType: e.target.value
        }))}>{[['interval', '间隔'], ['daily', '每天'], ['weekly', '每周'], ['monthly', '每月'], ['once', '单次']].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
 {edit.scheduleType === 'interval' ? field('intervalMinutes', '间隔分钟', 'number') : edit.scheduleType === 'once' ? field('scheduled', '单次执行时间', 'datetime-local') : field('timeOfDay', '执行时刻', 'time')}
 {edit.scheduleType === 'weekly' && field('dayOfWeek', '周几（0=周日，1=周一）', 'number')}{edit.scheduleType === 'monthly' && field('dayOfMonth', '每月几号', 'number')}
 <details className="settings-group"><summary>模型与高级计划</summary>{field('channelId', '电脑渠道 ID（留空沿用默认）')}{field('modelId', '模型 ID（留空沿用默认）')}{field('maxRuns', '最多运行次数（留空不限）', 'number')}{field('activeWindowStart', '每日执行窗口开始', 'time')}{field('activeWindowEnd', '每日执行窗口结束', 'time')}{field('weekdays', '运行星期（0–6，逗号分隔；留空每天）')}<label className="field">会话复用<select value={String(edit.sessionMode)} onChange={e => setEdit(v => ({
            ...v,
            sessionMode: e.target.value
          }))}><option value="daily">同日复用，跨日新会话</option><option value="reuse">长期复用同一会话</option></select></label><label className="field">飞书通知目标（JSON）<textarea rows={5} value={String(edit.notifications)} onChange={e => setEdit(v => ({
            ...v,
            notifications: e.target.value
          }))} /></label></details>
 <label className="setting-row"><span>启用自动执行<small>电脑在线时按计划执行；默认新建为草稿。</small></span><input type="checkbox" checked={edit.active === true} onChange={e => setEdit(v => ({
          ...v,
          active: e.target.checked
        }))} /></label>
 </> : <><label className="field">备注<textarea rows={5} value={String(edit.notes)} onChange={e => setEdit(v => ({
          ...v,
          notes: e.target.value
        }))} /></label>{edit.kind === 'todo' ? <><label className="field">状态<select value={String(edit.status)} onChange={e => setEdit(v => ({
            ...v,
            status: e.target.value
          }))}><option value="open">未完成</option><option value="completed">已完成</option></select></label><label className="field">优先级<select value={String(edit.priority)} onChange={e => setEdit(v => ({
            ...v,
            priority: e.target.value
          }))}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label>{field('due', '截止时间', 'datetime-local')}</> : <>{field('start', '开始时间', 'datetime-local')}{field('end', '结束时间', 'datetime-local')}<label className="setting-row"><span>全天</span><input type="checkbox" checked={edit.allDay === true} onChange={e => setEdit(v => ({
            ...v,
            allDay: e.target.checked
          }))} /></label></>}
 <label className="field">分组<select value={String(edit.groupId ?? '')} onChange={e => setEdit(v => ({
          ...v,
          groupId: e.target.value
        }))}><option value="">无分组</option>{groups.filter(g => g.scope === edit.kind).map(g => <option key={String(g.id)} value={String(g.id)}>{String(g.name)}</option>)}</select></label><div className="settings-group"><h3>标签</h3>{tags.map(t => <label className="setting-row" key={String(t.id)}><span>{String(t.name)}</span><input type="checkbox" checked={list<string>(edit.tagIds).includes(String(t.id))} onChange={e => setEdit(v => ({
            ...v,
            tagIds: e.target.checked ? [...list<string>(v.tagIds), String(t.id)] : list<string>(v.tagIds).filter(id => id !== t.id)
          }))} /></label>)}</div>
 {edit.id && <button className="full" disabled={busy} onClick={() => {
        const value = prompt('提醒时间（例如 2026-11-24T09:00）');
        if (!value) return;
        const time = new Date(value).getTime();
        if (!Number.isFinite(time)) {
          setError('提醒时间无效');
          return;
        }
        setBusy(true);
        void control('planning.action', {
          action: 'reminder.create',
          kind: edit.kind,
          id: edit.id,
          triggerAt: time
        }, {
          workspaceId
        }).then(onSaved).catch(e => setError(String(e))).finally(() => setBusy(false));
      }}>添加提醒</button>}
 </>}<button className="primary full" disabled={busy || !String(edit.title).trim()} onClick={() => void save()}>{busy ? '正在保存…' : '保存到电脑'}</button></Sheet>;
}
