(function(require){const module={exports:{}};const exports=module.exports;"use strict";
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

// resources/third-party/default-features/exporter/index.server.ts
var index_server_exports = {};
__export(index_server_exports, {
  default: () => contribute
});
module.exports = __toCommonJS(index_server_exports);

// resources/third-party/default-features/exporter/shared/export.ts
var import_plugin = require("@getpaseo/plugin");
var import_zod = require("zod");
var exportOptions = import_zod.z.object({
  includeReasoning: import_zod.z.boolean().default(true),
  includeTools: import_zod.z.boolean().default(true),
  includeTimestamps: import_zod.z.boolean().default(true)
});
var exportFormat = import_zod.z.enum(["markdown", "json"]);
var exportInput = import_zod.z.object({ agentId: import_zod.z.string().min(1), options: exportOptions, format: exportFormat.default("markdown") });
var exportSession = (0, import_plugin.defineRpc)({
  name: "session.export",
  input: exportInput,
  output: import_zod.z.object({ content: import_zod.z.string(), filename: import_zod.z.string(), format: exportFormat, entryCount: import_zod.z.number(), exportedAt: import_zod.z.string() })
});
var saveExport = (0, import_plugin.defineRpc)({
  name: "session.save",
  input: exportInput.extend({
    destination: import_zod.z.enum(["exports", "session", "custom"]).default("exports"),
    directory: import_zod.z.string().trim().max(4096).optional()
  }),
  output: import_zod.z.object({ path: import_zod.z.string(), entryCount: import_zod.z.number() })
});

// resources/third-party/default-features/exporter/shared/preferences.ts
var import_plugin2 = require("@getpaseo/plugin");
var import_zod2 = require("zod");
var defaultsSchema = import_zod2.z.object({
  format: exportFormat,
  destination: import_zod2.z.enum(["exports", "session", "custom", "clipboard"]),
  directory: import_zod2.z.string().trim().max(4096),
  options: exportOptions
}).refine((value) => value.destination !== "custom" || /^(~\/|\/|[A-Za-z]:[\\/]|\\\\)/.test(value.directory), {
  message: "Custom folders must be absolute paths or start with ~/.",
  path: ["directory"]
});
var factoryDefaults = {
  format: "markdown",
  destination: "exports",
  directory: "",
  options: { includeReasoning: true, includeTools: true, includeTimestamps: true }
};
var preferences = (0, import_plugin2.defineSettings)({
  id: "export-defaults",
  scope: "host",
  version: 1,
  schema: import_zod2.z.object({
    defaults: defaultsSchema.default(factoryDefaults),
    workspaces: import_zod2.z.record(import_zod2.z.string(), defaultsSchema).default({})
  })
});

// resources/third-party/default-features/exporter/server/export.ts
var import_promises = require("node:fs/promises");
var import_node_os = require("node:os");
var import_node_path = require("node:path");
var import_node_crypto = require("node:crypto");

// resources/third-party/default-features/exporter/server/metadata.ts
function sessionMetadata(agent) {
  return {
    id: agent.id,
    title: agent.title,
    provider: agent.runtimeInfo?.provider ?? agent.provider,
    model: agent.runtimeInfo?.model ?? agent.model,
    reasoningEffort: agent.effectiveThinkingOptionId ?? agent.runtimeInfo?.thinkingOptionId ?? agent.thinkingOptionId ?? null,
    configuredProvider: agent.provider,
    configuredModel: agent.model,
    thinkingOptionId: agent.thinkingOptionId ?? null,
    effectiveThinkingOptionId: agent.effectiveThinkingOptionId ?? agent.runtimeInfo?.thinkingOptionId ?? null,
    cwd: agent.cwd,
    createdAt: agent.createdAt,
    status: agent.status
  };
}

// resources/third-party/default-features/exporter/server/history.ts
async function fetchHistory(timeline) {
  const pages = [];
  let cursor = null;
  let epoch;
  let agent = null;
  const seen = /* @__PURE__ */ new Set();
  for (; ; ) {
    const page = await timeline.refetch({
      direction: cursor ? "before" : "tail",
      ...cursor ? { cursor } : {},
      limit: 200,
      projection: "projected"
    });
    if (page.error) throw new Error(page.error);
    if (page.staleCursor || page.gap || epoch !== void 0 && (page.epoch !== epoch || page.reset)) {
      throw new Error("Conversation history changed or is incomplete. Please export again.");
    }
    epoch = page.epoch;
    agent ??= page.agent;
    pages.push(page.entries);
    if (!page.hasOlder) break;
    const next = page.startCursor;
    const key = next && `${next.epoch}:${next.seq}`;
    if (!next || !key || seen.has(key) || cursor && next.seq >= cursor.seq) {
      throw new Error("History pagination did not advance. No partial export was created.");
    }
    seen.add(key);
    cursor = next;
  }
  if (!agent) throw new Error("Session was not found on this host.");
  const entries = pages.reverse().flat();
  const unique = /* @__PURE__ */ new Map();
  for (const entry of entries) unique.set(`${entry.seqStart}:${entry.seqEnd}`, entry);
  return { agent, entries: [...unique.values()].sort((a, b) => a.seqStart - b.seqStart) };
}

// resources/third-party/default-features/exporter/server/markdown.ts
function inline(text) {
  return text.replace(/\r?\n/g, " ").replace(/[\\`*_{}\[\]<>()#!|~]/g, "\\$&");
}
function fence(value, language = "json") {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "null";
  const longest = Math.max(2, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const delimiter = "`".repeat(longest + 1);
  return `${delimiter}${language}
${text}
${delimiter}`;
}
function details(title, content) {
  return `<details>
<summary>${title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</summary>

${content}

</details>`;
}
function renderItem(item, options) {
  switch (item.type) {
    case "user_message":
      return { role: "User", body: item.text };
    case "assistant_message":
      return { role: "Assistant", body: item.text };
    case "reasoning":
      return options.includeReasoning ? { role: "Reasoning", body: details("Reasoning", item.text) } : null;
    case "tool_call": {
      if (!options.includeTools) return null;
      const { type, callId, name, status, detail, error, ...extra } = item;
      return { role: `Tool: ${inline(name)}`, body: details(`${name} \xB7 ${status}`, [
        `**Call ID:** ${inline(callId)}`,
        fence(detail),
        ...error != null ? [`**Error**

${fence(error)}`] : [],
        ...Object.keys(extra).length ? [`**Additional data**

${fence(extra)}`] : []
      ].join("\n\n")) };
    }
    case "todo":
      return { role: "Tasks", body: item.items.map((task) => `- [${task.completed || task.status === "completed" ? "x" : " "}] ${inline(task.text)}${task.status === "in_progress" ? " (in progress)" : ""}`).join("\n") };
    case "error":
      return { role: "Error", body: item.message };
    case "notification":
      return { role: `Notice (${item.level})`, body: item.message };
    case "compaction":
      return { role: "Context compaction", body: fence(item) };
    case "plugin":
      return { role: `Plugin: ${inline(item.pluginId)}`, body: details(`${item.kind} (v${item.version})`, fence(item.data)) };
    default:
      return { role: "Event", body: fence(item) };
  }
}
function renderMarkdown(agent, entries, options, exportedAt) {
  const rendered = entries.flatMap((entry) => {
    const row = renderItem(entry.item, options);
    return row ? [{ ...row, timestamp: entry.timestamp }] : [];
  });
  const header = [
    `# ${inline(agent.title || "Paseo conversation")}`,
    "",
    "| Session | Value |",
    "| --- | --- |",
    ...Object.entries({ "Agent ID": agent.id, Provider: agent.provider, Model: agent.model ?? "Not reported", "Reasoning effort": agent.reasoningEffort ?? "Not reported", "Configured provider": agent.configuredProvider ?? agent.provider, "Configured model": agent.configuredModel ?? agent.model ?? "Not reported", "Configured effort": agent.thinkingOptionId ?? "Default / not reported", Directory: agent.cwd, Created: agent.createdAt, Exported: exportedAt, Status: agent.status, "History entries": String(entries.length) }).map(([key, value]) => `| ${key} | ${inline(value)} |`),
    "",
    "> Snapshot of the history available from Paseo at export time. Active turns may be incomplete; content removed by provider retention or compaction cannot be recovered. Attachments are represented only as exposed in the timeline.",
    "",
    "Provider, model, and reasoning effort describe the session at export time. Historical model and effort changes are not exposed per message by Paseo.",
    "",
    `Export options: reasoning ${options.includeReasoning ? "included" : "omitted"}; tools ${options.includeTools ? "included" : "omitted"}; timestamps ${options.includeTimestamps ? "included" : "omitted"}.`
  ].join("\n");
  return `${header}

${rendered.length ? rendered.map((row, index) => [
    "---",
    `## ${index + 1}. ${row.role}`,
    ...options.includeTimestamps ? [`*${inline(row.timestamp)}*`] : [],
    row.body
  ].join("\n\n")).join("\n\n") : "_No conversation entries to export._"}
`;
}
function exportFilename(title, agentId, date) {
  const slug = (title || "conversation").normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "conversation";
  const id = agentId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 36) || "session";
  return `${slug}-${id}-${date.replace(/[^0-9]/g, "")}.md`;
}

// resources/third-party/default-features/exporter/server/export.ts
async function buildExport(input, { paseo }) {
  const exportedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { agent, entries } = await fetchHistory(paseo.agents.ref(input.agentId).timeline);
  const session = sessionMetadata(agent);
  const selected = entries.filter(({ item }) => (input.options.includeReasoning || item.type !== "reasoning") && (input.options.includeTools || item.type !== "tool_call"));
  const content = input.format === "json" ? JSON.stringify({
    schemaVersion: 1,
    exportedAt,
    options: input.options,
    session,
    entries: selected.map(({ timestamp, ...entry }) => input.options.includeTimestamps ? { ...entry, timestamp } : entry)
  }, null, 2) + "\n" : renderMarkdown(session, entries, input.options, exportedAt);
  return {
    result: { content, filename: exportFilename(agent.title, agent.id, exportedAt).replace(/\.md$/, input.format === "json" ? ".json" : ".md"), format: input.format, entryCount: selected.length, exportedAt },
    cwd: agent.cwd
  };
}
async function createExport(input, context) {
  return (await buildExport(input, context)).result;
}
function destinationDirectory(destination, directory, cwd, home = (0, import_node_os.homedir)()) {
  if (destination === "exports") return (0, import_node_path.join)(home, "Tervell Exports");
  if (destination === "session") return (0, import_node_path.join)(cwd, "Tervell Exports");
  const expanded = directory?.startsWith("~/") ? (0, import_node_path.join)(home, directory.slice(2)) : directory;
  if (!expanded || !(0, import_node_path.isAbsolute)(expanded)) throw new Error("Enter an absolute host folder path or a path beginning with ~/.");
  return (0, import_node_path.resolve)(expanded);
}
async function saveSession(input, context) {
  if (input.destination === "custom") destinationDirectory(input.destination, input.directory, "");
  const { result, cwd } = await buildExport(input, context);
  const directory = destinationDirectory(input.destination, input.directory, cwd);
  await (0, import_promises.mkdir)(directory, { recursive: true, mode: 448 });
  const path = (0, import_node_path.join)(directory, result.filename.replace(/\.(md|json)$/, `-${(0, import_node_crypto.randomUUID)().slice(0, 8)}.$1`));
  await (0, import_promises.writeFile)(path, result.content, { flag: "wx", mode: 384 });
  return { path, entryCount: result.entryCount };
}

// resources/third-party/default-features/exporter/index.server.ts
function contribute(server) {
  server.registerSettings(preferences);
  server.handle(exportSession, createExport);
  server.handle(saveExport, saveSession);
  return () => {
  };
}

return module.exports;})