import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Download, Trash2 } from 'lucide-react';
import { control, list } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, Sheet } from './ui';
import {KernelPreferences}from'./KernelPreferences';
export function Kernels() {
  const [entries, setEntries] = useState<RecordValue[]>([]),
    [selected, setSelected] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [edit, setEdit] = useState<RecordValue>(),
    [install, setInstall] = useState<RecordValue>(),[preferences,setPreferences]=useState('');
  const load = async (refresh = false) => {
    setBusy(true);
    try {
      const r = await control(refresh ? 'kernels.refresh' : 'kernels.list');
      setEntries(list(r.entries));
      setSelected(String(r.defaultKernelId));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!install || !['installing', 'verifying'].includes(String(install.phase))) return;
    const timer = setInterval(() => void control('kernels.install-status').then(setInstall).catch(e => setError(String(e))), 1200);
    return () => clearInterval(timer);
  }, [install?.phase]);
  useEffect(()=>{if(install&&['succeeded','failed','cancelled'].includes(String(install.phase)))void load();},[install?.phase]);
  const run = async (op: string, v: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      await control(op, v);
      await load();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return <><Notice text={error} /><div className="button-row"><button disabled={busy} onClick={() => void load(true)}><RefreshCw size={17} />重新检测电脑</button><button onClick={() => setEdit({
        id: '',
        name: '',
        command: '',
        args: [],
        enabled: true
      })}><Plus size={17} />添加自定义内核</button></div>{busy && <Busy />}<label className="field">电脑默认内核<select value={selected} onChange={e => void run('kernels.default', {
        id: e.target.value
      })}>{entries.filter(k => k.enabled && k.available && k.transport !== 'pty').map(k => <option key={String(k.id)} value={String(k.id)}>{String(k.name)}</option>)}</select></label>{entries.filter(k=>k.transport!=='pty').map(k => <div className="settings-group" key={String(k.id)}><strong>{String(k.name)}</strong><p className="muted">{k.available ? ((k.verification as RecordValue|undefined)?.session==='ready'?'ACP 会话检查通过':(k.verification as RecordValue|undefined)?.session==='login-required'?'已安装；未登录时将尝试 Magpie 接管，厂商专属账号需先登录':'电脑已发现程序，待模型连接检查') : String(k.diagnostic ?? '尚不可用')} · {String(k.transport ?? '内置')}</p><div className="button-row">{!!k.installable && <button disabled={busy} onClick={() => void control('kernels.install', {
          kernelId: k.id
        }).then(setInstall).catch(e => setError(String(e)))}><Download size={16} />在电脑安装</button>}{!!k.available&&!!k.enabled&&k.transport!=='pty'&&<button disabled={busy} onClick={()=>setPreferences(String(k.id))}>全局与项目默认选项</button>}{!k.builtin && <button onClick={() => setEdit(k)}>编辑命令与参数</button>}{!k.builtin && <button className="danger" onClick={() => {
          if (confirm('移除此自定义内核配置？')) void run('kernels.remove', {
            id: k.id
          });
        }}><Trash2 size={16} />移除</button>}</div></div>)}{preferences&&<Sheet title="内核继承默认" onClose={()=>setPreferences('')}><KernelPreferences kernelId={preferences}/></Sheet>}{edit && <Sheet title="内核配置" onClose={() => setEdit(undefined)}>{['id', 'name', 'command'].map(k => <label className="field" key={k}>{{
          id: '内核标识',
          name: '名称',
          command: '电脑可执行命令'
        }[k]}<input value={String(edit[k] ?? '')} onChange={e => setEdit(v => ({
          ...v,
          [k]: e.target.value
        }))} /></label>)}<label className="field">参数（每行一个）<textarea rows={7} value={list<string>(edit.args).join('\n')} onChange={e => setEdit(v => ({
          ...v,
          args: e.target.value.split('\n')
        }))} /></label><Notice text={error} /><button className="primary full" disabled={busy} onClick={() => void run('kernels.save', {
        id: edit.id,
        name: edit.name,
        command: edit.command,
        args: list<string>(edit.args).filter(Boolean),
        enabled: true
      }).then(saved => {
        if (saved) setEdit(undefined);
      })}>保存到电脑</button></Sheet>}{install && <Sheet title="电脑安装进度" onClose={() => setInstall(undefined)}><p>{{installing:'正在安装 CLI 和适配器',verifying:'正在验证真实 ACP 会话',succeeded:'安装完成并已启用',failed:'安装未完成',cancelled:'已取消'}[String(install.phase)]??String(install.phase)}</p>{!!install.error&&<Notice text={String(install.error)}/>}<p className="muted">程序安装与账号登录分别检查；需要厂商账号时会明确提示。</p><pre className="tool-output">{String(install.output ?? install.error ?? '等待电脑响应…')}</pre>{['installing', 'verifying'].includes(String(install.phase)) && <button onClick={() => void control('kernels.cancel-install', {
        id: install.id
      }).then(setInstall)}>取消安装</button>}</Sheet>}</>;
}
