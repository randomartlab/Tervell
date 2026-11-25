import { join } from 'node:path'
import { LEGACY_ICON_VARIANTS } from '@proma/shared/config'

/** 只接受已分发的图标 ID，避免将偏好值当作任意资源路径。 */
export function appIconPath(resources: string, variant: string): string | null {
  // 旧版 A 偏好只做读取兼容，不再分发或恢复旧造型。
  if (!variant || variant === 'default' || variant === 'fold' || variant === 'threshold') return join(resources, 'icon.png')
  if ((LEGACY_ICON_VARIANTS as readonly string[]).includes(variant)) return join(resources, 'proma-logos', `proma-${variant}.png`)
  return null
}
