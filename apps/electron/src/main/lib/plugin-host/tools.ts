import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { app } from 'electron';
import { z } from 'zod';
import type { TSchema } from 'typebox';
import type { ToolDefinition } from '@earendil-works/pi-coding-agent';
import { ToolCatalog, SessionToolServer } from '@proma/tool-bridge';
import { getAgentSessionMeta } from '../agent-session-manager';
import { executePluginTool, preparePluginSession, beginPluginTurn } from './runtime';
import type { PluginSessionContext } from './runtime';
function checkedToolResult(value: unknown): unknown {
  if (value && typeof value === 'object' && 'isError' in value && value.isError === true) throw new Error('text' in value ? String(value.text) : '插件工具返回执行失败');
  return value;
}
const name = (plugin: string, tool: string) => 'mcp__proma__plugin_' + createHash('sha256').update(plugin).digest('hex').slice(0, 8) + '_' + tool.replace(/[^a-z0-9_]/g, '_').slice(0, 38);
export async function buildPluginPiTools(context: PluginSessionContext): Promise<{
  tools: ToolDefinition[];
  appendSystemPrompt: string[];
  env: Record<string, string>;
  mcpServers: Record<string, unknown>;
}> {
  const prepared = await preparePluginSession(context);
  const tools: ToolDefinition[] = prepared.tools.map(row => ({
    name: name(row.pluginId, row.name),
    label: row.title,
    description: row.description,
    parameters: row.inputSchema as TSchema,
    async execute(_callId, args, signal) {
      if (signal?.aborted) throw new Error('插件调用取消');
      const value = checkedToolResult(await executePluginTool(row.pluginId, row.name, args, context, signal));
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(value)
        }],
        details: {
          pluginId: row.pluginId
        }
      };
    }
  }));
  await beginPluginTurn(context);
  return {
    ...prepared,
    tools
  };
}
export async function openPluginAcpTools(context: PluginSessionContext, authorize: (name: string, args: unknown, signal: AbortSignal) => Promise<boolean>): Promise<{
  config: ReturnType<SessionToolServer['config']>;
  close: () => Promise<void>;
  appendSystemPrompt: string[];
  env: Record<string, string>;
  mcpServers: Record<string, unknown>;
} | undefined> {
  const prepared = await preparePluginSession(context);
  if (!prepared.tools.length && !prepared.appendSystemPrompt.length && !Object.keys(prepared.env).length && !Object.keys(prepared.mcpServers).length) return undefined;
  const catalog = new ToolCatalog();
  for (const tool of prepared.tools) {
    catalog.register({
      name: name(tool.pluginId, tool.name),
      description: tool.description,
      kind: 'edit',
      effect: 'write'
    }, z.fromJSONSchema(tool.inputSchema), z.unknown(), async (args, execution) => checkedToolResult(await executePluginTool(tool.pluginId, tool.name, args, context, execution.signal)));
  }
  const path = [join(app.getAppPath(), 'dist', 'plugin-stdio.mjs'), join(app.getAppPath(), 'plugin-stdio.mjs'), join(process.cwd(), 'apps/electron/dist/plugin-stdio.mjs')].find(existsSync);
  if (!path) throw new Error('插件ACP工具代理缺失，请修复安装');
  const server = await SessionToolServer.open({
    context: {
      sessionId: context.id,
      workspaceId: context.workspaceId!,
      permission: {
        mode: 'ask',
        plan: false
      },
      triggeredBy: 'user'
    },
    runtime: {
      command: process.execPath,
      args: [path]
    },
    catalog,
    authorize: r => authorize(r.tool.name, r.input, r.signal),
    assertContext: () => {
      const current = getAgentSessionMeta(context.id);
      if (current?.workspaceId !== context.workspaceId || (current?.kernelId ?? 'pi') !== context.kernelId) throw new Error('插件工具上下文已变化');
    }
  });
  const config = server.config();
  config.env.push({
    name: 'ELECTRON_RUN_AS_NODE',
    value: '1'
  });
  return {
    config,
    close: () => server.close(),
    appendSystemPrompt: prepared.appendSystemPrompt,
    env: prepared.env,
    mcpServers: prepared.mcpServers
  };
}
