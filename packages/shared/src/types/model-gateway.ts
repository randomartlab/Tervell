import type {GatewaySubscription,GatewayLogin,GatewayPrompt,GatewayPlatformLogin} from './gateway-extensions'
/** 原生模型管理页的最小数据契约；不返回供应商秘密或控制台地址。 */
export interface GatewayModel { id:string;name:string;enabled:boolean;efforts:string[];images:boolean;context:number;output:number;alias?:string }
export interface GatewayAccount {id:string;name:string;masked:string;enabled:boolean;weight?:number}
export interface GatewayProvider {icon?:string;website?:string;keysUrl?:string;id:string;name:string;preset:string;chat:string;responses:string;anthropic:string;gemini:string;enabled:boolean;ready:boolean;keySet:boolean;keyMasked:string;routing:string;fallback:string[];models:GatewayModel[];accounts:GatewayAccount[];subscription:boolean;subscriptionId?:string;logins?:GatewayLogin[];platformLogins?:GatewayPlatformLogin[]}
export interface GatewayPresetRegion {id:string;name:string;chat:string;responses:string;anthropic:string;gemini?:string;models?:string[];keysUrl?:string}
export interface GatewayPreset {id:string;name:string;icon?:string;kind?:string;note?:string;added?:boolean;website?:string;keysUrl?:string;keyHint?:string;regionLabel?:string;regions?:GatewayPresetRegion[];models?:string[];chat:string;responses:string;anthropic:string;gemini?:string;noKey:boolean}
export interface GatewayGroup {id:string;name:string;ref:string;members:string[];routing:string;enabled:boolean;ready:boolean;efforts:string[];note:string}
export interface GatewayUsage {calls:number;errors:number;input:number;output:number;reasoning:number;cost:number;unpriced:number;models:Array<{id:string;name:string;calls:number;cost:number}>}
export interface GatewayPlugin {spec:string;name:string;icon?:string;enabled:boolean;version:string;latest?:string;error?:string;providers:string[];kind:string;optionsExample?:Record<string,unknown>;clashes?:Array<{provider:string;name:string;serving:string}>}
export interface GatewaySnapshot {providers:GatewayProvider[];presets:GatewayPreset[];groups:GatewayGroup[];privacy:{accountDiscovery:boolean;forcedOff:boolean;telemetryOff:boolean;redact:boolean;words:string[];allow:string[];rules:Array<{kind:string;prefix?:string;regex?:string}>};usage:GatewayUsage;plugins:GatewayPlugin[];subscriptions:GatewaySubscription[];warnings:string[]}
export interface GatewayProviderInput {id:string;name:string;preset?:string;chat:string;responses:string;anthropic:string;gemini:string;baseAPI?:string;key?:string;models:string[];routing:string;fallback:string[];advanced?:Record<string,unknown>;create?:boolean}
export type GatewayCommand =
 | {kind:'provider.save';provider:GatewayProviderInput}
 | {kind:'provider.toggle';id:string;enabled:boolean}
 | {kind:'provider.delete'|'provider.refresh'|'provider.test';id:string}
 | {kind:'account.add';id:string;name:string;key:string}
 | {kind:'account.toggle';id:string;ref:string;enabled:boolean}
 | {kind:'account.delete';id:string;ref:string}
 | {kind:'model.preferences';id:string;model:string;name?:string;efforts?:string[];images?:boolean;context?:number;output?:number}
 | {kind:'group.save';group:{id:string;name:string;members:string[];routing:string;note?:string}}
 | {kind:'group.toggle';id:string;enabled:boolean}
 | {kind:'group.delete';id:string}
 | {kind:'privacy';accountDiscovery?:boolean;telemetryOff?:boolean;redact?:boolean}
 | {kind:'plugin.toggle';spec:string;enabled:boolean}
 | {kind:'plugin.add'|'plugin.remove'|'plugin.update';spec:string}
 | {kind:'privacy.rules';words:string[];allow:string[];rules:Array<{kind:string;prefix?:string;regex?:string}>}
 | {kind:'plugin.options';spec:string;options:Record<string,unknown>}
 | {kind:'plugin.prefer';spec:string;provider:string}
 | {kind:'plugins.check'|'plugins.update'}
 | {kind:'plugins.builtin';id:string;enabled?:boolean;config?:Record<string,unknown>}
 | {kind:'plugins.mirror';enabled:boolean}
 | {kind:'plugins.registry';url:string}
 | {kind:'subscription.option';provider:string;key:string;enabled:boolean}
 | {kind:'login.toggle';agent:string;user:string;enabled:boolean}
 | {kind:'login.switch'|'login.forget';agent:string;user:string}
 | {kind:'signin.import';agent:string;files:string[];accessOnly?:boolean}
 | {kind:'signin.token';token:string}
 | {kind:'signin.export';agent:'claude'|'codex';format:'sub2api'|'cliproxyapi';users:string[]}
 | {kind:'platform.session';id:string;platform:'stepfun'|'qianfan';text:string}
 | {kind:'platform.signout';id:string;platform:'stepfun'|'qianfan'|'qianwen'}
 | {kind:'platform.start'|'platform.poll'|'platform.cancel';id:string}
 | {kind:'signin.plugin';provider:string;method:number;inputs:Record<string,string>;key?:string;user?:string}
 | {kind:'signin.start';agent:string;site?:string;user?:string}
 | {kind:'signin.poll'|'signin.cancel';id:string}
 | {kind:'signin.callback';id:string;url:string}
export interface GatewayCommandResult {snapshot:GatewaySnapshot;message?:string;signIn?:GatewaySignIn;prompt?:GatewayPrompt;imported?:Array<{user?:string;status:string;error?:string}>;exported?:{path:string;accounts:string[]};platformSignIn?:{state:string;url?:string;error?:string}}
export interface GatewayReasoningSelection {model:string;effort?:string}

export interface GatewaySignIn {id:string;agent:string;url:string;code?:string;state:string;instructions?:string;pasteCallback?:boolean;pasteCode?:boolean;pasteKey?:boolean;opened?:boolean;user?:string;error?:string}
