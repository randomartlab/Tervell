import { createContext, useCallback, useContext, useEffect, useId, useRef } from 'react'
import { useSetAtom, useStore } from 'jotai'
import { capabilityEditorDraftsAtom, capabilityDiscardRevisionAtom } from '@/atoms/settings-tab'

export const CapabilitySettingsScope = createContext(false)

/** 设置窗口关闭、Cmd+W 和切换会话共用的未保存保护。 */
export function useCapabilityDraftGuard(dirty: boolean): () => boolean {
  const inSettings = useContext(CapabilitySettingsScope)
  const store = useStore()
  const revision = useRef(store.get(capabilityDiscardRevisionAtom))
  const id = useId(), update = useSetAtom(capabilityEditorDraftsAtom)
  useEffect(() => {
    if (!inSettings) return
    update(current => ({ ...current, [id]: dirty }))
    return () => update(current => { const next = { ...current }; delete next[id]; return next })
  }, [dirty, id, inSettings, update])
  return useCallback(() => !inSettings || store.get(capabilityDiscardRevisionAtom) === revision.current, [inSettings, store])
}
