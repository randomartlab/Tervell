"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// resources/third-party/paseo-server/lifecycle.ts
var lifecycle_exports = {};
__export(lifecycle_exports, {
  createLifecycleRegistration: () => createLifecycleRegistration,
  pluginHookRegistry: () => pluginHookRegistry
});
module.exports = __toCommonJS(lifecycle_exports);
var pluginHookRegistry = {
  "workspace.create.before": { waits: true },
  "workspace.create.after": { waits: false },
  "workspace.archive.after": { waits: false },
  "worktree.create.before": { waits: true },
  "worktree.create.after": { waits: true },
  "agent.create.before": { waits: true },
  "agent.create.after": { waits: false },
  "agent.open.before": { waits: true },
  "agent.close.after": { waits: false },
  "agent.archive.after": { waits: false },
  "agent.turn.before": { waits: false },
  "agent.turn.after": { waits: false },
  "agent.permission.before": { waits: false },
  "agent.permission.after": { waits: false }
};
var legacyEvents = {
  "workspace.created": "workspace.create.after",
  "workspace.archived": "workspace.archive.after",
  "agent.created": "agent.create.after",
  "agent.closed": "agent.close.after",
  "agent.archived": "agent.archive.after",
  "agent.turn_started": "agent.turn.before",
  "agent.turn_ended": "agent.turn.after",
  "agent.permission_requested": "agent.permission.before",
  "agent.permission_resolved": "agent.permission.after"
};
var legacyRequests = {
  "workspace.create": "workspace.create.before",
  "agent.create": "agent.create.before",
  "agent.session_open": "agent.open.before"
};
function createLifecycleRegistration(register) {
  const names = new Set(Object.keys(pluginHookRegistry));
  return {
    addHook(name, handler) {
      if (!names.has(name)) throw new Error(`Unknown lifecycle hook: ${name}`);
      return register(name, handler);
    },
    on(name, handler) {
      if (!Object.hasOwn(legacyEvents, name)) throw new Error(`Unknown lifecycle event: ${name}`);
      return register(legacyEvents[name], handler);
    },
    before(name, handler) {
      if (!Object.hasOwn(legacyRequests, name)) throw new Error(`Unknown before hook: ${name}`);
      return register(legacyRequests[name], handler);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createLifecycleRegistration,
  pluginHookRegistry
});
