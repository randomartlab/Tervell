import { randomUUID } from 'node:crypto';
import { PathBoundary } from '@proma/core/permission';
import type { DesktopPluginEntry } from '@proma/shared';
import {listAgentSessions} from '../agent-session-manager';
import { getAgentWorkspace, getProjectFilesPath } from '../agent-workspace-manager';
import { desktopCliEnvironment, resolveDesktopCommand } from '../desktop-extension-service';
type TerminalService = typeof import('../terminal-service');
interface Owner {
  pluginId: string;
  workspaceId: string;
  cwd: string;
  name: string;
  sessionId: string;
}
const owners = new Map<string, Owner>();
const row = (id: string, o: Owner) => ({
  id,
  workspaceId: o.workspaceId,
  cwd: o.cwd,
  name: o.name
});
export async function createPluginTerminal(entry: DesktopPluginEntry, input: Record<string, unknown>, service: TerminalService): Promise<unknown> {
  const workspaceId = String(input.workspaceId ?? ''),
    workspace = getAgentWorkspace(workspaceId);
  if (!workspace || !entry.access?.workspaceIds.includes(workspaceId)) throw Error('终端项目未获插件授权');
  if (entry.access.runtime !== 'trusted') throw Error('交互终端需要标准受信任插件授权');
  const root = workspace.projectRootPath ?? getProjectFilesPath(workspace.slug),
    cwd = new PathBoundary({
      cwd: root,
      attachedDirectories: []
    }, () => {}).assert(String(input.cwd ?? root), 'read'),
    sessionId = listAgentSessions().find(s=>s.workspaceId===workspaceId&&!s.archived)?.id??'plugin-' + entry.manifest.id + '-' + workspaceId;
  const command = typeof input.command === 'string' ? input.command : undefined,
    args = Array.isArray(input.args) ? input.args.map(String) : [];
  const process = command ? {
    file: resolveDesktopCommand(command) ?? command,
    args,
    env: desktopCliEnvironment(),
    title: String(input.name ?? command),
    inheritEnv: false
  } : undefined;
  const terminal = await service.openAgentTerminal({
    sessionId,
    cwd,
    agentCwd: root,
    allowedRoots: [root],
    title: String(input.name ?? '插件终端')
  }, process);
  const owner = {
    pluginId: entry.manifest.id,
    workspaceId,
    cwd,
    name: terminal.title,
    sessionId
  };
  if(input.size&&typeof input.size==='object'){const size=input.size as {rows:number;cols:number};await service.resizeTerminal({terminalId:terminal.terminalId,rows:size.rows,cols:size.cols});}
  owners.set(terminal.terminalId, owner);
  return {
    terminal: row(terminal.terminalId, owner),
    requestId: randomUUID()
  };
}
export async function pluginTerminalOperation(entry: DesktopPluginEntry, method: string, input: Record<string, unknown>, service: TerminalService): Promise<unknown> {
  if (method === 'terminals.list') return {
    terminals: [...owners].filter(([, o]) => o.pluginId === entry.manifest.id && entry.access?.workspaceIds.includes(o.workspaceId) && (!input.workspaceId || input.workspaceId === o.workspaceId) && (!input.cwd || input.workspaceId || input.cwd === o.cwd)).map(([id, o]) => row(id, o)),
    requestId: randomUUID()
  };
  const id = String(input.id ?? ''),
    owner = owners.get(id);
  if (!owner || owner.pluginId !== entry.manifest.id || !entry.access?.workspaceIds.includes(owner.workspaceId)) throw Error('终端不属于此插件授权项目');
  if (method === 'terminal.write') {
    await service.writeTerminal({
      terminalId: id,
      data: String(input.data ?? '')
    });
    return true;
  }
  if (method === 'terminal.kill') {
    service.closeAgentTerminal(owner.sessionId, id);
    owners.delete(id);
    return {
      success: true
    };
  }
  if (method === 'terminal.capture') {
    const options = input.options as {
      start?: number;
      end?: number;
      stripAnsi?: boolean;
    } | undefined;
    const {
      read
    } = service.readAgentTerminalOutput(owner.sessionId, id, {
      limit: 48000
    });
    const value=options?.stripAnsi?read.output.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,''):read.output;
    const lines = value.split(/\r?\n/);
    return {
      terminalId: id,
      lines: lines.slice(options?.start, options?.end),
      totalLines: lines.length,
      requestId: randomUUID()
    };
  }
  throw Error('未知终端操作：' + method);
}
export async function closePluginTerminals(pluginId: string): Promise<void> {
  const service = await import('../terminal-service');
  for (const [id, o] of owners) if (o.pluginId === pluginId) {
    try {
      service.closeAgentTerminal(o.sessionId, id);
    } finally {
      owners.delete(id);
    }
  }
}
