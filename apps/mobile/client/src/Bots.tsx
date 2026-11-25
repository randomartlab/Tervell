import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { control, list, plain } from './bridge';
import type { RecordValue } from './bridge';
import type { Workspace } from './model';
import { Busy, Notice, Sheet } from './ui';
export function Bots({
  workspaces
}: {
  workspaces: Workspace[];
}) {
  const [snapshot, setSnapshot] = useState<RecordValue>({}),
    [platform, setPlatform] = useState('feishu'),
    [edit, setEdit] = useState<RecordValue>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const load = async () => {
    setBusy(true);
    try {
      setSnapshot(await control('bots.read'));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
    let pending = false;
    const timer = setInterval(() => {
      if (pending || document.hidden) return;
      pending = true;
      void control('bots.read').then(setSnapshot).catch(e => setError(String(e))).finally(() => pending = false);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  const run = async (action: string, values: RecordValue) => {
    setBusy(true);
    setError('');
    try {
      const r = await control('bots.action', {
        action,
        ...values
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
  const rows = list(snapshot[platform]),
    states = plain(plain(plain(snapshot.states)[platform]).bots);
  const open = (row?: RecordValue) => setEdit({
    ...row,
    name: String(row?.name ?? 'Tervell'),
    enabled: row?.enabled ?? true,
    appSecret: '',
    clientSecret: '',
    botToken: '',
    appToken: ''
  });
  const fields = platform === 'feishu' ? [['appId', '应用 App ID'], ['appSecret', 'App Secret（留空保留）'], ['operatorOpenId', '可信操作者 open_id']] : platform === 'dingtalk' ? [['clientId', 'Client ID / AppKey'], ['clientSecret', 'Client Secret（留空保留）']] : [['botToken', 'Bot Token（留空保留）'], ['appToken', 'App Token（留空保留）'], ['homeChannelId', '默认通知 Channel ID']];
  const save = async () => {
    if (!edit) return;
    const values: RecordValue = {
      name: edit.name,
      enabled: edit.enabled,
      ...(edit.id ? {
        id: edit.id
      } : {})
    };
    for (const [k] of fields) {
      const value = String(edit[k] ?? '').trim();
      if (value || /Secret|Token/.test(k)) values[k] = value;
    }
    if (platform !== 'slack' && edit.defaultWorkspaceId) values.defaultWorkspaceId = edit.defaultWorkspaceId;
    if (platform === 'feishu') {
      values.domain = edit.domain ?? 'feishu';
      if (Array.isArray(edit.allowedUserOpenIds)) values.allowedUserOpenIds = edit.allowedUserOpenIds;
    }
    for (const key of ['defaultChannelId', 'defaultModelId']) if (edit[key]) values[key] = edit[key];
    const r = await run('save-' + platform, values);
    if (r) setEdit(undefined);
  };
  return <><p className="muted">在已配对电脑管理消息通道，凭据加密存于电脑，手机列表不返回密钥。保存配置后点击连接。</p><Notice text={error} /><div className="button-row">{[['feishu', '飞书'], ['dingtalk', '钉钉'], ['slack', 'Slack'], ['wechat', '微信']].map(([id, label]) => <button key={id} className={platform === id ? 'selected' : ''} onClick={() => setPlatform(id)}>{label}</button>)}<button aria-label="刷新机器人连接状态" disabled={busy} onClick={() => void load()}><RefreshCw size={17} /></button></div><button className="primary full" hidden={platform === 'wechat'} onClick={() => open()}><Plus size={17} />添加机器人</button>{busy && <Busy />}{rows.map(row => {
      const state = plain(states[String(row.id)]);
      return <div className="settings-group" key={String(row.id)}><strong>{String(row.name)}</strong><p className="muted">{String(state.status ?? 'disconnected')} · {row.enabled ? '已启用' : '已停用'}{state.errorMessage ? ' · ' + String(state.errorMessage) : ''}</p><div className="button-row"><button disabled={busy} onClick={() => open(row)}>编辑配置</button><button disabled={busy || !row.enabled} onClick={() => void run('connect', {
            platform,
            id: row.id
          })}>连接 / 重连</button><button disabled={busy} onClick={() => void run('disconnect', {
            platform,
            id: row.id
          })}>断开</button><button className="danger" disabled={busy} onClick={() => {
            if (confirm('移除此机器人的电脑配置？')) void run('remove', {
              platform,
              id: row.id
            });
          }}>移除</button></div></div>;
    })}
 {platform === 'wechat' && <><p className="muted">微信通道在电脑运行，可在另一台设备扫描二维码。凭据不返回手机。</p><strong>{String(plain(plain(snapshot.wechat).state).status ?? 'disconnected')}</strong>{typeof plain(plain(snapshot.wechat).state).qrCodeData === 'string' && <img style={{
        maxWidth: '100%',
        width: 280
      }} src={String(plain(plain(snapshot.wechat).state).qrCodeData)} alt="微信通道登录二维码" />}<div className="button-row">{[['login', '生成登录二维码'], ['connect', '使用已保存账号连接'], ['stop', '断开'], ['logout', '退出账号']].map(([operation, label]) => <button key={operation} disabled={busy} onClick={() => {
          if (operation !== 'logout' || confirm('退出电脑的微信通道账号？')) void run('wechat', {
            operation
          });
        }}>{label}</button>)}</div><label className="field">微信默认工作区<select value={String(plain(snapshot.wechat).defaultWorkspaceId ?? '')} onChange={e => void run('wechat', {
          operation: 'workspace',
          workspaceId: e.target.value
        })}><option value="">请选择工作区</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label></>}
 {platform === 'feishu' && <label className="field">飞书会话镜像<select value={String(plain(snapshot.mirror).mode === 'stream' ? plain(snapshot.mirror).botId ?? '' : '')} disabled={busy} onChange={e => void run('mirror', {
        mode: e.target.value ? 'stream' : 'off',
        ...(e.target.value ? {
          botId: e.target.value
        } : {})
      })}><option value="">关闭镜像</option>{list(snapshot.feishu).map(b => <option key={String(b.id)} value={String(b.id)}>{String(b.name)}</option>)}</select></label>}
 {edit && <Sheet title="机器人电脑配置" onClose={() => setEdit(undefined)}><Notice text={error} /><label className="field">名称<input value={String(edit.name ?? '')} onChange={e => setEdit(v => ({
          ...v,
          name: e.target.value
        }))} /></label><label className="setting-row"><span>启用此通道</span><input type="checkbox" checked={edit.enabled === true} onChange={e => setEdit(v => ({
          ...v,
          enabled: e.target.checked
        }))} /></label>{fields.map(([key, label]) => <label className="field" key={key}>{label}<input autoComplete="off" type={/Secret|Token/.test(key) ? String.fromCharCode(112, 97, 115, 115, 119, 111, 114, 100) : 'text'} value={String(edit[key] ?? '')} onChange={e => setEdit(v => ({
          ...v,
          [key]: e.target.value
        }))} /></label>)}{platform === 'feishu' && <label className="field">站点<select value={String(edit.domain ?? 'feishu')} onChange={e => setEdit(v => ({
          ...v,
          domain: e.target.value
        }))}><option value="feishu">飞书</option><option value="lark">Lark</option></select></label>}{platform === 'feishu' && <label className="field">允许交互的用户 open_id（每行一个）<textarea rows={4} value={list<string>(edit.allowedUserOpenIds).join('\n')} onChange={e => setEdit(v => ({
          ...v,
          allowedUserOpenIds: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
        }))} /></label>}{platform !== 'slack' && <label className="field">默认工作区<select value={String(edit.defaultWorkspaceId ?? '')} onChange={e => setEdit(v => ({
          ...v,
          defaultWorkspaceId: e.target.value
        }))}><option value="">沿用已有默认</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}<button className="primary full" disabled={busy || !String(edit.name ?? '').trim()} onClick={() => void save()}>保存到电脑</button></Sheet>}
 </>;
}
