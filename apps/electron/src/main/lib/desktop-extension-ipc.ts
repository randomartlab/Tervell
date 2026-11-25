import {kernelPreferences,saveKernelPreferences,defaultSessionKernelSelection,mergeKernelDefaults,KernelDefaultsSchema} from './desktop-kernel-preferences'
import {readFileSync} from 'node:fs'
import {BUILTIN_FEATURE_IPC} from '@proma/shared'
import {builtinNativeCall} from './builtin-native-service'
import {join} from 'node:path'
import {pluginDirectory} from './plugin-host/packages'
import {syncPluginHosts,pluginRpc,pluginStatuses,pluginHostOperation} from './plugin-host/runtime'
import {PluginAccessSchema} from './plugin-host/security'
import {z} from 'zod'
import {activateDesktopPlugin,configureDesktopPlugin} from './desktop-extension-service'
import { MODEL_ROUTING_IPC as R } from '@proma/shared'
import {modelReasoningOptions,validateChatReasoning} from './model-reasoning-service'
import { modelRoutingState, saveModelRouting, startModelRouting, refreshRoutingModels,prepareRoutedKernel,gatewayIcon } from './model-routing-service'
import {gatewaySnapshot,gatewayCommand,gatewayQuery,validateGatewayReasoning} from './model-gateway-management'
import {cachedKernelCatalog,onKernelCatalogChanged,rememberKernelCatalog,clearKernelCatalogs} from './desktop-kernel-catalog'
import {saveMarketSource} from './market-sources'
import{previewThemeSource}from'./desktop-theme-source'
import {desktopMarket,previewMarketPlugin} from './desktop-plugin-market'
import {previewThemePath} from './desktop-theme-import'
import {selectDesktopTheme,onDesktopPluginsChanged,desktopKernelEnvironment} from './desktop-extension-service'
import {executeAgentTerminal,openAgentTerminal} from './terminal-service'
import {resolveAgentCwd} from './agent-session-manager'
import {quoteShell} from './desktop-cli-recipes'
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { DESKTOP_EXTENSION_IPC as C } from '@proma/shared'
import type { DesktopKernelConfig, DesktopPluginOffer } from '@proma/shared'
import {
  desktopKernelState, saveDesktopKernel, removeDesktopKernel, setDesktopDefaultKernel,
  requireDesktopKernel, probeDesktopKernel, desktopPluginState, previewDesktopPlugin,
  installDesktopPlugin, removeDesktopPlugin,
} from './desktop-extension-service'
import { DesktopKernelSelectionSchema } from './desktop-extension-config'
import { getAgentWorkspace, updateAgentWorkspace } from './agent-workspace-manager'
import { getAgentSessionMeta, updateAgentSessionMeta } from './agent-session-manager'
import { isAgentSessionBusy } from './agent-service'
import { getMainWindow } from './main-window-store'
import { desktopCliInstaller } from './desktop-cli-installer'
import { refreshDesktopKernels, onDesktopKernelsChanged } from './desktop-extension-service'
import { getConfigDir } from './config-paths'

