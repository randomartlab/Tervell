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

// resources/third-party/default-features/exporter/index.client.tsx
var index_client_exports = {};
__export(index_client_exports, {
  default: () => contribute
});
module.exports = __toCommonJS(index_client_exports);

// resources/third-party/default-features/exporter/client/export-panel.tsx
var import_react = require("react");
var import_react_native = require("react-native");
var import_react_query = require("@tanstack/react-query");
var import_client = require("@getpaseo/plugin/client");
var import_ui = require("@getpaseo/plugin/client/ui");

// resources/third-party/default-features/exporter/shared/preferences.ts
var import_plugin2 = require("@getpaseo/plugin");
var import_zod2 = require("zod");

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
function resolveDefaults(values, workspaceId) {
  return values.workspaces[workspaceId] ?? values.defaults;
}

// resources/third-party/default-features/exporter/client/export-panel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ExportPopover(props) {
  if (props.context !== "agent") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.View, { style: { width: "100%", minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportForm, { ...props, context: "agent", popover: true, onOpenPreview: props.onOpenPreview }) });
}
function ExportPanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportForm, { ...props });
}
function ExportForm(props) {
  const settings = (0, import_client.useSettings)(preferences);
  if (settings.status !== "ready") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { padding: 12, gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { color: props.theme.colors.foreground }, children: settings.status === "loading" ? "Loading export defaults\u2026" : settings.error }),
    settings.status !== "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { accessibilityRole: "button", onPress: () => void settings.reload(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { color: props.theme.colors.foreground }, children: "Retry" }) })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    SessionExport,
    {
      ...props,
      initialDefaults: resolveDefaults(settings.values, props.workspaceId),
      hasWorkspaceDefaults: Object.hasOwn(settings.values.workspaces, props.workspaceId),
      saveDefaults: async (scope, draft) => {
        const values = { ...settings.values, workspaces: { ...settings.values.workspaces } };
        if (scope === "inherit") delete values.workspaces[props.workspaceId];
        else {
          const parsed = defaultsSchema.parse(draft);
          if (scope === "host") values.defaults = parsed;
          else values.workspaces[props.workspaceId] = parsed;
        }
        if (!await settings.save(values, settings.revision)) throw new Error("Defaults could not be saved. Reopen Export to load the latest settings and try again.");
        return scope === "workspace" ? "Workspace defaults saved." : scope === "host" ? "Host defaults saved. Existing workspace defaults take precedence." : "Workspace now uses host defaults. Reopen Export to apply them.";
      }
    },
    `${props.host.id}:${props.workspaceId}:${props.agentId}`
  );
}
function SessionExport({ agentId, workspaceId, theme, layout, host, initialDefaults, hasWorkspaceDefaults, saveDefaults, popover = false, onOpenPreview }) {
  const agent = (0, import_client.useAgent)(agentId, (record) => ({ title: record.title }));
  const workspace = (0, import_client.useWorkspace)(workspaceId, (record) => ({ name: record.name }));
  const [showDefaults, setShowDefaults] = (0, import_react.useState)(false);
  const savingDefaults = (0, import_react_query.useMutation)({ mutationFn: (scope) => saveDefaults(scope, { options, format, destination, directory }) });
  const generate = (0, import_client.useRpc)(exportSession);
  const save = (0, import_client.useRpc)(saveExport);
  const [options, setOptions] = (0, import_react.useState)(initialDefaults.options);
  const [format, set\u683C\u5F0F] = (0, import_react.useState)(initialDefaults.format);
  const [destination, setDestination] = (0, import_react.useState)(initialDefaults.destination);
  const [directory, setDirectory] = (0, import_react.useState)(initialDefaults.directory);
  const [browseError, setBrowseError] = (0, import_react.useState)("");
  const [raw, setRaw] = (0, import_react.useState)(false);
  const preview = (0, import_react_query.useMutation)({ mutationFn: () => generate({ agentId, options, format }) });
  const exporting = (0, import_react_query.useMutation)({ mutationFn: async () => {
    if (destination === "clipboard") {
      const result2 = await generate({ agentId, options, format });
      await (0, import_ui.copyText)(result2.content);
      return `Copied ${format === "markdown" ? "Markdown" : "JSON"} to this device\u2019s clipboard (${result2.entryCount} history entries).`;
    }
    const result = await save({ agentId, options, format, destination, ...destination === "custom" ? { directory } : {} });
    return `Saved ${result.entryCount} history entries to ${result.path}`;
  } });
  const busy = preview.isPending || exporting.isPending || savingDefaults.isPending;
  const colors = theme.colors;
  const text = { color: colors.foreground };
  const reset = () => {
    preview.reset();
    exporting.reset();
    savingDefaults.reset();
  };
  function action(label, onPress, disabled = busy, primary = false) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_react_native.Pressable,
      {
        accessibilityRole: "button",
        accessibilityLabel: label,
        accessibilityState: { disabled },
        disabled,
        onPress,
        style: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: primary ? colors.accent : colors.surface1, opacity: disabled ? 0.5 : 1 },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { color: primary ? colors.accentForeground : colors.foreground, fontSize: 13, fontWeight: "600" }, children: label })
      }
    );
  }
  const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { padding: popover ? 0 : layout.compact ? 16 : 24, gap: 12 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { accessibilityRole: "header", style: { ...text, fontSize: 18, fontWeight: "600" }, children: "\u5BFC\u51FA\u4F1A\u8BDD" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { numberOfLines: 1, style: { color: colors.foregroundMuted, fontSize: 12 }, children: agent?.title || agentId }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { ...text, fontSize: 12, fontWeight: "600" }, children: "\u683C\u5F0F" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.View, { accessibilityRole: "radiogroup", style: { flexDirection: "row", gap: 8 }, children: ["markdown", "json"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { disabled: busy, accessibilityRole: "radio", accessibilityState: { checked: format === value, disabled: busy }, onPress: () => {
      set\u683C\u5F0F(value);
      reset();
    }, style: { flex: 1, padding: 9, borderRadius: 8, backgroundColor: format === value ? colors.accent : colors.surface1 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { color: format === value ? colors.accentForeground : colors.foreground, fontSize: 13, textAlign: "center", fontWeight: "600" }, children: value === "markdown" ? "Markdown" : "JSON" }) }, value)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { ...text, fontSize: 12, fontWeight: "600" }, children: "\u4FDD\u5B58\u5230" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.View, { accessibilityRole: "radiogroup", style: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, children: [
      ["exports", "\u9ED8\u8BA4\u5BFC\u51FA\u6587\u4EF6\u5939"],
      ["session", "\u4F1A\u8BDD\u6587\u4EF6\u5939"],
      ["custom", "\u9009\u62E9\u6587\u4EF6\u5939"],
      ["clipboard", "\u526A\u8D34\u677F"]
    ].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_react_native.Pressable,
      {
        disabled: busy,
        accessibilityRole: "radio",
        accessibilityLabel: label,
        accessibilityState: { checked: destination === value, disabled: busy },
        onPress: () => {
          setDestination(value);
          exporting.reset();
        },
        style: { width: "48%", paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.surface1, borderWidth: 1, borderColor: destination === value ? colors.accent : colors.surface1 },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.Text, { style: { ...text, fontSize: 13 }, children: [
          destination === value ? "\u25C9" : "\u25CB",
          " ",
          label
        ] })
      },
      value
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { numberOfLines: 2, style: { color: colors.foregroundMuted, fontSize: 12 }, children: destination === "exports" ? `~/Tervell Exports on ${host.label}` : destination === "session" ? `Tervell Exports in the session folder on ${host.label}` : destination === "custom" ? `Folder on ${host.label}` : "Copies to this device\u2019s clipboard" }),
    destination === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { gap: 8 }, children: [
      action("\u6D4F\u89C8\u6587\u4EF6\u5939\u2026", () => {
        void globalThis.electronAPI.builtinFeatureCall("export.choose-directory").then((value) => {
          if (typeof value === "string") {
            setDirectory(value);
            reset();
          }
        }).catch((error) => {
          setBrowseError(String(error));
        });
      }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { selectable: true, style: { ...text, fontSize: 12 }, children: directory || "\u5C1A\u672A\u9009\u62E9\u6587\u4EF6\u5939" }),
      browseError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { accessibilityRole: "alert", style: text, children: browseError })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, children: [
      ["includeReasoning", "\u63A8\u7406"],
      ["includeTools", "\u5DE5\u5177"],
      ["includeTimestamps", "\u65F6\u95F4\u6233"]
    ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_react_native.Pressable,
      {
        accessibilityRole: "checkbox",
        accessibilityLabel: label,
        accessibilityState: { checked: options[key], disabled: busy },
        disabled: busy,
        onPress: () => {
          setOptions({ ...options, [key]: !options[key] });
          reset();
        },
        style: { paddingVertical: 6 },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.Text, { style: { ...text, fontSize: 12 }, children: [
          options[key] ? "\u2611" : "\u2610",
          " ",
          label
        ] })
      },
      key
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, children: [
      action(exporting.isPending ? "Exporting\u2026" : destination === "clipboard" ? "Copy export" : `Save .${format === "markdown" ? "md" : "json"}`, () => exporting.mutate(), busy || destination === "custom" && !directory.trim(), true),
      popover ? action("\u5B8C\u6574\u9884\u89C8 \u2197", () => onOpenPreview?.()) : action(preview.isPending ? "Loading\u2026" : "Preview", () => preview.mutate())
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { accessibilityRole: "button", accessibilityState: { expanded: showDefaults }, onPress: () => setShowDefaults(!showDefaults), style: { paddingVertical: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.Text, { style: { color: colors.foregroundMuted, fontSize: 12 }, children: [
      showDefaults ? "\u25BE" : "\u25B8",
      " Defaults \xB7 ",
      hasWorkspaceDefaults ? "workspace" : "host"
    ] }) }),
    showDefaults && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.Text, { style: { color: colors.foregroundMuted, fontSize: 12 }, children: [
        "Remember the current format, folder, and content options. Workspace defaults apply to all sessions in ",
        workspace?.name || "this workspace",
        "."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, children: [
        action("Save for workspace", () => savingDefaults.mutate("workspace")),
        action("Save for host", () => savingDefaults.mutate("host")),
        hasWorkspaceDefaults && action("Use host defaults", () => savingDefaults.mutate("inherit"))
      ] })
    ] }),
    savingDefaults.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { accessibilityRole: "alert", style: text, children: savingDefaults.error.message }),
    savingDefaults.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { accessibilityLiveRegion: "polite", style: { ...text, fontSize: 12 }, children: savingDefaults.data }),
    (preview.error || exporting.error) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { accessibilityRole: "alert", selectable: true, style: text, children: (preview.error || exporting.error)?.message }),
    exporting.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { accessibilityLiveRegion: "polite", selectable: true, style: text, children: exporting.data }),
    !popover && preview.data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.Text, { style: { color: colors.foregroundMuted }, children: [
        preview.data.entryCount,
        " history entries \xB7 ",
        preview.data.filename
      ] }),
      format === "markdown" && action(raw ? "Show formatted preview" : "Show Markdown source", () => setRaw(!raw), false),
      raw || format === "json" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { selectable: true, style: { ...text, fontFamily: "monospace", fontSize: 13 }, children: preview.data.content }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ui.Markdown, { children: preview.data.content })
    ] })
  ] });
  return popover ? content : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.ScrollView, { showsVerticalScrollIndicator: true, persistentScrollbar: true, style: { flex: 1, backgroundColor: colors.surface0 }, children: content });
}

