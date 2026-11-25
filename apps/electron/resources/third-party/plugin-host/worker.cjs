/* 每个已启用扩展独立进程；未实现的服务明确报错，不使用空函数伪装。 */
const wire = require('./wire.cjs');
const {
  createPaseoHost
} = require('./paseo-host.cjs');
const {
  createInterface
} = require('node:readline');
const {
  join
} = require('node:path');
const fs = require('node:fs');
const {
  randomUUID
} = require('node:crypto');
const output = process.stdout.write.bind(process.stdout);
for (const level of ['log', 'info', 'warn', 'error', 'debug']) console[level] = (...args) => {
  const message = args.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(' ');
  process.stderr.write(message + '\n');
  if (level === 'error') send({
    diagnostic: {
      hook: 'runtime',
      error: message.slice(0, 2000)
    }
  });
};
const send = v => {
  const line = wire.encode(v);
  if (Buffer.byteLength(line) > 48 * 1024 * 1024) throw Error('插件结果超过48MB');
  output(line + '\n');
};
const atomic = (file, value) => {
  const tmp = file + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(value), {
      mode: 0o600
    });
    fs.renameSync(tmp, file);
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {}
  }
};
const tools = new Map(),
  rpc = new Map(),
  sessions = new Map(),
  sessionTools = new Map(),
  pending = new Map(),
  controllers = new Map();
let entry,
  ctx,
  cleanup,
  descriptor,
  settings = {},
  current,
  serverCleanup = [],
  dshFiber,
  dshLoader,
  dshTools,
  configRevision = 0,
  paseoHost;
const routes = new Map(),
  subscriptions = new Map();
