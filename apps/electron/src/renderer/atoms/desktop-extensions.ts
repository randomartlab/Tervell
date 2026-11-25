import { atom } from 'jotai'
import type { DesktopCliInstall, DesktopKernelState } from '@proma/shared'
/** 管理操作后刷新声明式插件贡献；CLI 探测使用主进程推送的快照。 */
export const desktopExtensionsRevisionAtom = atom(0)
export const desktopKernelStateAtom = atom<DesktopKernelState>({entries:[],defaultKernelId:'pi',refreshing:true})
export const desktopCliInstallAtom = atom<DesktopCliInstall|null>(null)
export const desktopKernelErrorAtom = atom('')

export const modelRoutingConfigAtom=atom<import('@proma/shared').ModelRoutingConfig>({version:1,enabled:false,defaultModel:'',rules:[]})

export const modelRoutingSupportAtom=atom<import('@proma/shared').ModelRoutingSupport[]>([])

export const modelRoutingModelsAtom=atom<import('@proma/shared').ModelRoutingState['models']>([])
