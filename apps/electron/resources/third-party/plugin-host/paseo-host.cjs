const fs = require('node:fs'),
  path = require('node:path'),
  {
    randomUUID
  } = require('node:crypto');
const core = require('./paseo-core.cjs'),
  {
    createPaseoApi
  } = require('./paseo-api.cjs'),
  {
    createLocalPaseoDriver
  } = require('./paseo-driver.cjs');
exports.createPaseoHost = function (descriptor, host, diagnostic) {
  const driver = createLocalPaseoDriver(host),
    paseo = createPaseoApi(driver),
    pendingHooks = new Map(),
    notifications = new Set(),
    rpc = new Map(),
    subscriptionRows = new Map(),
    providers = new Map(),
    usage = new Map(),
    connections = new Map();
  const tools = new core.PluginAgentTools();
  let alive = true,
    cleanup;
  const hooks = new core.PluginHookHandlers(() => {}, tools);
  const directory = path.join(descriptor.dataDir, 'settings');
  fs.mkdirSync(directory, {
    recursive: true
  });
  // 旧版Tervell信封迁入上游存储，保留旧文件，后续 revision 使用内容摘要。
  for (const name of fs.readdirSync(descriptor.dataDir).filter(n => /^settings-[a-z][a-z0-9_-]*\.json$/.test(n))) {
    const target = path.join(directory, name.slice(9));
    if (fs.existsSync(target)) continue;
    const saved = JSON.parse(fs.readFileSync(path.join(descriptor.dataDir, name), 'utf8'));
    const tmp = target + '.' + randomUUID() + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify({
        version: saved.version,
        values: saved.values
      }), {
        mode: 0o600,
        flag: 'wx'
      });
      fs.renameSync(tmp, target);
    } finally {
      try {
        fs.unlinkSync(tmp);
      } catch {}
    }
  }
  const store = new core.PluginSettingsStore(directory, () => {});
  const subscriptions = new core.PluginSubscriptionHandlers({
    send: message => {
      const row = subscriptionRows.get(message.subscriptionId ?? message.requestId);
      if (!row) return;
      if (message.type === 'result') row.resolve();else if (message.type === 'error') {
        row.error = message.error;
        row.closed = true;
        row.reject(Error(message.error));
      } else if (message.type === 'subscription.event') {
        if (row.events.length >= 128) {
          row.closed = true;
          row.error = '订阅消费者过慢';
          subscriptions.release(message.subscriptionId);
        } else row.events.push(message.event);
      } else if (message.type === 'subscription.closed') {
        row.closed = true;
        row.error = message.error;
      }
    },
    sendAndWait: async message => {
      const row = subscriptionRows.get(message.subscriptionId);
      if (row) {
        if (row.events.length >= 128) throw Error('订阅消费者过慢');
        row.events.push(message.event);
      }
    }
  });
  const register = (contract, handler) => {
    if (rpc.has(contract.name) || subscriptions.has(contract.name)) throw Error('重复插件RPC：' + contract.name);
    if (contract.event) subscriptions.register(contract, handler);else rpc.set(contract.name, {
      contract,
      handler
    });
  };
  const server = {
    addHook: hooks.addHook,
    on: hooks.on,
    before: hooks.before,
    handle: register,
    registerSettings: def => {
      const h = store.register(def);
      register(h.read.contract, h.read.handle);
      register(h.write.contract, h.write.handle);
      register(h.reset.contract, h.reset.handle);
      return h.settings;
    },
    registerProvider: p => {
      if (!/^[a-z][a-z0-9._-]*$/.test(p.id) || !p.label?.trim() || typeof p.connect !== 'function' || providers.has(p.id)) throw Error('无效或重复供应商：' + p.id);
      providers.set(p.id, p);
    },
    registerUsageSource: s => {
      if (!/^[a-z][a-z0-9._-]*$/.test(s.id) || typeof s.fetch !== 'function' || typeof s.discover !== 'function' || usage.has(s.id)) throw Error('无效或重复用量来源：' + s.id);
      usage.set(s.id, s);
    }
  };
  const snapshot = () => ({
    tools: [],
    hooks: hooks.catalog(),
    rpcs: [...rpc.keys(), ...subscriptions.catalog()],
    errors: [],
    providers: [...providers.values()].map(({
      id,
      label,
      description,
      command,requiresConfiguration
    }) => ({
      id,
      label,
      description,
      command,requiresConfiguration
    })),
    usageSources: [...usage.values()].map(({
      id,
      label
    }) => ({
      id,
      label
    }))
  });
  async function event(input) {
    if (!hooks.catalog().includes(input.name)) return snapshot();
    const id = randomUUID(),
      job = hooks.invoke(id, input.name, input.payload, paseo);
    pendingHooks.set(id, job);
    notifications.add(job);
    void job.catch(e => diagnostic(input.name, String(e))).finally(() => {
      pendingHooks.delete(id);
      notifications.delete(job);
    });
    return snapshot();
  }
  const agent = context => ({
    id: context.id,
    workspaceId: context.workspaceId ?? null,
    parentAgentId: context.parentAgentId ?? null,
    provider: context.kernelId,
    cwd: context.cwd,
    title: context.title ?? null,
    background: context.background === true,
    metadata: context.metadata ?? {}
  });
  return {
    paseo,
    snapshot,
    cancel(id) {
      hooks.cancel(id);
      tools.cancel(id);
    },
    async load(entry) {
      cleanup = await entry(server);
      if (typeof cleanup !== 'function') throw Error('Paseo插件必须返回清理函数');
      return snapshot();
    },
    async dispatch(method, input) {
      if (method === 'prepare') {
        const request = {
          agentId: input.id,
          workspaceId: input.workspaceId ?? null,
          provider: input.kernelId,
          cwd: input.cwd,
          reason: input.reason ?? 'resume',
          purpose: input.purpose??'interactive',
          title: input.title ?? null,
          background: input.background===true,
          labels: input.labels ?? descriptor.config?.labels ?? {},
          metadata: input.metadata ?? {},
          appendSystemPrompt: [],
          tools: [],
          env: {},
          mcpServers: {}
        };
        const result = await hooks.invoke(input.callId ?? randomUUID(), 'agent.open.before', request, paseo);
        return {
          ...snapshot(),
          tools: result.tools,
          ...result
        };
      }
      if (method === 'execute') return tools.call(input.callId ?? randomUUID(), agent(input.context), input.name, input.args, paseo);
      if (method === 'event') return input.name ? event(input) : snapshot();
      if (method === 'rpc') {
        const r = rpc.get(input.name);
        if (!r) throw Error('插件RPC未注册：' + input.name);
        const result = await r.handler(await r.contract.input.parseAsync(input.input), {
          paseo
        });
        core.assertPluginWireValue(result, 'output');
        return result;
      }
      if (method === 'subscribe-start') {
        const id = randomUUID();
        let resolve, reject;
        const ready = new Promise((a, b) => {
          resolve = a;
          reject = b;
        });
        subscriptionRows.set(id, {
          events: [],
          closed: false,
          resolve,
          reject
        });
        subscriptions.start({
          type: 'subscribe',
          requestId: id,
          subscriptionId: id,
          method: input.name,
          input: input.input
        }, paseo);
        await ready;
        return {
          id
        };
      }
      if (method === 'subscribe-poll') {
        const row = subscriptionRows.get(input.id);
        if (!row) throw Error('订阅已释放');
        const result = {
          events: row.events.splice(0),
          closed: row.closed,
          error: row.error
        };
        if (row.closed) subscriptionRows.delete(input.id);
        return result;
      }
      if (method === 'subscribe-stop') {
        subscriptions.release(input.id);
        subscriptionRows.delete(input.id);
        return true;
      }
      if (method === 'settle') {
        await Promise.allSettled([...notifications]);
        return snapshot();
      }
      if (method === 'hook') {
        return hooks.invoke(input.callId ?? input.requestId ?? randomUUID(), input.name, input.request, paseo);
      }
      if (method === 'provider.status') {
        const p = providers.get(input.providerId);
        if (!p) throw Error('供应商不存在');
        return core.providerSdk.ProviderStatusSchema.parse(p.status ? await p.status(input.request ?? {}) : {
          available: true
        });
      }
      if (method === 'provider.connect') {
        const p = providers.get(input.providerId);
        if (!p) throw Error('供应商不存在');
        const c = await p.connect(input.request);
        const events = [];
        const off = c.onEvent(e => events.push(core.providerSdk.ProviderEventSchema.parse(e)));
        connections.set(input.connectionId, {
          c,
          events,
          off
        });
        return {
          version: c.version,
          capabilities: c.capabilities
        };
      }
      if (method === 'provider.send') {
        const c = connections.get(input.connectionId);
        if (!c) throw Error('供应商连接已关闭');
        return c.c.send(core.providerSdk.ProviderInputSchema.parse(input.input));
      }
      if (method === 'provider.poll') {
        const c = connections.get(input.connectionId);
        if (!c) throw Error('供应商连接已关闭');
        return c.events.splice(0);
      }
      if (method === 'provider.close') {
        const c = connections.get(input.connectionId);
        if (c) {
          c.off();
          await c.c.close();
          connections.delete(input.connectionId);
        }
        return true;
      }
      if (method === 'usage.discover') {
        const s = usage.get(input.sourceId);
        if (!s) throw Error('用量来源不存在');
        return s.discover(input.scope);
      }
      if (method === 'usage.fetch') {
        const s = usage.get(input.sourceId);
        if (!s) throw Error('用量来源不存在');
        return s.fetch(await s.input.parseAsync(input.input));
      }
      if (method === 'snapshot') return snapshot();
      if (method === 'dispose') {
        if (!alive) return;
        alive = false;
        hooks.close();
        tools.close();
        subscriptions.releaseAll();
        for (const c of connections.values()) {
          c.off();
          await c.c.close();
        }
        await cleanup?.();
        await paseo.dispose();
        await driver.close();
        return true;
      }
      throw Error('未知Paseo宿主操作：' + method);
    }
  };
};
