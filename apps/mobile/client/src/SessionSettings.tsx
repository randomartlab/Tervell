import {kernelControlSelectionField,kernelModelDependencies,isKernelModelDependency} from '@proma/shared';
import React, { useEffect, useRef, useState } from 'react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import { Notice, Busy, SearchBox } from './ui';
import { kernelFormValues } from './model-settings';
import type { MobileControlRow } from './model-settings';
interface Choice {
  id: string;
  name?: string;
  label?: string;
  efforts?: string[];
}
export function SessionSettings({
  sessionId,
  onChanged
}: {
  sessionId: string;
  onChanged: () => void;
}) {
  const [kernels, setKernels] = useState<Choice[]>([]),
    [kernel, setKernel] = useState(''),
    [catalog, setCatalog] = useState<RecordValue>(),
    [detail, setDetail] = useState<RecordValue>({}),
    [model, setModel] = useState(''),
    [mode, setMode] = useState(''),
    [config, setConfig] = useState<RecordValue>({}),
    [effort, setEffort] = useState(''),
    [channel, setChannel] = useState(''),
    [query, setQuery] = useState(''),
    [autoApprove, setAutoApprove] = useState(false),
    [permissionMode, setPermissionMode] = useState('bypassPermissions'),
    [cwd, setCwd] = useState('project'),
    [worktrees, setWorktrees] = useState<RecordValue[]>([]),
    [worktree, setWorktree] = useState(''),
    [commands, setCommands] = useState<RecordValue[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(() => () => {
    generation.current++;
  }, []);
  const load = async () => {
    const epoch = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const d = await control('session.detail', {}, {
          sessionId
        }),
        k = await control('session.kernels', {}, {
          sessionId
        }),
        c = await control('session.catalog', {}, {
          sessionId
        });
      if (epoch !== generation.current) return;
      const values = kernelFormValues(c, d);
      setDetail(d);
      setAutoApprove(d.kernelAutoApprove === true);
      setPermissionMode(String(d.permissionMode ?? 'bypassPermissions'));
      setCwd(String(d.agentCwdMode ?? 'project'));
      setWorktree(String(plain(d.activeWorktree).path ?? ''));
      void control('worktrees.session', {}, {
        sessionId
      }).then(r => {
        if (epoch === generation.current) setWorktrees(list(r.worktrees));
      }).catch(() => {});
      void control('session.commands', {}, {
        sessionId
      }).then(r => {
        if (epoch === generation.current) setCommands(list(r.commands));
      }).catch(() => {});
      setKernels(list(k.entries));
      setKernel(String(d.kernelId ?? 'pi'));
      setCatalog(c);
      setModel(values.model);
      setMode(values.mode);
      setConfig(values.config);
      setEffort(String(plain(d.gatewayReasoning).effort ?? ''));
      if (d.kernelId === 'pi') {
        const options = await control('session.direct-options', {}, {
          sessionId
        });
        if (epoch !== generation.current) return;
        setChannel(String(options.channelId ?? ''));
        if (!c.routedModel) setEffort(String(plain(options.selection).effort ?? ''));
        setCatalog(x => ({
          ...x,
          directOptions: options
        }));
      }
    } catch (e) {
      if (epoch === generation.current) setError(String(e));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [sessionId]);
  const probe = async (id: string) => {
    const epoch = ++generation.current;
    setKernel(id);
    setBusy(true);
    setError('');
    setEffort('');
    setChannel('');
    setModel('');
    setMode('');
    setConfig({});
    setCatalog(undefined);
    try {
      const c = await control('session.probe', {
        kernelId: id
      }, {
        sessionId
      });
      if (epoch !== generation.current) return;
      const values = kernelFormValues(c);
      setCatalog(c);
      setModel(values.model);
      setMode(values.mode);
      setConfig(values.config);
    } catch (e) {
      if (epoch === generation.current) setError(String(e));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  const chooseModel = async (selected: string) => {
    const epoch = ++generation.current;
    setModel(selected);
    setEffort('');
    setError('');
    setBusy(true);
    if (kernel === 'pi') setCatalog(c => ({
      ...c,
      directOptions: {
        efforts: []
      }
    }));
    try {
      if (kernel === 'pi') {
        const capabilities = selected && channel ? await control('session.model-capabilities', {
          channelId: channel,
          model: selected
        }, {
          sessionId
        }) : {
          efforts: []
        };
        if (epoch === generation.current) setCatalog(c => ({
          ...c,
          directOptions: capabilities
        }));
      } else {
        const c = await control('session.probe', {
          kernelId: kernel,
          modelId: selected || undefined,
          modeId: mode || undefined,
          configValues: kernelModelDependencies(list<MobileControlRow>(catalog?.controls),config as Record<string,string|number|boolean>)
        }, {
          sessionId
        });
        if (epoch !== generation.current) return;
        setCatalog(c);
        setConfig(kernelFormValues(c).config);
      }
    } catch (e) {
      if (epoch === generation.current) setError(String(e));
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  };
  const changeExtraControl = async (row:MobileControlRow,value:string|number|boolean) => {
    if(!isKernelModelDependency(row,list<MobileControlRow>(catalog?.controls))){setConfig(old=>({...old,[row.id]:value}));return;}
    const epoch=++generation.current;setBusy(true);setError('');setModel('');setConfig({[row.id]:value});
    try{const next=await control('session.probe',{kernelId:kernel,modeId:mode||undefined,configValues:{[row.id]:value}},{sessionId});if(epoch===generation.current){setCatalog(next);const values=kernelFormValues(next);setModel(values.model);setConfig(values.config);}}
    catch(error){if(epoch===generation.current)setError(String(error));}
    finally{if(epoch===generation.current)setBusy(false);}
  };
  const controls = list<MobileControlRow>(catalog?.controls),
    routed = String(catalog?.routedModel ?? ''),
    direct = plain(catalog?.directOptions),
    models = list<Choice>(catalog?.models),
    channels = list<RecordValue>(catalog?.channels);
  const rawEfforts = routed ? list<string>(catalog?.routedEfforts) : list<string>(direct.efforts);
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (kernel === 'pi' && !routed && (!channel || !model)) throw Error('请先选择已启用的供应商和模型。');
      await control('session.configuration', {
        selection: {
          kernelId: kernel,
          ...(kernel !== 'pi' && !routed && model ? {
            modelId: model
          } : {}),
          ...(mode ? {
            modeId: mode
          } : {}),
          configValues: config,
          autoApprove
        },
        ...(kernel === 'pi' && !routed ? {
          channelId: channel,
          piModelId: model
        } : {}),
        ...(effort ? {
          effort
        } : {}),
        ...(kernel === 'pi' ? {
          permissionMode
        } : {}),
        cwd,
        worktree
      }, {
        sessionId
      });
      onChanged();
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <><Notice text={error} />{typeof catalog?.notice==='string'&&<div className="setting-note" role="status">{catalog.notice}</div>}{!catalog && busy ? <Busy /> : <><label className="field">Agent 内核<select value={kernel} onChange={e => void probe(e.target.value)} disabled={busy}>{kernels.map(k => <option key={k.id} value={k.id}>{k.name ?? k.id}</option>)}</select></label>{routed ? <div className="setting-note"><strong>使用电脑全局模型路由</strong><p>{routed}</p></div> : kernel === 'pi' && channels.length ? <><label className="field">供应商<select value={channel} disabled={busy} onChange={e => {
            generation.current++;
            setChannel(e.target.value);
            setModel('');
            setEffort('');
            setCatalog(c => ({
              ...c,
              directOptions: {
                efforts: []
              }
            }));
          }}><option value="">选择供应商</option>{channels.map(c => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}</select></label><label className="field">模型<select value={model} disabled={busy} onChange={e => void chooseModel(e.target.value)}><option value="">选择模型</option>{list<Choice>(channels.find(c => c.id === channel)?.models).map(m => <option key={m.id} value={m.id}>{m.name ?? m.id}</option>)}</select></label></> : <><SearchBox value={query} onChange={setQuery} placeholder="搜索模型" /><label className="field">模型<select value={model} disabled={busy} onChange={e => void chooseModel(e.target.value)}><option value="">内核默认</option>{models.filter(m => (m.name ?? m.id).toLowerCase().includes(query.toLowerCase())).map(m => <option key={m.id} value={m.id}>{m.name ?? m.id}</option>)}</select></label></>}{list<Choice>(catalog?.modes).length > 0 && <label className="field">权限模式<select value={mode} disabled={busy} onChange={e => {
          const next = e.target.value;
          setMode(next);
          setBusy(true);
          const epoch = ++generation.current;
          void control('session.probe', {
            kernelId: kernel,
            ...(model && !routed ? {
              modelId: model
            } : {}),
            ...(next ? {
              modeId: next
            } : {}),
            configValues: config
          }, {
            sessionId
          }).then(r => {
            if (generation.current === epoch) {
              setCatalog(r);
              setConfig(kernelFormValues(r).config);
            }
          }).catch(e => {
            if (generation.current === epoch) setError(String(e));
          }).finally(() => {
            if (generation.current === epoch) setBusy(false);
          });
        }}><option value="">内核默认</option>{list<Choice>(catalog?.modes).map(m => <option key={m.id} value={m.id}>{m.name ?? m.id}</option>)}</select></label>}{rawEfforts.length > 0 && <label className="field">推理档位（模型原始选项）<select value={effort} disabled={busy} onChange={e => setEffort(e.target.value)}><option value="">自动</option>{rawEfforts.map(e => <option key={e} value={e}>{e}</option>)}</select></label>}{controls.filter(c => !kernelControlSelectionField(c,controls) && !(routed && (isKernelModelDependency(c,controls)||/(?:reasoning|thinking|thought|effort)/i.test((c.category ?? '') + ' ' + c.id)))).map(c => <label className="field" key={c.id}>{c.name}{c.type === 'boolean' ? <input type="checkbox" checked={(config[c.id] ?? c.currentValue) === true} disabled={c.readOnly || busy} onChange={e => setConfig(v => ({
          ...v,
          [c.id]: e.target.checked
        }))} /> : c.type === 'select' ? <select value={String(config[c.id] ?? c.currentValue ?? '')} disabled={c.readOnly || busy} onChange={e => {
          const selected = c.options?.find(o => String(o.value) === e.target.value);
          void changeExtraControl(c,selected?.value ?? e.target.value);
        }}><option value="">内核默认</option>{c.options?.map(o => <option key={String(o.value)} value={String(o.value)}>{o.name}</option>)}</select> : c.type === 'number' || c.type === 'string' ? <input type={c.type === 'number' ? 'number' : 'text'} value={String(config[c.id] ?? c.currentValue ?? '')} min={c.minimum} max={c.maximum} disabled={c.readOnly || busy} onChange={e => setConfig(v => ({
          ...v,
          [c.id]: c.type === 'number' ? Number(e.target.value) : e.target.value
        }))} /> : <small>当前内核返回了此手机尚不支持的控件，请在电脑配置。</small>}</label>)}<label className="setting-row"><span>此会话自动批准工具</span><input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} disabled={busy} /></label><p className="muted">关闭时保留手机逐次工具审批；内核自己的模式选项仍按其返回的规则执行。</p>{kernel === 'pi' && <label className="field">执行策略<select value={permissionMode} disabled={busy} onChange={e => setPermissionMode(e.target.value)}><option value="bypassPermissions">正常执行</option><option value="plan">只做计划</option></select></label>}<label className="field">工作目录<select value={cwd} disabled={busy} onChange={e => setCwd(e.target.value)}><option value="project">项目目录</option><option value="session">会话独立目录</option></select></label>{worktrees.length > 0 && <label className="field">活动 Worktree<select value={worktree} disabled={busy} onChange={e => setWorktree(e.target.value)}><option value="">不使用独立 Worktree</option>{worktrees.filter(w => !w.isMain).map(w => <option key={String(w.path)} value={String(w.path)}>{String(w.branch ?? w.path)}</option>)}</select></label>}{commands.length > 0 && <details className="settings-group"><summary>此内核可用命令 · {commands.length} 项</summary>{commands.map(command => <p key={String(command.name)}><strong>/{String(command.name)}</strong><small>{String(command.description ?? '')}</small></p>)}</details>}<p className="muted">选项直接来自电脑当前内核和模型能力。运行中不会强行切换正在处理的任务。</p><button className="primary full session-configuration-save" disabled={busy} onClick={() => void save()}>{busy ? '正在保存…' : '保存会话配置'}</button></>}</>;
}
