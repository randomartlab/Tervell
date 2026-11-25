import {atom,useAtomValue,useStore} from 'jotai'
import * as React from 'react'
import {DEFAULT_ACTIVITY_DISPLAY,normalizeActivityDisplay} from '@proma/shared'
import type {ActivityDisplayPreferences} from '@proma/shared'
export const activityDisplayAtom=atom<ActivityDisplayPreferences>(DEFAULT_ACTIVITY_DISPLAY)
export function useActivityPreferences():ActivityDisplayPreferences{return useAtomValue(activityDisplayAtom)}
export function useActivityDisplaySync():void {
 const store=useStore()
 React.useEffect(()=>{let alive=true;const refresh=()=>{void window.electronAPI.builtinFeatureCall('activity.read').then(value=>{if(alive){const next=normalizeActivityDisplay(value);if(JSON.stringify(next)!==JSON.stringify(store.get(activityDisplayAtom)))store.set(activityDisplayAtom,next)}}).catch(console.error)};refresh();const timer=setInterval(refresh,5000);return()=>{alive=false;clearInterval(timer)}},[store])
}
