const __dshModuleUrl=require("node:url").pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  Loader: () => Loader2,
  SystemPrompt: () => SystemPrompt,
  scope: () => src_exports,
  tools: () => src_exports2
});
module.exports = __toCommonJS(stdin_exports);

// resources/third-party/dsh-runtime/packages/core/tools/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  JsonSchemaError: () => JsonSchemaError,
  RUN_CODE_NAME: () => RUN_CODE_NAME,
  TOOL_ABORTED: () => TOOL_ABORTED,
  TOOL_ABORTED_BEFORE_DISPATCH: () => TOOL_ABORTED_BEFORE_DISPATCH,
  ToolActivationError: () => ToolActivationError,
  ToolArgsError: () => ToolArgsError,
  ToolBatchExecutionError: () => ToolBatchExecutionError,
  ToolContextUnavailableError: () => ToolContextUnavailableError,
  ToolExecutorUnavailableError: () => ToolExecutorUnavailableError,
  ToolNotFoundError: () => ToolNotFoundError,
  ToolOutputError: () => ToolOutputError,
  ToolRuntime: () => ToolsService,
  ToolsService: () => ToolsService,
  assertObjectJsonSchema: () => assertObjectJsonSchema,
  assertSupportedJsonSchema: () => assertSupportedJsonSchema,
  default: () => src_default,
  defineTool: () => defineTool,
  isJsonSchemaRecord: () => isJsonSchemaRecord,
  isPlainJsonArray: () => isPlainJsonArray,
  isPlainJsonRecord: () => isPlainJsonRecord,
  parameterSchemaSpecToJsonSchema: () => parameterSchemaSpecToJsonSchema,
  projectToolSchema: () => projectToolSchema,
  validateArgs: () => validateArgs,
  validateJsonSchemaValue: () => validateJsonSchemaValue,
  valueSchemaSpecToJsonSchema: () => valueSchemaSpecToJsonSchema
});
var import_cordis2 = require("./cordis.cjs");
var import_schemastery = __toESM(require("./schemastery.cjs"), 1);

// resources/third-party/dsh-runtime/packages/core/scope/src/index.ts
var src_exports = {};
__export(src_exports, {
  AnonymousEntries: () => AnonymousEntries,
  NamedEntries: () => NamedEntries,
  ScopedLayers: () => ScopedLayers,
  bindScopeParent: () => bindScopeParent,
  carrierKeyOf: () => carrierKeyOf,
  createScope: () => createScope,
  isScopeCarrier: () => isScopeCarrier,
  scopeChainOf: () => scopeChainOf,
  scopeOf: () => scopeOf,
  scopeParentOf: () => scopeParentOf,
  scopeTarget: () => scopeTarget
});
var import_cordis = require("./cordis.cjs");

