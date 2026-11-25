import React, { useEffect, useRef, useState } from 'react';
import { control, native, plain } from './bridge';
import type { RecordValue } from './bridge';
import { Busy, Notice, Sheet } from './ui';
export function McpLogin({
  workspaceId,
  name,
  onClose,
  onChanged
}: {
  workspaceId: string;
  name: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [flow, setFlow] = useState<RecordValue>({
      state: 'preparing'
    }),
    [callback, setCallback] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const latest = useRef(flow);
  latest.current = flow;
  useEffect(() => {
    let alive = true;
    void control('mcp.oauth-start', {
      name
    }, {
      workspaceId
    }).then(r => {
      const next = plain(r.mcpSignIn);
      if (alive) setFlow(next);else if (next.id) void control('mcp.oauth-cancel', {
        id: next.id
      }, {
        workspaceId
      }).catch(() => {});
    }).catch(e => {
      if (alive) setError(String(e));
    });
    return () => {
      alive = false;
      const row = latest.current;
      if (row.id && !['done', 'failed'].includes(String(row.state))) void control('mcp.oauth-cancel', {
        id: row.id
      }, {
        workspaceId
      }).catch(() => {});
    };
  }, [workspaceId, name]);
  useEffect(() => {
    if (!flow.id || ['done', 'failed'].includes(String(flow.state))) return;
    let alive = true,
      inFlight = false;
    const timer = setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      void control('mcp.oauth-status', {
        id: flow.id
      }, {
        workspaceId
      }).then(r => {
        if (alive) {
          const next = plain(r.mcpSignIn);
          setFlow(next);
          if (next.state === 'done') onChanged();
        }
      }).catch(e => {
        if (alive) setError(String(e));
      }).finally(() => {
        inFlight = false;
      });
    }, 1300);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [flow.id, flow.state]);
  return <Sheet title={'MCP 账号授权 · ' + name} onClose={onClose}><Notice text={error} /><p>{flow.state === 'done' ? '已授权并保存到电脑' : flow.state === 'failed' ? '授权未完成，可关闭后重试' : flow.state === 'waiting' ? '等待供应商授权' : '电脑正在准备授权…'}</p>{flow.state === 'preparing' && <Busy />}{typeof flow.url === 'string' && /^https?:\/\//.test(flow.url) && <button className="primary full" onClick={() => void native('external', {
      url: flow.url
    })}>在手机浏览器打开授权页</button>}{flow.state === 'waiting' && <><p className="muted">完成后，将浏览器最终无法打开的回调地址复制回来。电脑会校验本次 state 与地址；凭据只保存在电脑。</p><label className="field">完整回调地址<textarea rows={4} value={callback} onChange={e => setCallback(e.target.value)} autoComplete="off" /></label><button className="primary full" disabled={busy || !callback.trim()} onClick={() => {
        setBusy(true);
        void control('mcp.oauth-callback', {
          id: flow.id,
          url: callback.trim()
        }, {
          workspaceId
        }).then(r => {
          setFlow(plain(r.mcpSignIn));
          setCallback('');
        }).catch(e => setError(String(e))).finally(() => setBusy(false));
      }}>提交授权回调</button></>}{flow.state === 'done' && <button onClick={onClose}>完成</button>}</Sheet>;
}
