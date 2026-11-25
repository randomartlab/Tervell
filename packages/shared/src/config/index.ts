/**
 * Shared configuration for proma
 */

export { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, APP_ID, ALPHA_APP_ID, ALPHA_PRODUCT_NAME, BRAND_MARK_PATH, BRAND_MARK_TRANSFORM, BRAND_ICON_TRANSFORM, BRAND_COLORS, BRAND_MARKS, DEFAULT_BRAND_MARK, LEGACY_ICON_VARIANTS, brandMarkSvg, UPSTREAM_SOURCE_URL } from './brand'
export { SETTINGS_SECTIONS, searchSettingsSections } from './settings-navigation'
export type { SettingsSectionEntry, SettingsSectionId } from './settings-navigation'
export { MAC_MINIMUM_VERSION, MAC_ARCHITECTURES, MAC_RELEASE_STEPS, macBuildTarget, machoMinimumVersions, exceedsMacMinimum } from './mac-release'
export type { MacArchitecture } from './mac-release'
export { releasePolicy } from './release-channel'
export type { ReleasePolicy } from './release-channel'
export type { BrandMarkVariant } from './brand'
export { RANDOM_MARKET } from './random-market'
