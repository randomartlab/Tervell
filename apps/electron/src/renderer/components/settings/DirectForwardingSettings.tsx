import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { copyTextToClipboard } from '@/lib/clipboard';
interface Target {
  id: string;
  label: string;
  hostId: string;
  url: string;
  certificateSha256: string;
}
export function DirectForwardingSettings({
  targets,
  onChange
}: {
  targets: Target[];
  onChange: () => Promise<unknown>;
}): React.ReactElement {
  const [label, setLabel] = React.useState(''),
    [code, setCode] = React.useState(''),
    [address, setAddress] = React.useState(''),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState('');
  const add = async () => {
    setBusy(true);
    setError('');
    try {
      if (!code.startsWith('tervell-direct:v1:')) throw Error('请粘贴目标电脑的直连身份');
      const source = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(code.slice('tervell-direct:v1:'.length).replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0)))) as {
        hostId: string;
        certificateSha256: string;
        candidates: Array<{
          url: string;
        }>;
      };
      const url = address.trim() || source.candidates[0]?.url;
      if (!url) throw Error('目标没有可访问地址，请补充目标 HTTPS 地址');
      await window.electronAPI.builtinFeatureCall('direct.forward.add', {
        label: label.trim() || '目标电脑',
        hostId: source.hostId,
        certificateSha256: source.certificateSha256,
        url
      });
      setCode('');
      setAddress('');
      setLabel('');
      await onChange();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">手机须分别配对中继和目标电脑。在目标复制直连身份，在此登记其 VPN / 局域网地址；手机可按目标优先此中继，两段都验证身份，失效后恢复目标原有连接。</p>{targets.map(target => <div key={target.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="text-sm font-medium">{target.label}</p><code className="break-all text-xs text-muted-foreground">{target.url}</code></div><Button variant="outline" size="sm" disabled={busy} onClick={() => {
        setBusy(true);
        void window.electronAPI.builtinFeatureCall('direct.forward.remove', {
          id: target.id
        }).then(onChange).catch(e => setError(String(e))).finally(() => setBusy(false));
      }}>移除</Button></div>)}<div className="space-y-3 rounded-lg border border-border p-3"><h4 className="text-sm font-medium">添加目标电脑</h4><Input aria-label="中继目标名称" placeholder="名称" value={label} onChange={e => setLabel(e.target.value)} /><Textarea aria-label="目标电脑身份" placeholder="粘贴目标电脑的直连身份" value={code} onChange={e => setCode(e.target.value)} /><Input aria-label="中继可访问的目标地址" placeholder="可选：中继电脑可访问的 HTTPS 地址" value={address} onChange={e => setAddress(e.target.value)} /><Button disabled={busy || !code.trim()} onClick={() => void add()}>{busy ? '保存中…' : '添加目标'}</Button></div><Button variant="outline" onClick={() => void window.electronAPI.builtinFeatureCall('direct.identity', {}).then(value => copyTextToClipboard(String(value))).catch(e => setError(String(e)))}>复制本机直连身份</Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