// resources/third-party/default-features/exporter/index.client.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function contribute(client) {
  client.addWorkspacePanel({ id: "export", title: "Export conversation", icon: "FileDown", context: "agent", Component: ExportPanel });
  client.addCommandCenterItem({
    id: "export-session",
    title: "Export conversation as Markdown or JSON",
    icon: "FileDown",
    keywords: ["session", "history", "markdown", "download"],
    context: "agent",
    onSelect: ({ openPanel }) => openPanel("export")
  });
  client.addSlashCommand({ name: "export", description: "Export this conversation as Markdown or JSON", argumentHint: "", context: "agent", onSubmit: ({ openPanel }) => openPanel("export") });
  const pills = /* @__PURE__ */ new Map();
  const placements = /* @__PURE__ */ new Map();
  const lifetime = new AbortController();
  const clear = () => {
    for (const pill of pills.values()) pill.remove();
    pills.clear();
    placements.clear();
  };
  const register = (agent) => {
    if (lifetime.signal.aborted) return;
    if (placements.get(agent.id) === agent.workspaceId && pills.has(agent.id)) return;
    pills.get(agent.id)?.remove();
    pills.delete(agent.id);
    placements.delete(agent.id);
    if (!agent.workspaceId) return;
    const { id: agentId, workspaceId } = agent;
    placements.set(agentId, workspaceId);
    function Popover(props) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExportPopover, { ...props, onOpenPreview: () => {
        props.close();
        client.openPanel("export", { workspaceId, agentId });
      } });
    }
    pills.set(agentId, client.addComposerPill({
      id: "export",
      agentId,
      workspaceId,
      button: { title: "Export conversation", label: "Export", icon: "FileDown", behavior: {
        kind: "popover",
        Content: Popover
      } }
    }));
  };
  void client.paseo.agents.list({ subscribe: {}, signal: lifetime.signal }).then(({ subscription }) => {
    if (lifetime.signal.aborted) {
      void subscription.release();
      return;
    }
    subscription.subscribe({
      snapshot: ({ entries }) => {
        const ids = new Set(entries.map(({ agent }) => agent.id));
        for (const [id, pill] of pills) if (!ids.has(id)) {
          pill.remove();
          pills.delete(id);
          placements.delete(id);
        }
        for (const { agent } of entries) register(agent);
      },
      update: (message) => {
        if (message.type !== "agent_update") return;
        const update = message.payload;
        if (update.kind === "upsert") register(update.agent);
        else {
          pills.get(update.agentId)?.remove();
          pills.delete(update.agentId);
          placements.delete(update.agentId);
        }
      }
    });
  }).catch((error) => {
    if (!lifetime.signal.aborted) console.error("Exporter agent observation failed", error);
  });
  return () => {
    lifetime.abort();
    clear();
  };
}

return module.exports;})