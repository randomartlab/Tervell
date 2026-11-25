import { useEffect, useState } from 'react'

export interface Appearance {
  theme: 'system' | 'light' | 'dark'
  density: 'comfortable' | 'compact'
  uiScale: number
  bodySize: number
  codeSize: number
  sidebarWidth: number
  panelWidth: number
  sidebarCollapsed: boolean
  panelCollapsed: boolean
}
export const defaultAppearance: Appearance = { theme: 'system', density: 'comfortable', uiScale: 100, bodySize: 16, codeSize: 13, sidebarWidth: 248, panelWidth: 344, sidebarCollapsed: false, panelCollapsed: false }
const between = (value: unknown, min: number, max: number, fallback: number): number => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
export function parseAppearance(input: unknown): Appearance {
  const value = input && typeof input === 'object' ? input as Partial<Appearance> : {}
  return {
    theme: value.theme === 'light' || value.theme === 'dark' ? value.theme : 'system',
    density: value.density === 'compact' ? 'compact' : 'comfortable',
    uiScale: between(value.uiScale, 90, 150, 100), bodySize: between(value.bodySize, 16, 22, 16), codeSize: between(value.codeSize, 13, 20, 13),
    sidebarWidth: between(value.sidebarWidth, 220, 280, 248), panelWidth: between(value.panelWidth, 320, 420, 344),
    sidebarCollapsed: value.sidebarCollapsed === true, panelCollapsed: value.panelCollapsed === true,
  }
}
function savedAppearance(): Appearance {
  try { return parseAppearance(JSON.parse(localStorage.getItem('proma-appearance') ?? JSON.stringify({ theme: localStorage.getItem('proma-web-theme') }))) }
  catch { return { ...defaultAppearance } }
}
export function useAppearance() {
  const [appearance, setAppearance] = useState(savedAppearance)
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    const root = document.documentElement, query = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { root.dataset.theme = appearance.theme === 'system' ? query.matches ? 'dark' : 'light' : appearance.theme }
    apply(); query.addEventListener('change', apply)
    root.dataset.density = appearance.density
    root.style.setProperty('--ui-scale', String(appearance.uiScale / 100))
    for (const [key, value] of Object.entries({ 'body-size': `${appearance.bodySize / 16}rem`, 'code-size': `${appearance.codeSize / 16}rem`, 'sidebar-width': `${appearance.sidebarWidth}px`, 'panel-width': `${appearance.panelWidth}px` })) root.style.setProperty(`--${key}`, value)
    try { localStorage.setItem('proma-appearance', JSON.stringify(appearance)); setSaveError('') }
    catch { setSaveError('浏览器未允许保存外观偏好，本次页面仍可使用。') }
    return () => query.removeEventListener('change', apply)
  }, [appearance])
  return { appearance, setAppearance, saveError }
}
