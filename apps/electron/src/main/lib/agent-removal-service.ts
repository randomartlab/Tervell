import { dirname } from 'node:path';
import { getAgentSessionMeta, listAgentSessions, deleteAgentSession } from './agent-session-manager';
import { getAgentWorkspace, listAgentWorkspaces, getWorkspaceAttachedFiles, getWorkspaceAttachedDirectories, deleteAgentWorkspace } from './agent-workspace-manager';
import { stopAgentAndDrain, clearAgentQueuedMessages } from './agent-service';
import { closeTerminalsForSession } from './terminal-service';
import { browserController } from './browser-controller';
import { permissionService } from './agent-permission-service';
import { askUserService } from './agent-ask-user-service';
import { exitPlanService } from './agent-exit-plan-service';
import { listAutomations, deleteAutomation } from './automation-manager';
import { broadcastChanged } from './automation-scheduler';
import { unwatchAttachedDirectory } from './workspace-watcher';
function release(path: string) {
  const retained = listAgentWorkspaces().some(w => w.projectRootPath === path || getWorkspaceAttachedDirectories(w.slug).includes(path) || getWorkspaceAttachedFiles(w.slug).some(file => dirname(file) === path)) || listAgentSessions().some(s => s.attachedDirectories?.includes(path) || s.attachedFiles?.some(file => dirname(file) === path));
  if (!retained) unwatchAttachedDirectory(path);
}
/** 桌面和手机删除共用清理顺序：先停止所有入口，再移除记录与目录。 */
export async function removeAgentSession(id: string): Promise<void> {
  const attached = getAgentSessionMeta(id)?.attachedFiles ?? [];
  await stopAgentAndDrain(id);
  permissionService.clearSessionWhitelist(id);
  permissionService.clearSessionPending(id);
  askUserService.clearSessionPending(id);
  exitPlanService.clearSessionPending(id);
  clearAgentQueuedMessages(id);
  await browserController.close(id);
  closeTerminalsForSession(id);
  deleteAgentSession(id);
  for (const path of new Set(attached.map(file => dirname(file)))) release(path);
}
export async function removeAgentWorkspace(id: string): Promise<void> {
  const workspace = getAgentWorkspace(id);
  if (!workspace) return;
  if (workspace.slug === 'default') throw Error('默认项目不能删除');
  if (listAgentWorkspaces().length <= 1) throw Error('至少需要保留一个项目');
  const sessions = listAgentSessions().filter(s => s.workspaceId === id),
    ids = sessions.map(s => s.id),
    attached = getWorkspaceAttachedFiles(workspace.slug),
    directories = getWorkspaceAttachedDirectories(workspace.slug);
  const [{
    feishuBridgeManager
  }, {
    dingtalkBridgeManager
  }, {
    wechatBridge
  }] = await Promise.all([import('./feishu-bridge-manager'), import('./dingtalk-bridge-manager'), import('./wechat-bridge')]);
  feishuBridgeManager.removeBindingsForDeletedWorkspace(id, ids);
  dingtalkBridgeManager.removeBindingsForDeletedWorkspace(id, ids);
  wechatBridge.removeBindingsForDeletedWorkspace(id, ids);
  for (const session of sessions) await removeAgentSession(session.id);
  const automations = listAutomations().filter(a => a.workspaceId === id);
  for (const automation of automations) deleteAutomation(automation.id);
  if (automations.length) broadcastChanged();
  deleteAgentWorkspace(id);
  for (const path of new Set([...attached.map(file => dirname(file)), ...directories, ...(workspace.projectRootPath ? [workspace.projectRootPath] : [])])) release(path);
}
