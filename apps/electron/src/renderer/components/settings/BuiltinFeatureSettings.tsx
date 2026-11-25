import * as React from 'react';
import { DirectForwardingSettings } from './DirectForwardingSettings';
import { useAtomValue, useStore } from 'jotai';
import type { NativeDirectPreferences } from '@proma/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { annotationStateAtom, loadAnnotations, setAnnotationPreferences } from '@/components/selection/annotation-store';
export function AnnotationSettings(): React.ReactElement {
  const store = useStore(),
    state = useAtomValue(annotationStateAtom),
    [error, setError] = React.useState(''),
    [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    void loadAnnotations(store).catch(e => setError(String(e)));
  }, [store]);
  const labels = {
    chat: '聊天选区',
    file: '文件与只读代码',
    markdown: 'Markdown 预览',
    diff: 'Diff 选区',
    terminal: '终端输出'
  };
  return <section className="space-y-3 rounded-xl border border-border p-4"><h3 className="text-sm font-semibold">Codex 风格批注</h3><p className="text-sm text-muted-foreground">选中文本后添加评论，保留在目标会话草稿中。关闭来源只影响新选区，已有批注继续保留。</p>{Object.entries(labels).map(([key, label]) => <label key={key} className="flex min-h-10 items-center justify-between text-sm"><span>{label}</span><Switch aria-label={label + '批注'} checked={state.preferences[key as keyof typeof labels]} disabled={busy || !state.loaded} onCheckedChange={value => {
        setBusy(true);
        setError('');
        void setAnnotationPreferences(store, {
          ...state.preferences,
          [key]: value
        }).catch(e => setError(String(e))).finally(() => setBusy(false));
      }} /></label>)}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
interface DirectState {
  hostId: string;
  targets: Array<{
    id: string;
    label: string;
    hostId: string;
    url: string;
    certificateSha256: string;
  }>;
  preferences: NativeDirectPreferences;
  ready: boolean;
  certificateSha256: string;
  candidates: Array<{
    url: string;
    interfaceName: string;
  }>;
  error: string | null;
}
export function NativeDirectSettings(): React.ReactElement {
  const [state, setState] = React.useState<DirectState | null>(null),
    [tab, setTab] = React.useState<'connection' | 'relay' | 'settings'>('connection'),
    [custom, setCustom] = React.useState(''),
    [ignored, setIgnored] = React.useState(''),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(''),
    [reports, setReports] = React.useState<unknown[] | null>(null);
  const reload = async () => {
    const value = (await window.electronAPI.builtinFeatureCall('direct.read')) as DirectState;
    setState(value);
    return value;
  };
  React.useEffect(() => {
    let live = true;
    void reload().then(value => {
      if (live) {
        setCustom(value.preferences.customAddresses.join('\n'));
        setIgnored(value.preferences.ignoredInterfaces.join(', '));
      }
    }).catch(e => setError(String(e)));
    const timer = setInterval(() => {
      if (live) void reload().catch(() => {});
    }, 5000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);
  const save = async (preferences: NativeDirectPreferences) => {
    setBusy(true);
    setError('');
    try {
      await window.electronAPI.builtinFeatureCall('direct.write', preferences);
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <section className="rounded-xl border border-border p-4 space-y-4"><div><h3 className="text-base font-semibold">Tervell Direct</h3><p className="mt-1 text-sm text-muted-foreground">验证已配对电脑的局域网地址，前台优先直连，失败自动回到原有加密隧道。</p></div><div role="tablist" aria-label="直连管理" className="flex gap-2">{(['connection', 'relay', 'settings'] as const).map(value => <Button role="tab" aria-selected={tab === value} key={value} variant={tab === value ? 'default' : 'outline'} onClick={() => setTab(value)}>{value === 'connection' ? '连接' : value === 'relay' ? '中继' : '设置'}</Button>)}</div>{tab === 'connection' ? <><div className="flex items-center justify-between rounded-lg bg-muted p-4 text-sm"><span>手机 → 已验证局域网 → 本机</span><span role="status">{state?.ready ? '可用' : '等待远程连接开启'}</span></div><p className="text-xs text-muted-foreground">回退路径：手机 → 加密隧道 → 本机。手机端可暂停直连 60 秒。</p><div className="space-y-2">{state?.candidates.map(c => <div key={c.url} className="rounded-lg border border-border px-3 py-2 text-sm"><span>{c.interfaceName}</span><code className="ml-3 select-text text-xs">{c.url}</code></div>)}</div>{state?.certificateSha256 && <details className="text-xs text-muted-foreground"><summary>电脑身份指纹</summary><code className="block break-all py-2">{state.certificateSha256}</code></details>}<Button variant="outline" disabled={busy} onClick={() => void reload().catch(e => setError(String(e)))}>刷新状态</Button></> : tab === 'relay' ? <DirectForwardingSettings targets={state?.targets ?? []} onChange={reload} /> : state && <div className="space-y-4"><label className="flex items-center justify-between text-sm">启用自动直连<Switch checked={state.preferences.enabled} disabled={busy} onCheckedChange={enabled => void save({
          ...state.preferences,
          enabled
        })} /></label><label className="flex items-center justify-between text-sm">自动发现网卡地址<Switch checked={state.preferences.autoDiscover} disabled={busy} onCheckedChange={autoDiscover => void save({
          ...state.preferences,
          autoDiscover
        })} /></label><label className="block space-y-2 text-sm"><span>忽略的网络接口（逗号分隔）</span><Input value={ignored} onChange={e => setIgnored(e.target.value)} placeholder="例如 utun0, bridge0" /></label><label className="block space-y-2 text-sm"><span>额外 HTTPS 地址（每行一条）</span><textarea aria-label="额外直连地址" value={custom} onChange={e => setCustom(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background p-2" /></label><Button disabled={busy} onClick={() => void save({
        ...state.preferences,
        ignoredInterfaces: ignored.split(',').map(s => s.trim()).filter(Boolean),
        customAddresses: custom.split('\n').map(s => s.trim()).filter(Boolean)
      })}>保存地址设置</Button><Button variant="outline" onClick={() => void window.electronAPI.builtinFeatureCall('direct.reports', {}).then(value => setReports(value as unknown[])).catch(e => setError(String(e)))}>查看手机主动发送的诊断</Button>{reports && <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(reports, null, 2)}</pre>}</div>}{(error || state?.error) && <p role="alert" className="text-sm text-destructive">{error || state?.error}</p>}</section>;
}
