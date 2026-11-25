import { z } from 'zod';
import { join, resolve, isAbsolute, dirname } from 'node:path';
import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import type { DesktopPluginEntry } from '@proma/shared';
import { getAgentSessionMeta, resolveAgentCwd } from '../agent-session-manager';
import { getAgentWorkspace } from '../agent-workspace-manager';
export const PluginAccessSchema = z.strictObject({
  workspaceIds: z.array(z.string().min(1).max(200)).max(200),
  network: z.boolean(),
  runtime:z.enum(['restricted','trusted']).optional(),
  allWorkspaces:z.boolean().optional(),
  cli: z.array(z.enum(['claude'])).max(1).optional()
}).refine(value=>!value.allWorkspaces||value.runtime==='trusted','全宿主授权需要标准受信任模式');
export function assertPluginSession(entry: DesktopPluginEntry, id: string): {
  id: string;
  workspaceId: string;
  cwd: string;
  kernelId: string;
  title: string;
} {
  const session = getAgentSessionMeta(id);
  if (!session?.workspaceId || !entry.access?.workspaceIds.includes(session.workspaceId)) throw new Error('此插件未获当前项目授权');
  const workspace = getAgentWorkspace(session.workspaceId),
    cwd = resolveAgentCwd(workspace, session.id, session.agentCwdMode, session.activeWorktree);
  if (!cwd || !isAbsolute(cwd) || realpathSync(cwd) === homedir()) throw new Error('插件需要明确的项目目录');
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    cwd: realpathSync(cwd),
    kernelId: session.kernelId ?? 'pi',
    title: session.title
  };
}
/** macOS worker在系统层限制文件、子进程与网络，第三方源码不能绕过IPC权限。 */
export function pluginSandboxProfile(input: {
  directory: string;
  resources: string;
  executable: string;
  appPath: string;
  roots: string[];
  network: boolean;
  cliRead?: string[];
  cliWrite?: string[];
}): string {
  const quote = (s: string) => JSON.stringify(realpathSync(s)),
    read = [input.directory, input.resources, input.appPath, ...[resolve(dirname(input.executable), '..', 'Frameworks')].filter(existsSync), ...['/System', '/usr/lib', '/usr/share', '/usr/bin', '/bin', '/sbin', '/dev', '/private/var/db/dyld', '/Library/Apple/System/Library', '/Library/Developer/CommandLineTools', '/Applications/Xcode.app/Contents'].filter(existsSync)];
  const rules = ['(version 1)', '(deny default)', '(allow process-exec process-fork signal sysctl-read mach-lookup ipc-posix-shm file-read-metadata)', '(allow file-read* (literal "/"))', '(allow file-write* (literal "/dev/null") (literal "/dev/tty"))', ...read.map(p => `(allow file-read* (subpath ${quote(p)}))`), `(allow file-read* (literal ${quote(input.executable)}))`, `(allow file-write* (subpath ${quote(join(input.directory, 'data'))}))`];
  for (const root of input.roots) rules.push(`(allow file-read* file-write* (subpath ${quote(root)}))`);
  for (const root of input.cliRead ?? []) rules.push(`(allow file-read* (subpath ${quote(root)}))`);
  for (const root of input.cliWrite ?? []) rules.push(`(allow file-read* file-write* (subpath ${quote(root)}))`);
  if (input.network) rules.push('(allow network*)');
  return rules.join('\n');
}
