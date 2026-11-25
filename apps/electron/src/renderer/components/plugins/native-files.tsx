import { pluginClient } from '@/lib/third-party/paseo-client/runtime';
import { matchesPluginFile } from './placement-policy';
import * as React from 'react';
import { useAtomValue } from 'jotai';
import { agentSessionsAtom } from '@/atoms/agent-atoms';
import { usePlugins, PluginComponent } from './native-registry';
import type { Installation } from './native-registry';
import { Button } from '@/components/ui/button';
interface Bytes {
  base64: string;
  size: number;
  modifiedAt: number;
  digest: string;
}
export function PluginFileChoices({
  path,
  sessionId,
  fallback,
  readOnly = false
}: {
  path: string;
  sessionId: string;
  readOnly?: boolean;
  fallback: React.ReactNode;
}): React.ReactElement {
  const plugins = usePlugins(),
    session = useAtomValue(agentSessionsAtom).find(s => s.id === sessionId),
    [active, setActive] = React.useState(''),
    [state, setState] = React.useState<unknown>(),
    [modified, setModified] = React.useState(false);
  const choices = plugins.filter(p => p.entry.access?.workspaceIds.includes(session?.workspaceId ?? '')).flatMap(p => p.filePanels.filter(row => row.files && matchesPluginFile(path, row.files)).map(row => ({
    p,
    row,
    key: p.id + '/' + row.id
  })));
  const writeModified = React.useCallback((value: boolean) => setModified(value), []);
  const choice = choices.find(c => c.key === active),
    file = React.useMemo(() => choice ? fileHandle(choice.p, path, sessionId, readOnly) : null, [choice?.key, path, sessionId, readOnly]);
  React.useEffect(() => () => file?.dispose(), [file]);
  React.useEffect(() => {
    setState(undefined);
    setModified(false);
  }, [path, sessionId]);
  if (!choices.length) return <>{fallback}</>;
  return <div className="flex h-full min-h-0 flex-col"><div className="flex shrink-0 gap-1 border-b border-border p-1.5"><Button variant={active ? 'ghost' : 'secondary'} size="sm" onClick={() => {
        if (!modified || confirm('文件有未保存更改，仍切换查看器？')) setActive('');
      }}>默认查看器</Button>{choices.map(c => <Button variant={active === c.key ? 'secondary' : 'ghost'} size="sm" key={c.key} onClick={() => {
        if (!modified || confirm('文件有未保存更改，仍切换查看器？')) setActive(c.key);
      }}>{c.row.title}</Button>)}</div><div className="flex-1 min-h-0">{choice && file ? <PluginComponent installation={choice.p} row={choice.row} props={{
        workspaceId: session?.workspaceId,
        file,
        params: {
          path
        },
        tab: {
          state,
          setState,
          setModified: writeModified
        },
        revision: 0
      }} /> : fallback}</div></div>;
}
function fileHandle(p: Installation, path: string, sessionId: string, readOnly: boolean) {
  let bytes: Bytes | undefined,
    lastReadDigest: string | undefined,
    observedDigest: string | undefined,
    url = '',
    disposed = false,
    deleted = false;
  const listeners = new Set<(value: {
    type: string;
  }) => void>();
  const call = (method: string, input: object) => window.electronAPI.desktopPluginHostCall(p.id, method, {
    id: sessionId,
    path,
    ...input
  });
  const mapError = (error: unknown): never => {
    const text = String(error);
    if (text.includes('PluginFileConflictError')) throw new pluginClient.PluginFileConflictError();
    if (text.includes('ENOENT') || text.includes('PluginFileDeletedError')) throw new pluginClient.PluginFileDeletedError();
    throw error;
  };
  const read = async () => {
    try {
      bytes = (await call('file.read', {})) as Bytes;
      lastReadDigest = bytes.digest;
      observedDigest = bytes.digest;
      deleted = false;
      return Uint8Array.from(atob(bytes.base64), c => c.charCodeAt(0));
    } catch (error) {
      return mapError(error);
    }
  };
  const timer = setInterval(() => {
    if (!listeners.size || disposed) return;
    void call('file.read', {}).then(raw => {
      if (disposed) return;
      const value = raw as Bytes;
      bytes = value;
      deleted = false;
      if (observedDigest && observedDigest !== value.digest) {
        observedDigest = value.digest;
        for (const fn of listeners) fn({
          type: 'changed'
        });
      } else observedDigest = value.digest;
    }, error => {
      if (!deleted && String(error).includes('ENOENT')) {
        deleted = true;
        for (const fn of listeners) fn({
          type: 'deleted'
        });
      }
    });
  }, 1500);
  const write = async (input: object) => {
    if (readOnly) throw Error('此文件以只读方式打开');
    try {
      await call('file.write', {
        ...input,
        expected: lastReadDigest
      });
      await read();
    } catch (error) {
      mapError(error);
    }
  };
  return {
    path,
    name: path.split(/[\\/]/).pop() ?? '',
    extension: path.split(/[\\/]/).pop()?.includes('.') ? path.split('.').pop()!.toLowerCase() : '',
    get size() {
      return bytes?.size ?? 0;
    },
    get modifiedAt() {
      return new Date(bytes?.modifiedAt ?? 0).toISOString();
    },
    mimeType: ({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',md:'text/markdown',txt:'text/plain',json:'application/json'} as Record<string,string>)[path.split('.').pop()?.toLowerCase()??'']??'application/octet-stream',
    readBytes: read,
    readText: async () => new TextDecoder('utf-8', {
      fatal: true
    }).decode(await read()).replace(/^\uFEFF/, ''),
    url: async () => {
      const value = await read();
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(new Blob([value.buffer as ArrayBuffer],{type:path.toLowerCase().endsWith('.pdf')?'application/pdf':'application/octet-stream'}));
      return url;
    },
    writeText: async (text: string, options?: {
      force?: boolean;
    }) => write({
      text,
      force: options?.force === true
    }),
    writeBytes: async (value: Uint8Array, options?: {
      force?: boolean;
    }) => {
      if (value.length > 8 * 1024 * 1024) throw Error('插件文件超过8MB');
      let binary = '';
      for (let i = 0; i < value.length; i += 8192) binary += String.fromCharCode(...value.subarray(i, i + 8192));
      await write({
        base64: btoa(binary),
        force: options?.force === true
      });
    },
    watch: (fn: (value: {
      type: string;
    }) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      clearInterval(timer);
      if (url) URL.revokeObjectURL(url);
      listeners.clear();
    }
  };
}
