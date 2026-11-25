import type {DesktopThemePreset} from './desktop-theme'
import type {KernelSessionControl, KernelConfigValue} from './kernel-controls'
/** 桌面内核与声明式插件；CLI 使用自己的登录态，不把 Pi 渠道凭据注入外部进程。 */
export interface DesktopKernelConfig { id: string; name: string; command: string; args: string[]; enabled: boolean }
export interface DesktopKernelEntry extends DesktopKernelConfig {
  builtin: boolean; available: boolean; resolvedCommand?: string; diagnostic?: string; pluginId?: string
  detected?: 'checking' | 'installed' | 'missing' | 'broken' | 'custom'
  transport?: 'native'|'acp'|'pty'; description?:string;homepage?:string;catalogSources?:string[];hostRequirement?:string
  launchArgs?:string[];managed?:boolean;installDiagnostic?:string;
  verification?: {protocol:1;initialized?:boolean;session:'ready'|'login-required';agentName?:string;agentVersion?:string;checkedAt:number};
  version?: string; cliAvailable?: boolean; adapterAvailable?: boolean; installable?: boolean; source?: string
}
export interface DesktopKernelSelection { kernelId: string; modelId?: string; modeId?: string; configValues?:Record<string,KernelConfigValue>; autoApprove?:boolean }
export interface DesktopKernelPreferences {kernelId:string;workspaceId?:string;global:DesktopKernelSelectionDefaults;project:DesktopKernelSelectionDefaults;effective:DesktopKernelSelectionDefaults}
export interface DesktopKernelSelectionDefaults {modelId?:string;modeId?:string;configValues?:Record<string,KernelConfigValue>;autoApprove?:boolean}
export interface DesktopKernelCatalog { models: Array<{ id: string; name: string }>; modes: Array<{ id: string; name: string }>; currentModelId: string | null; currentModeId: string | null; controls?:KernelSessionControl[]; kernelId?:string; sessionId?:string; observedAt?:number; routedModel?:string;notice?:string }
export interface DesktopKernelState { entries: DesktopKernelEntry[]; defaultKernelId: string; refreshing?: boolean; checkedAt?: number; warning?: string }
export interface DesktopCliInstall {
  id: string; kernelId: string; phase: 'installing' | 'verifying' | 'succeeded' | 'failed' | 'cancelled'
  output: string; startedAt: number; finishedAt?: number; error?: string; exitCode?: number
}
export interface DesktopPluginRuntime {ecosystem:'paseo'|'dsh';bundleId:string;serverEntry?:string;clientEntry?:string;discoverEntriesAfterBuild?:boolean}
export interface DesktopPluginStatus {id:string;client?:boolean;phase:'starting'|'ready'|'failed'|'stopped';tools:string[];hooks:string[];rpcs:string[];logs:string[];error?:string}
export interface DesktopPluginManifest { id: string; name: string; version: string; description: string; capabilities: Array<'kernels' | 'theme' | 'panel'|'runtime'>; kernels?: DesktopKernelConfig[]; theme?: Record<string, string>; themes?:DesktopThemePreset[]; panel?: string;runtime?:DesktopPluginRuntime }
export interface DesktopPluginEntry { manifest: DesktopPluginManifest; enabled: boolean; source: string; digest: string; installedAt: number;config?:Record<string,unknown>;access?:{workspaceIds:string[];network:boolean;cli?:string[];runtime?:'restricted'|'trusted';allWorkspaces?:boolean} }
export interface DesktopPluginOffer { manifest: DesktopPluginManifest; digest: string; source: string }
export interface DesktopPluginState { installed: DesktopPluginEntry[]; catalog: DesktopPluginOffer[]; selectedThemeId?:string|null;runtime?:DesktopPluginStatus[] }
export const DESKTOP_EXTENSION_IPC = {
  kernelLogin:'extensions:kernel-login',
  kernelPreferences:'extensions:kernel-preferences',saveKernelPreferences:'extensions:kernel-preferences-save',
  pluginTimelineChanged:'extensions:plugin-timeline-changed',
  pluginRuntime:'extensions:plugin-runtime',pluginRpc:'extensions:plugin-rpc',pluginClient:'extensions:plugin-client',pluginSettings:'extensions:plugin-settings',
  pluginHostCall:'extensions:plugin-host-call',
  kernels: 'extensions:kernels', kernelsChanged: 'extensions:kernels-changed', refreshKernels: 'extensions:kernels-refresh', installCli: 'extensions:cli-install', cliInstall: 'extensions:cli-install-state', cancelCli: 'extensions:cli-install-cancel', cliInstallChanged: 'extensions:cli-install-changed', saveKernel: 'extensions:kernel-save', deleteKernel: 'extensions:kernel-delete', defaultKernel: 'extensions:kernel-default', probeKernel: 'extensions:kernel-probe', kernelTerminal:'extensions:kernel-terminal',
  sessionKernel: 'extensions:session-kernel', sessionCatalog:'extensions:session-catalog', catalogChanged:'extensions:catalog-changed', workspaceKernel: 'extensions:workspace-kernel', plugins: 'extensions:plugins', market:'extensions:market', marketSourceAdd:'extensions:market-source-add',marketPreview:'extensions:market-preview',themeImport:'extensions:theme-import',themeSource:'extensions:theme-source',themeSelect:'extensions:theme-select',pluginsChanged:'extensions:plugins-changed', previewPlugin: 'extensions:plugin-preview', installPlugin: 'extensions:plugin-install', togglePlugin: 'extensions:plugin-toggle', removePlugin: 'extensions:plugin-remove',
} as const
