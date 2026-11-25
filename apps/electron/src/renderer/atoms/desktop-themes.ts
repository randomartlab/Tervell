import {atom} from 'jotai'
import type {DesktopPluginState} from '@proma/shared'
export const desktopPluginStateAtom=atom<DesktopPluginState>({installed:[],catalog:[],selectedThemeId:null})
export const desktopThemeOptionsAtom=atom(get=>get(desktopPluginStateAtom).installed.flatMap(p=>(p.manifest.themes??[]).map(theme=>({id:p.manifest.id+'/'+theme.id,theme,pluginName:p.manifest.name,enabled:p.enabled,pluginId:p.manifest.id}))))
