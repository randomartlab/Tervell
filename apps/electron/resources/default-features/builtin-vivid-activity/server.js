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

// resources/third-party/default-features/vivid-activity/index.server.ts
var index_server_exports = {};
__export(index_server_exports, {
  default: () => contribute
});
module.exports = __toCommonJS(index_server_exports);

// resources/third-party/default-features/vivid-activity/server/i18n-server.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_promises = require("node:fs/promises");
var import_node_os = require("node:os");
var import_node_path = require("node:path");

// resources/third-party/default-features/vivid-activity/shared/locales/kit/zh-CN.json
var kitText = {
  listSeparator: "\u3001"
};
var kitLazy = {
  mismatch: "{label}\u754C\u9762\u4E0E\u63D2\u4EF6\u7248\u672C\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5\u540E\u518D\u6253\u5F00",
  invalidPart: "\u754C\u9762\u5206\u7247\u65E0\u6548\uFF0C\u8BF7\u91CD\u8BD5",
  updated: "\u754C\u9762\u7248\u672C\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u8BD5\u6216\u91CD\u65B0\u8FDE\u63A5",
  versionMismatch: "\u754C\u9762\u7248\u672C\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5",
  failed: "{label}\u52A0\u8F7D\u5931\u8D25\uFF1A{error}",
  retry: "\u91CD\u8BD5",
  loading: "\u6B63\u5728\u52A0\u8F7D{label}\u2026"
};
var zh_CN_default = {
  $meta: {
    name: "\u7B80\u4F53\u4E2D\u6587"
  },
  kitText,
  kitLazy,
  kitUi: {
    remove: "\u79FB\u9664 {label}",
    collapse: "\u6536\u8D77 {title}",
    expand: "\u5C55\u5F00 {title}",
    dismiss: "\u5173\u95ED\u63D0\u793A",
    loading: "\u52A0\u8F7D\u4E2D",
    search: "\u641C\u7D22",
    clearSearch: "\u6E05\u9664\u641C\u7D22",
    metaSeparator: " \xB7 ",
    syncLive: "\u5DF2\u540C\u6B65",
    syncSyncing: "\u540C\u6B65\u4E2D",
    syncStale: "\u53EF\u80FD\u5DF2\u8FC7\u65F6",
    syncError: "\u540C\u6B65\u5931\u8D25"
  },
  kitTime: {
    justNow: "\u521A\u521A",
    minutesAgo: "{count} \u5206\u949F\u524D",
    hoursAgo: "{count} \u5C0F\u65F6\u524D",
    todayAt: "\u4ECA\u5929 {time}",
    yesterdayAt: "\u6628\u5929 {time}",
    months: "1|2|3|4|5|6|7|8|9|10|11|12",
    monthDay: "{month}\u6708{day}\u65E5",
    yearMonthDay: "{year}\u5E74{month}\u6708{day}\u65E5",
    seconds: "{count} \u79D2",
    minutes: "{count} \u5206",
    minutesSeconds: "{minutes} \u5206 {seconds} \u79D2",
    hours: "{count} \u5C0F\u65F6",
    hoursMinutes: "{hours} \u5C0F\u65F6 {minutes} \u5206"
  },
  kitSend: {
    message: "\u6D88\u606F",
    send: "\u53D1\u9001",
    sendAnyway: "\u4ECD\u7136\u53D1\u9001",
    interruptAndSend: "\u4E2D\u65AD\u5E76\u53D1\u9001",
    archived: "\u8FD9\u4E2A Agent \u5DF2\u5F52\u6863",
    unavailable: "\u8FD9\u4E2A Agent \u5DF2\u4E0D\u53EF\u7528",
    outOfBandNote: "\u8FD9\u6761\u547D\u4EE4\u7531\u5BBF\u4E3B\u5355\u72EC\u6267\u884C\uFF0C\u4E0D\u6253\u65AD\u5F53\u524D\u56DE\u5408\uFF0C\u4E5F\u4E0D\u5F71\u54CD\u5F85\u5BA1\u6279",
    maybeOutOfBandNote: "\u8FD9\u6761\u547D\u4EE4\u53EF\u80FD\u5355\u72EC\u6267\u884C\uFF0C\u4E5F\u53EF\u80FD\u4E2D\u65AD\u5F53\u524D\u56DE\u5408",
    maybeOutOfBandConfirm: "\u5F00\u542F\u4E86\u76EE\u6807\u529F\u80FD\u7684 Codex \u4F1A\u5728\u5F53\u524D\u56DE\u5408\u65C1\u8FB9\u5355\u72EC\u6267\u884C /goal\uFF0C\u4E0D\u6253\u65AD\u4E5F\u4E0D\u52A8\u5BA1\u6279\uFF1B\u6CA1\u5F00\u542F\u65F6\uFF0C\u53D1\u9001\u8FD9\u6761{what}\u4F1A\u4E2D\u65AD\u5B83\u5F53\u524D\u7684\u56DE\u5408\u3002\u4ECD\u7136\u53D1\u9001\u5417\uFF1F",
    maybeOutOfBandConfirmApproval: "\u5F00\u542F\u4E86\u76EE\u6807\u529F\u80FD\u7684 Codex \u4F1A\u5728\u5F53\u524D\u56DE\u5408\u65C1\u8FB9\u5355\u72EC\u6267\u884C /goal\uFF0C\u4E0D\u6253\u65AD\u4E5F\u4E0D\u52A8\u5BA1\u6279\uFF1B\u6CA1\u5F00\u542F\u65F6\uFF0C\u53D1\u9001\u8FD9\u6761{what}\u4F1A\u4E2D\u65AD\u5B83\u5F53\u524D\u7684\u56DE\u5408\uFF0C\u5E76\u53D6\u6D88\u8FD9\u6B21\u5BA1\u6279\u8BF7\u6C42\u3002\u4ECD\u7136\u53D1\u9001\u5417\uFF1F",
    waitingNote: "Agent \u6B63\u5728\u7B49\u4F60\u5BA1\u6279\uFF0C\u53D1\u9001\u4F1A\u53D6\u6D88\u8FD9\u6B21\u5BA1\u6279",
    waitingSteerConfirm: "Agent \u6B63\u5728\u7B49\u4F60\u5BA1\u6279\u3002\u53D1\u9001\u540E\u8FD9\u6761{what}\u4F1A\u63D2\u8FDB\u5F53\u524D\u56DE\u5408\uFF0C\u540C\u65F6\u53D6\u6D88\u8FD9\u6B21\u5BA1\u6279\u8BF7\u6C42\uFF0C\u7B49\u5F85\u6279\u51C6\u7684\u64CD\u4F5C\u4E0D\u4F1A\u6267\u884C\u3002\u4ECD\u7136\u53D1\u9001\u5417\uFF1F",
    waitingConfirm: "Agent \u6B63\u5728\u7B49\u4F60\u5BA1\u6279\u3002\u53D1\u9001\u8FD9\u6761{what}\u4F1A\u4E2D\u65AD\u5F53\u524D\u56DE\u5408\uFF0C\u5E76\u53D6\u6D88\u8FD9\u6B21\u5BA1\u6279\u8BF7\u6C42\uFF0C\u7B49\u5F85\u6279\u51C6\u7684\u64CD\u4F5C\u4E0D\u4F1A\u6267\u884C\u3002\u4ECD\u7136\u53D1\u9001\u5417\uFF1F",
    steerNote: "\u8FD0\u884C\u4E2D\uFF0C\u63D2\u8FDB\u5F53\u524D\u56DE\u5408\uFF0C\u4E0D\u6253\u65AD",
    slashBlockedNote: "\u8FD0\u884C\u4E2D\uFF0C\u8FD9\u6761\u547D\u4EE4\u4E0D\u80FD\u63D2\u8BDD",
    slashBlockedConfirm: "\u8FD9\u4E2A Agent \u6B63\u5728\u8FD0\u884C\u3002\u8FD9\u6761\u547D\u4EE4\u4E0D\u80FD\u63D2\u8FDB\u5F53\u524D\u56DE\u5408\uFF0C\u53D1\u9001{what}\u4F1A\u4E2D\u65AD\u5B83\u5F53\u524D\u7684\u56DE\u5408\u3002\u4ECD\u7136\u53D1\u9001\u5417\uFF1F",
    noSteerNote: "\u8FD0\u884C\u4E2D\uFF0C\u8FD9\u4E2A Agent \u4E0D\u652F\u6301\u63D2\u8BDD",
    noSteerConfirm: "\u8FD9\u4E2A Agent \u6B63\u5728\u8FD0\u884C\u4E14\u4E0D\u652F\u6301\u63D2\u8BDD\uFF0C\u53D1\u9001{what}\u4F1A\u4E2D\u65AD\u5B83\u5F53\u524D\u7684\u56DE\u5408\u3002\u4ECD\u7136\u53D1\u9001\u5417\uFF1F",
    errorNote: "Agent \u4E0A\u4E00\u8F6E\u51FA\u9519\u4E86",
    closedNote: "\u4F1A\u8BDD\u672A\u8F7D\u5165\uFF0C\u53D1\u9001\u65F6\u4F1A\u81EA\u52A8\u8F7D\u5165",
    maybeDelivered: "\u4E0A\u4E00\u6B21\u53D1\u9001\u7684\u7ED3\u679C\u4E0D\u786E\u5B9A\uFF0C\u53EF\u80FD\u5DF2\u7ECF\u9001\u8FBE\u3002\u8BF7\u5148\u6253\u5F00\u4F1A\u8BDD\u770B\u4E00\u4E0B\uFF0C\u4E0D\u8981\u76F4\u63A5\u91CD\u53D1\u3002",
    changed: "Agent \u7684\u72B6\u6001\u53D8\u4E86\uFF0C\u8FD9\u6761\u6D88\u606F\u9700\u8981\u91CD\u65B0\u786E\u8BA4\u540E\u518D\u53D1\u3002",
    failed: "\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"
  },
  kitDeferred: {
    afterApprovalLabel: "\u7B49\u5BA1\u6279\u5904\u7406\u5B8C\u518D\u53D1",
    afterApprovalNote: "\u4E0D\u52A8\u8FD9\u6B21\u5BA1\u6279\uFF0C\u7B49\u4F60\u5904\u7406\u5B8C\u3001\u8FD9\u4E00\u8F6E\u7ED3\u675F\u540E\u81EA\u52A8\u53D1\u9001",
    afterTurnLabel: "\u7B49\u8FD9\u4E00\u8F6E\u7ED3\u675F\u518D\u53D1",
    afterTurnNote: "\u4E0D\u6253\u65AD\u5F53\u524D\u56DE\u5408\uFF0C\u7B49\u5B83\u8FD9\u4E00\u8F6E\u7ED3\u675F\u540E\u81EA\u52A8\u53D1\u9001",
    queued: "\u6392\u961F\u4E2D",
    held: "\u5F85\u786E\u8BA4",
    sending: "\u53D1\u9001\u4E2D",
    sent: "\u5DF2\u9001\u8FBE",
    maybeSent: "\u53EF\u80FD\u5DF2\u9001\u8FBE",
    canceled: "\u5DF2\u53D6\u6D88",
    discarded: "\u672A\u53D1\u9001",
    expired: "\u5DF2\u8FC7\u671F"
  },
  kitDeferredServer: {
    queued: "\u5DF2\u6392\u961F\uFF0C\u7B49 Agent \u8FD9\u4E00\u8F6E\u7ED3\u675F\u3001\u6CA1\u6709\u5F85\u5BA1\u6279\u65F6\u81EA\u52A8\u53D1\u9001",
    scheduled: "\u5B9A\u65F6\u53D1\u9001\uFF1A\u5230\u70B9\u540E\uFF0C\u7B49 Agent \u8FD9\u4E00\u8F6E\u7ED3\u675F\u3001\u6CA1\u6709\u5F85\u5BA1\u6279\u65F6\u81EA\u52A8\u53D1\u9001",
    sending: "\u6B63\u5728\u53D1\u9001",
    movedOn: "\u6392\u961F\u4E4B\u540E\u4F1A\u8BDD\u91CC\u53C8\u6709\u4E86\u65B0\u6D88\u606F\uFF0C\u8FD8\u8981\u53D1\u5417\uFF1F",
    unsure: "\u6392\u961F\u4E4B\u540E\u4F1A\u8BDD\u6709\u4E86\u53D8\u5316\uFF0C\u5206\u4E0D\u6E05\u662F\u4E0D\u662F\u522B\u4EBA\u53D1\u7684\u6D88\u606F\uFF0C\u8FD8\u8981\u53D1\u5417\uFF1F",
    unknown: "\u6CA1\u6536\u5230\u53D1\u9001\u7ED3\u679C\uFF0C\u53EF\u80FD\u5DF2\u7ECF\u9001\u8FBE\u3002\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u4F1A\u5148\u67E5\u4F1A\u8BDD\u8BB0\u5F55\uFF1A\u5DF2\u7ECF\u6709\u8FD9\u6761\u5C31\u4E0D\u518D\u53D1\uFF0C\u6CA1\u6709\u624D\u91CD\u53D1\uFF1B\u4E5F\u53EF\u4EE5\u53D6\u6D88\u3002",
    failed: "\u53D1\u9001\u5931\u8D25\uFF1A{error}\u3002\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u4F1A\u5148\u67E5\u4F1A\u8BDD\u8BB0\u5F55\uFF0C\u786E\u8BA4\u6CA1\u6709\u8FD9\u6761\u624D\u91CD\u53D1\uFF1B\u4E5F\u53EF\u4EE5\u53D6\u6D88\u3002",
    failedRepeatedly: "\u591A\u6B21\u53D1\u9001\u5931\u8D25\uFF1A{error}\u3002\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u4F1A\u5148\u67E5\u4F1A\u8BDD\u8BB0\u5F55\uFF0C\u786E\u8BA4\u6CA1\u6709\u8FD9\u6761\u624D\u91CD\u53D1\uFF1B\u4E5F\u53EF\u4EE5\u53D6\u6D88\u3002",
    stopped: "\u63D2\u4EF6\u91CD\u65B0\u52A0\u8F7D\u4E86\uFF0C\u8FD9\u6761\u6D88\u606F\u6CA1\u6709\u53D1\u51FA\u3002\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u4F1A\u5728 Agent \u7A7A\u95F2\u65F6\u53D1\u9001\uFF0C\u4E5F\u53EF\u4EE5\u53D6\u6D88\u3002",
    settling: "\u4E0A\u4E00\u6B21\u53D1\u9001\u53EF\u80FD\u8FD8\u5728\u8FDB\u884C\uFF0C\u4F1A\u8BDD\u91CC\u6682\u65F6\u8FD8\u6CA1\u6709\u8FD9\u6761\u3002\u8FC7\u4E24\u5206\u949F\u518D\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u3002",
    unreadable: "\u8BFB\u4E0D\u5230\u4F1A\u8BDD\u8BB0\u5F55\uFF0C\u6CA1\u6CD5\u786E\u8BA4\u4E0A\u4E00\u6B21\u6709\u6CA1\u6709\u9001\u8FBE\uFF0C\u8BF7\u7A0D\u540E\u518D\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u3002",
    cannotTell: "\u4F1A\u8BDD\u8BB0\u5F55\u592A\u957F\uFF0C\u6CA1\u6CD5\u786E\u8BA4\u4E0A\u4E00\u6B21\u6709\u6CA1\u6709\u9001\u8FBE\u3002\u8BF7\u6253\u5F00\u4F1A\u8BDD\u770B\u4E00\u4E0B\uFF1A\u786E\u8BA4\u6CA1\u6709\u8FD9\u6761\uFF0C\u5C31\u53D6\u6D88\u5B83\u518D\u91CD\u65B0\u53D1\u9001\u3002",
    strangers: "\u4F1A\u8BDD\u91CC\u6709\u5206\u4E0D\u6E05\u6765\u6E90\u7684\u6D88\u606F\uFF08\u53EF\u80FD\u662F\u4ECE\u5386\u53F2\u8BB0\u5F55\u91CD\u5EFA\u7684\uFF09\uFF0C\u6CA1\u6CD5\u786E\u8BA4\u4E0A\u4E00\u6B21\u6709\u6CA1\u6709\u9001\u8FBE\u3002\u8BF7\u6253\u5F00\u4F1A\u8BDD\u770B\u4E00\u4E0B\uFF1A\u786E\u8BA4\u6CA1\u6709\u8FD9\u6761\uFF0C\u5C31\u53D6\u6D88\u5B83\u518D\u91CD\u65B0\u53D1\u9001\u3002",
    late: "\u8FD9\u6B21\u6CA1\u6765\u5F97\u53CA\u786E\u8BA4 Agent \u7684\u72B6\u6001\uFF0C\u6CA1\u6709\u53D1\u9001\u3002\u8BF7\u518D\u70B9\u4E00\u6B21\u3002",
    sent: "\u5DF2\u9001\u8FBE",
    found: "\u5DF2\u9001\u8FBE\uFF08\u5728\u4F1A\u8BDD\u8BB0\u5F55\u91CC\u627E\u5230\u4E86\u8FD9\u6761\u6D88\u606F\uFF09",
    foundSame: "\u4F1A\u8BDD\u91CC\u5DF2\u7ECF\u6709\u540C\u6837\u5185\u5BB9\u7684\u6D88\u606F\uFF0C\u6CA1\u6709\u518D\u53D1\uFF08\u4F1A\u8BDD\u8BB0\u5F55\u4E0D\u5E26\u6D88\u606F\u7F16\u53F7\uFF0C\u5206\u4E0D\u6E05\u662F\u4E0D\u662F\u8FD9\u4E00\u6B21\u53D1\u7684\uFF09",
    maybeSent: "\u53D1\u9001\u7ED3\u679C\u4E0D\u786E\u5B9A\uFF0C\u53EF\u80FD\u5DF2\u7ECF\u9001\u8FBE\uFF0C\u8BF7\u6253\u5F00\u4F1A\u8BDD\u770B\u4E00\u4E0B",
    canceledUnknown: "\u5DF2\u53D6\u6D88\uFF0C\u6CA1\u6709\u518D\u53D1\uFF1B\u4E4B\u524D\u90A3\u4E00\u6B21\u53EF\u80FD\u5DF2\u7ECF\u9001\u8FBE",
    canceledFailed: "\u5DF2\u53D6\u6D88\uFF0C\u4E0D\u518D\u91CD\u8BD5",
    canceled: "\u5DF2\u53D6\u6D88\uFF0C\u6CA1\u6709\u53D1\u9001",
    discarded: "Agent \u5DF2\u5F52\u6863\u6216\u4E0D\u5B58\u5728\uFF0C\u6CA1\u6709\u53D1\u9001",
    expired: "\u6392\u961F\u8D85\u8FC7\u4E00\u5929\uFF0C\u5DF2\u653E\u5F03\u53D1\u9001",
    expiredScheduled: "\u5B9A\u65F6\u53D1\u9001\u5230\u70B9\u540E\u4E00\u5929\u5185\u90FD\u6CA1\u80FD\u53D1\u51FA\uFF0C\u5DF2\u653E\u5F03\u53D1\u9001",
    busy: "\u6B63\u5728\u7ED9\u8FD9\u4E2A Agent \u53D1\u9001\u53E6\u4E00\u6761\u6D88\u606F\uFF0C\u8FD9\u6761\u6CA1\u6709\u53D1\u9001\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    gone: "\u8FD9\u4E2A Agent \u5DF2\u5F52\u6863\u6216\u4E0D\u5B58\u5728\uFF0C\u6CA1\u6709\u53D1\u9001\u3002",
    refused: "{reason}\uFF0C\u6CA1\u6709\u53D1\u9001\u3002",
    refusedAfterTry: "{reason}\uFF1B\u4E4B\u524D\u5DF2\u7ECF\u53D1\u51FA\u8FC7\u4E00\u6B21\uFF0C\u6CA1\u786E\u8BA4\u662F\u5426\u9001\u8FBE\uFF0C\u4E0D\u4F1A\u518D\u53D1\u3002\u8BF7\u6253\u5F00\u4F1A\u8BDD\u770B\u4E00\u4E0B\u3002",
    guardUnknown: "\u6CA1\u80FD\u786E\u8BA4\u8FD9\u6761\u6D88\u606F\u8FD8\u9002\u7528\uFF08{error}\uFF09\uFF0C\u6CA1\u6709\u53D1\u9001\u3002",
    guardUnknownBusy: "\u6CA1\u80FD\u786E\u8BA4\u8FD9\u6761\u6D88\u606F\u8FD8\u9002\u7528\uFF08{error}\uFF09\uFF0C\u6CA1\u6709\u53D1\u9001\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    guardHeld: "\u6CA1\u80FD\u786E\u8BA4\u8FD9\u6761\u6D88\u606F\u8FD8\u9002\u7528\uFF08{error}\uFF09\uFF0C\u6CA1\u6709\u53D1\u9001\u3002\u70B9\u300C\u4ECD\u7136\u53D1\u9001\u300D\u4F1A\u518D\u68C0\u67E5\u4E00\u6B21\uFF1B\u4E5F\u53EF\u4EE5\u53D6\u6D88\u3002",
    lockBusy: "\u62FF\u4E0D\u5230\u53D1\u9001\u9501\uFF08\u9501\u6587\u4EF6\u4E0D\u80FD\u7528\uFF09\uFF0C\u6CA1\u6709\u53D1\u9001\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    lockHeld: "\u62FF\u4E0D\u5230\u53D1\u9001\u9501\uFF08\u9501\u6587\u4EF6\u4E0D\u80FD\u7528\uFF09\uFF0C\u6CA1\u6709\u53D1\u9001\u3002\u53EF\u4EE5\u91CD\u8BD5\u6216\u53D6\u6D88\u3002",
    lockUnusable: "\u9501\u6587\u4EF6\u4E0D\u53EF\u7528",
    noStart: "Agent \u5728 {seconds} \u79D2\u5185\u6CA1\u6709\u5F00\u59CB\u8FD9\u4E00\u8F6E",
    otherRun: "Agent \u6B63\u5728\u8FD0\u884C\u53E6\u4E00\u8F6E",
    finishingTurn: "Agent \u8FD8\u5728\u7ED3\u675F\u4E0A\u4E00\u8F6E",
    notFound: "\u627E\u4E0D\u5230\u8FD9\u4E2A Agent",
    timeout: "\u7B49\u5F85\u5BBF\u4E3B\u56DE\u5E94\u8D85\u65F6",
    disconnected: "\u548C\u5BBF\u4E3B\u7684\u8FDE\u63A5\u65AD\u4E86",
    hostSaid: "\u5BBF\u4E3B\u8FD4\u56DE\uFF1A{text}",
    unknownError: "\u672A\u77E5\u9519\u8BEF",
    notConnected: "\u63D2\u4EF6\u8FD8\u6CA1\u6709\u8FDE\u4E0A daemon\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    empty: "\u6D88\u606F\u662F\u7A7A\u7684\u3002",
    tooLong: "\u6D88\u606F\u592A\u957F\uFF0C\u4E0D\u80FD\u53D1\u9001\u3002",
    tooLongToQueue: "\u6D88\u606F\u592A\u957F\uFF0C\u4E0D\u80FD\u6392\u961F\u53D1\u9001\u3002",
    tooFarAhead: "\u5B9A\u65F6\u53D1\u9001\u6700\u591A\u6392\u5230 7 \u5929\u4EE5\u540E\u3002",
    badSchedule: "\u5B9A\u65F6\u53D1\u9001\u7684\u65F6\u95F4\u65E0\u6548\u3002",
    goneCannotQueue: "\u8FD9\u4E2A Agent \u5DF2\u5F52\u6863\u6216\u4E0D\u5B58\u5728\uFF0C\u4E0D\u80FD\u6392\u961F\u53D1\u9001\u3002",
    tooLateToCancel: "\u8FD9\u6761\u6D88\u606F\u6B63\u5728\u53D1\u9001\uFF0C\u6765\u4E0D\u53CA\u53D6\u6D88\u4E86\u3002",
    readTimelineTimeout: "\u8BFB\u53D6\u4F1A\u8BDD\u8BB0\u5F55\u8D85\u65F6",
    readAgentTimeout: "\u8BFB\u53D6 Agent \u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    noGuardCheck: "\u63D2\u4EF6\u6CA1\u6709\u68C0\u67E5\u8FD9\u4E2A\u6761\u4EF6",
    checkTimeout: "\u68C0\u67E5\u8D85\u65F6",
    tooManyQueued: "\u6392\u961F\u7684\u6D88\u606F\u592A\u591A\u4E86\uFF0C\u8BF7\u5148\u5904\u7406\u6389\u4E00\u4E9B\u3002",
    tooManyForAgent: "\u7ED9\u8FD9\u4E2A Agent \u6392\u961F\u7684\u6D88\u606F\u592A\u591A\u4E86\uFF0C\u8BF7\u5148\u5904\u7406\u6389\u4E00\u4E9B\u3002",
    movedOnScheduled: "\u8FD9\u662F\u5B9A\u65F6\u6D88\u606F\uFF1A\u5230\u70B9\u65F6\u53D1\u73B0\u6392\u961F\u4E4B\u540E\u4F1A\u8BDD\u91CC\u53C8\u6709\u4E86\u65B0\u6D88\u606F\uFF0C\u8FD8\u8981\u53D1\u5417\uFF1F",
    unsureScheduled: "\u8FD9\u662F\u5B9A\u65F6\u6D88\u606F\uFF1A\u5230\u70B9\u65F6\u53D1\u73B0\u6392\u961F\u4E4B\u540E\u4F1A\u8BDD\u6709\u4E86\u53D8\u5316\uFF0C\u5206\u4E0D\u6E05\u662F\u4E0D\u662F\u522B\u4EBA\u53D1\u7684\u6D88\u606F\uFF0C\u8FD8\u8981\u53D1\u5417\uFF1F"
  },
  kitLanguage: {
    title: "\u8BED\u8A00",
    label: "\u754C\u9762\u8BED\u8A00",
    hint: "\u8FD9\u4E2A\u63D2\u4EF6\u754C\u9762\u91CC\u7684\u6587\u5B57\u3002\u8DDF\u968F\u7CFB\u7EDF\u65F6\u6309\u8BBE\u5907\u8BED\u8A00\u9009\u62E9\uFF0C\u6CA1\u6709\u8FD9\u79CD\u8BED\u8A00\u5C31\u7528\u82F1\u6587\u3002",
    auto: "\u8DDF\u968F\u7CFB\u7EDF\uFF08{name}\uFF09",
    custom: "{name}\uFF08\u81EA\u5B9A\u4E49\uFF0C{percent}%\uFF09",
    customOverride: "{name}\uFF08\u542B\u4F60\u7684\u4FEE\u6539\uFF09",
    folderLabel: "\u6DFB\u52A0\u5176\u4ED6\u8BED\u8A00",
    folderHint: "\u628A\u7FFB\u8BD1\u6587\u4EF6\u653E\u8FDB {folder}\uFF0C\u6587\u4EF6\u540D\u7528\u8BED\u8A00\u4EE3\u7801\uFF0C\u5982 ko.json\u3002\u53EF\u4EE5\u4ECE templates/en.json \u6216 templates/zh-CN.json \u590D\u5236\u4E00\u4EFD\u518D\u7FFB\u8BD1\uFF1B\u6CA1\u7FFB\u8BD1\u7684\u6761\u76EE\u663E\u793A\u82F1\u6587\u3002",
    rescanLabel: "\u6539\u8FC7\u8BED\u8A00\u6587\u4EF6\u540E",
    rescan: "\u91CD\u65B0\u8BFB\u53D6",
    issuesLabel: "{file} \u91CC\u6709\u95EE\u9898",
    loading: "\u6B63\u5728\u8BFB\u53D6\u53EF\u7528\u7684\u8BED\u8A00\u2026",
    loadFailed: "\u8BFB\u4E0D\u5230\u53EF\u7528\u7684\u8BED\u8A00\uFF1A{error}",
    saveFailed: "\u6CA1\u80FD\u4FDD\u5B58\uFF1A{error}",
    issueNotObject: "\u6587\u4EF6\u5185\u5BB9\u4E0D\u662F JSON \u5BF9\u8C61\u3002",
    issueNotSection: "\u300C{id}\u300D\u4E0D\u662F\u4E00\u7EC4\u6587\u6848\u3002",
    issueUnknownMessage: "\u300C{id}\u300D\u4E0D\u662F\u8FD9\u4E2A\u63D2\u4EF6\u7684\u6587\u6848\uFF08\u5DF2\u5FFD\u7565\uFF09\u3002",
    issueBadShape: '\u300C{id}\u300D\u5FC5\u987B\u662F\u6587\u5B57\uFF0C\u6216\u5E26 "other" \u7684\u5355\u590D\u6570\u5F62\u5F0F\u3002',
    issueTooLong: "\u300C{id}\u300D\u592A\u957F\uFF0C\u6216\u542B\u6709\u63A7\u5236\u5B57\u7B26\u3002",
    issueBadPlaceholder: "\u300C{id}\u300D\u7528\u4E86 {detail}\uFF0C\u8FD9\u6761\u6587\u6848\u6CA1\u6709\u8FD9\u4E9B\u5360\u4F4D\u7B26\u3002",
    issueLink: "\u8FD9\u4E2A\u6587\u4EF6\u662F\u94FE\u63A5\uFF0C\u8BF7\u628A\u6587\u4EF6\u672C\u8EAB\u653E\u8FDB\u6765\u3002",
    issueOpen: "\u6253\u4E0D\u5F00\u8FD9\u4E2A\u6587\u4EF6\uFF08{detail}\uFF09\u3002",
    issueNotFile: "\u8FD9\u4E0D\u662F\u666E\u901A\u6587\u4EF6\u3002",
    issueTooBig: "\u6587\u4EF6\u8D85\u8FC7 2 MB\u3002",
    issueBadJson: "\u4E0D\u662F\u6709\u6548\u7684 JSON\uFF1A{detail}"
  }
};

// resources/third-party/default-features/vivid-activity/shared/i18n.ts
var SOURCE_LANGUAGE = "zh-CN";
var FALLBACK_LANGUAGE = "en";
var PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];
var META_SECTION = "$meta";
var FORMS_LANGUAGE = "$language";
var IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;
var PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
var hasOwn = (value, name) => Object.prototype.hasOwnProperty.call(value, name);
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function isPluralForms(value) {
  if (!isObject(value) || !hasOwn(value, "other")) return false;
  const names = Object.keys(value);
  return names.every((name) => (PLURAL_CATEGORIES.includes(name) || name === FORMS_LANGUAGE) && typeof value[name] === "string");
}
var formTexts = (forms) => Object.keys(forms).filter((name) => name !== FORMS_LANGUAGE).map((name) => forms[name]);
var isMessage = (value) => typeof value === "string" || isPluralForms(value);
function splitId(id) {
  const at = id.indexOf(".");
  if (at <= 0) return null;
  const section = id.slice(0, at), name = id.slice(at + 1);
  return IDENTIFIER.test(section) && IDENTIFIER.test(name) ? [section, name] : null;
}
function lookup(catalog, id) {
  const at = id.indexOf(".");
  if (at <= 0) return void 0;
  const section = id.slice(0, at), name = id.slice(at + 1);
  if (section === META_SECTION || !hasOwn(catalog, section)) return void 0;
  const entries = catalog[section];
  if (!isObject(entries) || !hasOwn(entries, name)) return void 0;
  const message = entries[name];
  return isMessage(message) ? message : void 0;
}
function catalogIds(catalog) {
  const ids = [];
  for (const section of Object.keys(catalog)) {
    const entries = catalog[section];
    if (section === META_SECTION || !IDENTIFIER.test(section) || !isObject(entries)) continue;
    for (const name of Object.keys(entries)) if (IDENTIFIER.test(name) && isMessage(entries[name])) ids.push(`${section}.${name}`);
  }
  return ids;
}
function catalogName(catalog) {
  const meta = catalog && hasOwn(catalog, META_SECTION) ? catalog[META_SECTION] : void 0;
  const name = isObject(meta) ? meta.name : void 0;
  return typeof name === "string" && name.trim() ? name.trim().slice(0, 60) : void 0;
}
var pluralRules = /* @__PURE__ */ new Map();
function makePluralRule(language3) {
  try {
    const rules = new Intl.PluralRules(language3);
    if (typeof rules.select(1) === "string") return (count2) => rules.select(count2);
  } catch {
  }
  const primary = language3.split("-")[0].toLowerCase();
  if (["zh", "ja", "ko", "vi", "th", "id", "ms", "lo", "my", "km", "yue"].includes(primary)) return () => "other";
  if (primary === "fr" || primary === "pt") return (count2) => count2 < 2 ? "one" : "other";
  return (count2) => count2 === 1 ? "one" : "other";
}
function pluralCategory(language3, count2) {
  if (!Number.isFinite(count2)) return "other";
  let rule = pluralRules.get(language3);
  if (!rule) {
    rule = makePluralRule(language3);
    pluralRules.set(language3, rule);
  }
  return rule(Math.abs(count2));
}
function pickForm(message, params, language3) {
  if (typeof message === "string") return message;
  const category = pluralCategory(message[FORMS_LANGUAGE] ?? language3, Number(params?.count));
  return hasOwn(message, category) ? message[category] : message.other;
}
var paramText = (value) => value === void 0 || value === null ? "" : String(value);
function format(message, params, language3 = SOURCE_LANGUAGE) {
  const text2 = pickForm(message, params, language3);
  if (!params || text2.indexOf("{") < 0) return text2;
  return text2.replace(PLACEHOLDER, (whole, name) => hasOwn(params, name) ? paramText(params[name]) : whole);
}
function placeholdersOf(message) {
  const texts = typeof message === "string" ? [message] : formTexts(message);
  const names = /* @__PURE__ */ new Set();
  for (const text2 of texts) for (const match of text2.match(PLACEHOLDER) ?? []) names.add(match.slice(1, -1));
  return Array.from(names).sort();
}
var LANGUAGE_SUBTAG = /^[A-Za-z0-9]{1,8}$/;
function normalizeLanguage(tag2) {
  if (typeof tag2 !== "string") return "";
  const parts = tag2.trim().replace(/_/g, "-").split(/[.@]/)[0].split("-");
  const kept = [];
  for (const part of parts) {
    if (part.length === 1 && kept.length) break;
    if (!LANGUAGE_SUBTAG.test(part)) return "";
    kept.push(part);
  }
  if (!kept.length || !/^[A-Za-z]{2,3}$/.test(kept[0]) || kept.length > 4) return "";
  return kept.map((part, index) => {
    if (index === 0) return part.toLowerCase();
    if (part.length === 4 && /^[A-Za-z]+$/.test(part)) return part[0].toUpperCase() + part.slice(1).toLowerCase();
    if (part.length === 2 && /^[A-Za-z]+$/.test(part)) return part.toUpperCase();
    return part.toLowerCase();
  }).join("-");
}
var isTraditionalChinese = (tag2) => /-(Hant|TW|HK|MO)(-|$)/i.test(tag2);
function matchLanguage(wanted, available) {
  const tag2 = normalizeLanguage(wanted);
  if (!tag2) return null;
  const lower = tag2.toLowerCase();
  const exact = available.find((code) => code.toLowerCase() === lower);
  if (exact) return exact;
  const parts = tag2.split("-"), primary = parts[0];
  const candidates = available.filter((code) => code.split("-")[0].toLowerCase() === primary);
  if (!candidates.length) return null;
  if (primary === "zh") {
    const traditional = isTraditionalChinese(tag2);
    return candidates.find((code) => isTraditionalChinese(code) === traditional) ?? candidates[0];
  }
  const region = parts.length > 1 ? parts[parts.length - 1] : "";
  const sameRegion = region.length === 2 ? candidates.find((code) => code.split("-").includes(region)) : void 0;
  return sameRegion ?? candidates.find((code) => !code.includes("-")) ?? candidates[0];
}
function resolveLanguage(setting, device3, available) {
  if (setting && setting !== "auto") {
    const chosen = matchLanguage(setting, available);
    if (chosen) return chosen;
  }
  const fromDevice = device3 ? matchLanguage(device3, available) : null;
  if (fromDevice) return fromDevice;
  return available.includes(FALLBACK_LANGUAGE) ? FALLBACK_LANGUAGE : available[0] ?? FALLBACK_LANGUAGE;
}
function assembleCatalog(layers, ids, options = {}) {
  const out = {};
  const wanted = ids ?? Array.from(new Set(layers.flatMap(catalogIds)));
  for (const id of wanted) {
    let message, from = -1;
    for (let index = 0; index < layers.length; index++) {
      message = lookup(layers[index], id);
      if (message !== void 0) {
        from = index;
        break;
      }
    }
    const split = splitId(id);
    if (message === void 0 || !split) continue;
    const source = options.languages?.[from];
    if (typeof message !== "string" && source && options.language && source !== options.language && !message[FORMS_LANGUAGE]) message = { ...message, [FORMS_LANGUAGE]: source };
    const section = out[split[0]] ?? (out[split[0]] = {});
    section[split[1]] = message;
  }
  return out;
}
var MESSAGE_LIMIT = 4e3;
var ISSUE_LIMIT = 20;
var CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;
var shown = (value) => value.replace(/[^\x20-\x7e]/g, "?").slice(0, 60);
function checkCatalog(input, reference) {
  const ids = catalogIds(reference);
  const result = { catalog: {}, translated: 0, total: ids.length, unknown: 0, invalid: 0, issues: [] };
  const note = (issue) => {
    if (result.issues.length < ISSUE_LIMIT) result.issues.push(issue);
  };
  if (!isObject(input)) {
    note({ code: "notObject" });
    return result;
  }
  result.name = catalogName(input);
  const out = {};
  for (const section of Object.keys(input)) {
    if (section === META_SECTION) continue;
    const entries = input[section];
    const known = hasOwn(reference, section) && isObject(reference[section]);
    if (!isObject(entries)) {
      result.invalid += 1;
      note({ code: "notSection", id: shown(section) });
      continue;
    }
    for (const name of Object.keys(entries)) {
      const id = `${section}.${name}`;
      const expected = known ? lookup(reference, id) : void 0;
      if (expected === void 0) {
        result.unknown += 1;
        note({ code: "unknownMessage", id: shown(id) });
        continue;
      }
      const message = entries[name];
      const texts = typeof message === "string" ? [message] : isPluralForms(message) && !hasOwn(message, FORMS_LANGUAGE) ? formTexts(message) : null;
      if (!texts) {
        result.invalid += 1;
        note({ code: "badShape", id });
        continue;
      }
      if (texts.some((text2) => text2.length > MESSAGE_LIMIT || CONTROL.test(text2))) {
        result.invalid += 1;
        note({ code: "tooLong", id });
        continue;
      }
      const allowed = placeholdersOf(expected);
      const extra2 = placeholdersOf(message).filter((placeholder) => !allowed.includes(placeholder));
      if (extra2.length) {
        result.invalid += 1;
        note({ code: "badPlaceholder", id, detail: `{${extra2.join("}, {")}}` });
        continue;
      }
      const target = out[section] ?? (out[section] = {});
      target[name] = message;
      result.translated += 1;
    }
  }
  result.catalog = out;
  return result;
}
function createTranslator(language3, layers, options = {}) {
  const showId = options.missing !== "empty";
  const message = (id) => {
    for (const layer of layers) {
      const found = lookup(layer, id);
      if (found !== void 0) return found;
    }
    return void 0;
  };
  return {
    language: language3,
    hash: options.hash ?? "",
    t: (id, params) => {
      const found = message(id);
      return found === void 0 ? showId ? id : "" : format(found, params, language3);
    },
    message
  };
}
var defaults = [{ kitText }];
var sourceTranslator = createTranslator(SOURCE_LANGUAGE, defaults, { missing: "empty" });
var bound = null;
var listeners = /* @__PURE__ */ new Set();
function addDefaults(catalog) {
  if (!defaults.includes(catalog)) defaults.push(catalog);
}
function bindTranslator(next) {
  if (next === bound) return;
  bound = next;
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
    }
  }
}
var t = (id, params) => (bound ?? sourceTranslator).t(id, params);
var joinList = (items) => items.join(t("kitText.listSeparator"));

// resources/third-party/default-features/vivid-activity/shared/i18n-rpc.ts
var import_plugin = require("@getpaseo/plugin");
var import_zod = require("zod");
var LANGUAGE_SETTINGS_ID = "language";
var hash = import_zod.z.string().regex(/^[0-9a-f]{16}$/);
var device = import_zod.z.string().max(80);
var language = import_zod.z.string().max(40);
var i18nCatalogRpc = (0, import_plugin.defineRpc)({
  name: "i18n.catalog",
  input: import_zod.z.object({ device, have: hash.optional(), hash: hash.optional(), part: import_zod.z.number().int().min(0).max(255), scope: import_zod.z.literal("boot").optional() }).strict(),
  output: import_zod.z.discriminatedUnion("status", [
    import_zod.z.object({ status: import_zod.z.literal("unchanged"), language, hash }),
    import_zod.z.object({ status: import_zod.z.literal("ok"), language, hash, part: import_zod.z.number().int().nonnegative(), parts: import_zod.z.number().int().positive().max(256), text: import_zod.z.string() })
  ])
});

// resources/third-party/default-features/vivid-activity/shared/i18n-settings.ts
var import_plugin2 = require("@getpaseo/plugin");
var import_zod2 = require("zod");
var languageSettings = (0, import_plugin2.defineSettings)({
  id: LANGUAGE_SETTINGS_ID,
  scope: "host",
  version: 1,
  schema: import_zod2.z.object({ language: import_zod2.z.string().max(40).default("auto") })
});
var device2 = import_zod2.z.string().max(80);
var language2 = import_zod2.z.string().max(40);
var i18nLanguagesRpc = (0, import_plugin2.defineRpc)({
  name: "i18n.languages",
  input: import_zod2.z.object({ device: device2 }).strict(),
  output: import_zod2.z.object({
    setting: import_zod2.z.string(),
    /** The language in use with this setting on the asking device. */
    resolved: language2,
    /** What "follow system" means on the asking device. */
    system: language2,
    device: import_zod2.z.string(),
    folder: import_zod2.z.string(),
    languages: import_zod2.z.array(import_zod2.z.object({
      code: language2,
      name: import_zod2.z.string(),
      builtIn: import_zod2.z.boolean(),
      /** A file in the folder: a new language, or changes to a built-in one. */
      custom: import_zod2.z.boolean(),
      file: import_zod2.z.string().optional(),
      /** Share of the plugin's messages this language has, 0 to 1 (built-in languages: 1). */
      coverage: import_zod2.z.number().min(0).max(1),
      /** Problems found in the file; codes are worded by the client (`kitLanguage.issue…`). */
      issues: import_zod2.z.array(import_zod2.z.object({ code: import_zod2.z.string(), id: import_zod2.z.string().optional(), detail: import_zod2.z.string().optional() }))
    }))
  })
});

// resources/third-party/default-features/vivid-activity/server/client-chunks.ts
addDefaults({ kitLazy });
var CLIENT_CHUNK_REPLY_BYTES = 120 * 1024;
function splitChunk(chunk) {
  return splitReply(chunk.code, CLIENT_CHUNK_REPLY_BYTES - 1024 - Buffer.byteLength(JSON.stringify(chunk.name)));
}
function splitReply(source, budget) {
  const slices = [];
  let start = 0, bytes = 0;
  for (let index = 0; index < source.length; ) {
    const character = source.charCodeAt(index);
    let size, units = 1;
    if (character < 128) {
      size = character === 34 || character === 92 ? 2 : character >= 32 ? 1 : character === 8 || character === 9 || character === 10 || character === 12 || character === 13 ? 2 : 6;
    } else if (character < 2048) size = 2;
    else if (character >= 55296 && character <= 57343) {
      const next = source.charCodeAt(index + 1);
      if (character <= 56319 && next >= 56320 && next <= 57343) {
        size = 4;
        units = 2;
      } else size = 6;
    } else size = 3;
    if (bytes + size > budget) {
      slices.push(source.slice(start, index));
      if (slices.length >= 4096) throw new Error("Client chunk exceeds the part limit");
      start = index;
      bytes = 0;
    }
    bytes += size;
    index += units;
  }
  slices.push(source.slice(start));
  return slices;
}
function createClientChunkHandler(chunks) {
  const entries = new Map(chunks.map((chunk) => [chunk.name, { chunk }]));
  return ({ name, hash: hash2, part }) => {
    const entry = entries.get(name);
    if (!entry || !Number.isInteger(part) || part < 0 || part >= 4096) throw new Error("Unknown client chunk or part");
    entry.slices ??= splitChunk(entry.chunk);
    if (part >= entry.slices.length) throw new Error("Unknown client chunk or part");
    if (part > 0 && hash2 !== entry.chunk.hash) throw new Error(t("kitLazy.updated"));
    return { name, hash: entry.chunk.hash, api: entry.chunk.api, part, parts: entry.slices.length, code: entry.slices[part] };
  };
}

// resources/third-party/default-features/vivid-activity/server/i18n-server.ts
var FILE = /^([A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8}){0,3})\.json$/;
var MAX_FILES = 40;
var MAX_BYTES = 2 * 1024 * 1024;
var PART_BYTES = 100 * 1024;
var KEEP_BUILT = 8;
var BOOT_SECTIONS = ["boot", "kitLazy", "kitText"];
function bootOf(entry) {
  if (!entry.boot) {
    const subset = {};
    for (const section of BOOT_SECTIONS) if (entry.catalog[section]) subset[section] = entry.catalog[section];
    const text2 = JSON.stringify(subset);
    entry.boot = { text: text2, hash: (0, import_node_crypto.createHash)("sha256").update(`boot
${entry.language}
${text2}`).digest("hex").slice(0, 16) };
  }
  return entry.boot;
}
function paseoHome(env = process.env) {
  let home = env.PASEO_HOME?.trim() || (0, import_node_path.join)((0, import_node_os.homedir)(), ".paseo");
  if (home === "~") home = (0, import_node_os.homedir)();
  else if (home.startsWith("~/")) home = (0, import_node_path.join)((0, import_node_os.homedir)(), home.slice(2));
  return (0, import_node_path.resolve)(home);
}
var README = (pluginId) => `# Languages for ${pluginId}

Add a language by putting a translation in this folder as \`<language code>.json\`, for example \`ko.json\` or
\`pt-BR.json\`:

1. Copy \`templates/en.json\` (or \`templates/zh-CN.json\`) here and rename it.
2. Set \`"$meta": { "name": "..." }\` to the language's own name, for example "\uD55C\uAD6D\uC5B4".
3. Translate the values. Keep every \`{placeholder}\` as it is. Plural forms ("one", "other", ...) follow CLDR plural
   categories; "other" is required.
4. In the plugin's Language setting, pick your language, or keep "Follow system" if your device uses it.

Entries you leave out, or that cannot be used, show in English; the Language setting lists the problems it found.
A file named after a built-in language (\`en.json\`, \`zh-CN.json\`) changes only the entries it contains.
The templates are rewritten when the plugin updates: compare them with your file to find new messages.

# \u81EA\u5B9A\u4E49\u8BED\u8A00

\u628A\u7FFB\u8BD1\u6587\u4EF6\u4EE5 \`<\u8BED\u8A00\u4EE3\u7801>.json\` \u653E\u8FDB\u8FD9\u4E2A\u6587\u4EF6\u5939\uFF0C\u4F8B\u5982 \`ko.json\`\u3001\`pt-BR.json\`\uFF1A

1. \u628A \`templates/en.json\`\uFF08\u6216 \`templates/zh-CN.json\`\uFF09\u590D\u5236\u5230\u8FD9\u91CC\u5E76\u6539\u540D\u3002
2. \u628A \`"$meta": { "name": "..." }\` \u6539\u6210\u8FD9\u79CD\u8BED\u8A00\u81EA\u5DF1\u7684\u540D\u5B57\uFF0C\u4F8B\u5982\u300C\uD55C\uAD6D\uC5B4\u300D\u3002
3. \u7FFB\u8BD1\u5404\u6761\u7684\u503C\uFF0C\`{\u5360\u4F4D\u7B26}\` \u539F\u6837\u4FDD\u7559\u3002\u5355\u590D\u6570\u5F62\u5F0F\uFF08"one"\u3001"other" \u7B49\uFF09\u6309 CLDR \u5206\u7C7B\uFF0C\u5FC5\u987B\u6709 "other"\u3002
4. \u5728\u63D2\u4EF6\u7684\u300C\u8BED\u8A00\u300D\u8BBE\u7F6E\u91CC\u9009\u8FD9\u79CD\u8BED\u8A00\uFF1B\u8BBE\u5907\u672C\u6765\u5C31\u7528\u8FD9\u79CD\u8BED\u8A00\u65F6\uFF0C\u4FDD\u6301\u300C\u8DDF\u968F\u7CFB\u7EDF\u300D\u5373\u53EF\u3002

\u6CA1\u7FFB\u8BD1\u6216\u7528\u4E0D\u4E86\u7684\u6761\u76EE\u663E\u793A\u82F1\u6587\uFF0C\u300C\u8BED\u8A00\u300D\u8BBE\u7F6E\u4F1A\u5217\u51FA\u53D1\u73B0\u7684\u95EE\u9898\u3002\u6587\u4EF6\u540D\u548C\u5185\u7F6E\u8BED\u8A00\u76F8\u540C\uFF08\`en.json\`\u3001\`zh-CN.json\`\uFF09\u65F6\uFF0C
\u53EA\u66FF\u6362\u6587\u4EF6\u91CC\u6709\u7684\u6761\u76EE\u3002\u63D2\u4EF6\u66F4\u65B0\u65F6\u4F1A\u91CD\u5199\u6A21\u677F\uFF0C\u53EF\u4EE5\u548C\u81EA\u5DF1\u7684\u6587\u4EF6\u5BF9\u6BD4\uFF0C\u627E\u51FA\u65B0\u589E\u7684\u6761\u76EE\u3002
`;
var errorText = (error) => String(error?.message ?? error ?? "").slice(0, 160);
var failed = (issue, total) => ({ catalog: {}, translated: 0, total, unknown: 0, invalid: 0, issues: [issue] });
async function writeIfChanged(path, text2) {
  const before = await (0, import_promises.readFile)(path, "utf8").catch(() => null);
  if (before === text2) return;
  const temporary = `${path}.${process.pid}.tmp`;
  await (0, import_promises.writeFile)(temporary, text2, { mode: 420 });
  await (0, import_promises.rename)(temporary, path);
}
async function readRegularFile(path, limit) {
  let handle;
  try {
    handle = await (0, import_promises.open)(path, import_node_fs.constants.O_RDONLY | (import_node_fs.constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    return { error: error.code === "ELOOP" ? { code: "link" } : { code: "open", detail: errorText(error) } };
  }
  try {
    const info = await handle.stat();
    if (!info.isFile()) return { error: { code: "notFile" } };
    if (info.size > limit) return { error: { code: "tooBig" } };
    const text2 = await handle.readFile("utf8");
    return { text: text2, signature: `${info.dev}:${info.ino}:${info.size}:${info.mtimeMs}` };
  } finally {
    await handle.close();
  }
}
function createLocaleService(server, options) {
  const english = options.builtins[FALLBACK_LANGUAGE], chinese = options.builtins[SOURCE_LANGUAGE];
  if (!english?.length || !chinese?.length) throw new Error("i18n: the built-in zh-CN and en catalogs are required");
  const base = (0, import_node_path.join)(options.home ?? paseoHome(), "plugin-data", options.pluginId);
  const folder = (0, import_node_path.join)(base, "locales");
  const statePath = (0, import_node_path.join)(base, "i18n-state.json");
  const builtinCodes = Object.keys(options.builtins);
  const ids = Array.from(/* @__PURE__ */ new Set([...english.flatMap(catalogIds), ...chinese.flatMap(catalogIds)]));
  const reference = assembleCatalog([...english, ...chinese], ids);
  const log = options.log ?? (() => void 0);
  const fileCache = /* @__PURE__ */ new Map();
  const built = /* @__PURE__ */ new Map();
  const byHash = /* @__PURE__ */ new Map();
  let setting = "auto", device3 = "";
  try {
    const saved = JSON.parse((0, import_node_fs.readFileSync)(statePath, "utf8"));
    device3 = normalizeLanguage(saved.device);
    if (typeof saved.setting === "string" && saved.setting.length <= 40) setting = saved.setting;
  } catch {
  }
  let disposed = false;
  const remember = () => {
    void (0, import_promises.mkdir)(base, { recursive: true }).then(() => writeIfChanged(statePath, `${JSON.stringify({ device: device3, setting })}
`)).catch((error) => log("i18n: cannot save the language state", { error: errorText(error) }));
  };
  let lastScan = /* @__PURE__ */ new Map();
  const scan = async () => {
    const found = /* @__PURE__ */ new Map();
    let names;
    try {
      names = (await (0, import_promises.readdir)(folder)).filter((name) => FILE.test(name)).sort().slice(0, MAX_FILES);
    } catch {
      return found;
    }
    for (const file of names) {
      const code = normalizeLanguage(FILE.exec(file)[1]);
      if (!code || found.has(code)) continue;
      const read = await readRegularFile((0, import_node_path.join)(folder, file), MAX_BYTES);
      if ("error" in read) {
        found.set(code, { code, file, check: failed(read.error, ids.length), signature: "" });
        continue;
      }
      const cached = fileCache.get(file);
      if (cached && cached.signature === read.signature) {
        found.set(code, cached);
        continue;
      }
      let check;
      try {
        check = checkCatalog(JSON.parse(read.text), reference);
      } catch (error) {
        check = failed({ code: "badJson", detail: errorText(error) }, ids.length);
      }
      const entry = { code, file, check, signature: read.signature };
      fileCache.set(file, entry);
      found.set(code, entry);
    }
    for (const file of Array.from(fileCache.keys())) if (!names.includes(file)) fileCache.delete(file);
    lastScan = found;
    return found;
  };
  const available = (customs) => {
    const codes = [...builtinCodes];
    for (const [code, custom] of customs) if (!codes.includes(code) && custom.check.translated > 0) codes.push(code);
    return codes;
  };
  const build = (language3, custom) => {
    const cacheKey = `${language3}
${custom?.signature ?? ""}`;
    const existing = built.get(cacheKey);
    if (existing) return existing;
    const layers = [], languages = [];
    const add = (from, catalogs) => {
      for (const catalog2 of catalogs) {
        layers.push(catalog2);
        languages.push(from);
      }
    };
    if (custom) add(language3, [custom.check.catalog]);
    add(language3, options.builtins[language3] ?? []);
    add(FALLBACK_LANGUAGE, english);
    add(SOURCE_LANGUAGE, chinese);
    const catalog = assembleCatalog(layers, ids, { language: language3, languages });
    const text2 = JSON.stringify(catalog);
    const hash2 = (0, import_node_crypto.createHash)("sha256").update(`${language3}
${text2}`).digest("hex").slice(0, 16);
    const entry = { language: language3, hash: hash2, text: text2, catalog };
    built.set(cacheKey, entry);
    byHash.set(hash2, entry);
    while (built.size > KEEP_BUILT) {
      const oldest = built.keys().next().value;
      byHash.delete(built.get(oldest).hash);
      built.delete(oldest);
    }
    return entry;
  };
  let serverHash = "", serverLanguage = FALLBACK_LANGUAGE;
  const bindServer = (entry) => {
    if (disposed || entry.hash === serverHash) return;
    serverHash = entry.hash;
    serverLanguage = entry.language;
    bindTranslator(createTranslator(entry.language, [entry.catalog], { hash: entry.hash }));
  };
  const current = async (forDevice) => {
    const customs = await scan();
    const language3 = resolveLanguage(setting, forDevice || void 0, available(customs));
    return build(language3, customs.get(language3));
  };
  const rebind = async () => {
    try {
      bindServer(await current(device3));
    } catch (error) {
      log("i18n: cannot load the language files", { error: errorText(error) });
    }
  };
  const switchNow = () => {
    const language3 = resolveLanguage(setting, device3 || void 0, available(lastScan));
    bindServer(build(language3, lastScan.get(language3)));
    void rebind();
  };
  const noteDevice = (raw) => {
    const tag2 = normalizeLanguage(raw);
    if (!tag2 || tag2 === device3) return;
    device3 = tag2;
    remember();
    switchNow();
  };
  bindServer(build(resolveLanguage(setting, device3 || void 0, builtinCodes), void 0));
  const settings = server.registerSettings(languageSettings);
  const adopt = (state) => {
    const next = state.status === "ready" && typeof state.values?.language === "string" ? state.values.language : "auto";
    if (next === setting) return;
    setting = next;
    remember();
    switchNow();
  };
  const stopSettings = settings.subscribe((state) => adopt(state));
  const prepare = async () => {
    await (0, import_promises.mkdir)((0, import_node_path.join)(folder, "templates"), { recursive: true });
    const englishCatalog = assembleCatalog(english, ids);
    const chineseCatalog = assembleCatalog(chinese, ids);
    await writeIfChanged((0, import_node_path.join)(folder, "templates", "en.json"), `${JSON.stringify({ $meta: { name: "English" }, ...englishCatalog }, null, 2)}
`);
    await writeIfChanged((0, import_node_path.join)(folder, "templates", "zh-CN.json"), `${JSON.stringify({ $meta: { name: "\u7B80\u4F53\u4E2D\u6587" }, ...chineseCatalog }, null, 2)}
`);
    await writeIfChanged((0, import_node_path.join)(folder, "README.md"), README(options.pluginId));
  };
  const ready = Promise.all([
    settings.read().then(adopt, (error) => log("i18n: cannot read the language setting", { error: errorText(error) })),
    prepare().catch((error) => log("i18n: cannot prepare the language folder", { folder, error: errorText(error) }))
  ]).then(rebind);
  server.handle(i18nCatalogRpc, async (input) => {
    noteDevice(input.device);
    if (input.part > 0) {
      const entry2 = input.hash ? byHash.get(input.hash) : void 0;
      if (!entry2) throw new Error("The language catalog changed; load it again.");
      const parts2 = entry2.parts ?? (entry2.parts = splitReply(entry2.text, PART_BYTES));
      if (input.part >= parts2.length) throw new Error("Unknown language catalog part.");
      return { status: "ok", language: entry2.language, hash: entry2.hash, part: input.part, parts: parts2.length, text: parts2[input.part] };
    }
    const entry = await current(normalizeLanguage(input.device) || device3);
    if (normalizeLanguage(input.device) === device3) bindServer(entry);
    if (input.have === entry.hash) return { status: "unchanged", language: entry.language, hash: entry.hash };
    if (input.scope === "boot") {
      const boot = bootOf(entry);
      return { status: "ok", language: entry.language, hash: boot.hash, part: 0, parts: 1, text: boot.text };
    }
    const parts = entry.parts ?? (entry.parts = splitReply(entry.text, PART_BYTES));
    return { status: "ok", language: entry.language, hash: entry.hash, part: 0, parts: parts.length, text: parts[0] };
  });
  server.handle(i18nLanguagesRpc, async (input) => {
    noteDevice(input.device);
    const customs = await scan();
    const asked = normalizeLanguage(input.device) || device3;
    const languages = builtinCodes.map((code) => {
      const custom = customs.get(code);
      const name = custom?.check.name ?? options.builtins[code].map(catalogName).find(Boolean) ?? code;
      return { code, name, builtIn: true, custom: Boolean(custom), file: custom?.file, coverage: 1, issues: custom?.check.issues ?? [] };
    });
    for (const [code, custom] of customs) {
      if (builtinCodes.includes(code)) continue;
      const coverage = custom.check.total ? custom.check.translated / custom.check.total : 0;
      languages.push({ code, name: custom.check.name ?? code, builtIn: false, custom: true, file: custom.file, coverage, issues: custom.check.issues });
    }
    void rebind();
    const codes = available(customs);
    return { setting, resolved: resolveLanguage(setting, asked || void 0, codes), system: resolveLanguage("auto", asked || void 0, codes), device: asked, folder, languages };
  });
  return {
    language: () => serverLanguage,
    folder,
    ready,
    dispose() {
      disposed = true;
      stopSettings();
    }
  };
}

// resources/third-party/default-features/vivid-activity/shared/locales/zh-CN.json
var zh_CN_default2 = {
  $meta: {
    name: "\u7B80\u4F53\u4E2D\u6587"
  },
  boot: {
    name: "\u5F69\u8272\u6D3B\u52A8\u884C",
    piNotice: "Pi \u901A\u77E5",
    openSettings: "\u6253\u5F00\u5F69\u8272\u6D3B\u52A8\u884C\u8BBE\u7F6E"
  },
  modelLook: {
    think: "\u601D\u8003",
    read: "\u8BFB\u6587\u4EF6",
    list: "\u5217\u76EE\u5F55",
    edit: "\u6539\u6587\u4EF6",
    write: "\u5199\u6587\u4EF6",
    shell: "\u547D\u4EE4",
    search: "\u641C\u7D22",
    web: "\u8054\u7F51",
    agent: "\u5B50 Agent",
    plan: "\u8BA1\u5212",
    ask: "\u63D0\u95EE",
    mcp: "MCP",
    paseo: "Paseo",
    skill: "\u6280\u80FD",
    other: "\u5176\u4ED6",
    browser: "\u6D4F\u89C8\u5668"
  },
  modelRowStatus: {
    running: "\u8FD0\u884C\u4E2D",
    waiting: "\u7B49\u4F60\u6279\u51C6",
    question: "\u7B49\u4F60\u56DE\u7B54",
    completed: "\u5B8C\u6210",
    failed: "\u5931\u8D25",
    canceled: "\u5DF2\u53D6\u6D88"
  },
  modelCount: {
    think: "\u601D\u8003",
    read: "\u8BFB\u53D6",
    list: "\u5217\u76EE\u5F55",
    edit: "\u7F16\u8F91",
    write: "\u5199\u5165",
    shell: "\u547D\u4EE4",
    search: "\u641C\u7D22",
    web: "\u8054\u7F51",
    agent: "\u5B50 Agent",
    plan: "\u8BA1\u5212",
    ask: "\u63D0\u95EE",
    mcp: "MCP",
    paseo: "Paseo",
    skill: "\u6280\u80FD",
    other: "\u5176\u4ED6",
    browser: "\u6D4F\u89C8\u5668"
  },
  modelPaseo: {
    speak: "\u6717\u8BFB",
    createWorkspace: "\u65B0\u5EFA\u5DE5\u4F5C\u533A",
    listWorkspaces: "\u5217\u51FA\u5DE5\u4F5C\u533A",
    archiveWorkspace: "\u5F52\u6863\u5DE5\u4F5C\u533A",
    renameWorkspace: "\u91CD\u547D\u540D\u5DE5\u4F5C\u533A",
    createAgent: "\u65B0\u5EFA Agent",
    sendAgentPrompt: "\u7ED9 Agent \u53D1\u6D88\u606F",
    getAgentStatus: "\u67E5\u770B Agent \u72B6\u6001",
    getAgentActivity: "\u67E5\u770B Agent \u52A8\u6001",
    listAgents: "\u5217\u51FA Agent",
    cancelAgentRun: "\u4E2D\u65AD Agent",
    archiveAgent: "\u5F52\u6863 Agent",
    killAgent: "\u7ED3\u675F Agent",
    updateAgent: "\u4FEE\u6539 Agent",
    setAgentSessionMode: "\u5207\u6362 Agent \u6A21\u5F0F",
    listPendingPermissions: "\u5217\u51FA\u5F85\u5BA1\u6279",
    respondToPermission: "\u56DE\u590D\u5BA1\u6279",
    listWorkspaceScripts: "\u5217\u51FA\u5DE5\u4F5C\u533A\u811A\u672C",
    startWorkspaceScript: "\u542F\u52A8\u5DE5\u4F5C\u533A\u811A\u672C",
    stopWorkspaceScript: "\u505C\u6B62\u5DE5\u4F5C\u533A\u811A\u672C",
    listTerminals: "\u5217\u51FA\u7EC8\u7AEF",
    createTerminal: "\u65B0\u5EFA\u7EC8\u7AEF",
    killTerminal: "\u5173\u95ED\u7EC8\u7AEF",
    captureTerminal: "\u8BFB\u53D6\u7EC8\u7AEF\u8F93\u51FA",
    sendTerminalKeys: "\u5411\u7EC8\u7AEF\u53D1\u9001\u6309\u952E",
    createSchedule: "\u65B0\u5EFA\u5B9A\u65F6\u4EFB\u52A1",
    createHeartbeat: "\u65B0\u5EFA\u5FC3\u8DF3\u4EFB\u52A1",
    deleteHeartbeat: "\u5220\u9664\u5FC3\u8DF3\u4EFB\u52A1",
    listSchedules: "\u5217\u51FA\u5B9A\u65F6\u4EFB\u52A1",
    inspectSchedule: "\u67E5\u770B\u5B9A\u65F6\u4EFB\u52A1",
    pauseSchedule: "\u6682\u505C\u5B9A\u65F6\u4EFB\u52A1",
    resumeSchedule: "\u6062\u590D\u5B9A\u65F6\u4EFB\u52A1",
    deleteSchedule: "\u5220\u9664\u5B9A\u65F6\u4EFB\u52A1",
    updateSchedule: "\u4FEE\u6539\u5B9A\u65F6\u4EFB\u52A1",
    scheduleLogs: "\u5B9A\u65F6\u4EFB\u52A1\u8BB0\u5F55",
    runScheduleOnce: "\u7ACB\u5373\u8FD0\u884C\u5B9A\u65F6\u4EFB\u52A1",
    listProviders: "\u5217\u51FA Provider",
    listModels: "\u5217\u51FA\u6A21\u578B",
    listAgentProfiles: "\u5217\u51FA Agent \u914D\u7F6E",
    inspectProvider: "\u67E5\u770B Provider",
    listBrowserTabs: "\u5217\u51FA\u6D4F\u89C8\u5668\u6807\u7B7E\u9875",
    createBrowserTab: "\u65B0\u5EFA\u6D4F\u89C8\u5668\u6807\u7B7E\u9875",
    closeBrowserTab: "\u5173\u95ED\u6D4F\u89C8\u5668\u6807\u7B7E\u9875",
    snapshotBrowserPage: "\u8BFB\u53D6\u9875\u9762\u7ED3\u6784",
    clickBrowserElement: "\u70B9\u51FB\u9875\u9762\u5143\u7D20",
    fillBrowserElement: "\u586B\u5199\u9875\u9762\u5143\u7D20",
    hoverBrowserElement: "\u60AC\u505C\u9875\u9762\u5143\u7D20",
    dragBrowserElement: "\u62D6\u52A8\u9875\u9762\u5143\u7D20",
    selectBrowserOption: "\u9009\u62E9\u4E0B\u62C9\u9009\u9879",
    waitForBrowserCondition: "\u7B49\u5F85\u9875\u9762\u6761\u4EF6",
    typeIntoBrowser: "\u5728\u6D4F\u89C8\u5668\u8F93\u5165",
    pressBrowserKey: "\u6D4F\u89C8\u5668\u6309\u952E",
    navigateBrowser: "\u6D4F\u89C8\u5668\u6253\u5F00\u7F51\u5740",
    browserBack: "\u6D4F\u89C8\u5668\u540E\u9000",
    browserForward: "\u6D4F\u89C8\u5668\u524D\u8FDB",
    browserReload: "\u6D4F\u89C8\u5668\u5237\u65B0",
    captureBrowserScreenshot: "\u6D4F\u89C8\u5668\u622A\u56FE",
    uploadFilesInBrowser: "\u6D4F\u89C8\u5668\u4E0A\u4F20\u6587\u4EF6",
    readBrowserLogs: "\u8BFB\u53D6\u6D4F\u89C8\u5668\u65E5\u5FD7",
    evaluateBrowserJavascript: "\u5728\u6D4F\u89C8\u5668\u6267\u884C\u811A\u672C",
    scrollBrowser: "\u6EDA\u52A8\u9875\u9762",
    resizeBrowserViewport: "\u8C03\u6574\u6D4F\u89C8\u5668\u7A97\u53E3"
  },
  modelLabel: {
    read: "\u8BFB\u53D6",
    list: "\u5217\u76EE\u5F55",
    listDirectory: "\u5217\u76EE\u5F55",
    edit: "\u7F16\u8F91",
    add: "\u65B0\u5EFA",
    delete: "\u5220\u9664",
    write: "\u5199\u5165",
    shell: "\u547D\u4EE4",
    search: "\u641C\u7D22",
    find: "\u67E5\u627E",
    fetchUrl: "\u6293\u53D6\u7F51\u9875",
    agentTask: "\u5B50 Agent",
    plan: "\u8BA1\u5212",
    thinking: "\u601D\u8003",
    skill: "\u6280\u80FD",
    tasks: "\u4EFB\u52A1",
    askQuestion: "\u63D0\u95EE",
    backgroundTask: "\u540E\u53F0\u4EFB\u52A1",
    speak: "\u6717\u8BFB",
    worktreeSetup: "\u51C6\u5907\u5DE5\u4F5C\u6811",
    tool: "\u5DE5\u5177",
    searchTools: "\u67E5\u627E\u5DE5\u5177",
    codeMode: "\u4EE3\u7801\u6A21\u5F0F",
    supervisorReply: "\u56DE\u590D\u5B50 Agent",
    supervisorQueue: "\u5B50 Agent \u8BF7\u6C42\u961F\u5217",
    supervisorRequests: "\u5B50 Agent \u8BF7\u6C42",
    supervisorStatus: "\u5B50 Agent \u72B6\u6001",
    subagentSupervisor: "\u5B50 Agent \u76D1\u7BA1",
    wait: "\u7B49\u5F85",
    waitForBackgroundWork: "\u7B49\u5F85\u540E\u53F0\u4EFB\u52A1",
    waitSubscription: "\u8BA2\u9605\u7B49\u5F85",
    waitForAll: "\u7B49\u5F85\u5168\u90E8",
    waitForRun: "\u7B49\u5F85\u8FD0\u884C",
    bgWait: "\u540E\u53F0\u7B49\u5F85",
    waitForAgent: "\u7B49\u5F85 Agent",
    dispatchAgent: "\u6D3E\u51FA\u5B50 Agent",
    steerAgent: "\u5F15\u5BFC\u5B50 Agent",
    checkAgentResult: "\u67E5\u770B\u5B50 Agent \u7ED3\u679C",
    agentResult: "\u5B50 Agent \u7ED3\u679C",
    gitHubActionsDetails: "GitHub Actions \u8BE6\u60C5",
    gitHubActionsList: "GitHub Actions \u5217\u8868",
    gitHubActionsRun: "GitHub Actions \u8FD0\u884C",
    gitHubFile: "GitHub \u6587\u4EF6",
    gitHubJobLogs: "GitHub \u4F5C\u4E1A\u65E5\u5FD7",
    gitHubPullRequest: "GitHub PR",
    gitHubCodeSearch: "GitHub \u4EE3\u7801\u641C\u7D22",
    gitHubRepositorySearch: "GitHub \u4ED3\u5E93\u641C\u7D22",
    exaWebSearch: "Exa \u7F51\u9875\u641C\u7D22",
    exaWebFetch: "Exa \u6293\u53D6\u7F51\u9875",
    exaAgent: "Exa \u7814\u7A76 Agent",
    exaResearchGuide: "Exa \u7814\u7A76\u6307\u5357",
    exaSchemaTemplates: "Exa \u7ED3\u6784\u6A21\u677F",
    todoWrite: "\u66F4\u65B0\u4EFB\u52A1",
    notebookEdit: "\u7F16\u8F91\u7B14\u8BB0\u672C",
    bashOutput: "\u8BFB\u53D6\u540E\u53F0\u8F93\u51FA",
    killShell: "\u7ED3\u675F\u540E\u53F0\u547D\u4EE4",
    killBash: "\u7ED3\u675F\u540E\u53F0\u547D\u4EE4",
    webSearch: "\u8054\u7F51\u641C\u7D22",
    exitPlanMode: "\u63D0\u4EA4\u8BA1\u5212",
    enterPlanMode: "\u8FDB\u5165\u8BA1\u5212\u6A21\u5F0F",
    slashCommand: "\u659C\u6760\u547D\u4EE4",
    askUserQuestion: "\u63D0\u95EE",
    listMcpResourcesTool: "\u5217\u51FA MCP \u8D44\u6E90",
    readMcpResourceTool: "\u8BFB\u53D6 MCP \u8D44\u6E90",
    command: "\u547D\u4EE4",
    output: "\u8F93\u51FA",
    contents: "\u5185\u5BB9",
    writtenContents: "\u5199\u5165\u5185\u5BB9",
    before: "\u6539\u524D",
    after: "\u6539\u540E",
    diff: "\u6539\u52A8",
    result: "\u7ED3\u679C",
    error: "\u9519\u8BEF",
    input: "\u8F93\u5165",
    image: "\u56FE\u7247",
    setupLog: "\u51C6\u5907\u65E5\u5FD7",
    activityLog: "\u6D3B\u52A8\u65E5\u5FD7",
    query: "\u67E5\u8BE2",
    matches: "\u5339\u914D",
    files: "\u6587\u4EF6",
    message: "\u6D88\u606F",
    prompt: "\u63D0\u793A\u8BCD",
    code: "\u4EE3\u7801",
    session: "\u4F1A\u8BDD"
  },
  modelStatus: {
    exactActive: "\u5F53\u524D",
    exactDefault: "\u9ED8\u8BA4",
    exactSuccess: "\u6210\u529F",
    exactFailed: "\u5931\u8D25",
    running: "\u8FD0\u884C\u4E2D",
    initializing: "\u542F\u52A8\u4E2D",
    starting: "\u542F\u52A8\u4E2D",
    loading: "\u52A0\u8F7D\u4E2D",
    completed: "\u5DF2\u5B8C\u6210",
    succeeded: "\u6210\u529F",
    success: "\u6210\u529F",
    idle: "\u7A7A\u95F2",
    active: "\u542F\u7528\u4E2D",
    healthy: "\u6B63\u5E38",
    ready: "\u5C31\u7EEA",
    available: "\u53EF\u7528",
    enabled: "\u5DF2\u542F\u7528",
    failed: "\u5931\u8D25",
    error: "\u51FA\u9519",
    unhealthy: "\u5F02\u5E38",
    unavailable: "\u4E0D\u53EF\u7528",
    disabled: "\u5DF2\u505C\u7528",
    canceled: "\u5DF2\u53D6\u6D88",
    cancelled: "\u5DF2\u53D6\u6D88",
    paused: "\u5DF2\u6682\u505C",
    stopped: "\u5DF2\u505C\u6B62",
    closed: "\u5DF2\u5173\u95ED",
    exited: "\u5DF2\u9000\u51FA",
    archived: "\u5DF2\u5F52\u6863",
    expired: "\u5DF2\u8FC7\u671F",
    skipped: "\u5DF2\u8DF3\u8FC7",
    pending: "\u7B49\u5F85\u4E2D",
    queued: "\u6392\u961F\u4E2D",
    timeout: "\u8D85\u65F6",
    timedOut: "\u8D85\u65F6",
    worktree: "\u5DE5\u4F5C\u6811",
    local: "\u672C\u5730",
    none: "\u4E0D\u9694\u79BB",
    directory: "\u76EE\u5F55",
    tool: "\u5DE5\u5177",
    plan: "\u8BA1\u5212",
    question: "\u63D0\u95EE",
    mode: "\u6A21\u5F0F",
    other: "\u5176\u4ED6",
    finished: "\u5DF2\u7ED3\u675F",
    permission: "\u7B49\u5F85\u5BA1\u6279",
    closedByUser: "\u5DF2\u5173\u95ED",
    background: "\u540E\u53F0\u8FD0\u884C"
  },
  modelText: {
    paseoLabel: "Paseo \xB7 {label}",
    waitAgents: "\u7B49\u5F85 {count} \u4E2A Agent",
    exitCode: "\u9000\u51FA\u7801 {code}",
    stateSuffix: "\uFF0C{state}",
    collapseRow: "\u6536\u8D77 {title}{target}{state}",
    expandRow: "\u5C55\u5F00 {title}{target}{state}",
    rowTarget: " {target}"
  },
  timing: {
    seconds: "{count} \u79D2",
    minutesSeconds: "{minutes} \u5206 {seconds} \u79D2",
    minutes: "{count} \u5206",
    hoursMinutes: "{hours} \u5C0F\u65F6 {minutes} \u5206",
    hours: "{count} \u5C0F\u65F6"
  },
  clock: {
    today: "\u4ECA\u5929",
    tomorrow: "\u660E\u5929",
    yesterday: "\u6628\u5929",
    soon: "\u5373\u5C06",
    justNow: "\u521A\u521A",
    monthDay: "{month}\u6708{day}\u65E5",
    yearMonthDay: "{year}\u5E74{month}\u6708{day}\u65E5",
    minutesAhead: "{count} \u5206\u949F\u540E",
    minutesAgo: "{count} \u5206\u949F\u524D",
    hoursAhead: "{count} \u5C0F\u65F6\u540E",
    hoursAgo: "{count} \u5C0F\u65F6\u524D",
    daysAhead: "{count} \u5929\u540E",
    daysAgo: "{count} \u5929\u524D",
    instantRelative: "{day} {clock}\uFF08{relative}\uFF09",
    instant: "{day} {clock}"
  },
  fold: {
    categoryCount: "{label} {count}",
    earlier: "\u524D\u9762 {count} \u6B65",
    steps: "{count} \u6B65",
    failed: "\u5931\u8D25 {count}",
    canceled: "\u53D6\u6D88 {count}",
    duration: "\u7528\u65F6 {duration}",
    collapse: "\u6536\u8D77 {title}{parts}{extras}",
    expand: "\u5C55\u5F00 {title}{parts}{extras}",
    countsSuffix: "\uFF1A{counts}",
    extrasSuffix: "\uFF0C{extras}",
    extrasSeparator: "\uFF0C",
    files: "{count} \u4E2A\u6587\u4EF6",
    moreFiles: "\u8FD8\u6709 {count} \u4E2A\u6587\u4EF6",
    changes: "\u6539\u52A8 {files} +{added} \u2212{removed}",
    uncountedMore: "\u53E6 {count} \u5904\u672A\u8BA1",
    uncountedOnly: "{count} \u5904\u6539\u52A8\u672A\u8BA1\u884C\u6570",
    uncountedLabel: "\u53E6\u6709 {count} \u5904\u6539\u52A8\u672A\u8BA1\u884C\u6570",
    uncountedNote: "{count} \u5904\u6539\u52A8\u672A\u8BA1\u884C\u6570\uFF1A\u5199\u5165\u3001\u5220\u9664\u3001\u8D85\u957F\u6216\u53EF\u80FD\u4E0D\u5168\u7684 diff \u53EA\u8BB0\u6B21\u6570\uFF0C\u4E0D\u731C\u884C\u6570",
    turn: "\u672C\u8F6E",
    tokensIn: "\u8F93\u5165 {count}",
    tokensCached: "\u7F13\u5B58 {count}",
    tokensOut: "\u8F93\u51FA {count}"
  },
  timelinePi: {
    loadingSummary: "\u6B63\u5728\u8BFB\u53D6\u2026",
    loadingNote: "\u6B63\u5728\u8BFB\u53D6\u8FD9\u6761\u901A\u77E5\u2026",
    failedSummary: "\u6CA1\u80FD\u8BFB\u53D6\uFF0C\u70B9\u5F00\u770B\u539F\u6587",
    failedNote: "Pi \u901A\u77E5\u7684\u8BFB\u6CD5\u6CA1\u6709\u4E0B\u8F7D\u6210\u529F\uFF08\u7F51\u7EDC\u65AD\u5F00\u6216\u63D2\u4EF6\u51FA\u9519\uFF09\uFF0C\u4E0B\u9762\u5148\u663E\u793A\u539F\u6587\uFF1B\u7A0D\u540E\u4F1A\u81EA\u52A8\u518D\u8BD5\uFF0C\u4E5F\u53EF\u4EE5\u70B9\u300C\u91CD\u65B0\u8BFB\u53D6\u300D\u3002",
    idleSummary: "\u8FD8\u6CA1\u8BFB\u53D6\uFF0C\u70B9\u5F00\u770B\u539F\u6587",
    idleNote: "Pi \u901A\u77E5\u7684\u8BFB\u6CD5\u8FD8\u6CA1\u6709\u52A0\u8F7D\uFF0C\u4E0B\u9762\u5148\u663E\u793A\u539F\u6587\u3002",
    note: "\u8BF4\u660E",
    notice: "Pi \u901A\u77E5"
  },
  sharedPrompt: {
    current: "\u672C\u8F6E\u63D0\u95EE",
    recent: "\u6700\u8FD1\u7684\u63D0\u95EE"
  },
  sharedPiAgent: {
    missing: "\u627E\u4E0D\u5230\u8FD9\u4E2A\u5B50 Agent\uFF0C\u53EF\u80FD\u5DF2\u88AB\u6E05\u7406\u3002",
    steerSent: "\u5F15\u5BFC\u6D88\u606F\u5DF2\u53D1\u51FA\uFF0C\u5B50 Agent \u505A\u5B8C\u5F53\u524D\u8FD9\u6B65\u5DE5\u5177\u8C03\u7528\u540E\u5904\u7406\u3002",
    running: "\u5B50 Agent \u8FD8\u5728\u8FD0\u884C\u3002"
  },
  sharedWait: {
    allRuns: "\u5168\u90E8\u8FD0\u884C",
    nextRun: "\u4E0B\u4E00\u4E2A\u8FD0\u884C",
    run: "\u8FD0\u884C",
    timeout: "\u6700\u591A\u7B49 {duration}",
    completedMany: "{label} \u7B49 {count} \u4E2A\u5DF2\u5B8C\u6210{header}",
    completed: "{label}\u5DF2\u5B8C\u6210{header}",
    headerSuffix: " \xB7 {header}",
    timedOutWithHeader: "{header} \xB7 \u5DF2\u8D85\u65F6",
    timedOut: "\u5DF2\u8D85\u65F6",
    requestWithHeader: "{header} \xB7 \u5B50 Agent \u8BF7\u6C42",
    request: "\u5B50 Agent \u8BF7\u6C42",
    waitedWithHeader: "{header} \xB7 \u5DF2\u7B49\u5F85 {seconds} \u79D2",
    waited: "\u5DF2\u7B49\u5F85 {seconds} \u79D2",
    running: "{count} \u4E2A\u8FD0\u884C\u4E2D",
    done: "{count} \u4E2A\u5DF2\u5B8C\u6210",
    failed: "{count} \u4E2A\u5931\u8D25",
    waiting: "\u7B49\u5F85 {count} \u4E2A",
    namesAndOthers: "{names} \u7B49 {count} \u4E2A"
  },
  sharedPresentation: {
    tasksCompleted: "\u5DF2\u5B8C\u6210 {done}/{total}",
    oldContents: "[\u539F\u5185\u5BB9\uFF1A{count} \u5B57\u7B26]",
    newContents: "[\u65B0\u5185\u5BB9\uFF1A{count} \u5B57\u7B26]",
    toolsCount: "{count} \u4E2A\u5DE5\u5177",
    callsAndOthers: "{count} \u6B21\u8C03\u7528 \xB7 {names} \u7B49",
    calls: "{count} \u6B21\u8C03\u7528 \xB7 {names}",
    reasoningTokens: "\u7EA6 {tokens} token",
    reasoningStepsTokens: "{steps} \u6B65 \xB7 \u7EA6 {tokens} token",
    inlineSeparator: " \xB7 ",
    callSeparator: ", ",
    agentProvider: "{title} \xB7 {provider}",
    replyTarget: "\u2192 {target}"
  },
  ui: {
    expandAllLinesCharacters: "\u5C55\u5F00\u5168\u90E8\uFF08{lines} \u884C\uFF0C{characters} \u5B57\u7B26\uFF09",
    collapse: "\u6536\u8D77",
    step: "\u7B2C {number} \u6B65",
    output: "\u8F93\u51FA",
    input: "\u8F93\u5165",
    noFilesReturned: "\u6CA1\u6709\u8FD4\u56DE\u6587\u4EF6\u3002",
    file: "\u6587\u4EF6",
    noTextReturned: "\u6CA1\u6709\u8FD4\u56DE\u6587\u5B57\u3002",
    result: "\u7ED3\u679C",
    activityLog: "\u6D3B\u52A8\u65E5\u5FD7",
    setupLog: "\u51C6\u5907\u65E5\u5FD7",
    after: "\u6539\u540E",
    before: "\u6539\u524D",
    copyWrittenContent: "\u590D\u5236\u5199\u5165\u5185\u5BB9",
    content: "\u5185\u5BB9",
    copyContent: "\u590D\u5236\u5185\u5BB9",
    outputTruncated: "\u8F93\u51FA\u5DF2\u622A\u65AD",
    outputTruncatedFullOutputAt: "\u8F93\u51FA\u5DF2\u622A\u65AD \xB7 \u5B8C\u6574\u8F93\u51FA\u5728 {path}",
    noSkillDetails: "\u6CA1\u6709\u6280\u80FD\u8BE6\u60C5\u3002",
    noToolDetails: "\u6CA1\u6709\u5DE5\u5177\u8BE6\u60C5\u3002",
    files: "{count} \u4E2A\u6587\u4EF6",
    matches: "{count} \u5904\u5339\u914D",
    waitingForOutput: "\u7B49\u5F85\u8F93\u51FA\u2026",
    answer: "\u56DE\u7B54",
    selectAllThatApply: "\u53EF\u4EE5\u591A\u9009",
    question: "\u95EE\u9898",
    question2: "\u95EE\u9898 {number}",
    question3: "\u95EE\u9898 \xB7 {header}",
    thisContentIsLongOnly: "\u5185\u5BB9\u5F88\u957F\uFF0C\u8FD9\u91CC\u53EA\u663E\u793A\u524D {count} \u5B57\u3002",
    originalText: "\u539F\u6587",
    status: "\u72B6\u6001",
    subagentConclusion: "\u5B50 Agent \u7684\u7ED3\u8BBA",
    event: "\u4E8B\u4EF6",
    task: "\u4EFB\u52A1",
    outputFile: "\u8F93\u51FA\u6587\u4EF6",
    usage: "\u7528\u91CF",
    description: "\u8BF4\u660E",
    toolCalls: "{count} \u6B21\u5DE5\u5177\u8C03\u7528",
    notice: "\u901A\u77E5",
    blocked: "\u5361\u4F4F\u4E86",
    stopped: "\u5DF2\u505C\u6B62",
    failed: "\u5931\u8D25",
    completed: "\u5DF2\u5B8C\u6210",
    copy: "\u590D\u5236{label}",
    expandAllLines: "\u5C55\u5F00\u5168\u90E8\uFF08{lines} \u884C\uFF09",
    noChangesToShow: "\u6CA1\u6709\u53EF\u663E\u793A\u7684\u6539\u52A8\u3002",
    changes: "\u6539\u52A8",
    enlargeImage: "\u653E\u5927\u56FE\u7247",
    shrinkImage: "\u7F29\u5C0F\u56FE\u7247",
    image: "\u56FE\u7247",
    loadingImage: "\u6B63\u5728\u52A0\u8F7D\u56FE\u7247\u2026",
    theImageIsLargerThan: "\u56FE\u7247\u8D85\u8FC7 3 MB\uFF0C\u4E0D\u663E\u793A\u9884\u89C8\u3002",
    theImageIsOutsideThe: "\u56FE\u7247\u4E0D\u5728 Agent \u5DE5\u4F5C\u76EE\u5F55\u3001Paseo \u5DE5\u4F5C\u6811\u6216\u4E34\u65F6\u76EE\u5F55\u5185\uFF0C\u4E0D\u663E\u793A\u9884\u89C8\u3002",
    copyOutput: "\u590D\u5236\u8F93\u51FA",
    errorOutput: "\u9519\u8BEF\u8F93\u51FA",
    copyCommand: "\u590D\u5236\u547D\u4EE4",
    exitCode: "\u9000\u51FA\u7801 {code}",
    command: "\u547D\u4EE4",
    copyCode: "\u590D\u5236\u4EE3\u7801",
    loadingDetails: "\u6B63\u5728\u52A0\u8F7D\u8BE6\u60C5\u2026",
    error: "\u9519\u8BEF",
    readPiNoticesAgain: "\u91CD\u65B0\u8BFB\u53D6 Pi \u901A\u77E5",
    readAgain: "\u91CD\u65B0\u8BFB\u53D6",
    thinking: "\u601D\u8003",
    thoughtFor: "\u601D\u8003\u4E86 {time}",
    thinking2: "\u601D\u8003\u4E2D\u2026",
    thinking3: "\u601D\u8003\u4E2D\u2026 {time}",
    noSubagentActivityYet: "\u5B50 Agent \u8FD8\u6CA1\u6709\u52A8\u6001\u3002",
    readingSubagentActivity: "\u6B63\u5728\u8BFB\u53D6\u5B50 Agent \u52A8\u6001\u2026",
    viewSubagentActivity: "\u67E5\u770B\u5B50 Agent \u52A8\u6001",
    readSubagentActivityOnceMore: "\u518D\u8BFB\u4E00\u6B21\u5B50 Agent \u52A8\u6001",
    viewActivity: "\u67E5\u770B\u52A8\u6001",
    readOnceMore: "\u518D\u8BFB\u4E00\u6B21",
    liveSubagentActivity: "\u5B50 Agent \u5B9E\u65F6\u52A8\u6001",
    theSubagentSLoadedState: "\u6682\u65F6\u786E\u8BA4\u4E0D\u4E86\u5B50 Agent \u662F\u5426\u8FD8\u52A0\u8F7D\u7740\uFF0C\u5148\u4E0D\u81EA\u52A8\u8BFB\u53D6\u5B83\u7684\u52A8\u6001\uFF1B\u6709\u65B0\u52A8\u9759\u65F6\u4F1A\u518D\u786E\u8BA4\u3002",
    thisSubagentIsMissingFrom: "Agent \u5217\u8868\u91CC\u6CA1\u6709\u8FD9\u4E2A\u5B50 Agent\uFF08\u53EF\u80FD\u5DF2\u5F52\u6863\u6216\u5220\u9664\uFF09\uFF0C\u4E0D\u81EA\u52A8\u8BFB\u53D6\u5B83\u7684\u52A8\u6001\u3002",
    thisSubagentIsClosedUnloaded: "\u5B50 Agent \u5DF2\u5173\u95ED\uFF08\u6CA1\u6709\u52A0\u8F7D\uFF09\uFF0C\u4E0D\u81EA\u52A8\u8BFB\u53D6\u5B83\u7684\u52A8\u6001\uFF1A\u8BFB\u53D6\u4F1A\u8BA9 Paseo \u91CD\u65B0\u52A0\u8F7D\u5B83\u3002",
    script: "\u811A\u672C",
    copyOriginal: "\u590D\u5236\u539F\u6587",
    originalTextWithTerminalEscape: "{label}\uFF08\u539F\u6587\uFF0C\u542B\u7EC8\u7AEF\u8F6C\u4E49\u5E8F\u5217\uFF09",
    copied: "\u5DF2\u590D\u5236",
    copyFailed: "\u590D\u5236\u5931\u8D25",
    copy2: "\u590D\u5236",
    failed2: "\u5931\u8D25 {count}",
    uRL: "\u7F51\u5740",
    encoding: "\u7F16\u7801",
    size: "\u5927\u5C0F",
    path2: "\u8DEF\u5F84",
    repository: "\u4ED3\u5E93",
    total: "\u603B\u6570",
    query2: "\u67E5\u8BE2",
    gitHubActionsItem: "GitHub Actions \u6761\u76EE",
    actionsResult: "Actions \u7ED3\u679C",
    actionsDetails: "Actions \u8BE6\u60C5",
    artifacts: "\u4EA7\u7269",
    job: "\u4F5C\u4E1A",
    workflowRun: "\u5DE5\u4F5C\u6D41\u8FD0\u884C",
    workflow: "\u5DE5\u4F5C\u6D41",
    inputParameters: "\u8F93\u5165\u53C2\u6570",
    reference: "\u5F15\u7528",
    log: "\u65E5\u5FD7",
    resource: "\u8D44\u6E90",
    deletedLines: "\u5220\u9664\u884C",
    addedLines: "\u65B0\u589E\u884C",
    changedFiles: "\u6539\u52A8\u7684\u6587\u4EF6",
    sourceBranch: "\u6765\u6E90\u5206\u652F",
    targetBranch: "\u76EE\u6807\u5206\u652F",
    author: "\u4F5C\u8005",
    title: "\u6807\u9898",
    method: "\u65B9\u5F0F",
    pRResult: "PR \u7ED3\u679C",
    commits: "\u63D0\u4EA4",
    repositoryUnavailable: "\u4ED3\u5E93\u4E0D\u53EF\u7528",
    codeResults: "\u4EE3\u7801\u7ED3\u679C",
    noResultsReturned: "\u6CA1\u6709\u8FD4\u56DE\u7ED3\u679C\u3002",
    no: "\u5426",
    yes: "\u662F",
    noMatchingFiles: "\u6CA1\u6709\u5339\u914D\u7684\u6587\u4EF6\u3002",
    lines: "\u7B2C {start}\u2013{end} \u884C",
    line: "\u7B2C {line} \u884C",
    filesRead: "\u8BFB\u4E86 {count} \u4E2A\u6587\u4EF6",
    evaluated: "\u8BC4\u4F30 {count} \u4E2A",
    listed: "\u5217\u51FA {count} \u4E2A",
    waiting: "\u7B49\u5F85\u4E2D",
    canceled: "\u5DF2\u53D6\u6D88",
    running: "\u8FD0\u884C\u4E2D",
    prompt: "\u63D0\u793A\u8BCD",
    runInBackground: "\u540E\u53F0\u8FD0\u884C",
    resumeSession: "\u7EE7\u7EED\u4F1A\u8BDD",
    session2: "\u4F1A\u8BDD",
    model: "\u6A21\u578B",
    message: "\u6D88\u606F",
    text2: "\u6587\u672C",
    labels: "\u6807\u7B7E",
    count: "\u6570\u91CF",
    success: "\u6210\u529F",
    finishedAt: "\u7ED3\u675F\u65F6\u95F4",
    startedAt: "\u5F00\u59CB\u65F6\u95F4",
    updatedAt: "\u66F4\u65B0\u65F6\u95F4",
    createdAt: "\u521B\u5EFA\u65F6\u95F4",
    branch2: "\u5206\u652F",
    mode: "\u6A21\u5F0F",
    workingDirectory: "\u5DE5\u4F5C\u76EE\u5F55",
    name: "\u540D\u79F0",
    browserTab: "\u6D4F\u89C8\u5668\u6807\u7B7E\u9875",
    terminalID: "\u7EC8\u7AEF ID",
    projectID: "\u9879\u76EE ID",
    workspaceID: "\u5DE5\u4F5C\u533A ID",
    rewindConversationAndFiles: "\u540C\u65F6\u56DE\u9000\u5BF9\u8BDD\u548C\u6587\u4EF6",
    rewindFiles: "\u56DE\u9000\u6587\u4EF6",
    rewindConversation: "\u56DE\u9000\u5BF9\u8BDD",
    toolCalls2: "\u5DE5\u5177\u8C03\u7528",
    thinkingStream: "\u601D\u8003\u8FC7\u7A0B\u6D41",
    mCPServers: "MCP \u670D\u52A1\u5668",
    dynamicModes: "\u52A8\u6001\u5207\u6362\u6A21\u5F0F",
    listSessions: "\u5217\u51FA\u4F1A\u8BDD",
    sessionPersistence: "\u4F1A\u8BDD\u6301\u4E45\u5316",
    streamingOutput: "\u6D41\u5F0F\u8F93\u51FA",
    retryable: "\u53EF\u91CD\u8BD5",
    errorCode: "\u9519\u8BEF\u7801",
    results: "\u7ED3\u679C\uFF08{count}\uFF09",
    request: "\u8BF7\u6C42",
    networkRequests: "\u7F51\u7EDC\u8BF7\u6C42\uFF08{count}\uFF09",
    console: "\u63A7\u5236\u53F0\uFF08{count}\uFF09",
    untitledPage: "\u65E0\u6807\u9898\u9875\u9762",
    browserTabs: "\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\uFF08{count}\uFF09",
    noBrowserTabsReturned: "\u6CA1\u6709\u8FD4\u56DE\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u3002",
    function: "\u51FD\u6570",
    height: "\u9AD8\u5EA6",
    width: "\u5BBD\u5EA6",
    verticalScroll: "\u5782\u76F4\u6EDA\u52A8",
    horizontalScroll: "\u6C34\u5E73\u6EDA\u52A8",
    timeoutMilliseconds: "\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09",
    maximumEntries: "\u6700\u591A\u6761\u6570",
    fullPage: "\u6574\u9875",
    modifiers: "\u4FEE\u9970\u952E",
    doubleClick: "\u53CC\u51FB",
    mouseButton: "\u9F20\u6807\u6309\u952E",
    keys: "\u6309\u952E",
    value: "\u503C",
    targetElement: "\u76EE\u6807\u5143\u7D20",
    sourceElement: "\u8D77\u70B9\u5143\u7D20",
    element: "\u5143\u7D20",
    theScreenshotWasReturnedTo: "\u622A\u56FE\u5DF2\u4F5C\u4E3A\u56FE\u7247\u9644\u4EF6\u8FD4\u56DE\u7ED9 Agent\u3002",
    mIMEType: "MIME \u7C7B\u578B",
    pageStructure: "\u9875\u9762\u7ED3\u6784",
    statistics: "\u7EDF\u8BA1",
    truncated: "\u5DF2\u622A\u65AD",
    format: "\u683C\u5F0F",
    workspace: "\u5DE5\u4F5C\u533A",
    feature: "\u529F\u80FD",
    features: "\u529F\u80FD\uFF08{count}\uFF09",
    thinkingLevel: "\u601D\u8003\u5F3A\u5EA6",
    configuration: "\u914D\u7F6E",
    configurations: "\u914D\u7F6E\uFF08{count}\uFF09",
    noConfigurationsReturned: "\u6CA1\u6709\u8FD4\u56DE\u914D\u7F6E\u3002",
    models: "\u6A21\u578B\uFF08{count}\uFF09",
    noModelsReturned: "\u6CA1\u6709\u8FD4\u56DE\u6A21\u578B\u3002",
    noProvidersReturned: "\u6CA1\u6709\u8FD4\u56DE Provider\u3002",
    selectedModel: "\u9009\u7528\u6A21\u578B",
    enabled: "\u5DF2\u542F\u7528",
    run: "\u8FD0\u884C",
    runHistory: "\u8FD0\u884C\u8BB0\u5F55\uFF08{count}\uFF09",
    noRunHistory: "\u6CA1\u6709\u8FD0\u884C\u8BB0\u5F55\u3002",
    nextRun: "{prefix}\u4E0B\u6B21\u8FD0\u884C ",
    schedule: "\u5B9A\u65F6\u4EFB\u52A1",
    schedules: "\u5B9A\u65F6\u4EFB\u52A1\uFF08{count}\uFF09",
    noSchedulesReturned: "\u6CA1\u6709\u8FD4\u56DE\u5B9A\u65F6\u4EFB\u52A1\u3002",
    isolation: "\u9694\u79BB\u65B9\u5F0F",
    target: "\u76EE\u6807",
    cadence: "\u5468\u671F",
    cadenceAndTarget: "\u5468\u671F\u4E0E\u76EE\u6807",
    maximumRuns: "\u6700\u591A\u8FD0\u884C\u6B21\u6570",
    expiresAt: "\u5230\u671F\u65F6\u95F4",
    lastRun: "\u4E0A\u6B21\u8FD0\u884C",
    nextRun2: "\u4E0B\u6B21\u8FD0\u884C",
    clearExpiration: "\u6E05\u9664\u6709\u6548\u671F",
    expiresIn: "\u6709\u6548\u671F",
    timeZone: "\u65F6\u533A",
    cronExpression: "Cron \u8868\u8FBE\u5F0F",
    terminal: "\u7EC8\u7AEF",
    sendLiterally: "\u6309\u539F\u6587\u53D1\u9001",
    terminalOutput: "\u7EC8\u7AEF\u8F93\u51FA",
    totalLines: "\u603B\u884C\u6570",
    stripColorCodes: "\u53BB\u6389\u989C\u8272\u4EE3\u7801",
    scrollbackLines: "\u56DE\u6EDA\u884C\u6570",
    endLine: "\u7ED3\u675F\u884C",
    startLine: "\u8D77\u59CB\u884C",
    allDirectories: "\u6240\u6709\u76EE\u5F55",
    terminals: "\u7EC8\u7AEF\uFF08{count}\uFF09",
    noTerminalsReturned: "\u6CA1\u6709\u8FD4\u56DE\u7EC8\u7AEF\u3002",
    scripts: "\u811A\u672C\uFF08{count}\uFF09",
    noWorkspaceScriptsReturned: "\u6CA1\u6709\u8FD4\u56DE\u5DE5\u4F5C\u533A\u811A\u672C\u3002",
    workspaces: "\u5DE5\u4F5C\u533A\uFF08{count}\uFF09",
    noWorkspacesReturned: "\u6CA1\u6709\u8FD4\u56DE\u5DE5\u4F5C\u533A\u3002",
    newTitle: "\u65B0\u6807\u9898",
    removedDirectory: "\u5DF2\u5220\u9664\u7684\u76EE\u5F55",
    archivedAgents: "\u5DF2\u5F52\u6863\u7684 Agent",
    forge: "\u4EE3\u7801\u6258\u7BA1",
    mergeRequest: "\u5408\u5E76\u8BF7\u6C42",
    baseBranch: "\u57FA\u51C6\u5206\u652F",
    worktree: "\u5DE5\u4F5C\u6811",
    project: "\u9879\u76EE",
    type: "\u7C7B\u578B",
    noAgentsReturned: "\u6CA1\u6709\u8FD4\u56DE Agent\u3002",
    reply: "\u56DE\u590D",
    settings: "\u8BBE\u7F6E",
    newMode: "\u65B0\u6A21\u5F0F",
    activity: "\u52A8\u6001",
    updates: "\u66F4\u65B0\u6570",
    limit: "\u6570\u91CF\u4E0A\u9650",
    includeArchived: "\u5305\u542B\u5DF2\u5F52\u6863",
    recentHours: "\u6700\u8FD1\uFF08\u5C0F\u65F6\uFF09",
    statusFilter: "\u72B6\u6001\u7B5B\u9009",
    permission: "\u6743\u9650",
    hint: "\u63D0\u793A",
    lastMessage: "\u6700\u540E\u4E00\u6761\u6D88\u606F",
    notifyOnCompletion: "\u5B8C\u6210\u65F6\u901A\u77E5",
    sessionMode: "\u4F1A\u8BDD\u6A21\u5F0F",
    sendMode: "\u53D1\u9001\u65B9\u5F0F",
    thinkingLevel2: "\u601D\u8003\u5F3A\u5EA6 {level}",
    action: "\u64CD\u4F5C",
    permissionRequest: "\u6743\u9650\u8BF7\u6C42",
    noPendingApprovals: "\u6CA1\u6709\u5F85\u5BA1\u6279\u3002",
    availableModes: "\u53EF\u7528\u6A21\u5F0F",
    pendingApprovals: "\u5F85\u5BA1\u6279\uFF08{count}\uFF09",
    capabilities: "\u80FD\u529B",
    latestError: "\u6700\u8FD1\u9519\u8BEF",
    needsAttention: "\u9700\u8981\u5173\u6CE8",
    original: "{prefix}{time}\uFF0C\u539F\u6587 {value}",
    context: "\u4E0A\u4E0B\u6587 {value}",
    waitLog: "\u7B49\u5F85\u65E5\u5FD7",
    runFinished: "\u8FD0\u884C\u7ED3\u675F",
    completed2: "\u5DF2\u5B8C\u6210\uFF08{count}\uFF09",
    providerEntries: "Provider \u6761\u76EE",
    activeRuns: "\u8FDB\u884C\u4E2D\u7684\u8FD0\u884C",
    stopWhenAttentionIsNeeded: "\u9700\u8981\u5173\u6CE8\u65F6\u505C\u6B62",
    nonblocking: "\u975E\u963B\u585E",
    timeout: "\u8D85\u65F6",
    wait: "\u7B49\u5F85",
    overview: "\u6982\u51B5",
    noPendingSubagentRequests: "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u5B50 Agent \u8BF7\u6C42\u3002",
    to: "\u53D1\u7ED9",
    confirmation: "\u786E\u8BA4",
    requestID: "\u8BF7\u6C42 ID",
    replyMessage: "\u56DE\u590D\u6D88\u606F",
    steerMessage: "\u5F15\u5BFC\u6D88\u606F",
    transcript: "\u5BF9\u8BDD\u8BB0\u5F55",
    duration: "\u8017\u65F6",
    context2: "\u4E0A\u4E0B\u6587",
    toolCallCount: "\u5DE5\u5177\u8C03\u7528\u6B21\u6570",
    checkResultsWithoutWaiting: "\u975E\u963B\u585E\u67E5\u770B\u7ED3\u679C",
    waitUntilFinished: "\u963B\u585E\u7B49\u5F85",
    expandAll: "\u5C55\u5F00\u5168\u90E8",
    expandFullText: "\u5C55\u5F00\u5168\u6587",
    collapse2: "\u6536\u8D77{title}",
    thisPromptIsLongOnly: "\u63D0\u95EE\u592A\u957F\uFF0C\u8FD9\u91CC\u53EA\u663E\u793A\u524D {count} \u5B57\u3002",
    copyFirstCharacters: "\u590D\u5236{title}\uFF08\u524D {count} \u5B57\uFF09",
    tasks: "\u4EFB\u52A1\uFF08{count}\uFF09",
    waitingForToFinish: "\u7B49\u5F85 {tasks} \u5B8C\u6210",
    moreSteps: "\u8FD8\u6709 {count} \u6B65\u2026",
    childReadFailed: "\u8BFB\u53D6\u5B50 Agent \u52A8\u6001\u5931\u8D25\uFF1A{error}",
    queryValue: "\u67E5\u8BE2\uFF1A{value}",
    branchValue: "\u5206\u652F\uFF1A{value}",
    pathValue: "\u8DEF\u5F84\uFF1A{value}",
    sessionValue: "\u4F1A\u8BDD {value}",
    scopeValue: "\u8303\u56F4\uFF1A{value}",
    keywordsValue: "\u5173\u952E\u8BCD\uFF1A{value}",
    listTitle: "{title}\uFF08{count}\uFF09",
    agentsCount: "Agent\uFF08{count}\uFF09",
    providersCount: "Provider\uFF08{count}\uFF09",
    answerPair: "{question}\uFF1A{answer}",
    clockLine: "{prefix}{day} {clock}",
    relativeSuffix: "\uFF08{relative}\uFF09",
    agent: "Agent",
    agentId: "Agent ID",
    provider: "Provider",
    id: "ID",
    token: "Token",
    sha: "SHA",
    mcp: "MCP",
    tokens: "{count} token",
    timeoutValue: "{time} timeout",
    httpStatus: "HTTP {code} {status}",
    availableActionsValue: "\u53EF\u9009\u64CD\u4F5C\uFF1A{actions}",
    toolsCount: "\u5DE5\u5177\uFF08{count}\uFF09",
    toolsRemaining: "\u5DE5\u5177\uFF08{count} \xB7 \u76EE\u5F55\u91CC\u8FD8\u6709 {remaining} \u4E2A\uFF09",
    expandToolsCount: "\u5C55\u5F00\u5168\u90E8\uFF08\u5DF2\u5217\u51FA {count} \u4E2A\uFF09",
    expandToolsRemaining: "\u5C55\u5F00\u5168\u90E8\uFF08\u5DF2\u5217\u51FA {count} \u4E2A\uFF0C\u8FD8\u6709 {remaining} \u4E2A\uFF09",
    metaSeparator: " \xB7 ",
    milliseconds: "{count} ms",
    expandTitle: "\u5C55\u5F00 {title}",
    collapseTitle: "\u6536\u8D77 {title}",
    expandPrompt: "\u5C55\u5F00\u63D0\u793A\u8BCD\uFF1A{text}",
    collapsePrompt: "\u6536\u8D77\u63D0\u793A\u8BCD\uFF1A{text}",
    mcpSummary: "{server} \xB7 {tool}",
    scoreSuffix: " \xB7 {score}%",
    numberedStep: "{number}. {title}",
    childOnHost: "\u5728 {host} \u4E0A\u8FD0\u884C",
    childHostOffline: "\u73B0\u5728\u8FDE\u4E0D\u4E0A {host}\uFF0C\u8BFB\u4E0D\u5230\u8FD9\u4E2A\u5B50 Agent \u7684\u52A8\u6001\uFF1B\u8FDE\u4E0A\u540E\u4F1A\u81EA\u52A8\u518D\u8BFB\u3002",
    childWaitsApproval: "\u7B49\u4F60\u6279\u51C6",
    childAsks: "\u5728\u95EE\u4F60",
    childWaitsApprovalNote: "\u5B50 Agent \u5728\u7B49\u4F60\u6279\u51C6\u4E00\u4E2A\u64CD\u4F5C\uFF0C\u6253\u5F00\u5B83\u7684\u5BF9\u8BDD\u5904\u7406\u3002",
    childAsksNote: "\u5B50 Agent \u6709\u95EE\u9898\u8981\u95EE\u4F60\uFF0C\u6253\u5F00\u5B83\u7684\u5BF9\u8BDD\u56DE\u7B54\u3002",
    childFailedNote: "\u5B50 Agent \u51FA\u9519\u505C\u4E0B\u4E86\uFF1A{error}"
  },
  settings: {
    timeSection: "\u65F6\u95F4\u663E\u793A",
    turnTimeLabel: "\u6BCF\u8F6E\u7ED3\u675F\u540E\u663E\u793A\u65F6\u95F4",
    turnTimeHint: "\u5728\u65B0\u8F6E\u6B21\u7ED3\u675F\u65F6\u8BB0\u5F55\u65F6\u95F4\uFF1B\u5DF2\u6709\u8F6E\u6B21\u4E0D\u4F1A\u8865\u5199\uFF0C\u5173\u95ED\u540E\u5DF2\u8BB0\u5F55\u7684\u65F6\u95F4\u4ECD\u4F1A\u663E\u793A\u3002",
    foldTimeLabel: "\u6D3B\u52A8\u884C\u663E\u793A\u66F4\u65B0\u65F6\u95F4",
    foldTimeHint: "\u663E\u793A\u6D3B\u52A8\u884C\u6216\u6298\u53E0\u6458\u8981\u7684\u6700\u8FD1\u66F4\u65B0\u65F6\u95F4\uFF0C\u4F7F\u7528\u67E5\u770B\u8BBE\u5907\u7684\u672C\u5730\u65F6\u533A\u3002",
    savedSettings: "\u5DF2\u4FDD\u5B58\u7684\u8BBE\u7F6E",
    restoreDefaults: "\u6062\u590D\u9ED8\u8BA4",
    vividActivity: "\u5F69\u8272\u6D3B\u52A8\u884C",
    readingSettings: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026",
    palette: "\u8C03\u8272\u677F",
    theseColorsAndExpansionSettings: "\u4E0B\u9762\u7684\u914D\u8272\u548C\u5C55\u5F00\u65B9\u5F0F\u5728\u91CD\u65B0\u6253\u5F00\u63A5\u7BA1\u540E\u751F\u6548\u3002",
    takeoverIsOff: "\u63A5\u7BA1\u5DF2\u5173\u95ED",
    colors: "\u914D\u8272",
    sidebarSection: "\u4FA7\u8FB9\u680F",
    sidebarEntry: "\u663E\u793A\u4FA7\u8FB9\u680F\u5165\u53E3",
    sidebarHint: "\u5173\uFF1A\u4ECE\u5DE6\u4FA7\u8FB9\u680F\u79FB\u9664\u672C\u63D2\u4EF6\u7684\u8BBE\u7F6E\u5165\u53E3\uFF1B\u547D\u4EE4\u9762\u677F\u5165\u53E3\u4E0D\u53D7\u5F71\u54CD\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    expandScrollSection: "\u5C55\u5F00\u4E0E\u6EDA\u52A8",
    followGroup: "\u8DDF\u968F\u6700\u65B0\u8F93\u51FA",
    followHint: "\u5F00\uFF1A\u5C55\u5F00\u533A\u57DF\u7684\u8F93\u51FA\u66F4\u65B0\u65F6\u81EA\u52A8\u6EDA\u5230\u6700\u65B0\uFF1B\u5411\u4E0A\u6EDA\u52A8\u5373\u6682\u505C\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    followShell: "\u547D\u4EE4\u8F93\u51FA",
    followLogs: "\u5DE5\u4F5C\u6811\u4E0E\u5B50 Agent \u65E5\u5FD7",
    followTodo: "\u4EFB\u52A1\u6E05\u5355",
    wrapGroup: "\u957F\u884C\u6298\u884C",
    wrapHint: "\u5F00\uFF1A\u957F\u884C\u6298\u5230\u53EF\u7528\u5BBD\u5EA6\uFF1B\u5173\uFF1A\u5355\u884C\u6A2A\u5411\u6EDA\u52A8\u3002\u884C\u5934\u4E0E\u8DEF\u5F84\u4FDD\u6301\u5355\u884C\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    wrapDiff: "diff\uFF08\u6539\u52A8\uFF09",
    wrapCode: "\u4EE3\u7801\u4E0E\u6587\u4EF6",
    wrapOutput: "\u547D\u4EE4\u884C\u4E0E\u8F93\u51FA",
    expansion: "\u5C55\u5F00\u65B9\u5F0F",
    takeoverScope: "\u63A5\u7BA1\u8303\u56F4",
    pinThisTurnSPrompt: "\u9489\u4F4F\u672C\u8F6E\u63D0\u95EE",
    rowDensity: "\u884C\u5BC6\u5EA6",
    strength: "\u6DE1\u51FA\u5F3A\u5EA6",
    strengthDim: "30%\uFF1A\u53EA\u5269\u6DE1\u6DE1\u7684\u8F6E\u5ED3\uFF1B\u60AC\u505C\u3001\u805A\u7126\u6216\u5C55\u5F00\u5373\u53EF\u770B\u6E05\u3002",
    strengthFaded: "45%\uFF1A\u660E\u663E\u53D8\u6DE1\uFF0C\u4ECD\u53EF\u8FA8\u8BA4\u3002",
    strengthSoft: "65%\uFF1A\u8F7B\u5FAE\u53D8\u6DE1\u3002",
    strengthFull: "\u4E0D\u6DE1\u5316\uFF0C\u6240\u6709\u884C\u4FDD\u6301\u539F\u6837\u3002",
    codeAndDiffs: "\u4EE3\u7801\u4E0E diff",
    preview: "\u9884\u89C8",
    previewPinned: "\u9489\u4F4F\u7684\u63D0\u95EE",
    previewWindow: "\u5C3E\u7A97",
    previewHead20: "\u524D 20 \u884C",
    previewFoldTitle: "{count} \u6B65",
    previewFoldCounts: "\u547D\u4EE4 2 \xB7 \u601D\u8003 2",
    previewFoldAuto: "\u542B\u5931\u8D25\u2014\u2014\u81EA\u52A8\u5C55\u5F00",
    previewFollow: "\u8DDF\u968F\u4E2D",
    previewTokens: "\u672C\u8F6E \u8F93\u5165 12k \xB7 \u7F13\u5B58 80k \xB7 \u8F93\u51FA 2.4k",
    previewThinkingOnly: "\u4EC5\u601D\u8003\u884C\uFF1A\u63D2\u4EF6\u53EA\u91CD\u7ED8\u601D\u8003\u884C\uFF0C\u5DE5\u5177\u884C\u7531 Paseo \u663E\u793A\u3002",
    previewTakeoverOff: "\u63A5\u7BA1\u5DF2\u5173\u95ED\u2014\u2014\u63D2\u4EF6\u4E0D\u7ED8\u5236\u4EFB\u4F55\u884C\uFF0C\u6CA1\u6709\u53EF\u9884\u89C8\u7684\u5185\u5BB9\u3002",
    previewQuestion: "\u628A\u767B\u5F55\u6A21\u5757\u7684\u8D85\u65F6\u91CD\u8BD5\u6539\u6210\u6307\u6570\u9000\u907F\uFF0C\u5E76\u8865\u4E0A\u6D4B\u8BD5\u3002",
    previewReasoning: "\u7B2C 1 \u6B65\uFF1A\u5148\u627E\u5230\u8D85\u65F6\u914D\u7F6E\u7684\u6765\u6E90\u3002\n\u7B2C 2 \u6B65\uFF1A\u8BFB\u91CD\u8BD5\u8F85\u52A9\u51FD\u6570\u3002\n\u7B2C 3 \u6B65\uFF1A\u68C0\u67E5\u73B0\u6709\u6D4B\u8BD5\u3002\n\u7B2C 4 \u6B65\uFF1A\u8D77\u8349\u6307\u6570\u9000\u907F\u3002\n\u7B2C 5 \u6B65\uFF1A\u57FA\u7840\u95F4\u9694 200 \u6BEB\u79D2\u3002\n\u7B2C 6 \u6B65\uFF1A\u6700\u591A\u91CD\u8BD5 5 \u6B21\u3002\n\u7B2C 7 \u6B65\uFF1A\u52A0\u6296\u52A8\u3002\n\u7B2C 8 \u6B65\uFF1A\u8865\u8D85\u65F6\u5206\u652F\u6D4B\u8BD5\u3002\n\u7B2C 9 \u6B65\uFF1A\u8865\u6210\u529F\u5206\u652F\u6D4B\u8BD5\u3002\n\u7B2C 10 \u6B65\uFF1A\u8DD1\u6D4B\u8BD5\u3002\n\u7B2C 11 \u6B65\uFF1A\u4FEE\u6296\u52A8\u7528\u4F8B\u3002\n\u7B2C 12 \u6B65\uFF1A\u91CD\u8DD1\u3002\n\u7B2C 13 \u6B65\uFF1A\u66F4\u65B0 README\u3002\n\u7B2C 14 \u6B65\uFF1A\u8BB0\u5F55\u65B0\u8BBE\u7F6E\u3002\n\u7B2C 15 \u6B65\uFF1A\u6574\u7406\u5BFC\u51FA\u3002\n\u7B2C 16 \u6B65\uFF1A\u590D\u67E5\u7C7B\u578B\u3002\n\u7B2C 17 \u6B65\uFF1A\u91CD\u8DD1\u6D4B\u8BD5\u3002\n\u7B2C 18 \u6B65\uFF1A\u5168\u7EFF\u3002\n\u7B2C 19 \u6B65\uFF1A\u5199\u603B\u7ED3\u3002\n\u7B2C 20 \u6B65\uFF1A\u5F00 PR\u3002\n\u7B2C 21 \u6B65\uFF1A\u7B49\u5BA1\u67E5\u3002\n\u7B2C 22 \u6B65\uFF1A\u5904\u7406\u610F\u89C1\u3002\n\u7B2C 23 \u6B65\uFF1A\u538B\u7F29\u63D0\u4EA4\u3002\n\u7B2C 24 \u6B65\uFF1A\u6700\u7EC8\u5168\u91CF\u3002\n\u7B2C 25 \u6B65\uFF1A\u63A8\u9001\u3002\n\u7B2C 26 \u6B65\uFF1A\u5B8C\u6210\u3002",
    thoughtRows: "\u601D\u8003\u884C",
    tailFollow: "\u5B9E\u65F6\u8DDF\u968F\u8F93\u51FA",
    tailFollowHint: "\u5F00\uFF1A\u5C55\u5F00\u7684\u601D\u8003\u6846\u663E\u793A\u6700\u65B0\u5185\u5BB9\u5E76\u968F\u8F93\u51FA\u5B9E\u65F6\u6EDA\u52A8\u3002\u5173\uFF1A\u505C\u5728\u5F00\u5934 20 \u884C\uFF08\u81F3\u591A 4000 \u5B57\u7B26\uFF09\uFF0C\u9700\u624B\u52A8\u70B9\u300C\u5C55\u5F00\u5168\u90E8\u300D\u3002",
    tailLines: "\u7A97\u53E3\u5927\u5C0F",
    tailLinesHint: "\u7A97\u53E3\u4FDD\u7559\u7684\u884C\u6570\uFF08\u5168\u6587\u89C6\u56FE\uFF09\u6216\u6B65\u6570\uFF08\u5206\u6B65\u89C6\u56FE\uFF09\uFF0C5\u2013500\uFF0C\u9ED8\u8BA4 20\u3002",
    tailLinesInvalid: "\u8BF7\u8F93\u5165 5\u2013500 \u7684\u6574\u6570\u3002",
    commandColors: "\u547D\u4EE4\u7740\u8272",
    commandColorsHint: "\u884C\u5934 shell \u547D\u4EE4\u7684\u8BED\u6CD5\u7740\u8272\uFF08\u989C\u8272\u6765\u81EA\u4E3B\u9898\uFF09\u3002",
    whenOpen: "\u5C55\u5F00\u65F6",
    alwaysColored: "\u59CB\u7EC8",
    foldConsecutiveThinkingAndTool: "\u5B8C\u6210\u540E\u6298\u53E0\u8FDE\u7EED\u7684\u601D\u8003\u4E0E\u5DE5\u5177\u884C",
    foldingSpacingAndPrompts: "\u6298\u53E0\u3001\u884C\u8DDD\u4E0E\u63D0\u95EE",
    takeoverIsOffFoldingAnd: "\u63A5\u7BA1\u5DF2\u5173\u95ED\uFF0C\u6298\u53E0\u3001\u884C\u5BC6\u5EA6\u548C\u6DE1\u51FA\u5F3A\u5EA6\u5728\u91CD\u65B0\u6253\u5F00\u63A5\u7BA1\u540E\u751F\u6548\u3002",
    onlyThinkingRowsAreTaken: "\u73B0\u5728\u53EA\u63A5\u7BA1\u601D\u8003\u884C\uFF1A\u53EA\u6709\u76F8\u90BB\u7684\u601D\u8003\u884C\u4F1A\u6298\u53E0\uFF1B\u5DE5\u5177\u884C\u7531 Paseo \u663E\u793A\uFF0C\u53EF\u7528\u300C\u8BBE\u7F6E \u2192 \u804A\u5929 \u2192 \u5DE5\u5177\u8C03\u7528\u663E\u793A \u2192 \u6458\u8981\u300D\u5408\u5E76\u3002",
    theSameRowHeightAnd: "\u884C\u9AD8\u548C\u884C\u8DDD\u4E0E\u4E4B\u524D\u7684\u7248\u672C\u76F8\u540C\uFF0C\u884C\u4E0E\u884C\u4E4B\u95F4\u7559 10px\u3002",
    shorterRowsWith4Px: "\u884C\u66F4\u77EE\uFF0C\u884C\u4E0E\u884C\u4E4B\u95F4\u53EA\u7559 4px\uFF08\u62B5\u6389 Paseo \u7ED9\u6BCF\u6761\u63D2\u4EF6\u884C\u52A0\u7684 16px \u95F4\u8DDD\uFF09\uFF1B\u540C\u6837\u4E00\u5C4F\uFF0C\u624B\u673A\u591A\u653E\u7EA6\u4E24\u6210\u3001\u684C\u9762\u591A\u653E\u7EA6\u56DB\u6210\u3002",
    standard: "\u6807\u51C6",
    compact: "\u7D27\u51D1",
    planCardsTaskRowsApproval: "\u8BA1\u5212\u5361\u3001\u4EFB\u52A1\u884C\u3001\u5BA1\u6279\u5361\uFF0C\u4EE5\u53CA Bots \u7B49\u63D2\u4EF6\u81EA\u5DF1\u7684\u5361\u7247\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    alwaysDisplayedByPaseo: "\u59CB\u7EC8\u7531 Paseo \u663E\u793A",
    tradeoffsOfReplacingToolRows: "\u63A5\u7BA1\u5DE5\u5177\u884C\u7684\u4EE3\u4EF7",
    takeover: "\u63A5\u7BA1",
    expandOnlyTheLatestTask: "\u53EA\u5C55\u5F00\u6700\u65B0\u7684\u4EFB\u52A1\u6E05\u5355\u7C7B\u5DE5\u5177\u884C\u3002",
    startTaskListToolRows: "\u4EFB\u52A1\u6E05\u5355\u7C7B\u5DE5\u5177\u884C\u9ED8\u8BA4\u6536\u8D77\u3002",
    alwaysExpandTaskListTool: "\u4EFB\u52A1\u6E05\u5355\u7C7B\u5DE5\u5177\u884C\u603B\u662F\u5C55\u5F00\u3002",
    startCollapsedEvenWhileRunning: "\u4E00\u5F00\u59CB\u6536\u8D77\uFF0C\u8FD0\u884C\u4E2D\u4E5F\u4E00\u6837\uFF1B\u70B9\u4E00\u4E0B\u5373\u53EF\u5C55\u5F00\u3002",
    expandOnlyTheLatestRow: "\u53EA\u6709\u6700\u65B0\u4E00\u884C\u5C55\u5F00\uFF0C\u540E\u9762\u6765\u4E86\u65B0\u884C\u5C31\u6536\u8D77\u3002",
    expandEveryRowOldAnd: "\u4E0D\u8BBA\u65B0\u65E7\u90FD\u5C55\u5F00\u3002",
    collapsedByDefault: "\u9ED8\u8BA4\u6536\u8D77",
    expandLatestOnly: "\u53EA\u5C55\u5F00\u6700\u65B0",
    expandFailedRows: "\u53EA\u5C55\u5F00\u5931\u8D25\u7684\u884C",
    expandFailedRowsHint: "\u53EA\u5C55\u5F00\u5931\u8D25\u7684\u884C\uFF1B\u8FD0\u884C\u4E2D\u7684\u884C\u5931\u8D25\u540E\u5373\u65F6\u5C55\u5F00\u3002\u601D\u8003\u884C\u4E0E\u4EFB\u52A1\u6E05\u5355\u7B49\u540C\u9ED8\u8BA4\u6536\u8D77\u3002",
    alwaysExpand: "\u603B\u662F\u5C55\u5F00",
    thickerSeparatorsAndStrongerStatus: "\u66F4\u7C97\u7684\u5206\u9694\u7EBF\u548C\u66F4\u5F3A\u7684\u72B6\u6001\u8272\u3002",
    iconsAreMostlyNeutralOnly: "\u56FE\u6807\u57FA\u672C\u4E2D\u6027\uFF0C\u53EA\u6709\u72B6\u6001\u6709\u989C\u8272\u3002",
    theOriginalColorfulAgentActivity: "\u539F\u7248 colorful-agent-activity \u7684\u914D\u8272\uFF1A\u56FE\u6807\u53D6\u5F53\u524D\u4E3B\u9898\u7684\u5F3A\u8C03\u8272\uFF0C\u884C\u80CC\u666F\u4FDD\u6301\u4E2D\u6027\u3002",
    eachToolCategoryHasA: "\u6BCF\u7C7B\u5DE5\u5177\u4E00\u4E2A\u989C\u8272\uFF08\u601D\u8003\u7D2B\u3001\u8BFB\u6587\u4EF6\u84DD\u3001\u6539\u6587\u4EF6\u7EFF\u3001\u547D\u4EE4\u6A59\u3001\u641C\u7D22\u975B\u2026\u2026\uFF09\uFF1B\u8FD0\u884C\u4E2D\u84DD\u8272\u8F6C\u5708\u3001\u7B49\u4F60\u6279\u51C6\u7425\u73C0\u95EA\u52A8\u3001\u5931\u8D25\u7EA2\u8272\u3001\u5B8C\u6210\u7EFF\u8272\u3002",
    highContrast: "\u9AD8\u5BF9\u6BD4",
    soft: "\u67D4\u548C",
    followThemeColors: "\u8DDF\u968F\u4E3B\u9898\u8272",
    vivid: "\u9C9C\u660E",
    letPaseoDisplayAllRows: "\u5168\u90E8\u4EA4\u8FD8 Paseo \u539F\u6837\u663E\u793A\uFF1B\u63D2\u4EF6\u4FDD\u6301\u5B89\u88C5\uFF0C\u968F\u65F6\u53EF\u4EE5\u91CD\u65B0\u6253\u5F00\u3002",
    redrawThinkingRowsOnlyPaseo: "\u53EA\u91CD\u7ED8\u601D\u8003\u884C\uFF1B\u5DE5\u5177\u884C\u4FDD\u6301 Paseo \u539F\u6837\uFF0C\u53EF\u4EE5\u6309\u300C\u6458\u8981\u300D\u5408\u5E76\u3001\u70B9\u8DEF\u5F84\u6253\u5F00\u6587\u4EF6\u3002",
    replaceThinkingAndToolCall: "\u601D\u8003\u884C\u548C\u5DE5\u5177\u8C03\u7528\u884C\u90FD\u6362\u6210\u5F69\u8272\u4E2D\u6587\u884C\u3002",
    off: "\u5173\u95ED",
    thinkingRowsOnly: "\u4EC5\u601D\u8003\u884C",
    all: "\u5168\u90E8",
    otherTools: "\u5176\u4ED6\u5DE5\u5177",
    taskListTools: "\u4EFB\u52A1\u6E05\u5355\u5DE5\u5177",
    readAloud: "\u6717\u8BFB",
    ask: "\u63D0\u95EE",
    plan: "\u8BA1\u5212",
    plainTextResults: "\u7EAF\u6587\u672C\u7ED3\u679C",
    subagent: "\u5B50 Agent",
    worktreeSetup: "\u5DE5\u4F5C\u6811\u51C6\u5907",
    fetchPage: "\u6293\u53D6\u7F51\u9875",
    search: "\u641C\u7D22",
    writeFile: "\u5199\u5165\u6587\u4EF6",
    editFile: "\u7F16\u8F91\u6587\u4EF6",
    readFile: "\u8BFB\u53D6\u6587\u4EF6",
    takeoverCosts: "\xB7 \u300C\u8BBE\u7F6E \u2192 \u804A\u5929 \u2192 \u5DE5\u5177\u8C03\u7528\u663E\u793A \u2192 \u6458\u8981\u300D\u4E0D\u518D\u628A\u5DE5\u5177\u884C\u5408\u5E76\u6210\u4E00\u53E5\n\xB7 \u4E0D\u80FD\u70B9\u6587\u4EF6\u8DEF\u5F84\u76F4\u63A5\u6253\u5F00\u6587\u4EF6\n\xB7 \u624B\u673A\u4E0A\u5DE5\u5177\u8BE6\u60C5\u6539\u4E3A\u5728\u884C\u5185\u5C55\u5F00\uFF0C\u4E0D\u518D\u5F39\u51FA\u8BE6\u60C5\u9875",
    foldHint: "\u4E00\u6BB5\u601D\u8003\u548C\u5DE5\u5177\u8C03\u7528\u5168\u90E8\u5B8C\u6210\u540E\u6536\u6210\u4E00\u884C\uFF1A\u7C7B\u522B\u8BA1\u6570\u3001\u5931\u8D25\u6570\u3001\u7528\u65F6\uFF0C\u4EE5\u53CA\u6539\u4E86\u51E0\u4E2A\u6587\u4EF6\u3001\u52A0\u5220\u51E0\u884C\uFF08\u53EA\u7B97\u884C\u6570\u5DF2\u77E5\u7684\u7F16\u8F91\uFF09\uFF1B\u4E00\u8F6E\u7684\u6700\u540E\u4E00\u6BB5\u53E6\u5E26\u672C\u8F6E token\uFF08\u53EA\u9650\u8FD0\u884C\u65F6\u770B\u8FC7\u7684\u8F6E\u6B21\uFF09\u3002\u70B9\u4E00\u4E0B\u5C55\u5F00\uFF0C\u5217\u51FA\u6BCF\u4E2A\u6587\u4EF6\u548C\u5931\u8D25\u7684\u547D\u4EE4\uFF0C\u518D\u70B9\u6536\u8D77\u3002\u8FD0\u884C\u4E2D\u7684\u6BB5\u53EA\u7559\u8FD0\u884C\u4E2D\u3001\u7B49\u4F60\u6279\u51C6\u3001\u5931\u8D25\u7684\u884C\u548C\u6700\u8FD1\u4E24\u6B65\uFF0C\u66F4\u65E9\u7684\u6536\u6210\u300C\u524D\u9762 N \u6B65\u300D\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    pinHint: "Agent \u5E72\u4E86\u5F88\u4E45\u3001\u4E2D\u95F4\u8BF4\u8FC7\u51E0\u6BB5\u8BDD\u4E4B\u540E\uFF0C\u628A\u4F60\u8FD9\u4E00\u8F6E\u7684\u63D0\u95EE\u9489\u5728\u6700\u65B0\u4E00\u6BB5\u6D3B\u52A8\u7684\u4E0A\u65B9\uFF1A\u9ED8\u8BA4\u663E\u793A\u4E09\u884C\uFF0C\u70B9\u4E00\u4E0B\u770B\u5168\u6587\uFF0C\u53EF\u4EE5\u590D\u5236\u3002\u63D0\u95EE\u8FD8\u5728\u9644\u8FD1\uFF08\u5927\u7EA6\u4E00\u5C4F\u4E4B\u5185\uFF09\u65F6\u4E0D\u663E\u793A\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    runningAnimation: "\u8FD0\u884C\u4E2D\u52A8\u753B",
    loaderSpinner: "\u8F6C\u5708",
    loaderSparkle: "\u661F\u8292",
    loaderOrb: "\u5149\u7403",
    loaderSnake: "\u70B9\u9635 \xB7 \u86C7\u5F62",
    loaderMatrix: "\u70B9\u9635 \xB7 \u95EA\u70C1",
    loaderHint: "\u8FD0\u884C\u4E2D\u7684\u884C\u672B\u5C3E\u7684\u6807\u8BB0\uFF1A\u8F6C\u5708\uFF08\u9ED8\u8BA4\uFF09\u3001Claude Code \u5F0F\u7684\u661F\u8292\u3001\u547C\u5438\u7684\u5149\u7403\uFF0C\u6216 3\xD73 \u70B9\u9635\u3002App \u5728\u540E\u53F0\u65F6\u6682\u505C\uFF0C\u7CFB\u7EDF\u5F00\u542F\u300C\u51CF\u5C11\u52A8\u6001\u6548\u679C\u300D\u65F6\u9759\u6B62\u3002\u6539\u52A8\u5BF9\u6240\u6709\u8BBE\u5907\u751F\u6548\u3002",
    codeFont: "\u4EE3\u7801\u5B57\u4F53",
    fontFamily: "\u5B57\u4F53",
    fontFamilyHint: '\u7F51\u9875\u548C\u684C\u9762\u7AEF\u751F\u6548\u3002\u586B\u6253\u5F00 Paseo \u7684\u8BBE\u5907\u4E0A\u5DF2\u5B89\u88C5\u7684\u5B57\u4F53\uFF0C\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982 "JetBrains Mono", monospace\u3002\u7559\u7A7A\u7528\u9ED8\u8BA4\u5B57\u4F53\uFF1B\u8BBE\u5907\u4E0A\u6CA1\u6709\u7684\u5B57\u4F53\u4F1A\u9000\u56DE\u9ED8\u8BA4\u5B57\u4F53\u3002\u624B\u673A App \u4ECD\u7528\u7CFB\u7EDF\u7B49\u5BBD\u5B57\u4F53\u3002',
    fontFamilyInvalid: "\u53EA\u80FD\u586B\u5B57\u4F53\u540D\uFF08\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u7A7A\u683C\u548C . _ + -\uFF09\uFF0C\u7528\u9017\u53F7\u5206\u9694\uFF0C\u6700\u591A 200 \u4E2A\u5B57\u7B26\u3002",
    apply: "\u5E94\u7528",
    textSize: "\u5B57\u53F7",
    textSizeHint: "\u884C\u91CC\u7528\u4EE3\u7801\u5B57\u4F53\u753B\u7684\u5185\u5BB9\uFF1A\u6458\u8981\u3001\u8DEF\u5F84\u3001\u547D\u4EE4\u3001\u4EE3\u7801\u3001\u5DEE\u5F02\u3001\u5DE5\u5177\u8F93\u51FA\u548C\u601D\u8003\u6B63\u6587\u3002\u6807\u9898\u548C\u6807\u7B7E\u7684\u5B57\u53F7\u4E0D\u53D8\u3002",
    sizeSmall: "\u5C0F\uFF0811 px\uFF09",
    sizeStandard: "\u6807\u51C6\uFF0812 px\uFF09",
    sizeLarge: "\u5927\uFF0814 px\uFF09",
    sizeLarger: "\u66F4\u5927\uFF0816 px\uFF09",
    lineSpacing: "\u884C\u8DDD",
    relaxed: "\u5BBD\u677E",
    codeFontPreview: "\u9884\u89C8",
    applyFont: "\u4F7F\u7528\u4E0A\u9762\u7684\u5B57\u4F53",
    followBrowser: "\u6D4F\u89C8\u5668",
    browserTools: "\u6D4F\u89C8\u5668\u5DE5\u5177"
  },
  childSummary: {
    activity: "\u52A8\u6001",
    thinking: "\u601D\u8003",
    prompt: "\u63D0\u793A\u8BCD",
    tasks: "\u4EFB\u52A1",
    error: "\u9519\u8BEF",
    notification: "\u901A\u77E5",
    warning: "\u8B66\u544A",
    success: "\u6210\u529F",
    compacted: "\u4E0A\u4E0B\u6587\u5DF2\u538B\u7F29",
    agent: "Agent",
    completed: "\u5DF2\u5B8C\u6210 {done}/{total} \u9879"
  },
  notice: {
    completed: "\u5DF2\u5B8C\u6210",
    failed: "\u5931\u8D25",
    stopped: "\u5DF2\u505C\u6B62",
    lowMemory: "\u5DF2\u505C\u6B62\uFF08\u5185\u5B58\u4E0D\u8DB3\uFF09",
    timeLimit: "\u5DF2\u505C\u6B62\uFF08\u5230\u4E86\u540E\u53F0\u8FD0\u884C\u65F6\u9650\uFF09",
    waitingInput: "\u50CF\u662F\u5728\u7B49\u4EA4\u4E92\u8F93\u5165",
    stoppedByUser: "\u88AB\u4F60\u505C\u6B62",
    stoppedByClaude: "\u88AB Claude \u505C\u6B62",
    resumedByUser: "\u88AB\u4F60\u6062\u590D\uFF0C\u53C8\u5728\u8FD0\u884C\u4E86",
    resumedByAgent: "\u4EA4\u7ED9\u4E86\u53E6\u4E00\u4E2A Agent\uFF0C\u7ED3\u679C\u4E0D\u518D\u53D1\u5230\u8FD9\u91CC",
    endedNoOutput: "\u5DF2\u7ED3\u675F\uFF0C\u6CA1\u6709\u8F93\u51FA",
    streamEnded: "\u8F93\u51FA\u6D41\u5DF2\u7ED3\u675F",
    scriptFailed: "\u811A\u672C\u5931\u8D25",
    blocked: "\u5361\u4F4F\u4E86\uFF0C\u5728\u7B49\u8F93\u5165",
    timeout: "\u8D85\u65F6",
    endedNoResult: "\u6CA1\u6709\u7ED3\u679C\u5C31\u7ED3\u675F\u4E86",
    resultDelivered: "\u7ED3\u679C\u5DF2\u9001\u8FBE",
    resumeFailed: "\u6CA1\u80FD\u6062\u590D",
    cloudCompleted: "\u4E91\u7AEF\u8BC4\u5BA1\u5DF2\u5B8C\u6210",
    backgroundCommand: "\u540E\u53F0\u547D\u4EE4",
    backgroundAgent: "\u540E\u53F0 Agent",
    monitor: "\u76D1\u63A7",
    monitorEvent: "\u76D1\u63A7\u4E8B\u4EF6",
    remoteTask: "\u8FDC\u7A0B\u4EFB\u52A1",
    backgroundTask: "\u540E\u53F0\u4EFB\u52A1",
    backgroundWorkflow: "\u540E\u53F0\u5DE5\u4F5C\u6D41",
    foregroundCall: "\u524D\u53F0\u8C03\u7528",
    exitCode: "{words}\uFF08\u9000\u51FA\u7801 {code}\uFF09",
    stillRunning: "\u4ECD\u5728\u8FD0\u884C\uFF08\u5DF2\u8FD0\u884C {ran}\uFF0C{quiet} \u6CA1\u6709\u65B0\u8F93\u51FA\uFF09",
    turnLimit: "\u5230\u4E86 {count} \u8F6E\u4E0A\u9650\uFF0C\u505C\u5728\u534A\u8DEF\uFF08\u53EA\u6709\u90E8\u5206\u7ED3\u679C\uFF09",
    failedReason: "\u5931\u8D25\uFF1A{reason}",
    stoppedReason: "\u5DF2\u505C\u6B62\uFF1A{reason}",
    blockedReason: "\u5361\u4F4F\u4E86\uFF1A{reason}",
    stoppedBy: "\u88AB {name} \u505C\u6B62",
    remoteCompleted: "\u8FDC\u7A0B\u5DE5\u4F5C\u6D41\u5DF2\u5B8C\u6210\uFF1A{name}",
    remoteBlocked: "\u8FDC\u7A0B\u4EFB\u52A1\u5361\u4F4F\u4E86\uFF1A{reason}",
    cloudFailed: "\u4E91\u7AEF\u8BC4\u5BA1\u5931\u8D25\uFF1A{reason}",
    subjectState: "\u300C{subject}\u300D{words}",
    eventSubjectWords: "\u300C{subject}\u300D\uFF1A{words}",
    eventSubject: "\u300C{subject}\u300D",
    backgroundNotification: "\u540E\u53F0\u4EFB\u52A1\u901A\u77E5",
    joinedSpaced: "{title} {words}",
    joined: "{title}{words}"
  },
  piNotice: {
    completed: "\u5DF2\u5B8C\u6210",
    failed: "\u5931\u8D25",
    stopped: "\u5DF2\u505C\u6B62",
    canceled: "\u5DF2\u53D6\u6D88",
    paused: "\u5DF2\u6682\u505C",
    timeout: "\u8D85\u65F6",
    running: "\u8FD0\u884C\u4E2D",
    queued: "\u6392\u961F\u4E2D",
    backgroundTask: "\u540E\u53F0\u4EFB\u52A1",
    backgroundNotice: "\u540E\u53F0\u4EFB\u52A1\u901A\u77E5",
    task: "\u4EFB\u52A1",
    status: "\u72B6\u6001",
    exitCodeLabel: "\u9000\u51FA\u7801",
    signal: "\u4FE1\u53F7",
    error: "\u9519\u8BEF",
    command: "\u547D\u4EE4",
    type: "\u7C7B\u578B",
    backgroundAgent: "\u540E\u53F0 Agent",
    model: "\u6A21\u578B",
    outputFile: "\u8F93\u51FA\u6587\u4EF6",
    duration: "\u8017\u65F6",
    taskId: "\u4EFB\u52A1 ID",
    session: "\u4F1A\u8BDD",
    sessionFile: "\u4F1A\u8BDD\u6587\u4EF6",
    sessionShareFailed: "\u4F1A\u8BDD\u5206\u4EAB\u5931\u8D25",
    addressed: "\u5DF2\u5904\u7406",
    unaddressed: "\u672A\u5904\u7406",
    stalemate: "\u50F5\u6301",
    childTask: "\u5B50\u4EFB\u52A1",
    fullOutputUnavailable: "  \u5B8C\u6574\u8F93\u51FA\u4E0D\u53EF\u7528",
    childOutputs: "\u5B50\u4EFB\u52A1\u8F93\u51FA\uFF1A",
    watchdogBlockers: "\u76D1\u7763\u963B\u65AD\uFF1A",
    watchdogConcerns: "\u91CD\u8981\u7684\u76D1\u7763\u7591\u8651\uFF1A",
    evidencePrefix: "\u4F9D\u636E\uFF1A",
    recommendationPrefix: "\u7ED9 Agent \u7684\u5EFA\u8BAE\uFF1A",
    source: "\u6765\u6E90",
    detached: "\u524D\u53F0\u8FD0\u884C\u8F6C\u5230\u540E\u53F0",
    schedule: "\u5B9A\u65F6\u4EFB\u52A1",
    childRun: "\u5B50\u8FD0\u884C",
    workflow: "\u5DE5\u4F5C\u6D41",
    workflowReceipt: "\u5DE5\u4F5C\u6D41\u56DE\u6267",
    parallelHandoff: "\u5E76\u884C\u4EA4\u63A5",
    reconciledRun: "\u63A5\u4E0A\u7684\u8FD0\u884C",
    runId: "\u8FD0\u884C ID",
    subagent: "\u5B50 Agent",
    subagentNotice: "\u5B50 Agent \u901A\u77E5",
    unknownStatus: "\u72B6\u6001\u672A\u77E5",
    eachSubagent: "\u5404\u5B50 Agent",
    neverStarted: "\u6392\u961F\u65F6\u88AB\u505C\u6B62\uFF0C\u6CA1\u6709\u8FD0\u884C",
    steered: "\u5DF2\u5B8C\u6210\uFF08\u5230\u4E86\u8F6E\u6570\u4E0A\u9650\uFF0C\u88AB\u5F15\u5BFC\u6536\u5C3E\uFF09",
    turnLimitStopped: "\u5DF2\u505C\u6B62\uFF08\u8D85\u51FA\u8F6E\u6570\u4E0A\u9650\uFF09",
    toolCalls: "\u5DE5\u5177\u8C03\u7528\u6B21\u6570",
    tokens: "Token",
    agentId: "Agent ID",
    turnsLabel: "\u8F6E\u6570",
    subagentRequest: "\u5B50 Agent \u8BF7\u6C42",
    requestId: "\u8BF7\u6C42 ID",
    completionReminder: "\u63D0\u9192\u7236 Agent \u5904\u7406\u5B50 Agent \u7684\u5B8C\u6210\u7ED3\u679C",
    completionUnhandled: "\u7236 Agent \u6CA1\u6709\u5904\u7406\u5B50 Agent \u7684\u5B8C\u6210\u7ED3\u679C\uFF08\u63D0\u9192\u6B21\u6570\u5DF2\u7528\u5B8C\uFF0C\u7ED3\u679C\u5DF2\u4FDD\u5B58\uFF09",
    compactionResume: "\u4E0A\u4E0B\u6587\u538B\u7F29\u5B8C\u6210\uFF0C\u7236 Agent \u7EE7\u7EED\u539F\u6765\u7684\u4EFB\u52A1\uFF1B\u540E\u53F0\u5B50 Agent \u7684\u7ED3\u679C\u7A0D\u540E\u5355\u72EC\u9001\u8FBE",
    underSecond: "\u4E0D\u5230 1 \u79D2",
    waitingParent: "\u5728\u7B49\u7236 Agent \u56DE\u590D\u5B83\u7684\u8BF7\u6C42",
    toolFailures: "\u6539\u52A8\u7C7B\u5DE5\u5177\u63A5\u8FDE\u5931\u8D25",
    runFacts: "\u8FD0\u884C\u60C5\u51B5",
    recentFailures: "\u6700\u8FD1\u7684\u5931\u8D25",
    step: "\u6B65\u9AA4",
    steeringFailed: "\u7ED9\u5B50 Agent \u7684\u5F15\u5BFC\u6D88\u606F\u6CA1\u6709\u9001\u8FBE",
    steeringPartial: "\u7ED9\u5B50 Agent \u7684\u5F15\u5BFC\u6D88\u606F\u53EA\u9001\u8FBE\u4E86\u4E00\u90E8\u5206",
    steeringRecovered: "\u7ED9\u5B50 Agent \u7684\u5F15\u5BFC\u6D88\u606F\u5728\u6062\u590D\u8FD0\u884C\u540E\u9001\u8FBE",
    description: "\u8BF4\u660E",
    concern: "\u7591\u8651",
    blocker: "\u963B\u65AD",
    low: "\u4F4E",
    medium: "\u4E2D",
    high: "\u9AD8",
    correctness: "\u6B63\u786E\u6027",
    missedConstraint: "\u6F0F\u6389\u7EA6\u675F",
    testGap: "\u6D4B\u8BD5\u7F3A\u53E3",
    unsafeChange: "\u4E0D\u5B89\u5168\u7684\u6539\u52A8",
    scopeDrift: "\u504F\u79BB\u8303\u56F4",
    staleFact: "\u8FC7\u65F6\u7684\u4E8B\u5B9E",
    loopRisk: "\u53EF\u80FD\u9677\u5165\u5FAA\u73AF",
    other: "\u5176\u4ED6",
    mainAgent: "\u4E3B Agent",
    lsp: "LSP",
    stale: "\u5DF2\u8FC7\u65F6",
    reviewFailed: "\u5BA1\u67E5\u5931\u8D25",
    stalemateStopped: "\u50F5\u6301\uFF0C\u5DF2\u505C\u6B62\u7EE7\u7EED\u8FD0\u884C",
    resolved: "\u5DF2\u89E3\u51B3",
    suppressed: "\u5DF2\u538B\u4E0B",
    watchdog: "\u76D1\u7763\u63D0\u9192",
    point: "\u8981\u70B9",
    severity: "\u7EA7\u522B",
    importance: "\u91CD\u8981\u6027",
    category: "\u7C7B\u522B",
    evidence: "\u4F9D\u636E",
    recommendation: "\u7ED9 Agent \u7684\u5EFA\u8BAE",
    watchdogStatus: "\u76D1\u7763\u72B6\u6001",
    reviewError: "\u5BA1\u67E5\u9519\u8BEF",
    waitTimeout: "\u7B49\u5F85\u8D85\u65F6\uFF0C\u8FD0\u884C\u53EF\u80FD\u8FD8\u5728\u8FDB\u884C",
    waitAttention: "\u7B49\u5F85\u7684\u8FD0\u884C\u9700\u8981\u7236 Agent \u5173\u6CE8",
    waitUnconfirmed: "\u7B49\u5F85\u7684\u8FD0\u884C\u65E0\u6CD5\u786E\u8BA4\u7ED3\u5C40",
    completionArchive: "\u5B8C\u6210\u5F52\u6863",
    output: "\u8F93\u51FA",
    workflowStatus: "\u5DE5\u4F5C\u6D41\u72B6\u6001",
    stillRunning: "\u4ECD\u5728\u8FD0\u884C",
    ended: "\u5DF2\u7ED3\u675F",
    workflowSaveFailed: "\u5DE5\u4F5C\u6D41\u7684\u7ED3\u679C\u6CA1\u80FD\u4FDD\u5B58",
    webSearch: "\u8054\u7F51\u641C\u7D22",
    webpage: "\u7F51\u9875",
    fetchId: "\u6293\u53D6 ID",
    fetchFailed: "\u6293\u53D6\u7F51\u9875\u5185\u5BB9\u5931\u8D25",
    searchResults: "\u8054\u7F51\u641C\u7D22\u7ED3\u679C",
    query: "\u67E5\u8BE2",
    resultCount: "\u7ED3\u679C\u6570",
    goal: "\u76EE\u6807",
    goalInactive: "\u76EE\u6807\u6A21\u5F0F\u5DF2\u5173\u95ED",
    goalId: "\u76EE\u6807 ID",
    goalBudget: "\u76EE\u6807\u7684 token \u9884\u7B97\u5DF2\u7528\u5B8C\uFF0CAgent \u6B63\u5728\u6536\u5C3E",
    piNotice: "Pi \u901A\u77E5",
    quoted: "\u300C{name}\u300D",
    rawStatus: "\u72B6\u6001\uFF1A{status}",
    outcomeDetail: "{words}\uFF08{detail}\uFF09",
    tallyCount: "{count} \u4E2A{word}",
    exitCode: "\u9000\u51FA\u7801 {code}",
    signalCode: "\u4FE1\u53F7 {signal}",
    runReference: "\u8FD0\u884C {id}",
    omittedPreviews: "\u53E6\u6709 {count} \u4E2A\u5B50\u4EFB\u52A1\u7684\u9884\u89C8\u56E0\u7BC7\u5E45\u7701\u7565\u3002",
    unavailablePreview: "  \u9884\u89C8\u4E0D\u53EF\u7528\uFF08{reason}\uFF09",
    savedOutput: "  \u4FDD\u5B58\u7684\u8F93\u51FA\uFF1A{path}",
    outputArtifact: "  \u8F93\u51FA\u5B58\u6863\uFF1A{path}",
    structuredOutput: "  \u7ED3\u6784\u5316\u8F93\u51FA\uFF1A{path}",
    indentedError: "  \u9519\u8BEF\uFF1A{error}",
    blockerDetails: "- {name}\uFF1A{detail}\uFF08{status}\uFF09",
    scheduleName: "{name}\uFF08{id}\uFF09",
    errorDetail: "{kind}\uFF1A{error}",
    errorText: "\u9519\u8BEF\uFF1A{error}",
    scheduleText: "\u5B9A\u65F6\u4EFB\u52A1\uFF1A{schedule}",
    outputFileText: "\u8F93\u51FA\u6587\u4EF6\uFF1A{path}",
    elapsed: "\u5DF2\u8FC7 {duration}",
    turnCount: "{count} \u8F6E",
    tokenCount: "{count} token",
    toolCount: "{count} \u6B21\u5DE5\u5177\u8C03\u7528",
    path: "\u8DEF\u5F84 {path}",
    steeringState: "\u7ED9\u5B50 Agent \u7684\u5F15\u5BFC\u6D88\u606F\uFF1A{state}",
    waitOutcome: "\u7B49\u5F85\u7684\u8FD0\u884C{outcome}",
    fetchNone: "{total} \u4E2A\u7F51\u9875\u90FD\u6CA1\u6293\u5230\u5185\u5BB9",
    fetchPartial: "\u6293\u5230\u4E86 {ok}/{total} \u4E2A\u7F51\u9875\u7684\u5185\u5BB9\uFF08\u90E8\u5206\u7F51\u9875\u6CA1\u6293\u5230\uFF09",
    fetchComplete: "\u6293\u5230\u4E86 {ok}/{total} \u4E2A\u7F51\u9875\u7684\u5168\u6587",
    queryCount: "{count} \u4E2A\u67E5\u8BE2",
    quotedQuery: "\u201C{query}\u201D",
    outputVerificationFailed: "  \u8F93\u51FA\u5B58\u6863\u6821\u9A8C\u5931\u8D25\uFF1A{error}",
    structuredVerificationFailed: "  \u7ED3\u6784\u5316\u8F93\u51FA\u6821\u9A8C\u5931\u8D25\uFF1A{error}",
    dispatchedChildren: "\u5DF2\u6D3E\u53D1\u5B8C\uFF0C{count} \u4E2A\u5B50\u4EFB\u52A1\u4ECD\u5728\u8FD0\u884C\u6216\u672A\u6536\u53D6",
    runningChildren: "{count} \u4E2A\u5B50\u4EFB\u52A1\u4ECD\u5728\u8FD0\u884C\u6216\u672A\u6536\u53D6",
    namedOutcome: "{name}{outcome}",
    withInfo: "{name}\uFF08{info}\uFF09{outcome}",
    fieldValue: "{label}\uFF1A{value}",
    groupEnded: "{count} \u4E2A\u5B50 Agent \u5DF2\u7ED3\u675F\uFF1A{outcomes}",
    groupCompletedNamed: "{count} \u4E2A\u5B50 Agent \u5DF2\u5B8C\u6210\uFF1A{names}",
    groupCompleted: "{count} \u4E2A\u5B50 Agent \u5DF2\u5B8C\u6210",
    groupCompletedPartial: "{count} \u4E2A\u5B50 Agent \u5DF2\u5B8C\u6210\uFF0C\u5176\u4F59\u4ECD\u5728\u8FD0\u884C",
    groupEndedPartial: "{count} \u4E2A\u5B50 Agent \u5DF2\u7ED3\u675F\uFF1A{outcomes}\uFF0C\u5176\u4F59\u4ECD\u5728\u8FD0\u884C",
    progress: "\u53D1\u6765\u8FDB\u5C55\uFF08\u4ECD\u5728\u8FD0\u884C\uFF09",
    progressDetail: "\u53D1\u6765\u8FDB\u5C55\uFF1A{detail}\uFF08\u4ECD\u5728\u8FD0\u884C\uFF09",
    progressNamed: "{name}\u53D1\u6765\u8FDB\u5C55\uFF08\u4ECD\u5728\u8FD0\u884C\uFF09",
    progressNamedDetail: "{name}\u53D1\u6765\u8FDB\u5C55\uFF1A{detail}\uFF08\u4ECD\u5728\u8FD0\u884C\uFF09",
    workspace: "\u9694\u79BB\u5DE5\u4F5C\u533A\u5DF2\u62C6\u9664\uFF0C\u7559\u4E0B\u4E86\u6539\u52A8",
    workspaceDetail: "\u9694\u79BB\u5DE5\u4F5C\u533A\u5DF2\u62C6\u9664\uFF0C\u7559\u4E0B\u4E86\u6539\u52A8\uFF1A{detail}",
    workspaceNamed: "{name}\u7684\u9694\u79BB\u5DE5\u4F5C\u533A\u5DF2\u62C6\u9664\uFF0C\u7559\u4E0B\u4E86\u6539\u52A8",
    workspaceNamedDetail: "{name}\u7684\u9694\u79BB\u5DE5\u4F5C\u533A\u5DF2\u62C6\u9664\uFF0C\u7559\u4E0B\u4E86\u6539\u52A8\uFF1A{detail}",
    subagentLead: "\u5B50 Agent ",
    requestProgress: "{name}\u53D1\u6765\u8FDB\u5C55",
    requestProgressDetail: "{name}\u53D1\u6765\u8FDB\u5C55\uFF1A{detail}",
    requestInterview: "{name}\u8BF7\u7236 Agent \u56DE\u7B54\u4E00\u7EC4\u95EE\u9898",
    requestInterviewDetail: "{name}\u8BF7\u7236 Agent \u56DE\u7B54\u4E00\u7EC4\u95EE\u9898\uFF1A{detail}",
    requestDecision: "{name}\u8BF7\u7236 Agent \u505A\u51B3\u5B9A",
    requestDecisionDetail: "{name}\u8BF7\u7236 Agent \u505A\u51B3\u5B9A\uFF1A{detail}",
    requestsUnansweredCount: "{count} \u4E2A\u5B50 Agent \u8BF7\u6C42\u4E00\u76F4\u6CA1\u6709\u56DE\u590D\uFF08\u63D0\u9192\u6B21\u6570\u5DF2\u7528\u5B8C\uFF09",
    requestsUnanswered: "\u5B50 Agent \u7684\u8BF7\u6C42\u4E00\u76F4\u6CA1\u6709\u56DE\u590D\uFF08\u63D0\u9192\u6B21\u6570\u5DF2\u7528\u5B8C\uFF09",
    requestReminderCount: "\u63D0\u9192\u7236 Agent \u56DE\u590D {count} \u4E2A\u5B50 Agent \u8BF7\u6C42",
    requestReminder: "\u63D0\u9192\u7236 Agent \u56DE\u590D\u5B50 Agent \u7684\u8BF7\u6C42",
    toolElapsed: "\u5DE5\u5177 {tool} \u5DF2\u8FD0\u884C {duration}",
    toolName: "\u5DE5\u5177 {tool}",
    seconds: "{count} \u79D2",
    subagentFailed: "{name}\u5931\u8D25",
    longRunningDuration: "{name}\u4ECD\u5728\u8FD0\u884C\uFF0C\u5DF2\u7ECF\u8DD1\u4E86 {duration}",
    longRunning: "{name}\u4ECD\u5728\u8FD0\u884C\uFF0C\u5DF2\u7ECF\u8DD1\u4E86\u5F88\u4E45",
    idleDuration: "{duration}\u6CA1\u6709\u52A8\u9759",
    toolLongRunning: "\u5DE5\u5177 {tool}\u8FD0\u884C\u5F88\u4E45\u4E86",
    unnamedToolElapsed: "\u4E00\u4E2A\u5DE5\u5177 \u5DF2\u8FD0\u884C {duration}",
    unnamedToolLongRunning: "\u4E00\u4E2A\u5DE5\u5177\u8FD0\u884C\u5F88\u4E45\u4E86",
    needsAttentionReason: "{name}\u9700\u8981\u7236 Agent \u5173\u6CE8\uFF08{reason}\uFF09",
    needsAttention: "{name}\u9700\u8981\u7236 Agent \u5173\u6CE8",
    watchdogBlocker: "{name}\u6709\u963B\u65AD\u95EE\u9898",
    watchdogBlockerDetail: "{name}\u6709\u963B\u65AD\u95EE\u9898\uFF1A{detail}",
    watchdogConcern: "{name}\u6709\u7591\u8651",
    watchdogConcernDetail: "{name}\u6709\u7591\u8651\uFF1A{detail}",
    commaSeparator: "\uFF0C",
    clarifyDetail: "\u8BF7 Agent \u6F84\u6E05\uFF1A{detail}",
    clarify: "\u8BF7 Agent \u6F84\u6E05",
    hasResult: "\u6709\u4E86\u7ED3\u679C",
    workflowChild: "\u5DE5\u4F5C\u6D41\u5B50\u4EFB\u52A1{name}{outcome}",
    workflowChildRunning: "\u5DE5\u4F5C\u6D41\u5B50\u4EFB\u52A1{name}{outcome}\uFF0C\u5DE5\u4F5C\u6D41\u4ECD\u5728\u8FD0\u884C",
    workflowChildEnded: "\u5DE5\u4F5C\u6D41\u5B50\u4EFB\u52A1{name}{outcome}\uFF0C\u5DE5\u4F5C\u6D41\u5DF2\u7ED3\u675F",
    search: "\u641C\u7D22{subject}",
    searchCount: "\u641C\u7D22{subject}\uFF0C\u5171 {total} \u6761\u7ED3\u679C",
    searchFailed: "\u641C\u7D22{subject}\uFF0C{failed} \u4E2A\u67E5\u8BE2\u5931\u8D25",
    searchCountFailed: "\u641C\u7D22{subject}\uFF0C\u5171 {total} \u6761\u7ED3\u679C\uFF0C{failed} \u4E2A\u67E5\u8BE2\u5931\u8D25",
    goalUpdatedDetail: "\u76EE\u6807\u7EA6\u5B9A\u5DF2\u66F4\u65B0\uFF1A{detail}",
    goalUpdated: "\u76EE\u6807\u7EA6\u5B9A\u5DF2\u66F4\u65B0",
    factSeparator: " \xB7 ",
    completedSentence: "\u5DF2\u5B8C\u6210",
    failedSentence: "\u5931\u8D25",
    stoppedSentence: "\u5DF2\u505C\u6B62",
    canceledSentence: "\u5DF2\u53D6\u6D88",
    pausedSentence: "\u5DF2\u6682\u505C",
    timeoutSentence: "\u8D85\u65F6",
    runningSentence: "\u8FD0\u884C\u4E2D",
    queuedSentence: "\u6392\u961F\u4E2D",
    neverStartedSentence: "\u6392\u961F\u65F6\u88AB\u505C\u6B62\uFF0C\u6CA1\u6709\u8FD0\u884C",
    steeredSentence: "\u5DF2\u5B8C\u6210\uFF08\u5230\u4E86\u8F6E\u6570\u4E0A\u9650\uFF0C\u88AB\u5F15\u5BFC\u6536\u5C3E\uFF09",
    turnLimitStoppedSentence: "\u5DF2\u505C\u6B62\uFF08\u8D85\u51FA\u8F6E\u6570\u4E0A\u9650\uFF09",
    nameList: "{names}{name}",
    watchdogBlockerUnnamed: "\u6709\u963B\u65AD\u95EE\u9898",
    watchdogBlockerUnnamedDetail: "\u6709\u963B\u65AD\u95EE\u9898\uFF1A{detail}",
    watchdogConcernUnnamed: "\u6709\u7591\u8651",
    watchdogConcernUnnamedDetail: "\u6709\u7591\u8651\uFF1A{detail}"
  }
};

// resources/third-party/default-features/vivid-activity/shared/locales/en.json
var en_default = {
  $meta: {
    name: "English"
  },
  boot: {
    name: "Vivid Activity",
    piNotice: "Pi notices",
    openSettings: "Open Vivid Activity settings"
  },
  modelLook: {
    think: "Thinking",
    read: "Read files",
    list: "List directory",
    edit: "Edit files",
    write: "Write files",
    shell: "Command",
    search: "Search",
    web: "Web",
    agent: "Subagent",
    plan: "Plan",
    ask: "Question",
    mcp: "MCP",
    paseo: "Paseo",
    skill: "Skill",
    other: "Other",
    browser: "Browser"
  },
  modelRowStatus: {
    running: "Running",
    waiting: "Waiting for your approval",
    question: "Waiting for your answer",
    completed: "Done",
    failed: "Failed",
    canceled: "Canceled"
  },
  modelCount: {
    think: "Thinking",
    read: "Read",
    list: "List directory",
    edit: "Edit",
    write: "Write",
    shell: "Command",
    search: "Search",
    web: "Web",
    agent: "Subagent",
    plan: "Plan",
    ask: "Question",
    mcp: "MCP",
    paseo: "Paseo",
    skill: "Skill",
    other: "Other",
    browser: "Browser"
  },
  modelPaseo: {
    speak: "Speak",
    createWorkspace: "Create workspace",
    listWorkspaces: "List workspaces",
    archiveWorkspace: "Archive workspace",
    renameWorkspace: "Rename workspace",
    createAgent: "Create agent",
    sendAgentPrompt: "Send agent a message",
    getAgentStatus: "View agent status",
    getAgentActivity: "View agent activity",
    listAgents: "List agents",
    cancelAgentRun: "Interrupt agent",
    archiveAgent: "Archive agent",
    killAgent: "Stop agent",
    updateAgent: "Update agent",
    setAgentSessionMode: "Change agent mode",
    listPendingPermissions: "List pending permissions",
    respondToPermission: "Respond to permission",
    listWorkspaceScripts: "List workspace scripts",
    startWorkspaceScript: "Start workspace script",
    stopWorkspaceScript: "Stop workspace script",
    listTerminals: "List terminals",
    createTerminal: "Create terminal",
    killTerminal: "Kill terminal",
    captureTerminal: "Capture terminal",
    sendTerminalKeys: "Send terminal keys",
    createSchedule: "Create schedule",
    createHeartbeat: "Create heartbeat",
    deleteHeartbeat: "Delete heartbeat",
    listSchedules: "List schedules",
    inspectSchedule: "Inspect schedule",
    pauseSchedule: "Pause schedule",
    resumeSchedule: "Resume schedule",
    deleteSchedule: "Delete schedule",
    updateSchedule: "Update schedule",
    scheduleLogs: "Schedule logs",
    runScheduleOnce: "Run schedule once",
    listProviders: "List providers",
    listModels: "List models",
    listAgentProfiles: "List agent profiles",
    inspectProvider: "Inspect provider",
    listBrowserTabs: "List browser tabs",
    createBrowserTab: "Create browser tab",
    closeBrowserTab: "Close browser tab",
    snapshotBrowserPage: "Snapshot browser page",
    clickBrowserElement: "Click browser element",
    fillBrowserElement: "Fill browser element",
    hoverBrowserElement: "Hover browser element",
    dragBrowserElement: "Drag browser element",
    selectBrowserOption: "Select browser option",
    waitForBrowserCondition: "Wait for browser condition",
    typeIntoBrowser: "Type into browser",
    pressBrowserKey: "Press browser key",
    navigateBrowser: "Navigate browser",
    browserBack: "Browser back",
    browserForward: "Browser forward",
    browserReload: "Browser reload",
    captureBrowserScreenshot: "Capture browser screenshot",
    uploadFilesInBrowser: "Upload files in browser",
    readBrowserLogs: "Read browser logs",
    evaluateBrowserJavascript: "Evaluate browser JavaScript",
    scrollBrowser: "Scroll browser",
    resizeBrowserViewport: "Resize browser viewport"
  },
  modelLabel: {
    read: "Read",
    list: "List directory",
    listDirectory: "List directory",
    edit: "Edit",
    add: "Create",
    delete: "Delete",
    write: "Write",
    shell: "Command",
    search: "Search",
    find: "Find",
    fetchUrl: "Fetch webpage",
    agentTask: "Subagent",
    plan: "Plan",
    thinking: "Thinking",
    skill: "Skill",
    tasks: "Tasks",
    askQuestion: "Ask question",
    backgroundTask: "Background task",
    speak: "Speak",
    worktreeSetup: "Worktree setup",
    tool: "Tool",
    searchTools: "Search tools",
    codeMode: "Code mode",
    supervisorReply: "Reply to subagent",
    supervisorQueue: "Subagent request queue",
    supervisorRequests: "Subagent requests",
    supervisorStatus: "Subagent status",
    subagentSupervisor: "Subagent supervision",
    wait: "Wait",
    waitForBackgroundWork: "Wait for background work",
    waitSubscription: "Wait subscription",
    waitForAll: "Wait for all",
    waitForRun: "Wait for run",
    bgWait: "Background wait",
    waitForAgent: "Wait for agent",
    dispatchAgent: "Dispatch subagent",
    steerAgent: "Steer subagent",
    checkAgentResult: "Check subagent result",
    agentResult: "Subagent result",
    gitHubActionsDetails: "GitHub actions details",
    gitHubActionsList: "GitHub actions list",
    gitHubActionsRun: "GitHub actions run",
    gitHubFile: "GitHub file",
    gitHubJobLogs: "GitHub job logs",
    gitHubPullRequest: "GitHub PR",
    gitHubCodeSearch: "GitHub code search",
    gitHubRepositorySearch: "GitHub repository search",
    exaWebSearch: "Exa web search",
    exaWebFetch: "Exa web fetch",
    exaAgent: "Exa research agent",
    exaResearchGuide: "Exa research guide",
    exaSchemaTemplates: "Exa schema templates",
    todoWrite: "Update tasks",
    notebookEdit: "Edit notebook",
    bashOutput: "Read background output",
    killShell: "Stop background command",
    killBash: "Stop background command",
    webSearch: "Web search",
    exitPlanMode: "Submit plan",
    enterPlanMode: "Enter plan mode",
    slashCommand: "Slash command",
    askUserQuestion: "Ask question",
    listMcpResourcesTool: "List MCP resources",
    readMcpResourceTool: "Read MCP resource",
    command: "Command",
    output: "Output",
    contents: "Contents",
    writtenContents: "Written contents",
    before: "Before",
    after: "After",
    diff: "Diff",
    result: "Result",
    error: "Error",
    input: "Input",
    image: "Image",
    setupLog: "Setup log",
    activityLog: "Activity log",
    query: "Query",
    matches: "Matches",
    files: "Files",
    message: "Message",
    prompt: "Prompt",
    code: "Code",
    session: "Session"
  },
  modelStatus: {
    exactActive: "Current",
    exactDefault: "Default",
    exactSuccess: "Success",
    exactFailed: "Failed",
    running: "Running",
    initializing: "Starting",
    starting: "Starting",
    loading: "Loading",
    completed: "Completed",
    succeeded: "Succeeded",
    success: "Success",
    idle: "Idle",
    active: "Active",
    healthy: "Healthy",
    ready: "Ready",
    available: "Available",
    enabled: "Enabled",
    failed: "Failed",
    error: "Error",
    unhealthy: "Unhealthy",
    unavailable: "Unavailable",
    disabled: "Disabled",
    canceled: "Canceled",
    cancelled: "Canceled",
    paused: "Paused",
    stopped: "Stopped",
    closed: "Closed",
    exited: "Exited",
    archived: "Archived",
    expired: "Expired",
    skipped: "Skipped",
    pending: "Waiting",
    queued: "Queued",
    timeout: "Timed out",
    timedOut: "Timed out",
    worktree: "Worktree",
    local: "Local",
    none: "No isolation",
    directory: "Directory",
    tool: "Tool",
    plan: "Plan",
    question: "Question",
    mode: "Mode",
    other: "Other",
    finished: "Finished",
    permission: "Waiting for approval",
    closedByUser: "Closed",
    background: "Running in background"
  },
  modelText: {
    paseoLabel: "Paseo \xB7 {label}",
    waitAgents: {
      one: "Wait for {count} agent",
      other: "Wait for {count} agents"
    },
    exitCode: "Exit code {code}",
    stateSuffix: ", {state}",
    collapseRow: "Collapse {title}{target}{state}",
    expandRow: "Expand {title}{target}{state}",
    rowTarget: " {target}"
  },
  timing: {
    seconds: "{count} sec",
    minutesSeconds: "{minutes} min {seconds} sec",
    minutes: "{count} min",
    hoursMinutes: "{hours} hr {minutes} min",
    hours: "{count} hr"
  },
  clock: {
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    soon: "Soon",
    justNow: "Just now",
    monthDay: "{month}/{day}",
    yearMonthDay: "{month}/{day}/{year}",
    minutesAhead: {
      one: "in {count} minute",
      other: "in {count} minutes"
    },
    minutesAgo: {
      one: "{count} minute ago",
      other: "{count} minutes ago"
    },
    hoursAhead: {
      one: "in {count} hour",
      other: "in {count} hours"
    },
    hoursAgo: {
      one: "{count} hour ago",
      other: "{count} hours ago"
    },
    daysAhead: {
      one: "in {count} day",
      other: "in {count} days"
    },
    daysAgo: {
      one: "{count} day ago",
      other: "{count} days ago"
    },
    instantRelative: "{day} {clock} ({relative})",
    instant: "{day} {clock}"
  },
  fold: {
    categoryCount: "{label} {count}",
    earlier: {
      one: "{count} earlier step",
      other: "{count} earlier steps"
    },
    steps: {
      one: "{count} step",
      other: "{count} steps"
    },
    failed: "{count} failed",
    canceled: "{count} canceled",
    duration: "took {duration}",
    collapse: "Collapse {title}{parts}{extras}",
    expand: "Expand {title}{parts}{extras}",
    countsSuffix: ": {counts}",
    extrasSuffix: ", {extras}",
    extrasSeparator: ", ",
    files: {
      one: "{count} file",
      other: "{count} files"
    },
    moreFiles: {
      one: "{count} more file",
      other: "{count} more files"
    },
    changes: "changed {files} +{added} \u2212{removed}",
    uncountedMore: {
      one: "{count} more uncounted",
      other: "{count} more uncounted"
    },
    uncountedOnly: {
      one: "{count} change not counted",
      other: "{count} changes not counted"
    },
    uncountedLabel: {
      one: "{count} more change without a line count",
      other: "{count} more changes without line counts"
    },
    uncountedNote: {
      one: "{count} change without a line count: writes, deletions and diffs too long or possibly incomplete are counted, never guessed",
      other: "{count} changes without line counts: writes, deletions and diffs too long or possibly incomplete are counted, never guessed"
    },
    turn: "This turn",
    tokensIn: "in {count}",
    tokensCached: "cached {count}",
    tokensOut: "out {count}"
  },
  timelinePi: {
    loadingSummary: "Reading\u2026",
    loadingNote: "Reading this notice\u2026",
    failedSummary: "Could not read, expand to see the original",
    failedNote: 'The Pi notice reader could not be downloaded (the connection was lost or the plugin failed). The original text is shown below. It will retry automatically, or you can select "Read again".',
    idleSummary: "Not read yet, expand to see the original",
    idleNote: "The Pi notice reader has not loaded yet. The original text is shown below.",
    note: "Details",
    notice: "Pi notice"
  },
  sharedPrompt: {
    current: "This turn's prompt",
    recent: "Latest prompt"
  },
  sharedPiAgent: {
    missing: "This subagent could not be found. It may have been cleaned up.",
    steerSent: "The steering message was sent. The subagent will handle it after the current tool call.",
    running: "The subagent is still running."
  },
  sharedWait: {
    allRuns: "All runs",
    nextRun: "Next run",
    run: "Run",
    timeout: "Wait up to {duration}",
    completedMany: "{label} and others ({count} total) completed{header}",
    completed: "{label} completed{header}",
    headerSuffix: " \xB7 {header}",
    timedOutWithHeader: "{header} \xB7 Timed out",
    timedOut: "Timed out",
    requestWithHeader: "{header} \xB7 Subagent request",
    request: "Subagent request",
    waitedWithHeader: "{header} \xB7 Waited {seconds} sec",
    waited: "Waited {seconds} sec",
    running: "{count} running",
    done: "{count} completed",
    failed: "{count} failed",
    waiting: "Waiting for {count}",
    namesAndOthers: "{names} and others ({count} total)"
  },
  sharedPresentation: {
    tasksCompleted: "Completed {done}/{total}",
    oldContents: "[Original content: {count} characters]",
    newContents: "[New content: {count} characters]",
    toolsCount: {
      one: "{count} tool",
      other: "{count} tools"
    },
    callsAndOthers: "{count} calls \xB7 {names} and others",
    calls: "{count} calls \xB7 {names}",
    reasoningTokens: {
      one: "About {tokens} token",
      other: "About {tokens} tokens"
    },
    reasoningStepsTokens: {
      one: "{steps} steps \xB7 About {tokens} token",
      other: "{steps} steps \xB7 About {tokens} tokens"
    },
    inlineSeparator: " \xB7 ",
    callSeparator: ", ",
    agentProvider: "{title} \xB7 {provider}",
    replyTarget: "\u2192 {target}"
  },
  ui: {
    expandAllLinesCharacters: {
      one: "Expand all ({lines} line, {characters} characters)",
      other: "Expand all ({lines} lines, {characters} characters)"
    },
    collapse: "Collapse",
    step: "Step {number}",
    output: "Output",
    input: "Input",
    noFilesReturned: "No files returned.",
    file: "File",
    noTextReturned: "No text returned.",
    result: "Result",
    activityLog: "Activity log",
    setupLog: "Setup log",
    after: "After",
    before: "Before",
    copyWrittenContent: "Copy written content",
    content: "Content",
    copyContent: "Copy content",
    outputTruncated: "Output truncated",
    outputTruncatedFullOutputAt: "Output truncated \xB7 Full output at {path}",
    noSkillDetails: "No skill details.",
    noToolDetails: "No tool details.",
    files: {
      one: "{count} file",
      other: "{count} files"
    },
    matches: {
      one: "{count} match",
      other: "{count} matches"
    },
    waitingForOutput: "Waiting for output\u2026",
    answer: "Answer",
    selectAllThatApply: "Select all that apply",
    question: "Question",
    question2: "Question {number}",
    question3: "Question \xB7 {header}",
    thisContentIsLongOnly: "This content is long. Only the first {count} characters are shown.",
    originalText: "Original text",
    status: "Status",
    subagentConclusion: "Subagent conclusion",
    event: "Event",
    task: "Task",
    outputFile: "Output file",
    usage: "Usage",
    description: "Description",
    toolCalls: {
      one: "{count} tool call",
      other: "{count} tool calls"
    },
    notice: "Notice",
    blocked: "Blocked",
    stopped: "Stopped",
    failed: "Failed",
    completed: "Completed",
    copy: "Copy {label}",
    expandAllLines: "Expand all ({lines} lines)",
    noChangesToShow: "No changes to show.",
    changes: "Changes",
    enlargeImage: "Enlarge image",
    shrinkImage: "Shrink image",
    image: "Image",
    loadingImage: "Loading image\u2026",
    theImageIsLargerThan: "The image is larger than 3 MB, so no preview is shown.",
    theImageIsOutsideThe: "The image is outside the agent's working directory, Paseo worktrees, and temporary directories, so no preview is shown.",
    copyOutput: "Copy output",
    errorOutput: "Error output",
    copyCommand: "Copy command",
    exitCode: "Exit code {code}",
    command: "Command",
    copyCode: "Copy code",
    loadingDetails: "Loading details\u2026",
    error: "Error",
    readPiNoticesAgain: "Read Pi notices again",
    readAgain: "Read again",
    thinking: "Thinking",
    thoughtFor: "Thought for {time}",
    thinking2: "Thinking\u2026",
    thinking3: "Thinking\u2026 {time}",
    noSubagentActivityYet: "No subagent activity yet.",
    readingSubagentActivity: "Reading subagent activity\u2026",
    viewSubagentActivity: "View subagent activity",
    readSubagentActivityOnceMore: "Read subagent activity once more",
    viewActivity: "View activity",
    readOnceMore: "Read once more",
    liveSubagentActivity: "Live subagent activity",
    theSubagentSLoadedState: "The subagent's loaded state could not be confirmed. Its activity will be checked again when there is an update.",
    thisSubagentIsMissingFrom: "This subagent is missing from the agent list (it may be archived or deleted). Its activity is not read automatically.",
    thisSubagentIsClosedUnloaded: "This subagent is closed (unloaded). Its activity is not read automatically because reading would make Paseo reload it.",
    script: "Script",
    copyOriginal: "Copy original",
    originalTextWithTerminalEscape: "{label} (original text, with terminal escape sequences)",
    copied: "Copied",
    copyFailed: "Copy failed",
    copy2: "Copy",
    failed2: "Failed {count}",
    uRL: "URL",
    encoding: "Encoding",
    size: "Size",
    path2: "Path",
    repository: "Repository",
    total: "Total",
    query2: "Query",
    gitHubActionsItem: "GitHub Actions item",
    actionsResult: "Actions result",
    actionsDetails: "Actions details",
    artifacts: "Artifacts",
    job: "Job",
    workflowRun: "Workflow run",
    workflow: "Workflow",
    inputParameters: "Input parameters",
    reference: "Reference",
    log: "Log",
    resource: "Resource",
    deletedLines: "Deleted lines",
    addedLines: "Added lines",
    changedFiles: "Changed files",
    sourceBranch: "Source branch",
    targetBranch: "Target branch",
    author: "Author",
    title: "Title",
    method: "Method",
    pRResult: "PR result",
    commits: "Commits",
    repositoryUnavailable: "Repository unavailable",
    codeResults: "Code results",
    noResultsReturned: "No results returned.",
    no: "No",
    yes: "Yes",
    noMatchingFiles: "No matching files.",
    lines: "Lines {start}\u2013{end}",
    line: "Line {line}",
    filesRead: {
      one: "{count} file read",
      other: "{count} files read"
    },
    evaluated: "{count} evaluated",
    listed: "{count} listed",
    waiting: "Waiting",
    canceled: "Canceled",
    running: "Running",
    prompt: "Prompt",
    runInBackground: "Run in background",
    resumeSession: "Resume session",
    session2: "Session",
    model: "Model",
    message: "Message",
    text2: "Text",
    labels: "Labels",
    count: "Count",
    success: "Success",
    finishedAt: "Finished at",
    startedAt: "Started at",
    updatedAt: "Updated at",
    createdAt: "Created at",
    branch2: "Branch",
    mode: "Mode",
    workingDirectory: "Working directory",
    name: "Name",
    browserTab: "Browser tab",
    terminalID: "Terminal ID",
    projectID: "Project ID",
    workspaceID: "Workspace ID",
    rewindConversationAndFiles: "Rewind conversation and files",
    rewindFiles: "Rewind files",
    rewindConversation: "Rewind conversation",
    toolCalls2: "Tool calls",
    thinkingStream: "Thinking stream",
    mCPServers: "MCP servers",
    dynamicModes: "Dynamic modes",
    listSessions: "List sessions",
    sessionPersistence: "Session persistence",
    streamingOutput: "Streaming output",
    retryable: "Retryable",
    errorCode: "Error code",
    results: "Results ({count})",
    request: "Request",
    networkRequests: "Network requests ({count})",
    console: "Console ({count})",
    untitledPage: "Untitled page",
    browserTabs: "Browser tabs ({count})",
    noBrowserTabsReturned: "No browser tabs returned.",
    function: "Function",
    height: "Height",
    width: "Width",
    verticalScroll: "Vertical scroll",
    horizontalScroll: "Horizontal scroll",
    timeoutMilliseconds: "Timeout (milliseconds)",
    maximumEntries: "Maximum entries",
    fullPage: "Full page",
    modifiers: "Modifiers",
    doubleClick: "Double click",
    mouseButton: "Mouse button",
    keys: "Keys",
    value: "Value",
    targetElement: "Target element",
    sourceElement: "Source element",
    element: "Element",
    theScreenshotWasReturnedTo: "The screenshot was returned to the agent as an image attachment.",
    mIMEType: "MIME type",
    pageStructure: "Page structure",
    statistics: "Statistics",
    truncated: "Truncated",
    format: "Format",
    workspace: "Workspace",
    feature: "Feature",
    features: "Features ({count})",
    thinkingLevel: "Thinking level",
    configuration: "Configuration",
    configurations: "Configurations ({count})",
    noConfigurationsReturned: "No configurations returned.",
    models: "Models ({count})",
    noModelsReturned: "No models returned.",
    noProvidersReturned: "No providers returned.",
    selectedModel: "Selected model",
    enabled: "Enabled",
    run: "Run",
    runHistory: "Run history ({count})",
    noRunHistory: "No run history.",
    nextRun: "{prefix}Next run ",
    schedule: "Schedule",
    schedules: "Schedules ({count})",
    noSchedulesReturned: "No schedules returned.",
    isolation: "Isolation",
    target: "Target",
    cadence: "Cadence",
    cadenceAndTarget: "Cadence and target",
    maximumRuns: "Maximum runs",
    expiresAt: "Expires at",
    lastRun: "Last run",
    nextRun2: "Next run",
    clearExpiration: "Clear expiration",
    expiresIn: "Expires in",
    timeZone: "Time zone",
    cronExpression: "Cron expression",
    terminal: "Terminal",
    sendLiterally: "Send literally",
    terminalOutput: "Terminal output",
    totalLines: "Total lines",
    stripColorCodes: "Strip color codes",
    scrollbackLines: "Scrollback lines",
    endLine: "End line",
    startLine: "Start line",
    allDirectories: "All directories",
    terminals: "Terminals ({count})",
    noTerminalsReturned: "No terminals returned.",
    scripts: "Scripts ({count})",
    noWorkspaceScriptsReturned: "No workspace scripts returned.",
    workspaces: "Workspaces ({count})",
    noWorkspacesReturned: "No workspaces returned.",
    newTitle: "New title",
    removedDirectory: "Removed directory",
    archivedAgents: "Archived agents",
    forge: "Forge",
    mergeRequest: "Merge request",
    baseBranch: "Base branch",
    worktree: "Worktree",
    project: "Project",
    type: "Type",
    noAgentsReturned: "No agents returned.",
    reply: "Reply",
    settings: "Settings",
    newMode: "New mode",
    activity: "Activity",
    updates: "Updates",
    limit: "Limit",
    includeArchived: "Include archived",
    recentHours: "Recent (hours)",
    statusFilter: "Status filter",
    permission: "Permission",
    hint: "Hint",
    lastMessage: "Last message",
    notifyOnCompletion: "Notify on completion",
    sessionMode: "Session mode",
    sendMode: "Send mode",
    thinkingLevel2: "Thinking level {level}",
    action: "Action",
    permissionRequest: "Permission request",
    noPendingApprovals: "No pending approvals.",
    availableModes: "Available modes",
    pendingApprovals: "Pending approvals ({count})",
    capabilities: "Capabilities",
    latestError: "Latest error",
    needsAttention: "Needs attention",
    original: "{prefix}{time}, original {value}",
    context: "Context {value}",
    waitLog: "Wait log",
    runFinished: "Run finished",
    completed2: "Completed ({count})",
    providerEntries: "Provider entries",
    activeRuns: "Active runs",
    stopWhenAttentionIsNeeded: "Stop when attention is needed",
    nonblocking: "Nonblocking",
    timeout: "Timeout",
    wait: "Wait",
    overview: "Overview",
    noPendingSubagentRequests: "No pending subagent requests.",
    to: "To",
    confirmation: "Confirmation",
    requestID: "Request ID",
    replyMessage: "Reply message",
    steerMessage: "Steer message",
    transcript: "Transcript",
    duration: "Duration",
    context2: "Context",
    toolCallCount: "Tool call count",
    checkResultsWithoutWaiting: "Check results without waiting",
    waitUntilFinished: "Wait until finished",
    expandAll: "Expand all",
    expandFullText: "Expand full text",
    collapse2: "Collapse {title}",
    thisPromptIsLongOnly: "This prompt is long. Only the first {count} characters are shown.",
    copyFirstCharacters: "Copy {title} (first {count} characters)",
    tasks: "Tasks ({count})",
    waitingForToFinish: "Waiting for {tasks} to finish",
    moreSteps: {
      one: "{count} more step\u2026",
      other: "{count} more steps\u2026"
    },
    childReadFailed: "Could not read subagent activity: {error}",
    queryValue: "Query: {value}",
    branchValue: "Branch: {value}",
    pathValue: "Path: {value}",
    sessionValue: "Session {value}",
    scopeValue: "Scope: {value}",
    keywordsValue: "Keywords: {value}",
    listTitle: "{title} ({count})",
    agentsCount: "Agents ({count})",
    providersCount: "Providers ({count})",
    answerPair: "{question}: {answer}",
    clockLine: "{prefix}{day} {clock}",
    relativeSuffix: " ({relative})",
    agent: "Agent",
    agentId: "Agent ID",
    provider: "Provider",
    id: "ID",
    token: "Token",
    sha: "SHA",
    mcp: "MCP",
    tokens: {
      one: "{count} token",
      other: "{count} tokens"
    },
    timeoutValue: "{time} timeout",
    httpStatus: "HTTP {code} {status}",
    availableActionsValue: "Available actions: {actions}",
    toolsCount: "Tools ({count})",
    toolsRemaining: "Tools ({count} \xB7 {remaining} more in the catalog)",
    expandToolsCount: "Expand all ({count} listed)",
    expandToolsRemaining: "Expand all ({count} listed, {remaining} more)",
    metaSeparator: " \xB7 ",
    milliseconds: "{count} ms",
    expandTitle: "Expand {title}",
    collapseTitle: "Collapse {title}",
    expandPrompt: "Expand prompt: {text}",
    collapsePrompt: "Collapse prompt: {text}",
    mcpSummary: "{server} \xB7 {tool}",
    scoreSuffix: " \xB7 {score}%",
    numberedStep: "{number}. {title}",
    childOnHost: "Running on {host}",
    childHostOffline: "{host} can't be reached right now, so this subagent's activity can't be read. It is read again once the host is back.",
    childWaitsApproval: "Waiting for you",
    childAsks: "Asking you",
    childWaitsApprovalNote: "The sub-agent is waiting for you to approve something; open its chat to decide.",
    childAsksNote: "The sub-agent has a question for you; open its chat to answer.",
    childFailedNote: "The sub-agent stopped with an error: {error}"
  },
  settings: {
    timeSection: "Timestamps",
    turnTimeLabel: "Show turn end time",
    turnTimeHint: "Record the end time of new turns; earlier turns are not backfilled, and times already recorded stay when this is off.",
    foldTimeLabel: "Show activity timestamps",
    foldTimeHint: "Show the latest update time of each activity or folded summary in the viewer's local time zone.",
    savedSettings: "Saved settings",
    restoreDefaults: "Restore defaults",
    vividActivity: "Vivid activity",
    readingSettings: "Reading settings\u2026",
    palette: "Palette",
    theseColorsAndExpansionSettings: "These colors and expansion settings apply when takeover is turned on again.",
    takeoverIsOff: "Takeover is off",
    colors: "Colors",
    sidebarSection: "Sidebar",
    sidebarEntry: "Show sidebar entry",
    sidebarHint: "Off removes this plugin's settings entry from the left sidebar; the command palette entry stays. Changes apply to all devices.",
    expandScrollSection: "Expansion & scrolling",
    followGroup: "Follow new output",
    followHint: "On: an expanded area scrolls to the newest output as it updates; scrolling up pauses the follow. Changes apply to all devices.",
    followShell: "Command output",
    followLogs: "Worktree & subagent logs",
    followTodo: "Task lists",
    wrapGroup: "Wrap long lines",
    wrapHint: "On: long lines wrap to the available width; off keeps one row with horizontal scrolling. Row titles and paths stay single-line. Changes apply to all devices.",
    wrapDiff: "Diffs",
    wrapCode: "Code & files",
    wrapOutput: "Command line & output",
    expansion: "Expansion",
    takeoverScope: "Takeover scope",
    pinThisTurnSPrompt: "Pin this turn's prompt",
    rowDensity: "Row density",
    strength: "Strength",
    strengthDim: "30% \u2014 a faint outline; hover, focus or expand a row to read it.",
    strengthFaded: "45% \u2014 clearly faded but readable.",
    strengthSoft: "65% \u2014 slightly faded.",
    strengthFull: "No fading. Every row stays at full strength.",
    codeAndDiffs: "Code and diffs",
    preview: "Preview",
    previewPinned: "Pinned question",
    previewWindow: "window",
    previewHead20: "first 20 lines",
    previewFoldTitle: "{count} steps",
    previewFoldCounts: "commands 2 \xB7 thinking 2",
    previewFoldAuto: "failed \u2014 expanded automatically",
    previewFollow: "Following",
    previewTokens: "this turn in 12k \xB7 cached 80k \xB7 out 2.4k",
    previewThinkingOnly: "Thinking rows only: the plugin redraws thinking rows, tool rows stay with Paseo.",
    previewTakeoverOff: "Takeover is off \u2014 the plugin draws no rows, so there is nothing to preview.",
    previewQuestion: "Make the login module's timeout retries exponential and add tests.",
    previewReasoning: "Step 1: find where the timeout comes from.\nStep 2: read the retry helper.\nStep 3: check the tests.\nStep 4: draft the exponential backoff.\nStep 5: base delay 200 ms.\nStep 6: cap at 5 tries.\nStep 7: add jitter.\nStep 8: cover the timeout branch.\nStep 9: cover the success branch.\nStep 10: run the suite.\nStep 11: fix the flake.\nStep 12: rerun.\nStep 13: update the README.\nStep 14: note the new setting.\nStep 15: tidy the exports.\nStep 16: recheck types.\nStep 17: rerun the suite.\nStep 18: green.\nStep 19: summarize.\nStep 20: open the PR.\nStep 21: await review.\nStep 22: address comments.\nStep 23: squash.\nStep 24: final suite.\nStep 25: push.\nStep 26: done.",
    thoughtRows: "Thinking rows",
    tailFollow: "Follow the output live",
    tailFollowHint: "On: an expanded thinking row shows the latest lines and follows the output as it streams. Off: it stays on its first 20 lines (up to 4,000 characters) until you press Expand all.",
    tailLines: "Window size",
    tailLinesHint: "Lines (block view) or steps (step view) kept in the window, 5\u2013500. Default 20.",
    tailLinesInvalid: "Enter a whole number between 5 and 500.",
    commandColors: "Command colors",
    commandColorsHint: "Syntax colors for the shell command in a row's title (colors from the theme).",
    whenOpen: "When open",
    alwaysColored: "Always",
    foldConsecutiveThinkingAndTool: "Fold consecutive thinking and tool rows when finished",
    foldingSpacingAndPrompts: "Folding, spacing, and prompts",
    takeoverIsOffFoldingAnd: "Takeover is off. Folding, row density and strength apply when takeover is turned on again.",
    onlyThinkingRowsAreTaken: 'Only thinking rows are taken over: adjacent thinking rows can fold. Paseo displays tool rows, which can be grouped using "Settings \u2192 Chat \u2192 Tool call display \u2192 Summary".',
    theSameRowHeightAnd: "The same row height and spacing as previous versions, with 10 px gaps.",
    shorterRowsWith4Px: "Shorter rows with 4 px gaps, offsetting Paseo's 16 px spacing for plugin rows. About 20% more fits on a phone and 40% more on a desktop.",
    standard: "Standard",
    compact: "Compact",
    planCardsTaskRowsApproval: "Plan cards, task rows, approval cards, and cards from plugins such as Bots. Changes apply to all devices.",
    alwaysDisplayedByPaseo: "Always displayed by Paseo",
    tradeoffsOfReplacingToolRows: "Tradeoffs of replacing tool rows",
    takeover: "Takeover",
    expandOnlyTheLatestTask: "Expand only the latest task list tool row.",
    startTaskListToolRows: "Start task list tool rows collapsed.",
    alwaysExpandTaskListTool: "Always expand task list tool rows.",
    startCollapsedEvenWhileRunning: "Start collapsed, even while running. Tap to expand.",
    expandOnlyTheLatestRow: "Expand only the latest row. Collapse it when a new row arrives.",
    expandEveryRowOldAnd: "Expand every row, old and new.",
    collapsedByDefault: "Collapsed by default",
    expandLatestOnly: "Expand latest only",
    expandFailedRows: "Expand failed rows",
    expandFailedRowsHint: "Only failed rows start open; a running row opens once it fails. Same as collapsed for thinking rows and task lists.",
    alwaysExpand: "Always expand",
    thickerSeparatorsAndStrongerStatus: "Thicker separators and stronger status colors.",
    iconsAreMostlyNeutralOnly: "Icons are mostly neutral. Only status uses color.",
    theOriginalColorfulAgentActivity: "The original colorful-agent-activity palette: icons use the theme's accent color and row backgrounds stay neutral.",
    eachToolCategoryHasA: "Each tool category has a color (purple for thinking, blue for reading, green for editing, orange for commands, indigo for search). Running spins blue, approval pulses amber, failure is red, and completion is green.",
    highContrast: "High contrast",
    soft: "Soft",
    followThemeColors: "Follow theme colors",
    vivid: "Vivid",
    letPaseoDisplayAllRows: "Let Paseo display all rows. The plugin stays installed and can be turned on at any time.",
    redrawThinkingRowsOnlyPaseo: 'Redraw thinking rows only. Paseo keeps its tool rows, including "Summary" grouping and file links.',
    replaceThinkingAndToolCall: "Replace thinking and tool call rows with colorful activity rows.",
    off: "Off",
    thinkingRowsOnly: "Thinking rows only",
    all: "All",
    otherTools: "Other tools",
    taskListTools: "Task list tools",
    readAloud: "Read aloud",
    ask: "Ask",
    plan: "Plan",
    plainTextResults: "Plain text results",
    subagent: "Subagent",
    worktreeSetup: "Worktree setup",
    fetchPage: "Fetch page",
    search: "Search",
    writeFile: "Write file",
    editFile: "Edit file",
    readFile: "Read file",
    takeoverCosts: '\xB7 "Settings \u2192 Chat \u2192 Tool call display \u2192 Summary" no longer combines tool rows into one sentence\n\xB7 File paths cannot be clicked to open files\n\xB7 On phones, tool details expand within the row instead of opening a details page',
    foldHint: `When a sequence of thinking and tool calls finishes, fold it into one row showing category counts, failures, duration, and the files changed with lines added and removed (edits whose lines are known). The last fold of a turn also shows the turn's tokens, for turns you watched while they ran. Tap to expand it, listing each file and failed command, or to collapse it. A running sequence keeps running, waiting for approval, failed, and the two latest steps visible. Earlier steps fold into "Previous N steps". Changes apply to all devices.`,
    pinHint: "After an agent has worked for a while and sent several messages, pin this turn's prompt above its latest activity. Show three lines by default. Tap to read or copy the full text. The prompt stays hidden while it is nearby (within about one screen). Changes apply to all devices.",
    runningAnimation: "Running animation",
    loaderSpinner: "Spinner",
    loaderSparkle: "Sparkle",
    loaderOrb: "Orb",
    loaderSnake: "Dot grid: snake",
    loaderMatrix: "Dot grid: twinkle",
    loaderHint: "The mark at the end of a running row: a spinner (default), a Claude Code style sparkle, a breathing orb or a 3\xD73 dot grid. It pauses while the app is in the background and holds still when the system asks for reduced motion. Changes apply to all devices.",
    codeFont: "Code font",
    fontFamily: "Font family",
    fontFamilyHint: 'Web and desktop. Fonts installed on the device that shows Paseo, separated by commas, for example "JetBrains Mono", monospace. Leave empty for the default. A font the device does not have falls back to the default; the phone app keeps its system monospace font.',
    fontFamilyInvalid: "Use font names only (letters, digits, spaces and . _ + -), separated by commas, at most 200 characters.",
    apply: "Apply",
    textSize: "Text size",
    textSizeHint: "Everything the rows draw in the code font: summaries, paths, commands, code, diffs, tool output and thinking text. Titles and labels keep their size.",
    sizeSmall: "Small (11 px)",
    sizeStandard: "Standard (12 px)",
    sizeLarge: "Large (14 px)",
    sizeLarger: "Larger (16 px)",
    lineSpacing: "Line spacing",
    relaxed: "Relaxed",
    codeFontPreview: "Preview",
    applyFont: "Use the fonts above",
    followBrowser: "Browser",
    browserTools: "Browser tools"
  },
  childSummary: {
    activity: "Activity",
    thinking: "Thinking",
    prompt: "Prompt",
    tasks: "Tasks",
    error: "Error",
    notification: "Notification",
    warning: "Warning",
    success: "Success",
    compacted: "Context compacted",
    agent: "Agent",
    completed: "Completed {done}/{total} tasks"
  },
  notice: {
    completed: "completed",
    failed: "failed",
    stopped: "stopped",
    lowMemory: "stopped (low memory)",
    timeLimit: "stopped (background time limit reached)",
    waitingInput: "appears to be waiting for interactive input",
    stoppedByUser: "stopped by you",
    stoppedByClaude: "stopped by Claude",
    resumedByUser: "resumed by you and running again",
    resumedByAgent: "transferred to another agent; results will no longer arrive here",
    endedNoOutput: "ended without output",
    streamEnded: "output stream ended",
    scriptFailed: "script failed",
    blocked: "blocked, waiting for input",
    timeout: "timed out",
    endedNoResult: "ended without a result",
    resultDelivered: "result delivered",
    resumeFailed: "could not resume",
    cloudCompleted: "cloud review completed",
    backgroundCommand: "Background command",
    backgroundAgent: "Background agent",
    monitor: "Monitor",
    monitorEvent: "Monitor event",
    remoteTask: "Remote task",
    backgroundTask: "Background task",
    backgroundWorkflow: "Background workflow",
    foregroundCall: "Foreground call",
    exitCode: "{words} (exit code {code})",
    stillRunning: "still running (running for {ran}, no new output for {quiet})",
    turnLimit: "stopped at the {count}-turn limit (partial result only)",
    failedReason: "failed: {reason}",
    stoppedReason: "stopped: {reason}",
    blockedReason: "blocked: {reason}",
    stoppedBy: "stopped by {name}",
    remoteCompleted: "remote workflow completed: {name}",
    remoteBlocked: "remote task blocked: {reason}",
    cloudFailed: "cloud review failed: {reason}",
    subjectState: '"{subject}" {words}',
    eventSubjectWords: '"{subject}": {words}',
    eventSubject: '"{subject}"',
    backgroundNotification: "Background task notification",
    joinedSpaced: "{title} {words}",
    joined: "{title} {words}"
  },
  piNotice: {
    completed: "Completed",
    failed: "Failed",
    stopped: "Stopped",
    canceled: "Canceled",
    paused: "Paused",
    timeout: "Timed out",
    running: "Running",
    queued: "Queued",
    backgroundTask: "Background task",
    backgroundNotice: "Background task notification",
    task: "Task",
    status: "Status",
    exitCodeLabel: "Exit code",
    signal: "Signal",
    error: "Error",
    command: "Command",
    type: "Type",
    backgroundAgent: "Background agent",
    model: "Model",
    outputFile: "Output file",
    duration: "Duration",
    taskId: "Task ID",
    session: "Session",
    sessionFile: "Session file",
    sessionShareFailed: "Session sharing failed",
    addressed: "Addressed",
    unaddressed: "Unaddressed",
    stalemate: "Stalemate",
    childTask: "Subtask",
    fullOutputUnavailable: "  Full output unavailable",
    childOutputs: "Subtask outputs:",
    watchdogBlockers: "Watchdog blockers:",
    watchdogConcerns: "High-importance watchdog concerns:",
    evidencePrefix: "Evidence: ",
    recommendationPrefix: "Advice for the agent: ",
    source: "Source",
    detached: "Foreground run moved to the background",
    schedule: "Schedule",
    childRun: "Child run",
    workflow: "Workflow",
    workflowReceipt: "Workflow receipt",
    parallelHandoff: "Parallel handoff",
    reconciledRun: "Reconciled run",
    runId: "Run ID",
    subagent: "Subagent",
    subagentNotice: "Subagent notification",
    unknownStatus: "Unknown status",
    eachSubagent: "Subagents",
    neverStarted: "Stopped while queued; never started",
    steered: "Completed (turn limit reached, guided to finish)",
    turnLimitStopped: "Stopped (turn limit exceeded)",
    toolCalls: "Tool calls",
    tokens: "Tokens",
    agentId: "Agent ID",
    turnsLabel: "Turns",
    subagentRequest: "Subagent request",
    requestId: "Request ID",
    completionReminder: "Reminder for the parent agent to handle the subagent results",
    completionUnhandled: "The parent agent did not handle the subagent results (reminders exhausted, results saved)",
    compactionResume: "Context compacted; the parent agent resumes its task, and background subagent results will arrive separately",
    underSecond: "less than 1 second",
    waitingParent: "waiting for the parent agent to answer its request",
    toolFailures: "consecutive failures of tools that make changes",
    runFacts: "Run details",
    recentFailures: "Recent failures",
    step: "Step",
    steeringFailed: "Guidance for the subagent was not delivered",
    steeringPartial: "Guidance for the subagent was only partially delivered",
    steeringRecovered: "Guidance for the subagent was delivered after it resumed",
    description: "Description",
    concern: "Concern",
    blocker: "Blocker",
    low: "Low",
    medium: "Medium",
    high: "High",
    correctness: "Correctness",
    missedConstraint: "Missed constraint",
    testGap: "Test gap",
    unsafeChange: "Unsafe change",
    scopeDrift: "Scope drift",
    staleFact: "Stale fact",
    loopRisk: "Risk of looping",
    other: "Other",
    mainAgent: "Main agent",
    lsp: "LSP",
    stale: "Stale",
    reviewFailed: "Review failed",
    stalemateStopped: "Stalemate; further running stopped",
    resolved: "Resolved",
    suppressed: "Suppressed",
    watchdog: "Watchdog warning",
    point: "Summary",
    severity: "Severity",
    importance: "Importance",
    category: "Category",
    evidence: "Evidence",
    recommendation: "Advice for the agent",
    watchdogStatus: "Watchdog status",
    reviewError: "Review error",
    waitTimeout: "Wait timed out; the run may still be active",
    waitAttention: "The awaited run needs the parent agent's attention",
    waitUnconfirmed: "Could not confirm the outcome of the awaited run",
    completionArchive: "Completion archive",
    output: "Output",
    workflowStatus: "Workflow status",
    stillRunning: "Still running",
    ended: "Ended",
    workflowSaveFailed: "Could not save the workflow results",
    webSearch: "Web search",
    webpage: "Pages",
    fetchId: "Fetch ID",
    fetchFailed: "Failed to fetch page content",
    searchResults: "Web search results",
    query: "Queries",
    resultCount: "Result count",
    goal: "Goal",
    goalInactive: "Goal mode is off",
    goalId: "Goal ID",
    goalBudget: "The goal's token budget is exhausted; the agent is wrapping up",
    piNotice: "Pi notification",
    quoted: '"{name}"',
    rawStatus: "Status: {status}",
    outcomeDetail: "{words} ({detail})",
    tallyCount: "{count} {word}",
    exitCode: "exit code {code}",
    signalCode: "signal {signal}",
    runReference: "run {id}",
    omittedPreviews: {
      one: "Previews for {count} additional subtask were omitted to keep the notice short.",
      other: "Previews for {count} additional subtasks were omitted to keep the notice short."
    },
    unavailablePreview: "  Preview unavailable ({reason})",
    savedOutput: "  Saved output: {path}",
    outputArtifact: "  Output artifact: {path}",
    structuredOutput: "  Structured output: {path}",
    indentedError: "  Error: {error}",
    blockerDetails: "- {name}: {detail} ({status})",
    scheduleName: "{name} ({id})",
    errorDetail: "{kind}: {error}",
    errorText: "Error: {error}",
    scheduleText: "Schedule: {schedule}",
    outputFileText: "Output file: {path}",
    elapsed: "Elapsed {duration}",
    turnCount: {
      one: "{count} turn",
      other: "{count} turns"
    },
    tokenCount: {
      one: "{count} token",
      other: "{count} tokens"
    },
    toolCount: {
      one: "{count} tool call",
      other: "{count} tool calls"
    },
    path: "Path {path}",
    steeringState: "Guidance for the subagent: {state}",
    waitOutcome: "Awaited run: {outcome}",
    fetchNone: "No content was fetched from any of the {total} pages",
    fetchPartial: "Fetched content from {ok}/{total} pages (some pages could not be fetched)",
    fetchComplete: "Fetched full content from {ok}/{total} pages",
    queryCount: {
      one: "{count} query",
      other: "{count} queries"
    },
    quotedQuery: '"{query}"',
    outputVerificationFailed: "  Output artifact verification failed: {error}",
    structuredVerificationFailed: "  Structured output verification failed: {error}",
    dispatchedChildren: {
      one: "Dispatch complete; {count} subtask is still running or uncollected",
      other: "Dispatch complete; {count} subtasks are still running or uncollected"
    },
    runningChildren: {
      one: "{count} subtask is still running or uncollected",
      other: "{count} subtasks are still running or uncollected"
    },
    namedOutcome: "{name} {outcome}",
    withInfo: "{name} ({info}): {outcome}",
    fieldValue: "{label}: {value}",
    groupEnded: {
      one: "{count} subagent finished: {outcomes}",
      other: "{count} subagents finished: {outcomes}"
    },
    groupCompletedNamed: {
      one: "{count} subagent completed: {names}",
      other: "{count} subagents completed: {names}"
    },
    groupCompleted: {
      one: "{count} subagent completed",
      other: "{count} subagents completed"
    },
    groupCompletedPartial: {
      one: "{count} subagent completed; the rest are still running",
      other: "{count} subagents completed; the rest are still running"
    },
    groupEndedPartial: {
      one: "{count} subagent finished: {outcomes}; the rest are still running",
      other: "{count} subagents finished: {outcomes}; the rest are still running"
    },
    progress: "Progress update (still running)",
    progressDetail: "Progress update: {detail} (still running)",
    progressNamed: "{name} sent a progress update (still running)",
    progressNamedDetail: "{name} sent a progress update: {detail} (still running)",
    workspace: "The isolated workspace was removed, leaving changes behind",
    workspaceDetail: "The isolated workspace was removed, leaving changes behind: {detail}",
    workspaceNamed: "The isolated workspace for {name} was removed, leaving changes behind",
    workspaceNamedDetail: "The isolated workspace for {name} was removed, leaving changes behind: {detail}",
    subagentLead: "Subagent",
    requestProgress: "{name} sent a progress update",
    requestProgressDetail: "{name} sent a progress update: {detail}",
    requestInterview: "{name} asks the parent agent to answer a set of questions",
    requestInterviewDetail: "{name} asks the parent agent to answer a set of questions: {detail}",
    requestDecision: "{name} asks the parent agent to make a decision",
    requestDecisionDetail: "{name} asks the parent agent to make a decision: {detail}",
    requestsUnansweredCount: {
      one: "{count} subagent request remains unanswered (reminders exhausted)",
      other: "{count} subagent requests remain unanswered (reminders exhausted)"
    },
    requestsUnanswered: "The subagent request remains unanswered (reminders exhausted)",
    requestReminderCount: {
      one: "Reminder for the parent agent to answer {count} subagent request",
      other: "Reminder for the parent agent to answer {count} subagent requests"
    },
    requestReminder: "Reminder for the parent agent to answer the subagent request",
    toolElapsed: "Tool {tool} has run for {duration}",
    toolName: "Tool {tool}",
    seconds: {
      one: "{count} second",
      other: "{count} seconds"
    },
    subagentFailed: "{name} failed",
    longRunningDuration: "{name} is still running after {duration}",
    longRunning: "{name} is still running after a long time",
    idleDuration: "no activity for {duration}",
    toolLongRunning: "tool {tool} has been running for a long time",
    unnamedToolElapsed: "a tool has run for {duration}",
    unnamedToolLongRunning: "a tool has been running for a long time",
    needsAttentionReason: "{name} needs the parent agent's attention ({reason})",
    needsAttention: "{name} needs the parent agent's attention",
    watchdogBlocker: "{name} has a blocker",
    watchdogBlockerDetail: "{name} has a blocker: {detail}",
    watchdogConcern: "{name} has a concern",
    watchdogConcernDetail: "{name} has a concern: {detail}",
    commaSeparator: ", ",
    clarifyDetail: "The agent is asked to clarify: {detail}",
    clarify: "The agent is asked to clarify",
    hasResult: "has a result",
    workflowChild: "Workflow subtask {name}: {outcome}",
    workflowChildRunning: "Workflow subtask {name}: {outcome}; the workflow is still running",
    workflowChildEnded: "Workflow subtask {name}: {outcome}; the workflow has ended",
    search: "Search {subject}",
    searchCount: "Search {subject}: {total} results",
    searchFailed: "Search {subject}: {failed} queries failed",
    searchCountFailed: "Search {subject}: {total} results, {failed} queries failed",
    goalUpdatedDetail: "Goal contract updated: {detail}",
    goalUpdated: "Goal contract updated",
    factSeparator: " \xB7 ",
    completedSentence: "completed",
    failedSentence: "failed",
    stoppedSentence: "stopped",
    canceledSentence: "canceled",
    pausedSentence: "paused",
    timeoutSentence: "timed out",
    runningSentence: "running",
    queuedSentence: "queued",
    neverStartedSentence: "stopped while queued; never started",
    steeredSentence: "completed (turn limit reached, guided to finish)",
    turnLimitStoppedSentence: "stopped (turn limit exceeded)",
    nameList: "{names}, {name}",
    watchdogBlockerUnnamed: "A blocker was reported",
    watchdogBlockerUnnamedDetail: "A blocker was reported: {detail}",
    watchdogConcernUnnamed: "A concern was reported",
    watchdogConcernUnnamedDetail: "A concern was reported: {detail}"
  }
};

// resources/third-party/default-features/vivid-activity/shared/locales/kit/en.json
var en_default2 = {
  $meta: {
    name: "English"
  },
  kitText: {
    listSeparator: ", "
  },
  kitLazy: {
    mismatch: "The {label} view does not match the plugin version. Reconnect, then open it again.",
    invalidPart: "The view arrived incomplete. Try again.",
    updated: "The view was updated meanwhile. Try again or reconnect.",
    versionMismatch: "The view does not match this version. Reconnect to load it.",
    failed: "Could not load {label}: {error}",
    retry: "Retry",
    loading: "Loading {label}\u2026"
  },
  kitUi: {
    remove: "Remove {label}",
    collapse: "Collapse {title}",
    expand: "Expand {title}",
    dismiss: "Dismiss",
    loading: "Loading",
    search: "Search",
    clearSearch: "Clear search",
    metaSeparator: " \xB7 ",
    syncLive: "Up to date",
    syncSyncing: "Syncing",
    syncStale: "May be out of date",
    syncError: "Sync failed"
  },
  kitTime: {
    justNow: "just now",
    minutesAgo: {
      one: "{count} minute ago",
      other: "{count} minutes ago"
    },
    hoursAgo: {
      one: "{count} hour ago",
      other: "{count} hours ago"
    },
    todayAt: "today {time}",
    yesterdayAt: "yesterday {time}",
    months: "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",
    monthDay: "{month} {day}",
    yearMonthDay: "{month} {day}, {year}",
    seconds: "{count}s",
    minutes: "{count}m",
    minutesSeconds: "{minutes}m {seconds}s",
    hours: "{count}h",
    hoursMinutes: "{hours}h {minutes}m"
  },
  kitSend: {
    message: "message",
    send: "Send",
    sendAnyway: "Send anyway",
    interruptAndSend: "Interrupt and send",
    archived: "This agent is archived",
    unavailable: "This agent is no longer available",
    outOfBandNote: "Paseo runs this command on its own: the current turn and pending approvals are not affected",
    maybeOutOfBandNote: "This command may run on its own, or it may interrupt the current turn",
    maybeOutOfBandConfirm: "With goals turned on, Codex runs /goal beside the current turn without interrupting it or touching approvals. Without goals, sending this {what} interrupts its current turn. Send anyway?",
    maybeOutOfBandConfirmApproval: "With goals turned on, Codex runs /goal beside the current turn without interrupting it or touching approvals. Without goals, sending this {what} interrupts its current turn and cancels the pending approval request. Send anyway?",
    waitingNote: "The agent is waiting for your approval; sending cancels it",
    waitingSteerConfirm: "The agent is waiting for your approval. This {what} will join the current turn and the approval request will be canceled, so the action waiting for approval will not run. Send anyway?",
    waitingConfirm: "The agent is waiting for your approval. Sending this {what} interrupts the current turn and cancels the approval request, so the action waiting for approval will not run. Send anyway?",
    steerNote: "Running; joins the current turn without interrupting it",
    slashBlockedNote: "Running; this command cannot join the current turn",
    slashBlockedConfirm: "This agent is running. This command cannot join the current turn, so sending the {what} interrupts it. Send anyway?",
    noSteerNote: "Running; this agent cannot take messages mid-turn",
    noSteerConfirm: "This agent is running and cannot take messages mid-turn, so sending the {what} interrupts its current turn. Send anyway?",
    errorNote: "The agent's last turn failed",
    closedNote: "The session is not loaded; sending loads it",
    maybeDelivered: "The last send may have gone through. Open the session and check before sending again.",
    changed: "The agent's state changed. Confirm this message again before sending it.",
    failed: "Sending failed. Try again."
  },
  kitDeferred: {
    afterApprovalLabel: "Send after the approval",
    afterApprovalNote: "Leaves the approval alone and sends automatically once you have handled it and this turn ends",
    afterTurnLabel: "Send when this turn ends",
    afterTurnNote: "Does not interrupt; sends automatically when the current turn ends",
    queued: "Queued",
    held: "Needs you",
    sending: "Sending",
    sent: "Delivered",
    maybeSent: "Maybe delivered",
    canceled: "Canceled",
    discarded: "Not sent",
    expired: "Expired"
  },
  kitDeferredServer: {
    queued: "Queued. Sends automatically when the agent finishes this turn and has no pending approvals.",
    scheduled: "Scheduled. Once its time comes, sends automatically when the agent finishes its turn and has no pending approvals.",
    sending: "Sending",
    movedOn: "New messages arrived in the session after this was queued. Still send it?",
    unsure: "The session changed after this was queued, and it is unclear whether someone else sent a message. Still send it?",
    unknown: 'No result came back, so it may have been delivered. "Send anyway" checks the session first and resends only if the message is not there. You can also cancel.',
    failed: 'Sending failed: {error}. "Send anyway" checks the session first and resends only if the message is not there. You can also cancel.',
    failedRepeatedly: 'Sending failed several times: {error}. "Send anyway" checks the session first and resends only if the message is not there. You can also cancel.',
    stopped: 'The plugin reloaded before this was sent. "Send anyway" sends it when the agent is idle. You can also cancel.',
    settling: 'The last send may still be in progress; the message is not in the session yet. Try "Send anyway" again in two minutes.',
    unreadable: 'Could not read the session, so it is unclear whether the last send arrived. Try "Send anyway" again later.',
    cannotTell: "The session is too long to check whether the last send arrived. Open the session: if the message is not there, cancel this one and send it again.",
    strangers: "The session has messages of unknown origin (possibly rebuilt from history), so it is unclear whether the last send arrived. Open the session: if the message is not there, cancel this one and send it again.",
    late: "Could not confirm the agent's state in time, so nothing was sent. Try again.",
    sent: "Delivered",
    found: "Delivered (found in the session)",
    foundSame: "The session already has a message with the same text, so it was not sent again (the session does not record message ids, so it cannot tell whether that was this one)",
    maybeSent: "Unclear whether it was delivered. Open the session to check.",
    canceledUnknown: "Canceled and not resent; the earlier attempt may have been delivered",
    canceledFailed: "Canceled; no more retries",
    canceled: "Canceled; not sent",
    discarded: "The agent is archived or gone; not sent",
    expired: "Queued for more than a day; gave up sending",
    expiredScheduled: "Could not be sent within a day of its scheduled time; gave up sending",
    busy: "Another message is being sent to this agent, so this one was not sent. Try again shortly.",
    gone: "This agent is archived or gone; nothing was sent.",
    refused: "{reason}; not sent.",
    refusedAfterTry: "{reason}. It was sent once before and delivery was not confirmed, so it will not be sent again. Open the session to check.",
    guardUnknown: "Could not confirm this message still applies ({error}); not sent.",
    guardUnknownBusy: "Could not confirm this message still applies ({error}); not sent. Try again shortly.",
    guardHeld: 'Could not confirm this message still applies ({error}); not sent. "Send anyway" checks again. You can also cancel.',
    lockBusy: "Could not get the send lock (the lock file is not usable), so nothing was sent. Try again shortly.",
    lockHeld: "Could not get the send lock (the lock file is not usable), so nothing was sent. Retry or cancel.",
    lockUnusable: "The lock file is not usable",
    noStart: "The agent did not start the turn within {seconds} seconds",
    otherRun: "The agent is running another turn",
    finishingTurn: "The agent is still finishing its last turn",
    notFound: "Agent not found",
    timeout: "Paseo did not answer in time",
    disconnected: "Lost the connection to Paseo",
    hostSaid: "Paseo said: {text}",
    unknownError: "Unknown error",
    notConnected: "The plugin is not connected to the Paseo daemon yet. Try again shortly.",
    empty: "The message is empty.",
    tooLong: "The message is too long to send.",
    tooLongToQueue: "The message is too long to queue.",
    tooFarAhead: "A message can be scheduled at most 7 days ahead.",
    badSchedule: "The scheduled time is not valid.",
    goneCannotQueue: "This agent is archived or gone, so the message cannot be queued.",
    tooLateToCancel: "This message is already being sent; it is too late to cancel.",
    readTimelineTimeout: "Reading the session timed out",
    readAgentTimeout: "Reading the agent timed out. Try again shortly.",
    noGuardCheck: "The plugin has no check for this condition",
    checkTimeout: "The check timed out",
    tooManyQueued: "Too many messages are queued. Clear some first.",
    tooManyForAgent: "Too many messages are queued for this agent. Clear some first.",
    movedOnScheduled: "This scheduled message is due, but new messages arrived in the session after it was queued. Still send it?",
    unsureScheduled: "This scheduled message is due, but the session changed after it was queued, and it is unclear whether someone else sent a message. Still send it?"
  },
  kitLanguage: {
    title: "Language",
    label: "Display language",
    hint: "The text in this plugin. Follow system uses the device's language, or English when that language is not available.",
    auto: "Follow system ({name})",
    custom: "{name} (custom, {percent}%)",
    customOverride: "{name} (with your changes)",
    folderLabel: "Add a language",
    folderHint: "Put a translation in {folder}, named by its language code, such as ko.json. Copy templates/en.json or templates/zh-CN.json and translate it; entries you leave out show in English.",
    rescanLabel: "After editing a language file",
    rescan: "Reload",
    issuesLabel: "Problems in {file}",
    loading: "Loading languages\u2026",
    loadFailed: "Could not load the languages: {error}",
    saveFailed: "Could not save: {error}",
    issueNotObject: "The file is not a JSON object.",
    issueNotSection: '"{id}" is not a group of messages.',
    issueUnknownMessage: '"{id}" is not a message of this plugin (ignored).',
    issueBadShape: '"{id}" must be text or plural forms with "other".',
    issueTooLong: '"{id}" is too long or contains control characters.',
    issueBadPlaceholder: '"{id}" uses {detail}, which this message does not have.',
    issueLink: "The file is a link; put the file itself here.",
    issueOpen: "Cannot open the file ({detail}).",
    issueNotFile: "Not a regular file.",
    issueTooBig: "The file is larger than 2 MB.",
    issueBadJson: "Not valid JSON: {detail}"
  }
};

// resources/third-party/default-features/vivid-activity/server/locales.ts
var BUILTIN_CATALOGS = { "zh-CN": [zh_CN_default2, zh_CN_default], en: [en_default, en_default2] };

// resources/third-party/default-features/vivid-activity/shared/generated/fx-chunk-manifest.ts
var FX_CHUNK = { "name": "fx", "hash": "3faefed94fb3660c", "api": 1, "bytes": 103805 };

// resources/third-party/default-features/vivid-activity/shared/generated/pi-chunk-manifest.ts
var PI_CHUNK = { "name": "pi", "hash": "b130f1535e022605", "api": 1, "bytes": 52174 };

// resources/third-party/default-features/vivid-activity/shared/generated/ui-chunk-manifest.ts
var UI_CHUNK = { "name": "ui", "hash": "a492b0bc639a4a47", "api": 1, "bytes": 367378 };

// resources/third-party/default-features/vivid-activity/server/generated/fx-chunk.txt
var fx_chunk_default = '(function(require) {\nconst module = { exports: {} };\nconst exports = module.exports;\n"use strict";var __create=Object.create,__defProp=Object.defineProperty,__getOwnPropDesc=Object.getOwnPropertyDescriptor,__getOwnPropNames=Object.getOwnPropertyNames,__getProtoOf=Object.getPrototypeOf,__hasOwnProp=Object.prototype.hasOwnProperty,__commonJS=(cb,mod)=>function(){return mod||(0,cb[__getOwnPropNames(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports},__export=(target,all)=>{for(var name in all)__defProp(target,name,{get:all[name],enumerable:!0})},__copyProps=(to,from,except,desc)=>{if(from&&typeof from=="object"||typeof from=="function")for(let key of __getOwnPropNames(from))!__hasOwnProp.call(to,key)&&key!==except&&__defProp(to,key,{value:from[key],enumerable:!(desc=__getOwnPropDesc(from,key))||desc.enumerable});return to},__toESM=(mod,isNodeMode,target)=>(target=mod!=null?__create(__getProtoOf(mod)):{},__copyProps(isNodeMode||!mod||!mod.__esModule?__defProp(target,"default",{value:mod,enumerable:!0}):target,mod)),__toCommonJS=mod=>__copyProps(__defProp({},"__esModule",{value:!0}),mod),require_prism_core_min=__commonJS({"node_modules/prismjs/components/prism-core.min.js"(exports2,module2){var _self=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:{},Prism3=(function(e){var n=/(?:^|\\s)lang(?:uage)?-([\\w-]+)(?=\\s|$)/i,t3=0,r={},a={manual:e.Prism&&e.Prism.manual,disableWorkerMessageHandler:e.Prism&&e.Prism.disableWorkerMessageHandler,util:{encode:function e2(n2){return n2 instanceof i?new i(n2.type,e2(n2.content),n2.alias):Array.isArray(n2)?n2.map(e2):n2.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\\u00a0/g," ")},type:function(e2){return Object.prototype.toString.call(e2).slice(8,-1)},objId:function(e2){return e2.__id||Object.defineProperty(e2,"__id",{value:++t3}),e2.__id},clone:function e2(n2,t4){var r2,i2;switch(t4=t4||{},a.util.type(n2)){case"Object":if(i2=a.util.objId(n2),t4[i2])return t4[i2];for(var l2 in r2={},t4[i2]=r2,n2)n2.hasOwnProperty(l2)&&(r2[l2]=e2(n2[l2],t4));return r2;case"Array":return i2=a.util.objId(n2),t4[i2]?t4[i2]:(r2=[],t4[i2]=r2,n2.forEach((function(n3,a2){r2[a2]=e2(n3,t4)})),r2);default:return n2}},getLanguage:function(e2){for(;e2;){var t4=n.exec(e2.className);if(t4)return t4[1].toLowerCase();e2=e2.parentElement}return"none"},setLanguage:function(e2,t4){e2.className=e2.className.replace(RegExp(n,"gi"),""),e2.classList.add("language-"+t4)},currentScript:function(){if(typeof document>"u")return null;if(document.currentScript&&document.currentScript.tagName==="SCRIPT")return document.currentScript;try{throw new Error}catch(r2){var e2=(/at [^(\\r\\n]*\\((.*):[^:]+:[^:]+\\)$/i.exec(r2.stack)||[])[1];if(e2){var n2=document.getElementsByTagName("script");for(var t4 in n2)if(n2[t4].src==e2)return n2[t4]}return null}},isActive:function(e2,n2,t4){for(var r2="no-"+n2;e2;){var a2=e2.classList;if(a2.contains(n2))return!0;if(a2.contains(r2))return!1;e2=e2.parentElement}return!!t4}},languages:{plain:r,plaintext:r,text:r,txt:r,extend:function(e2,n2){var t4=a.util.clone(a.languages[e2]);for(var r2 in n2)t4[r2]=n2[r2];return t4},insertBefore:function(e2,n2,t4,r2){var i2=(r2=r2||a.languages)[e2],l2={};for(var o2 in i2)if(i2.hasOwnProperty(o2)){if(o2==n2)for(var s2 in t4)t4.hasOwnProperty(s2)&&(l2[s2]=t4[s2]);t4.hasOwnProperty(o2)||(l2[o2]=i2[o2])}var u2=r2[e2];return r2[e2]=l2,a.languages.DFS(a.languages,(function(n3,t5){t5===u2&&n3!=e2&&(this[n3]=l2)})),l2},DFS:function e2(n2,t4,r2,i2){i2=i2||{};var l2=a.util.objId;for(var o2 in n2)if(n2.hasOwnProperty(o2)){t4.call(n2,o2,n2[o2],r2||o2);var s2=n2[o2],u2=a.util.type(s2);u2!=="Object"||i2[l2(s2)]?u2!=="Array"||i2[l2(s2)]||(i2[l2(s2)]=!0,e2(s2,t4,o2,i2)):(i2[l2(s2)]=!0,e2(s2,t4,null,i2))}}},plugins:{},highlightAll:function(e2,n2){a.highlightAllUnder(document,e2,n2)},highlightAllUnder:function(e2,n2,t4){var r2={callback:t4,container:e2,selector:\'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code\'};a.hooks.run("before-highlightall",r2),r2.elements=Array.prototype.slice.apply(r2.container.querySelectorAll(r2.selector)),a.hooks.run("before-all-elements-highlight",r2);for(var i2,l2=0;i2=r2.elements[l2++];)a.highlightElement(i2,n2===!0,r2.callback)},highlightElement:function(n2,t4,r2){var i2=a.util.getLanguage(n2),l2=a.languages[i2];a.util.setLanguage(n2,i2);var o2=n2.parentElement;o2&&o2.nodeName.toLowerCase()==="pre"&&a.util.setLanguage(o2,i2);var s2={element:n2,language:i2,grammar:l2,code:n2.textContent};function u2(e2){s2.highlightedCode=e2,a.hooks.run("before-insert",s2),s2.element.innerHTML=s2.highlightedCode,a.hooks.run("after-highlight",s2),a.hooks.run("complete",s2),r2&&r2.call(s2.element)}if(a.hooks.run("before-sanity-check",s2),(o2=s2.element.parentElement)&&o2.nodeName.toLowerCase()==="pre"&&!o2.hasAttribute("tabindex")&&o2.setAttribute("tabindex","0"),!s2.code)return a.hooks.run("complete",s2),void(r2&&r2.call(s2.element));if(a.hooks.run("before-highlight",s2),s2.grammar)if(t4&&e.Worker){var c2=new Worker(a.filename);c2.onmessage=function(e2){u2(e2.data)},c2.postMessage(JSON.stringify({language:s2.language,code:s2.code,immediateClose:!0}))}else u2(a.highlight(s2.code,s2.grammar,s2.language));else u2(a.util.encode(s2.code))},highlight:function(e2,n2,t4){var r2={code:e2,grammar:n2,language:t4};if(a.hooks.run("before-tokenize",r2),!r2.grammar)throw new Error(\'The language "\'+r2.language+\'" has no grammar.\');return r2.tokens=a.tokenize(r2.code,r2.grammar),a.hooks.run("after-tokenize",r2),i.stringify(a.util.encode(r2.tokens),r2.language)},tokenize:function(e2,n2){var t4=n2.rest;if(t4){for(var r2 in t4)n2[r2]=t4[r2];delete n2.rest}var a2=new s;return u(a2,a2.head,e2),o(e2,a2,n2,a2.head,0),(function(e3){for(var n3=[],t5=e3.head.next;t5!==e3.tail;)n3.push(t5.value),t5=t5.next;return n3})(a2)},hooks:{all:{},add:function(e2,n2){var t4=a.hooks.all;t4[e2]=t4[e2]||[],t4[e2].push(n2)},run:function(e2,n2){var t4=a.hooks.all[e2];if(t4&&t4.length)for(var r2,i2=0;r2=t4[i2++];)r2(n2)}},Token:i};function i(e2,n2,t4,r2){this.type=e2,this.content=n2,this.alias=t4,this.length=0|(r2||"").length}function l(e2,n2,t4,r2){e2.lastIndex=n2;var a2=e2.exec(t4);if(a2&&r2&&a2[1]){var i2=a2[1].length;a2.index+=i2,a2[0]=a2[0].slice(i2)}return a2}function o(e2,n2,t4,r2,s2,g2){for(var f2 in t4)if(t4.hasOwnProperty(f2)&&t4[f2]){var h2=t4[f2];h2=Array.isArray(h2)?h2:[h2];for(var d=0;d<h2.length;++d){if(g2&&g2.cause==f2+","+d)return;var v=h2[d],p=v.inside,m=!!v.lookbehind,y=!!v.greedy,k=v.alias;if(y&&!v.pattern.global){var x=v.pattern.toString().match(/[imsuy]*$/)[0];v.pattern=RegExp(v.pattern.source,x+"g")}for(var b=v.pattern||v,w=r2.next,A=s2;w!==n2.tail&&!(g2&&A>=g2.reach);A+=w.value.length,w=w.next){var P=w.value;if(n2.length>e2.length)return;if(!(P instanceof i)){var E,S=1;if(y){if(!(E=l(b,A,e2,m))||E.index>=e2.length)break;var L=E.index,O=E.index+E[0].length,C=A;for(C+=w.value.length;L>=C;)C+=(w=w.next).value.length;if(A=C-=w.value.length,w.value instanceof i)continue;for(var j=w;j!==n2.tail&&(C<O||typeof j.value=="string");j=j.next)S++,C+=j.value.length;S--,P=e2.slice(A,C),E.index-=A}else if(!(E=l(b,0,P,m)))continue;L=E.index;var N=E[0],_=P.slice(0,L),M=P.slice(L+N.length),W=A+P.length;g2&&W>g2.reach&&(g2.reach=W);var I=w.prev;if(_&&(I=u(n2,I,_),A+=_.length),c(n2,I,S),w=u(n2,I,new i(f2,p?a.tokenize(N,p):N,k,N)),M&&u(n2,w,M),S>1){var T={cause:f2+","+d,reach:W};o(e2,n2,t4,w.prev,A,T),g2&&T.reach>g2.reach&&(g2.reach=T.reach)}}}}}}function s(){var e2={value:null,prev:null,next:null},n2={value:null,prev:e2,next:null};e2.next=n2,this.head=e2,this.tail=n2,this.length=0}function u(e2,n2,t4){var r2=n2.next,a2={value:t4,prev:n2,next:r2};return n2.next=a2,r2.prev=a2,e2.length++,a2}function c(e2,n2,t4){for(var r2=n2.next,a2=0;a2<t4&&r2!==e2.tail;a2++)r2=r2.next;n2.next=r2,r2.prev=n2,e2.length-=a2}if(e.Prism=a,i.stringify=function e2(n2,t4){if(typeof n2=="string")return n2;if(Array.isArray(n2)){var r2="";return n2.forEach((function(n3){r2+=e2(n3,t4)})),r2}var i2={type:n2.type,content:e2(n2.content,t4),tag:"span",classes:["token",n2.type],attributes:{},language:t4},l2=n2.alias;l2&&(Array.isArray(l2)?Array.prototype.push.apply(i2.classes,l2):i2.classes.push(l2)),a.hooks.run("wrap",i2);var o2="";for(var s2 in i2.attributes)o2+=" "+s2+\'="\'+(i2.attributes[s2]||"").replace(/"/g,"&quot;")+\'"\';return"<"+i2.tag+\' class="\'+i2.classes.join(" ")+\'"\'+o2+">"+i2.content+"</"+i2.tag+">"},!e.document)return e.addEventListener&&(a.disableWorkerMessageHandler||e.addEventListener("message",(function(n2){var t4=JSON.parse(n2.data),r2=t4.language,i2=t4.code,l2=t4.immediateClose;e.postMessage(a.highlight(i2,a.languages[r2],r2)),l2&&e.close()}),!1)),a;var g=a.util.currentScript();function f(){a.manual||a.highlightAll()}if(g&&(a.filename=g.src,g.hasAttribute("data-manual")&&(a.manual=!0)),!a.manual){var h=document.readyState;h==="loading"||h==="interactive"&&g&&g.defer?document.addEventListener("DOMContentLoaded",f):window.requestAnimationFrame?window.requestAnimationFrame(f):window.setTimeout(f,16)}return a})(_self);typeof module2<"u"&&module2.exports&&(module2.exports=Prism3),typeof global<"u"&&(global.Prism=Prism3)}}),fx_chunk_client_exports={};__export(fx_chunk_client_exports,{default:()=>chunk}),module.exports=__toCommonJS(fx_chunk_client_exports);var kitText={listSeparator:"\\u3001"},kitUi={remove:"\\u79FB\\u9664 {label}",collapse:"\\u6536\\u8D77 {title}",expand:"\\u5C55\\u5F00 {title}",dismiss:"\\u5173\\u95ED\\u63D0\\u793A",loading:"\\u52A0\\u8F7D\\u4E2D",search:"\\u641C\\u7D22",clearSearch:"\\u6E05\\u9664\\u641C\\u7D22",metaSeparator:" \\xB7 ",syncLive:"\\u5DF2\\u540C\\u6B65",syncSyncing:"\\u540C\\u6B65\\u4E2D",syncStale:"\\u53EF\\u80FD\\u5DF2\\u8FC7\\u65F6",syncError:"\\u540C\\u6B65\\u5931\\u8D25"},kitTime={justNow:"\\u521A\\u521A",minutesAgo:"{count} \\u5206\\u949F\\u524D",hoursAgo:"{count} \\u5C0F\\u65F6\\u524D",todayAt:"\\u4ECA\\u5929 {time}",yesterdayAt:"\\u6628\\u5929 {time}",months:"1|2|3|4|5|6|7|8|9|10|11|12",monthDay:"{month}\\u6708{day}\\u65E5",yearMonthDay:"{year}\\u5E74{month}\\u6708{day}\\u65E5",seconds:"{count} \\u79D2",minutes:"{count} \\u5206",minutesSeconds:"{minutes} \\u5206 {seconds} \\u79D2",hours:"{count} \\u5C0F\\u65F6",hoursMinutes:"{hours} \\u5C0F\\u65F6 {minutes} \\u5206"},SOURCE_LANGUAGE="zh-CN",PLURAL_CATEGORIES=["zero","one","two","few","many","other"],META_SECTION="$meta",FORMS_LANGUAGE="$language",PLACEHOLDER=/\\{([A-Za-z_][A-Za-z0-9_]*)\\}/g,hasOwn=(value,name)=>Object.prototype.hasOwnProperty.call(value,name),isObject=value=>typeof value=="object"&&value!==null&&!Array.isArray(value);function isPluralForms(value){return!isObject(value)||!hasOwn(value,"other")?!1:Object.keys(value).every(name=>(PLURAL_CATEGORIES.includes(name)||name===FORMS_LANGUAGE)&&typeof value[name]=="string")}var isMessage=value=>typeof value=="string"||isPluralForms(value);function lookup(catalog,id){const at=id.indexOf(".");if(at<=0)return;const section=id.slice(0,at),name=id.slice(at+1);if(section===META_SECTION||!hasOwn(catalog,section))return;const entries=catalog[section];if(!isObject(entries)||!hasOwn(entries,name))return;const message=entries[name];return isMessage(message)?message:void 0}var pluralRules=new Map;function makePluralRule(language){try{const rules=new Intl.PluralRules(language);if(typeof rules.select(1)=="string")return count=>rules.select(count)}catch{}const primary=language.split("-")[0].toLowerCase();return["zh","ja","ko","vi","th","id","ms","lo","my","km","yue"].includes(primary)?()=>"other":primary==="fr"||primary==="pt"?count=>count<2?"one":"other":count=>count===1?"one":"other"}function pluralCategory(language,count){if(!Number.isFinite(count))return"other";let rule=pluralRules.get(language);return rule||(rule=makePluralRule(language),pluralRules.set(language,rule)),rule(Math.abs(count))}function pickForm(message,params,language){if(typeof message=="string")return message;const category=pluralCategory(message[FORMS_LANGUAGE]??language,Number(params?.count));return hasOwn(message,category)?message[category]:message.other}var paramText=value=>value==null?"":String(value);function format(message,params,language=SOURCE_LANGUAGE){const text=pickForm(message,params,language);return!params||text.indexOf("{")<0?text:text.replace(PLACEHOLDER,(whole,name)=>hasOwn(params,name)?paramText(params[name]):whole)}function createTranslator(language,layers,options={}){const showId=options.missing!=="empty",message=id=>{for(const layer of layers){const found=lookup(layer,id);if(found!==void 0)return found}};return{language,hash:options.hash??"",t:(id,params)=>{const found=message(id);return found===void 0?showId?id:"":format(found,params,language)},message}}var defaults=[{kitText}],sourceTranslator=createTranslator(SOURCE_LANGUAGE,defaults,{missing:"empty"}),bound=null,listeners=new Set;function addDefaults(catalog){defaults.includes(catalog)||defaults.push(catalog)}function bindTranslator(next){if(next!==bound){bound=next;for(const listener of Array.from(listeners))try{listener()}catch{}}}var t=(id,params)=>(bound??sourceTranslator).t(id,params),textSource=null;function followText(source){source&&(textSource=source,bindTranslator(source.translator()),source.subscribe(()=>bindTranslator(source.translator())))}var t2=(id,params)=>t(id,params),import_react=require("react"),import_client=require("@getpaseo/plugin/client"),import_plugin=require("@getpaseo/plugin"),import_zod=require("zod"),TEXT_SIZES=["small","standard","large","larger"],LINE_SPACINGS=["compact","standard","relaxed"],DEFAULT_TEXT_SIZE="standard",DEFAULT_LINE_SPACING="standard",MONO_FONT_MAX=200,SIZE_SCALE={small:11/12,standard:1,large:14/12,larger:16/12},LINE_SCALE={compact:.88,standard:1,relaxed:1.25},GENERIC_FAMILIES=new Set(["monospace","ui-monospace","sans-serif","serif","system-ui","ui-sans-serif","ui-serif","cursive","fantasy"]),FAMILY_NAME=/^[\\p{L}\\p{N} ._+-]+$/u;function monoFontStack(value){const trimmed=value.trim();if(!trimmed)return"";if(trimmed.length>MONO_FONT_MAX)return null;const names=[];for(const part of trimmed.split(",")){let name=part.trim();const quote=name[0];if((quote===\'"\'||quote==="\'")&&name.length>=2&&name.endsWith(quote)&&(name=name.slice(1,-1).trim()),!name||!FAMILY_NAME.test(name))return null;name=name.replace(/\\s+/g," "),names.push(GENERIC_FAMILIES.has(name.toLowerCase())?name.toLowerCase():`"${name}"`)}return names.join(", ")}var DEFAULT_TYPOGRAPHY={scale:1,line:1},cache=new Map;function typography(size,spacing,family){if(size===DEFAULT_TEXT_SIZE&&spacing===DEFAULT_LINE_SPACING&&!family)return DEFAULT_TYPOGRAPHY;const id=`${size}|${spacing}|${family??""}`;let value=cache.get(id);return value||cache.set(id,value={scale:SIZE_SCALE[size],line:LINE_SCALE[spacing],...family?{family}:{}}),value}function typesetStyle(style,type){if(type===DEFAULT_TYPOGRAPHY||!style||typeof style!="object"||style.fontFamily!=="monospace")return style;const source=style,next={...source};type.family&&(next.fontFamily=type.family);const size=typeof source.fontSize=="number"?source.fontSize:void 0;return size!==void 0&&(next.fontSize=Math.round(size*type.scale*2)/2),typeof source.lineHeight=="number"&&(next.lineHeight=Math.round(source.lineHeight*type.scale*type.line)),next}var paletteModeSchema=import_zod.z.enum(["vivid","soft","high_contrast","theme"]),expansionModeSchema=import_zod.z.enum(["always","latest","never","failures"]),takeoverScopeSchema=import_zod.z.enum(["all","reasoning","off"]),DEFAULT_TAKEOVER="all",EXPANSION_TARGETS=[{key:"thinking",get label(){return t2("ui.thinking")},default:"latest"},{key:"read",get label(){return t2("settings.readFile")},default:"never"},{key:"edit",get label(){return t2("settings.editFile")},default:"never"},{key:"write",get label(){return t2("settings.writeFile")},default:"never"},{key:"shell",get label(){return t2("ui.command")},default:"never"},{key:"search",get label(){return t2("settings.search")},default:"latest"},{key:"fetch",get label(){return t2("settings.fetchPage")},default:"latest"},{key:"worktree_setup",get label(){return t2("settings.worktreeSetup")},default:"latest"},{key:"sub_agent",get label(){return t2("settings.subagent")},default:"latest"},{key:"plain_text",get label(){return t2("settings.plainTextResults")},default:"latest"},{key:"plan",get label(){return t2("settings.plan")},default:"latest",hidden:!0},{key:"ask",get label(){return t2("settings.ask")},default:"never"},{key:"speak",get label(){return t2("settings.readAloud")},default:"latest"},{key:"todo",get label(){return t2("settings.taskListTools")},default:"latest"},{key:"browser",get label(){return t2("settings.browserTools")},default:"latest"},{key:"unknown",get label(){return t2("settings.otherTools")},default:"latest"}],DEFAULT_EXPANSION=Object.fromEntries(EXPANSION_TARGETS.map(target=>[target.key,target.default])),expansionSettingsSchema=import_zod.z.object(Object.fromEntries(EXPANSION_TARGETS.map(target=>[target.key,expansionModeSchema.default(target.default)]))),densitySchema=import_zod.z.enum(["compact","standard"]),DEFAULT_DENSITY="compact",DEFAULT_FOLD=!0,STRENGTH_KINDS=["dim","faded","soft","full"],DEFAULT_STRENGTH="full",strengthSchema=import_zod.z.enum(STRENGTH_KINDS),commandColorsSchema=import_zod.z.enum(["expanded","always"]),DEFAULT_PIN_PROMPT=!0,LOADER_KINDS=["spinner","sparkle","orb","snake","matrix"],DEFAULT_LOADER="spinner",loaderSchema=import_zod.z.enum(LOADER_KINDS),activitySettings=(0,import_plugin.defineSettings)({id:"display",scope:"host",version:1,schema:import_zod.z.object({takeover:takeoverScopeSchema.default(DEFAULT_TAKEOVER),sidebar:import_zod.z.boolean().default(!0),followOutput:import_zod.z.object({shell:import_zod.z.boolean().default(!0),logs:import_zod.z.boolean().default(!0),todo:import_zod.z.boolean().default(!0),browser:import_zod.z.boolean().default(!0)}).default({shell:!0,logs:!0,todo:!0,browser:!0}),wrapLines:import_zod.z.object({diff:import_zod.z.boolean().default(!1),code:import_zod.z.boolean().default(!1),output:import_zod.z.boolean().default(!1)}).default({diff:!1,code:!1,output:!1}),palette:paletteModeSchema.default("vivid"),expansion:expansionSettingsSchema.default(DEFAULT_EXPANSION),fold:import_zod.z.boolean().default(DEFAULT_FOLD),density:densitySchema.default(DEFAULT_DENSITY),strength:strengthSchema.default(DEFAULT_STRENGTH),commandColors:commandColorsSchema.default("expanded"),thoughtTailFollow:import_zod.z.boolean().default(!1),thoughtTailLines:import_zod.z.number().int().min(5).max(500).default(20),turnTime:import_zod.z.boolean().default(!1),foldTime:import_zod.z.boolean().default(!1),pinPrompt:import_zod.z.boolean().default(DEFAULT_PIN_PROMPT),loader:loaderSchema.default(DEFAULT_LOADER),monoFont:import_zod.z.string().max(MONO_FONT_MAX).default(""),textSize:import_zod.z.enum(TEXT_SIZES).default(DEFAULT_TEXT_SIZE),lineSpacing:import_zod.z.enum(LINE_SPACINGS).default(DEFAULT_LINE_SPACING)})});function useWrapLines(area){const settings=(0,import_client.useSettings)(activitySettings);return settings.status!=="ready"?!1:settings.values.wrapLines?.[area]??!1}var import_react5=require("react"),import_react_native7=require("react-native"),MAX_UNWITNESSED_MS=1800*1e3;function textProperty(id){return{enumerable:!0,get:()=>t2(id)}}function translatedTable(ids){const result={};for(const name of Object.keys(ids))Object.defineProperty(result,name,textProperty(ids[name]));return result}var looks={think:{get label(){return t2("modelLook.think")},icon:"Brain",hue:"violet"},read:{get label(){return t2("modelLook.read")},icon:"FileText",hue:"blue"},list:{get label(){return t2("modelLook.list")},icon:"FolderOpen",hue:"blue"},edit:{get label(){return t2("modelLook.edit")},icon:"FilePen",hue:"green"},write:{get label(){return t2("modelLook.write")},icon:"FilePlus",hue:"green"},shell:{get label(){return t2("modelLook.shell")},icon:"SquareTerminal",hue:"orange"},search:{get label(){return t2("modelLook.search")},icon:"Search",hue:"indigo"},web:{get label(){return t2("modelLook.web")},icon:"Globe",hue:"cyan"},browser:{get label(){return t2("modelLook.browser")},icon:"AppWindow",hue:"cyan"},agent:{get label(){return t2("modelLook.agent")},icon:"Bot",hue:"fuchsia"},plan:{get label(){return t2("modelLook.plan")},icon:"ListChecks",hue:"teal"},ask:{get label(){return t2("modelLook.ask")},icon:"MessageCircleQuestionMark",hue:"amber"},mcp:{get label(){return t2("modelLook.mcp")},icon:"Plug",hue:"pink"},paseo:{get label(){return t2("modelLook.paseo")},icon:"Workflow",hue:"sky"},skill:{get label(){return t2("modelLook.skill")},icon:"Sparkles",hue:"lime"},other:{get label(){return t2("modelLook.other")},icon:"Puzzle",hue:"gray"}},VIVID_CATEGORY_HUES={reasoning:looks.think.hue,shell:looks.shell.hue,file:looks.read.hue,search:looks.search.hue,agent:looks.agent.hue,plan:looks.plan.hue,communication:looks.mcp.hue,unknown:null},COUNT_LABELS=translatedTable({think:"modelCount.think",read:"modelCount.read",list:"modelCount.list",edit:"modelCount.edit",write:"modelCount.write",shell:"modelCount.shell",search:"modelCount.search",web:"modelCount.web",agent:"modelCount.agent",plan:"modelCount.plan",ask:"modelCount.ask",mcp:"modelCount.mcp",paseo:"modelCount.paseo",skill:"modelCount.skill",browser:"modelCount.browser",other:"modelCount.other"}),PASEO_TOOL_ZH=translatedTable({Speak:"modelPaseo.speak","Create Workspace":"modelPaseo.createWorkspace","List Workspaces":"modelPaseo.listWorkspaces","Archive Workspace":"modelPaseo.archiveWorkspace","Rename Workspace":"modelPaseo.renameWorkspace","Create Agent":"modelPaseo.createAgent","Send Agent Prompt":"modelPaseo.sendAgentPrompt","Get Agent Status":"modelPaseo.getAgentStatus","Get Agent Activity":"modelPaseo.getAgentActivity","List Agents":"modelPaseo.listAgents","Cancel Agent Run":"modelPaseo.cancelAgentRun","Archive Agent":"modelPaseo.archiveAgent","Kill Agent":"modelPaseo.killAgent","Update Agent":"modelPaseo.updateAgent","Set Agent Session Mode":"modelPaseo.setAgentSessionMode","List Pending Permissions":"modelPaseo.listPendingPermissions","Respond to Permission":"modelPaseo.respondToPermission","List Workspace Scripts":"modelPaseo.listWorkspaceScripts","Start Workspace Script":"modelPaseo.startWorkspaceScript","Stop Workspace Script":"modelPaseo.stopWorkspaceScript","List Terminals":"modelPaseo.listTerminals","Create Terminal":"modelPaseo.createTerminal","Kill Terminal":"modelPaseo.killTerminal","Capture Terminal":"modelPaseo.captureTerminal","Send Terminal Keys":"modelPaseo.sendTerminalKeys","Create Schedule":"modelPaseo.createSchedule","Create Heartbeat":"modelPaseo.createHeartbeat","Delete Heartbeat":"modelPaseo.deleteHeartbeat","List Schedules":"modelPaseo.listSchedules","Inspect Schedule":"modelPaseo.inspectSchedule","Pause Schedule":"modelPaseo.pauseSchedule","Resume Schedule":"modelPaseo.resumeSchedule","Delete Schedule":"modelPaseo.deleteSchedule","Update Schedule":"modelPaseo.updateSchedule","Schedule Logs":"modelPaseo.scheduleLogs","Run Schedule Once":"modelPaseo.runScheduleOnce","List Providers":"modelPaseo.listProviders","List Models":"modelPaseo.listModels","List Agent Profiles":"modelPaseo.listAgentProfiles","Inspect Provider":"modelPaseo.inspectProvider","List Browser Tabs":"modelPaseo.listBrowserTabs","Browser List Tabs":"modelPaseo.listBrowserTabs","Browser New Tab":"modelPaseo.createBrowserTab","Browser Close Tab":"modelPaseo.closeBrowserTab","Browser Snapshot":"modelPaseo.snapshotBrowserPage","Browser Snapshot Page":"modelPaseo.snapshotBrowserPage","Browser Click":"modelPaseo.clickBrowserElement","Browser Click Element":"modelPaseo.clickBrowserElement","Browser Fill":"modelPaseo.fillBrowserElement","Browser Fill Element":"modelPaseo.fillBrowserElement","Browser Hover":"modelPaseo.hoverBrowserElement","Browser Hover Element":"modelPaseo.hoverBrowserElement","Browser Drag":"modelPaseo.dragBrowserElement","Browser Drag Element":"modelPaseo.dragBrowserElement","Browser Select":"modelPaseo.selectBrowserOption","Browser Select Option":"modelPaseo.selectBrowserOption","Browser Wait":"modelPaseo.waitForBrowserCondition","Browser Wait for Condition":"modelPaseo.waitForBrowserCondition","Browser Type":"modelPaseo.typeIntoBrowser","Browser Type into Element":"modelPaseo.typeIntoBrowser","Browser Press Key":"modelPaseo.pressBrowserKey","Browser Press":"modelPaseo.pressBrowserKey","Browser Navigate":"modelPaseo.navigateBrowser","Browser Scroll":"modelPaseo.scrollBrowser","Browser Scroll Page":"modelPaseo.scrollBrowser","Browser Resize":"modelPaseo.resizeBrowserViewport","Browser Resize Viewport":"modelPaseo.resizeBrowserViewport","Browser Screenshot":"modelPaseo.captureBrowserScreenshot","Browser Capture Screenshot":"modelPaseo.captureBrowserScreenshot","Browser Upload":"modelPaseo.uploadFilesInBrowser","Browser Upload Files":"modelPaseo.uploadFilesInBrowser","Browser Logs":"modelPaseo.readBrowserLogs","Browser Read Logs":"modelPaseo.readBrowserLogs","Browser Console":"modelPaseo.readBrowserLogs","Browser Evaluate":"modelPaseo.evaluateBrowserJavascript","Browser Evaluate JavaScript":"modelPaseo.evaluateBrowserJavascript","Browser Key Press":"modelPaseo.pressBrowserKey","Create Browser Tab":"modelPaseo.createBrowserTab","Close Browser Tab":"modelPaseo.closeBrowserTab","Snapshot Browser Page":"modelPaseo.snapshotBrowserPage","Click Browser Element":"modelPaseo.clickBrowserElement","Fill Browser Element":"modelPaseo.fillBrowserElement","Hover Browser Element":"modelPaseo.hoverBrowserElement","Drag Browser Element":"modelPaseo.dragBrowserElement","Select Browser Option":"modelPaseo.selectBrowserOption","Wait for Browser Condition":"modelPaseo.waitForBrowserCondition","Type into Browser":"modelPaseo.typeIntoBrowser","Press Browser Key":"modelPaseo.pressBrowserKey","Navigate Browser":"modelPaseo.navigateBrowser","Browser Back":"modelPaseo.browserBack","Browser Forward":"modelPaseo.browserForward","Browser Reload":"modelPaseo.browserReload","Capture Browser Screenshot":"modelPaseo.captureBrowserScreenshot","Upload Files in Browser":"modelPaseo.uploadFilesInBrowser","Read Browser Logs":"modelPaseo.readBrowserLogs","Evaluate Browser JavaScript":"modelPaseo.evaluateBrowserJavascript","Scroll Browser":"modelPaseo.scrollBrowser","Resize Browser Viewport":"modelPaseo.resizeBrowserViewport"}),LABELS=translatedTable({Read:"modelLabel.read",List:"modelLabel.list","List Directory":"modelLabel.listDirectory",Edit:"modelLabel.edit",Add:"modelLabel.add",Delete:"modelLabel.delete",Write:"modelLabel.write",Shell:"modelLabel.shell",Search:"modelLabel.search",Find:"modelLabel.find","Fetch URL":"modelLabel.fetchUrl","Agent Task":"modelLabel.agentTask",Plan:"modelLabel.plan",Thinking:"modelLabel.thinking",Skill:"modelLabel.skill",Tasks:"modelLabel.tasks","Ask Question":"modelLabel.askQuestion","Background Task":"modelLabel.backgroundTask",Speak:"modelLabel.speak","Worktree Setup":"modelLabel.worktreeSetup",Tool:"modelLabel.tool","Search Tools":"modelLabel.searchTools","Code Mode":"modelLabel.codeMode","Supervisor Reply":"modelLabel.supervisorReply","Supervisor Queue":"modelLabel.supervisorQueue","Supervisor Requests":"modelLabel.supervisorRequests","Supervisor Status":"modelLabel.supervisorStatus","Subagent Supervisor":"modelLabel.subagentSupervisor",Wait:"modelLabel.wait","Wait for Background Work":"modelLabel.waitForBackgroundWork","Wait Subscription":"modelLabel.waitSubscription","Wait for All":"modelLabel.waitForAll","Wait for Run":"modelLabel.waitForRun","Bg Wait":"modelLabel.bgWait","Wait for Agent":"modelLabel.waitForAgent","Dispatch Agent":"modelLabel.dispatchAgent","Steer Agent":"modelLabel.steerAgent","Check Agent Result":"modelLabel.checkAgentResult","Agent Result":"modelLabel.agentResult","GitHub Actions Details":"modelLabel.gitHubActionsDetails","GitHub Actions List":"modelLabel.gitHubActionsList","GitHub Actions Run":"modelLabel.gitHubActionsRun","GitHub File":"modelLabel.gitHubFile","GitHub Job Logs":"modelLabel.gitHubJobLogs","GitHub Pull Request":"modelLabel.gitHubPullRequest","GitHub Code Search":"modelLabel.gitHubCodeSearch","GitHub Repository Search":"modelLabel.gitHubRepositorySearch","Exa Web Search":"modelLabel.exaWebSearch","Exa Web Fetch":"modelLabel.exaWebFetch","Exa Agent":"modelLabel.exaAgent","Exa Research Guide":"modelLabel.exaResearchGuide","Exa Schema Templates":"modelLabel.exaSchemaTemplates",TodoWrite:"modelLabel.todoWrite",NotebookEdit:"modelLabel.notebookEdit",BashOutput:"modelLabel.bashOutput",KillShell:"modelLabel.killShell",KillBash:"modelLabel.killBash",WebSearch:"modelLabel.webSearch",ExitPlanMode:"modelLabel.exitPlanMode",EnterPlanMode:"modelLabel.enterPlanMode",SlashCommand:"modelLabel.slashCommand",AskUserQuestion:"modelLabel.askUserQuestion",ListMcpResourcesTool:"modelLabel.listMcpResourcesTool",ReadMcpResourceTool:"modelLabel.readMcpResourceTool",Command:"modelLabel.command",Output:"modelLabel.output",Contents:"modelLabel.contents","Written contents":"modelLabel.writtenContents",Before:"modelLabel.before",After:"modelLabel.after",Diff:"modelLabel.diff",Result:"modelLabel.result",Error:"modelLabel.error",Input:"modelLabel.input",Image:"modelLabel.image","Setup log":"modelLabel.setupLog","Activity log":"modelLabel.activityLog",Query:"modelLabel.query",Matches:"modelLabel.matches",Files:"modelLabel.files",Message:"modelLabel.message",Prompt:"modelLabel.prompt",Code:"modelLabel.code",Session:"modelLabel.session"}),STATUS_ZH=translatedTable({Active:"modelStatus.exactActive",Default:"modelStatus.exactDefault",Success:"modelStatus.exactSuccess",Failed:"modelStatus.exactFailed",running:"modelStatus.running",initializing:"modelStatus.initializing",starting:"modelStatus.starting",loading:"modelStatus.loading",completed:"modelStatus.completed",succeeded:"modelStatus.succeeded",success:"modelStatus.success",idle:"modelStatus.idle",active:"modelStatus.active",healthy:"modelStatus.healthy",ready:"modelStatus.ready",available:"modelStatus.available",enabled:"modelStatus.enabled",failed:"modelStatus.failed",error:"modelStatus.error",unhealthy:"modelStatus.unhealthy",unavailable:"modelStatus.unavailable",disabled:"modelStatus.disabled",canceled:"modelStatus.canceled",cancelled:"modelStatus.cancelled",paused:"modelStatus.paused",stopped:"modelStatus.stopped",closed:"modelStatus.closed",exited:"modelStatus.exited",archived:"modelStatus.archived",expired:"modelStatus.expired",skipped:"modelStatus.skipped",pending:"modelStatus.pending",queued:"modelStatus.queued",timeout:"modelStatus.timeout",timed_out:"modelStatus.timedOut",worktree:"modelStatus.worktree",local:"modelStatus.local",none:"modelStatus.none",directory:"modelStatus.directory",tool:"modelStatus.tool",plan:"modelStatus.plan",question:"modelStatus.question",mode:"modelStatus.mode",other:"modelStatus.other",finished:"modelStatus.finished",permission:"modelStatus.permission",closed_by_user:"modelStatus.closedByUser",background:"modelStatus.background"}),SHOW=Object.freeze({kind:"show"}),HIDE=Object.freeze({kind:"hide"});function hashText(text){let hash=2166136261;for(let index=0;index<text.length;index++)hash^=text.charCodeAt(index),hash=Math.imul(hash,16777619)>>>0;return hash.toString(36)}var REASONING_KEY_SAMPLE=64*1024,import_plugin2=require("@getpaseo/plugin"),import_zod2=require("zod"),MAX_READ_IMAGE_BYTES=3*1024*1024,readImageRpc=(0,import_plugin2.defineRpc)({name:"read-image",input:import_zod2.z.object({filePath:import_zod2.z.string().min(1).max(4096),agentId:import_zod2.z.string().min(1).max(256)}),output:import_zod2.z.object({status:import_zod2.z.enum(["ok","not-found","not-image","too-large","unavailable","outside"]),data:import_zod2.z.string().optional(),mimeType:import_zod2.z.string().optional(),byteSize:import_zod2.z.number().int().nonnegative().optional()})});function trimTrailingSlashes(value){let end=value.length;for(;end>0&&value.charCodeAt(end-1)===47;)end-=1;return value.slice(0,end)}function splitFileDisplay(path){const slash=path.lastIndexOf("/");if(slash<0)return{base:path};const dir=path.slice(0,slash),base=path.slice(slash+1)||path;return dir?{dir,base}:{base}}function truncateDirFront(dir,maxSegments=2){const absolute=dir.startsWith("/"),segments=dir.split("/").filter(segment=>segment.length>0);return segments.length<=maxSegments?`${absolute?"/":""}${segments.join("/")}`:`\\u2026/${segments.slice(-maxSegments).join("/")}`}function prettyToolName(name){const normalized=name.trim().replace(/[._-]+/g," ");return normalized?normalized.split(/\\s+/).map(part=>`${part[0]?.toUpperCase()??""}${part.slice(1)}`).join(" "):"Tool"}function isRecord(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)}function stringField(value,key){if(!isRecord(value))return;const field=value[key];return typeof field=="string"&&field.trim()?field:void 0}function normalizePiToolName(toolName){return toolName.trim().toLowerCase().replace(/^(?:functions|tools)\\./,"").replace(/^mcp__.*?__/,"").replace(/^mcp_/,"")}function decodeToolInput(value){if(typeof value=="string"){const parsed=parseJsonString(value);return isRecord(parsed)?parsed:void 0}return isRecord(value)?value:void 0}function extractPiToolText(output){if(typeof output=="string")return output.trim()?{text:output}:void 0;if(!isRecord(output))return;const content=output.content;if(typeof content=="string"&&content.trim())return{text:content,...isRecord(output.details)?{details:output.details}:{}};if(Array.isArray(content)){const texts=content.flatMap(item=>isRecord(item)&&item.type==="text"&&typeof item.text=="string"&&item.text.trim()?[item.text]:[]);if(texts.length>0)return{text:texts.join(`\n`),...isRecord(output.details)?{details:output.details}:{}}}if(isRecord(output.details))return{text:"",details:output.details}}var MAX_EMBEDDED_JSON_CHARS=1e5,MAX_EMBEDDED_JSON_STARTS=8;function parseEmbeddedJson(value){try{return JSON.parse(value)}catch{if(value.length>MAX_EMBEDDED_JSON_CHARS)return;let starts=0;for(const match of value.matchAll(/\\{|\\[/g)){const offset=match.index;if(offset!==void 0){if(++starts>MAX_EMBEDDED_JSON_STARTS)break;try{return JSON.parse(value.slice(offset))}catch{continue}}}return}}function numberOrNull(value){return value===null?null:typeof value=="number"&&Number.isFinite(value)?value:void 0}function textFromContent(record){if(!record||!Array.isArray(record.content))return;const parts=record.content.flatMap(part=>isRecord(part)&&part.type==="text"&&typeof part.text=="string"?[part.text]:[]);return parts.length>0?parts.join(`\n`):void 0}function parsePiShellResult(value,depth=0){if(depth>4)return;let record;if(typeof value=="string"){const trimmed=value.trim();if(!trimmed.startsWith("{")||trimmed.length>MAX_FORMAT_CHARS)return;const parsed=parseEmbeddedJson(trimmed);record=isRecord(parsed)?parsed:void 0}else isRecord(value)&&(record=value);if(!record)return;const structured=isRecord(record.structuredContent)?record.structuredContent:void 0;if(structured){const nested=parsePiShellResult(structured,depth+1);if(nested)return nested}const inner=structured??record,exitCode=numberOrNull(inner.exit_code)??numberOrNull(inner.exitCode),truncated=typeof inner.truncated=="boolean"?inner.truncated:void 0,fullOutputPath=stringField(inner,"full_output_path")??stringField(inner,"fullOutputPath");if(!(exitCode!==void 0||truncated!==void 0||fullOutputPath!==void 0||"exit_code"in inner||"exitCode"in inner))return;const output=stringField(inner,"output")??textFromContent(inner)??textFromContent(record);return{...output!==void 0?{output}:{},...exitCode!==void 0?{exitCode}:{},...truncated!==void 0?{truncated}:{},...fullOutputPath!==void 0?{fullOutputPath}:{}}}function shellDetailFromResult(detail){const parsed=parsePiShellResult(detail.output);if(!parsed)return detail;const keepExitCode=detail.exitCode!==void 0&&detail.exitCode!==null?{exitCode:detail.exitCode}:parsed.exitCode!==void 0?{exitCode:parsed.exitCode}:{};return{...detail,...parsed.output!==void 0?{output:parsed.output}:{},...keepExitCode,...parsed.truncated!==void 0?{truncated:parsed.truncated}:{},...parsed.fullOutputPath!==void 0?{fullOutputPath:parsed.fullOutputPath}:{}}}function unwrapProviderOutput(value){return isRecord(value)&&Object.keys(value).length===1&&"output"in value?value.output:value}function normalizeToolCallDetail(detail,name){if(detail.type==="shell")return shellDetailFromResult(detail);if(detail.type!=="unknown")return detail;const providerOutput=unwrapProviderOutput(detail.output);providerOutput!==detail.output&&(detail={...detail,output:providerOutput});const input=decodeToolInput(detail.input);if(name&&normalizePiToolName(name)==="read"){const filePath=stringField(input,"path");if(!filePath||!input)return detail;const{offset,limit}=input;if(offset!=null&&(typeof offset!="number"||!Number.isFinite(offset))||limit!=null&&(typeof limit!="number"||!Number.isFinite(limit)))return detail;const content=extractPiToolText(detail.output)?.text;return{type:"read",filePath,...content!==void 0?{content}:{},...typeof offset=="number"?{offset}:{},...typeof limit=="number"?{limit}:{}}}const result=parsePiShellResult(detail.output),command=stringField(input,"command")??stringField(input,"cmd")??stringField(input,"script")??(result&&name?prettyToolName(name):void 0);if(!command)return detail;const output=result?.output??extractPiToolText(detail.output)?.text;return!result&&output===void 0?detail:{type:"shell",command,...output!==void 0?{output}:{},...result?.exitCode!==void 0?{exitCode:result.exitCode}:{},...result?.truncated!==void 0?{truncated:result.truncated}:{},...result?.fullOutputPath!==void 0?{fullOutputPath:result.fullOutputPath}:{}}}var MAX_FORMAT_CHARS=1e5;function parseJsonString(value){try{return JSON.parse(value)}catch{return value}}function applyPatchInput(value){if(typeof value=="string"){const parsed=parseJsonString(value);return parsed===value?value:applyPatchInput(parsed)}if(isRecord(value)){if(value.input!==void 0){const nestedInput=applyPatchInput(value.input);if(nestedInput)return nestedInput}for(const key of["input","patch","patchText"])if(typeof value[key]=="string")return value[key]}}function applyPatchToolName(name){const normalized=name.trim().toLowerCase().replace(/^(?:functions|tools)\\./,"").replace(/^mcp__.*?__/,"").replace(/^mcp_/,"");return normalized==="apply_patch"||normalized==="apply-patch"||normalized==="patch"}function patchInputEdits(input){const lines=input.replace(/\\r\\n?/g,`\n`).split(`\n`),edits=[];let index=0;for(;index<lines.length;){const header=lines[index]?.match(/^\\*\\*\\* (Add|Delete|Update) File: (.+)$/);if(!header?.[1]||!header[2]){index++;continue}const operation=header[1].toLowerCase(),filePath=header[2];index++;const diffLines=[];let moveTo;for(;index<lines.length&&!lines[index]?.match(/^\\*\\*\\* (?:Add|Delete|Update) File: /);){const line=lines[index]??"",move=line.match(/^\\*\\*\\* Move to: (.+)$/);move?.[1]?moveTo=move[1].trim():operation==="add"&&line.startsWith("+")?diffLines.push(`+${line.slice(1)}`):operation==="update"&&(line.startsWith("@@")||line.startsWith("+")||line.startsWith("-")||line.startsWith(" "))&&diffLines.push(line),index++}edits.push({filePath:moveTo??filePath,operation,unifiedDiff:diffLines.join(`\n`)})}return edits}function isDiffFileHeader(line,index,firstHunk){return(line.startsWith("---")||line.startsWith("+++"))&&(firstHunk===-1||index<firstHunk)}function unifiedDiffBody(diff){const lines=diff.replace(/\\r\\n?/g,`\n`).split(`\n`),firstHunk=lines.findIndex(line=>line.startsWith("@@"));return lines.filter((line,index)=>!isDiffFileHeader(line,index,firstHunk)).filter(line=>line.startsWith("@@")||line.startsWith("+")||line.startsWith("-")||line.startsWith(" ")).join(`\n`)}function unifiedDiffEdits(unifiedDiff,firstFilePath){const sections=unifiedDiff.replace(/\\r\\n?/g,`\n`).split(/(?=^diff --git )/m).filter(section=>section.trim()),edits=[];for(const[index,section]of sections.entries()){const plusHeader=section.match(/^\\+\\+\\+ (?:b\\/)?(.+)$/m)?.[1],minusHeader=section.match(/^--- (?:a\\/)?(.+)$/m)?.[1],operation=plusHeader==="/dev/null"?"delete":minusHeader==="/dev/null"?"add":"update",filePath=index===0&&firstFilePath?firstFilePath:operation==="delete"?minusHeader:plusHeader??minusHeader;!filePath||filePath==="/dev/null"||edits.push({filePath,operation,unifiedDiff:unifiedDiffBody(section)})}return edits}function normalizePatchOperation(value){switch(value){case"add":case"added":return"add";case"delete":case"deleted":return"delete";case"update":case"updated":case"modify":case"modified":return"update";default:return}}function patchMetadataEdits(value){if(!isRecord(value))return[];for(const candidate of[value,value.metadata,value.details,value.result]){if(!isRecord(candidate)||!Array.isArray(candidate.files))continue;const edits=candidate.files.flatMap(file=>{if(!isRecord(file))return[];const filePath=typeof file.file=="string"?file.file:typeof file.relativePath=="string"?file.relativePath:typeof file.filePath=="string"?file.filePath:void 0,operation=normalizePatchOperation(file.status)??normalizePatchOperation(file.type);if(!filePath||!operation)return[];const diff=typeof file.patch=="string"?file.patch:typeof file.diff=="string"?file.diff:void 0;return diff===void 0?[]:[{filePath,operation,unifiedDiff:unifiedDiffBody(diff)}]});if(edits.length>0)return edits}return[]}function previewDiffToUnifiedDiff(diff){return diff.replace(/\\r\\n?/g,`\n`).split(`\n`).filter((line,index,lines)=>!(index===lines.length-1&&line==="")).map(line=>{const match=line.match(/^([+\\- ])\\s*\\d+\\s(.*)$/);return match?.[1]&&match[2]!==void 0?`${match[1]}${match[2]}`:line}).join(`\n`)}function patchPreviewEdits(value){if(!isRecord(value))return[];const nested=[value,value.details,value.result].find(candidate=>isRecord(candidate)?isRecord(candidate.preview)||isRecord(candidate.details)&&isRecord(candidate.details.preview):!1);if(!isRecord(nested))return[];const details=isRecord(nested.details)?nested.details:nested,preview=isRecord(details.preview)?details.preview:void 0,files=preview&&Array.isArray(preview.files)?preview.files:void 0;return files?files.flatMap(file=>{if(!isRecord(file)||typeof file.filePath!="string")return[];const operation=file.operation;return operation!=="add"&&operation!=="delete"&&operation!=="update"?[]:[{filePath:file.filePath,operation,unifiedDiff:typeof file.diff=="string"?previewDiffToUnifiedDiff(file.diff):""}]}):[]}function extractApplyPatchEdits(input,output,metadata){const metadataEdits=patchMetadataEdits(metadata);if(metadataEdits.length>0)return metadataEdits;const outputEdits=patchPreviewEdits(output);if(outputEdits.length>0)return outputEdits;if(isRecord(input)&&input.type==="edit"&&typeof input.unifiedDiff=="string")return unifiedDiffEdits(input.unifiedDiff,typeof input.filePath=="string"?input.filePath:void 0);const inputText=applyPatchInput(input);if(inputText){const parsed=patchInputEdits(inputText);if(parsed.length>0)return parsed;if(inputText.includes("diff --git "))return unifiedDiffEdits(inputText)}return typeof output=="string"&&output.includes("diff --git ")?unifiedDiffEdits(output):[]}function isApplyPatchTool(toolName){return applyPatchToolName(toolName)}function stripLeadingCwdCd(command,cwd){if(!cwd||!command)return command;const match=command.match(/^\\s*cd\\s+(?:"((?:[^"\\\\]|\\\\.)*)"|\'((?:[^\'\\\\]|\\\\.)*)\'|(\\S+))\\s*(?:&&|;)\\s*([\\s\\S]*)$/);if(!match)return command;const rawTarget=match[1]??match[2]??match[3]??"",normalizedTarget=trimTrailingSlashes(rawTarget.replace(/\\\\/g,"/")),normalizedCwd=trimTrailingSlashes(cwd.replace(/\\\\/g,"/"));if(!normalizedTarget||normalizedTarget!==normalizedCwd)return command;const rest=(match[4]??"").trim();return rest||command}function changePath(path,cwd){let relative=path.trim();const root=cwd?cwd.trim().replace(/\\/+$/,""):"";for(root&&relative.startsWith(`${root}/`)&&(relative=relative.slice(root.length+1));relative.startsWith("./");)relative=relative.slice(2);return relative}function fileId(path,cwd){return hashText(changePath(path,cwd))}function commandHead(command){const text=command.trim(),end=text.indexOf(`\n`);return(end<0?text:text.slice(0,end)).trim()}var import_react_native3=require("@getpaseo/plugin/client/react-native"),import_react3=require("react"),import_react_native4=require("react-native");function diffBlocks(added,removed,size=5){const plus=Number.isFinite(added)&&added>0?Math.floor(added):0,minus=Number.isFinite(removed)&&removed>0?Math.floor(removed):0,total=plus+minus;let green=0,red=0;total>0&&total<=size?(green=plus,red=minus):total>size&&(green=Math.round(plus/total*size),plus>0&&green===0&&(green=1),minus>0&&green===size&&(green=size-1),red=minus>0?size-green:0);const blocks=[];for(let index=0;index<size;index++)blocks.push(index<green?"add":index<green+red?"remove":"none");return blocks}var import_react_native=require("@getpaseo/plugin/client/react-native"),import_react2=require("react"),import_react_native2=require("react-native"),import_jsx_runtime=require("react/jsx-runtime");addDefaults({kitUi,kitTime});var hairline=import_react_native2.Platform.OS==="web"?1:import_react_native2.StyleSheet.hairlineWidth;function luminance(color){const short=/^#([a-f\\d])([a-f\\d])([a-f\\d])$/i.exec(color),hex=short?short.slice(1).map(part=>part+part).join(""):/^#([a-f\\d]{6})(?:[a-f\\d]{2})?$/i.exec(color)?.[1];if(!hex)return null;const[r,g,b]=[0,2,4].map(offset=>{const channel=parseInt(hex.slice(offset,offset+2),16)/255;return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b}function contrast(a,b){const x=luminance(a),y=luminance(b);return x===null||y===null?21:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}var isDarkTheme=theme=>contrast(theme.colors.surface0,"#ffffff")>contrast(theme.colors.surface0,"#000000");function withAlpha(color,alpha){return/^#[0-9a-f]{6}$/i.test(color)?`${color}${Math.round(Math.min(1,Math.max(0,alpha))*255).toString(16).padStart(2,"0")}`:color}var palette={blue:["#3B82F6","#2563EB","#60A5FA","#60A5FA"],sky:["#0284C7","#0369A1","#38BDF8","#38BDF8"],cyan:["#0891B2","#0E7490","#22D3EE","#22D3EE"],teal:["#0D9488","#0F766E","#2DD4BF","#2DD4BF"],green:["#059669","#047857","#34D399","#34D399"],lime:["#65A30D","#4D7C0F","#A3E635","#A3E635"],amber:["#D97706","#B45309","#FBBF24","#FBBF24"],orange:["#EA580C","#C2410C","#FB923C","#FB923C"],red:["#F43F5E","#BE123C","#FB7185","#FB7185"],pink:["#EC4899","#BE185D","#F472B6","#F472B6"],fuchsia:["#D946EF","#A21CAF","#E879F9","#E879F9"],violet:["#8B5CF6","#7C3AED","#A78BFA","#A78BFA"],indigo:["#6366F1","#4F46E5","#818CF8","#818CF8"],gray:["#71717A","#52525B","#A1A1AA","#D4D4D8"]};function hue(theme,name,use="solid"){const[lightSolid,lightText,darkSolid,darkText]=palette[name],dark=isDarkTheme(theme),solid=dark?darkSolid:lightSolid;return use==="text"?dark?darkText:lightText:use==="soft"?withAlpha(solid,dark?.22:.13):use==="line"?withAlpha(solid,dark?.55:.4):solid}function vividSyntaxColors(theme){return{foreground:theme.colors.foreground,foregroundMuted:theme.colors.foregroundMuted,accent:hue(theme,"violet","text"),statusSuccess:hue(theme,"green","text"),statusWarning:hue(theme,"amber","text"),statusDanger:hue(theme,"red","text"),builtin:hue(theme,"orange","text"),keyword:hue(theme,"violet","text"),variable:hue(theme,"cyan","text"),operator:hue(theme,"sky","text"),parameter:hue(theme,"indigo","text"),constant:hue(theme,"lime","text"),heredoc:hue(theme,"teal","text")}}var import_jsx_runtime2=require("react/jsx-runtime");function Glyph({name,color,size=12}){return(0,import_jsx_runtime2.jsx)(import_react_native4.View,{style:{width:size,height:size,flexShrink:0,alignItems:"center",justifyContent:"center"},children:(0,import_jsx_runtime2.jsx)(import_react_native3.Icon,{name,size,color})})}function DiffBlocks({theme,added,removed,size=7}){const blocks=(0,import_react3.useMemo)(()=>diffBlocks(added,removed),[added,removed]),muted=theme.colors.foregroundMuted,rest=withAlpha(muted.startsWith("#")?muted:"#888888",isDarkTheme(theme)?.32:.26);return(0,import_jsx_runtime2.jsx)(import_react_native4.View,{accessibilityElementsHidden:!0,importantForAccessibility:"no-hide-descendants",style:{flexDirection:"row",gap:1.5,flexShrink:0},children:blocks.map((block,index)=>(0,import_jsx_runtime2.jsx)(import_react_native4.View,{style:{width:size,height:size,borderRadius:1.5,backgroundColor:block==="add"?hue(theme,"green"):block==="remove"?hue(theme,"red"):rest}},index))})}var import_react_native5=require("react-native"),UI_STACK=\'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif\',MONO_STACK=\'ui-monospace, "SF Mono", "Cascadia Code", "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace\',STYLE_ELEMENT_ID="colorful-activity-fonts",cuiTextEscape={dataSet:{cui:!0}},monoStack=MONO_STACK;function fontRules(mono){return[`[data-cui][data-cui], [data-cui][data-cui] * { font-family: ${UI_STACK}; }`,`[data-cmono][data-cmono], [data-cmono][data-cmono] * { font-family: ${mono}; }`].join(`\n`)}function setMonoFontStack(stack){const next=stack||MONO_STACK;if(next===monoStack||(monoStack=next,import_react_native5.Platform.OS!=="web"||typeof document>"u"))return;const node=document.getElementById(STYLE_ELEMENT_ID);node&&(node.textContent=fontRules(next))}var import_client2=require("@getpaseo/plugin/client"),import_react4=require("react"),import_react_native6=require("react-native");function useTypography(){const settings=(0,import_client2.useSettings)(activitySettings),values=settings.status==="ready"?settings.values:null,stack=values&&import_react_native6.Platform.OS==="web"?monoFontStack(values.monoFont):null,family=stack?`${stack}, ${MONO_STACK}`:void 0;return(0,import_react4.useEffect)(()=>{values&&setMonoFontStack(family)},[values,family]),values?typography(values.textSize,values.lineSpacing,family):DEFAULT_TYPOGRAPHY}var import_jsx_runtime3=require("react/jsx-runtime");function changedPath(item,file,cwd){if(!item)return null;if(isApplyPatchTool(item.name)){const edit=extractApplyPatchEdits(item.detail,item.detail.type==="unknown"?item.detail.output:void 0,item.metadata).find(each=>fileId(each.filePath,cwd)===file);if(edit)return changePath(edit.filePath,cwd)}const detail=normalizeToolCallDetail(item.detail,item.name);return detail.type==="edit"&&detail.filePath&&fileId(detail.filePath,cwd)===file?changePath(detail.filePath,cwd):null}function failedCommand(item,cwd){if(!item)return null;const detail=normalizeToolCallDetail(item.detail,item.name);return detail.type==="shell"&&detail.command?commandHead(stripLeadingCwdCd(detail.command,cwd)):null}function FoldChanges({theme,lineHeight,indent,cwd,files:fileCount,uncounted=0,changed,fails:failed,item}){const files=(0,import_react5.useMemo)(()=>changed.flatMap(change=>{const path=changedPath(item(change.key),change.file,cwd);if(!path)return[];const display=splitFileDisplay(path);return[{...change,dir:display.dir?truncateDirFront(display.dir):void 0,base:display.base}]}),[changed,cwd,item]),fails=(0,import_react5.useMemo)(()=>failed.flatMap(fail=>{const command=failedCommand(item(fail.key),cwd);return command?[{...fail,command}]:[]}),[cwd,failed,item]),type=useTypography(),more=Math.max(0,fileCount-files.length);if(files.length===0&&fails.length===0&&more===0&&uncounted===0)return null;const line={flexDirection:"row",alignItems:"center",gap:6,minHeight:lineHeight+2,minWidth:0},mono=typesetStyle({fontFamily:"monospace",fontSize:12,lineHeight},type),wrapOutput=useWrapLines("output"),number={fontSize:12,lineHeight,fontWeight:"700",fontVariant:["tabular-nums"],flexShrink:0};return(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:{marginLeft:indent,marginRight:6,marginTop:2,marginBottom:2,paddingVertical:4,paddingHorizontal:8,gap:1,borderRadius:8,backgroundColor:theme.colors.surface1,borderLeftWidth:2,borderLeftColor:hue(theme,"green","line")},children:[files.map(file=>(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:line,children:[(0,import_jsx_runtime3.jsx)(Glyph,{name:"FilePen",color:hue(theme,"green")}),(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:{flexDirection:"row",flexGrow:1,flexShrink:1,minWidth:0},children:[file.dir?(0,import_jsx_runtime3.jsxs)(import_react_native7.Text,{numberOfLines:1,style:[mono,{color:theme.colors.foregroundMuted,flexShrink:1}],children:[file.dir,"/"]}):null,(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{numberOfLines:1,style:[mono,{color:theme.colors.foreground,fontWeight:"600",flexShrink:0,maxWidth:"100%"}],children:file.base})]}),file.added>0?(0,import_jsx_runtime3.jsxs)(import_react_native7.Text,{style:[number,{color:hue(theme,"green","text")}],children:["+",file.added]}):null,file.removed>0?(0,import_jsx_runtime3.jsxs)(import_react_native7.Text,{style:[number,{color:hue(theme,"red","text")}],children:["\\u2212",file.removed]}):null,(0,import_jsx_runtime3.jsx)(DiffBlocks,{theme,added:file.added,removed:file.removed,size:6})]},file.file)),more>0?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{...cuiTextEscape,style:{color:theme.colors.foregroundMuted,fontSize:11,lineHeight},children:t2("fold.moreFiles",{count:more})}):null,uncounted>0?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{...cuiTextEscape,style:{color:theme.colors.foregroundMuted,fontSize:11,lineHeight},children:t2("fold.uncountedNote",{count:uncounted})}):null,fails.map(fail=>(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:[line,wrapOutput?{alignItems:"flex-start"}:null],children:[(0,import_jsx_runtime3.jsx)(Glyph,{name:"SquareTerminal",color:hue(theme,"red")}),(0,import_jsx_runtime3.jsxs)(import_react_native7.Text,{numberOfLines:wrapOutput?void 0:1,style:[mono,{color:theme.colors.foreground,flexGrow:1,flexShrink:1,minWidth:0}],children:["$ ",fail.command]}),(0,import_jsx_runtime3.jsx)(import_react_native7.View,{style:{height:18,paddingHorizontal:6,borderRadius:9,justifyContent:"center",backgroundColor:hue(theme,"red","soft"),flexShrink:0},children:(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{...cuiTextEscape,numberOfLines:1,style:{color:hue(theme,"red","text"),fontSize:11,fontWeight:"700"},children:fail.exit!==null?t2("modelText.exitCode",{code:fail.exit}):t2("modelRowStatus.failed")})})]},fail.key))]})}var import_react8=require("react"),import_react_native10=require("react-native"),SPARKLE_GLYPHS=["\\xB7","\\u2722","\\u2733\\uFE0E","\\u2736","\\u273B","\\u273D"],SPARKLE_SEQUENCE=[0,1,2,3,4,5,4,3,2,1],SPARKLE_FRAME_MS=120,SPARKLE_STILL=4,EDGE=1e-4;function sparkleStops(glyph,sequence=SPARKLE_SEQUENCE){const frames=sequence.length,stops=[];let previous=0;for(let frame=0;frame<frames;frame++){const on=sequence[frame]===glyph?1:0,at=frame/frames;frame===0?stops.push([0,on]):on!==previous&&stops.push([at-EDGE,previous],[at,on]),previous=on}return stops.push([1,previous]),stops}var SNAKE_ORDER=[0,1,2,5,4,3,6,7,8];function snakeShift(cell){const step=SNAKE_ORDER.indexOf(cell);return step<0?0:step/SNAKE_ORDER.length}var SNAKE_STOPS=[[0,1],[.22,.5],[.45,.16],[1,.16]],SNAKE_CYCLE_MS=1260;function matrixRing(cell){const row=Math.floor(cell/3),column=cell%3;return Math.abs(row-1)+Math.abs(column-1)}function matrixShift(cell){return matrixRing(cell)*.12}var MATRIX_OPACITY=[[0,.22],[.3,1],[.62,.3],[1,.22]],MATRIX_SCALE=[[0,.72],[.3,1.08],[.62,.8],[1,.72]],MATRIX_CYCLE_MS=1500,ORB_CORE_SCALE=[[0,.74],[.5,1],[1,.74]],ORB_CORE_OPACITY=[[0,.72],[.5,1],[1,.72]],ORB_HALO_SCALE=[[0,.9],[.5,1.7],[1,1.7]],ORB_HALO_OPACITY=[[0,.5],[.5,0],[1,0]],ORB_CYCLE_MS=2e3;function valueAt(stops,at){if(stops.length===0)return 0;const x=at-Math.floor(at);let before=stops[0];for(const stop of stops){if(stop[0]===x)return stop[1];if(stop[0]>x){const span=stop[0]-before[0];return span>0?before[1]+(x-before[0])/span*(stop[1]-before[1]):stop[1]}before=stop}return before[1]}function shiftStops(stops,shift){const offset=shift-Math.floor(shift);if(offset===0)return stops.map(stop=>[stop[0],stop[1]]);const keyed=stops.map((stop,index)=>({at:stop[0]>=1?offset:(stop[0]+offset)%1,value:stop[1],rank:stop[0]>=1?-1:index})),start=valueAt(stops,1-offset);keyed.push({at:0,value:start,rank:-2},{at:1,value:start,rank:Number.MAX_SAFE_INTEGER}),keyed.sort((left,right)=>left.at-right.at||left.rank-right.rank);const moved=keyed.map(entry=>[entry.at,entry.value]);return moved.filter((stop,index)=>index===0||stop[0]!==moved[index-1][0]||stop[1]!==moved[index-1][1])}function interpolation(stops){return{inputRange:stops.map(stop=>stop[0]),outputRange:stops.map(stop=>stop[1])}}function cssKeyframes(stops,property){const frames={};for(const[at,value]of stops)frames[`${Math.round(at*1e5)/1e3}%`]=property(value);return frames}function stillCells(kind){if(kind==="snake"){const lit=new Map([[5,1],[2,.6],[1,.35]]);return Array.from({length:9},(_,cell)=>lit.get(cell)??.16)}return Array.from({length:9},(_,cell)=>[1,.55,.28][matrixRing(cell)])}var import_react7=require("react"),import_react_native9=require("react-native"),import_react6=require("react"),import_react_native8=require("react-native"),isForeground=state=>state!=="background"&&state!=="inactive",current=isForeground(import_react_native8.AppState.currentState),listeners2=new Set,subscription;function subscribe(listener){return listeners2.add(listener),subscription||(current=isForeground(import_react_native8.AppState.currentState),subscription=import_react_native8.AppState.addEventListener("change",state=>{const next=isForeground(state);if(next!==current){current=next;for(const notify of listeners2)notify()}})),()=>{listeners2.delete(listener),listeners2.size||(subscription?.remove(),subscription=void 0)}}function useForeground(){return(0,import_react6.useSyncExternalStore)(subscribe,()=>current,()=>current)}var import_jsx_runtime4=require("react/jsx-runtime"),web=import_react_native9.Platform.OS==="web",easeOut=import_react_native9.Easing.out(import_react_native9.Easing.quad),easeSine=import_react_native9.Easing.inOut(import_react_native9.Easing.sin),easeCubic=import_react_native9.Easing.inOut(import_react_native9.Easing.cubic),loop={animationIterationCount:"infinite"},css=web?import_react_native9.StyleSheet.create({spin:{...loop,animationKeyframes:[{"0%":{transform:"rotate(0deg)"},"100%":{transform:"rotate(360deg)"}}],animationDuration:"0.9s",animationTimingFunction:"linear"},spinSlow:{...loop,animationKeyframes:[{"0%":{transform:"rotate(0deg)"},"100%":{transform:"rotate(360deg)"}}],animationDuration:"1.8s",animationTimingFunction:"linear"},ping:{...loop,animationKeyframes:[{"0%":{transform:"scale(1)",opacity:.6},"75%":{transform:"scale(2.3)",opacity:0},"100%":{transform:"scale(2.3)",opacity:0}}],animationDuration:"1.7s",animationTimingFunction:"cubic-bezier(0, 0, 0.2, 1)"},breathe:{...loop,animationKeyframes:[{"0%":{opacity:1},"50%":{opacity:.3},"100%":{opacity:1}}],animationDuration:"2.2s",animationTimingFunction:"ease-in-out"},slide:{...loop,animationKeyframes:[{"0%":{transform:"translateX(-100%)"},"100%":{transform:"translateX(340%)"}}],animationDuration:"1.6s",animationTimingFunction:"cubic-bezier(0.4, 0, 0.2, 1)"},flash:{animationKeyframes:[{"0%":{opacity:1},"100%":{opacity:0}}],animationDuration:"1.8s",animationTimingFunction:"ease-out",animationFillMode:"forwards"},pop:{animationKeyframes:[{"0%":{transform:"scale(1.5)"},"60%":{transform:"scale(0.92)"},"100%":{transform:"scale(1)"}}],animationDuration:"0.45s",animationTimingFunction:"ease-out"},enter:{animationKeyframes:[{"0%":{opacity:0,transform:"translateY(-8px)"},"100%":{opacity:1,transform:"translateY(0px)"}}],animationDuration:"0.4s",animationTimingFunction:"ease-out"},growY:{animationKeyframes:[{"0%":{transform:"scaleY(0)"},"100%":{transform:"scaleY(1)"}}],animationDuration:"0.55s",animationTimingFunction:"cubic-bezier(0.2, 0.8, 0.2, 1)",animationFillMode:"backwards"},growX:{animationKeyframes:[{"0%":{transform:"scaleX(0)"},"100%":{transform:"scaleX(1)"}}],animationDuration:"0.6s",animationTimingFunction:"cubic-bezier(0.2, 0.8, 0.2, 1)",animationFillMode:"backwards"},paused:{animationPlayState:"paused"}}):{},shared=import_react_native9.StyleSheet.create({overlay:{position:"absolute",top:0,right:0,bottom:0,left:0,pointerEvents:"none"}}),reduced=!1,reducedListeners=new Set,reducedSubscription;function subscribeReducedMotion(listener){if(reducedListeners.add(listener),!reducedSubscription){const publish=next=>{if(next!==reduced){reduced=next;for(const notify of reducedListeners)notify()}};reducedSubscription=import_react_native9.AccessibilityInfo.addEventListener?.("reduceMotionChanged",publish)??{},import_react_native9.AccessibilityInfo.isReduceMotionEnabled?.().then(publish).catch(()=>{})}return()=>{reducedListeners.delete(listener),reducedListeners.size||(reducedSubscription?.remove?.(),reducedSubscription=void 0)}}function useReducedMotion(){return(0,import_react7.useSyncExternalStore)(subscribeReducedMotion,()=>reduced,()=>reduced)}var import_jsx_runtime5=require("react/jsx-runtime"),web2=import_react_native10.Platform.OS==="web",easeSine2=import_react_native10.Easing.inOut(import_react_native10.Easing.sin),SPARKLE_CYCLE_MS=SPARKLE_SEQUENCE.length*SPARKLE_FRAME_MS;function together(left,right,frame){return cssKeyframes(left.map(([at],index)=>[at,index]),index=>frame(left[index][1],right[index][1]))}var loop2={animationIterationCount:"infinite"},css2=web2?import_react_native10.StyleSheet.create({...Object.fromEntries(SPARKLE_GLYPHS.map((_,glyph)=>[`sparkle${glyph}`,{...loop2,animationKeyframes:[cssKeyframes(sparkleStops(glyph),opacity=>({opacity}))],animationDuration:`${SPARKLE_CYCLE_MS}ms`,animationTimingFunction:"linear"}])),orbCore:{...loop2,animationKeyframes:[together(ORB_CORE_SCALE,ORB_CORE_OPACITY,(scale,opacity)=>({transform:`scale(${scale})`,opacity}))],animationDuration:`${ORB_CYCLE_MS}ms`,animationTimingFunction:"ease-in-out"},orbHalo:{...loop2,animationKeyframes:[together(ORB_HALO_SCALE,ORB_HALO_OPACITY,(scale,opacity)=>({transform:`scale(${scale})`,opacity}))],animationDuration:`${ORB_CYCLE_MS}ms`,animationTimingFunction:"ease-out"},snake:{...loop2,animationKeyframes:[cssKeyframes(SNAKE_STOPS,opacity=>({opacity}))],animationDuration:`${SNAKE_CYCLE_MS}ms`,animationTimingFunction:"linear"},matrix:{...loop2,animationKeyframes:[together(MATRIX_OPACITY,MATRIX_SCALE,(opacity,scale)=>({opacity,transform:`scale(${scale})`}))],animationDuration:`${MATRIX_CYCLE_MS}ms`,animationTimingFunction:"ease-in-out"},paused:{animationPlayState:"paused"}}):{},hidden={accessibilityElementsHidden:!0,importantForAccessibility:"no-hide-descendants"};function useLoopState(){const foreground=useForeground();return useReducedMotion()?"static":foreground?"run":"paused"}function useNativeLoop(state,duration,easing=import_react_native10.Easing.linear){const value=(0,import_react8.useRef)(new import_react_native10.Animated.Value(0)).current;return(0,import_react8.useEffect)(()=>{if(web2||state!=="run"){!web2&&state==="static"&&value.setValue(0);return}const animation=import_react_native10.Animated.loop(import_react_native10.Animated.timing(value,{toValue:1,duration,easing,useNativeDriver:!0,isInteraction:!1}));return animation.start(),()=>animation.stop()},[state,duration,easing,value]),value}var center={position:"absolute",top:0,left:0,right:0,bottom:0,alignItems:"center",justifyContent:"center"};function Sparkle({size,color,state}){const value=useNativeLoop(state,SPARKLE_CYCLE_MS),opacities=(0,import_react8.useMemo)(()=>SPARKLE_GLYPHS.map((_,glyph)=>value.interpolate(interpolation(sparkleStops(glyph)))),[value]),text={color,fontSize:Math.round(size*.92),lineHeight:size,fontWeight:"700",textAlign:"center",includeFontPadding:!1};return(0,import_jsx_runtime5.jsx)(import_react_native10.View,{...hidden,style:{width:size,height:size},children:state==="static"?(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:center,children:(0,import_jsx_runtime5.jsx)(import_react_native10.Text,{style:text,children:SPARKLE_GLYPHS[SPARKLE_STILL]})}):SPARKLE_GLYPHS.map((glyph,index)=>web2?(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:[center,css2[`sparkle${index}`],state==="paused"?css2.paused:null],children:(0,import_jsx_runtime5.jsx)(import_react_native10.Text,{style:text,children:glyph})},glyph):(0,import_jsx_runtime5.jsx)(import_react_native10.Animated.View,{style:[center,{opacity:opacities[index]}],children:(0,import_jsx_runtime5.jsx)(import_react_native10.Text,{style:text,children:glyph})},glyph))})}function Orb({size,color,state}){const value=useNativeLoop(state,ORB_CYCLE_MS,easeSine2),diameter=Math.max(6,Math.round(size*.58)),ball={width:diameter,height:diameter,borderRadius:diameter/2,backgroundColor:color},glow={...ball,position:"absolute"},animated=(0,import_react8.useMemo)(()=>({core:{opacity:value.interpolate(interpolation(ORB_CORE_OPACITY)),transform:[{scale:value.interpolate(interpolation(ORB_CORE_SCALE))}]},halo:{opacity:value.interpolate(interpolation(ORB_HALO_OPACITY)),transform:[{scale:value.interpolate(interpolation(ORB_HALO_SCALE))}]}}),[value]);return(0,import_jsx_runtime5.jsx)(import_react_native10.View,{...hidden,style:{width:size,height:size,alignItems:"center",justifyContent:"center"},children:state==="static"?(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:[ball,{shadowColor:color,shadowOpacity:.6,shadowRadius:3,shadowOffset:{width:0,height:0}}]}):web2?(0,import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment,{children:[(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:[glow,css2.orbHalo,state==="paused"?css2.paused:null]}),(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:[ball,css2.orbCore,state==="paused"?css2.paused:null]})]}):(0,import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment,{children:[(0,import_jsx_runtime5.jsx)(import_react_native10.Animated.View,{style:[glow,animated.halo]}),(0,import_jsx_runtime5.jsx)(import_react_native10.Animated.View,{style:[ball,animated.core]})]})})}function DotGrid({kind,size,color,state}){const cycle=kind==="snake"?SNAKE_CYCLE_MS:MATRIX_CYCLE_MS,value=useNativeLoop(state,cycle,kind==="snake"?import_react_native10.Easing.linear:easeSine2),dot=Math.max(2,Math.round(size*.19)),gap=(size-dot*3)/4,cells=(0,import_react8.useMemo)(()=>Array.from({length:9},(_,cell)=>{const shift=kind==="snake"?snakeShift(cell):matrixShift(cell);return{cell,shift,opacity:value.interpolate(interpolation(shiftStops(kind==="snake"?SNAKE_STOPS:MATRIX_OPACITY,shift))),scale:kind==="matrix"?value.interpolate(interpolation(shiftStops(MATRIX_SCALE,shift))):null}}),[kind,value]),still=(0,import_react8.useMemo)(()=>stillCells(kind),[kind]);return(0,import_jsx_runtime5.jsx)(import_react_native10.View,{...hidden,style:{width:size,height:size},children:cells.map(({cell,shift,opacity,scale})=>{const place={position:"absolute",width:dot,height:dot,borderRadius:dot/2,backgroundColor:color,left:gap+cell%3*(dot+gap),top:gap+Math.floor(cell/3)*(dot+gap)};return state==="static"?(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:[place,{opacity:still[cell]}]},cell):web2?(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:[place,kind==="snake"?css2.snake:css2.matrix,{animationDelay:`-${Math.round(shift*cycle)}ms`},state==="paused"?css2.paused:null]},cell):(0,import_jsx_runtime5.jsx)(import_react_native10.Animated.View,{style:[place,{opacity,...scale?{transform:[{scale}]}:{}}]},cell)})})}function LoaderFrame({kind,size,color,state}){return kind==="sparkle"?(0,import_jsx_runtime5.jsx)(Sparkle,{size,color,state}):kind==="orb"?(0,import_jsx_runtime5.jsx)(Orb,{size,color,state}):(0,import_jsx_runtime5.jsx)(DotGrid,{kind,size,color,state})}function RunningLoader({kind,size,color}){return(0,import_jsx_runtime5.jsx)(LoaderFrame,{kind,size,color,state:useLoopState()})}var import_react_native11=require("react-native"),import_prism_core_min=__toESM(require_prism_core_min(),1);Prism.languages.markup={comment:{pattern:/<!--(?:(?!<!--)[\\s\\S])*?-->/,greedy:!0},prolog:{pattern:/<\\?[\\s\\S]+?\\?>/,greedy:!0},doctype:{pattern:/<!DOCTYPE(?:[^>"\'[\\]]|"[^"]*"|\'[^\']*\')+(?:\\[(?:[^<"\'\\]]|"[^"]*"|\'[^\']*\'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\\]\\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(^[^\\[]*\\[)[\\s\\S]+(?=\\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|\'[^\']*\'/,greedy:!0},punctuation:/^<!|>$|[[\\]]/,"doctype-tag":/^DOCTYPE/i,name:/[^\\s<>\'"]+/}},cdata:{pattern:/<!\\[CDATA\\[[\\s\\S]*?\\]\\]>/i,greedy:!0},tag:{pattern:/<\\/?(?!\\d)[^\\s>\\/=$<%]+(?:\\s(?:\\s*[^\\s>\\/=]+(?:\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s\'">=]+(?=[\\s>]))|(?=[\\s/>])))+)?\\s*\\/?>/,greedy:!0,inside:{tag:{pattern:/^<\\/?[^\\s>\\/]+/,inside:{punctuation:/^<\\/?/,namespace:/^[^\\s>\\/:]+:/}},"special-attr":[],"attr-value":{pattern:/=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s\'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},{pattern:/^(\\s*)["\']|["\']$/,lookbehind:!0}]}},punctuation:/\\/?>/,"attr-name":{pattern:/[^\\s>\\/]+/,inside:{namespace:/^[^\\s>\\/:]+:/}}}},entity:[{pattern:/&[\\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\\da-f]{1,8};/i]},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.languages.markup.doctype.inside["internal-subset"].inside=Prism.languages.markup,Prism.hooks.add("wrap",(function(a){a.type==="entity"&&(a.attributes.title=a.content.replace(/&amp;/,"&"))})),Object.defineProperty(Prism.languages.markup.tag,"addInlined",{value:function(a,e){var s={};s["language-"+e]={pattern:/(^<!\\[CDATA\\[)[\\s\\S]+?(?=\\]\\]>$)/i,lookbehind:!0,inside:Prism.languages[e]},s.cdata=/^<!\\[CDATA\\[|\\]\\]>$/i;var t3={"included-cdata":{pattern:/<!\\[CDATA\\[[\\s\\S]*?\\]\\]>/i,inside:s}};t3["language-"+e]={pattern:/[\\s\\S]+/,inside:Prism.languages[e]};var n={};n[a]={pattern:RegExp("(<__[^>]*>)(?:<!\\\\[CDATA\\\\[(?:[^\\\\]]|\\\\](?!\\\\]>))*\\\\]\\\\]>|(?!<!\\\\[CDATA\\\\[)[^])*?(?=</__>)".replace(/__/g,(function(){return a})),"i"),lookbehind:!0,greedy:!0,inside:t3},Prism.languages.insertBefore("markup","cdata",n)}}),Object.defineProperty(Prism.languages.markup.tag,"addAttribute",{value:function(a,e){Prism.languages.markup.tag.inside["special-attr"].push({pattern:RegExp(`(^|["\'\\\\s])(?:`+a+`)\\\\s*=\\\\s*(?:"[^"]*"|\'[^\']*\'|[^\\\\s\'">=]+(?=[\\\\s>]))`,"i"),lookbehind:!0,inside:{"attr-name":/^[^\\s=]+/,"attr-value":{pattern:/=[\\s\\S]+/,inside:{value:{pattern:/(^=\\s*(["\']|(?!["\'])))\\S[\\s\\S]*(?=\\2$)/,lookbehind:!0,alias:[e,"language-"+e],inside:Prism.languages[e]},punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|\'/]}}}})}}),Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup,Prism.languages.xml=Prism.languages.extend("markup",{}),Prism.languages.ssml=Prism.languages.xml,Prism.languages.atom=Prism.languages.xml,Prism.languages.rss=Prism.languages.xml,(function(s){var e=/(?:"(?:\\\\(?:\\r\\n|[\\s\\S])|[^"\\\\\\r\\n])*"|\'(?:\\\\(?:\\r\\n|[\\s\\S])|[^\'\\\\\\r\\n])*\')/;s.languages.css={comment:/\\/\\*[\\s\\S]*?\\*\\//,atrule:{pattern:RegExp(`@[\\\\w-](?:[^;{\\\\s"\']|\\\\s+(?!\\\\s)|`+e.source+")*?(?:;|(?=\\\\s*\\\\{))"),inside:{rule:/^@[\\w-]+/,"selector-function-argument":{pattern:/(\\bselector\\s*\\(\\s*(?![\\s)]))(?:[^()\\s]|\\s+(?![\\s)])|\\((?:[^()]|\\([^()]*\\))*\\))+(?=\\s*\\))/,lookbehind:!0,alias:"selector"},keyword:{pattern:/(^|[^\\w-])(?:and|not|only|or)(?![\\w-])/,lookbehind:!0}}},url:{pattern:RegExp("\\\\burl\\\\((?:"+e.source+`|(?:[^\\\\\\\\\\r\n()"\']|\\\\\\\\[^])*)\\\\)`,"i"),greedy:!0,inside:{function:/^url/i,punctuation:/^\\(|\\)$/,string:{pattern:RegExp("^"+e.source+"$"),alias:"url"}}},selector:{pattern:RegExp(`(^|[{}\\\\s])[^{}\\\\s](?:[^{};"\'\\\\s]|\\\\s+(?![\\\\s{])|`+e.source+")*(?=\\\\s*\\\\{)"),lookbehind:!0},string:{pattern:e,greedy:!0},property:{pattern:/(^|[^-\\w\\xA0-\\uFFFF])(?!\\s)[-_a-z\\xA0-\\uFFFF](?:(?!\\s)[-\\w\\xA0-\\uFFFF])*(?=\\s*:)/i,lookbehind:!0},important:/!important\\b/i,function:{pattern:/(^|[^-a-z0-9])[-a-z0-9]+(?=\\()/i,lookbehind:!0},punctuation:/[(){};:,]/},s.languages.css.atrule.inside.rest=s.languages.css;var t3=s.languages.markup;t3&&(t3.tag.addInlined("style","css"),t3.tag.addAttribute("style","css"))})(Prism),Prism.languages.clike={comment:[{pattern:/(^|[^\\\\])\\/\\*[\\s\\S]*?(?:\\*\\/|$)/,lookbehind:!0,greedy:!0},{pattern:/(^|[^\\\\:])\\/\\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["\'])(?:\\\\(?:\\r\\n|[\\s\\S])|(?!\\1)[^\\\\\\r\\n])*\\1/,greedy:!0},"class-name":{pattern:/(\\b(?:class|extends|implements|instanceof|interface|new|trait)\\s+|\\bcatch\\s+\\()[\\w.\\\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\\\]/}},keyword:/\\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\\b/,boolean:/\\b(?:false|true)\\b/,function:/\\b\\w+(?=\\()/,number:/\\b0x[\\da-f]+\\b|(?:\\b\\d+(?:\\.\\d*)?|\\B\\.\\d+)(?:e[+-]?\\d+)?/i,operator:/[<>]=?|[!=]=?=?|--?|\\+\\+?|&&?|\\|\\|?|[?*/~^%]/,punctuation:/[{}[\\];(),.:]/},Prism.languages.javascript=Prism.languages.extend("clike",{"class-name":[Prism.languages.clike["class-name"],{pattern:/(^|[^$\\w\\xA0-\\uFFFF])(?!\\s)[_$A-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\.(?:constructor|prototype))/,lookbehind:!0}],keyword:[{pattern:/((?:^|\\})\\s*)catch\\b/,lookbehind:!0},{pattern:/(^|[^.]|\\.\\.\\.\\s*)\\b(?:as|assert(?=\\s*\\{)|async(?=\\s*(?:function\\b|\\(|[$\\w\\xA0-\\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\\s*(?:\\{|$))|for|from(?=\\s*(?:[\'"]|$))|function|(?:get|set)(?=\\s*(?:[#\\[$\\w\\xA0-\\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\\b/,lookbehind:!0}],function:/#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*(?:\\.\\s*(?:apply|bind|call)\\s*)?\\()/,number:{pattern:RegExp("(^|[^\\\\w$])(?:NaN|Infinity|0[bB][01]+(?:_[01]+)*n?|0[oO][0-7]+(?:_[0-7]+)*n?|0[xX][\\\\dA-Fa-f]+(?:_[\\\\dA-Fa-f]+)*n?|\\\\d+(?:_\\\\d+)*n|(?:\\\\d+(?:_\\\\d+)*(?:\\\\.(?:\\\\d+(?:_\\\\d+)*)?)?|\\\\.\\\\d+(?:_\\\\d+)*)(?:[Ee][+-]?\\\\d+(?:_\\\\d+)*)?)(?![\\\\w$])"),lookbehind:!0},operator:/--|\\+\\+|\\*\\*=?|=>|&&=?|\\|\\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\\.{3}|\\?\\?=?|\\?\\.?|[~:]/}),Prism.languages.javascript["class-name"][0].pattern=/(\\b(?:class|extends|implements|instanceof|interface|new)\\s+)[\\w.\\\\]+/,Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:RegExp(`((?:^|[^$\\\\w\\\\xA0-\\\\uFFFF."\'\\\\])\\\\s]|\\\\b(?:return|yield))\\\\s*)/(?:(?:\\\\[(?:[^\\\\]\\\\\\\\\\r\n]|\\\\\\\\.)*\\\\]|\\\\\\\\.|[^/\\\\\\\\\\\\[\\r\n])+/[dgimyus]{0,7}|(?:\\\\[(?:[^[\\\\]\\\\\\\\\\r\n]|\\\\\\\\.|\\\\[(?:[^[\\\\]\\\\\\\\\\r\n]|\\\\\\\\.|\\\\[(?:[^[\\\\]\\\\\\\\\\r\n]|\\\\\\\\.)*\\\\])*\\\\])*\\\\]|\\\\\\\\.|[^/\\\\\\\\\\\\[\\r\n])+/[dgimyus]{0,7}v[dgimyus]{0,7})(?=(?:\\\\s|/\\\\*(?:[^*]|\\\\*(?!/))*\\\\*/)*(?:$|[\\r\n,.;:})\\\\]]|//))`),lookbehind:!0,greedy:!0,inside:{"regex-source":{pattern:/^(\\/)[\\s\\S]+(?=\\/[a-z]*$)/,lookbehind:!0,alias:"language-regex",inside:Prism.languages.regex},"regex-delimiter":/^\\/|\\/$/,"regex-flags":/^[a-z]+$/}},"function-variable":{pattern:/#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*[=:]\\s*(?:async\\s*)?(?:\\bfunction\\b|(?:\\((?:[^()]|\\([^()]*\\))*\\)|(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*)\\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\\s+(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*)?\\s*\\(\\s*)(?!\\s)(?:[^()\\s]|\\s+(?![\\s)])|\\([^()]*\\))+(?=\\s*\\))/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(^|[^$\\w\\xA0-\\uFFFF])(?!\\s)[_$a-z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*=>)/i,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(\\(\\s*)(?!\\s)(?:[^()\\s]|\\s+(?![\\s)])|\\([^()]*\\))+(?=\\s*\\)\\s*=>)/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/((?:\\b|\\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\\w\\xA0-\\uFFFF]))(?:(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*\\s*)\\(\\s*|\\]\\s*\\(\\s*)(?!\\s)(?:[^()\\s]|\\s+(?![\\s)])|\\([^()]*\\))+(?=\\s*\\)\\s*\\{)/,lookbehind:!0,inside:Prism.languages.javascript}],constant:/\\b[A-Z](?:[A-Z_]|\\dx?)*\\b/}),Prism.languages.insertBefore("javascript","string",{hashbang:{pattern:/^#!.*/,greedy:!0,alias:"comment"},"template-string":{pattern:/`(?:\\\\[\\s\\S]|\\$\\{(?:[^{}]|\\{(?:[^{}]|\\{[^}]*\\})*\\})+\\}|(?!\\$\\{)[^\\\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\\\])(?:\\\\{2})*)\\$\\{(?:[^{}]|\\{(?:[^{}]|\\{[^}]*\\})*\\})+\\}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\\$\\{|\\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\\s\\S]+/}},"string-property":{pattern:/((?:^|[,{])[ \\t]*)(["\'])(?:\\\\(?:\\r\\n|[\\s\\S])|(?!\\2)[^\\\\\\r\\n])*\\2(?=\\s*:)/m,lookbehind:!0,greedy:!0,alias:"property"}}),Prism.languages.insertBefore("javascript","operator",{"literal-property":{pattern:/((?:^|[,{])[ \\t]*)(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*:)/m,lookbehind:!0,alias:"property"}}),Prism.languages.markup&&(Prism.languages.markup.tag.addInlined("script","javascript"),Prism.languages.markup.tag.addAttribute("on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)","javascript")),Prism.languages.js=Prism.languages.javascript,(function(e){e.languages.typescript=e.languages.extend("javascript",{"class-name":{pattern:/(\\b(?:class|extends|implements|instanceof|interface|new|type)\\s+)(?!keyof\\b)(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?:\\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,lookbehind:!0,greedy:!0,inside:null},builtin:/\\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\\b/}),e.languages.typescript.keyword.push(/\\b(?:abstract|declare|is|keyof|readonly|require)\\b/,/\\b(?:asserts|infer|interface|module|namespace|type)\\b(?=\\s*(?:[{_$a-zA-Z\\xA0-\\uFFFF]|$))/,/\\btype\\b(?=\\s*(?:[\\{*]|$))/),delete e.languages.typescript.parameter,delete e.languages.typescript["literal-property"];var s=e.languages.extend("typescript",{});delete s["class-name"],e.languages.typescript["class-name"].inside=s,e.languages.insertBefore("typescript","function",{decorator:{pattern:/@[$\\w\\xA0-\\uFFFF]+/,inside:{at:{pattern:/^@/,alias:"operator"},function:/^[\\s\\S]+/}},"generic-function":{pattern:/#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*\\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\\s*\\()/,greedy:!0,inside:{function:/^#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*/,generic:{pattern:/<[\\s\\S]+/,alias:"class-name",inside:s}}}}),e.languages.ts=e.languages.typescript})(Prism),(function(t3){var n=t3.util.clone(t3.languages.javascript),e="(?:\\\\{<S>*\\\\.{3}(?:[^{}]|<BRACES>)*\\\\})";function a(t4,n2){return t4=t4.replace(/<S>/g,(function(){return"(?:\\\\s|//.*(?!.)|/\\\\*(?:[^*]|\\\\*(?!/))\\\\*/)"})).replace(/<BRACES>/g,(function(){return"(?:\\\\{(?:\\\\{(?:\\\\{[^{}]*\\\\}|[^{}])*\\\\}|[^{}])*\\\\})"})).replace(/<SPREAD>/g,(function(){return e})),RegExp(t4,n2)}e=a(e).source,t3.languages.jsx=t3.languages.extend("markup",n),t3.languages.jsx.tag.pattern=a(`</?(?:[\\\\w.:-]+(?:<S>+(?:[\\\\w.:$-]+(?:=(?:"(?:\\\\\\\\[^]|[^\\\\\\\\"])*"|\'(?:\\\\\\\\[^]|[^\\\\\\\\\'])*\'|[^\\\\s{\'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*/?)?>`),t3.languages.jsx.tag.inside.tag.pattern=/^<\\/?[^\\s>\\/]*/,t3.languages.jsx.tag.inside["attr-value"].pattern=/=(?!\\{)(?:"(?:\\\\[\\s\\S]|[^\\\\"])*"|\'(?:\\\\[\\s\\S]|[^\\\\\'])*\'|[^\\s\'">]+)/,t3.languages.jsx.tag.inside.tag.inside["class-name"]=/^[A-Z]\\w*(?:\\.[A-Z]\\w*)*$/,t3.languages.jsx.tag.inside.comment=n.comment,t3.languages.insertBefore("inside","attr-name",{spread:{pattern:a("<SPREAD>"),inside:t3.languages.jsx}},t3.languages.jsx.tag),t3.languages.insertBefore("inside","special-attr",{script:{pattern:a("=<BRACES>"),alias:"language-javascript",inside:{"script-punctuation":{pattern:/^=(?=\\{)/,alias:"punctuation"},rest:t3.languages.jsx}}},t3.languages.jsx.tag);var s=function(t4){return t4?typeof t4=="string"?t4:typeof t4.content=="string"?t4.content:t4.content.map(s).join(""):""},g=function(n2){for(var e2=[],a2=0;a2<n2.length;a2++){var o=n2[a2],i=!1;if(typeof o!="string"&&(o.type==="tag"&&o.content[0]&&o.content[0].type==="tag"?o.content[0].content[0].content==="</"?e2.length>0&&e2[e2.length-1].tagName===s(o.content[0].content[1])&&e2.pop():o.content[o.content.length-1].content==="/>"||e2.push({tagName:s(o.content[0].content[1]),openedBraces:0}):e2.length>0&&o.type==="punctuation"&&o.content==="{"?e2[e2.length-1].openedBraces++:e2.length>0&&e2[e2.length-1].openedBraces>0&&o.type==="punctuation"&&o.content==="}"?e2[e2.length-1].openedBraces--:i=!0),(i||typeof o=="string")&&e2.length>0&&e2[e2.length-1].openedBraces===0){var r=s(o);a2<n2.length-1&&(typeof n2[a2+1]=="string"||n2[a2+1].type==="plain-text")&&(r+=s(n2[a2+1]),n2.splice(a2+1,1)),a2>0&&(typeof n2[a2-1]=="string"||n2[a2-1].type==="plain-text")&&(r=s(n2[a2-1])+r,n2.splice(a2-1,1),a2--),n2[a2]=new t3.Token("plain-text",r,null,r)}o.content&&typeof o.content!="string"&&g(o.content)}};t3.hooks.add("after-tokenize",(function(t4){t4.language!=="jsx"&&t4.language!=="tsx"||g(t4.tokens)}))})(Prism),(function(e){var a=e.util.clone(e.languages.typescript);e.languages.tsx=e.languages.extend("jsx",a),delete e.languages.tsx.parameter,delete e.languages.tsx["literal-property"];var t3=e.languages.tsx.tag;t3.pattern=RegExp("(^|[^\\\\w$]|(?=</))(?:"+t3.pattern.source+")",t3.pattern.flags),t3.lookbehind=!0})(Prism),Prism.languages.python={comment:{pattern:/(^|[^\\\\])#.*/,lookbehind:!0,greedy:!0},"string-interpolation":{pattern:/(?:f|fr|rf)(?:("""|\'\'\')[\\s\\S]*?\\1|("|\')(?:\\\\.|(?!\\2)[^\\\\\\r\\n])*\\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:\\{\\{)*)\\{(?!\\{)(?:[^{}]|\\{(?!\\{)(?:[^{}]|\\{(?!\\{)(?:[^{}])+\\})+\\})+\\}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=\\}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\\s\\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|br|rb)?("""|\'\'\')[\\s\\S]*?\\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|br|rb)?("|\')(?:\\\\.|(?!\\1)[^\\\\\\r\\n])*\\1/i,greedy:!0},function:{pattern:/((?:^|\\s)def[ \\t]+)[a-zA-Z_]\\w*(?=\\s*\\()/g,lookbehind:!0},"class-name":{pattern:/(\\bclass\\s+)\\w+/i,lookbehind:!0},decorator:{pattern:/(^[\\t ]*)@\\w+(?:\\.\\w+)*/m,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\\./}},keyword:/\\b(?:_(?=\\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\\b/,builtin:/\\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\\b/,boolean:/\\b(?:False|None|True)\\b/,number:/\\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\\b|(?:\\b\\d+(?:_\\d+)*(?:\\.(?:\\d+(?:_\\d+)*)?)?|\\B\\.\\d+(?:_\\d+)*)(?:e[+-]?\\d+(?:_\\d+)*)?j?(?!\\w)/i,operator:/[-+%=]=?|!=|:=|\\*\\*?=?|\\/\\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\\];(),.:]/},Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest=Prism.languages.python,Prism.languages.py=Prism.languages.python,Prism.languages.json={property:{pattern:/(^|[^\\\\])"(?:\\\\.|[^\\\\"\\r\\n])*"(?=\\s*:)/,lookbehind:!0,greedy:!0},string:{pattern:/(^|[^\\\\])"(?:\\\\.|[^\\\\"\\r\\n])*"(?!\\s*:)/,lookbehind:!0,greedy:!0},comment:{pattern:/\\/\\/.*|\\/\\*[\\s\\S]*?(?:\\*\\/|$)/,greedy:!0},number:/-?\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b/i,punctuation:/[{}[\\],]/,operator:/:/,boolean:/\\b(?:false|true)\\b/,null:{pattern:/\\bnull\\b/,alias:"keyword"}},Prism.languages.webmanifest=Prism.languages.json,(function(e){var n=/[*&][^\\s[\\]{},]+/,r=/!(?:<[\\w\\-%#;/?:@&=+$,.!~*\'()[\\]]+>|(?:[a-zA-Z\\d-]*!)?[\\w\\-%#;/?:@&=+$.~*\'()]+)?/,t3="(?:"+r.source+"(?:[ 	]+"+n.source+")?|"+n.source+"(?:[ 	]+"+r.source+")?)",a="(?:[^\\\\s\\\\x00-\\\\x08\\\\x0e-\\\\x1f!\\"#%&\'*,\\\\-:>?@[\\\\]`{|}\\\\x7f-\\\\x84\\\\x86-\\\\x9f\\\\ud800-\\\\udfff\\\\ufffe\\\\uffff]|[?:-]<PLAIN>)(?:[ 	]*(?:(?![#:])<PLAIN>|:<PLAIN>))*".replace(/<PLAIN>/g,(function(){return"[^\\\\s\\\\x00-\\\\x08\\\\x0e-\\\\x1f,[\\\\]{}\\\\x7f-\\\\x84\\\\x86-\\\\x9f\\\\ud800-\\\\udfff\\\\ufffe\\\\uffff]"})),d=`"(?:[^"\\\\\\\\\\r\n]|\\\\\\\\.)*"|\'(?:[^\'\\\\\\\\\\r\n]|\\\\\\\\.)*\'`;function o(e2,n2){n2=(n2||"").replace(/m/g,"")+"m";var r2=`([:\\\\-,[{]\\\\s*(?:\\\\s<<prop>>[ 	]+)?)(?:<<value>>)(?=[ 	]*(?:$|,|\\\\]|\\\\}|(?:[\\r\n]\\\\s*)?#))`.replace(/<<prop>>/g,(function(){return t3})).replace(/<<value>>/g,(function(){return e2}));return RegExp(r2,n2)}e.languages.yaml={scalar:{pattern:RegExp(`([\\\\-:]\\\\s*(?:\\\\s<<prop>>[ 	]+)?[|>])[ 	]*(?:((?:\\r?\n|\\r)[ 	]+)\\\\S[^\\r\n]*(?:\\\\2[^\\r\n]+)*)`.replace(/<<prop>>/g,(function(){return t3}))),lookbehind:!0,alias:"string"},comment:/#.*/,key:{pattern:RegExp(`((?:^|[:\\\\-,[{\\r\n?])[ 	]*(?:<<prop>>[ 	]+)?)<<key>>(?=\\\\s*:\\\\s)`.replace(/<<prop>>/g,(function(){return t3})).replace(/<<key>>/g,(function(){return"(?:"+a+"|"+d+")"}))),lookbehind:!0,greedy:!0,alias:"atrule"},directive:{pattern:/(^[ \\t]*)%.+/m,lookbehind:!0,alias:"important"},datetime:{pattern:o("\\\\d{4}-\\\\d\\\\d?-\\\\d\\\\d?(?:[tT]|[ 	]+)\\\\d\\\\d?:\\\\d{2}:\\\\d{2}(?:\\\\.\\\\d*)?(?:[ 	]*(?:Z|[-+]\\\\d\\\\d?(?::\\\\d{2})?))?|\\\\d{4}-\\\\d{2}-\\\\d{2}|\\\\d\\\\d?:\\\\d{2}(?::\\\\d{2}(?:\\\\.\\\\d*)?)?"),lookbehind:!0,alias:"number"},boolean:{pattern:o("false|true","i"),lookbehind:!0,alias:"important"},null:{pattern:o("null|~","i"),lookbehind:!0,alias:"important"},string:{pattern:o(d),lookbehind:!0,greedy:!0},number:{pattern:o("[+-]?(?:0x[\\\\da-f]+|0o[0-7]+|(?:\\\\d+(?:\\\\.\\\\d*)?|\\\\.\\\\d+)(?:e[+-]?\\\\d+)?|\\\\.inf|\\\\.nan)","i"),lookbehind:!0},tag:r,important:n,punctuation:/---|[:[\\]{}\\-,|>?]|\\.\\.\\./},e.languages.yml=e.languages.yaml})(Prism),(function(n){function e(n2){return n2=n2.replace(/<inner>/g,(function(){return`(?:\\\\\\\\.|[^\\\\\\\\\n\\r]|(?:\n|\\r\n?)(?![\\r\n]))`})),RegExp("((?:^|[^\\\\\\\\])(?:\\\\\\\\{2})*)(?:"+n2+")")}var t3="(?:\\\\\\\\.|``(?:[^`\\r\\n]|`(?!`))+``|`[^`\\r\\n]+`|[^\\\\\\\\|\\r\\n`])+",a=`\\\\|?__(?:\\\\|__)+\\\\|?(?:(?:\n|\\r\n?)|(?![^]))`.replace(/__/g,(function(){return t3})),i=`\\\\|?[ 	]*:?-{3,}:?[ 	]*(?:\\\\|[ 	]*:?-{3,}:?[ 	]*)+\\\\|?(?:\n|\\r\n?)`;n.languages.markdown=n.languages.extend("markup",{}),n.languages.insertBefore("markdown","prolog",{"front-matter-block":{pattern:/(^(?:\\s*[\\r\\n])?)---(?!.)[\\s\\S]*?[\\r\\n]---(?!.)/,lookbehind:!0,greedy:!0,inside:{punctuation:/^---|---$/,"front-matter":{pattern:/\\S+(?:\\s+\\S+)*/,alias:["yaml","language-yaml"],inside:n.languages.yaml}}},blockquote:{pattern:/^>(?:[\\t ]*>)*/m,alias:"punctuation"},table:{pattern:RegExp("^"+a+i+"(?:"+a+")*","m"),inside:{"table-data-rows":{pattern:RegExp("^("+a+i+")(?:"+a+")*$"),lookbehind:!0,inside:{"table-data":{pattern:RegExp(t3),inside:n.languages.markdown},punctuation:/\\|/}},"table-line":{pattern:RegExp("^("+a+")"+i+"$"),lookbehind:!0,inside:{punctuation:/\\||:?-{3,}:?/}},"table-header-row":{pattern:RegExp("^"+a+"$"),inside:{"table-header":{pattern:RegExp(t3),alias:"important",inside:n.languages.markdown},punctuation:/\\|/}}}},code:[{pattern:/((?:^|\\n)[ \\t]*\\n|(?:^|\\r\\n?)[ \\t]*\\r\\n?)(?: {4}|\\t).+(?:(?:\\n|\\r\\n?)(?: {4}|\\t).+)*/,lookbehind:!0,alias:"keyword"},{pattern:/^```[\\s\\S]*?^```$/m,greedy:!0,inside:{"code-block":{pattern:/^(```.*(?:\\n|\\r\\n?))[\\s\\S]+?(?=(?:\\n|\\r\\n?)^```$)/m,lookbehind:!0},"code-language":{pattern:/^(```).+/,lookbehind:!0},punctuation:/```/}}],title:[{pattern:/\\S.*(?:\\n|\\r\\n?)(?:==+|--+)(?=[ \\t]*$)/m,alias:"important",inside:{punctuation:/==+$|--+$/}},{pattern:/(^\\s*)#.+/m,lookbehind:!0,alias:"important",inside:{punctuation:/^#+|#+$/}}],hr:{pattern:/(^\\s*)([*-])(?:[\\t ]*\\2){2,}(?=\\s*$)/m,lookbehind:!0,alias:"punctuation"},list:{pattern:/(^\\s*)(?:[*+-]|\\d+\\.)(?=[\\t ].)/m,lookbehind:!0,alias:"punctuation"},"url-reference":{pattern:/!?\\[[^\\]]+\\]:[\\t ]+(?:\\S+|<(?:\\\\.|[^>\\\\])+>)(?:[\\t ]+(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|\\((?:\\\\.|[^)\\\\])*\\)))?/,inside:{variable:{pattern:/^(!?\\[)[^\\]]+/,lookbehind:!0},string:/(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|\\((?:\\\\.|[^)\\\\])*\\))$/,punctuation:/^[\\[\\]!:]|[<>]/},alias:"url"},bold:{pattern:e("\\\\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\\\\b|\\\\*\\\\*(?:(?!\\\\*)<inner>|\\\\*(?:(?!\\\\*)<inner>)+\\\\*)+\\\\*\\\\*"),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^..)[\\s\\S]+(?=..$)/,lookbehind:!0,inside:{}},punctuation:/\\*\\*|__/}},italic:{pattern:e("\\\\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\\\\b|\\\\*(?:(?!\\\\*)<inner>|\\\\*\\\\*(?:(?!\\\\*)<inner>)+\\\\*\\\\*)+\\\\*"),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^.)[\\s\\S]+(?=.$)/,lookbehind:!0,inside:{}},punctuation:/[*_]/}},strike:{pattern:e("(~~?)(?:(?!~)<inner>)+\\\\2"),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^~~?)[\\s\\S]+(?=\\1$)/,lookbehind:!0,inside:{}},punctuation:/~~?/}},"code-snippet":{pattern:/(^|[^\\\\`])(?:``[^`\\r\\n]+(?:`[^`\\r\\n]+)*``(?!`)|`[^`\\r\\n]+`(?!`))/,lookbehind:!0,greedy:!0,alias:["code","keyword"]},url:{pattern:e(\'!?\\\\[(?:(?!\\\\])<inner>)+\\\\](?:\\\\([^\\\\s)]+(?:[	 ]+"(?:\\\\\\\\.|[^"\\\\\\\\])*")?\\\\)|[ 	]?\\\\[(?:(?!\\\\])<inner>)+\\\\])\'),lookbehind:!0,greedy:!0,inside:{operator:/^!/,content:{pattern:/(^\\[)[^\\]]+(?=\\])/,lookbehind:!0,inside:{}},variable:{pattern:/(^\\][ \\t]?\\[)[^\\]]+(?=\\]$)/,lookbehind:!0},url:{pattern:/(^\\]\\()[^\\s)]+/,lookbehind:!0},string:{pattern:/(^[ \\t]+)"(?:\\\\.|[^"\\\\])*"(?=\\)$)/,lookbehind:!0}}}}),["url","bold","italic","strike"].forEach((function(e2){["url","bold","italic","strike","code-snippet"].forEach((function(t4){e2!==t4&&(n.languages.markdown[e2].inside.content.inside[t4]=n.languages.markdown[t4])}))})),n.hooks.add("after-tokenize",(function(n2){n2.language!=="markdown"&&n2.language!=="md"||(function n3(e2){if(e2&&typeof e2!="string")for(var t4=0,a2=e2.length;t4<a2;t4++){var i2=e2[t4];if(i2.type==="code"){var r2=i2.content[1],o2=i2.content[3];if(r2&&o2&&r2.type==="code-language"&&o2.type==="code-block"&&typeof r2.content=="string"){var l2=r2.content.replace(/\\b#/g,"sharp").replace(/\\b\\+\\+/g,"pp"),s="language-"+(l2=(/[a-z][\\w-]*/i.exec(l2)||[""])[0].toLowerCase());o2.alias?typeof o2.alias=="string"?o2.alias=[o2.alias,s]:o2.alias.push(s):o2.alias=[s]}}else n3(i2.content)}})(n2.tokens)})),n.hooks.add("wrap",(function(e2){if(e2.type==="code-block"){for(var t4="",a2=0,i2=e2.classes.length;a2<i2;a2++){var s=e2.classes[a2],d=/language-(.+)/.exec(s);if(d){t4=d[1];break}}var p=n.languages[t4];if(p)e2.content=n.highlight(e2.content.replace(r,"").replace(/&(\\w{1,8}|#x?[\\da-f]{1,8});/gi,(function(n2,e3){var t5;return(e3=e3.toLowerCase())[0]==="#"?(t5=e3[1]==="x"?parseInt(e3.slice(2),16):Number(e3.slice(1)),l(t5)):o[e3]||n2})),p,t4);else if(t4&&t4!=="none"&&n.plugins.autoloader){var u="md-"+new Date().valueOf()+"-"+Math.floor(1e16*Math.random());e2.attributes.id=u,n.plugins.autoloader.loadLanguages(t4,(function(){var e3=document.getElementById(u);e3&&(e3.innerHTML=n.highlight(e3.textContent,n.languages[t4],t4))}))}}}));var r=RegExp(n.languages.markup.tag.pattern.source,"gi"),o={amp:"&",lt:"<",gt:">",quot:\'"\'},l=String.fromCodePoint||String.fromCharCode;n.languages.md=n.languages.markdown})(Prism),Prism.languages.go=Prism.languages.extend("clike",{string:{pattern:/(^|[^\\\\])"(?:\\\\.|[^"\\\\\\r\\n])*"|`[^`]*`/,lookbehind:!0,greedy:!0},keyword:/\\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\\b/,boolean:/\\b(?:_|false|iota|nil|true)\\b/,number:[/\\b0(?:b[01_]+|o[0-7_]+)i?\\b/i,/\\b0x(?:[a-f\\d_]+(?:\\.[a-f\\d_]*)?|\\.[a-f\\d_]+)(?:p[+-]?\\d+(?:_\\d+)*)?i?(?!\\w)/i,/(?:\\b\\d[\\d_]*(?:\\.[\\d_]*)?|\\B\\.\\d[\\d_]*)(?:e[+-]?[\\d_]+)?i?(?!\\w)/i],operator:/[*\\/%^!=]=?|\\+[=+]?|-[=-]?|\\|[=|]?|&(?:=|&|\\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\\.\\.\\./,builtin:/\\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\\b/}),Prism.languages.insertBefore("go","string",{char:{pattern:/\'(?:\\\\.|[^\'\\\\\\r\\n]){0,10}\'/,greedy:!0}}),delete Prism.languages.go["class-name"],(function(e){for(var a="/\\\\*(?:[^*/]|\\\\*(?!/)|/(?!\\\\*)|<self>)*\\\\*/",t3=0;t3<2;t3++)a=a.replace(/<self>/g,(function(){return a}));a=a.replace(/<self>/g,(function(){return"[^\\\\s\\\\S]"})),e.languages.rust={comment:[{pattern:RegExp("(^|[^\\\\\\\\])"+a),lookbehind:!0,greedy:!0},{pattern:/(^|[^\\\\:])\\/\\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/b?"(?:\\\\[\\s\\S]|[^\\\\"])*"|b?r(#*)"(?:[^"]|"(?!\\1))*"\\1/,greedy:!0},char:{pattern:/b?\'(?:\\\\(?:x[0-7][\\da-fA-F]|u\\{(?:[\\da-fA-F]_*){1,6}\\}|.)|[^\\\\\\r\\n\\t\'])\'/,greedy:!0},attribute:{pattern:/#!?\\[(?:[^\\[\\]"]|"(?:\\\\[\\s\\S]|[^\\\\"])*")*\\]/,greedy:!0,alias:"attr-name",inside:{string:null}},"closure-params":{pattern:/([=(,:]\\s*|\\bmove\\s*)\\|[^|]*\\||\\|[^|]*\\|(?=\\s*(?:\\{|->))/,lookbehind:!0,greedy:!0,inside:{"closure-punctuation":{pattern:/^\\||\\|$/,alias:"punctuation"},rest:null}},"lifetime-annotation":{pattern:/\'\\w+/,alias:"symbol"},"fragment-specifier":{pattern:/(\\$\\w+:)[a-z]+/,lookbehind:!0,alias:"punctuation"},variable:/\\$\\w+/,"function-definition":{pattern:/(\\bfn\\s+)\\w+/,lookbehind:!0,alias:"function"},"type-definition":{pattern:/(\\b(?:enum|struct|trait|type|union)\\s+)\\w+/,lookbehind:!0,alias:"class-name"},"module-declaration":[{pattern:/(\\b(?:crate|mod)\\s+)[a-z][a-z_\\d]*/,lookbehind:!0,alias:"namespace"},{pattern:/(\\b(?:crate|self|super)\\s*)::\\s*[a-z][a-z_\\d]*\\b(?:\\s*::(?:\\s*[a-z][a-z_\\d]*\\s*::)*)?/,lookbehind:!0,alias:"namespace",inside:{punctuation:/::/}}],keyword:[/\\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\\b/,/\\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\\b/],function:/\\b[a-z_]\\w*(?=\\s*(?:::\\s*<|\\())/,macro:{pattern:/\\b\\w+!/,alias:"property"},constant:/\\b[A-Z_][A-Z_\\d]+\\b/,"class-name":/\\b[A-Z]\\w*\\b/,namespace:{pattern:/(?:\\b[a-z][a-z_\\d]*\\s*::\\s*)*\\b[a-z][a-z_\\d]*\\s*::(?!\\s*<)/,inside:{punctuation:/::/}},number:/\\b(?:0x[\\dA-Fa-f](?:_?[\\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\\d(?:_?\\d)*)?\\.)?\\d(?:_?\\d)*(?:[Ee][+-]?\\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\\b/,boolean:/\\b(?:false|true)\\b/,punctuation:/->|\\.\\.=|\\.{1,3}|::|[{}[\\];(),:]/,operator:/[-+*\\/%!^]=?|=[=>]?|&[&=]?|\\|[|=]?|<<?=?|>>?=?|[@?]/},e.languages.rust["closure-params"].inside.rest=e.languages.rust,e.languages.rust.attribute.inside.string=e.languages.rust.string})(Prism);var import_react9=require("react"),BASH_STRING=(()=>{try{return new RegExp(String.raw`"(?<=(?:^|[^\\\\])(?:\\\\\\\\)*")(?:\\\\[\\s\\S]|[^"\\\\])*"|\'[^\']*\'`)}catch{return/"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'[^\']*\'/}})(),bashSubshell={pattern:/\\$\\([^)]{0,400}\\)/,greedy:!0,inside:void 0},bashBacktick={pattern:/`[^`\\r\\n]{0,400}`/,greedy:!0,inside:void 0},bashStringInside={subshell:bashSubshell,backtick:bashBacktick};import_prism_core_min.default.languages.bash={comment:{pattern:/(^|[\\t ])#.*/m,lookbehind:!0,greedy:!0},string:{pattern:BASH_STRING,greedy:!0,inside:bashStringInside},variable:/\\$(?:\\w+|\\{[^}\\r\\n]{0,256}\\}|[?$!#@*-])/,subshell:bashSubshell,backtick:bashBacktick,heredoc:{pattern:/<<-?["\']?(\\w{1,64})["\']?(?:[^\\n]{0,120}(\\n[^\\n]{0,200}){0,6}?\\n\\1(?![\\w])|(?=$|[\\s|&;)<]))/m,greedy:!0},keyword:/\\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|select|return|export|local)\\b/,builtin:/\\b(?:test|echo|cd|pwd|ls|cat|mkdir|rm|cp|mv|touch|grep|find|sed|awk|curl|git|node|npm|bun|deno)\\b/,constant:/\\b(?:true|false)\\b/,parameter:{pattern:/(\\s)--?[\\w][\\w=-]{0,40}/,lookbehind:!0},operator:/&&|\\|\\||[|&;<>]/,punctuation:/[(){}[\\]]/};var bashInner={...import_prism_core_min.default.languages.bash};delete bashInner.subshell,delete bashInner.backtick,bashInner.string={pattern:BASH_STRING,greedy:!0},bashSubshell.inside=bashInner,bashBacktick.inside=bashInner;var DEFAULT_DARK_COLORS={foreground:"#e6edf3",foregroundMuted:"#8b949e",accent:"#58a6ff",statusSuccess:"#7ee787",statusWarning:"#d29922",statusDanger:"#ff7b72"},DEFAULT_LIGHT_COLORS={foreground:"#1f2328",foregroundMuted:"#656d76",accent:"#0969da",statusSuccess:"#1a7f37",statusWarning:"#9a6700",statusDanger:"#cf222e"};function resolveSyntaxColors(input){return typeof input=="boolean"?input?DEFAULT_DARK_COLORS:DEFAULT_LIGHT_COLORS:input}var MAX_HIGHLIGHT_CHARS=1e5;function parseAnsiToLines(code,colors){const lines=[],ansiRegex=/\\u001b\\[([0-9;]*)m/g,ansiColors={30:colors.foregroundMuted,31:colors.statusDanger??"#ff7b72",32:colors.statusSuccess??"#7ee787",33:colors.statusWarning??"#d29922",34:colors.accent,35:colors.accent,36:colors.accent,37:colors.foreground,90:colors.foregroundMuted,91:colors.statusDanger??"#ff7b72",92:colors.statusSuccess??"#7ee787",93:colors.statusWarning??"#d29922",94:colors.accent,95:colors.accent,96:colors.accent,97:colors.foreground};let currentColor,currentFontStyle=0;for(const rawLine of code.split(`\n`)){const currentLine=[];lines.push(currentLine);let lastIndex=0,match;for(ansiRegex.lastIndex=0;(match=ansiRegex.exec(rawLine))!==null;){const textBefore=rawLine.slice(lastIndex,match.index);textBefore.length>0&&currentLine.push({content:textBefore,color:currentColor,fontStyle:currentFontStyle||void 0}),lastIndex=ansiRegex.lastIndex;const codes=match[1]?match[1].split(";").map(Number):[0];let idx=0;for(;idx<codes.length;){const c=codes[idx];if(c===0)currentColor=void 0,currentFontStyle=0,idx++;else if(c===1)currentFontStyle|=2,idx++;else if(c===3)currentFontStyle|=1,idx++;else if(c===4)currentFontStyle|=4,idx++;else if(c===22)currentFontStyle&=-3,idx++;else if(c===23)currentFontStyle&=-2,idx++;else if(c===24)currentFontStyle&=-5,idx++;else if(c===39)currentColor=void 0,idx++;else if(c===38||c===48){const isFg=c===38,mode=codes[idx+1];if(mode===5){const colorIdx=codes[idx+2];colorIdx!==void 0&&isFg&&(colorIdx<16?currentColor=ansiColors[colorIdx<8?30+colorIdx:90+(colorIdx-8)]:currentColor=colors.foreground),idx+=3}else if(mode===2){const r=codes[idx+2],g=codes[idx+3],b=codes[idx+4];r!==void 0&&g!==void 0&&b!==void 0&&isFg&&(currentColor=`rgb(${r},${g},${b})`),idx+=5}else idx++}else ansiColors[c]&&(currentColor=ansiColors[c]),idx++}}const remaining=rawLine.slice(lastIndex);remaining.length>0&&currentLine.push({content:remaining,color:currentColor,fontStyle:currentFontStyle||void 0})}return lines}function resolveTokenColor(type,colors){const override=colors[type];if(override)return override;switch(type){case"comment":case"prolog":case"doctype":case"cdata":case"punctuation":case"operator":return colors.foregroundMuted;case"string":case"char":case"attr-value":case"regex":case"template-string":case"heredoc":return colors.statusSuccess??colors.accent;case"keyword":case"selector":case"important":case"atrule":case"boolean":return colors.accent;case"number":case"constant":return colors.statusWarning??colors.accent;case"function":case"function-variable":case"method":case"builtin":case"class-name":return colors.accent;case"variable":case"property":case"tag":case"attr-name":default:return colors.foreground}}function tokenizeToLines(code,grammar,colors){const rawTokens=import_prism_core_min.default.tokenize(code,grammar),lines=[[]];function pushText(content,type){const parts=content.split(`\n`);for(let i=0;i<parts.length;i++){i>0&&lines.push([]);const part=parts[i];if(part&&part.length>0){const currentLine=lines[lines.length-1];currentLine&&currentLine.push({content:part,color:type?resolveTokenColor(type,colors):colors.foreground,fontStyle:type==="comment"?1:void 0})}}}function walk(token,parentType){if(typeof token=="string")pushText(token,parentType);else if(Array.isArray(token))for(const item of token)walk(item,parentType);else if(token&&typeof token=="object"){const type=token.type||parentType;typeof token.content=="string"?pushText(token.content,type):walk(token.content,type)}}for(const token of rawTokens)walk(token);return lines}var HIGHLIGHT_CHUNK_CHARS=4e3,HIGHLIGHT_BUDGET_MS=100;function plainLine(line,colors){return line?[{content:line,color:colors.foreground}]:[]}function tokenizeInChunks(code,grammar,colors,now=Date.now){if(code.length<=HIGHLIGHT_CHUNK_CHARS)return tokenizeToLines(code,grammar,colors);const rows=code.split(`\n`),lines=[],started=now();let index=0;for(;index<rows.length&&now()-started<=HIGHLIGHT_BUDGET_MS;){if(rows[index].length>HIGHLIGHT_CHUNK_CHARS){lines.push(plainLine(rows[index],colors)),index+=1;continue}let end=index+1,size=rows[index].length,blank=-1;for(;end<rows.length&&size+1+rows[end].length<=HIGHLIGHT_CHUNK_CHARS;)size+=1+rows[end].length,!rows[end].trim()&&size>=HIGHLIGHT_CHUNK_CHARS/2&&(blank=end),end+=1;end<rows.length&&blank>index&&(end=blank+1),lines.push(...tokenizeToLines(rows.slice(index,end).join(`\n`),grammar,colors)),index=end}for(;index<rows.length;index++)lines.push(plainLine(rows[index],colors));return lines}var tokenCache=new Map,TOKEN_CACHE_LIMIT=40,cachedChars=0;function colorsKey(colors){return[colors.foreground,colors.foregroundMuted,colors.accent,colors.statusSuccess??"",colors.statusWarning??"",colors.statusDanger??"",colors.builtin??"",colors.keyword??"",colors.variable??"",colors.operator??"",colors.parameter??"",colors.constant??"",colors.heredoc??""].join("|")}function emphasizeShellHead(lines){for(const token of lines[0]??[]){const text=token.content.trim();if(!(!text||token.fontStyle&&token.fontStyle&1)){if(text.startsWith("#"))break;if(/^[\\w.$/{"\']/.test(text)){token.fontStyle=(token.fontStyle??0)|2;break}}}return lines}function cacheKey(code,language,colors){return`${colorsKey(colors)}:${language}:${code}`}function cacheTokens(key,tokens,codeLength){if(tokenCache.has(key)){const existing=tokenCache.get(key);cachedChars-=existing.size,tokenCache.delete(key)}for(tokenCache.set(key,{tokens,size:codeLength}),cachedChars+=codeLength;tokenCache.size>TOKEN_CACHE_LIMIT||cachedChars>5e5;){const oldestKey=tokenCache.keys().next().value;if(oldestKey===void 0)break;const oldest=tokenCache.get(oldestKey);oldest&&(cachedChars-=oldest.size),tokenCache.delete(oldestKey)}}function normalizeLanguage(language){const normalized=language.trim().toLowerCase();if(!normalized)return null;if(normalized==="shell"||normalized==="sh")return"bash";if(normalized==="ansi")return"ansi";if(normalized==="text"||normalized==="plain")return"text";const resolved={js:"javascript",jsx:"jsx",md:"markdown",py:"python",sh:"bash",ts:"typescript",tsx:"tsx",yml:"yaml",html:"markup",xml:"markup"}[normalized]??normalized;return resolved in import_prism_core_min.default.languages?resolved:null}function highlightCodeSync(code,language,colorsInput){if(!code||code.length>MAX_HIGHLIGHT_CHARS)return null;const normalizedLanguage=normalizeLanguage(language);if(!normalizedLanguage)return null;const colors=resolveSyntaxColors(colorsInput),key=cacheKey(code,normalizedLanguage,colors),cached=tokenCache.get(key);if(cached)return tokenCache.delete(key),tokenCache.set(key,cached),cached.tokens;let tokens;if(normalizedLanguage==="ansi")tokens=parseAnsiToLines(code,colors);else if(normalizedLanguage==="text")tokens=code.split(`\n`).map(line=>[{content:line}]);else{const grammar=import_prism_core_min.default.languages[normalizedLanguage];if(!grammar)return null;tokens=tokenizeInChunks(code,grammar,colors)}return cacheTokens(key,tokens,code.length),tokens}var import_jsx_runtime6=require("react/jsx-runtime");function CommandTokens({text,theme}){const lines=highlightCodeSync(text,"shell",vividSyntaxColors(theme)),line=lines&&emphasizeShellHead(lines)?.[0];return!line||line.length<=1?text:(0,import_jsx_runtime6.jsx)(import_jsx_runtime6.Fragment,{children:line.map((token,index)=>(0,import_jsx_runtime6.jsx)(import_react_native11.Text,{style:shellTokenStyle(token),children:token.content},index))})}function shellTokenStyle(token){return!token.color&&!token.fontStyle?null:{...token.color?{color:token.color}:null,...token.fontStyle&&token.fontStyle&1?{fontStyle:"italic"}:null,...token.fontStyle&&token.fontStyle&2?{fontWeight:"700"}:null}}function chunk(){return{api:1,createSurfaces(_client,extras){return followText(extras?.text),{RunningLoader,FoldChanges,CommandTokens}}}}\n\nreturn module.exports;\n})';

// resources/third-party/default-features/vivid-activity/server/generated/pi-chunk.txt
var pi_chunk_default = '(function(require) {\nconst module = { exports: {} };\nconst exports = module.exports;\n"use strict";var __defProp=Object.defineProperty,__getOwnPropDesc=Object.getOwnPropertyDescriptor,__getOwnPropNames=Object.getOwnPropertyNames,__hasOwnProp=Object.prototype.hasOwnProperty,__export=(target,all)=>{for(var name in all)__defProp(target,name,{get:all[name],enumerable:!0})},__copyProps=(to,from,except,desc)=>{if(from&&typeof from=="object"||typeof from=="function")for(let key of __getOwnPropNames(from))!__hasOwnProp.call(to,key)&&key!==except&&__defProp(to,key,{value:from[key],enumerable:!(desc=__getOwnPropDesc(from,key))||desc.enumerable});return to},__toCommonJS=mod=>__copyProps(__defProp({},"__esModule",{value:!0}),mod),pi_chunk_client_exports={};__export(pi_chunk_client_exports,{default:()=>chunk}),module.exports=__toCommonJS(pi_chunk_client_exports);var kitText={listSeparator:"\\u3001"},SOURCE_LANGUAGE="zh-CN",PLURAL_CATEGORIES=["zero","one","two","few","many","other"],META_SECTION="$meta",FORMS_LANGUAGE="$language",PLACEHOLDER=/\\{([A-Za-z_][A-Za-z0-9_]*)\\}/g,hasOwn=(value,name)=>Object.prototype.hasOwnProperty.call(value,name),isObject=value=>typeof value=="object"&&value!==null&&!Array.isArray(value);function isPluralForms(value){return!isObject(value)||!hasOwn(value,"other")?!1:Object.keys(value).every(name=>(PLURAL_CATEGORIES.includes(name)||name===FORMS_LANGUAGE)&&typeof value[name]=="string")}var isMessage=value=>typeof value=="string"||isPluralForms(value);function lookup(catalog,id){const at=id.indexOf(".");if(at<=0)return;const section=id.slice(0,at),name=id.slice(at+1);if(section===META_SECTION||!hasOwn(catalog,section))return;const entries=catalog[section];if(!isObject(entries)||!hasOwn(entries,name))return;const message=entries[name];return isMessage(message)?message:void 0}var pluralRules=new Map;function makePluralRule(language){try{const rules=new Intl.PluralRules(language);if(typeof rules.select(1)=="string")return count=>rules.select(count)}catch{}const primary=language.split("-")[0].toLowerCase();return["zh","ja","ko","vi","th","id","ms","lo","my","km","yue"].includes(primary)?()=>"other":primary==="fr"||primary==="pt"?count=>count<2?"one":"other":count=>count===1?"one":"other"}function pluralCategory(language,count){if(!Number.isFinite(count))return"other";let rule=pluralRules.get(language);return rule||(rule=makePluralRule(language),pluralRules.set(language,rule)),rule(Math.abs(count))}function pickForm(message,params,language){if(typeof message=="string")return message;const category=pluralCategory(message[FORMS_LANGUAGE]??language,Number(params?.count));return hasOwn(message,category)?message[category]:message.other}var paramText=value=>value==null?"":String(value);function format(message,params,language=SOURCE_LANGUAGE){const text=pickForm(message,params,language);return!params||text.indexOf("{")<0?text:text.replace(PLACEHOLDER,(whole,name)=>hasOwn(params,name)?paramText(params[name]):whole)}function createTranslator(language,layers,options={}){const showId=options.missing!=="empty",message=id=>{for(const layer of layers){const found=lookup(layer,id);if(found!==void 0)return found}};return{language,hash:options.hash??"",t:(id,params)=>{const found=message(id);return found===void 0?showId?id:"":format(found,params,language)},message}}var defaults=[{kitText}],sourceTranslator=createTranslator(SOURCE_LANGUAGE,defaults,{missing:"empty"}),bound=null,listeners=new Set;function bindTranslator(next){if(next!==bound){bound=next;for(const listener of Array.from(listeners))try{listener()}catch{}}}var t=(id,params)=>(bound??sourceTranslator).t(id,params),textSource=null;function followText(source){source&&(textSource=source,bindTranslator(source.translator()),source.subscribe(()=>bindTranslator(source.translator())))}var joinList=items=>items.join(t("kitText.listSeparator")),t2=(id,params)=>t(id,params),MAX_UNWITNESSED_MS=1800*1e3;function formatDuration(ms,options={}){if(ms==null||!Number.isFinite(ms)||ms<(options.live?0:100))return null;if(!options.live&&ms<9950)return t2("timing.seconds",{count:(ms/1e3).toFixed(1)});const seconds=options.live?Math.floor(ms/1e3):Math.round(ms/1e3);if(seconds<60)return t2("timing.seconds",{count:seconds});const minutes=Math.floor(seconds/60),rest=seconds%60;if(minutes<60)return rest?t2("timing.minutesSeconds",{minutes,seconds:rest}):t2("timing.minutes",{count:minutes});const hours=Math.floor(minutes/60),restMinutes=minutes%60;return restMinutes?t2("timing.hoursMinutes",{hours,minutes:restMinutes}):t2("timing.hours",{count:hours})}function rec(value){return value!==null&&typeof value=="object"&&!Array.isArray(value)?value:null}function str(value){return typeof value=="string"&&value.trim()?value.trim():void 0}function num(value){return typeof value=="number"&&Number.isFinite(value)?value:void 0}function int(value){return typeof value=="number"?Number.isInteger(value)?value:void 0:typeof value=="string"&&/^\\s*-?\\d+\\s*$/.test(value)?Number(value):void 0}function list(value){return Array.isArray(value)?value:[]}function records(value){return list(value).map(rec).filter(entry=>entry!==null)}function real(value){return value&&value!=="unavailable"?value:void 0}function escapeRe(value){return value.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")}function lines(text){return text.split(/\\r?\\n/)}var LINE_BREAK=/[\\n\\r\\u2028\\u2029]/,LINE_ENDS=[`\n`,"\\r","\\u2028","\\u2029"],quoted=name=>name?t2("piNotice.quoted",{name}):"";function unescapeXml(value){return value.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,\'"\').replace(/&apos;|&#39;/g,"\'").replace(/&amp;/g,"&")}var SPACE=/\\s/;function openingEnd(text,at){if(text[at]===">")return at+1;if(!SPACE.test(text[at]??""))return-1;for(let i=at+1;i<text.length;i++){if(text[i]===">")return i+1;if(text[i]==="<")return-1}return-1}function closingTag(text,name,from){const lead=`</${name}`;for(let at=text.indexOf(lead,from);at>=0;at=text.indexOf(lead,at+1)){let i=at+lead.length;for(;i<text.length&&SPACE.test(text[i]);)i++;if(text[i]===">")return[at,i+1]}return null}function tagBlocks(text,name,limit=Number.POSITIVE_INFINITY){const out=[],open=`<${name}`;let from=0;for(;out.length<limit;){let inner=-1;for(let at=text.indexOf(open,from);at>=0&&(inner=openingEnd(text,at+open.length),!(inner>=0));at=text.indexOf(open,at+1));const close=inner<0?null:closingTag(text,name,inner);if(!close)break;out.push(text.slice(inner,close[0])),from=close[1]}return out}function tag(text,name){const value=tagBlocks(text,name,1)[0]?.trim();return value?unescapeXml(value):void 0}function blocks(text,name){return tagBlocks(text,name)}function attr(text,name){const value=new RegExp(`\\\\s${escapeRe(name)}="([^"]*)"`).exec(text)?.[1]?.trim();return value?unescapeXml(value):void 0}function lineValue(text,label){const match=new RegExp(`^${escapeRe(label)}:[ \\\\t]*(.+)$`,"m").exec(text);return str(match?.[1])}function tidy(rows){const out=[];for(const row of rows){const line=row.trimEnd();!line&&(out.length===0||out[out.length-1]==="")||out.push(line)}for(;out.length&&out[out.length-1]==="";)out.pop();return out.join(`\n`)}var XML_TAG=/<(\\/?)([A-Za-z][\\w.:-]*)(?:\\s[^<>]*)?\\/?>/g;function plainText(text){const closed=new Set(Array.from(text.matchAll(/<\\/([A-Za-z][\\w.:-]*)\\s*>/g),match=>match[1].toLowerCase()));if(closed.size===0)return tidy(lines(text));let stripped=!1;const out=text.replace(XML_TAG,(whole,slash,name,at,all)=>closed.has(name.toLowerCase())?(stripped=!0,slash&&all[at+whole.length]==="<"?`\n`:""):whole);return tidy(stripped?lines(unescapeXml(out)).map(line=>line.trim()):lines(text))}function headline(text){for(const row of lines(text??"")){const line=row.replace(/^\\s*(?:#{1,6}\\s+|>\\s*|[-*+\u2022]\\s+)/,"").replace(/\\*\\*|__/g,"").trim();if(line&&!/^[-=_*`~]{3,}/.test(line))return line}return""}var SUMMARY_MAX=200;function oneLine(value){return value.replace(/\\s+/g,run=>run.includes(`\n`)||run.includes("\\r")?" ":run).trim()}function clip(value,max=SUMMARY_MAX){const chars=Array.from(value);return chars.length>max?`${chars.slice(0,max-1).join("")}\\u2026`:value}function extra(body,header){const text=body?.trim();return text&&text!==header.trim()?text:void 0}function fields(...specs){const out=[],seen=new Set;for(const spec of specs){if(!spec)continue;const[label,raw,mono,id]=spec,value=typeof raw=="number"?Number.isFinite(raw)?String(raw):"":typeof raw=="string"?raw.trim():"";if(!value)continue;let unique=label;for(let n=2;seen.has(unique);n++)unique=`${label} ${n}`;seen.add(unique);const field=mono?{label:unique,value,mono:!0}:{label:unique,value};id&&Object.defineProperty(field,"id",{value:id}),out.push(field)}return out}function duration(ms){return ms!==void 0&&ms>0?formatDuration(ms)??void 0:void 0}var STATUS=statusTable();function statusTable(){const table=new Map,define=(state,words,sentence,keys)=>{for(const key of keys)table.set(key,{state,words,sentence})};return define("done","piNotice.completed","piNotice.completedSentence",["completed","complete","success","succeeded","successful","done","finished"]),define("failed","piNotice.failed","piNotice.failedSentence",["failed","failure","error","errored"]),define("stopped","piNotice.stopped","piNotice.stoppedSentence",["killed","stopped","aborted","interrupted"]),define("stopped","piNotice.canceled","piNotice.canceledSentence",["cancelled","canceled"]),define("stopped","piNotice.paused","piNotice.pausedSentence",["paused"]),define("stopped","piNotice.timeout","piNotice.timeoutSentence",["timed out","timed_out","timeout"]),define("running","piNotice.running","piNotice.runningSentence",["running","in_progress","in-progress","in progress","started"]),define("running","piNotice.queued","piNotice.queuedSentence",["queued","pending"]),table}function statusKey(status){return typeof status=="string"?status.trim().toLowerCase():""}function piNoticeState(status){return STATUS.get(statusKey(status))?.state??"info"}function piStatusWords(status){const id=STATUS.get(statusKey(status))?.words;return id?t2(id):typeof status=="string"?status.trim():""}function outcome(status,extraWords,sentence=!0){const known=STATUS.get(statusKey(status)),words=status===void 0?"":known?t2(sentence?known.sentence:known.words):t2("piNotice.rawStatus",{status});return extraWords?words?t2("piNotice.outcomeDetail",{words,detail:extraWords}):extraWords:words}function overall(states){return states.length===0?"info":states.includes("failed")?"failed":states.includes("stopped")?"stopped":states.includes("running")?"running":states.every(state=>state==="done")?"done":"info"}function tally(words){const counts=new Map;for(const word of words)counts.set(word,(counts.get(word)??0)+1);return joinList(Array.from(counts,([word,count])=>t2("piNotice.tallyCount",{count,word})))}function backgroundTask({text,details}){const d=rec(details)??{},xml=/<background-task-notification\\b/.test(text)?text:"",name=str(d.name)??tag(xml,"task-name")??str(d.description),status=str(d.status)??tag(xml,"status"),exit=d.exitCode!==void 0?int(d.exitCode):int(tag(xml,"exit-code")),signal=exit===void 0?str(d.signal):void 0,start=num(d.startTime),end=num(d.endTime),error=str(d.error)??tag(xml,"error"),outputFile=str(d.outputPath)??tag(xml,"output-file"),id=str(d.id)??tag(xml,"task-id");if(!name&&!status&&exit===void 0&&!error&&!outputFile&&!id)return null;const result=outcome(status,exit!==void 0?t2("piNotice.exitCode",{code:exit}):signal?t2("piNotice.signalCode",{signal}):void 0);return{look:"shell",title:t2("piNotice.backgroundTask"),summary:name?t2("piNotice.namedOutcome",{name:quoted(name),outcome:result}):result||t2("piNotice.backgroundNotice"),state:piNoticeState(status),fields:fields([t2("piNotice.task"),name],[t2("piNotice.status"),status?piStatusWords(status):void 0,!1,"status"],[t2("piNotice.exitCodeLabel"),exit],[t2("piNotice.signal"),signal,!0],[t2("piNotice.error"),error],[t2("piNotice.command"),str(d.command),!0],[t2("piNotice.type"),d.isAgent===!0?t2("piNotice.backgroundAgent"):void 0],[t2("piNotice.model"),str(d.model),!0],[t2("piNotice.outputFile"),outputFile,!0],[t2("piNotice.duration"),start!==void 0&&end!==void 0?duration(end-start):void 0],[t2("piNotice.taskId"),id,!0])}}var RUN_HEADER_START=/^(Background task|Detached foreground task) (completed|failed|paused|stopped): \\*\\*/,GROUP_HEADER=/^Background tasks completed \\((\\d+)\\):(.*)$/,RUN_META=/^(Session|Session file|Session share error|Retention-managed async directory|Workflow run|Child runs|Reconciled detached child|Parallel handoff): (.*)$/,SAVED_OUTPUT=/^(?:Output saved to: (.+) \\([^()\\n]*\\)\\. Read this file if needed\\.|Full output: (.+) \\([^()\\n]*\\)\\. Read it if needed\\.)$/,ERROR_LINE=/^Error(?: \\(([^)]*)\\))?: (.+)$/,SESSION_ZH={session:"piNotice.session","session file":"piNotice.sessionFile","session share error":"piNotice.sessionShareFailed"},BLOCKER_ZH={addressed:"piNotice.addressed",unaddressed:"piNotice.unaddressed",stalemate:"piNotice.stalemate"};function runHeader(line){const start=RUN_HEADER_START.exec(line),rest=start?line.slice(start[0].length):"",close=start&&!LINE_BREAK.test(rest)?rest.indexOf("**",1):-1;return start&&close>=0?[start[1],start[2],rest.slice(0,close),rest.slice(close+2)]:null}var SCHEDULE_START="Scheduled run from **",SCHEDULE_MID="** (schedule ";function scheduleLine(line){if(!line.startsWith(SCHEDULE_START)||!line.endsWith(").")||line.length<SCHEDULE_START.length+2)return null;const rest=line.slice(SCHEDULE_START.length,-2),at=LINE_BREAK.test(rest)?-1:rest.indexOf(SCHEDULE_MID,1);return at>=0&&at+SCHEDULE_MID.length<rest.length?[rest.slice(0,at),rest.slice(at+SCHEDULE_MID.length)]:null}var SCHEDULED_RUN=" \\u2014 scheduled run from ",SCHEDULED_ID=" (schedule ";function scheduledRun(header){const lastBreak=Math.max(...LINE_ENDS.map(mark=>header.lastIndexOf(mark))),index=header.endsWith(")")?header.indexOf(SCHEDULED_RUN,lastBreak+1):-1,rest=index>=0?header.slice(index+SCHEDULED_RUN.length,-1):"",at=index>=0?rest.indexOf(SCHEDULED_ID,1):-1;return at>=0&&at+SCHEDULED_ID.length<rest.length?{index,name:rest.slice(0,at),id:rest.slice(at+SCHEDULED_ID.length)}:null}var BLOCKER_STATES=["addressed","unaddressed","stalemate"];function blockerParts(line){const state=line.startsWith("- ")&&!LINE_BREAK.test(line)?BLOCKER_STATES.find(word=>line.endsWith(` (${word})`)):void 0,middle=state?line.slice(2,line.length-state.length-3):"",at=state?middle.indexOf(": ",1):-1;return state&&at>=0&&at+2<middle.length?[middle.slice(0,at),middle.slice(at+2),state]:null}var PARENT_ACTION=`\n\nParent action: `;function withoutParentAction(text){const at=text.lastIndexOf(PARENT_ACTION);return at>=0&&!text.slice(at+PARENT_ACTION.length).trimEnd().includes(`\n`)?text.slice(0,at):text}var SUBAGENT_OPEN=\'Subagent "\';function quotedSubagent(summary,ending){const start=summary.indexOf(SUBAGENT_OPEN),end=start>=0?summary.lastIndexOf(`"${ending}`):-1;return end>=start+SUBAGENT_OPEN.length?summary.slice(start+SUBAGENT_OPEN.length,end):void 0}function requestIdList(text){const label=/request IDs: /gi;for(let match=label.exec(text);match;match=label.exec(text)){const start=label.lastIndex;let at=start+1;for(;at<text.length&&text[at-1]!==`\n`;at++)if(text[at]==="."&&(at+1===text.length||/\\s/.test(text[at+1])))return text.slice(start,at);label.lastIndex=at}}function merged(...parts){const out={};for(const part of parts)for(const[key,value]of Object.entries(part??{}))value!==void 0&&!(Array.isArray(value)&&value.length===0)&&(out[key]=value);return out}function scheduleText(name,id){return id?name&&name!==id?t2("piNotice.scheduleName",{name,id}):id:name}function nameAndStatus(value){const lineBreak=value.search(LINE_BREAK);if(value.endsWith(")")){const inner=value.length>=2?value.lastIndexOf(")",value.length-2):-1,at=value.indexOf(" (",Math.max(0,inner-1));if(at>=0&&at<=value.length-3&&(lineBreak<0||at<=lineBreak))return[value.slice(0,at),value.slice(at+2,-1)]}return lineBreak<0?[value,void 0]:null}function childRunsText(value){const rows=value.split(/,\\s+/).map(part=>{const match=nameAndStatus(part.trim()),raw=match?.[0]??part.trim(),at=raw.indexOf("="),key=at>=0?raw.slice(0,at):void 0,run=real(at>=0?raw.slice(at+1):raw);return[key,run,match?.[1]?piStatusWords(match[1]):void 0].filter(Boolean).join(t2("piNotice.factSeparator"))});return str(rows.filter(Boolean).join(`\n`))}function childRunsFromDetails(value){const rows=records(value).map(child=>[str(child.workflowKey)??str(child.agent),real(str(child.runId)),str(child.status)?piStatusWords(child.status):void 0].filter(Boolean).join(t2("piNotice.factSeparator")));return str(rows.filter(Boolean).join(`\n`))}function childOutputLine(line){const head=/^- key=(\\S*) run=(\\S*) status=(\\S*)$/.exec(line);if(head){const status=real(head[3]);return`\\u2022 ${[real(head[1])??t2("piNotice.childTask"),status?piStatusWords(status):void 0,real(head[2])?t2("piNotice.runReference",{id:head[2]}):void 0].filter(Boolean).join(t2("piNotice.factSeparator"))}`}const omitted=/^- (\\d+) additional child preview\\(s\\) omitted by notice budget/.exec(line);if(omitted)return t2("piNotice.omittedPreviews",{count:omitted[1]});const preview=/^ {4}\\| ?(.*)$/.exec(line);if(preview)return`  ${preview[1]}`;if(line==="  Preview:")return null;const unavailable=/^ {2}Preview: unavailable \\((.+)\\)$/.exec(line);if(unavailable)return t2("piNotice.unavailablePreview",{reason:unavailable[1]});const saved=/^ {2}Saved output: (.+)$/.exec(line);if(saved)return real(saved[1])?t2("piNotice.savedOutput",{path:saved[1]}):null;const artifact=/^ {2}Output artifact \\(retention-managed\\): (.+)$/.exec(line);if(artifact)return t2("piNotice.outputArtifact",{path:artifact[1]});const structured=/^ {2}Structured output \\(retention-managed\\): (.+)$/.exec(line);if(structured)return t2("piNotice.structuredOutput",{path:structured[1]});const failed=/^ {2}(Output artifact|Structured output) verification failed: (.+)$/.exec(line);if(failed)return t2(failed[1]==="Output artifact"?"piNotice.outputVerificationFailed":"piNotice.structuredVerificationFailed",{error:failed[2]});const error=/^ {2}Error: (.+)$/.exec(line);return error?t2("piNotice.indentedError",{error:error[1]}):line==="  Full output unavailable"?t2("piNotice.fullOutputUnavailable"):line}function previewText(rows){const out=[];let section="text";for(const line of rows){if(line==="Child outputs:"){section="children",out.push(t2("piNotice.childOutputs"));continue}if(line==="Watchdog blockers:"){section="blockers",out.push(t2("piNotice.watchdogBlockers"));continue}if(line==="High-importance watchdog concerns:"){section="concerns",out.push(t2("piNotice.watchdogConcerns"));continue}if(section==="children"){const converted=childOutputLine(line);converted!==null&&out.push(converted);continue}if(section==="blockers"){const blocker=blockerParts(line);if(blocker){out.push(t2("piNotice.blockerDetails",{name:blocker[0],detail:blocker[1],status:t2(BLOCKER_ZH[blocker[2]])}));continue}section="text"}if(section==="concerns"){out.push(line.replace(/^Evidence: /,t2("piNotice.evidencePrefix")).replace(/^Recommended action: /,t2("piNotice.recommendationPrefix")));continue}out.push(line)}const text=tidy(out);return text==="(no output)"?"":text}function runFromLines(source,agent,status){let start=0,end=source.length;const run={},skipBlank=()=>{for(;start<end&&!source[start].trim();)start++};start<end&&source[start].startsWith("Workflow receipt: ")&&(run.receipt=str(source[start++].slice(18))),skipBlank();const schedule=scheduleLine(start<end?source[start]:"");for(schedule&&(run.schedule=scheduleText(schedule[0],schedule[1]),start++);end>start;){const last=source[end-1];if(!last.trim()){end--;continue}const meta=RUN_META.exec(last);if(!meta)break;const value=str(meta[2]),label=meta[1];label==="Parallel handoff"?run.handoff??(run.handoff=value):label==="Workflow run"?run.workflowRunId??(run.workflowRunId=value):label==="Child runs"?run.childRuns??(run.childRuns=value?childRunsText(value):void 0):label==="Reconciled detached child"?run.reconciled??(run.reconciled=value):label!=="Retention-managed async directory"&&value&&(run.session??(run.session={label:label.toLowerCase(),value})),end--}skipBlank();const errors=[],failed=piNoticeState(status)!=="done";for(;failed&&start<end;){const error=ERROR_LINE.exec(source[start]);if(!error)break;errors.push(error[1]?t2("piNotice.errorDetail",{kind:error[1],error:error[2]}):error[2]),start++}errors.length&&(run.errors=errors),skipBlank(),agent&&start<end&&source[start].trim()===`${agent}:`&&start++;const kept=[];for(let index=start;index<end;index++){const row=source[index],saved=SAVED_OUTPUT.exec(row.trim());saved?run.outputFile??(run.outputFile=str(saved[1]??saved[2])):kept.push(row)}return run.body=previewText(kept),run.hasChildOutputs=kept.includes("Child outputs:"),run}function runFromDetails(details){const origin=rec(details.scheduleOrigin),sessionValue=str(details.sessionValue);return{agent:str(details.agent),status:str(details.status),foreground:details.source==="foreground"?!0:void 0,taskInfo:str(details.taskInfo),schedule:origin?scheduleText(str(origin.name),str(origin.id)):void 0,receipt:str(details.workflowReceiptPath),handoff:str(details.handoffPath),workflowRunId:str(details.workflowRunId),runId:str(details.runId),childRuns:childRunsFromDetails(details.childRuns),reconciled:str(details.reconciledFromDetachedChild),session:sessionValue?{label:(str(details.sessionLabel)??"session file").toLowerCase(),value:sessionValue}:void 0,durationMs:num(details.durationMs)}}function taskInfoZh(raw){const info=raw?.trim();if(!info)return;const inner=/^\\((.*)\\)$/.exec(info)?.[1]?.trim()??info,running=/^(dispatch complete; )?(\\d+) (?:child|children) running or uncollected$/.exec(inner);return running?{text:t2(running[1]?"piNotice.dispatchedChildren":"piNotice.runningChildren",{count:running[2]}),dispatching:!0}:{text:inner,dispatching:!1}}function namedOutcome(name,words){return name?t2("piNotice.namedOutcome",{name:quoted(name),outcome:words}):words}function runOutcome(name,info,words){return info?t2("piNotice.withInfo",{name:quoted(name),info,outcome:words}):namedOutcome(name,words)}function runSummary(run){const info=taskInfoZh(run.taskInfo);return info?.dispatching&&piNoticeState(run.status)==="done"?{summary:namedOutcome(run.agent,info.text),state:"info"}:{summary:runOutcome(run.agent,info?.text,outcome(run.status)),state:piNoticeState(run.status)}}function runFields(run){const session=run.session;return fields([t2("piNotice.status"),run.status?piStatusWords(run.status):void 0,!1,"status"],[t2("piNotice.error"),run.errors?.join(`\n`)],[t2("piNotice.source"),run.foreground?t2("piNotice.detached"):void 0],[t2("piNotice.schedule"),run.schedule],[t2("piNotice.duration"),duration(run.durationMs)],[t2("piNotice.outputFile"),run.outputFile,!0],[t2("piNotice.childRun"),run.hasChildOutputs?void 0:run.childRuns],[t2("piNotice.workflow"),run.workflowRunId,!0],[t2("piNotice.workflowReceipt"),run.receipt,!0],[t2("piNotice.parallelHandoff"),run.handoff,!0],[t2("piNotice.reconciledRun"),run.reconciled,!0],session?[SESSION_ZH[session.label]?t2(SESSION_ZH[session.label]):t2("piNotice.session"),session.value,session.label!=="session share error"]:null,[t2("piNotice.runId"),run.runId!==run.workflowRunId?run.runId:void 0,!0])}function subagentNotify({text,details}){const runs=records(rec(details)?.runs).filter(run2=>str(run2.agent)||str(run2.status)),rows=lines(withoutParentAction(text)),single=runHeader(rows[0]??""),group=GROUP_HEADER.exec(rows[0]??"");if(group||runs.length>1)return groupedRuns(rows,group,runs);if(!single&&runs.length===0)return null;const head=single?{agent:str(single[2]),status:single[1],foreground:single[0]==="Detached foreground task"?!0:void 0,taskInfo:str(single[3])}:{},fromDetails=runs[0]?runFromDetails(runs[0]):{},agent=fromDetails.agent??head.agent,run=merged(head,single?runFromLines(rows.slice(1),agent,fromDetails.status??head.status):{},fromDetails),{summary,state}=runSummary(run);return{look:"agent",title:t2("piNotice.subagent"),summary:summary||t2("piNotice.subagentNotice"),state,fields:runFields(run),...run.body?{body:run.body}:{}}}function groupedRuns(rows,group,runs){const headerAgents=Array.from((group?.[2]??"").matchAll(/\\*\\*(.+?)\\*\\*/g),match=>match[1]),agents=runs.length?runs.map(run=>str(run.agent)):headerAgents,count=Math.max(int(group?.[1])??0,runs.length,headerAgents.length),starts=[];for(let index=1,k=1;index<rows.length&&k<=count;index++){const prefix=`${k}. `,line=rows[index],agent=agents[k-1];line.startsWith(prefix)&&(!agent||line.startsWith(`${prefix}${agent}`))&&!rows[index-1].trim()&&(starts.push(index),k++)}const sections=[];for(let k=0;k<Math.max(starts.length,runs.length);k++){const start=starts[k],fromDetails=runs[k]?runFromDetails(runs[k]):{};let fromText={};if(start!==void 0){const header=rows[start].slice(`${k+1}. `.length),agent=fromDetails.agent??agents[k],scheduled=scheduledRun(header),label=scheduled?header.slice(0,scheduled.index):header,taskInfo=agent&&label.startsWith(agent)?str(label.slice(agent.length)):void 0,end=starts[k+1]??rows.length;fromText=merged({agent:agent??str(label),status:"completed",taskInfo,schedule:scheduled?scheduleText(scheduled.name,scheduled.id):void 0},runFromLines(rows.slice(start+1,end),agent,fromDetails.status??"completed"))}sections.push(merged(fromText,fromDetails))}const states=sections.length?sections.map(run=>piNoticeState(run.status)):group?["done"]:[],words=sections.map(run=>piStatusWords(run.status)),n=Math.max(count,sections.length),state=overall(states),summary=states.length>0&&states.every(each=>each==="done")?headerAgents.length&&headerAgents.length<=3?t2("piNotice.groupCompletedNamed",{count:n,names:headerAgents.map(quoted).reduce((names,name)=>names?t2("piNotice.nameList",{names,name}):name,"")}):t2("piNotice.groupCompleted",{count:n}):t2("piNotice.groupEnded",{count:n,outcomes:tally(words)}),body=sections.map(run=>{const info=taskInfoZh(run.taskInfo),head=runOutcome(run.agent??t2("piNotice.subagent"),info?.text,outcome(run.status)||t2("piNotice.unknownStatus")),session=run.session;return tidy([head,...(run.errors??[]).map(error=>t2("piNotice.errorText",{error})),run.schedule?t2("piNotice.scheduleText",{schedule:run.schedule}):"",run.body??"",run.outputFile?t2("piNotice.outputFileText",{path:run.outputFile}):"",session?t2("piNotice.fieldValue",{label:SESSION_ZH[session.label]?t2(SESSION_ZH[session.label]):t2("piNotice.session"),value:session.value}):""].filter((row,at)=>at===0||row!==""))}).join(`\n\n`);return{look:"agent",title:t2("piNotice.subagent"),summary,state,fields:fields([t2("piNotice.eachSubagent"),sections.map(run=>t2("piNotice.fieldValue",{label:run.agent??t2("piNotice.subagent"),value:outcome(run.status)||t2("piNotice.unknownStatus")})).join(`\n`)]),...body?{body}:{}}}var NO_RESULT=new Set(["No output.","Never started \\u2014 stopped while queued."]);function agentRunFromDetails(details){return{id:str(details.id),description:str(details.description),status:str(details.status),neverStarted:str(details.resultPreview)==="Never started \\u2014 stopped while queued."||void 0,error:str(details.error),toolUses:num(details.toolUses),totalTokens:num(details.totalTokens),turnCount:num(details.turnCount),maxTurns:num(details.maxTurns),durationMs:num(details.durationMs),outputFile:str(details.outputFile),result:str(details.resultPreview)}}function agentRunFromXml(block){const summary=tag(block,"summary")??"",statusLabel=tag(block,"status"),usage=blocks(block,"usage")[0]??"",named=/^(?:Agent|Subagent|Workflow) "([\\s\\S]*)" (\\S+)/.exec(summary),neverStarted=/\\bwas stopped while queued\\b/.test(summary)||statusLabel==="Stopped before starting";return{id:tag(block,"task-id"),description:named?.[1],status:neverStarted?"stopped":named?.[2],neverStarted:neverStarted||void 0,error:statusLabel?.startsWith("Error: ")?str(statusLabel.slice(7)):void 0,toolUses:int(tag(usage,"tool_uses")),totalTokens:int(tag(usage,"total_tokens")),durationMs:int(tag(usage,"duration_ms")),outputFile:tag(block,"output-file"),result:tag(block,"result")}}function agentRunOutcome(run,sentence=!0){if(run.neverStarted)return{state:"stopped",words:t2(sentence?"piNotice.neverStartedSentence":"piNotice.neverStarted")};const key=statusKey(run.status);return key==="steered"?{state:"done",words:t2(sentence?"piNotice.steeredSentence":"piNotice.steered")}:key==="aborted"?{state:"stopped",words:t2(sentence?"piNotice.turnLimitStoppedSentence":"piNotice.turnLimitStopped")}:{state:piNoticeState(run.status),words:outcome(run.status,void 0,sentence)}}function agentRunFields(run,words){return fields([t2("piNotice.status"),words,!1,"status"],[t2("piNotice.error"),run.error],[t2("piNotice.toolCalls"),run.toolUses],[t2("piNotice.tokens"),run.totalTokens],[t2("piNotice.turnsLabel"),run.turnCount?run.maxTurns?`${run.turnCount}/${run.maxTurns}`:run.turnCount:void 0],[t2("piNotice.duration"),duration(run.durationMs)],[t2("piNotice.outputFile"),run.outputFile,!0],[t2("piNotice.agentId"),run.id,!0])}function subagentNotification({text,details}){const d=rec(details),xmlRuns=blocks(text,"task-notification").map(agentRunFromXml);let runs;if(d&&(str(d.id)||str(d.description)||str(d.status))?runs=[d,...records(d.others)].map((entry,index)=>{const own=agentRunFromDetails(entry),xml=xmlRuns.find(run=>own.id!==void 0&&run.id===own.id)??xmlRuns[index];return merged(xml,own)}):runs=xmlRuns,runs.length===0)return null;const footerFile=/^Full transcript available at: (.+)$/m.exec(text)?.[1]?.trim();if(runs.length===1){const run=merged({outputFile:footerFile},runs[0]),{state,words}=agentRunOutcome(run),result=run.result&&!NO_RESULT.has(run.result)?run.result:void 0;return{look:"agent",title:t2("piNotice.subagent"),summary:namedOutcome(run.description,words)||t2("piNotice.subagentNotice"),state,fields:agentRunFields(run,agentRunOutcome(run,!1).words),...result?{body:result}:{}}}const outcomes=runs.map(run=>agentRunOutcome(run)),partial=/^Background agent group completed: .*\\bpartial\\b/m.test(text),allDone=outcomes.every(each=>each.state==="done"),body=runs.map((run,index)=>{const result=run.result&&!NO_RESULT.has(run.result)?run.result:"";return tidy([namedOutcome(run.description??run.id??t2("piNotice.subagent"),outcomes[index].words),run.error?t2("piNotice.errorText",{error:run.error}):"",result].filter((row,at)=>at===0||row!==""))}).join(`\n\n`);return{look:"agent",title:t2("piNotice.subagent"),summary:allDone?t2(partial?"piNotice.groupCompletedPartial":"piNotice.groupCompleted",{count:runs.length}):t2(partial?"piNotice.groupEndedPartial":"piNotice.groupEnded",{count:runs.length,outcomes:tally(outcomes.map(each=>each.words))}),state:overall(outcomes.map(each=>each.state)),fields:fields([t2("piNotice.eachSubagent"),runs.map((run,index)=>t2("piNotice.fieldValue",{label:run.description??run.id??t2("piNotice.subagent"),value:outcomes[index].words})).join(`\n`)]),...body?{body}:{}}}function subagentUpdate({text,details}){const d=rec(details)??{},xml=/<subagent-update\\b/.test(text)?text:"",description=str(d.description)??quotedSubagent(tag(xml,"summary")??""," sent an update"),message=str(d.message)??tag(xml,"message")??(xml?void 0:str(text));if(!description&&!message)return null;const gist=clip(headline(message),120),summary=t2(description?gist?"piNotice.progressNamedDetail":"piNotice.progressNamed":gist?"piNotice.progressDetail":"piNotice.progress",{name:quoted(description),detail:gist});return{look:"agent",title:t2("piNotice.subagent"),summary,state:"info",fields:fields([t2("piNotice.agentId"),str(d.id)??tag(xml,"task-id"),!0]),...extra(message,gist)?{body:message}:{}}}function workspaceNotice({text,details}){const d=rec(details)??{},xml=/<workspace-notice\\b/.test(text)?text:"",description=str(d.description)??quotedSubagent(tag(xml,"summary")??""," left work behind"),notice=str(d.notice)??tag(xml,"notice");if(!description&&!notice)return null;const gist=clip(headline(notice),120);return{look:"agent",title:t2("piNotice.subagent"),summary:t2(description?gist?"piNotice.workspaceNamedDetail":"piNotice.workspaceNamed":gist?"piNotice.workspaceDetail":"piNotice.workspace",{name:quoted(description),detail:gist}),state:"info",fields:fields([t2("piNotice.agentId"),str(d.id)??tag(xml,"task-id"),!0]),...extra(notice,gist)?{body:notice}:{}}}var SUPERVISOR_HEADINGS=new Map([["Subagent needs a supervisor decision.","need_decision"],["Subagent progress update.","progress_update"],["Subagent requests a structured supervisor interview.","interview_request"]]);function supervisorMessage(rows){const start=rows.findIndex(row=>!row.trim());if(start<0)return;const out=[];for(const row of rows.slice(start+1)){if(/^(?:Structured response requested\\.|Reply with: |Live guidance: )/.test(row))break;out.push(row)}return str(tidy(out))}function supervisorRequest({text,details}){const d=rec(details)??{},rows=lines(text),reason=str(d.reason)??SUPERVISOR_HEADINGS.get(rows[0]?.trim()??""),agent=str(d.agent)??lineValue(text,"Agent"),message=str(d.requestBody)??supervisorMessage(rows);if(!reason&&!agent&&!message)return null;const gist=clip(headline(message),120),messageId=reason==="progress_update"?gist?"piNotice.requestProgressDetail":"piNotice.requestProgress":reason==="interview_request"?gist?"piNotice.requestInterviewDetail":"piNotice.requestInterview":gist?"piNotice.requestDecisionDetail":"piNotice.requestDecision";return{look:"agent",title:t2("piNotice.subagentRequest"),summary:t2(messageId,{name:agent?quoted(agent):t2("piNotice.subagentLead"),detail:gist}),state:"info",fields:fields([t2("piNotice.runId"),str(d.runId)??lineValue(text,"Run"),!0],[t2("piNotice.requestId"),str(d.requestId)??str(d.id)??/replyTo: "([^"]+)"/.exec(text)?.[1],!0]),...extra(message,gist)?{body:message}:{}}}function supervisorReminder({customType,text,details}){const d=rec(details)??{},fromDetails=list(d.requestIds).map(str).filter(id=>id!==void 0),fromText=requestIdList(text)?.split(/,\\s*/).map(id=>id.trim()).filter(Boolean)??[],ids=fromDetails.length?fromDetails:fromText,blocked=customType==="subagent-supervisor-blocked"||d.blocked===!0,n=ids.length;return{look:"agent",title:t2("piNotice.subagentRequest"),summary:blocked?t2(n?"piNotice.requestsUnansweredCount":"piNotice.requestsUnanswered",{count:n}):t2(n?"piNotice.requestReminderCount":"piNotice.requestReminder",{count:n}),state:"info",fields:fields([t2("piNotice.requestId"),ids.join(`\n`),!0])}}var PARENT_SENTENCES=new Map([["subagent-completion-unanswered","piNotice.completionReminder"],["subagent-completion-unhandled","piNotice.completionUnhandled"],["subagent-compaction-resume","piNotice.compactionResume"]]),CONTROL_HEADER=/^Subagent (needs attention|active but long-running|failed): (.+)$/;function factsFromEvent(event){const elapsed=num(event.elapsedMs),toolMs=num(event.currentToolDurationMs),tool=str(event.currentTool),facts=[elapsed!==void 0?t2("piNotice.elapsed",{duration:duration(elapsed)??t2("piNotice.underSecond")}):void 0,num(event.turns)!==void 0?t2("piNotice.turnCount",{count:num(event.turns)}):void 0,num(event.tokens)!==void 0?t2("piNotice.tokenCount",{count:num(event.tokens)}):void 0,num(event.toolCount)!==void 0?t2("piNotice.toolCount",{count:num(event.toolCount)}):void 0,tool?t2(toolMs!==void 0&&duration(toolMs)?"piNotice.toolElapsed":"piNotice.toolName",{tool,duration:duration(toolMs)}):void 0,str(event.currentPath)?t2("piNotice.path",{path:str(event.currentPath)}):void 0].filter(Boolean);return facts.length?facts.join(t2("piNotice.factSeparator")):void 0}function factsFromText(value){if(!value)return;const facts=value.split(" | ").map(fact=>{const part=fact.trim(),elapsed=/^elapsed (\\d+)s$/.exec(part);if(elapsed)return t2("piNotice.elapsed",{duration:duration(Number(elapsed[1])*1e3)??t2("piNotice.underSecond")});const counted=/^(\\d+) (turns|tokens|tools)$/.exec(part);if(counted)return t2(counted[2]==="turns"?"piNotice.turnCount":counted[2]==="tokens"?"piNotice.tokenCount":"piNotice.toolCount",{count:counted[1]});const tool=/^tool (\\S+)(?: (\\d+)s)?$/.exec(part);if(tool)return t2(tool[2]?"piNotice.toolElapsed":"piNotice.toolName",{tool:tool[1],duration:duration(Number(tool[2])*1e3)??t2("piNotice.seconds",{count:tool[2]})});const path=/^path (.+)$/.exec(part);return path?t2("piNotice.path",{path:path[1]}):part});return str(facts.filter(Boolean).join(t2("piNotice.factSeparator")))}function controlNotice({text,details}){const d=rec(details)??{},event=rec(d.event)??{},header=CONTROL_HEADER.exec(lines(text)[0]?.trim()??""),type=str(event.type)??(header?.[1]==="active but long-running"?"active_long_running":header?.[1]==="failed"?"failed":header?"needs_attention":void 0);if(!type)return null;const reason=str(event.reason),agent=str(event.agent)??str(header?.[2]),runLine=lineValue(text,"Run"),index=int(event.index),step=index!==void 0?index+1:int(/\\sstep (\\d+)$/.exec(runLine??"")?.[1]),name=agent?quoted(agent):t2("piNotice.subagentLead");let summary,state="info";if(type==="failed"||reason==="completion_guard")summary=t2("piNotice.subagentFailed",{name}),state="failed";else if(type==="active_long_running"){const elapsed=duration(num(event.elapsedMs));summary=t2(elapsed?"piNotice.longRunningDuration":"piNotice.longRunning",{name,duration:elapsed})}else{const elapsed=duration(num(event.elapsedMs)),tool=str(event.currentTool),toolTime=duration(num(event.currentToolDurationMs)),why=reason==="idle"&&elapsed?t2("piNotice.idleDuration",{duration:elapsed}):reason==="tool_open_threshold"?t2(tool?toolTime?"piNotice.toolElapsed":"piNotice.toolLongRunning":toolTime?"piNotice.unnamedToolElapsed":"piNotice.unnamedToolLongRunning",{tool,duration:toolTime}):reason==="supervisor_request"?t2("piNotice.waitingParent"):reason==="tool_failures"?t2("piNotice.toolFailures"):void 0;summary=t2(why?"piNotice.needsAttentionReason":"piNotice.needsAttention",{name,reason:why})}return{look:"agent",title:t2("piNotice.subagent"),summary,state,fields:fields([t2("piNotice.signal"),str(event.message)??lineValue(text,"Signal")],[t2("piNotice.runFacts"),factsFromEvent(event)??factsFromText(lineValue(text,"Facts"))],[t2("piNotice.recentFailures"),str(event.recentFailureSummary)??lineValue(text,"Recent failures")],[t2("piNotice.step"),step],[t2("piNotice.runId"),str(event.runId)??runLine?.split(/\\s+/)[0],!0])}}var STEERING_HEADER=/^Subagent steering (\\S+): (.+)$/;function steeringNotice({text,details}){const d=rec(details)??{},rows=lines(text),header=STEERING_HEADER.exec(rows[0]?.trim()??""),state=str(d.state)??header?.[1];if(!state)return null;const message=str(d.message)??str(tidy(rows.slice(1).filter(row=>!/^Request:\\s/.test(row)&&row.trim()!=="Inspect the run status before sending another correction."))),summary=state==="failed"?t2("piNotice.steeringFailed"):state==="partial"?t2("piNotice.steeringPartial"):state==="recovered"?t2("piNotice.steeringRecovered"):t2("piNotice.steeringState",{state});return{look:"agent",title:t2("piNotice.subagent"),summary,state:state==="failed"||state==="partial"?"failed":"info",fields:fields([t2("piNotice.description"),message],[t2("piNotice.runId"),str(d.runId)??real(str(header?.[2])),!0],[t2("piNotice.requestId"),str(d.requestId)??lineValue(text,"Request"),!0])}}var SEVERITY_ZH={concern:"piNotice.concern",blocker:"piNotice.blocker"},IMPORTANCE_ZH={low:"piNotice.low",medium:"piNotice.medium",high:"piNotice.high"},CATEGORY_ZH={correctness:"piNotice.correctness","missed-constraint":"piNotice.missedConstraint","test-gap":"piNotice.testGap","unsafe-change":"piNotice.unsafeChange","scope-drift":"piNotice.scopeDrift","stale-fact":"piNotice.staleFact","loop-risk":"piNotice.loopRisk",other:"piNotice.other"},WATCHER_ZH={main:"piNotice.mainAgent",child:"piNotice.subagent",lsp:"piNotice.lsp"},WARNING_STATE_ZH={stale:"piNotice.stale",failed:"piNotice.reviewFailed",stalemate:"piNotice.stalemateStopped",resolved:"piNotice.resolved",suppressed:"piNotice.suppressed"};function watchdogWarning({text,details}){const d=rec(details)??{},xml=/<subagent_watchdog\\b/.test(text)?text:"",severity=str(d.severity)??attr(xml,"severity"),agent=str(d.agent)??tag(xml,"agent"),point=str(d.summary)??tag(xml,"summary");if(!severity&&!point)return null;const shownPoint=point?clip(oneLine(point),160):"",warningState=str(d.state)??tag(xml,"state"),stale=d.stale===!0||tag(xml,"stale")==="true",category=str(d.category)??attr(xml,"category"),importance=str(d.importance)??attr(xml,"importance"),source=str(d.source)??attr(xml,"source"),states=[warningState&&warningState!=="displayed"&&warningState!=="confirmed"&&warningState!=="candidate"?WARNING_STATE_ZH[warningState]?t2(WARNING_STATE_ZH[warningState]):warningState:void 0,stale&&warningState!=="stale"?t2("piNotice.stale"):void 0];return{look:"agent",title:t2("piNotice.watchdog"),summary:t2(agent?severity==="blocker"?shownPoint?"piNotice.watchdogBlockerDetail":"piNotice.watchdogBlocker":shownPoint?"piNotice.watchdogConcernDetail":"piNotice.watchdogConcern":severity==="blocker"?shownPoint?"piNotice.watchdogBlockerUnnamedDetail":"piNotice.watchdogBlockerUnnamed":shownPoint?"piNotice.watchdogConcernUnnamedDetail":"piNotice.watchdogConcernUnnamed",{name:quoted(agent),detail:shownPoint}),state:"info",fields:fields([t2("piNotice.point"),point&&shownPoint!==point?point:void 0],[t2("piNotice.severity"),severity?SEVERITY_ZH[severity]?t2(SEVERITY_ZH[severity]):severity:void 0],[t2("piNotice.importance"),importance?IMPORTANCE_ZH[importance]?t2(IMPORTANCE_ZH[importance]):importance:void 0],[t2("piNotice.category"),category?CATEGORY_ZH[category]?t2(CATEGORY_ZH[category]):category:void 0],[t2("piNotice.source"),source?WATCHER_ZH[source]?t2(WATCHER_ZH[source]):source:void 0],[t2("piNotice.evidence"),str(d.evidence)??tag(xml,"evidence")],[t2("piNotice.recommendation"),str(d.recommendedAction)??tag(xml,"recommended_action")],[t2("piNotice.watchdogStatus"),states.filter(Boolean).join(t2("piNotice.commaSeparator"))],[t2("piNotice.reviewError"),warningState==="failed"?str(d.error):void 0],[t2("piNotice.runId"),str(d.runId)??tag(xml,"run_id"),!0])}}function watchdogClarification({text}){const body=plainText(text),gist=clip(headline(body),160);return{look:"agent",title:t2("piNotice.watchdog"),summary:t2(gist?"piNotice.clarifyDetail":"piNotice.clarify",{detail:gist}),state:"info",fields:[],...extra(body,gist)?{body}:{}}}var WAIT_TEXT=/^Wait subscription (\\S+) fired for run (\\S+): (.+?)\\.(?:\\s+([\\s\\S]*))?$/;function completionArchive(text){const label="Completion archive: ";for(let at=text.indexOf(label);at>=0;at=text.indexOf(label,at+1)){const start=at+label.length;let end=start;for(;end<text.length&&!LINE_ENDS.includes(text[end]);)end++;if(end===start)continue;const line=text.slice(start,end),kept=line.trimEnd();return kept?kept.length>1&&kept.endsWith(".")?kept.slice(0,-1):kept:line[0]}}function waitSubscription({text,details}){const d=rec(details)??{},parsed=WAIT_TEXT.exec(text.trim()),result=str(d.outcome)??parsed?.[3];if(!result)return null;const key=statusKey(result);let summary,state;return key==="timed out"?[summary,state]=[t2("piNotice.waitTimeout"),"info"]:key==="needs attention"?[summary,state]=[t2("piNotice.waitAttention"),"info"]:key==="could not be reconciled"||key==="reconciliation failed"?[summary,state]=[t2("piNotice.waitUnconfirmed"),"failed"]:[summary,state]=[t2("piNotice.waitOutcome",{outcome:outcome(result)}),piNoticeState(result)],{look:"agent",title:t2("piNotice.subagent"),summary,state,fields:fields([t2("piNotice.runId"),str(d.runId)??parsed?.[2],!0],[t2("piNotice.completionArchive"),completionArchive(parsed?.[4]??""),!0])}}var WORKFLOW_CHILD=/^Workflow child (completed|failed|paused(?: \\(needs attention\\))?|stopped): \\*\\*(.+?)\\*\\*$/;function workflowChild({text,details}){const d=rec(details)??{},header=WORKFLOW_CHILD.exec(lines(text)[0]?.trim()??""),key=str(d.childKey)??header?.[2],result=str(d.outcome)??header?.[1]?.replace(/ \\(needs attention\\)$/,"");if(!key&&!result)return null;const status=lineValue(text,"Status"),running=status===void 0?void 0:/still running/.test(status);return{look:"agent",title:t2("piNotice.subagent"),summary:t2(running===!0?"piNotice.workflowChildRunning":running===!1?"piNotice.workflowChildEnded":"piNotice.workflowChild",{name:quoted(key),outcome:outcome(result)||t2("piNotice.hasResult")}),state:piNoticeState(result),fields:fields([t2("piNotice.error"),lineValue(text,"Error")],[t2("piNotice.output"),real(lineValue(text,"Output")),!0],[t2("piNotice.workflowStatus"),running===!0?t2("piNotice.stillRunning"):running===!1?t2("piNotice.ended"):void 0],[t2("piNotice.workflow"),real(lineValue(text,"Workflow run")),!0],[t2("piNotice.childRun"),real(lineValue(text,"Child run")),!0])}}function workflowResultWriteFailed({text}){return{look:"agent",title:t2("piNotice.subagent"),summary:t2("piNotice.workflowSaveFailed"),state:"failed",fields:fields([t2("piNotice.error"),str(text)])}}function fetchedHeader(text){const head=/Content fetched for (\\d+)\\/(\\d+) URLs \\[/.exec(text),close=head?text.indexOf("]",head.index+head[0].length):-1;return head&&close>=0?[head[1],head[2],text.slice(head.index+head[0].length,close)]:null}function fetchFailure(text){const label="Content fetch failed [";for(let at=text.indexOf(label);at>=0;){const close=text.indexOf("]",at+label.length);if(close<0)return null;if(text[close+1]===":")return[text.slice(at+label.length,close),text.slice(close+2).trimStart()];at=text.indexOf(label,close)}return null}function webContentReady({text}){const match=fetchedHeader(text),ok=int(match?.[0]),total=int(match?.[1]);if(ok===void 0||total===void 0)return null;const[summary,state]=ok===0&&total>0?[t2("piNotice.fetchNone",{total}),"failed"]:ok<total?[t2("piNotice.fetchPartial",{ok,total}),"done"]:[t2("piNotice.fetchComplete",{ok,total}),"done"];return{look:"web",title:t2("piNotice.webSearch"),summary,state,fields:fields([t2("piNotice.webpage"),`${ok}/${total}`],[t2("piNotice.fetchId"),str(match?.[2]),!0])}}function webError({text}){const match=fetchFailure(text.trim());return{look:"web",title:t2("piNotice.webSearch"),summary:t2("piNotice.fetchFailed"),state:"failed",fields:fields([t2("piNotice.error"),match?match[1]:plainText(text)],[t2("piNotice.fetchId"),str(match?.[0]),!0])}}function webResults({text,details}){const d=rec(details)??{},queries=list(d.queries).map(str).filter(query=>query!==void 0),total=num(d.totalResults),ok=num(d.successfulQueries),asked=num(d.queryCount)??(queries.length||void 0),guide=text.search(/\\n---\\n(?:Full content for|Content fetching in background|Full search results are stored)/),body=plainText(guide>=0?text.slice(0,guide):text),subject=queries.length===1?t2("piNotice.quotedQuery",{query:queries[0]}):asked?t2("piNotice.queryCount",{count:asked}):"",failedQueries=asked!==void 0&&ok!==void 0?asked-ok:0,summary=subject?t2(total!==void 0?failedQueries>0?"piNotice.searchCountFailed":"piNotice.searchCount":failedQueries>0?"piNotice.searchFailed":"piNotice.search",{subject,total,failed:failedQueries}):headline(body)||t2("piNotice.searchResults"),state=asked!==void 0&&ok!==void 0?ok===0&&asked>0?"failed":"done":"info";return{look:"web",title:t2("piNotice.webSearch"),summary,state,fields:fields([t2("piNotice.query"),queries.join(`\n`)],[t2("piNotice.resultCount"),total]),...body?{body}:{}}}function goalContract({text,details}){const d=rec(details)??{},inactive=d.state==="inactive"||d.state===void 0&&text.trim().startsWith("Goal mode is inactive."),objective=tag(text,"goal_objective"),gist=headline(objective);return{look:"plan",title:t2("piNotice.goal"),summary:inactive?t2("piNotice.goalInactive"):t2(gist?"piNotice.goalUpdatedDetail":"piNotice.goalUpdated",{detail:clip(gist,160)}),state:"info",fields:fields([t2("piNotice.goal"),inactive?void 0:objective],[t2("piNotice.goalId"),str(d.goalId)??tag(text,"goal_id"),!0])}}function goalBudget({details}){return{look:"plan",title:t2("piNotice.goal"),summary:t2("piNotice.goalBudget"),state:"info",fields:fields([t2("piNotice.goalId"),str(rec(details)?.goalId),!0])}}var PARSERS=new Map([["background-task-notification",backgroundTask],["subagent-notify",subagentNotify],["subagent-notification",subagentNotification],["subagent-update",subagentUpdate],["subagent-workspace-notice",workspaceNotice],["subagent_supervisor_request",supervisorRequest],["subagent-supervisor-unanswered",supervisorReminder],["subagent-supervisor-blocked",supervisorReminder],["subagent_control_notice",controlNotice],["subagent_steering_notice",steeringNotice],["subagent_watchdog_warning",watchdogWarning],["subagent_watchdog_clarification",watchdogClarification],["subagent-wait-subscription",waitSubscription],["subagent-incremental-child-notify",workflowChild],["subagent-workflow-result-write-failed",workflowResultWriteFailed],["web-search-content-ready",webContentReady],["web-search-error",webError],["web-search-results",webResults],["goal-contract",goalContract],["goal-budget-wrap-up",goalBudget]]);function family(customType){const type=customType.toLowerCase();return/^subagents?[-_:]/.test(type)?{look:"agent",title:t2("piNotice.subagent")}:/^(?:web-search|web-fetch|curator-config$|google-account$)/.test(type)?{look:"web",title:t2("piNotice.webSearch")}:/^goal[-_]/.test(type)?{look:"plan",title:t2("piNotice.goal")}:type.startsWith("background-task")?{look:"shell",title:t2("piNotice.backgroundTask")}:{look:"other",title:t2("piNotice.piNotice")}}var MAX_LEAVES=8;function leaves(text){const out=[];for(const match of text.matchAll(/<([A-Za-z][\\w.:-]*)(?:\\s[^<>]*)?>([^<]*)<\\/\\1\\s*>/g)){const value=unescapeXml(match[2]).trim();if(value&&out.push([match[1],value]),out.length>=MAX_LEAVES)break}return out}function generic({customType,text,details}){const sentenceId=PARENT_SENTENCES.get(customType),sentence=sentenceId?t2(sentenceId):void 0,pairs=sentence?[]:leaves(text);if(pairs.length>=2)return{...family(customType),summary:clip(pairs.slice(0,2).map(([,value])=>oneLine(value)).join(t2("piNotice.factSeparator"))),state:"info",fields:fields([t2("piNotice.type"),customType,!0],...pairs.map(([label,value])=>[label,value]))};const body=plainText(text);let shown=body;if(!shown&&details!==void 0&&details!==null)try{shown=JSON.stringify(details,null,2)??""}catch{shown=""}const summary=sentence??(clip(headline(body))||customType);return{...family(customType),summary,state:"info",fields:sentence?[]:fields([t2("piNotice.type"),customType,!0]),...!sentence&&extra(shown,summary)?{body:shown}:{}}}var PI_NOTICE_LIMITS={text:64*1024,string:8*1024,chars:64*1024,entries:200,nodes:4e3,depth:8,key:256};function boundDetails(value){const limits=PI_NOTICE_LIMITS;let chars=limits.chars,nodes=limits.nodes;const room=()=>nodes>0&&chars>0,copy=(item,depth)=>{if(nodes-=1,typeof item=="string"){const kept=item.slice(0,Math.max(0,Math.min(limits.string,chars)));return chars-=kept.length,kept}if(item===null||typeof item=="boolean"||typeof item=="number"&&Number.isFinite(item))return item;if(typeof item!="object"||depth>=limits.depth)return;if(Array.isArray(item)){const out2=[];for(let i=0;i<item.length&&out2.length<limits.entries&&room();i++)out2.push(copy(item[i],depth+1));return out2}const out={};let entries=0;for(const key of Object.keys(item)){if(entries>=limits.entries||!room())break;if(key.length>limits.key||key==="__proto__")continue;entries+=1,chars-=key.length;const kept=copy(item[key],depth+1);kept!==void 0&&(out[key]=kept)}return out};try{return copy(value,0)}catch{return}}function isPiNotice(item){try{const row=rec(item),meta=rec(row?.metadata);if(!row||!meta||meta.synthetic!==!0)return!1;const customType=meta.customType;return typeof customType!="string"||!customType.trim()||row.name!==customType?!1:rec(row.detail)?.type==="plain_text"}catch{return!1}}function readPiNotice(item){try{if(!isPiNotice(item))return null;const meta=rec(item.metadata),customType=meta.customType,rawText=rec(item.detail).text,text=typeof rawText=="string"?rawText.slice(0,PI_NOTICE_LIMITS.text):"",input={customType,text,details:boundDetails(meta.details)};let draft=null;try{draft=PARSERS.get(customType)?.(input)??null}catch{draft=null}const shaped=draft??generic(input),summary=oneLine(shaped.summary)||customType;return{customType,...shaped,summary:clip(summary)}}catch{return null}}function chunk(){return{api:1,createSurfaces(_client,extras){return followText(extras?.text),{readPiNotice}}}}\n\nreturn module.exports;\n})';

// resources/third-party/default-features/vivid-activity/server/generated/ui-chunk.txt
var ui_chunk_default = '(function(require) {\nconst module = { exports: {} };\nconst exports = module.exports;\n"use strict";var __create=Object.create,__defProp=Object.defineProperty,__getOwnPropDesc=Object.getOwnPropertyDescriptor,__getOwnPropNames=Object.getOwnPropertyNames,__getProtoOf=Object.getPrototypeOf,__hasOwnProp=Object.prototype.hasOwnProperty,__commonJS=(cb,mod)=>function(){return mod||(0,cb[__getOwnPropNames(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports},__export=(target,all)=>{for(var name in all)__defProp(target,name,{get:all[name],enumerable:!0})},__copyProps=(to,from,except,desc)=>{if(from&&typeof from=="object"||typeof from=="function")for(let key of __getOwnPropNames(from))!__hasOwnProp.call(to,key)&&key!==except&&__defProp(to,key,{value:from[key],enumerable:!(desc=__getOwnPropDesc(from,key))||desc.enumerable});return to},__toESM=(mod,isNodeMode,target)=>(target=mod!=null?__create(__getProtoOf(mod)):{},__copyProps(isNodeMode||!mod||!mod.__esModule?__defProp(target,"default",{value:mod,enumerable:!0}):target,mod)),__toCommonJS=mod=>__copyProps(__defProp({},"__esModule",{value:!0}),mod),__async=(__this,__arguments,generator)=>new Promise((resolve,reject)=>{var fulfilled=value=>{try{step(generator.next(value))}catch(e){reject(e)}},rejected=value=>{try{step(generator.throw(value))}catch(e){reject(e)}},step=x=>x.done?resolve(x.value):Promise.resolve(x.value).then(fulfilled,rejected);step((generator=generator.apply(__this,__arguments)).next())}),require_prism_core_min=__commonJS({"node_modules/prismjs/components/prism-core.min.js"(exports2,module2){var _self=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:{},Prism3=(function(e){var n=/(?:^|\\s)lang(?:uage)?-([\\w-]+)(?=\\s|$)/i,t3=0,r={},a={manual:e.Prism&&e.Prism.manual,disableWorkerMessageHandler:e.Prism&&e.Prism.disableWorkerMessageHandler,util:{encode:function e2(n2){return n2 instanceof i?new i(n2.type,e2(n2.content),n2.alias):Array.isArray(n2)?n2.map(e2):n2.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\\u00a0/g," ")},type:function(e2){return Object.prototype.toString.call(e2).slice(8,-1)},objId:function(e2){return e2.__id||Object.defineProperty(e2,"__id",{value:++t3}),e2.__id},clone:function e2(n2,t4){var r2,i2;switch(t4=t4||{},a.util.type(n2)){case"Object":if(i2=a.util.objId(n2),t4[i2])return t4[i2];for(var l2 in r2={},t4[i2]=r2,n2)n2.hasOwnProperty(l2)&&(r2[l2]=e2(n2[l2],t4));return r2;case"Array":return i2=a.util.objId(n2),t4[i2]?t4[i2]:(r2=[],t4[i2]=r2,n2.forEach((function(n3,a2){r2[a2]=e2(n3,t4)})),r2);default:return n2}},getLanguage:function(e2){for(;e2;){var t4=n.exec(e2.className);if(t4)return t4[1].toLowerCase();e2=e2.parentElement}return"none"},setLanguage:function(e2,t4){e2.className=e2.className.replace(RegExp(n,"gi"),""),e2.classList.add("language-"+t4)},currentScript:function(){if(typeof document>"u")return null;if(document.currentScript&&document.currentScript.tagName==="SCRIPT")return document.currentScript;try{throw new Error}catch(r2){var e2=(/at [^(\\r\\n]*\\((.*):[^:]+:[^:]+\\)$/i.exec(r2.stack)||[])[1];if(e2){var n2=document.getElementsByTagName("script");for(var t4 in n2)if(n2[t4].src==e2)return n2[t4]}return null}},isActive:function(e2,n2,t4){for(var r2="no-"+n2;e2;){var a2=e2.classList;if(a2.contains(n2))return!0;if(a2.contains(r2))return!1;e2=e2.parentElement}return!!t4}},languages:{plain:r,plaintext:r,text:r,txt:r,extend:function(e2,n2){var t4=a.util.clone(a.languages[e2]);for(var r2 in n2)t4[r2]=n2[r2];return t4},insertBefore:function(e2,n2,t4,r2){var i2=(r2=r2||a.languages)[e2],l2={};for(var o2 in i2)if(i2.hasOwnProperty(o2)){if(o2==n2)for(var s2 in t4)t4.hasOwnProperty(s2)&&(l2[s2]=t4[s2]);t4.hasOwnProperty(o2)||(l2[o2]=i2[o2])}var u2=r2[e2];return r2[e2]=l2,a.languages.DFS(a.languages,(function(n3,t5){t5===u2&&n3!=e2&&(this[n3]=l2)})),l2},DFS:function e2(n2,t4,r2,i2){i2=i2||{};var l2=a.util.objId;for(var o2 in n2)if(n2.hasOwnProperty(o2)){t4.call(n2,o2,n2[o2],r2||o2);var s2=n2[o2],u2=a.util.type(s2);u2!=="Object"||i2[l2(s2)]?u2!=="Array"||i2[l2(s2)]||(i2[l2(s2)]=!0,e2(s2,t4,o2,i2)):(i2[l2(s2)]=!0,e2(s2,t4,null,i2))}}},plugins:{},highlightAll:function(e2,n2){a.highlightAllUnder(document,e2,n2)},highlightAllUnder:function(e2,n2,t4){var r2={callback:t4,container:e2,selector:\'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code\'};a.hooks.run("before-highlightall",r2),r2.elements=Array.prototype.slice.apply(r2.container.querySelectorAll(r2.selector)),a.hooks.run("before-all-elements-highlight",r2);for(var i2,l2=0;i2=r2.elements[l2++];)a.highlightElement(i2,n2===!0,r2.callback)},highlightElement:function(n2,t4,r2){var i2=a.util.getLanguage(n2),l2=a.languages[i2];a.util.setLanguage(n2,i2);var o2=n2.parentElement;o2&&o2.nodeName.toLowerCase()==="pre"&&a.util.setLanguage(o2,i2);var s2={element:n2,language:i2,grammar:l2,code:n2.textContent};function u2(e2){s2.highlightedCode=e2,a.hooks.run("before-insert",s2),s2.element.innerHTML=s2.highlightedCode,a.hooks.run("after-highlight",s2),a.hooks.run("complete",s2),r2&&r2.call(s2.element)}if(a.hooks.run("before-sanity-check",s2),(o2=s2.element.parentElement)&&o2.nodeName.toLowerCase()==="pre"&&!o2.hasAttribute("tabindex")&&o2.setAttribute("tabindex","0"),!s2.code)return a.hooks.run("complete",s2),void(r2&&r2.call(s2.element));if(a.hooks.run("before-highlight",s2),s2.grammar)if(t4&&e.Worker){var c2=new Worker(a.filename);c2.onmessage=function(e2){u2(e2.data)},c2.postMessage(JSON.stringify({language:s2.language,code:s2.code,immediateClose:!0}))}else u2(a.highlight(s2.code,s2.grammar,s2.language));else u2(a.util.encode(s2.code))},highlight:function(e2,n2,t4){var r2={code:e2,grammar:n2,language:t4};if(a.hooks.run("before-tokenize",r2),!r2.grammar)throw new Error(\'The language "\'+r2.language+\'" has no grammar.\');return r2.tokens=a.tokenize(r2.code,r2.grammar),a.hooks.run("after-tokenize",r2),i.stringify(a.util.encode(r2.tokens),r2.language)},tokenize:function(e2,n2){var t4=n2.rest;if(t4){for(var r2 in t4)n2[r2]=t4[r2];delete n2.rest}var a2=new s;return u(a2,a2.head,e2),o(e2,a2,n2,a2.head,0),(function(e3){for(var n3=[],t5=e3.head.next;t5!==e3.tail;)n3.push(t5.value),t5=t5.next;return n3})(a2)},hooks:{all:{},add:function(e2,n2){var t4=a.hooks.all;t4[e2]=t4[e2]||[],t4[e2].push(n2)},run:function(e2,n2){var t4=a.hooks.all[e2];if(t4&&t4.length)for(var r2,i2=0;r2=t4[i2++];)r2(n2)}},Token:i};function i(e2,n2,t4,r2){this.type=e2,this.content=n2,this.alias=t4,this.length=0|(r2||"").length}function l(e2,n2,t4,r2){e2.lastIndex=n2;var a2=e2.exec(t4);if(a2&&r2&&a2[1]){var i2=a2[1].length;a2.index+=i2,a2[0]=a2[0].slice(i2)}return a2}function o(e2,n2,t4,r2,s2,g2){for(var f2 in t4)if(t4.hasOwnProperty(f2)&&t4[f2]){var h2=t4[f2];h2=Array.isArray(h2)?h2:[h2];for(var d=0;d<h2.length;++d){if(g2&&g2.cause==f2+","+d)return;var v=h2[d],p=v.inside,m=!!v.lookbehind,y=!!v.greedy,k=v.alias;if(y&&!v.pattern.global){var x=v.pattern.toString().match(/[imsuy]*$/)[0];v.pattern=RegExp(v.pattern.source,x+"g")}for(var b=v.pattern||v,w=r2.next,A=s2;w!==n2.tail&&!(g2&&A>=g2.reach);A+=w.value.length,w=w.next){var P=w.value;if(n2.length>e2.length)return;if(!(P instanceof i)){var E,S=1;if(y){if(!(E=l(b,A,e2,m))||E.index>=e2.length)break;var L=E.index,O=E.index+E[0].length,C=A;for(C+=w.value.length;L>=C;)C+=(w=w.next).value.length;if(A=C-=w.value.length,w.value instanceof i)continue;for(var j=w;j!==n2.tail&&(C<O||typeof j.value=="string");j=j.next)S++,C+=j.value.length;S--,P=e2.slice(A,C),E.index-=A}else if(!(E=l(b,0,P,m)))continue;L=E.index;var N=E[0],_=P.slice(0,L),M=P.slice(L+N.length),W=A+P.length;g2&&W>g2.reach&&(g2.reach=W);var I=w.prev;if(_&&(I=u(n2,I,_),A+=_.length),c(n2,I,S),w=u(n2,I,new i(f2,p?a.tokenize(N,p):N,k,N)),M&&u(n2,w,M),S>1){var T={cause:f2+","+d,reach:W};o(e2,n2,t4,w.prev,A,T),g2&&T.reach>g2.reach&&(g2.reach=T.reach)}}}}}}function s(){var e2={value:null,prev:null,next:null},n2={value:null,prev:e2,next:null};e2.next=n2,this.head=e2,this.tail=n2,this.length=0}function u(e2,n2,t4){var r2=n2.next,a2={value:t4,prev:n2,next:r2};return n2.next=a2,r2.prev=a2,e2.length++,a2}function c(e2,n2,t4){for(var r2=n2.next,a2=0;a2<t4&&r2!==e2.tail;a2++)r2=r2.next;n2.next=r2,r2.prev=n2,e2.length-=a2}if(e.Prism=a,i.stringify=function e2(n2,t4){if(typeof n2=="string")return n2;if(Array.isArray(n2)){var r2="";return n2.forEach((function(n3){r2+=e2(n3,t4)})),r2}var i2={type:n2.type,content:e2(n2.content,t4),tag:"span",classes:["token",n2.type],attributes:{},language:t4},l2=n2.alias;l2&&(Array.isArray(l2)?Array.prototype.push.apply(i2.classes,l2):i2.classes.push(l2)),a.hooks.run("wrap",i2);var o2="";for(var s2 in i2.attributes)o2+=" "+s2+\'="\'+(i2.attributes[s2]||"").replace(/"/g,"&quot;")+\'"\';return"<"+i2.tag+\' class="\'+i2.classes.join(" ")+\'"\'+o2+">"+i2.content+"</"+i2.tag+">"},!e.document)return e.addEventListener&&(a.disableWorkerMessageHandler||e.addEventListener("message",(function(n2){var t4=JSON.parse(n2.data),r2=t4.language,i2=t4.code,l2=t4.immediateClose;e.postMessage(a.highlight(i2,a.languages[r2],r2)),l2&&e.close()}),!1)),a;var g=a.util.currentScript();function f(){a.manual||a.highlightAll()}if(g&&(a.filename=g.src,g.hasAttribute("data-manual")&&(a.manual=!0)),!a.manual){var h=document.readyState;h==="loading"||h==="interactive"&&g&&g.defer?document.addEventListener("DOMContentLoaded",f):window.requestAnimationFrame?window.requestAnimationFrame(f):window.setTimeout(f,16)}return a})(_self);typeof module2<"u"&&module2.exports&&(module2.exports=Prism3),typeof global<"u"&&(global.Prism=Prism3)}}),ui_chunk_client_exports={};__export(ui_chunk_client_exports,{default:()=>chunk}),module.exports=__toCommonJS(ui_chunk_client_exports);var kitText={listSeparator:"\\u3001"},kitUi={remove:"\\u79FB\\u9664 {label}",collapse:"\\u6536\\u8D77 {title}",expand:"\\u5C55\\u5F00 {title}",dismiss:"\\u5173\\u95ED\\u63D0\\u793A",loading:"\\u52A0\\u8F7D\\u4E2D",search:"\\u641C\\u7D22",clearSearch:"\\u6E05\\u9664\\u641C\\u7D22",metaSeparator:" \\xB7 ",syncLive:"\\u5DF2\\u540C\\u6B65",syncSyncing:"\\u540C\\u6B65\\u4E2D",syncStale:"\\u53EF\\u80FD\\u5DF2\\u8FC7\\u65F6",syncError:"\\u540C\\u6B65\\u5931\\u8D25"},kitTime={justNow:"\\u521A\\u521A",minutesAgo:"{count} \\u5206\\u949F\\u524D",hoursAgo:"{count} \\u5C0F\\u65F6\\u524D",todayAt:"\\u4ECA\\u5929 {time}",yesterdayAt:"\\u6628\\u5929 {time}",months:"1|2|3|4|5|6|7|8|9|10|11|12",monthDay:"{month}\\u6708{day}\\u65E5",yearMonthDay:"{year}\\u5E74{month}\\u6708{day}\\u65E5",seconds:"{count} \\u79D2",minutes:"{count} \\u5206",minutesSeconds:"{minutes} \\u5206 {seconds} \\u79D2",hours:"{count} \\u5C0F\\u65F6",hoursMinutes:"{hours} \\u5C0F\\u65F6 {minutes} \\u5206"},SOURCE_LANGUAGE="zh-CN",PLURAL_CATEGORIES=["zero","one","two","few","many","other"],META_SECTION="$meta",FORMS_LANGUAGE="$language",PLACEHOLDER=/\\{([A-Za-z_][A-Za-z0-9_]*)\\}/g,hasOwn=(value,name)=>Object.prototype.hasOwnProperty.call(value,name),isObject=value=>typeof value=="object"&&value!==null&&!Array.isArray(value);function isPluralForms(value){return!isObject(value)||!hasOwn(value,"other")?!1:Object.keys(value).every(name=>(PLURAL_CATEGORIES.includes(name)||name===FORMS_LANGUAGE)&&typeof value[name]=="string")}var isMessage=value=>typeof value=="string"||isPluralForms(value);function lookup(catalog,id){const at=id.indexOf(".");if(at<=0)return;const section=id.slice(0,at),name=id.slice(at+1);if(section===META_SECTION||!hasOwn(catalog,section))return;const entries=catalog[section];if(!isObject(entries)||!hasOwn(entries,name))return;const message=entries[name];return isMessage(message)?message:void 0}var pluralRules=new Map;function makePluralRule(language3){try{const rules=new Intl.PluralRules(language3);if(typeof rules.select(1)=="string")return count2=>rules.select(count2)}catch{}const primary=language3.split("-")[0].toLowerCase();return["zh","ja","ko","vi","th","id","ms","lo","my","km","yue"].includes(primary)?()=>"other":primary==="fr"||primary==="pt"?count2=>count2<2?"one":"other":count2=>count2===1?"one":"other"}function pluralCategory(language3,count2){if(!Number.isFinite(count2))return"other";let rule=pluralRules.get(language3);return rule||(rule=makePluralRule(language3),pluralRules.set(language3,rule)),rule(Math.abs(count2))}function pickForm(message,params,language3){if(typeof message=="string")return message;const category=pluralCategory(message[FORMS_LANGUAGE]??language3,Number(params?.count));return hasOwn(message,category)?message[category]:message.other}var paramText=value=>value==null?"":String(value);function format(message,params,language3=SOURCE_LANGUAGE){const text=pickForm(message,params,language3);return!params||text.indexOf("{")<0?text:text.replace(PLACEHOLDER,(whole,name)=>hasOwn(params,name)?paramText(params[name]):whole)}var LANGUAGE_SUBTAG=/^[A-Za-z0-9]{1,8}$/;function normalizeLanguage(tag){if(typeof tag!="string")return"";const parts=tag.trim().replace(/_/g,"-").split(/[.@]/)[0].split("-"),kept=[];for(const part of parts){if(part.length===1&&kept.length)break;if(!LANGUAGE_SUBTAG.test(part))return"";kept.push(part)}return!kept.length||!/^[A-Za-z]{2,3}$/.test(kept[0])||kept.length>4?"":kept.map((part,index)=>index===0?part.toLowerCase():part.length===4&&/^[A-Za-z]+$/.test(part)?part[0].toUpperCase()+part.slice(1).toLowerCase():part.length===2&&/^[A-Za-z]+$/.test(part)?part.toUpperCase():part.toLowerCase()).join("-")}function createTranslator(language3,layers,options={}){const showId=options.missing!=="empty",message=id=>{for(const layer of layers){const found=lookup(layer,id);if(found!==void 0)return found}};return{language:language3,hash:options.hash??"",t:(id,params)=>{const found=message(id);return found===void 0?showId?id:"":format(found,params,language3)},message}}var defaults=[{kitText}],sourceTranslator=createTranslator(SOURCE_LANGUAGE,defaults,{missing:"empty"}),bound=null,listeners=new Set;function addDefaults(catalog){defaults.includes(catalog)||defaults.push(catalog)}function bindTranslator(next){if(next!==bound){bound=next;for(const listener of Array.from(listeners))try{listener()}catch{}}}var translator=()=>bound??sourceTranslator,t=(id,params)=>(bound??sourceTranslator).t(id,params);function onTextChange(listener){return listeners.add(listener),()=>{listeners.delete(listener)}}var textSource=null;function followText(source){source&&(textSource=source,bindTranslator(source.translator()),source.subscribe(()=>bindTranslator(source.translator())))}var refreshText=()=>textSource?.refresh?.()??Promise.resolve(),joinList=items=>items.join(t("kitText.listSeparator")),t2=(id,params)=>t(id,params),import_client5=require("@getpaseo/plugin/client"),import_react_native26=require("@getpaseo/plugin/client/react-native"),import_react15=require("react"),import_react_native27=require("react-native"),badge=(label,color,ink="light")=>({label,color,ink}),BY_EXTENSION={ts:badge("TS","#3178C6"),tsx:badge("TSX","#3178C6"),mts:badge("TS","#3178C6"),cts:badge("TS","#3178C6"),js:badge("JS","#F7DF1E","dark"),jsx:badge("JSX","#F7DF1E","dark"),mjs:badge("JS","#F7DF1E","dark"),cjs:badge("JS","#F7DF1E","dark"),py:badge("PY","#3776AB"),pyi:badge("PY","#3776AB"),ipynb:badge("IPYNB","#F37626"),go:badge("GO","#00ADD8"),rs:badge("RS","#CE422B"),rb:badge("RB","#CC342D"),java:badge("JAVA","#E76F00"),kt:badge("KT","#7F52FF"),kts:badge("KT","#7F52FF"),swift:badge("SWIFT","#F05138"),dart:badge("DART","#0175C2"),c:badge("C","#5C6BC0"),h:badge("H","#5C6BC0"),cc:badge("C++","#00599C"),cpp:badge("C++","#00599C"),hpp:badge("C++","#00599C"),cs:badge("C#","#239120"),php:badge("PHP","#777BB4"),lua:badge("LUA","#2C2D72"),ex:badge("EX","#4B275F"),exs:badge("EX","#4B275F"),sh:badge("SH","#4EAA25"),bash:badge("SH","#4EAA25"),zsh:badge("SH","#4EAA25"),fish:badge("SH","#4EAA25"),ps1:badge("PS","#5391FE"),json:badge("JSON","#CB8A00","dark"),jsonc:badge("JSON","#CB8A00","dark"),jsonl:badge("JSONL","#CB8A00","dark"),yaml:badge("YAML","#CB171E"),yml:badge("YAML","#CB171E"),toml:badge("TOML","#9C4121"),xml:badge("XML","#0060AC"),md:badge("MD","#5B6B7F"),mdx:badge("MDX","#5B6B7F"),txt:badge("TXT","#6B7280"),csv:badge("CSV","#217346"),html:badge("HTML","#E34F26"),css:badge("CSS","#1572B6"),scss:badge("SCSS","#CC6699"),vue:badge("VUE","#42B883"),svelte:badge("SVELTE","#FF3E00"),sql:badge("SQL","#336791"),graphql:badge("GQL","#E10098"),proto:badge("PROTO","#4285F4"),png:badge("PNG","#8E44AD"),jpg:badge("JPG","#8E44AD"),jpeg:badge("JPG","#8E44AD"),gif:badge("GIF","#8E44AD"),webp:badge("WEBP","#8E44AD"),svg:badge("SVG","#FFB13B","dark"),lock:badge("LOCK","#6B7280"),env:badge("ENV","#ECD53F","dark")},BY_NAME={dockerfile:badge("DOCKER","#2496ED"),makefile:badge("MAKE","#6D8086"),"package.json":badge("NPM","#CB3837"),"cargo.toml":badge("CARGO","#CE422B"),"go.mod":badge("GO","#00ADD8"),".gitignore":badge("GIT","#F05032")};function fileBadge(path){if(!path)return null;const name=path.split(/[\\\\/]/).pop()?.toLowerCase()??"";if(BY_NAME[name])return BY_NAME[name];const dot=name.lastIndexOf(".");return dot<0||dot===name.length-1?null:BY_EXTENSION[name.slice(dot+1)]??null}var BY_COMMAND={git:badge("git","#F05032"),gh:badge("gh","#24292F"),npm:badge("npm","#CB3837"),npx:badge("npx","#CB3837"),pnpm:badge("pnpm","#F69220","dark"),yarn:badge("yarn","#2C8EBB"),bun:badge("bun","#FBF0DF","dark"),bunx:badge("bun","#FBF0DF","dark"),node:badge("node","#5FA04E"),deno:badge("deno","#70FFAF","dark"),tsc:badge("tsc","#3178C6"),vitest:badge("vitest","#6E9F18"),jest:badge("jest","#C21325"),eslint:badge("eslint","#4B32C3"),oxlint:badge("oxlint","#3CB4E7","dark"),prettier:badge("prettier","#F7B93E","dark"),playwright:badge("pw","#2EAD33"),python:badge("py","#3776AB"),python3:badge("py","#3776AB"),pip:badge("pip","#3776AB"),pip3:badge("pip","#3776AB"),uv:badge("uv","#DE5FE9"),pytest:badge("pytest","#0A9EDC"),cargo:badge("cargo","#CE422B"),rustc:badge("rustc","#CE422B"),go:badge("go","#00ADD8"),docker:badge("docker","#2496ED"),kubectl:badge("k8s","#326CE5"),helm:badge("helm","#0F1689"),terraform:badge("tf","#7B42BC"),make:badge("make","#6D8086"),curl:badge("curl","#0B5394"),wget:badge("wget","#0B5394"),ssh:badge("ssh","#4D4D4D"),psql:badge("psql","#336791"),sqlite3:badge("sqlite","#0F80CC"),redis:badge("redis","#DC382D"),paseo:badge("paseo","#0EA5E9"),claude:badge("claude","#D97757"),codex:badge("codex","#10A37F")},PREFIX_WORDS=new Set(["sudo","env","time","nohup","exec","command","timeout","nice","xargs"]);function commandBadge(command){if(!command)return null;for(const part of command.split(/&&|\\|\\||;|\\|/)){const words=part.trim().split(/\\s+/).filter(Boolean);let index=0;for(;index<words.length;){const word=words[index];if(/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)||PREFIX_WORDS.has(word)||word.startsWith("-")||/^\\d+[smhd]?$/.test(word)){index+=1;continue}break}const program=words[index];if(!program||program==="cd"||program==="pushd")continue;const name=program.split("/").pop().toLowerCase();return BY_COMMAND[name]??null}return null}function badgeInk(item){return item.ink==="dark"?"#111317":"#FFFFFF"}function asRecord(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)?value:null}function normalizeToolName(toolName){return toolName.trim().toLowerCase().replace(/^(?:functions|tools)\\./,"").replace(/^mcp__.*?__/,"").replace(/^mcp_/,"")}function isCodeModeTool(toolName){return normalizeToolName(toolName)==="execute"}function parseJsonInput(value){try{return JSON.parse(value)}catch{return}}function decodeInput(value){if(typeof value=="string"&&value.length<=1e6){const parsed=parseJsonInput(value);return asRecord(parsed)?parsed:void 0}return asRecord(value)??void 0}function extractCodeModeCode(input){const code=decodeInput(input)?.code;return typeof code=="string"&&code.trim()?code:void 0}function catalogItem(value){const record=asRecord(value),path=record?.path;if(typeof path!="string"||!path.trim())return null;const description=record?.description,signature=record?.signature;return{path,...typeof description=="string"&&description?{description}:{},...typeof signature=="string"&&signature?{signature}:{}}}function parseCodeModeCatalog(output){let decoded=output;if(typeof output=="string"&&output.length<=1e6){const parsed2=parseJsonInput(output);if(parsed2===void 0)return;decoded=parsed2}const record=asRecord(decoded),items=record?.items;if(!Array.isArray(items))return;const parsed=items.flatMap(entry=>{const item=catalogItem(entry);return item?[item]:[]});if(parsed.length===0)return;const remaining=record?.remaining;return{items:parsed.slice(0,50),...typeof remaining=="number"&&Number.isFinite(remaining)?{remaining}:{}}}var SPACE=/\\s/;function trimTrailingSlashes(value){let end=value.length;for(;end>0&&value.charCodeAt(end-1)===47;)end-=1;return value.slice(0,end)}function splitAtLine(text,marker,accept){const parts=[];let from=0,search=0;for(let at=text.indexOf(marker,search);at>=0;at=text.indexOf(marker,search)){search=at+1;let first=-1;for(let i=at;i>from&&SPACE.test(text[i-1]);i--)text[i-1]===`\n`&&(first=i-1);if(first<0)continue;let last=-1,spacesEnd=at+marker.length;for(;spacesEnd<text.length&&SPACE.test(text[spacesEnd]);spacesEnd++)text[spacesEnd]===`\n`&&(last=spacesEnd);last<0||accept&&!accept(last+1,spacesEnd)||(parts.push(text.slice(from,first)),from=last+1,search=from)}return parts.push(text.slice(from)),parts}function asRecord2(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)?value:null}function stringValue(value){return typeof value=="string"&&value.trim()?value:void 0}function fieldString(record,...keys){for(const key of keys){const value=stringValue(record?.[key]);if(value)return value}}function toolLeaf(name){return name.trim().toLowerCase().split(/__|[.:/]/).at(-1)??""}function exaToolKind(name){const normalized=name.trim().toLowerCase(),leaf=toolLeaf(normalized);return normalized.endsWith("web_search_exa")||leaf==="web_search_exa"?"search":normalized.endsWith("web_fetch_exa")||leaf==="web_fetch_exa"?"fetch":normalized.endsWith("exa_agent_run")||normalized.includes("exa")&&leaf==="agent_run"?"agent":normalized.endsWith("exa_read_agent_research_guide")||normalized.includes("exa")&&leaf==="read_agent_research_guide"?"research-guide":normalized.endsWith("exa_read_agent_schema_templates")||normalized.includes("exa")&&leaf==="read_agent_schema_templates"?"schema-templates":null}function exaToolSummary(kind,input){const record=asRecord2(input),value=kind==="search"?fieldString(record,"query"):kind==="fetch"?fieldString(record,"url"):fieldString(record,"prompt")??fieldString(record,"query");if(!value)return;const normalized=value.replace(/\\s+/g," ").trim();return normalized.length>180?`${normalized.slice(0,179)}\\u2026`:normalized}function textParts(value){if(typeof value=="string")return[value];const record=asRecord2(value);if(!record)return[];if(record.structuredContent!==void 0){const structuredText=textParts(record.structuredContent);if(structuredText.length>0)return structuredText}return typeof record.text=="string"?[record.text]:Array.isArray(record.content)?record.content.flatMap(part=>textParts(part)):[]}function exaOutputText(value){return textParts(value).filter(Boolean).join(`\n\n`).trim()||void 0}function resultFromRecord(record){const title=fieldString(record,"title","name");return title?{title,...fieldString(record,"url","link")?{url:fieldString(record,"url","link")}:{},...fieldString(record,"published","publishedDate","publishedAt")?{published:fieldString(record,"published","publishedDate","publishedAt")}:{},...fieldString(record,"author","authorName")?{author:fieldString(record,"author","authorName")}:{},...fieldString(record,"highlights","highlight","text")?{highlights:fieldString(record,"highlights","highlight","text")}:{}}:null}function structuredResults(value){const record=asRecord2(value);return record?record.structuredContent!==void 0?structuredResults(record.structuredContent):Array.isArray(record.results)?record.results.flatMap(result=>{const resultRecord=asRecord2(result),parsed=resultRecord?resultFromRecord(resultRecord):null;return parsed?[parsed]:[]}):[]:[]}function resultBlocks(text){return splitAtLine(text,"---",(end,spacesEnd)=>end===spacesEnd&&text.startsWith("Title:",end)&&/\\s/.test(text[end+6]??""))}function parseTextResults(text){return resultBlocks(text).map(block=>{const title=block.match(/^Title:\\s*(.+)$/m)?.[1]?.trim();if(!title)return null;const url=block.match(/^URL:\\s*(.+)$/m)?.[1]?.trim(),published=block.match(/^Published:\\s*(.+)$/m)?.[1]?.trim(),author=block.match(/^Author:\\s*(.+)$/m)?.[1]?.trim(),highlights=block.match(/^Highlights:\\s*\\n([\\s\\S]*)$/m)?.[1]?.trim();return{title,...url?{url}:{},...published?{published}:{},...author?{author}:{},...highlights?{highlights}:{}}}).filter(result=>result!==null)}function parseExaSearchResults(value){const structured=structuredResults(value);if(structured.length>0)return structured;const text=exaOutputText(value);return text?parseTextResults(text):[]}function asRecord3(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)?value:null}function stringValue2(value){return typeof value=="string"&&value.trim()?value:void 0}function fieldString2(record,...keys){for(const key of keys){const value=stringValue2(record?.[key]);if(value)return value}}function toolLeaf2(name){return name.trim().toLowerCase().split(/__|[.:/]/).at(-1)??""}function githubToolKind(name){const normalized=name.trim().toLowerCase(),leaf=toolLeaf2(normalized);return leaf==="github_actions_get"||leaf==="actions_get"?"actions-get":leaf==="github_actions_list"||leaf==="actions_list"?"actions-list":leaf==="github_actions_run_trigger"||leaf==="actions_run_trigger"?"actions-run":leaf==="github_get_file_contents"||leaf==="get_file_contents"?"file":leaf==="github_get_job_logs"||leaf==="get_job_logs"?"job-logs":leaf==="github_pull_request_read"||leaf==="pull_request_read"?"pull-request":leaf==="github_search_code"||leaf==="search_code"?"search-code":leaf==="github_search_repositories"||leaf==="search_repositories"?"search-repositories":null}function compactText(value,maxLength=180){const normalized=value.replace(/\\s+/g," ").trim();if(normalized)return normalized.length>maxLength?`${normalized.slice(0,maxLength-1)}\\u2026`:normalized}function githubToolSummary(kind,input){const record=asRecord3(input);switch(kind){case"search-repositories":case"search-code":return compactText(fieldString2(record,"query")??"");case"file":return fieldString2(record,"path");case"pull-request":{const owner=fieldString2(record,"owner"),repo=fieldString2(record,"repo"),pullNumber=record?.pullNumber;return owner&&repo&&(typeof pullNumber=="number"||typeof pullNumber=="string")?`${owner}/${repo}#${pullNumber}`:owner&&repo?`${owner}/${repo}`:void 0}case"actions-get":case"actions-list":case"actions-run":case"job-logs":return fieldString2(record,"workflowId","workflow_id","workflow","resource_id")??fieldString2(record,"runId","run_id")??fieldString2(record,"jobId","job_id")}}var MAX_EMBEDDED_JSON_CHARS=1e5,MAX_EMBEDDED_JSON_STARTS=8;function parseEmbeddedJson(value){try{return JSON.parse(value)}catch{if(value.length>MAX_EMBEDDED_JSON_CHARS)return;let starts=0;for(const match of value.matchAll(/\\{|\\[/g)){const offset=match.index;if(offset!==void 0){if(++starts>MAX_EMBEDDED_JSON_STARTS)break;try{return JSON.parse(value.slice(offset))}catch{continue}}}return}}function githubOutputText(value){if(typeof value=="string")return value.trim()||void 0;const record=asRecord3(value);if(record){if(record.structuredContent!==void 0)return githubOutputText(record.structuredContent);if(typeof record.text=="string")return record.text.trim()||void 0;if(Array.isArray(record.content))return record.content.map(part=>asRecord3(part)?.text).filter(part=>!!part).join(`\n\n`).trim()||void 0}}function githubOutputValue(value){const record=asRecord3(value);if(!record)return typeof value=="string"?parseEmbeddedJson(value)??value:value;if(record.structuredContent!==void 0)return githubOutputValue(record.structuredContent);if(Array.isArray(record.content)){const text=githubOutputText(record);if(text)return parseEmbeddedJson(text)??text}return value}var INLINE_TOKEN_PATTERN=/(\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__|`[^`\\n]+`|\\*[^*\\n]+\\*|_[^_\\n]+_)/g;function parseInlineMarkdown(text){const parts=[];let cursor=0,match;for(;(match=INLINE_TOKEN_PATTERN.exec(text))!==null;){const start=match.index,token=match[0];start>cursor&&parts.push({type:"text",text:text.slice(cursor,start)}),token.startsWith("**")||token.startsWith("__")?parts.push({type:"bold",text:token.slice(2,-2)}):token.startsWith("`")&&token.endsWith("`")?parts.push({type:"code",text:token.slice(1,-1)}):parts.push({type:"italic",text:token.slice(1,-1)}),cursor=start+token.length}return cursor<text.length&&parts.push({type:"text",text:text.slice(cursor)}),parts}var HEADING=/^\\s{0,3}#{1,6}\\s+(\\S.*|[^\\S\\n\\r\\u2028\\u2029])$/,UNORDERED=/^\\s*[-*+]\\s+(\\S.*|[^\\S\\n\\r\\u2028\\u2029])$/,ORDERED=/^\\s*(\\d+)[.)]\\s+(\\S.*|[^\\S\\n\\r\\u2028\\u2029])$/;function parseReasoningMarkdown(text){const blocks=[],lines=text.split(`\n`);let codeLines=null,codeLanguage;for(const line of lines){const trimmed=line.trim();if(codeLines!==null){trimmed.startsWith("```")?(blocks.push({type:"code",...codeLanguage?{language:codeLanguage}:{},text:codeLines.join(`\n`)}),codeLines=null,codeLanguage=void 0):codeLines.push(line);continue}if(trimmed.startsWith("```")){const language3=trimmed.slice(3).trim();codeLines=[],codeLanguage=language3||void 0;continue}if(trimmed.length===0){blocks.push({type:"spacer"});continue}const heading=line.match(HEADING);if(heading){blocks.push({type:"heading",text:heading[1]??""});continue}const unordered=line.match(UNORDERED);if(unordered){blocks.push({type:"unordered",text:unordered[1]??""});continue}const ordered=line.match(ORDERED);if(ordered){blocks.push({type:"ordered",marker:`${ordered[1]}.`,text:ordered[2]??""});continue}if(trimmed.startsWith(">")){blocks.push({type:"quote",text:trimmed.slice(1).trimStart()});continue}blocks.push({type:"paragraph",text:line})}return codeLines!==null&&blocks.push({type:"code",...codeLanguage?{language:codeLanguage}:{},text:codeLines.join(`\n`)}),blocks}function asRecord4(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)?value:null}function parseOmpFindResult(input,output){const args=asRecord4(input),envelope=asRecord4(output),details=asRecord4(envelope?.details);if(!args&&!envelope)return null;const keywords=Array.isArray(args?.grep_keywords)?args.grep_keywords.filter(value=>typeof value=="string"):Array.isArray(details?.keywords)?details.keywords.filter(value=>typeof value=="string"):[],hits=Array.isArray(details?.hits)?details.hits.flatMap(value=>{const hit=asRecord4(value),path=hit?.rel??hit?.path;if(typeof path!="string")return[];const ranges=Array.isArray(hit?.ranges)?hit.ranges.flatMap(value2=>{const range=asRecord4(value2);return typeof range?.start!="number"||typeof range.end!="number"?[]:[{start:range.start,end:range.end,...typeof range.snippet=="string"?{snippet:range.snippet}:{}}]}):[];return[{path,...typeof hit?.contentScore=="number"?{score:hit.contentScore}:{},ranges}]}):[];return{...typeof args?.query=="string"?{query:args.query}:typeof details?.query=="string"?{query:details.query}:{},keywords,...typeof args?.path=="string"?{path:args.path}:typeof details?.scopePath=="string"?{path:details.scopePath}:{},hits,...typeof details?.listed=="number"?{listed:details.listed}:{},...typeof details?.judged=="number"?{judged:details.judged}:{},...typeof details?.filesRead=="number"?{filesRead:details.filesRead}:{}}}function isOmpFindTool(toolName){return/^(?:(?:functions|tools)\\.)?find$/i.test(toolName.trim())}function normalizeToolName2(name){return name.trim().toLowerCase()}function getPaseoToolLeafName(name){const normalized=normalizeToolName2(name);if(normalized.includes("__")){const segments=normalized.split("__").filter(s=>s.length>0);return segments.length>=3&&segments[0]==="mcp"&&(segments[1]==="paseo"||segments[1].startsWith("paseo_"))?segments.slice(2).join("__"):null}if(normalized.includes(".")){const firstSegment=normalized.split(".")[0];return firstSegment==="paseo"||firstSegment.startsWith("paseo_")?normalized.split(".").slice(1).join("."):null}return null}var import_plugin=require("@getpaseo/plugin"),import_zod=require("zod"),MAX_READ_IMAGE_BYTES=3*1024*1024,IMAGE_EXTENSIONS=new Set(["png","jpg","jpeg","gif","webp","bmp"]),readImageRpc=(0,import_plugin.defineRpc)({name:"read-image",input:import_zod.z.object({filePath:import_zod.z.string().min(1).max(4096),agentId:import_zod.z.string().min(1).max(256)}),output:import_zod.z.object({status:import_zod.z.enum(["ok","not-found","not-image","too-large","unavailable","outside"]),data:import_zod.z.string().optional(),mimeType:import_zod.z.string().optional(),byteSize:import_zod.z.number().int().nonnegative().optional()})});function isImageFilePath(filePath){if(!filePath)return!1;const name=filePath.split(/[\\\\/]/).at(-1)??"",dot=name.lastIndexOf(".");return dot<=0||dot===name.length-1?!1:IMAGE_EXTENSIONS.has(name.slice(dot+1).toLowerCase())}function parseReadImagePlaceholder(content){return content?content.match(/^\\s*Read image file \\[([A-Za-z0-9.+-]+\\/[A-Za-z0-9.+-]+)\\]/)?.[1]??null:null}function shouldAttemptImageLoad(filePath,content){return isImageFilePath(filePath)||parseReadImagePlaceholder(content)!==null}var EXTENSION_LANGUAGE={c:"c",cc:"cpp",cpp:"cpp",cs:"csharp",css:"css",go:"go",h:"c",hpp:"cpp",html:"html",htm:"html",java:"java",js:"javascript",json:"json",jsonc:"json",jsx:"javascript",less:"css",md:"markdown",mdx:"markdown",mjs:"javascript",mts:"typescript",py:"python",pyw:"python",rs:"rust",sass:"css",scss:"css",sh:"bash",sql:"sql",ts:"typescript",tsx:"typescript",vue:"html",wasm:"wasm",xml:"xml",yaml:"yaml",yml:"yaml",zsh:"bash"},FILE_ICON_BY_EXTENSION={c:"FileCode2",cc:"FileCode2",cpp:"FileCode2",cs:"FileCode2",css:"FileType",go:"FileCode2",h:"FileCode2",hpp:"FileCode2",html:"FileCode2",java:"FileCode2",js:"FileCode2",json:"FileJson",jsonc:"FileJson",jsx:"FileCode2",less:"FileType",md:"FileText",mdx:"FileText",mjs:"FileCode2",mts:"FileCode2",py:"FileCode2",pyw:"FileCode2",rs:"FileCode2",sass:"FileType",scss:"FileType",sh:"FileTerminal",sql:"FileCode2",ts:"FileCode2",tsx:"FileCode2",vue:"FileCode2",wasm:"FileCog",xml:"FileCode2",yaml:"FileCog",yml:"FileCog",zsh:"FileTerminal"},FILE_ICON_BY_NAME={".env":"FileKey2",".gitignore":"FileCog",dockerfile:"FileCog","package-lock.json":"FileJson","package.json":"FileJson","pnpm-lock.yaml":"FileCog","yarn.lock":"FileKey2"};function compactText2(value,maxLength=180){const normalized=value.replace(/\\s+/g," ").trim();if(normalized)return normalized.length>maxLength?`${normalized.slice(0,maxLength-1)}\\u2026`:normalized}var HEADER_SUMMARY_FIT=60;function normalizeSpace(value){return value.replace(/\\s+/g," ").trim()}function notInHeader(value,headerSummary){if(value==null||!headerSummary)return value??void 0;const text=normalizeSpace(String(value));if(!text)return value;const shown=normalizeSpace(headerSummary),escaped=text.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&");return new RegExp(`(^|[^\\\\w])${escaped}($|[^\\\\w])`,"i").test(shown)?typeof value=="string"&&value.trim().includes(`\n`)||shown.length>HEADER_SUMMARY_FIT?value:void 0:value}function textAfterHeader(text,headerSummary){const trimmed=text?.trim();if(!trimmed)return;if(!headerSummary)return trimmed;const lines=trimmed.split(`\n`),firstIndex=lines.findIndex(line=>line.trim()),first=lines[firstIndex]??"",shown=normalizeSpace(headerSummary);return normalizeSpace(first)!==shown||shown.length>HEADER_SUMMARY_FIT?trimmed:lines.slice(firstIndex+1).join(`\n`).trim()||void 0}function fileName(filePath){return filePath.split(/[\\\\/]/).at(-1)?.toLowerCase()??filePath.toLowerCase()}function extensionFromPath(filePath){if(!filePath)return null;const name=fileName(filePath),dot=name.lastIndexOf(".");return dot<=0||dot===name.length-1?null:name.slice(dot+1)}function languageForFilePath(filePath){const extension=extensionFromPath(filePath);return extension?EXTENSION_LANGUAGE[extension]:void 0}function fileIconForPath(filePath){if(!filePath)return"File";if(/[/\\\\]$/.test(filePath.trim()))return"Folder";const name=fileName(filePath),byName=FILE_ICON_BY_NAME[name];if(byName)return byName;const extension=extensionFromPath(filePath);return extension&&FILE_ICON_BY_EXTENSION[extension]||"File"}function relativeToRoot(filePath,root){if(!filePath||!root)return filePath;const normalizedRoot=trimTrailingSlashes(root);return normalizedRoot?normalizedRoot==="/"?filePath.startsWith("/")&&filePath.slice(1)||filePath:filePath===normalizedRoot?filePath.split("/").pop()??filePath:filePath.startsWith(`${normalizedRoot}/`)?filePath.slice(normalizedRoot.length+1):filePath:filePath}var PASEO_TOOL_LABELS={speak:"Speak",create_workspace:"Create Workspace",list_workspaces:"List Workspaces",archive_workspace:"Archive Workspace",create_agent:"Create Agent",send_agent_prompt:"Send Agent Prompt",get_agent_status:"Get Agent Status",list_agents:"List Agents",cancel_agent:"Cancel Agent Run",archive_agent:"Archive Agent",kill_agent:"Kill Agent",update_agent:"Update Agent",rename_workspace:"Rename Workspace",list_workspace_scripts:"List Workspace Scripts",start_workspace_script:"Start Workspace Script",stop_workspace_script:"Stop Workspace Script",list_terminals:"List Terminals",create_terminal:"Create Terminal",kill_terminal:"Kill Terminal",capture_terminal:"Capture Terminal",send_terminal_keys:"Send Terminal Keys",create_schedule:"Create Schedule",create_heartbeat:"Create Heartbeat",delete_heartbeat:"Delete Heartbeat",list_schedules:"List Schedules",inspect_schedule:"Inspect Schedule",pause_schedule:"Pause Schedule",resume_schedule:"Resume Schedule",delete_schedule:"Delete Schedule",update_schedule:"Update Schedule",schedule_logs:"Schedule Logs",run_schedule_once:"Run Schedule Once",list_providers:"List Providers",list_models:"List Models",list_profiles:"List Agent Profiles",inspect_provider:"Inspect Provider",get_agent_activity:"Get Agent Activity",set_agent_mode:"Set Agent Session Mode",list_pending_permissions:"List Pending Permissions",respond_to_permission:"Respond to Permission",browser_list_tabs:"List Browser Tabs",browser_new_tab:"Create Browser Tab",browser_snapshot:"Snapshot Browser Page",browser_click:"Click Browser Element",browser_fill:"Fill Browser Element",browser_wait:"Wait for Browser Condition",browser_type:"Type into Browser",browser_keypress:"Press Browser Key",browser_navigate:"Navigate Browser",browser_back:"Browser Back",browser_forward:"Browser Forward",browser_reload:"Browser Reload",browser_screenshot:"Capture Browser Screenshot",browser_upload:"Upload Files in Browser",browser_hover:"Hover Browser Element",browser_select:"Select Browser Option",browser_drag:"Drag Browser Element",browser_logs:"Read Browser Logs",browser_evaluate:"Evaluate Browser JavaScript",browser_scroll:"Scroll Browser",browser_resize:"Resize Browser Viewport",browser_close_tab:"Close Browser Tab"};function isRecord(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)}function stringField(value,key){if(!isRecord(value))return;const field=value[key];return typeof field=="string"&&field.trim()?field:void 0}var ASK_TOOLS=new Set(["ask","askuserquestion","ask_user_question","ask_user","request_user_input","request_user_input_async","question"]);function isAskTool(toolName){const normalized=toolName.trim().toLowerCase().replace(/^(?:functions|tools)\\./,"").replace(/^mcp__.*?__/,"").replace(/^mcp_/,"");return ASK_TOOLS.has(normalized)}function askQuestionOf(value){if(!isRecord(value))return null;const question=stringField(value,"question");if(!question)return null;const options=Array.isArray(value.options)?value.options.map(option=>typeof option=="string"?option:stringField(option,"label")??"").filter(Boolean):[],header=stringField(value,"header");return{...header?{header}:{},question,options,multiSelect:value.multiSelect===!0}}function askContent(detail){if(detail.type==="unknown"){const input=decodeToolInput(detail.input),questions=Array.isArray(input?.questions)?input.questions.map(askQuestionOf).filter(entry=>entry!==null):[],output=unwrapProviderOutput(detail.output),answers=[];if(typeof output=="string")for(const match of output.slice(0,MAX_FORMAT_CHARS).matchAll(/"([^"\\n]{1,500})"="([^"\\n]{0,2000})"/g))answers.push({question:match[1],answer:match[2]});return{questions,answers}}if(detail.type==="plain_text"&&detail.text){const[asked="",answered=""]=splitAtLine(detail.text.slice(0,MAX_FORMAT_CHARS),"Answers:"),questions=[];for(const block of asked.split(/\\n\\s*\\n/)){const[first="",...rest]=block.split(`\n`).map(line=>line.trim()).filter(Boolean);if(!first)continue;const split=/^([^:\uFF1A]{1,80})[:\uFF1A]\\s*(\\S.*|[^\\S\\n\\r\\u2028\\u2029])$/.exec(first),options=rest.find(line=>/^Options:/i.test(line))?.replace(/^Options:\\s*/i,"").split(/,\\s*/).filter(Boolean)??[];questions.push({...split?{header:split[1]}:{},question:split?split[2]:first,options,multiSelect:!1})}const answers=answered.split(`\n`).map(line=>line.trim()).filter(Boolean).map(line=>{const pair=/^([^:]{1,80}):\\s*(\\S.*|)$/.exec(line);return pair?{question:pair[1],answer:pair[2]}:{question:null,answer:line}});return{questions,answers}}return{questions:[],answers:[]}}function paseoToolLeafName(toolName){const namespacedLeafName=getPaseoToolLeafName(toolName);if(namespacedLeafName&&PASEO_TOOL_LABELS[namespacedLeafName])return namespacedLeafName;const directLeafName=toolName.trim().toLowerCase().match(/^(?:mcp_)?paseo_(.+)$/)?.[1];return directLeafName&&PASEO_TOOL_LABELS[directLeafName]?directLeafName:null}function paseoToolSummary(toolName,input){const leafName=paseoToolLeafName(toolName);if(!leafName)return;const title=stringField(input,"title"),provider=stringField(input,"provider"),agentId=stringField(input,"agentId"),workspaceId=stringField(input,"workspaceId"),browserId=stringField(input,"browserId"),url=stringField(input,"url"),prompt=stringField(input,"prompt")??stringField(input,"initialPrompt");if(leafName==="create_agent"&&title&&provider)return t2("sharedPresentation.agentProvider",{title,provider});if(leafName==="create_agent"&&title)return title;if(leafName==="send_agent_prompt"&&agentId||leafName.endsWith("_agent")&&agentId)return agentId;if(leafName.includes("workspace")&&workspaceId)return workspaceId;if(leafName.startsWith("browser_")&&url)return url;if(leafName.startsWith("browser_")&&browserId)return browserId;if((leafName==="create_schedule"||leafName==="create_heartbeat")&&prompt)return compactText2(prompt);if(leafName==="list_models"&&provider)return provider;if(leafName==="speak"&&stringField(input,"text"))return compactText2(stringField(input,"text"))}function normalizePiToolName(toolName){return toolName.trim().toLowerCase().replace(/^(?:functions|tools)\\./,"").replace(/^mcp__.*?__/,"").replace(/^mcp_/,"")}function isSubagentSupervisorTool(toolName){return normalizePiToolName(toolName)==="subagent_supervisor"}function isBgWaitTool(toolName){return normalizePiToolName(toolName)==="bg_wait"}function isOmpWaitTool(toolName){return normalizePiToolName(toolName)==="wait"}function isTodoTool(toolName){return normalizePiToolName(toolName)==="todo"}function isSkillTool(toolName){return normalizePiToolName(toolName)==="skill"}function isOpencodeSubagentTool(toolName){const normalized=normalizePiToolName(toolName);return normalized==="subagent"||normalized==="task"}function parseOpencodeSubagentInput(input){const record=decodeToolInput(input)??{},agent=stringField(record,"agent")??stringField(record,"subagent_type")??stringField(record,"subAgentType")??stringField(record,"subagent")??stringField(record,"type"),description=stringField(record,"description"),prompt=stringField(record,"prompt")??stringField(record,"task")??stringField(record,"text"),model=stringField(record,"model"),sessionID=stringField(record,"sessionID")??stringField(record,"sessionId")??stringField(record,"task_id")??stringField(record,"taskId"),background=typeof record.background=="boolean"?record.background:void 0;return{...agent?{agent}:{},...description?{description}:{},...prompt?{prompt}:{},...model?{model}:{},...sessionID?{sessionID}:{},...background!==void 0?{background}:{}}}function opencodeSubagentTextFromValue(value,depth=0){if(!(depth>4)){if(typeof value=="string"){const trimmed=value.trim();return trimmed||void 0}if(Array.isArray(value)){const parts=value.flatMap(entry=>{if(typeof entry=="string"&&entry.trim())return[entry.trim()];if(isRecord(entry)&&entry.type==="text"&&typeof entry.text=="string"&&entry.text.trim())return[entry.text.trim()];const nested=opencodeSubagentTextFromValue(entry,depth+1);return nested?[nested]:[]});return parts.length>0?parts.join(`\n`):void 0}if(isRecord(value))for(const key of["output","text","result","content","response","body","message"]){const nested=opencodeSubagentTextFromValue(value[key],depth+1);if(nested)return nested}}}function parseSubagentEnvelopeTag(text){const open=/<subagent\\s+/i.exec(text),attrsStart=open?open.index+open[0].length:-1,close=open?text.indexOf(">",attrsStart):-1;if(close<0||close===attrsStart)return;const attrs=text.slice(attrsStart,close),attr=name=>attrs.match(new RegExp(`${name}\\\\s*=\\\\s*["\']([^"\']+)["\']`,"i"))?.[1]?.trim()||void 0,sessionID=attr("sessionID")??attr("sessionId")??attr("session_id"),status=attr("state")??attr("status"),description=attr("description"),afterOpen=text.slice(close+1),closeIndex=afterOpen.search(/<\\/subagent\\s*>/i),body=(closeIndex>=0?afterOpen.slice(0,closeIndex):afterOpen).trim();return{...sessionID?{sessionID}:{},...status?{status}:{},...description?{description}:{},...body?{text:body}:{}}}function backgroundSessionOf(text){const lead=/working in the background\\s*\\(sessionID:/gi;for(let match=lead.exec(text);match;match=lead.exec(text)){const close=text.indexOf(")",lead.lastIndex);if(close<0)return;if(close>lead.lastIndex)return text.slice(lead.lastIndex,close).trim()}}function parseOpencodeSubagentOutput(output){if(typeof output=="string"){const trimmed=output.trim();if(!trimmed)return;const envelope=parseSubagentEnvelopeTag(trimmed);if(envelope&&(envelope.sessionID||envelope.status||envelope.text))return envelope;const backgroundSession=backgroundSessionOf(trimmed);if(backgroundSession!==void 0)return{sessionID:backgroundSession,status:"running",text:trimmed,isBackgroundNotice:!0};const sessionMatch=trimmed.match(/\\bsessionID:\\s*(ses_[A-Za-z0-9]+)/i);return{...sessionMatch?.[1]?{sessionID:sessionMatch[1]}:{},text:trimmed}}if(!isRecord(output))return;const sessionID=stringField(output,"sessionID")??stringField(output,"sessionId")??stringField(output,"session_id")??stringField(output,"task_id")??stringField(output,"taskId"),status=stringField(output,"status")??stringField(output,"state"),description=stringField(output,"description"),text=opencodeSubagentTextFromValue(output);if(!sessionID&&!status&&!description&&!text)return;const backgroundNotice=text?/working in the background/i.test(text):!1;return{...sessionID?{sessionID}:{},...status?{status}:{},...description?{description}:{},...text?{text}:{},...backgroundNotice?{isBackgroundNotice:!0}:{}}}function opencodeSubagentSummary(input,output){const parsed=parseOpencodeSubagentInput(input);if(parsed.description)return compactText2(parsed.description);const outputParsed=parseOpencodeSubagentOutput(output);if(outputParsed?.description)return compactText2(outputParsed.description);if(parsed.agent)return compactText2(parsed.agent);if(parsed.prompt)return compactText2(parsed.prompt.split(`\n`)[0]??"",120)}function skillNameFromRecord(record){for(const key of["name","id","skill","skillName","skillId"]){const field=record[key];if(typeof field=="string"&&field.trim())return field.trim()}}function skillNameFromOutput(output){return typeof output!="string"?void 0:output.match(/<skill_content\\s+name=["\']([^"\']+)["\']/i)?.[1]?.trim()||void 0}function parseSkillName(input){const record=decodeToolInput(input);if(record)return skillNameFromRecord(record)}function skillNameForDetail(detail){if(detail.type==="plain_text"){const label=detail.label?.trim();return label||void 0}if(detail.type==="unknown")return parseSkillName(detail.input)??skillNameFromOutput(detail.output)??(isRecord(detail.output)&&typeof detail.output.output=="string"?skillNameFromOutput(detail.output.output):void 0)}function decodeToolInput(value){if(typeof value=="string"){const parsed=parseJsonString(value);return isRecord(parsed)?parsed:void 0}return isRecord(value)?value:void 0}function parseSubagentSupervisorInput(input){const record=decodeToolInput(input)??{},action=typeof record.action=="string"&&record.action.trim()?record.action.trim().toLowerCase():"",replyTo=typeof record.replyTo=="string"&&record.replyTo.trim()?record.replyTo:void 0,message=typeof record.message=="string"&&record.message.trim()?record.message:void 0,to=typeof record.to=="string"&&record.to.trim()?record.to:void 0;return{action,...replyTo?{replyTo}:{},...message?{message}:{},...to?{to}:{}}}function parseBgWaitInput(input){const record=decodeToolInput(input)??{},id=typeof record.id=="string"&&record.id.trim()?record.id:void 0,all=typeof record.all=="boolean"?record.all:void 0,nonBlocking=typeof record.nonBlocking=="boolean"?record.nonBlocking:void 0,timeoutMs=typeof record.timeoutMs=="number"&&Number.isFinite(record.timeoutMs)&&record.timeoutMs>0?record.timeoutMs:void 0,stopOnAttention=typeof record.stopOnAttention=="boolean"?record.stopOnAttention:void 0;return{...id?{id}:{},...all!==void 0?{all}:{},...nonBlocking!==void 0?{nonBlocking}:{},...timeoutMs!==void 0?{timeoutMs}:{},...stopOnAttention!==void 0?{stopOnAttention}:{}}}function extractPiToolText(output){if(typeof output=="string")return output.trim()?{text:output}:void 0;if(!isRecord(output))return;const content=output.content;if(typeof content=="string"&&content.trim())return{text:content,...isRecord(output.details)?{details:output.details}:{}};if(Array.isArray(content)){const texts=content.flatMap(item=>isRecord(item)&&item.type==="text"&&typeof item.text=="string"&&item.text.trim()?[item.text]:[]);if(texts.length>0)return{text:texts.join(`\n`),...isRecord(output.details)?{details:output.details}:{}}}if(isRecord(output.details))return{text:"",details:output.details}}function shortRunId(value,length=8){if(!value)return;const trimmed=value.trim();if(trimmed)return trimmed.length>length?trimmed.slice(0,length):trimmed}function formatWaitTimeout(timeoutMs){if(timeoutMs===void 0)return;const seconds=Math.round(timeoutMs/1e3);if(seconds<60)return t2("timing.seconds",{count:seconds});const minutes=Math.floor(seconds/60),remainder=seconds%60;if(minutes<60)return remainder===0?t2("timing.minutes",{count:minutes}):t2("timing.minutesSeconds",{minutes,seconds:remainder});const hours=Math.floor(minutes/60),minuteRemainder=minutes%60;return minuteRemainder===0?t2("timing.hours",{count:hours}):t2("timing.hoursMinutes",{hours,minutes:minuteRemainder})}function subagentSupervisorSummary(input,output){const parsed=parseSubagentSupervisorInput(input);if(parsed.action==="reply"){const details=extractPiToolText(output)?.details,agent=typeof details?.agent=="string"&&details.agent.trim()?details.agent:void 0,messageSummary=parsed.message?compactText2(parsed.message,120):void 0,replyTarget=shortRunId(parsed.replyTo??(typeof details?.replyTo=="string"?details.replyTo:void 0)),parts=[agent,messageSummary??(replyTarget?t2("sharedPresentation.replyTarget",{target:replyTarget}):void 0)].filter(Boolean);return parts.length>0?parts.join(t2("sharedPresentation.inlineSeparator")):replyTarget?t2("sharedPresentation.replyTarget",{target:replyTarget}):void 0}if(parsed.action==="pending"||parsed.action==="list"||parsed.action==="status"){const envelope=extractPiToolText(output);return envelope?.text?compactText2(envelope.text.split(`\n`)[0]??"",120):parsed.to?t2("sharedPresentation.replyTarget",{target:parsed.to}):void 0}return parsed.message?compactText2(parsed.message,120):void 0}function stringList(value){return Array.isArray(value)?value.filter(entry=>typeof entry=="string"&&entry.trim().length>0):[]}function parseBgWaitOutput(output){const envelope=extractPiToolText(output);if(!envelope)return;const details=envelope.details??{},wait=isRecord(details.wait)?details.wait:void 0,waitReason=typeof wait?.reason=="string"?wait.reason:void 0,timedOut=typeof wait?.timedOut=="boolean"?wait.timedOut:void 0,activeRunIds=wait?stringList(wait.activeRunIds):[],activeProviderItems=Array.isArray(wait?.activeProviderItems)?wait.activeProviderItems.flatMap(item=>isRecord(item)&&typeof item.provider=="string"&&typeof item.id=="string"?[{provider:item.provider,id:item.id}]:[]):[],completions=(Array.isArray(details.completions)?details.completions:[]).flatMap(completion=>{if(!isRecord(completion)||typeof completion.runId!="string")return[];const runId=completion.runId,results=Array.isArray(completion.results)?completion.results:[];return results.length===0?[{runId}]:results.map(result=>{if(!isRecord(result))return{runId};const agent=typeof result.agent=="string"?result.agent:void 0,success=typeof result.success=="boolean"?result.success:void 0;return{runId,...agent?{agent}:{},...success!==void 0?{success}:{}}})}),lines=envelope.text.split(`\n`),headline=lines[0]?.trim()?lines[0].trim():void 0,body=lines.length>1&&lines.slice(1).join(`\n`).trim()?lines.slice(1).join(`\n`).trim():void 0;return{text:envelope.text,...headline?{headline}:{},...body?{body}:{},...waitReason?{waitReason}:{},...timedOut!==void 0?{timedOut}:{},activeRunIds,activeProviderItems,completions}}function bgWaitSummary(input,output){const parsed=parseBgWaitInput(input),summary=parseBgWaitOutput(output),target=parsed.id?shortRunId(parsed.id):parsed.all===!0?t2("sharedWait.allRuns"):t2("sharedWait.nextRun"),timeout=formatWaitTimeout(parsed.timeoutMs),header=[target,timeout?t2("sharedWait.timeout",{duration:timeout}):void 0].filter(Boolean).join(t2("sharedPresentation.inlineSeparator"));if(summary&&summary.completions.length>0){const first=summary.completions[0],completionLabel=first?.agent??shortRunId(first?.runId)??t2("sharedWait.run");return t2(summary.completions.length>1?"sharedWait.completedMany":"sharedWait.completed",{label:completionLabel,count:summary.completions.length,header:header?t2("sharedWait.headerSuffix",{header}):""})}if(summary?.waitReason==="window_elapsed")return header?t2("sharedWait.timedOutWithHeader",{header}):t2("sharedWait.timedOut");if(summary?.waitReason==="supervisor_request")return header?t2("sharedWait.requestWithHeader",{header}):t2("sharedWait.request");if(summary?.headline){const waiting=summary.headline.match(/waiting\\s+([\\d.]+)s/i)?.[1];if(waiting&&header)return t2("sharedWait.waitedWithHeader",{header,seconds:waiting});if(waiting)return t2("sharedWait.waited",{seconds:waiting})}return header||void 0}function parseOmpWaitOutput(output){const envelope=extractPiToolText(output);if(!envelope||!envelope.details)return;const details=envelope.details;if(details.op!=="wait")return;const jobs=(Array.isArray(details.jobs)?details.jobs:[]).flatMap(job=>{if(!isRecord(job)||typeof job.id!="string"||job.id.trim().length===0)return[];const label=typeof job.label=="string"&&job.label.trim()?job.label.trim():void 0,status=typeof job.status=="string"&&job.status.trim()?job.status.trim().toLowerCase():void 0,durationMs=typeof job.durationMs=="number"&&Number.isFinite(job.durationMs)&&job.durationMs>=0?job.durationMs:void 0,model=typeof job.resolvedModel=="string"&&job.resolvedModel.trim()?job.resolvedModel.trim():typeof job.resolvedModelIdentity=="string"&&job.resolvedModelIdentity.trim()?job.resolvedModelIdentity.trim():void 0;return[{id:job.id,...status?{status}:{},...label?{label}:{},...durationMs!==void 0?{durationMs}:{},...model?{model}:{}}]});return{text:envelope.text,op:"wait",jobs}}function numberField(value,key){if(!isRecord(value))return;const field=value[key];return typeof field=="number"&&Number.isFinite(field)?field:void 0}function numberListField(value,key){if(!isRecord(value))return;const field=value[key];if(!Array.isArray(field))return;const numbers=field.filter(entry=>typeof entry=="number"&&Number.isFinite(entry));return numbers.length>0?numbers:void 0}function todoStatus(value){return value==="pending"||value==="in_progress"||value==="completed"?value:void 0}function parseTodoToolInput(input){const record=decodeToolInput(input)??{},action=stringField(record,"action")?.trim().toLowerCase()??"",id=numberField(record,"id"),status=todoStatus(record.status),subject=stringField(record,"subject"),description=stringField(record,"description"),activeForm=stringField(record,"activeForm"),blockedBy=numberListField(record,"blockedBy"),addBlockedBy=numberListField(record,"addBlockedBy"),removeBlockedBy=numberListField(record,"removeBlockedBy"),owner=stringField(record,"owner");return{action,...id!==void 0?{id}:{},...status?{status}:{},...subject?{subject}:{},...description?{description}:{},...activeForm?{activeForm}:{},...blockedBy?{blockedBy}:{},...addBlockedBy?{addBlockedBy}:{},...removeBlockedBy?{removeBlockedBy}:{},...owner?{owner}:{}}}function parseTodoToolTask(value){if(!isRecord(value))return;const id=numberField(value,"id");if(id===void 0)return;const subject=stringField(value,"subject")??stringField(value,"text")??stringField(value,"title");if(!subject)return;const description=stringField(value,"description"),activeForm=stringField(value,"activeForm");return{id,subject,status:todoStatus(value.status)??"pending",...description?{description}:{},...activeForm?{activeForm}:{},blockedBy:numberListField(value,"blockedBy")??[]}}function parseTodoToolOutput(output){const envelope=extractPiToolText(output);if(!envelope||!envelope.details)return;const details=envelope.details,tasks=Array.isArray(details.tasks)?details.tasks.flatMap(entry=>{const task2=parseTodoToolTask(entry);return task2?[task2]:[]}):[],task=parseTodoToolTask(details.task);if(tasks.length===0&&!task&&!envelope.text)return;const action=stringField(details,"action"),paramsRecord=isRecord(details.params)?details.params:void 0,nextId=numberField(details,"nextId");return{text:envelope.text,...action?{action}:{},tasks,...task?{task}:{},...paramsRecord?{params:parseTodoToolInput(paramsRecord)}:{},...nextId!==void 0?{nextId}:{}}}function todoTaskLabel(id,title){return/^\\d+$/.test(String(id))?`#${id} ${title}`:title}function todoToolDetailModel(input,output){const summary=parseTodoToolOutput(output);if(!summary)return{tasks:[]};const text=summary.text.trim(),resultText=text.includes(`\n`)?text:void 0,focusId=summary.task?.id??parseTodoToolInput(input).id,focus=focusId!==void 0?summary.tasks.find(task=>task.id===focusId)??summary.task:summary.task;return{...resultText?{resultText}:{},tasks:focus?[focus]:summary.tasks.filter(task=>task.status!=="completed")}}var MAX_EMBEDDED_JSON_CHARS2=1e5,MAX_EMBEDDED_JSON_STARTS2=8;function parseEmbeddedJson2(value){try{return JSON.parse(value)}catch{if(value.length>MAX_EMBEDDED_JSON_CHARS2)return;let starts=0;for(const match of value.matchAll(/\\{|\\[/g)){const offset=match.index;if(offset!==void 0){if(++starts>MAX_EMBEDDED_JSON_STARTS2)break;try{return JSON.parse(value.slice(offset))}catch{continue}}}return}}function unwrapPaseoToolOutput(value){const record=isRecord(value)?value:null;if(!record)return value;if(record.structuredContent!==void 0)return unwrapPaseoToolOutput(record.structuredContent);if(Array.isArray(record.content)){const content=record.content.find(item=>isRecord(item)&&item.type==="text");if(isRecord(content)){const parsed=typeof content.text=="string"?parseEmbeddedJson2(content.text):void 0;return parsed===void 0?content.text:unwrapPaseoToolOutput(parsed)}}return value}function paseoToolResult(value){const unwrapped=unwrapPaseoToolOutput(value),record=isRecord(unwrapped)?unwrapped:null;return record?.ok===!0&&record.result!==void 0?record.result:unwrapped}function unwrapProviderOutput(value){return isRecord(value)&&Object.keys(value).length===1&&"output"in value?value.output:value}var PREVIEW_LINES=20,PREVIEW_CHARS=4e3,MAX_FORMAT_CHARS=1e5,MAX_DIFF_CHARS=1e5;function previewText(text,maxLines=PREVIEW_LINES,maxChars=PREVIEW_CHARS){const totalLines=text.split(`\n`).length,totalChars=text.length;if(totalLines<=maxLines&&totalChars<=maxChars)return{text,truncated:!1,totalLines,totalChars};let preview=text.slice(0,maxChars+1).split(`\n`).slice(0,maxLines).join(`\n`).slice(0,maxChars);const last=preview.charCodeAt(preview.length-1),next=text.charCodeAt(preview.length);return preview.length<text.length&&last>=55296&&last<=56319&&next>=56320&&next<=57343&&(preview=preview.slice(0,-1)),{text:preview,truncated:preview.length<text.length,totalLines,totalChars}}function tailLinesOf(text,n){const lines=text.split(`\n`);return lines.length<=n?text:lines.slice(-n).join(`\n`)}var ESC=27,BEL=7,C1_CSI=155,C1_ST=156;function opensEscape(code){return code===ESC||code===C1_CSI||code===157||code===144||code===152||code===158||code===159}function firstEscape(text){for(let index=0;index<text.length;index++)if(opensEscape(text.charCodeAt(index)))return index;return-1}function escapeEnd(text,at){const length=text.length,code=text.charCodeAt(at);let index=at+1,csi=code===C1_CSI;if(code===ESC){if(index>=length)return length;const next=text.charCodeAt(index);if(next===91)csi=!0,index+=1;else if(next===93||next===80||next===88||next===94||next===95)index+=1;else if(next>=32&&next<=47){for(index+=1;index<length&&text.charCodeAt(index)>=32&&text.charCodeAt(index)<=47;)index+=1;return index<length&&text.charCodeAt(index)>=48&&text.charCodeAt(index)<=126&&(index+=1),index}else return next>=48&&next<=126?index+1:index}if(csi){let colour=code===ESC;for(;index<length;){const byte=text.charCodeAt(index);if(byte<48||byte>63)break;byte!==59&&(byte<48||byte>57)&&(colour=!1),index+=1}for(;index<length;){const byte=text.charCodeAt(index);if(byte<32||byte>47)break;colour=!1,index+=1}if(index>=length)return length;const final=text.charCodeAt(index);return final>=64&&final<=126?colour&&final===109?-(index+1):index+1:index}for(;index<length;){const byte=text.charCodeAt(index);if(byte===BEL||byte===C1_ST)return index+1;if(byte===ESC)return index+1<length&&text.charCodeAt(index+1)===92?index+2:index;if(byte===10||byte===13)return index;index+=1}return length}function scanAnsi(text,keepColour,limit){const first=firstEscape(text);if(first<0)return text.length<=limit?text:text.slice(0,limit);const parts=[];let shown=0,start=0,index=first;for(;index<text.length;){if(!opensEscape(text.charCodeAt(index))){index+=1;continue}if(index>start){const run=index-start;if(shown+run>=limit)return parts.push(text.slice(start,start+(limit-shown))),parts.join("");parts.push(text.slice(start,index)),shown+=run}const end=escapeEnd(text,index);end<0?(keepColour&&parts.push(text.slice(index,-end)),index=-end):index=end,start=index}return start<text.length&&parts.push(text.slice(start,start+Math.max(0,limit-shown))),parts.join("")}function stripAnsi(text){return scanAnsi(text,!1,1/0)}function ansiColourPrefix(raw,visible){return scanAnsi(raw,!0,Math.max(0,visible))}function ansiColourWindow(raw,from,visible){const end=from+Math.max(0,visible),before=[],parts=[];let shown=0,index=0;for(;index<raw.length&&shown<end;){if(opensEscape(raw.charCodeAt(index))){const stop=escapeEnd(raw,index);if(stop<0){const sequence=raw.slice(index,-stop);if(shown>=from)parts.push(sequence);else{let digit=2;for(;sequence.charCodeAt(digit)===48;)digit+=1;const after=sequence.charCodeAt(digit);(after===59||after===109)&&(before.length=0),after!==109&&before.push(sequence)}index=-stop}else index=stop;continue}let runEnd=index+1;for(;runEnd<raw.length&&!opensEscape(raw.charCodeAt(runEnd));)runEnd+=1;const low=Math.max(from,shown),high=Math.min(end,shown+runEnd-index);high>low&&parts.push(raw.slice(index+low-shown,index+high-shown)),shown+=runEnd-index,index=runEnd}return before.join("")+parts.join("")}function tailPreviewText(text,maxLines=PREVIEW_LINES,maxChars=PREVIEW_CHARS){let tail=tailLinesOf(text,maxLines);if(tail.length>maxChars){tail=tail.slice(tail.length-maxChars);const first=tail.charCodeAt(0);first>=56320&&first<=57343&&(tail=tail.slice(1))}return tail}function outputView(raw,clean,showAll,colours,trimFinalNewline=!0,tail=!1){const full=trimFinalNewline?clean.replace(/\\r?\\n$/,""):clean,preview=previewText(full);if(tail&&!showAll&&preview.truncated){const shown2=tailPreviewText(full),from=full.length-shown2.length,start=preview.totalLines-shown2.split(`\n`).length,highlight2=colours&&clean!==raw?ansiColourWindow(raw,from,shown2.length):shown2;return{preview,shown:shown2,highlight:highlight2,start}}const shown=showAll?full:preview.text,highlight=colours&&clean!==raw?ansiColourPrefix(raw,shown.length):shown;return{preview,shown,highlight,start:0}}function looksLikeJson(source){return/^\\s*[[{"]/.test(source.slice(0,256))}function formatJson(source){if(source.length>MAX_FORMAT_CHARS||!source.trim())return{text:null,limited:source.length>MAX_FORMAT_CHARS&&looksLikeJson(source)};try{JSON.parse(source)}catch{return{text:null,limited:!1}}const tokens=source.match(/"(?:\\\\[\\s\\S]|[^"\\\\])*"|[{}[\\],:]|[^\\s{}[\\],:]+/g)??[];let depth=0;const out=[];let length=0;const push=value=>{out.push(value),length+=value.length},line=()=>push(`\n`+"  ".repeat(Math.min(depth,40)));for(let index=0;index<tokens.length;index++){const token=tokens[index];if(token==="{"||token==="["?(push(token),depth+=1,tokens[index+1]!=="}"&&tokens[index+1]!=="]"&&line()):token==="}"||token==="]"?(depth-=1,tokens[index-1]!=="{"&&tokens[index-1]!=="["&&line(),push(token)):token===","?(push(token),line()):push(token===":"?": ":token),length>MAX_FORMAT_CHARS)return{text:null,limited:!0}}return{text:out.join(""),limited:!1}}function prettyJson(source){return formatJson(source).text}function extractCodeInput(toolName,value){let decoded=value;if(typeof value=="string"&&value.length<=1e6)try{decoded=JSON.parse(value)}catch{}const record=decoded!==null&&typeof decoded=="object"&&!Array.isArray(decoded)?decoded:void 0,name=toolName.trim().toLowerCase().replace(/^(?:functions|tools)\\./,"").replace(/^mcp__.*?__/,"").replace(/^mcp_/,"");if(["exec","mcpscript","mcp_script","run_script"].includes(name)){const code=record?.code??(typeof decoded=="string"&&!decoded.slice(0,256).trimStart().startsWith("{")?decoded:void 0);if(typeof code=="string")return{code,language:"javascript"}}if(name==="evaluate_browser"||name==="browser_evaluate"){const code=record?.expression??record?.code;if(typeof code=="string")return{code,language:"javascript"}}}function parseJsonString(value){try{return JSON.parse(value)}catch{return value}}function isDiffFileHeader(line,index,firstHunk){return(line.startsWith("---")||line.startsWith("+++"))&&(firstHunk===-1||index<firstHunk)}function splitDiffLines(text){const normalized=text.replace(/\\r/g,"");if(!normalized)return{lines:[],hasTrailingNewline:!1};const hasTrailingNewline=normalized.endsWith(`\n`),rawLines=normalized.split(`\n`);return hasTrailingNewline&&rawLines.pop(),{lines:rawLines,hasTrailingNewline}}var LINE_DIFF_MAX_CELLS=5e5,LINE_DIFF_MAX_LINES=2500;function computeLineDiff(oldText,newText){if(oldText.length+newText.length>MAX_DIFF_CHARS)return[...oldText?[{kind:"remove",text:t2("sharedPresentation.oldContents",{count:oldText.length.toLocaleString()})}]:[],...newText?[{kind:"add",text:t2("sharedPresentation.newContents",{count:newText.length.toLocaleString()})}]:[]];const{lines:oldLines,hasTrailingNewline:oldHasNewline}=splitDiffLines(oldText),{lines:newLines,hasTrailingNewline:newHasNewline}=splitDiffLines(newText),m=oldLines.length,n=newLines.length;if(m===0&&n===0)return[];if(m===0)return newLines.map(text=>({kind:"add",text}));if(n===0)return oldLines.map(text=>({kind:"remove",text}));let start=0;for(;start<m&&start<n&&oldLines[start]===newLines[start];)start++;let oldEnd=m-1,newEnd=n-1;for(;oldEnd>=start&&newEnd>=start&&oldLines[oldEnd]===newLines[newEnd];)oldEnd--,newEnd--;if(start>=m&&start>=n&&oldHasNewline!==newHasNewline){const lastLine=oldLines[m-1]??"";return[...oldLines.slice(0,m-1).map(text=>({kind:"context",text})),{kind:"remove",text:lastLine},{kind:"add",text:lastLine}]}const prefix=oldLines.slice(0,start).map(text=>({kind:"context",text})),suffix=oldLines.slice(oldEnd+1).map(text=>({kind:"context",text})),trimmedOld=oldLines.slice(start,oldEnd+1),trimmedNew=newLines.slice(start,newEnd+1),tM=trimmedOld.length,tN=trimmedNew.length;if(tM===0&&tN===0)return prefix.concat(suffix);if(tM*tN>LINE_DIFF_MAX_CELLS||tM+tN>LINE_DIFF_MAX_LINES){const fallback=[...trimmedOld.map(text=>({kind:"remove",text})),...trimmedNew.map(text=>({kind:"add",text}))];return prefix.concat(fallback,suffix)}const dp=Array.from({length:tM+1},()=>Array.from({length:tN+1},()=>0));for(let i2=0;i2<tM;i2++)for(let j2=0;j2<tN;j2++)trimmedOld[i2]===trimmedNew[j2]?dp[i2+1][j2+1]=dp[i2][j2]+1:dp[i2+1][j2+1]=Math.max(dp[i2+1][j2],dp[i2][j2+1]);const middle=[];let i=tM,j=tN;for(;i>0||j>0;)i>0&&j>0&&trimmedOld[i-1]===trimmedNew[j-1]?(middle.push({kind:"context",text:trimmedOld[i-1]}),i--,j--):j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])?(middle.push({kind:"add",text:trimmedNew[j-1]}),j--):i>0&&(middle.push({kind:"remove",text:trimmedOld[i-1]}),i--);return prefix.concat(middle.reverse(),suffix)}var DIFF_CONTEXT_LINES=3;function focusDiffChanges(lines,contextLines=DIFF_CONTEXT_LINES){const changedIndexes=lines.flatMap((line,index)=>line.kind==="add"||line.kind==="remove"?[index]:[]);if(changedIndexes.length===0)return lines;const ranges=[];for(const changedIndex of changedIndexes){const range={start:Math.max(0,changedIndex-contextLines),end:Math.min(lines.length,changedIndex+contextLines+1)},previous=ranges[ranges.length-1];previous&&range.start<=previous.end?previous.end=Math.max(previous.end,range.end):ranges.push(range)}const focused=[];for(const[index,range]of ranges.entries())index>0&&focused.push({kind:"meta",text:"\\u2026"}),range.start>0&&index===0&&focused.push({kind:"meta",text:"\\u2026"}),focused.push(...lines.slice(range.start,range.end)),range.end<lines.length&&index===ranges.length-1&&focused.push({kind:"meta",text:"\\u2026"});return focused}function effectiveUnifiedDiff(detail){const diff=detail.unifiedDiff;if(!(diff===void 0||diff.trim()===""))return diff}function editDiffContentSize(detail){const unifiedDiff=effectiveUnifiedDiff(detail);return unifiedDiff!==void 0?unifiedDiff.length:(detail.oldString?.length??0)+(detail.newString?.length??0)}function diffLinesForDetail(detail){const unifiedDiff=effectiveUnifiedDiff(detail);if((unifiedDiff?.length??(detail.oldString?.length??0)+(detail.newString?.length??0))>MAX_DIFF_CHARS)return[...detail.oldString?[{kind:"remove",text:t2("sharedPresentation.oldContents",{count:detail.oldString.length.toLocaleString()})}]:[],...detail.newString?[{kind:"add",text:t2("sharedPresentation.newContents",{count:detail.newString.length.toLocaleString()})}]:[]];if(unifiedDiff!==void 0){const rawLines=unifiedDiff.replace(/\\r/g,"").split(`\n`),firstHunk=rawLines.findIndex(line=>line.startsWith("@@")),lines=[];for(const[index,line]of rawLines.entries())index===rawLines.length-1&&line===""||(isDiffFileHeader(line,index,firstHunk)?firstHunk===-1&&lines.push({kind:"meta",text:line}):line.startsWith("@@")?lines.push({kind:"meta",text:line}):line.startsWith("+")?lines.push({kind:"add",text:line.slice(1)}):line.startsWith("-")?lines.push({kind:"remove",text:line.slice(1)}):line.startsWith(" ")?lines.push({kind:"context",text:line.slice(1)}):lines.push({kind:"context",text:line}));return focusDiffChanges(lines)}return focusDiffChanges(computeLineDiff(detail.oldString??"",detail.newString??""))}function parseSubAgentActionLog(log){const actions=[];for(const line of log.split(/\\r?\\n/)){const match=line.trim().match(/^\\[([^\\]]+)\\]\\s*(\\S.*|)$/);if(!match?.[1])continue;const toolName=match[1].trim();if(!toolName)continue;const summary=match[2]?.trim();actions.push({index:actions.length,toolName,...summary?{summary}:{}})}return actions}function parsePiLsOutput(value){if(value===null||typeof value!="object"||Array.isArray(value))return null;const content=value.content;if(!Array.isArray(content))return null;const textBlocks=content.flatMap(block=>{if(block===null||typeof block!="object"||Array.isArray(block))return[];const record=block;return record.type==="text"&&typeof record.text=="string"?[record.text]:[]});return textBlocks.length!==content.length?null:textBlocks.flatMap(text=>text.split(`\n`).filter(entry=>entry.length>0))}function cleanSearchFileHeader(line){const trimmed=line.trim();if(!trimmed)return;const withoutColon=trimmed.endsWith(":")?trimmed.slice(0,-1).trim():trimmed;if(!withoutColon)return;const unquoted=withoutColon.length>=2&&(withoutColon.startsWith(\'"\')&&withoutColon.endsWith(\'"\')||withoutColon.startsWith("\'")&&withoutColon.endsWith("\'"))?withoutColon.slice(1,-1).trim():withoutColon;if(!(!unquoted||unquoted.length>500))return unquoted}function looksLikeSearchFilePath(value){return!!(/[\\\\/]/.test(value)||/\\.[A-Za-z0-9]{1,10}$/.test(value)||/^[^\\s]+\\.[^\\s]+$/.test(value))}function parseOpencodeSearchContent(content){if(typeof content!="string")return;const normalized=content.replace(/\\r\\n?/g,`\n`);if(!normalized.trim())return;const lines=normalized.split(`\n`);let numMatches;const files=[];let current2=null;function nextNonEmptyMatchesLine(from){for(let index=from+1;index<lines.length;index+=1){const candidate=(lines[index]??"").trim();if(candidate)return/^line\\s+\\d+\\s*:/i.test(candidate)}return!1}for(let index=0;index<lines.length;index+=1){const trimmed=(lines[index]??"").trim();if(!trimmed)continue;if(numMatches===void 0&&files.length===0&&!current2){const header=trimmed.match(/^found\\s+(\\d+)\\s+matches?\\b/i);if(header?.[1]){const parsed=Number.parseInt(header[1],10);Number.isFinite(parsed)&&(numMatches=parsed);continue}if(/^no\\s+matches?\\s+found\\b/i.test(trimmed))return{files:[]}}const lineMatch=trimmed.match(/^line\\s+(\\d+)\\s*:\\s?([\\s\\S]*)$/i);if(lineMatch){const parsedLine=Number.parseInt(lineMatch[1]??"",10),text=(lineMatch[2]??"").trimEnd();current2||(current2={filePath:"",matches:[]},files.push(current2)),current2.matches.push({...Number.isFinite(parsedLine)?{lineNumber:parsedLine}:{},text});continue}const headerPath=cleanSearchFileHeader(trimmed);if(!headerPath)continue;if(nextNonEmptyMatchesLine(index)||(current2?.matches.length??0)>0&&looksLikeSearchFilePath(headerPath)){current2={filePath:headerPath,matches:[]},files.push(current2);continue}!current2&&looksLikeSearchFilePath(headerPath)&&(current2={filePath:headerPath,matches:[]},files.push(current2))}const grouped=files.filter(file=>file.filePath||file.matches.length>0);if(grouped.length!==0)return{...numMatches!==void 0?{numMatches}:{},files:grouped}}function resolveSearchCounts(detail,parsed){if(!parsed)return{...detail.numMatches!==void 0?{matchCount:detail.numMatches}:{},...detail.numFiles!==void 0?{fileCount:detail.numFiles}:{}};const parsedMatches=parsed.files.reduce((total,file)=>total+file.matches.length,0),parsedFiles=parsed.files.filter(file=>file.filePath).length;return{matchCount:parsed.numMatches??parsedMatches,fileCount:parsedFiles}}function readErrorMessage(content){const text=content?.trim();return text&&/^(?:E[A-Z0-9_]+|Error):\\s/.test(text)?text:void 0}function formatUnknownValue(value){if(typeof value=="string")return prettyJson(value)??value;try{const raw=JSON.stringify(value);return raw===void 0?String(value):prettyJson(raw)??JSON.stringify(value,null,2)??String(value)}catch{return String(value)}}function hasMeaningfulUnknownValue(value){return value==null?!1:typeof value=="string"?value.trim().length>0:typeof value=="number"||typeof value=="boolean"?!0:Array.isArray(value)?value.some(hasMeaningfulUnknownValue):typeof value=="object"?Object.values(value).some(hasMeaningfulUnknownValue):!0}var MAX_VISIBLE_SUBAGENT_ACTIONS=5;function subAgentLogFullyShown(detail){if((detail.actions?.length??0)>0)return!1;const lines=(detail.log??"").split(/\\r?\\n/).filter(line=>line.trim()).length,parsed=parseSubAgentActionLog(detail.log??"");return parsed.length>0&&parsed.length===lines&&parsed.length<=MAX_VISIBLE_SUBAGENT_ACTIONS}function isBoldSummaryParagraph(paragraph){return paragraph!==void 0&&/^\\*\\*[^*\\n]+(?:\\*[^*\\n]+)*\\*\\*$/.test(paragraph)}function splitReasoningSteps(text){const paragraphs=text.split(/\\n\\s*\\n/).map(step=>step.trim()).filter(step=>step.length>0),steps=[];for(let index=0;index<paragraphs.length;index+=1){const paragraph=paragraphs[index],nextParagraph=paragraphs[index+1];isBoldSummaryParagraph(paragraph)&&nextParagraph&&!isBoldSummaryParagraph(nextParagraph)?(steps.push(`${paragraph}\n\n${nextParagraph}`),index+=1):steps.push(paragraph)}return steps}function splitStepTitle(step){const trimmed=step.trim(),match=/^\\*\\*([^*\\n]+(?:\\*[^*\\n]+)*)\\*\\*(?:\\n\\s*\\n([\\s\\S]*))?$/.exec(trimmed);return match?{title:match[1].trim(),body:(match[2]??"").trim()}:{title:null,body:trimmed}}function textProperty(id){return{enumerable:!0,get:()=>t2(id)}}function translatedTable(ids){const result={};for(const name of Object.keys(ids))Object.defineProperty(result,name,textProperty(ids[name]));return result}var looks={think:{get label(){return t2("modelLook.think")},icon:"Brain",hue:"violet"},read:{get label(){return t2("modelLook.read")},icon:"FileText",hue:"blue"},list:{get label(){return t2("modelLook.list")},icon:"FolderOpen",hue:"blue"},edit:{get label(){return t2("modelLook.edit")},icon:"FilePen",hue:"green"},write:{get label(){return t2("modelLook.write")},icon:"FilePlus",hue:"green"},shell:{get label(){return t2("modelLook.shell")},icon:"SquareTerminal",hue:"orange"},search:{get label(){return t2("modelLook.search")},icon:"Search",hue:"indigo"},web:{get label(){return t2("modelLook.web")},icon:"Globe",hue:"cyan"},browser:{get label(){return t2("modelLook.browser")},icon:"AppWindow",hue:"cyan"},agent:{get label(){return t2("modelLook.agent")},icon:"Bot",hue:"fuchsia"},plan:{get label(){return t2("modelLook.plan")},icon:"ListChecks",hue:"teal"},ask:{get label(){return t2("modelLook.ask")},icon:"MessageCircleQuestionMark",hue:"amber"},mcp:{get label(){return t2("modelLook.mcp")},icon:"Plug",hue:"pink"},paseo:{get label(){return t2("modelLook.paseo")},icon:"Workflow",hue:"sky"},skill:{get label(){return t2("modelLook.skill")},icon:"Sparkles",hue:"lime"},other:{get label(){return t2("modelLook.other")},icon:"Puzzle",hue:"gray"}},VIVID_CATEGORY_HUES={reasoning:looks.think.hue,shell:looks.shell.hue,file:looks.read.hue,search:looks.search.hue,agent:looks.agent.hue,plan:looks.plan.hue,communication:looks.mcp.hue,unknown:null},COUNT_LABELS=translatedTable({think:"modelCount.think",read:"modelCount.read",list:"modelCount.list",edit:"modelCount.edit",write:"modelCount.write",shell:"modelCount.shell",search:"modelCount.search",web:"modelCount.web",agent:"modelCount.agent",plan:"modelCount.plan",ask:"modelCount.ask",mcp:"modelCount.mcp",paseo:"modelCount.paseo",skill:"modelCount.skill",browser:"modelCount.browser",other:"modelCount.other"}),statusLooks={running:{get label(){return t2("modelRowStatus.running")},hue:"blue",icon:"LoaderCircle"},waiting:{get label(){return t2("modelRowStatus.waiting")},hue:"amber",icon:"Hand"},question:{get label(){return t2("modelRowStatus.question")},hue:"amber",icon:"MessageCircleQuestionMark"},completed:{get label(){return t2("modelRowStatus.completed")},hue:"green",icon:"Check"},failed:{get label(){return t2("modelRowStatus.failed")},hue:"red",icon:"X"},canceled:{get label(){return t2("modelRowStatus.canceled")},hue:"muted",icon:"CircleSlash2"}},PASEO_TOOL_ZH=translatedTable({Speak:"modelPaseo.speak","Create Workspace":"modelPaseo.createWorkspace","List Workspaces":"modelPaseo.listWorkspaces","Archive Workspace":"modelPaseo.archiveWorkspace","Rename Workspace":"modelPaseo.renameWorkspace","Create Agent":"modelPaseo.createAgent","Send Agent Prompt":"modelPaseo.sendAgentPrompt","Get Agent Status":"modelPaseo.getAgentStatus","Get Agent Activity":"modelPaseo.getAgentActivity","List Agents":"modelPaseo.listAgents","Cancel Agent Run":"modelPaseo.cancelAgentRun","Archive Agent":"modelPaseo.archiveAgent","Kill Agent":"modelPaseo.killAgent","Update Agent":"modelPaseo.updateAgent","Set Agent Session Mode":"modelPaseo.setAgentSessionMode","List Pending Permissions":"modelPaseo.listPendingPermissions","Respond to Permission":"modelPaseo.respondToPermission","List Workspace Scripts":"modelPaseo.listWorkspaceScripts","Start Workspace Script":"modelPaseo.startWorkspaceScript","Stop Workspace Script":"modelPaseo.stopWorkspaceScript","List Terminals":"modelPaseo.listTerminals","Create Terminal":"modelPaseo.createTerminal","Kill Terminal":"modelPaseo.killTerminal","Capture Terminal":"modelPaseo.captureTerminal","Send Terminal Keys":"modelPaseo.sendTerminalKeys","Create Schedule":"modelPaseo.createSchedule","Create Heartbeat":"modelPaseo.createHeartbeat","Delete Heartbeat":"modelPaseo.deleteHeartbeat","List Schedules":"modelPaseo.listSchedules","Inspect Schedule":"modelPaseo.inspectSchedule","Pause Schedule":"modelPaseo.pauseSchedule","Resume Schedule":"modelPaseo.resumeSchedule","Delete Schedule":"modelPaseo.deleteSchedule","Update Schedule":"modelPaseo.updateSchedule","Schedule Logs":"modelPaseo.scheduleLogs","Run Schedule Once":"modelPaseo.runScheduleOnce","List Providers":"modelPaseo.listProviders","List Models":"modelPaseo.listModels","List Agent Profiles":"modelPaseo.listAgentProfiles","Inspect Provider":"modelPaseo.inspectProvider","List Browser Tabs":"modelPaseo.listBrowserTabs","Browser List Tabs":"modelPaseo.listBrowserTabs","Browser New Tab":"modelPaseo.createBrowserTab","Browser Close Tab":"modelPaseo.closeBrowserTab","Browser Snapshot":"modelPaseo.snapshotBrowserPage","Browser Snapshot Page":"modelPaseo.snapshotBrowserPage","Browser Click":"modelPaseo.clickBrowserElement","Browser Click Element":"modelPaseo.clickBrowserElement","Browser Fill":"modelPaseo.fillBrowserElement","Browser Fill Element":"modelPaseo.fillBrowserElement","Browser Hover":"modelPaseo.hoverBrowserElement","Browser Hover Element":"modelPaseo.hoverBrowserElement","Browser Drag":"modelPaseo.dragBrowserElement","Browser Drag Element":"modelPaseo.dragBrowserElement","Browser Select":"modelPaseo.selectBrowserOption","Browser Select Option":"modelPaseo.selectBrowserOption","Browser Wait":"modelPaseo.waitForBrowserCondition","Browser Wait for Condition":"modelPaseo.waitForBrowserCondition","Browser Type":"modelPaseo.typeIntoBrowser","Browser Type into Element":"modelPaseo.typeIntoBrowser","Browser Press Key":"modelPaseo.pressBrowserKey","Browser Press":"modelPaseo.pressBrowserKey","Browser Navigate":"modelPaseo.navigateBrowser","Browser Scroll":"modelPaseo.scrollBrowser","Browser Scroll Page":"modelPaseo.scrollBrowser","Browser Resize":"modelPaseo.resizeBrowserViewport","Browser Resize Viewport":"modelPaseo.resizeBrowserViewport","Browser Screenshot":"modelPaseo.captureBrowserScreenshot","Browser Capture Screenshot":"modelPaseo.captureBrowserScreenshot","Browser Upload":"modelPaseo.uploadFilesInBrowser","Browser Upload Files":"modelPaseo.uploadFilesInBrowser","Browser Logs":"modelPaseo.readBrowserLogs","Browser Read Logs":"modelPaseo.readBrowserLogs","Browser Console":"modelPaseo.readBrowserLogs","Browser Evaluate":"modelPaseo.evaluateBrowserJavascript","Browser Evaluate JavaScript":"modelPaseo.evaluateBrowserJavascript","Browser Key Press":"modelPaseo.pressBrowserKey","Create Browser Tab":"modelPaseo.createBrowserTab","Close Browser Tab":"modelPaseo.closeBrowserTab","Snapshot Browser Page":"modelPaseo.snapshotBrowserPage","Click Browser Element":"modelPaseo.clickBrowserElement","Fill Browser Element":"modelPaseo.fillBrowserElement","Hover Browser Element":"modelPaseo.hoverBrowserElement","Drag Browser Element":"modelPaseo.dragBrowserElement","Select Browser Option":"modelPaseo.selectBrowserOption","Wait for Browser Condition":"modelPaseo.waitForBrowserCondition","Type into Browser":"modelPaseo.typeIntoBrowser","Press Browser Key":"modelPaseo.pressBrowserKey","Navigate Browser":"modelPaseo.navigateBrowser","Browser Back":"modelPaseo.browserBack","Browser Forward":"modelPaseo.browserForward","Browser Reload":"modelPaseo.browserReload","Capture Browser Screenshot":"modelPaseo.captureBrowserScreenshot","Upload Files in Browser":"modelPaseo.uploadFilesInBrowser","Read Browser Logs":"modelPaseo.readBrowserLogs","Evaluate Browser JavaScript":"modelPaseo.evaluateBrowserJavascript","Scroll Browser":"modelPaseo.scrollBrowser","Resize Browser Viewport":"modelPaseo.resizeBrowserViewport"}),LABELS=translatedTable({Read:"modelLabel.read",List:"modelLabel.list","List Directory":"modelLabel.listDirectory",Edit:"modelLabel.edit",Add:"modelLabel.add",Delete:"modelLabel.delete",Write:"modelLabel.write",Shell:"modelLabel.shell",Search:"modelLabel.search",Find:"modelLabel.find","Fetch URL":"modelLabel.fetchUrl","Agent Task":"modelLabel.agentTask",Plan:"modelLabel.plan",Thinking:"modelLabel.thinking",Skill:"modelLabel.skill",Tasks:"modelLabel.tasks","Ask Question":"modelLabel.askQuestion","Background Task":"modelLabel.backgroundTask",Speak:"modelLabel.speak","Worktree Setup":"modelLabel.worktreeSetup",Tool:"modelLabel.tool","Search Tools":"modelLabel.searchTools","Code Mode":"modelLabel.codeMode","Supervisor Reply":"modelLabel.supervisorReply","Supervisor Queue":"modelLabel.supervisorQueue","Supervisor Requests":"modelLabel.supervisorRequests","Supervisor Status":"modelLabel.supervisorStatus","Subagent Supervisor":"modelLabel.subagentSupervisor",Wait:"modelLabel.wait","Wait for Background Work":"modelLabel.waitForBackgroundWork","Wait Subscription":"modelLabel.waitSubscription","Wait for All":"modelLabel.waitForAll","Wait for Run":"modelLabel.waitForRun","Bg Wait":"modelLabel.bgWait","Wait for Agent":"modelLabel.waitForAgent","Dispatch Agent":"modelLabel.dispatchAgent","Steer Agent":"modelLabel.steerAgent","Check Agent Result":"modelLabel.checkAgentResult","Agent Result":"modelLabel.agentResult","GitHub Actions Details":"modelLabel.gitHubActionsDetails","GitHub Actions List":"modelLabel.gitHubActionsList","GitHub Actions Run":"modelLabel.gitHubActionsRun","GitHub File":"modelLabel.gitHubFile","GitHub Job Logs":"modelLabel.gitHubJobLogs","GitHub Pull Request":"modelLabel.gitHubPullRequest","GitHub Code Search":"modelLabel.gitHubCodeSearch","GitHub Repository Search":"modelLabel.gitHubRepositorySearch","Exa Web Search":"modelLabel.exaWebSearch","Exa Web Fetch":"modelLabel.exaWebFetch","Exa Agent":"modelLabel.exaAgent","Exa Research Guide":"modelLabel.exaResearchGuide","Exa Schema Templates":"modelLabel.exaSchemaTemplates",TodoWrite:"modelLabel.todoWrite",NotebookEdit:"modelLabel.notebookEdit",BashOutput:"modelLabel.bashOutput",KillShell:"modelLabel.killShell",KillBash:"modelLabel.killBash",WebSearch:"modelLabel.webSearch",ExitPlanMode:"modelLabel.exitPlanMode",EnterPlanMode:"modelLabel.enterPlanMode",SlashCommand:"modelLabel.slashCommand",AskUserQuestion:"modelLabel.askUserQuestion",ListMcpResourcesTool:"modelLabel.listMcpResourcesTool",ReadMcpResourceTool:"modelLabel.readMcpResourceTool",Command:"modelLabel.command",Output:"modelLabel.output",Contents:"modelLabel.contents","Written contents":"modelLabel.writtenContents",Before:"modelLabel.before",After:"modelLabel.after",Diff:"modelLabel.diff",Result:"modelLabel.result",Error:"modelLabel.error",Input:"modelLabel.input",Image:"modelLabel.image","Setup log":"modelLabel.setupLog","Activity log":"modelLabel.activityLog",Query:"modelLabel.query",Matches:"modelLabel.matches",Files:"modelLabel.files",Message:"modelLabel.message",Prompt:"modelLabel.prompt",Code:"modelLabel.code",Session:"modelLabel.session"}),WAIT_FOR_AGENTS=/^Wait for (\\d+) Agents$/;function zh(label){const direct=LABELS[label];if(direct)return direct;if(label.startsWith("Paseo ")){const paseo=PASEO_TOOL_ZH[label.slice(6)];if(paseo)return t2("modelText.paseoLabel",{label:paseo})}const agents=WAIT_FOR_AGENTS.exec(label);return agents?t2("modelText.waitAgents",{count:agents[1]}):label}var STATUS_ZH=translatedTable({Active:"modelStatus.exactActive",Default:"modelStatus.exactDefault",Success:"modelStatus.exactSuccess",Failed:"modelStatus.exactFailed",running:"modelStatus.running",initializing:"modelStatus.initializing",starting:"modelStatus.starting",loading:"modelStatus.loading",completed:"modelStatus.completed",succeeded:"modelStatus.succeeded",success:"modelStatus.success",idle:"modelStatus.idle",active:"modelStatus.active",healthy:"modelStatus.healthy",ready:"modelStatus.ready",available:"modelStatus.available",enabled:"modelStatus.enabled",failed:"modelStatus.failed",error:"modelStatus.error",unhealthy:"modelStatus.unhealthy",unavailable:"modelStatus.unavailable",disabled:"modelStatus.disabled",canceled:"modelStatus.canceled",cancelled:"modelStatus.cancelled",paused:"modelStatus.paused",stopped:"modelStatus.stopped",closed:"modelStatus.closed",exited:"modelStatus.exited",archived:"modelStatus.archived",expired:"modelStatus.expired",skipped:"modelStatus.skipped",pending:"modelStatus.pending",queued:"modelStatus.queued",timeout:"modelStatus.timeout",timed_out:"modelStatus.timedOut",worktree:"modelStatus.worktree",local:"modelStatus.local",none:"modelStatus.none",directory:"modelStatus.directory",tool:"modelStatus.tool",plan:"modelStatus.plan",question:"modelStatus.question",mode:"modelStatus.mode",other:"modelStatus.other",finished:"modelStatus.finished",permission:"modelStatus.permission",closed_by_user:"modelStatus.closedByUser",background:"modelStatus.background"});function statusLabel(value){return STATUS_ZH[value]??STATUS_ZH[value.toLowerCase()]??value}function piSubagentOperation(name){switch(normalizePiToolName(name)){case"agent":return"dispatch";case"get_subagent_result":return"result";case"steer_subagent":return"steer";default:return}}function parsePiSubagentCall(input,output){let value=input;if(typeof value=="string")try{value=JSON.parse(value)}catch{value=void 0}const record=value&&typeof value=="object"&&!Array.isArray(value)?value:{},envelope=extractPiToolText(output),text=envelope?.text??"",lifecycleText=text.replace(/^Note: run_in_background[^\\r\\n]*\\r?\\n\\s*\\r?\\n/,""),header=lifecycleText.split(/\\r?\\n\\s*\\r?\\n/)[0]??"",details=envelope?.details??{},detailField=key=>typeof details[key]=="string"&&details[key].trim()||void 0,field=key=>typeof record[key]=="string"&&record[key].trim()?record[key].trim():void 0,recognizedHeader=/^(?:Agent(?: started| queued) in background\\.|Agent:|Steering message sent to agent |Agent "|Agent not found:)/.test(header),line=label=>recognizedHeader&&header.match(new RegExp(`^${label}:[^\\\\S\\\\r\\\\n]*([^\\\\r\\\\n]+)`,"m"))?.[1]?.trim()||void 0,operationValue=line("Operation")??detailField("operation"),operation=operationValue==="wait"||operationValue==="result"||operationValue==="steer"?operationValue:void 0,description=field("description")??detailField("description")??line("Description"),agentId=field("agent_id")??detailField("agentId")??line("Agent ID")??line("Agent")??header.match(/^Steering message sent to agent ([^\\s.]+)\\./)?.[1]??header.match(/^Agent(?: not found:)? "([^"]+)"/)?.[1],agentType=field("subagent_type")??detailField("subagentType")??line("Type")?.split(" | ")[0],queued=header.startsWith("Agent queued in background."),dispatch=queued||header.startsWith("Agent started in background."),result=header.startsWith("Agent:"),steering=header.startsWith("Steering message sent to agent "),responseBody=result?lifecycleText.slice(header.length).trim():lifecycleText,rejected=responseBody.match(/^Agent "[^"]+" is not running \\(status: ([^)]+)\\)\\.\\s*(.*)/),missing=header.startsWith("Agent not found:"),lifecycle=dispatch||result||steering||!!rejected||missing||operation!==void 0,status=header.match(/^Type:[^\\r\\n]*\\| Status:\\s*([a-z]+)/m)?.[1]??rejected?.[1]??detailField("status")??(queued?"queued":dispatch?"background":void 0);let body=dispatch||steering||rejected||missing?"":result?responseBody:text;const errorMatch=result&&status==="error"?body.match(/^Error:\\s*([\\s\\S]*)$/):void 0,error=rejected?.[2]??(missing?t2("sharedPiAgent.missing"):void 0)??errorMatch?.[1];errorMatch&&error&&(body="");const toolUsesMatch=header.match(/(?:^|\\| )Tool uses:\\s*(\\d+)/m),toolUses=toolUsesMatch?Number(toolUsesMatch[1]):typeof details.toolUses=="number"?details.toolUses:void 0,tokens=header.match(/\\|\\s*([\\d.]+[kM]?) tokens?\\b/)?.[1]??detailField("tokens"),context=header.match(/\\| Context:\\s*([\\d.]+%)/)?.[1],duration=header.match(/\\| Duration:\\s*([^|\\r\\n]+)/)?.[1]?.trim(),outputFile=line("Output file"),notice=steering||operation==="steer"&&responseBody.startsWith("Steering message sent to agent ")?t2("sharedPiAgent.steerSent"):body==="Agent is still running. Use wait: true or check back later."?t2("sharedPiAgent.running"):void 0;return notice&&(body=""),{agentId,agentType,description,status,prompt:field("prompt"),message:field("message"),operation,wait:operation==="wait"?!0:operation==="result"?!1:typeof record.wait=="boolean"?record.wait:void 0,text,body,lifecycle,error,notice,toolUses,tokens,context,duration,outputFile}}function noticeTag(raw,tag){const open=raw.indexOf(`<${tag}>`);if(open<0)return null;const start=open+tag.length+2,close=raw.indexOf(`</${tag}>`,start);return(close<0?raw.slice(start):raw.slice(start,close)).trim()||null}var count=(raw,tag)=>{const value=Number(noticeTag(raw,tag));return Number.isFinite(value)&&value>=0&&noticeTag(raw,tag)!==null?value:null};function noticeSections(raw){const value=raw??"";if(!value.includes("<task-notification>"))return{result:null,note:null,event:null,usage:null};const usage=noticeTag(value,"usage"),parsedUsage=usage?{tokens:count(usage,"subagent_tokens")??count(usage,"total_tokens"),toolUses:count(usage,"tool_uses"),durationMs:count(usage,"duration_ms")}:null;return{result:noticeTag(value,"result"),note:noticeTag(value,"note"),event:noticeTag(value,"event"),usage:parsedUsage&&(parsedUsage.tokens!==null||parsedUsage.toolUses!==null||parsedUsage.durationMs!==null)?parsedUsage:null}}var import_zod2=require("zod"),MAX_UNWITNESSED_MS=1800*1e3;function formatDuration(ms,options={}){if(ms==null||!Number.isFinite(ms)||ms<(options.live?0:100))return null;if(!options.live&&ms<9950)return t2("timing.seconds",{count:(ms/1e3).toFixed(1)});const seconds=options.live?Math.floor(ms/1e3):Math.round(ms/1e3);if(seconds<60)return t2("timing.seconds",{count:seconds});const minutes=Math.floor(seconds/60),rest=seconds%60;if(minutes<60)return rest?t2("timing.minutesSeconds",{minutes,seconds:rest}):t2("timing.minutes",{count:minutes});const hours=Math.floor(minutes/60),restMinutes=minutes%60;return restMinutes?t2("timing.hoursMinutes",{hours,minutes:restMinutes}):t2("timing.hours",{count:hours})}var SHOW=Object.freeze({kind:"show"}),HIDE=Object.freeze({kind:"hide"}),REASONING_KEY_SAMPLE=64*1024,PI_NOTICE_LIMITS={text:64*1024,string:8*1024,chars:64*1024,entries:200,nodes:4e3,depth:8,key:256},reasoningItemDataSchema=import_zod2.z.object({text:import_zod2.z.string(),phase:import_zod2.z.enum(["streaming","complete"]),fold:import_zod2.z.string().optional()}),diffStatsSchema=import_zod2.z.object({additions:import_zod2.z.number().int().nonnegative(),deletions:import_zod2.z.number().int().nonnegative()}),toolCallPresentationSchema=import_zod2.z.object({category:import_zod2.z.enum(["shell","file","search","agent","plan","communication","unknown"]),icon:import_zod2.z.string(),label:import_zod2.z.string(),summary:import_zod2.z.string().optional(),filePath:import_zod2.z.string().optional(),fileIcon:import_zod2.z.string().optional(),language:import_zod2.z.string().optional(),diffStats:diffStatsSchema.optional()}),taskNoticeDataSchema=import_zod2.z.object({text:import_zod2.z.string(),kind:import_zod2.z.enum(["command","agent","monitor","event","remote","task","workflow","repeat","other"]),state:import_zod2.z.enum(["done","failed","stopped","blocked","info"]),taskId:import_zod2.z.string().optional(),outputFile:import_zod2.z.string().optional()}),PI_NOTICE_BODY_CHARS=12e3,piNoticeDataSchema=import_zod2.z.object({customType:import_zod2.z.string(),state:import_zod2.z.enum(["done","failed","stopped","running","info"]),look:import_zod2.z.enum(["shell","agent","web","plan","other"]),fields:import_zod2.z.array(import_zod2.z.object({id:import_zod2.z.string().optional(),label:import_zod2.z.string(),value:import_zod2.z.string(),mono:import_zod2.z.boolean().optional()})),body:import_zod2.z.string().optional(),cut:import_zod2.z.boolean().optional(),reader:import_zod2.z.enum(["idle","loading","failed"]).optional()}),toolCallItemDataSchema=import_zod2.z.object({callId:import_zod2.z.string().optional(),fold:import_zod2.z.string().optional(),part:import_zod2.z.number().int().positive().optional(),notice:taskNoticeDataSchema.optional(),pi:piNoticeDataSchema.optional(),name:import_zod2.z.string(),status:import_zod2.z.enum(["running","completed","failed","canceled"]),detail:import_zod2.z.json(),errorText:import_zod2.z.string().optional(),presentation:toolCallPresentationSchema}),foldItemDataSchema=import_zod2.z.object({segment:import_zod2.z.string(),mode:import_zod2.z.enum(["done","earlier"]),expanded:import_zod2.z.boolean(),steps:import_zod2.z.number().int().nonnegative(),hidden:import_zod2.z.number().int().nonnegative(),counts:import_zod2.z.array(import_zod2.z.tuple([import_zod2.z.string(),import_zod2.z.number().int().nonnegative()])),failed:import_zod2.z.number().int().nonnegative(),canceled:import_zod2.z.number().int().nonnegative(),durationMs:import_zod2.z.number().nonnegative().nullable(),endedAt:import_zod2.z.number().nonnegative().nullable().default(null),files:import_zod2.z.number().int().nonnegative().optional(),added:import_zod2.z.number().int().nonnegative().optional(),removed:import_zod2.z.number().int().nonnegative().optional(),uncounted:import_zod2.z.number().int().nonnegative().optional(),changed:import_zod2.z.array(import_zod2.z.object({key:import_zod2.z.string(),file:import_zod2.z.string(),added:import_zod2.z.number().int().nonnegative(),removed:import_zod2.z.number().int().nonnegative()})).optional(),fails:import_zod2.z.array(import_zod2.z.object({key:import_zod2.z.string(),exit:import_zod2.z.number().int().nullable()})).optional(),turn:import_zod2.z.string().nullable().optional(),lastOfTurn:import_zod2.z.boolean().optional()}),import_react11=require("react"),import_react_native13=require("react-native"),import_react_native=require("@getpaseo/plugin/client/react-native"),import_react=require("react"),import_react_native2=require("react-native"),import_jsx_runtime=require("react/jsx-runtime");addDefaults({kitUi,kitTime});var space={xxs:2,xs:4,sm:8,md:12,lg:16,xl:24,xxl:32},fontSize={meta:12,small:13,body:14,content:15,title:16,heading:18},radius={sm:6,md:8,lg:12,full:999},control={sm:28,md:32},hairline=import_react_native2.Platform.OS==="web"?1:import_react_native2.StyleSheet.hairlineWidth,touchSlop={top:8,bottom:8,left:6,right:6},aria=attributes=>Object.fromEntries(Object.entries(attributes).filter(([,value])=>value!==void 0).map(([key,value])=>[`aria-${key}`,value]));function luminance(color){const short=/^#([a-f\\d])([a-f\\d])([a-f\\d])$/i.exec(color),hex=short?short.slice(1).map(part=>part+part).join(""):/^#([a-f\\d]{6})(?:[a-f\\d]{2})?$/i.exec(color)?.[1];if(!hex)return null;const[r,g,b]=[0,2,4].map(offset=>{const channel=parseInt(hex.slice(offset,offset+2),16)/255;return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b}function contrast(a,b){const x=luminance(a),y=luminance(b);return x===null||y===null?21:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}var isDarkTheme=theme=>contrast(theme.colors.surface0,"#ffffff")>contrast(theme.colors.surface0,"#000000");function withAlpha(color,alpha){return/^#[0-9a-f]{6}$/i.test(color)?`${color}${Math.round(Math.min(1,Math.max(0,alpha))*255).toString(16).padStart(2,"0")}`:color}var palette={blue:["#3B82F6","#2563EB","#60A5FA","#60A5FA"],sky:["#0284C7","#0369A1","#38BDF8","#38BDF8"],cyan:["#0891B2","#0E7490","#22D3EE","#22D3EE"],teal:["#0D9488","#0F766E","#2DD4BF","#2DD4BF"],green:["#059669","#047857","#34D399","#34D399"],lime:["#65A30D","#4D7C0F","#A3E635","#A3E635"],amber:["#D97706","#B45309","#FBBF24","#FBBF24"],orange:["#EA580C","#C2410C","#FB923C","#FB923C"],red:["#F43F5E","#BE123C","#FB7185","#FB7185"],pink:["#EC4899","#BE185D","#F472B6","#F472B6"],fuchsia:["#D946EF","#A21CAF","#E879F9","#E879F9"],violet:["#8B5CF6","#7C3AED","#A78BFA","#A78BFA"],indigo:["#6366F1","#4F46E5","#818CF8","#818CF8"],gray:["#71717A","#52525B","#A1A1AA","#D4D4D8"]};function hue(theme,name,use="solid"){const[lightSolid,lightText,darkSolid,darkText]=palette[name],dark=isDarkTheme(theme),solid=dark?darkSolid:lightSolid;return use==="text"?dark?darkText:lightText:use==="soft"?withAlpha(solid,dark?.22:.13):use==="line"?withAlpha(solid,dark?.55:.4):solid}var toneHues={info:"blue",success:"green",warning:"amber",danger:"red"};function toneColor(theme,tone,use="text"){const{colors}=theme;return tone==="accent"?use==="soft"||use==="line"?withAlpha(colors.accent,use==="soft"?.16:.45):contrast(colors.accent,use==="text"?colors.surface2:colors.surface0)>=(use==="text"?4.5:3.2)?colors.accent:colors.foreground:tone==="neutral"?use==="soft"?colors.surface2:use==="line"?colors.border:colors.foregroundMuted:hue(theme,tone in toneHues?toneHues[tone]:tone,use==="mark"?"solid":use)}var hoverable=state=>state;function Button({theme,label,icon,onPress,variant="secondary",size="md",disabled=!1,busy=!1,grow=!1,tone,accessibilityLabel,testID}){const{colors}=theme,tint=variant==="danger"?"danger":tone&&tone!=="neutral"&&variant!=="primary"?tone:null,background=variant==="primary"?colors.accent:tint?toneColor(theme,tint,"soft"):variant==="secondary"?colors.surface2:"transparent",foreground=variant==="primary"?colors.accentForeground:tint?toneColor(theme,tint,"text"):variant==="ghost"?colors.foregroundMuted:colors.foreground,inactive=disabled||busy;return(0,import_jsx_runtime.jsxs)(import_react_native2.Pressable,{testID,accessibilityRole:"button",accessibilityLabel:accessibilityLabel??label,accessibilityState:{disabled:inactive,busy},...aria({busy:busy||void 0}),disabled:inactive,onPress,hitSlop:touchSlop,style:state=>{const{pressed,hovered}=hoverable(state);return[{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:space.xs+2,minHeight:size==="sm"?control.sm:control.md,paddingHorizontal:size==="sm"?10:space.md,borderRadius:radius.md,backgroundColor:background,borderWidth:tint?hairline:0,borderColor:tint?toneColor(theme,tint,"line"):colors.border,opacity:disabled?.45:pressed?.8:1},hovered&&!inactive&&variant!=="primary"&&!tint?{backgroundColor:variant==="secondary"?colors.surface2:colors.surface1}:null,grow?{flexGrow:1,flexShrink:1,minWidth:0}:null]},children:[busy?(0,import_jsx_runtime.jsx)(import_react_native2.ActivityIndicator,{size:"small",color:foreground}):icon?(0,import_jsx_runtime.jsx)(import_react_native.Icon,{name:icon,size:size==="sm"?14:16,color:foreground}):null,(0,import_jsx_runtime.jsx)(import_react_native2.Text,{numberOfLines:1,style:{color:foreground,fontSize:size==="sm"?fontSize.small:fontSize.body,fontWeight:variant==="primary"?"500":"400"},children:label})]})}function StatusDot({theme,tone,size=8}){return(0,import_jsx_runtime.jsx)(import_react_native2.View,{accessibilityElementsHidden:!0,importantForAccessibility:"no",style:{width:size,height:size,borderRadius:size/2,backgroundColor:tone==="neutral"?theme.colors.foregroundMuted:toneColor(theme,tone,"mark"),opacity:tone==="neutral"?.6:1}})}function vividSyntaxColors(theme){return{foreground:theme.colors.foreground,foregroundMuted:theme.colors.foregroundMuted,accent:hue(theme,"violet","text"),statusSuccess:hue(theme,"green","text"),statusWarning:hue(theme,"amber","text"),statusDanger:hue(theme,"red","text"),builtin:hue(theme,"orange","text"),keyword:hue(theme,"violet","text"),variable:hue(theme,"cyan","text"),operator:hue(theme,"sky","text"),parameter:hue(theme,"indigo","text"),constant:hue(theme,"lime","text"),heredoc:hue(theme,"teal","text")}}var import_react_native11=require("@getpaseo/plugin/client/react-native"),import_react10=require("react"),import_react_native12=require("react-native"),import_react2=require("react"),import_client=require("@getpaseo/plugin/client"),import_plugin2=require("@getpaseo/plugin"),import_zod3=require("zod"),TEXT_SIZES=["small","standard","large","larger"],LINE_SPACINGS=["compact","standard","relaxed"],DEFAULT_TEXT_SIZE="standard",DEFAULT_LINE_SPACING="standard",MONO_FONT_MAX=200,SIZE_SCALE={small:11/12,standard:1,large:14/12,larger:16/12},LINE_SCALE={compact:.88,standard:1,relaxed:1.25},GENERIC_FAMILIES=new Set(["monospace","ui-monospace","sans-serif","serif","system-ui","ui-sans-serif","ui-serif","cursive","fantasy"]),FAMILY_NAME=/^[\\p{L}\\p{N} ._+-]+$/u;function monoFontStack(value){const trimmed=value.trim();if(!trimmed)return"";if(trimmed.length>MONO_FONT_MAX)return null;const names=[];for(const part of trimmed.split(",")){let name=part.trim();const quote=name[0];if((quote===\'"\'||quote==="\'")&&name.length>=2&&name.endsWith(quote)&&(name=name.slice(1,-1).trim()),!name||!FAMILY_NAME.test(name))return null;name=name.replace(/\\s+/g," "),names.push(GENERIC_FAMILIES.has(name.toLowerCase())?name.toLowerCase():`"${name}"`)}return names.join(", ")}var DEFAULT_TYPOGRAPHY={scale:1,line:1},cache=new Map;function typography(size,spacing,family){if(size===DEFAULT_TEXT_SIZE&&spacing===DEFAULT_LINE_SPACING&&!family)return DEFAULT_TYPOGRAPHY;const id=`${size}|${spacing}|${family??""}`;let value=cache.get(id);return value||cache.set(id,value={scale:SIZE_SCALE[size],line:LINE_SCALE[spacing],...family?{family}:{}}),value}function typeset(styles,type){if(type===DEFAULT_TYPOGRAPHY)return styles;const out={};for(const[key,style]of Object.entries(styles))out[key]=typesetStyle(style,type);return out}function typesetStyle(style,type){if(type===DEFAULT_TYPOGRAPHY||!style||typeof style!="object"||style.fontFamily!=="monospace")return style;const source=style,next={...source};type.family&&(next.fontFamily=type.family);const size=typeof source.fontSize=="number"?source.fontSize:void 0;return size!==void 0&&(next.fontSize=Math.round(size*type.scale*2)/2),typeof source.lineHeight=="number"&&(next.lineHeight=Math.round(source.lineHeight*type.scale*type.line)),next}var paletteModeSchema=import_zod3.z.enum(["vivid","soft","high_contrast","theme"]),expansionModeSchema=import_zod3.z.enum(["always","latest","never","failures"]),takeoverScopeSchema=import_zod3.z.enum(["all","reasoning","off"]),DEFAULT_TAKEOVER="all",EXPANSION_TARGETS=[{key:"thinking",get label(){return t2("ui.thinking")},default:"latest"},{key:"read",get label(){return t2("settings.readFile")},default:"never"},{key:"edit",get label(){return t2("settings.editFile")},default:"never"},{key:"write",get label(){return t2("settings.writeFile")},default:"never"},{key:"shell",get label(){return t2("ui.command")},default:"never"},{key:"search",get label(){return t2("settings.search")},default:"latest"},{key:"fetch",get label(){return t2("settings.fetchPage")},default:"latest"},{key:"worktree_setup",get label(){return t2("settings.worktreeSetup")},default:"latest"},{key:"sub_agent",get label(){return t2("settings.subagent")},default:"latest"},{key:"plain_text",get label(){return t2("settings.plainTextResults")},default:"latest"},{key:"plan",get label(){return t2("settings.plan")},default:"latest",hidden:!0},{key:"ask",get label(){return t2("settings.ask")},default:"never"},{key:"speak",get label(){return t2("settings.readAloud")},default:"latest"},{key:"todo",get label(){return t2("settings.taskListTools")},default:"latest"},{key:"browser",get label(){return t2("settings.browserTools")},default:"latest"},{key:"unknown",get label(){return t2("settings.otherTools")},default:"latest"}],DEFAULT_EXPANSION=Object.fromEntries(EXPANSION_TARGETS.map(target=>[target.key,target.default]));function visibleExpansionTargets(scope){return EXPANSION_TARGETS.filter(target=>!("hidden"in target&&target.hidden)&&(scope==="all"||target.key==="thinking"))}var expansionSettingsSchema=import_zod3.z.object(Object.fromEntries(EXPANSION_TARGETS.map(target=>[target.key,expansionModeSchema.default(target.default)]))),densitySchema=import_zod3.z.enum(["compact","standard"]),DEFAULT_DENSITY="compact",DEFAULT_FOLD=!0,STRENGTH_KINDS=["dim","faded","soft","full"],DEFAULT_STRENGTH="full",strengthSchema=import_zod3.z.enum(STRENGTH_KINDS),commandColorsSchema=import_zod3.z.enum(["expanded","always"]),STRENGTH_OPACITY={dim:.3,faded:.45,soft:.65,full:1},DEFAULT_PIN_PROMPT=!0,LOADER_KINDS=["spinner","sparkle","orb","snake","matrix"],DEFAULT_LOADER="spinner",loaderSchema=import_zod3.z.enum(LOADER_KINDS),activitySettings=(0,import_plugin2.defineSettings)({id:"display",scope:"host",version:1,schema:import_zod3.z.object({takeover:takeoverScopeSchema.default(DEFAULT_TAKEOVER),sidebar:import_zod3.z.boolean().default(!0),followOutput:import_zod3.z.object({shell:import_zod3.z.boolean().default(!0),logs:import_zod3.z.boolean().default(!0),todo:import_zod3.z.boolean().default(!0),browser:import_zod3.z.boolean().default(!0)}).default({shell:!0,logs:!0,todo:!0,browser:!0}),wrapLines:import_zod3.z.object({diff:import_zod3.z.boolean().default(!1),code:import_zod3.z.boolean().default(!1),output:import_zod3.z.boolean().default(!1)}).default({diff:!1,code:!1,output:!1}),palette:paletteModeSchema.default("vivid"),expansion:expansionSettingsSchema.default(DEFAULT_EXPANSION),fold:import_zod3.z.boolean().default(DEFAULT_FOLD),density:densitySchema.default(DEFAULT_DENSITY),strength:strengthSchema.default(DEFAULT_STRENGTH),commandColors:commandColorsSchema.default("expanded"),thoughtTailFollow:import_zod3.z.boolean().default(!1),thoughtTailLines:import_zod3.z.number().int().min(5).max(500).default(20),turnTime:import_zod3.z.boolean().default(!1),foldTime:import_zod3.z.boolean().default(!1),pinPrompt:import_zod3.z.boolean().default(DEFAULT_PIN_PROMPT),loader:loaderSchema.default(DEFAULT_LOADER),monoFont:import_zod3.z.string().max(MONO_FONT_MAX).default(""),textSize:import_zod3.z.enum(TEXT_SIZES).default(DEFAULT_TEXT_SIZE),lineSpacing:import_zod3.z.enum(LINE_SPACINGS).default(DEFAULT_LINE_SPACING)})});function useWrapLines(area){const settings=(0,import_client.useSettings)(activitySettings);return settings.status!=="ready"?!1:settings.values.wrapLines?.[area]??!1}function useFollowBottom(scrollRef,nearBottomRef,contentKey,enabled){const scrollToEnd=(0,import_react2.useCallback)(()=>{enabled&&nearBottomRef.current&&scrollRef.current?.scrollToEnd({animated:!1})},[enabled,nearBottomRef,scrollRef]),onScroll=(0,import_react2.useCallback)(event=>{const{contentOffset,contentSize,layoutMeasurement}=event.nativeEvent;nearBottomRef.current=layoutMeasurement.height+contentOffset.y>=contentSize.height-32},[]);return(0,import_react2.useEffect)(()=>{if(!enabled)return;const timer=setTimeout(()=>{nearBottomRef.current&&scrollRef.current?.scrollToEnd({animated:!1})},0);return()=>clearTimeout(timer)},[contentKey,enabled,scrollToEnd]),{onScroll,onContentSizeChange:scrollToEnd}}var CHILD_EVENT_READ_DELAY_MS=5e3,CHILD_QUIET_READ_MS=1e4,CHILD_REMOTE_POLL_MS=3e4;function extractPaseoChildAgentId(value){if(typeof value!="object"||value===null||Array.isArray(value))return;const agentId=Reflect.get(value,"agentId");return typeof agentId=="string"&&agentId.trim()?agentId:void 0}var LOADED_STATUSES=new Set(["initializing","idle","running","error"]);function childStatus(input){if(input.heard){if(!input.agent)return null;if(input.agent.archivedAt||input.agent.status==="closed")return"closed"}return input.listed??(input.heard?input.agent?.status??null:null)}function childReadable(status){return!!status&&LOADED_STATUSES.has(status)}function childFeedHold(input){return input.status==="closed"?"closed":childReadable(input.status)?input.foreground?input.visibility==="hidden"||input.visibility==="pending"?"offscreen":null:"background":"unknown"}var NOTHING={read:!1,verify:!1,check:!1};function childFeedStart(hold){return{state:{hold,version:1,readVersion:0},read:hold===null,verify:!0,check:!1}}function childFeedStep(state,event){switch(event.type){case"hold":{if(event.hold===state.hold)return{state,...NOTHING};const version=state.hold===null&&event.running?state.version+1:state.version;return{state:{...state,hold:event.hold,version},read:event.hold===null&&version>state.readVersion,verify:!0,check:!1}}case"event":return{state:{...state,version:state.version+1},read:state.hold===null,verify:!0,check:!1};case"changed":return state.hold===null?{state:{...state,version:state.version+1},read:!0,verify:!0,check:!1}:{state:{...state,version:state.version+1},read:!1,verify:!1,check:state.hold==="closed"||state.hold==="unknown"};case"quiet":return{state,read:state.hold===null,verify:!0,check:!1};case"manual":return{state,read:!0,verify:!1,check:!1};case"poll":return{state,read:!1,verify:!1,check:!0};case"read":return{state:{...state,readVersion:Math.max(state.readVersion,event.version)},...NOTHING}}}var MINUTE=6e4,HOUR=60*MINUTE,DAY=24*HOUR,RELATIVE_DAYS=30,INSTANT=/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2})(?:\\.(\\d+))?)?(?:Z|([+-])(\\d{2}):?(\\d{2}))$/;function parseInstant(value){if(typeof value!="string")return null;const match=INSTANT.exec(value);if(!match)return null;const field=index=>Number(match[index]??0),[year,month,day,hour,minute,second]=[field(1),field(2),field(3),field(4),field(5),field(6)],[offsetHours,offsetMinutes]=[field(9),field(10)];if(month<1||month>12||day<1||hour>23||minute>59||second>59||offsetHours>23||offsetMinutes>59)return null;const date=new Date(0);if(date.setUTCFullYear(year,month-1,day),date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;date.setUTCHours(hour,minute,second,Number((match[7]??"").slice(0,3).padEnd(3,"0")));const sign=match[8]==="-"?-1:1;return date.getTime()-sign*(offsetHours*HOUR+offsetMinutes*MINUTE)}function isInstantString(value){return parseInstant(value)!==null}var two=value=>String(value).padStart(2,"0");function localMidnight(ms){const date=new Date(ms);return date.setHours(0,0,0,0),date.getTime()}function calendarDays(at,now){return Math.round((localMidnight(at)-localMidnight(now))/DAY)}function dayLabel(at,now){const days=calendarDays(at,now);if(days===0)return t2("clock.today");if(days===1)return t2("clock.tomorrow");if(days===-1)return t2("clock.yesterday");const date=new Date(at);return t2(date.getFullYear()===new Date(now).getFullYear()?"clock.monthDay":"clock.yearMonthDay",{year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate()})}function clockOf(at){const date=new Date(at);return`${two(date.getHours())}:${two(date.getMinutes())}`}function relativeLabel(at,now){const span=Math.abs(at-now),future=at>=now;if(span<MINUTE)return t2(future?"clock.soon":"clock.justNow");const minutes=Math.round(span/MINUTE);if(minutes<60)return t2(future?"clock.minutesAhead":"clock.minutesAgo",{count:minutes});const hours=Math.round(span/HOUR),days=Math.abs(calendarDays(at,now));return hours<48||days<2?t2(future?"clock.hoursAhead":"clock.hoursAgo",{count:hours}):days>RELATIVE_DAYS?null:t2(future?"clock.daysAhead":"clock.daysAgo",{count:days})}function instantParts(value,now=Date.now()){const at=parseInstant(value);return at===null?null:{at,day:dayLabel(at,now),clock:clockOf(at),relative:relativeLabel(at,now),future:at>=now}}function instantText(value,now=Date.now()){const parts=instantParts(value,now);return parts?t2(parts.relative?"clock.instantRelative":"clock.instant",{day:parts.day,clock:parts.clock,relative:parts.relative}):null}var import_react3=require("react"),import_plugin3=require("@getpaseo/plugin"),import_zod4=require("zod"),LANGUAGE_SETTINGS_ID="language",hash=import_zod4.z.string().regex(/^[0-9a-f]{16}$/),device=import_zod4.z.string().max(80),language=import_zod4.z.string().max(40),i18nCatalogRpc=(0,import_plugin3.defineRpc)({name:"i18n.catalog",input:import_zod4.z.object({device,have:hash.optional(),hash:hash.optional(),part:import_zod4.z.number().int().min(0).max(255),scope:import_zod4.z.literal("boot").optional()}).strict(),output:import_zod4.z.discriminatedUnion("status",[import_zod4.z.object({status:import_zod4.z.literal("unchanged"),language,hash}),import_zod4.z.object({status:import_zod4.z.literal("ok"),language,hash,part:import_zod4.z.number().int().nonnegative(),parts:import_zod4.z.number().int().positive().max(256),text:import_zod4.z.string()})])}),CACHE_KEY="__paseoI18nCatalogsV1",globalStore=globalThis,catalogs=globalStore[CACHE_KEY]??(globalStore[CACHE_KEY]=new Map);function deviceLanguage(){try{const tag=normalizeLanguage(Intl.DateTimeFormat().resolvedOptions().locale);if(tag)return tag}catch{}try{const browser=globalThis.navigator;return normalizeLanguage(browser?.languages?.[0]??browser?.language??"")}catch{return""}}function useI18n(){const[,setChanges]=(0,import_react3.useState)(0);return(0,import_react3.useEffect)(()=>onTextChange(()=>setChanges(value=>value+1)),[]),{t,language:translator().language}}var import_client2=require("@getpaseo/plugin/client"),import_react_native6=require("@getpaseo/plugin/client/react-native"),import_react7=require("react"),import_react_native7=require("react-native"),import_react5=require("react"),import_react_native4=require("react-native"),import_react4=require("react"),import_react_native3=require("react-native"),isForeground=state=>state!=="background"&&state!=="inactive",current=isForeground(import_react_native3.AppState.currentState),listeners2=new Set,subscription;function subscribe(listener){return listeners2.add(listener),subscription||(current=isForeground(import_react_native3.AppState.currentState),subscription=import_react_native3.AppState.addEventListener("change",state=>{const next=isForeground(state);if(next!==current){current=next;for(const notify of listeners2)notify()}})),()=>{listeners2.delete(listener),listeners2.size||(subscription?.remove(),subscription=void 0)}}function useForeground(){return(0,import_react4.useSyncExternalStore)(subscribe,()=>current,()=>current)}var import_jsx_runtime2=require("react/jsx-runtime"),web=import_react_native4.Platform.OS==="web",easeOut=import_react_native4.Easing.out(import_react_native4.Easing.quad),easeSine=import_react_native4.Easing.inOut(import_react_native4.Easing.sin),easeCubic=import_react_native4.Easing.inOut(import_react_native4.Easing.cubic),loop={animationIterationCount:"infinite"},css=web?import_react_native4.StyleSheet.create({spin:{...loop,animationKeyframes:[{"0%":{transform:"rotate(0deg)"},"100%":{transform:"rotate(360deg)"}}],animationDuration:"0.9s",animationTimingFunction:"linear"},spinSlow:{...loop,animationKeyframes:[{"0%":{transform:"rotate(0deg)"},"100%":{transform:"rotate(360deg)"}}],animationDuration:"1.8s",animationTimingFunction:"linear"},ping:{...loop,animationKeyframes:[{"0%":{transform:"scale(1)",opacity:.6},"75%":{transform:"scale(2.3)",opacity:0},"100%":{transform:"scale(2.3)",opacity:0}}],animationDuration:"1.7s",animationTimingFunction:"cubic-bezier(0, 0, 0.2, 1)"},breathe:{...loop,animationKeyframes:[{"0%":{opacity:1},"50%":{opacity:.3},"100%":{opacity:1}}],animationDuration:"2.2s",animationTimingFunction:"ease-in-out"},slide:{...loop,animationKeyframes:[{"0%":{transform:"translateX(-100%)"},"100%":{transform:"translateX(340%)"}}],animationDuration:"1.6s",animationTimingFunction:"cubic-bezier(0.4, 0, 0.2, 1)"},flash:{animationKeyframes:[{"0%":{opacity:1},"100%":{opacity:0}}],animationDuration:"1.8s",animationTimingFunction:"ease-out",animationFillMode:"forwards"},pop:{animationKeyframes:[{"0%":{transform:"scale(1.5)"},"60%":{transform:"scale(0.92)"},"100%":{transform:"scale(1)"}}],animationDuration:"0.45s",animationTimingFunction:"ease-out"},enter:{animationKeyframes:[{"0%":{opacity:0,transform:"translateY(-8px)"},"100%":{opacity:1,transform:"translateY(0px)"}}],animationDuration:"0.4s",animationTimingFunction:"ease-out"},growY:{animationKeyframes:[{"0%":{transform:"scaleY(0)"},"100%":{transform:"scaleY(1)"}}],animationDuration:"0.55s",animationTimingFunction:"cubic-bezier(0.2, 0.8, 0.2, 1)",animationFillMode:"backwards"},growX:{animationKeyframes:[{"0%":{transform:"scaleX(0)"},"100%":{transform:"scaleX(1)"}}],animationDuration:"0.6s",animationTimingFunction:"cubic-bezier(0.2, 0.8, 0.2, 1)",animationFillMode:"backwards"},paused:{animationPlayState:"paused"}}):{},shared=import_react_native4.StyleSheet.create({overlay:{position:"absolute",top:0,right:0,bottom:0,left:0,pointerEvents:"none"}}),reduced=!1,reducedListeners=new Set,reducedSubscription;function subscribeReducedMotion(listener){if(reducedListeners.add(listener),!reducedSubscription){const publish=next=>{if(next!==reduced){reduced=next;for(const notify of reducedListeners)notify()}};reducedSubscription=import_react_native4.AccessibilityInfo.addEventListener?.("reduceMotionChanged",publish)??{},import_react_native4.AccessibilityInfo.isReduceMotionEnabled?.().then(publish).catch(()=>{})}return()=>{reducedListeners.delete(listener),reducedListeners.size||(reducedSubscription?.remove?.(),reducedSubscription=void 0)}}function useReducedMotion(){return(0,import_react5.useSyncExternalStore)(subscribeReducedMotion,()=>reduced,()=>reduced)}function useLoopState(active){const foreground=useForeground(),reduce=useReducedMotion();return!active||reduce?"static":foreground?"run":"paused"}function useNativeLoop(state,duration,easing=import_react_native4.Easing.linear){const value=(0,import_react5.useRef)(new import_react_native4.Animated.Value(0)).current;return(0,import_react5.useEffect)(()=>{if(web||state!=="run"){!web&&state==="static"&&value.setValue(0);return}const animation=import_react_native4.Animated.loop(import_react_native4.Animated.timing(value,{toValue:1,duration,easing,useNativeDriver:!0,isInteraction:!1}));return animation.start(),()=>animation.stop()},[state,duration,easing,value]),value}function Spin({size,slow=!1,active=!0,children}){const state=useLoopState(active),value=useNativeLoop(state,slow?1800:900),box={width:size,height:size};return web?(0,import_jsx_runtime2.jsx)(import_react_native4.View,{style:[box,state!=="static"?slow?css.spinSlow:css.spin:null,state==="paused"?css.paused:null],children}):(0,import_jsx_runtime2.jsx)(import_react_native4.Animated.View,{style:[box,state==="static"?null:{transform:[{rotate:value.interpolate({inputRange:[0,1],outputRange:["0deg","360deg"]})}]}],children})}function Breathe({active=!0,children}){const state=useLoopState(active),value=useNativeLoop(state,2200,easeSine);return web?(0,import_jsx_runtime2.jsx)(import_react_native4.View,{style:[state!=="static"?css.breathe:null,state==="paused"?css.paused:null],children}):(0,import_jsx_runtime2.jsx)(import_react_native4.Animated.View,{style:state==="static"?null:{opacity:value.interpolate({inputRange:[0,.5,1],outputRange:[1,.3,1]})},children})}var import_react6=require("react"),import_react_native5=require("react-native");function useCardVisibility(ref){const supported=import_react_native5.Platform.OS==="web"&&typeof IntersectionObserver<"u",[visibility,setVisibility]=(0,import_react6.useState)(supported?"pending":"unsupported");return(0,import_react6.useEffect)(()=>{if(!supported)return;const node=ref.current;if(!node){setVisibility("unsupported");return}let observer;try{observer=new IntersectionObserver(entries=>{const entry=entries[entries.length-1];entry&&setVisibility(entry.isIntersecting?"visible":"hidden")}),observer.observe(node)}catch{setVisibility("unsupported");return}return()=>observer.disconnect()},[ref,supported]),visibility}var import_plugin4=require("@getpaseo/plugin"),import_zod5=require("zod"),childSummaryRowSchema=import_zod5.z.object({k:import_zod5.z.string().max(40),i:import_zod5.z.string().max(40),t:import_zod5.z.string().max(36),x:import_zod5.z.string().max(72).optional(),c:import_zod5.z.enum(["shell","file","search","agent","plan","communication","unknown","reasoning","failed"]),s:import_zod5.z.string().max(20).optional()}),childSummaryRpc=(0,import_plugin4.defineRpc)({name:"child-summary",input:import_zod5.z.object({agentId:import_zod5.z.string().min(1).max(256),manual:import_zod5.z.boolean().optional(),statusOnly:import_zod5.z.boolean().optional(),serverId:import_zod5.z.string().min(1).max(256).optional()}),output:import_zod5.z.object({status:import_zod5.z.enum(["ok","missing","closed","unconfirmed","offline"]),agent:import_zod5.z.object({status:import_zod5.z.string().max(30),waiting:import_zod5.z.enum(["approval","question"]).nullable().optional(),error:import_zod5.z.string().max(160).nullable().optional()}).nullable(),rows:import_zod5.z.array(childSummaryRowSchema).max(3),host:import_zod5.z.string().max(120).optional()})});function createChildRefresh(deps){const now=()=>deps.now?.()??Date.now(),setTimer=deps.setTimer??((run,ms)=>setTimeout(run,ms)),clearTimer=deps.clearTimer??(timer2=>clearTimeout(timer2));let last=-1/0,timer=null,busy=!1,disposed=!1,pending=null;function schedule(){if(busy||disposed||pending===null)return;timer!==null&&(clearTimer(timer),timer=null);const delay=pending.immediate?0:Math.max(0,last+CHILD_EVENT_READ_DELAY_MS-now());timer=setTimer(()=>{timer=null;const request=pending;pending=null,!(!request||disposed||!request.manual&&!request.statusOnly&&!deps.allowed())&&(busy=!0,last=now(),Promise.resolve().then(()=>{if(!disposed)return deps.read(request.manual,request.statusOnly)}).catch(()=>{}).finally(()=>{busy=!1,schedule()}))},delay)}return{request(options={}){disposed||options.quiet&&(busy||pending!==null)||(pending={immediate:!!options.immediate||!!pending?.immediate,manual:!!options.manual||!!pending?.manual,statusOnly:!!options.statusOnly&&(pending===null||pending.statusOnly)},schedule())},dispose(){disposed=!0,pending=null,timer!==null&&clearTimer(timer),timer=null}}}var import_jsx_runtime3=require("react/jsx-runtime"),EMPTY_STATE={agent:null,heard:!1,entries:[],loading:!1,error:null,unconfirmed:!1,host:null,offline:!1},ASLEEP_NOTES={get closed(){return t2("ui.thisSubagentIsClosedUnloaded")},get unknown(){return t2("ui.thisSubagentIsMissingFrom")}},unconfirmedNote=()=>t2("ui.theSubagentSLoadedState");function ChildAgentTimeline({agentId,serverId,theme,palette:palette2,styles}){const rootRef=(0,import_react7.useRef)(null),visibility=useCardVisibility(rootRef),foreground=useForeground(),feed=useChildFeed(agentId,foreground,visibility,serverId),entries=feed.view.entries,status=feed.status,waiting=status==="running"||status==="initializing"?feed.view.agent?.waiting??null:null,errorLine=status==="error"?feed.view.agent?.error??null:null,statusColor3=waiting?theme.colors.statusWarning:status?childStatusColor(status,palette2):palette2.categoryColors.agent,lookingUp=!!serverId&&!feed.view.heard&&feed.hold==="unknown",note=feed.view.offline?t2("ui.childHostOffline",{host:feed.view.host??""}):feed.hold&&!lookingUp?ASLEEP_NOTES[feed.hold]:feed.view.unconfirmed?unconfirmedNote():void 0;return(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{ref:rootRef,style:styles.childTimelineSection,children:[(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:styles.childTimelineHeader,children:[(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:{flexDirection:"row",alignItems:"center",gap:6,flexShrink:1,minWidth:0},children:[(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:styles.detailLabel,children:t2("ui.liveSubagentActivity")}),feed.view.host?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{numberOfLines:1,style:[styles.paseoListItemMeta,{flexShrink:1}],children:t2("ui.childOnHost",{host:feed.view.host})}):null]}),waiting?(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:{flexDirection:"row",alignItems:"center",gap:4},children:[(0,import_jsx_runtime3.jsx)(Breathe,{children:(0,import_jsx_runtime3.jsx)(StatusDot,{theme,tone:"warning",size:7})}),(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:[styles.paseoListItemMeta,{color:statusColor3,fontWeight:"700"}],children:t2(waiting==="question"?"ui.childAsks":"ui.childWaitsApproval")})]}):status?(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:{flexDirection:"row",alignItems:"center",gap:4},children:[status==="running"||status==="initializing"?(0,import_jsx_runtime3.jsx)(Breathe,{children:(0,import_jsx_runtime3.jsx)(StatusDot,{theme,tone:childStatusTone(status),size:7})}):(0,import_jsx_runtime3.jsx)(StatusDot,{theme,tone:childStatusTone(status),size:7}),(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:[styles.paseoListItemMeta,{color:statusColor3}],children:statusLabel(status)})]}):null]}),waiting?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:[styles.mutedText,{color:theme.colors.statusWarning}],children:t2(waiting==="question"?"ui.childAsksNote":"ui.childWaitsApprovalNote")}):errorLine?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{numberOfLines:2,style:[styles.mutedText,{color:theme.colors.statusDanger}],children:t2("ui.childFailedNote",{error:errorLine})}):null,note?(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:{gap:6,alignItems:"flex-start"},children:[(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:styles.mutedText,children:note}),(0,import_jsx_runtime3.jsx)(Button,{theme,size:"sm",tone:"fuchsia",icon:"Eye",label:entries.length>0?t2("ui.readOnceMore"):t2("ui.viewActivity"),accessibilityLabel:entries.length>0?t2("ui.readSubagentActivityOnceMore"):t2("ui.viewSubagentActivity"),busy:feed.view.loading,onPress:feed.readNow})]}):null,feed.view.error?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:styles.empty,children:t2("ui.childReadFailed",{error:feed.view.error})}):feed.view.loading&&entries.length===0?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:styles.empty,children:t2("ui.readingSubagentActivity")}):entries.length===0?note?null:(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:styles.empty,children:feed.hold?t2("ui.readingSubagentActivity"):t2("ui.noSubagentActivityYet")}):(0,import_jsx_runtime3.jsx)(import_react_native7.View,{style:styles.childTimelineList,children:entries.map(entry=>(0,import_jsx_runtime3.jsx)(ChildTimelineRow,{row:entry,palette:palette2,styles},entry.k))})]})}function useChildFeed(agentId,foreground,visibility,serverId){useI18n();const catalog=translator(),rpc=(0,import_client2.useRpc)(childSummaryRpc),rpcRef=(0,import_react7.useRef)(rpc);rpcRef.current=rpc;const listed=(0,import_client2.useAgent)(agentId,agent=>agent.status),stamp=(0,import_client2.useAgent)(agentId,agent=>`${agent.status}|${agent.updatedAt}|${agent.lastActivityAt}`),[view,setView]=(0,import_react7.useState)(EMPTY_STATE),remote=view.host!==null,listedSignal=remote?null:listed,stampSignal=remote?`remote|${view.agent?.status??""}`:stamp,listedRef=(0,import_react7.useRef)(listed);listedRef.current=listed;const status=childStatus({heard:view.heard,agent:view.agent,listed}),hold=childFeedHold({foreground,visibility,status}),holdRef=(0,import_react7.useRef)(hold);holdRef.current=hold;const runningRef=(0,import_react7.useRef)(!1),dispatchRef=(0,import_react7.useRef)(null),previousSignal=(0,import_react7.useRef)({agentId,listed:listedSignal,stamp:stampSignal,remote}),previousAgent=(0,import_react7.useRef)(agentId);(0,import_react7.useEffect)(()=>{let disposed=!1;const start=childFeedStart(holdRef.current);let state=start.state;const sameAgent=previousAgent.current===agentId;previousAgent.current=agentId,setView(current2=>sameAgent?{...EMPTY_STATE,agent:current2.agent,heard:current2.heard,unconfirmed:current2.unconfirmed,host:current2.host,offline:current2.offline}:EMPTY_STATE);const refresh=createChildRefresh({allowed:()=>holdRef.current===null,read(manual,statusOnly){return __async(this,null,function*(){if(disposed)return;if(agentId.startsWith("provider:")){setView({...EMPTY_STATE,heard:!0});return}const version=state.version;setView(current2=>({...current2,loading:!statusOnly,error:null}));try{const response=yield rpcRef.current({agentId,manual,statusOnly,...serverId?{serverId}:{}});if(disposed)return;if(version!==state.version&&(response.status!=="ok"||response.agent?.status==="closed")){setView(current2=>({...current2,loading:!1}));return}if(response.status==="unconfirmed"){setView(current2=>({...current2,loading:!1,unconfirmed:!0}));return}if(response.status==="offline"){setView(current2=>({...current2,agent:null,heard:!0,loading:!1,error:null,unconfirmed:!1,host:response.host??current2.host??serverId??null,offline:!0}));return}statusOnly||(state=childFeedStep(state,{type:"read",version}).state),setView(current2=>({agent:response.agent,heard:!0,entries:statusOnly||response.status!=="ok"?current2.entries:response.rows,loading:!1,error:null,unconfirmed:!1,host:response.host??null,offline:!1}))}catch(error){disposed||setView(current2=>({...current2,loading:!1,error:error instanceof Error?error.message:String(error)}))}})}}),dispatch=event=>{if(disposed)return;const step=childFeedStep(state,event);if(state=step.state,step.check&&refresh.request({statusOnly:!0,immediate:event.type==="changed"&&event.immediate}),!step.read)return;const manual=event.type==="manual",immediate=manual||event.type==="changed"&&event.immediate||event.type==="hold";refresh.request({manual,immediate,quiet:event.type==="quiet"})};return dispatchRef.current=dispatch,start.read?refresh.request({immediate:!0}):serverId&&listedRef.current==null&&refresh.request({statusOnly:!0,immediate:!0}),()=>{disposed=!0,dispatchRef.current=null,refresh.dispose()}},[agentId,serverId,catalog.language,catalog.hash]),(0,import_react7.useEffect)(()=>{dispatchRef.current?.({type:"hold",hold,running:runningRef.current})},[hold]),(0,import_react7.useEffect)(()=>{runningRef.current=status==="running"||status==="initializing"},[status]),(0,import_react7.useEffect)(()=>{if(hold!==null||!(status==="running"||status==="initializing"))return;const timer=setInterval(()=>dispatchRef.current?.({type:"quiet"}),CHILD_QUIET_READ_MS);return()=>clearInterval(timer)},[hold,status,stampSignal]);const onScreen=foreground&&visibility!=="hidden"&&visibility!=="pending";(0,import_react7.useEffect)(()=>{if(!remote||!onScreen||hold==="unknown"&&!view.offline||status==="running"||status==="initializing")return;const timer=setInterval(()=>dispatchRef.current?.({type:"poll"}),CHILD_REMOTE_POLL_MS);return()=>clearInterval(timer)},[remote,onScreen,hold,status,view.offline]),(0,import_react7.useEffect)(()=>{const previous=previousSignal.current;previousSignal.current={agentId,listed:listedSignal,stamp:stampSignal,remote},!(previous.agentId!==agentId||previous.remote!==remote||previous.listed===listedSignal&&previous.stamp===stampSignal)&&dispatchRef.current?.({type:"changed",immediate:previous.listed!==listedSignal})},[agentId,listedSignal,stampSignal,remote]);const readNow=(0,import_react7.useCallback)(()=>dispatchRef.current?.({type:"manual"}),[]);return{view,status,hold,readNow}}function ChildTimelineRow({row,palette:palette2,styles}){const color=row.c==="failed"?palette2.statusColors.failed:palette2.categoryColors[row.c],statusColor3=row.s==="running"||row.s==="completed"||row.s==="failed"||row.s==="canceled"?palette2.statusColors[row.s]:color;return(0,import_jsx_runtime3.jsxs)(import_react_native7.View,{style:styles.childTimelineItem,children:[(0,import_jsx_runtime3.jsx)(import_react_native6.Icon,{name:row.i,color,size:11}),(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{numberOfLines:1,style:styles.childTimelineItemTitle,children:row.t}),row.x?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{numberOfLines:1,style:styles.childTimelineItemSummary,children:row.x}):null,row.s?(0,import_jsx_runtime3.jsx)(import_react_native7.Text,{style:[styles.childTimelineItemMeta,{color:statusColor3}],children:statusLabel(row.s)}):null]})}function childStatusColor(status,palette2){switch(status){case"running":case"initializing":return palette2.statusColors.running;case"idle":return palette2.statusColors.completed;case"error":return palette2.statusColors.failed;default:return palette2.statusColors.canceled}}function childStatusTone(status){switch(status){case"running":case"initializing":return"info";case"idle":return"success";case"error":return"danger";default:return"neutral"}}var import_react_native8=require("@getpaseo/plugin/client/react-native"),import_react8=require("react"),import_react_native9=require("react-native"),import_jsx_runtime4=require("react/jsx-runtime");function CopyButton({value,label,text=t2("ui.copy2"),theme,styles}){useI18n();const toast=(0,import_react_native8.useToast)(),[copied,setCopied]=(0,import_react8.useState)(!1),copyTimer=(0,import_react8.useRef)(null);(0,import_react8.useEffect)(()=>()=>{copyTimer.current&&clearTimeout(copyTimer.current)},[]);const handleCopy=(0,import_react8.useCallback)(()=>{(0,import_react_native8.copyText)(value).then(()=>{setCopied(!0),copyTimer.current&&clearTimeout(copyTimer.current),copyTimer.current=setTimeout(()=>setCopied(!1),1500)},()=>{toast.error(t2("ui.copyFailed"))})},[toast,value]);return(0,import_jsx_runtime4.jsxs)(import_react_native9.Pressable,{accessibilityLabel:copied?t2("ui.copied"):label,accessibilityRole:"button",onPress:handleCopy,style:styles.copyButton,children:[(0,import_jsx_runtime4.jsx)(import_react_native8.Icon,{name:copied?"Check":"Copy",color:copied?toneColor(theme,"success"):styles.copyText.color,size:11}),(0,import_jsx_runtime4.jsx)(import_react_native9.Text,{style:styles.copyText,children:copied?t2("ui.copied"):text})]})}function OutputCopyButtons({clean,raw,label,theme,styles}){useI18n();const copy=(0,import_jsx_runtime4.jsx)(CopyButton,{value:clean,label,theme,styles});return clean===raw?copy:(0,import_jsx_runtime4.jsxs)(import_react_native9.View,{style:{flexDirection:"row",alignItems:"center",flexShrink:0},children:[copy,(0,import_jsx_runtime4.jsx)(CopyButton,{value:raw,label:t2("ui.originalTextWithTerminalEscape",{label}),text:t2("ui.copyOriginal"),theme,styles})]})}var import_prism_core_min=__toESM(require_prism_core_min(),1);Prism.languages.markup={comment:{pattern:/<!--(?:(?!<!--)[\\s\\S])*?-->/,greedy:!0},prolog:{pattern:/<\\?[\\s\\S]+?\\?>/,greedy:!0},doctype:{pattern:/<!DOCTYPE(?:[^>"\'[\\]]|"[^"]*"|\'[^\']*\')+(?:\\[(?:[^<"\'\\]]|"[^"]*"|\'[^\']*\'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\\]\\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(^[^\\[]*\\[)[\\s\\S]+(?=\\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|\'[^\']*\'/,greedy:!0},punctuation:/^<!|>$|[[\\]]/,"doctype-tag":/^DOCTYPE/i,name:/[^\\s<>\'"]+/}},cdata:{pattern:/<!\\[CDATA\\[[\\s\\S]*?\\]\\]>/i,greedy:!0},tag:{pattern:/<\\/?(?!\\d)[^\\s>\\/=$<%]+(?:\\s(?:\\s*[^\\s>\\/=]+(?:\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s\'">=]+(?=[\\s>]))|(?=[\\s/>])))+)?\\s*\\/?>/,greedy:!0,inside:{tag:{pattern:/^<\\/?[^\\s>\\/]+/,inside:{punctuation:/^<\\/?/,namespace:/^[^\\s>\\/:]+:/}},"special-attr":[],"attr-value":{pattern:/=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s\'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},{pattern:/^(\\s*)["\']|["\']$/,lookbehind:!0}]}},punctuation:/\\/?>/,"attr-name":{pattern:/[^\\s>\\/]+/,inside:{namespace:/^[^\\s>\\/:]+:/}}}},entity:[{pattern:/&[\\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\\da-f]{1,8};/i]},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.languages.markup.doctype.inside["internal-subset"].inside=Prism.languages.markup,Prism.hooks.add("wrap",(function(a){a.type==="entity"&&(a.attributes.title=a.content.replace(/&amp;/,"&"))})),Object.defineProperty(Prism.languages.markup.tag,"addInlined",{value:function(a,e){var s={};s["language-"+e]={pattern:/(^<!\\[CDATA\\[)[\\s\\S]+?(?=\\]\\]>$)/i,lookbehind:!0,inside:Prism.languages[e]},s.cdata=/^<!\\[CDATA\\[|\\]\\]>$/i;var t3={"included-cdata":{pattern:/<!\\[CDATA\\[[\\s\\S]*?\\]\\]>/i,inside:s}};t3["language-"+e]={pattern:/[\\s\\S]+/,inside:Prism.languages[e]};var n={};n[a]={pattern:RegExp("(<__[^>]*>)(?:<!\\\\[CDATA\\\\[(?:[^\\\\]]|\\\\](?!\\\\]>))*\\\\]\\\\]>|(?!<!\\\\[CDATA\\\\[)[^])*?(?=</__>)".replace(/__/g,(function(){return a})),"i"),lookbehind:!0,greedy:!0,inside:t3},Prism.languages.insertBefore("markup","cdata",n)}}),Object.defineProperty(Prism.languages.markup.tag,"addAttribute",{value:function(a,e){Prism.languages.markup.tag.inside["special-attr"].push({pattern:RegExp(`(^|["\'\\\\s])(?:`+a+`)\\\\s*=\\\\s*(?:"[^"]*"|\'[^\']*\'|[^\\\\s\'">=]+(?=[\\\\s>]))`,"i"),lookbehind:!0,inside:{"attr-name":/^[^\\s=]+/,"attr-value":{pattern:/=[\\s\\S]+/,inside:{value:{pattern:/(^=\\s*(["\']|(?!["\'])))\\S[\\s\\S]*(?=\\2$)/,lookbehind:!0,alias:[e,"language-"+e],inside:Prism.languages[e]},punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|\'/]}}}})}}),Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup,Prism.languages.xml=Prism.languages.extend("markup",{}),Prism.languages.ssml=Prism.languages.xml,Prism.languages.atom=Prism.languages.xml,Prism.languages.rss=Prism.languages.xml,(function(s){var e=/(?:"(?:\\\\(?:\\r\\n|[\\s\\S])|[^"\\\\\\r\\n])*"|\'(?:\\\\(?:\\r\\n|[\\s\\S])|[^\'\\\\\\r\\n])*\')/;s.languages.css={comment:/\\/\\*[\\s\\S]*?\\*\\//,atrule:{pattern:RegExp(`@[\\\\w-](?:[^;{\\\\s"\']|\\\\s+(?!\\\\s)|`+e.source+")*?(?:;|(?=\\\\s*\\\\{))"),inside:{rule:/^@[\\w-]+/,"selector-function-argument":{pattern:/(\\bselector\\s*\\(\\s*(?![\\s)]))(?:[^()\\s]|\\s+(?![\\s)])|\\((?:[^()]|\\([^()]*\\))*\\))+(?=\\s*\\))/,lookbehind:!0,alias:"selector"},keyword:{pattern:/(^|[^\\w-])(?:and|not|only|or)(?![\\w-])/,lookbehind:!0}}},url:{pattern:RegExp("\\\\burl\\\\((?:"+e.source+`|(?:[^\\\\\\\\\\r\n()"\']|\\\\\\\\[^])*)\\\\)`,"i"),greedy:!0,inside:{function:/^url/i,punctuation:/^\\(|\\)$/,string:{pattern:RegExp("^"+e.source+"$"),alias:"url"}}},selector:{pattern:RegExp(`(^|[{}\\\\s])[^{}\\\\s](?:[^{};"\'\\\\s]|\\\\s+(?![\\\\s{])|`+e.source+")*(?=\\\\s*\\\\{)"),lookbehind:!0},string:{pattern:e,greedy:!0},property:{pattern:/(^|[^-\\w\\xA0-\\uFFFF])(?!\\s)[-_a-z\\xA0-\\uFFFF](?:(?!\\s)[-\\w\\xA0-\\uFFFF])*(?=\\s*:)/i,lookbehind:!0},important:/!important\\b/i,function:{pattern:/(^|[^-a-z0-9])[-a-z0-9]+(?=\\()/i,lookbehind:!0},punctuation:/[(){};:,]/},s.languages.css.atrule.inside.rest=s.languages.css;var t3=s.languages.markup;t3&&(t3.tag.addInlined("style","css"),t3.tag.addAttribute("style","css"))})(Prism),Prism.languages.clike={comment:[{pattern:/(^|[^\\\\])\\/\\*[\\s\\S]*?(?:\\*\\/|$)/,lookbehind:!0,greedy:!0},{pattern:/(^|[^\\\\:])\\/\\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["\'])(?:\\\\(?:\\r\\n|[\\s\\S])|(?!\\1)[^\\\\\\r\\n])*\\1/,greedy:!0},"class-name":{pattern:/(\\b(?:class|extends|implements|instanceof|interface|new|trait)\\s+|\\bcatch\\s+\\()[\\w.\\\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\\\]/}},keyword:/\\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\\b/,boolean:/\\b(?:false|true)\\b/,function:/\\b\\w+(?=\\()/,number:/\\b0x[\\da-f]+\\b|(?:\\b\\d+(?:\\.\\d*)?|\\B\\.\\d+)(?:e[+-]?\\d+)?/i,operator:/[<>]=?|[!=]=?=?|--?|\\+\\+?|&&?|\\|\\|?|[?*/~^%]/,punctuation:/[{}[\\];(),.:]/},Prism.languages.javascript=Prism.languages.extend("clike",{"class-name":[Prism.languages.clike["class-name"],{pattern:/(^|[^$\\w\\xA0-\\uFFFF])(?!\\s)[_$A-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\.(?:constructor|prototype))/,lookbehind:!0}],keyword:[{pattern:/((?:^|\\})\\s*)catch\\b/,lookbehind:!0},{pattern:/(^|[^.]|\\.\\.\\.\\s*)\\b(?:as|assert(?=\\s*\\{)|async(?=\\s*(?:function\\b|\\(|[$\\w\\xA0-\\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\\s*(?:\\{|$))|for|from(?=\\s*(?:[\'"]|$))|function|(?:get|set)(?=\\s*(?:[#\\[$\\w\\xA0-\\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\\b/,lookbehind:!0}],function:/#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*(?:\\.\\s*(?:apply|bind|call)\\s*)?\\()/,number:{pattern:RegExp("(^|[^\\\\w$])(?:NaN|Infinity|0[bB][01]+(?:_[01]+)*n?|0[oO][0-7]+(?:_[0-7]+)*n?|0[xX][\\\\dA-Fa-f]+(?:_[\\\\dA-Fa-f]+)*n?|\\\\d+(?:_\\\\d+)*n|(?:\\\\d+(?:_\\\\d+)*(?:\\\\.(?:\\\\d+(?:_\\\\d+)*)?)?|\\\\.\\\\d+(?:_\\\\d+)*)(?:[Ee][+-]?\\\\d+(?:_\\\\d+)*)?)(?![\\\\w$])"),lookbehind:!0},operator:/--|\\+\\+|\\*\\*=?|=>|&&=?|\\|\\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\\.{3}|\\?\\?=?|\\?\\.?|[~:]/}),Prism.languages.javascript["class-name"][0].pattern=/(\\b(?:class|extends|implements|instanceof|interface|new)\\s+)[\\w.\\\\]+/,Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:RegExp(`((?:^|[^$\\\\w\\\\xA0-\\\\uFFFF."\'\\\\])\\\\s]|\\\\b(?:return|yield))\\\\s*)/(?:(?:\\\\[(?:[^\\\\]\\\\\\\\\\r\n]|\\\\\\\\.)*\\\\]|\\\\\\\\.|[^/\\\\\\\\\\\\[\\r\n])+/[dgimyus]{0,7}|(?:\\\\[(?:[^[\\\\]\\\\\\\\\\r\n]|\\\\\\\\.|\\\\[(?:[^[\\\\]\\\\\\\\\\r\n]|\\\\\\\\.|\\\\[(?:[^[\\\\]\\\\\\\\\\r\n]|\\\\\\\\.)*\\\\])*\\\\])*\\\\]|\\\\\\\\.|[^/\\\\\\\\\\\\[\\r\n])+/[dgimyus]{0,7}v[dgimyus]{0,7})(?=(?:\\\\s|/\\\\*(?:[^*]|\\\\*(?!/))*\\\\*/)*(?:$|[\\r\n,.;:})\\\\]]|//))`),lookbehind:!0,greedy:!0,inside:{"regex-source":{pattern:/^(\\/)[\\s\\S]+(?=\\/[a-z]*$)/,lookbehind:!0,alias:"language-regex",inside:Prism.languages.regex},"regex-delimiter":/^\\/|\\/$/,"regex-flags":/^[a-z]+$/}},"function-variable":{pattern:/#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*[=:]\\s*(?:async\\s*)?(?:\\bfunction\\b|(?:\\((?:[^()]|\\([^()]*\\))*\\)|(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*)\\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\\s+(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*)?\\s*\\(\\s*)(?!\\s)(?:[^()\\s]|\\s+(?![\\s)])|\\([^()]*\\))+(?=\\s*\\))/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(^|[^$\\w\\xA0-\\uFFFF])(?!\\s)[_$a-z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*=>)/i,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(\\(\\s*)(?!\\s)(?:[^()\\s]|\\s+(?![\\s)])|\\([^()]*\\))+(?=\\s*\\)\\s*=>)/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/((?:\\b|\\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\\w\\xA0-\\uFFFF]))(?:(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*\\s*)\\(\\s*|\\]\\s*\\(\\s*)(?!\\s)(?:[^()\\s]|\\s+(?![\\s)])|\\([^()]*\\))+(?=\\s*\\)\\s*\\{)/,lookbehind:!0,inside:Prism.languages.javascript}],constant:/\\b[A-Z](?:[A-Z_]|\\dx?)*\\b/}),Prism.languages.insertBefore("javascript","string",{hashbang:{pattern:/^#!.*/,greedy:!0,alias:"comment"},"template-string":{pattern:/`(?:\\\\[\\s\\S]|\\$\\{(?:[^{}]|\\{(?:[^{}]|\\{[^}]*\\})*\\})+\\}|(?!\\$\\{)[^\\\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\\\])(?:\\\\{2})*)\\$\\{(?:[^{}]|\\{(?:[^{}]|\\{[^}]*\\})*\\})+\\}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\\$\\{|\\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\\s\\S]+/}},"string-property":{pattern:/((?:^|[,{])[ \\t]*)(["\'])(?:\\\\(?:\\r\\n|[\\s\\S])|(?!\\2)[^\\\\\\r\\n])*\\2(?=\\s*:)/m,lookbehind:!0,greedy:!0,alias:"property"}}),Prism.languages.insertBefore("javascript","operator",{"literal-property":{pattern:/((?:^|[,{])[ \\t]*)(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?=\\s*:)/m,lookbehind:!0,alias:"property"}}),Prism.languages.markup&&(Prism.languages.markup.tag.addInlined("script","javascript"),Prism.languages.markup.tag.addAttribute("on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)","javascript")),Prism.languages.js=Prism.languages.javascript,(function(e){e.languages.typescript=e.languages.extend("javascript",{"class-name":{pattern:/(\\b(?:class|extends|implements|instanceof|interface|new|type)\\s+)(?!keyof\\b)(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*(?:\\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,lookbehind:!0,greedy:!0,inside:null},builtin:/\\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\\b/}),e.languages.typescript.keyword.push(/\\b(?:abstract|declare|is|keyof|readonly|require)\\b/,/\\b(?:asserts|infer|interface|module|namespace|type)\\b(?=\\s*(?:[{_$a-zA-Z\\xA0-\\uFFFF]|$))/,/\\btype\\b(?=\\s*(?:[\\{*]|$))/),delete e.languages.typescript.parameter,delete e.languages.typescript["literal-property"];var s=e.languages.extend("typescript",{});delete s["class-name"],e.languages.typescript["class-name"].inside=s,e.languages.insertBefore("typescript","function",{decorator:{pattern:/@[$\\w\\xA0-\\uFFFF]+/,inside:{at:{pattern:/^@/,alias:"operator"},function:/^[\\s\\S]+/}},"generic-function":{pattern:/#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*\\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\\s*\\()/,greedy:!0,inside:{function:/^#?(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*/,generic:{pattern:/<[\\s\\S]+/,alias:"class-name",inside:s}}}}),e.languages.ts=e.languages.typescript})(Prism),(function(t3){var n=t3.util.clone(t3.languages.javascript),e="(?:\\\\{<S>*\\\\.{3}(?:[^{}]|<BRACES>)*\\\\})";function a(t4,n2){return t4=t4.replace(/<S>/g,(function(){return"(?:\\\\s|//.*(?!.)|/\\\\*(?:[^*]|\\\\*(?!/))\\\\*/)"})).replace(/<BRACES>/g,(function(){return"(?:\\\\{(?:\\\\{(?:\\\\{[^{}]*\\\\}|[^{}])*\\\\}|[^{}])*\\\\})"})).replace(/<SPREAD>/g,(function(){return e})),RegExp(t4,n2)}e=a(e).source,t3.languages.jsx=t3.languages.extend("markup",n),t3.languages.jsx.tag.pattern=a(`</?(?:[\\\\w.:-]+(?:<S>+(?:[\\\\w.:$-]+(?:=(?:"(?:\\\\\\\\[^]|[^\\\\\\\\"])*"|\'(?:\\\\\\\\[^]|[^\\\\\\\\\'])*\'|[^\\\\s{\'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*/?)?>`),t3.languages.jsx.tag.inside.tag.pattern=/^<\\/?[^\\s>\\/]*/,t3.languages.jsx.tag.inside["attr-value"].pattern=/=(?!\\{)(?:"(?:\\\\[\\s\\S]|[^\\\\"])*"|\'(?:\\\\[\\s\\S]|[^\\\\\'])*\'|[^\\s\'">]+)/,t3.languages.jsx.tag.inside.tag.inside["class-name"]=/^[A-Z]\\w*(?:\\.[A-Z]\\w*)*$/,t3.languages.jsx.tag.inside.comment=n.comment,t3.languages.insertBefore("inside","attr-name",{spread:{pattern:a("<SPREAD>"),inside:t3.languages.jsx}},t3.languages.jsx.tag),t3.languages.insertBefore("inside","special-attr",{script:{pattern:a("=<BRACES>"),alias:"language-javascript",inside:{"script-punctuation":{pattern:/^=(?=\\{)/,alias:"punctuation"},rest:t3.languages.jsx}}},t3.languages.jsx.tag);var s=function(t4){return t4?typeof t4=="string"?t4:typeof t4.content=="string"?t4.content:t4.content.map(s).join(""):""},g=function(n2){for(var e2=[],a2=0;a2<n2.length;a2++){var o=n2[a2],i=!1;if(typeof o!="string"&&(o.type==="tag"&&o.content[0]&&o.content[0].type==="tag"?o.content[0].content[0].content==="</"?e2.length>0&&e2[e2.length-1].tagName===s(o.content[0].content[1])&&e2.pop():o.content[o.content.length-1].content==="/>"||e2.push({tagName:s(o.content[0].content[1]),openedBraces:0}):e2.length>0&&o.type==="punctuation"&&o.content==="{"?e2[e2.length-1].openedBraces++:e2.length>0&&e2[e2.length-1].openedBraces>0&&o.type==="punctuation"&&o.content==="}"?e2[e2.length-1].openedBraces--:i=!0),(i||typeof o=="string")&&e2.length>0&&e2[e2.length-1].openedBraces===0){var r=s(o);a2<n2.length-1&&(typeof n2[a2+1]=="string"||n2[a2+1].type==="plain-text")&&(r+=s(n2[a2+1]),n2.splice(a2+1,1)),a2>0&&(typeof n2[a2-1]=="string"||n2[a2-1].type==="plain-text")&&(r=s(n2[a2-1])+r,n2.splice(a2-1,1),a2--),n2[a2]=new t3.Token("plain-text",r,null,r)}o.content&&typeof o.content!="string"&&g(o.content)}};t3.hooks.add("after-tokenize",(function(t4){t4.language!=="jsx"&&t4.language!=="tsx"||g(t4.tokens)}))})(Prism),(function(e){var a=e.util.clone(e.languages.typescript);e.languages.tsx=e.languages.extend("jsx",a),delete e.languages.tsx.parameter,delete e.languages.tsx["literal-property"];var t3=e.languages.tsx.tag;t3.pattern=RegExp("(^|[^\\\\w$]|(?=</))(?:"+t3.pattern.source+")",t3.pattern.flags),t3.lookbehind=!0})(Prism),Prism.languages.python={comment:{pattern:/(^|[^\\\\])#.*/,lookbehind:!0,greedy:!0},"string-interpolation":{pattern:/(?:f|fr|rf)(?:("""|\'\'\')[\\s\\S]*?\\1|("|\')(?:\\\\.|(?!\\2)[^\\\\\\r\\n])*\\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:\\{\\{)*)\\{(?!\\{)(?:[^{}]|\\{(?!\\{)(?:[^{}]|\\{(?!\\{)(?:[^{}])+\\})+\\})+\\}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=\\}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\\s\\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|br|rb)?("""|\'\'\')[\\s\\S]*?\\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|br|rb)?("|\')(?:\\\\.|(?!\\1)[^\\\\\\r\\n])*\\1/i,greedy:!0},function:{pattern:/((?:^|\\s)def[ \\t]+)[a-zA-Z_]\\w*(?=\\s*\\()/g,lookbehind:!0},"class-name":{pattern:/(\\bclass\\s+)\\w+/i,lookbehind:!0},decorator:{pattern:/(^[\\t ]*)@\\w+(?:\\.\\w+)*/m,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\\./}},keyword:/\\b(?:_(?=\\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\\b/,builtin:/\\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\\b/,boolean:/\\b(?:False|None|True)\\b/,number:/\\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\\b|(?:\\b\\d+(?:_\\d+)*(?:\\.(?:\\d+(?:_\\d+)*)?)?|\\B\\.\\d+(?:_\\d+)*)(?:e[+-]?\\d+(?:_\\d+)*)?j?(?!\\w)/i,operator:/[-+%=]=?|!=|:=|\\*\\*?=?|\\/\\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\\];(),.:]/},Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest=Prism.languages.python,Prism.languages.py=Prism.languages.python,Prism.languages.json={property:{pattern:/(^|[^\\\\])"(?:\\\\.|[^\\\\"\\r\\n])*"(?=\\s*:)/,lookbehind:!0,greedy:!0},string:{pattern:/(^|[^\\\\])"(?:\\\\.|[^\\\\"\\r\\n])*"(?!\\s*:)/,lookbehind:!0,greedy:!0},comment:{pattern:/\\/\\/.*|\\/\\*[\\s\\S]*?(?:\\*\\/|$)/,greedy:!0},number:/-?\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b/i,punctuation:/[{}[\\],]/,operator:/:/,boolean:/\\b(?:false|true)\\b/,null:{pattern:/\\bnull\\b/,alias:"keyword"}},Prism.languages.webmanifest=Prism.languages.json,(function(e){var n=/[*&][^\\s[\\]{},]+/,r=/!(?:<[\\w\\-%#;/?:@&=+$,.!~*\'()[\\]]+>|(?:[a-zA-Z\\d-]*!)?[\\w\\-%#;/?:@&=+$.~*\'()]+)?/,t3="(?:"+r.source+"(?:[ 	]+"+n.source+")?|"+n.source+"(?:[ 	]+"+r.source+")?)",a="(?:[^\\\\s\\\\x00-\\\\x08\\\\x0e-\\\\x1f!\\"#%&\'*,\\\\-:>?@[\\\\]`{|}\\\\x7f-\\\\x84\\\\x86-\\\\x9f\\\\ud800-\\\\udfff\\\\ufffe\\\\uffff]|[?:-]<PLAIN>)(?:[ 	]*(?:(?![#:])<PLAIN>|:<PLAIN>))*".replace(/<PLAIN>/g,(function(){return"[^\\\\s\\\\x00-\\\\x08\\\\x0e-\\\\x1f,[\\\\]{}\\\\x7f-\\\\x84\\\\x86-\\\\x9f\\\\ud800-\\\\udfff\\\\ufffe\\\\uffff]"})),d=`"(?:[^"\\\\\\\\\\r\n]|\\\\\\\\.)*"|\'(?:[^\'\\\\\\\\\\r\n]|\\\\\\\\.)*\'`;function o(e2,n2){n2=(n2||"").replace(/m/g,"")+"m";var r2=`([:\\\\-,[{]\\\\s*(?:\\\\s<<prop>>[ 	]+)?)(?:<<value>>)(?=[ 	]*(?:$|,|\\\\]|\\\\}|(?:[\\r\n]\\\\s*)?#))`.replace(/<<prop>>/g,(function(){return t3})).replace(/<<value>>/g,(function(){return e2}));return RegExp(r2,n2)}e.languages.yaml={scalar:{pattern:RegExp(`([\\\\-:]\\\\s*(?:\\\\s<<prop>>[ 	]+)?[|>])[ 	]*(?:((?:\\r?\n|\\r)[ 	]+)\\\\S[^\\r\n]*(?:\\\\2[^\\r\n]+)*)`.replace(/<<prop>>/g,(function(){return t3}))),lookbehind:!0,alias:"string"},comment:/#.*/,key:{pattern:RegExp(`((?:^|[:\\\\-,[{\\r\n?])[ 	]*(?:<<prop>>[ 	]+)?)<<key>>(?=\\\\s*:\\\\s)`.replace(/<<prop>>/g,(function(){return t3})).replace(/<<key>>/g,(function(){return"(?:"+a+"|"+d+")"}))),lookbehind:!0,greedy:!0,alias:"atrule"},directive:{pattern:/(^[ \\t]*)%.+/m,lookbehind:!0,alias:"important"},datetime:{pattern:o("\\\\d{4}-\\\\d\\\\d?-\\\\d\\\\d?(?:[tT]|[ 	]+)\\\\d\\\\d?:\\\\d{2}:\\\\d{2}(?:\\\\.\\\\d*)?(?:[ 	]*(?:Z|[-+]\\\\d\\\\d?(?::\\\\d{2})?))?|\\\\d{4}-\\\\d{2}-\\\\d{2}|\\\\d\\\\d?:\\\\d{2}(?::\\\\d{2}(?:\\\\.\\\\d*)?)?"),lookbehind:!0,alias:"number"},boolean:{pattern:o("false|true","i"),lookbehind:!0,alias:"important"},null:{pattern:o("null|~","i"),lookbehind:!0,alias:"important"},string:{pattern:o(d),lookbehind:!0,greedy:!0},number:{pattern:o("[+-]?(?:0x[\\\\da-f]+|0o[0-7]+|(?:\\\\d+(?:\\\\.\\\\d*)?|\\\\.\\\\d+)(?:e[+-]?\\\\d+)?|\\\\.inf|\\\\.nan)","i"),lookbehind:!0},tag:r,important:n,punctuation:/---|[:[\\]{}\\-,|>?]|\\.\\.\\./},e.languages.yml=e.languages.yaml})(Prism),(function(n){function e(n2){return n2=n2.replace(/<inner>/g,(function(){return`(?:\\\\\\\\.|[^\\\\\\\\\n\\r]|(?:\n|\\r\n?)(?![\\r\n]))`})),RegExp("((?:^|[^\\\\\\\\])(?:\\\\\\\\{2})*)(?:"+n2+")")}var t3="(?:\\\\\\\\.|``(?:[^`\\r\\n]|`(?!`))+``|`[^`\\r\\n]+`|[^\\\\\\\\|\\r\\n`])+",a=`\\\\|?__(?:\\\\|__)+\\\\|?(?:(?:\n|\\r\n?)|(?![^]))`.replace(/__/g,(function(){return t3})),i=`\\\\|?[ 	]*:?-{3,}:?[ 	]*(?:\\\\|[ 	]*:?-{3,}:?[ 	]*)+\\\\|?(?:\n|\\r\n?)`;n.languages.markdown=n.languages.extend("markup",{}),n.languages.insertBefore("markdown","prolog",{"front-matter-block":{pattern:/(^(?:\\s*[\\r\\n])?)---(?!.)[\\s\\S]*?[\\r\\n]---(?!.)/,lookbehind:!0,greedy:!0,inside:{punctuation:/^---|---$/,"front-matter":{pattern:/\\S+(?:\\s+\\S+)*/,alias:["yaml","language-yaml"],inside:n.languages.yaml}}},blockquote:{pattern:/^>(?:[\\t ]*>)*/m,alias:"punctuation"},table:{pattern:RegExp("^"+a+i+"(?:"+a+")*","m"),inside:{"table-data-rows":{pattern:RegExp("^("+a+i+")(?:"+a+")*$"),lookbehind:!0,inside:{"table-data":{pattern:RegExp(t3),inside:n.languages.markdown},punctuation:/\\|/}},"table-line":{pattern:RegExp("^("+a+")"+i+"$"),lookbehind:!0,inside:{punctuation:/\\||:?-{3,}:?/}},"table-header-row":{pattern:RegExp("^"+a+"$"),inside:{"table-header":{pattern:RegExp(t3),alias:"important",inside:n.languages.markdown},punctuation:/\\|/}}}},code:[{pattern:/((?:^|\\n)[ \\t]*\\n|(?:^|\\r\\n?)[ \\t]*\\r\\n?)(?: {4}|\\t).+(?:(?:\\n|\\r\\n?)(?: {4}|\\t).+)*/,lookbehind:!0,alias:"keyword"},{pattern:/^```[\\s\\S]*?^```$/m,greedy:!0,inside:{"code-block":{pattern:/^(```.*(?:\\n|\\r\\n?))[\\s\\S]+?(?=(?:\\n|\\r\\n?)^```$)/m,lookbehind:!0},"code-language":{pattern:/^(```).+/,lookbehind:!0},punctuation:/```/}}],title:[{pattern:/\\S.*(?:\\n|\\r\\n?)(?:==+|--+)(?=[ \\t]*$)/m,alias:"important",inside:{punctuation:/==+$|--+$/}},{pattern:/(^\\s*)#.+/m,lookbehind:!0,alias:"important",inside:{punctuation:/^#+|#+$/}}],hr:{pattern:/(^\\s*)([*-])(?:[\\t ]*\\2){2,}(?=\\s*$)/m,lookbehind:!0,alias:"punctuation"},list:{pattern:/(^\\s*)(?:[*+-]|\\d+\\.)(?=[\\t ].)/m,lookbehind:!0,alias:"punctuation"},"url-reference":{pattern:/!?\\[[^\\]]+\\]:[\\t ]+(?:\\S+|<(?:\\\\.|[^>\\\\])+>)(?:[\\t ]+(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|\\((?:\\\\.|[^)\\\\])*\\)))?/,inside:{variable:{pattern:/^(!?\\[)[^\\]]+/,lookbehind:!0},string:/(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|\\((?:\\\\.|[^)\\\\])*\\))$/,punctuation:/^[\\[\\]!:]|[<>]/},alias:"url"},bold:{pattern:e("\\\\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\\\\b|\\\\*\\\\*(?:(?!\\\\*)<inner>|\\\\*(?:(?!\\\\*)<inner>)+\\\\*)+\\\\*\\\\*"),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^..)[\\s\\S]+(?=..$)/,lookbehind:!0,inside:{}},punctuation:/\\*\\*|__/}},italic:{pattern:e("\\\\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\\\\b|\\\\*(?:(?!\\\\*)<inner>|\\\\*\\\\*(?:(?!\\\\*)<inner>)+\\\\*\\\\*)+\\\\*"),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^.)[\\s\\S]+(?=.$)/,lookbehind:!0,inside:{}},punctuation:/[*_]/}},strike:{pattern:e("(~~?)(?:(?!~)<inner>)+\\\\2"),lookbehind:!0,greedy:!0,inside:{content:{pattern:/(^~~?)[\\s\\S]+(?=\\1$)/,lookbehind:!0,inside:{}},punctuation:/~~?/}},"code-snippet":{pattern:/(^|[^\\\\`])(?:``[^`\\r\\n]+(?:`[^`\\r\\n]+)*``(?!`)|`[^`\\r\\n]+`(?!`))/,lookbehind:!0,greedy:!0,alias:["code","keyword"]},url:{pattern:e(\'!?\\\\[(?:(?!\\\\])<inner>)+\\\\](?:\\\\([^\\\\s)]+(?:[	 ]+"(?:\\\\\\\\.|[^"\\\\\\\\])*")?\\\\)|[ 	]?\\\\[(?:(?!\\\\])<inner>)+\\\\])\'),lookbehind:!0,greedy:!0,inside:{operator:/^!/,content:{pattern:/(^\\[)[^\\]]+(?=\\])/,lookbehind:!0,inside:{}},variable:{pattern:/(^\\][ \\t]?\\[)[^\\]]+(?=\\]$)/,lookbehind:!0},url:{pattern:/(^\\]\\()[^\\s)]+/,lookbehind:!0},string:{pattern:/(^[ \\t]+)"(?:\\\\.|[^"\\\\])*"(?=\\)$)/,lookbehind:!0}}}}),["url","bold","italic","strike"].forEach((function(e2){["url","bold","italic","strike","code-snippet"].forEach((function(t4){e2!==t4&&(n.languages.markdown[e2].inside.content.inside[t4]=n.languages.markdown[t4])}))})),n.hooks.add("after-tokenize",(function(n2){n2.language!=="markdown"&&n2.language!=="md"||(function n3(e2){if(e2&&typeof e2!="string")for(var t4=0,a2=e2.length;t4<a2;t4++){var i2=e2[t4];if(i2.type==="code"){var r2=i2.content[1],o2=i2.content[3];if(r2&&o2&&r2.type==="code-language"&&o2.type==="code-block"&&typeof r2.content=="string"){var l2=r2.content.replace(/\\b#/g,"sharp").replace(/\\b\\+\\+/g,"pp"),s="language-"+(l2=(/[a-z][\\w-]*/i.exec(l2)||[""])[0].toLowerCase());o2.alias?typeof o2.alias=="string"?o2.alias=[o2.alias,s]:o2.alias.push(s):o2.alias=[s]}}else n3(i2.content)}})(n2.tokens)})),n.hooks.add("wrap",(function(e2){if(e2.type==="code-block"){for(var t4="",a2=0,i2=e2.classes.length;a2<i2;a2++){var s=e2.classes[a2],d=/language-(.+)/.exec(s);if(d){t4=d[1];break}}var p=n.languages[t4];if(p)e2.content=n.highlight(e2.content.replace(r,"").replace(/&(\\w{1,8}|#x?[\\da-f]{1,8});/gi,(function(n2,e3){var t5;return(e3=e3.toLowerCase())[0]==="#"?(t5=e3[1]==="x"?parseInt(e3.slice(2),16):Number(e3.slice(1)),l(t5)):o[e3]||n2})),p,t4);else if(t4&&t4!=="none"&&n.plugins.autoloader){var u="md-"+new Date().valueOf()+"-"+Math.floor(1e16*Math.random());e2.attributes.id=u,n.plugins.autoloader.loadLanguages(t4,(function(){var e3=document.getElementById(u);e3&&(e3.innerHTML=n.highlight(e3.textContent,n.languages[t4],t4))}))}}}));var r=RegExp(n.languages.markup.tag.pattern.source,"gi"),o={amp:"&",lt:"<",gt:">",quot:\'"\'},l=String.fromCodePoint||String.fromCharCode;n.languages.md=n.languages.markdown})(Prism),Prism.languages.go=Prism.languages.extend("clike",{string:{pattern:/(^|[^\\\\])"(?:\\\\.|[^"\\\\\\r\\n])*"|`[^`]*`/,lookbehind:!0,greedy:!0},keyword:/\\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\\b/,boolean:/\\b(?:_|false|iota|nil|true)\\b/,number:[/\\b0(?:b[01_]+|o[0-7_]+)i?\\b/i,/\\b0x(?:[a-f\\d_]+(?:\\.[a-f\\d_]*)?|\\.[a-f\\d_]+)(?:p[+-]?\\d+(?:_\\d+)*)?i?(?!\\w)/i,/(?:\\b\\d[\\d_]*(?:\\.[\\d_]*)?|\\B\\.\\d[\\d_]*)(?:e[+-]?[\\d_]+)?i?(?!\\w)/i],operator:/[*\\/%^!=]=?|\\+[=+]?|-[=-]?|\\|[=|]?|&(?:=|&|\\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\\.\\.\\./,builtin:/\\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\\b/}),Prism.languages.insertBefore("go","string",{char:{pattern:/\'(?:\\\\.|[^\'\\\\\\r\\n]){0,10}\'/,greedy:!0}}),delete Prism.languages.go["class-name"],(function(e){for(var a="/\\\\*(?:[^*/]|\\\\*(?!/)|/(?!\\\\*)|<self>)*\\\\*/",t3=0;t3<2;t3++)a=a.replace(/<self>/g,(function(){return a}));a=a.replace(/<self>/g,(function(){return"[^\\\\s\\\\S]"})),e.languages.rust={comment:[{pattern:RegExp("(^|[^\\\\\\\\])"+a),lookbehind:!0,greedy:!0},{pattern:/(^|[^\\\\:])\\/\\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/b?"(?:\\\\[\\s\\S]|[^\\\\"])*"|b?r(#*)"(?:[^"]|"(?!\\1))*"\\1/,greedy:!0},char:{pattern:/b?\'(?:\\\\(?:x[0-7][\\da-fA-F]|u\\{(?:[\\da-fA-F]_*){1,6}\\}|.)|[^\\\\\\r\\n\\t\'])\'/,greedy:!0},attribute:{pattern:/#!?\\[(?:[^\\[\\]"]|"(?:\\\\[\\s\\S]|[^\\\\"])*")*\\]/,greedy:!0,alias:"attr-name",inside:{string:null}},"closure-params":{pattern:/([=(,:]\\s*|\\bmove\\s*)\\|[^|]*\\||\\|[^|]*\\|(?=\\s*(?:\\{|->))/,lookbehind:!0,greedy:!0,inside:{"closure-punctuation":{pattern:/^\\||\\|$/,alias:"punctuation"},rest:null}},"lifetime-annotation":{pattern:/\'\\w+/,alias:"symbol"},"fragment-specifier":{pattern:/(\\$\\w+:)[a-z]+/,lookbehind:!0,alias:"punctuation"},variable:/\\$\\w+/,"function-definition":{pattern:/(\\bfn\\s+)\\w+/,lookbehind:!0,alias:"function"},"type-definition":{pattern:/(\\b(?:enum|struct|trait|type|union)\\s+)\\w+/,lookbehind:!0,alias:"class-name"},"module-declaration":[{pattern:/(\\b(?:crate|mod)\\s+)[a-z][a-z_\\d]*/,lookbehind:!0,alias:"namespace"},{pattern:/(\\b(?:crate|self|super)\\s*)::\\s*[a-z][a-z_\\d]*\\b(?:\\s*::(?:\\s*[a-z][a-z_\\d]*\\s*::)*)?/,lookbehind:!0,alias:"namespace",inside:{punctuation:/::/}}],keyword:[/\\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\\b/,/\\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\\b/],function:/\\b[a-z_]\\w*(?=\\s*(?:::\\s*<|\\())/,macro:{pattern:/\\b\\w+!/,alias:"property"},constant:/\\b[A-Z_][A-Z_\\d]+\\b/,"class-name":/\\b[A-Z]\\w*\\b/,namespace:{pattern:/(?:\\b[a-z][a-z_\\d]*\\s*::\\s*)*\\b[a-z][a-z_\\d]*\\s*::(?!\\s*<)/,inside:{punctuation:/::/}},number:/\\b(?:0x[\\dA-Fa-f](?:_?[\\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\\d(?:_?\\d)*)?\\.)?\\d(?:_?\\d)*(?:[Ee][+-]?\\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\\b/,boolean:/\\b(?:false|true)\\b/,punctuation:/->|\\.\\.=|\\.{1,3}|::|[{}[\\];(),:]/,operator:/[-+*\\/%!^]=?|=[=>]?|&[&=]?|\\|[|=]?|<<?=?|>>?=?|[@?]/},e.languages.rust["closure-params"].inside.rest=e.languages.rust,e.languages.rust.attribute.inside.string=e.languages.rust.string})(Prism);var import_react9=require("react"),BASH_STRING=(()=>{try{return new RegExp(String.raw`"(?<=(?:^|[^\\\\])(?:\\\\\\\\)*")(?:\\\\[\\s\\S]|[^"\\\\])*"|\'[^\']*\'`)}catch{return/"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'[^\']*\'/}})(),bashSubshell={pattern:/\\$\\([^)]{0,400}\\)/,greedy:!0,inside:void 0},bashBacktick={pattern:/`[^`\\r\\n]{0,400}`/,greedy:!0,inside:void 0},bashStringInside={subshell:bashSubshell,backtick:bashBacktick};import_prism_core_min.default.languages.bash={comment:{pattern:/(^|[\\t ])#.*/m,lookbehind:!0,greedy:!0},string:{pattern:BASH_STRING,greedy:!0,inside:bashStringInside},variable:/\\$(?:\\w+|\\{[^}\\r\\n]{0,256}\\}|[?$!#@*-])/,subshell:bashSubshell,backtick:bashBacktick,heredoc:{pattern:/<<-?["\']?(\\w{1,64})["\']?(?:[^\\n]{0,120}(\\n[^\\n]{0,200}){0,6}?\\n\\1(?![\\w])|(?=$|[\\s|&;)<]))/m,greedy:!0},keyword:/\\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|select|return|export|local)\\b/,builtin:/\\b(?:test|echo|cd|pwd|ls|cat|mkdir|rm|cp|mv|touch|grep|find|sed|awk|curl|git|node|npm|bun|deno)\\b/,constant:/\\b(?:true|false)\\b/,parameter:{pattern:/(\\s)--?[\\w][\\w=-]{0,40}/,lookbehind:!0},operator:/&&|\\|\\||[|&;<>]/,punctuation:/[(){}[\\]]/};var bashInner={...import_prism_core_min.default.languages.bash};delete bashInner.subshell,delete bashInner.backtick,bashInner.string={pattern:BASH_STRING,greedy:!0},bashSubshell.inside=bashInner,bashBacktick.inside=bashInner;var DEFAULT_DARK_COLORS={foreground:"#e6edf3",foregroundMuted:"#8b949e",accent:"#58a6ff",statusSuccess:"#7ee787",statusWarning:"#d29922",statusDanger:"#ff7b72"},DEFAULT_LIGHT_COLORS={foreground:"#1f2328",foregroundMuted:"#656d76",accent:"#0969da",statusSuccess:"#1a7f37",statusWarning:"#9a6700",statusDanger:"#cf222e"};function resolveSyntaxColors(input){return typeof input=="boolean"?input?DEFAULT_DARK_COLORS:DEFAULT_LIGHT_COLORS:input}var MAX_HIGHLIGHT_CHARS=1e5;function parseAnsiToLines(code,colors){const lines=[],ansiRegex=/\\u001b\\[([0-9;]*)m/g,ansiColors={30:colors.foregroundMuted,31:colors.statusDanger??"#ff7b72",32:colors.statusSuccess??"#7ee787",33:colors.statusWarning??"#d29922",34:colors.accent,35:colors.accent,36:colors.accent,37:colors.foreground,90:colors.foregroundMuted,91:colors.statusDanger??"#ff7b72",92:colors.statusSuccess??"#7ee787",93:colors.statusWarning??"#d29922",94:colors.accent,95:colors.accent,96:colors.accent,97:colors.foreground};let currentColor,currentFontStyle=0;for(const rawLine of code.split(`\n`)){const currentLine=[];lines.push(currentLine);let lastIndex=0,match;for(ansiRegex.lastIndex=0;(match=ansiRegex.exec(rawLine))!==null;){const textBefore=rawLine.slice(lastIndex,match.index);textBefore.length>0&&currentLine.push({content:textBefore,color:currentColor,fontStyle:currentFontStyle||void 0}),lastIndex=ansiRegex.lastIndex;const codes=match[1]?match[1].split(";").map(Number):[0];let idx=0;for(;idx<codes.length;){const c=codes[idx];if(c===0)currentColor=void 0,currentFontStyle=0,idx++;else if(c===1)currentFontStyle|=2,idx++;else if(c===3)currentFontStyle|=1,idx++;else if(c===4)currentFontStyle|=4,idx++;else if(c===22)currentFontStyle&=-3,idx++;else if(c===23)currentFontStyle&=-2,idx++;else if(c===24)currentFontStyle&=-5,idx++;else if(c===39)currentColor=void 0,idx++;else if(c===38||c===48){const isFg=c===38,mode=codes[idx+1];if(mode===5){const colorIdx=codes[idx+2];colorIdx!==void 0&&isFg&&(colorIdx<16?currentColor=ansiColors[colorIdx<8?30+colorIdx:90+(colorIdx-8)]:currentColor=colors.foreground),idx+=3}else if(mode===2){const r=codes[idx+2],g=codes[idx+3],b=codes[idx+4];r!==void 0&&g!==void 0&&b!==void 0&&isFg&&(currentColor=`rgb(${r},${g},${b})`),idx+=5}else idx++}else ansiColors[c]&&(currentColor=ansiColors[c]),idx++}}const remaining=rawLine.slice(lastIndex);remaining.length>0&&currentLine.push({content:remaining,color:currentColor,fontStyle:currentFontStyle||void 0})}return lines}function resolveTokenColor(type,colors){const override=colors[type];if(override)return override;switch(type){case"comment":case"prolog":case"doctype":case"cdata":case"punctuation":case"operator":return colors.foregroundMuted;case"string":case"char":case"attr-value":case"regex":case"template-string":case"heredoc":return colors.statusSuccess??colors.accent;case"keyword":case"selector":case"important":case"atrule":case"boolean":return colors.accent;case"number":case"constant":return colors.statusWarning??colors.accent;case"function":case"function-variable":case"method":case"builtin":case"class-name":return colors.accent;case"variable":case"property":case"tag":case"attr-name":default:return colors.foreground}}function tokenizeToLines(code,grammar,colors){const rawTokens=import_prism_core_min.default.tokenize(code,grammar),lines=[[]];function pushText(content,type){const parts=content.split(`\n`);for(let i=0;i<parts.length;i++){i>0&&lines.push([]);const part=parts[i];if(part&&part.length>0){const currentLine=lines[lines.length-1];currentLine&&currentLine.push({content:part,color:type?resolveTokenColor(type,colors):colors.foreground,fontStyle:type==="comment"?1:void 0})}}}function walk(token,parentType){if(typeof token=="string")pushText(token,parentType);else if(Array.isArray(token))for(const item of token)walk(item,parentType);else if(token&&typeof token=="object"){const type=token.type||parentType;typeof token.content=="string"?pushText(token.content,type):walk(token.content,type)}}for(const token of rawTokens)walk(token);return lines}var HIGHLIGHT_CHUNK_CHARS=4e3,HIGHLIGHT_BUDGET_MS=100;function plainLine(line,colors){return line?[{content:line,color:colors.foreground}]:[]}function tokenizeInChunks(code,grammar,colors,now=Date.now){if(code.length<=HIGHLIGHT_CHUNK_CHARS)return tokenizeToLines(code,grammar,colors);const rows=code.split(`\n`),lines=[],started=now();let index=0;for(;index<rows.length&&now()-started<=HIGHLIGHT_BUDGET_MS;){if(rows[index].length>HIGHLIGHT_CHUNK_CHARS){lines.push(plainLine(rows[index],colors)),index+=1;continue}let end=index+1,size=rows[index].length,blank=-1;for(;end<rows.length&&size+1+rows[end].length<=HIGHLIGHT_CHUNK_CHARS;)size+=1+rows[end].length,!rows[end].trim()&&size>=HIGHLIGHT_CHUNK_CHARS/2&&(blank=end),end+=1;end<rows.length&&blank>index&&(end=blank+1),lines.push(...tokenizeToLines(rows.slice(index,end).join(`\n`),grammar,colors)),index=end}for(;index<rows.length;index++)lines.push(plainLine(rows[index],colors));return lines}var tokenCache=new Map,TOKEN_CACHE_LIMIT=40,cachedChars=0;function colorsKey(colors){return[colors.foreground,colors.foregroundMuted,colors.accent,colors.statusSuccess??"",colors.statusWarning??"",colors.statusDanger??"",colors.builtin??"",colors.keyword??"",colors.variable??"",colors.operator??"",colors.parameter??"",colors.constant??"",colors.heredoc??""].join("|")}function emphasizeShellHead(lines){for(const token of lines[0]??[]){const text=token.content.trim();if(!(!text||token.fontStyle&&token.fontStyle&1)){if(text.startsWith("#"))break;if(/^[\\w.$/{"\']/.test(text)){token.fontStyle=(token.fontStyle??0)|2;break}}}return lines}function cacheKey(code,language3,colors){return`${colorsKey(colors)}:${language3}:${code}`}function cacheTokens(key,tokens,codeLength){if(tokenCache.has(key)){const existing=tokenCache.get(key);cachedChars-=existing.size,tokenCache.delete(key)}for(tokenCache.set(key,{tokens,size:codeLength}),cachedChars+=codeLength;tokenCache.size>TOKEN_CACHE_LIMIT||cachedChars>5e5;){const oldestKey=tokenCache.keys().next().value;if(oldestKey===void 0)break;const oldest=tokenCache.get(oldestKey);oldest&&(cachedChars-=oldest.size),tokenCache.delete(oldestKey)}}function normalizeLanguage2(language3){const normalized=language3.trim().toLowerCase();if(!normalized)return null;if(normalized==="shell"||normalized==="sh")return"bash";if(normalized==="ansi")return"ansi";if(normalized==="text"||normalized==="plain")return"text";const resolved={js:"javascript",jsx:"jsx",md:"markdown",py:"python",sh:"bash",ts:"typescript",tsx:"tsx",yml:"yaml",html:"markup",xml:"markup"}[normalized]??normalized;return resolved in import_prism_core_min.default.languages?resolved:null}function highlightCodeSync(code,language3,colorsInput){if(!code||code.length>MAX_HIGHLIGHT_CHARS)return null;const normalizedLanguage=normalizeLanguage2(language3);if(!normalizedLanguage)return null;const colors=resolveSyntaxColors(colorsInput),key=cacheKey(code,normalizedLanguage,colors),cached=tokenCache.get(key);if(cached)return tokenCache.delete(key),tokenCache.set(key,cached),cached.tokens;let tokens;if(normalizedLanguage==="ansi")tokens=parseAnsiToLines(code,colors);else if(normalizedLanguage==="text")tokens=code.split(`\n`).map(line=>[{content:line}]);else{const grammar=import_prism_core_min.default.languages[normalizedLanguage];if(!grammar)return null;tokens=tokenizeInChunks(code,grammar,colors)}return cacheTokens(key,tokens,code.length),tokens}function useHighlightTokens(code,language3,colorsInput){const[tokens,setTokens]=(0,import_react9.useState)(null);return(0,import_react9.useEffect)(()=>{let cancelled=!1;if(!code||!language3)return setTokens(null),()=>{};const normalizedLanguage=normalizeLanguage2(language3);if(normalizedLanguage){const colors=resolveSyntaxColors(colorsInput),cached=tokenCache.get(cacheKey(code,normalizedLanguage,colors));if(cached)return setTokens(cached.tokens),()=>{}}setTokens(null);const timer=setTimeout(()=>{if(cancelled)return;const result=highlightCodeSync(code,language3,colorsInput);cancelled||setTokens(result)},0);return()=>{cancelled=!0,clearTimeout(timer)}},[code,language3,typeof colorsInput=="boolean"?colorsInput:colorsKey(resolveSyntaxColors(colorsInput))]),tokens}var import_react_native10=require("react-native"),import_jsx_runtime5=require("react/jsx-runtime");function statusColor(status,palette2){switch(status?.toLowerCase()){case"running":case"initializing":return palette2.statusColors.running;case"completed":case"idle":case"active":case"succeeded":case"healthy":case"success":return palette2.statusColors.completed;case"failed":case"error":case"unhealthy":return palette2.statusColors.failed;case"canceled":case"paused":case"stopped":case"closed":return palette2.statusColors.canceled;default:return palette2.categoryColors.unknown}}function StatusPill({value,palette:palette2,styles}){useI18n();const color=statusColor(value,palette2);return(0,import_jsx_runtime5.jsx)(import_react_native10.View,{style:styles.paseoStatus,children:(0,import_jsx_runtime5.jsx)(import_react_native10.Text,{style:[styles.paseoStatusText,{color}],children:statusLabel(value)})})}var import_jsx_runtime6=require("react/jsx-runtime");function asRecord5(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)?value:null}function stringValue3(value){return typeof value=="string"&&value.length>0?value:void 0}function fieldString3(record,key){return stringValue3(record?.[key])}function fieldNumber(record,key){const value=record?.[key];return typeof value=="number"?value:void 0}function fieldBoolean(record,key){const value=record?.[key];return typeof value=="boolean"?value:void 0}function fieldArray(record,key){return Array.isArray(record?.[key])?record[key]:[]}function scalarText(value){return value==null?"\\u2014":typeof value=="boolean"?t2(value?"ui.yes":"ui.no"):typeof value=="string"||typeof value=="number"?String(value):formatUnknownValue(value)}function stableItemKey(value,prefix){const record=asRecord5(value),identity=record?.id??record?.agentId??record?.workspaceId??record?.browserId;if(typeof identity=="string"||typeof identity=="number")return`${prefix}-${identity}`;try{return`${prefix}-${JSON.stringify(value)}`}catch{return prefix}}function Section({title,children,styles}){return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.section,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.detailLabel,children:title}),children]})}var ROW_FILL={flex:1,minWidth:0},ROW_TAIL={flexShrink:1,maxWidth:"60%"},minuteListeners=new Set,minuteTimer=null,minuteNow=Date.now();function subscribeMinute(listener){return minuteListeners.add(listener),minuteTimer===null&&(minuteTimer=setInterval(()=>{minuteNow=Date.now();for(const each of minuteListeners)each()},6e4)),()=>{minuteListeners.delete(listener),minuteListeners.size===0&&minuteTimer!==null&&(clearInterval(minuteTimer),minuteTimer=null)}}var idleMinute=()=>()=>{};function readMinute(){return minuteTimer===null&&Date.now()-minuteNow>=6e4&&(minuteNow=Date.now()),minuteNow}function useMinuteNow(){const foreground=useForeground();return(0,import_react10.useSyncExternalStore)(foreground?subscribeMinute:idleMinute,readMinute,readMinute)}function InstantText({value,prefix="",style,containerStyle,palette:palette2,styles}){const now=useMinuteNow(),[raw,setRaw]=(0,import_react10.useState)(!1),parts=instantParts(value,now);return parts?(0,import_jsx_runtime6.jsx)(import_react_native12.Pressable,{accessibilityRole:"button",accessibilityLabel:t2("ui.original",{prefix,time:instantText(value,now),value}),accessibilityState:{selected:raw},...aria({pressed:raw}),onPress:()=>setRaw(current2=>!current2),style:[{flexDirection:"row"},containerStyle],children:(0,import_jsx_runtime6.jsxs)(import_react_native12.Text,{selectable:!0,style:[style,{flexShrink:1,minWidth:0}],children:[raw?`${prefix}${value}`:t2("ui.clockLine",{prefix,day:parts.day,clock:parts.clock}),!raw&&parts.relative?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:{color:parts.future?palette2.statusColors.running:styles.mutedText.color},children:t2("ui.relativeSuffix",{relative:parts.relative})}):null]})}):(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style,children:`${prefix}${value}`})}function ScalarValue({value,palette:palette2,styles}){return isInstantString(value)?(0,import_jsx_runtime6.jsx)(InstantText,{value,style:styles.paseoValue,palette:palette2,styles}):(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoValue,children:scalarText(value)})}function PaseoFieldValue({value,palette:palette2,styles,depth=0}){if(depth>2)return(0,import_jsx_runtime6.jsx)(ScalarValue,{value,palette:palette2,styles});const record=asRecord5(value);if(record){const entries=Object.entries(record).filter(([,child])=>child!==void 0);return entries.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoValue,children:"\\u2014"}):(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoRows,children:entries.map(([key,child])=>(0,import_jsx_runtime6.jsx)(PaseoField,{label:humanizeKey(key),value:child,palette:palette2,styles,depth:depth+1},`${key}-${stableItemKey(child,key)}`))})}return Array.isArray(value)?value.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoValue,children:"\\u2014"}):(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoRows,children:value.map(child=>(0,import_jsx_runtime6.jsx)(PaseoFieldValue,{value:child,palette:palette2,styles,depth:depth+1},stableItemKey(child,"item")))}):(0,import_jsx_runtime6.jsx)(ScalarValue,{value,palette:palette2,styles})}function PaseoField({label,value,palette:palette2,styles,depth=0}){return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoRow,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoKey,children:label}),(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:{flex:1,minWidth:0},children:(0,import_jsx_runtime6.jsx)(PaseoFieldValue,{value,palette:palette2,styles,depth})})]})}var STATUS_FIELDS=new Set(["status","attentionReason"]);function PaseoFields({fields,palette:palette2,styles}){const visible=fields.filter(([,value])=>value!==void 0).map(([label,value,id])=>[label,id&&STATUS_FIELDS.has(id)&&typeof value=="string"?statusLabel(value):value,id]);return visible.length===0?null:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoRows,children:visible.map(([label,value,id],index)=>(0,import_jsx_runtime6.jsx)(PaseoField,{label,value,palette:palette2,styles},`${id??index}-${stableItemKey(value,id??String(index))}`))})}function unlessInHeader(value,headerSummary){return typeof value=="string"||typeof value=="number"?notInHeader(value,headerSummary):value}function MetaLine({parts,styles}){const text=parts.filter(Boolean).join(t2("ui.metaSeparator"));return text?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:2,style:styles.paseoHeroSubtitle,children:text}):null}function FieldsSection({title,fields,palette:palette2,styles}){return fields.every(([,value])=>value===void 0)?null:(0,import_jsx_runtime6.jsx)(Section,{title,styles,children:(0,import_jsx_runtime6.jsx)(PaseoFields,{fields,palette:palette2,styles})})}function PaseoHero({icon,title,subtitle,status,palette:palette2,color,styles}){return(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:[styles.paseoHero,{borderLeftColor:color}],children:(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoHeroRow,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoHeroIcon,children:(0,import_jsx_runtime6.jsx)(import_react_native11.Icon,{name:icon,color,size:12})}),(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:{flex:1,minWidth:0},children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoHeroTitle,children:title}),subtitle||status?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:{flexDirection:"row",flexWrap:"wrap",gap:8},children:[subtitle?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoHeroSubtitle,children:subtitle}):null,status&&palette2?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:[styles.paseoHeroSubtitle,{color:statusColor(status,palette2)}],children:status}):null]}):null]})]})})}function PromptBlock({text,label=t2("ui.prompt"),styles,compact=!1}){const[expanded,setExpanded]=(0,import_react10.useState)(!1);if(!text)return null;const prompt=compact?(0,import_jsx_runtime6.jsx)(import_react_native12.Pressable,{accessibilityLabel:expanded?t2("ui.collapsePrompt",{text}):t2("ui.expandPrompt",{text}),accessibilityRole:"button",...aria({expanded}),onPress:()=>setExpanded(current2=>!current2),children:(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:expanded?void 0:2,selectable:!0,style:styles.paseoPrompt,children:text})}):(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoPrompt,children:text});return label?(0,import_jsx_runtime6.jsx)(Section,{title:label,styles,children:prompt}):prompt}function TokenizedLines({lines,styles,wrapLines:wrap}){return(0,import_jsx_runtime6.jsx)(import_react_native12.View,{children:lines.map((line,lineIndex)=>(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:[styles.codeLine,wrap?{flexShrink:1}:null],children:line.length===0?" ":line.map((token,tokenIndex)=>{const tokenStyle={color:token.color??styles.codeLine.color,...token.fontStyle&&token.fontStyle&1?{fontStyle:"italic"}:{},...token.fontStyle&&token.fontStyle&2?{fontWeight:"700"}:{},...token.fontStyle&&token.fontStyle&4?{textDecorationLine:"underline"}:{}};return(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:tokenStyle,children:token.content},`${lineIndex}-${tokenIndex}`)})},`line-${lineIndex}`))})}function PaseoCodeBlock({code,language:language3,label,theme,styles}){const[showAll,setShowAll]=(0,import_react10.useState)(!1),clean=(0,import_react10.useMemo)(()=>stripAnsi(code),[code]),view=(0,import_react10.useMemo)(()=>outputView(code,clean,showAll,language3==="ansi",!1),[clean,code,language3,showAll]),{preview,shown:displayCode}=view,tokens=useHighlightTokens(view.highlight,language3,theme.colors),wrap=useWrapLines("code"),title=label??t2("ui.output");return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.section,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.codeHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:[styles.detailLabel,{flexShrink:1}],children:title}),(0,import_jsx_runtime6.jsx)(OutputCopyButtons,{clean,raw:code,label:t2("ui.copy",{label:title}),theme,styles})]}),wrap?(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:[styles.codeSurface,{minWidth:0,width:"100%"}],children:tokens?(0,import_jsx_runtime6.jsx)(TokenizedLines,{lines:tokens,styles,wrapLines:!0}):(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:[styles.codeLine,{flexShrink:1}],children:displayCode||" "})}):(0,import_jsx_runtime6.jsx)(import_react_native11.ScrollView,{horizontal:!0,nestedScrollEnabled:!0,style:styles.codeScroll,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.codeSurface,children:tokens?(0,import_jsx_runtime6.jsx)(TokenizedLines,{lines:tokens,styles}):(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.codeLine,children:displayCode||" "})})}),preview.truncated?(0,import_jsx_runtime6.jsx)(import_react_native12.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):t2("ui.expandAllLinesCharacters",{lines:preview.totalLines,characters:preview.totalChars.toLocaleString()})})}):null]})}function OutputFields({result,fields,palette:palette2,styles}){const values=fields.map(([key,label])=>[label,result?.[key],key]);return values.every(([,value])=>value===void 0)?null:(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.result"),styles,children:(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:values,palette:palette2,styles})})}function ActionResult({result,palette:palette2,styles,fields=[]}){const visibleFields=fields.map(([key,label])=>[label,result?.[key],key]).filter(([,value])=>value!==void 0),success=result?.success;return typeof success!="boolean"&&visibleFields.length===0?null:(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.result"),styles,children:(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoRows,children:[typeof success=="boolean"?(0,import_jsx_runtime6.jsx)(StatusPill,{value:success?"Success":"Failed",palette:palette2,styles}):null,(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:visibleFields,palette:palette2,styles})]})})}function AgentSnapshot({snapshot,headerSummary,palette:palette2,styles}){if(!snapshot)return null;const capabilities=asRecord5(snapshot.capabilities),modes=fieldArray(snapshot,"availableModes"),permissions=fieldArray(snapshot,"pendingPermissions");return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.agent"),unlessInHeader(snapshot.id,headerSummary)],[t2("ui.title"),snapshot.title],[t2("ui.provider"),snapshot.provider],[t2("ui.model"),snapshot.model],[t2("ui.status"),snapshot.status,"status"],[t2("ui.workingDirectory"),snapshot.cwd],[t2("ui.workspace"),snapshot.workspaceId],[t2("ui.mode"),snapshot.currentModeId],[t2("ui.thinkingLevel"),snapshot.effectiveThinkingOptionId??snapshot.thinkingOptionId],[t2("ui.needsAttention"),snapshot.attentionReason,"attentionReason"],[t2("ui.latestError"),snapshot.lastError]],palette:palette2,styles}),capabilities?(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.capabilities"),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoChips,children:Object.entries(capabilities).filter(([,value])=>value===!0).map(([key])=>(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoChip,children:(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoChipText,children:humanizeKey(key)})},key))})}):null,modes.length>0?(0,import_jsx_runtime6.jsx)(ModeList,{modes,palette:palette2,styles}):null,permissions.length>0?(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.pendingApprovals",{count:permissions.length}),styles,children:(0,import_jsx_runtime6.jsx)(PermissionList,{permissions,palette:palette2,styles})}):null]})}function ModeList({modes,palette:palette2,styles}){return modes.length===0?null:(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.availableModes"),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:modes.map(mode=>{const record=asRecord5(mode);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"label")??fieldString3(record,"id")??t2("ui.mode")}),fieldString3(record,"id")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:[styles.paseoListItemMeta,ROW_TAIL,{color:palette2.categoryColors.agent}],children:fieldString3(record,"id")}):null]}),fieldString3(record,"description")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"description")}):null]},stableItemKey(mode,"mode"))})})})}function PermissionList({permissions,palette:palette2,styles}){return permissions.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noPendingApprovals")}):(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:permissions.map(permission=>{const record=asRecord5(permission),actions=fieldArray(record,"actions");return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"title")??fieldString3(record,"name")??t2("ui.permissionRequest")}),fieldString3(record,"kind")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"kind"),palette:palette2,styles}):null]}),fieldString3(record,"description")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemMeta,children:fieldString3(record,"description")}):null,actions.length>0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:t2("ui.availableActionsValue",{actions:actions.map(action=>fieldString3(asRecord5(action),"label")??t2("ui.action")).join(t2("ui.metaSeparator"))})}):null]},stableItemKey(permission,"permission"))})})}function AgentTool({leaf,headerSummary,input,result,theme,palette:palette2,styles}){const inputRecord=asRecord5(input),outputRecord=asRecord5(result);switch(leaf){case"create_agent":{const childAgentId=extractPaseoChildAgentId(outputRecord),childServerId=fieldString3(outputRecord,"serverId"),provider=fieldString3(inputRecord,"provider"),settings=asRecord5(inputRecord?.settings),thinkingOptionId=fieldString3(settings,"thinkingOptionId");return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(MetaLine,{parts:[notInHeader(fieldString3(inputRecord,"title"),headerSummary),notInHeader(provider,headerSummary),thinkingOptionId?t2("ui.thinkingLevel2",{level:thinkingOptionId}):void 0,inputRecord?.background===!0?t2("ui.runInBackground"):void 0,inputRecord?.notifyOnFinish===!0?t2("ui.notifyOnCompletion"):void 0,fieldString3(outputRecord,"status")?statusLabel(fieldString3(outputRecord,"status")):void 0],styles}),(0,import_jsx_runtime6.jsx)(PromptBlock,{text:fieldString3(inputRecord,"initialPrompt"),label:"",compact:!0,styles}),childAgentId?(0,import_jsx_runtime6.jsx)(ChildAgentTimeline,{agentId:childAgentId,serverId:childServerId,theme,palette:palette2,styles}):null]})}case"send_agent_prompt":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PromptBlock,{text:fieldString3(inputRecord,"prompt"),styles}),(0,import_jsx_runtime6.jsx)(FieldsSection,{title:t2("ui.sendMode"),fields:[[t2("ui.agent"),unlessInHeader(inputRecord?.agentId,headerSummary)],[t2("ui.sessionMode"),inputRecord?.sessionMode],[t2("ui.runInBackground"),inputRecord?.background],[t2("ui.notifyOnCompletion"),inputRecord?.notifyOnFinish]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(OutputFields,{result:outputRecord,fields:[["status",t2("ui.status")],["lastMessage",t2("ui.lastMessage")],["guidance",t2("ui.hint")]],palette:palette2,styles}),outputRecord?.permission?(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.permission"),styles,children:(0,import_jsx_runtime6.jsx)(PermissionList,{permissions:[outputRecord.permission],palette:palette2,styles})}):null]});case"get_agent_status":return(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoStack,children:(0,import_jsx_runtime6.jsx)(AgentSnapshot,{snapshot:asRecord5(outputRecord?.snapshot)??outputRecord,headerSummary,palette:palette2,styles})});case"list_agents":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.workingDirectory"),inputRecord?.cwd],[t2("ui.statusFilter"),inputRecord?.statuses],[t2("ui.recentHours"),inputRecord?.sinceHours],[t2("ui.limit"),inputRecord?.limit],[t2("ui.includeArchived"),inputRecord?.includeArchived]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(AgentList,{agents:fieldArray(outputRecord,"agents"),palette:palette2,styles})]});case"get_agent_activity":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.agent"),unlessInHeader(inputRecord?.agentId,headerSummary)],[t2("ui.limit"),inputRecord?.limit],[t2("ui.mode"),outputRecord?.currentModeId],[t2("ui.updates"),outputRecord?.updateCount]],palette:palette2,styles}),fieldString3(outputRecord,"content")?(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:fieldString3(outputRecord,"content"),language:"markdown",label:t2("ui.activity"),theme,styles}):null]});case"set_agent_mode":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.agent"),unlessInHeader(inputRecord?.agentId,headerSummary)],[t2("ui.mode"),inputRecord?.modeId]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,fields:outputRecord?.newMode!==void 0&&outputRecord.newMode!==inputRecord?.modeId?[["newMode",t2("ui.newMode")]]:[],palette:palette2,styles})]});case"update_agent":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.agent"),unlessInHeader(inputRecord?.agentId,headerSummary)],[t2("ui.name"),inputRecord?.name],[t2("ui.labels"),inputRecord?.labels],[t2("ui.settings"),inputRecord?.settings]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,palette:palette2,styles})]});case"cancel_agent":case"archive_agent":case"kill_agent":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[notInHeader(fieldString3(inputRecord,"agentId"),headerSummary)?(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.agent"),inputRecord?.agentId]],palette:palette2,styles}):null,(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,palette:palette2,styles})]});case"list_pending_permissions":return(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoStack,children:(0,import_jsx_runtime6.jsx)(PermissionList,{permissions:fieldArray(outputRecord,"permissions"),palette:palette2,styles})});case"respond_to_permission":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.agent"),inputRecord?.agentId],[t2("ui.request"),inputRecord?.requestId],[t2("ui.reply"),inputRecord?.response]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,palette:palette2,styles})]});default:return(0,import_jsx_runtime6.jsx)(FallbackPaseo,{input,result,palette:palette2,styles})}}function AgentList({agents,palette:palette2,styles}){return(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.agentsCount",{count:agents.length}),styles,children:agents.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noAgentsReturned")}):(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:agents.map(agent=>{const record=asRecord5(agent);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemTitle,children:fieldString3(record,"title")??fieldString3(record,"shortId")??fieldString3(record,"id")??t2("ui.agent")}),fieldString3(record,"status")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"status"),palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:[fieldString3(record,"provider"),fieldString3(record,"model")].filter(Boolean).join(t2("ui.metaSeparator"))}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:fieldString3(record,"cwd")??fieldString3(record,"id")})]},stableItemKey(agent,"agent"))})})})}function WorkspaceSummary({result,palette:palette2,styles}){return(0,import_jsx_runtime6.jsx)(OutputFields,{result,fields:[["workspaceId",t2("ui.workspace")],["projectId",t2("ui.project")],["cwd",t2("ui.workingDirectory")],["isolation",t2("ui.isolation")],["kind",t2("ui.type")],["title",t2("ui.title")]],palette:palette2,styles})}function WorkspaceTool({leaf,headerSummary,input,result,palette:palette2,styles}){const inputRecord=asRecord5(input),outputRecord=asRecord5(result);switch(leaf){case"create_workspace":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.configuration"),styles,children:(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.title"),unlessInHeader(inputRecord?.title,headerSummary)],[t2("ui.isolation"),inputRecord?.isolation],[t2("ui.path2"),inputRecord?.path],[t2("ui.project"),inputRecord?.projectId],[t2("ui.mode"),inputRecord?.mode],[t2("ui.worktree"),inputRecord?.worktreeSlug],[t2("ui.branch2"),inputRecord?.branchName??inputRecord?.branch],[t2("ui.baseBranch"),inputRecord?.baseBranch],[t2("ui.mergeRequest"),inputRecord?.prNumber],[t2("ui.forge"),inputRecord?.forge]],palette:palette2,styles})}),(0,import_jsx_runtime6.jsx)(WorkspaceSummary,{result:outputRecord,palette:palette2,styles})]});case"list_workspaces":return(0,import_jsx_runtime6.jsx)(WorkspaceList,{workspaces:fieldArray(outputRecord,"workspaces"),palette:palette2,styles});case"archive_workspace":return(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoStack,children:(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,fields:[...notInHeader(fieldString3(outputRecord,"workspaceId"),headerSummary)?[["workspaceId",t2("ui.workspace")]]:[],["archivedAgentIds",t2("ui.archivedAgents")],["removedDirectory",t2("ui.removedDirectory")]],palette:palette2,styles})});case"rename_workspace":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.workspace"),unlessInHeader(inputRecord?.workspaceId,headerSummary)],[t2("ui.newTitle"),inputRecord?.title]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,fields:[["workspaceId",t2("ui.workspace")],["title",t2("ui.title")]],palette:palette2,styles})]});default:return(0,import_jsx_runtime6.jsx)(FallbackPaseo,{input,result,palette:palette2,styles})}}function WorkspaceList({workspaces,palette:palette2,styles}){return workspaces.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noWorkspacesReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.workspaces",{count:workspaces.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:workspaces.map(workspace=>{const record=asRecord5(workspace);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"title")??fieldString3(record,"workspaceId")??t2("ui.workspace")}),fieldString3(record,"isolation")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"isolation"),palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:fieldString3(record,"cwd")}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"workspaceId")})]},stableItemKey(workspace,"workspace"))})})})}function ScriptList({scripts,palette:palette2,styles}){return scripts.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noWorkspaceScriptsReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.scripts",{count:scripts.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:scripts.map(script=>{const record=asRecord5(script);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"scriptName")??t2("ui.script")}),fieldString3(record,"lifecycle")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"lifecycle"),palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:[fieldString3(record,"type"),fieldString3(record,"health"),fieldString3(record,"port")].filter(Boolean).join(t2("ui.metaSeparator"))}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:fieldString3(record,"proxyUrl")??fieldString3(record,"localProxyUrl")})]},stableItemKey(script,"script"))})})})}function TerminalList({terminals,palette:palette2,styles}){return terminals.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noTerminalsReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.terminals",{count:terminals.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:terminals.map(terminal=>{const record=asRecord5(terminal);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"name")??fieldString3(record,"id")??t2("ui.terminal")}),(0,import_jsx_runtime6.jsx)(import_react_native11.Icon,{name:"SquareTerminal",color:palette2.categoryColors.shell,size:12})]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:fieldString3(record,"cwd")}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"id")})]},stableItemKey(terminal,"terminal"))})})})}function TerminalTool({leaf,input,result,theme,palette:palette2,styles}){const inputRecord=asRecord5(input),outputRecord=asRecord5(result);switch(leaf){case"list_workspace_scripts":case"start_workspace_script":case"stop_workspace_script":{const scriptResult=asRecord5(result)?.script??result;return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.workspace"),inputRecord?.workspaceId],[t2("ui.script"),inputRecord?.scriptName]],palette:palette2,styles}),leaf==="list_workspace_scripts"?(0,import_jsx_runtime6.jsx)(ScriptList,{scripts:fieldArray(outputRecord,"scripts"),palette:palette2,styles}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.script"),styles,children:(0,import_jsx_runtime6.jsx)(ScriptList,{scripts:[scriptResult],palette:palette2,styles})})]})}case"list_terminals":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.workingDirectory"),inputRecord?.cwd],[t2("ui.allDirectories"),inputRecord?.all]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(TerminalList,{terminals:fieldArray(outputRecord,"terminals"),palette:palette2,styles})]});case"create_terminal":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.workingDirectory"),inputRecord?.cwd],[t2("ui.workspace"),inputRecord?.workspaceId],[t2("ui.name"),inputRecord?.name]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.terminal"),styles,children:(0,import_jsx_runtime6.jsx)(TerminalList,{terminals:[result],palette:palette2,styles})})]});case"capture_terminal":{const lines=fieldArray(outputRecord,"lines").map(scalarText).join(`\n`);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.terminal"),inputRecord?.terminalId],[t2("ui.startLine"),inputRecord?.start],[t2("ui.endLine"),inputRecord?.end],[t2("ui.scrollbackLines"),inputRecord?.scrollback],[t2("ui.stripColorCodes"),inputRecord?.stripAnsi],[t2("ui.totalLines"),outputRecord?.totalLines]],palette:palette2,styles}),lines?(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:lines,language:"ansi",label:t2("ui.terminalOutput"),theme,styles}):null]})}case"send_terminal_keys":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.terminal"),inputRecord?.terminalId],[t2("ui.keys"),inputRecord?.keys],[t2("ui.sendLiterally"),inputRecord?.literal]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,palette:palette2,styles})]});case"kill_terminal":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoHero,{icon:"CircleX",title:fieldString3(inputRecord,"terminalId")??t2("ui.terminal"),color:palette2.categoryColors.shell,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,palette:palette2,styles})]});default:return(0,import_jsx_runtime6.jsx)(FallbackPaseo,{input,result,palette:palette2,styles})}}function ScheduleTool({leaf,headerSummary,input,result,theme:_theme,palette:palette2,styles}){const inputRecord=asRecord5(input),outputRecord=asRecord5(result);return["delete_heartbeat","pause_schedule","resume_schedule","delete_schedule"].includes(leaf)?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoHero,{icon:leaf.startsWith("delete")?"Trash2":leaf==="pause_schedule"?"Pause":"Play",title:fieldString3(inputRecord,"id")??t2("ui.schedule"),color:palette2.categoryColors.plan,styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:outputRecord,palette:palette2,styles})]}):leaf==="list_schedules"?(0,import_jsx_runtime6.jsx)(ScheduleList,{schedules:fieldArray(outputRecord,"schedules"),palette:palette2,styles}):leaf==="schedule_logs"?(0,import_jsx_runtime6.jsx)(ScheduleRuns,{runs:fieldArray(outputRecord,"runs"),palette:palette2,styles}):leaf==="inspect_schedule"||leaf==="run_schedule_once"?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(ScheduleSummary,{schedule:outputRecord,palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ScheduleRuns,{runs:fieldArray(outputRecord,"runs"),palette:palette2,styles})]}):leaf==="create_schedule"||leaf==="create_heartbeat"?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PromptBlock,{text:notInHeader(fieldString3(inputRecord,"prompt"),headerSummary),styles}),(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.configuration"),styles,children:(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.name"),inputRecord?.name],[t2("ui.cronExpression"),inputRecord?.cron],[t2("ui.timeZone"),inputRecord?.timezone],[t2("ui.provider"),inputRecord?.provider],[t2("ui.workingDirectory"),inputRecord?.cwd],[t2("ui.isolation"),inputRecord?.isolation],[t2("ui.maximumRuns"),inputRecord?.maxRuns],[t2("ui.expiresIn"),inputRecord?.expiresIn]],palette:palette2,styles})}),(0,import_jsx_runtime6.jsx)(ScheduleSummary,{schedule:outputRecord,input:inputRecord,palette:palette2,styles})]}):leaf==="update_schedule"?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.schedule"),inputRecord?.id],[t2("ui.name"),inputRecord?.name],[t2("ui.prompt"),inputRecord?.prompt],[t2("ui.cronExpression"),inputRecord?.cron],[t2("ui.timeZone"),inputRecord?.timezone],[t2("ui.provider"),inputRecord?.provider],[t2("ui.model"),inputRecord?.model],[t2("ui.mode"),inputRecord?.mode],[t2("ui.workingDirectory"),inputRecord?.cwd],[t2("ui.maximumRuns"),inputRecord?.maxRuns],[t2("ui.expiresIn"),inputRecord?.expiresIn],[t2("ui.clearExpiration"),inputRecord?.clearExpires]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ScheduleSummary,{schedule:outputRecord,input:inputRecord,palette:palette2,styles})]}):(0,import_jsx_runtime6.jsx)(FallbackPaseo,{input,result,palette:palette2,styles})}function ScheduleSummary({schedule,input=null,palette:palette2,styles}){if(!schedule)return null;const echoed=key=>input?.[key]!==void 0&&input[key]===schedule[key],cadence=asRecord5(schedule.cadence),target=asRecord5(schedule.target),targetConfig=asRecord5(target?.config);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(OutputFields,{result:schedule,fields:[["id",t2("ui.id")],["name",t2("ui.name")],["status",t2("ui.status")],["nextRunAt",t2("ui.nextRun2")],["lastRunAt",t2("ui.lastRun")],["expiresAt",t2("ui.expiresAt")],["maxRuns",t2("ui.maximumRuns")]].filter(([key])=>!echoed(key)),palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(PromptBlock,{text:echoed("prompt")?void 0:fieldString3(schedule,"prompt"),styles}),(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.cadenceAndTarget"),styles,children:(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.cadence"),cadence],[t2("ui.target"),target?.type],[t2("ui.agent"),target?.agentId],[t2("ui.provider"),targetConfig?.provider],[t2("ui.model"),targetConfig?.model],[t2("ui.mode"),targetConfig?.modeId],[t2("ui.workingDirectory"),targetConfig?.cwd],[t2("ui.isolation"),targetConfig?.isolation]],palette:palette2,styles})})]})}function ScheduleList({schedules,palette:palette2,styles}){return schedules.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noSchedulesReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.schedules",{count:schedules.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:schedules.map(schedule=>{const record=asRecord5(schedule),expression=fieldString3(asRecord5(record?.cadence),"expression"),nextRunAt=fieldString3(record,"nextRunAt");return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"name")??fieldString3(record,"id")??t2("ui.schedule")}),fieldString3(record,"status")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"status"),palette:palette2,styles}):null]}),nextRunAt?(0,import_jsx_runtime6.jsx)(InstantText,{value:nextRunAt,prefix:t2("ui.nextRun",{prefix:expression?`${expression} \\xB7 `:""}),style:styles.paseoListItemMeta,palette:palette2,styles}):expression?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:expression}):null,(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:fieldString3(record,"prompt")})]},stableItemKey(schedule,"schedule"))})})})}function ScheduleRuns({runs,palette:palette2,styles}){return runs.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noRunHistory")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.runHistory",{count:runs.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:runs.map(run=>{const record=asRecord5(run),scheduledFor=fieldString3(record,"scheduledFor");return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[scheduledFor?(0,import_jsx_runtime6.jsx)(InstantText,{value:scheduledFor,style:styles.paseoListItemTitle,containerStyle:ROW_FILL,palette:palette2,styles}):(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"id")??t2("ui.run")}),fieldString3(record,"status")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"status"),palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:[fieldString3(record,"agentId"),fieldString3(record,"workspaceId")].filter(Boolean).join(t2("ui.metaSeparator"))}),fieldString3(record,"output")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemMeta,children:fieldString3(record,"output")}):null,fieldString3(record,"error")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:[styles.paseoListItemMeta,{color:palette2.statusColors.failed}],children:fieldString3(record,"error")}):null]},stableItemKey(run,"run"))})})})}function ProviderTool({leaf,headerSummary,input,result,palette:palette2,styles}){const inputRecord=asRecord5(input),outputRecord=asRecord5(result);return leaf==="list_providers"?(0,import_jsx_runtime6.jsx)(ProviderList,{providers:fieldArray(outputRecord,"providers"),palette:palette2,styles}):leaf==="list_models"?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[notInHeader(fieldString3(outputRecord,"provider"),headerSummary)?(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.provider"),outputRecord?.provider]],palette:palette2,styles}):null,(0,import_jsx_runtime6.jsx)(ModelList,{models:fieldArray(outputRecord,"models"),palette:palette2,styles})]}):leaf==="list_profiles"?(0,import_jsx_runtime6.jsx)(ProfileList,{profiles:fieldArray(outputRecord,"profiles"),palette:palette2,styles}):leaf==="inspect_provider"?(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(MetaLine,{parts:[fieldString3(outputRecord,"description")],styles}),(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.provider"),outputRecord?.provider??inputRecord?.provider],[t2("ui.name"),outputRecord?.label],[t2("ui.status"),outputRecord?.status,"status"],[t2("ui.enabled"),outputRecord?.enabled],[t2("ui.selectedModel"),outputRecord?.selectedModel]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(ModeList,{modes:fieldArray(outputRecord,"modes"),palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(FeatureList,{features:fieldArray(outputRecord,"features"),palette:palette2,styles})]}):(0,import_jsx_runtime6.jsx)(FallbackPaseo,{input,result,palette:palette2,styles})}function ProviderList({providers,palette:palette2,styles}){return providers.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noProvidersReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.providersCount",{count:providers.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:providers.map(provider=>{const record=asRecord5(provider);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"label")??fieldString3(record,"id")??t2("ui.provider")}),fieldString3(record,"status")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:fieldString3(record,"status"),palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:fieldString3(record,"description")}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"id")})]},stableItemKey(provider,"provider"))})})})}function ModelList({models,palette:palette2,styles}){return models.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noModelsReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.models",{count:models.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:models.map(model=>{const record=asRecord5(model);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"label")??fieldString3(record,"id")??t2("ui.model")}),fieldBoolean(record,"isDefault")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:"Default",palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"id")}),fieldString3(record,"description")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"description")}):null]},stableItemKey(model,"model"))})})})}function ProfileList({profiles,palette:palette2,styles}){return profiles.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noConfigurationsReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.configurations",{count:profiles.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:profiles.map(profile=>{const record=asRecord5(profile);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoListItemHeader,children:(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"name")??fieldString3(record,"id")??t2("ui.configuration")})}),(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.provider"),record?.provider],[t2("ui.model"),record?.model],[t2("ui.mode"),record?.modeId],[t2("ui.thinkingLevel"),record?.thinkingOptionId]],palette:palette2,styles}),fieldString3(record,"notes")?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemMeta,children:fieldString3(record,"notes")}):null]},stableItemKey(profile,"profile"))})})})}function FeatureList({features,palette:palette2,styles}){return features.length===0?null:(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.features",{count:features.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:features.map(feature=>{const record=asRecord5(feature);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemTitle,children:fieldString3(record,"label")??fieldString3(record,"id")??t2("ui.feature")}),record?.value!==void 0?(0,import_jsx_runtime6.jsx)(StatusPill,{value:scalarText(record.value),palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"description")})]},stableItemKey(feature,"feature"))})})})}function BrowserTool({leaf,headerSummary,input,output,result,theme,palette:palette2,styles}){const inputRecord=asRecord5(input),outputRecord=asRecord5(output),resultRecord=asRecord5(result),browserResult=resultRecord?.ok===!0?asRecord5(resultRecord.result):resultRecord,browserFailure=outputRecord?.ok===!1?outputRecord:resultRecord?.ok===!1?resultRecord:null;if(browserFailure){const error=asRecord5(browserFailure.error);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.browserTab"),unlessInHeader(inputRecord?.browserId,headerSummary)],[t2("ui.error"),error?.message],[t2("ui.retryable"),error?.retryable]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(StatusPill,{value:"Failed",palette:palette2,styles})]})}switch(leaf){case"browser_list_tabs":return(0,import_jsx_runtime6.jsx)(BrowserTabList,{tabs:fieldArray(asRecord5(browserResult),"tabs"),palette:palette2,styles});case"browser_new_tab":return(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoStack,children:(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.browserTab"),unlessInHeader(asRecord5(browserResult)?.browserId,headerSummary)],[t2("ui.workspace"),asRecord5(browserResult)?.workspaceId],[t2("ui.uRL"),unlessInHeader(asRecord5(browserResult)?.url,headerSummary)]],palette:palette2,styles})});case"browser_snapshot":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.browserTab"),unlessInHeader(browserResult?.browserId,headerSummary)],[t2("ui.uRL"),unlessInHeader(browserResult?.url,headerSummary)],[t2("ui.title"),browserResult?.title],[t2("ui.format"),browserResult?.format],[t2("ui.truncated"),browserResult?.truncated],[t2("ui.statistics"),browserResult?.stats]],palette:palette2,styles}),fieldString3(browserResult,"snapshot")?(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:fieldString3(browserResult,"snapshot"),language:"yaml",label:t2("ui.pageStructure"),theme,styles}):null]});case"browser_screenshot":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.browserTab"),unlessInHeader(browserResult?.browserId,headerSummary)],[t2("ui.mIMEType"),browserResult?.mimeType],[t2("ui.width"),browserResult?.width],[t2("ui.height"),browserResult?.height],[t2("ui.fullPage"),inputRecord?.fullPage]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.mutedText,children:t2("ui.theScreenshotWasReturnedTo")})]});case"browser_logs":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.browserTab"),unlessInHeader(browserResult?.browserId,headerSummary)],[t2("ui.maximumEntries"),inputRecord?.maxEntries]],palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(BrowserLogs,{consoleEntries:fieldArray(browserResult,"console"),networkEntries:fieldArray(browserResult,"network"),palette:palette2,styles})]});case"browser_evaluate":return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.browserTab"),unlessInHeader(browserResult?.browserId,headerSummary)],[t2("ui.element"),inputRecord?.ref]],palette:palette2,styles}),fieldString3(inputRecord,"function")?(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:fieldString3(inputRecord,"function"),language:"javascript",label:t2("ui.function"),theme,styles}):null,fieldString3(browserResult,"resultJson")?(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:fieldString3(browserResult,"resultJson"),language:"json",label:t2("ui.result"),theme,styles}):null]});default:{const visible=fields=>fields.map(([label,value])=>[label,unlessInHeader(value,headerSummary)]).filter(([,value])=>value!==void 0),inputFields=visible(browserInputFields(leaf,inputRecord)),outputFields=visible(browserOutputFields(leaf,browserResult));return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:inputFields,palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:outputFields,palette:palette2,styles})]})}}}function browserInputFields(leaf,input){if(!input)return[];const labels={browserId:t2("ui.browserTab"),ref:t2("ui.element"),sourceRef:t2("ui.sourceElement"),targetRef:t2("ui.targetElement"),url:t2("ui.uRL"),value:t2("ui.value"),text:t2("ui.text2"),key:t2("ui.keys"),button:t2("ui.mouseButton"),doubleClick:t2("ui.doubleClick"),modifiers:t2("ui.modifiers"),filePaths:t2("ui.file"),fullPage:t2("ui.fullPage"),maxEntries:t2("ui.maximumEntries"),timeoutMs:t2("ui.timeoutMilliseconds"),deltaX:t2("ui.horizontalScroll"),deltaY:t2("ui.verticalScroll"),width:t2("ui.width"),height:t2("ui.height"),function:t2("ui.function")},excluded=new Set(["browserId"]);return Object.entries(input).filter(([key,value])=>value!==void 0&&(!excluded.has(key)||leaf==="browser_list_tabs")).map(([key,value])=>[labels[key]??humanizeKey(key),value,key])}function browserOutputFields(leaf,result){if(!result)return[];const excluded=new Set(["command","browserId","snapshot","console","network","resultJson"]);return Object.entries(result).filter(([key,value])=>value!==void 0&&!excluded.has(key)).map(([key,value])=>[humanizeKey(key),value,key])}function BrowserTabList({tabs,palette:palette2,styles}){return tabs.length===0?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.empty,children:t2("ui.noBrowserTabsReturned")}):(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.browserTabs",{count:tabs.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:tabs.map(tab=>{const record=asRecord5(tab);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemTitle,children:fieldString3(record,"title")??t2("ui.untitledPage")}),fieldBoolean(record,"isActive")?(0,import_jsx_runtime6.jsx)(StatusPill,{value:"Active",palette:palette2,styles}):null]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:fieldString3(record,"url")}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:fieldString3(record,"browserId")})]},stableItemKey(tab,"tab"))})})})}function BrowserLogs({consoleEntries,networkEntries,palette:palette2,styles}){return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.console",{count:consoleEntries.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:consoleEntries.map(entry=>{const record=asRecord5(entry),level=fieldString3(record,"level")??"log";return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:[styles.paseoListItemTitle,{color:statusColor(level,palette2)}],children:level}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:[styles.paseoListItemMeta,ROW_TAIL],children:fieldString3(record,"source")})]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemMeta,children:fieldString3(record,"message")})]},stableItemKey(entry,"console"))})})}),(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.networkRequests",{count:networkEntries.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:networkEntries.map(entry=>{const record=asRecord5(entry);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime6.jsxs)(import_react_native12.Text,{numberOfLines:1,style:styles.paseoListItemTitle,children:[fieldString3(record,"method")??t2("ui.request")," ",fieldNumber(record,"status")??""]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:t2("ui.milliseconds",{count:fieldNumber(record,"duration")})})]}),(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:fieldString3(record,"url")})]},stableItemKey(entry,"network"))})})})]})}function ExaResultList({results,styles}){return(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.results",{count:results.length}),styles,children:(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoList,children:results.map(result=>(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime6.jsx)(import_react_native12.View,{style:styles.paseoListItemHeader,children:(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemTitle,children:result.title})}),result.url?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemMeta,children:result.url}):null,result.published||result.author?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{style:styles.paseoListItemMeta,children:[result.published,result.author].filter(Boolean).join(t2("ui.metaSeparator"))}):null,result.highlights?(0,import_jsx_runtime6.jsx)(import_react_native12.Text,{selectable:!0,style:styles.paseoListItemMeta,children:result.highlights}):null]},result.url??result.title))})})}function ExaToolDetail({toolName,input,output,theme,styles}){const kind=exaToolKind(toolName);if(!kind)return null;const results=kind==="search"?parseExaSearchResults(output):[],outputText=exaOutputText(output),inputRecord=asRecord5(input),query=fieldString3(inputRecord,"query"),url=fieldString3(inputRecord,"url"),prompt=fieldString3(inputRecord,"prompt"),headerSummary=exaToolSummary(kind,input),shownQuery=notInHeader(query,headerSummary),shownUrl=notInHeader(url,headerSummary),shownPrompt=notInHeader(prompt,headerSummary);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[shownQuery?(0,import_jsx_runtime6.jsx)(PromptBlock,{text:shownQuery,label:t2("ui.query2"),styles}):null,shownUrl?(0,import_jsx_runtime6.jsx)(PromptBlock,{text:shownUrl,label:t2("ui.uRL"),styles}):null,shownPrompt?(0,import_jsx_runtime6.jsx)(PromptBlock,{text:shownPrompt,label:t2("ui.prompt"),styles}):null,results.length>0?(0,import_jsx_runtime6.jsx)(ExaResultList,{results,styles}):outputText?(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:outputText,language:"markdown",label:t2("ui.output"),theme,styles}):(0,import_jsx_runtime6.jsx)(PaseoCodeBlock,{code:formatUnknownValue(output),language:"json",label:t2("ui.output"),theme,styles})]})}function FallbackPaseo({input,result,palette:palette2,styles}){return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.input"),styles,children:(0,import_jsx_runtime6.jsx)(PaseoFieldValue,{value:input,palette:palette2,styles})}),(0,import_jsx_runtime6.jsx)(Section,{title:t2("ui.result"),styles,children:(0,import_jsx_runtime6.jsx)(PaseoFieldValue,{value:result,palette:palette2,styles})})]})}function PaseoFailure({result,palette:palette2,styles}){const failure=asRecord5(result),error=asRecord5(failure?.error);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(StatusPill,{value:"Failed",palette:palette2,styles}),(0,import_jsx_runtime6.jsx)(PaseoFields,{fields:[[t2("ui.errorCode"),error?.code],[t2("ui.error"),error?.message??failure?.error],[t2("ui.retryable"),error?.retryable]],palette:palette2,styles})]})}var FIELD_ZH={get supportsStreaming(){return t2("ui.streamingOutput")},get supportsSessionPersistence(){return t2("ui.sessionPersistence")},get supportsSessionListing(){return t2("ui.listSessions")},get supportsDynamicModes(){return t2("ui.dynamicModes")},get supportsMcpServers(){return t2("ui.mCPServers")},get supportsReasoningStream(){return t2("ui.thinkingStream")},get supportsToolInvocations(){return t2("ui.toolCalls2")},get supportsRewindConversation(){return t2("ui.rewindConversation")},get supportsRewindFiles(){return t2("ui.rewindFiles")},get supportsRewindBoth(){return t2("ui.rewindConversationAndFiles")},get id(){return t2("ui.id")},get agentId(){return t2("ui.agentId")},get workspaceId(){return t2("ui.workspaceID")},get projectId(){return t2("ui.projectID")},get terminalId(){return t2("ui.terminalID")},get browserId(){return t2("ui.browserTab")},get title(){return t2("ui.title")},get name(){return t2("ui.name")},get status(){return t2("ui.status")},get cwd(){return t2("ui.workingDirectory")},get provider(){return t2("ui.provider")},get model(){return t2("ui.model")},get mode(){return t2("ui.mode")},get modeId(){return t2("ui.mode")},get prompt(){return t2("ui.prompt")},get message(){return t2("ui.message")},get error(){return t2("ui.error")},get output(){return t2("ui.output")},get result(){return t2("ui.result")},get url(){return t2("ui.uRL")},get path(){return t2("ui.path2")},get branch(){return t2("ui.branch2")},get createdAt(){return t2("ui.createdAt")},get updatedAt(){return t2("ui.updatedAt")},get startedAt(){return t2("ui.startedAt")},get finishedAt(){return t2("ui.finishedAt")},get ok(){return t2("ui.success")},get success(){return t2("ui.success")},get count(){return t2("ui.count")},get total(){return t2("ui.total")},get description(){return t2("ui.description")},get labels(){return t2("ui.labels")},get text(){return t2("ui.text2")}};function humanizeKey(key){if(FIELD_ZH[key])return FIELD_ZH[key];const sentence=key.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[._-]+/g," ").split(" ").filter(Boolean).join(" ").toLowerCase();return`${sentence[0]?.toUpperCase()??""}${sentence.slice(1)}`}function PaseoToolDetail({toolName,input,output,theme,palette:palette2,styles}){const leaf=paseoToolLeafName(toolName);if(!leaf)return null;const result=paseoToolResult(output),headerSummary=paseoToolSummary(toolName,input);if(asRecord5(result)?.ok===!1)return(0,import_jsx_runtime6.jsx)(PaseoFailure,{result,palette:palette2,styles});if(leaf.startsWith("browser_"))return(0,import_jsx_runtime6.jsx)(BrowserTool,{leaf,headerSummary,input,output,result,theme,palette:palette2,styles});if(leaf.includes("agent")||leaf.includes("permission"))return(0,import_jsx_runtime6.jsx)(AgentTool,{leaf,headerSummary,input,result,theme,palette:palette2,styles});if(leaf.includes("workspace")&&!leaf.includes("script"))return(0,import_jsx_runtime6.jsx)(WorkspaceTool,{leaf,headerSummary,input,result,palette:palette2,styles});if(leaf.includes("terminal")||leaf.includes("workspace_script"))return(0,import_jsx_runtime6.jsx)(TerminalTool,{leaf,input,result,theme,palette:palette2,styles});if(leaf.includes("schedule")||leaf.includes("heartbeat"))return(0,import_jsx_runtime6.jsx)(ScheduleTool,{leaf,headerSummary,input,result,theme,palette:palette2,styles});if(leaf.includes("provider")||leaf.includes("profile")||leaf==="list_models")return(0,import_jsx_runtime6.jsx)(ProviderTool,{leaf,headerSummary,input,result,palette:palette2,styles});if(leaf==="speak"){const inputRecord=asRecord5(input);return(0,import_jsx_runtime6.jsxs)(import_react_native12.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime6.jsx)(PromptBlock,{text:notInHeader(fieldString3(inputRecord,"text"),headerSummary),label:t2("ui.message"),styles}),(0,import_jsx_runtime6.jsx)(ActionResult,{result:asRecord5(result),palette:palette2,styles})]})}return(0,import_jsx_runtime6.jsx)(FallbackPaseo,{input,result,palette:palette2,styles})}var import_jsx_runtime7=require("react/jsx-runtime"),VISIBLE_CATALOG_ITEMS=8;function catalogTitle(path){const normalized=path.replace(/^tools\\./,""),words=(normalized.split(".").at(-1)??normalized).replace(/[_-]+/g," ").split(" ").filter(Boolean);return words.length===0?normalized:words.map(word=>`${word[0]?.toUpperCase()??""}${word.slice(1)}`).join(" ")}function catalogServer(path){const normalized=path.replace(/^tools\\./,""),segments=normalized.split(".");return segments.length>1?segments[0]??normalized:normalized}function CodeModeToolDetail({code,output,theme,styles}){const catalog=(0,import_react11.useMemo)(()=>parseCodeModeCatalog(output),[output]),[showAll,setShowAll]=(0,import_react11.useState)(!1),visibleItems=catalog&&!showAll?catalog.items.slice(0,VISIBLE_CATALOG_ITEMS):catalog?.items,hiddenCount=catalog?catalog.items.length-(visibleItems?.length??0):0;return(0,import_jsx_runtime7.jsxs)(import_react_native13.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime7.jsx)(PaseoCodeBlock,{code,language:"javascript",label:t2("ui.script"),theme,styles}),catalog&&visibleItems?(0,import_jsx_runtime7.jsxs)(Section,{title:catalog.remaining!==void 0?t2("ui.toolsRemaining",{count:catalog.items.length,remaining:catalog.remaining}):t2("ui.toolsCount",{count:catalog.items.length}),styles,children:[(0,import_jsx_runtime7.jsx)(import_react_native13.View,{style:styles.paseoList,children:visibleItems.map(item=>(0,import_jsx_runtime7.jsxs)(import_react_native13.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime7.jsxs)(import_react_native13.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime7.jsx)(import_react_native13.Text,{numberOfLines:1,style:styles.paseoListItemTitle,children:catalogTitle(item.path)}),(0,import_jsx_runtime7.jsx)(import_react_native13.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:catalogServer(item.path)})]}),(0,import_jsx_runtime7.jsx)(import_react_native13.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:item.path}),item.description?(0,import_jsx_runtime7.jsx)(import_react_native13.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:compactText2(item.description,180)}):null]},item.path))}),hiddenCount>0||catalog.remaining?(0,import_jsx_runtime7.jsx)(import_react_native13.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime7.jsx)(import_react_native13.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):catalog.remaining?t2("ui.expandToolsRemaining",{count:catalog.items.length,remaining:catalog.remaining}):t2("ui.expandToolsCount",{count:catalog.items.length})})}):null]}):(0,import_jsx_runtime7.jsx)(PaseoCodeBlock,{code:formatUnknownValue(output),language:"json",label:t2("ui.output"),theme,styles})]})}var import_react_native14=require("@getpaseo/plugin/client/react-native"),import_react_native15=require("react-native"),import_jsx_runtime8=require("react/jsx-runtime");function asRecord6(value){return typeof value=="object"&&value!==null&&!Array.isArray(value)?value:null}function fieldValue(record,...keys){for(const key of keys)if(record?.[key]!==void 0&&record[key]!==null)return record[key]}function fieldString4(record,...keys){const value=fieldValue(record,...keys);return typeof value=="string"&&value.trim()?value:void 0}function fieldNumber2(record,...keys){const value=fieldValue(record,...keys);return typeof value=="number"&&Number.isFinite(value)?value:void 0}function scalarField(record,...keys){return fieldString4(record,...keys)??fieldNumber2(record,...keys)}function fieldArray2(record,...keys){const value=fieldValue(record,...keys);return Array.isArray(value)?value:[]}function scalarText2(value){return value==null||value===""?"\\u2014":typeof value=="boolean"?t2(value?"ui.yes":"ui.no"):typeof value=="string"||typeof value=="number"?String(value):formatUnknownValue(value)}function stableKey(value,prefix){const record=asRecord6(value),identity=fieldValue(record,"id","node_id","number","name","path","url");if(typeof identity=="string"||typeof identity=="number")return`${prefix}-${identity}`;try{return`${prefix}-${JSON.stringify(value)}`}catch{return prefix}}function RecordFields({record,excluded=[],palette:palette2,styles}){if(!record)return null;const excludedSet=new Set(excluded),fields=Object.entries(record).filter(([key,value])=>value!==void 0&&!excludedSet.has(key)).slice(0,16).map(([key,value])=>[key,value]);return(0,import_jsx_runtime8.jsx)(PaseoFields,{fields,palette:palette2,styles})}function GithubList({title,items,renderItem,styles}){return(0,import_jsx_runtime8.jsx)(Section,{title:t2("ui.listTitle",{title,count:items.length}),styles,children:items.length===0?(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{style:styles.empty,children:t2("ui.noResultsReturned")}):(0,import_jsx_runtime8.jsx)(import_react_native15.View,{style:styles.paseoList,children:items.map(item=>(0,import_jsx_runtime8.jsx)(import_react_native15.View,{style:styles.paseoListItem,children:renderItem(asRecord6(item))},stableKey(item,title)))})})}function RepositoryList({items,styles}){return(0,import_jsx_runtime8.jsx)(GithubList,{title:t2("ui.repository"),items,styles,renderItem:repository=>(0,import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment,{children:[(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:1,style:styles.paseoListItemTitle,children:fieldString4(repository,"full_name","fullName","name")??t2("ui.repository")}),fieldString4(repository,"language")?(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{style:styles.paseoListItemMeta,children:fieldString4(repository,"language")}):null]}),fieldString4(repository,"description")?(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:3,style:styles.paseoListItemMeta,children:fieldString4(repository,"description")}):null,(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{style:styles.paseoListItemMeta,children:[fieldValue(repository,"stargazers_count","stars"),fieldValue(repository,"forks_count","forks"),fieldString4(repository,"updated_at","updatedAt")].filter(value=>value!==void 0).map(String).join(t2("ui.metaSeparator"))}),fieldString4(repository,"html_url","htmlUrl","url")?(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:1,style:styles.paseoListItemMeta,children:fieldString4(repository,"html_url","htmlUrl","url")}):null]})})}function CodeResultList({items,styles}){return(0,import_jsx_runtime8.jsx)(GithubList,{title:t2("ui.codeResults"),items,styles,renderItem:result=>{const repository=asRecord6(fieldValue(result,"repository"));return(0,import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment,{children:[(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:1,style:styles.paseoListItemTitle,children:fieldString4(result,"path","name")??t2("ui.codeResults")}),(0,import_jsx_runtime8.jsx)(import_react_native14.Icon,{name:"Code2",color:styles.paseoListItemTitle.color,size:12})]}),(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{style:styles.paseoListItemMeta,children:fieldString4(repository,"full_name","fullName","name")??fieldString4(result,"repository_url","repositoryUrl")??t2("ui.repositoryUnavailable")}),fieldString4(result,"html_url","htmlUrl","url")?(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:1,style:styles.paseoListItemMeta,children:fieldString4(result,"html_url","htmlUrl","url")}):null,fieldValue(result,"text_matches","textMatches")!==void 0?(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:3,style:styles.paseoListItemMeta,children:scalarText2(fieldValue(result,"text_matches","textMatches"))}):null]})}})}function repositoryName(record){const owner=fieldString4(record,"owner"),repo=fieldString4(record,"repo");return owner&&repo?`${owner}/${repo}`:void 0}function PullRequestDetail({input,result,headerSummary,theme,palette:palette2,styles}){const inputRecord=asRecord6(input),resultRecord=asRecord6(result),method=fieldString4(inputRecord,"method")??"get";return Array.isArray(result)?(0,import_jsx_runtime8.jsx)(GithubList,{title:t2(method==="get_files"?"ui.changedFiles":method==="get_commits"?"ui.commits":"ui.pRResult"),items:result,styles,renderItem:item=>(0,import_jsx_runtime8.jsx)(RecordFields,{record:item,palette:palette2,styles})}):typeof result=="string"?(0,import_jsx_runtime8.jsx)(PaseoCodeBlock,{code:result,language:method==="get_diff"?"diff":"markdown",label:t2("ui.output"),theme,styles}):(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime8.jsx)(PaseoFields,{fields:[[t2("ui.repository"),notInHeader(repositoryName(inputRecord),headerSummary)],["PR",notInHeader(scalarField(inputRecord,"pullNumber","pull_number"),headerSummary)],[t2("ui.method"),method],[t2("ui.title"),fieldString4(resultRecord,"title")],[t2("ui.status"),fieldString4(resultRecord,"state"),"status"],[t2("ui.author"),fieldString4(asRecord6(resultRecord?.user),"login")??fieldString4(resultRecord,"author")],[t2("ui.targetBranch"),fieldString4(asRecord6(resultRecord?.base),"ref")??fieldString4(resultRecord,"base")],[t2("ui.sourceBranch"),fieldString4(asRecord6(resultRecord?.head),"ref")??fieldString4(resultRecord,"head")],[t2("ui.changedFiles"),fieldValue(resultRecord,"changed_files","changedFiles")],[t2("ui.addedLines"),fieldValue(resultRecord,"additions")],[t2("ui.deletedLines"),fieldValue(resultRecord,"deletions")],[t2("ui.uRL"),fieldString4(resultRecord,"html_url","htmlUrl","url")]],palette:palette2,styles}),fieldString4(resultRecord,"body")?(0,import_jsx_runtime8.jsx)(PaseoCodeBlock,{code:fieldString4(resultRecord,"body"),language:"markdown",label:t2("ui.description"),theme,styles}):null,method==="get_reviews"||method==="get_review_comments"||method==="get_comments"?(0,import_jsx_runtime8.jsx)(RecordFields,{record:resultRecord,excluded:["body"],palette:palette2,styles}):null]})}function ActionsDetail({kind,input,result,headerSummary,theme,palette:palette2,styles}){const inputRecord=asRecord6(input);if(kind==="job-logs"){const logs=githubOutputText(result)??(typeof result=="string"?result:void 0);return(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime8.jsx)(PaseoFields,{fields:[[t2("ui.repository"),repositoryName(inputRecord)],[t2("ui.job"),notInHeader(scalarField(inputRecord,"jobId","job_id"),headerSummary)],[t2("ui.resource"),notInHeader(scalarField(inputRecord,"resource_id"),headerSummary)]],palette:palette2,styles}),logs?(0,import_jsx_runtime8.jsx)(PaseoCodeBlock,{code:logs,language:"ansi",label:t2("ui.log"),theme,styles}):(0,import_jsx_runtime8.jsx)(RecordFields,{record:asRecord6(result),palette:palette2,styles})]})}if(kind==="actions-run")return(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime8.jsx)(PaseoFields,{fields:[[t2("ui.repository"),repositoryName(inputRecord)],[t2("ui.workflow"),notInHeader(scalarField(inputRecord,"workflowId","workflow_id","workflow","resource_id"),headerSummary)],[t2("ui.reference"),fieldString4(inputRecord,"ref")],[t2("ui.inputParameters"),fieldValue(inputRecord,"inputs")]],palette:palette2,styles}),(0,import_jsx_runtime8.jsx)(RecordFields,{record:asRecord6(result),palette:palette2,styles})]});const record=asRecord6(result),items=Array.isArray(result)?result:fieldArray2(record,"workflows","workflow_runs","workflowRuns","jobs","artifacts","runs"),title=fieldValue(record,"workflows")!==void 0?t2("ui.workflow"):fieldValue(record,"workflow_runs","workflowRuns","runs")!==void 0?t2("ui.workflowRun"):fieldValue(record,"jobs")!==void 0?t2("ui.job"):fieldValue(record,"artifacts")!==void 0?t2("ui.artifacts"):t2(kind==="actions-get"?"ui.actionsDetails":"ui.actionsResult");return(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[record&&!items.length?(0,import_jsx_runtime8.jsx)(RecordFields,{record,palette:palette2,styles}):null,items.length?(0,import_jsx_runtime8.jsx)(GithubList,{title,items,styles,renderItem:item=>(0,import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment,{children:[(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{selectable:!0,numberOfLines:1,style:styles.paseoListItemTitle,children:fieldString4(item,"name","display_title","displayTitle","path","id")??t2("ui.gitHubActionsItem")}),fieldString4(item,"status","conclusion","state")?(0,import_jsx_runtime8.jsx)(StatusPill,{value:fieldString4(item,"status","conclusion","state"),palette:palette2,styles}):null]}),(0,import_jsx_runtime8.jsx)(import_react_native15.Text,{style:styles.paseoListItemMeta,children:[fieldString4(item,"head_branch","headBranch","branch"),fieldString4(item,"event"),fieldString4(item,"actor")??fieldString4(asRecord6(item?.actor),"login"),fieldString4(item,"html_url","htmlUrl","url")].filter(Boolean).join(t2("ui.metaSeparator"))})]})}):null]})}function GithubToolDetail({toolName,input,output,theme,palette:palette2,styles}){const kind=githubToolKind(toolName);if(!kind)return null;const result=githubOutputValue(output),inputRecord=asRecord6(input),headerSummary=githubToolSummary(kind,input);if(kind==="search-repositories"){const record=asRecord6(result);return(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime8.jsx)(PaseoFields,{fields:[[t2("ui.query2"),notInHeader(fieldString4(inputRecord,"query"),headerSummary)],[t2("ui.total"),fieldValue(record,"total_count","totalCount")]],palette:palette2,styles}),(0,import_jsx_runtime8.jsx)(RepositoryList,{items:fieldArray2(record,"items","repositories"),styles})]})}if(kind==="search-code"){const record=asRecord6(result);return(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime8.jsx)(PaseoFields,{fields:[[t2("ui.query2"),notInHeader(fieldString4(inputRecord,"query"),headerSummary)],[t2("ui.total"),fieldValue(record,"total_count","totalCount")]],palette:palette2,styles}),(0,import_jsx_runtime8.jsx)(CodeResultList,{items:fieldArray2(record,"items","results"),styles})]})}if(kind==="file"){const record=asRecord6(result),path=fieldString4(record,"path","name")??fieldString4(inputRecord,"path"),content=fieldString4(record,"content")??(typeof result=="string"?result:githubOutputText(output));return(0,import_jsx_runtime8.jsxs)(import_react_native15.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime8.jsx)(PaseoFields,{fields:[[t2("ui.repository"),repositoryName(inputRecord)],[t2("ui.path2"),notInHeader(path,headerSummary)],[t2("ui.size"),fieldValue(record,"size")],[t2("ui.sha"),fieldString4(record,"sha")],[t2("ui.encoding"),fieldString4(record,"encoding")],[t2("ui.uRL"),fieldString4(record,"html_url","htmlUrl","download_url","downloadUrl")]],palette:palette2,styles}),content?(0,import_jsx_runtime8.jsx)(PaseoCodeBlock,{code:content,language:languageForFilePath(path)??"text",label:t2("ui.content"),theme,styles}):(0,import_jsx_runtime8.jsx)(RecordFields,{record,palette:palette2,styles})]})}return kind==="pull-request"?(0,import_jsx_runtime8.jsx)(PullRequestDetail,{input,result,headerSummary,theme,palette:palette2,styles}):(0,import_jsx_runtime8.jsx)(ActionsDetail,{kind,input,result,headerSummary,theme,palette:palette2,styles})}var import_react_native16=require("react-native"),import_jsx_runtime9=require("react/jsx-runtime");function OmpFindToolDetail({input,output,styles}){const result=parseOmpFindResult(input,output);if(!result)return null;const summary=[result.listed!==void 0?t2("ui.listed",{count:result.listed}):void 0,result.judged!==void 0?t2("ui.evaluated",{count:result.judged}):void 0,result.filesRead!==void 0?t2("ui.filesRead",{count:result.filesRead}):void 0].filter(Boolean).join(t2("ui.metaSeparator"));return(0,import_jsx_runtime9.jsxs)(import_react_native16.View,{style:styles.section,children:[result.query?(0,import_jsx_runtime9.jsx)(import_react_native16.Text,{selectable:!0,style:styles.detailText,children:result.query}):null,result.path?(0,import_jsx_runtime9.jsx)(import_react_native16.Text,{selectable:!0,style:styles.mutedText,children:t2("ui.scopeValue",{value:result.path})}):null,result.keywords.length?(0,import_jsx_runtime9.jsx)(import_react_native16.Text,{selectable:!0,style:styles.mutedText,children:t2("ui.keywordsValue",{value:joinList(result.keywords)})}):null,summary?(0,import_jsx_runtime9.jsx)(import_react_native16.Text,{style:styles.mutedText,children:summary}):null,result.hits.length?result.hits.map(hit=>(0,import_jsx_runtime9.jsxs)(import_react_native16.View,{style:styles.section,children:[(0,import_jsx_runtime9.jsxs)(import_react_native16.Text,{selectable:!0,style:styles.detailText,children:[hit.path,hit.score!==void 0?t2("ui.scoreSuffix",{score:Math.round(hit.score*100)}):""]}),hit.ranges.map((range,index)=>(0,import_jsx_runtime9.jsxs)(import_react_native16.Text,{selectable:!0,style:styles.mutedText,children:[range.start===range.end?t2("ui.line",{line:range.start}):t2("ui.lines",{start:range.start,end:range.end}),range.snippet?`  ${range.snippet}`:""]},`${range.start}-${range.end}-${index}`))]},hit.path)):(0,import_jsx_runtime9.jsx)(import_react_native16.Text,{style:styles.empty,children:t2("ui.noMatchingFiles")})]})}var import_react_native17=require("react-native"),import_jsx_runtime10=require("react/jsx-runtime"),JOB_STATUS_LABELS={get running(){return t2("ui.running")},get completed(){return t2("ui.completed")},get done(){return t2("ui.completed")},get failed(){return t2("ui.failed")},get error(){return t2("ui.failed")},get canceled(){return t2("ui.canceled")},get cancelled(){return t2("ui.canceled")}};function displayStatus(status){return status?JOB_STATUS_LABELS[status]??status:t2("ui.waiting")}function OmpWaitToolDetail({output,palette:palette2,styles}){const jobs=parseOmpWaitOutput(output)?.jobs??[];return(0,import_jsx_runtime10.jsx)(import_react_native17.View,{style:styles.paseoStack,children:jobs.length>0?(0,import_jsx_runtime10.jsx)(Section,{title:t2("ui.agent"),styles,children:(0,import_jsx_runtime10.jsx)(PaseoFields,{fields:jobs.map(job=>[job.label??job.id,[displayStatus(job.status),job.durationMs!==void 0?formatWaitTimeout(job.durationMs):void 0,job.model].filter(Boolean).join(t2("ui.metaSeparator"))]),palette:palette2,styles})}):null})}var import_react_native18=require("react-native"),import_jsx_runtime11=require("react/jsx-runtime");function OpencodeSubagentToolDetail({input,output,theme,palette:palette2,styles}){const parsedInput=parseOpencodeSubagentInput(input),parsedOutput=parseOpencodeSubagentOutput(output),summary=opencodeSubagentSummary(input,output),status=parsedOutput?.status,sessionID=parsedOutput?.sessionID??parsedInput.sessionID,resultText=parsedOutput?.text;return(0,import_jsx_runtime11.jsxs)(import_react_native18.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime11.jsx)(FieldsSection,{title:t2("ui.task"),fields:[[t2("ui.agent"),notInHeader(parsedInput.agent,summary)],[t2("ui.description"),notInHeader(parsedInput.description,summary)],[t2("ui.model"),parsedInput.model],[t2("ui.status"),status,"status"],[t2("ui.session2"),sessionID],[t2("ui.resumeSession"),parsedInput.sessionID&&parsedInput.sessionID!==sessionID?parsedInput.sessionID:void 0],[t2("ui.runInBackground"),parsedInput.background]],palette:palette2,styles}),parsedInput.prompt?(0,import_jsx_runtime11.jsx)(PaseoCodeBlock,{code:parsedInput.prompt,language:"text",label:t2("ui.prompt"),theme,styles}):null,resultText&&!parsedOutput?.isBackgroundNotice?(0,import_jsx_runtime11.jsx)(Section,{title:t2("ui.result"),styles,children:(0,import_jsx_runtime11.jsx)(import_react_native18.Text,{selectable:!0,style:styles.detailText,children:resultText})}):resultText?(0,import_jsx_runtime11.jsx)(Section,{title:t2("ui.status"),styles,children:(0,import_jsx_runtime11.jsx)(import_react_native18.Text,{selectable:!0,style:styles.mutedText,children:resultText})}):null]})}var import_react_native19=require("react-native"),import_jsx_runtime12=require("react/jsx-runtime");function MessageBlock({label,text,styles}){return(0,import_jsx_runtime12.jsx)(Section,{title:label,styles,children:(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{selectable:!0,style:styles.paseoPrompt,children:text})})}function PiSubagentToolDetail({input,output,theme,palette:palette2,styles,agentType,description,childSessionId}){const parsed=parsePiSubagentCall(input,output);return(0,import_jsx_runtime12.jsxs)(import_react_native19.View,{style:styles.paseoStack,children:[(0,import_jsx_runtime12.jsx)(FieldsSection,{title:t2("ui.agent"),fields:[[t2("ui.agentId"),parsed.agentId],[t2("ui.type"),agentType??parsed.agentType],[t2("ui.description"),parsed.description??description],[t2("ui.session2"),childSessionId],[t2("ui.mode"),parsed.wait===!0?t2("ui.waitUntilFinished"):parsed.wait===!1?t2("ui.checkResultsWithoutWaiting"):void 0]],palette:palette2,styles}),parsed.status?(0,import_jsx_runtime12.jsx)(StatusPill,{value:parsed.status,palette:palette2,styles}):null,(0,import_jsx_runtime12.jsx)(FieldsSection,{title:t2("ui.usage"),fields:[[t2("ui.toolCallCount"),parsed.toolUses],[t2("ui.token"),parsed.tokens],[t2("ui.context2"),parsed.context],[t2("ui.duration"),parsed.duration]],palette:palette2,styles}),(0,import_jsx_runtime12.jsx)(FieldsSection,{title:t2("ui.transcript"),fields:[[t2("ui.outputFile"),parsed.outputFile]],palette:palette2,styles}),parsed.error?(0,import_jsx_runtime12.jsx)(Section,{title:t2("ui.error"),styles,children:(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{selectable:!0,style:[styles.detailText,{color:palette2.statusColors.failed}],children:parsed.error})}):null,parsed.notice?(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{style:styles.mutedText,children:parsed.notice}):null,parsed.prompt?(0,import_jsx_runtime12.jsx)(MessageBlock,{label:t2("ui.prompt"),text:parsed.prompt,styles}):null,parsed.message?(0,import_jsx_runtime12.jsx)(MessageBlock,{label:t2("ui.steerMessage"),text:parsed.message,styles}):null,parsed.body?(0,import_jsx_runtime12.jsx)(Section,{title:t2("ui.result"),styles,children:(0,import_jsx_runtime12.jsx)(ReasoningMarkdown,{text:parsed.body,theme,styles})}):null]})}function SupervisorToolDetail({input,output,palette:palette2,styles}){const parsed=parseSubagentSupervisorInput(input),envelope=extractPiToolText(output),details=envelope?.details??{},agent=typeof details.agent=="string"&&details.agent.trim()?details.agent:void 0,runId=typeof details.runId=="string"&&details.runId.trim()?details.runId:void 0,replyTo=parsed.replyTo??(typeof details.replyTo=="string"?details.replyTo:void 0),headerSummary=subagentSupervisorSummary(input,output),knownAction=["reply","pending","list","status"].includes(parsed.action),resultText=textAfterHeader(envelope?.text,headerSummary),message=notInHeader(parsed.message,headerSummary);return(0,import_jsx_runtime12.jsx)(import_react_native19.View,{style:styles.paseoStack,children:parsed.action==="reply"?(0,import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment,{children:[message?(0,import_jsx_runtime12.jsx)(MessageBlock,{label:t2("ui.replyMessage"),text:message,styles}):null,(0,import_jsx_runtime12.jsx)(FieldsSection,{title:t2("ui.request"),fields:[[t2("ui.requestID"),replyTo],[t2("ui.run"),runId],[t2("ui.agent"),notInHeader(agent,headerSummary)],[t2("ui.confirmation"),envelope?.text||void 0]],palette:palette2,styles})]}):(0,import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment,{children:[(0,import_jsx_runtime12.jsx)(FieldsSection,{title:t2("ui.query2"),fields:[[t2("ui.action"),knownAction?void 0:parsed.action||void 0],[t2("ui.to"),notInHeader(parsed.to,headerSummary)],[t2("ui.message"),message]],palette:palette2,styles}),resultText?(0,import_jsx_runtime12.jsx)(MessageBlock,{label:t2("ui.result"),text:resultText,styles}):envelope?.text?null:(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{style:styles.empty,children:t2("ui.noPendingSubagentRequests")})]})})}function BgWaitToolDetail({input,output,theme,palette:palette2,styles}){const parsed=parseBgWaitInput(input),summary=parseBgWaitOutput(output),headerSummary=bgWaitSummary(input,output),timeout=formatWaitTimeout(parsed.timeoutMs);return(0,import_jsx_runtime12.jsxs)(import_react_native19.View,{style:styles.paseoStack,children:[summary?.headline?(0,import_jsx_runtime12.jsx)(Section,{title:t2("ui.overview"),styles,children:(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{selectable:!0,style:styles.detailText,children:summary.headline})}):null,(0,import_jsx_runtime12.jsx)(FieldsSection,{title:t2("ui.wait"),fields:[[t2("ui.run"),parsed.id],[t2("ui.timeout"),notInHeader(timeout?t2("ui.timeoutValue",{time:timeout}):void 0,headerSummary)],[t2("ui.nonblocking"),parsed.nonBlocking],[t2("ui.stopWhenAttentionIsNeeded"),parsed.stopOnAttention],[t2("ui.activeRuns"),summary&&summary.activeRunIds.length>0?summary.activeRunIds.join(", "):void 0],[t2("ui.providerEntries"),summary&&summary.activeProviderItems.length>0?summary.activeProviderItems.map(item=>`${item.provider}:${item.id}`).join(", "):void 0]],palette:palette2,styles}),summary&&summary.completions.length>0?(0,import_jsx_runtime12.jsx)(Section,{title:t2("ui.completed2",{count:summary.completions.length}),styles,children:(0,import_jsx_runtime12.jsx)(import_react_native19.View,{style:styles.paseoList,children:summary.completions.map(completion=>(0,import_jsx_runtime12.jsxs)(import_react_native19.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime12.jsxs)(import_react_native19.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{numberOfLines:1,style:styles.paseoListItemTitle,children:completion.agent??t2("ui.runFinished")}),completion.success!==void 0?(0,import_jsx_runtime12.jsx)(StatusPill,{value:completion.success?"Success":"Failed",palette:palette2,styles}):null]}),(0,import_jsx_runtime12.jsx)(import_react_native19.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:completion.runId})]},`completion-${completion.runId}-${completion.agent??"run"}`))})}):null,summary?.body?(0,import_jsx_runtime12.jsx)(PaseoCodeBlock,{code:summary.body,language:"text",label:t2("ui.waitLog"),theme,styles}):null]})}var import_react_native20=require("@getpaseo/plugin/client/react-native"),import_react_native21=require("react-native"),import_jsx_runtime13=require("react/jsx-runtime"),STATUS_ICONS={completed:"CircleCheck",in_progress:"LoaderCircle",pending:"Circle"};function TodoTaskRow({task,theme,palette:palette2,styles,showDescription}){const color=task.status==="completed"?palette2.statusColors.completed:task.status==="in_progress"?palette2.statusColors.running:theme.colors.foregroundMuted,meta=[task.status==="in_progress"?task.activeForm:void 0,task.blockedBy.length>0?t2("ui.waitingForToFinish",{tasks:joinList(task.blockedBy.map(id=>`#${id}`))}):void 0].filter(Boolean).join(t2("ui.metaSeparator"));return(0,import_jsx_runtime13.jsxs)(import_react_native21.View,{style:styles.paseoListItem,children:[(0,import_jsx_runtime13.jsxs)(import_react_native21.View,{style:styles.paseoListItemHeader,children:[(0,import_jsx_runtime13.jsx)(import_react_native20.Icon,{name:STATUS_ICONS[task.status],color,size:11}),(0,import_jsx_runtime13.jsx)(import_react_native21.Text,{numberOfLines:1,selectable:!0,style:task.status==="completed"?styles.todoDone:styles.paseoListItemTitle,children:todoTaskLabel(task.id,task.subject)})]}),meta?(0,import_jsx_runtime13.jsx)(import_react_native21.Text,{numberOfLines:1,style:styles.paseoListItemMeta,children:meta}):null,showDescription&&task.description?(0,import_jsx_runtime13.jsx)(import_react_native21.Text,{numberOfLines:2,style:styles.paseoListItemMeta,children:task.description}):null]})}function TodoToolDetail({input,output,theme,palette:palette2,styles}){const model=todoToolDetailModel(input,output);return!model.resultText&&model.tasks.length===0?null:(0,import_jsx_runtime13.jsxs)(import_react_native21.View,{style:styles.paseoStack,children:[model.resultText?(0,import_jsx_runtime13.jsx)(import_react_native21.Text,{selectable:!0,style:styles.detailText,children:model.resultText}):null,model.tasks.length>1?(0,import_jsx_runtime13.jsx)(Section,{title:t2("ui.tasks",{count:model.tasks.length}),styles,children:(0,import_jsx_runtime13.jsx)(import_react_native21.View,{style:styles.paseoList,children:model.tasks.map(task=>(0,import_jsx_runtime13.jsx)(TodoTaskRow,{task,showDescription:task.status==="in_progress",theme,palette:palette2,styles},task.id))})}):model.tasks[0]?(0,import_jsx_runtime13.jsx)(TodoTaskRow,{task:model.tasks[0],showDescription:!0,theme,palette:palette2,styles}):null]})}var import_react_native24=require("@getpaseo/plugin/client/react-native"),import_react14=require("react"),import_react_native25=require("react-native"),import_client3=require("@getpaseo/plugin/client"),import_react12=require("react"),import_client4=require("@getpaseo/plugin/client"),import_react13=require("react"),import_react_native23=require("react-native"),import_react_native22=require("react-native"),UI_STACK=\'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif\',MONO_STACK=\'ui-monospace, "SF Mono", "Cascadia Code", "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace\',STYLE_ELEMENT_ID="colorful-activity-fonts",cuiViewEscape={dataSet:{cui:!0}},cmonoViewEscape={dataSet:{cmono:!0}},cmonoTextEscape={dataSet:{cmono:!0}},monoStack=MONO_STACK;function fontRules(mono){return[`[data-cui][data-cui], [data-cui][data-cui] * { font-family: ${UI_STACK}; }`,`[data-cmono][data-cmono], [data-cmono][data-cmono] * { font-family: ${mono}; }`].join(`\n`)}function setMonoFontStack(stack){const next=stack||MONO_STACK;if(next===monoStack||(monoStack=next,import_react_native22.Platform.OS!=="web"||typeof document>"u"))return;const node=document.getElementById(STYLE_ELEMENT_ID);node&&(node.textContent=fontRules(next))}function useTypography(){const settings=(0,import_client4.useSettings)(activitySettings),values=settings.status==="ready"?settings.values:null,stack=values&&import_react_native23.Platform.OS==="web"?monoFontStack(values.monoFont):null,family=stack?`${stack}, ${MONO_STACK}`:void 0;return(0,import_react13.useEffect)(()=>{values&&setMonoFontStack(family)},[values,family]),values?typography(values.textSize,values.lineSpacing,family):DEFAULT_TYPOGRAPHY}var import_jsx_runtime14=require("react/jsx-runtime");function statusColor2(theme,status,use="solid"){const look=statusLooks[status];return look.hue==="muted"?use==="soft"?theme.colors.surface2:theme.colors.foregroundMuted:hue(theme,look.hue,use)}function Spinner({size,color}){const ring=size-2,stroke=size>=14?2:1.5,circle={position:"absolute",width:ring,height:ring,borderRadius:ring/2,borderWidth:stroke};return(0,import_jsx_runtime14.jsxs)(import_react_native25.View,{style:{width:size,height:size,alignItems:"center",justifyContent:"center"},children:[(0,import_jsx_runtime14.jsx)(import_react_native25.View,{style:[circle,{borderColor:withAlpha(color,.28)}]}),(0,import_jsx_runtime14.jsx)(Spin,{size:ring,children:(0,import_jsx_runtime14.jsx)(import_react_native25.View,{style:[circle,{borderColor:"transparent",borderTopColor:color,borderRightColor:color}]})})]})}function BrandChip({badge:badge2}){return(0,import_jsx_runtime14.jsx)(import_react_native25.View,{style:{height:16,minWidth:16,paddingHorizontal:4,borderRadius:4,justifyContent:"center",alignItems:"center",backgroundColor:badge2.color,flexShrink:0},children:(0,import_jsx_runtime14.jsx)(import_react_native25.Text,{numberOfLines:1,style:{color:badgeInk(badge2),fontSize:9.5,fontWeight:"800",letterSpacing:.2,lineHeight:12},children:badge2.label})})}var frameStyles=import_react_native25.StyleSheet.create({edge:{position:"absolute",left:0,top:4,bottom:4,width:3,borderRadius:2,pointerEvents:"none"},sweep:{position:"absolute",left:8,right:8,bottom:0,pointerEvents:"none"}}),import_jsx_runtime15=require("react/jsx-runtime"),import_react16=require("react");function asToolCallDetail(value){return!value||typeof value!="object"||Array.isArray(value)||typeof Reflect.get(value,"type")!="string"?null:value}function DetailLabel({children,style}){return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style,children:typeof children=="string"?zh(children):children})}function PathRow({icon,path,styles}){return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.pathRow,children:[(0,import_jsx_runtime15.jsx)(import_react_native26.Icon,{name:icon,color:styles.pathText.color,size:12}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.pathText,children:path})]})}function FileTitle({path,styles}){const chip=fileBadge(path);return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.pathRow,children:[chip?(0,import_jsx_runtime15.jsx)(BrandChip,{badge:chip}):(0,import_jsx_runtime15.jsx)(import_react_native26.Icon,{name:"File",color:styles.pathText.color,size:12}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,numberOfLines:2,style:styles.pathText,children:path})]})}function TokenizedLines2({lines,styles,numbersFrom,wrapLines}){return(0,import_jsx_runtime15.jsx)(import_react_native27.View,{children:lines.map((line,lineIndex)=>(0,import_jsx_runtime15.jsxs)(import_react_native27.Text,{selectable:!0,style:[styles.codeLine,wrapLines||numbersFrom!==void 0?{flexShrink:1}:null],children:[numbersFrom!==void 0?(0,import_jsx_runtime15.jsxs)(import_react_native27.Text,{style:styles.gutterText,children:[String(numbersFrom+lineIndex)," "]}):null,line.length===0?" ":line.map((token,tokenIndex)=>{const tokenStyle={color:token.color??styles.codeLine.color,...token.fontStyle&&token.fontStyle&1?{fontStyle:"italic"}:{},...token.fontStyle&&token.fontStyle&2?{fontWeight:"700"}:{},...token.fontStyle&&token.fontStyle&4?{textDecorationLine:"underline"}:{}};return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:tokenStyle,children:token.content},`${lineIndex}-${tokenIndex}`)})]},`line-${lineIndex}`))})}function LineGutter({start,count:count2,styles}){const numbers=(0,import_react15.useMemo)(()=>Array.from({length:count2},(_,index)=>String(start+index)),[count2,start]);return(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.gutter,children:numbers.map(number=>(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.gutterText,children:number},number))})}function HighlightedCodeBlock({code,language:language3,theme,label,styles,chip,title,lineStart,extra,copyLabel=t2("ui.copyCode"),follow}){const[showAll,setShowAll]=(0,import_react15.useState)(!1),wrap=useWrapLines("code"),clean=(0,import_react15.useMemo)(()=>stripAnsi(code),[code]),view=(0,import_react15.useMemo)(()=>outputView(code,clean,showAll,language3==="ansi",!0,follow),[clean,code,follow,language3,showAll]),{preview,shown:displayCode,start:tailStart}=view,tokens=useHighlightTokens(view.highlight,language3,language3==="bash"?{...theme.colors,...vividSyntaxColors(theme)}:theme.colors),lineCount=(0,import_react15.useMemo)(()=>lineStart===void 0?0:displayCode.split(`\n`).length,[displayCode,lineStart]),codeLines=(0,import_react15.useMemo)(()=>wrap?displayCode.split(`\n`):null,[wrap,displayCode]);return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{...cmonoViewEscape,style:styles.frame,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.frameHeader,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.frameTitleRow,children:[chip?(0,import_jsx_runtime15.jsx)(BrandChip,{badge:chip}):null,title?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,numberOfLines:1,style:styles.frameTitle,children:title}):label?(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:label}):null]}),extra,(0,import_jsx_runtime15.jsx)(OutputCopyButtons,{clean,raw:code,label:copyLabel,theme,styles})]}),wrap?(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.frameBodyWrap,children:tokens?(0,import_jsx_runtime15.jsx)(TokenizedLines2,{lines:tokens,styles,numbersFrom:lineStart!==void 0?lineStart+tailStart:void 0,wrapLines:!0}):codeLines?codeLines.map((line,index)=>(0,import_jsx_runtime15.jsxs)(import_react_native27.Text,{selectable:!0,style:[styles.codeLine,{flexShrink:1}],children:[lineStart!==void 0?(0,import_jsx_runtime15.jsxs)(import_react_native27.Text,{style:styles.gutterText,children:[String(lineStart+tailStart+index)," "]}):null,line||" "]},`code-${index}`)):null}):(0,import_jsx_runtime15.jsx)(import_react_native26.ScrollView,{horizontal:!0,nestedScrollEnabled:!0,style:styles.codeScroll,children:(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.frameBody,children:[lineStart!==void 0?(0,import_jsx_runtime15.jsx)(LineGutter,{start:lineStart+tailStart,count:lineCount,styles}):null,(0,import_jsx_runtime15.jsx)(import_react_native27.View,{children:tokens?(0,import_jsx_runtime15.jsx)(TokenizedLines2,{lines:tokens,styles}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.codeLine,children:displayCode||" "})})]})}),preview.truncated?(0,import_jsx_runtime15.jsx)(import_react_native27.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):t2("ui.expandAllLinesCharacters",{count:preview.totalLines,lines:preview.totalLines,characters:preview.totalChars.toLocaleString()})})}):null]})}function shellExitCode(detail,errorText2){if(typeof detail.exitCode=="number")return detail.exitCode;const fromText=/^\\s*Exit code (\\d+)\\b/i.exec(errorText2??"")?.[1];return fromText?Number(fromText):null}function TerminalBlock({command,output:rawOutput,errorOutput,exitCode,theme,palette:palette2,styles,follow}){const brand=(0,import_react15.useMemo)(()=>commandBadge(command),[command]),commandTokens=useHighlightTokens(`$ ${command}`,"bash",theme.colors),[showAll,setShowAll]=(0,import_react15.useState)(!1),isError=!rawOutput&&!!errorOutput,output=rawOutput||(errorOutput?errorOutput.replace(/^\\s*Exit code \\d+\\s*\\n?/i,"").replace(/^\\s*\\n/,""):void 0)||void 0,clean=(0,import_react15.useMemo)(()=>stripAnsi(output??""),[output]),view=(0,import_react15.useMemo)(()=>outputView(output??"",clean,showAll,!isError,!0,follow),[clean,follow,isError,output,showAll]),{preview,shown:shownOutput}=view,outputTokens=useHighlightTokens(isError?"":view.highlight,"ansi",theme.colors),failed=exitCode!==null&&exitCode!==0,failedColor=palette2.statusColors.failed,wrap=useWrapLines("output"),exitColor=failed?failedColor:palette2.statusColors.completed;return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{...cmonoViewEscape,style:styles.frame,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.frameHeader,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.frameTitleRow,children:[brand?(0,import_jsx_runtime15.jsx)(BrandChip,{badge:brand}):(0,import_jsx_runtime15.jsx)(import_react_native26.Icon,{name:"SquareTerminal",size:13,color:styles.copyText.color}),(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:t2("ui.command")})]}),exitCode!==null?(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:{height:16,paddingHorizontal:5,borderRadius:8,justifyContent:"center",borderWidth:1,borderColor:exitColor},children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:{color:exitColor,fontSize:10,fontWeight:"700",lineHeight:12},children:t2("ui.exitCode",{code:exitCode})})}):null,(0,import_jsx_runtime15.jsx)(CopyButton,{value:command,label:t2("ui.copyCommand"),theme,styles})]}),wrap?(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.frameBodyWrap,children:commandTokens?(0,import_jsx_runtime15.jsx)(TokenizedLines2,{lines:commandTokens,styles,wrapLines:!0}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:[styles.codeLine,{flexShrink:1}],children:`$ ${command}`})}):(0,import_jsx_runtime15.jsx)(import_react_native26.ScrollView,{horizontal:!0,nestedScrollEnabled:!0,style:styles.codeScroll,children:(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.frameBody,children:commandTokens?(0,import_jsx_runtime15.jsx)(TokenizedLines2,{lines:commandTokens,styles}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.codeLine,children:`$ ${command}`})})}),output?(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.termOutput,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.termOutputHeader,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:isError?{...styles.detailLabel,color:failedColor}:styles.detailLabel,children:t2(isError?"ui.errorOutput":"ui.output")}),(0,import_jsx_runtime15.jsx)(OutputCopyButtons,{clean,raw:output,label:t2("ui.copyOutput"),theme,styles})]}),wrap?(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.frameBodyWrap,children:outputTokens&&!isError?(0,import_jsx_runtime15.jsx)(TokenizedLines2,{lines:outputTokens,styles,wrapLines:!0}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:[isError?{...styles.codeLine,color:failedColor}:styles.codeLine,{flexShrink:1}],children:shownOutput||" "})}):(0,import_jsx_runtime15.jsx)(import_react_native26.ScrollView,{horizontal:!0,nestedScrollEnabled:!0,style:styles.codeScroll,children:(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.frameBody,children:outputTokens&&!isError?(0,import_jsx_runtime15.jsx)(TokenizedLines2,{lines:outputTokens,styles}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:isError?{...styles.codeLine,color:failedColor}:styles.codeLine,children:shownOutput||" "})})}),preview.truncated?(0,import_jsx_runtime15.jsx)(import_react_native27.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):t2("ui.expandAllLinesCharacters",{count:preview.totalLines,lines:preview.totalLines,characters:preview.totalChars.toLocaleString()})})}):null]}):null]})}var IMAGE_NOTES={get outside(){return t2("ui.theImageIsOutsideThe")},get"too-large"(){return t2("ui.theImageIsLargerThan")}};function ReadImageBlock({filePath,agentId,fallback,styles}){const loadImage=(0,import_client5.useRpc)(readImageRpc),[image,setImage]=(0,import_react15.useState)({status:"loading"}),[expanded,setExpanded]=(0,import_react15.useState)(!1);return(0,import_react15.useEffect)(()=>{let cancelled=!1;return setImage({status:"loading"}),setExpanded(!1),loadImage({filePath,agentId}).then(result=>{if(!cancelled)if(result.status==="ok"&&result.data&&result.mimeType)setImage({status:"ok",uri:`data:${result.mimeType};base64,${result.data}`});else{const note=IMAGE_NOTES[result.status];setImage(note?{status:"fallback",note}:{status:"fallback"})}},()=>{cancelled||setImage({status:"fallback"})}),()=>{cancelled=!0}},[agentId,filePath,loadImage]),image.status==="fallback"?image.note?(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:image.note}),fallback]}):(0,import_jsx_runtime15.jsx)(import_jsx_runtime15.Fragment,{children:fallback}):image.status==="loading"?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.loadingImage")}):(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:t2("ui.image")}),(0,import_jsx_runtime15.jsx)(import_react_native27.Pressable,{accessibilityLabel:t2(expanded?"ui.shrinkImage":"ui.enlargeImage"),accessibilityRole:"button",...aria({expanded}),onPress:()=>setExpanded(!expanded),children:(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.imageSurface,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Image,{source:{uri:image.uri},style:expanded?styles.imageExpanded:styles.imageThumbnail,resizeMode:"contain"})})})]})}function useThoughtTail(){const settings=(0,import_client5.useSettings)(activitySettings);return settings.status!=="ready"?{follow:!1,lines:20}:{follow:settings.values.thoughtTailFollow,lines:settings.values.thoughtTailLines}}function DiffBlock({detail,palette:palette2,styles}){const[showAll,setShowAll]=(0,import_react15.useState)(!1),wrap=useWrapLines("diff"),lines=(0,import_react15.useMemo)(()=>diffLinesForDetail(detail),[detail]),isTruncated=lines.length>PREVIEW_LINES,displayLines=showAll||!isTruncated?lines:lines.slice(0,PREVIEW_LINES);return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:t2("ui.changes")}),wrap?(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.diffSurface,children:displayLines.length===0?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.empty,children:t2("ui.noChangesToShow")}):displayLines.map((line,index)=>(0,import_jsx_runtime15.jsx)(DiffRow,{line,palette:palette2,styles,wrap:!0},`${line.kind}-${index}`))}):(0,import_jsx_runtime15.jsx)(import_react_native26.ScrollView,{horizontal:!0,nestedScrollEnabled:!0,style:styles.codeScroll,children:(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.diffSurface,children:displayLines.length===0?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.empty,children:t2("ui.noChangesToShow")}):displayLines.map((line,index)=>(0,import_jsx_runtime15.jsx)(DiffRow,{line,palette:palette2,styles},`${line.kind}-${index}`))})}),isTruncated?(0,import_jsx_runtime15.jsx)(import_react_native27.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):t2("ui.expandAllLines",{lines:lines.length})})}):null]})}function DiffRow({line,palette:palette2,styles,wrap=!1}){const rowStyle=line.kind==="add"?styles.diffAdded:line.kind==="remove"?styles.diffRemoved:line.kind==="meta"?styles.diffMeta:void 0,marker=line.kind==="add"?"+":line.kind==="remove"?"-":line.kind==="meta"?"":" ",markerColor=line.kind==="add"?palette2.statusColors.completed:line.kind==="remove"?palette2.statusColors.failed:line.kind==="meta"?palette2.categoryColors.search:palette2.categoryColors.unknown;return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:[styles.diffLine,rowStyle],children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:[styles.diffMarker,{color:markerColor}],children:marker}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:[styles.diffText,wrap?{flexShrink:1,minWidth:0}:null,{color:line.kind==="meta"?markerColor:styles.codeLine.color}],children:line.text||" "})]})}function PlainTextBlock({text,label,color,theme,styles}){const[showAll,setShowAll]=(0,import_react15.useState)(!1),clean=(0,import_react15.useMemo)(()=>stripAnsi(text),[text]),view=(0,import_react15.useMemo)(()=>outputView(text,clean,showAll,!1),[clean,showAll,text]);return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.codeHeader,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:label}),(0,import_jsx_runtime15.jsx)(OutputCopyButtons,{clean,raw:text,label:t2("ui.copy",{label}),theme,styles})]}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:color?{...styles.detailText,color}:styles.detailText,children:view.shown||" "}),view.preview.truncated?(0,import_jsx_runtime15.jsx)(import_react_native27.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):t2("ui.expandAllLinesCharacters",{count:view.preview.totalLines,lines:view.preview.totalLines,characters:view.preview.totalChars.toLocaleString()})})}):null]})}var NOTICE_STATE_LABEL={get done(){return t2("ui.completed")},get failed(){return t2("ui.failed")},get stopped(){return t2("ui.stopped")},get blocked(){return t2("ui.blocked")},get info(){return t2("ui.notice")}};function noticeUsageText(usage){if(!usage)return null;const parts=[usage.tokens!==null?t2("ui.tokens",{count:usage.tokens.toLocaleString()}):null,usage.toolUses!==null?t2("ui.toolCalls",{count:usage.toolUses}):null,usage.durationMs!==null?formatDuration(usage.durationMs):null].filter(Boolean);return parts.length>0?parts.join(t2("ui.metaSeparator")):null}function NoticeDetail({data,raw,theme,palette:palette2,styles}){const notice=data.notice,sections=(0,import_react15.useMemo)(()=>noticeSections(raw),[raw]),usage=noticeUsageText(sections.usage),fields=[[t2("ui.description"),notice.text,!1],[t2("ui.status"),NOTICE_STATE_LABEL[notice.state],!1,"status"],...usage?[[t2("ui.usage"),usage,!1]]:[],...notice.outputFile?[[t2("ui.outputFile"),notice.outputFile,!0]]:[],...notice.taskId?[[t2("ui.task"),notice.taskId,!0]]:[]],stateColor=notice.state==="failed"||notice.state==="blocked"?palette2.statusColors.failed:notice.state==="done"?palette2.statusColors.completed:void 0;return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[fields.map(([label,value,mono,id])=>(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:label}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:{...styles.detailText,...mono?{}:{fontFamily:void 0},...id==="status"&&stateColor?{color:stateColor,fontWeight:"600"}:{}},children:value})]},label)),sections.event?(0,import_jsx_runtime15.jsx)(PlainTextBlock,{text:sections.event,label:t2("ui.event"),theme,styles}):null,sections.result?(0,import_jsx_runtime15.jsx)(PlainTextBlock,{text:sections.result,label:notice.kind==="agent"?t2("ui.subagentConclusion"):t2("ui.result"),theme,styles}):null]})}function PiNoticeDetail({pi,theme,palette:palette2,styles}){const stateColor=pi.state==="failed"?palette2.statusColors.failed:pi.state==="done"?palette2.statusColors.completed:void 0;return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[pi.fields.map(field=>(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:field.label}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:{...styles.detailText,...field.mono?{}:{fontFamily:void 0},...field.id==="status"&&stateColor?{color:stateColor,fontWeight:"600"}:{}},children:field.value})]},field.label)),pi.body?(0,import_jsx_runtime15.jsx)(PlainTextBlock,{text:pi.body,label:pi.reader?t2("ui.originalText"):t2("ui.content"),theme,styles}):null,pi.cut?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.thisContentIsLongOnly",{count:PI_NOTICE_BODY_CHARS})}):null]})}function AskDetail({content,palette:palette2,styles}){const picked=new Set(content.answers.flatMap(answer=>answer.answer.split(/,\\s*/))),prose={...styles.detailText,fontFamily:void 0};return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[content.questions.map((question,index)=>(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:question.header?t2("ui.question3",{header:question.header}):content.questions.length>1?t2("ui.question2",{number:index+1}):t2("ui.question")}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:prose,children:question.question}),question.options.length>0?(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.paseoChips,children:question.options.map(option=>{const chosen=picked.has(option);return(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:chosen?[styles.paseoChip,{borderColor:palette2.statusColors.completed}]:styles.paseoChip,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:chosen?[styles.paseoChipText,{color:palette2.statusColors.completed,fontWeight:"700"}]:styles.paseoChipText,children:chosen?`\\u2713 ${option}`:option})},option)})}):null,question.multiSelect?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.selectAllThatApply")}):null]},`${index}-${question.question}`)),content.answers.length>0?(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:t2("ui.answer")}),content.answers.map((answer,index)=>(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:prose,children:answer.question&&content.questions.length>1?t2("ui.answerPair",{question:answer.question,answer:answer.answer}):answer.answer},`${index}-${answer.answer}`))]}):null]})}function PendingOutput({styles}){return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.pendingRow,children:[(0,import_jsx_runtime15.jsx)(import_react_native27.ActivityIndicator,{size:"small",color:styles.mutedText.color}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.waitingForOutput")})]})}function SearchDetail({detail,headerSummary,agentId,theme,styles}){const cwd=(0,import_client5.useAgent)(agentId,agent=>agent.cwd),parsed=(0,import_react15.useMemo)(()=>parseOpencodeSearchContent(detail.content),[detail.content]),displayPath=(0,import_react15.useCallback)(filePath=>cwd?relativeToRoot(filePath,cwd):filePath,[cwd]),{matchCount,fileCount}=resolveSearchCounts(detail,parsed),meta=[matchCount!==void 0?t2("ui.matches",{count:matchCount}):void 0,fileCount!==void 0?t2("ui.files",{count:fileCount}):void 0].filter(Boolean).join(t2("ui.metaSeparator"));return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[notInHeader(detail.query,headerSummary)?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.detailText,children:t2("ui.queryValue",{value:detail.query})}):null,meta?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:meta}):null,parsed&&parsed.files.length>0?parsed.files.map((file,fileIndex)=>{const display=file.filePath?displayPath(file.filePath):"";return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[file.filePath?(0,import_jsx_runtime15.jsx)(PathRow,{icon:fileIconForPath(file.filePath),path:display,styles}):null,file.matches.map((match,matchIndex)=>(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:{flexDirection:"row",gap:6,minWidth:0},children:[match.lineNumber!==void 0?(0,import_jsx_runtime15.jsxs)(import_react_native27.Text,{style:styles.searchLineNumber,children:[match.lineNumber,":"]}):null,(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:[styles.detailText,{flex:1}],children:match.text||" "})]},`${file.filePath}-${match.lineNumber??"line"}-${matchIndex}`))]},file.filePath||`matches-${fileIndex}`)}):(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[detail.filePaths?.map(filePath=>(0,import_jsx_runtime15.jsx)(PathRow,{icon:fileIconForPath(filePath),path:displayPath(filePath),styles},filePath)),detail.content&&matchCount!==0?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.content,language:"text",styles,theme}):null]}),detail.webResults?.map(result=>(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.detailText,children:result.title}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.mutedText,children:result.url})]},result.url)),detail.annotations?.map((annotation,index)=>(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.mutedText,children:annotation},`${annotation}-${index}`))]})}function DetailBody({data,agentId,theme,palette:palette2,styles,follow}){const detail=asToolCallDetail(data.detail),cwd=(0,import_client5.useAgent)(agentId,agent=>agent.cwd),shownPath=path=>cwd?relativeToRoot(path,cwd):path;if(data.notice)return(0,import_jsx_runtime15.jsx)(NoticeDetail,{data,raw:detail?.type==="plain_text"?detail.text:void 0,theme,palette:palette2,styles});if(data.pi)return(0,import_jsx_runtime15.jsx)(PiNoticeDetail,{pi:data.pi,theme,palette:palette2,styles});if(!detail)return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.empty,children:t2("ui.noToolDetails")});if(isAskTool(data.name)&&(detail.type==="unknown"||detail.type==="plain_text")){const content=askContent(detail);if(content.questions.length>0||content.answers.length>0)return(0,import_jsx_runtime15.jsx)(AskDetail,{content,palette:palette2,styles})}if(isSkillTool(data.name)){const skillName=skillNameForDetail(detail);return skillName?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.detailText,children:skillName}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.empty,children:t2("ui.noSkillDetails")})}switch(detail.type){case"shell":{const shell=detail;return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(TerminalBlock,{follow,command:detail.command,output:detail.output,errorOutput:data.errorText,exitCode:shellExitCode(detail,data.errorText),styles,theme,palette:palette2}),shell.truncated===!0?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.mutedText,children:shell.fullOutputPath?t2("ui.outputTruncatedFullOutputAt",{path:compactText2(shell.fullOutputPath,160)}):t2("ui.outputTruncated")}):null]})}case"read":return readErrorMessage(detail.content)&&data.errorText?(0,import_jsx_runtime15.jsx)(FileTitle,{path:shownPath(detail.filePath),styles}):shouldAttemptImageLoad(detail.filePath,detail.content)?(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(FileTitle,{path:shownPath(detail.filePath),styles}),(0,import_jsx_runtime15.jsx)(ReadImageBlock,{filePath:detail.filePath,agentId,styles,fallback:detail.content?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.content,language:data.presentation.language??"text",label:t2("ui.content"),styles,theme}):null})]}):detail.content?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.content,language:data.presentation.language??"text",chip:fileBadge(detail.filePath),title:shownPath(detail.filePath),lineStart:typeof detail.offset=="number"&&detail.offset>0?detail.offset:1,copyLabel:t2("ui.copyContent"),styles,theme}):(0,import_jsx_runtime15.jsx)(FileTitle,{path:shownPath(detail.filePath),styles});case"write":return detail.content?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.content,language:data.presentation.language??"text",chip:fileBadge(detail.filePath),title:shownPath(detail.filePath),lineStart:1,copyLabel:t2("ui.copyWrittenContent"),styles,theme}):(0,import_jsx_runtime15.jsx)(FileTitle,{path:shownPath(detail.filePath),styles});case"edit":return editDiffContentSize(detail)>MAX_DIFF_CHARS&&effectiveUnifiedDiff(detail)===void 0?(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(FileTitle,{path:shownPath(detail.filePath),styles}),detail.oldString?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.oldString,language:data.presentation.language??"text",label:t2("ui.before"),styles,theme}):null,detail.newString?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.newString,language:data.presentation.language??"text",label:t2("ui.after"),styles,theme}):null]}):(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(FileTitle,{path:shownPath(detail.filePath),styles}),(0,import_jsx_runtime15.jsx)(DiffBlock,{detail,palette:palette2,styles})]});case"search":return(0,import_jsx_runtime15.jsx)(SearchDetail,{detail,headerSummary:data.presentation.summary,agentId,theme,styles});case"fetch":return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[notInHeader(detail.url,data.presentation.summary)?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.detailText,children:detail.url}):null,detail.result?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.result,language:"text",label:t2("ui.result"),styles,theme}):null,detail.code!==void 0?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.httpStatus",{code:detail.code,status:detail.codeText??""})}):null]});case"worktree_setup":return(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.detailText,children:t2("ui.branchValue",{value:detail.branchName})}),(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.pathValue",{value:detail.worktreePath})}),detail.log?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.log,language:"ansi",label:t2("ui.setupLog"),styles,theme,follow}):null]});case"sub_agent":return piSubagentOperation(data.name)&&parsePiSubagentCall(void 0,detail.log).lifecycle?(0,import_jsx_runtime15.jsx)(PiSubagentToolDetail,{toolName:data.name,input:void 0,output:detail.log,agentType:detail.subAgentType,description:detail.description,childSessionId:detail.childSessionId,theme,palette:palette2,styles}):(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[notInHeader(detail.subAgentType,data.presentation.summary)?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.detailText,children:detail.subAgentType}):null,notInHeader(detail.description,data.presentation.summary)?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:detail.description}):null,detail.childSessionId?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.mutedText,children:t2("ui.sessionValue",{value:detail.childSessionId})}):null,detail.log&&!subAgentLogFullyShown(detail)?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:detail.log,language:"ansi",label:t2("ui.activityLog"),styles,theme,follow}):null]});case"plain_text":return detail.text?(0,import_jsx_runtime15.jsx)(PlainTextBlock,{text:detail.text,label:t2("ui.result"),theme,styles}):(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.empty,children:t2("ui.noTextReturned")});case"plan":return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.detailText,children:detail.text});case"unknown":{if(piSubagentOperation(data.name))return(0,import_jsx_runtime15.jsx)(PiSubagentToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(isOpencodeSubagentTool(data.name))return(0,import_jsx_runtime15.jsx)(OpencodeSubagentToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(isCodeModeTool(data.name)){const code=extractCodeModeCode(detail.input);if(code)return(0,import_jsx_runtime15.jsx)(CodeModeToolDetail,{code,output:detail.output,theme,styles})}if(data.name.trim().toLowerCase()==="ls"){const entries=parsePiLsOutput(detail.output);if(entries!==null)return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.section,children:[(0,import_jsx_runtime15.jsx)(DetailLabel,{style:styles.detailLabel,children:t2("ui.file")}),entries.length===0?(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.empty,children:t2("ui.noFilesReturned")}):entries.map(entry=>(0,import_jsx_runtime15.jsx)(PathRow,{icon:entry.endsWith("/")?"Folder":fileIconForPath(entry),path:entry,styles},entry))]})}if(isSubagentSupervisorTool(data.name))return(0,import_jsx_runtime15.jsx)(SupervisorToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(isBgWaitTool(data.name))return(0,import_jsx_runtime15.jsx)(BgWaitToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(isOmpWaitTool(data.name))return(0,import_jsx_runtime15.jsx)(OmpWaitToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(isOmpFindTool(data.name))return(0,import_jsx_runtime15.jsx)(OmpFindToolDetail,{input:detail.input,output:detail.output,styles});if(isTodoTool(data.name))return(0,import_jsx_runtime15.jsx)(TodoToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(githubToolKind(data.name))return(0,import_jsx_runtime15.jsx)(GithubToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});if(exaToolKind(data.name))return(0,import_jsx_runtime15.jsx)(ExaToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,styles});if(paseoToolLeafName(data.name))return(0,import_jsx_runtime15.jsx)(PaseoToolDetail,{toolName:data.name,input:detail.input,output:detail.output,theme,palette:palette2,styles});const codeInput=extractCodeInput(data.name,detail.input);return codeInput?(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:codeInput.code,language:codeInput.language,label:t2("ui.input"),styles,theme}),hasMeaningfulUnknownValue(detail.output)?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:formatUnknownValue(detail.output),language:"json",label:t2("ui.output"),styles,theme,follow}):data.status==="running"?(0,import_jsx_runtime15.jsx)(PendingOutput,{styles}):null]}):(0,import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment,{children:[hasMeaningfulUnknownValue(detail.input)?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:formatUnknownValue(detail.input),language:"json",label:t2("ui.input"),styles,theme}):null,hasMeaningfulUnknownValue(detail.output)?(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:formatUnknownValue(detail.output),language:"json",label:t2("ui.output"),styles,theme}):data.status==="running"?(0,import_jsx_runtime15.jsx)(PendingOutput,{styles}):null]})}}}function renderInlineReasoning(text,styles){return parseInlineMarkdown(text).map((part,index)=>{if(part.type==="text")return part.text;const style=part.type==="bold"?[styles.reasoningLine,{fontWeight:"700"}]:part.type==="italic"?[styles.reasoningLine,{fontStyle:"italic"}]:styles.reasoningInlineCode,escape=part.type==="code"?cmonoTextEscape:void 0;return(0,import_react16.createElement)(import_react_native27.Text,{...escape,key:`inline-${index}`,style},part.text)})}function InlineReasoning({text,styles,inRow=!1}){return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:inRow?[styles.reasoningLine,styles.reasoningBulletText]:styles.reasoningLine,children:renderInlineReasoning(text,styles)})}function ReasoningBlockList({blocks,keyPrefix,theme,styles}){return(0,import_jsx_runtime15.jsx)(import_jsx_runtime15.Fragment,{children:blocks.map((block,index)=>{const key=`${keyPrefix}-${block.type}-${index}`;switch(block.type){case"code":return(0,import_jsx_runtime15.jsx)(HighlightedCodeBlock,{code:block.text,language:block.language??"text",theme,styles},key);case"spacer":return(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.reasoningSpacer},key);case"heading":return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.reasoningHeading,children:renderInlineReasoning(block.text,styles)},key);case"unordered":return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.reasoningBulletRow,children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.reasoningBullet,children:"\\u2022"}),(0,import_jsx_runtime15.jsx)(InlineReasoning,{text:block.text,styles,inRow:!0})]},key);case"ordered":return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.reasoningBulletRow,children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.reasoningBullet,children:block.marker}),(0,import_jsx_runtime15.jsx)(InlineReasoning,{text:block.text,styles,inRow:!0})]},key);case"quote":return(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{selectable:!0,style:styles.reasoningQuote,children:renderInlineReasoning(block.text,styles)},key);case"paragraph":return(0,import_jsx_runtime15.jsx)(InlineReasoning,{text:block.text,styles},key)}})})}function ReasoningMarkdown({text,theme,styles}){const blocks=(0,import_react15.useMemo)(()=>parseReasoningMarkdown(text),[text]);return(0,import_jsx_runtime15.jsx)(import_react_native27.View,{...cuiViewEscape,style:styles.reasoningBody,children:(0,import_jsx_runtime15.jsx)(ReasoningBlockList,{blocks,keyPrefix:"reasoning",theme,styles})})}function ReasoningStep({index,text,active,last,theme,palette:palette2,styles}){const{title,body}=(0,import_react15.useMemo)(()=>splitStepTitle(text),[text]),blocks=(0,import_react15.useMemo)(()=>parseReasoningMarkdown(body),[body]),color=active?palette2.statusColors.running:palette2.statusColors.completed,dot=(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:[styles.stepDot,{borderColor:color,backgroundColor:active?"transparent":color}],children:active?null:(0,import_jsx_runtime15.jsx)(import_react_native26.Icon,{name:"Check",size:9,color:"#ffffff"})});return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.stepRow,children:[(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.stepRail,children:[active?(0,import_jsx_runtime15.jsx)(Breathe,{children:dot}):dot,last?null:(0,import_jsx_runtime15.jsx)(import_react_native27.View,{style:styles.stepLine})]}),(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{style:styles.stepContent,children:[(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.stepTitle,children:title?t2("ui.numberedStep",{number:index+1,title}):t2("ui.step",{number:index+1})}),blocks.length>0?(0,import_jsx_runtime15.jsx)(ReasoningBlockList,{blocks,keyPrefix:`step-${index}`,theme,styles}):null]})]})}function ReasoningText({text,phase,theme,palette:palette2,styles}){const[showAll,setShowAll]=(0,import_react15.useState)(!1),tail=useThoughtTail(),preview=(0,import_react15.useMemo)(()=>previewText(text),[text]),targetText=showAll||tail.follow?text:preview.text,revealedText=(0,import_react_native26.useRevealedText)(targetText,phase),allSteps=(0,import_react15.useMemo)(()=>splitReasoningSteps(revealedText),[revealedText]),windowed=tail.follow&&!showAll?allSteps.length>1?{kind:"steps",steps:allSteps.slice(Math.max(0,allSteps.length-tail.lines)),start:Math.max(0,allSteps.length-tail.lines)}:{kind:"block",block:tailLinesOf(revealedText,tail.lines)}:null,stepStart=windowed?.kind==="steps"?windowed.start:0,shownSteps=windowed?.kind==="steps"?windowed.steps:allSteps,blockText=windowed?.kind==="block"?windowed.block:revealedText,windowTruncated=tail.follow&&!showAll&&(allSteps.length>1?allSteps.length>tail.lines:revealedText.split(`\n`).length>tail.lines),showExpandButton=showAll||windowTruncated||!tail.follow&&preview.truncated,isStreaming=phase==="streaming",scrollRef=(0,import_react15.useRef)(null),isNearBottom=(0,import_react15.useRef)(!0),tailHead=shownSteps.length>1?shownSteps[shownSteps.length-1]:blockText,{onScroll:onTailScroll,onContentSizeChange:onTailContentSizeChange}=useFollowBottom(scrollRef,isNearBottom,tailHead,!0);return(0,import_jsx_runtime15.jsxs)(import_react_native27.View,{children:[(0,import_jsx_runtime15.jsx)(import_react_native26.ScrollView,{ref:scrollRef,nestedScrollEnabled:!0,onContentSizeChange:onTailContentSizeChange,onScroll:onTailScroll,scrollEventThrottle:16,showsVerticalScrollIndicator:!0,style:styles.detailsScroll,children:shownSteps.length<=1?(0,import_jsx_runtime15.jsx)(ReasoningMarkdown,{text:blockText,theme,styles}):(0,import_jsx_runtime15.jsx)(import_react_native27.View,{...cuiViewEscape,style:styles.stepList,children:shownSteps.map((step,index)=>(0,import_jsx_runtime15.jsx)(ReasoningStep,{index:stepStart+index,text:step,active:isStreaming&&stepStart+index===allSteps.length-1,last:stepStart+index===allSteps.length-1,theme,palette:palette2,styles},`step-${stepStart+index}`))})}),showExpandButton?(0,import_jsx_runtime15.jsx)(import_react_native27.Pressable,{accessibilityRole:"button",...aria({expanded:showAll}),onPress:()=>setShowAll(!showAll),style:styles.showMoreButton,children:(0,import_jsx_runtime15.jsx)(import_react_native27.Text,{style:styles.showMoreText,children:showAll?t2("ui.collapse"):t2("ui.expandAllLinesCharacters",{count:preview.totalLines,lines:preview.totalLines,characters:preview.totalChars.toLocaleString()})})}):null]})}var import_react17=require("react"),import_client6=require("@getpaseo/plugin/client"),import_ui=require("@getpaseo/plugin/client/ui"),import_plugin5=require("@getpaseo/plugin"),import_zod6=require("zod"),languageSettings=(0,import_plugin5.defineSettings)({id:LANGUAGE_SETTINGS_ID,scope:"host",version:1,schema:import_zod6.z.object({language:import_zod6.z.string().max(40).default("auto")})}),device2=import_zod6.z.string().max(80),language2=import_zod6.z.string().max(40),i18nLanguagesRpc=(0,import_plugin5.defineRpc)({name:"i18n.languages",input:import_zod6.z.object({device:device2}).strict(),output:import_zod6.z.object({setting:import_zod6.z.string(),resolved:language2,system:language2,device:import_zod6.z.string(),folder:import_zod6.z.string(),languages:import_zod6.z.array(import_zod6.z.object({code:language2,name:import_zod6.z.string(),builtIn:import_zod6.z.boolean(),custom:import_zod6.z.boolean(),file:import_zod6.z.string().optional(),coverage:import_zod6.z.number().min(0).max(1),issues:import_zod6.z.array(import_zod6.z.object({code:import_zod6.z.string(),id:import_zod6.z.string().optional(),detail:import_zod6.z.string().optional()}))}))})}),import_jsx_runtime16=require("react/jsx-runtime"),ISSUE_MESSAGES={notObject:"kitLanguage.issueNotObject",notSection:"kitLanguage.issueNotSection",unknownMessage:"kitLanguage.issueUnknownMessage",badShape:"kitLanguage.issueBadShape",tooLong:"kitLanguage.issueTooLong",badPlaceholder:"kitLanguage.issueBadPlaceholder",link:"kitLanguage.issueLink",open:"kitLanguage.issueOpen",notFile:"kitLanguage.issueNotFile",tooBig:"kitLanguage.issueTooBig",badJson:"kitLanguage.issueBadJson"},issueText=issue=>t(ISSUE_MESSAGES[issue.code]??"kitLanguage.issueBadShape",{id:issue.id??"",detail:issue.detail??""}),errorText=error=>error instanceof Error?error.message:String(error??"");function LanguageSettings(){useI18n();const settings=(0,import_client6.useSettings)(languageSettings),listLanguages=(0,import_client6.useRpc)(i18nLanguagesRpc),[listing,setListing]=(0,import_react17.useState)({status:"loading"}),[reads,setReads]=(0,import_react17.useState)(0),[saveError,setSaveError]=(0,import_react17.useState)(null);(0,import_react17.useEffect)(()=>{let live=!0;return listLanguages({device:deviceLanguage()}).then(data2=>{live&&setListing({status:"ready",data:data2})},error=>{live&&setListing({status:"error",error:errorText(error)})}),()=>{live=!1}},[reads]);const reread=()=>{setReads(value2=>value2+1),refreshText()},choose=language3=>__async(null,null,function*(){if(settings.status!=="ready")return;if(setSaveError(null),!(yield settings.save({...settings.values,language:language3},settings.revision))){setSaveError(t("kitLanguage.saveFailed",{error:settings.saveError??""}));return}reread()}),data=listing.status==="ready"?listing.data:null,value=settings.status==="ready"?settings.values.language:data?.setting??"auto",languages=data?.languages??[],options=[{value:"auto",label:t("kitLanguage.auto",{name:(code=>languages.find(language3=>language3.code===code)?.name??code)(data?.system??"")})},...languages.map(language3=>({value:language3.code,label:language3.builtIn?language3.custom?t("kitLanguage.customOverride",{name:language3.name}):language3.name:t("kitLanguage.custom",{name:language3.name,percent:Math.round(language3.coverage*100)})}))];options.some(option=>option.value===value)||options.push({value,label:value});const withIssues=languages.filter(language3=>language3.issues.length>0);return(0,import_jsx_runtime16.jsx)(import_ui.SettingsSection,{title:t("kitLanguage.title"),children:(0,import_jsx_runtime16.jsxs)(import_ui.SettingsCard,{children:[(0,import_jsx_runtime16.jsx)(import_ui.SettingsSelect,{label:t("kitLanguage.label"),hint:t("kitLanguage.hint"),value,options,onValueChange:next=>void choose(next),disabled:settings.status!=="ready"||settings.saving,error:saveError??(listing.status==="error"?t("kitLanguage.loadFailed",{error:listing.error}):null)}),withIssues.map(language3=>(0,import_jsx_runtime16.jsx)(import_ui.SettingsRow,{label:t("kitLanguage.issuesLabel",{file:language3.file??`${language3.code}.json`}),hint:language3.issues.map(issueText).join(`\n`)},language3.code)),(0,import_jsx_runtime16.jsx)(import_ui.SettingsRow,{label:t("kitLanguage.folderLabel"),hint:data?t("kitLanguage.folderHint",{folder:data.folder}):t("kitLanguage.loading")}),(0,import_jsx_runtime16.jsx)(import_ui.SettingsAction,{label:t("kitLanguage.rescanLabel"),actionLabel:t("kitLanguage.rescan"),onPress:reread})]})})}var import_client7=require("@getpaseo/plugin/client"),import_react_native28=require("@getpaseo/plugin/client/react-native"),import_react_native29=require("react-native"),import_plugin6=require("@getpaseo/plugin"),import_zod7=require("zod"),PIN_COLLAPSED_LINES=3,cursorSchema=import_zod7.z.object({epoch:import_zod7.z.string().min(1).max(200),seq:import_zod7.z.number().int().nonnegative()}),turnPromptRpc=(0,import_plugin6.defineRpc)({name:"turn-prompt",input:import_zod7.z.object({agentId:import_zod7.z.string().min(1).max(256),at:cursorSchema.nullable()}),output:import_zod7.z.object({status:import_zod7.z.enum(["ok","none","unavailable"]),text:import_zod7.z.string(),seq:import_zod7.z.number().int().nonnegative().nullable(),turnId:import_zod7.z.string().max(200).nullable(),truncated:import_zod7.z.boolean()})}),STREAM_ROW_GAP=16,cache2=new Map;function densityMetrics(density,compactLayout,native=compactLayout){const id=`${density}|${compactLayout?1:0}|${native?1:0}`,cached=cache2.get(id);if(cached)return cached;const metrics=computeMetrics(density,compactLayout,native);return cache2.set(id,metrics),metrics}function computeMetrics(density,compactLayout,native){const dense=density==="compact",marginTop=dense?-6:-3;return{dense,marginTop,marginBottom:dense?-6:-3,tailMarginTop:STREAM_ROW_GAP+marginTop,rowMinHeight:dense?compactLayout||native?30:24:compactLayout?32:30,rowPaddingVertical:dense?1:3,tile:dense?18:20,gap:compactLayout?dense?5:6:dense?7:8,lineHeight:dense?16:18,plainPaddingVertical:dense?0:2}}var MAX_DETAIL_HEIGHT=420;function buildActivityStyles(theme,palette2,metrics,type){return typeset({card:{marginHorizontal:0,marginTop:metrics.marginTop,marginBottom:metrics.marginBottom},cardTail:{marginTop:metrics.tailMarginTop},headerButton:{alignItems:"center",borderRadius:2,flexDirection:"row",gap:5,minWidth:0,outlineColor:"transparent",outlineStyle:"none",outlineWidth:0,overflow:"hidden",paddingHorizontal:5,paddingVertical:metrics.plainPaddingVertical},iconBadge:{alignItems:"center",height:16,justifyContent:"center",width:16},title:{color:theme.colors.foreground,flexShrink:0,fontFamily:"monospace",fontSize:12,fontWeight:"600",lineHeight:17,maxWidth:"50%"},summary:{color:theme.colors.foregroundMuted,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:12,lineHeight:17,minWidth:0},filePath:{alignItems:"center",flex:1,flexDirection:"row",minWidth:0},fileDir:{color:theme.colors.foregroundMuted,flexShrink:1,fontFamily:"monospace",fontSize:12,lineHeight:17},fileName:{color:theme.colors.foreground,flexShrink:0,fontFamily:"monospace",fontSize:12,fontWeight:"600",lineHeight:17,maxWidth:"100%"},status:{alignItems:"center",flexDirection:"row",marginLeft:2},stats:{alignItems:"center",flexDirection:"row",gap:3,marginLeft:2},additions:{color:palette2.statusColors.completed,fontFamily:"monospace",fontSize:10,lineHeight:15},deletions:{color:palette2.statusColors.failed,fontFamily:"monospace",fontSize:10,lineHeight:15},details:{backgroundColor:theme.colors.surface1,borderColor:theme.colors.border,borderRadius:10,borderWidth:1,flexShrink:1,marginBottom:2,marginLeft:2,marginTop:3,minWidth:0,overflow:"hidden"},detailsScroll:{maxHeight:MAX_DETAIL_HEIGHT},detailsContent:{gap:8,paddingHorizontal:8,paddingVertical:8},frame:{backgroundColor:theme.colors.surface0,borderColor:theme.colors.border,borderRadius:8,borderWidth:1,minWidth:0,overflow:"hidden"},frameHeader:{alignItems:"center",backgroundColor:theme.colors.surface1,borderBottomColor:theme.colors.border,borderBottomWidth:1,flexDirection:"row",gap:6,minHeight:26,paddingHorizontal:8,paddingVertical:3},frameTitleRow:{alignItems:"center",flexDirection:"row",flexGrow:1,flexShrink:1,gap:6,minWidth:0},frameTitle:{color:theme.colors.foreground,flexShrink:1,fontFamily:"monospace",fontSize:11,fontWeight:"600",lineHeight:16},frameBody:{flexDirection:"row",minWidth:"100%",paddingHorizontal:8,paddingVertical:6},frameBodyWrap:{minWidth:0,width:"100%",paddingHorizontal:8,paddingVertical:6},gutter:{alignItems:"flex-end",marginRight:10},gutterText:{color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:11,fontVariant:["tabular-nums"],lineHeight:16,opacity:.6},termOutput:{borderTopColor:theme.colors.border,borderTopWidth:1},termOutputHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between",paddingHorizontal:8,paddingTop:5},detailLabel:{color:theme.colors.foregroundMuted,fontSize:11,fontWeight:"600",lineHeight:15},detailText:{color:theme.colors.foreground,fontFamily:"monospace",fontSize:11,lineHeight:16},mutedText:{color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:11,lineHeight:16},searchLineNumber:{color:theme.colors.accent,fontFamily:"monospace",fontSize:11,lineHeight:16},pathRow:{alignItems:"center",flexDirection:"row",gap:5,minWidth:0},pathText:{color:theme.colors.foreground,flex:1,fontFamily:"monospace",fontSize:11,lineHeight:16},section:{gap:3},showMoreButton:{alignSelf:"flex-start",paddingHorizontal:6,paddingVertical:3,borderRadius:2,marginTop:3},showMoreText:{color:palette2.categoryColors.agent,fontSize:11,fontWeight:"600",lineHeight:15},codeHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between",minWidth:"100%"},copyButton:{alignItems:"center",borderRadius:2,flexDirection:"row",gap:3,paddingHorizontal:4,paddingVertical:2},copyText:{color:theme.colors.foregroundMuted,fontSize:11,lineHeight:15},todoList:{gap:2},todoRow:{alignItems:"center",flexDirection:"row",gap:5,minWidth:0},todoTitle:{color:theme.colors.foreground,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:11,lineHeight:16,minWidth:0},todoDone:{color:theme.colors.foregroundMuted,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:11,lineHeight:16,minWidth:0,textDecorationLine:"line-through"},imageSurface:{backgroundColor:theme.colors.surface0,borderColor:theme.colors.border,borderRadius:8,borderWidth:1,minWidth:"100%",overflow:"hidden"},imageThumbnail:{height:200,width:"100%"},imageExpanded:{height:480,width:"100%"},codeSurface:{backgroundColor:theme.colors.surface0,borderColor:theme.colors.border,borderRadius:8,borderWidth:1,minWidth:"100%",paddingHorizontal:6,paddingVertical:4},codeScroll:{maxWidth:"100%"},codeLine:{color:theme.colors.foreground,fontFamily:"monospace",fontSize:11,lineHeight:16,minHeight:16},diffSurface:{backgroundColor:theme.colors.surface0,borderColor:theme.colors.border,borderRadius:8,borderWidth:1,minWidth:"100%",overflow:"hidden",paddingVertical:2},diffLine:{flexDirection:"row",minHeight:16,paddingHorizontal:5},diffMarker:{fontFamily:"monospace",fontSize:11,lineHeight:16,width:12},diffText:{flexShrink:0,fontFamily:"monospace",fontSize:11,lineHeight:16},diffAdded:{backgroundColor:palette2.statusBackgrounds.completed},diffRemoved:{backgroundColor:palette2.statusBackgrounds.failed},diffMeta:{backgroundColor:palette2.categoryBackgrounds.search},reasoningBody:{gap:3,paddingHorizontal:7,paddingVertical:5},stepList:{paddingHorizontal:8,paddingTop:8,paddingBottom:2},stepHeader:{alignItems:"center",flexDirection:"row",gap:5},stepBody:{gap:3,marginLeft:16},stepRow:{flexDirection:"row",gap:8},stepRail:{alignItems:"center",width:14},stepDot:{alignItems:"center",borderRadius:7,borderWidth:1.5,height:14,justifyContent:"center",marginTop:1,width:14},stepLine:{backgroundColor:theme.colors.border,borderRadius:1,flexGrow:1,marginBottom:1,marginTop:2,width:2},stepContent:{flexGrow:1,flexShrink:1,gap:3,minWidth:0,paddingBottom:10},stepTitle:{color:theme.colors.foreground,fontSize:12,fontWeight:"700",lineHeight:16},reasoningLine:{color:theme.colors.foreground,fontFamily:"monospace",fontSize:12,lineHeight:17},reasoningHeading:{color:theme.colors.foreground,fontFamily:"monospace",fontSize:12,fontWeight:"600",lineHeight:17},reasoningBullet:{color:theme.colors.foregroundMuted,flexShrink:0,fontFamily:"monospace",fontSize:12,lineHeight:17,minWidth:14},reasoningBulletRow:{alignItems:"flex-start",flexDirection:"row",gap:4},reasoningBulletText:{flexGrow:1,flexShrink:1,minWidth:0},reasoningQuote:{borderLeftColor:theme.colors.border,borderLeftWidth:1,color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:12,lineHeight:17,paddingLeft:6},reasoningInlineCode:{backgroundColor:theme.colors.surface2,color:theme.colors.foreground,fontFamily:"monospace",fontSize:11,paddingHorizontal:2},reasoningSpacer:{height:2},subAgentProgress:{borderLeftColor:theme.colors.border,borderLeftWidth:1,gap:1,marginLeft:12,paddingBottom:2,paddingLeft:7,paddingTop:1},subAgentLine:{alignItems:"center",flexDirection:"row",gap:5,minWidth:0},subAgentLineIcon:{alignItems:"center",justifyContent:"center",width:14},subAgentLineLabel:{color:theme.colors.foreground,flexShrink:0,fontFamily:"monospace",fontSize:11,fontWeight:"600",lineHeight:16},subAgentLineSummary:{color:theme.colors.foregroundMuted,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:11,lineHeight:16,minWidth:0},subAgentMore:{color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:11,lineHeight:16,paddingLeft:19},subAgentAction:{alignItems:"center",flexDirection:"row",gap:5,minWidth:0,paddingLeft:19},subAgentActionIcon:{alignItems:"center",justifyContent:"center",width:14},subAgentActionLabel:{color:theme.colors.foreground,flexShrink:1,fontFamily:"monospace",fontSize:11,lineHeight:16,maxWidth:"60%"},subAgentActionSummary:{color:theme.colors.foregroundMuted,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:11,lineHeight:16,minWidth:0},childTimelineSection:{gap:2},childTimelineHeader:{alignItems:"center",flexDirection:"row",gap:5},childTimelineList:{borderLeftColor:theme.colors.border,borderLeftWidth:1,gap:1,marginLeft:7,paddingLeft:7},childTimelineItem:{alignItems:"center",flexDirection:"row",gap:5,minWidth:0,paddingVertical:1},childTimelineItemTitle:{color:theme.colors.foreground,flexShrink:1,fontFamily:"monospace",fontSize:11,fontWeight:"500",lineHeight:15,maxWidth:"60%"},childTimelineItemSummary:{color:theme.colors.foregroundMuted,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:10,lineHeight:14,minWidth:0},childTimelineItemMeta:{color:theme.colors.foregroundMuted,flexShrink:0,fontFamily:"monospace",fontSize:10,lineHeight:14},empty:{color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:11,lineHeight:16},pendingRow:{alignItems:"center",flexDirection:"row",gap:8,paddingVertical:4},paseoStack:{gap:6},paseoHero:{borderLeftColor:theme.colors.border,borderLeftWidth:2,paddingHorizontal:6,paddingVertical:2},paseoHeroRow:{alignItems:"center",flexDirection:"row",gap:6},paseoHeroIcon:{alignItems:"center",height:16,justifyContent:"center",width:16},paseoHeroTitle:{color:theme.colors.foreground,flexShrink:1,fontFamily:"monospace",fontSize:11,fontWeight:"600",lineHeight:16},paseoHeroSubtitle:{color:theme.colors.foregroundMuted,flexShrink:1,fontFamily:"monospace",fontSize:10,lineHeight:14},paseoRows:{gap:2},paseoRow:{alignItems:"flex-start",flexDirection:"row",gap:8,minWidth:0},paseoKey:{color:theme.colors.foregroundMuted,flexShrink:1,fontSize:11,lineHeight:15,maxWidth:"45%",minWidth:90},paseoValue:{color:theme.colors.foreground,flexGrow:1,flexShrink:1,fontFamily:"monospace",fontSize:11,lineHeight:15,minWidth:0},paseoPrompt:{backgroundColor:theme.colors.surface0,borderLeftColor:theme.colors.border,borderLeftWidth:1,color:theme.colors.foreground,fontFamily:"monospace",fontSize:11,lineHeight:16,paddingHorizontal:6,paddingVertical:4},paseoList:{gap:0},paseoListItem:{borderTopColor:theme.colors.border,borderTopWidth:1,gap:1,paddingHorizontal:5,paddingVertical:3},paseoListItemHeader:{alignItems:"center",flexDirection:"row",gap:7,minWidth:0},paseoListItemTitle:{color:theme.colors.foreground,flex:1,flexShrink:1,fontFamily:"monospace",fontSize:11,fontWeight:"500",lineHeight:15,minWidth:0},paseoListItemMeta:{color:theme.colors.foregroundMuted,flexShrink:1,fontFamily:"monospace",fontSize:10,lineHeight:14},paseoChips:{flexDirection:"row",flexWrap:"wrap",gap:5},paseoChip:{borderColor:theme.colors.border,borderRadius:2,borderWidth:1,paddingHorizontal:4,paddingVertical:1},paseoChipText:{color:theme.colors.foregroundMuted,fontSize:11,lineHeight:15},paseoStatus:{alignSelf:"flex-start"},paseoStatusText:{color:theme.colors.foreground,fontSize:11,fontWeight:"600",lineHeight:15}},type)}var import_jsx_runtime17=require("react/jsx-runtime"),SAMPLE_COMMAND=\'echo "$(git rev-parse --short HEAD)" && npm ci --omit=dev || true # smoke\',SAMPLE_HEREDOC_COMMAND="cat <<CFG && npm ci --omit=dev || true # demo",SAMPLE_QUESTION=()=>t2("settings.previewQuestion"),reasoningSample=()=>t2("settings.previewReasoning").split(`\n`);function Dot({color,size=12}){return(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:{width:size,height:size,borderRadius:size/2,backgroundColor:color}})}function Tile({theme,look,size}){const meta=looks[look],color=meta.hue==="gray"?theme.colors.foregroundMuted:hue(theme,meta.hue);return(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:{width:size,height:size,borderRadius:6,alignItems:"center",justifyContent:"center",backgroundColor:withAlpha(color.startsWith("#")?color:"#888888",isDarkTheme(theme)?.2:.13)},children:(0,import_jsx_runtime17.jsx)(import_react_native28.Icon,{name:meta.icon,size:Math.round(size*.62),color})})}function Pill({color,soft,text}){return(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:{height:18,paddingHorizontal:6,borderRadius:9,justifyContent:"center",backgroundColor:soft,flexShrink:0},children:(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:1,style:{color,fontSize:11,fontWeight:"700"},children:text})})}function shellSegments(command,theme){const lines=highlightCodeSync(command,"shell",vividSyntaxColors(theme)),line=lines&&emphasizeShellHead(lines)?.[0];return!line||line.length<=1?null:(0,import_jsx_runtime17.jsx)(import_jsx_runtime17.Fragment,{children:line.map((token,index)=>(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:shellTokenStyle(token),children:token.content},index))})}function shellTokenStyle(token){return!token.color&&!token.fontStyle?null:{...token.color?{color:token.color}:null,...token.fontStyle&&token.fontStyle&1?{fontStyle:"italic"}:null,...token.fontStyle&&token.fontStyle&2?{fontWeight:"700"}:null}}function RowText({style,children}){return(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:1,style,children})}function idleOpacity(values,opts={}){return values.strength==="full"||opts.expanded?null:STRENGTH_OPACITY[values.strength]}function card(children,opacity,styles){return(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:[styles.card,opacity!=null?{opacity}:null],children})}function ReasoningReplica({theme,styles,values,palette:palette2,metrics}){const mode=values.thoughtExpansion??"latest",expanded=mode==="always"||mode==="latest",opacity=values.strength==="full"||expanded?null:STRENGTH_OPACITY[values.strength],lines=reasoningSample(),body=values.tailFollow?lines.slice(Math.max(0,lines.length-(values.tailLines??20))).join(`\n`):lines.slice(0,20).join(`\n`),tag=values.tailFollow?`${t2("settings.previewWindow")} ${values.tailLines??20}`:t2("settings.previewHead20");return card((0,import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment,{children:[(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:styles.headerButton,children:[(0,import_jsx_runtime17.jsx)(Tile,{theme,look:"think",size:metrics.tile}),(0,import_jsx_runtime17.jsx)(RowText,{style:{...styles.title,color:hue(theme,"violet","text")},children:t2("modelLook.think")}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:11,marginLeft:"auto",flexShrink:0},children:expanded?tag:"\\u2026"})]}),expanded?(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:styles.details,children:(0,import_jsx_runtime17.jsx)(ReasoningMarkdown,{text:body,theme,styles})}):null]}),opacity,styles)}function ToolReplica({theme,styles,palette:palette2,values,metrics,look,label,command,commandNode,state,expanded,diff,errorLine,expandedBody,chip}){const running=state==="running",open=expanded===!0,opacity=running?null:idleOpacity(values,{expanded:open}),meta=looks[look],color=meta.hue==="gray"?theme.colors.foregroundMuted:hue(theme,meta.hue);return card((0,import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment,{children:[(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:styles.headerButton,children:[(0,import_jsx_runtime17.jsx)(Tile,{theme,look,size:metrics.tile}),(0,import_jsx_runtime17.jsx)(RowText,{style:{...styles.title,color},children:label}),commandNode?(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:1,style:styles.summary,children:commandNode}):(0,import_jsx_runtime17.jsx)(RowText,{style:styles.summary,children:command}),state==="failed"?(0,import_jsx_runtime17.jsx)(Pill,{color:hue(theme,"red","text"),soft:hue(theme,"red","soft"),text:t2("ui.failed2",{count:1})}):null,chip,(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:12,flexShrink:0},children:running?"\\u2026":"\\u203A"})]}),open&&errorLine?(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:styles.details,children:errorLine}):null,open&&diff?(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:styles.details,children:diff}):null,open&&expandedBody?(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:styles.details,children:expandedBody}):null]}),opacity,styles)}function FoldReplica({theme,styles,values,palette:palette2,metrics,failed,type,wrapOutput}){if(!values.fold)return null;const expanded=failed,opacity=values.strength==="full"||expanded?null:STRENGTH_OPACITY[values.strength],green=hue(theme,"green"),noteStyle=typesetStyle({color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:12,lineHeight:16},type),failedStyle=typesetStyle({color:hue(theme,"red","text"),fontFamily:"monospace",fontSize:11,lineHeight:16,fontWeight:"700",...wrapOutput?{flexShrink:1}:null},type);return card((0,import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment,{children:[(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:styles.headerButton,children:[(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:{width:metrics.tile,height:metrics.tile,borderRadius:6,alignItems:"center",justifyContent:"center",backgroundColor:withAlpha(green,isDarkTheme(theme)?.2:.13)},children:(0,import_jsx_runtime17.jsx)(import_react_native28.Icon,{name:"Check",size:Math.round(metrics.tile*.62),color:hue(theme,"green","text")})}),(0,import_jsx_runtime17.jsx)(RowText,{style:{...styles.title,color:theme.colors.foreground},children:t2("settings.previewFoldTitle")}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:1,style:{color:theme.colors.foregroundMuted,fontSize:12,lineHeight:16,flexShrink:1,minWidth:0},children:t2("settings.previewFoldCounts")}),(0,import_jsx_runtime17.jsx)(Pill,{color:hue(theme,"red","text"),soft:hue(theme,"red","soft"),text:t2("ui.failed2",{count:1})}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:12,fontVariant:["tabular-nums"],flexShrink:0},children:"38 s"}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:hue(theme,"green","text"),fontSize:12,flexShrink:0},children:"\\u2713"})]}),expanded?(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:styles.details,children:[(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:noteStyle,children:t2("settings.previewFoldAuto")}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:wrapOutput?void 0:1,style:failedStyle,children:"npm ci --omit=dev && npm run lint && npm test -- --watch=false && npm run build && pnpm -r --filter @app/web e2e --headed \\u2014 Exit code 1"})]}):null]}),opacity,styles)}function TokensReplica({theme,indent}){return(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:{flexDirection:"row",alignItems:"center",gap:5,paddingLeft:indent,paddingRight:6,paddingBottom:2,minWidth:0},children:[(0,import_jsx_runtime17.jsx)(Dot,{color:hue(theme,"amber"),size:10}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:1,style:{color:theme.colors.foregroundMuted,fontSize:11,lineHeight:15,flexShrink:1,minWidth:0},children:t2("settings.previewTokens")})]})}function PanelLabel({theme,children}){return(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:10,letterSpacing:.5},children:children.toUpperCase()})}function PreviewPanel({theme,paletteFor,actions,compact,native}){const settings=(0,import_client7.useSettings)(activitySettings),type=useTypography(),ready=settings.status==="ready",values=ready?settings.values:null,metrics=densityMetrics(values?.density??"compact",compact,native??!1);if(!ready||!values)return(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:{gap:6},children:[(0,import_jsx_runtime17.jsx)(PanelLabel,{theme,children:t2("settings.preview")}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:12},children:t2("settings.readingSettings")})]});if(values.takeover==="off")return(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:{gap:6},children:[(0,import_jsx_runtime17.jsx)(PanelLabel,{theme,children:t2("settings.preview")}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:12,lineHeight:17},children:t2("settings.previewTakeoverOff")})]});const palette2=paletteFor(theme,values.palette),styles=buildActivityStyles(theme,palette2,metrics,type);styles.card={...styles.card,marginTop:6,marginBottom:6};const failuresMode=values.expansion.shell==="failures",shellAlways=values.expansion.shell==="always",colored=values.commandColors==="always"||failuresMode&&values.commandColors==="expanded",wrapCode=values.wrapLines?.code??!1,wrapOutput=values.wrapLines?.output??!1,followShell=values.followOutput?.shell??!0,longCode="export function renderApp(root: HTMLElement) { mount(<Application theme={theme} routes={routes} store={store} middlewares={[logger, router]} />, root); } // app bootstrap entry point",longOutput="error: command failed after 3 retries \\u2014 ELIFECYCLE Command failed with exit code 1 in ./packages/vivid-activity (webpack compile step overflow) at runCommand (node:internal/cli/run.ts:214:5)",longSnapshot="page snapshot: heading vivid-activity \\xB7 button new workspace \\xB7 button settings \\xB7 textbox window size \\xB7 button reload \\xB7 link pull request 1 \\xB7 86 more nodes...",monoMuted={color:theme.colors.foregroundMuted,fontFamily:"monospace",fontSize:11,lineHeight:16},longLine=(text,wrap,extra)=>wrap?(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{selectable:!0,style:[monoMuted,{flexShrink:1},extra],children:text}):(0,import_jsx_runtime17.jsx)(import_react_native29.ScrollView,{horizontal:!0,nestedScrollEnabled:!0,style:styles.codeScroll,children:(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{selectable:!0,style:monoMuted,children:text})}),runningColored=values.commandColors==="always"||shellAlways||values.expansion.shell==="latest",shellCommandNode=colored?shellSegments(SAMPLE_COMMAND,theme):null,heredocCommandNode=colored?shellSegments(SAMPLE_HEREDOC_COMMAND,theme):null,runningShellNode=runningColored?shellSegments(SAMPLE_COMMAND,theme):null,failedErrorStyle=typesetStyle({color:hue(theme,"red","text"),fontFamily:"monospace",fontSize:11,lineHeight:16},type),indent=(compact?6:8)+metrics.tile+metrics.gap,toolValues={strength:values.strength},diffDetail={type:"edit",filePath:"/demo/src/app.ts",oldString:`const a = ${"lorem-ipsum-dolor.".repeat(16)}\nconst b = 1;`,newString:`const a = 1;\nconst b = 2;`};return(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{children:[values.pinPrompt?(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:[styles.section,{borderWidth:1,borderColor:theme.colors.border,borderRadius:8,paddingHorizontal:8,paddingVertical:6,backgroundColor:theme.colors.surface1,marginBottom:metrics.marginTop+4}],children:[(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:11,fontWeight:"600"},children:t2("settings.previewPinned")}),(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{numberOfLines:PIN_COLLAPSED_LINES,style:{color:theme.colors.foreground,fontSize:12,lineHeight:17,marginTop:2},children:SAMPLE_QUESTION()})]}):null,(0,import_jsx_runtime17.jsx)(ReasoningReplica,{theme,styles,values:{strength:values.strength,thoughtExpansion:values.expansion.thinking,tailFollow:values.thoughtTailFollow,tailLines:values.thoughtTailLines,fold:values.fold},palette:palette2,metrics}),values.takeover==="reasoning"?(0,import_jsx_runtime17.jsx)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:11},children:t2("settings.previewThinkingOnly")}):(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{children:[(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"read",label:t2("modelLook.read"),command:"/demo/src/app.ts",state:"completed",expanded:!0,expandedBody:longLine(longCode,wrapCode)}),(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"edit",label:t2("modelLook.edit"),command:"/demo/src/app.ts",state:"completed",expanded:!0,diff:(0,import_jsx_runtime17.jsx)(DiffBlock,{detail:diffDetail,palette:palette2,styles})}),(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"search",label:t2("modelLook.search"),command:"vivid preview coverage",state:"completed"}),(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"browser",label:t2("modelPaseo.navigateBrowser"),command:"https://app.paseo.sh/workspace",state:"completed",expanded:!0,expandedBody:longLine(longSnapshot,wrapCode)}),failuresMode?(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"shell",label:t2("modelLook.shell"),command:SAMPLE_COMMAND,commandNode:shellCommandNode,state:"failed",expanded:!0,errorLine:(0,import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment,{children:[(0,import_jsx_runtime17.jsxs)(import_react_native29.Text,{style:failedErrorStyle,children:[t2("ui.error"),": Exit code 1"]}),longLine(longOutput,wrapOutput,{color:hue(theme,"red","text")})]})}):(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"shell",label:t2("modelLook.shell"),command:SAMPLE_COMMAND,commandNode:shellCommandNode,state:"completed"}),(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"shell",label:t2("modelLook.shell"),command:SAMPLE_HEREDOC_COMMAND,commandNode:heredocCommandNode,state:"completed"}),(0,import_jsx_runtime17.jsx)(ToolReplica,{theme,styles,palette:palette2,values:toolValues,metrics,look:"shell",label:t2("modelLook.shell"),command:SAMPLE_COMMAND,commandNode:runningShellNode,state:"running",chip:followShell?(0,import_jsx_runtime17.jsx)(Pill,{color:hue(theme,"blue","text"),soft:hue(theme,"blue","soft"),text:t2("settings.previewFollow")}):null}),actions.LoaderMark?(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:{flexDirection:"row",alignItems:"center",gap:metrics.gap,minHeight:metrics.rowMinHeight,paddingLeft:5},children:[(()=>{const Mark=actions.LoaderMark;return Mark?(0,import_jsx_runtime17.jsx)(Mark,{kind:values.loader,size:16,color:palette2.statusColors.running}):null})(),(0,import_jsx_runtime17.jsxs)(import_react_native29.Text,{style:{color:theme.colors.foregroundMuted,fontSize:12},children:[t2("modelLook.shell")," \\xB7 ",SAMPLE_COMMAND]})]}):null,(()=>{const active=[{area:"shell",label:t2("settings.followShell"),on:values.followOutput?.shell??!0},{area:"logs",label:t2("settings.followLogs"),on:values.followOutput?.logs??!0},{area:"todo",label:t2("settings.followTodo"),on:values.followOutput?.todo??!0},{area:"browser",label:t2("settings.followBrowser"),on:values.followOutput?.browser??!0}].filter(domain=>domain.on);return active.length===0?null:(0,import_jsx_runtime17.jsxs)(import_react_native29.View,{style:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",gap:6,paddingLeft:indent,paddingRight:6,paddingTop:6},children:[(0,import_jsx_runtime17.jsxs)(import_react_native29.Text,{style:{color:hue(theme,"blue","text"),fontSize:11,fontWeight:"700"},children:[t2("settings.previewFollow"),":"]}),active.map(domain=>(0,import_jsx_runtime17.jsx)(Pill,{color:hue(theme,"blue","text"),soft:hue(theme,"blue","soft"),text:domain.label},domain.area))]})})(),(0,import_jsx_runtime17.jsx)(FoldReplica,{theme,styles,values:{strength:values.strength,fold:values.fold},palette:palette2,metrics,failed:failuresMode,type,wrapOutput:values.wrapLines?.output??!1}),(0,import_jsx_runtime17.jsx)(TokensReplica,{theme,indent}),(0,import_jsx_runtime17.jsx)(import_react_native29.View,{style:{flexDirection:"row",gap:6,flexWrap:"wrap",alignItems:"center",paddingLeft:indent,paddingTop:6},children:Object.entries(palette2.categoryColors).map(([category,color])=>(0,import_jsx_runtime17.jsx)(Dot,{color,size:12},category))})]})]})}var import_react18=require("react"),import_react_native31=require("react-native"),import_client8=require("@getpaseo/plugin/client"),import_ui2=require("@getpaseo/plugin/client/ui"),import_react_native30=require("react-native"),import_jsx_runtime18=require("react/jsx-runtime"),loaderLabels={get spinner(){return t2("settings.loaderSpinner")},get sparkle(){return t2("settings.loaderSparkle")},get orb(){return t2("settings.loaderOrb")},get snake(){return t2("settings.loaderSnake")},get matrix(){return t2("settings.loaderMatrix")}};function LoaderPreview({theme,value,disabled,onChange,Mark}){const color=statusColor2(theme,"running");return(0,import_jsx_runtime18.jsx)(import_react_native30.View,{style:{flexDirection:"row",flexWrap:"wrap",gap:8,paddingHorizontal:12,paddingVertical:10,maxWidth:"100%"},children:LOADER_KINDS.map(kind=>{const chosen=kind===value;return(0,import_jsx_runtime18.jsxs)(import_react_native30.Pressable,{accessibilityRole:"button",accessibilityLabel:loaderLabels[kind],...aria({pressed:chosen}),disabled,onPress:()=>onChange(kind),style:{flexDirection:"row",alignItems:"center",gap:6,height:28,paddingHorizontal:10,borderRadius:14,borderWidth:1,borderColor:chosen?color:theme.colors.border,backgroundColor:chosen?hue(theme,"blue","soft"):"transparent"},children:[kind!=="spinner"&&Mark?(0,import_jsx_runtime18.jsx)(Mark,{kind,size:16,color}):(0,import_jsx_runtime18.jsx)(Spinner,{size:16,color}),(0,import_jsx_runtime18.jsx)(import_react_native30.Text,{style:{color:chosen?hue(theme,"blue","text"):theme.colors.foreground,fontSize:12,fontWeight:chosen?"700":"500"},children:loaderLabels[kind]})]},kind)})})}var import_jsx_runtime19=require("react/jsx-runtime"),takeoverOptions=[{value:"all",get label(){return t2("settings.all")}},{value:"reasoning",get label(){return t2("settings.thinkingRowsOnly")}},{value:"off",get label(){return t2("settings.off")}}],takeoverDescriptions={get all(){return t2("settings.replaceThinkingAndToolCall")},get reasoning(){return t2("settings.redrawThinkingRowsOnlyPaseo")},get off(){return t2("settings.letPaseoDisplayAllRows")}},paletteOptions=[{value:"vivid",get label(){return t2("settings.vivid")}},{value:"theme",get label(){return t2("settings.followThemeColors")}},{value:"soft",get label(){return t2("settings.soft")}},{value:"high_contrast",get label(){return t2("settings.highContrast")}}],paletteDescriptions={get vivid(){return t2("settings.eachToolCategoryHasA")},get theme(){return t2("settings.theOriginalColorfulAgentActivity")},get soft(){return t2("settings.iconsAreMostlyNeutralOnly")},get high_contrast(){return t2("settings.thickerSeparatorsAndStrongerStatus")}},expansionOptions=[{value:"always",get label(){return t2("settings.alwaysExpand")}},{value:"latest",get label(){return t2("settings.expandLatestOnly")}},{value:"failures",get label(){return t2("settings.expandFailedRows")}},{value:"never",get label(){return t2("settings.collapsedByDefault")}}],expansionDescriptions={get always(){return t2("settings.expandEveryRowOldAnd")},get latest(){return t2("settings.expandOnlyTheLatestRow")},get failures(){return t2("settings.expandFailedRowsHint")},get never(){return t2("settings.startCollapsedEvenWhileRunning")}};function expansionDescription(target,mode){return target!=="todo"?expansionDescriptions[mode]:t2(mode==="always"?"settings.alwaysExpandTaskListTool":mode==="never"||mode==="failures"?"settings.startTaskListToolRows":"settings.expandOnlyTheLatestTask")}function TakeoverControls({settings,actions}){const scope=settings.values.takeover,changeScope=value=>{const parsed=takeoverScopeSchema.safeParse(value);if(!parsed.success||parsed.data===scope)return;const next=parsed.data;settings.save({...settings.values,takeover:next},settings.revision).then(saved=>{saved&&(actions.onFoldSettings({scope:next}),actions.onTakeover(next))})};return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.takeoverScope"),children:(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.takeover"),hint:takeoverDescriptions[scope],value:scope,options:takeoverOptions,disabled:settings.saving,onValueChange:changeScope}),scope==="all"?(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.tradeoffsOfReplacingToolRows"),hint:t2("settings.takeoverCosts")}):null,(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.alwaysDisplayedByPaseo"),hint:t2("settings.planCardsTaskRowsApproval")})]})})}var densityOptions=[{value:"compact",get label(){return t2("settings.compact")}},{value:"standard",get label(){return t2("settings.standard")}}],densityDescriptions={get compact(){return t2("settings.shorterRowsWith4Px")},get standard(){return t2("settings.theSameRowHeightAnd")}},strengthOptions=[{value:"dim",label:"30%"},{value:"faded",label:"45%"},{value:"soft",label:"65%"},{value:"full",label:"100%"}],strengthDescriptions={get dim(){return t2("settings.strengthDim")},get faded(){return t2("settings.strengthFaded")},get soft(){return t2("settings.strengthSoft")},get full(){return t2("settings.strengthFull")}};function foldScopeNote(scope){return scope==="reasoning"?t2("settings.onlyThinkingRowsAreTaken"):scope==="off"?t2("settings.takeoverIsOffFoldingAnd"):null}function SidebarControls({settings}){const changeSidebar=value=>{value!==settings.values.sidebar&&settings.save({...settings.values,sidebar:value},settings.revision)};return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.sidebarSection"),children:(0,import_jsx_runtime19.jsx)(import_ui2.SettingsCard,{children:(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:t2("settings.sidebarEntry"),hint:t2("settings.sidebarHint"),value:settings.values.sidebar,disabled:settings.saving,onValueChange:changeSidebar})})})}function FoldControls({settings,actions}){const fold=settings.values.fold,density=settings.values.density,note=foldScopeNote(settings.values.takeover),changeFold=value=>{value!==fold&&settings.save({...settings.values,fold:value},settings.revision).then(saved=>{saved&&actions.onFoldSettings({enabled:value})})},changeDensity=value=>{const parsed=densitySchema.safeParse(value);!parsed.success||parsed.data===density||settings.save({...settings.values,density:parsed.data},settings.revision)},strength=settings.values.strength,changeStrength=value=>{const parsed=strengthSchema.safeParse(value);!parsed.success||parsed.data===strength||settings.save({...settings.values,strength:parsed.data},settings.revision)},pinPrompt=settings.values.pinPrompt,changePin=value=>{value!==pinPrompt&&settings.save({...settings.values,pinPrompt:value},settings.revision)};return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.foldingSpacingAndPrompts"),children:(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:t2("settings.foldConsecutiveThinkingAndTool"),hint:t2("settings.foldHint"),value:fold,disabled:settings.saving,onValueChange:changeFold}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.rowDensity"),hint:densityDescriptions[density],value:density,options:densityOptions,disabled:settings.saving,onValueChange:changeDensity}),settings.values.takeover!=="off"?(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.strength"),hint:strengthDescriptions[strength],value:strength,options:strengthOptions,disabled:settings.saving,onValueChange:changeStrength}):null,(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:t2("settings.pinThisTurnSPrompt"),hint:t2("settings.pinHint"),value:pinPrompt,disabled:settings.saving,onValueChange:changePin}),note?(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.takeoverScope"),hint:note}):null]})})}function TimeControls({settings}){return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.timeSection"),children:(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:t2("settings.turnTimeLabel"),hint:t2("settings.turnTimeHint"),value:settings.values.turnTime,disabled:settings.saving,onValueChange:value=>{settings.save({...settings.values,turnTime:value},settings.revision)}}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:t2("settings.foldTimeLabel"),hint:t2("settings.foldTimeHint"),value:settings.values.foldTime,disabled:settings.saving,onValueChange:value=>{settings.save({...settings.values,foldTime:value},settings.revision)}})]})})}function ExpansionControls({settings}){const changeExpansion=target=>value=>{const parsed=expansionModeSchema.safeParse(value);if(!parsed.success)return;const mode=parsed.data;settings.save({...settings.values,expansion:{...DEFAULT_EXPANSION,...settings.values.expansion,[target]:mode}},settings.revision)};return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.expansion"),children:(0,import_jsx_runtime19.jsx)(import_ui2.SettingsCard,{children:visibleExpansionTargets(settings.values.takeover).map(target=>{const mode=settings.values.expansion?.[target.key]??target.default;return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:target.label,hint:expansionDescription(target.key,mode),value:mode,options:expansionOptions,disabled:settings.saving,onValueChange:changeExpansion(target.key)},target.key)})})})}function PaletteControls({settings,theme,actions}){const errorStyle=(0,import_react18.useMemo)(()=>({color:toneColor(theme,"danger"),fontSize:13,lineHeight:18}),[theme]),changePalette=value=>{const parsed=paletteModeSchema.safeParse(value);parsed.success&&settings.save({...settings.values,palette:parsed.data},settings.revision)},loader=settings.values.loader,changeLoader=value=>{const parsed=loaderSchema.safeParse(value);!parsed.success||parsed.data===loader||settings.save({...settings.values,loader:parsed.data},settings.revision)};return(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsSection,{title:t2("settings.colors"),children:[(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[settings.values.takeover==="off"?(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.takeoverIsOff"),hint:t2("settings.theseColorsAndExpansionSettings")}):null,(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.palette"),hint:paletteDescriptions[settings.values.palette],value:settings.values.palette,options:paletteOptions,disabled:settings.saving,onValueChange:changePalette}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.runningAnimation"),hint:t2("settings.loaderHint"),value:loader,options:LOADER_KINDS.map(kind=>({value:kind,label:loaderLabels[kind]})),disabled:settings.saving,onValueChange:changeLoader}),(0,import_jsx_runtime19.jsx)(LoaderPreview,{theme,value:loader,disabled:settings.saving,onChange:changeLoader,Mark:actions.LoaderMark})]}),settings.saveError?(0,import_jsx_runtime19.jsx)(import_react_native31.Text,{accessibilityRole:"alert",style:errorStyle,children:settings.saveError}):null]})}var textSizeLabels={small:()=>t2("settings.sizeSmall"),standard:()=>t2("settings.sizeStandard"),large:()=>t2("settings.sizeLarge"),larger:()=>t2("settings.sizeLarger")},lineSpacingLabels={compact:()=>t2("settings.compact"),standard:()=>t2("settings.standard"),relaxed:()=>t2("settings.relaxed")};function FontControls({settings,theme}){const saved=settings.values.monoFont,[draft,setDraft]=(0,import_react18.useState)(saved),[shown,setShown]=(0,import_react18.useState)(saved);shown!==saved&&(setShown(saved),setDraft(saved));const valid=monoFontStack(draft)!==null,type=useTypography(),preview=(0,import_react18.useMemo)(()=>typesetStyle({color:theme.colors.foreground,fontFamily:"monospace",fontSize:12,lineHeight:17},type),[theme.colors.foreground,type]),apply=()=>{const value=draft.trim();!valid||value===saved||settings.save({...settings.values,monoFont:value},settings.revision)},change=(key,options)=>value=>{!options.includes(value)||value===settings.values[key]||settings.save({...settings.values,[key]:value},settings.revision)};return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.codeFont"),children:(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[(0,import_jsx_runtime19.jsx)(import_ui2.SettingsInput,{label:t2("settings.fontFamily"),hint:t2("settings.fontFamilyHint"),error:valid?null:t2("settings.fontFamilyInvalid"),initialValue:saved,placeholder:\'"JetBrains Mono", monospace\',disabled:settings.saving,onChangeText:setDraft},saved),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsAction,{label:t2("settings.applyFont"),actionLabel:t2("settings.apply"),disabled:settings.saving||!valid||draft.trim()===saved,onPress:apply}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.textSize"),hint:t2("settings.textSizeHint"),value:settings.values.textSize,options:TEXT_SIZES.map(size=>({value:size,label:textSizeLabels[size]()})),disabled:settings.saving,onValueChange:change("textSize",TEXT_SIZES)}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.lineSpacing"),value:settings.values.lineSpacing,options:LINE_SPACINGS.map(spacing=>({value:spacing,label:lineSpacingLabels[spacing]()})),disabled:settings.saving,onValueChange:change("lineSpacing",LINE_SPACINGS)}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.codeFontPreview"),children:(0,import_jsx_runtime19.jsx)(import_react_native31.Text,{...cmonoTextEscape,style:preview,children:`src/app.ts  +12 \\u22123\n$ npm test -- --watch=false`})})]})})}function DiffControls({settings}){const changeCommandColors=value=>{const parsed=commandColorsSchema.safeParse(value);!parsed.success||parsed.data===settings.values.commandColors||settings.save({...settings.values,commandColors:parsed.data},settings.revision)};return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.codeAndDiffs"),children:(0,import_jsx_runtime19.jsx)(import_ui2.SettingsCard,{children:(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSelect,{label:t2("settings.commandColors"),hint:t2("settings.commandColorsHint"),value:settings.values.commandColors,options:[{value:"expanded",get label(){return t2("settings.whenOpen")}},{value:"always",get label(){return t2("settings.alwaysColored")}}],disabled:settings.saving,onValueChange:changeCommandColors})})})}function ScrollControls({settings}){const changeFollow=area=>value=>{value!==settings.values.followOutput[area]&&settings.save({...settings.values,followOutput:{...settings.values.followOutput,[area]:value}},settings.revision)},changeWrap=area=>value=>{value!==settings.values.wrapLines[area]&&settings.save({...settings.values,wrapLines:{...settings.values.wrapLines,[area]:value}},settings.revision)},followRows=[{area:"shell",label:t2("settings.followShell")},{area:"logs",label:t2("settings.followLogs")},{area:"todo",label:t2("settings.followTodo")},{area:"browser",label:t2("settings.followBrowser")}],wrapRows=[{area:"diff",label:t2("settings.wrapDiff")},{area:"code",label:t2("settings.wrapCode")},{area:"output",label:t2("settings.wrapOutput")}];return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.expandScrollSection"),children:(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.followGroup"),hint:t2("settings.followHint")}),followRows.map(row=>(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:row.label,value:settings.values.followOutput[row.area],disabled:settings.saving,onValueChange:changeFollow(row.area)},row.area)),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsRow,{label:t2("settings.wrapGroup"),hint:t2("settings.wrapHint")}),wrapRows.map(row=>(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:row.label,value:settings.values.wrapLines[row.area],disabled:settings.saving,onValueChange:changeWrap(row.area)},row.area))]})})}function ThoughtControls({settings}){const saved=settings.values.thoughtTailLines,[draft,setDraft]=(0,import_react18.useState)(String(saved)),[shown,setShown]=(0,import_react18.useState)(String(saved));shown!==String(saved)&&(setShown(String(saved)),setDraft(String(saved)));const parsed=/^\\d+$/.test(draft.trim())?Number.parseInt(draft.trim(),10):null,valid=parsed!==null&&parsed>=5&&parsed<=500;(0,import_react18.useEffect)(()=>{if(!valid||parsed===saved||settings.saving)return;const timer=setTimeout(()=>{settings.save({...settings.values,thoughtTailLines:parsed},settings.revision)},600);return()=>clearTimeout(timer)},[draft,parsed,saved,settings.saving,settings.revision,settings.values]);const changeFollow=value=>{value!==settings.values.thoughtTailFollow&&settings.save({...settings.values,thoughtTailFollow:value},settings.revision)},error=valid||!draft.trim()?null:t2("settings.tailLinesInvalid");return(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.thoughtRows"),children:(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsCard,{children:[(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSwitch,{label:t2("settings.tailFollow"),hint:t2("settings.tailFollowHint"),value:settings.values.thoughtTailFollow,disabled:settings.saving,onValueChange:changeFollow}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsInput,{label:t2("settings.tailLines"),hint:t2("settings.tailLinesHint"),error,initialValue:String(saved),disabled:settings.saving||!settings.values.thoughtTailFollow,onChangeText:setDraft},String(saved))]})})}function DisplaySettings({theme,actions,paletteFor,layout,scroll}){const settings=(0,import_client8.useSettings)(activitySettings),textStyle=(0,import_react18.useMemo)(()=>({color:theme.colors.foreground}),[theme.colors.foreground]),[paneWidth,setPaneWidth]=(0,import_react18.useState)(0),onPaneLayout=(0,import_react18.useCallback)(event=>setPaneWidth(event.nativeEvent.layout.width),[]);if(settings.status==="loading")return(0,import_jsx_runtime19.jsx)(import_react_native31.Text,{style:textStyle,children:t2("settings.readingSettings")});if(settings.status==="error")return(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsSection,{title:t2("settings.vividActivity"),children:[(0,import_jsx_runtime19.jsx)(import_react_native31.Text,{style:textStyle,children:settings.error}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsAction,{label:t2("ui.settings"),actionLabel:t2("ui.readAgain"),onPress:settings.reload})]});if(settings.status==="invalid")return(0,import_jsx_runtime19.jsxs)(import_ui2.SettingsSection,{title:t2("settings.vividActivity"),children:[(0,import_jsx_runtime19.jsx)(import_react_native31.Text,{style:textStyle,children:settings.error}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsAction,{label:t2("settings.savedSettings"),actionLabel:t2("settings.restoreDefaults"),onPress:settings.reset}),(0,import_jsx_runtime19.jsx)(import_ui2.SettingsAction,{label:t2("settings.savedSettings"),actionLabel:t2("ui.readAgain"),onPress:settings.reload})]});const compact=layout?.compact??!1,split=!compact&&paneWidth>=860,controls=(0,import_jsx_runtime19.jsxs)(import_jsx_runtime19.Fragment,{children:[(0,import_jsx_runtime19.jsx)(TakeoverControls,{settings,actions}),(0,import_jsx_runtime19.jsx)(SidebarControls,{settings}),(0,import_jsx_runtime19.jsx)(FoldControls,{settings,actions}),(0,import_jsx_runtime19.jsx)(TimeControls,{settings}),(0,import_jsx_runtime19.jsx)(ThoughtControls,{settings}),(0,import_jsx_runtime19.jsx)(ScrollControls,{settings}),(0,import_jsx_runtime19.jsx)(PaletteControls,{settings,theme,actions}),(0,import_jsx_runtime19.jsx)(FontControls,{settings,theme}),(0,import_jsx_runtime19.jsx)(DiffControls,{settings}),(0,import_jsx_runtime19.jsx)(ExpansionControls,{settings})]}),preview=theme?(0,import_jsx_runtime19.jsx)(PreviewPanel,{theme,paletteFor,actions,compact,native:layout?.platform!=="web"}):null,previewSection=(0,import_jsx_runtime19.jsx)(import_ui2.SettingsSection,{title:t2("settings.preview"),children:(0,import_jsx_runtime19.jsx)(import_ui2.SettingsCard,{children:preview})});if(split){const pane=(children,key)=>scroll?(0,import_jsx_runtime19.jsx)(import_react_native31.ScrollView,{style:{flex:1,minHeight:0},contentContainerStyle:{paddingBottom:24},children},key):(0,import_jsx_runtime19.jsx)(import_react_native31.View,{style:{flex:1,minWidth:0},children},key);return(0,import_jsx_runtime19.jsxs)(import_react_native31.View,{style:{flex:1,flexDirection:"row",gap:16},onLayout:onPaneLayout,children:[pane((0,import_jsx_runtime19.jsxs)(import_jsx_runtime19.Fragment,{children:[(0,import_jsx_runtime19.jsx)(LanguageSettings,{}),controls]}),"controls"),pane(previewSection,"preview")]})}const stacked=(0,import_jsx_runtime19.jsxs)(import_jsx_runtime19.Fragment,{children:[controls,previewSection]});return scroll?(0,import_jsx_runtime19.jsxs)(import_react_native31.ScrollView,{style:{flex:1,minHeight:0},onLayout:onPaneLayout,contentContainerStyle:{paddingBottom:24},children:[(0,import_jsx_runtime19.jsx)(LanguageSettings,{}),stacked]}):(0,import_jsx_runtime19.jsxs)(import_react_native31.View,{onLayout:onPaneLayout,children:[(0,import_jsx_runtime19.jsx)(LanguageSettings,{}),stacked]})}function ActivitySettings(props){return(0,import_jsx_runtime19.jsx)(import_jsx_runtime19.Fragment,{children:(0,import_jsx_runtime19.jsx)(DisplaySettings,{...props,scroll:props.scroll??!1})})}function chunk(){return{api:1,createSurfaces(_client,extras){return followText(extras?.text),{detail:DetailBody,reasoning:ReasoningText,settings:ActivitySettings}}}}\n\nreturn module.exports;\n})';

// resources/third-party/default-features/vivid-activity/server/ui-chunk.ts
var getUiChunk = createClientChunkHandler([{ ...UI_CHUNK, code: ui_chunk_default }, { ...PI_CHUNK, code: pi_chunk_default }, { ...FX_CHUNK, code: fx_chunk_default }]);

// resources/third-party/default-features/vivid-activity/shared/client-chunk.ts
var import_plugin3 = require("@getpaseo/plugin");
var import_zod3 = require("zod");
function createClientChunkRpc(name, names) {
  const chunkName = import_zod3.z.enum(names);
  const hash2 = import_zod3.z.string().regex(/^[0-9a-f]{16}$/);
  return (0, import_plugin3.defineRpc)({
    name,
    input: import_zod3.z.object({ name: chunkName, hash: hash2, part: import_zod3.z.number().int().min(0).max(4095) }).strict(),
    output: import_zod3.z.object({ name: chunkName, hash: hash2, api: import_zod3.z.number().int().positive(), part: import_zod3.z.number().int().nonnegative(), parts: import_zod3.z.number().int().positive().max(4096), code: import_zod3.z.string() })
  });
}

// resources/third-party/default-features/vivid-activity/shared/ui-chunk.ts
var getClientChunk = createClientChunkRpc("vivid.client-chunk.get", ["ui", "pi", "fx"]);

// resources/third-party/default-features/vivid-activity/shared/text.ts
var t2 = (id, params) => t(id, params);

// resources/third-party/default-features/vivid-activity/shared/child-agent.ts
var MAX_CHILD_TIMELINE_ENTRIES = 8;
var CHILD_TIMELINE_PAGE_SIZE = MAX_CHILD_TIMELINE_ENTRIES;
function recentChildTimelineEntries(entries) {
  return [...entries].sort((left, right) => left.seqStart - right.seqStart).slice(-MAX_CHILD_TIMELINE_ENTRIES);
}
var LOADED_STATUSES = /* @__PURE__ */ new Set(["initializing", "idle", "running", "error"]);
function childLoaded(agent) {
  return !!agent && Object.prototype.hasOwnProperty.call(agent, "activeTurn");
}
function childReadable(status) {
  return !!status && LOADED_STATUSES.has(status);
}

// resources/third-party/paseo-runtime/protocol/tool-name-normalization.ts
function normalizeToolName(name) {
  return name.trim().toLowerCase();
}
function getPaseoToolLeafName(name) {
  const normalized = normalizeToolName(name);
  if (normalized.includes("__")) {
    const segments = normalized.split("__").filter((s) => s.length > 0);
    if (segments.length >= 3 && segments[0] === "mcp" && (segments[1] === "paseo" || segments[1].startsWith("paseo_"))) {
      return segments.slice(2).join("__");
    }
    return null;
  }
  if (normalized.includes(".")) {
    const firstSegment = normalized.split(".")[0];
    if (firstSegment === "paseo" || firstSegment.startsWith("paseo_")) {
      return normalized.split(".").slice(1).join(".");
    }
    return null;
  }
  return null;
}

// resources/third-party/default-features/vivid-activity/shared/read-image.ts
var import_plugin4 = require("@getpaseo/plugin");
var import_zod4 = require("zod");
var MAX_READ_IMAGE_BYTES = 3 * 1024 * 1024;
var IMAGE_HEADER_BYTES = 32;
var readImageRpc = (0, import_plugin4.defineRpc)({
  name: "read-image",
  input: import_zod4.z.object({
    filePath: import_zod4.z.string().min(1).max(4096),
    // 0.4.1: required. The Agent whose chat shows the read: its working directory bounds the preview.
    agentId: import_zod4.z.string().min(1).max(256)
  }),
  output: import_zod4.z.object({
    // 本地补丁：outside = 不在 Agent 工作目录、Paseo 工作树或临时目录内，不读取。
    status: import_zod4.z.enum(["ok", "not-found", "not-image", "too-large", "unavailable", "outside"]),
    data: import_zod4.z.string().optional(),
    mimeType: import_zod4.z.string().optional(),
    byteSize: import_zod4.z.number().int().nonnegative().optional()
  })
});
var BMP_DIB_HEADER_SIZES = /* @__PURE__ */ new Set([12, 16, 40, 52, 56, 64, 108, 124]);
function isBmp(bytes, fileLength) {
  if (bytes.length < 18 || fileLength < 26 || bytes[0] !== 66 || bytes[1] !== 77) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const declaredSize = view.getUint32(2, true);
  const pixelOffset = view.getUint32(10, true);
  const dibSize = view.getUint32(14, true);
  return BMP_DIB_HEADER_SIZES.has(dibSize) && declaredSize === fileLength && pixelOffset >= 14 + dibSize && pixelOffset <= fileLength;
}
function detectImageMimeType(bytes, fileLength = bytes.length) {
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 56 && (bytes[4] === 55 || bytes[4] === 57) && bytes[5] === 97) {
    return "image/gif";
  }
  if (bytes.length >= 12 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) {
    return "image/webp";
  }
  if (isBmp(bytes, fileLength)) {
    return "image/bmp";
  }
  return null;
}

// resources/third-party/default-features/vivid-activity/shared/vivid-model.ts
function textProperty(id) {
  return { enumerable: true, get: () => t2(id) };
}
function translatedTable(ids) {
  const result = {};
  for (const name of Object.keys(ids)) Object.defineProperty(result, name, textProperty(ids[name]));
  return result;
}
var looks = {
  think: { get label() {
    return t2("modelLook.think");
  }, icon: "Brain", hue: "violet" },
  read: { get label() {
    return t2("modelLook.read");
  }, icon: "FileText", hue: "blue" },
  list: { get label() {
    return t2("modelLook.list");
  }, icon: "FolderOpen", hue: "blue" },
  edit: { get label() {
    return t2("modelLook.edit");
  }, icon: "FilePen", hue: "green" },
  write: { get label() {
    return t2("modelLook.write");
  }, icon: "FilePlus", hue: "green" },
  shell: { get label() {
    return t2("modelLook.shell");
  }, icon: "SquareTerminal", hue: "orange" },
  search: { get label() {
    return t2("modelLook.search");
  }, icon: "Search", hue: "indigo" },
  web: { get label() {
    return t2("modelLook.web");
  }, icon: "Globe", hue: "cyan" },
  // 0.11.0:Paseo 内置浏览器工具（导航/点击/输入/快照……）独立类目；与网页同青色系，计数与色带分开。
  browser: { get label() {
    return t2("modelLook.browser");
  }, icon: "AppWindow", hue: "cyan" },
  agent: { get label() {
    return t2("modelLook.agent");
  }, icon: "Bot", hue: "fuchsia" },
  plan: { get label() {
    return t2("modelLook.plan");
  }, icon: "ListChecks", hue: "teal" },
  ask: { get label() {
    return t2("modelLook.ask");
  }, icon: "MessageCircleQuestionMark", hue: "amber" },
  mcp: { get label() {
    return t2("modelLook.mcp");
  }, icon: "Plug", hue: "pink" },
  paseo: { get label() {
    return t2("modelLook.paseo");
  }, icon: "Workflow", hue: "sky" },
  skill: { get label() {
    return t2("modelLook.skill");
  }, icon: "Sparkles", hue: "lime" },
  other: { get label() {
    return t2("modelLook.other");
  }, icon: "Puzzle", hue: "gray" }
};
var VIVID_CATEGORY_HUES = {
  reasoning: looks.think.hue,
  shell: looks.shell.hue,
  file: looks.read.hue,
  search: looks.search.hue,
  agent: looks.agent.hue,
  plan: looks.plan.hue,
  communication: looks.mcp.hue,
  unknown: null
};
var COUNT_LABELS = translatedTable({
  think: "modelCount.think",
  read: "modelCount.read",
  list: "modelCount.list",
  edit: "modelCount.edit",
  write: "modelCount.write",
  shell: "modelCount.shell",
  search: "modelCount.search",
  web: "modelCount.web",
  agent: "modelCount.agent",
  plan: "modelCount.plan",
  ask: "modelCount.ask",
  mcp: "modelCount.mcp",
  paseo: "modelCount.paseo",
  skill: "modelCount.skill",
  browser: "modelCount.browser",
  other: "modelCount.other"
});
var PASEO_TOOL_ZH = translatedTable({
  "Speak": "modelPaseo.speak",
  "Create Workspace": "modelPaseo.createWorkspace",
  "List Workspaces": "modelPaseo.listWorkspaces",
  "Archive Workspace": "modelPaseo.archiveWorkspace",
  "Rename Workspace": "modelPaseo.renameWorkspace",
  "Create Agent": "modelPaseo.createAgent",
  "Send Agent Prompt": "modelPaseo.sendAgentPrompt",
  "Get Agent Status": "modelPaseo.getAgentStatus",
  "Get Agent Activity": "modelPaseo.getAgentActivity",
  "List Agents": "modelPaseo.listAgents",
  "Cancel Agent Run": "modelPaseo.cancelAgentRun",
  "Archive Agent": "modelPaseo.archiveAgent",
  "Kill Agent": "modelPaseo.killAgent",
  "Update Agent": "modelPaseo.updateAgent",
  "Set Agent Session Mode": "modelPaseo.setAgentSessionMode",
  "List Pending Permissions": "modelPaseo.listPendingPermissions",
  "Respond to Permission": "modelPaseo.respondToPermission",
  "List Workspace Scripts": "modelPaseo.listWorkspaceScripts",
  "Start Workspace Script": "modelPaseo.startWorkspaceScript",
  "Stop Workspace Script": "modelPaseo.stopWorkspaceScript",
  "List Terminals": "modelPaseo.listTerminals",
  "Create Terminal": "modelPaseo.createTerminal",
  "Kill Terminal": "modelPaseo.killTerminal",
  "Capture Terminal": "modelPaseo.captureTerminal",
  "Send Terminal Keys": "modelPaseo.sendTerminalKeys",
  "Create Schedule": "modelPaseo.createSchedule",
  "Create Heartbeat": "modelPaseo.createHeartbeat",
  "Delete Heartbeat": "modelPaseo.deleteHeartbeat",
  "List Schedules": "modelPaseo.listSchedules",
  "Inspect Schedule": "modelPaseo.inspectSchedule",
  "Pause Schedule": "modelPaseo.pauseSchedule",
  "Resume Schedule": "modelPaseo.resumeSchedule",
  "Delete Schedule": "modelPaseo.deleteSchedule",
  "Update Schedule": "modelPaseo.updateSchedule",
  "Schedule Logs": "modelPaseo.scheduleLogs",
  "Run Schedule Once": "modelPaseo.runScheduleOnce",
  "List Providers": "modelPaseo.listProviders",
  "List Models": "modelPaseo.listModels",
  "List Agent Profiles": "modelPaseo.listAgentProfiles",
  "Inspect Provider": "modelPaseo.inspectProvider",
  "List Browser Tabs": "modelPaseo.listBrowserTabs",
  "Browser List Tabs": "modelPaseo.listBrowserTabs",
  "Browser New Tab": "modelPaseo.createBrowserTab",
  "Browser Close Tab": "modelPaseo.closeBrowserTab",
  "Browser Snapshot": "modelPaseo.snapshotBrowserPage",
  "Browser Snapshot Page": "modelPaseo.snapshotBrowserPage",
  "Browser Click": "modelPaseo.clickBrowserElement",
  "Browser Click Element": "modelPaseo.clickBrowserElement",
  "Browser Fill": "modelPaseo.fillBrowserElement",
  "Browser Fill Element": "modelPaseo.fillBrowserElement",
  "Browser Hover": "modelPaseo.hoverBrowserElement",
  "Browser Hover Element": "modelPaseo.hoverBrowserElement",
  "Browser Drag": "modelPaseo.dragBrowserElement",
  "Browser Drag Element": "modelPaseo.dragBrowserElement",
  "Browser Select": "modelPaseo.selectBrowserOption",
  "Browser Select Option": "modelPaseo.selectBrowserOption",
  "Browser Wait": "modelPaseo.waitForBrowserCondition",
  "Browser Wait for Condition": "modelPaseo.waitForBrowserCondition",
  "Browser Type": "modelPaseo.typeIntoBrowser",
  "Browser Type into Element": "modelPaseo.typeIntoBrowser",
  "Browser Press Key": "modelPaseo.pressBrowserKey",
  "Browser Press": "modelPaseo.pressBrowserKey",
  "Browser Navigate": "modelPaseo.navigateBrowser",
  "Browser Scroll": "modelPaseo.scrollBrowser",
  "Browser Scroll Page": "modelPaseo.scrollBrowser",
  "Browser Resize": "modelPaseo.resizeBrowserViewport",
  "Browser Resize Viewport": "modelPaseo.resizeBrowserViewport",
  "Browser Screenshot": "modelPaseo.captureBrowserScreenshot",
  "Browser Capture Screenshot": "modelPaseo.captureBrowserScreenshot",
  "Browser Upload": "modelPaseo.uploadFilesInBrowser",
  "Browser Upload Files": "modelPaseo.uploadFilesInBrowser",
  "Browser Logs": "modelPaseo.readBrowserLogs",
  "Browser Read Logs": "modelPaseo.readBrowserLogs",
  "Browser Console": "modelPaseo.readBrowserLogs",
  "Browser Evaluate": "modelPaseo.evaluateBrowserJavascript",
  "Browser Evaluate JavaScript": "modelPaseo.evaluateBrowserJavascript",
  "Browser Key Press": "modelPaseo.pressBrowserKey",
  "Create Browser Tab": "modelPaseo.createBrowserTab",
  "Close Browser Tab": "modelPaseo.closeBrowserTab",
  "Snapshot Browser Page": "modelPaseo.snapshotBrowserPage",
  "Click Browser Element": "modelPaseo.clickBrowserElement",
  "Fill Browser Element": "modelPaseo.fillBrowserElement",
  "Hover Browser Element": "modelPaseo.hoverBrowserElement",
  "Drag Browser Element": "modelPaseo.dragBrowserElement",
  "Select Browser Option": "modelPaseo.selectBrowserOption",
  "Wait for Browser Condition": "modelPaseo.waitForBrowserCondition",
  "Type into Browser": "modelPaseo.typeIntoBrowser",
  "Press Browser Key": "modelPaseo.pressBrowserKey",
  "Navigate Browser": "modelPaseo.navigateBrowser",
  "Browser Back": "modelPaseo.browserBack",
  "Browser Forward": "modelPaseo.browserForward",
  "Browser Reload": "modelPaseo.browserReload",
  "Capture Browser Screenshot": "modelPaseo.captureBrowserScreenshot",
  "Upload Files in Browser": "modelPaseo.uploadFilesInBrowser",
  "Read Browser Logs": "modelPaseo.readBrowserLogs",
  "Evaluate Browser JavaScript": "modelPaseo.evaluateBrowserJavascript",
  "Scroll Browser": "modelPaseo.scrollBrowser",
  "Resize Browser Viewport": "modelPaseo.resizeBrowserViewport"
});
var LABELS = translatedTable({
  "Read": "modelLabel.read",
  "List": "modelLabel.list",
  "List Directory": "modelLabel.listDirectory",
  "Edit": "modelLabel.edit",
  "Add": "modelLabel.add",
  "Delete": "modelLabel.delete",
  "Write": "modelLabel.write",
  "Shell": "modelLabel.shell",
  "Search": "modelLabel.search",
  "Find": "modelLabel.find",
  "Fetch URL": "modelLabel.fetchUrl",
  "Agent Task": "modelLabel.agentTask",
  "Plan": "modelLabel.plan",
  "Thinking": "modelLabel.thinking",
  "Skill": "modelLabel.skill",
  "Tasks": "modelLabel.tasks",
  "Ask Question": "modelLabel.askQuestion",
  "Background Task": "modelLabel.backgroundTask",
  "Speak": "modelLabel.speak",
  "Worktree Setup": "modelLabel.worktreeSetup",
  "Tool": "modelLabel.tool",
  "Search Tools": "modelLabel.searchTools",
  "Code Mode": "modelLabel.codeMode",
  "Supervisor Reply": "modelLabel.supervisorReply",
  "Supervisor Queue": "modelLabel.supervisorQueue",
  "Supervisor Requests": "modelLabel.supervisorRequests",
  "Supervisor Status": "modelLabel.supervisorStatus",
  "Subagent Supervisor": "modelLabel.subagentSupervisor",
  "Wait": "modelLabel.wait",
  "Wait for Background Work": "modelLabel.waitForBackgroundWork",
  "Wait Subscription": "modelLabel.waitSubscription",
  "Wait for All": "modelLabel.waitForAll",
  "Wait for Run": "modelLabel.waitForRun",
  "Bg Wait": "modelLabel.bgWait",
  "Wait for Agent": "modelLabel.waitForAgent",
  // 0.5.0: Pi's sub-agent tools (shared/pi-subagents.ts piSubagentPresentation).
  "Dispatch Agent": "modelLabel.dispatchAgent",
  "Steer Agent": "modelLabel.steerAgent",
  "Check Agent Result": "modelLabel.checkAgentResult",
  "Agent Result": "modelLabel.agentResult",
  "GitHub Actions Details": "modelLabel.gitHubActionsDetails",
  "GitHub Actions List": "modelLabel.gitHubActionsList",
  "GitHub Actions Run": "modelLabel.gitHubActionsRun",
  "GitHub File": "modelLabel.gitHubFile",
  "GitHub Job Logs": "modelLabel.gitHubJobLogs",
  "GitHub Pull Request": "modelLabel.gitHubPullRequest",
  "GitHub Code Search": "modelLabel.gitHubCodeSearch",
  "GitHub Repository Search": "modelLabel.gitHubRepositorySearch",
  "Exa Web Search": "modelLabel.exaWebSearch",
  "Exa Web Fetch": "modelLabel.exaWebFetch",
  "Exa Agent": "modelLabel.exaAgent",
  "Exa Research Guide": "modelLabel.exaResearchGuide",
  "Exa Schema Templates": "modelLabel.exaSchemaTemplates",
  // Claude Code tools Paseo has no detail type for (shown by name, e.g. inside a child agent's live activity).
  "TodoWrite": "modelLabel.todoWrite",
  "NotebookEdit": "modelLabel.notebookEdit",
  "BashOutput": "modelLabel.bashOutput",
  "KillShell": "modelLabel.killShell",
  "KillBash": "modelLabel.killBash",
  "WebSearch": "modelLabel.webSearch",
  "ExitPlanMode": "modelLabel.exitPlanMode",
  "EnterPlanMode": "modelLabel.enterPlanMode",
  "SlashCommand": "modelLabel.slashCommand",
  "AskUserQuestion": "modelLabel.askUserQuestion",
  "ListMcpResourcesTool": "modelLabel.listMcpResourcesTool",
  "ReadMcpResourceTool": "modelLabel.readMcpResourceTool",
  // Detail section labels.
  "Command": "modelLabel.command",
  "Output": "modelLabel.output",
  "Contents": "modelLabel.contents",
  "Written contents": "modelLabel.writtenContents",
  "Before": "modelLabel.before",
  "After": "modelLabel.after",
  "Diff": "modelLabel.diff",
  "Result": "modelLabel.result",
  "Error": "modelLabel.error",
  "Input": "modelLabel.input",
  "Image": "modelLabel.image",
  "Setup log": "modelLabel.setupLog",
  "Activity log": "modelLabel.activityLog",
  "Query": "modelLabel.query",
  "Matches": "modelLabel.matches",
  "Files": "modelLabel.files",
  "Message": "modelLabel.message",
  "Prompt": "modelLabel.prompt",
  "Code": "modelLabel.code",
  "Session": "modelLabel.session"
});
var WAIT_FOR_AGENTS = /^Wait for (\d+) Agents$/;
function zh(label) {
  const direct = LABELS[label];
  if (direct) return direct;
  if (label.startsWith("Paseo ")) {
    const paseo = PASEO_TOOL_ZH[label.slice("Paseo ".length)];
    if (paseo) return t2("modelText.paseoLabel", { label: paseo });
  }
  const agents = WAIT_FOR_AGENTS.exec(label);
  if (agents) return t2("modelText.waitAgents", { count: agents[1] });
  return label;
}
function lookFor(name, detail, presentation) {
  const leaf = name.trim().toLowerCase();
  const detailType = typeof detail?.type === "string" ? detail.type : "unknown";
  if (detailType === "shell" || detailType === "worktree_setup") return "shell";
  if (detailType === "read") return presentation.label === "List" ? "list" : "read";
  if (detailType === "edit") return presentation.label === "Add" ? "write" : "edit";
  if (detailType === "write") return "write";
  if (detailType === "search") return detail?.toolName === "web_search" ? "web" : "search";
  if (detailType === "fetch") return "web";
  if (detailType === "sub_agent") return "agent";
  if (detailType === "plan") return "plan";
  if (presentation.label === "Skill") return "skill";
  if (presentation.label === "Ask Question") return "ask";
  if (presentation.label === "Tasks") return "plan";
  if (presentation.label.startsWith("Paseo ")) return "paseo";
  if (presentation.label === "Exa Web Search" || presentation.label === "Exa Web Fetch") return "web";
  if (/browser/i.test(leaf)) return "browser";
  if (/^mcp__|^mcp_|\./.test(leaf) && presentation.category === "unknown") return "mcp";
  if (presentation.category === "search") return "search";
  if (presentation.category === "agent") return "agent";
  if (presentation.category === "shell") return "shell";
  if (presentation.category === "plan") return "plan";
  return "other";
}
var STATUS_ZH = translatedTable({
  "Active": "modelStatus.exactActive",
  "Default": "modelStatus.exactDefault",
  "Success": "modelStatus.exactSuccess",
  "Failed": "modelStatus.exactFailed",
  "running": "modelStatus.running",
  "initializing": "modelStatus.initializing",
  "starting": "modelStatus.starting",
  "loading": "modelStatus.loading",
  "completed": "modelStatus.completed",
  "succeeded": "modelStatus.succeeded",
  "success": "modelStatus.success",
  "idle": "modelStatus.idle",
  "active": "modelStatus.active",
  "healthy": "modelStatus.healthy",
  "ready": "modelStatus.ready",
  "available": "modelStatus.available",
  "enabled": "modelStatus.enabled",
  "failed": "modelStatus.failed",
  "error": "modelStatus.error",
  "unhealthy": "modelStatus.unhealthy",
  "unavailable": "modelStatus.unavailable",
  "disabled": "modelStatus.disabled",
  "canceled": "modelStatus.canceled",
  "cancelled": "modelStatus.cancelled",
  "paused": "modelStatus.paused",
  "stopped": "modelStatus.stopped",
  "closed": "modelStatus.closed",
  "exited": "modelStatus.exited",
  "archived": "modelStatus.archived",
  "expired": "modelStatus.expired",
  "skipped": "modelStatus.skipped",
  "pending": "modelStatus.pending",
  "queued": "modelStatus.queued",
  "timeout": "modelStatus.timeout",
  "timed_out": "modelStatus.timedOut",
  "worktree": "modelStatus.worktree",
  "local": "modelStatus.local",
  "none": "modelStatus.none",
  "directory": "modelStatus.directory",
  "tool": "modelStatus.tool",
  "plan": "modelStatus.plan",
  "question": "modelStatus.question",
  "mode": "modelStatus.mode",
  "other": "modelStatus.other",
  "finished": "modelStatus.finished",
  "permission": "modelStatus.permission",
  "closed_by_user": "modelStatus.closedByUser",
  "background": "modelStatus.background"
});
function statusLabel(value) {
  return STATUS_ZH[value] ?? STATUS_ZH[value.toLowerCase()] ?? value;
}
function exitCodeOf(detail, errorText3) {
  const fromDetail = detail?.type === "shell" && typeof detail.exitCode === "number" && Number.isInteger(detail.exitCode) && detail.exitCode !== 0 ? detail.exitCode : null;
  const fromText = /^\s*Exit code (\d{1,9})\b/i.exec(errorText3 ?? "")?.[1];
  const code = fromDetail ?? (fromText ? Number(fromText) : null);
  return code !== null && code !== 0 ? code : null;
}

// resources/third-party/default-features/vivid-activity/shared/pi-subagents.ts
function piSubagentOperation(name) {
  switch (normalizePiToolName(name)) {
    case "agent":
      return "dispatch";
    case "get_subagent_result":
      return "result";
    case "steer_subagent":
      return "steer";
    default:
      return void 0;
  }
}
function parsePiSubagentCall(input, output) {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      value = void 0;
    }
  }
  const record3 = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const envelope = extractPiToolText(output);
  const text2 = envelope?.text ?? "";
  const lifecycleText = text2.replace(/^Note: run_in_background[^\r\n]*\r?\n\s*\r?\n/, "");
  const header = lifecycleText.split(/\r?\n\s*\r?\n/)[0] ?? "";
  const details = envelope?.details ?? {};
  const detailField = (key) => typeof details[key] === "string" ? details[key].trim() || void 0 : void 0;
  const field = (key) => typeof record3[key] === "string" && record3[key].trim() ? record3[key].trim() : void 0;
  const recognizedHeader = /^(?:Agent(?: started| queued) in background\.|Agent:|Steering message sent to agent |Agent "|Agent not found:)/.test(header);
  const line = (label) => recognizedHeader ? header.match(new RegExp(`^${label}:[^\\S\\r\\n]*([^\\r\\n]+)`, "m"))?.[1]?.trim() || void 0 : void 0;
  const operationValue = line("Operation") ?? detailField("operation");
  const operation = operationValue === "wait" || operationValue === "result" || operationValue === "steer" ? operationValue : void 0;
  const description = field("description") ?? detailField("description") ?? line("Description");
  const agentId = field("agent_id") ?? detailField("agentId") ?? line("Agent ID") ?? line("Agent") ?? header.match(/^Steering message sent to agent ([^\s.]+)\./)?.[1] ?? header.match(/^Agent(?: not found:)? "([^"]+)"/)?.[1];
  const agentType = field("subagent_type") ?? detailField("subagentType") ?? line("Type")?.split(" | ")[0];
  const queued = header.startsWith("Agent queued in background.");
  const dispatch = queued || header.startsWith("Agent started in background.");
  const result = header.startsWith("Agent:");
  const steering = header.startsWith("Steering message sent to agent ");
  const responseBody = result ? lifecycleText.slice(header.length).trim() : lifecycleText;
  const rejected = responseBody.match(/^Agent "[^"]+" is not running \(status: ([^)]+)\)\.\s*(.*)/);
  const missing = header.startsWith("Agent not found:");
  const lifecycle = dispatch || result || steering || !!rejected || missing || operation !== void 0;
  const status = header.match(/^Type:[^\r\n]*\| Status:\s*([a-z]+)/m)?.[1] ?? rejected?.[1] ?? detailField("status") ?? (queued ? "queued" : dispatch ? "background" : void 0);
  let body = dispatch || steering || rejected || missing ? "" : result ? responseBody : text2;
  const errorMatch = result && status === "error" ? body.match(/^Error:\s*([\s\S]*)$/) : void 0;
  const error = rejected?.[2] ?? (missing ? t2("sharedPiAgent.missing") : void 0) ?? errorMatch?.[1];
  if (errorMatch && error) body = "";
  const toolUsesMatch = header.match(/(?:^|\| )Tool uses:\s*(\d+)/m);
  const toolUses = toolUsesMatch ? Number(toolUsesMatch[1]) : typeof details.toolUses === "number" ? details.toolUses : void 0;
  const tokens = header.match(/\|\s*([\d.]+[kM]?) tokens?\b/)?.[1] ?? detailField("tokens");
  const context = header.match(/\| Context:\s*([\d.]+%)/)?.[1];
  const duration2 = header.match(/\| Duration:\s*([^|\r\n]+)/)?.[1]?.trim();
  const outputFile = line("Output file");
  const notice = steering || operation === "steer" && responseBody.startsWith("Steering message sent to agent ") ? t2("sharedPiAgent.steerSent") : body === "Agent is still running. Use wait: true or check back later." ? t2("sharedPiAgent.running") : void 0;
  if (notice) body = "";
  return {
    agentId,
    agentType,
    description,
    status,
    prompt: field("prompt"),
    message: field("message"),
    operation,
    wait: operation === "wait" ? true : operation === "result" ? false : typeof record3.wait === "boolean" ? record3.wait : void 0,
    text: text2,
    body,
    lifecycle,
    error,
    notice,
    toolUses,
    tokens,
    context,
    duration: duration2,
    outputFile
  };
}
function piSubagentPresentation(name, input, output, description, agentType) {
  const operation = piSubagentOperation(name);
  const parsed = parsePiSubagentCall(input, output);
  const label = operation === "dispatch" ? "Dispatch Agent" : operation === "steer" ? "Steer Agent" : parsed.wait === true ? "Wait for Agent" : parsed.wait === false ? "Check Agent Result" : "Agent Result";
  const icon = operation === "dispatch" ? "Bot" : operation === "steer" ? "MessageCircle" : "Hourglass";
  const subject = parsed.description ?? description ?? (operation === "dispatch" ? agentType ?? parsed.agentType : parsed.agentId ?? parsed.agentType);
  const type = parsed.operation ? parsed.agentType ?? agentType : void 0;
  const summary = [
    type && type !== subject ? compactText(type) : void 0,
    subject ? compactText(subject, 120) : void 0,
    parsed.status ? statusLabel(parsed.status) : void 0
  ].filter(Boolean).join(t2("sharedPresentation.inlineSeparator")) || void 0;
  return { category: "agent", icon, label, summary };
}

// resources/third-party/default-features/vivid-activity/shared/codemode.ts
function asRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function normalizeToolName2(toolName) {
  return toolName.trim().toLowerCase().replace(/^(?:functions|tools)\./, "").replace(/^mcp__.*?__/, "").replace(/^mcp_/, "");
}
function isCodeModeTool(toolName) {
  return normalizeToolName2(toolName) === "execute";
}
function parseJsonInput(value) {
  try {
    return JSON.parse(value);
  } catch {
    return void 0;
  }
}
function decodeInput(value) {
  if (typeof value === "string" && value.length <= 1e6) {
    const parsed = parseJsonInput(value);
    if (asRecord(parsed)) return parsed;
    return void 0;
  }
  return asRecord(value) ?? void 0;
}
function extractCodeModeCode(input) {
  const record3 = decodeInput(input);
  const code = record3?.code;
  return typeof code === "string" && code.trim() ? code : void 0;
}
var GLOBAL_NAMESPACES = /* @__PURE__ */ new Set([
  "promise",
  "json",
  "object",
  "math",
  "string",
  "number",
  "array",
  "console",
  "codemode"
]);
function stripComments(code) {
  return stripBlockComments(code).replace(/(^|[^\S:;{([,=!+\-*/|&?:])\/\/[^\n]*/g, "$1");
}
function stripBlockComments(code) {
  let out = "";
  let from = 0;
  for (let open3 = code.indexOf("/*"); open3 >= 0; open3 = code.indexOf("/*", from)) {
    const close = code.indexOf("*/", open3 + 2);
    if (close < 0) break;
    out += `${code.slice(from, open3)} `;
    from = close + 2;
  }
  return from === 0 ? code : out + code.slice(from);
}
function firstStringLiteral(slice, key) {
  const pattern = new RegExp(
    `${key}\\s*:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)'|\`((?:[^\`\\\\]|\\\\.)*)\`)`
  );
  const match = slice.match(pattern);
  const raw = match?.[1] ?? match?.[2] ?? match?.[3];
  if (raw === void 0) return void 0;
  const unescaped = raw.replace(/\\(.)/g, "$1").replace(/\s+/g, " ").trim();
  return unescaped || void 0;
}
function parseSearchQuery(code) {
  const pattern = /(?:\$codemode\.search|(?:^|[^\w$.])search)\s*\(\s*\{([\s\S]{0,2000}?)\}/g;
  let match = null;
  let found;
  while ((match = pattern.exec(code)) !== null) {
    const query = firstStringLiteral(match[1] ?? "", "query");
    if (query) {
      found = query;
      break;
    }
  }
  return found;
}
function parseDottedCalls(code) {
  const cleaned = stripComments(code);
  const pattern = /(?:^|[^\w$])([A-Za-z][A-Za-z0-9_]*)\.([A-Za-z][A-Za-z0-9_]*)(?:\.([A-Za-z][A-Za-z0-9_]*))?\s*\(/g;
  const calls = [];
  const seen = /* @__PURE__ */ new Set();
  let match = null;
  while ((match = pattern.exec(cleaned)) !== null) {
    const first = match[1] ?? "";
    const second = match[2] ?? "";
    const third = match[3];
    if (!first || !second) continue;
    if (GLOBAL_NAMESPACES.has(first.toLowerCase())) continue;
    let server = first;
    let tool = second;
    if (third && first.toLowerCase() === "tools") {
      server = second;
      tool = third;
    } else if (third) {
      continue;
    }
    if (server.toLowerCase() === "$codemode") continue;
    const path = `${server}.${tool}`;
    const key = path.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const slice = cleaned.slice(match.index, match.index + 2e3);
    const query = firstStringLiteral(slice, "query") ?? firstStringLiteral(slice, "prompt") ?? firstStringLiteral(slice, "url");
    calls.push({
      path,
      server,
      tool,
      ...query ? { query } : {}
    });
    if (calls.length >= 8) break;
  }
  return calls;
}
function parseCodeModeCalls(code) {
  const source = code.length > 1e5 ? code.slice(0, 1e5) : code;
  const searchQuery = parseSearchQuery(source);
  const calls = parseDottedCalls(source).filter((call) => {
    if (call.server.toLowerCase() === "search" && searchQuery) return false;
    return true;
  });
  return { ...searchQuery ? { searchQuery } : {}, calls };
}
function catalogItem(value) {
  const record3 = asRecord(value);
  const path = record3?.path;
  if (typeof path !== "string" || !path.trim()) return null;
  const description = record3?.description;
  const signature = record3?.signature;
  return {
    path,
    ...typeof description === "string" && description ? { description } : {},
    ...typeof signature === "string" && signature ? { signature } : {}
  };
}
function parseCodeModeCatalog(output) {
  let decoded = output;
  if (typeof output === "string" && output.length <= 1e6) {
    const parsed2 = parseJsonInput(output);
    if (parsed2 === void 0) return void 0;
    decoded = parsed2;
  }
  const record3 = asRecord(decoded);
  const items = record3?.items;
  if (!Array.isArray(items)) return void 0;
  const parsed = items.flatMap((entry) => {
    const item = catalogItem(entry);
    return item ? [item] : [];
  });
  if (parsed.length === 0) return void 0;
  const remaining = record3?.remaining;
  return {
    items: parsed.slice(0, 50),
    ...typeof remaining === "number" && Number.isFinite(remaining) ? { remaining } : {}
  };
}

// resources/third-party/default-features/vivid-activity/shared/text-scan.ts
var SPACE = /\s/;
function trimSpacesBeforeLineBreaks(value) {
  const rows = value.split("\n");
  for (let i = 0; i < rows.length - 1; i++) {
    const row = rows[i];
    let end = row.length;
    while (end > 0 && (row[end - 1] === " " || row[end - 1] === "	")) end -= 1;
    rows[i] = row.slice(0, end);
  }
  return rows.join("\n");
}
function splitAtLine(text2, marker, accept) {
  const parts = [];
  let from = 0;
  let search = 0;
  for (let at = text2.indexOf(marker, search); at >= 0; at = text2.indexOf(marker, search)) {
    search = at + 1;
    let first = -1;
    for (let i = at; i > from && SPACE.test(text2[i - 1]); i--) if (text2[i - 1] === "\n") first = i - 1;
    if (first < 0) continue;
    let last = -1;
    let spacesEnd = at + marker.length;
    for (; spacesEnd < text2.length && SPACE.test(text2[spacesEnd]); spacesEnd++) if (text2[spacesEnd] === "\n") last = spacesEnd;
    if (last < 0 || accept && !accept(last + 1, spacesEnd)) continue;
    parts.push(text2.slice(from, first));
    from = last + 1;
    search = from;
  }
  parts.push(text2.slice(from));
  return parts;
}

// resources/third-party/default-features/vivid-activity/shared/exa.ts
var EXA_TOOL_LABELS = {
  search: "Exa Web Search",
  fetch: "Exa Web Fetch",
  agent: "Exa Agent",
  "research-guide": "Exa Research Guide",
  "schema-templates": "Exa Schema Templates"
};
var EXA_TOOL_ICONS = {
  search: "Search",
  fetch: "Globe",
  agent: "Bot",
  "research-guide": "BookOpen",
  "schema-templates": "Braces"
};
function asRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function stringValue(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function fieldString(record3, ...keys) {
  for (const key of keys) {
    const value = stringValue(record3?.[key]);
    if (value) return value;
  }
  return void 0;
}
function toolLeaf(name) {
  return name.trim().toLowerCase().split(/__|[.:/]/).at(-1) ?? "";
}
function exaToolKind(name) {
  const normalized = name.trim().toLowerCase();
  const leaf = toolLeaf(normalized);
  if (normalized.endsWith("web_search_exa") || leaf === "web_search_exa") return "search";
  if (normalized.endsWith("web_fetch_exa") || leaf === "web_fetch_exa") return "fetch";
  if (normalized.endsWith("exa_agent_run") || normalized.includes("exa") && leaf === "agent_run") {
    return "agent";
  }
  if (normalized.endsWith("exa_read_agent_research_guide") || normalized.includes("exa") && leaf === "read_agent_research_guide") {
    return "research-guide";
  }
  if (normalized.endsWith("exa_read_agent_schema_templates") || normalized.includes("exa") && leaf === "read_agent_schema_templates") {
    return "schema-templates";
  }
  return null;
}
function exaToolLabel(kind) {
  return EXA_TOOL_LABELS[kind];
}
function exaToolIcon(kind) {
  return EXA_TOOL_ICONS[kind];
}
function exaToolSummary(kind, input) {
  const record3 = asRecord2(input);
  const value = kind === "search" ? fieldString(record3, "query") : kind === "fetch" ? fieldString(record3, "url") : fieldString(record3, "prompt") ?? fieldString(record3, "query");
  if (!value) return void 0;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 179)}\u2026` : normalized;
}

// resources/third-party/default-features/vivid-activity/shared/github.ts
var GITHUB_TOOL_LABELS = {
  "actions-get": "GitHub Actions Details",
  "actions-list": "GitHub Actions List",
  "actions-run": "GitHub Actions Run",
  file: "GitHub File",
  "job-logs": "GitHub Job Logs",
  "pull-request": "GitHub Pull Request",
  "search-code": "GitHub Code Search",
  "search-repositories": "GitHub Repository Search"
};
var GITHUB_TOOL_ICONS = {
  "actions-get": "Workflow",
  "actions-list": "ListChecks",
  "actions-run": "PlayCircle",
  file: "FileCode2",
  "job-logs": "ScrollText",
  "pull-request": "GitPullRequest",
  "search-code": "Code2",
  "search-repositories": "BookMarked"
};
function asRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function stringValue2(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function fieldString2(record3, ...keys) {
  for (const key of keys) {
    const value = stringValue2(record3?.[key]);
    if (value) return value;
  }
  return void 0;
}
function toolLeaf2(name) {
  return name.trim().toLowerCase().split(/__|[.:/]/).at(-1) ?? "";
}
function githubToolKind(name) {
  const normalized = name.trim().toLowerCase();
  const leaf = toolLeaf2(normalized);
  if (leaf === "github_actions_get" || leaf === "actions_get") return "actions-get";
  if (leaf === "github_actions_list" || leaf === "actions_list") return "actions-list";
  if (leaf === "github_actions_run_trigger" || leaf === "actions_run_trigger") {
    return "actions-run";
  }
  if (leaf === "github_get_file_contents" || leaf === "get_file_contents") return "file";
  if (leaf === "github_get_job_logs" || leaf === "get_job_logs") return "job-logs";
  if (leaf === "github_pull_request_read" || leaf === "pull_request_read") {
    return "pull-request";
  }
  if (leaf === "github_search_code" || leaf === "search_code") return "search-code";
  if (leaf === "github_search_repositories" || leaf === "search_repositories") {
    return "search-repositories";
  }
  return null;
}
function githubToolLabel(kind) {
  return GITHUB_TOOL_LABELS[kind];
}
function githubToolIcon(kind) {
  return GITHUB_TOOL_ICONS[kind];
}
function compactText2(value, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return void 0;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}\u2026` : normalized;
}
function githubToolSummary(kind, input) {
  const record3 = asRecord3(input);
  switch (kind) {
    case "search-repositories":
    case "search-code":
      return compactText2(fieldString2(record3, "query") ?? "");
    case "file":
      return fieldString2(record3, "path");
    case "pull-request": {
      const owner = fieldString2(record3, "owner");
      const repo = fieldString2(record3, "repo");
      const pullNumber = record3?.pullNumber;
      if (owner && repo && (typeof pullNumber === "number" || typeof pullNumber === "string")) {
        return `${owner}/${repo}#${pullNumber}`;
      }
      return owner && repo ? `${owner}/${repo}` : void 0;
    }
    case "actions-get":
    case "actions-list":
    case "actions-run":
    case "job-logs":
      return fieldString2(record3, "workflowId", "workflow_id", "workflow", "resource_id") ?? fieldString2(record3, "runId", "run_id") ?? fieldString2(record3, "jobId", "job_id");
  }
}

// resources/third-party/default-features/vivid-activity/shared/presentation.ts
var EXTENSION_LANGUAGE = {
  c: "c",
  cc: "cpp",
  cpp: "cpp",
  cs: "csharp",
  css: "css",
  go: "go",
  h: "c",
  hpp: "cpp",
  html: "html",
  htm: "html",
  java: "java",
  js: "javascript",
  json: "json",
  jsonc: "json",
  jsx: "javascript",
  less: "css",
  md: "markdown",
  mdx: "markdown",
  mjs: "javascript",
  mts: "typescript",
  py: "python",
  pyw: "python",
  rs: "rust",
  sass: "css",
  scss: "css",
  sh: "bash",
  sql: "sql",
  ts: "typescript",
  tsx: "typescript",
  vue: "html",
  wasm: "wasm",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash"
};
var FILE_ICON_BY_EXTENSION = {
  c: "FileCode2",
  cc: "FileCode2",
  cpp: "FileCode2",
  cs: "FileCode2",
  css: "FileType",
  go: "FileCode2",
  h: "FileCode2",
  hpp: "FileCode2",
  html: "FileCode2",
  java: "FileCode2",
  js: "FileCode2",
  json: "FileJson",
  jsonc: "FileJson",
  jsx: "FileCode2",
  less: "FileType",
  md: "FileText",
  mdx: "FileText",
  mjs: "FileCode2",
  mts: "FileCode2",
  py: "FileCode2",
  pyw: "FileCode2",
  rs: "FileCode2",
  sass: "FileType",
  scss: "FileType",
  sh: "FileTerminal",
  sql: "FileCode2",
  ts: "FileCode2",
  tsx: "FileCode2",
  vue: "FileCode2",
  wasm: "FileCog",
  xml: "FileCode2",
  yaml: "FileCog",
  yml: "FileCog",
  zsh: "FileTerminal"
};
var FILE_ICON_BY_NAME = {
  ".env": "FileKey2",
  ".gitignore": "FileCog",
  dockerfile: "FileCog",
  "package-lock.json": "FileJson",
  "package.json": "FileJson",
  "pnpm-lock.yaml": "FileCog",
  "yarn.lock": "FileKey2"
};
var TOOL_ICON_NAMES = {
  bot: "Bot",
  brain: "Brain",
  eye: "Eye",
  mic_vocal: "MicVocal",
  pencil: "Pencil",
  paseo: "Sparkles",
  search: "Search",
  sparkles: "Sparkles",
  square_terminal: "SquareTerminal",
  wrench: "Wrench"
};
function compactText(value, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return void 0;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}\u2026` : normalized;
}
function fileName(filePath) {
  return filePath.split(/[\\/]/).at(-1)?.toLowerCase() ?? filePath.toLowerCase();
}
function extensionFromPath(filePath) {
  if (!filePath) return null;
  const name = fileName(filePath);
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1);
}
function languageForFilePath(filePath) {
  const extension = extensionFromPath(filePath);
  return extension ? EXTENSION_LANGUAGE[extension] : void 0;
}
function fileIconForPath(filePath) {
  if (!filePath) return "File";
  if (/[/\\]$/.test(filePath.trim())) return "Folder";
  const name = fileName(filePath);
  const byName = FILE_ICON_BY_NAME[name];
  if (byName) return byName;
  const extension = extensionFromPath(filePath);
  return extension && FILE_ICON_BY_EXTENSION[extension] || "File";
}
function iconNameFromProtocol(value) {
  if (!value) return void 0;
  return TOOL_ICON_NAMES[value] ?? value;
}
function prettyToolName(name) {
  const normalized = name.trim().replace(/[._-]+/g, " ");
  if (!normalized) return "Tool";
  return normalized.split(/\s+/).map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}
var PASEO_TOOL_LABELS = {
  speak: "Speak",
  create_workspace: "Create Workspace",
  list_workspaces: "List Workspaces",
  archive_workspace: "Archive Workspace",
  create_agent: "Create Agent",
  send_agent_prompt: "Send Agent Prompt",
  get_agent_status: "Get Agent Status",
  list_agents: "List Agents",
  cancel_agent: "Cancel Agent Run",
  archive_agent: "Archive Agent",
  kill_agent: "Kill Agent",
  update_agent: "Update Agent",
  rename_workspace: "Rename Workspace",
  list_workspace_scripts: "List Workspace Scripts",
  start_workspace_script: "Start Workspace Script",
  stop_workspace_script: "Stop Workspace Script",
  list_terminals: "List Terminals",
  create_terminal: "Create Terminal",
  kill_terminal: "Kill Terminal",
  capture_terminal: "Capture Terminal",
  send_terminal_keys: "Send Terminal Keys",
  create_schedule: "Create Schedule",
  create_heartbeat: "Create Heartbeat",
  delete_heartbeat: "Delete Heartbeat",
  list_schedules: "List Schedules",
  inspect_schedule: "Inspect Schedule",
  pause_schedule: "Pause Schedule",
  resume_schedule: "Resume Schedule",
  delete_schedule: "Delete Schedule",
  update_schedule: "Update Schedule",
  schedule_logs: "Schedule Logs",
  run_schedule_once: "Run Schedule Once",
  list_providers: "List Providers",
  list_models: "List Models",
  list_profiles: "List Agent Profiles",
  inspect_provider: "Inspect Provider",
  get_agent_activity: "Get Agent Activity",
  set_agent_mode: "Set Agent Session Mode",
  list_pending_permissions: "List Pending Permissions",
  respond_to_permission: "Respond to Permission",
  browser_list_tabs: "List Browser Tabs",
  browser_new_tab: "Create Browser Tab",
  browser_snapshot: "Snapshot Browser Page",
  browser_click: "Click Browser Element",
  browser_fill: "Fill Browser Element",
  browser_wait: "Wait for Browser Condition",
  browser_type: "Type into Browser",
  browser_keypress: "Press Browser Key",
  browser_navigate: "Navigate Browser",
  browser_back: "Browser Back",
  browser_forward: "Browser Forward",
  browser_reload: "Browser Reload",
  browser_screenshot: "Capture Browser Screenshot",
  browser_upload: "Upload Files in Browser",
  browser_hover: "Hover Browser Element",
  browser_select: "Select Browser Option",
  browser_drag: "Drag Browser Element",
  browser_logs: "Read Browser Logs",
  browser_evaluate: "Evaluate Browser JavaScript",
  browser_scroll: "Scroll Browser",
  browser_resize: "Resize Browser Viewport",
  browser_close_tab: "Close Browser Tab"
};
var PASEO_TOOL_ICONS = {
  speak: "MicVocal",
  create_workspace: "FolderPlus",
  list_workspaces: "Folders",
  archive_workspace: "Archive",
  create_agent: "Bot",
  send_agent_prompt: "Send",
  get_agent_status: "Activity",
  list_agents: "Users",
  cancel_agent: "CircleStop",
  archive_agent: "Archive",
  kill_agent: "CircleX",
  update_agent: "Settings2",
  rename_workspace: "Pencil",
  list_workspace_scripts: "ListTree",
  start_workspace_script: "Play",
  stop_workspace_script: "Square",
  list_terminals: "SquareTerminal",
  create_terminal: "SquareTerminal",
  kill_terminal: "CircleX",
  capture_terminal: "ScrollText",
  send_terminal_keys: "Keyboard",
  create_schedule: "CalendarClock",
  create_heartbeat: "HeartPulse",
  delete_heartbeat: "Trash2",
  list_schedules: "CalendarDays",
  inspect_schedule: "CalendarSearch",
  pause_schedule: "Pause",
  resume_schedule: "Play",
  delete_schedule: "Trash2",
  update_schedule: "CalendarCog",
  schedule_logs: "ScrollText",
  run_schedule_once: "CalendarCheck",
  list_providers: "Network",
  list_models: "Cpu",
  list_profiles: "ContactRound",
  inspect_provider: "ScanSearch",
  get_agent_activity: "Activity",
  set_agent_mode: "SlidersHorizontal",
  list_pending_permissions: "ShieldAlert",
  respond_to_permission: "ShieldCheck",
  browser_list_tabs: "PanelsTopLeft",
  browser_new_tab: "Globe2",
  browser_snapshot: "Scan",
  browser_click: "MousePointer2",
  browser_fill: "TextCursorInput",
  browser_wait: "Timer",
  browser_type: "Keyboard",
  browser_keypress: "KeyRound",
  browser_navigate: "Navigation",
  browser_back: "ArrowLeft",
  browser_forward: "ArrowRight",
  browser_reload: "RefreshCw",
  browser_screenshot: "Camera",
  browser_upload: "Upload",
  browser_hover: "Hand",
  browser_select: "ListFilter",
  browser_drag: "Move",
  browser_logs: "ScrollText",
  browser_evaluate: "Braces",
  browser_scroll: "Scroll",
  browser_resize: "Maximize2",
  browser_close_tab: "X"
};
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringField(value, key) {
  if (!isRecord(value)) return void 0;
  const field = value[key];
  return typeof field === "string" && field.trim() ? field : void 0;
}
var ASK_TOOLS = /* @__PURE__ */ new Set(["ask", "askuserquestion", "ask_user_question", "ask_user", "request_user_input", "request_user_input_async", "question"]);
function isAskTool(toolName) {
  const normalized = toolName.trim().toLowerCase().replace(/^(?:functions|tools)\./, "").replace(/^mcp__.*?__/, "").replace(/^mcp_/, "");
  return ASK_TOOLS.has(normalized);
}
function askQuestionOf(value) {
  if (!isRecord(value)) return null;
  const question = stringField(value, "question");
  if (!question) return null;
  const options = Array.isArray(value.options) ? value.options.map((option) => typeof option === "string" ? option : stringField(option, "label") ?? "").filter(Boolean) : [];
  const header = stringField(value, "header");
  return { ...header ? { header } : {}, question, options, multiSelect: value.multiSelect === true };
}
function askContent(detail) {
  if (detail.type === "unknown") {
    const input = decodeToolInput(detail.input);
    const questions = Array.isArray(input?.questions) ? input.questions.map(askQuestionOf).filter((entry) => entry !== null) : [];
    const output = unwrapProviderOutput(detail.output);
    const answers = [];
    if (typeof output === "string") {
      for (const match of output.slice(0, MAX_FORMAT_CHARS).matchAll(/"([^"\n]{1,500})"="([^"\n]{0,2000})"/g)) answers.push({ question: match[1], answer: match[2] });
    }
    return { questions, answers };
  }
  if (detail.type === "plain_text" && detail.text) {
    const [asked = "", answered = ""] = splitAtLine(detail.text.slice(0, MAX_FORMAT_CHARS), "Answers:");
    const questions = [];
    for (const block of asked.split(/\n\s*\n/)) {
      const [first = "", ...rest] = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!first) continue;
      const split = /^([^:：]{1,80})[:：]\s*(\S.*|[^\S\n\r\u2028\u2029])$/.exec(first);
      const options = rest.find((line) => /^Options:/i.test(line))?.replace(/^Options:\s*/i, "").split(/,\s*/).filter(Boolean) ?? [];
      questions.push({ ...split ? { header: split[1] } : {}, question: split ? split[2] : first, options, multiSelect: false });
    }
    const answers = answered.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const pair = /^([^:]{1,80}):\s*(\S.*|)$/.exec(line);
      return pair ? { question: pair[1], answer: pair[2] } : { question: null, answer: line };
    });
    return { questions, answers };
  }
  return { questions: [], answers: [] };
}
function paseoToolLeafName(toolName) {
  const namespacedLeafName = getPaseoToolLeafName(toolName);
  if (namespacedLeafName && PASEO_TOOL_LABELS[namespacedLeafName]) {
    return namespacedLeafName;
  }
  const normalized = toolName.trim().toLowerCase();
  const directMatch = normalized.match(/^(?:mcp_)?paseo_(.+)$/);
  const directLeafName = directMatch?.[1];
  return directLeafName && PASEO_TOOL_LABELS[directLeafName] ? directLeafName : null;
}
function paseoToolLabel(toolName) {
  const leafName = paseoToolLeafName(toolName);
  if (!leafName) return null;
  return PASEO_TOOL_LABELS[leafName] ?? prettyToolName(leafName);
}
function paseoToolIcon(toolName) {
  const leafName = paseoToolLeafName(toolName);
  if (!leafName) return null;
  return PASEO_TOOL_ICONS[leafName] ?? "Sparkles";
}
function paseoToolCategory(toolName) {
  const leafName = paseoToolLeafName(toolName);
  if (!leafName) return null;
  if (leafName.startsWith("browser_")) return "search";
  if (leafName.includes("terminal") || leafName.includes("workspace_script")) return "shell";
  if (leafName.includes("schedule") || leafName.includes("heartbeat")) return "plan";
  if (leafName.includes("provider") || leafName.includes("profile")) return "agent";
  if (leafName.includes("agent") || leafName.includes("permission")) return "agent";
  if (leafName === "speak") return "communication";
  if (leafName.includes("workspace")) return "file";
  return "unknown";
}
function paseoToolSummary(toolName, input) {
  const leafName = paseoToolLeafName(toolName);
  if (!leafName) return void 0;
  const title = stringField(input, "title");
  const provider = stringField(input, "provider");
  const agentId = stringField(input, "agentId");
  const workspaceId = stringField(input, "workspaceId");
  const browserId = stringField(input, "browserId");
  const url = stringField(input, "url");
  const prompt = stringField(input, "prompt") ?? stringField(input, "initialPrompt");
  if (leafName === "create_agent" && title && provider) return t2("sharedPresentation.agentProvider", { title, provider });
  if (leafName === "create_agent" && title) return title;
  if (leafName === "send_agent_prompt" && agentId) return agentId;
  if (leafName.endsWith("_agent") && agentId) return agentId;
  if (leafName.includes("workspace") && workspaceId) return workspaceId;
  if (leafName.startsWith("browser_") && url) return url;
  if (leafName.startsWith("browser_") && browserId) return browserId;
  if ((leafName === "create_schedule" || leafName === "create_heartbeat") && prompt) {
    return compactText(prompt);
  }
  if (leafName === "list_models" && provider) return provider;
  if (leafName === "speak" && stringField(input, "text")) return compactText(stringField(input, "text"));
  return void 0;
}
function normalizePiToolName(toolName) {
  return toolName.trim().toLowerCase().replace(/^(?:functions|tools)\./, "").replace(/^mcp__.*?__/, "").replace(/^mcp_/, "");
}
function isSubagentSupervisorTool(toolName) {
  return normalizePiToolName(toolName) === "subagent_supervisor";
}
function isBgWaitTool(toolName) {
  return normalizePiToolName(toolName) === "bg_wait";
}
function isOmpWaitTool(toolName) {
  return normalizePiToolName(toolName) === "wait";
}
function isTodoTool(toolName) {
  return normalizePiToolName(toolName) === "todo";
}
function isSkillTool(toolName) {
  return normalizePiToolName(toolName) === "skill";
}
function isOpencodeSubagentTool(toolName) {
  const normalized = normalizePiToolName(toolName);
  return normalized === "subagent" || normalized === "task";
}
function parseOpencodeSubagentInput(input) {
  const record3 = decodeToolInput(input) ?? {};
  const agent = stringField(record3, "agent") ?? stringField(record3, "subagent_type") ?? stringField(record3, "subAgentType") ?? stringField(record3, "subagent") ?? stringField(record3, "type");
  const description = stringField(record3, "description");
  const prompt = stringField(record3, "prompt") ?? stringField(record3, "task") ?? stringField(record3, "text");
  const model = stringField(record3, "model");
  const sessionID = stringField(record3, "sessionID") ?? stringField(record3, "sessionId") ?? stringField(record3, "task_id") ?? stringField(record3, "taskId");
  const background = typeof record3.background === "boolean" ? record3.background : void 0;
  return {
    ...agent ? { agent } : {},
    ...description ? { description } : {},
    ...prompt ? { prompt } : {},
    ...model ? { model } : {},
    ...sessionID ? { sessionID } : {},
    ...background !== void 0 ? { background } : {}
  };
}
function opencodeSubagentTextFromValue(value, depth = 0) {
  if (depth > 4) return void 0;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : void 0;
  }
  if (Array.isArray(value)) {
    const parts = value.flatMap((entry) => {
      if (typeof entry === "string" && entry.trim()) return [entry.trim()];
      if (isRecord(entry) && entry.type === "text" && typeof entry.text === "string" && entry.text.trim()) {
        return [entry.text.trim()];
      }
      const nested = opencodeSubagentTextFromValue(entry, depth + 1);
      return nested ? [nested] : [];
    });
    return parts.length > 0 ? parts.join("\n") : void 0;
  }
  if (!isRecord(value)) return void 0;
  for (const key of ["output", "text", "result", "content", "response", "body", "message"]) {
    const nested = opencodeSubagentTextFromValue(value[key], depth + 1);
    if (nested) return nested;
  }
  return void 0;
}
function parseSubagentEnvelopeTag(text2) {
  const open3 = /<subagent\s+/i.exec(text2);
  const attrsStart = open3 ? open3.index + open3[0].length : -1;
  const close = open3 ? text2.indexOf(">", attrsStart) : -1;
  if (close < 0 || close === attrsStart) return void 0;
  const attrs = text2.slice(attrsStart, close);
  const attr2 = (name) => {
    const match = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
    return match?.[1]?.trim() || void 0;
  };
  const sessionID = attr2("sessionID") ?? attr2("sessionId") ?? attr2("session_id");
  const status = attr2("state") ?? attr2("status");
  const description = attr2("description");
  const afterOpen = text2.slice(close + 1);
  const closeIndex = afterOpen.search(/<\/subagent\s*>/i);
  const body = (closeIndex >= 0 ? afterOpen.slice(0, closeIndex) : afterOpen).trim();
  return {
    ...sessionID ? { sessionID } : {},
    ...status ? { status } : {},
    ...description ? { description } : {},
    ...body ? { text: body } : {}
  };
}
function backgroundSessionOf(text2) {
  const lead = /working in the background\s*\(sessionID:/gi;
  for (let match = lead.exec(text2); match; match = lead.exec(text2)) {
    const close = text2.indexOf(")", lead.lastIndex);
    if (close < 0) return void 0;
    if (close > lead.lastIndex) return text2.slice(lead.lastIndex, close).trim();
  }
  return void 0;
}
function parseOpencodeSubagentOutput(output) {
  if (typeof output === "string") {
    const trimmed = output.trim();
    if (!trimmed) return void 0;
    const envelope = parseSubagentEnvelopeTag(trimmed);
    if (envelope && (envelope.sessionID || envelope.status || envelope.text)) return envelope;
    const backgroundSession = backgroundSessionOf(trimmed);
    if (backgroundSession !== void 0) {
      return {
        sessionID: backgroundSession,
        status: "running",
        text: trimmed,
        isBackgroundNotice: true
      };
    }
    const sessionMatch = trimmed.match(/\bsessionID:\s*(ses_[A-Za-z0-9]+)/i);
    return {
      ...sessionMatch?.[1] ? { sessionID: sessionMatch[1] } : {},
      text: trimmed
    };
  }
  if (!isRecord(output)) return void 0;
  const sessionID = stringField(output, "sessionID") ?? stringField(output, "sessionId") ?? stringField(output, "session_id") ?? stringField(output, "task_id") ?? stringField(output, "taskId");
  const status = stringField(output, "status") ?? stringField(output, "state");
  const description = stringField(output, "description");
  const text2 = opencodeSubagentTextFromValue(output);
  if (!sessionID && !status && !description && !text2) return void 0;
  const backgroundNotice = text2 ? /working in the background/i.test(text2) : false;
  return {
    ...sessionID ? { sessionID } : {},
    ...status ? { status } : {},
    ...description ? { description } : {},
    ...text2 ? { text: text2 } : {},
    ...backgroundNotice ? { isBackgroundNotice: true } : {}
  };
}
function opencodeSubagentSummary(input, output) {
  const parsed = parseOpencodeSubagentInput(input);
  if (parsed.description) return compactText(parsed.description);
  const outputParsed = parseOpencodeSubagentOutput(output);
  if (outputParsed?.description) return compactText(outputParsed.description);
  if (parsed.agent) return compactText(parsed.agent);
  if (parsed.prompt) return compactText(parsed.prompt.split("\n")[0] ?? "", 120);
  return void 0;
}
function skillNameFromRecord(record3) {
  for (const key of ["name", "id", "skill", "skillName", "skillId"]) {
    const field = record3[key];
    if (typeof field === "string" && field.trim()) return field.trim();
  }
  return void 0;
}
function skillNameFromOutput(output) {
  if (typeof output !== "string") return void 0;
  const match = output.match(/<skill_content\s+name=["']([^"']+)["']/i);
  return match?.[1]?.trim() || void 0;
}
function parseSkillName(input) {
  const record3 = decodeToolInput(input);
  if (!record3) return void 0;
  return skillNameFromRecord(record3);
}
function skillNameForDetail(detail) {
  if (detail.type === "plain_text") {
    const label = detail.label?.trim();
    if (label) return label;
    return void 0;
  }
  if (detail.type === "unknown") {
    return parseSkillName(detail.input) ?? skillNameFromOutput(detail.output) ?? (isRecord(detail.output) && typeof detail.output.output === "string" ? skillNameFromOutput(detail.output.output) : void 0);
  }
  return void 0;
}
function decodeToolInput(value) {
  if (typeof value === "string") {
    const parsed = parseJsonString(value);
    return isRecord(parsed) ? parsed : void 0;
  }
  return isRecord(value) ? value : void 0;
}
function parseSubagentSupervisorInput(input) {
  const record3 = decodeToolInput(input) ?? {};
  const action = typeof record3.action === "string" && record3.action.trim() ? record3.action.trim().toLowerCase() : "";
  const replyTo = typeof record3.replyTo === "string" && record3.replyTo.trim() ? record3.replyTo : void 0;
  const message = typeof record3.message === "string" && record3.message.trim() ? record3.message : void 0;
  const to = typeof record3.to === "string" && record3.to.trim() ? record3.to : void 0;
  return { action, ...replyTo ? { replyTo } : {}, ...message ? { message } : {}, ...to ? { to } : {} };
}
function parseBgWaitInput(input) {
  const record3 = decodeToolInput(input) ?? {};
  const id = typeof record3.id === "string" && record3.id.trim() ? record3.id : void 0;
  const all = typeof record3.all === "boolean" ? record3.all : void 0;
  const nonBlocking = typeof record3.nonBlocking === "boolean" ? record3.nonBlocking : void 0;
  const timeoutMs = typeof record3.timeoutMs === "number" && Number.isFinite(record3.timeoutMs) && record3.timeoutMs > 0 ? record3.timeoutMs : void 0;
  const stopOnAttention = typeof record3.stopOnAttention === "boolean" ? record3.stopOnAttention : void 0;
  return { ...id ? { id } : {}, ...all !== void 0 ? { all } : {}, ...nonBlocking !== void 0 ? { nonBlocking } : {}, ...timeoutMs !== void 0 ? { timeoutMs } : {}, ...stopOnAttention !== void 0 ? { stopOnAttention } : {} };
}
function extractPiToolText(output) {
  if (typeof output === "string") {
    return output.trim() ? { text: output } : void 0;
  }
  if (!isRecord(output)) return void 0;
  const content = output.content;
  if (typeof content === "string" && content.trim()) {
    return { text: content, ...isRecord(output.details) ? { details: output.details } : {} };
  }
  if (Array.isArray(content)) {
    const texts = content.flatMap((item) => isRecord(item) && item.type === "text" && typeof item.text === "string" && item.text.trim() ? [item.text] : []);
    if (texts.length > 0) {
      return { text: texts.join("\n"), ...isRecord(output.details) ? { details: output.details } : {} };
    }
  }
  if (isRecord(output.details)) return { text: "", details: output.details };
  return void 0;
}
function shortRunId(value, length = 8) {
  if (!value) return void 0;
  const trimmed = value.trim();
  if (!trimmed) return void 0;
  return trimmed.length > length ? trimmed.slice(0, length) : trimmed;
}
function formatWaitTimeout(timeoutMs) {
  if (timeoutMs === void 0) return void 0;
  const seconds = Math.round(timeoutMs / 1e3);
  if (seconds < 60) return t2("timing.seconds", { count: seconds });
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return remainder === 0 ? t2("timing.minutes", { count: minutes }) : t2("timing.minutesSeconds", { minutes, seconds: remainder });
  const hours = Math.floor(minutes / 60);
  const minuteRemainder = minutes % 60;
  return minuteRemainder === 0 ? t2("timing.hours", { count: hours }) : t2("timing.hoursMinutes", { hours, minutes: minuteRemainder });
}
function subagentSupervisorLabel(input) {
  const parsed = parseSubagentSupervisorInput(input);
  switch (parsed.action) {
    case "reply":
      return "Supervisor Reply";
    case "pending":
      return "Supervisor Queue";
    case "list":
      return "Supervisor Requests";
    case "status":
      return "Supervisor Status";
    default:
      return "Subagent Supervisor";
  }
}
function subagentSupervisorSummary(input, output) {
  const parsed = parseSubagentSupervisorInput(input);
  if (parsed.action === "reply") {
    const envelope = extractPiToolText(output);
    const details = envelope?.details;
    const agent = typeof details?.agent === "string" && details.agent.trim() ? details.agent : void 0;
    const messageSummary = parsed.message ? compactText(parsed.message, 120) : void 0;
    const replyTarget = shortRunId(parsed.replyTo ?? (typeof details?.replyTo === "string" ? details.replyTo : void 0));
    const parts = [agent, messageSummary ?? (replyTarget ? t2("sharedPresentation.replyTarget", { target: replyTarget }) : void 0)].filter(Boolean);
    return parts.length > 0 ? parts.join(t2("sharedPresentation.inlineSeparator")) : replyTarget ? t2("sharedPresentation.replyTarget", { target: replyTarget }) : void 0;
  }
  if (parsed.action === "pending" || parsed.action === "list" || parsed.action === "status") {
    const envelope = extractPiToolText(output);
    if (envelope?.text) return compactText(envelope.text.split("\n")[0] ?? "", 120);
    return parsed.to ? t2("sharedPresentation.replyTarget", { target: parsed.to }) : void 0;
  }
  return parsed.message ? compactText(parsed.message, 120) : void 0;
}
function stringList(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string" && entry.trim().length > 0) : [];
}
function parseBgWaitOutput(output) {
  const envelope = extractPiToolText(output);
  if (!envelope) return void 0;
  const details = envelope.details ?? {};
  const wait = isRecord(details.wait) ? details.wait : void 0;
  const waitReason = typeof wait?.reason === "string" ? wait.reason : void 0;
  const timedOut = typeof wait?.timedOut === "boolean" ? wait.timedOut : void 0;
  const activeRunIds = wait ? stringList(wait.activeRunIds) : [];
  const activeProviderItems = Array.isArray(wait?.activeProviderItems) ? wait.activeProviderItems.flatMap((item) => isRecord(item) && typeof item.provider === "string" && typeof item.id === "string" ? [{ provider: item.provider, id: item.id }] : []) : [];
  const rawCompletions = Array.isArray(details.completions) ? details.completions : [];
  const completions = rawCompletions.flatMap((completion) => {
    if (!isRecord(completion) || typeof completion.runId !== "string") return [];
    const runId = completion.runId;
    const results = Array.isArray(completion.results) ? completion.results : [];
    if (results.length === 0) return [{ runId }];
    return results.map((result) => {
      if (!isRecord(result)) return { runId };
      const agent = typeof result.agent === "string" ? result.agent : void 0;
      const success = typeof result.success === "boolean" ? result.success : void 0;
      return { runId, ...agent ? { agent } : {}, ...success !== void 0 ? { success } : {} };
    });
  });
  const lines2 = envelope.text.split("\n");
  const headline2 = lines2[0]?.trim() ? lines2[0].trim() : void 0;
  const body = lines2.length > 1 && lines2.slice(1).join("\n").trim() ? lines2.slice(1).join("\n").trim() : void 0;
  return { text: envelope.text, ...headline2 ? { headline: headline2 } : {}, ...body ? { body } : {}, ...waitReason ? { waitReason } : {}, ...timedOut !== void 0 ? { timedOut } : {}, activeRunIds, activeProviderItems, completions };
}
function bgWaitLabel(input) {
  const parsed = parseBgWaitInput(input);
  if (parsed.nonBlocking === true) return "Wait Subscription";
  if (parsed.all === true) return "Wait for All";
  if (parsed.id) return "Wait for Run";
  return "Bg Wait";
}
function bgWaitSummary(input, output) {
  const parsed = parseBgWaitInput(input);
  const summary = parseBgWaitOutput(output);
  const target = parsed.id ? shortRunId(parsed.id) : parsed.all === true ? t2("sharedWait.allRuns") : t2("sharedWait.nextRun");
  const timeout = formatWaitTimeout(parsed.timeoutMs);
  const header = [target, timeout ? t2("sharedWait.timeout", { duration: timeout }) : void 0].filter(Boolean).join(t2("sharedPresentation.inlineSeparator"));
  if (summary && summary.completions.length > 0) {
    const first = summary.completions[0];
    const completionLabel = first?.agent ?? shortRunId(first?.runId) ?? t2("sharedWait.run");
    return t2(summary.completions.length > 1 ? "sharedWait.completedMany" : "sharedWait.completed", {
      label: completionLabel,
      count: summary.completions.length,
      header: header ? t2("sharedWait.headerSuffix", { header }) : ""
    });
  }
  if (summary?.waitReason === "window_elapsed") {
    return header ? t2("sharedWait.timedOutWithHeader", { header }) : t2("sharedWait.timedOut");
  }
  if (summary?.waitReason === "supervisor_request") {
    return header ? t2("sharedWait.requestWithHeader", { header }) : t2("sharedWait.request");
  }
  if (summary?.headline) {
    const waiting = summary.headline.match(/waiting\s+([\d.]+)s/i)?.[1];
    if (waiting && header) return t2("sharedWait.waitedWithHeader", { header, seconds: waiting });
    if (waiting) return t2("sharedWait.waited", { seconds: waiting });
  }
  return header || void 0;
}
function parseOmpWaitOutput(output) {
  const envelope = extractPiToolText(output);
  if (!envelope || !envelope.details) return void 0;
  const details = envelope.details;
  if (details.op !== "wait") return void 0;
  const rawJobs = Array.isArray(details.jobs) ? details.jobs : [];
  const jobs = rawJobs.flatMap((job) => {
    if (!isRecord(job) || typeof job.id !== "string" || job.id.trim().length === 0) return [];
    const label = typeof job.label === "string" && job.label.trim() ? job.label.trim() : void 0;
    const status = typeof job.status === "string" && job.status.trim() ? job.status.trim().toLowerCase() : void 0;
    const durationMs = typeof job.durationMs === "number" && Number.isFinite(job.durationMs) && job.durationMs >= 0 ? job.durationMs : void 0;
    const model = typeof job.resolvedModel === "string" && job.resolvedModel.trim() ? job.resolvedModel.trim() : typeof job.resolvedModelIdentity === "string" && job.resolvedModelIdentity.trim() ? job.resolvedModelIdentity.trim() : void 0;
    return [
      {
        id: job.id,
        ...status ? { status } : {},
        ...label ? { label } : {},
        ...durationMs !== void 0 ? { durationMs } : {},
        ...model ? { model } : {}
      }
    ];
  });
  return { text: envelope.text, op: "wait", jobs };
}
function ompWaitLabel(output) {
  const summary = parseOmpWaitOutput(output);
  if (summary && summary.jobs.length === 1) return "Wait for Agent";
  if (summary && summary.jobs.length > 1) return `Wait for ${summary.jobs.length} Agents`;
  return "Wait";
}
function ompWaitSummary(input, output) {
  const summary = parseOmpWaitOutput(output);
  if (!summary || summary.jobs.length === 0) {
    const envelope = extractPiToolText(output);
    return envelope?.text ? compactText(envelope.text, 120) : void 0;
  }
  const running = summary.jobs.filter((job) => job.status === "running").length;
  const done = summary.jobs.filter((job) => job.status === "completed" || job.status === "done").length;
  const failed2 = summary.jobs.filter((job) => job.status === "failed" || job.status === "error").length;
  const state = [
    running > 0 ? t2("sharedWait.running", { count: running }) : void 0,
    done > 0 ? t2("sharedWait.done", { count: done }) : void 0,
    failed2 > 0 ? t2("sharedWait.failed", { count: failed2 }) : void 0
  ].filter(Boolean);
  if (state.length === 0) state.push(t2("sharedWait.waiting", { count: summary.jobs.length }));
  const durations = summary.jobs.flatMap((job) => job.durationMs !== void 0 ? [job.durationMs] : []);
  if (durations.length > 0) state.push(formatWaitTimeout(Math.max(...durations)) ?? "");
  const names = summary.jobs.map((job) => job.label ?? job.id);
  const shown3 = names.length > 3 ? t2("sharedWait.namesAndOthers", { names: joinList(names.slice(0, 3)), count: names.length }) : joinList(names.slice(0, 3));
  return [...state, shown3].filter(Boolean).join(t2("sharedPresentation.inlineSeparator"));
}
function numberField(value, key) {
  if (!isRecord(value)) return void 0;
  const field = value[key];
  return typeof field === "number" && Number.isFinite(field) ? field : void 0;
}
function numberListField(value, key) {
  if (!isRecord(value)) return void 0;
  const field = value[key];
  if (!Array.isArray(field)) return void 0;
  const numbers = field.filter((entry) => typeof entry === "number" && Number.isFinite(entry));
  return numbers.length > 0 ? numbers : void 0;
}
function todoStatus(value) {
  return value === "pending" || value === "in_progress" || value === "completed" ? value : void 0;
}
function parseTodoToolInput(input) {
  const record3 = decodeToolInput(input) ?? {};
  const action = stringField(record3, "action")?.trim().toLowerCase() ?? "";
  const id = numberField(record3, "id");
  const status = todoStatus(record3.status);
  const subject = stringField(record3, "subject");
  const description = stringField(record3, "description");
  const activeForm = stringField(record3, "activeForm");
  const blockedBy = numberListField(record3, "blockedBy");
  const addBlockedBy = numberListField(record3, "addBlockedBy");
  const removeBlockedBy = numberListField(record3, "removeBlockedBy");
  const owner = stringField(record3, "owner");
  return {
    action,
    ...id !== void 0 ? { id } : {},
    ...status ? { status } : {},
    ...subject ? { subject } : {},
    ...description ? { description } : {},
    ...activeForm ? { activeForm } : {},
    ...blockedBy ? { blockedBy } : {},
    ...addBlockedBy ? { addBlockedBy } : {},
    ...removeBlockedBy ? { removeBlockedBy } : {},
    ...owner ? { owner } : {}
  };
}
function parseTodoToolTask(value) {
  if (!isRecord(value)) return void 0;
  const id = numberField(value, "id");
  if (id === void 0) return void 0;
  const subject = stringField(value, "subject") ?? stringField(value, "text") ?? stringField(value, "title");
  if (!subject) return void 0;
  const description = stringField(value, "description");
  const activeForm = stringField(value, "activeForm");
  return {
    id,
    subject,
    status: todoStatus(value.status) ?? "pending",
    ...description ? { description } : {},
    ...activeForm ? { activeForm } : {},
    blockedBy: numberListField(value, "blockedBy") ?? []
  };
}
function parseTodoToolOutput(output) {
  const envelope = extractPiToolText(output);
  if (!envelope || !envelope.details) return void 0;
  const details = envelope.details;
  const tasks = Array.isArray(details.tasks) ? details.tasks.flatMap((entry) => {
    const task2 = parseTodoToolTask(entry);
    return task2 ? [task2] : [];
  }) : [];
  const task = parseTodoToolTask(details.task);
  if (tasks.length === 0 && !task && !envelope.text) return void 0;
  const action = stringField(details, "action");
  const paramsRecord = isRecord(details.params) ? details.params : void 0;
  const nextId = numberField(details, "nextId");
  return {
    text: envelope.text,
    ...action ? { action } : {},
    tasks,
    ...task ? { task } : {},
    ...paramsRecord ? { params: parseTodoToolInput(paramsRecord) } : {},
    ...nextId !== void 0 ? { nextId } : {}
  };
}
function todoToolSummary(output) {
  const summary = parseTodoToolOutput(output);
  if (!summary) return void 0;
  const firstLine = summary.text.split("\n").find((line) => line.trim())?.trim();
  const headline2 = summary.text.includes("\n") ? void 0 : compactText(firstLine ?? "", 90);
  if (headline2) return headline2;
  if (summary.tasks.length === 0) return void 0;
  const done = summary.tasks.filter((entry) => entry.status === "completed").length;
  return t2("sharedPresentation.tasksCompleted", { done, total: summary.tasks.length });
}
var MAX_EMBEDDED_JSON_CHARS = 1e5;
var MAX_EMBEDDED_JSON_STARTS = 8;
function parseEmbeddedJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    if (value.length > MAX_EMBEDDED_JSON_CHARS) return void 0;
    let starts = 0;
    for (const match of value.matchAll(/\{|\[/g)) {
      const offset = match.index;
      if (offset === void 0) continue;
      if (++starts > MAX_EMBEDDED_JSON_STARTS) break;
      try {
        return JSON.parse(value.slice(offset));
      } catch {
        continue;
      }
    }
    return void 0;
  }
}
function numberOrNull(value) {
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function textFromContent(record3) {
  if (!record3 || !Array.isArray(record3.content)) return void 0;
  const parts = record3.content.flatMap(
    (part) => isRecord(part) && part.type === "text" && typeof part.text === "string" ? [part.text] : []
  );
  return parts.length > 0 ? parts.join("\n") : void 0;
}
function parsePiShellResult(value, depth = 0) {
  if (depth > 4) return void 0;
  let record3;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") || trimmed.length > MAX_FORMAT_CHARS) return void 0;
    const parsed = parseEmbeddedJson(trimmed);
    record3 = isRecord(parsed) ? parsed : void 0;
  } else if (isRecord(value)) {
    record3 = value;
  }
  if (!record3) return void 0;
  const structured = isRecord(record3.structuredContent) ? record3.structuredContent : void 0;
  if (structured) {
    const nested = parsePiShellResult(structured, depth + 1);
    if (nested) return nested;
  }
  const inner = structured ?? record3;
  const exitCode2 = numberOrNull(inner.exit_code) ?? numberOrNull(inner.exitCode);
  const truncated = typeof inner.truncated === "boolean" ? inner.truncated : void 0;
  const fullOutputPath = stringField(inner, "full_output_path") ?? stringField(inner, "fullOutputPath");
  const hasShellShape = exitCode2 !== void 0 || truncated !== void 0 || fullOutputPath !== void 0 || "exit_code" in inner || "exitCode" in inner;
  if (!hasShellShape) return void 0;
  const output = stringField(inner, "output") ?? textFromContent(inner) ?? textFromContent(record3);
  return {
    ...output !== void 0 ? { output } : {},
    ...exitCode2 !== void 0 ? { exitCode: exitCode2 } : {},
    ...truncated !== void 0 ? { truncated } : {},
    ...fullOutputPath !== void 0 ? { fullOutputPath } : {}
  };
}
function shellDetailFromResult(detail) {
  const parsed = parsePiShellResult(detail.output);
  if (!parsed) return detail;
  const keepExitCode = detail.exitCode !== void 0 && detail.exitCode !== null ? { exitCode: detail.exitCode } : parsed.exitCode !== void 0 ? { exitCode: parsed.exitCode } : {};
  return {
    ...detail,
    ...parsed.output !== void 0 ? { output: parsed.output } : {},
    ...keepExitCode,
    ...parsed.truncated !== void 0 ? { truncated: parsed.truncated } : {},
    ...parsed.fullOutputPath !== void 0 ? { fullOutputPath: parsed.fullOutputPath } : {}
  };
}
function unwrapProviderOutput(value) {
  return isRecord(value) && Object.keys(value).length === 1 && "output" in value ? value.output : value;
}
function normalizeToolCallDetail(detail, name) {
  if (detail.type === "shell") return shellDetailFromResult(detail);
  if (detail.type !== "unknown") return detail;
  const providerOutput = unwrapProviderOutput(detail.output);
  if (providerOutput !== detail.output) detail = { ...detail, output: providerOutput };
  const input = decodeToolInput(detail.input);
  if (name && normalizePiToolName(name) === "read") {
    const filePath = stringField(input, "path");
    if (!filePath || !input) return detail;
    const { offset, limit } = input;
    if (offset != null && (typeof offset !== "number" || !Number.isFinite(offset))) return detail;
    if (limit != null && (typeof limit !== "number" || !Number.isFinite(limit))) return detail;
    const content = extractPiToolText(detail.output)?.text;
    return {
      type: "read",
      filePath,
      ...content !== void 0 ? { content } : {},
      ...typeof offset === "number" ? { offset } : {},
      ...typeof limit === "number" ? { limit } : {}
    };
  }
  const result = parsePiShellResult(detail.output);
  const command = stringField(input, "command") ?? stringField(input, "cmd") ?? stringField(input, "script") ?? (result && name ? prettyToolName(name) : void 0);
  if (!command) return detail;
  const output = result?.output ?? extractPiToolText(detail.output)?.text;
  if (!result && output === void 0) return detail;
  return {
    type: "shell",
    command,
    ...output !== void 0 ? { output } : {},
    ...result?.exitCode !== void 0 ? { exitCode: result.exitCode } : {},
    ...result?.truncated !== void 0 ? { truncated: result.truncated } : {},
    ...result?.fullOutputPath !== void 0 ? { fullOutputPath: result.fullOutputPath } : {}
  };
}
var MAX_FORMAT_CHARS = 1e5;
var MAX_DIFF_CHARS = 1e5;
var ESC = 27;
var BEL = 7;
var C1_CSI = 155;
var C1_ST = 156;
function opensEscape(code) {
  return code === ESC || code === C1_CSI || code === 157 || code === 144 || code === 152 || code === 158 || code === 159;
}
function firstEscape(text2) {
  for (let index = 0; index < text2.length; index++) if (opensEscape(text2.charCodeAt(index))) return index;
  return -1;
}
function escapeEnd(text2, at) {
  const length = text2.length;
  const code = text2.charCodeAt(at);
  let index = at + 1;
  let csi = code === C1_CSI;
  if (code === ESC) {
    if (index >= length) return length;
    const next = text2.charCodeAt(index);
    if (next === 91) {
      csi = true;
      index += 1;
    } else if (next === 93 || next === 80 || next === 88 || next === 94 || next === 95) {
      index += 1;
    } else if (next >= 32 && next <= 47) {
      index += 1;
      while (index < length && text2.charCodeAt(index) >= 32 && text2.charCodeAt(index) <= 47) index += 1;
      if (index < length && text2.charCodeAt(index) >= 48 && text2.charCodeAt(index) <= 126) index += 1;
      return index;
    } else if (next >= 48 && next <= 126) {
      return index + 1;
    } else {
      return index;
    }
  }
  if (csi) {
    let colour = code === ESC;
    while (index < length) {
      const byte = text2.charCodeAt(index);
      if (byte < 48 || byte > 63) break;
      if (byte !== 59 && (byte < 48 || byte > 57)) colour = false;
      index += 1;
    }
    while (index < length) {
      const byte = text2.charCodeAt(index);
      if (byte < 32 || byte > 47) break;
      colour = false;
      index += 1;
    }
    if (index >= length) return length;
    const final = text2.charCodeAt(index);
    if (final >= 64 && final <= 126) return colour && final === 109 ? -(index + 1) : index + 1;
    return index;
  }
  while (index < length) {
    const byte = text2.charCodeAt(index);
    if (byte === BEL || byte === C1_ST) return index + 1;
    if (byte === ESC) return index + 1 < length && text2.charCodeAt(index + 1) === 92 ? index + 2 : index;
    if (byte === 10 || byte === 13) return index;
    index += 1;
  }
  return length;
}
function scanAnsi(text2, keepColour, limit) {
  const first = firstEscape(text2);
  if (first < 0) return text2.length <= limit ? text2 : text2.slice(0, limit);
  const parts = [];
  let shown3 = 0;
  let start = 0;
  let index = first;
  while (index < text2.length) {
    if (!opensEscape(text2.charCodeAt(index))) {
      index += 1;
      continue;
    }
    if (index > start) {
      const run = index - start;
      if (shown3 + run >= limit) {
        parts.push(text2.slice(start, start + (limit - shown3)));
        return parts.join("");
      }
      parts.push(text2.slice(start, index));
      shown3 += run;
    }
    const end = escapeEnd(text2, index);
    if (end < 0) {
      if (keepColour) parts.push(text2.slice(index, -end));
      index = -end;
    } else {
      index = end;
    }
    start = index;
  }
  if (start < text2.length) parts.push(text2.slice(start, start + Math.max(0, limit - shown3)));
  return parts.join("");
}
function stripAnsi(text2) {
  return scanAnsi(text2, false, Infinity);
}
function looksLikeJson(source) {
  return /^\s*[[{"]/.test(source.slice(0, 256));
}
function formatJson(source) {
  if (source.length > MAX_FORMAT_CHARS || !source.trim()) {
    return { text: null, limited: source.length > MAX_FORMAT_CHARS && looksLikeJson(source) };
  }
  try {
    JSON.parse(source);
  } catch {
    return { text: null, limited: false };
  }
  const tokens = source.match(/"(?:\\[\s\S]|[^"\\])*"|[{}[\],:]|[^\s{}[\],:]+/g) ?? [];
  let depth = 0;
  const out = [];
  let length = 0;
  const push = (value) => {
    out.push(value);
    length += value.length;
  };
  const line = () => push("\n" + "  ".repeat(Math.min(depth, 40)));
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === "{" || token === "[") {
      push(token);
      depth += 1;
      if (tokens[index + 1] !== "}" && tokens[index + 1] !== "]") line();
    } else if (token === "}" || token === "]") {
      depth -= 1;
      if (tokens[index - 1] !== "{" && tokens[index - 1] !== "[") line();
      push(token);
    } else if (token === ",") {
      push(token);
      line();
    } else if (token === ":") {
      push(": ");
    } else {
      push(token);
    }
    if (length > MAX_FORMAT_CHARS) return { text: null, limited: true };
  }
  return { text: out.join(""), limited: false };
}
function prettyJson(source) {
  return formatJson(source).text;
}
function parseJsonString(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function applyPatchInput(value) {
  if (typeof value === "string") {
    const parsed = parseJsonString(value);
    return parsed === value ? value : applyPatchInput(parsed);
  }
  if (!isRecord(value)) return void 0;
  if (value.input !== void 0) {
    const nestedInput = applyPatchInput(value.input);
    if (nestedInput) return nestedInput;
  }
  for (const key of ["input", "patch", "patchText"]) {
    if (typeof value[key] === "string") return value[key];
  }
  return void 0;
}
function applyPatchToolName(name) {
  const normalized = name.trim().toLowerCase().replace(/^(?:functions|tools)\./, "").replace(/^mcp__.*?__/, "").replace(/^mcp_/, "");
  return normalized === "apply_patch" || normalized === "apply-patch" || normalized === "patch";
}
function patchInputEdits(input) {
  const lines2 = input.replace(/\r\n?/g, "\n").split("\n");
  const edits = [];
  let index = 0;
  while (index < lines2.length) {
    const header = lines2[index]?.match(/^\*\*\* (Add|Delete|Update) File: (.+)$/);
    if (!header?.[1] || !header[2]) {
      index++;
      continue;
    }
    const operation = header[1].toLowerCase();
    const filePath = header[2];
    index++;
    const diffLines = [];
    let moveTo;
    while (index < lines2.length && !lines2[index]?.match(/^\*\*\* (?:Add|Delete|Update) File: /)) {
      const line = lines2[index] ?? "";
      const move = line.match(/^\*\*\* Move to: (.+)$/);
      if (move?.[1]) {
        moveTo = move[1].trim();
      } else if (operation === "add" && line.startsWith("+")) {
        diffLines.push(`+${line.slice(1)}`);
      } else if (operation === "update") {
        if (line.startsWith("@@")) diffLines.push(line);
        else if (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")) diffLines.push(line);
      }
      index++;
    }
    edits.push({ filePath: moveTo ?? filePath, operation, unifiedDiff: diffLines.join("\n") });
  }
  return edits;
}
function isDiffFileHeader(line, index, firstHunk) {
  return (line.startsWith("---") || line.startsWith("+++")) && (firstHunk === -1 || index < firstHunk);
}
function unifiedDiffBody(diff) {
  const lines2 = diff.replace(/\r\n?/g, "\n").split("\n");
  const firstHunk = lines2.findIndex((line) => line.startsWith("@@"));
  return lines2.filter((line, index) => !isDiffFileHeader(line, index, firstHunk)).filter((line) => line.startsWith("@@") || line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")).join("\n");
}
function unifiedDiffEdits(unifiedDiff, firstFilePath) {
  const sections = unifiedDiff.replace(/\r\n?/g, "\n").split(/(?=^diff --git )/m).filter((section) => section.trim());
  const edits = [];
  for (const [index, section] of sections.entries()) {
    const plusHeader = section.match(/^\+\+\+ (?:b\/)?(.+)$/m)?.[1];
    const minusHeader = section.match(/^--- (?:a\/)?(.+)$/m)?.[1];
    const operation = plusHeader === "/dev/null" ? "delete" : minusHeader === "/dev/null" ? "add" : "update";
    const filePath = index === 0 && firstFilePath ? firstFilePath : operation === "delete" ? minusHeader : plusHeader ?? minusHeader;
    if (!filePath || filePath === "/dev/null") continue;
    edits.push({ filePath, operation, unifiedDiff: unifiedDiffBody(section) });
  }
  return edits;
}
function normalizePatchOperation(value) {
  switch (value) {
    case "add":
    case "added":
      return "add";
    case "delete":
    case "deleted":
      return "delete";
    case "update":
    case "updated":
    case "modify":
    case "modified":
      return "update";
    default:
      return void 0;
  }
}
function patchMetadataEdits(value) {
  if (!isRecord(value)) return [];
  for (const candidate of [value, value.metadata, value.details, value.result]) {
    if (!isRecord(candidate) || !Array.isArray(candidate.files)) continue;
    const edits = candidate.files.flatMap((file) => {
      if (!isRecord(file)) return [];
      const filePath = typeof file.file === "string" ? file.file : typeof file.relativePath === "string" ? file.relativePath : typeof file.filePath === "string" ? file.filePath : void 0;
      const operation = normalizePatchOperation(file.status) ?? normalizePatchOperation(file.type);
      if (!filePath || !operation) return [];
      const diff = typeof file.patch === "string" ? file.patch : typeof file.diff === "string" ? file.diff : void 0;
      if (diff === void 0) return [];
      return [{ filePath, operation, unifiedDiff: unifiedDiffBody(diff) }];
    });
    if (edits.length > 0) return edits;
  }
  return [];
}
function previewDiffToUnifiedDiff(diff) {
  return diff.replace(/\r\n?/g, "\n").split("\n").filter((line, index, lines2) => !(index === lines2.length - 1 && line === "")).map((line) => {
    const match = line.match(/^([+\- ])\s*\d+\s(.*)$/);
    return match?.[1] && match[2] !== void 0 ? `${match[1]}${match[2]}` : line;
  }).join("\n");
}
function patchPreviewEdits(value) {
  if (!isRecord(value)) return [];
  const nested = [value, value.details, value.result].find((candidate) => {
    if (!isRecord(candidate)) return false;
    return isRecord(candidate.preview) || isRecord(candidate.details) && isRecord(candidate.details.preview);
  });
  if (!isRecord(nested)) return [];
  const details = isRecord(nested.details) ? nested.details : nested;
  const preview = isRecord(details.preview) ? details.preview : void 0;
  const files = preview && Array.isArray(preview.files) ? preview.files : void 0;
  if (!files) return [];
  return files.flatMap((file) => {
    if (!isRecord(file) || typeof file.filePath !== "string") return [];
    const operation = file.operation;
    if (operation !== "add" && operation !== "delete" && operation !== "update") return [];
    return [{
      filePath: file.filePath,
      operation,
      unifiedDiff: typeof file.diff === "string" ? previewDiffToUnifiedDiff(file.diff) : ""
    }];
  });
}
function extractApplyPatchEdits(input, output, metadata) {
  const metadataEdits = patchMetadataEdits(metadata);
  if (metadataEdits.length > 0) return metadataEdits;
  const outputEdits = patchPreviewEdits(output);
  if (outputEdits.length > 0) return outputEdits;
  if (isRecord(input) && input.type === "edit" && typeof input.unifiedDiff === "string") {
    return unifiedDiffEdits(input.unifiedDiff, typeof input.filePath === "string" ? input.filePath : void 0);
  }
  const inputText = applyPatchInput(input);
  if (inputText) {
    const parsed = patchInputEdits(inputText);
    if (parsed.length > 0) return parsed;
    if (inputText.includes("diff --git ")) return unifiedDiffEdits(inputText);
  }
  if (typeof output === "string" && output.includes("diff --git ")) return unifiedDiffEdits(output);
  return [];
}
function isApplyPatchTool(toolName) {
  return applyPatchToolName(toolName);
}
function diffStatsFromUnifiedDiff(unifiedDiff) {
  let additions = 0;
  let deletions = 0;
  const lines2 = unifiedDiff.replace(/\r/g, "").split("\n");
  const firstHunk = lines2.findIndex((line) => line.startsWith("@@"));
  for (const [index, line] of lines2.entries()) {
    if (line.startsWith("@@") || isDiffFileHeader(line, index, firstHunk)) continue;
    if (line.startsWith("+")) additions += 1;
    else if (line.startsWith("-")) deletions += 1;
  }
  return { additions, deletions };
}
function splitDiffLines(text2) {
  const normalized = text2.replace(/\r/g, "");
  if (!normalized) return { lines: [], hasTrailingNewline: false };
  const hasTrailingNewline = normalized.endsWith("\n");
  const rawLines = normalized.split("\n");
  if (hasTrailingNewline) rawLines.pop();
  return { lines: rawLines, hasTrailingNewline };
}
var LINE_DIFF_MAX_CELLS = 5e5;
var LINE_DIFF_MAX_LINES = 2500;
function computeLineDiff(oldText, newText) {
  if (oldText.length + newText.length > MAX_DIFF_CHARS) {
    return [
      ...oldText ? [{ kind: "remove", text: t2("sharedPresentation.oldContents", { count: oldText.length.toLocaleString() }) }] : [],
      ...newText ? [{ kind: "add", text: t2("sharedPresentation.newContents", { count: newText.length.toLocaleString() }) }] : []
    ];
  }
  const { lines: oldLines, hasTrailingNewline: oldHasNewline } = splitDiffLines(oldText);
  const { lines: newLines, hasTrailingNewline: newHasNewline } = splitDiffLines(newText);
  const m = oldLines.length;
  const n = newLines.length;
  if (m === 0 && n === 0) return [];
  if (m === 0) return newLines.map((text2) => ({ kind: "add", text: text2 }));
  if (n === 0) return oldLines.map((text2) => ({ kind: "remove", text: text2 }));
  let start = 0;
  while (start < m && start < n && oldLines[start] === newLines[start]) {
    start++;
  }
  let oldEnd = m - 1;
  let newEnd = n - 1;
  while (oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) {
    oldEnd--;
    newEnd--;
  }
  if (start >= m && start >= n && oldHasNewline !== newHasNewline) {
    const lastLine = oldLines[m - 1] ?? "";
    const prefix2 = oldLines.slice(0, m - 1).map((text2) => ({ kind: "context", text: text2 }));
    return [...prefix2, { kind: "remove", text: lastLine }, { kind: "add", text: lastLine }];
  }
  const prefix = oldLines.slice(0, start).map((text2) => ({ kind: "context", text: text2 }));
  const suffix = oldLines.slice(oldEnd + 1).map((text2) => ({ kind: "context", text: text2 }));
  const trimmedOld = oldLines.slice(start, oldEnd + 1);
  const trimmedNew = newLines.slice(start, newEnd + 1);
  const tM = trimmedOld.length;
  const tN = trimmedNew.length;
  if (tM === 0 && tN === 0) return prefix.concat(suffix);
  if (tM * tN > LINE_DIFF_MAX_CELLS || tM + tN > LINE_DIFF_MAX_LINES) {
    const fallback = [
      ...trimmedOld.map((text2) => ({ kind: "remove", text: text2 })),
      ...trimmedNew.map((text2) => ({ kind: "add", text: text2 }))
    ];
    return prefix.concat(fallback, suffix);
  }
  const dp = Array.from(
    { length: tM + 1 },
    () => Array.from({ length: tN + 1 }, () => 0)
  );
  for (let i2 = 0; i2 < tM; i2++) {
    for (let j2 = 0; j2 < tN; j2++) {
      if (trimmedOld[i2] === trimmedNew[j2]) {
        dp[i2 + 1][j2 + 1] = dp[i2][j2] + 1;
      } else {
        dp[i2 + 1][j2 + 1] = Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
      }
    }
  }
  const middle = [];
  let i = tM;
  let j = tN;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && trimmedOld[i - 1] === trimmedNew[j - 1]) {
      middle.push({ kind: "context", text: trimmedOld[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      middle.push({ kind: "add", text: trimmedNew[j - 1] });
      j--;
    } else if (i > 0) {
      middle.push({ kind: "remove", text: trimmedOld[i - 1] });
      i--;
    }
  }
  return prefix.concat(middle.reverse(), suffix);
}
function countLines(value) {
  if (!value) return 0;
  const lines2 = value.replace(/\r/g, "").split("\n");
  return lines2.at(-1) === "" ? lines2.length - 1 : lines2.length;
}
function diffStatsFromStrings(oldString, newString) {
  if (oldString.length + newString.length > MAX_DIFF_CHARS) {
    return { additions: countLines(newString), deletions: countLines(oldString) };
  }
  let additions = 0;
  let deletions = 0;
  for (const line of computeLineDiff(oldString, newString)) {
    if (line.kind === "add") additions += 1;
    else if (line.kind === "remove") deletions += 1;
  }
  return { additions, deletions };
}
function effectiveUnifiedDiff(detail) {
  const diff = detail.unifiedDiff;
  if (diff === void 0 || diff.trim() === "") return void 0;
  return diff;
}
function opencodePatchBody(patch) {
  const lines2 = patch.replace(/\r\n?/g, "\n").split("\n");
  const firstHunk = lines2.findIndex((line) => line.startsWith("@@"));
  if (firstHunk === -1) return void 0;
  const body = lines2.slice(firstHunk).filter((line) => !line.startsWith("\\"));
  if (body.at(-1) === "") body.pop();
  return body.join("\n");
}
function nonBlankString(value) {
  return typeof value === "string" && value.trim() !== "" ? value : void 0;
}
function opencodeMetadataPatch(metadata, filePath) {
  if (!isRecord(metadata)) return void 0;
  if (Array.isArray(metadata.files)) {
    const files = metadata.files.filter(isRecord);
    const match = files.find((file) => file.file === filePath) ?? (files.length === 1 ? files[0] : void 0);
    const patch = nonBlankString(match?.patch);
    if (patch) return patch;
  }
  if (isRecord(metadata.filediff)) {
    const patch = nonBlankString(metadata.filediff.patch);
    if (patch) return patch;
  }
  return nonBlankString(metadata.diff);
}
function withMetadataEditDiff(item) {
  const detail = item.detail;
  if (detail.type !== "edit" || effectiveUnifiedDiff(detail) !== void 0) return item;
  const patch = opencodeMetadataPatch(item.metadata, detail.filePath);
  const unifiedDiff = patch ? opencodePatchBody(patch) : void 0;
  if (!unifiedDiff) return item;
  return { ...item, detail: { ...detail, unifiedDiff } };
}
function hasEditDiffContent(detail) {
  return effectiveUnifiedDiff(detail) !== void 0 || detail.oldString !== void 0 || detail.newString !== void 0;
}
function isHostTruncatedDiff(text2) {
  return /\n\.\.\.\[truncated \d{1,12} chars\]\s*$/.test(text2.slice(-80));
}
function isCoarseLineDiff(oldText, newText) {
  if (oldText.length + newText.length > MAX_DIFF_CHARS) return true;
  const before = splitDiffLines(oldText).lines;
  const after = splitDiffLines(newText).lines;
  if (before.length === 0 || after.length === 0) return false;
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let oldEnd = before.length - 1;
  let newEnd = after.length - 1;
  while (oldEnd >= start && newEnd >= start && before[oldEnd] === after[newEnd]) {
    oldEnd--;
    newEnd--;
  }
  const removedSpan = Math.max(0, oldEnd - start + 1);
  const addedSpan = Math.max(0, newEnd - start + 1);
  return removedSpan * addedSpan > LINE_DIFF_MAX_CELLS || removedSpan + addedSpan > LINE_DIFF_MAX_LINES;
}
function exactDiffStatsForDetail(detail) {
  const unifiedDiff = effectiveUnifiedDiff(detail);
  if (unifiedDiff !== void 0) {
    return unifiedDiff.length > MAX_DIFF_CHARS || isHostTruncatedDiff(unifiedDiff) ? null : diffStatsFromUnifiedDiff(unifiedDiff);
  }
  if (!hasEditDiffContent(detail)) return null;
  const oldString = detail.oldString ?? "";
  const newString = detail.newString ?? "";
  return isCoarseLineDiff(oldString, newString) ? null : diffStatsFromStrings(oldString, newString);
}
function shellSummary(detail) {
  return compactText(detail.command);
}
function detailFilePath(detail) {
  if (detail.type === "read" || detail.type === "edit" || detail.type === "write") {
    return detail.filePath || void 0;
  }
  return void 0;
}
function isDirectoryRead(filePath, content) {
  if (filePath && /[/\\]$/.test(filePath.trim())) return true;
  if (content) {
    const normalized = content.trimStart().toLowerCase();
    if (normalized.startsWith("read directory")) return true;
  }
  return false;
}
function firstCodeLine(code) {
  const line = code.split("\n").find((entry) => entry.trim());
  return line ? compactText(line.trim(), 120) : void 0;
}
function resolveCodeModePresentation(input, output) {
  const code = extractCodeModeCode(input);
  const parsed = code ? parseCodeModeCalls(code) : { calls: [] };
  const catalog = parseCodeModeCatalog(output);
  const searchQuery = parsed.searchQuery;
  if ((searchQuery || parsed.calls.length === 0) && catalog) {
    return {
      category: "search",
      icon: "Search",
      label: "Search Tools",
      summary: searchQuery ? compactText(searchQuery, 120) : t2("sharedPresentation.toolsCount", { count: catalog.items.length })
    };
  }
  if (parsed.calls.length === 1) {
    const call = parsed.calls[0];
    if (!call) {
      return { category: "agent", icon: "SquareTerminal", label: "Code Mode" };
    }
    const exaKind = exaToolKind(call.path);
    if (exaKind) {
      return {
        category: exaKind === "agent" ? "agent" : "search",
        icon: exaToolIcon(exaKind),
        label: exaToolLabel(exaKind),
        summary: call.query ? compactText(call.query, 120) : exaToolSummary(exaKind, { query: call.query })
      };
    }
    const githubKind = githubToolKind(call.path);
    if (githubKind) {
      return {
        category: "search",
        icon: githubToolIcon(githubKind),
        label: githubToolLabel(githubKind),
        summary: call.query ? compactText(call.query, 120) : void 0
      };
    }
    return {
      category: "agent",
      icon: "SquareTerminal",
      label: prettyToolName(call.tool),
      summary: call.query ? compactText(call.query, 120) : compactText(call.path, 120)
    };
  }
  if (parsed.calls.length > 1) {
    const shown3 = parsed.calls.slice(0, 2).map((call) => call.tool).join(t2("sharedPresentation.callSeparator"));
    return {
      category: "agent",
      icon: "SquareTerminal",
      label: "Code Mode",
      summary: compactText(t2(parsed.calls.length > 2 ? "sharedPresentation.callsAndOthers" : "sharedPresentation.calls", { count: parsed.calls.length, names: shown3 }), 180)
    };
  }
  if (searchQuery) {
    return {
      category: "search",
      icon: "Search",
      label: "Search Tools",
      summary: compactText(searchQuery, 120)
    };
  }
  return {
    category: "agent",
    icon: "SquareTerminal",
    label: "Code Mode",
    summary: code ? firstCodeLine(code) : void 0
  };
}
function resolveToolCallPresentation(item) {
  const name = item.name.trim().toLowerCase();
  const detail = normalizeToolCallDetail(item.detail, item.name);
  if (piSubagentOperation(item.name) && (detail.type === "unknown" || detail.type === "sub_agent")) {
    return piSubagentPresentation(
      item.name,
      detail.type === "unknown" ? detail.input : void 0,
      detail.type === "unknown" ? detail.output : detail.log,
      detail.type === "sub_agent" ? detail.description : void 0,
      detail.type === "sub_agent" ? detail.subAgentType : void 0
    );
  }
  if (isSkillTool(item.name)) {
    const skillName = skillNameForDetail(detail);
    return {
      category: "agent",
      icon: "Sparkles",
      label: "Skill",
      ...skillName ? { summary: skillName } : {}
    };
  }
  if (isAskTool(item.name) && (detail.type === "unknown" || detail.type === "plain_text")) {
    const first = askContent(detail).questions[0]?.question ?? (detail.type === "plain_text" && detail.text ? detail.text : void 0);
    const summary = first ? compactText(first) : void 0;
    return { category: "communication", icon: "MessageCircleQuestionMark", label: "Ask Question", ...summary ? { summary } : {} };
  }
  const filePath = detailFilePath(detail);
  const commonFileFields = filePath ? {
    filePath,
    fileIcon: fileIconForPath(filePath),
    language: languageForFilePath(filePath)
  } : {};
  switch (detail.type) {
    case "shell":
      return {
        category: "shell",
        icon: "SquareTerminal",
        label: "Shell",
        summary: shellSummary(detail)
      };
    case "worktree_setup":
      return {
        category: "shell",
        icon: "GitBranch",
        label: "Worktree Setup",
        summary: compactText(detail.branchName || detail.worktreePath)
      };
    case "read": {
      if (isDirectoryRead(detail.filePath, detail.content)) {
        return {
          category: "file",
          icon: "Folder",
          label: "List",
          summary: compactText(detail.filePath),
          ...filePath ? { filePath, fileIcon: "Folder" } : {}
        };
      }
      return {
        category: "file",
        icon: commonFileFields.fileIcon ?? "Eye",
        label: "Read",
        summary: compactText(detail.filePath),
        ...commonFileFields
      };
    }
    case "edit": {
      const diffStats = exactDiffStatsForDetail(detail);
      return {
        category: "file",
        icon: commonFileFields.fileIcon ?? "Pencil",
        label: "Edit",
        summary: compactText(detail.filePath),
        ...diffStats ? { diffStats } : {},
        ...commonFileFields
      };
    }
    case "write":
      return {
        category: "file",
        icon: commonFileFields.fileIcon ?? "Pencil",
        label: "Write",
        summary: compactText(detail.filePath),
        ...commonFileFields
      };
    case "search":
      return {
        category: "search",
        icon: "Search",
        label: "Search",
        summary: compactText(detail.query)
      };
    case "fetch":
      return {
        category: "search",
        icon: "Globe",
        label: "Fetch URL",
        summary: compactText(detail.url)
      };
    case "sub_agent":
      return {
        category: "agent",
        icon: "Bot",
        label: "Agent Task",
        summary: detail.description ? compactText(detail.description) : compactText(detail.subAgentType ?? "")
      };
    case "plain_text":
      return {
        category: "communication",
        icon: iconNameFromProtocol(detail.icon) ?? "Wrench",
        label: detail.label || prettyToolName(item.name),
        // 0.5.0: plain-text results can be terminal output; the one-line summary shows them without escape sequences.
        summary: detail.text ? compactText(stripAnsi(detail.text)) : void 0
      };
    case "plan":
      return {
        category: "plan",
        icon: "ListChecks",
        label: "Plan"
      };
    case "unknown": {
      if (isCodeModeTool(item.name)) {
        return resolveCodeModePresentation(detail.input, detail.output);
      }
      if (name === "thinking") {
        return { category: "plan", icon: "Brain", label: "Thinking" };
      }
      if (name === "ls") {
        return { category: "file", icon: "List", label: "List" };
      }
      if (isOpencodeSubagentTool(item.name)) {
        return {
          category: "agent",
          icon: "Bot",
          label: "Agent Task",
          summary: opencodeSubagentSummary(detail.input, detail.output)
        };
      }
      if (isAskTool(item.name)) {
        return { category: "communication", icon: "MessageCircleQuestionMark", label: "Ask Question" };
      }
      if (name === "speak") {
        return { category: "communication", icon: "MicVocal", label: "Speak" };
      }
      if (isSubagentSupervisorTool(item.name)) {
        return {
          category: "agent",
          icon: "Reply",
          label: subagentSupervisorLabel(detail.input),
          summary: subagentSupervisorSummary(detail.input, detail.output)
        };
      }
      if (isBgWaitTool(item.name)) {
        return {
          category: "agent",
          icon: "Hourglass",
          label: bgWaitLabel(detail.input),
          summary: bgWaitSummary(detail.input, detail.output)
        };
      }
      if (isOmpWaitTool(item.name)) {
        return {
          category: "agent",
          icon: "Hourglass",
          label: ompWaitLabel(detail.output),
          summary: ompWaitSummary(detail.input, detail.output)
        };
      }
      if (isTodoTool(item.name)) {
        return {
          category: "plan",
          icon: "ListChecks",
          label: "Tasks",
          summary: todoToolSummary(detail.output)
        };
      }
      const githubKind = githubToolKind(item.name);
      if (githubKind) {
        return {
          category: githubKind === "pull-request" || githubKind === "actions-run" ? "agent" : "search",
          icon: githubToolIcon(githubKind),
          label: githubToolLabel(githubKind),
          summary: githubToolSummary(githubKind, detail.input)
        };
      }
      const exaKind = exaToolKind(item.name);
      if (exaKind) {
        return {
          category: exaKind === "agent" ? "agent" : "search",
          icon: exaToolIcon(exaKind),
          label: exaToolLabel(exaKind),
          summary: exaToolSummary(exaKind, detail.input)
        };
      }
      const paseoLabel = paseoToolLabel(item.name);
      if (paseoLabel) {
        return {
          category: paseoToolCategory(item.name) ?? "unknown",
          icon: paseoToolIcon(item.name) ?? "Sparkles",
          label: `Paseo ${paseoLabel}`,
          summary: paseoToolSummary(item.name, detail.input)
        };
      }
      return {
        category: "unknown",
        icon: "Wrench",
        label: prettyToolName(item.name)
      };
    }
  }
}
function formatUnknownValue(value) {
  if (typeof value === "string") {
    const formatted = prettyJson(value);
    return formatted ?? value;
  }
  try {
    const raw = JSON.stringify(value);
    if (raw === void 0) return String(value);
    const formatted = prettyJson(raw);
    return formatted ?? JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
function errorText2(value, maxLength = 1200) {
  const normalized = trimSpacesBeforeLineBreaks(value.replace(/\r\n?/g, "\n")).replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return void 0;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}\u2026` : normalized;
}
function formatError(error) {
  if (error === null || error === void 0) return void 0;
  if (typeof error === "object" && !Array.isArray(error)) {
    const content = error.content;
    if (typeof content === "string" && content.trim()) return errorText2(content);
    const message = error.message;
    if (typeof message === "string" && message.trim()) return errorText2(message);
    if (Array.isArray(content)) {
      const text3 = content.filter(
        (part) => part !== null && typeof part === "object" && !Array.isArray(part) && part.type === "text" && typeof part.text === "string"
      ).map((part) => part.text).join("\n");
      if (text3) return errorText2(text3);
    }
  }
  const text2 = typeof error === "string" ? error : formatUnknownValue(error);
  return errorText2(text2);
}
function formatReasoningText(text2) {
  if (!text2) return "";
  const parts = text2.split(/(```[\s\S]*?(?:```|$)|`[^`\n]+`)/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part;
    return part.replace(/(\*\*[^*\s\n](?:[^*\n]*?[^*\s\n])?\*\*)\s*(?=\*\*)/g, "$1\n\n");
  }).join("");
}

// resources/third-party/default-features/vivid-activity/shared/turn-time.ts
var import_zod5 = require("zod");
var TURN_TIME_RENDERER_KIND = "vivid-turn-time";
var TURN_TIME_RENDERER_VERSION = 1;
var turnTimeDataSchema = import_zod5.z.object({
  /** 这一轮结束的时刻（ms）。 */
  at: import_zod5.z.number().nonnegative(),
  /** Paseo 的 `turnId`；provider 没给时为 null。 */
  turnId: import_zod5.z.string().max(200).nullable(),
  outcome: import_zod5.z.enum(["completed", "failed", "canceled"])
});

// resources/third-party/default-features/vivid-activity/server/host-routes.ts
var LOCAL = { kind: "local" };
var DIRECTORY_MS = 6e4;
var routes = /* @__PURE__ */ new WeakMap();
async function hostRoute(paseo, serverId, options = {}) {
  const hosts = paseo.hosts;
  if (!serverId || !hosts || typeof hosts.list !== "function" || typeof hosts.client !== "function") return LOCAL;
  const now = options.now ?? Date.now;
  let state = routes.get(paseo);
  if (!state) {
    state = { directory: null, entries: /* @__PURE__ */ new Map() };
    routes.set(paseo, state);
  }
  if (!state.directory || now() - state.directory.at > DIRECTORY_MS) {
    const value = hosts.list().catch(() => null);
    state.directory = { at: now(), value };
    void value.then((directory2) => {
      if (!directory2 && state.directory?.value === value) state.directory = null;
    });
  }
  const directory = await state.directory.value;
  if (!directory || directory.self.serverId === serverId) return LOCAL;
  const listed = directory.hosts.find((entry2) => entry2.serverId === serverId);
  const host = [...listed?.label?.trim() || serverId].slice(0, 48).join("");
  if (!listed) return { kind: "offline", host };
  let entry = state.entries.get(serverId);
  if (!entry) {
    const connectMs = options.connectMs ?? 8e3;
    const api2 = new Promise((resolve4, reject) => {
      let late = false;
      const timer = setTimeout(() => {
        late = true;
        reject(new Error("host_offline"));
      }, connectMs);
      hosts.client(serverId).then((borrowed) => {
        clearTimeout(timer);
        if (late) void borrowed.dispose().catch(() => void 0);
        else resolve4(borrowed);
      }, (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    entry = { api: api2, users: 0, timer: null };
    state.entries.set(serverId, entry);
  }
  const current = entry;
  current.users += 1;
  if (current.timer !== null) {
    clearTimeout(current.timer);
    current.timer = null;
  }
  const drop = () => {
    if (state.entries.get(serverId) === current) state.entries.delete(serverId);
    if (current.timer !== null) {
      clearTimeout(current.timer);
      current.timer = null;
    }
    void current.api.then((borrowed) => borrowed.dispose()).catch(() => void 0);
  };
  let api;
  try {
    api = await current.api;
  } catch {
    current.users -= 1;
    drop();
    return { kind: "offline", host };
  }
  let released = false;
  return {
    kind: "remote",
    api,
    host,
    release(broken) {
      if (released) return;
      released = true;
      current.users -= 1;
      if (broken) {
        drop();
        return;
      }
      if (current.users === 0 && state.entries.get(serverId) === current) current.timer = setTimeout(drop, options.idleMs ?? 6e4);
    }
  };
}

// resources/third-party/default-features/vivid-activity/server/child-summary.ts
var LEVELS = { info: "childSummary.notification", warning: "childSummary.warning", warn: "childSummary.warning", error: "childSummary.error", success: "childSummary.success" };
function clip(value, bytes) {
  if (!value) return void 0;
  const text2 = value.replace(/\s+/g, " ").trim();
  if (!text2) return void 0;
  if (Buffer.byteLength(JSON.stringify(text2)) - 2 <= bytes) return text2;
  let result = "";
  for (const point of text2) {
    if (Buffer.byteLength(JSON.stringify(result + point + "\u2026")) - 2 > bytes) break;
    result += point;
  }
  return result + "\u2026";
}
function childSummaryRow(entry) {
  const item = entry.item;
  const row = { k: String(entry.seqStart), i: "Puzzle", t: t2("childSummary.activity"), c: "unknown" };
  switch (item.type) {
    case "reasoning":
      Object.assign(row, { i: "Brain", t: t2("childSummary.thinking"), x: formatReasoningText(item.text), c: "reasoning" });
      break;
    case "tool_call": {
      const presentation = resolveToolCallPresentation(item);
      Object.assign(row, { i: presentation.icon, t: zh(presentation.label), x: presentation.summary, c: presentation.category, s: item.status });
      break;
    }
    case "assistant_message":
      Object.assign(row, { i: "MessageSquare", t: t2("childSummary.agent"), x: item.text, c: "communication" });
      break;
    case "user_message":
      Object.assign(row, { i: "MessageSquare", t: t2("childSummary.prompt"), x: item.text, c: "communication" });
      break;
    case "todo":
      Object.assign(row, { i: "ListChecks", t: t2("childSummary.tasks"), x: t2("childSummary.completed", { done: item.items.filter((task) => task.completed).length, total: item.items.length }), c: "plan" });
      break;
    case "error":
      Object.assign(row, { i: "CircleX", t: t2("childSummary.error"), x: item.message, c: "failed" });
      break;
    case "notification":
      Object.assign(row, { i: "Bell", t: LEVELS[item.level] ? t2(LEVELS[item.level]) : item.level, x: item.message, c: item.level === "error" ? "failed" : "communication" });
      break;
    case "compaction":
      Object.assign(row, { i: "Archive", t: t2("childSummary.compacted"), c: "plan", s: item.status });
      break;
    case "plugin":
      row.t = item.kind;
      break;
  }
  row.t = clip(row.t, 36) ?? t2("childSummary.activity");
  row.x = clip(row.x, 72);
  return row;
}
function cardStatus(agent) {
  return agent.archivedAt || !childLoaded(agent) ? "closed" : agent.status ?? null;
}
var TOKEN = /\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|glpat-[A-Za-z0-9_-]{16,}|xox[abprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/g;
function errorLine(value) {
  const line = typeof value === "string" ? value.split("\n").map((part) => part.trim()).find(Boolean) : void 0;
  if (!line) return null;
  const masked = line.replace(TOKEN, "[redacted]").replace(/\b(Bearer|token=|api[_-]?key=)\s*\S+/gi, "$1 [redacted]");
  return masked.length > 150 ? `${masked.slice(0, 149)}\u2026` : masked;
}
function cardAgent(agent, status) {
  const pending = Array.isArray(agent.pendingPermissions) ? agent.pendingPermissions : [];
  const waiting = status === "closed" || !pending.length ? null : pending.every((item) => !!item && typeof item === "object" && item.kind === "question") ? "question" : "approval";
  const error = status === "error" ? errorLine(agent.lastError) : null;
  return { status, ...waiting ? { waiting } : {}, ...error ? { error } : {} };
}
async function handleChildSummary(input, context) {
  if (input.agentId.startsWith("provider:")) return { status: "missing", agent: null, rows: [] };
  const route = await hostRoute(context.paseo, input.serverId);
  if (route.kind === "local") return summarize(input, context.paseo, null);
  if (route.kind === "offline") return { status: "offline", agent: null, rows: [], host: route.host };
  let broken = true;
  try {
    const output = await summarize(input, route.api, route.host);
    broken = output.status === "offline";
    return output;
  } finally {
    route.release(broken);
  }
}
async function summarize(input, paseo, host) {
  const where = host ? { host } : {};
  const missing = { status: "missing", agent: null, rows: [], ...where };
  const handle = paseo.agents.ref(input.agentId);
  let agent;
  try {
    agent = (await handle.refresh())?.agent ?? null;
  } catch (error) {
    if (/not found/i.test(error instanceof Error ? error.message : String(error))) return missing;
    if (host) return { status: "offline", agent: null, rows: [], host };
    if (!input.manual) return { status: "unconfirmed", agent: null, rows: [] };
    agent = void 0;
  }
  if (agent === null) return missing;
  const status = agent ? cardStatus(agent) : null;
  const current = status && agent ? cardAgent(agent, status) : null;
  if (!input.manual && !childReadable(status)) return { status: "closed", agent: current, rows: [], ...where };
  if (input.statusOnly) return { status: "ok", agent: current, rows: [], ...where };
  const page = await handle.timeline.refetch({ direction: "tail", limit: CHILD_TIMELINE_PAGE_SIZE, projection: "projected" });
  const after = page.agent ? cardStatus(page.agent) : status;
  const output = {
    status: "ok",
    agent: after ? cardAgent({ ...agent ?? {}, ...page.agent ?? {} }, after) : null,
    // This plugin's turn-end time row (server/turn-time.ts) is not something the child did: it never takes one of the three places.
    rows: recentChildTimelineEntries(page.entries.filter((entry) => !(entry.item.type === "plugin" && entry.item.kind === TURN_TIME_RENDERER_KIND))).slice(-3).map(childSummaryRow),
    ...where
  };
  const limit = 500 + (output.agent?.error ? Buffer.byteLength(JSON.stringify(output.agent.error)) : 0);
  while (Buffer.byteLength(JSON.stringify(output)) > limit) {
    const candidates = output.rows.filter((row) => row.x && Buffer.byteLength(row.x) > 3);
    const longest = candidates.sort((left, right) => Buffer.byteLength(right.x) - Buffer.byteLength(left.x))[0];
    if (longest) {
      const budget = Buffer.byteLength(longest.x) - 12;
      longest.x = budget < 6 ? void 0 : clip(longest.x, budget);
      continue;
    }
    const title = output.rows.filter((row) => Buffer.byteLength(row.t) > 12).sort((left, right) => Buffer.byteLength(right.t) - Buffer.byteLength(left.t))[0];
    if (!title) break;
    title.t = clip(title.t, 12);
  }
  return output;
}

// resources/third-party/default-features/vivid-activity/shared/child-summary.ts
var import_plugin5 = require("@getpaseo/plugin");
var import_zod6 = require("zod");
var childSummaryRowSchema = import_zod6.z.object({
  k: import_zod6.z.string().max(40),
  i: import_zod6.z.string().max(40),
  t: import_zod6.z.string().max(36),
  x: import_zod6.z.string().max(72).optional(),
  c: import_zod6.z.enum(["shell", "file", "search", "agent", "plan", "communication", "unknown", "reasoning", "failed"]),
  s: import_zod6.z.string().max(20).optional()
});
var childSummaryRpc = (0, import_plugin5.defineRpc)({
  name: "child-summary",
  input: import_zod6.z.object({
    agentId: import_zod6.z.string().min(1).max(256),
    /** Explicit user action may load a closed child's history, as in 0.5.0. */
    manual: import_zod6.z.boolean().optional(),
    statusOnly: import_zod6.z.boolean().optional(),
    /** Paseo 0.13: the host `create_agent` put the child on (its result's `serverId`); this host's own id reads here. */
    serverId: import_zod6.z.string().min(1).max(256).optional()
  }),
  output: import_zod6.z.object({
    /**
     * 0.6.0: unconfirmed: the daemon's status check failed, so whether the child is loaded is unknown and nothing was read.
     * 0.9.1: offline: the child runs on another host this daemon cannot reach now.
     */
    status: import_zod6.z.enum(["ok", "missing", "closed", "unconfirmed", "offline"]),
    /**
     * 0.10: `waiting`: the child waits for an approval or asks a question (its pending requests); `error`: the first line of its
     * error, masked, while it failed. Older servers send neither.
     */
    agent: import_zod6.z.object({ status: import_zod6.z.string().max(30), waiting: import_zod6.z.enum(["approval", "question"]).nullable().optional(), error: import_zod6.z.string().max(160).nullable().optional() }).nullable(),
    rows: import_zod6.z.array(childSummaryRowSchema).max(3),
    /** 0.9.1: the name of the other host the child runs on (Paseo 0.13 connected hosts); absent for a child on this host. */
    host: import_zod6.z.string().max(120).optional()
  })
});

// resources/third-party/default-features/vivid-activity/shared/fold-index.ts
var import_plugin6 = require("@getpaseo/plugin");
var import_zod7 = require("zod");

// resources/third-party/default-features/vivid-activity/shared/timing.ts
var MAX_UNWITNESSED_MS = 30 * 60 * 1e3;
function formatDuration(ms, options = {}) {
  if (ms === null || ms === void 0 || !Number.isFinite(ms) || ms < (options.live ? 0 : 100)) return null;
  if (!options.live && ms < 9950) return t2("timing.seconds", { count: (ms / 1e3).toFixed(1) });
  const seconds = options.live ? Math.floor(ms / 1e3) : Math.round(ms / 1e3);
  if (seconds < 60) return t2("timing.seconds", { count: seconds });
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? t2("timing.minutesSeconds", { minutes, seconds: rest }) : t2("timing.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? t2("timing.hoursMinutes", { hours, minutes: restMinutes }) : t2("timing.hours", { count: hours });
}

// resources/third-party/default-features/vivid-activity/shared/fold.ts
var SHOW = Object.freeze({ kind: "show" });
var HIDE = Object.freeze({ kind: "hide" });
function toolKey(callId) {
  return `t:${callId}`;
}
function hashText(text2) {
  let hash2 = 2166136261;
  for (let index = 0; index < text2.length; index++) {
    hash2 ^= text2.charCodeAt(index);
    hash2 = Math.imul(hash2, 16777619) >>> 0;
  }
  return hash2.toString(36);
}
var REASONING_KEY_SAMPLE = 64 * 1024;
function reasoningKey(text2) {
  const half = REASONING_KEY_SAMPLE / 2;
  const sample = text2.length <= REASONING_KEY_SAMPLE ? text2 : text2.slice(0, half) + text2.slice(-half);
  return `r:${text2.length.toString(36)}:${hashText(sample)}`;
}

// resources/third-party/default-features/vivid-activity/shared/changes.ts
var MAX_CALL_FILES = 64;
var MAX_PATCH_CHARS = 2e5;
function changePath(path, cwd) {
  let relative2 = path.trim();
  const root = cwd ? cwd.trim().replace(/\/+$/, "") : "";
  if (root && relative2.startsWith(`${root}/`)) relative2 = relative2.slice(root.length + 1);
  while (relative2.startsWith("./")) relative2 = relative2.slice(2);
  return relative2;
}
function fileId(path, cwd) {
  return hashText(changePath(path, cwd));
}
var ONE_UNCOUNTED = { files: [], uncounted: 1 };
function collector(cwd) {
  const files = /* @__PURE__ */ new Map();
  let uncounted = 0;
  return {
    add(path, added, removed) {
      const id = fileId(path, cwd);
      const known = files.get(id);
      if (known) {
        known[0] += added;
        known[1] += removed;
      } else {
        files.set(id, [added, removed]);
      }
    },
    skip() {
      uncounted += 1;
    },
    result() {
      if (files.size > MAX_CALL_FILES) return ONE_UNCOUNTED;
      if (files.size === 0 && uncounted === 0) return null;
      return { files: [...files].map(([file, [added, removed]]) => [file, added, removed]), uncounted };
    }
  };
}
function parsePatchText(text2) {
  if (text2.length > MAX_PATCH_CHARS) return null;
  const lines2 = text2.replace(/\r\n?/g, "\n").split("\n");
  let first = 0;
  while (first < lines2.length && lines2[first].trim() === "") first++;
  let last = lines2.length - 1;
  while (last >= first && lines2[last].trim() === "") last--;
  if (last <= first || lines2[first].trim() !== "*** Begin Patch" || lines2[last].trim() !== "*** End Patch") return null;
  const files = [];
  let current = null;
  const header = (line, prefix) => {
    if (!line.startsWith(prefix)) return null;
    const path = line.slice(prefix.length).trim();
    return path || null;
  };
  for (let index = first + 1; index < last; index++) {
    const line = lines2[index];
    const added = header(line, "*** Add File: ");
    const deleted = header(line, "*** Delete File: ");
    const updated = header(line, "*** Update File: ");
    if (added !== null || deleted !== null || updated !== null) {
      if (files.length >= MAX_CALL_FILES) return null;
      current = added !== null ? { path: added, kind: "add", lines: { added: 0, removed: 0 }, moved: false } : deleted !== null ? { path: deleted, kind: "delete", lines: null, moved: false } : { path: updated, kind: "update", lines: { added: 0, removed: 0 }, moved: false };
      files.push(current);
      continue;
    }
    if (line.startsWith("*** ")) {
      const moveTo = header(line, "*** Move to: ");
      if (moveTo !== null && current?.kind === "update" && !current.moved && current.lines.added + current.lines.removed === 0) {
        current.path = moveTo;
        current.moved = true;
        continue;
      }
      if (line.trim() === "*** End of File" && current?.kind === "update") continue;
      return null;
    }
    if (!current) {
      if (line.trim() === "") continue;
      return null;
    }
    if (current.kind === "delete") {
      if (line.trim() === "") continue;
      return null;
    }
    if (current.kind === "add") {
      if (line.startsWith("+")) current.lines.added += 1;
      else if (line !== "") return null;
      continue;
    }
    if (line.startsWith("@@") || line.startsWith(" ") || line === "") continue;
    if (line.startsWith("+")) current.lines.added += 1;
    else if (line.startsWith("-")) current.lines.removed += 1;
    else return null;
  }
  if (files.length === 0) return null;
  return files.map(({ path, lines: lines3 }) => ({ path, lines: lines3 }));
}
function patchTextOf(value) {
  let current = value;
  for (let depth = 0; depth < 4; depth++) {
    if (typeof current === "string") {
      const start = current.trimStart();
      if (start.startsWith("*** Begin Patch")) return current;
      if (!start.startsWith("{") || current.length > MAX_PATCH_CHARS) return null;
      try {
        current = JSON.parse(current);
      } catch {
        return null;
      }
      continue;
    }
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    const record3 = current;
    current = record3.input ?? record3.patch ?? record3.patchText;
  }
  return null;
}
function patchChanges(item, cwd) {
  const changes = collector(cwd);
  const fromMetadata = extractApplyPatchEdits(void 0, void 0, item.metadata);
  if (fromMetadata.length > 0) {
    if (fromMetadata.length > MAX_CALL_FILES) return ONE_UNCOUNTED;
    for (const edit of fromMetadata) {
      if (!edit.unifiedDiff.trim() || edit.unifiedDiff.length > MAX_DIFF_CHARS || isHostTruncatedDiff(edit.unifiedDiff)) {
        changes.skip();
        continue;
      }
      const stats = diffStatsFromUnifiedDiff(edit.unifiedDiff);
      changes.add(edit.filePath, stats.additions, stats.deletions);
    }
    return changes.result() ?? ONE_UNCOUNTED;
  }
  const text2 = item.detail?.type === "unknown" ? patchTextOf(item.detail.input) : null;
  const files = text2 === null ? null : parsePatchText(text2);
  if (!files) return ONE_UNCOUNTED;
  for (const file of files) {
    if (file.lines) changes.add(file.path, file.lines.added, file.lines.removed);
    else changes.skip();
  }
  return changes.result() ?? ONE_UNCOUNTED;
}
function toolChanges(item, cwd, normalized) {
  if (item.status !== "completed") return null;
  if (isApplyPatchTool(item.name)) return patchChanges(item, cwd);
  const detail = normalized ?? normalizeToolCallDetail(withMetadataEditDiff(item).detail, item.name);
  if (detail.type === "write") return ONE_UNCOUNTED;
  if (detail.type !== "edit" || !detail.filePath) return null;
  if (!hasEditDiffContent(detail)) return ONE_UNCOUNTED;
  const stats = exactDiffStatsForDetail(detail);
  if (!stats) return ONE_UNCOUNTED;
  if (stats.additions + stats.deletions === 0) return null;
  return { files: [[fileId(detail.filePath, cwd), stats.additions, stats.deletions]], uncounted: 0 };
}
function toolExitCode(item, normalized) {
  if (item.status !== "failed") return null;
  const detail = normalized ?? normalizeToolCallDetail(item.detail, item.name);
  if (detail.type !== "shell") return null;
  return exitCodeOf(detail, formatError(item.error));
}

// resources/third-party/default-features/vivid-activity/shared/notice.ts
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
var TASK_NOTICE_TOOL = "task_notification";
var QUOTED_START = /^(Background command|Background workflow|Background agent|Background task|Background job|Agent|Remote task|Monitor|Task)\s+["“]/i;
var QUOTED_LOOSE = /^(.*?)["”]\s+((?:finished|failed|was|were|stopped|completed|succeeded|done|is|appears|ended|script|stream|timed)\b[\s\S]*)$/i;
var QUOTED_KIND = {
  "background command": "command",
  "background workflow": "workflow",
  "background agent": "agent",
  "background task": "task",
  "background job": "task",
  agent: "agent",
  "remote task": "remote",
  monitor: "monitor",
  task: "task"
};
var SUMMARY_HEAD = 4096;
var ENDING_WINDOW = 512;
var MAX_SHOWN_CHARS = 2e3;
function shown2(value) {
  if (value.length <= MAX_SHOWN_CHARS) return value;
  const cut = value.charCodeAt(MAX_SHOWN_CHARS - 1) >= 55296 && value.charCodeAt(MAX_SHOWN_CHARS - 1) <= 56319 ? MAX_SHOWN_CHARS - 1 : MAX_SHOWN_CHARS;
  return `${value.slice(0, cut)}\u2026`;
}
var TEMPLATE_START = /^(Background|Agent|Remote|Monitor|Task|Cloud|The)\b|["“”]/i;
var exitCode = (tail) => /exit(?: code)? (-?\d+)/i.exec(tail)?.[1];
var withCode = (words, tail) => {
  const code = exitCode(tail);
  return code !== void 0 ? t2("notice.exitCode", { words, code }) : words;
};
var afterColon = (tail) => tail.replace(/^[^:]*:\s*/, "").trim();
function stillRunning(tail) {
  const start = /^is still running after /i.exec(tail);
  const rest = start ? tail.slice(start[0].length) : "";
  if (!start || /[\n\r\u2028\u2029]/.test(rest)) return null;
  const separator = /, with no new output for /gi;
  separator.lastIndex = 1;
  const found = separator.exec(rest);
  const quiet = found ? rest.slice(separator.lastIndex) : "";
  if (!found || !quiet) return null;
  return [rest.slice(0, found.index), quiet.length > 1 && quiet.endsWith(".") ? quiet.slice(0, -1) : quiet];
}
function commandTail(tail) {
  if (/^completed\b/i.test(tail)) return { tail: withCode(t2("notice.completed"), tail), state: null };
  if (/^failed\b/i.test(tail)) return { tail: withCode(t2("notice.failed"), tail), state: "failed" };
  if (/^was stopped because the system is running low on memory/i.test(tail)) return { tail: t2("notice.lowMemory"), state: "stopped" };
  if (/^was stopped after reaching its background time limit/i.test(tail)) return { tail: t2("notice.timeLimit"), state: "stopped" };
  if (/^was (stopped|killed)\b/i.test(tail)) return { tail: t2("notice.stopped"), state: "stopped" };
  const running = stillRunning(tail);
  if (running) return { tail: t2("notice.stillRunning", { ran: running[0], quiet: running[1] }), state: "info" };
  if (/^appears to be waiting for interactive input/i.test(tail)) return { tail: t2("notice.waitingInput"), state: "blocked" };
  return { tail: "", state: null };
}
function agentTail(tail) {
  if (/^finished\b/i.test(tail)) return { tail: t2("notice.completed"), state: "done" };
  const limit = /^stopped at its (\d+)-turn limit/i.exec(tail);
  if (limit) return { tail: t2("notice.turnLimit", { count: limit[1] }), state: "stopped" };
  if (/^failed\b/i.test(tail)) {
    const reason = afterColon(tail);
    return { tail: reason && reason !== tail ? t2("notice.failedReason", { reason }) : t2("notice.failed"), state: "failed" };
  }
  if (/^was stopped by user\b/i.test(tail)) return { tail: t2("notice.stoppedByUser"), state: "stopped" };
  if (/^was stopped by Claude\b/i.test(tail)) return { tail: t2("notice.stoppedByClaude"), state: "stopped" };
  if (/^was stopped:/i.test(tail)) return { tail: t2("notice.stoppedReason", { reason: afterColon(tail) }), state: "stopped" };
  if (/^was stopped\b/i.test(tail)) return { tail: t2("notice.stopped"), state: "stopped" };
  if (/^was resumed by the user\b/i.test(tail)) return { tail: t2("notice.resumedByUser"), state: "info" };
  if (/^was resumed by another agent\b/i.test(tail)) return { tail: t2("notice.resumedByAgent"), state: "info" };
  return { tail: "", state: null };
}
function monitorTail(tail) {
  if (/^ended without producing output/i.test(tail)) return { tail: withCode(t2("notice.endedNoOutput"), tail), state: "done" };
  if (/^stream ended\b/i.test(tail)) return { tail: t2("notice.streamEnded"), state: "done" };
  if (/^script failed\b/i.test(tail)) return { tail: withCode(t2("notice.scriptFailed"), tail), state: "failed" };
  if (/^stopped\b/i.test(tail)) return { tail: t2("notice.stopped"), state: "stopped" };
  return { tail: "", state: null };
}
function remoteTail(tail) {
  if (/^completed\b/i.test(tail)) return { tail: t2("notice.completed"), state: "done" };
  if (/^failed\b/i.test(tail)) return { tail: t2("notice.failed"), state: "failed" };
  if (/^is blocked:/i.test(tail)) return { tail: t2("notice.blockedReason", { reason: afterColon(tail) }), state: "blocked" };
  if (/^is blocked\b/i.test(tail)) return { tail: t2("notice.blocked"), state: "blocked" };
  if (/^was stopped\b/i.test(tail)) return { tail: t2("notice.stopped"), state: "stopped" };
  return { tail: "", state: null };
}
function taskTail(tail) {
  if (/^was stopped by the user\b/i.test(tail)) return { tail: t2("notice.stoppedByUser"), state: "stopped" };
  const by = /^was stopped by (.+?)\.?$/i.exec(tail);
  if (by) return { tail: t2("notice.stoppedBy", { name: by[1] }), state: "stopped" };
  return { tail: "", state: null };
}
function genericTail(tail) {
  if (/\b(fail|failed|error)\b/i.test(tail)) return { tail: withCode(t2("notice.failed"), tail), state: "failed" };
  if (/\btimed out\b/i.test(tail)) return { tail: t2("notice.timeout"), state: "stopped" };
  if (/\b(stopp?ed|killed|cancell?ed|interrupted)\b/i.test(tail)) return { tail: t2("notice.stopped"), state: "stopped" };
  if (/\b(completed?|finished|succeeded|done)\b/i.test(tail)) return { tail: withCode(t2("notice.completed"), tail), state: null };
  return { tail: "", state: null };
}
function hostEnd(raw) {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "completed") return "completed";
  if (value === "failed" || value === "error") return "failed";
  if (value === "killed" || value === "stopped" || value === "canceled" || value === "cancelled") return "stopped";
  return value === "blocked" ? "blocked" : null;
}
var ENDINGS = {
  agent: [
    { end: "completed", re: /["”] finished$/ },
    { end: "completed", re: /["”] stopped at its \d+-turn limit \(partial result[^"”]*\)$/ },
    { end: "stopped", re: /["”] was stopped(?: by (?:Claude|user))?$/ },
    { end: null, re: /["”] was resumed by (?:the user|another agent and now reports to it; its completion will not be delivered here\.)$/ },
    { end: "failed", lead: " failed: " },
    { end: "stopped", lead: " was stopped: " },
    // `Background agent "x" was checkpointed for the background fork but …`.
    { end: "failed", lead: " was checkpointed for the background fork but " }
  ],
  command: [
    { end: "completed", re: /["”] completed(?: \(exit code -?\d+(?:: [^"”]*)?\))?$/ },
    { end: "failed", re: /["”] failed(?: with exit code -?\d+)?$/ },
    { end: "stopped", re: /["”] was stopped(?: because the system is running low on memory| after reaching its background time limit)?$/ },
    { end: null, re: /["”] is still running after [^"”]+, with no new output for [^"”]+$/ },
    { end: null, re: /["”] appears to be waiting for interactive input$/ }
  ],
  monitor: [
    { end: "completed", re: /["”] ended without producing output(?: \(exit -?\d+\))?$/ },
    { end: "completed", re: /["”] stream ended$/ },
    { end: "failed", re: /["”] script failed(?: \(exit -?\d+\))?$/ },
    { end: "stopped", re: /["”] stopped$/ }
  ],
  remote: [
    { end: "completed", re: /["”] completed(?: successfully)?$/ },
    { end: "failed", re: /["”] failed$/ },
    { end: "blocked", re: /["”] is blocked$/ },
    { end: "stopped", re: /["”] was stopped$/ },
    { end: "blocked", lead: " is blocked: " }
  ],
  task: [{ end: "stopped", lead: " was stopped by " }],
  workflow: [{ end: "failed", lead: " was checkpointed for the background fork but " }]
};
function splitQuoted(kind, value, start, host) {
  const endings = ENDINGS[kind] ?? [];
  const fits = (ending) => host !== null && ending.end === host;
  const head = value.slice(0, SUMMARY_HEAD);
  const from = Math.max(start, value.length - ENDING_WINDOW);
  const last = value.slice(from);
  const split = (at) => ({ name: value.slice(start, at), tail: value.slice(at + 2, at + 2 + SUMMARY_HEAD), known: true });
  for (const group of [endings.filter(fits), endings.filter((ending) => !fits(ending))]) {
    for (const ending of group) {
      const found = ending.re?.exec(last);
      if (found && from + found.index >= start) return split(from + found.index);
    }
    for (const ending of group) {
      if (!ending.lead) continue;
      const inHead = quoteBefore(head, ending.lead, start);
      if (inHead >= start) return split(inHead);
      const inLast = quoteBefore(last, ending.lead, 0);
      if (inLast >= 0 && from + inLast >= start) return split(from + inLast);
    }
  }
  const loose = QUOTED_LOOSE.exec(head.slice(start));
  return loose ? { name: loose[1], tail: loose[2], known: false } : null;
}
function beforeLastQuote(text2) {
  const at = Math.max(text2.lastIndexOf('"'), text2.lastIndexOf("\u201D"));
  return at < 0 ? text2 : text2.slice(0, at);
}
function quoteBefore(text2, lead, from) {
  for (let at = text2.indexOf(lead, from + 1); at >= 0; at = text2.indexOf(lead, at + 1)) {
    if (text2[at - 1] === '"' || text2[at - 1] === "\u201D") return at - 1;
  }
  return -1;
}
function parseNoticeSummary(summary, taskType = null, hostStatus = null) {
  const value = summary.trim();
  const head = value.slice(0, SUMMARY_HEAD);
  if (taskType === "tool_call" || /^The \S+ call (finished|ended without a result)\b/i.test(head)) {
    const tool = /^The (\S+) call/i.exec(head)?.[1] ?? null;
    const failed2 = /^The \S+ call ended without a result/i.test(head);
    return { kind: "repeat", subject: tool && shown2(tool), tail: failed2 ? t2("notice.endedNoResult") : t2("notice.resultDelivered"), state: failed2 ? "failed" : null };
  }
  const event = /^Monitor event:\s*(?:["“]([^"”]*)["”]\s*([\s\S]*)|([\s\S]*))$/i.exec(head);
  if (event) return { kind: "event", subject: shown2((event[1] ?? event[3] ?? "").trim()) || null, tail: shown2((event[2] ?? "").trim()), state: "info" };
  const opening = QUOTED_START.exec(head);
  if (opening) {
    const kind = QUOTED_KIND[opening[1].toLowerCase()] ?? "other";
    const quoted2 = splitQuoted(kind, value, opening[0].length, hostEnd(hostStatus));
    const name = quoted2 ? quoted2.name : beforeLastQuote(head.slice(opening[0].length));
    const subject = name.trim() ? shown2(name) : null;
    if (!quoted2?.known) return { kind, subject, tail: "", state: null };
    const tail = quoted2.tail.trim();
    const own = kind === "command" ? commandTail(tail) : kind === "agent" ? agentTail(tail) : kind === "monitor" ? monitorTail(tail) : kind === "remote" ? remoteTail(tail) : kind === "task" ? taskTail(tail) : /could not be resumed/i.test(tail) ? { tail: t2("notice.resumeFailed"), state: "failed" } : { tail: "", state: null };
    const words = own.tail ? own : genericTail(tail);
    return { kind, subject, tail: shown2(words.tail), state: words.state };
  }
  if (/^Remote workflow completed:/i.test(head)) return { kind: "remote", subject: null, tail: t2("notice.remoteCompleted", { name: shown2(afterColon(head)) }), state: "done" };
  if (/^Remote task blocked on input:/i.test(head)) return { kind: "remote", subject: null, tail: t2("notice.remoteBlocked", { reason: shown2(afterColon(head)) }), state: "blocked" };
  if (/^Cloud review completed\b/i.test(head)) return { kind: "remote", subject: null, tail: t2("notice.cloudCompleted"), state: "done" };
  if (/^Cloud review failed:/i.test(head)) return { kind: "remote", subject: null, tail: t2("notice.cloudFailed", { reason: shown2(afterColon(head)) }), state: "failed" };
  if (/^Background task notification$/i.test(value)) return { kind: "other", subject: null, tail: "", state: "info" };
  if (!value || TEMPLATE_START.test(head)) return { kind: "other", subject: null, tail: genericTail(head).tail, state: genericTail(head).state };
  return { kind: "repeat", subject: shown2(value), tail: "", state: null };
}
function statusFrom(raw, rowStatus) {
  const value = (raw ?? rowStatus ?? "").toLowerCase();
  if (value === "failed" || value === "error") return "failed";
  if (value === "killed" || value === "stopped" || value === "canceled" || value === "cancelled") return "canceled";
  return "completed";
}
var STATUS_OF_STATE = { done: "completed", failed: "failed", blocked: "failed", stopped: "canceled", info: null };
function unescapeXml(value) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function resultOf(raw) {
  const open3 = raw.indexOf("<result>");
  if (open3 < 0) return null;
  const start = open3 + "<result>".length;
  const close = raw.indexOf("</result>", start);
  let value = close < 0 ? raw.slice(start) : raw.slice(start, close);
  if (value.startsWith("\n")) value = value.slice(1);
  if (value.endsWith("\n")) value = value.slice(0, -1);
  return value.trim() ? unescapeXml(value) : null;
}
function noticeTag(raw, tag2) {
  const open3 = raw.indexOf(`<${tag2}>`);
  if (open3 < 0) return null;
  const start = open3 + tag2.length + 2;
  const close = raw.indexOf(`</${tag2}>`, start);
  const value = (close < 0 ? raw.slice(start) : raw.slice(start, close)).trim();
  return value || null;
}
function readTaskNotice(item) {
  if (item.name !== TASK_NOTICE_TOOL) return null;
  const meta = record(item.metadata);
  if (meta.source !== void 0 && meta.source !== "claude_task_notification") return null;
  const detail = record(item.detail);
  const raw = typeof detail.text === "string" ? detail.text : "";
  const summary = text(detail.label) ?? (raw ? noticeTag(raw, "summary") : null) ?? text(detail.text) ?? "";
  const hostStatus = text(meta.status);
  const parsed = parseNoticeSummary(summary, raw ? noticeTag(raw, "task-type") : null, hostStatus);
  const reported = statusFrom(hostStatus, item.status);
  const result = raw ? resultOf(raw) : null;
  const state = reported === "failed" ? parsed.state === "blocked" ? "blocked" : "failed" : reported === "canceled" ? "stopped" : parsed.state ?? "done";
  return {
    ref: text(meta.toolUseId),
    taskId: text(meta.taskId),
    status: reported === "completed" ? STATUS_OF_STATE[state] ?? reported : reported,
    summary,
    kind: parsed.kind,
    state,
    subject: parsed.subject,
    outputFile: text(meta.outputFile),
    carriesResult: result !== null,
    result,
    hostStatus
  };
}
function isForegroundNotice(notice, row) {
  return notice !== null && notice.kind === "repeat" && notice.ref !== null && (notice.result === null || sameResult(row, notice.result));
}
var MAX_COMPARED_CHARS = 2e5;
function comparableResult(value) {
  if (!value || value.length > MAX_COMPARED_CHARS) return null;
  const lines2 = stripAnsi(value).replace(/\r\n/g, "\n").split("\n");
  let first = 0;
  let last = lines2.length;
  while (first < last && !lines2[first].trimEnd()) first++;
  while (last > first && !lines2[last - 1].trimEnd()) last--;
  const kept = [];
  for (let index = first; index < last; index++) kept.push(lines2[index].trimEnd());
  const text2 = kept.join("\n");
  return text2 && !pendingResult(text2) ? { text: text2 } : null;
}
function pendingResult(text2) {
  return text2.startsWith("[Still running") || text2.startsWith("Command running in background with ID: ") || text2.includes("Its result will be delivered to you on its own");
}
function sameResult(row, noticeResult) {
  if (!row || noticeResult.length < row.text.length) return false;
  return comparableResult(noticeResult)?.text === row.text;
}
function rowResultText(item) {
  const detail = record(item.detail);
  for (const value of [detail.output, detail.text, detail.content, detail.result]) if (typeof value === "string" && value) return value;
  const error = record(item.error);
  if (typeof error.message === "string" && error.message) return error.message;
  if (detail.output === void 0 || detail.output === null) return null;
  try {
    return JSON.stringify(detail.output);
  } catch {
    return null;
  }
}
function noticeLook(kind) {
  return kind === "agent" || kind === "remote" ? "agent" : "shell";
}

// resources/third-party/default-features/vivid-activity/shared/pi-notice.ts
function rec(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function str(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function int(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : void 0;
  return typeof value === "string" && /^\s*-?\d+\s*$/.test(value) ? Number(value) : void 0;
}
function list(value) {
  return Array.isArray(value) ? value : [];
}
function records(value) {
  return list(value).map(rec).filter((entry) => entry !== null);
}
function real(value) {
  return value && value !== "unavailable" ? value : void 0;
}
function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function lines(text2) {
  return text2.split(/\r?\n/);
}
var LINE_BREAK = /[\n\r\u2028\u2029]/;
var LINE_ENDS = ["\n", "\r", "\u2028", "\u2029"];
var quoted = (name) => name ? t2("piNotice.quoted", { name }) : "";
function unescapeXml2(value) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, "&");
}
var SPACE2 = /\s/;
function openingEnd(text2, at) {
  if (text2[at] === ">") return at + 1;
  if (!SPACE2.test(text2[at] ?? "")) return -1;
  for (let i = at + 1; i < text2.length; i++) {
    if (text2[i] === ">") return i + 1;
    if (text2[i] === "<") return -1;
  }
  return -1;
}
function closingTag(text2, name, from) {
  const lead = `</${name}`;
  for (let at = text2.indexOf(lead, from); at >= 0; at = text2.indexOf(lead, at + 1)) {
    let i = at + lead.length;
    while (i < text2.length && SPACE2.test(text2[i])) i++;
    if (text2[i] === ">") return [at, i + 1];
  }
  return null;
}
function tagBlocks(text2, name, limit = Number.POSITIVE_INFINITY) {
  const out = [];
  const open3 = `<${name}`;
  let from = 0;
  while (out.length < limit) {
    let inner = -1;
    for (let at = text2.indexOf(open3, from); at >= 0; at = text2.indexOf(open3, at + 1)) {
      inner = openingEnd(text2, at + open3.length);
      if (inner >= 0) break;
    }
    const close = inner < 0 ? null : closingTag(text2, name, inner);
    if (!close) break;
    out.push(text2.slice(inner, close[0]));
    from = close[1];
  }
  return out;
}
function tag(text2, name) {
  const value = tagBlocks(text2, name, 1)[0]?.trim();
  return value ? unescapeXml2(value) : void 0;
}
function blocks(text2, name) {
  return tagBlocks(text2, name);
}
function attr(text2, name) {
  const match = new RegExp(`\\s${escapeRe(name)}="([^"]*)"`).exec(text2);
  const value = match?.[1]?.trim();
  return value ? unescapeXml2(value) : void 0;
}
function lineValue(text2, label) {
  const match = new RegExp(`^${escapeRe(label)}:[ \\t]*(.+)$`, "m").exec(text2);
  return str(match?.[1]);
}
function tidy(rows) {
  const out = [];
  for (const row of rows) {
    const line = row.trimEnd();
    if (!line && (out.length === 0 || out[out.length - 1] === "")) continue;
    out.push(line);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}
var XML_TAG = /<(\/?)([A-Za-z][\w.:-]*)(?:\s[^<>]*)?\/?>/g;
function plainText(text2) {
  const closed = new Set(Array.from(text2.matchAll(/<\/([A-Za-z][\w.:-]*)\s*>/g), (match) => match[1].toLowerCase()));
  if (closed.size === 0) return tidy(lines(text2));
  let stripped = false;
  const out = text2.replace(XML_TAG, (whole, slash, name, at, all) => {
    if (!closed.has(name.toLowerCase())) return whole;
    stripped = true;
    return slash && all[at + whole.length] === "<" ? "\n" : "";
  });
  return stripped ? tidy(lines(unescapeXml2(out)).map((line) => line.trim())) : tidy(lines(text2));
}
function headline(text2) {
  for (const row of lines(text2 ?? "")) {
    const line = row.replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+•]\s+)/, "").replace(/\*\*|__/g, "").trim();
    if (line && !/^[-=_*`~]{3,}/.test(line)) return line;
  }
  return "";
}
var SUMMARY_MAX = 200;
function oneLine(value) {
  return value.replace(/\s+/g, (run) => run.includes("\n") || run.includes("\r") ? " " : run).trim();
}
function clip2(value, max = SUMMARY_MAX) {
  const chars = Array.from(value);
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}\u2026` : value;
}
function extra(body, header) {
  const text2 = body?.trim();
  return text2 && text2 !== header.trim() ? text2 : void 0;
}
function fields(...specs) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const spec of specs) {
    if (!spec) continue;
    const [label, raw, mono, id] = spec;
    const value = typeof raw === "number" ? Number.isFinite(raw) ? String(raw) : "" : typeof raw === "string" ? raw.trim() : "";
    if (!value) continue;
    let unique = label;
    for (let n = 2; seen.has(unique); n++) unique = `${label} ${n}`;
    seen.add(unique);
    const field = mono ? { label: unique, value, mono: true } : { label: unique, value };
    if (id) Object.defineProperty(field, "id", { value: id });
    out.push(field);
  }
  return out;
}
function duration(ms) {
  return ms !== void 0 && ms > 0 ? formatDuration(ms) ?? void 0 : void 0;
}
var STATUS = /* @__PURE__ */ statusTable();
function statusTable() {
  const table = /* @__PURE__ */ new Map();
  const define = (state, words, sentence, keys) => {
    for (const key of keys) table.set(key, { state, words, sentence });
  };
  define("done", "piNotice.completed", "piNotice.completedSentence", ["completed", "complete", "success", "succeeded", "successful", "done", "finished"]);
  define("failed", "piNotice.failed", "piNotice.failedSentence", ["failed", "failure", "error", "errored"]);
  define("stopped", "piNotice.stopped", "piNotice.stoppedSentence", ["killed", "stopped", "aborted", "interrupted"]);
  define("stopped", "piNotice.canceled", "piNotice.canceledSentence", ["cancelled", "canceled"]);
  define("stopped", "piNotice.paused", "piNotice.pausedSentence", ["paused"]);
  define("stopped", "piNotice.timeout", "piNotice.timeoutSentence", ["timed out", "timed_out", "timeout"]);
  define("running", "piNotice.running", "piNotice.runningSentence", ["running", "in_progress", "in-progress", "in progress", "started"]);
  define("running", "piNotice.queued", "piNotice.queuedSentence", ["queued", "pending"]);
  return table;
}
function statusKey(status) {
  return typeof status === "string" ? status.trim().toLowerCase() : "";
}
function piNoticeStatus(state) {
  return state === "failed" ? "failed" : state === "stopped" ? "canceled" : "completed";
}
function piNoticeState(status) {
  return STATUS.get(statusKey(status))?.state ?? "info";
}
function piStatusWords(status) {
  const id = STATUS.get(statusKey(status))?.words;
  return id ? t2(id) : typeof status === "string" ? status.trim() : "";
}
function outcome(status, extraWords, sentence = true) {
  const known = STATUS.get(statusKey(status));
  const words = status === void 0 ? "" : known ? t2(sentence ? known.sentence : known.words) : t2("piNotice.rawStatus", { status });
  if (!extraWords) return words;
  return words ? t2("piNotice.outcomeDetail", { words, detail: extraWords }) : extraWords;
}
function overall(states) {
  if (states.length === 0) return "info";
  if (states.includes("failed")) return "failed";
  if (states.includes("stopped")) return "stopped";
  if (states.includes("running")) return "running";
  return states.every((state) => state === "done") ? "done" : "info";
}
function tally(words) {
  const counts = /* @__PURE__ */ new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return joinList(Array.from(counts, ([word, count2]) => t2("piNotice.tallyCount", { count: count2, word })));
}
function backgroundTask({ text: text2, details }) {
  const d = rec(details) ?? {};
  const xml = /<background-task-notification\b/.test(text2) ? text2 : "";
  const name = str(d.name) ?? tag(xml, "task-name") ?? str(d.description);
  const status = str(d.status) ?? tag(xml, "status");
  const exit = d.exitCode !== void 0 ? int(d.exitCode) : int(tag(xml, "exit-code"));
  const signal = exit === void 0 ? str(d.signal) : void 0;
  const start = num(d.startTime);
  const end = num(d.endTime);
  const error = str(d.error) ?? tag(xml, "error");
  const outputFile = str(d.outputPath) ?? tag(xml, "output-file");
  const id = str(d.id) ?? tag(xml, "task-id");
  if (!name && !status && exit === void 0 && !error && !outputFile && !id) return null;
  const result = outcome(status, exit !== void 0 ? t2("piNotice.exitCode", { code: exit }) : signal ? t2("piNotice.signalCode", { signal }) : void 0);
  return {
    look: "shell",
    title: t2("piNotice.backgroundTask"),
    summary: name ? t2("piNotice.namedOutcome", { name: quoted(name), outcome: result }) : result || t2("piNotice.backgroundNotice"),
    state: piNoticeState(status),
    fields: fields(
      [t2("piNotice.task"), name],
      [t2("piNotice.status"), status ? piStatusWords(status) : void 0, false, "status"],
      [t2("piNotice.exitCodeLabel"), exit],
      [t2("piNotice.signal"), signal, true],
      [t2("piNotice.error"), error],
      [t2("piNotice.command"), str(d.command), true],
      [t2("piNotice.type"), d.isAgent === true ? t2("piNotice.backgroundAgent") : void 0],
      [t2("piNotice.model"), str(d.model), true],
      [t2("piNotice.outputFile"), outputFile, true],
      [t2("piNotice.duration"), start !== void 0 && end !== void 0 ? duration(end - start) : void 0],
      [t2("piNotice.taskId"), id, true]
    )
  };
}
var RUN_HEADER_START = /^(Background task|Detached foreground task) (completed|failed|paused|stopped): \*\*/;
var GROUP_HEADER = /^Background tasks completed \((\d+)\):(.*)$/;
var RUN_META = /^(Session|Session file|Session share error|Retention-managed async directory|Workflow run|Child runs|Reconciled detached child|Parallel handoff): (.*)$/;
var SAVED_OUTPUT = /^(?:Output saved to: (.+) \([^()\n]*\)\. Read this file if needed\.|Full output: (.+) \([^()\n]*\)\. Read it if needed\.)$/;
var ERROR_LINE = /^Error(?: \(([^)]*)\))?: (.+)$/;
var SESSION_ZH = { session: "piNotice.session", "session file": "piNotice.sessionFile", "session share error": "piNotice.sessionShareFailed" };
var BLOCKER_ZH = { addressed: "piNotice.addressed", unaddressed: "piNotice.unaddressed", stalemate: "piNotice.stalemate" };
function runHeader(line) {
  const start = RUN_HEADER_START.exec(line);
  const rest = start ? line.slice(start[0].length) : "";
  const close = start && !LINE_BREAK.test(rest) ? rest.indexOf("**", 1) : -1;
  return start && close >= 0 ? [start[1], start[2], rest.slice(0, close), rest.slice(close + 2)] : null;
}
var SCHEDULE_START = "Scheduled run from **";
var SCHEDULE_MID = "** (schedule ";
function scheduleLine(line) {
  if (!line.startsWith(SCHEDULE_START) || !line.endsWith(").") || line.length < SCHEDULE_START.length + 2) return null;
  const rest = line.slice(SCHEDULE_START.length, -2);
  const at = LINE_BREAK.test(rest) ? -1 : rest.indexOf(SCHEDULE_MID, 1);
  return at >= 0 && at + SCHEDULE_MID.length < rest.length ? [rest.slice(0, at), rest.slice(at + SCHEDULE_MID.length)] : null;
}
var SCHEDULED_RUN = " \u2014 scheduled run from ";
var SCHEDULED_ID = " (schedule ";
function scheduledRun(header) {
  const lastBreak = Math.max(...LINE_ENDS.map((mark) => header.lastIndexOf(mark)));
  const index = header.endsWith(")") ? header.indexOf(SCHEDULED_RUN, lastBreak + 1) : -1;
  const rest = index >= 0 ? header.slice(index + SCHEDULED_RUN.length, -1) : "";
  const at = index >= 0 ? rest.indexOf(SCHEDULED_ID, 1) : -1;
  return at >= 0 && at + SCHEDULED_ID.length < rest.length ? { index, name: rest.slice(0, at), id: rest.slice(at + SCHEDULED_ID.length) } : null;
}
var BLOCKER_STATES = ["addressed", "unaddressed", "stalemate"];
function blockerParts(line) {
  const state = line.startsWith("- ") && !LINE_BREAK.test(line) ? BLOCKER_STATES.find((word) => line.endsWith(` (${word})`)) : void 0;
  const middle = state ? line.slice(2, line.length - state.length - 3) : "";
  const at = state ? middle.indexOf(": ", 1) : -1;
  return state && at >= 0 && at + 2 < middle.length ? [middle.slice(0, at), middle.slice(at + 2), state] : null;
}
var PARENT_ACTION = "\n\nParent action: ";
function withoutParentAction(text2) {
  const at = text2.lastIndexOf(PARENT_ACTION);
  return at >= 0 && !text2.slice(at + PARENT_ACTION.length).trimEnd().includes("\n") ? text2.slice(0, at) : text2;
}
var SUBAGENT_OPEN = 'Subagent "';
function quotedSubagent(summary, ending) {
  const start = summary.indexOf(SUBAGENT_OPEN);
  const end = start >= 0 ? summary.lastIndexOf(`"${ending}`) : -1;
  return end >= start + SUBAGENT_OPEN.length ? summary.slice(start + SUBAGENT_OPEN.length, end) : void 0;
}
function requestIdList(text2) {
  const label = /request IDs: /gi;
  for (let match = label.exec(text2); match; match = label.exec(text2)) {
    const start = label.lastIndex;
    let at = start + 1;
    for (; at < text2.length && text2[at - 1] !== "\n"; at++) {
      if (text2[at] === "." && (at + 1 === text2.length || /\s/.test(text2[at + 1]))) return text2.slice(start, at);
    }
    label.lastIndex = at;
  }
  return void 0;
}
function merged(...parts) {
  const out = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part ?? {})) {
      if (value !== void 0 && !(Array.isArray(value) && value.length === 0)) out[key] = value;
    }
  }
  return out;
}
function scheduleText(name, id) {
  if (!id) return name;
  return name && name !== id ? t2("piNotice.scheduleName", { name, id }) : id;
}
function nameAndStatus(value) {
  const lineBreak = value.search(LINE_BREAK);
  if (value.endsWith(")")) {
    const inner = value.length >= 2 ? value.lastIndexOf(")", value.length - 2) : -1;
    const at = value.indexOf(" (", Math.max(0, inner - 1));
    if (at >= 0 && at <= value.length - 3 && (lineBreak < 0 || at <= lineBreak)) return [value.slice(0, at), value.slice(at + 2, -1)];
  }
  return lineBreak < 0 ? [value, void 0] : null;
}
function childRunsText(value) {
  const rows = value.split(/,\s+/).map((part) => {
    const match = nameAndStatus(part.trim());
    const raw = match?.[0] ?? part.trim();
    const at = raw.indexOf("=");
    const key = at >= 0 ? raw.slice(0, at) : void 0;
    const run = real(at >= 0 ? raw.slice(at + 1) : raw);
    return [key, run, match?.[1] ? piStatusWords(match[1]) : void 0].filter(Boolean).join(t2("piNotice.factSeparator"));
  });
  return str(rows.filter(Boolean).join("\n"));
}
function childRunsFromDetails(value) {
  const rows = records(value).map(
    (child) => [str(child.workflowKey) ?? str(child.agent), real(str(child.runId)), str(child.status) ? piStatusWords(child.status) : void 0].filter(Boolean).join(t2("piNotice.factSeparator"))
  );
  return str(rows.filter(Boolean).join("\n"));
}
function childOutputLine(line) {
  const head = /^- key=(\S*) run=(\S*) status=(\S*)$/.exec(line);
  if (head) {
    const status = real(head[3]);
    return `\u2022 ${[real(head[1]) ?? t2("piNotice.childTask"), status ? piStatusWords(status) : void 0, real(head[2]) ? t2("piNotice.runReference", { id: head[2] }) : void 0].filter(Boolean).join(t2("piNotice.factSeparator"))}`;
  }
  const omitted = /^- (\d+) additional child preview\(s\) omitted by notice budget/.exec(line);
  if (omitted) return t2("piNotice.omittedPreviews", { count: omitted[1] });
  const preview = /^ {4}\| ?(.*)$/.exec(line);
  if (preview) return `  ${preview[1]}`;
  if (line === "  Preview:") return null;
  const unavailable = /^ {2}Preview: unavailable \((.+)\)$/.exec(line);
  if (unavailable) return t2("piNotice.unavailablePreview", { reason: unavailable[1] });
  const saved = /^ {2}Saved output: (.+)$/.exec(line);
  if (saved) return real(saved[1]) ? t2("piNotice.savedOutput", { path: saved[1] }) : null;
  const artifact = /^ {2}Output artifact \(retention-managed\): (.+)$/.exec(line);
  if (artifact) return t2("piNotice.outputArtifact", { path: artifact[1] });
  const structured = /^ {2}Structured output \(retention-managed\): (.+)$/.exec(line);
  if (structured) return t2("piNotice.structuredOutput", { path: structured[1] });
  const failed2 = /^ {2}(Output artifact|Structured output) verification failed: (.+)$/.exec(line);
  if (failed2) return t2(failed2[1] === "Output artifact" ? "piNotice.outputVerificationFailed" : "piNotice.structuredVerificationFailed", { error: failed2[2] });
  const error = /^ {2}Error: (.+)$/.exec(line);
  if (error) return t2("piNotice.indentedError", { error: error[1] });
  if (line === "  Full output unavailable") return t2("piNotice.fullOutputUnavailable");
  return line;
}
function previewText(rows) {
  const out = [];
  let section = "text";
  for (const line of rows) {
    if (line === "Child outputs:") {
      section = "children";
      out.push(t2("piNotice.childOutputs"));
      continue;
    }
    if (line === "Watchdog blockers:") {
      section = "blockers";
      out.push(t2("piNotice.watchdogBlockers"));
      continue;
    }
    if (line === "High-importance watchdog concerns:") {
      section = "concerns";
      out.push(t2("piNotice.watchdogConcerns"));
      continue;
    }
    if (section === "children") {
      const converted = childOutputLine(line);
      if (converted !== null) out.push(converted);
      continue;
    }
    if (section === "blockers") {
      const blocker = blockerParts(line);
      if (blocker) {
        out.push(t2("piNotice.blockerDetails", { name: blocker[0], detail: blocker[1], status: t2(BLOCKER_ZH[blocker[2]]) }));
        continue;
      }
      section = "text";
    }
    if (section === "concerns") {
      out.push(line.replace(/^Evidence: /, t2("piNotice.evidencePrefix")).replace(/^Recommended action: /, t2("piNotice.recommendationPrefix")));
      continue;
    }
    out.push(line);
  }
  const text2 = tidy(out);
  return text2 === "(no output)" ? "" : text2;
}
function runFromLines(source, agent, status) {
  let start = 0;
  let end = source.length;
  const run = {};
  const skipBlank = () => {
    while (start < end && !source[start].trim()) start++;
  };
  if (start < end && source[start].startsWith("Workflow receipt: ")) run.receipt = str(source[start++].slice("Workflow receipt: ".length));
  skipBlank();
  const schedule = scheduleLine(start < end ? source[start] : "");
  if (schedule) {
    run.schedule = scheduleText(schedule[0], schedule[1]);
    start++;
  }
  while (end > start) {
    const last = source[end - 1];
    if (!last.trim()) {
      end--;
      continue;
    }
    const meta = RUN_META.exec(last);
    if (!meta) break;
    const value = str(meta[2]);
    const label = meta[1];
    if (label === "Parallel handoff") run.handoff ??= value;
    else if (label === "Workflow run") run.workflowRunId ??= value;
    else if (label === "Child runs") run.childRuns ??= value ? childRunsText(value) : void 0;
    else if (label === "Reconciled detached child") run.reconciled ??= value;
    else if (label !== "Retention-managed async directory" && value) run.session ??= { label: label.toLowerCase(), value };
    end--;
  }
  skipBlank();
  const errors = [];
  const failed2 = piNoticeState(status) !== "done";
  while (failed2 && start < end) {
    const error = ERROR_LINE.exec(source[start]);
    if (!error) break;
    errors.push(error[1] ? t2("piNotice.errorDetail", { kind: error[1], error: error[2] }) : error[2]);
    start++;
  }
  if (errors.length) run.errors = errors;
  skipBlank();
  if (agent && start < end && source[start].trim() === `${agent}:`) start++;
  const kept = [];
  for (let index = start; index < end; index++) {
    const row = source[index];
    const saved = SAVED_OUTPUT.exec(row.trim());
    if (saved) run.outputFile ??= str(saved[1] ?? saved[2]);
    else kept.push(row);
  }
  run.body = previewText(kept);
  run.hasChildOutputs = kept.includes("Child outputs:");
  return run;
}
function runFromDetails(details) {
  const origin = rec(details.scheduleOrigin);
  const sessionValue = str(details.sessionValue);
  return {
    agent: str(details.agent),
    status: str(details.status),
    foreground: details.source === "foreground" ? true : void 0,
    taskInfo: str(details.taskInfo),
    schedule: origin ? scheduleText(str(origin.name), str(origin.id)) : void 0,
    receipt: str(details.workflowReceiptPath),
    handoff: str(details.handoffPath),
    workflowRunId: str(details.workflowRunId),
    runId: str(details.runId),
    childRuns: childRunsFromDetails(details.childRuns),
    reconciled: str(details.reconciledFromDetachedChild),
    session: sessionValue ? { label: (str(details.sessionLabel) ?? "session file").toLowerCase(), value: sessionValue } : void 0,
    durationMs: num(details.durationMs)
  };
}
function taskInfoZh(raw) {
  const info = raw?.trim();
  if (!info) return void 0;
  const inner = /^\((.*)\)$/.exec(info)?.[1]?.trim() ?? info;
  const running = /^(dispatch complete; )?(\d+) (?:child|children) running or uncollected$/.exec(inner);
  if (running) return { text: t2(running[1] ? "piNotice.dispatchedChildren" : "piNotice.runningChildren", { count: running[2] }), dispatching: true };
  return { text: inner, dispatching: false };
}
function namedOutcome(name, words) {
  return name ? t2("piNotice.namedOutcome", { name: quoted(name), outcome: words }) : words;
}
function runOutcome(name, info, words) {
  return info ? t2("piNotice.withInfo", { name: quoted(name), info, outcome: words }) : namedOutcome(name, words);
}
function runSummary(run) {
  const info = taskInfoZh(run.taskInfo);
  if (info?.dispatching && piNoticeState(run.status) === "done") return { summary: namedOutcome(run.agent, info.text), state: "info" };
  return { summary: runOutcome(run.agent, info?.text, outcome(run.status)), state: piNoticeState(run.status) };
}
function runFields(run) {
  const session = run.session;
  return fields(
    [t2("piNotice.status"), run.status ? piStatusWords(run.status) : void 0, false, "status"],
    [t2("piNotice.error"), run.errors?.join("\n")],
    [t2("piNotice.source"), run.foreground ? t2("piNotice.detached") : void 0],
    [t2("piNotice.schedule"), run.schedule],
    [t2("piNotice.duration"), duration(run.durationMs)],
    [t2("piNotice.outputFile"), run.outputFile, true],
    // The child outputs in the body already name every child run.
    [t2("piNotice.childRun"), run.hasChildOutputs ? void 0 : run.childRuns],
    [t2("piNotice.workflow"), run.workflowRunId, true],
    [t2("piNotice.workflowReceipt"), run.receipt, true],
    [t2("piNotice.parallelHandoff"), run.handoff, true],
    [t2("piNotice.reconciledRun"), run.reconciled, true],
    session ? [SESSION_ZH[session.label] ? t2(SESSION_ZH[session.label]) : t2("piNotice.session"), session.value, session.label !== "session share error"] : null,
    [t2("piNotice.runId"), run.runId !== run.workflowRunId ? run.runId : void 0, true]
  );
}
function subagentNotify({ text: text2, details }) {
  const runs = records(rec(details)?.runs).filter((run2) => str(run2.agent) || str(run2.status));
  const rows = lines(withoutParentAction(text2));
  const single = runHeader(rows[0] ?? "");
  const group = GROUP_HEADER.exec(rows[0] ?? "");
  if (group || runs.length > 1) return groupedRuns(rows, group, runs);
  if (!single && runs.length === 0) return null;
  const head = single ? { agent: str(single[2]), status: single[1], foreground: single[0] === "Detached foreground task" ? true : void 0, taskInfo: str(single[3]) } : {};
  const fromDetails = runs[0] ? runFromDetails(runs[0]) : {};
  const agent = fromDetails.agent ?? head.agent;
  const run = merged(head, single ? runFromLines(rows.slice(1), agent, fromDetails.status ?? head.status) : {}, fromDetails);
  const { summary, state } = runSummary(run);
  return { look: "agent", title: t2("piNotice.subagent"), summary: summary || t2("piNotice.subagentNotice"), state, fields: runFields(run), ...run.body ? { body: run.body } : {} };
}
function groupedRuns(rows, group, runs) {
  const headerAgents = Array.from((group?.[2] ?? "").matchAll(/\*\*(.+?)\*\*/g), (match) => match[1]);
  const agents = runs.length ? runs.map((run) => str(run.agent)) : headerAgents;
  const count2 = Math.max(int(group?.[1]) ?? 0, runs.length, headerAgents.length);
  const starts = [];
  for (let index = 1, k = 1; index < rows.length && k <= count2; index++) {
    const prefix = `${k}. `;
    const line = rows[index];
    const agent = agents[k - 1];
    if (line.startsWith(prefix) && (!agent || line.startsWith(`${prefix}${agent}`)) && !rows[index - 1].trim()) {
      starts.push(index);
      k++;
    }
  }
  const sections = [];
  for (let k = 0; k < Math.max(starts.length, runs.length); k++) {
    const start = starts[k];
    const fromDetails = runs[k] ? runFromDetails(runs[k]) : {};
    let fromText = {};
    if (start !== void 0) {
      const header = rows[start].slice(`${k + 1}. `.length);
      const agent = fromDetails.agent ?? agents[k];
      const scheduled = scheduledRun(header);
      const label = scheduled ? header.slice(0, scheduled.index) : header;
      const taskInfo = agent && label.startsWith(agent) ? str(label.slice(agent.length)) : void 0;
      const end = starts[k + 1] ?? rows.length;
      fromText = merged(
        { agent: agent ?? str(label), status: "completed", taskInfo, schedule: scheduled ? scheduleText(scheduled.name, scheduled.id) : void 0 },
        runFromLines(rows.slice(start + 1, end), agent, fromDetails.status ?? "completed")
      );
    }
    sections.push(merged(fromText, fromDetails));
  }
  const states = sections.length ? sections.map((run) => piNoticeState(run.status)) : group ? ["done"] : [];
  const words = sections.map((run) => piStatusWords(run.status));
  const n = Math.max(count2, sections.length);
  const state = overall(states);
  const allDone = states.length > 0 && states.every((each) => each === "done");
  const summary = allDone ? headerAgents.length && headerAgents.length <= 3 ? t2("piNotice.groupCompletedNamed", { count: n, names: headerAgents.map(quoted).reduce((names, name) => names ? t2("piNotice.nameList", { names, name }) : name, "") }) : t2("piNotice.groupCompleted", { count: n }) : t2("piNotice.groupEnded", { count: n, outcomes: tally(words) });
  const body = sections.map((run) => {
    const info = taskInfoZh(run.taskInfo);
    const head = runOutcome(run.agent ?? t2("piNotice.subagent"), info?.text, outcome(run.status) || t2("piNotice.unknownStatus"));
    const session = run.session;
    return tidy([
      head,
      ...(run.errors ?? []).map((error) => t2("piNotice.errorText", { error })),
      run.schedule ? t2("piNotice.scheduleText", { schedule: run.schedule }) : "",
      run.body ?? "",
      run.outputFile ? t2("piNotice.outputFileText", { path: run.outputFile }) : "",
      session ? t2("piNotice.fieldValue", { label: SESSION_ZH[session.label] ? t2(SESSION_ZH[session.label]) : t2("piNotice.session"), value: session.value }) : ""
    ].filter((row, at) => at === 0 || row !== ""));
  }).join("\n\n");
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary,
    state,
    fields: fields([t2("piNotice.eachSubagent"), sections.map((run) => t2("piNotice.fieldValue", { label: run.agent ?? t2("piNotice.subagent"), value: outcome(run.status) || t2("piNotice.unknownStatus") })).join("\n")]),
    ...body ? { body } : {}
  };
}
var NO_RESULT = /* @__PURE__ */ new Set(["No output.", "Never started \u2014 stopped while queued."]);
function agentRunFromDetails(details) {
  return {
    id: str(details.id),
    description: str(details.description),
    status: str(details.status),
    neverStarted: str(details.resultPreview) === "Never started \u2014 stopped while queued." || void 0,
    error: str(details.error),
    toolUses: num(details.toolUses),
    totalTokens: num(details.totalTokens),
    turnCount: num(details.turnCount),
    maxTurns: num(details.maxTurns),
    durationMs: num(details.durationMs),
    outputFile: str(details.outputFile),
    result: str(details.resultPreview)
  };
}
function agentRunFromXml(block) {
  const summary = tag(block, "summary") ?? "";
  const statusLabel2 = tag(block, "status");
  const usage = blocks(block, "usage")[0] ?? "";
  const named = /^(?:Agent|Subagent|Workflow) "([\s\S]*)" (\S+)/.exec(summary);
  const neverStarted = /\bwas stopped while queued\b/.test(summary) || statusLabel2 === "Stopped before starting";
  return {
    id: tag(block, "task-id"),
    description: named?.[1],
    status: neverStarted ? "stopped" : named?.[2],
    neverStarted: neverStarted || void 0,
    error: statusLabel2?.startsWith("Error: ") ? str(statusLabel2.slice("Error: ".length)) : void 0,
    toolUses: int(tag(usage, "tool_uses")),
    totalTokens: int(tag(usage, "total_tokens")),
    durationMs: int(tag(usage, "duration_ms")),
    outputFile: tag(block, "output-file"),
    result: tag(block, "result")
  };
}
function agentRunOutcome(run, sentence = true) {
  if (run.neverStarted) return { state: "stopped", words: t2(sentence ? "piNotice.neverStartedSentence" : "piNotice.neverStarted") };
  const key = statusKey(run.status);
  if (key === "steered") return { state: "done", words: t2(sentence ? "piNotice.steeredSentence" : "piNotice.steered") };
  if (key === "aborted") return { state: "stopped", words: t2(sentence ? "piNotice.turnLimitStoppedSentence" : "piNotice.turnLimitStopped") };
  return { state: piNoticeState(run.status), words: outcome(run.status, void 0, sentence) };
}
function agentRunFields(run, words) {
  return fields(
    [t2("piNotice.status"), words, false, "status"],
    [t2("piNotice.error"), run.error],
    [t2("piNotice.toolCalls"), run.toolUses],
    [t2("piNotice.tokens"), run.totalTokens],
    [t2("piNotice.turnsLabel"), run.turnCount ? run.maxTurns ? `${run.turnCount}/${run.maxTurns}` : run.turnCount : void 0],
    [t2("piNotice.duration"), duration(run.durationMs)],
    [t2("piNotice.outputFile"), run.outputFile, true],
    [t2("piNotice.agentId"), run.id, true]
  );
}
function subagentNotification({ text: text2, details }) {
  const d = rec(details);
  const xmlRuns = blocks(text2, "task-notification").map(agentRunFromXml);
  let runs;
  if (d && (str(d.id) || str(d.description) || str(d.status))) {
    runs = [d, ...records(d.others)].map((entry, index) => {
      const own = agentRunFromDetails(entry);
      const xml = xmlRuns.find((run) => own.id !== void 0 && run.id === own.id) ?? xmlRuns[index];
      return merged(xml, own);
    });
  } else runs = xmlRuns;
  if (runs.length === 0) return null;
  const footerFile = /^Full transcript available at: (.+)$/m.exec(text2)?.[1]?.trim();
  if (runs.length === 1) {
    const run = merged({ outputFile: footerFile }, runs[0]);
    const { state, words } = agentRunOutcome(run);
    const result = run.result && !NO_RESULT.has(run.result) ? run.result : void 0;
    return {
      look: "agent",
      title: t2("piNotice.subagent"),
      summary: namedOutcome(run.description, words) || t2("piNotice.subagentNotice"),
      state,
      fields: agentRunFields(run, agentRunOutcome(run, false).words),
      ...result ? { body: result } : {}
    };
  }
  const outcomes = runs.map((run) => agentRunOutcome(run));
  const partial = /^Background agent group completed: .*\bpartial\b/m.test(text2);
  const allDone = outcomes.every((each) => each.state === "done");
  const body = runs.map((run, index) => {
    const result = run.result && !NO_RESULT.has(run.result) ? run.result : "";
    return tidy([namedOutcome(run.description ?? run.id ?? t2("piNotice.subagent"), outcomes[index].words), run.error ? t2("piNotice.errorText", { error: run.error }) : "", result].filter((row, at) => at === 0 || row !== ""));
  }).join("\n\n");
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary: allDone ? t2(partial ? "piNotice.groupCompletedPartial" : "piNotice.groupCompleted", { count: runs.length }) : t2(partial ? "piNotice.groupEndedPartial" : "piNotice.groupEnded", { count: runs.length, outcomes: tally(outcomes.map((each) => each.words)) }),
    state: overall(outcomes.map((each) => each.state)),
    fields: fields([t2("piNotice.eachSubagent"), runs.map((run, index) => t2("piNotice.fieldValue", { label: run.description ?? run.id ?? t2("piNotice.subagent"), value: outcomes[index].words })).join("\n")]),
    ...body ? { body } : {}
  };
}
function subagentUpdate({ text: text2, details }) {
  const d = rec(details) ?? {};
  const xml = /<subagent-update\b/.test(text2) ? text2 : "";
  const description = str(d.description) ?? quotedSubagent(tag(xml, "summary") ?? "", " sent an update");
  const message = str(d.message) ?? tag(xml, "message") ?? (xml ? void 0 : str(text2));
  if (!description && !message) return null;
  const gist = clip2(headline(message), 120);
  const summary = t2(description ? gist ? "piNotice.progressNamedDetail" : "piNotice.progressNamed" : gist ? "piNotice.progressDetail" : "piNotice.progress", { name: quoted(description), detail: gist });
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary,
    state: "info",
    fields: fields([t2("piNotice.agentId"), str(d.id) ?? tag(xml, "task-id"), true]),
    ...extra(message, gist) ? { body: message } : {}
  };
}
function workspaceNotice({ text: text2, details }) {
  const d = rec(details) ?? {};
  const xml = /<workspace-notice\b/.test(text2) ? text2 : "";
  const description = str(d.description) ?? quotedSubagent(tag(xml, "summary") ?? "", " left work behind");
  const notice = str(d.notice) ?? tag(xml, "notice");
  if (!description && !notice) return null;
  const gist = clip2(headline(notice), 120);
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary: t2(description ? gist ? "piNotice.workspaceNamedDetail" : "piNotice.workspaceNamed" : gist ? "piNotice.workspaceDetail" : "piNotice.workspace", { name: quoted(description), detail: gist }),
    state: "info",
    fields: fields([t2("piNotice.agentId"), str(d.id) ?? tag(xml, "task-id"), true]),
    ...extra(notice, gist) ? { body: notice } : {}
  };
}
var SUPERVISOR_HEADINGS = /* @__PURE__ */ new Map([
  ["Subagent needs a supervisor decision.", "need_decision"],
  ["Subagent progress update.", "progress_update"],
  ["Subagent requests a structured supervisor interview.", "interview_request"]
]);
function supervisorMessage(rows) {
  const start = rows.findIndex((row) => !row.trim());
  if (start < 0) return void 0;
  const out = [];
  for (const row of rows.slice(start + 1)) {
    if (/^(?:Structured response requested\.|Reply with: |Live guidance: )/.test(row)) break;
    out.push(row);
  }
  return str(tidy(out));
}
function supervisorRequest({ text: text2, details }) {
  const d = rec(details) ?? {};
  const rows = lines(text2);
  const reason = str(d.reason) ?? SUPERVISOR_HEADINGS.get(rows[0]?.trim() ?? "");
  const agent = str(d.agent) ?? lineValue(text2, "Agent");
  const message = str(d.requestBody) ?? supervisorMessage(rows);
  if (!reason && !agent && !message) return null;
  const gist = clip2(headline(message), 120);
  const messageId = reason === "progress_update" ? gist ? "piNotice.requestProgressDetail" : "piNotice.requestProgress" : reason === "interview_request" ? gist ? "piNotice.requestInterviewDetail" : "piNotice.requestInterview" : gist ? "piNotice.requestDecisionDetail" : "piNotice.requestDecision";
  return {
    look: "agent",
    title: t2("piNotice.subagentRequest"),
    summary: t2(messageId, { name: agent ? quoted(agent) : t2("piNotice.subagentLead"), detail: gist }),
    state: "info",
    fields: fields([t2("piNotice.runId"), str(d.runId) ?? lineValue(text2, "Run"), true], [t2("piNotice.requestId"), str(d.requestId) ?? str(d.id) ?? /replyTo: "([^"]+)"/.exec(text2)?.[1], true]),
    ...extra(message, gist) ? { body: message } : {}
  };
}
function supervisorReminder({ customType, text: text2, details }) {
  const d = rec(details) ?? {};
  const fromDetails = list(d.requestIds).map(str).filter((id) => id !== void 0);
  const fromText = requestIdList(text2)?.split(/,\s*/).map((id) => id.trim()).filter(Boolean) ?? [];
  const ids = fromDetails.length ? fromDetails : fromText;
  const blocked = customType === "subagent-supervisor-blocked" || d.blocked === true;
  const n = ids.length;
  return {
    look: "agent",
    title: t2("piNotice.subagentRequest"),
    summary: blocked ? t2(n ? "piNotice.requestsUnansweredCount" : "piNotice.requestsUnanswered", { count: n }) : t2(n ? "piNotice.requestReminderCount" : "piNotice.requestReminder", { count: n }),
    state: "info",
    fields: fields([t2("piNotice.requestId"), ids.join("\n"), true])
  };
}
var PARENT_SENTENCES = /* @__PURE__ */ new Map([
  ["subagent-completion-unanswered", "piNotice.completionReminder"],
  ["subagent-completion-unhandled", "piNotice.completionUnhandled"],
  ["subagent-compaction-resume", "piNotice.compactionResume"]
]);
var CONTROL_HEADER = /^Subagent (needs attention|active but long-running|failed): (.+)$/;
function factsFromEvent(event) {
  const elapsed = num(event.elapsedMs);
  const toolMs = num(event.currentToolDurationMs);
  const tool = str(event.currentTool);
  const facts = [
    elapsed !== void 0 ? t2("piNotice.elapsed", { duration: duration(elapsed) ?? t2("piNotice.underSecond") }) : void 0,
    num(event.turns) !== void 0 ? t2("piNotice.turnCount", { count: num(event.turns) }) : void 0,
    num(event.tokens) !== void 0 ? t2("piNotice.tokenCount", { count: num(event.tokens) }) : void 0,
    num(event.toolCount) !== void 0 ? t2("piNotice.toolCount", { count: num(event.toolCount) }) : void 0,
    tool ? t2(toolMs !== void 0 && duration(toolMs) ? "piNotice.toolElapsed" : "piNotice.toolName", { tool, duration: duration(toolMs) }) : void 0,
    str(event.currentPath) ? t2("piNotice.path", { path: str(event.currentPath) }) : void 0
  ].filter(Boolean);
  return facts.length ? facts.join(t2("piNotice.factSeparator")) : void 0;
}
function factsFromText(value) {
  if (!value) return void 0;
  const facts = value.split(" | ").map((fact) => {
    const part = fact.trim();
    const elapsed = /^elapsed (\d+)s$/.exec(part);
    if (elapsed) return t2("piNotice.elapsed", { duration: duration(Number(elapsed[1]) * 1e3) ?? t2("piNotice.underSecond") });
    const counted = /^(\d+) (turns|tokens|tools)$/.exec(part);
    if (counted) return t2(counted[2] === "turns" ? "piNotice.turnCount" : counted[2] === "tokens" ? "piNotice.tokenCount" : "piNotice.toolCount", { count: counted[1] });
    const tool = /^tool (\S+)(?: (\d+)s)?$/.exec(part);
    if (tool) return t2(tool[2] ? "piNotice.toolElapsed" : "piNotice.toolName", { tool: tool[1], duration: duration(Number(tool[2]) * 1e3) ?? t2("piNotice.seconds", { count: tool[2] }) });
    const path = /^path (.+)$/.exec(part);
    return path ? t2("piNotice.path", { path: path[1] }) : part;
  });
  return str(facts.filter(Boolean).join(t2("piNotice.factSeparator")));
}
function controlNotice({ text: text2, details }) {
  const d = rec(details) ?? {};
  const event = rec(d.event) ?? {};
  const header = CONTROL_HEADER.exec(lines(text2)[0]?.trim() ?? "");
  const type = str(event.type) ?? (header?.[1] === "active but long-running" ? "active_long_running" : header?.[1] === "failed" ? "failed" : header ? "needs_attention" : void 0);
  if (!type) return null;
  const reason = str(event.reason);
  const agent = str(event.agent) ?? str(header?.[2]);
  const runLine = lineValue(text2, "Run");
  const index = int(event.index);
  const step = index !== void 0 ? index + 1 : int(/\sstep (\d+)$/.exec(runLine ?? "")?.[1]);
  const name = agent ? quoted(agent) : t2("piNotice.subagentLead");
  let summary;
  let state = "info";
  if (type === "failed" || reason === "completion_guard") {
    summary = t2("piNotice.subagentFailed", { name });
    state = "failed";
  } else if (type === "active_long_running") {
    const elapsed = duration(num(event.elapsedMs));
    summary = t2(elapsed ? "piNotice.longRunningDuration" : "piNotice.longRunning", { name, duration: elapsed });
  } else {
    const elapsed = duration(num(event.elapsedMs));
    const tool = str(event.currentTool);
    const toolTime = duration(num(event.currentToolDurationMs));
    const why = reason === "idle" && elapsed ? t2("piNotice.idleDuration", { duration: elapsed }) : reason === "tool_open_threshold" ? t2(tool ? toolTime ? "piNotice.toolElapsed" : "piNotice.toolLongRunning" : toolTime ? "piNotice.unnamedToolElapsed" : "piNotice.unnamedToolLongRunning", { tool, duration: toolTime }) : reason === "supervisor_request" ? t2("piNotice.waitingParent") : reason === "tool_failures" ? t2("piNotice.toolFailures") : void 0;
    summary = t2(why ? "piNotice.needsAttentionReason" : "piNotice.needsAttention", { name, reason: why });
  }
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary,
    state,
    fields: fields(
      [t2("piNotice.signal"), str(event.message) ?? lineValue(text2, "Signal")],
      [t2("piNotice.runFacts"), factsFromEvent(event) ?? factsFromText(lineValue(text2, "Facts"))],
      [t2("piNotice.recentFailures"), str(event.recentFailureSummary) ?? lineValue(text2, "Recent failures")],
      [t2("piNotice.step"), step],
      [t2("piNotice.runId"), str(event.runId) ?? runLine?.split(/\s+/)[0], true]
    )
  };
}
var STEERING_HEADER = /^Subagent steering (\S+): (.+)$/;
function steeringNotice({ text: text2, details }) {
  const d = rec(details) ?? {};
  const rows = lines(text2);
  const header = STEERING_HEADER.exec(rows[0]?.trim() ?? "");
  const state = str(d.state) ?? header?.[1];
  if (!state) return null;
  const message = str(d.message) ?? str(tidy(rows.slice(1).filter((row) => !/^Request:\s/.test(row) && row.trim() !== "Inspect the run status before sending another correction.")));
  const summary = state === "failed" ? t2("piNotice.steeringFailed") : state === "partial" ? t2("piNotice.steeringPartial") : state === "recovered" ? t2("piNotice.steeringRecovered") : t2("piNotice.steeringState", { state });
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary,
    state: state === "failed" || state === "partial" ? "failed" : "info",
    fields: fields([t2("piNotice.description"), message], [t2("piNotice.runId"), str(d.runId) ?? real(str(header?.[2])), true], [t2("piNotice.requestId"), str(d.requestId) ?? lineValue(text2, "Request"), true])
  };
}
var SEVERITY_ZH = { concern: "piNotice.concern", blocker: "piNotice.blocker" };
var IMPORTANCE_ZH = { low: "piNotice.low", medium: "piNotice.medium", high: "piNotice.high" };
var CATEGORY_ZH = {
  correctness: "piNotice.correctness",
  "missed-constraint": "piNotice.missedConstraint",
  "test-gap": "piNotice.testGap",
  "unsafe-change": "piNotice.unsafeChange",
  "scope-drift": "piNotice.scopeDrift",
  "stale-fact": "piNotice.staleFact",
  "loop-risk": "piNotice.loopRisk",
  other: "piNotice.other"
};
var WATCHER_ZH = { main: "piNotice.mainAgent", child: "piNotice.subagent", lsp: "piNotice.lsp" };
var WARNING_STATE_ZH = { stale: "piNotice.stale", failed: "piNotice.reviewFailed", stalemate: "piNotice.stalemateStopped", resolved: "piNotice.resolved", suppressed: "piNotice.suppressed" };
function watchdogWarning({ text: text2, details }) {
  const d = rec(details) ?? {};
  const xml = /<subagent_watchdog\b/.test(text2) ? text2 : "";
  const severity = str(d.severity) ?? attr(xml, "severity");
  const agent = str(d.agent) ?? tag(xml, "agent");
  const point = str(d.summary) ?? tag(xml, "summary");
  if (!severity && !point) return null;
  const shownPoint = point ? clip2(oneLine(point), 160) : "";
  const warningState = str(d.state) ?? tag(xml, "state");
  const stale = d.stale === true || tag(xml, "stale") === "true";
  const category = str(d.category) ?? attr(xml, "category");
  const importance = str(d.importance) ?? attr(xml, "importance");
  const source = str(d.source) ?? attr(xml, "source");
  const states = [warningState && warningState !== "displayed" && warningState !== "confirmed" && warningState !== "candidate" ? WARNING_STATE_ZH[warningState] ? t2(WARNING_STATE_ZH[warningState]) : warningState : void 0, stale && warningState !== "stale" ? t2("piNotice.stale") : void 0];
  return {
    look: "agent",
    title: t2("piNotice.watchdog"),
    summary: t2(agent ? severity === "blocker" ? shownPoint ? "piNotice.watchdogBlockerDetail" : "piNotice.watchdogBlocker" : shownPoint ? "piNotice.watchdogConcernDetail" : "piNotice.watchdogConcern" : severity === "blocker" ? shownPoint ? "piNotice.watchdogBlockerUnnamedDetail" : "piNotice.watchdogBlockerUnnamed" : shownPoint ? "piNotice.watchdogConcernUnnamedDetail" : "piNotice.watchdogConcernUnnamed", { name: quoted(agent), detail: shownPoint }),
    state: "info",
    fields: fields(
      [t2("piNotice.point"), point && shownPoint !== point ? point : void 0],
      [t2("piNotice.severity"), severity ? SEVERITY_ZH[severity] ? t2(SEVERITY_ZH[severity]) : severity : void 0],
      [t2("piNotice.importance"), importance ? IMPORTANCE_ZH[importance] ? t2(IMPORTANCE_ZH[importance]) : importance : void 0],
      [t2("piNotice.category"), category ? CATEGORY_ZH[category] ? t2(CATEGORY_ZH[category]) : category : void 0],
      [t2("piNotice.source"), source ? WATCHER_ZH[source] ? t2(WATCHER_ZH[source]) : source : void 0],
      [t2("piNotice.evidence"), str(d.evidence) ?? tag(xml, "evidence")],
      [t2("piNotice.recommendation"), str(d.recommendedAction) ?? tag(xml, "recommended_action")],
      [t2("piNotice.watchdogStatus"), states.filter(Boolean).join(t2("piNotice.commaSeparator"))],
      [t2("piNotice.reviewError"), warningState === "failed" ? str(d.error) : void 0],
      [t2("piNotice.runId"), str(d.runId) ?? tag(xml, "run_id"), true]
    )
  };
}
function watchdogClarification({ text: text2 }) {
  const body = plainText(text2);
  const gist = clip2(headline(body), 160);
  return {
    look: "agent",
    title: t2("piNotice.watchdog"),
    summary: t2(gist ? "piNotice.clarifyDetail" : "piNotice.clarify", { detail: gist }),
    state: "info",
    fields: [],
    ...extra(body, gist) ? { body } : {}
  };
}
var WAIT_TEXT = /^Wait subscription (\S+) fired for run (\S+): (.+?)\.(?:\s+([\s\S]*))?$/;
function completionArchive(text2) {
  const label = "Completion archive: ";
  for (let at = text2.indexOf(label); at >= 0; at = text2.indexOf(label, at + 1)) {
    const start = at + label.length;
    let end = start;
    while (end < text2.length && !LINE_ENDS.includes(text2[end])) end++;
    if (end === start) continue;
    const line = text2.slice(start, end);
    const kept = line.trimEnd();
    if (!kept) return line[0];
    return kept.length > 1 && kept.endsWith(".") ? kept.slice(0, -1) : kept;
  }
  return void 0;
}
function waitSubscription({ text: text2, details }) {
  const d = rec(details) ?? {};
  const parsed = WAIT_TEXT.exec(text2.trim());
  const result = str(d.outcome) ?? parsed?.[3];
  if (!result) return null;
  const key = statusKey(result);
  let summary;
  let state;
  if (key === "timed out") [summary, state] = [t2("piNotice.waitTimeout"), "info"];
  else if (key === "needs attention") [summary, state] = [t2("piNotice.waitAttention"), "info"];
  else if (key === "could not be reconciled" || key === "reconciliation failed") [summary, state] = [t2("piNotice.waitUnconfirmed"), "failed"];
  else [summary, state] = [t2("piNotice.waitOutcome", { outcome: outcome(result) }), piNoticeState(result)];
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary,
    state,
    fields: fields([t2("piNotice.runId"), str(d.runId) ?? parsed?.[2], true], [t2("piNotice.completionArchive"), completionArchive(parsed?.[4] ?? ""), true])
  };
}
var WORKFLOW_CHILD = /^Workflow child (completed|failed|paused(?: \(needs attention\))?|stopped): \*\*(.+?)\*\*$/;
function workflowChild({ text: text2, details }) {
  const d = rec(details) ?? {};
  const header = WORKFLOW_CHILD.exec(lines(text2)[0]?.trim() ?? "");
  const key = str(d.childKey) ?? header?.[2];
  const result = str(d.outcome) ?? header?.[1]?.replace(/ \(needs attention\)$/, "");
  if (!key && !result) return null;
  const status = lineValue(text2, "Status");
  const running = status === void 0 ? void 0 : /still running/.test(status);
  return {
    look: "agent",
    title: t2("piNotice.subagent"),
    summary: t2(running === true ? "piNotice.workflowChildRunning" : running === false ? "piNotice.workflowChildEnded" : "piNotice.workflowChild", { name: quoted(key), outcome: outcome(result) || t2("piNotice.hasResult") }),
    state: piNoticeState(result),
    fields: fields(
      [t2("piNotice.error"), lineValue(text2, "Error")],
      [t2("piNotice.output"), real(lineValue(text2, "Output")), true],
      [t2("piNotice.workflowStatus"), running === true ? t2("piNotice.stillRunning") : running === false ? t2("piNotice.ended") : void 0],
      [t2("piNotice.workflow"), real(lineValue(text2, "Workflow run")), true],
      [t2("piNotice.childRun"), real(lineValue(text2, "Child run")), true]
    )
  };
}
function workflowResultWriteFailed({ text: text2 }) {
  return { look: "agent", title: t2("piNotice.subagent"), summary: t2("piNotice.workflowSaveFailed"), state: "failed", fields: fields([t2("piNotice.error"), str(text2)]) };
}
function fetchedHeader(text2) {
  const head = /Content fetched for (\d+)\/(\d+) URLs \[/.exec(text2);
  const close = head ? text2.indexOf("]", head.index + head[0].length) : -1;
  return head && close >= 0 ? [head[1], head[2], text2.slice(head.index + head[0].length, close)] : null;
}
function fetchFailure(text2) {
  const label = "Content fetch failed [";
  for (let at = text2.indexOf(label); at >= 0; ) {
    const close = text2.indexOf("]", at + label.length);
    if (close < 0) return null;
    if (text2[close + 1] === ":") return [text2.slice(at + label.length, close), text2.slice(close + 2).trimStart()];
    at = text2.indexOf(label, close);
  }
  return null;
}
function webContentReady({ text: text2 }) {
  const match = fetchedHeader(text2);
  const ok = int(match?.[0]);
  const total = int(match?.[1]);
  if (ok === void 0 || total === void 0) return null;
  const [summary, state] = ok === 0 && total > 0 ? [t2("piNotice.fetchNone", { total }), "failed"] : ok < total ? [t2("piNotice.fetchPartial", { ok, total }), "done"] : [t2("piNotice.fetchComplete", { ok, total }), "done"];
  return { look: "web", title: t2("piNotice.webSearch"), summary, state, fields: fields([t2("piNotice.webpage"), `${ok}/${total}`], [t2("piNotice.fetchId"), str(match?.[2]), true]) };
}
function webError({ text: text2 }) {
  const match = fetchFailure(text2.trim());
  return {
    look: "web",
    title: t2("piNotice.webSearch"),
    summary: t2("piNotice.fetchFailed"),
    state: "failed",
    fields: fields([t2("piNotice.error"), match ? match[1] : plainText(text2)], [t2("piNotice.fetchId"), str(match?.[0]), true])
  };
}
function webResults({ text: text2, details }) {
  const d = rec(details) ?? {};
  const queries = list(d.queries).map(str).filter((query) => query !== void 0);
  const total = num(d.totalResults);
  const ok = num(d.successfulQueries);
  const asked = num(d.queryCount) ?? (queries.length || void 0);
  const guide = text2.search(/\n---\n(?:Full content for|Content fetching in background|Full search results are stored)/);
  const body = plainText(guide >= 0 ? text2.slice(0, guide) : text2);
  const subject = queries.length === 1 ? t2("piNotice.quotedQuery", { query: queries[0] }) : asked ? t2("piNotice.queryCount", { count: asked }) : "";
  const failedQueries = asked !== void 0 && ok !== void 0 ? asked - ok : 0;
  const summary = subject ? t2(total !== void 0 ? failedQueries > 0 ? "piNotice.searchCountFailed" : "piNotice.searchCount" : failedQueries > 0 ? "piNotice.searchFailed" : "piNotice.search", { subject, total, failed: failedQueries }) : headline(body) || t2("piNotice.searchResults");
  const state = asked !== void 0 && ok !== void 0 ? ok === 0 && asked > 0 ? "failed" : "done" : "info";
  return {
    look: "web",
    title: t2("piNotice.webSearch"),
    summary,
    state,
    fields: fields([t2("piNotice.query"), queries.join("\n")], [t2("piNotice.resultCount"), total]),
    ...body ? { body } : {}
  };
}
function goalContract({ text: text2, details }) {
  const d = rec(details) ?? {};
  const inactive = d.state === "inactive" || d.state === void 0 && text2.trim().startsWith("Goal mode is inactive.");
  const objective = tag(text2, "goal_objective");
  const gist = headline(objective);
  return {
    look: "plan",
    title: t2("piNotice.goal"),
    summary: inactive ? t2("piNotice.goalInactive") : t2(gist ? "piNotice.goalUpdatedDetail" : "piNotice.goalUpdated", { detail: clip2(gist, 160) }),
    state: "info",
    fields: fields([t2("piNotice.goal"), inactive ? void 0 : objective], [t2("piNotice.goalId"), str(d.goalId) ?? tag(text2, "goal_id"), true])
  };
}
function goalBudget({ details }) {
  return {
    look: "plan",
    title: t2("piNotice.goal"),
    summary: t2("piNotice.goalBudget"),
    state: "info",
    fields: fields([t2("piNotice.goalId"), str(rec(details)?.goalId), true])
  };
}
var PARSERS = /* @__PURE__ */ new Map([
  ["background-task-notification", backgroundTask],
  ["subagent-notify", subagentNotify],
  ["subagent-notification", subagentNotification],
  ["subagent-update", subagentUpdate],
  ["subagent-workspace-notice", workspaceNotice],
  ["subagent_supervisor_request", supervisorRequest],
  ["subagent-supervisor-unanswered", supervisorReminder],
  ["subagent-supervisor-blocked", supervisorReminder],
  ["subagent_control_notice", controlNotice],
  ["subagent_steering_notice", steeringNotice],
  ["subagent_watchdog_warning", watchdogWarning],
  ["subagent_watchdog_clarification", watchdogClarification],
  ["subagent-wait-subscription", waitSubscription],
  ["subagent-incremental-child-notify", workflowChild],
  ["subagent-workflow-result-write-failed", workflowResultWriteFailed],
  ["web-search-content-ready", webContentReady],
  ["web-search-error", webError],
  ["web-search-results", webResults],
  ["goal-contract", goalContract],
  ["goal-budget-wrap-up", goalBudget]
]);
function family(customType) {
  const type = customType.toLowerCase();
  if (/^subagents?[-_:]/.test(type)) return { look: "agent", title: t2("piNotice.subagent") };
  if (/^(?:web-search|web-fetch|curator-config$|google-account$)/.test(type)) return { look: "web", title: t2("piNotice.webSearch") };
  if (/^goal[-_]/.test(type)) return { look: "plan", title: t2("piNotice.goal") };
  if (type.startsWith("background-task")) return { look: "shell", title: t2("piNotice.backgroundTask") };
  return { look: "other", title: t2("piNotice.piNotice") };
}
var MAX_LEAVES = 8;
function leaves(text2) {
  const out = [];
  for (const match of text2.matchAll(/<([A-Za-z][\w.:-]*)(?:\s[^<>]*)?>([^<]*)<\/\1\s*>/g)) {
    const value = unescapeXml2(match[2]).trim();
    if (value) out.push([match[1], value]);
    if (out.length >= MAX_LEAVES) break;
  }
  return out;
}
function generic({ customType, text: text2, details }) {
  const sentenceId = PARENT_SENTENCES.get(customType);
  const sentence = sentenceId ? t2(sentenceId) : void 0;
  const pairs = sentence ? [] : leaves(text2);
  if (pairs.length >= 2) {
    return {
      ...family(customType),
      summary: clip2(pairs.slice(0, 2).map(([, value]) => oneLine(value)).join(t2("piNotice.factSeparator"))),
      state: "info",
      fields: fields([t2("piNotice.type"), customType, true], ...pairs.map(([label, value]) => [label, value]))
    };
  }
  const body = plainText(text2);
  let shown3 = body;
  if (!shown3 && details !== void 0 && details !== null) {
    try {
      shown3 = JSON.stringify(details, null, 2) ?? "";
    } catch {
      shown3 = "";
    }
  }
  const summary = sentence ?? (clip2(headline(body)) || customType);
  return {
    ...family(customType),
    summary,
    state: "info",
    fields: sentence ? [] : fields([t2("piNotice.type"), customType, true]),
    ...!sentence && extra(shown3, summary) ? { body: shown3 } : {}
  };
}
var PI_NOTICE_LIMITS = { text: 64 * 1024, string: 8 * 1024, chars: 64 * 1024, entries: 200, nodes: 4e3, depth: 8, key: 256 };
function boundDetails(value) {
  const limits = PI_NOTICE_LIMITS;
  let chars = limits.chars;
  let nodes = limits.nodes;
  const room = () => nodes > 0 && chars > 0;
  const copy = (item, depth) => {
    nodes -= 1;
    if (typeof item === "string") {
      const kept = item.slice(0, Math.max(0, Math.min(limits.string, chars)));
      chars -= kept.length;
      return kept;
    }
    if (item === null || typeof item === "boolean" || typeof item === "number" && Number.isFinite(item)) return item;
    if (typeof item !== "object" || depth >= limits.depth) return void 0;
    if (Array.isArray(item)) {
      const out2 = [];
      for (let i = 0; i < item.length && out2.length < limits.entries && room(); i++) out2.push(copy(item[i], depth + 1));
      return out2;
    }
    const out = {};
    let entries = 0;
    for (const key of Object.keys(item)) {
      if (entries >= limits.entries || !room()) break;
      if (key.length > limits.key || key === "__proto__") continue;
      entries += 1;
      chars -= key.length;
      const kept = copy(item[key], depth + 1);
      if (kept !== void 0) out[key] = kept;
    }
    return out;
  };
  try {
    return copy(value, 0);
  } catch {
    return void 0;
  }
}
function isPiNotice(item) {
  try {
    const row = rec(item);
    const meta = rec(row?.metadata);
    if (!row || !meta || meta.synthetic !== true) return false;
    const customType = meta.customType;
    if (typeof customType !== "string" || !customType.trim() || row.name !== customType) return false;
    return rec(row.detail)?.type === "plain_text";
  } catch {
    return false;
  }
}
function readPiNotice(item) {
  try {
    if (!isPiNotice(item)) return null;
    const meta = rec(item.metadata);
    const customType = meta.customType;
    const rawText = rec(item.detail).text;
    const text2 = typeof rawText === "string" ? rawText.slice(0, PI_NOTICE_LIMITS.text) : "";
    const input = { customType, text: text2, details: boundDetails(meta.details) };
    let draft = null;
    try {
      draft = PARSERS.get(customType)?.(input) ?? null;
    } catch {
      draft = null;
    }
    const shaped = draft ?? generic(input);
    const summary = oneLine(shaped.summary) || customType;
    return { customType, ...shaped, summary: clip2(summary) };
  } catch {
    return null;
  }
}

// resources/third-party/default-features/vivid-activity/shared/plugin-cards.ts
var PROPOSING_TOOL = /^(?:mcp__)?bots(?:__|\.|_)(?:propose_skill|propose_routine|propose_changes)$/;
var PROPOSAL_ID = /\bproposal (p-[a-z0-9]{10})\b/i;
var SIGN_IN_TOOL = /^(?:mcp__)?composio(?:__|\.|_)COMPOSIO_MANAGE_CONNECTIONS$/;
function outputOf(detail) {
  return detail && typeof detail === "object" && "output" in detail ? detail.output : null;
}
function hasProposalId(output) {
  let text2;
  try {
    text2 = typeof output === "string" ? output : JSON.stringify(output ?? null);
  } catch {
    return false;
  }
  return PROPOSAL_ID.test(text2 ?? "");
}
function composioResults(value, depth = 0) {
  if (depth > 4 || value === null || typeof value !== "object") {
    if (typeof value !== "string" || depth > 4) return null;
    try {
      return composioResults(JSON.parse(value), depth + 1);
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) return value.reduce((found, entry) => found ?? composioResults(entry, depth + 1), null);
  const record3 = value;
  const results = record3.data?.results;
  if (results && typeof results === "object" && !Array.isArray(results)) return results;
  return composioResults(record3.output, depth + 1) ?? composioResults(record3.text, depth + 1) ?? composioResults(record3.content, depth + 1);
}
function isComposioUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "composio.dev" || url.hostname.endsWith(".composio.dev"));
  } catch {
    return false;
  }
}
function pluginCardOf(call) {
  if (call.status !== "completed") return null;
  const name = call.name.trim();
  if (PROPOSING_TOOL.test(name)) return hasProposalId(outputOf(call.detail)) ? "bots-proposal" : null;
  if (SIGN_IN_TOOL.test(name)) {
    const results = composioResults(outputOf(call.detail)) ?? {};
    return Object.values(results).some((result) => isComposioUrl(result?.redirect_url)) ? "bots-sign-in" : null;
  }
  return null;
}

// resources/third-party/default-features/vivid-activity/shared/fold-index.ts
var cursorSchema = import_zod7.z.object({ epoch: import_zod7.z.string().min(1).max(200), seq: import_zod7.z.number().int().nonnegative() });
var LOOK_KEYS = [
  "think",
  "read",
  "list",
  "edit",
  "write",
  "shell",
  "search",
  "web",
  "browser",
  "agent",
  "plan",
  "mcp",
  "paseo",
  "ask",
  "skill",
  "other"
];
var TEXT_LINES_CAP = 999;
function textLines(text2) {
  let lines2 = 0;
  let start = 0;
  while (start <= text2.length && lines2 < TEXT_LINES_CAP) {
    const end = text2.indexOf("\n", start);
    const length = (end < 0 ? text2.length : end) - start;
    lines2 += Math.max(1, Math.ceil(length / 40));
    if (end < 0) break;
    start = end + 1;
  }
  return Math.min(TEXT_LINES_CAP, Math.max(1, lines2));
}
var wireRowSchema = import_zod7.z.object({
  s: import_zod7.z.number().int().nonnegative(),
  /** seqEnd when it differs from s (the entry was updated after it began). */
  e: import_zod7.z.number().int().nonnegative().optional(),
  at: import_zod7.z.number().nonnegative(),
  k: import_zod7.z.enum(["r", "t", "b", "x"]),
  key: import_zod7.z.string().max(400).optional(),
  st: import_zod7.z.enum(["running", "completed", "failed", "canceled"]).optional(),
  look: import_zod7.z.enum(LOOK_KEYS).optional(),
  ref: import_zod7.z.string().max(400).optional(),
  fg: import_zod7.z.boolean().optional(),
  w: import_zod7.z.string().max(40).optional(),
  /** Index of the entry's turn in the page's `turns` table (0.3.0-local.3). */
  u: import_zod7.z.number().int().nonnegative().optional(),
  /** 0.6.0: about how many lines an Agent's text takes (shared/prompt-pin.ts measures how far the question is). */
  ln: import_zod7.z.number().int().min(1).max(TEXT_LINES_CAP).optional(),
  /** 0.8.0: lines a finished call added and removed per file, [file id (a short hash of its path), added, removed] (shared/changes.ts). */
  ch: import_zod7.z.array(import_zod7.z.tuple([import_zod7.z.string().min(1).max(16), import_zod7.z.number().int().nonnegative(), import_zod7.z.number().int().nonnegative()])).min(1).max(MAX_CALL_FILES).optional(),
  /** 0.8.0: changes of the call whose lines are not known (a write, a deletion, a diff cut short, a patch Paseo kept only part of). */
  nc: import_zod7.z.number().int().min(1).max(MAX_CALL_FILES).optional(),
  /** 0.8.0: a failed command's exit code, when it reports one. */
  x: import_zod7.z.number().int().optional()
});
var turnSchema = import_zod7.z.object({ id: import_zod7.z.string().min(1).max(200), at: import_zod7.z.number().nonnegative().nullable() });
var tokenCount = import_zod7.z.number().int().nonnegative();
var turnTokensSchema = import_zod7.z.object({ id: import_zod7.z.string().min(1).max(200), i: tokenCount, c: tokenCount.nullable(), o: tokenCount, live: import_zod7.z.boolean().optional() });
var MAX_TOKEN_TURNS = 8;
var foldIndexRpc = (0, import_plugin6.defineRpc)({
  name: "fold-index",
  input: import_zod7.z.object({
    agentId: import_zod7.z.string().min(1).max(256),
    direction: import_zod7.z.enum(["tail", "after", "before"]),
    cursor: cursorSchema.nullable().optional(),
    limit: import_zod7.z.number().int().min(1).max(400).optional()
  }),
  output: import_zod7.z.object({
    /** missing: the daemon has no such Agent (a provider subagent's own view, say); asking again will not help. */
    status: import_zod7.z.enum(["ok", "unavailable", "missing"]),
    epoch: import_zod7.z.string(),
    rows: import_zod7.z.array(wireRowSchema),
    startCursor: cursorSchema.nullable(),
    endCursor: cursorSchema.nullable(),
    hasOlder: import_zod7.z.boolean(),
    hasNewer: import_zod7.z.boolean(),
    /** The cursor was stale or the history was replaced: drop what you have and read the tail again. */
    reset: import_zod7.z.boolean(),
    /** The Agent's turn is running (from the snapshot that came with the page); null when unknown. */
    running: import_zod7.z.boolean().nullable(),
    /** The daemon's clock when it answered: live timers run on daemon time. */
    now: import_zod7.z.number().nonnegative().optional(),
    /** Turns of the rows (`u` indexes into it). */
    turns: import_zod7.z.array(turnSchema).max(1e3).optional(),
    /** The turn running now, from the Agent snapshot; null when none is. */
    active: turnSchema.nullable().optional(),
    /** 0.8.0: tokens of the page's turns and the latest ones, where the server watched them live. */
    tok: import_zod7.z.array(turnTokensSchema).max(MAX_TOKEN_TURNS).optional()
  })
});
function disclaimed(item) {
  if (item.detail?.type === "plan") return "plan";
  if (item.name === "speak" && item.detail?.type === "unknown" && typeof item.detail.input === "string" && item.detail.input.trim()) return "speak";
  if (item.name === "agent_message" && typeof item.callId === "string" && item.callId.startsWith("paseo-agent-message:")) return "agent-message";
  if (item.name === "heartbeat" && typeof item.callId === "string" && item.callId.startsWith("paseo-system:")) return "heartbeat";
  return pluginCardOf(item);
}
var TODO_STATUSES = /* @__PURE__ */ new Set(["pending", "in_progress", "completed"]);
function isTodoInput(input) {
  const todos = input?.todos;
  return Array.isArray(todos) && todos.every((todo) => {
    const entry = todo;
    return typeof entry?.content === "string" && TODO_STATUSES.has(String(entry.status));
  });
}
function isPlanInput(input) {
  const plan = input?.plan;
  return Array.isArray(plan) && plan.every((step) => typeof step?.step === "string");
}
function hostToolDisposition(provider, item) {
  const name = item.name.trim().replace(/[.\s-]+/g, "_").toLowerCase();
  const input = item.detail?.type === "unknown" ? item.detail.input : null;
  const todo = name === "todowrite" || name === "todo_write";
  if (provider === "claude" && todo) return isTodoInput(input) ? "task" : "skip";
  if (provider === "claude" && (name === "taskcreate" || name === "taskupdate" || name === "tasklist")) return "skip";
  if (todo && isTodoInput(input)) return "task";
  if (name === "update_plan" && isPlanInput(input)) return "task";
  return null;
}
var MAX_CLASSIFY_CHARS = 1e6;
function exceedsTextBudget(value, budget) {
  let left = budget - 1;
  const stack = [value];
  while (stack.length > 0) {
    if (left < 0) return true;
    const next = stack.pop();
    if (typeof next === "string") {
      left -= next.length;
    } else if (Array.isArray(next)) {
      for (const item of next) {
        if (--left < 0) return true;
        stack.push(item);
      }
    } else if (next !== null && typeof next === "object") {
      for (const key in next) {
        left -= key.length + 1;
        if (left < 0) return true;
        stack.push(next[key]);
      }
    }
  }
  return left < 0;
}
function toolFacts(item, cwd) {
  const notice = readTaskNotice(item);
  if (notice) return { look: noticeLook(notice.kind), changes: null, exit: null };
  const pi = readPiNotice(item);
  if (pi) return { look: pi.look, changes: null, exit: null };
  if (isApplyPatchTool(item.name)) {
    const edits = extractApplyPatchEdits(item.detail, item.detail?.type === "unknown" ? item.detail.output : void 0, item.metadata);
    if (edits.length > 0) return { look: edits.every((edit) => edit.operation === "add") ? "write" : "edit", changes: toolChanges(item, cwd), exit: null };
  }
  const detail = normalizeToolCallDetail(withMetadataEditDiff(item).detail, item.name);
  return {
    look: lookFor(item.name, detail, resolveToolCallPresentation({ name: item.name, detail })),
    changes: toolChanges(item, cwd, detail),
    exit: toolExitCode(item, detail)
  };
}
function record2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function wireRowFromEntry(entry, rowResult, cwd) {
  const source = record2(entry);
  const item = record2(source.item);
  const type = typeof item.type === "string" ? item.type : null;
  const seq = typeof source.seqStart === "number" ? source.seqStart : null;
  if (type === null || seq === null || !Number.isInteger(seq) || seq < 0) return null;
  const parsedAt = typeof source.timestamp === "string" ? Date.parse(source.timestamp) : NaN;
  const at = Number.isFinite(parsedAt) && parsedAt > 0 ? parsedAt : 0;
  const seqEnd = typeof source.seqEnd === "number" && Number.isInteger(source.seqEnd) && source.seqEnd > seq ? source.seqEnd : null;
  if (type === "plugin" && item.kind === TURN_TIME_RENDERER_KIND) return null;
  const base = { s: seq, ...seqEnd !== null ? { e: seqEnd } : {}, at };
  if (type === "reasoning") {
    return typeof item.text === "string" ? { ...base, k: "r", key: reasoningKey(item.text) } : { ...base, k: "b", w: "reasoning" };
  }
  if (type === "assistant_message" && typeof item.text === "string") return { ...base, k: "b", w: type, ln: textLines(item.text) };
  if (type !== "tool_call") return { ...base, k: "b", w: type.slice(0, 40) };
  const tool = item;
  if (typeof tool.callId !== "string" || typeof tool.name !== "string") return { ...base, k: "b", w: "tool" };
  const provider = typeof source.provider === "string" ? source.provider : "";
  const host = hostToolDisposition(provider, tool);
  if (host === "skip") return { ...base, k: "x", w: "hidden-tool" };
  if (host === "task") return { ...base, k: "b", w: "task" };
  const other = disclaimed(tool);
  if (other !== null) return { ...base, k: "b", w: other };
  const notice = readTaskNotice(tool);
  const small = !exceedsTextBudget([tool.detail, tool.metadata], MAX_CLASSIFY_CHARS);
  const pi = !notice && small ? readPiNotice(tool) : null;
  const status = notice ? notice.status : pi ? piNoticeStatus(pi.state) : ["running", "completed", "failed", "canceled"].includes(tool.status) ? tool.status : "completed";
  let look = pi ? pi.look : "other";
  let changes = null;
  let exit = null;
  if (small && !pi) {
    try {
      const facts = notice ? { look: noticeLook(notice.kind), changes: null, exit: null } : toolFacts(tool, cwd);
      look = facts.look;
      changes = facts.changes;
      exit = facts.exit;
    } catch {
      look = "other";
    }
  }
  return {
    ...base,
    k: "t",
    key: toolKey(tool.callId),
    st: status,
    look,
    ...notice?.ref ? { ref: notice.ref } : {},
    ...notice ? { fg: isForegroundNotice(notice, notice.ref ? rowResult?.(notice.ref) : void 0) } : {},
    ...changes && changes.files.length > 0 ? { ch: changes.files.map(([file, added, removed]) => [file, added, removed]) } : {},
    ...changes && changes.uncounted > 0 ? { nc: Math.min(changes.uncounted, MAX_CALL_FILES) } : {},
    ...exit !== null ? { x: exit } : {}
  };
}
function resultsForRepeats(entries) {
  const wanted = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    const item = record2(record2(entry).item);
    if (item.type !== "tool_call" || item.name !== TASK_NOTICE_TOOL) continue;
    const notice = readTaskNotice(item);
    if (notice?.kind === "repeat" && notice.ref && notice.result !== null) wanted.add(notice.ref);
  }
  const results = /* @__PURE__ */ new Map();
  if (wanted.size === 0) return results;
  for (const entry of entries) {
    const item = record2(record2(entry).item);
    if (item.type === "tool_call" && typeof item.callId === "string" && wanted.has(item.callId) && item.status !== "running" && item.name !== TASK_NOTICE_TOOL) {
      results.set(item.callId, comparableResult(rowResultText(item)));
    }
  }
  return results;
}
function wirePageFromEntries(entries, turnStart, cwd, turnOf = (turnId) => turnId) {
  const rows = [];
  const turns = [];
  const index = /* @__PURE__ */ new Map();
  const results = resultsForRepeats(entries);
  for (const entry of entries) {
    const row = wireRowFromEntry(entry, (callId) => results.get(callId), cwd);
    if (!row) continue;
    const turnId = record2(entry).turnId;
    const turn = typeof turnId === "string" && turnId ? turnOf(turnId, row.at > 0 ? row.at : null) : "";
    if (turn && turn.length <= 200) {
      let u = index.get(turn);
      if (u === void 0) {
        u = turns.length;
        index.set(turn, u);
        turns.push({ id: turn, at: turnStart(turn) });
      }
      row.u = u;
    }
    rows.push(row);
  }
  return { rows, turns };
}

// resources/third-party/default-features/vivid-activity/server/fold-index.ts
var DEFAULT_LIMIT = 150;
function cursor(value) {
  const raw = value;
  return raw && typeof raw.epoch === "string" && raw.epoch && typeof raw.seq === "number" && Number.isInteger(raw.seq) && raw.seq >= 0 ? { epoch: raw.epoch, seq: raw.seq } : null;
}
var EMPTY = {
  epoch: "",
  rows: [],
  startCursor: null,
  endCursor: null,
  hasOlder: false,
  hasNewer: false,
  reset: false,
  running: null
};
var UNAVAILABLE = { status: "unavailable", ...EMPTY, rows: [] };
var MISSING = { status: "missing", ...EMPTY, rows: [] };
var TURN_MEMO_LIMIT = 2e4;
var AGENT_LIMIT = 5e3;
var CLOSES_PER_AGENT = 100;
var turnStarts = /* @__PURE__ */ new Map();
var closes = /* @__PURE__ */ new Map();
var turnKey = (agentId, turn) => `${agentId}\0${turn}`;
function generationAt(agentId, at) {
  const known = closes.get(agentId);
  if (!known) return 0;
  if (at === void 0 || at === null) return known.dropped + known.times.length;
  let generation = known.dropped;
  for (const time of known.times) if (time <= at) generation++;
  return generation;
}
function turnName(agentId, turnId, at) {
  const generation = generationAt(agentId, at);
  return generation === 0 ? turnId : `${turnId}#${generation}`;
}
function noteTurnStarted(agentId, turnId, at = Date.now()) {
  if (!agentId || !turnId || !Number.isFinite(at) || at <= 0) return;
  const key = turnKey(agentId, turnName(agentId, turnId, at));
  turnStarts.delete(key);
  turnStarts.set(key, at);
  if (turnStarts.size > TURN_MEMO_LIMIT) {
    let drop = turnStarts.size - TURN_MEMO_LIMIT / 2;
    for (const old of turnStarts.keys()) {
      if (drop-- <= 0) break;
      turnStarts.delete(old);
    }
  }
}
function knownTurnStart(agentId, turn) {
  return turnStarts.get(turnKey(agentId, turn)) ?? null;
}
function noteAgentClosed(agentId, at = Date.now()) {
  if (!agentId || !Number.isFinite(at)) return;
  const known = closes.get(agentId) ?? { dropped: 0, times: [] };
  closes.delete(agentId);
  known.times.push(at);
  if (known.times.length > CLOSES_PER_AGENT) {
    known.times.shift();
    known.dropped++;
  }
  closes.set(agentId, known);
  while (closes.size > AGENT_LIMIT) forgetAgentTurns(closes.keys().next().value);
}
function forgetAgentTurns(agentId) {
  if (!agentId) return;
  const prefix = turnKey(agentId, "");
  for (const key of turnStarts.keys()) if (key.startsWith(prefix)) turnStarts.delete(key);
  closes.delete(agentId);
}
function isMissing(message) {
  return typeof message === "string" && /not found/i.test(message);
}
async function handleFoldIndex(input, context, usage) {
  let payload;
  try {
    const handle = context.paseo.agents.ref(input.agentId);
    payload = await handle.timeline.refetch({
      direction: input.direction,
      ...input.cursor && input.direction !== "tail" ? { cursor: input.cursor } : {},
      limit: input.limit ?? DEFAULT_LIMIT,
      projection: "projected"
    });
  } catch (error) {
    return isMissing(error instanceof Error ? error.message : String(error)) ? MISSING : UNAVAILABLE;
  }
  if (typeof payload.error === "string" && payload.error) return isMissing(payload.error) ? MISSING : UNAVAILABLE;
  const activeTurn = payload.agent?.activeTurn;
  let active = null;
  if (activeTurn && typeof activeTurn.turnId === "string" && activeTurn.turnId) {
    const startedAt = typeof activeTurn.startedAt === "string" ? Date.parse(activeTurn.startedAt) : NaN;
    if (Number.isFinite(startedAt) && startedAt > 0) noteTurnStarted(input.agentId, activeTurn.turnId, startedAt);
    const turn = turnName(input.agentId, activeTurn.turnId);
    active = { id: turn.slice(0, 200), at: knownTurnStart(input.agentId, turn) };
  }
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  const cwd = typeof payload.agent?.cwd === "string" ? payload.agent.cwd : null;
  const { rows, turns } = wirePageFromEntries(
    entries,
    (turn) => knownTurnStart(input.agentId, turn),
    cwd,
    (turnId, rowAt) => turnName(input.agentId, turnId, rowAt)
  );
  const status = payload.agent?.status;
  let tok;
  try {
    tok = usage ? await usage.observe(input.agentId, payload.agent, turns.map((turn) => turn.id)) : void 0;
  } catch {
    tok = void 0;
  }
  return {
    status: "ok",
    epoch: typeof payload.epoch === "string" ? payload.epoch : "",
    rows,
    startCursor: cursor(payload.startCursor),
    endCursor: cursor(payload.endCursor),
    hasOlder: payload.hasOlder === true,
    hasNewer: payload.hasNewer === true,
    reset: payload.reset === true || payload.staleCursor === true || payload.gap === true,
    running: typeof status === "string" ? status === "running" : null,
    now: Date.now(),
    turns,
    active,
    ...tok ? { tok } : {}
  };
}

// resources/third-party/default-features/vivid-activity/server/provider-base.ts
var import_node_os2 = require("node:os");
var import_node_path2 = require("node:path");
var BUILTIN_PROVIDERS = ["claude", "codex", "opencode", "pi", "omp", "copilot", "cursor", "acp"];
var MAX_CONFIG_BYTES = 4 * 1024 * 1024;
var PROVIDER_ID = /^[\w.-]{1,64}$/;
var PROVIDER_BASE_TTL_MS = 6e4;
function daemonHome(env = process.env, home = (0, import_node_os2.homedir)()) {
  const raw = env.PASEO_HOME?.trim();
  if (!raw) return (0, import_node_path2.join)(home, ".paseo");
  if (raw === "~") return home;
  if (raw.startsWith("~/")) return (0, import_node_path2.resolve)(home, raw.slice(2));
  return (0, import_node_path2.isAbsolute)(raw) ? (0, import_node_path2.resolve)(raw) : (0, import_node_path2.join)(home, ".paseo");
}
function basesFromConfig(config) {
  const bases = /* @__PURE__ */ new Map();
  const providers = config?.agents?.providers;
  if (!providers || typeof providers !== "object" || Array.isArray(providers)) return bases;
  for (const [id, entry] of Object.entries(providers)) {
    const base = entry && typeof entry === "object" ? entry.extends : void 0;
    if (PROVIDER_ID.test(id) && typeof base === "string" && PROVIDER_ID.test(base)) bases.set(id, base);
  }
  return bases;
}
function createProviderBases(options = {}) {
  const read = options.read ?? (async () => null);
  const now = options.now ?? Date.now;
  const ttl = options.ttlMs ?? PROVIDER_BASE_TTL_MS;
  let cached = null;
  let loading = null;
  async function bases() {
    if (cached && now() - cached.at < ttl) return cached.bases;
    if (!loading) {
      loading = read().then((text2) => {
        try {
          return text2 ? basesFromConfig(JSON.parse(text2)) : /* @__PURE__ */ new Map();
        } catch {
          return /* @__PURE__ */ new Map();
        }
      }).catch(() => /* @__PURE__ */ new Map()).then((found) => {
        cached = { at: now(), bases: found };
        loading = null;
        return found;
      });
    }
    return loading;
  }
  return async function baseOf(provider) {
    if (!provider || !PROVIDER_ID.test(provider)) return null;
    const custom = (await bases()).get(provider);
    if (custom) return custom;
    return BUILTIN_PROVIDERS.includes(provider) ? provider : null;
  };
}

// resources/third-party/default-features/vivid-activity/server/read-image.ts
var import_node_fs2 = require("node:fs");
var import_promises2 = require("node:fs/promises");
var import_node_os3 = require("node:os");
var import_node_path3 = require("node:path");
var NODE_IO = {
  open: (path, flags) => (0, import_promises2.open)(path, flags),
  fdPath: (fd) => process.platform === "linux" ? (0, import_promises2.readlink)(`/proc/self/fd/${fd}`).catch(() => null) : Promise.resolve(null)
};
var READ_CHUNK_BYTES = 64 * 1024;
function resolveAbsolutePath(filePath, agentCwd) {
  const trimmed = filePath.trim();
  if (!trimmed) return null;
  if ((0, import_node_path3.isAbsolute)(trimmed)) return trimmed;
  if (!agentCwd) return null;
  return (0, import_node_path3.resolve)(agentCwd, trimmed);
}
function isInside(root, target) {
  const rel = (0, import_node_path3.relative)(root, target);
  return rel === "" || rel !== ".." && !rel.startsWith(`..${import_node_path3.sep}`) && !(0, import_node_path3.isAbsolute)(rel);
}
function defaultTempRoots(platform = process.platform, temp = (0, import_node_os3.tmpdir)(), home = (0, import_node_os3.homedir)()) {
  const candidates = platform === "darwin" ? [temp, "/tmp"] : [temp];
  const homeDir = (0, import_node_path3.isAbsolute)(home) && (0, import_node_path3.resolve)(home) !== (0, import_node_path3.parse)((0, import_node_path3.resolve)(home)).root ? (0, import_node_path3.resolve)(home) : null;
  const roots = candidates.filter((root) => (0, import_node_path3.isAbsolute)(root)).map((root) => (0, import_node_path3.resolve)(root)).filter((root) => root !== (0, import_node_path3.parse)(root).root && !(homeDir && isInside(root, homeDir)));
  return [...new Set(roots)];
}
function defaultWorktreeRoots(home = (0, import_node_os3.homedir)(), paseoHome2 = process.env.PASEO_HOME) {
  const homeDir = (0, import_node_path3.isAbsolute)(home) && (0, import_node_path3.resolve)(home) !== (0, import_node_path3.parse)((0, import_node_path3.resolve)(home)).root ? (0, import_node_path3.resolve)(home) : null;
  const root = (0, import_node_path3.resolve)(daemonHome({ PASEO_HOME: paseoHome2 }, homeDir ?? (0, import_node_path3.resolve)(home)), "worktrees");
  if (root === (0, import_node_path3.parse)(root).root || homeDir && isInside(root, homeDir)) return [];
  return [root];
}
async function imageRoots(agentCwd, tempRoots, worktreeRoots = defaultWorktreeRoots()) {
  const lexical = [agentCwd, ...tempRoots, ...worktreeRoots].filter((root) => Boolean(root) && (0, import_node_path3.isAbsolute)(root)).map((root) => (0, import_node_path3.resolve)(root));
  const real2 = await Promise.all(lexical.map((root) => (0, import_promises2.realpath)(root).catch(() => null)));
  return {
    lexical: [...new Set(lexical)],
    real: [...new Set(real2.filter((root) => root !== null))]
  };
}
function previewAgentId(agentId) {
  const match = /^provider:([^:]+):([^:]+)$/.exec(agentId);
  if (!match) return agentId;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return agentId;
  }
}
async function resolveAgentCwd(paseo, agentId) {
  const id = typeof agentId === "string" ? agentId.trim() : "";
  if (!id) return null;
  try {
    const ref = paseo.agents.ref(previewAgentId(id));
    await ref.refresh();
    const cwd = ref.cwd;
    return typeof cwd === "string" && (0, import_node_path3.isAbsolute)(cwd) ? cwd : null;
  } catch {
    return null;
  }
}
async function readUpTo(file, maxBytes) {
  const chunks = [];
  let total = 0;
  while (total < maxBytes) {
    const chunk = Buffer.allocUnsafe(Math.min(READ_CHUNK_BYTES, maxBytes - total));
    const { bytesRead } = await file.read(chunk, 0, chunk.length, total);
    if (bytesRead === 0) break;
    chunks.push(bytesRead === chunk.length ? chunk : chunk.subarray(0, bytesRead));
    total += bytesRead;
  }
  return chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, total);
}
async function openedInside(file, realPath, realRoots, io) {
  const kernelPath = await io.fdPath(file.fd);
  if (kernelPath !== null) return (0, import_node_path3.isAbsolute)(kernelPath) && realRoots.some((root) => isInside(root, kernelPath));
  try {
    const opened = await file.stat();
    if (await (0, import_promises2.realpath)(realPath) !== realPath) return false;
    const named = await (0, import_promises2.stat)(realPath);
    return named.dev === opened.dev && named.ino === opened.ino;
  } catch {
    return false;
  }
}
async function handleReadImage(input, context, tempRoots = defaultTempRoots(), io = NODE_IO, worktreeRoots = defaultWorktreeRoots()) {
  const agentCwd = await resolveAgentCwd(context.paseo, input.agentId);
  if (!agentCwd) return { status: "unavailable" };
  const absolutePath = resolveAbsolutePath(input.filePath, agentCwd);
  if (!absolutePath) return { status: "unavailable" };
  const roots = await imageRoots(agentCwd, tempRoots, worktreeRoots);
  if (![...roots.lexical, ...roots.real].some((root) => isInside(root, absolutePath))) return { status: "outside" };
  let realPath;
  try {
    realPath = await (0, import_promises2.realpath)(absolutePath);
  } catch {
    return { status: "not-found" };
  }
  if (!roots.real.some((root) => isInside(root, realPath))) return { status: "outside" };
  try {
    const fileStat = await (0, import_promises2.stat)(realPath);
    if (!fileStat.isFile()) return { status: "not-found" };
    if (fileStat.size > MAX_READ_IMAGE_BYTES) return { status: "too-large" };
  } catch {
    return { status: "not-found" };
  }
  let file;
  try {
    file = await io.open(realPath, import_node_fs2.constants.O_RDONLY | (import_node_fs2.constants.O_NOFOLLOW ?? 0) | (import_node_fs2.constants.O_NONBLOCK ?? 0));
  } catch {
    return { status: "not-found" };
  }
  let bytes;
  try {
    const fileStat = await file.stat();
    if (!fileStat.isFile()) return { status: "not-found" };
    if (fileStat.size > MAX_READ_IMAGE_BYTES) return { status: "too-large" };
    if (!await openedInside(file, realPath, roots.real, io)) return { status: "outside" };
    const head = await readUpTo(file, IMAGE_HEADER_BYTES);
    if (!detectImageMimeType(head, fileStat.size)) return { status: "not-image" };
    bytes = await readUpTo(file, MAX_READ_IMAGE_BYTES + 1);
  } catch {
    return { status: "not-found" };
  } finally {
    await file.close().catch(() => void 0);
  }
  if (bytes.byteLength > MAX_READ_IMAGE_BYTES) return { status: "too-large" };
  const mimeType = detectImageMimeType(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  if (!mimeType) return { status: "not-image" };
  return { status: "ok", data: bytes.toString("base64"), mimeType, byteSize: bytes.byteLength };
}

// resources/third-party/default-features/vivid-activity/shared/prompt-pin.ts
var import_plugin7 = require("@getpaseo/plugin");
var import_zod8 = require("zod");
var MAX_PROMPT_CHARS = 2e4;
var cursorSchema2 = import_zod8.z.object({ epoch: import_zod8.z.string().min(1).max(200), seq: import_zod8.z.number().int().nonnegative() });
var turnPromptRpc = (0, import_plugin7.defineRpc)({
  name: "turn-prompt",
  input: import_zod8.z.object({
    agentId: import_zod8.z.string().min(1).max(256),
    at: cursorSchema2.nullable()
  }),
  output: import_zod8.z.object({
    status: import_zod8.z.enum(["ok", "none", "unavailable"]),
    text: import_zod8.z.string(),
    seq: import_zod8.z.number().int().nonnegative().nullable(),
    /** The user message's turn (Paseo's turnId), when it has one. */
    turnId: import_zod8.z.string().max(200).nullable(),
    truncated: import_zod8.z.boolean()
  })
});

// resources/third-party/default-features/vivid-activity/server/turn-prompt.ts
var PROMPT_SCAN_PAGES = 5;
var PAGE = 200;
var PROMPT_DEADLINE_MS = 1e4;
var NONE = { status: "none", text: "", seq: null, turnId: null, truncated: false };
var UNAVAILABLE2 = { ...NONE, status: "unavailable" };
function asPrompt(entry) {
  if (entry?.item?.type !== "user_message" || typeof entry.item.text !== "string" || typeof entry.seqStart !== "number") return null;
  const text2 = entry.item.text;
  return {
    status: "ok",
    text: text2.length > MAX_PROMPT_CHARS ? text2.slice(0, MAX_PROMPT_CHARS) : text2,
    seq: entry.seqStart,
    turnId: typeof entry.turnId === "string" && entry.turnId.length <= 200 ? entry.turnId : null,
    truncated: text2.length > MAX_PROMPT_CHARS
  };
}
var entriesOf = (page) => Array.isArray(page.entries) ? page.entries : [];
function cursorOf(value) {
  const raw = value;
  return raw && typeof raw.epoch === "string" && raw.epoch && typeof raw.seq === "number" && Number.isInteger(raw.seq) && raw.seq >= 0 ? { epoch: raw.epoch, seq: raw.seq } : null;
}
async function handleTurnPrompt(input, context, deadlineMs = PROMPT_DEADLINE_MS) {
  let late = false;
  let timer;
  const expired = new Promise((resolve4) => {
    timer = setTimeout(() => {
      late = true;
      resolve4(UNAVAILABLE2);
    }, deadlineMs);
  });
  try {
    return await Promise.race([readPrompt(input, context, () => late), expired]);
  } finally {
    clearTimeout(timer);
  }
}
async function readPrompt(input, context, late) {
  const timeline = context.paseo.agents.ref(input.agentId).timeline;
  try {
    const at = input.at;
    if (at) {
      const page = await timeline.refetch({ direction: "before", cursor: { epoch: at.epoch, seq: at.seq + 1 }, limit: 1, projection: "projected" });
      const found = asPrompt(entriesOf(page).find((entry) => entry.seqStart === at.seq));
      if (found) return found;
    }
    let cursor2 = null;
    for (let pages = 0; pages < PROMPT_SCAN_PAGES; pages++) {
      if (late()) return UNAVAILABLE2;
      const page = await timeline.refetch(
        cursor2 ? { direction: "before", cursor: cursor2, limit: PAGE, projection: "projected" } : { direction: "tail", limit: PAGE, projection: "projected" }
      );
      if (typeof page.error === "string" && page.error) return UNAVAILABLE2;
      const entries = entriesOf(page);
      for (let index = entries.length - 1; index >= 0; index--) {
        const found = asPrompt(entries[index]);
        if (found) return found;
      }
      cursor2 = page.hasOlder === true ? cursorOf(page.startCursor) : null;
      if (!cursor2) break;
    }
    return NONE;
  } catch {
    return UNAVAILABLE2;
  }
}

// resources/third-party/default-features/vivid-activity/server/turn-usage.ts
function meterFor(base) {
  if (base === "claude") return "turn";
  if (base === "codex") return "request";
  if (base === "acp" || base === "copilot" || base === "cursor") return "turn";
  return null;
}
var count = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
function rawUsage(value) {
  if (!value || typeof value !== "object") return null;
  const usage = value;
  const input = count(usage.inputTokens);
  const output = count(usage.outputTokens);
  if (input === null || output === null) return null;
  return { input, cached: count(usage.cachedInputTokens), output };
}
function sameUsage(left, right) {
  if (!left || !right) return left === right;
  return left.input === right.input && left.cached === right.cached && left.output === right.output;
}
function shownTokens(meter, usage) {
  const input = meter === "request" && usage.cached !== null ? Math.max(0, usage.input - usage.cached) : usage.input;
  return { i: input, c: usage.cached, o: usage.output };
}
var REQUEST_END_GRACE_MS = 3e3;
var REQUEST_END_WAIT_MS = 1e3;
var MAX_AGENTS = 500;
var MAX_DONE = 50;
var MAX_PENDING = 20;
var RECENT_TURNS = 3;
function createTurnUsage(deps) {
  const agents = /* @__PURE__ */ new Map();
  const setTimer = deps.setTimer ?? ((run, ms) => setTimeout(run, ms));
  const clearTimer = deps.clearTimer ?? ((handle) => clearTimeout(handle));
  const nameOf = (agentId, turnId) => deps.turnName ? deps.turnName(agentId, turnId) : turnId;
  function state(agentId) {
    let found = agents.get(agentId);
    if (found) {
      agents.delete(agentId);
      agents.set(agentId, found);
      return found;
    }
    found = { lastStarted: null, before: null, current: null, done: /* @__PURE__ */ new Map() };
    agents.set(agentId, found);
    if (agents.size > MAX_AGENTS) {
      for (const [id, old] of agents) {
        if (agents.size <= MAX_AGENTS / 2) break;
        if (old.current) continue;
        agents.delete(id);
      }
    }
    return found;
  }
  function remember(entry, turn, figures) {
    entry.done.delete(turn);
    entry.done.set(turn, figures);
    while (entry.done.size > MAX_DONE) entry.done.delete(entry.done.keys().next().value);
  }
  function count2(current, usage) {
    if (current.last === void 0) {
      if (current.pending.length < MAX_PENDING) current.pending.push(usage);
      else current.complete = false;
      return;
    }
    if (sameUsage(usage, current.last)) return;
    current.sum = {
      input: current.sum.input + usage.input,
      cached: current.sum.cached === null || usage.cached === null ? null : current.sum.cached + usage.cached,
      output: current.sum.output + usage.output
    };
    current.requests += 1;
    current.last = usage;
  }
  function finish(agentId, current) {
    const entry = agents.get(agentId);
    if (!entry || entry.current !== current) return;
    clearTimer(current.timer);
    entry.current = null;
    if (current.seen && current.complete && current.requests > 0) remember(entry, current.turn, shownTokens("request", current.sum));
    current.finish();
    deps.feed.release();
  }
  return {
    /** `agent.turn_started` (every Agent). */
    async turnStarted(agentId, provider, startedId) {
      if (!agentId || !startedId) return;
      const turnId = nameOf(agentId, startedId);
      const entry = state(agentId);
      entry.lastStarted = turnId;
      entry.done.delete(turnId);
      if (entry.current && entry.current.turn !== turnId) finish(agentId, entry.current);
      if (meterFor(await deps.base(provider).catch(() => null)) !== "request") return;
      if (entry.lastStarted !== turnId || entry.current) return;
      let finishTurn = () => {
      };
      const finished = new Promise((resolve4) => {
        finishTurn = resolve4;
      });
      const current = {
        turn: turnId,
        seen: false,
        last: void 0,
        pending: [],
        sum: { input: 0, cached: 0, output: 0 },
        requests: 0,
        complete: true,
        ending: false,
        timer: null,
        finished,
        finish: finishTurn
      };
      entry.current = current;
      deps.feed.hold();
      let record3 = null;
      try {
        record3 = await deps.refresh(agentId);
      } catch {
        record3 = null;
      }
      if (entry.current !== current) return;
      if (!record3) {
        current.complete = false;
        current.last = null;
      } else {
        current.last = rawUsage(record3.lastUsage);
      }
      const pending = current.pending;
      current.pending = [];
      for (const usage of pending) count2(current, usage);
    },
    /** `agent.turn_ended`: the sum is final once the subscription says the Agent left the turn, or after a grace time. */
    turnEnded(agentId, turnId) {
      const current = agents.get(agentId)?.current;
      if (!current || !turnId || current.turn !== nameOf(agentId, turnId) || current.ending) return;
      current.ending = true;
      current.timer = setTimer(() => finish(agentId, current), REQUEST_END_GRACE_MS);
    },
    /** One message of the subscription (`agent_update` payload). */
    feedUpdate(payload) {
      const update = payload;
      const agentId = update?.kind === "remove" ? update.agentId : update?.agent?.id;
      if (typeof agentId !== "string") return;
      const current = agents.get(agentId)?.current;
      if (!current) return;
      if (update?.kind === "upsert") {
        const running = update.agent?.activeTurn?.turnId;
        if (typeof running !== "string" || nameOf(agentId, running) !== current.turn) return;
        const usage = rawUsage(update.agent?.lastUsage);
        if (usage) count2(current, usage);
        return;
      }
      if (update?.kind === "remove") finish(agentId, current);
    },
    /** The subscription missed updates (it failed, or reconnected with a new snapshot): running sums are incomplete. */
    feedGap() {
      for (const entry of agents.values()) if (entry.current) entry.current.complete = false;
    },
    /**
     * A fold index read: what the Agent's record said with the page (`payload.agent`). Returns the tokens to send for
     * `turns` (the names of the page's turns) plus the latest finished ones and a live sum.
     */
    async observe(agentId, agent, turns) {
      if (!agent) return void 0;
      const entry = agents.get(agentId);
      const provider = typeof agent.provider === "string" ? agent.provider : "";
      const meter = meterFor(await deps.base(provider).catch(() => null));
      const running = typeof agent.activeTurn?.turnId === "string" && agent.activeTurn.turnId ? nameOf(agentId, agent.activeTurn.turnId) : null;
      if (meter === "turn") {
        const tracked = entry ?? state(agentId);
        if (running) {
          if (!tracked.before || tracked.before.turn !== running) tracked.before = { turn: running, usage: rawUsage(agent.lastUsage) };
        } else if (tracked.before) {
          const { turn, usage: before } = tracked.before;
          tracked.before = null;
          const after = rawUsage(agent.lastUsage);
          if (tracked.lastStarted === turn && after && !sameUsage(after, before)) remember(tracked, turn, shownTokens("turn", after));
        }
      } else if (meter === "request" && entry?.current) {
        const current = entry.current;
        if (running === current.turn) current.seen = true;
        else if (!running) {
          await Promise.race([current.finished, new Promise((resolve4) => setTimer(resolve4, REQUEST_END_WAIT_MS))]);
        }
      }
      return report(agentId, turns);
    },
    /**
     * The session closed (`agent.closed`; from Paseo 0.14 also after an hour idle): a turn still counted ends here, and the
     * finished turns keep their figures for their rows (the next session's turns go by other names, `deps.turnName`).
     */
    closed(agentId) {
      const entry = agents.get(agentId);
      if (entry?.current) finish(agentId, entry.current);
      if (entry) entry.before = null;
    },
    /** The Agent was archived: nothing of it is shown live any more. */
    forget(agentId) {
      const entry = agents.get(agentId);
      if (entry?.current) finish(agentId, entry.current);
      agents.delete(agentId);
    },
    dispose() {
      for (const [agentId, entry] of Array.from(agents)) if (entry.current) finish(agentId, entry.current);
      agents.clear();
    },
    /** For tests. */
    debug(agentId) {
      const entry = agents.get(agentId);
      return entry ? { lastStarted: entry.lastStarted, before: entry.before, current: entry.current && { ...entry.current }, done: [...entry.done] } : null;
    }
  };
  function report(agentId, turns) {
    const entry = agents.get(agentId);
    if (!entry) return void 0;
    const out = [];
    const added = /* @__PURE__ */ new Set();
    const push = (turn, figures, live) => {
      if (added.has(turn) || out.length >= MAX_TOKEN_TURNS || turn.length > 200) return;
      added.add(turn);
      out.push({ id: turn, ...figures, ...live ? { live: true } : {} });
    };
    const current = entry.current;
    if (current && current.seen && current.complete && current.requests > 0) push(current.turn, shownTokens("request", current.sum), !current.ending);
    for (const turn of turns) {
      const figures = entry.done.get(turn);
      if (figures) push(turn, figures, false);
    }
    const recent = [...entry.done.keys()].slice(-RECENT_TURNS).reverse();
    for (const turn of recent) push(turn, entry.done.get(turn), false);
    return out.length > 0 ? out : void 0;
  }
}

// resources/third-party/default-features/vivid-activity/server/usage-feed.ts
var USAGE_FEED_CLOSE_MS = 3e4;
var USAGE_FEED_RETRY_MS = 5e3;
function createUsageFeed(options) {
  const setTimer = options.setTimer ?? ((run, ms) => setTimeout(run, ms));
  const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
  const closeAfter = options.closeAfterMs ?? USAGE_FEED_CLOSE_MS;
  const retryAfter = options.retryMs ?? USAGE_FEED_RETRY_MS;
  let holds = 0;
  let connection = null;
  let token = null;
  let steady = false;
  let closeTimer = null;
  let retryTimer = null;
  function stop() {
    const open3 = connection;
    connection = null;
    token = null;
    steady = false;
    open3?.close();
  }
  function retry() {
    if (holds === 0 || retryTimer !== null) return;
    retryTimer = setTimer(() => {
      retryTimer = null;
      if (holds > 0 && token === null) start();
    }, retryAfter);
  }
  function start() {
    const mine = {};
    token = mine;
    steady = false;
    let opened = null;
    try {
      opened = options.open({
        snapshot() {
          if (token !== mine) return;
          if (steady) options.onGap();
          steady = true;
        },
        update(payload) {
          if (token === mine) options.onUpdate(payload);
        },
        failed() {
          if (token !== mine) return;
          options.onGap();
          stop();
          retry();
        }
      });
    } catch {
      opened = null;
    }
    if (token !== mine) {
      opened?.close();
      return;
    }
    if (!opened) {
      token = null;
      options.onGap();
      retry();
      return;
    }
    connection = opened;
  }
  return {
    hold() {
      holds += 1;
      if (closeTimer !== null) {
        clearTimer(closeTimer);
        closeTimer = null;
      }
      if (token === null && retryTimer === null) start();
    },
    release() {
      holds = Math.max(0, holds - 1);
      if (holds > 0 || closeTimer !== null) return;
      closeTimer = setTimer(() => {
        closeTimer = null;
        if (holds === 0) stop();
      }, closeAfter);
    },
    dispose() {
      holds = 0;
      if (closeTimer !== null) clearTimer(closeTimer);
      if (retryTimer !== null) clearTimer(retryTimer);
      closeTimer = null;
      retryTimer = null;
      stop();
    },
    debug() {
      return { holds, open: connection !== null, steady, retrying: retryTimer !== null };
    }
  };
}
function openUsageFeed(api, events) {
  const controller = new AbortController();
  let closed = false;
  let detach = null;
  let subscription = null;
  const release = () => {
    if (subscription) void subscription.release().catch(() => void 0);
  };
  void Promise.resolve().then(() => api.agents.list({ subscribe: {}, filter: { statuses: ["running", "initializing"] }, page: { limit: 1 }, signal: controller.signal })).then((result) => {
    subscription = result.subscription;
    if (closed) {
      release();
      return;
    }
    detach = result.subscription.subscribe({
      snapshot: () => events.snapshot(),
      update: (message) => {
        const update = message;
        if (update?.type === "agent_update") events.update(update.payload);
      },
      error: (error) => events.failed(error)
    });
  }).catch((error) => {
    if (!closed) events.failed(error);
  });
  return {
    close() {
      if (closed) return;
      closed = true;
      detach?.();
      controller.abort();
      release();
    }
  };
}

// resources/third-party/default-features/vivid-activity/shared/settings.ts
var import_plugin8 = require("@getpaseo/plugin");
var import_zod9 = require("zod");

// resources/third-party/default-features/vivid-activity/shared/typography.ts
var TEXT_SIZES = ["small", "standard", "large", "larger"];
var LINE_SPACINGS = ["compact", "standard", "relaxed"];
var DEFAULT_TEXT_SIZE = "standard";
var DEFAULT_LINE_SPACING = "standard";
var MONO_FONT_MAX = 200;
var SIZE_SCALE = { small: 11 / 12, standard: 1, large: 14 / 12, larger: 16 / 12 };

// resources/third-party/default-features/vivid-activity/shared/settings.ts
var paletteModeSchema = import_zod9.z.enum(["vivid", "soft", "high_contrast", "theme"]);
var expansionModeSchema = import_zod9.z.enum(["always", "latest", "never", "failures"]);
var takeoverScopeSchema = import_zod9.z.enum(["all", "reasoning", "off"]);
var DEFAULT_TAKEOVER = "all";
var EXPANSION_TARGETS = [
  { key: "thinking", get label() {
    return t2("ui.thinking");
  }, default: "latest" },
  { key: "read", get label() {
    return t2("settings.readFile");
  }, default: "never" },
  { key: "edit", get label() {
    return t2("settings.editFile");
  }, default: "never" },
  { key: "write", get label() {
    return t2("settings.writeFile");
  }, default: "never" },
  { key: "shell", get label() {
    return t2("ui.command");
  }, default: "never" },
  { key: "search", get label() {
    return t2("settings.search");
  }, default: "latest" },
  { key: "fetch", get label() {
    return t2("settings.fetchPage");
  }, default: "latest" },
  { key: "worktree_setup", get label() {
    return t2("settings.worktreeSetup");
  }, default: "latest" },
  { key: "sub_agent", get label() {
    return t2("settings.subagent");
  }, default: "latest" },
  { key: "plain_text", get label() {
    return t2("settings.plainTextResults");
  }, default: "latest" },
  { key: "plan", get label() {
    return t2("settings.plan");
  }, default: "latest", hidden: true },
  { key: "ask", get label() {
    return t2("settings.ask");
  }, default: "never" },
  { key: "speak", get label() {
    return t2("settings.readAloud");
  }, default: "latest" },
  { key: "todo", get label() {
    return t2("settings.taskListTools");
  }, default: "latest" },
  { key: "browser", get label() {
    return t2("settings.browserTools");
  }, default: "latest" },
  { key: "unknown", get label() {
    return t2("settings.otherTools");
  }, default: "latest" }
];
var DEFAULT_EXPANSION = Object.fromEntries(
  EXPANSION_TARGETS.map((target) => [target.key, target.default])
);
var expansionSettingsSchema = import_zod9.z.object(
  Object.fromEntries(
    EXPANSION_TARGETS.map((target) => [target.key, expansionModeSchema.default(target.default)])
  )
);
var densitySchema = import_zod9.z.enum(["compact", "standard"]);
var DEFAULT_DENSITY = "compact";
var DEFAULT_FOLD = true;
var STRENGTH_KINDS = ["dim", "faded", "soft", "full"];
var DEFAULT_STRENGTH = "full";
var strengthSchema = import_zod9.z.enum(STRENGTH_KINDS);
var commandColorsSchema = import_zod9.z.enum(["expanded", "always"]);
var DEFAULT_PIN_PROMPT = true;
var LOADER_KINDS = ["spinner", "sparkle", "orb", "snake", "matrix"];
var DEFAULT_LOADER = "spinner";
var loaderSchema = import_zod9.z.enum(LOADER_KINDS);
var activitySettings = (0, import_plugin8.defineSettings)({
  id: "display",
  scope: "host",
  // 保持 1，见上。
  version: 1,
  schema: import_zod9.z.object({
    takeover: takeoverScopeSchema.default(DEFAULT_TAKEOVER),
    // 0.11.0：左侧边栏入口开关。关 = 移除设置入口（命令面板入口不受影响）；旧设置没有这一项，读出来取默认值。
    sidebar: import_zod9.z.boolean().default(true),
    // 0.11.0：跟随矩阵（思考行走 thoughtTailFollow，尾窗窗口语义独立）。按展开区域逐域开关。
    followOutput: import_zod9.z.object({
      shell: import_zod9.z.boolean().default(true),
      logs: import_zod9.z.boolean().default(true),
      todo: import_zod9.z.boolean().default(true),
      browser: import_zod9.z.boolean().default(true)
    }).default({ shell: true, logs: true, todo: true, browser: true }),
    // 0.11.0：长行折行矩阵（预发布的 diffWrap 扩围，不迁移；旧设置读出来取默认值）。off = 单行横滚（0.11.0 前的现状）。
    wrapLines: import_zod9.z.object({
      diff: import_zod9.z.boolean().default(false),
      code: import_zod9.z.boolean().default(false),
      output: import_zod9.z.boolean().default(false)
    }).default({ diff: false, code: false, output: false }),
    palette: paletteModeSchema.default("vivid"),
    expansion: expansionSettingsSchema.default(DEFAULT_EXPANSION),
    // 本地补丁：「完成后折叠连续的思考与工具行」。旧设置没有这两项，读出来取默认值，所以版本号不变。
    fold: import_zod9.z.boolean().default(DEFAULT_FOLD),
    density: densitySchema.default(DEFAULT_DENSITY),
    // 0.11.0：同上，旧设置读出来取默认值。
    strength: strengthSchema.default(DEFAULT_STRENGTH),
    // 0.11.0：「命令着色」行头 shell 命令的语法色（client/activity.tsx 行头段；chat-polish 同名设置）。
    commandColors: commandColorsSchema.default("expanded"),
    // 0.11.0：「思考行实时跟随」：开 = 展开后的思考框展示最新 N 行并跟随输出；关 = 头部 20 行冻结（现状）。
    thoughtTailFollow: import_zod9.z.boolean().default(false),
    // 0.11.0：尾窗大小（块模式=行数，步骤模式=步数）。UI 层钳制 5–500 后才保存。
    thoughtTailLines: import_zod9.z.number().int().min(5).max(500).default(20),
    // 「每轮结束时间」（server/turn-time.ts 记录新轮次）与「活动时间」（活动行/折叠摘要的更新时间）。默认关；
    // 旧设置没有这两项，读出来取默认值，所以版本号不变。
    turnTime: import_zod9.z.boolean().default(false),
    foldTime: import_zod9.z.boolean().default(false),
    // 0.6.0：同上，旧设置没有这一项，读出来取默认值。
    pinPrompt: import_zod9.z.boolean().default(DEFAULT_PIN_PROMPT),
    // 0.8.0：同上。
    loader: loaderSchema.default(DEFAULT_LOADER),
    // 0.9.0（issue #3）：代码字体（shared/typography.ts）。同上，旧设置读出来取默认值。
    monoFont: import_zod9.z.string().max(MONO_FONT_MAX).default(""),
    textSize: import_zod9.z.enum(TEXT_SIZES).default(DEFAULT_TEXT_SIZE),
    lineSpacing: import_zod9.z.enum(LINE_SPACINGS).default(DEFAULT_LINE_SPACING)
  })
});
function turnTimeFromValues(values) {
  const parsed = activitySettings.schema.safeParse(values ?? {});
  return parsed.success ? parsed.data.turnTime : false;
}

// resources/third-party/default-features/vivid-activity/server/turn-time.ts
var TurnTimePublisher = class {
  constructor(settings) {
    /** null until the stored switch is known; a write always waits for it. */
    this.enabled = null;
    this.ready = Promise.resolve();
    this.stopSettings = null;
    this.stopped = false;
    /** A change notification is at least as new as the first read: a read that answers after one must not undo it. */
    this.notified = false;
    /** Per agent: a number that changes whenever one of its turns starts (`started`). */
    this.starts = /* @__PURE__ */ new Map();
    this.startCount = 0;
    this.settings = settings;
  }
  /** Reads the switch once and follows later changes. */
  start() {
    this.ready = this.settings.read().then((state) => {
      if (!this.stopped && !this.notified) this.enabled = state.status === "ready" && turnTimeFromValues(state.values);
    }).catch(() => void 0);
    try {
      this.stopSettings = this.settings.subscribe((state) => {
        this.notified = true;
        this.enabled = state.status === "ready" && turnTimeFromValues(state.values);
      });
    } catch {
      this.stopSettings = null;
    }
  }
  dispose() {
    this.stopped = true;
    this.stopSettings?.();
    this.stopSettings = null;
  }
  /** A turn of the agent began (`agent.turn_started`): an earlier turn's row not written yet would land inside it. */
  started(agentId) {
    this.starts.set(agentId, ++this.startCount);
  }
  /** The agent was archived: nothing is written for it any more. */
  forget(agentId) {
    this.starts.delete(agentId);
  }
  /** One row for a finished turn, carrying the moment it ended. */
  async finish(event, context) {
    const at = Date.now();
    const agentId = event.agent.id;
    const startsBefore = this.starts.get(agentId);
    await this.ready;
    if (!this.enabled || this.stopped) return;
    if (this.starts.get(agentId) !== startsBefore) return;
    const data = turnTimeDataSchema.parse({ at, turnId: event.turnId, outcome: event.outcome.kind });
    await this.append(context.paseo, agentId, `${event.turnId ?? "turn"}-end-${at}`, data);
  }
  async append(paseo, agentId, id, data) {
    try {
      await paseo.agents.ref(agentId).timeline.append({
        type: "plugin",
        id,
        kind: TURN_TIME_RENDERER_KIND,
        version: TURN_TIME_RENDERER_VERSION,
        data
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/unknown agent|not found/i.test(message)) {
        console.error("vivid-activity: turn time row unavailable", agentId, error);
      }
    }
  }
};

// resources/third-party/default-features/vivid-activity/index.server.ts
function contribute(server) {
  const locales = createLocaleService(server, { pluginId: "vivid-activity", builtins: BUILTIN_CATALOGS });
  let api = null;
  const see = (paseo) => {
    if (paseo) api = paseo;
  };
  const feed = createUsageFeed({
    open: (events) => api ? openUsageFeed(api, events) : null,
    onUpdate: (payload) => usage.feedUpdate(payload),
    onGap: () => usage.feedGap()
  });
  const usage = createTurnUsage({
    base: createProviderBases(),
    refresh: async (agentId) => {
      const result = api ? await api.agents.ref(agentId).refresh() : null;
      return result?.agent ?? null;
    },
    feed,
    turnName: (agentId, turnId) => turnName(agentId, turnId)
  });
  server.handle(getClientChunk, getUiChunk);
  const settings = server.registerSettings(activitySettings);
  const turnTimes = new TurnTimePublisher(settings);
  turnTimes.start();
  server.handle(childSummaryRpc, handleChildSummary);
  server.handle(readImageRpc, (input, context) => handleReadImage(input, context));
  server.handle(foldIndexRpc, (input, context) => {
    see(context.paseo);
    return handleFoldIndex(input, context, usage);
  });
  server.handle(turnPromptRpc, (input, context) => handleTurnPrompt(input, context));
  const stopTurns = server.on("agent.turn_started", (event, context) => {
    see(context?.paseo);
    noteTurnStarted(event.agent.id, event.turnId);
    turnTimes.started(event.agent.id);
    void usage.turnStarted(event.agent.id, event.agent.provider, event.turnId).catch(() => void 0);
  });
  const stopEnded = server.on("agent.turn_ended", (event, context) => {
    see(context?.paseo);
    usage.turnEnded(event.agent.id, event.turnId);
    return turnTimes.finish(event, context);
  });
  const stopClosed = server.on("agent.closed", (event) => {
    noteAgentClosed(event.agent.id);
    usage.closed(event.agent.id);
  });
  const stopArchived = server.on("agent.archived", (event) => {
    forgetAgentTurns(event.agent.id);
    usage.forget(event.agent.id);
    turnTimes.forget(event.agent.id);
  });
  return () => {
    locales.dispose();
    stopTurns();
    stopEnded();
    turnTimes.dispose();
    stopClosed();
    stopArchived();
    usage.dispose();
    feed.dispose();
  };
}

return module.exports;})