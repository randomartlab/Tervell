/** 模型服务的插件和订阅契约；认证秘密只作为提交参数，不进入目录快照。 */
export interface GatewayAuthMethod {type:string;label:string;placeholder?:string;keyless?:boolean;keyAsked?:boolean}
export interface GatewayAuthOption {key:string;label:string;description?:string;on:boolean;confirm?:string}
export interface GatewaySubscription {id:string;providerId?:string;name:string;icon:string;spec?:string;methods:GatewayAuthMethod[];signedIn:boolean;single:boolean;models:number;importable:boolean;importFrom?:string;options:GatewayAuthOption[];sites?:Array<{id:string;name:string}>;risk?:string;installSpec?:string}
export interface GatewayLogin {user:string;plan?:string;active:boolean;enabled:boolean;lapsed?:string;accessOnly?:boolean}
export interface GatewayPrompt {type:string;key:string;message:string;placeholder?:string;options:Array<{label:string;value:string;hint?:string}>}
export interface GatewayPluginListing {spec:string;name:string;icon?:string;description:string;providers:string[];kind:string;version?:string;license?:string;repository?:string;community:boolean}
export interface GatewayPluginCatalog {listings:GatewayPluginListing[];warnings:string[];bun:boolean;registry?:string;mirror:boolean}
export interface GatewayPluginPage {key:string;spec:string;title:string;slot?:string;reads:string[];service?:string;context?:{provider?:{id:string;name:string}}}
export interface GatewayBuiltinPlugin {id:string;name:string;description:string;enabled:boolean;inUse:number;error?:string;config?:Record<string,unknown>}
export type GatewayQuery = {kind:'plugins.builtin'}|{kind:'plugins.github'}|{kind:'plugins.catalog'}|{kind:'plugins.pages'}|{kind:'plugins.document';key:string}|{kind:'plugins.page-call';key:string;method:'read'|'options.get'|'options.set'|'asset'|'image.copy'|'image.save';params:Record<string,unknown>}|{kind:'plugins.search';query:string}|{kind:'plugins.readme';spec:string}|{kind:'signin.prompt';provider:string;method:number;inputs:Record<string,string>;key?:string;value?:string}
export interface GatewayQueryResult {builtins?:GatewayBuiltinPlugin[];pages?:GatewayPluginPage[];document?:string;result?:unknown;catalog?:GatewayPluginCatalog;readme?:{title:string;text:string};prompt?:GatewayPrompt|null;inputs?:Record<string,string>;error?:string}

export interface GatewayPlatformLogin {kind:'stepfun'|'qianfan'|'qianwen';signedIn:boolean;url?:string;bookmarklet?:string;account?:string;ended?:boolean}
