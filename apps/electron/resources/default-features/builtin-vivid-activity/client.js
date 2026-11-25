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

// resources/third-party/default-features/vivid-activity/index.client.tsx
var index_client_exports = {};
__export(index_client_exports, {
  default: () => contribute
});
module.exports = __toCommonJS(index_client_exports);
var import_ui = require("@getpaseo/plugin/client/ui");
function contribute(client) {
  return client.addSettingsScreen({ id: "display", title: "\u5F69\u8272\u6D3B\u52A8\u4E0E\u8FC7\u7A0B\u663E\u793A", icon: "Activity", Component: import_ui.NativeActivitySettings });
}

return module.exports;})