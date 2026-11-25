var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// resources/third-party/plugin-host/paseo-driver.cjs
var require_paseo_driver = __commonJS({
  "resources/third-party/plugin-host/paseo-driver.cjs"(exports) {
    "use strict";
    exports.createLocalPaseoDriver = function(call, {
      serverId = "tervell-local",
      interval = 500
    } = {}) {
      const observations = /* @__PURE__ */ new Set();
      const rawListeners = /* @__PURE__ */ new Set(), frameListeners = /* @__PURE__ */ new Set(), connectionListeners = /* @__PURE__ */ new Set();
      let routeTimer;
      const pollRoutes = () => {
        if (disposed || !rawListeners.size && !frameListeners.size) return;
        void request("hosts.route.poll").then((events) => {
          for (const event of events) {
            if (event.message) for (const fn of rawListeners) fn(event.message);
            if (event.frame) for (const fn of frameListeners) fn(event.frame);
          }
        }, (error) => {
          for (const fn of rawListeners) fn({ type: "hosts.route.error", payload: { error: String(error) } });
        }).finally(() => {
          if (!disposed && (rawListeners.size || frameListeners.size)) routeTimer = setTimeout(pollRoutes, 30);
        });
      };
      const routeSubscription = (set, fn) => {
        const empty = !rawListeners.size && !frameListeners.size;
        set.add(fn);
        if (empty) pollRoutes();
        return () => {
          set.delete(fn);
          if (!rawListeners.size && !frameListeners.size) clearTimeout(routeTimer);
        };
      };
      let disposed = false;
      const request = (name, input = {}) => {
        if (disposed) return Promise.reject(Error("\u63D2\u4EF6API\u5DF2\u91CA\u653E"));
        return Promise.resolve(call(name, input)).then((value) => {
          if (name === "hosts.list" && value?.self?.serverId) serverId = value.self.serverId;
          return value;
        });
      };
      const page = (rows) => ({
        entries: rows.map((agent2) => ({
          agent: agent2
        })),
        pageInfo: {
          hasMore: false,
          nextCursor: null
        }
      });
      const requestId = () => globalThis.crypto?.randomUUID?.() ?? "request-" + Math.random().toString(36).slice(2);
      const placement = (row) => ({ projectId: row.workspaceId ?? "", projectKey: row.workspaceId ?? "", projectName: row.cwd.split("/").pop() ?? "", projectDisplayName: row.cwd.split("/").pop() ?? "", projectRootPath: row.cwd, projectKind: "directory", checkout: { cwd: row.cwd, isGit: false, currentBranch: null, remoteUrl: null, isPaseoOwnedWorktree: false, mainRepoRoot: null, worktreeRoot: null } });
      const paginate = (rows, options = {}, agentRows = false) => {
        const filter = options.filter ?? {};
        let result = rows.filter((row) => {
          if (!(options.includeBackground || filter.includeBackground || filter.background === true) && row.background) return false;
          if (!(options.includeArchived || filter.includeArchived) && (row.archivedAt || row.archivingAt)) return false;
          if (options.workspaceId && row.workspaceId !== options.workspaceId) return false;
          if (filter.projectId && row.projectId !== filter.projectId) return false;
          if (filter.query && !JSON.stringify([row.title, row.name, row.cwd, row.projectRootPath]).toLowerCase().includes(filter.query.toLowerCase())) return false;
          if (filter.labels && !Object.entries(filter.labels).every(([k, v]) => row.labels?.[k] === v)) return false;
          if (filter.statuses && !filter.statuses.includes(row.status)) return false;
          if (filter.projectKeys && !filter.projectKeys.includes(row.workspaceId ?? row.projectId)) return false;
          if (filter.requiresAttention !== void 0 && !!row.requiresAttention !== filter.requiresAttention) return false;
          if ("thinkingOptionId" in filter && (row.thinkingOptionId ?? null) !== filter.thinkingOptionId) return false;
          return true;
        });
        const fields = { created_at: "createdAt", updated_at: "updatedAt", activity_at: "activityAt", project_id: "projectId" };
        if (options.sort?.length) result.sort((a, b) => {
          for (const sort of options.sort) {
            const key = fields[sort.key] ?? sort.key;
            const order = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
            if (order) return sort.direction === "desc" ? -order : order;
          }
          return a.id.localeCompare(b.id);
        });
        let offset = 0;
        if (options.page?.cursor) {
          const match = options.page.cursor.match(/^local-page:(\d+)$/);
          if (!match) throw Error("\u65E0\u6548\u5206\u9875\u6E38\u6807");
          offset = Number(match[1]);
        }
        const limit = options.page?.limit ?? result.length;
        const selected = result.slice(offset, offset + limit), hasMore = offset + limit < result.length;
        return { requestId: options.requestId ?? requestId(), entries: agentRows ? selected.map((agent2) => ({ agent: agent2, project: placement(agent2) })) : selected, pageInfo: { hasMore, nextCursor: hasMore ? "local-page:" + (offset + limit) : null, prevCursor: offset ? "local-page:" + Math.max(0, offset - limit) : null } };
      };
      const observe = (read, kind, options = {}) => {
        const listeners = /* @__PURE__ */ new Set();
        let value, ended = false, timer, previous = "";
        const id = "observation-" + Math.random().toString(36).slice(2);
        const updates = (before, next) => {
          if (!before) return [];
          if (kind === "agent" || kind === "workspace") {
            const key = kind === "agent" ? "agent" : "workspace", get = (x) => kind === "agent" ? x.agent : x;
            const old = new Map((before.entries ?? []).map((row) => [get(row).id, get(row)])), current = new Map((next.entries ?? []).map((row) => [get(row).id, get(row)])), result = [];
            for (const [id2, row] of current) if (JSON.stringify(old.get(id2)) !== JSON.stringify(row)) result.push({
              type: kind + "_update",
              payload: {
                kind: "upsert",
                [key]: row
              }
            });
            for (const id2 of old.keys()) if (!current.has(id2)) result.push({
              type: kind + "_update",
              payload: {
                kind: "remove",
                [kind === "agent" ? "agentId" : "id"]: id2
              }
            });
            return result;
          }
          if (kind === "hosts") return JSON.stringify(before) === JSON.stringify(next) ? [] : [{ type: "hosts.snapshot", payload: next }];
          if (kind === "events") {
            const result = [];
            if (JSON.stringify(before.providers) !== JSON.stringify(next.providers)) result.push({
              type: "providers_snapshot_update",
              payload: next.providers
            });
            if (JSON.stringify(before.projects) !== JSON.stringify(next.projects)) result.push({
              type: "project.update",
              payload: { kind: "snapshot", ...next.projects }
            });
            return result;
          }
          if (kind === "background") {
            const result = [];
            for (const [agentId, items] of Object.entries(next)) if (JSON.stringify(before[agentId]) !== JSON.stringify(items)) result.push({
              type: "agent.background_work.update",
              payload: {
                agentId,
                items
              }
            });
            return result;
          }
          return [];
        };
        const deliver = (next) => {
          if (ended) return;
          const signature = JSON.stringify(kind === "events" ? {
            ...next,
            providers: {
              ...next.providers,
              generatedAt: void 0
            }
          } : next);
          if (signature === previous) return;
          const changes = updates(value, next);
          value = {
            ...next,
            subscriptionId: id
          };
          previous = signature;
          for (const listener of listeners) {
            listener.snapshot?.(value);
            for (const message of changes) listener.update?.(message);
          }
        };
        const poll = () => {
          if (ended) return;
          Promise.resolve().then(read).then(deliver, (error) => {
            if (!ended) for (const listener of listeners) listener.error?.(error);
          }).finally(() => {
            if (!ended) timer = setTimeout(poll, interval);
          });
        };
        const release = async () => {
          if (ended) return;
          ended = true;
          clearTimeout(timer);
          options.signal?.removeEventListener("abort", abort);
          listeners.clear();
          observations.delete(handle);
        };
        const abort = () => void release();
        const ready = Promise.resolve().then(() => {
          options.signal?.throwIfAborted();
          return read();
        }).then((next) => {
          deliver(next);
          if (!ended) timer = setTimeout(poll, interval);
          return {
            ...next,
            subscriptionId: id
          };
        });
        void ready.catch(() => {
        });
        const handle = {
          get subscriptionId() {
            return ended ? null : id;
          },
          ready,
          release,
          subscribe(listener) {
            if (ended) return () => {
            };
            listeners.add(listener);
            if (value) queueMicrotask(() => {
              if (!ended && listeners.has(listener)) listener.snapshot?.(value);
            });
            return () => listeners.delete(listener);
          }
        };
        observations.add(handle);
        if (options.signal?.aborted) void release();
        else options.signal?.addEventListener("abort", abort, {
          once: true
        });
        return handle;
      };
      const agent = (id) => request("agent.get", {
        id
      });
      const driver = {
        getLastServerInfoMessage: () => ({
          serverId,
          features: {
            toolFreeAgents: true,
            workspaceTerminals: true,
            workspaceLabels: true,
            entityMetadata: true,
            pluginTimelineItems: true,
            connectedHosts: true,
            providerUsageList: true,
            providerOptionControls: true,
            explicitEventSubscriptions: true,
            ownedSubscriptions: true
          }
        }),
        ensureConnected() {
          if (disposed) throw Error("\u63D2\u4EF6API\u5DF2\u91CA\u653E");
        },
        getConnectionState: () => disposed ? "disconnected" : "connected",
        close: async () => {
          disposed = true;
          clearTimeout(routeTimer);
          for (const fn of connectionListeners) fn({ status: "disconnected" });
          rawListeners.clear();
          frameListeners.clear();
          connectionListeners.clear();
          await Promise.all([...observations].map((o) => o.release()));
        },
        fetchAgents: async (options) => paginate(await request("agents.list"), options, true),
        observeAgents(options) {
          return observe(() => driver.fetchAgents(options), "agent", options);
        },
        fetchAgent: async ({ agentId }) => {
          const row = await agent(agentId);
          return { agent: row, project: row ? placement(row) : null, error: null, requestId: requestId() };
        },
        refreshAgent: (id) => request("agent.reload", {
          id
        }),
        fetchAgentTimeline: async (id, options) => ({
          ...await request("agent.timeline", {
            id,
            options
          }),
          agent: await agent(id)
        }),
        appendAgentTimelineItem: (id, item) => request("agent.timeline.append", {
          id,
          item
        }),
        sendAgentMessage: (id, text, options) => request("agent.send", {
          id,
          text,
          options
        }),
        waitForFinish: (id, timeoutMs) => request("agent.wait", {
          id,
          timeoutMs
        }),
        setAgentOptions: (id, patch) => request("agent.options", {
          id,
          patch
        }),
        setAgentMetadata: async (id, metadata) => {
          const result = await request("agent.metadata", {
            id,
            metadata
          });
          return result.pluginMetadata ?? result.metadata ?? {};
        },
        respondToPermission: (id, requestId2, response) => request("agent.permission", {
          id,
          requestId: requestId2,
          response
        }),
        archiveAgent: (id) => request("agent.archive", {
          id
        }),
        detachAgent: (id) => request("agent.detach", {
          id
        }),
        listCommands: (input) => request("agent.commands", {
          id: input.agentId,
          requestId: input.requestId,
          draftConfig: input.draftConfig
        }),
        createAgent: (input) => request("agent.create", input),
        fetchWorkspaces: async (options) => paginate(await request("workspaces.list", options), options),
        observeWorkspaces(options) {
          return observe(() => driver.fetchWorkspaces(options), "workspace", options);
        },
        findWorkspace: (id) => request("workspace.get", {
          id
        }),
        openProject: (cwd) => request("workspace.open", {
          cwd
        }),
        createWorkspace: (input) => request("workspace.create", input),
        archiveWorkspace: (id) => request("workspace.archive", {
          id
        }),
        setWorkspaceTitle: (id, title) => request("workspace.title", {
          id,
          title
        }),
        setWorkspaceMetadata: (id, metadata) => request("workspace.metadata", {
          id,
          metadata
        }),
        setWorkspacePinned: (id, pinned) => request("workspace.pinned", {
          id,
          pinned
        }),
        setWorkspaceBaseBranch: (input) => request("workspace.base-branch", input),
        listWorkspaceLabels: () => request("workspace.labels"),
        setWorkspaceLabel: (input) => request("workspace.label", input),
        listProjects: (options) => request("projects.list", options),
        listProviderModels: (provider, options) => request("providers.models", { provider, ...options }),
        listProviderModes: (provider, options) => request("providers.modes", { provider, ...options }),
        listProviderControls: (input) => request("providers.controls", input),
        listProviderFeatures: (input) => request("providers.features", input),
        listAvailableProviders: () => request("providers.available"),
        getProvidersSnapshot: (options) => request("providers.snapshot", options),
        refreshProvidersSnapshot: (input) => request("providers.refresh", input),
        getProviderDiagnostic: (provider) => request("providers.diagnostic", {
          provider
        }),
        listProviderUsage: () => request("providers.usage"),
        getDaemonConfig: async () => ({
          requestId: requestId(),
          config: await request("config.get")
        }),
        patchDaemonConfig: async (config) => ({
          requestId: requestId(),
          config: await request("config.patch", {
            config
          })
        }),
        createTerminal: (cwd, name, requestId2, options) => request("terminal.create", {
          cwd,
          name,
          ...options
        }),
        listTerminals: (cwd, requestId2, options) => request("terminals.list", {
          cwd,
          ...options
        }),
        sendTerminalInput: (id, input) => {
          void request("terminal.write", {
            id,
            data: input.data
          }).catch((e) => console.error(e));
        },
        captureTerminal: (id, options) => request("terminal.capture", {
          id,
          options
        }),
        killTerminal: (id) => request("terminal.kill", {
          id
        }),
        listAgentBackgroundWork: (id) => request("agent.background.list", {
          id
        }),
        stopAgentBackgroundWork: (id, item) => request("agent.background.stop", {
          id,
          item
        }),
        observeAgentBackgroundWork: () => observe(async () => {
          const agents = await request("agents.list");
          return Object.fromEntries(await Promise.all(agents.map(async (a) => [a.id, await request("agent.background.list", {
            id: a.id
          })])));
        }, "background"),
        observeEvents: (events, options) => observe(() => request("events.snapshot", { events }), "events", options),
        subscribeAgentTimeline: (id, listener) => {
          const observation = observe(() => request("agent.timeline", { id, options: { limit: 0 } }), "timeline");
          let epoch, previous = /* @__PURE__ */ new Map();
          const off = observation.subscribe({ snapshot: (page2) => {
            const rows = page2.entries ?? [];
            if (epoch !== void 0 && epoch !== page2.epoch) {
              listener({ type: "agent.timeline.replacement", payload: { agentId: id, epoch: page2.epoch } });
              previous = /* @__PURE__ */ new Map();
            }
            if (epoch !== void 0) for (const row of rows) {
              const key = row.seqStart, signature = JSON.stringify(row);
              if (previous.get(key) !== signature) listener({ type: "agent_stream", payload: { agentId: id, event: { type: "timeline", provider: row.provider, item: row.item, ...row.turnId ? { turnId: row.turnId } : {} } } });
            }
            epoch = page2.epoch;
            previous = new Map(rows.map((row) => [row.seqStart, JSON.stringify(row)]));
          }, error: (error) => listener({ type: "agent.timeline.error", payload: { agentId: id, error: String(error) } }) });
          const release = observation.release.bind(observation);
          const unsubscribe = () => {
            off();
            void release();
          };
          unsubscribe.ready = observation.ready.then(() => void 0);
          unsubscribe.release = release;
          return unsubscribe;
        },
        listHosts: () => request("hosts.list"),
        observeHosts: (options) => observe(() => request("hosts.list"), "hosts", options),
        addHost: (input) => request("hosts.add", input),
        updateHost: (id, patch) => request("hosts.update", {
          id,
          patch
        }),
        removeHost: (id) => request("hosts.remove", {
          id
        }),
        requireConnectedHosts() {
          if (disposed) throw Error("\u63D2\u4EF6API\u5DF2\u91CA\u653E");
        },
        openHostRoute: (serverId2, scopeId) => request("hosts.route.open", { serverId: serverId2, scopeId }),
        cancelHostRoute: (scopeId) => {
          void request("hosts.route.close", { scopeId });
        },
        closeHostRoute: (routeId) => {
          void request("hosts.route.close", { routeId });
        },
        sendHostFrame: (routeId, data) => request("hosts.route.send", typeof data === "string" ? { routeId, data } : { routeId, base64: typeof Buffer !== "undefined" ? Buffer.from(data).toString("base64") : btoa(Array.from(data, (b) => String.fromCharCode(b)).join("")) }),
        subscribeRawMessages: (handler) => routeSubscription(rawListeners, handler),
        subscribeHostFrames: (handler) => routeSubscription(frameListeners, handler),
        supportsDrain: true,
        subscribeConnectionStatus(handler) {
          connectionListeners.add(handler);
          handler({ status: disposed ? "disconnected" : "connected" });
          return () => connectionListeners.delete(handler);
        }
      };
      return driver;
    };
  }
});

// <stdin>
var import_paseo_driver = __toESM(require_paseo_driver());
var export_createLocalPaseoDriver = import_paseo_driver.createLocalPaseoDriver;
export {
  export_createLocalPaseoDriver as createLocalPaseoDriver
};
