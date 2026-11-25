import * as React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { agentWorkspacesAtom, currentAgentWorkspaceIdAtom } from '@/atoms/agent-atoms';
import { usePlugins, PluginComponent, pluginText } from './native-registry';
import { pluginHost } from '@/lib/third-party/paseo-client/runtime';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
/** 上游addNewWorkspaceItem挂载到真实的项目创建表单，共享同一份创建草稿。 */
export function PluginWorkspaceCreation(): React.ReactElement | null {
  const setWorkspaces = useSetAtom(agentWorkspacesAtom),
    plugins = usePlugins(),
    workspaces = useAtomValue(agentWorkspacesAtom),
    currentId = useAtomValue(currentAgentWorkspaceIdAtom);
  const [open, setOpen] = React.useState(false),
    [projectId, setProjectId] = React.useState(currentId ?? ''),
    [name, setName] = React.useState(''),
    [isolation, setIsolation] = React.useState<'local' | 'worktree'>('local'),
    [baseRef, setBaseRef] = React.useState<{
      type: 'branch';
      name: string;
    } | null>(null),
    [branch, setBranch] = React.useState<string | null>(null),
    [metadata, setMetadata] = React.useState<Record<string, unknown>>({}),
    [busy, setBusy] = React.useState(false);
  const contributions = plugins.filter(p => p.entry.access?.runtime === 'trusted').flatMap(installation => installation.newWorkspaceItems.map(row => ({
      installation,
      row
    }))),
    project = workspaces.find(w => w.id === projectId);
  const draft = React.useMemo(() => ({
    host: {
      id: 'tervell-local',
      label: '本机'
    },
    project: project ? {
      id: project.id,
      name: project.name
    } : null,
    isolation,
    baseRef,
    branch,
    metadata,
    setIsolation: async (next: 'local' | 'worktree') => {
      if (!project) throw Error('请先选择来源项目');
      setIsolation(next);
    },
    setBaseRef: async (next: {
      type: 'branch';
      name: string;
    }) => {
      if (!project) throw Error('请先选择来源项目');
      setBaseRef(next);
    },
    setBranch: async (next: string | null) => setBranch(next),
    setMetadata: async (patch: Record<string, unknown>) => setMetadata(previous => {
      const next = {
        ...previous
      };
      for (const [key, value] of Object.entries(patch)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('元数据键无效');
        if (value === null) delete next[key];else next[key] = value;
      }
      return next;
    })
  }), [project, isolation, baseRef, branch, metadata]);
  if (!contributions.length) return null;
  return <><Button size="sm" variant="ghost" onClick={() => {
      setProjectId(currentId ?? workspaces[0]?.id ?? '');
      setBaseRef(null);
      setBranch(null);
      setMetadata({});
      setName('');
      setIsolation('local');
      setOpen(true);
    }}>项目创建扩展</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>创建项目</DialogTitle><DialogDescription>插件字段直接参与项目来源、分支和元数据的创建。</DialogDescription></DialogHeader><label className="text-sm">名称<input aria-label="扩展项目名称" className="mt-1 w-full rounded border bg-background p-2" value={name} onChange={e => setName(e.target.value)} /></label><label className="text-sm">来源项目<select aria-label="来源项目" value={projectId} onChange={e => {
            setProjectId(e.target.value);
            setBaseRef(null);
            setBranch(null);
            setMetadata({});
          }} className="mt-1 w-full rounded border bg-background p-2">{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label className="text-sm">隔离方式<select aria-label="隔离方式" value={isolation} onChange={e => setIsolation(e.target.value as 'local' | 'worktree')} className="ml-2 rounded border bg-background p-2"><option value="local">现有目录</option><option value="worktree">Git worktree</option></select></label>{isolation === 'worktree' && <label className="text-sm">分支<input aria-label="工作树分支" className="mt-1 w-full rounded border bg-background p-2" value={branch ?? ''} onChange={e => setBranch(e.target.value || null)} /></label>}<pluginHost.PluginNewWorkspaceProvider key={projectId} newWorkspace={draft}>{contributions.map(({
            installation,
            row
          }) => <div key={installation.id + '/' + row.id} aria-label={pluginText(installation, row.title, row.id)}><PluginComponent installation={installation} row={row} /></div>)}</pluginHost.PluginNewWorkspaceProvider><Button disabled={busy || !project || !name.trim()} onClick={() => {
          if (!project) return;
          setBusy(true);
          void (async () => {
            const owner = contributions[0]!.installation;
            const source = (await window.electronAPI.desktopPluginHostCall(owner.id, 'workspace.get', {
              id: project.id
            })) as {
              directory: string;
            };
            return window.electronAPI.desktopPluginHostCall(owner.id, 'workspace.create', {
              title: name,
              source: isolation === 'worktree' ? {
                kind: 'worktree',
                cwd: source.directory,
                branchName: branch ?? undefined,
                refName: baseRef?.name
              } : {
                kind: 'directory',
                path: source.directory
              },
              metadata
            });
          })().then(async () => {
            setWorkspaces(await window.electronAPI.listAgentWorkspaces());
            setOpen(false);
            setName('');
            setMetadata({});
            toast.success('项目已创建');
          }).catch(error => toast.error(String(error))).finally(() => setBusy(false));
        }}>创建项目</Button></DialogContent></Dialog></>;
}
