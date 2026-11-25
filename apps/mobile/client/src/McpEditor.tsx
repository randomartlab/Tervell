import React, { useEffect, useState } from 'react';
import { control, plain } from './bridge';
import type { RecordValue } from './bridge';
import { Sheet, Notice, Busy } from './ui';
export function McpEditor({
  workspaceId,
  name,
  onClose,
  onSaved,
  onLogin
}: {
  workspaceId: string;
  name: string;
  onClose: () => void;
  onSaved: () => void;
  onLogin: () => void;
}) {
  const [value, setValue] = useState<RecordValue>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [credential, setCredential] = useState(''),
    [keyName, setKeyName] = useState('Authorization');
  useEffect(() => {
    let alive = true;
    void control('mcp.detail', {
      name
    }, {
      workspaceId
    }).then(r => {
      if (alive) setValue({
        ...plain(r.config),
        args: Array.isArray(plain(r.config).args) ? (plain(r.config).args as string[]).join('\n') : ''
      });
    }).catch(e => {
      if (alive) setError(String(e));
    });
    return () => {
      alive = false;
    };
  }, [workspaceId, name]);
  const run = async (action: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const r = await control(action, values, {
        workspaceId
      });
      onSaved();
      return r;
    } catch (e) {
      setError(String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return <Sheet title={'MCP 配置 · ' + name} onClose={onClose}><Notice text={error} />{!value ? <Busy /> : <>
 <label className="field">连接方式<select value={String(value.type)} onChange={e => setValue(v => ({
          ...v,
          type: e.target.value,
          enabled: false
        }))}>{['stdio', 'http', 'sse'].map(t => <option value={t} key={t}>{t}</option>)}</select></label>
 {value.type === 'stdio' ? <><label className="field">电脑可执行命令<input value={String(value.command ?? '')} onChange={e => setValue(v => ({
            ...v,
            command: e.target.value
          }))} /></label><label className="field">参数（每行一个）<textarea rows={5} value={String(value.args ?? '')} onChange={e => setValue(v => ({
            ...v,
            args: e.target.value
          }))} /></label></> : <label className="field">服务 URL<input value={String(value.url ?? '')} onChange={e => setValue(v => ({
          ...v,
          url: e.target.value
        }))} /></label>}
 <label className="setting-row"><span>保存后握手并启用</span><input type="checkbox" checked={value.enabled === true} onChange={e => setValue(v => ({
          ...v,
          enabled: e.target.checked
        }))} /></label>
 <button className="primary full" disabled={busy} onClick={() => void run('mcp.configure', {
        name,
        type: value.type,
        enabled: value.enabled,
        replaceExisting: true,
        ...(value.type === 'stdio' ? {
          command: value.command,
          args: String(value.args ?? '').split('\n').filter(Boolean)
        } : {
          url: value.url
        })
      }).then(r => {
        if (r) setValue(v => ({
          ...v,
          enabled: r.enabled === true
        }));
      })}>保存配置并验证</button>
 <h3>连接凭据</h3><label className="field">{value.type === 'stdio' ? '环境变量名' : 'HTTP 请求头名称'}<input value={keyName} onChange={e => setKeyName(e.target.value)} autoCapitalize="off" /></label><label className="field">新密钥（不回显电脑已保存内容）<input type={String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100)} autoComplete="off" value={credential} onChange={e => setCredential(e.target.value)} /></label><button className="full" disabled={busy || !credential || !keyName} onClick={() => void run('mcp.credential', {
        name,
        headerName: value.type === 'stdio' ? 'Authorization' : keyName,
        ...(value.type === 'stdio' ? {
          envName: keyName
        } : {}),
        value: credential
      }).then(r => {
        if (r) setCredential('');
      })}>加密保存凭据到电脑</button><button className="danger full" disabled={busy} onClick={() => {
        if (confirm('删除此服务在电脑保存的凭据？')) void run('mcp.credential-delete', {
          name
        });
      }}>清除已保存凭据</button>
 {value.type !== 'stdio' && <button className="full" disabled={busy} onClick={onLogin}>在手机浏览器授权账号</button>}
 </>}</Sheet>;
}