// resources/third-party/dsh-runtime/packages/core/scope/src/store.ts
var NamedEntries = class {
  constructor(duplicateError) {
    this.duplicateError = duplicateError;
  }
  data = /* @__PURE__ */ new Map();
  /**
   * Insert one unique name.
   * @param name - name unique within this table.
   * @param value - borrowed value to retain.
   * @returns an idempotent undo that removes only this insertion.
   */
  insert(name, value) {
    const data = this.data;
    if (data.has(name)) throw this.duplicateError(name);
    data.set(name, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(name);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
   * Read one named value.
   * @param name - name to resolve.
   * @returns the retained value, or `undefined` when absent.
   */
  get(name) {
    return this.data.get(name);
  }
  /**
   * Test one name for membership.
   * @param name - name to test.
   * @returns whether the table contains that name.
   */
  has(name) {
    return this.data.has(name);
  }
  /**
   * Iterate live names in insertion order.
   * @returns the native live key iterator.
   */
  keys() {
    return this.data.keys();
  }
  /**
   * Iterate live entries in insertion order.
   * @returns the native live entry iterator.
   */
  entries() {
    return this.data.entries();
  }
  /**
   * Iterate live values in insertion order.
   * @returns the native live value iterator.
   */
  values() {
    return this.data.values();
  }
  /**
   * Test whether this table has no entries.
   * @returns whether the table is empty.
   */
  isEmpty() {
    return this.data.size === 0;
  }
};
var AnonymousEntries = class {
  data = /* @__PURE__ */ new Map();
  /**
   * Append one independently owned value.
   * @param value - borrowed value to retain.
   * @returns an idempotent undo for this exact append.
   */
  append(value) {
    const data = this.data;
    const key = Symbol();
    data.set(key, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(key);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
   * Iterate live values in insertion order.
   * @returns the native live value iterator.
   */
  values() {
    return this.data.values();
  }
  /**
   * Test whether this table has no entries.
   * @returns whether the table is empty.
   */
  isEmpty() {
    return this.data.size === 0;
  }
};
var ScopedLayers = class {
  constructor(createLayer, onChange) {
    this.createLayer = createLayer;
    this.onChange = onChange;
    this.global = createLayer(void 0);
  }
  /** The eagerly constructed context-global layer. */
  global;
  scoped = /* @__PURE__ */ new Map();
  /**
   * Read an existing exact-scope overlay. Deliberately chain-blind: callers
   * addressing one scope's OWN contributions (its restrictions, its guards)
   * must not silently pick up an ancestor's — use {@link chainLayers} where
   * inheritance is the point.
   * @param scope - exact scope key; `undefined` denotes no overlay.
   * @returns the existing scoped layer, or `undefined` without creating one.
   */
  peek(scope2) {
    if (scope2 === void 0) return void 0;
    return this.scoped.get(scope2);
  }
  /**
   * Existing overlays along the scope's parent chain ({@link scopeChainOf}),
   * farthest ancestor first and the exact scope last, so a caller layering
   * them in order gives the nearest scope the final word.
   * @param scope - viewing scope, or `undefined` for no overlays.
   * @returns the existing layers, nearest last; absent overlays are skipped.
   */
  chainLayers(scope2) {
    const layers = [];
    for (const key of scopeChainOf(scope2).reverse()) {
      const layer = this.scoped.get(key);
      if (layer !== void 0) layers.push(layer);
    }
    return layers;
  }
  /**
   * Materialize global named entries followed by scope-chain shadows,
   * farthest ancestor first, so the nearest scope's entry wins a name.
   * @param scope - viewing scope, or `undefined` for the global view.
   * @param pick - select the named table from a layer.
   * @returns an insertion-ordered effective map.
   */
  merge(scope2, pick) {
    const merged = new Map(pick(this.global).entries());
    for (const layer of this.chainLayers(scope2)) {
      for (const [name, value] of pick(layer).entries()) merged.set(name, value);
    }
    return merged;
  }
  /**
   * Attach one synchronous layer mutation to its registration context.
   * @param ctx - context that determines both scope visibility and effect ownership.
   * @param action - atomic mutation returning its synchronous undo.
   * @param options - Cordis effect label and optional change notification.
   * @returns the exact disposer returned by `ctx.effect()`.
   */
  effect(ctx, action, options) {
    const scope2 = scopeOf(ctx);
    const notify = options.notify ?? true;
    const dispose = ctx.effect(function* () {
      let layer;
      let created = false;
      if (scope2 === void 0) {
        layer = this.global;
      } else {
        const existing = this.scoped.get(scope2);
        if (existing === void 0) {
          layer = this.createLayer(scope2);
          this.scoped.set(scope2, layer);
          created = true;
        } else {
          layer = existing;
        }
      }
      let undo;
      try {
        undo = action(layer);
      } catch (error) {
        if (scope2 !== void 0 && created && layer.isEmpty()) this.scoped.delete(scope2);
        throw error;
      }
      yield () => {
        undo();
        if (scope2 !== void 0 && layer.isEmpty()) this.scoped.delete(scope2);
        if (notify) this.onChange();
      };
      if (notify) this.onChange();
    }.bind(this), options.label);
    return dispose;
  }
};

// resources/third-party/dsh-runtime/packages/core/scope/src/index.ts
var kScope = Symbol("dsh.scope");
var carrierKeys = /* @__PURE__ */ new WeakMap();
var scopeParents = /* @__PURE__ */ new WeakMap();
function linkScopeParent(key, parent) {
  for (let cursor = parent; cursor !== void 0; cursor = scopeParents.get(cursor)) {
    if (cursor === key) throw new Error("dsh-scope: scope parent link would form a cycle");
  }
  scopeParents.set(key, parent);
}
function bindScopeParent(key, parent) {
  if (scopeParents.has(key)) {
    throw new Error("dsh-scope: scope key is already bound to a parent; re-linking requires the binding returned by the original bind");
  }
  linkScopeParent(key, parent);
  return {
    rebind(next) {
      linkScopeParent(key, next);
    }
  };
}
function scopeParentOf(key) {
  return scopeParents.get(key);
}
function scopeChainOf(key) {
  const chain = [];
  for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) chain.push(cursor);
  return chain;
}
async function quiesceFiber(fiber) {
  await Promise.resolve(fiber.dispose());
  while (fiber.inertia !== void 0) await fiber.inertia;
}
function scope() {
}
function createScope(ctx, key, options) {
  if (options?.parent !== void 0) bindScopeParent(key, options.parent);
  const fiber = ctx.plugin(scope);
  const scoped = fiber.ctx.extend({ [kScope]: key });
  let disposing;
  return {
    ctx: scoped,
    rawDispose: fiber.dispose,
    dispose: () => disposing ??= quiesceFiber(fiber)
  };
}
function scopeOf(ctx) {
  return ctx[kScope];
}
function scopeTarget(base, key) {
  const baseFilter = base[import_cordis.Context.filter];
  const carrier = {
    [import_cordis.Context.filter](ctx) {
      if (baseFilter !== void 0 && !baseFilter.call(base, ctx)) return false;
      const tag = scopeOf(ctx);
      if (tag === void 0) return true;
      for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) {
        if (cursor === tag) return true;
      }
      return false;
    }
  };
  carrierKeys.set(carrier, key);
  return carrier;
}
function isScopeCarrier(value) {
  return typeof value === "object" && value !== null && carrierKeys.has(value);
}
function carrierKeyOf(value) {
  if (!isScopeCarrier(value)) return void 0;
  return carrierKeys.get(value);
}

// resources/third-party/dsh-runtime/packages/util/error/src/index.ts
var HarnessError = class extends Error {
  /** Stable machine-routable failure class (e.g. `RATE_LIMIT`); route on this, never by parsing `message`. */
  code;
  constructor(message, code, options) {
    super(message, options);
    this.code = code;
    this.name = new.target.name;
  }
};

// resources/third-party/dsh-runtime/packages/llm/llm/src/error.ts
var LLM_FAILURE_CODES = {
  ABORTED: {},
  ACCOUNT_QUOTA: {},
  ACCOUNT_SIGN_IN_REQUIRED: {},
  ACCOUNT_TOKEN_INVALID: {},
  AUTH: {},
  CLIENT_UPGRADE_REQUIRED: {},
  CONTEXT_WINDOW_EXCEEDED: {},
  DISCOVERY_FAILED: {},
  DISCOVERY_UNSUPPORTED: {},
  DUPLICATE_ADAPTER: {},
  DUPLICATE_DIRECTORY: {},
  DUPLICATE_DISCOVERY: {},
  EMPTY_RESPONSE: { retryChoice: true },
  FILES_API: {},
  IMAGE_OFFLOAD_REQUIRED: {},
  INVALID_ADAPTER: {},
  INVALID_CATALOG: {},
  INVALID_CONFIG: {},
  INVALID_CREDENTIAL: {},
  INVALID_DIRECTORY: {},
  INVALID_DISCOVERY: {},
  INVALID_MODEL_CONTEXT: {},
  INVALID_MODEL_INFO: {},
  INVALID_MODEL_MAX_TOKENS: {},
  INVALID_MODEL_REASONING: {},
  INVALID_PREPARED_CALL: {},
  INVALID_REPLAY_STATE: {},
  INVALID_REQUEST: {},
  INVALID_RESPONSE: {},
  MALFORMED_RESPONSE: { retryChoice: true },
  MISSING_CREDENTIAL: {},
  MODEL_SWITCH_COMPACTION_FAILED: {},
  MODEL_UNSUPPORTED: {},
  NO_ADAPTER: {},
  NO_CREDENTIAL_STORE: {},
  NO_DISCOVERY: {},
  PI_AI_ERROR: {},
  QUOTA: { retryChoice: true },
  RATE_LIMIT: { retryChoice: true },
  REGISTRATION_DISPOSED: {},
  REQUEST_EXTENSION: {},
  REQUEST_HEADERS: {},
  SERVER: { retryChoice: true },
  STREAM_CLOSED: { retryChoice: true },
  TIMEOUT: { retryChoice: true },
  TRANSPORT: { retryChoice: true },
  UNKNOWN: {},
  UNKNOWN_MODEL: {},
  UNSTORABLE_PROVIDER_ID: {},
  UNSUPPORTED_CONTENT: {},
  UNSUPPORTED_OPTION: {},
  UNSUPPORTED_REASONING_EFFORT: {}
};
var RETRY_CODE_CHOICES = Object.freeze(
  Object.keys(LLM_FAILURE_CODES).filter((code) => "retryChoice" in LLM_FAILURE_CODES[code])
);
var STRUCTURED_CONTEXT_OVERFLOW = new RegExp(
  String.raw`(?:^|[^a-z0-9])context[\s_-](?:length|window)[\s_-]` + String.raw`(?:exceed(?:ed|s)?|overflow(?:ed)?|limit[\s_-]exceeded)(?:$|[^a-z0-9])`,
  "i"
);
var TOO_LARGE_FOR_CONTEXT = new RegExp(
  String.raw`\b(?:request|prompt|input|messages?)\s+(?:is\s+|are\s+)?` + String.raw`too\s+(?:large|long)\s+for\s+(?:(?:this|the)\s+)?` + String.raw`(?:model(?:'s)?\s+)?context(?:\s+window)?\b`,
  "i"
);
var EXCEEDS_MODEL_CONTEXT = new RegExp(
  String.raw`\b(?:input|prompt|request|messages?)\b.{0,40}` + String.raw`\b(?:exceed(?:s|ed)?|overflows?|is\s+larger\s+than)\b.{0,40}` + String.raw`\b(?:the\s+)?(?:model(?:'s)?\s+)?context(?:\s+(?:length|window))?\b`,
  "i"
);

// resources/third-party/dsh-runtime/packages/core/tools/src/executor.ts
var ToolBatchExecutionError = class extends Error {
  constructor(cause, partial) {
    super("Tool batch execution failed", { cause });
    this.partial = partial;
    this.name = "ToolBatchExecutionError";
  }
};
var ToolExecutorUnavailableError = class extends HarnessError {
  constructor() {
    super("The selected tool executor is unavailable. Load an executor in this composition before running the agent.", "TOOL_EXECUTOR_UNAVAILABLE");
    this.name = "ToolExecutorUnavailableError";
  }
};

// resources/third-party/dsh-runtime/packages/util/values/src/partial-json.ts
var SIMPLE_ESCAPES = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "	"
};
var CONTENT_ESCAPE = /[\\\u0000-\u001f]/u;
function isWhitespace(c) {
  return c === " " || c === "\n" || c === "\r" || c === "	";
}
function isHex(c) {
  return c >= "0" && c <= "9" || c >= "a" && c <= "f" || c >= "A" && c <= "F";
}
var PartialArguments = class _PartialArguments {
  /** The view of a call with no arguments available. */
  static EMPTY = _PartialArguments.fromObject({});
  /**
   * View finished argument text without scanning it until a reader asks.
   * @param text - the complete argument JSON text.
   * @returns a sealed view.
   */
  static fromText(text) {
    const view = new _PartialArguments();
    view.append(text);
    view.sealed = true;
    return view;
  }
  /**
   * View an already parsed argument payload, such as a PTC dispatch object.
   * @param value - the parsed argument value.
   * @returns a sealed view; a non-object payload has no fields.
   */
  static fromObject(value) {
    const view = new _PartialArguments();
    view.object = typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
    view.sealed = true;
    return view;
  }
  /**
   * The source: text so far or a parsed object, plus whether it can still grow.
   * These are the only enumerable fields, so two views over the same source
   * compare equal structurally however far each has been read.
   */
  chunks = [];
  object;
  sealed = false;
  // Scan progress, located fields, and remembered reads are caches over the source.
  #ends = [];
  #size = 0;
  #consumed = 0;
  #mode = "root";
  #escape = false;
  #keyStart = 0;
  #keyEscaped = false;
  #key = "";
  #current = null;
  #nestedEnds = [];
  #nestedInString = false;
  #invalidAt;
  #invalidValue = false;
  #entries = /* @__PURE__ */ new Map();
  #order = [];
  #reads = /* @__PURE__ */ new Map();
  /** Whether this view rejects further appends; does not scan text or register reads. */
  get isSealed() {
    return this.sealed;
  }
  /** Whether indexing or a content read found invalid JSON; unread value contents are not validated. */
  get invalid() {
    this.scan();
    return this.#mode === "invalid" || this.#invalidValue;
  }
  /**
   * Retain streamed argument text without scanning or comparing observed answers.
   * @param fragment - the text following every fragment appended before.
   */
  append(fragment) {
    if (this.sealed) throw new Error("PartialArguments: cannot append to a sealed view");
    if (fragment.length === 0) return;
    this.chunks.push(fragment);
    this.#size += fragment.length;
    this.#ends.push(this.#size);
  }
  /**
   * Reconcile a streamed prefix with authoritative complete text without joining the fragments.
   * @param text - the final argument text, which replaces missing or conflicting deltas.
   * @returns this view sealed with its caches retained when every character matches; otherwise a new sealed view.
   */
  settle(text) {
    if (this.object !== void 0 || text.length !== this.#size) return _PartialArguments.fromText(text);
    let offset = 0;
    for (const chunk of this.chunks) {
      if (!text.startsWith(chunk, offset)) return _PartialArguments.fromText(text);
      offset += chunk.length;
    }
    this.chunks = text.length === 0 ? [] : [text];
    this.#ends = text.length === 0 ? [] : [text.length];
    this.sealed = true;
    return this;
  }
  /**
   * Compare observed answers and advance their publication baseline. Unread views remain unscanned.
   * @returns whether any observed answer changed since its first read or the preceding refresh.
   */
  refresh() {
    if (this.#reads.size === 0) return false;
    this.scan();
    let changed = false;
    let completions = false;
    for (const read of this.#reads.values()) {
      if (read.completion) {
        completions = true;
        continue;
      }
      changed = this.refreshRead(read) || changed;
    }
    if (completions) {
      for (const read of this.#reads.values()) if (read.completion) changed = this.refreshRead(read) || changed;
    }
    if (this.sealed) this.#reads.clear();
    return changed;
  }
  refreshRead(read) {
    const now = read.answer();
    if (Object.is(now, read.last)) return false;
    read.last = now;
    return true;
  }
  /**
   * Check whether no further fields can arrive.
   * @returns whether the outer object closed, indexing failed, or the view is sealed; unread values are not validated.
   */
  closed() {
    return this.remember("closed", "", () => this.closedNow());
  }
  /**
   * List discovered fields in first-appearance order.
   * @returns top-level keys seen so far, in first-appearance order.
   */
  keys() {
    return this.remember("keys", "", () => this.keysNow(), (keys) => keys.length);
  }
  /**
   * Check whether a top-level field has appeared.
   * @param key - argument name.
   * @returns whether the field has appeared (a string opened or another value began).
   */
  has(key) {
    return this.remember("has", key, () => this.hasNow(key));
  }
  /**
   * Check whether a field's closing delimiter has arrived, without validating its contents.
   * @param key - argument name.
   * @returns whether its delimiter arrived and no content reader has reported an error for this value.
   */
  complete(key) {
    return this.remember("complete", key, () => this.completeNow(key));
  }
  /**
   * Read string length without materializing its text.
   * @param key - argument name.
   * @param options - change granularity for a streaming string.
   * @returns decoded UTF-16 length of the string field so far; undefined when absent or not a string.
   */
  stringLength(key, options) {
    const step = Math.max(1, Math.floor(options?.step ?? 1));
    const offset = options?.offset ?? 0;
    return this.remember(
      `length:${step}:${offset}`,
      key,
      () => this.lengthNow(key),
      (length) => length === void 0 ? void 0 : Math.ceil((length + offset) / step)
    );
  }
  /**
   * Check a string against a decoded UTF-16 length limit without materializing it.
   * @param key - argument name.
   * @param maxLength - decoded UTF-16 limit, floored to at least zero.
   * @returns whether the string is longer than the limit; false when absent or not a string.
   */
  stringExceeds(key, maxLength) {
    const limit = Math.max(0, Math.floor(maxLength));
    return this.remember(
      `exceeds:${limit}`,
      key,
      () => (this.lengthNow(key, limit + 1) ?? 0) > limit
    );
  }
  /**
   * Read a decoded string, including a streaming prefix.
   * @param key - argument name.
   * @returns the string field's decoded text so far; undefined when absent or not a string.
   */
  text(key) {
    return this.remember("text", key, () => this.textNow(key));
  }
  /**
   * Read at most the first decoded UTF-16 units of a string.
   * @param key - argument name.
   * @param maxLength - maximum decoded UTF-16 length, floored to at least one.
   * @returns the bounded string prefix; undefined when absent or not a string.
   */
  textPrefix(key, maxLength) {
    const limit = Math.max(1, Math.floor(maxLength));
    return this.remember(
      `prefix:${limit}`,
      key,
      () => this.textPrefixNow(key, limit)
    );
  }
  /**
   * Read a completed non-string argument.
   * @param key - argument name.
   * @returns the parsed non-string value once it closed; undefined while open, absent, or a string.
   */
  value(key) {
    return this.remember("value", key, () => this.valueNow(key));
  }
  /** Answer a question and, on a streaming view, remember it for change detection. */
  remember(kind, key, read, comparison) {
    this.scan();
    const result = read();
    if (!this.sealed) {
      const id = `${kind}/${key}`;
      if (!this.#reads.has(id)) {
        this.#reads.set(id, {
          completion: kind === "complete",
          answer: comparison === void 0 ? read : () => comparison(read()),
          last: comparison === void 0 ? result : comparison(result)
        });
      }
    }
    return result;
  }
  closedNow() {
    return this.sealed || this.#mode === "closed" || this.#mode === "invalid";
  }
  keysNow() {
    return this.object === void 0 ? this.#order : Object.keys(this.object);
  }
  hasNow(key) {
    return this.object === void 0 ? this.#entries.has(key) : Object.hasOwn(this.object, key);
  }
  completeNow(key) {
    if (this.object !== void 0) return Object.hasOwn(this.object, key);
    const entry = this.#entries.get(key);
    return entry !== void 0 && entry.end >= 0 && (entry.kind === "string" ? entry.invalidAt === void 0 : !entry.invalid);
  }
  lengthNow(key, limit = Number.POSITIVE_INFINITY) {
    if (this.object !== void 0) {
      const field = Object.hasOwn(this.object, key) ? this.object[key] : void 0;
      return typeof field === "string" ? field.length : void 0;
    }
    const entry = this.#entries.get(key);
    if (entry?.kind !== "string") return void 0;
    if (entry.text !== void 0 && entry.text.at === entry.end) return entry.text.length;
    const read = entry.length ??= { at: entry.start, length: 0, text: "" };
    this.readString(entry, read, limit, false);
    return read.length;
  }
  textNow(key) {
    if (this.object !== void 0) {
      const field = Object.hasOwn(this.object, key) ? this.object[key] : void 0;
      return typeof field === "string" ? field : void 0;
    }
    const entry = this.#entries.get(key);
    if (entry?.kind !== "string") return void 0;
    if (entry.text === void 0 && entry.end >= 0 && entry.needsDecoding && entry.invalidAt === void 0) {
      let text;
      try {
        text = JSON.parse(`"${this.slice(entry.start, entry.end)}"`);
      } catch (_error) {
      }
      if (text !== void 0) entry.text = { at: entry.end, length: text.length, text };
    }
    const read = entry.text ??= { at: entry.start, length: 0, text: "" };
    this.readString(entry, read, Number.POSITIVE_INFINITY, true);
    return read.text;
  }
  textPrefixNow(key, maxLength) {
    if (this.object !== void 0) {
      const field = Object.hasOwn(this.object, key) ? this.object[key] : void 0;
      return typeof field === "string" ? field.slice(0, maxLength) : void 0;
    }
    const entry = this.#entries.get(key);
    if (entry?.kind !== "string") return void 0;
    const prefixes = entry.prefixes ??= /* @__PURE__ */ new Map();
    let read = prefixes.get(maxLength);
    if (read === void 0) {
      read = { at: entry.start, length: 0, text: "" };
      prefixes.set(maxLength, read);
    }
    this.readString(entry, read, maxLength, true);
    return read.text;
  }
  valueNow(key) {
    if (this.object !== void 0) {
      if (!Object.hasOwn(this.object, key)) return void 0;
      const field = this.object[key];
      return typeof field === "string" ? void 0 : field;
    }
    const entry = this.#entries.get(key);
    if (entry?.kind !== "value" || entry.end < 0 || entry.invalid) return void 0;
    if (entry.parsed === void 0) {
      try {
        entry.parsed = JSON.parse(this.slice(entry.start, entry.end));
      } catch (_error) {
        entry.invalid = true;
        this.#invalidValue = true;
      }
    }
    return entry.parsed;
  }
  chunkAt(at) {
    let low = 0;
    let high = this.#ends.length;
    while (low < high) {
      const mid = low + high >>> 1;
      if (this.#ends[mid] <= at) low = mid + 1;
      else high = mid;
    }
    return low;
  }
  /** Materialize only a requested range, never the cumulative source. */
  slice(start, end) {
    if (start >= end) return "";
    const first = this.chunkAt(start);
    const last = this.chunkAt(end - 1);
    const base = first === 0 ? 0 : this.#ends[first - 1];
    if (first === last) return this.chunks[first].slice(start - base, end - base);
    const parts = [this.chunks[first].slice(start - base)];
    for (let i = first + 1; i < last; i++) parts.push(this.chunks[i]);
    parts.push(this.chunks[last].slice(0, end - this.#ends[last - 1]));
    return parts.join("");
  }
  readString(entry, read, limit, materialize) {
    const end = Math.min(
      entry.end < 0 ? this.#consumed : entry.end,
      entry.invalidAt ?? Number.POSITIVE_INFINITY,
      this.#invalidAt ?? Number.POSITIVE_INFINITY
    );
    if (!entry.needsDecoding) {
      const length = Math.min(end - read.at, limit - read.length);
      if (length <= 0) return;
      if (materialize) read.text += this.slice(read.at, read.at + length);
      read.at += length;
      read.length += length;
      return;
    }
    let chunkIndex = this.chunkAt(read.at);
    while (read.at < end && read.length < limit) {
      const base = chunkIndex === 0 ? 0 : this.#ends[chunkIndex - 1];
      const chunk = this.chunks[chunkIndex];
      const remaining = chunk.slice(read.at - base, Math.min(chunk.length, end - base));
      const boundary = remaining.search(CONTENT_ESCAPE);
      const length = Math.min(boundary < 0 ? remaining.length : boundary, limit - read.length);
      if (length > 0) {
        if (materialize) read.text += remaining.slice(0, length);
        read.at += length;
        read.length += length;
        if (read.at === base + chunk.length) chunkIndex++;
        continue;
      }
      const type = remaining.length > 1 ? remaining[1] : read.at + 1 < end ? this.chunks[chunkIndex + 1][0] : void 0;
      let decoded;
      let width = 2;
      if (remaining[0] === "\\" && type === void 0 && entry.end < 0) return;
      if (remaining[0] === "\\" && type === "u") {
        const hex = this.slice(read.at + 2, Math.min(end, read.at + 6));
        let valid = true;
        for (let i = 0; i < hex.length; i++) if (!isHex(hex[i])) valid = false;
        if (valid) {
          if (hex.length < 4 && entry.end < 0) return;
          if (hex.length === 4) decoded = String.fromCharCode(Number.parseInt(hex, 16));
        }
        width = 6;
      } else if (remaining[0] === "\\" && type !== void 0) {
        decoded = SIMPLE_ESCAPES[type];
      }
      if (decoded === void 0) {
        entry.invalidAt = read.at;
        this.#invalidValue = true;
        return;
      }
      if (materialize) read.text += decoded;
      read.length++;
      read.at += width;
      while (chunkIndex < this.chunks.length && read.at >= this.#ends[chunkIndex]) chunkIndex++;
    }
  }
  /** Locate new field ranges without decoding or parsing their contents. */
  scan() {
    if (this.object !== void 0 || this.#consumed === this.#size) return;
    for (let i = this.chunkAt(this.#consumed); i < this.chunks.length && this.#invalidAt === void 0; i++) {
      const pending = this.chunks[i];
      const base = i === 0 ? 0 : this.#ends[i - 1];
      for (let index = this.#consumed - base; index < pending.length && this.#mode !== "invalid"; index++) {
        if (this.#mode === "string" || this.#mode === "nested" && this.#nestedInString) {
          const end = this.stringBoundary(pending, index);
          this.#consumed += end - index;
          index = end;
          if (index === pending.length) break;
        }
        this.step(pending[index], this.#consumed);
        this.#consumed++;
      }
    }
  }
  /** Only raw quotes and their preceding backslash runs can terminate a string. */
  stringBoundary(fragment, start) {
    let at = start;
    while (true) {
      const quote = fragment.indexOf('"', at);
      const end = quote < 0 ? fragment.length : quote;
      if (this.#mode === "string") {
        const entry = this.#current;
        if (!entry.needsDecoding && CONTENT_ESCAPE.test(fragment.slice(at, end))) entry.needsDecoding = true;
      }
      let slashStart = end;
      while (slashStart > at && fragment[slashStart - 1] === "\\") slashStart--;
      const escaped = (end - slashStart) % 2 === 1 !== (slashStart === at && this.#escape);
      this.#escape = quote < 0 && escaped;
      if (quote < 0 || !escaped) return end;
      at = quote + 1;
    }
  }
  step(c, at) {
    switch (this.#mode) {
      case "root":
        if (isWhitespace(c)) return;
        if (c === "{") {
          this.#mode = "key-or-end";
          return;
        }
        this.fail();
        return;
      case "key-or-end":
        if (isWhitespace(c)) return;
        if (c === "}") {
          this.#mode = "closed";
          return;
        }
        if (c === '"') {
          this.beginKey(at);
          return;
        }
        this.fail();
        return;
      case "key-only":
        if (isWhitespace(c)) return;
        if (c === '"') {
          this.beginKey(at);
          return;
        }
        this.fail();
        return;
      case "key":
        this.stepKey(c, at);
        return;
      case "colon":
        if (isWhitespace(c)) return;
        if (c === ":") {
          this.#mode = "value";
          return;
        }
        this.fail();
        return;
      case "value":
        this.beginValue(c, at);
        return;
      case "string": {
        const entry = this.#current;
        entry.end = at;
        this.#current = null;
        this.#mode = "comma-or-end";
        return;
      }
      case "scalar":
        this.stepScalar(c, at);
        return;
      case "nested":
        this.stepNested(c, at);
        return;
      case "comma-or-end":
        if (isWhitespace(c)) return;
        if (c === ",") {
          this.#mode = "key-only";
          return;
        }
        if (c === "}") {
          this.#mode = "closed";
          return;
        }
        this.fail();
        return;
      case "closed":
        if (isWhitespace(c)) return;
        this.fail();
        return;
      /* v8 ignore next 2 -- scan() stops stepping once the view is invalid. */
      case "invalid":
        return;
      /* v8 ignore next 2 -- Every scanner mode has a handler above. */
      default:
        assertNever(this.#mode);
    }
  }
  fail() {
    this.#invalidAt = this.#consumed;
    this.#mode = "invalid";
    this.#current = null;
  }
  beginKey(at) {
    this.#mode = "key";
    this.#keyStart = at + 1;
    this.#keyEscaped = false;
    this.#escape = false;
  }
  stepKey(c, at) {
    if (c < " ") {
      this.fail();
      return;
    }
    if (this.#escape) {
      this.#escape = false;
      return;
    }
    if (c === "\\") {
      this.#escape = true;
      this.#keyEscaped = true;
      return;
    }
    if (c !== '"') return;
    const raw = this.slice(this.#keyStart, at);
    if (this.#keyEscaped) {
      try {
        this.#key = JSON.parse(`"${raw}"`);
      } catch (_error) {
        this.fail();
        return;
      }
    } else {
      this.#key = raw;
    }
    this.#mode = "colon";
  }
  open(entry) {
    if (!this.#entries.has(this.#key)) this.#order.push(this.#key);
    this.#entries.set(this.#key, entry);
    this.#current = entry;
  }
  beginValue(c, at) {
    if (isWhitespace(c)) return;
    if (c === '"') {
      this.open({
        kind: "string",
        start: at + 1,
        end: -1,
        needsDecoding: false,
        invalidAt: void 0,
        length: void 0,
        text: void 0,
        prefixes: void 0
      });
      this.#escape = false;
      this.#mode = "string";
      return;
    }
    if (c === "}" || c === "," || c === ":" || c === "]") {
      this.fail();
      return;
    }
    this.open({ kind: "value", start: at, end: -1, parsed: void 0, invalid: false });
    if (c === "{" || c === "[") {
      this.#mode = "nested";
      this.#nestedEnds = [c === "{" ? "}" : "]"];
      this.#nestedInString = false;
      this.#escape = false;
      return;
    }
    this.#mode = "scalar";
  }
  stepScalar(c, at) {
    if (c !== "," && c !== "}" && !isWhitespace(c)) return;
    this.closeValue(at);
    this.#mode = c === "," ? "key-only" : c === "}" ? "closed" : "comma-or-end";
  }
  stepNested(c, at) {
    if (this.#nestedInString) {
      this.#nestedInString = false;
      return;
    }
    if (c === '"') {
      this.#nestedInString = true;
      return;
    }
    if (c === "{" || c === "[") {
      this.#nestedEnds.push(c === "{" ? "}" : "]");
      return;
    }
    if (c === "}" || c === "]") {
      if (this.#nestedEnds.pop() !== c) {
        this.fail();
        return;
      }
      if (this.#nestedEnds.length === 0) {
        this.closeValue(at + 1);
        this.#mode = "comma-or-end";
      }
    }
  }
  closeValue(end) {
    const entry = this.#current;
    entry.end = end;
    this.#current = null;
  }
};

// resources/third-party/dsh-runtime/packages/util/values/src/index.ts
function assertNever(value, context) {
  const rendered = JSON.stringify(value) ?? String(value);
  throw new Error(`unreachable variant${context ? ` in ${context}` : ""}: ${rendered}`);
}
function hasIntrinsicConstructor(prototype, name) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const constructor = descriptor?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === Function.prototype.toString.call(name === "Array" ? Array : Object);
  } catch {
    return false;
  }
}
function isIntrinsicObjectPrototype(value) {
  return Object.getPrototypeOf(value) === null && hasIntrinsicConstructor(value, "Object");
}
function hasPlainArrayPrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(prototype) || !hasIntrinsicConstructor(prototype, "Array")) return false;
  const objectPrototype = Object.getPrototypeOf(prototype);
  return typeof objectPrototype === "object" && objectPrototype !== null && isIntrinsicObjectPrototype(objectPrototype);
}
function hasPlainObjectPrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || typeof prototype === "object" && isIntrinsicObjectPrototype(prototype);
}
function enumerableStringKeys(value) {
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string" || !Object.prototype.propertyIsEnumerable.call(value, key))) return void 0;
  return keys;
}
function walkJsonValue(value, detach) {
  const ancestors = /* @__PURE__ */ new Set();
  let root;
  let parent;
  const assign = (item) => {
    if (parent === void 0) {
      if (detach) root = item;
    } else if (parent.kind === "array") {
      if (parent.target !== void 0) parent.target[parent.key] = item;
    } else if (parent.target !== void 0) {
      Object.defineProperty(parent.target, parent.key, {
        value: item,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
  };
  const frames = [];
  let current = value;
  for (; ; ) {
    if (current === null) {
      assign(null);
    } else if (typeof current === "boolean" || typeof current === "string") {
      assign(current);
    } else if (typeof current === "number") {
      if (!Number.isFinite(current) || Object.is(current, -0)) return void 0;
      assign(current);
    } else {
      if (typeof current !== "object") return void 0;
      if (ancestors.has(current)) return void 0;
      if (Array.isArray(current)) {
        if (!hasPlainArrayPrototype(current)) return void 0;
        const length = current.length;
        if (Reflect.ownKeys(current).length !== length + 1) return void 0;
        const target = detach ? [] : void 0;
        if (target !== void 0) assign(target);
        let indices;
        if (!Number.isInteger(length)) {
          indices = [];
          for (let index = length - 1; index >= 0; index--) indices.push(index);
        }
        frames.push({ kind: "array", source: current, length: indices?.length ?? length, index: 0, key: 0, indices, target });
      } else {
        if (!hasPlainObjectPrototype(current)) return void 0;
        const keys = enumerableStringKeys(current);
        if (keys === void 0) return void 0;
        const target = detach ? {} : void 0;
        if (target !== void 0) assign(target);
        frames.push({ kind: "object", source: current, keys, index: 0, key: "", target });
      }
      ancestors.add(current);
    }
    for (; ; ) {
      const frame = frames.at(-1);
      if (frame === void 0) return detach ? root : true;
      const length = frame.kind === "array" ? frame.length : frame.keys.length;
      if (frame.index >= length) {
        ancestors.delete(frame.source);
        frames.pop();
        continue;
      }
      const index = frame.index++;
      parent = frame;
      if (frame.kind === "array") {
        const key = frame.indices === void 0 ? index : frame.indices[frame.indices.length - index - 1];
        if (key === void 0) return void 0;
        if (!Object.prototype.hasOwnProperty.call(frame.source, key)) return void 0;
        frame.key = key;
        current = frame.source[key];
      } else {
        const key = frame.keys[index];
        if (key === void 0) return void 0;
        frame.key = key;
        current = frame.source[key];
      }
      break;
    }
  }
}
function snapshotJsonValue(value) {
  return walkJsonValue(value, true);
}
function isJsonValue(value) {
  return walkJsonValue(value, false) === true;
}

// resources/third-party/dsh-runtime/packages/core/tools/src/json-schema.ts
var JsonSchemaError = class extends HarnessError {
  /** Individual schema violations in walk order. */
  violations;
  constructor(violations) {
    super(`unsupported JSON schema: ${violations.join("; ")}`, "UNSUPPORTED_SCHEMA");
    this.name = "JsonSchemaError";
    this.violations = violations;
  }
};
var CONSTRAINT_KEYWORDS = /* @__PURE__ */ new Set([
  "type",
  "oneOf",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const"
]);
var ANNOTATION_KEYWORDS = /* @__PURE__ */ new Set(["description", "title", "default", "examples"]);
var SCHEMA_TYPES = ["object", "array", "string", "number", "integer", "boolean", "null"];
function hasIntrinsicConstructor2(prototype, name) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const constructor = descriptor?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === `function ${name}() { [native code] }`;
  } catch {
    return false;
  }
}
function isIntrinsicObjectPrototype2(value) {
  return Object.getPrototypeOf(value) === null && hasIntrinsicConstructor2(value, "Object");
}
function isPlainJsonRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || typeof prototype === "object" && isIntrinsicObjectPrototype2(prototype);
  } catch {
    return false;
  }
}
function hasPlainArrayPrototype2(value) {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(prototype) || !hasIntrinsicConstructor2(prototype, "Array")) return false;
  const objectPrototype = Object.getPrototypeOf(prototype);
  return typeof objectPrototype === "object" && objectPrototype !== null && isIntrinsicObjectPrototype2(objectPrototype);
}
function hasOnlyEnumerableStringKeys(value) {
  try {
    return Reflect.ownKeys(value).every((key) => typeof key === "string" && Object.prototype.propertyIsEnumerable.call(value, key));
  } catch {
    return false;
  }
}
function isJsonSchemaRecord(value) {
  return isPlainJsonRecord(value) && hasOnlyEnumerableStringKeys(value);
}
function isPlainJsonArray(value) {
  if (!Array.isArray(value)) return false;
  try {
    if (!hasPlainArrayPrototype2(value) || Reflect.ownKeys(value).length !== value.length + 1) return false;
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) return false;
    }
    return true;
  } catch {
    return false;
  }
}
function isJsonNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0);
}
function scalarMatches(type, value) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return isJsonNumber(value);
    case "integer":
      return isJsonNumber(value) && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    /* v8 ignore next -- JsonSchemaScalarType is closed; this retains compile-time exhaustiveness. */
    default:
      return assertNever(type, "JsonSchemaType");
  }
}
var ONE_OF_SIBLING_KEYWORDS = ["properties", "required", "additionalProperties", "items", "enum", "const"];
function checkObjectSchemaTail(node, path2, properties, violations) {
  const hasRequired = Object.hasOwn(node, "required");
  const required = hasRequired ? node.required : void 0;
  if (hasRequired) {
    if (!isPlainJsonArray(required) || required.some((entry) => typeof entry !== "string")) {
      violations.push(`${path2}.required must be an array of strings`);
    } else {
      const declared = isJsonSchemaRecord(properties) ? properties : {};
      for (const key of required) {
        if (!Object.hasOwn(declared, key)) violations.push(`${path2}.required names "${key}" which is not in properties`);
      }
    }
  }
  if (Object.hasOwn(node, "additionalProperties") && typeof node.additionalProperties !== "boolean") {
    violations.push(`${path2}.additionalProperties must be a boolean`);
  }
}
function checkSchemaNode(root, rootPath, violations, seen) {
  const tasks = [{ kind: "enter", node: root, path: rootPath }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      seen.delete(task.node);
      continue;
    }
    if (task.kind === "one-of-tail") {
      for (const key of ONE_OF_SIBLING_KEYWORDS) {
        if (Object.hasOwn(task.node, key)) violations.push(`${task.path}.${key} is not supported beside oneOf`);
      }
      continue;
    }
    if (task.kind === "object-tail") {
      checkObjectSchemaTail(task.node, task.path, task.properties, violations);
      continue;
    }
    const { node, path: path2 } = task;
    if (!isJsonSchemaRecord(node)) {
      violations.push(`${path2} must be a schema object`);
      continue;
    }
    if (seen.has(node)) {
      violations.push(`${path2} is circular`);
      continue;
    }
    seen.add(node);
    tasks.push({ kind: "leave", node });
    for (const key of Object.keys(node)) {
      if (CONSTRAINT_KEYWORDS.has(key)) continue;
      if (ANNOTATION_KEYWORDS.has(key)) {
        try {
          if (!isJsonValue(node[key])) violations.push(`${path2}.${key} annotation must be lossless JSON data`);
        } catch {
          violations.push(`${path2}.${key} annotation must be lossless JSON data`);
        }
        continue;
      }
      violations.push(`${path2}.${key} is not a supported keyword (subset: type/oneOf/properties/required/additionalProperties/items/enum/const + annotations)`);
    }
    if (Object.hasOwn(node, "description") && typeof node.description !== "string") {
      violations.push(`${path2}.description must be a string`);
    }
    if (Object.hasOwn(node, "title") && typeof node.title !== "string") {
      violations.push(`${path2}.title must be a string`);
    }
    const hasType = Object.hasOwn(node, "type");
    const hasOneOf = Object.hasOwn(node, "oneOf");
    if (hasType && hasOneOf) {
      violations.push(`${path2} cannot declare both type and oneOf`);
      continue;
    }
    if (!hasType && !hasOneOf) {
      for (const key of ONE_OF_SIBLING_KEYWORDS) {
        if (Object.hasOwn(node, key)) violations.push(`${path2}.${key} requires type or oneOf`);
      }
      continue;
    }
    if (hasOneOf) {
      const oneOf = node.oneOf;
      tasks.push({ kind: "one-of-tail", node, path: path2 });
      if (!isPlainJsonArray(oneOf) || oneOf.length < 2) {
        violations.push(`${path2}.oneOf must be an array of at least two schemas`);
      } else {
        for (let index = oneOf.length - 1; index >= 0; index--) {
          tasks.push({ kind: "enter", node: oneOf[index], path: `${path2}.oneOf[${index}]` });
        }
      }
      continue;
    }
    const type = node.type;
    if (typeof type !== "string" || !SCHEMA_TYPES.includes(type)) {
      violations.push(Array.isArray(type) ? `${path2}.type must be a single type string (type arrays are not supported)` : `${path2}.type must be one of ${SCHEMA_TYPES.join("/")}`);
      continue;
    }
    const schemaType = type;
    const allowedFor = {
      properties: ["object"],
      required: ["object"],
      additionalProperties: ["object"],
      items: ["array"],
      enum: ["string", "number", "integer", "boolean", "null"],
      const: ["string", "number", "integer", "boolean", "null"]
    };
    for (const [key, types] of Object.entries(allowedFor)) {
      if (Object.hasOwn(node, key) && !types.includes(schemaType)) {
        violations.push(`${path2}.${key} is not supported on type "${schemaType}"`);
      }
    }
    switch (schemaType) {
      case "object": {
        const properties = Object.hasOwn(node, "properties") ? node.properties : void 0;
        tasks.push({ kind: "object-tail", node, path: path2, properties });
        if (Object.hasOwn(node, "properties")) {
          if (!isJsonSchemaRecord(properties)) {
            violations.push(`${path2}.properties must be an object of schemas`);
          } else {
            const entries = Object.entries(properties);
            for (let index = entries.length - 1; index >= 0; index--) {
              const entry = entries[index];
              if (entry === void 0) continue;
              tasks.push({ kind: "enter", node: entry[1], path: `${path2}.properties.${entry[0]}` });
            }
          }
        }
        break;
      }
      case "array": {
        if (Object.hasOwn(node, "items")) tasks.push({ kind: "enter", node: node.items, path: `${path2}.items` });
        break;
      }
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null": {
        const hasEnum = Object.hasOwn(node, "enum");
        const allowed = hasEnum ? node.enum : void 0;
        const enumValid = isPlainJsonArray(allowed) && allowed.length > 0 && allowed.every((entry) => scalarMatches(schemaType, entry));
        if (hasEnum && !enumValid) {
          violations.push(`${path2}.enum must be a non-empty array of ${schemaType} values`);
        }
        const hasConst = Object.hasOwn(node, "const");
        const declaredConst = hasConst ? node.const : void 0;
        const constValid = scalarMatches(schemaType, declaredConst);
        if (hasConst) {
          if (!constValid) {
            violations.push(`${path2}.const must be a ${schemaType} value`);
          } else if (enumValid && !allowed.includes(declaredConst)) {
            violations.push(`${path2}.const must be one of ${path2}.enum when both are declared`);
          }
        }
        break;
      }
      /* v8 ignore next -- schemaType was narrowed from the closed SCHEMA_TYPES table above. */
      default:
        assertNever(schemaType, "JsonSchemaType");
    }
  }
}
function assertSupportedJsonSchema(schema) {
  const violations = [];
  checkSchemaNode(schema, "schema", violations, /* @__PURE__ */ new Set());
  if (violations.length > 0) throw new JsonSchemaError(violations);
}
function assertObjectJsonSchema(schema) {
  const violations = [];
  checkSchemaNode(schema, "schema", violations, /* @__PURE__ */ new Set());
  if (violations.length === 0 && (!isJsonSchemaRecord(schema) || !Object.hasOwn(schema, "type") || schema.type !== "object")) {
    violations.push('schema.type must be "object" (structured output is object-rooted)');
  }
  if (violations.length > 0) throw new JsonSchemaError(violations);
}
function safelyIsJsonValue(value) {
  try {
    return isJsonValue(value);
  } catch {
    return false;
  }
}
function diagnosticPath(path2) {
  return path2 === "" ? "arguments" : path2;
}
function propertyPath(path2, key) {
  return path2 === "" ? key : `${path2}.${key}`;
}
function losslessValueViolation(path2) {
  return [`"${diagnosticPath(path2)}" must be a lossless JSON value`];
}
function appendViolations(target, source) {
  for (const violation of source) target.push(violation);
}
function valueFrame(node, value, path2) {
  return {
    node,
    value,
    path: path2,
    catches: false,
    phase: "start",
    children: [],
    childIndex: 0,
    violations: [],
    tailViolations: [],
    matches: 0
  };
}
function checkScalarValue(node, value, path2) {
  const allowed = Object.hasOwn(node, "enum") ? node.enum : void 0;
  if (allowed !== void 0 && !allowed.includes(value)) {
    return [`"${diagnosticPath(path2)}" must be one of ${JSON.stringify(allowed)}`];
  }
  if (Object.hasOwn(node, "const") && value !== node.const) {
    return [`"${diagnosticPath(path2)}" must be ${JSON.stringify(node.const)}`];
  }
  return [];
}
function checkValue(schema, value, path2) {
  const frames = [valueFrame(schema, value, path2)];
  let rootResult;
  const receive = (result) => {
    const parent = frames.at(-1);
    if (parent === void 0) {
      rootResult = result;
      return;
    }
    if (parent.kind === "oneOf") {
      if (result.length === 0) parent.matches++;
    } else {
      appendViolations(parent.violations, result);
    }
  };
  const finish = (result) => {
    frames.pop();
    receive(result);
  };
  while (frames.length > 0) {
    const frame = frames.at(-1);
    if (frame === void 0) break;
    try {
      if (frame.phase === "children") {
        if (frame.childIndex < frame.children.length) {
          const child = frame.children[frame.childIndex];
          if (child === void 0) throw new Error("missing schema-value child frame");
          frame.childIndex++;
          frames.push(valueFrame(child.node, child.value, child.path));
          continue;
        }
        if (frame.kind === "oneOf") {
          finish(frame.matches === 1 ? [] : [`"${diagnosticPath(frame.path)}" must match exactly one oneOf branch (matched ${frame.matches})`]);
          continue;
        }
        appendViolations(frame.violations, frame.tailViolations);
        if (frame.violations.length > 0) {
          finish(frame.violations);
        } else if (frame.kind === "object") {
          finish(safelyIsJsonValue(frame.value) ? [] : [`"${diagnosticPath(frame.path)}" must be a lossless JSON object`]);
        } else {
          finish(safelyIsJsonValue(frame.value) ? [] : [`"${diagnosticPath(frame.path)}" must be a dense lossless JSON array`]);
        }
        continue;
      }
      const nodeType = Object.hasOwn(frame.node, "type") ? frame.node.type : void 0;
      frame.catches = !(nodeType !== void 0 && !SCHEMA_TYPES.includes(nodeType));
      const oneOf = Object.hasOwn(frame.node, "oneOf") ? frame.node.oneOf : void 0;
      if (oneOf !== void 0) {
        frame.kind = "oneOf";
        frame.children = Array.from(oneOf, (branch) => ({ node: branch, value: frame.value, path: frame.path }));
        frame.childIndex = 0;
        frame.matches = 0;
        frame.phase = "children";
        continue;
      }
      if (nodeType === void 0) {
        finish(safelyIsJsonValue(frame.value) ? [] : losslessValueViolation(frame.path));
        continue;
      }
      switch (nodeType) {
        case "object": {
          if (!isPlainJsonRecord(frame.value)) {
            finish([`"${diagnosticPath(frame.path)}" must be an object`]);
            break;
          }
          const properties = Object.hasOwn(frame.node, "properties") ? frame.node.properties ?? {} : {};
          const violations = [];
          const required = Object.hasOwn(frame.node, "required") ? frame.node.required ?? [] : [];
          for (const key of required) {
            if (!Object.hasOwn(frame.value, key) || frame.value[key] === void 0) {
              violations.push(`missing required property "${propertyPath(frame.path, key)}"`);
            }
          }
          const children = [];
          for (const [key, child] of Object.entries(properties)) {
            if (!Object.hasOwn(frame.value, key) || frame.value[key] === void 0) continue;
            children.push({ node: child, value: frame.value[key], path: propertyPath(frame.path, key) });
          }
          const tailViolations = [];
          if (Object.hasOwn(frame.node, "additionalProperties") && frame.node.additionalProperties === false) {
            for (const key of Object.keys(frame.value)) {
              if (!Object.hasOwn(properties, key)) {
                tailViolations.push(`"${propertyPath(frame.path, key)}" is not a declared property (additionalProperties: false)`);
              }
            }
          }
          frame.kind = "object";
          frame.children = children;
          frame.childIndex = 0;
          frame.violations = violations;
          frame.tailViolations = tailViolations;
          frame.phase = "children";
          break;
        }
        case "array": {
          if (!Array.isArray(frame.value)) {
            finish([`"${diagnosticPath(frame.path)}" must be an array`]);
            break;
          }
          const items = Object.hasOwn(frame.node, "items") ? frame.node.items : void 0;
          const children = items === void 0 ? [] : frame.value.flatMap((entry, index) => [{ node: items, value: entry, path: `${frame.path}[${index}]` }]);
          frame.kind = "array";
          frame.children = children;
          frame.childIndex = 0;
          frame.violations = [];
          frame.phase = "children";
          break;
        }
        case "string":
          finish(typeof frame.value === "string" ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be a string`]);
          break;
        case "number":
          finish(typeof frame.value !== "number" ? [`"${diagnosticPath(frame.path)}" must be a number`] : !isJsonNumber(frame.value) ? [`"${diagnosticPath(frame.path)}" must be a finite JSON number`] : checkScalarValue(frame.node, frame.value, frame.path));
          break;
        case "integer":
          finish(!isJsonNumber(frame.value) || !Number.isInteger(frame.value) ? [`"${diagnosticPath(frame.path)}" must be an integer`] : checkScalarValue(frame.node, frame.value, frame.path));
          break;
        case "boolean":
          finish(typeof frame.value === "boolean" ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be a boolean`]);
          break;
        case "null":
          finish(frame.value === null ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be null`]);
          break;
        default:
          finish(assertNever(nodeType, "JsonSchemaType"));
      }
    } catch (error) {
      let failed = frames.pop();
      while (failed !== void 0 && !failed.catches) failed = frames.pop();
      if (failed === void 0) throw error;
      receive(losslessValueViolation(failed.path));
    }
  }
  return rootResult ?? losslessValueViolation(path2);
}
function validateJsonSchemaValue(schema, value, path2 = "value") {
  return checkValue(schema, value, path2);
}

// resources/third-party/dsh-runtime/packages/core/tools/src/schema.ts
var ANNOTATION_KEYS = ["description", "title", "default", "examples"];
function authorError(message) {
  throw new JsonSchemaError([message]);
}
function copyAnnotations(source, target) {
  if (Object.hasOwn(source, "description")) target.description = source.description;
  if (Object.hasOwn(source, "title")) target.title = source.title;
  if (Object.hasOwn(source, "default")) target.default = source.default;
  if (Object.hasOwn(source, "examples")) target.examples = source.examples;
}
function assertAuthorKeys(source, path2, allowed) {
  for (const key of Object.keys(source)) {
    if (!allowed.includes(key)) authorError(`${path2}.${key} is not supported by the value schema DSL`);
  }
}
function assignCompiledNode(destination, node) {
  switch (destination.kind) {
    case "root":
      destination.holder.value = node;
      break;
    case "property":
      Object.defineProperty(destination.target, destination.key, {
        value: node,
        enumerable: true,
        configurable: true,
        writable: true
      });
      break;
    case "item":
      destination.target.items = node;
      break;
    case "one-of":
      destination.target[destination.index] = node;
      break;
  }
}
function assignCompiledPropertyMap(destination, compiled) {
  if (destination.kind === "root") {
    destination.holder.value = compiled;
  } else {
    destination.target.properties = compiled.properties;
  }
}
function runSchemaCompiler(initial) {
  const seen = /* @__PURE__ */ new Set();
  const tasks = [initial];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      seen.delete(task.input);
      continue;
    }
    if (task.kind === "property-map-tail") {
      if (task.required.length > 0) {
        task.compiled.required = task.required;
        if (task.destination.kind === "object") task.destination.target.required = task.required;
      }
      continue;
    }
    if (task.kind === "property") {
      if (!isJsonSchemaRecord(task.property)) authorError(`${task.path} must be a value schema object`);
      if (Object.hasOwn(task.property, "required") && task.property.required !== true) {
        authorError(`${task.path}.required must be true when present`);
      }
      if (Object.hasOwn(task.property, "required") && task.property.required === true) task.required.push(task.key);
      tasks.push({
        kind: "value",
        input: task.property,
        path: task.path,
        allowRequired: true,
        destination: { kind: "property", target: task.properties, key: task.key }
      });
      continue;
    }
    if (task.kind === "property-map") {
      if (!isJsonSchemaRecord(task.input)) authorError(`${task.path} must be an object of value schemas`);
      if (seen.has(task.input)) authorError(`${task.path} is circular`);
      seen.add(task.input);
      const compiled = { properties: {} };
      const required = [];
      assignCompiledPropertyMap(task.destination, compiled);
      tasks.push({ kind: "leave", input: task.input });
      tasks.push({ kind: "property-map-tail", compiled, required, destination: task.destination });
      const entries = Object.entries(task.input);
      for (let index = entries.length - 1; index >= 0; index--) {
        const entry = entries[index];
        if (entry === void 0) continue;
        tasks.push({
          kind: "property",
          property: entry[1],
          path: `${task.path}.${entry[0]}`,
          key: entry[0],
          properties: compiled.properties,
          required
        });
      }
      continue;
    }
    const { input, path: path2 } = task;
    if (!isJsonSchemaRecord(input)) authorError(`${path2} must be a value schema object`);
    if (seen.has(input)) authorError(`${path2} is circular`);
    seen.add(input);
    const authorKeys = [...ANNOTATION_KEYS, ...task.allowRequired ? ["required"] : []];
    const node = {};
    assignCompiledNode(task.destination, node);
    tasks.push({ kind: "leave", input });
    if (Object.hasOwn(input, "oneOf")) {
      assertAuthorKeys(input, path2, [...authorKeys, "oneOf", "type"]);
      if (Object.hasOwn(input, "type")) authorError(`${path2} cannot declare both type and oneOf`);
      if (!isPlainJsonArray(input.oneOf)) authorError(`${path2}.oneOf must be an array of at least two value schemas`);
      const branches = [];
      node.oneOf = branches;
      copyAnnotations(input, node);
      for (let index = input.oneOf.length - 1; index >= 0; index--) {
        tasks.push({
          kind: "value",
          input: input.oneOf[index],
          path: `${path2}.oneOf[${index}]`,
          allowRequired: false,
          destination: { kind: "one-of", target: branches, index }
        });
      }
      continue;
    }
    const inputType = Object.hasOwn(input, "type") ? input.type : void 0;
    switch (inputType) {
      case "json":
        assertAuthorKeys(input, path2, [...authorKeys, "type"]);
        copyAnnotations(input, node);
        break;
      case "object":
        assertAuthorKeys(input, path2, [...authorKeys, "type", "properties", "additionalProperties"]);
        if (!Object.hasOwn(input, "additionalProperties") || typeof input.additionalProperties !== "boolean") {
          authorError(`${path2}.additionalProperties must be explicitly true or false`);
        }
        node.type = "object";
        copyAnnotations(input, node);
        node.additionalProperties = input.additionalProperties;
        if (Object.hasOwn(input, "properties")) {
          tasks.push({
            kind: "property-map",
            input: input.properties,
            path: `${path2}.properties`,
            destination: { kind: "object", target: node }
          });
        }
        break;
      case "array":
        assertAuthorKeys(input, path2, [...authorKeys, "type", "items"]);
        node.type = "array";
        copyAnnotations(input, node);
        if (Object.hasOwn(input, "items")) {
          tasks.push({
            kind: "value",
            input: input.items,
            path: `${path2}.items`,
            allowRequired: false,
            destination: { kind: "item", target: node }
          });
        }
        break;
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null":
        assertAuthorKeys(input, path2, [...authorKeys, "type", "enum", "const"]);
        node.type = inputType;
        copyAnnotations(input, node);
        if (Object.hasOwn(input, "enum")) {
          if (!isPlainJsonArray(input.enum)) authorError(`${path2}.enum must be a non-empty array of scalar values`);
          node.enum = Array.from(input.enum, (entry) => entry);
        }
        if (Object.hasOwn(input, "const")) node.const = input.const;
        break;
      default:
        authorError(`${path2}.type must be string/number/integer/boolean/null/array/object/json, or use oneOf`);
    }
  }
}
function compilePropertyMap(input, path2) {
  const holder = {};
  runSchemaCompiler({ kind: "property-map", input, path: path2, destination: { kind: "root", holder } });
  return holder.value ?? authorError(`${path2} did not compile`);
}
function compileValueSchema(input, path2) {
  const holder = {};
  runSchemaCompiler({ kind: "value", input, path: path2, allowRequired: false, destination: { kind: "root", holder } });
  return holder.value ?? authorError(`${path2} did not compile`);
}
function valueSchemaSpecToJsonSchema(spec) {
  const schema = compileValueSchema(spec, "schema");
  assertSupportedJsonSchema(schema);
  return schema;
}
function parameterSchemaSpecToJsonSchema(spec) {
  const compiled = compilePropertyMap(spec, "parameters");
  const schema = {
    type: "object",
    properties: compiled.properties,
    ...compiled.required === void 0 ? {} : { required: compiled.required }
  };
  assertSupportedJsonSchema(schema);
  return schema;
}
var ToolArgsError = class extends HarnessError {
  /** Individual violations in schema-walk order. */
  violations;
  constructor(violations) {
    super(`invalid arguments: ${violations.join("; ")}`, "INVALID_ARGS");
    this.name = "ToolArgsError";
    this.violations = violations;
  }
};
function validateArgs(spec, args) {
  return validateJsonSchemaValue(parameterSchemaSpecToJsonSchema(spec), args, "");
}
function defineTool(options) {
  const userExecute = options.execute;
  const userFinalizeContent = options.finalizeContent;
  const userProjectContent = options.projectContent;
  const userRender = options.output.render;
  const userPresentationMeta = options.output.presentationMeta;
  const userPresentCall = options.presentCall;
  const userPresentResult = options.presentResult;
  const userIsConcurrencySafe = options.isConcurrencySafe;
  if (options.timeoutMs !== void 0 && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    throw new Error(`defineTool(${options.name}): timeoutMs must be a positive finite number`);
  }
  const parameters = parameterSchemaSpecToJsonSchema(options.parameters);
  const outputSchema = valueSchemaSpecToJsonSchema(options.output.schema);
  const validate = (args) => validateJsonSchemaValue(parameters, args, "");
  const tool = {
    name: options.name,
    description: options.description,
    parameters,
    output: {
      schema: outputSchema,
      render(args, value) {
        return userRender(args, value);
      },
      ...userPresentationMeta !== void 0 ? {
        presentationMeta(args, value) {
          return userPresentationMeta(args, value);
        }
      } : {}
    },
    ...options.deferLoading === true ? { deferLoading: options.deferLoading } : {},
    ...options.timeoutMs !== void 0 ? { timeoutMs: options.timeoutMs } : {},
    async execute(args, exec) {
      const violations = validate(args);
      if (violations.length > 0) throw new ToolArgsError(violations);
      return userExecute(args, exec);
    }
  };
  if (userProjectContent) {
    tool.projectContent = (exec, result) => userProjectContent(exec, result);
  }
  if (userFinalizeContent) {
    tool.finalizeContent = (exec, result) => userFinalizeContent(exec, result);
  }
  if (userPresentCall) {
    tool.presentCall = (args) => {
      if (validate(args).length > 0) return void 0;
      return userPresentCall(args);
    };
  }
  if (userPresentResult) {
    tool.presentResult = (args, result) => {
      if (validate(args).length > 0) return void 0;
      return userPresentResult(args, result);
    };
  }
  if (userIsConcurrencySafe) {
    tool.isConcurrencySafe = (args) => {
      if (validate(args).length > 0) return false;
      return userIsConcurrencySafe(args);
    };
  }
  return tool;
}
function projectToolSchema(definition, detachParameters) {
  const { name, description, parameters, deferLoading } = definition;
  const detached = detachParameters ? snapshotJsonValue(parameters) : parameters;
  if (detached === void 0) throw new Error(`tool "${name}" parameters must be lossless JSON before schema projection`);
  return { name, description, parameters: detached, ...deferLoading === true ? { deferLoading } : {} };
}

// resources/third-party/dsh-runtime/packages/core/tools/src/error-codes.ts
var TOOL_CONTEXT_UNAVAILABLE = "TOOL_CONTEXT_UNAVAILABLE";

// resources/third-party/dsh-runtime/packages/core/tools/src/contracts.ts
var RUN_CODE_NAME = "run_code";
var ToolActivationError = class extends HarnessError {
  /**
   * Preserve a condition failure without treating it as normal unavailability.
   * @param name - tool whose condition rejected.
   * @param cause - underlying condition failure.
   */
  constructor(name, cause) {
    super(`cannot resolve availability of tool "${name}"`, "TOOL_ACTIVATION_FAILED", { cause });
    this.name = "ToolActivationError";
  }
};
var TOOL_ABORTED = "ABORTED";
var TOOL_ABORTED_BEFORE_DISPATCH = "ABORTED_BEFORE_DISPATCH";
var ToolNotFoundError = class extends HarnessError {
  /**
   * @param toolName - the name the caller asked for.
   * @param reachableFrom - how the model reaches this tool instead, when the
   *   name IS visible and only the presentation denies calling it directly.
   *   Omitted for a name that is registered nowhere.
   */
  constructor(toolName, reachableFrom) {
    super(
      reachableFrom === void 0 ? `unknown tool "${toolName}"` : `unknown tool "${toolName}": ${reachableFrom}`,
      "UNKNOWN_TOOL"
    );
    this.name = "ToolNotFoundError";
  }
};
var ToolContextUnavailableError = class extends HarnessError {
  /**
   * @param message - names the tool and the missing context.
   * @param options - standard `cause` chaining.
   */
  constructor(message, options) {
    super(message, TOOL_CONTEXT_UNAVAILABLE, options);
    this.name = "ToolContextUnavailableError";
  }
};
var ToolOutputError = class extends HarnessError {
  /** Schema/value violations in validation order. */
  violations;
  constructor(toolName, violations) {
    super(`tool "${toolName}" returned invalid output: ${violations.join("; ")}`, "INVALID_TOOL_OUTPUT");
    this.name = "ToolOutputError";
    this.violations = violations;
  }
};

// resources/third-party/dsh-runtime/packages/core/tools/src/index.ts
var ToolLayer = class {
  tools;
  restrictions = new AnonymousEntries();
  constructor(scope2) {
    this.tools = new NamedEntries((name) => new Error(scope2 === void 0 ? `tool "${name}" is already registered (for a per-agent variant, register through that agent's \`agent.ctx\` instead)` : `tool "${name}" is already registered in this scope`));
  }
  /** Whether every contribution table in this aggregate layer is empty. */
  isEmpty() {
    return this.tools.isEmpty() && this.restrictions.isEmpty();
  }
  /** Whether every compiled restriction in this layer admits a global tool name. */
  admits(name) {
    for (const filter of this.restrictions.values()) {
      if (filter.allow !== void 0 && !filter.allow.has(name) || filter.deny !== void 0 && filter.deny.has(name)) return false;
    }
    return true;
  }
};
var GuardLayer = class {
  guards = new AnonymousEntries();
  isEmpty() {
    return this.guards.isEmpty();
  }
};
var ToolsService = class extends import_cordis2.Service {
  static inject = ["systemPrompt"];
  static Config = import_schemastery.default.object({
    mode: import_schemastery.default.never().description("Removed. Mount a native or PTC tool executor instead."),
    maxParallelSubCalls: import_schemastery.default.never().description("Moved to the PTC tool executor configuration.")
  });
  layers = new ScopedLayers((scope2) => new ToolLayer(scope2), () => {
    this.ctx.emit("tools/change");
  });
  scoped = /* @__PURE__ */ new WeakMap();
  root;
  guards = new ScopedLayers(() => new GuardLayer(), () => {
  });
  constructor(ctx) {
    super(ctx, "tools");
    ctx.systemPrompt.tools(({ scope: scope2, toolSet }) => {
      const executor = this.selectExecutor(scope2);
      const description = executor.describe(this.definitions(scope2, toolSet));
      return { ...description, knownNames: description.knownNames ?? [...this.view(scope2).knownNames] };
    });
  }
  /**
   * Register globally or in the calling agent scope. Scoped tools shadow
   * globals; duplicates within one layer and the reserved `run_code` name fail.
   * @param definition - tool schema, execution, and optional finalization/presentation callbacks.
   * @param options - optional step-time activation condition.
   * @returns the exact disposer that unregisters the tool.
   */
  register(definition, options = {}) {
    const name = definition.name;
    const output = definition.output;
    if (output === void 0 || typeof output !== "object" || typeof output.render !== "function" || output.presentationMeta !== void 0 && typeof output.presentationMeta !== "function") {
      throw new TypeError(`tool "${name}" must declare output { schema, render, presentationMeta? }`);
    }
    assertSupportedJsonSchema(output.schema);
    const timeoutMs = definition.timeoutMs;
    if (timeoutMs !== void 0 && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
      throw new TypeError(`tool "${name}" timeoutMs must be a positive finite number`);
    }
    if (name === RUN_CODE_NAME) {
      throw new Error(`tool name "${RUN_CODE_NAME}" is reserved for the PTC mode presentation transport and cannot be registered or shadowed`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.tools.insert(name, { definition, when: options.when }),
      { label: "tools.register()" }
    );
  }
  /**
   * Restrict global tools for the calling agent scope. Empty filters, unknown
   * names, scope-local names, and reserved transport names fail. Restrictions
   * intersect; scoped registrations remain visible.
   * @param filter - global-tool mask: `allow` (keep only) and/or `deny` (remove).
   * @returns the exact disposer that lifts this restriction.
   */
  restrict(filter) {
    const scope2 = scopeOf(this.ctx);
    if (scope2 === void 0) {
      throw new Error("tools.restrict() requires a scoped context (agent.ctx): a context-global restriction would mask every agent \u2014 deny the tool for the intended agent instead");
    }
    const allow = filter.allow;
    const deny = filter.deny;
    if (allow === void 0 && deny === void 0) {
      throw new Error("tools.restrict({}) is a no-op: pass `allow` and/or `deny` (an empty filter is almost always a materialized-empty-config bug)");
    }
    const compiled = {
      ...allow !== void 0 ? { allow: new Set(allow) } : {},
      ...deny !== void 0 ? { deny: new Set(deny) } : {}
    };
    if ([...allow ?? [], ...deny ?? []].includes(RUN_CODE_NAME)) {
      throw new Error(`tools.restrict() cannot name reserved PTC mode presentation transport "${RUN_CODE_NAME}"; restrict end-capability tools instead`);
    }
    const known = this.view(scope2).restrictableNames;
    const unknown = [...allow ?? [], ...deny ?? []].filter((name) => !known.has(name));
    if (unknown.length > 0) {
      throw new Error(`tools.restrict() names unknown global tool${unknown.length > 1 ? "s" : ""} ${unknown.map((n) => `"${n}"`).join(", ")}; known global tools: ${[...known].sort().join(", ") || "(none)"}`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.restrictions.append(compiled),
      { label: "tools.restrict()" }
    );
  }
  /**
   * Resolve visible tools and pre-restriction names. Restrictions across the
   * scope chain intersect over inherited global and ancestor tools; the viewing
   * scope's own registrations remain exempt. Nearer registrations shadow
   * farther ones. Pre-restriction names support restriction and prompt-order validation.
   * @param scope - the viewing scope (the agent), or undefined for the global view.
   * @returns the complete derived view for that scope.
   */
  view(scope2) {
    const layers = this.layers.chainLayers(scope2);
    const own = this.layers.peek(scope2);
    const inherited = new Map(this.layers.global.tools.entries());
    for (const layer of layers) {
      if (layer === own) continue;
      for (const [name, registration] of layer.tools.entries()) inherited.set(name, registration);
    }
    const visible = /* @__PURE__ */ new Map();
    const registrations = /* @__PURE__ */ new Map();
    const knownNames = /* @__PURE__ */ new Set();
    const restrictableNames = /* @__PURE__ */ new Set();
    for (const [name, registration] of inherited) {
      knownNames.add(name);
      restrictableNames.add(name);
      if (layers.every((layer) => layer.admits(name))) {
        visible.set(name, registration.definition);
        registrations.set(name, registration);
      }
    }
    if (own !== void 0) {
      for (const [name, registration] of own.tools.entries()) {
        knownNames.add(name);
        visible.set(name, registration.definition);
        registrations.set(name, registration);
      }
    }
    return { visible, registrations, knownNames, restrictableNames };
  }
  /**
   * Look up a tool as one scope sees it (scoped
   * shadows global; a restricted-away global reads as absent). Presenters pass
   * the calling agent so the rendered card matches the definition that
   * actually executed.
   * @param name - the tool name as registered.
   * @param scope - the viewing scope (the agent); omitted = the global view.
   * @param toolSet - step admission; omit only to inspect registered definitions.
   * @returns the definition the scope resolves, or undefined when none is visible.
   */
  get(name, scope2, toolSet) {
    return toolSet === void 0 ? this.view(scope2).visible.get(name) : toolSet.view(scope2).get(name);
  }
  /**
   * Resolve the definition a call may execute. With a step's admitted set, the
   * set decides; without one, conditional registrations are unavailable.
   * @param name - the tool name as registered.
   * @param scope - the calling agent; omitted = the global view.
   * @param toolSet - step admission, or omitted for a call outside a model step.
   * @returns the executable definition, or undefined when the call must fail as `UNKNOWN_TOOL`.
   */
  executable(name, scope2, toolSet) {
    if (toolSet !== void 0) return toolSet.view(scope2).get(name);
    const view = this.view(scope2);
    return view.registrations.get(name)?.when === void 0 ? view.visible.get(name) : void 0;
  }
  /**
   * Resolve conditions once for this step without changing shared registrations.
   * Cancellation or a rejected condition publishes no partial selection. Removed
   * registrations cannot be restored by a late condition result.
   * @param context - preparing agent, captured model selection, and cancellation.
   * @returns the complete selection; the caller disposes it after its tool batch settles.
   */
  async resolve(context) {
    const { agent, signal } = context;
    signal.throwIfAborted();
    const view = this.view(agent);
    const admitted = /* @__PURE__ */ new Map();
    for (const [name, definition] of view.visible) {
      const registration = view.registrations.get(name);
      let enabled;
      try {
        enabled = registration?.when === void 0 || await registration.when(context);
      } catch (cause) {
        signal.throwIfAborted();
        throw new ToolActivationError(name, cause);
      }
      signal.throwIfAborted();
      if (enabled) admitted.set(name, definition);
    }
    let closed = false;
    return Object.freeze({
      dispose: () => {
        closed = true;
      },
      view: (scope2) => {
        const visible = /* @__PURE__ */ new Map();
        if (closed || scope2 !== agent) return visible;
        const current = this.view(agent);
        for (const [name, definition] of admitted) {
          if (current.visible.get(name) === definition && current.registrations.get(name) === view.registrations.get(name)) {
            visible.set(name, definition);
          }
        }
        return visible;
      }
    });
  }
  /**
   * Read the visible capability definitions for descriptions and program bindings.
   * @param scope - viewing Agent or preset; omitted selects the global view.
   * @param toolSet - step admission; omit only to inspect registered definitions.
   * @returns definitions after scoped shadowing and restrictions, limited to the step's admission when given.
   */
  definitions(scope2, toolSet) {
    return toolSet === void 0 ? [...this.view(scope2).visible.values()] : [...toolSet.view(scope2).values()];
  }
  /**
   * Project visible definitions onto the allowlisted model-facing schema fields,
   * excluding execution and presentation callbacks.
   * @param scope - the viewing scope (the agent); omitted = the global view.
   * @param toolSet - step admission, or omitted for registered-definition inspection.
   * @returns one deep-cloned schema per visible tool.
   */
  schemas(scope2, toolSet) {
    return this.definitions(scope2, toolSet).map((definition) => projectToolSchema(definition, true));
  }
  /**
   * Provide the executor for the calling scope; an unscoped contribution is the deployment default.
   * Rendering any executor-owned section requires the viewing scope's selection to remain available.
   * @param executor - initialized provider owned by the contributing plugin.
   * @returns the effect disposer. Unloading leaves the selection unavailable until it is replaced.
   */
  setExecutor(executor) {
    const scope2 = scopeOf(this.ctx);
    const existing = scope2 === void 0 ? this.root : this.scoped.get(scope2);
    if (existing?.executor !== void 0) throw new Error("Only one tool executor may be registered in each scope");
    const record = { executor };
    return this.ctx.effect(function* () {
      for (const section of executor.sections ?? []) {
        yield this.ctx.systemPrompt.section({
          name: section.name,
          order: section.order,
          ...section.interpolate === void 0 ? {} : { interpolate: section.interpolate },
          text: ({ scope: scope3, toolSet }) => {
            if (this.selectExecutor(scope3) !== executor) return "";
            return typeof section.text === "function" ? section.text(this.definitions(scope3, toolSet)) : section.text;
          }
        });
      }
      if (scope2 === void 0) this.root = record;
      else this.scoped.set(scope2, record);
      yield () => {
        record.executor = void 0;
      };
    }.bind(this), "tools.setExecutor()");
  }
  /**
   * Resolve the nearest scoped provider, or the deployment default.
   * @param scope - Agent or preset scope; omitted selects only the root contribution.
   * @returns the selected executor; throws when it is missing or unloaded.
   */
  selectExecutor(scope2) {
    let record;
    for (const key of scopeChainOf(scope2)) {
      record = this.scoped.get(key);
      if (record !== void 0) break;
    }
    record ??= this.root;
    const executor = record?.executor;
    if (executor === void 0) throw new ToolExecutorUnavailableError();
    return executor;
  }
  /**
   * Delegate a raw call batch to its Agent's provider or the deployment default.
   * Select at dispatch; accepted batches settle through that provider even if it unloads.
   * @param input - original calls, optional owning Agent, and optional logging step.
   * @returns the selected executor's settled batch; unavailable selections reject.
   */
  async execute(input) {
    return this.selectExecutor(input.agent).execute(input);
  }
  /**
   * Register a monotonic denial in the calling scope.
   * @param guard - evaluated after extensible pre-execute policy by the shared pipeline.
   * @returns the effect disposer that removes this guard.
   */
  guard(guard) {
    return this.guards.effect(this.ctx, (layer) => layer.guards.append(guard), { label: "tools.guard()" });
  }
  /**
   * Check global and inherited guards after pre-execute policy and approval resolve.
   * @param exec - invocation whose guards are checked before dispatch.
   * @returns the first denial with its optional structured identity, or undefined when no guard denies.
   */
  checkGuards(exec) {
    for (const layer of [this.guards.global, ...this.guards.chainLayers(exec.agent)]) {
      for (const guard of layer.guards.values()) {
        const denial = guard(exec);
        if (denial !== void 0) return typeof denial === "string" ? { reason: denial } : denial;
      }
    }
    return void 0;
  }
};
var src_default = ToolsService;

// resources/third-party/dsh-runtime/packages/core/system-prompt/src/index.ts
var import_cordis3 = require("./cordis.cjs");
var import_schemastery2 = __toESM(require("./schemastery.cjs"), 1);
var SECTION_ORDERS = {
  HARNESS_IDENTITY: -1e3,
  DEPLOYMENT_PERSONA_PREFIX: 0,
  PLAN_POLICY: 500,
  TEAM_POLICY: 600,
  PTC_ONLY: 800,
  FILE_REFERENCE: 900,
  TOOL_BASH: 1e3,
  TOOL_PWSH: 1010,
  TOOL_READ: 1100,
  TOOL_WRITE: 1200,
  TOOL_EDIT: 1300,
  TOOL_APPLY_PATCH: 1350,
  TOOL_GLOB: 1400,
  TOOL_GREP: 1500,
  TOOL_JOBS: 1600,
  TOOL_PTY: 1700,
  TOOL_PTY_PANEL: 1710,
  TOOL_WEB_SEARCH: 2e3,
  TOOL_WEB_FETCH: 2100,
  TOOL_LSP: 2200,
  TOOL_SESSION_QUERY: 2300,
  TOOL_GOAL: 2400,
  TOOL_SCHEDULE: 2500,
  TOOL_WORKFLOW: 2600,
  TOOL_RALPH: 2700,
  TOOL_SUBAGENT: 2800,
  TOOL_REPORT: 2900,
  TOOL_COMPUTER_USE: 3e3,
  MCP_SERVERS: 3100,
  TOOLS_SDK: 5e3,
  DELIVERABLE_FILE_REFERENCES: 9e3,
  STRUCTURED_OUTPUT: 9900,
  // Local paths and endpoints follow reusable instructions.
  HARNESS_SOURCE: 1e4,
  WEB_SURFACE: 10100,
  DEPLOYMENT_PERSONA_SUFFIX: 10200
};
var CONTEXT_ORDERS = {
  WORKING_DIRECTORY: 100,
  SANDBOX_POLICY: 110,
  APPROVAL_POLICY: 115,
  SUBAGENT_DELEGATION: 120,
  // Process-specific paths and endpoints stay out of the cached system prompt.
  HARNESS_SOURCE: 200,
  WEB_SURFACE: 210
};
var PERSONA_PREFIX_SECTION = "deployment:persona-prefix";
var PERSONA_SUFFIX_SECTION = "deployment:persona-suffix";
var VARIABLE_NAME = /^[a-z][a-z0-9_]*$/;
var TOOL_ORDER_REST = "<unlisted-tools>";
function validateToolOrder(toolOrder) {
  if (toolOrder === void 0) return void 0;
  const seen = /* @__PURE__ */ new Set();
  for (const name of toolOrder) {
    if (seen.has(name)) throw new Error(`toolOrder lists "${name}" more than once`);
    seen.add(name);
  }
  if (!seen.has(TOOL_ORDER_REST)) {
    throw new Error(`toolOrder must contain the "${TOOL_ORDER_REST}" rest entry (where unlisted tools are inserted)`);
  }
  return toolOrder;
}
function orderTools(tools, toolOrder, knownNames) {
  const reserved = tools.find((tool) => tool.name === TOOL_ORDER_REST);
  if (reserved !== void 0) {
    throw new Error(`tool provider returned reserved tool name "${TOOL_ORDER_REST}" (reserved for toolOrder's rest entry)`);
  }
  if (toolOrder === void 0) return tools.sort(compareToolNames);
  const unknown = toolOrder.filter((name) => name !== TOOL_ORDER_REST && !knownNames.has(name));
  if (unknown.length > 0) {
    throw new Error(`toolOrder lists unregistered tool${unknown.length > 1 ? "s" : ""} ${unknown.map((name) => `"${name}"`).join(", ")}; known tools: ${[...knownNames].sort().join(", ") || "(none)"}`);
  }
  const listed = new Set(toolOrder);
  const rest = tools.filter((tool) => !listed.has(tool.name)).sort(compareToolNames);
  return toolOrder.flatMap((name) => name === TOOL_ORDER_REST ? rest : tools.filter((tool) => tool.name === name));
}
function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function comparePromptSections(a, b) {
  return a.order - b.order || compareNames(a.name, b.name);
}
function compareToolNames(a, b) {
  return compareNames(a.name, b.name);
}
function resolveContext(entry, context) {
  return {
    name: entry.name,
    text: typeof entry.text === "function" ? entry.text(context) : entry.text,
    ...entry.interpolate !== void 0 ? { interpolate: entry.interpolate } : {}
  };
}
var PromptLayer = class {
  sections;
  contexts;
  runtimeContextSuppressors = new AnonymousEntries();
  toolProviders = new AnonymousEntries();
  variables;
  /**
   * Create one prompt layer with diagnostics specific to its ownership scope.
   * @param scope - the scoped owner, or `undefined` for global registrations.
   */
  constructor(scope2) {
    this.sections = new NamedEntries((name) => new Error(scope2 === void 0 ? `prompt section "${name}" is already registered (for a per-agent override, register through that agent's \`agent.ctx\` instead)` : `prompt section "${name}" is already registered in this scope`));
    this.contexts = new NamedEntries((name) => new Error(scope2 === void 0 ? `prompt context "${name}" is already registered (for a per-agent override, register through that agent's \`agent.ctx\` instead)` : `prompt context "${name}" is already registered in this scope`));
    this.variables = new NamedEntries((name) => new Error(scope2 === void 0 ? `prompt variable "${name}" is already registered (for a per-agent value, register through that agent's \`agent.ctx\` instead)` : `prompt variable "${name}" is already registered in this scope`));
  }
  /** @returns whether this layer owns no prompt registrations. */
  isEmpty() {
    return this.sections.isEmpty() && this.contexts.isEmpty() && this.runtimeContextSuppressors.isEmpty() && this.toolProviders.isEmpty() && this.variables.isEmpty();
  }
};
var SystemPrompt = class extends import_cordis3.Service {
  static Config = import_schemastery2.default.object({
    includeHarnessIdentity: import_schemastery2.default.boolean().default(true),
    includeRuntimeContext: import_schemastery2.default.boolean().default(true),
    personaPrefix: import_schemastery2.default.string().default(""),
    personaSuffix: import_schemastery2.default.string().default(""),
    // Preserve omission because an explicit empty order lacks the rest marker.
    toolOrder: import_schemastery2.default.array(import_schemastery2.default.string()).default(void 0)
  });
  layers = new ScopedLayers(
    (scope2) => new PromptLayer(scope2),
    () => {
      this.ctx.emit("system-prompt/change");
    }
  );
  toolOrder;
  constructor(ctx, config) {
    super(ctx, "systemPrompt");
    this.toolOrder = validateToolOrder(config.toolOrder);
    if (config.includeHarnessIdentity ?? true) {
      this.section({
        name: "harness:identity",
        order: this.getSectionOrder("HARNESS_IDENTITY"),
        text: "You are an AI agent powered by DeepSeek Harness."
      });
    }
    this.section({
      name: PERSONA_PREFIX_SECTION,
      order: this.getSectionOrder("DEPLOYMENT_PERSONA_PREFIX"),
      // The fallback narrows the optional input type; the schema already defaults it.
      text: config.personaPrefix ?? ""
    });
    this.section({
      name: PERSONA_SUFFIX_SECTION,
      order: this.getSectionOrder("DEPLOYMENT_PERSONA_SUFFIX"),
      text: config.personaSuffix ?? ""
    });
    if (!(config.includeRuntimeContext ?? true)) this.suppressRuntimeContext();
  }
  /**
   * Register an ordered prompt section in the calling context's scope. A scoped
   * section shadows a global section with the same name; duplicates within one
   * layer and non-finite orders throw. Registration and disposal emit
   * `system-prompt/change`.
   * @param section - the section to register.
   * @returns the exact Cordis effect disposer.
   */
  section(section) {
    if (!Number.isFinite(section.order)) {
      throw new TypeError(`prompt section "${section.name}" order must be a finite number`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.sections.insert(section.name, section),
      { label: "systemPrompt.section()" }
    );
  }
  /**
   * Resolve the centrally owned placement of a repository prompt section.
   * @param name - stable section placement name.
   * @returns the section's numeric sort order.
   */
  getSectionOrder(name) {
    return SECTION_ORDERS[name];
  }
  /**
   * Resolve the centrally owned placement of a repository runtime context.
   * @param name - stable context placement name.
   * @returns the context's numeric sort order.
   */
  getContextOrder(name) {
    return CONTEXT_ORDERS[name];
  }
  /**
   * Register ordered dynamic context in the calling context's scope. Scoped
   * entries shadow global entries with the same name.
   * @param context - the context contribution to register.
   * @returns the exact Cordis effect disposer.
   */
  context(context) {
    if (!Number.isFinite(context.order)) {
      throw new TypeError(`prompt context "${context.name}" order must be a finite number`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.contexts.insert(context.name, context),
      { label: "systemPrompt.context()" }
    );
  }
  /**
   * Suppress optional dynamic runtime-context contributions in the calling
   * context's scope without changing the services that own or enforce those
   * facts. Multiple suppressors remain independently disposable.
   * @returns the exact Cordis effect disposer.
   */
  suppressRuntimeContext() {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.runtimeContextSuppressors.append(true),
      { label: "systemPrompt.suppressRuntimeContext()" }
    );
  }
  /**
   * Register a tool-schema provider in the calling context's scope. Global and
   * matching scoped providers both contribute; returning the reserved
   * {@link TOOL_ORDER_REST} name makes assembly fail.
   * @param provider - evaluated for each assembly with its context.
   * @returns the exact Cordis effect disposer.
   */
  tools(provider) {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.toolProviders.append(provider),
      { label: "systemPrompt.tools()" }
    );
  }
  /**
   * Register a prompt variable in the calling context's scope. Scoped values
   * shadow globals; invalid or duplicate names throw. A provider may return
   * `undefined`, but rendering a section that references that value then fails.
   * @param name - the `[a-z][a-z0-9_]*` reference name.
   * @param provider - evaluated for each assembly.
   * @returns the exact Cordis effect disposer.
   */
  variable(name, provider) {
    if (!VARIABLE_NAME.test(name)) {
      throw new Error(`invalid prompt variable name "${name}" (must match ${String(VARIABLE_NAME)})`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.variables.insert(name, provider),
      { label: "systemPrompt.variable()" }
    );
  }
  /**
   * Refresh accepted registered runtime facts for request admission. Contexts
   * added only by the assembly waterfall retain their accepted values. Current
   * suppression removes optional contexts, and missing required registrations
   * are restored in registry order. Sections, tools, and interpolation variables
   * retain the accepted assembly; their providers and waterfall do not rerun.
   * @param assembly - accepted assembly for this scope and step.
   * @param context - the same scope and current plugin-defined assembly fields.
   * @returns the accepted assembly with current runtime-context provider text.
   */
  refreshContext(assembly, context = {}) {
    const providers = this.layers.merge(context.scope, (layer) => layer.contexts);
    const suppressed = !this.layers.global.runtimeContextSuppressors.isEmpty() || this.layers.chainLayers(context.scope).some((layer) => !layer.runtimeContextSuppressors.isEmpty());
    const required = new Map([...providers].filter(([, entry]) => entry.required === true));
    const contexts = [];
    for (const accepted of assembly.contexts) {
      const provider = providers.get(accepted.name);
      required.delete(accepted.name);
      if (suppressed && provider?.required !== true) continue;
      contexts.push(provider === void 0 ? accepted : resolveContext(provider, context));
    }
    for (const provider of required.values()) {
      const index = contexts.findIndex((entry) => {
        const next = providers.get(entry.name);
        return next !== void 0 && next.order > provider.order;
      });
      contexts.splice(index < 0 ? contexts.length : index, 0, resolveContext(provider, context));
    }
    return { ...assembly, contexts };
  }
  /**
   * Assemble global and scoped providers, detach tool parameters, apply
   * canonical ordering, then run the presentation waterfall. Scoped sections
   * and variables shadow globals. The waterfall's text is authoritative except
   * that an effective complete section is restored afterwards as the sole
   * prompt section; tool declarations stay provider-owned.
   * @param context - the optional scope, step tool set, and plugin-defined assembly fields.
   * @returns the post-waterfall assembly with ordered tool declarations and any complete prompt enforced.
   */
  // Keep configuration failures on the declared asynchronous error path.
  async assemble(context = {}) {
    const scope2 = context.scope;
    const scopeLayers = this.layers.chainLayers(scope2);
    const runtimeContextSuppressed = !this.layers.global.runtimeContextSuppressors.isEmpty() || scopeLayers.some((layer) => !layer.runtimeContextSuppressors.isEmpty());
    const variables = {};
    for (const [name, provider] of this.layers.global.variables.entries()) {
      variables[name] = provider(context);
    }
    for (const layer of scopeLayers) {
      for (const [name, provider] of layer.variables.entries()) {
        variables[name] = provider(context);
      }
    }
    const sectionByName = this.layers.merge(scope2, (layer) => layer.sections);
    const contextByName = this.layers.merge(scope2, (layer) => layer.contexts);
    const providers = [
      ...this.layers.global.toolProviders.values(),
      ...scopeLayers.flatMap((layer) => [...layer.toolProviders.values()])
    ];
    const collected = [];
    const knownNames = /* @__PURE__ */ new Set();
    for (const provider of providers) {
      const result = provider(context);
      const schemas = result.schemas.map(({ name, description, parameters, deferLoading }) => ({
        name,
        description,
        parameters: structuredClone(parameters),
        ...deferLoading === true ? { deferLoading } : {}
      }));
      const acceptedKnownNames = result.knownNames ?? schemas.map((tool) => tool.name);
      collected.push(...schemas);
      for (const name of acceptedKnownNames) knownNames.add(name);
    }
    const sectionDefinitions = [...sectionByName.values()].sort(comparePromptSections);
    const completeSections = sectionDefinitions.filter((section) => section.complete === true);
    if (completeSections.length > 1) {
      throw new Error(`multiple complete prompt sections are active: ${completeSections.map((section) => JSON.stringify(section.name)).join(", ")}`);
    }
    let completeSection;
    const sections = sectionDefinitions.map((section) => {
      const assembled = {
        name: section.name,
        text: typeof section.text === "function" ? section.text(context) : section.text,
        ...section.interpolate !== void 0 ? { interpolate: section.interpolate } : {}
      };
      if (section.complete === true) completeSection = { ...assembled };
      return assembled;
    });
    const tools = orderTools(collected, this.toolOrder, knownNames);
    const assembly = {
      sections,
      contexts: [...contextByName.values()].filter((entry) => !runtimeContextSuppressed || entry.required === true).sort((a, b) => a.order - b.order).map((entry) => resolveContext(entry, context)),
      variables
    };
    const transformed = await this.ctx.waterfall(
      scopeTarget(this, scope2),
      "system-prompt/assemble",
      assembly,
      context,
      () => Promise.resolve(assembly)
    );
    if (completeSection === void 0 && !runtimeContextSuppressed) return { ...transformed, tools };
    const requiredContexts = new Set([...contextByName.values()].filter((entry) => entry.required === true).map((entry) => entry.name));
    return {
      ...transformed,
      tools,
      sections: completeSection === void 0 ? transformed.sections : [completeSection],
      contexts: runtimeContextSuppressed ? transformed.contexts.filter((entry) => requiredContexts.has(entry.name)) : transformed.contexts
    };
  }
};

// resources/third-party/dsh-runtime/vendor/loader/src/index.ts
var import_cordis8 = require("./cordis.cjs");

// resources/third-party/dsh-runtime/vendor/cosmokit/src/misc.ts
function isNullable(value) {
  return value === null || value === void 0;
}
function isNonNullable(value) {
  return !isNullable(value);
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, { writable: true, value, enumerable: false });
}

// resources/third-party/dsh-runtime/vendor/cosmokit/src/volatile.ts
var write = Symbol.for("cosmokit.volatile.write");
function isVolatile(value) {
  return typeof value === "object" && value !== null && write in value;
}
function volatileEntries(value) {
  const ancestors = /* @__PURE__ */ new Set();
  function visit(value2, path2) {
    if (isVolatile(value2)) return [{ path: path2, ref: value2 }];
    if (!value2 || typeof value2 !== "object" || ancestors.has(value2)) return [];
    if (!Array.isArray(value2) && Object.getPrototypeOf(value2) !== Object.prototype && Object.getPrototypeOf(value2) !== null) return [];
    ancestors.add(value2);
    try {
      return Object.entries(value2).flatMap(([key, child]) => visit(child, [...path2, key]));
    } finally {
      ancestors.delete(value2);
    }
  }
  return visit(value, []);
}
function updateVolatile(target, source) {
  ;
  target[write](source.get());
}

// resources/third-party/dsh-runtime/vendor/cosmokit/src/types.ts
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
((Binary2) => {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) {
      return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    } else {
      return source;
    }
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") {
      return Buffer.from(source).toString("base64");
    }
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) {
      buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    }
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function deepEqual(a, b, strict) {
  const ancestors = /* @__PURE__ */ new Set();
  function compare(a2, b2) {
    if (a2 === b2) return true;
    if (isVolatile(a2) || isVolatile(b2)) return isVolatile(a2) && isVolatile(b2);
    if (!strict && isNullable(a2) && isNullable(b2)) return true;
    if (typeof a2 !== typeof b2 || typeof a2 !== "object" || !a2 || !b2) return false;
    if (ancestors.has(a2)) return false;
    function check(test, then) {
      return test(a2) ? test(b2) ? then(a2, b2) : false : test(b2) ? false : void 0;
    }
    ancestors.add(a2);
    try {
      return check(Array.isArray, (a3, b3) => {
        if (a3.length !== b3.length) return false;
        for (let index = 0; index < a3.length; index++) {
          if (!compare(a3[index], b3[index])) return false;
        }
        return true;
      }) ?? check(is("Date"), (a3, b3) => a3.valueOf() === b3.valueOf()) ?? check(is("URL"), (a3, b3) => a3.href === b3.href) ?? check(is("RegExp"), (a3, b3) => a3.source === b3.source && a3.flags === b3.flags) ?? check(isArrayBufferLike, (a3, b3) => {
        if (a3.byteLength !== b3.byteLength) return false;
        const viewA = new Uint8Array(a3);
        const viewB = new Uint8Array(b3);
        for (let i = 0; i < viewA.length; i++) {
          if (viewA[i] !== viewB[i]) return false;
        }
        return true;
      }) ?? ((!strict || [a2, b2].every((value) => Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) && Object.keys({ ...a2, ...b2 }).every((key) => compare(a2[key], b2[key])));
    } finally {
      ancestors.delete(a2);
    }
  }
  return compare(a, b);
}

// resources/third-party/dsh-runtime/vendor/cosmokit/src/time.ts
var Time;
((Time2) => {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
    if (typeof date === "number") date = new Date(date);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date) {
    const parsed = parseTime(date);
    if (parsed) {
      date = Date.now() + parsed;
    } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
    }
    return date ? new Date(date) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) {
      return Math.round(ms / Time2.day) + "d";
    } else if (abs >= Time2.hour - Time2.minute / 2) {
      return Math.round(ms / Time2.hour) + "h";
    } else if (abs >= Time2.minute - Time2.second / 2) {
      return Math.round(ms / Time2.minute) + "m";
    } else if (abs >= Time2.second) {
      return Math.round(ms / Time2.second) + "s";
    }
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// resources/third-party/dsh-runtime/vendor/loader/src/internal.ts
var import_node_module = require("node:module");
var ModuleLoader;
((ModuleLoader2) => {
  let _cachedLoader;
  function requireInternal(id) {
    const require2 = (0, import_node_module.createRequire)(__dshModuleUrl);
    if (process.execArgv.includes("--expose-internals")) {
      try {
        return require2(id);
      } catch {
      }
    }
    try {
      return require2("node-addon-require-builtin").requireBuiltin(id);
    } catch {
    }
  }
  function fromInternal() {
    if (_cachedLoader) return _cachedLoader;
    const [major] = process.versions.node.split(".").map(Number);
    if (major < 22) return;
    const raw = requireInternal("internal/modules/esm/loader")?.getOrInitializeCascadedLoader();
    if (!raw) return;
    const version = typeof raw.getOrCreateModuleJob === "function" ? "v2" : typeof raw.getModuleJobForImport === "function" ? "v1" : void 0;
    if (!version) return;
    return _cachedLoader = Object.assign(raw, { version });
  }
  ModuleLoader2.fromInternal = fromInternal;
})(ModuleLoader || (ModuleLoader = {}));

// resources/third-party/dsh-runtime/vendor/loader/src/config/entry.ts
var import_cordis6 = require("./cordis.cjs");

// resources/third-party/dsh-runtime/vendor/loader/src/config/group.ts
var import_cordis5 = require("./cordis.cjs");

// resources/third-party/dsh-runtime/vendor/loader/src/config/tree.ts
var import_cordis4 = require("./cordis.cjs");

// resources/third-party/dsh-runtime/vendor/loader/src/resolve.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_url = __toESM(require("node:url"), 1);
var HELPER_FILES = {
  ".gitignore": "# created by cordis automatically\n*\n",
  // The one-argument form of `import.meta.resolve` anchors on this file, so
  // resolution happens in the project scope. A resolve call also survives a
  // bundling host, which transforms modules inside its root and redirects the
  // `import()` in them to its own resolver.
  "resolve.mjs": "export default (specifier) => import.meta.resolve(specifier)\n"
};
var cache = /* @__PURE__ */ Object.create(null);
function findScope(dir) {
  while (true) {
    if (import_node_fs.default.existsSync(import_node_path.default.join(dir, "package.json"))) return dir;
    const parent = import_node_path.default.dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
}
function resolveScope(baseUrl) {
  if (!baseUrl) return;
  let dir;
  try {
    dir = import_node_url.default.fileURLToPath(new URL(".", baseUrl));
  } catch {
    return;
  }
  return findScope(import_node_path.default.resolve(dir));
}
async function write2(filename, content) {
  const temp = `${filename}.${process.pid}`;
  await import_promises.default.writeFile(temp, content);
  await import_promises.default.rename(temp, filename);
}
async function _createResolve(scope2) {
  const dir = import_node_path.default.join(scope2, ".cordis");
  try {
    await import_promises.default.mkdir(dir, { recursive: true });
    for (const [name, content] of Object.entries(HELPER_FILES)) {
      await write2(import_node_path.default.join(dir, name), content);
    }
  } catch {
    return;
  }
  const helperUrl = import_node_url.default.pathToFileURL(import_node_path.default.join(dir, "resolve.mjs")).href;
  return (await import(
    /* @vite-ignore */
    helperUrl
  )).default;
}
async function createResolve(baseUrl) {
  const scope2 = resolveScope(baseUrl);
  if (!scope2) return;
  return await (cache[scope2] ??= _createResolve(scope2));
}

// resources/third-party/dsh-runtime/vendor/loader/src/config/tree.ts
function members(entry) {
  const { tree } = entry.parent;
  const result = [entry];
  const group = entry.subgroup;
  if (group?.tree !== tree) return result;
  for (const options of group.data) {
    const member = tree.store[options.id];
    if (member?.parent === group) result.push(...members(member));
  }
  return result;
}
var EntryTree = class _EntryTree {
  static sep = ":";
  ctx;
  enableLogs;
  root;
  store = /* @__PURE__ */ Object.create(null);
  constructor(ctx) {
    this.ctx = ctx.extend({ baseUrl: ctx.baseUrl });
    this.root = new EntryGroup(this.ctx, this);
    const entry = this.ctx.fiber.entry;
    if (entry) entry.subtree = this;
  }
  get context() {
    return this.ctx;
  }
  /** Iterate entries in this tree and any nested subtrees. */
  *entries() {
    for (const entry of Object.values(this.store)) {
      yield entry;
      if (!entry.subtree) continue;
      yield* entry.subtree.entries();
    }
  }
  /** Return pending import and lifecycle tasks owned by this tree. */
  getTasks() {
    return [...this.entries()].map((entry) => entry._initTask || entry.fiber?.inertia).filter(isNonNullable);
  }
  /** Wait until this tree has no pending import or lifecycle tasks. */
  async await() {
    while (true) {
      const tasks = this.getTasks();
      if (!tasks.length) return;
      await Promise.allSettled(tasks);
    }
  }
  /**
   * Assign a random tree-local id when `options.id` is absent. Explicit ids
   * may contain `EntryTree.sep`; `resolve()` and `resolveGroup()` cannot
   * address such entries by nested path.
   * @param options - Entry options; a generated id is written to `options.id`.
   * @returns The existing or generated id.
   */
  ensureId(options) {
    if (!options.id) {
      do {
        options.id = Math.random().toString(16).slice(2, 10);
      } while (this.store[options.id]);
    }
    return options.id;
  }
  /** Resolve an entry by id, including nested ids separated by `EntryTree.sep`. */
  resolve(id) {
    const parts = id.split(_EntryTree.sep);
    let tree = this;
    const final = parts.pop();
    for (const part of parts) {
      tree = tree.store[part]?.subtree;
      if (!tree) throw new Error(`cannot resolve entry ${id}`);
    }
    const entry = tree.store[final];
    if (!entry) throw new Error(`cannot resolve entry ${id}`);
    return entry;
  }
  resolveGroup(id) {
    if (!id) return this.root;
    const entry = this.resolve(id);
    if (!entry.subgroup) throw new Error(`entry ${id} is not a group`);
    return entry.subgroup;
  }
  /** Create an entry in the root group or a nested group. */
  async create(options, parent = null, position = Infinity) {
    const group = this.resolveGroup(parent);
    const id = group.tree.ensureId(options);
    group.data.splice(position, 0, options);
    group.tree.commit({ id, group, options });
    return group.create(options);
  }
  /** Stop and remove an entry from its parent group. */
  remove(id) {
    const entry = this.resolve(id);
    const group = entry.parent;
    const legacy = entry.options;
    group.remove(legacy.id);
    group.tree.commit({ id: legacy.id, group, legacy });
  }
  /** Update an entry and optionally move it to another group. */
  async update(id, options, parent, position) {
    const entry = this.resolve(id);
    const source = entry.parent;
    const legacy = { ...entry.options };
    if (parent !== void 0) {
      const target = this.resolveGroup(parent);
      const moved = target.tree === source.tree ? [] : members(entry);
      for (const member of moved) {
        const { id: id2 } = member.options;
        if (target.tree.store[id2]) throw new Error(`entry ${id2} already exists in the target tree`);
      }
      source.unlink(entry.options);
      target.data.splice(position ?? Infinity, 0, entry.options);
      entry.parent = target;
      for (const member of moved) {
        delete source.tree.store[member.options.id];
        target.tree.store[member.options.id] = member;
        if (member.subgroup?.tree === source.tree) member.subgroup.tree = target.tree;
      }
    }
    const task = entry.update(options, false, true);
    if (entry.parent.tree !== source.tree) {
      source.tree.commit({ id: legacy.id, group: source, legacy });
      entry.parent.tree.commit({ id: legacy.id, group: entry.parent, options: entry.options });
    } else {
      const from = entry.parent === source ? void 0 : source;
      entry.parent.tree.commit({ id: legacy.id, group: entry.parent, from, options: entry.options, legacy });
    }
    return task;
  }
  /** Import a plugin module from a specifier or `cordis:` builtin. */
  import(name, getOuterStack) {
    if (name.startsWith("cordis:")) {
      return this.ctx.loader.builtins[name.slice(7)];
    }
    return (0, import_cordis4.composeError)(async (info) => {
      info.offset += 3;
      if (this.ctx.loader.internal) {
        return await this.ctx.loader.internal.import(name, this.ctx.baseUrl, {});
      } else if (name.startsWith(".")) {
        return await import(
          /* @vite-ignore */
          new URL(name, this.ctx.baseUrl).href
        );
      } else {
        const resolve = await createResolve(this.ctx.baseUrl);
        const url2 = resolve ? resolve(name) : name;
        return await import(
          /* @vite-ignore */
          url2
        );
      }
    }, getOuterStack);
  }
};

// resources/third-party/dsh-runtime/vendor/loader/src/config/group.ts
var EntryGroup = class {
  constructor(ctx, tree) {
    this.ctx = ctx;
    this.tree = tree;
    const entry = ctx.fiber.entry;
    if (entry) entry.subgroup = this;
  }
  static key = Symbol.for("cordis.group");
  data = [];
  get context() {
    return this.ctx;
  }
  async create(options) {
    const id = this.tree.ensureId(options);
    const entry = this.tree.store[id] ??= new Entry2(this.ctx.loader);
    entry.parent = this;
    await entry.update(options, true, true);
    return entry.id;
  }
  unlink(options) {
    const config = this.data;
    const index = config.indexOf(options);
    if (index >= 0) config.splice(index, 1);
  }
  remove(id, isDispose = false) {
    const entry = this.tree.store[id];
    if (!entry || entry.parent !== this) return;
    delete this.tree.store[id];
    entry.fiber?.dispose();
    if (!isDispose) {
      this.unlink(entry.options);
    }
    this.context.emit("loader/partial-dispose", entry, entry.options, false);
  }
  async update(config) {
    const oldConfig = this.data;
    this.data = config;
    const oldMap = Object.fromEntries(oldConfig.map((options) => [options.id, options]));
    const newMap = Object.fromEntries(config.map((options) => [options.id ?? Symbol("anonymous"), options]));
    const ids = Reflect.ownKeys({ ...oldMap, ...newMap });
    await Promise.all(ids.map(async (id) => {
      if (newMap[id]) {
        await this.create(newMap[id]).catch((error) => {
          this.ctx.logger.error(error);
        });
      } else {
        this.remove(id);
      }
    }));
  }
  stop() {
    for (const options of this.data) {
      this.remove(options.id, true);
    }
  }
};
var Group = class extends EntryGroup {
  constructor(ctx, config) {
    super(ctx, ctx.fiber.entry.parent.tree);
    this.ctx = ctx;
    this.config = config;
    ctx.on("internal/update", (config2) => this.update(config2));
  }
  static initial = [];
  static [EntryGroup.key] = true;
  async *[import_cordis5.Service.init]() {
    yield () => this.stop();
    await this.update(this.config);
  }
};

// resources/third-party/dsh-runtime/vendor/loader/src/config/utils.ts
var evaluate = new Function("ctx", "expr", `
  with (ctx) {
    return eval(expr)
  }
`);
function interpolate(ctx, value) {
  if (isJsExpr(value)) {
    return evaluate(ctx, value.__jsExpr);
  } else if (!value || typeof value !== "object") {
    return value;
  } else if (Array.isArray(value)) {
    return value.map((item) => interpolate(ctx, item));
  } else {
    return mapValues(value, (item) => interpolate(ctx, item));
  }
}
function isJsExpr(value) {
  return value instanceof Object && "__jsExpr" in value;
}

// resources/third-party/dsh-runtime/vendor/loader/src/config/diff.ts
function isSchemastery(schema) {
  return schema?.["~standard"].vendor === "schemastery";
}
function isRecord(value) {
  if (!value || typeof value !== "object" || isJsExpr(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function equal(a, b, schema, ancestors) {
  if (schema?.meta?.volatile) return true;
  if (schema?.type !== "object" || !schema.dict || ancestors.has(schema)) return deepEqual(a, b, true);
  const left = a ?? schema.meta?.default;
  const right = b ?? schema.meta?.default;
  if (!isRecord(left) || !isRecord(right)) return deepEqual(left, right, true);
  const { dict } = schema;
  ancestors.add(schema);
  try {
    return Object.keys({ ...left, ...right }).every(
      (key) => equal(left[key], right[key], Object.hasOwn(dict, key) ? dict[key] : void 0, ancestors)
    );
  } finally {
    ancestors.delete(schema);
  }
}
function equalExceptVolatile(previous, next, schema) {
  return isSchemastery(schema) ? equal(previous, next, schema, /* @__PURE__ */ new Set()) : deepEqual(previous, next, true);
}

// resources/third-party/dsh-runtime/vendor/loader/src/config/entry.ts
function takeEntries(object, keys) {
  const result = [];
  for (const key of keys) {
    if (!(key in object)) continue;
    result.push([key, object[key]]);
    delete object[key];
  }
  return result;
}
function sortKeys(object, prepend = ["id", "name"], append = ["config"]) {
  const part1 = takeEntries(object, prepend);
  const part2 = takeEntries(object, append);
  const rest = takeEntries(object, Object.keys(object)).sort(([a], [b]) => a.localeCompare(b));
  return Object.assign(object, Object.fromEntries([...part1, ...rest, ...part2]));
}
var Entry2 = class _Entry {
  constructor(loader) {
    this.loader = loader;
    this.ctx = loader.ctx.extend({ [_Entry.key]: this });
    this.context.emit("loader/entry-init", this);
  }
  static key = Symbol.for("cordis.entry");
  ctx;
  fiber;
  /** Raw import result before export normalization; HMR updates it after a successful reload. */
  moduleNamespace;
  parent;
  // safety: call `entry.update()` immediately after creating an entry
  options = {};
  subgroup;
  subtree;
  _initTask;
  get context() {
    return this.ctx;
  }
  get id() {
    let id = this.options.id;
    if (this.parent.tree.ctx.fiber.entry) {
      id = this.parent.tree.ctx.fiber.entry.id + EntryTree.sep + id;
    }
    return id;
  }
  /** True when this entry or any owning parent entry is disabled. */
  get disabled() {
    if (this.options.group) return false;
    let entry = this;
    do {
      if (this._resolveDisabled(entry.options)) return true;
      entry = entry.parent.ctx.fiber.entry;
    } while (entry);
    return false;
  }
  /**
   * Effective disabled state: a `!!js` expression evaluates against the loader
   * context. The raw node stays in the options, so write-back keeps the form.
   */
  _resolveDisabled(options) {
    return isJsExpr(options.disabled) ? Boolean(this.evaluate(options.disabled.__jsExpr)) : Boolean(options.disabled);
  }
  evaluate(expr) {
    return evaluate(this.ctx, expr);
  }
  async _patchContext(diff) {
    await this.context.waterfall("loader/patch-context", this, async () => {
      Object.setPrototypeOf(this.ctx, this.parent.ctx);
      if (this.fiber?.uid && (diff.includes("config") || this.options.group)) {
        const fiber = this.fiber.ctx.fiber;
        for (const name of Object.keys(fiber.inject)) fiber._checkImpl(name);
        await fiber.update(this.options.config, true);
      }
    });
  }
  async refresh() {
    if (this.fiber) return;
    if (this.disabled) return;
    await this.init();
  }
  /** Merge new options, restart as needed, and persist through the parent tree. */
  async update(options, create = false, force = false) {
    const legacy = { ...this.options };
    if (create) {
      this.options = options;
    } else {
      for (const [key, value] of Object.entries(options)) {
        if (isNullable(value)) {
          delete this.options[key];
        } else {
          this.options[key] = value;
        }
      }
    }
    sortKeys(this.options);
    if (this.disabled) {
      await this.fiber?.dispose();
      return;
    }
    if (this.fiber?.uid) {
      const changes = Object.keys({ ...this.options, ...legacy }).filter((key) => !deepEqual(this.options[key], legacy[key], key === "config"));
      const volatileOnly = changes.length === 1 && changes[0] === "config" && this.fiber.state === import_cordis6.FiberState.ACTIVE && Object.getPrototypeOf(this.ctx) === this.parent.ctx && equalExceptVolatile(legacy.config, this.options.config, this.fiber.runtime?.Config);
      if (volatileOnly) this.fiber.rawConfig = this.options.config;
      const pending = volatileOnly && this._commitVolatile() ? [] : changes;
      if (!pending.length && !force) return;
      this.context.emit("loader/partial-dispose", this, legacy, true);
      await this._patchContext(pending);
    } else {
      await this.init();
    }
  }
  /**
   * Parse a volatile-only raw config change and commit its values into the running fiber's references.
   * An invalid candidate is logged and leaves the running references unchanged; the raw config stays retained for the next activation.
   * @returns `false` when an ordinary effective value changed, so the caller applies the ordinary update lifecycle.
   */
  _commitVolatile() {
    const fiber = this.fiber.ctx.fiber;
    const refs = volatileEntries(fiber.effectiveConfig);
    if (!refs.length) return true;
    const raw = this.options.config;
    let candidate;
    try {
      candidate = fiber.resolveConfig(raw);
    } catch (error) {
      this.ctx.logger.warn("volatile config update failed for %C", this.options.id);
      this.ctx.logger.warn(error);
      return true;
    }
    if (!deepEqual(fiber.effectiveConfig, candidate, true)) {
      this.ctx.logger.debug("ordinary config values of %C changed with its volatile values; applying the ordinary update", this.options.id);
      return false;
    }
    const paths = refs.flatMap(({ path: path2, ref }) => {
      const source = path2.reduce((value, key) => Reflect.get(value, key), candidate);
      if (deepEqual(ref.get(), source.get(), true)) return [];
      updateVolatile(ref, source);
      return [path2];
    });
    if (!paths.length) return true;
    const self = Object.create(fiber.ctx);
    self[import_cordis6.Context.filter] = (owner) => owner.fiber === fiber;
    try {
      fiber.ctx.emit(self, "loader/volatile-update", paths);
    } catch (error) {
      this.ctx.logger.warn(error);
    }
    return true;
  }
  getOuterStack = () => {
    let entry = this;
    const result = [];
    do {
      result.push(`    at ${entry.parent.tree.ctx.baseUrl}#${entry.options.id}`);
      entry = entry.parent.ctx.fiber.entry;
    } while (entry);
    return result;
  };
  /** Import and start the configured plugin if it is not already running. */
  async init() {
    try {
      await (this._initTask ??= this._init());
    } finally {
      this._initTask = void 0;
    }
    this.fiber?.await().catch(() => {
    }).finally(() => {
      if (this.loader.getTasks().length) return;
      this.ctx.reflect.notify(["loader"]);
    });
  }
  async _init() {
    let moduleNamespace;
    try {
      moduleNamespace = await this.parent.tree.import(this.options.name, this.getOuterStack);
    } catch (error) {
      this.ctx.logger.error(error);
      return;
    }
    const plugin = this.loader.unwrapExports(moduleNamespace);
    await this._patchContext([]);
    this.loader.showLog(this, "apply");
    this.fiber = this.ctx.registry.plugin(plugin, this.options.config, this.getOuterStack);
    this.moduleNamespace = moduleNamespace;
  }
};

// resources/third-party/dsh-runtime/vendor/loader/src/config/isolate.ts
var import_cordis7 = require("./cordis.cjs");
function swap(target, source) {
  for (const key of Reflect.ownKeys(target)) {
    Reflect.deleteProperty(target, key);
  }
  for (const key of Reflect.ownKeys(source || {})) {
    Reflect.defineProperty(target, key, Reflect.getOwnPropertyDescriptor(source, key));
  }
}
var Realm = class {
  store = /* @__PURE__ */ Object.create(null);
  access(key, create = false) {
    if (create) {
      return this.store[key] ??= Symbol(`${key}${this.suffix}`);
    } else {
      return this.store[key] ?? Symbol(`${key}${this.suffix}`);
    }
  }
  delete(key) {
    delete this.store[key];
  }
  get size() {
    return Object.keys(this.store).length;
  }
};
var LocalRealm = class extends Realm {
  constructor(entry) {
    super();
    this.entry = entry;
  }
  get suffix() {
    return "#" + this.entry.options.id;
  }
};
var GlobalRealm = class extends Realm {
  constructor(label) {
    super();
    this.label = label;
  }
  get suffix() {
    return "@" + this.label;
  }
};
function isolate(ctx) {
  const realms = /* @__PURE__ */ Object.create(null);
  const delims = /* @__PURE__ */ Object.create(null);
  function access(entry, name, create = false) {
    let realm;
    const label = entry.options.isolate?.[name];
    if (!label) return;
    if (label === true) {
      realm = entry.realm ??= new LocalRealm(entry);
    } else if (create) {
      realm = realms[label] ??= new GlobalRealm(label);
    } else {
      realm = realms[label];
    }
    return realm?.access(name, create);
  }
  ctx.on("loader/entry-init", (entry) => {
    entry.ctx[import_cordis7.Context.intercept] = Object.create(entry.ctx[import_cordis7.Context.intercept]);
    entry.ctx[import_cordis7.Context.isolate] = Object.create(entry.ctx[import_cordis7.Context.isolate]);
  });
  ctx.on("loader/patch-context", async (entry, next) => {
    const newMap = Object.create(entry.parent.ctx[import_cordis7.Context.isolate]);
    for (const name of Object.keys(entry.options.isolate ?? {})) {
      newMap[name] = access(entry, name, true);
    }
    const diff = /* @__PURE__ */ Object.create(null);
    const oldMap = entry.ctx[import_cordis7.Context.isolate];
    for (const name in { ...newMap, ...delims }) {
      if (newMap[name] === oldMap[name]) continue;
      const delim = delims[name] ??= Symbol(`delim:${name}`);
      entry.ctx[delim] = Symbol(`${name}#${entry.id}`);
      for (const symbol of [oldMap[name], newMap[name]]) {
        const impl = symbol && entry.ctx.reflect.store[symbol];
        if (!impl) continue;
        const fiber = impl.ctx.fiber;
        if (!fiber) {
          entry.ctx.logger.warn(new Error(`expected service ${name} to be implemented`));
          continue;
        }
        diff[name] = [oldMap[name], newMap[name], entry.ctx[delim], fiber.ctx[delim]];
        if (entry.ctx[delim] !== fiber.ctx[delim]) break;
      }
    }
    Object.setPrototypeOf(entry.ctx[import_cordis7.Context.isolate], entry.parent.ctx[import_cordis7.Context.isolate]);
    Object.setPrototypeOf(entry.ctx[import_cordis7.Context.intercept], entry.parent.ctx[import_cordis7.Context.intercept]);
    swap(entry.ctx[import_cordis7.Context.isolate], newMap);
    swap(entry.ctx[import_cordis7.Context.intercept], entry.options.intercept);
    await next();
    for (const [symbol1, symbol2, flag1, flag2] of Object.values(diff)) {
      const impl = entry.ctx.reflect.store[symbol1];
      if (flag1 === flag2 && impl && !entry.ctx.reflect.store[symbol2]) {
        entry.ctx.reflect.store[symbol2] = impl;
        delete entry.ctx.reflect.store[symbol1];
        impl.isolate = symbol2;
      }
    }
    ctx.reflect.notify(Object.keys(diff), (ctx2, name) => {
      const [symbol1, symbol2, flag1, flag2] = diff[name];
      const symbol3 = ctx2[import_cordis7.Context.isolate][name];
      const flag3 = ctx2[delims[name]];
      return (symbol1 === symbol3 || symbol2 === symbol3) && flag1 === flag3 !== (flag1 === flag2);
    });
    for (const name in delims) {
      if (!Reflect.ownKeys(newMap).includes(name)) {
        delete entry.ctx[delims[name]];
      }
    }
  });
  ctx.on("loader/partial-dispose", (entry, legacy, active) => {
    for (const [name, label] of Object.entries(legacy.isolate ?? {})) {
      if (label === true) continue;
      if (active && entry.options.isolate?.[name] === label) continue;
      const realm = realms[label];
      if (!realm) continue;
      for (const entry2 of ctx.loader.entries()) {
        if (entry2.options.isolate?.[name] === realm.label) return;
      }
      realm.delete(name);
      if (!realm.size) {
        delete realms[realm.label];
      }
    }
  });
}

// resources/third-party/dsh-runtime/vendor/loader/src/index.ts
var Loader2 = class extends EntryTree {
  constructor(ctx, config = {}) {
    super(ctx);
    this.config = config;
    if (config.baseUrl) {
      this.ctx.baseUrl = config.baseUrl;
    }
    const self = this;
    defineProperty(this, import_cordis8.Service.tracker, {
      associate: "loader",
      property: "ctx",
      noShadow: true
    });
    ctx.reflect.provide("loader", this, this[import_cordis8.Service.check]);
    ctx.on("internal/config", (fiber, next) => {
      const config2 = next();
      if (!fiber.entry || fiber.parent.fiber?.entry === fiber.entry) return config2;
      if (fiber.runtime?.callback[EntryGroup.key]) return config2;
      return interpolate(fiber.ctx, config2);
    });
    ctx.on("internal/commit", (fiber, config2) => {
      if (!fiber.entry || fiber.parent.fiber?.entry === fiber.entry) return;
      const schema = fiber.runtime?.Config;
      const unparse = schema?.["simplify"];
      const { entry } = fiber;
      const legacy = { ...entry.options };
      entry.options.config = unparse ? unparse.call(schema, config2) : config2;
      entry.parent.tree.commit({ id: entry.options.id, group: entry.parent, options: entry.options, legacy });
    });
    ctx.on("internal/update", function(config2, next) {
      if (!this.entry || this.parent.fiber?.entry === this.entry) return next();
      self.showLog(this.entry, "reload");
      return next();
    }, { global: true });
    ctx.on("internal/plugin", (fiber) => {
      if (fiber.parent[Entry2.key] && !fiber.entry) {
        fiber.entry = fiber.parent[Entry2.key];
        import_cordis8.Inject.resolve(fiber.entry.options.inject, fiber.inject);
      }
      if (fiber.uid) return;
      if (!fiber.entry) return;
      if (fiber.parent.fiber?.entry === fiber.entry) return;
      if (!ctx.registry.has(fiber.runtime.callback)) return;
      if (!fiber.entry.parent.tree.ctx.fiber.uid) return;
      const { entry } = fiber;
      this.showLog(entry, "unload");
      if (fiber.parent.fiber.state === import_cordis8.FiberState.UNLOADING) return;
      if (entry.parent.tree.store[entry.options.id] !== entry) return;
      if (entry.disabled) return;
      const legacy = { ...entry.options };
      entry.options.disabled = true;
      entry.parent.tree.commit({ id: entry.options.id, group: entry.parent, options: entry.options, legacy });
    });
    ctx.plugin(isolate);
  }
  envData = process.env.CORDIS_SHARED ? JSON.parse(process.env.CORDIS_SHARED) : { startTime: Date.now() };
  name = "loader";
  internal = ModuleLoader.fromInternal();
  builtins = /* @__PURE__ */ Object.create(null);
  commit(_change) {
  }
  [import_cordis8.Service.check]() {
    const config = import_cordis8.Service.prototype[import_cordis8.Service.resolveIntercept].call(this);
    if (config.await && this.getTasks().length) return false;
    return true;
  }
  showLog(entry, type) {
    if (entry.options.group || !entry.parent.tree.enableLogs) return;
    this.ctx[import_cordis8.Context.root].logger?.("loader").info("%s plugin %C", type, entry.options.name);
  }
  /** Return the loader entry id that owns `fiber`, if any. */
  locate(fiber = this.ctx.fiber) {
    while (1) {
      if (fiber.entry) return fiber.entry.id;
      const next = fiber.parent.fiber;
      if (fiber === next) return;
      fiber = next;
    }
  }
  /** Hook for hosts that can restart the process on full-reload requests. */
  exit() {
  }
  /** Normalize ESM/CJS/default export shapes before applying a plugin. */
  unwrapExports(exports2) {
    if (isNullable(exports2)) return exports2;
    exports2 = exports2.default ?? exports2;
    if (!exports2.__esModule) return exports2;
    return exports2.default ?? exports2;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Loader,
  SystemPrompt,
  scope,
  tools
});