const host = (method, params) => new Promise((resolve, reject) => {
  const id = randomUUID();
  pending.set(id, {
    resolve,
    reject
  });
  send({
    hostCall: id,
    method,
    params
  });
});
const agentRef = id => ({
  send: text => host('agent.send', {
    id,
    text
  }),
  stop: () => host('agent.stop', {
    id
  }),
  get: () => host('agent.get', {
    id
  }),
  update: updates => host('agent.update', {
    id,
    updates
  }),
  timeline: {
    refetch: options => host('agent.timeline', {
      id,
      options
    }),
    append: item => host('agent.timeline.append', {
      id,
      item
    })
  }
});
const terminals = new Map();
const terminalRef = id => ({
  id,
  write: data => {
    const t = terminals.get(id);
    if (!t) throw Error('Terminal not found');
    t.child.stdin.write(data);
  },
  sendKeys: keys => {
    const t = terminals.get(id);
    if (!t) throw Error('Terminal not found');
    for (const key of keys) {
      if (key === 'C-c') t.child.kill('SIGINT');else if (key === 'Enter') t.child.stdin.write('\n');else throw Error('Unsupported terminal key ' + key);
    }
  },
  kill: async () => {
    terminals.get(id)?.child.kill();
    terminals.delete(id);
  },
  capture: async options => {
    const t = terminals.get(id);
    if (!t) throw Error('Terminal not found');
    const lines = t.output.replace(/\x1b\[[0-9;]*m/g, '').split('\n');
    return {
      lines: options?.start ? lines.slice(options.start) : lines,
      totalLines: lines.length
    };
  }
});
const workspaceRef = id => ({
  get: () => host('workspace.get', {
    id
  }),
  refresh: () => host('workspace.get', {
    id
  }),
  terminals: {
    list: async () => ({
      entries: [...terminals].filter(([, t]) => t.workspaceId === id).map(([id, t]) => ({
        id,
        name: t.name
      }))
    }),
    create: async request => {
      const w = await host('workspace.get', {
        id
      });
      const cwd = request.cwd ?? w.directory;
      if (!require('node:path').isAbsolute(cwd)) throw Error('Terminal cwd must be absolute');
      const {
        spawn
      } = require('node:child_process');
      const child = spawn('/bin/zsh', ['-f'], {
          cwd,
          env: {
            ...process.env
          },
          stdio: 'pipe'
        }),
        tid = randomUUID(),
        t = {
          child,
          workspaceId: id,
          name: request.name,
          output: ''
        };
      terminals.set(tid, t);
      for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
        t.output = (t.output + chunk.toString()).slice(-1000000);
      });
      child.on('error', error => {
        t.output += '\n' + String(error);
      });
      return terminalRef(tid);
    }
  }
});
const paseo = {
  agents: {
    ref: agentRef,
    list: async options => {
      const rows = await host('agents.list', {});
      return options ? {
        entries: rows.map(agent => ({
          agent
        })),
        pageInfo: {
          hasMore: false
        }
      } : rows;
    },
    create: request => host('agent.create', request)
  },
  projects: {
    list: () => host('projects.list', {})
  },
  terminals: {
    ref: terminalRef
  },
  workspaces: {
    ref: workspaceRef,
    list: async options => {
      const rows = await host('workspaces.list', {});
      return options ? {
        entries: rows,
        pageInfo: {
          hasMore: false
        }
      } : rows;
    }
  },
  config: {
    get: () => host('config.get', {})
  }
};
const schemaOf = value => {
  try {
    if (!value) return {
      type: 'object'
    };
    if (typeof value.toJSONSchema === 'function') return value.toJSONSchema({
      io: 'input'
    });
    const {
      z
    } = require(descriptor.zod);
    return z.toJSONSchema(value, {
      io: 'input'
    });
  } catch {
    return {
      type: 'object'
    };
  }
};
const dshDefinitions = () => dshTools ? dshTools.definitions() : [...tools.values()];
const toolRows = (selected = tools) => [...selected].map(([key, t]) => ({
  name: key,
  title: t.title ?? key,
  description: t.description ?? key,
  inputSchema: t.input ? schemaOf(t.input) : t.parameters?.type ? t.parameters : {
    type: 'object',
    properties: t.parameters ?? {}
  }
}));
const snapshot = (selected = tools) => ({
  tools: toolRows(dshTools ? new Map(dshDefinitions().map(t => [t.name, t])) : selected),
  hooks: [],
  rpcs: [...rpc.keys()],
  errors: ctx ? ctx.fiber?._error ? [String(ctx.fiber._error)] : [] : []
});
async function load(input) {
  descriptor = input;
  fs.mkdirSync(input.dataDir, {
    recursive: true
  });
  process.env.DSH_HOME = input.dataDir;
  process.env.PASEO_HOME = input.dataDir;
  if(input.builtin===true)globalThis.__tervellBuiltinHost=require('./builtin-host.cjs').createBuiltinHost(host);
  const req = require(input.serverFile);
  entry = req.default ?? req;
  if (input.ecosystem === 'paseo') {
    paseoHost = createPaseoHost(input, host, (name, error) => send({
      diagnostic: {
        hook: name,
        error
      }
    }));
    return paseoHost.load(entry);
  }
  const {
    Context
  } = require(input.cordis);
  ctx = new Context();
  const logger = (...args) => console.log(...args);
  logger.warn = console.warn;
  logger.error = console.error;
  logger.info = console.info;
  const {
      ToolsService
    } = require('./dsh-core.cjs').tools,
    {
      SystemPrompt,
      Loader
    } = require('./dsh-core.cjs');
  await ctx.plugin(SystemPrompt, {
    includeHarnessIdentity: false,
    includeRuntimeContext: false
  }).await();
  await ctx.plugin(ToolsService).await();
  dshTools = ctx.tools;
  ctx.provide('sessions', {
    get: id => sessions.get(id),
    getById: id => sessions.get(id),
    list: () => [...sessions.values()]
  });
  ctx.provide('workingDirectory', {
    get: session => session?.cwd ?? current?.cwd
  });
  ctx.provide('settings', {
    get: () => input.config ?? {},
    update: async patch => host('plugin.settings', {
      config: {
        ...input.config,
        ...patch
      }
    })
  });
  const connection = {
    browserPeer: {
      id: 'tervell-browser'
    },
    admit: () => ({
      peer: {
        id: 'tervell-browser',
        principal: {
          kind: 'owner'
        }
      }
    }),
    fetch: {
      register(def) {
        if (routes.has(def.path)) throw Error('插件HTTP路由重复');
        routes.set(def.path, def);
        return () => routes.delete(def.path);
      }
    }
  };
  ctx.provide('connection', connection);
  ctx.provide('webServer', {});
  dshLoader = new Loader(ctx, {
    baseUrl: require('node:url').pathToFileURL(input.serverFile).href
  });
  await ctx.fiber.await();
  dshLoader.builtins.entry = req.apply ? req : entry;
  const entryId = await dshLoader.create({
    name: 'cordis:entry',
    config: input.config ?? {}
  });
  await dshLoader.await();
  const fiber = dshLoader.resolve(entryId).fiber;
  dshFiber = fiber;
  await fiber.await();
  if (fiber._error) throw fiber._error;
  if (fiber.state !== 2) throw Error('插件等待宿主服务：' + JSON.stringify(req.inject ?? entry.inject ?? []));
  cleanup = () => fiber.dispose();
  return snapshot();
}
async function policy(input) {
  if (!ctx) return {
    kind: 'allow'
  };
  current = input.context;
  const agent = {
      id: current.id,
      cwd: current.cwd,
      session: {
        id: current.id,
        cwd: current.cwd
      }
    },
    exec = {
      name: input.name,
      arguments: input.args,
      agent,
      callId: randomUUID(),
      signal: input.signal
    };
  return await ctx.waterfall('tools/pre-execute', exec, async () => ({
    kind: 'allow'
  }));
}
async function execute(input) {
  const tool = dshTools ? dshTools.get(input.name) : (sessionTools.get(input.context.id) ?? tools).get(input.name);
  if (!tool) throw Error('工具未注册');
  current = input.context;
  const agent = {
    id: current.id,
    workspaceId: current.workspaceId,
    cwd: current.cwd,
    provider: current.kernelId,
    title: current.title,
    background: false,
    metadata: {},
    session: {
      id: current.id,
      cwd: current.cwd
    }
  };
  const signal = input.signal ?? new AbortController().signal;
  const args = tool.input ? await tool.input.parseAsync(input.args) : input.args;
  signal.throwIfAborted();
  const decision = await policy({
    ...input,
    signal
  });
  if (decision.kind !== 'allow') throw Error(decision.reason ?? '插件流程拒绝此工具');
  const result = await tool.execute(args, descriptor.ecosystem === 'paseo' ? {
    agent,
    paseo,
    signal
  } : {
    agent,
    scope: agent,
    session: sessions.get(agent.id),
    signal,
    callId: randomUUID(),
    toolName: tool.name,
    ctx
  });
  signal.throwIfAborted();
  return tool.output ? {
    content: await tool.output.render(args, result),
    value: result
  } : result;
}
async function prepare(input) {
  current = input;
  let request = {
    agentId: input.id,
    workspaceId: input.workspaceId,
    provider: input.kernelId,
    cwd: input.cwd,
    reason: 'resume',
    purpose: 'interactive',
    title: input.title,
    background: false,
    labels: input.labels ?? descriptor.config?.labels ?? {},
    metadata: input.metadata ?? {},
    appendSystemPrompt: [],
    tools: [],
    env: {},
    mcpServers: {}
  };
  const selected = new Map(tools);
  for (const tool of request.tools ?? []) selected.set(tool.name, tool);
  sessionTools.set(input.id, selected);
  return {
    ...snapshot(selected),
    appendSystemPrompt: request.appendSystemPrompt ?? [],
    env: request.env ?? {},
    mcpServers: request.mcpServers ?? {}
  };
}
async function event(input) {
  current = input.context ?? current;
  if (input.session) {
    sessions.set(input.session.id, {
      ...input.session,
      cwd: input.context?.cwd,
      header: {
        cwd: input.context?.cwd
      }
    });
    if (ctx) await ctx.parallel('session/event', input.session, input.event);
  }
  return snapshot();
}
const effectiveConfig = () => {
  const value = dshFiber?.effectiveConfig ?? {};
  return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, value && typeof value.get === 'function' ? value.get() : value]));
};
async function dshCall(input) {
  if (input.name === 'pluginInventory/list') return {
    ok: true,
    value: {
      entries: [{
        entryId: descriptor.pluginId,
        moduleName: descriptor.packageName,
        enabled: true,
        fiberPhase: 'active'
      }]
    }
  };
  if (input.name === 'settings.read') return {
    status: 'ready',
    writable: true,
    value: effectiveConfig(),
    user: descriptor.config,
    base: {},
    revision: configRevision
  };
  if (input.name === 'settings.write') {
    if (input.payload.revision !== configRevision) return false;
    const candidate = {
      ...descriptor.config
    };
    for (const op of input.payload.ops ?? []) {
      const key = Array.isArray(op.path) ? op.path[0] : String(op.path).replace(/^\//, '');
      if (!/^[a-zA-Z][\w-]{0,100}$/.test(key)) throw Error('插件设置仅支持本配置的顶层字段');
      if (op.op === 'set') candidate[key] = op.value;else if (op.op === 'unset') delete candidate[key];else throw Error('插件设置操作无效');
    }
    const priorTools = new Map(tools);
    tools.clear();
    sessionTools.clear();
    try {
      await dshFiber.update(candidate, true);
    } catch (error) {
      tools.clear();
      for (const [key, tool] of priorTools) tools.set(key, tool);
      throw error;
    }
    await host('plugin.settings', {
      config: candidate
    });
    descriptor.config = candidate;
    configRevision++;
    return true;
  }
  const route = routes.get(input.channel + '/' + input.name);
  if (!route) throw Error('插件未注册接口 ' + input.name);
  const response = await route.fetch(new Request('http://tervell.invalid' + route.path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      type: 'client-request',
      method: input.name,
      rpcId: randomUUID(),
      payload: input.payload
    }),
    signal: input.signal
  }));
  const envelope = await response.json();
  if (!response.ok) throw Error(JSON.stringify(envelope));
  return envelope.result;
}
async function dispatch(method, input) {
  if (paseoHost && method !== 'load') return paseoHost.dispatch(method, input);
  if (method === 'subscribe-start') {
    const r = rpc.get(input.name);
    if (!r?.contract?.event) throw Error('插件订阅未注册 ' + input.name);
    const id = randomUUID(),
      controller = new AbortController(),
      row = {
        controller,
        events: [],
        closed: false,
        error: undefined
      };
    subscriptions.set(id, row);
    const args = await r.contract.input.parseAsync(input.input);
    void Promise.resolve().then(() => r.handler(args, {
      paseo,
      signal: controller.signal,
      push: async value => {
        const parsed = await r.contract.event.parseAsync(value);
        if (row.events.length >= 128) throw Error('插件订阅消费者过慢');
        row.events.push(parsed);
      }
    })).then(() => {
      row.closed = true;
    }, error => {
      row.closed = true;
      row.error = String(error);
    });
    return {
      id
    };
  }
  if (method === 'subscribe-poll') {
    const row = subscriptions.get(input.id);
    if (!row) throw Error('插件订阅已关闭');
    const events = row.events.splice(0);
    if (row.closed) subscriptions.delete(input.id);
    return {
      events,
      closed: row.closed,
      error: row.error
    };
  }
  if (method === 'subscribe-stop') {
    const row = subscriptions.get(input.id);
    if (row) {
      row.controller.abort();
      subscriptions.delete(input.id);
    }
    return true;
  }
  if (method === 'policy') return policy(input);
  if (method === 'dsh') return dshCall(input);
  if (method === 'load') return load(input);
  if (method === 'prepare') return prepare(input);
  if (method === 'snapshot') return snapshot();
  if (method === 'execute') return execute(input);
  if (method === 'event') return event(input);
  if (method === 'rpc') {
    const r = rpc.get(input.name);
    if (!r) throw Error('插件RPC未注册 ' + input.name);
    const value = r.contract?.input ? await r.contract.input.parseAsync(input.input) : input.input;
    const result = await r.handler(value, {
      paseo,
      signal: new AbortController().signal
    });
    return r.contract?.output ? await r.contract.output.parseAsync(result) : result;
  }
  if (method === 'settle') return snapshot();
  if (method === 'dispose') {
    for (const row of subscriptions.values()) row.controller.abort();
    subscriptions.clear();
    for (const t of terminals.values()) t.child.kill();
    if (typeof cleanup === 'function') await cleanup();
    if (ctx) await ctx.fiber.dispose();
    return true;
  }
  throw Error('未知插件操作');
}
let queue = Promise.resolve();
createInterface({
  input: process.stdin
}).on('line', line => {
  if (Buffer.byteLength(line) > 48 * 1024 * 1024) process.exit(1);
  let msg;
  try {
    msg = wire.decode(line);
  } catch {
    return;
  }
  if (msg.cancel) {
    controllers.get(msg.cancel)?.abort();
    paseoHost?.cancel(msg.cancel);
    return;
  }
  if (msg.hostReply) {
    const p = pending.get(msg.hostReply);
    if (p) {
      pending.delete(msg.hostReply);
      msg.error ? p.reject(Error(msg.error)) : p.resolve(msg.value);
    }
    return;
  }
  const perform = async () => {
    const controller = new AbortController();
    controllers.set(msg.id, controller);
    try {
      const value = await dispatch(msg.method, {
        ...msg.input,
        signal: controller.signal,
        callId: msg.id
      });
      send({
        id: msg.id,
        value
      });
    } catch (error) {
      send({
        id: msg.id,
        error: String(error?.stack ?? error)
      });
    } finally {
      controllers.delete(msg.id);
    }
  };
  if (paseoHost) void perform().catch(error => console.error(String(error)));else queue = queue.then(perform).catch(error => console.error(String(error)));
});
process.stdin.once('end', () => process.exit(0));
process.on('uncaughtException', error => {
  console.error(error.stack);
  process.exit(1);
});
