import * as React from 'react'
import { useSetAtom } from 'jotai'
import { desktopKernelStateAtom,desktopCliInstallAtom,desktopKernelErrorAtom,modelRoutingConfigAtom,modelRoutingSupportAtom,modelRoutingModelsAtom } from '@/atoms/desktop-extensions'
/** 主窗口统一订阅；初始、返回窗口及可见期间自动复核，无需用户记住刷新。 */
export function DesktopKernelDiscovery():null {
  const setState=useSetAtom(desktopKernelStateAtom),setJob=useSetAtom(desktopCliInstallAtom),setError=useSetAtom(desktopKernelErrorAtom)
  const setRouting=useSetAtom(modelRoutingConfigAtom),setSupport=useSetAtom(modelRoutingSupportAtom),setModels=useSetAtom(modelRoutingModelsAtom)
  React.useEffect(()=>{const off=window.electronAPI.onModelRoutingChanged(state=>{setRouting(state.config);setSupport(state.support);setModels(state.models)});void window.electronAPI.modelRoutingState().then(state=>{setRouting(state.config);setSupport(state.support);setModels(state.models)}).catch(()=>{});return off},[setRouting,setSupport,setModels])
  React.useEffect(()=>{
    let alive=true,last=0,inFlight=false
    const off=window.electronAPI.onDesktopKernelsChanged(state=>{if(alive){setState(state);setError('')}})
    const offJob=window.electronAPI.onDesktopCliInstallChanged(job=>{if(alive)setJob(job)})
    const refresh=():void=>{
      if(document.visibilityState==='hidden'||inFlight||Date.now()-last<3000)return
      last=Date.now();inFlight=true
      void window.electronAPI.refreshDesktopKernels().then(state=>{if(alive){setState(state);setError('')}},error=>{if(alive)setError(error instanceof Error?error.message:String(error))}).finally(()=>{inFlight=false})
    }
    void window.electronAPI.desktopKernels().then(state=>{if(alive)setState(state)},error=>{if(alive)setError(String(error))})
    void window.electronAPI.desktopCliInstall().then(job=>{if(alive)setJob(job)},()=>{})
    refresh()
    const timer=setInterval(refresh,20000)
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh)
    return()=>{alive=false;off();offJob();clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}
  },[setState,setJob,setError])
  return null
}