export function registerDesktopExtensionIpc(): void {
  void syncPluginHosts().catch(error=>console.warn('[插件启动]',String(error)))
  const guard = (senderId: number): void => {
    const win = getMainWindow()
    if (!win || win.webContents.id !== senderId) throw new Error('仅主窗口可以管理本机内核与插件')
  }
  const handle = (channel: string, fn: (...args: unknown[]) => unknown): void => {
    ipcMain.handle(channel, (event, ...args: unknown[]) => {
      guard(event.sender.id)
      return fn(...args)
    })
  }
  handle(R.state,()=>modelRoutingState())
  handle(R.options,(channel,model)=>{if(typeof channel!=='string'||typeof model!=='string'||!channel||!model)throw new Error('请选择渠道和模型');return modelReasoningOptions(channel,model)})
  handle(R.directReasoning,async(id,raw)=>{
    const meta=getAgentSessionMeta(String(id));if(!meta||(meta.kernelId??'pi')!=='pi')throw new Error('请使用当前内核返回的推理控件')
    if(isAgentSessionBusy(meta.id))throw new Error('请等待当前任务结束后修改推理档位')
    const selection=await validateChatReasoning(raw)
    if(isAgentSessionBusy(meta.id)||getAgentSessionMeta(meta.id)?.kernelId!==meta.kernelId)throw new Error('会话状态已变化，请重试')
    return updateAgentSessionMeta(meta.id,{modelReasoning:selection})
  })
  handle(R.save,value=>{const state=saveModelRouting(value);clearKernelCatalogs();const win=getMainWindow();if(win&&!win.isDestroyed())win.webContents.send(R.changed,state);return state})
  handle(R.start,()=>startModelRouting(desktopKernelEnvironment('pi').PATH??''))
  handle(R.snapshot,()=>gatewaySnapshot())
  handle(R.query,raw=>gatewayQuery(raw))
  handle(R.pluginDirectory,async()=>{const result=await dialog.showOpenDialog({title:'选择模型插件目录',properties:['openDirectory']});return result.canceled?null:result.filePaths[0]??null})
  handle(R.icon,icon=>typeof icon==='string'?gatewayIcon(icon):undefined)
  handle(R.command,async raw=>{const result=await gatewayCommand(raw);clearKernelCatalogs();const win=getMainWindow();if(win&&!win.isDestroyed())win.webContents.send(R.changed,modelRoutingState());return result})
  handle(R.reasoning,async(id,raw)=>{const meta=getAgentSessionMeta(String(id));if(!meta)throw new Error('会话不存在');if(isAgentSessionBusy(meta.id))throw new Error('请等待当前任务结束后修改推理档位');const selection=await validateGatewayReasoning(meta.kernelId??'pi',raw);if(isAgentSessionBusy(meta.id)||getAgentSessionMeta(meta.id)?.kernelId!==meta.kernelId)throw new Error('会话状态已变化，请重试');return updateAgentSessionMeta(meta.id,{gatewayReasoning:selection})})
  handle(R.models,async()=>{const state=await refreshRoutingModels();const win=getMainWindow();if(win&&!win.isDestroyed())win.webContents.send(R.changed,state);return state})
  onDesktopKernelsChanged(state=>{const win=getMainWindow();if(win&&!win.isDestroyed())win.webContents.send(C.kernelsChanged,state)})
  handle(C.kernelLogin,id=>(import('./desktop-kernel-login')).then(service=>service.openKernelLogin(String(id))))
  handle(C.kernels, () => {
    const state=desktopKernelState()
    if(!state.checkedAt||Date.now()-state.checkedAt>20000)void refreshDesktopKernels().catch(()=>{})
    return state
  })
  handle(C.refreshKernels, () => refreshDesktopKernels())
  handle(C.installCli, id => desktopCliInstaller.start(String(id)))
  handle(C.cliInstall, () => desktopCliInstaller.state())
  handle(C.cancelCli, id => desktopCliInstaller.cancel(String(id)))
  handle(C.saveKernel, raw => saveDesktopKernel(raw as DesktopKernelConfig))
  handle(C.deleteKernel, id => removeDesktopKernel(String(id)))
  handle(C.defaultKernel, id => setDesktopDefaultKernel(String(id)))
  handle(C.probeKernel, (id,selection,workspaceId) => {const workspace=typeof workspaceId==='string'?getAgentWorkspace(workspaceId):undefined;return probeDesktopKernel(String(id),workspace?.projectRootPath??getConfigDir(),selection?KernelDefaultsSchema.parse(selection):{});})
  handle(C.kernelPreferences,(id,workspaceId)=>kernelPreferences(String(id),typeof workspaceId==='string'?workspaceId:undefined))
  handle(C.saveKernelPreferences,async(id,workspaceId,raw)=>{
   const kernelId=String(id),wid=typeof workspaceId==='string'&&workspaceId?workspaceId:undefined,workspace=wid?getAgentWorkspace(wid):undefined;
   if(wid&&!workspace)throw Error('项目不存在');requireDesktopKernel(kernelId);const values=KernelDefaultsSchema.parse(raw);
   const effective=wid?mergeKernelDefaults(kernelPreferences(kernelId).global,values):values;
   if(kernelId!=='pi')await probeDesktopKernel(kernelId,workspace?.projectRootPath??getConfigDir(),effective,true);
   return saveKernelPreferences(kernelId,wid,values);
  })
  onKernelCatalogChanged(value=>{const win=getMainWindow();if(win&&!win.isDestroyed())win.webContents.send(C.catalogChanged,value)})
  handle(C.sessionCatalog,async(id,force)=>{const meta=getAgentSessionMeta(String(id));if(!meta)throw new Error('会话不存在');const kernelId=meta.kernelId??'pi';const cached=cachedKernelCatalog(meta.id,kernelId);if(cached&&force!==true)return cached;if(isAgentSessionBusy(meta.id))return cached??{models:[],modes:[],controls:[],currentModelId:null,currentModeId:null,kernelId,sessionId:meta.id};const workspace=meta.workspaceId?getAgentWorkspace(meta.workspaceId):undefined;return {...await probeDesktopKernel(kernelId,resolveAgentCwd(workspace,meta.id,meta.agentCwdMode,meta.activeWorktree)??getConfigDir(),{modelId:meta.kernelModelId,modeId:meta.kernelModeId,configValues:meta.kernelConfigValues}),sessionId:meta.id}})
  handle(C.sessionKernel, async (id, raw) => {
    const sessionId = String(id)
    const requested = DesktopKernelSelectionSchema.parse(raw)
    const meta = getAgentSessionMeta(sessionId)
    if (!meta) throw new Error('会话不存在')
    if (isAgentSessionBusy(sessionId)) throw new Error('运行或排队期间不能切换内核，请先停止并清空队列')
    const value=requested.kernelId!==(meta.kernelId??'pi')?{...defaultSessionKernelSelection(requested.kernelId,meta.workspaceId),...requested}:requested
    requireDesktopKernel(value.kernelId)
    if(value.kernelId!=='pi'&&(value.modelId||value.modeId||Object.keys(value.configValues??{}).length)){const workspace=meta.workspaceId?getAgentWorkspace(meta.workspaceId):undefined;const observed=await probeDesktopKernel(value.kernelId,resolveAgentCwd(workspace,meta.id,meta.agentCwdMode,meta.activeWorktree)??getConfigDir(),value,true);if(isAgentSessionBusy(sessionId)||getAgentSessionMeta(sessionId)?.kernelId!==meta.kernelId)throw new Error('会话状态已变化，请重试');rememberKernelCatalog(sessionId,value.kernelId,observed)}
    return updateAgentSessionMeta(sessionId, {
      kernelId: value.kernelId,
      kernelModelId: value.modelId,
      kernelModeId: value.modeId,
      kernelConfigValues: value.configValues,
      kernelAutoApprove: value.autoApprove??false,
      kernelHistoryRefresh: value.kernelId !== (meta.kernelId ?? 'pi') || meta.kernelHistoryRefresh,
    })
  })
  handle(C.workspaceKernel, async (id, kernelId) => {
    const workspace = getAgentWorkspace(String(id))
    if (!workspace) throw new Error('项目不存在')
    if (kernelId !== '') requireDesktopKernel(String(kernelId))
    return updateAgentWorkspace(workspace.id, { name: workspace.name, defaultKernelId: String(kernelId) })
  })
  onDesktopPluginsChanged(state=>{for(const win of BrowserWindow.getAllWindows())if(!win.isDestroyed())win.webContents.send(C.pluginsChanged,state)})
  ipcMain.handle(C.plugins, () => desktopPluginState())
  handle(C.market, force => desktopMarket(force===true))
  handle(C.marketSourceAdd,async source=>{saveMarketSource(source);return desktopMarket(true)})
  handle(C.marketPreview, id => previewMarketPlugin(String(id)))
  handle(C.themeSource, source=>previewThemeSource(String(source)))
  handle(C.themeSelect, id => selectDesktopTheme(id===null?null:String(id)))
  handle(C.themeImport, async path=>{
    let target=typeof path==='string'?path:undefined
    if(!target){const result=await dialog.showOpenDialog({title:'导入主题文件或主题源码目录',properties:['openFile','openDirectory']});if(result.canceled)return null;target=result.filePaths[0]}
    return target?previewThemePath(target):null
  })
  handle(C.kernelTerminal, async (id,sessionId)=>{
    const entry=desktopKernelState().entries.find(e=>e.id===String(id)),meta=getAgentSessionMeta(String(sessionId))
    if(!entry?.available||!entry.resolvedCommand||!meta)throw new Error('程序尚未安装或会话不存在')
    const workspace=meta.workspaceId?getAgentWorkspace(meta.workspaceId):undefined,cwd=resolveAgentCwd(workspace,meta.id,meta.agentCwdMode,meta.activeWorktree)
    if(!cwd)throw new Error('请选择有效工作区')
    const route=await prepareRoutedKernel(entry.id,desktopKernelEnvironment(entry.id),'terminal_'+meta.id)
    if(route.model)return openAgentTerminal({sessionId:meta.id,cwd,agentCwd:cwd,title:entry.name},{file:entry.resolvedCommand,args:entry.launchArgs??entry.args,env:route.env,title:entry.name,inheritEnv:false})
    return executeAgentTerminal({sessionId:meta.id,cwd,agentCwd:cwd,title:entry.name,command:[entry.resolvedCommand,...(entry.launchArgs??entry.args)].map(quoteShell).join(' ')})
  })
  handle(C.previewPlugin, async path => {
    let target = typeof path === 'string' ? path : undefined
    if (!target) {
      const result = await dialog.showOpenDialog({ title: '选择插件目录', properties: ['openDirectory'] })
      if (result.canceled) return null
      target = result.filePaths[0]
    }
    return target ? previewDesktopPlugin(target) : null
  })
  handle(C.installPlugin, offer => installDesktopPlugin(offer as DesktopPluginOffer))
  handle(C.togglePlugin, async (id, enabled) => {
    if (typeof enabled !== 'boolean') throw new Error('开关无效')
    return activateDesktopPlugin(String(id), enabled)
  })
  handle(C.removePlugin, async id => {const state=removeDesktopPlugin(String(id));await syncPluginHosts();return state})
  handle(C.pluginRuntime,async()=>{await syncPluginHosts();return pluginStatuses()})
  handle(C.pluginRpc,(id,name,input)=>pluginRpc(String(id),String(name),input))
  handle(C.pluginSettings,(id,raw)=>configureDesktopPlugin(String(id),z.strictObject({config:z.record(z.string(),z.unknown()).optional(),access:PluginAccessSchema.optional()}).parse(raw)))
  handle(C.pluginHostCall,(id,method,input)=>pluginHostOperation(String(id),String(method),input))
  handle(BUILTIN_FEATURE_IPC,(operation,input)=>builtinNativeCall(String(operation),input))
  handle(C.pluginClient,async id=>{const entry=desktopPluginState().installed.find(p=>p.enabled&&p.manifest.id===String(id));if(!entry?.manifest.runtime?.clientEntry&&!entry?.manifest.runtime?.discoverEntriesAfterBuild)throw new Error('插件没有已启用的客户端入口');await syncPluginHosts();return readFileSync(join(pluginDirectory(entry.manifest.id),'compiled/client.js'),'utf8')})
}
