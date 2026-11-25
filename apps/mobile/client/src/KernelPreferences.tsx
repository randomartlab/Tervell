import {kernelControlSelectionField,kernelModelDependencies,isKernelModelDependency} from '@proma/shared';
import React, { useEffect, useRef, useState } from 'react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import type { MobileControlRow } from './model-settings';
import { Busy, Notice } from './ui';

export function KernelPreferences({ kernelId }: { kernelId: string }) {
  const [workspaces, setWorkspaces] = useState<RecordValue[]>([]), [scope, setScope] = useState('');
  const [values, setValues] = useState<RecordValue>({}), [saved, setSaved] = useState('');
  const [catalog, setCatalog] = useState<RecordValue>(), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const epoch = useRef(0), dirty = JSON.stringify(values) !== saved;
  const request = { kernelId, ...(scope ? { targetWorkspaceId: scope } : {}) };
  useEffect(() => { void control('workspaces.directory').then(r => setWorkspaces(list(r.workspaces))).catch(e => setError(String(e))); }, []);
  useEffect(() => {
    const generation = ++epoch.current;
    setBusy(true); setError(''); setNotice(''); setCatalog(undefined);
    void (async () => {
      const state = await control('kernels.preferences', request);
      const next = plain(scope ? state.project : state.global);
      if (generation !== epoch.current) return;
      setValues(next); setSaved(JSON.stringify(next));
      const actual = await control('kernels.preference-options', { ...request, values: next });
      if (generation === epoch.current) setCatalog(actual);
    })().catch(e => { if (generation === epoch.current) setError(String(e)); }).finally(() => { if (generation === epoch.current) setBusy(false); });
    return () => { epoch.current++; };
  }, [kernelId, scope]);
  const probe = async (next: RecordValue) => {
    const generation = ++epoch.current;
    setValues(next); setBusy(true); setError(''); setNotice('');
    try { const result = await control('kernels.preference-options', { ...request, values: next }); if (generation === epoch.current) setCatalog(result); }
    catch (e) { if (generation === epoch.current) setError(String(e)); }
    finally { if (generation === epoch.current) setBusy(false); }
  };
  const change = (row: MobileControlRow, value: string | number | boolean | undefined) => {
    const next = { ...values }, role = kernelControlSelectionField(row,list<MobileControlRow>(catalog?.controls));
    if (role) { if (value === undefined) delete next[role]; else next[role] = value; if (role === 'modelId') next.configValues = kernelModelDependencies(list<MobileControlRow>(catalog?.controls),plain(values.configValues) as Record<string,string|number|boolean>); }
    else { if(isKernelModelDependency(row,list<MobileControlRow>(catalog?.controls))){delete next.modelId;next.configValues={};} next.configValues = { ...plain(next.configValues) }; if (value === undefined) delete (next.configValues as RecordValue)[row.id]; else (next.configValues as RecordValue)[row.id] = value; }
    void probe(next);
  };
  const save = async () => {
    setBusy(true); setError('');
    try { await control('kernels.preferences-save', { ...request, values }); setSaved(JSON.stringify(values)); setNotice('已保存到电脑；新建或切换内核的会话将继承，已有会话保留单独设置。'); }
    catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  };
  return <>
    <p className="muted">项目继承电脑全局默认；当前会话可再覆盖。未指定的选项沿用内核实际配置。</p>
    <label className="field">保存范围<select value={scope} disabled={busy} onChange={e => { if (!dirty || confirm('放弃未保存的选项并切换范围？')) setScope(e.target.value); }}><option value="">电脑全局默认</option>{workspaces.map(w => <option key={String(w.id)} value={String(w.id)}>项目：{String(w.name)}</option>)}</select></label>
    <Notice text={error} />{notice && <p role="status">{notice}</p>}{busy && <Busy text="正在读取内核动态选项…" />}
    {typeof catalog?.notice === 'string' && <p className="setting-note" role="status">{catalog.notice}</p>}
    {!!catalog?.routedModel && <p className="setting-note">模型由 Magpie 接管：{String(catalog.routedModel)}。在模型设置中调整模型及原始推理档位。</p>}
    {list<MobileControlRow>(catalog?.controls).filter(row => !catalog?.routedModel || !isKernelModelDependency(row,list<MobileControlRow>(catalog?.controls))&&!/model|reasoning|thinking|thought|effort/i.test((row.category ?? '') + ' ' + row.id)).map(row => {
      const role = kernelControlSelectionField(row,list<MobileControlRow>(catalog?.controls));
      const value = (role ? values[role] : plain(values.configValues)[row.id]) ?? row.currentValue;
      return <div className="settings-group" key={row.id}><label className="field">{row.name}{row.type === 'select' ? <select disabled={busy || row.readOnly} value={JSON.stringify(value) ?? ''} onChange={e => { const choice = row.options?.find(o => JSON.stringify(o.value) === e.target.value); if (choice) change(row, choice.value); }}><option value="" disabled>内核默认</option>{row.options?.map(o => <option key={JSON.stringify(o.value)} value={JSON.stringify(o.value)}>{o.name}</option>)}</select> : row.type === 'boolean' ? <input type="checkbox" disabled={busy || row.readOnly} checked={value === true} onChange={e => change(row, e.target.checked)} /> : row.type === 'number' || row.type === 'string' ? <input key={String(value)} type={row.type === 'number' ? 'number' : 'text'} min={row.minimum} max={row.maximum} defaultValue={String(value ?? '')} disabled={busy || row.readOnly} onBlur={e => { const next = row.type === 'number' ? Number(e.target.value) : e.target.value; if (row.type === 'number' && (!e.target.value.trim() || !Number.isFinite(next))) { setError('请输入有效数字'); return; } if (next !== value) change(row, next); }} /> : <span className="muted">上游只读选项</span>}</label><button disabled={busy} onClick={() => change(row, undefined)}>恢复继承</button></div>;
    })}
    <label className="field">默认自动批准工具<select value={values.autoApprove === undefined ? '' : String(values.autoApprove)} disabled={busy} onChange={e => setValues(v => { const next = { ...v }; if (!e.target.value) delete next.autoApprove; else next.autoApprove = e.target.value === 'true'; return next; })}><option value="">继承默认</option><option value="false">逐次确认</option><option value="true">自动批准</option></select></label>
    <div className="button-row"><button className="primary" disabled={busy || !dirty || !!error} onClick={() => void save()}>保存默认选项</button><button disabled={busy} onClick={() => void probe({})}>全部恢复继承</button></div>
  </>;
}
