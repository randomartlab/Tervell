import type { DesktopPluginEntry, SDKMessage } from '@proma/shared';
import { assertPluginSession } from './plugin-host/security';
import { pluginTimelinePage } from './plugin-host/timeline';
import { listAgentSessions, getAgentSessionMeta, getAgentSessionSDKMessages, getAgentSessionUsageSummary, updateAgentSessionMeta, deleteAgentSession } from './agent-session-manager';
import { getAgentWorkspace, listAgentWorkspaces, updateAgentWorkspace } from './agent-workspace-manager';
import { builtinFeatureDefinitions } from './builtin-features';
import {getAgentSessionMessagesPath}from'./config-paths';
import {readBuiltinSubagents}from'./builtin-subagents';
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
export async function builtinHostOperation(entry: DesktopPluginEntry, input: Record<string, unknown>, project: (id: string) => Record<string, unknown>): Promise<unknown> {
  if (!builtinFeatureDefinitions().some(f => f.id === entry.manifest.id)) throw Error('此接口仅供应用内置功能使用');
  const method = String(input.method),
    id = String(input.agentId ?? '');
  if (method === 'features') return builtinFeatureDefinitions().map(f => ({
    id: f.id,
    installation: {
      identity: {
        kind: 'directory'
      }
    }
  }));
  if (method === 'agents') {
    const options = record(input.options),
      page = record(options.page),
      limit = typeof page.limit === 'number' ? Math.min(Math.max(page.limit, 1), 200) : 200;
    const start = typeof page.cursor === 'string' && /^\d+$/.test(page.cursor) ? Number(page.cursor) : 0;
    const all = listAgentSessions().filter(s => entry.access?.workspaceIds.includes(s.workspaceId ?? ''));
    return {
      entries: all.slice(start, start + limit).map(s => ({
        agent: project(s.id)
      })),
      pageInfo: {
        nextCursor: start + limit < all.length ? String(start + limit) : null,
        hasMore: start + limit < all.length
      }
    };
  }
  if (method === 'labels') return {
    labels: [...new Set(listAgentWorkspaces().filter(w => entry.access?.workspaceIds.includes(w.id)).flatMap(w => w.pluginLabels ?? []))].map(name => ({
      name,
      color: 'gray'
    }))
  };
  if (method === 'workspace.recovery' || method === 'workspace.restore') {
    const w = getAgentWorkspace(String(input.workspaceId));
    if (!w || !entry.access?.workspaceIds.includes(w.id)) throw Error('项目不存在');
    if (method.endsWith('recovery')) return w.pluginArchivedAt ? {
      kind: 'recoverable',
      action: 'unarchive'
    } : {
      kind: 'unavailable',
      message: '项目未归档'
    };
    await updateAgentWorkspace(w.id, {
      name: w.name,
      pluginArchivedAt: null
    });
    return;
  }
  if (method === 'project.icon') {
    if (!entry.access?.workspaceIds.includes(String(input.projectId))) throw Error('项目不存在');
    return {
      icon: null
    }; // Tervell 当前项目记录没有上传图标。
  }
  if (method === 'cli') {
    const args = Array.isArray(input.args) ? input.args.map(String) : [],
      agentId = args[2] ?? '';
    if (args[0] !== 'agent' || !['stop', 'inspect', 'reload'].includes(args[1] ?? '')) throw Error('不支持的会话命令');
    assertPluginSession(entry, agentId);
    if (args[1] === 'inspect') return {
      stdout: JSON.stringify({
        Archived: getAgentSessionMeta(agentId)!.archived === true
      })
    };
    if (args[1] === 'reload') {
      updateAgentSessionMeta(agentId, {
        archived: false,
        kernelHistoryRefresh: true
      });
      return {
        stdout: '{}'
      };
    }
    const {
      stopAgentAndDrain
    } = await import('./agent-service');
    await stopAgentAndDrain(agentId);
    updateAgentSessionMeta(agentId, {
      stoppedByUser: true
    });
    return {
      stdout: JSON.stringify({
        stoppedCount: 1,
        agentIds: [agentId]
      })
    };
  }
  if (method === 'subagents' || method === 'subagent.timeline') {
    const parentId = String(input.parentAgentId);
    assertPluginSession(entry, parentId);
    if(method==='subagents')return {subagents:readBuiltinSubagents(getAgentSessionMessagesPath(parentId),parentId,getAgentSessionMeta(parentId)?.kernelId??'pi')};
    const messages = getAgentSessionSDKMessages(parentId);
    const childId = String(input.subagentId),
      owner = messages.filter(m => record(m).task_id === childId).map(m => record(m).tool_use_id).find(v => typeof v === 'string');
    const selected = messages.filter(m => record(m).parent_tool_use_id === owner && owner !== undefined);
    if (!selected.length) throw Error('当前内核没有保存此子任务的独立转录');
    const page = pluginTimelinePage(selected as SDKMessage[], record(input.options));
    return {
      ...page,
      rows: page.entries
    };
  }
  if (method === 'tokens') {
    assertPluginSession(entry, id);
    const {total,cached,observed} = getAgentSessionUsageSummary(id);
    return observed ? {
      total,
      cached
    } : null;
  }
  if (method === 'read') {
    const ids = Array.isArray(input.agentIds) ? input.agentIds.map(String) : [];
    for (const key of ids) assertPluginSession(entry, key);
    for (const key of ids) updateAgentSessionMeta(key, {
      completedButUnconfirmed: false
    });
    return;
  }
  if (!getAgentSessionMeta(id)) return method === 'agent' ? null : Promise.reject(Error('会话不存在'));
  assertPluginSession(entry, id);
  if (method === 'agent') return {
    agent: project(id)
  };
  if (method === 'rename') {
    const name = String(record(input.updates).name ?? '').trim();
    if (!name || name.length > 100) throw Error('标题无效');
    updateAgentSessionMeta(id, {
      title: name
    });
    return;
  }
  if (method === 'unread') {
    updateAgentSessionMeta(id, {
      completedButUnconfirmed: true
    });
    return;
  }
  if (method === 'delete') {
    const {
      stopAgentAndDrain
    } = await import('./agent-service');
    await stopAgentAndDrain(id);
    deleteAgentSession(id);
    return;
  }
  throw Error('未知内置宿主操作：' + method);
}
