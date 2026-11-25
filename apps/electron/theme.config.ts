import { BRAND_COLORS } from '@proma/shared/config'

/**
 * 主题系统：Semantic Token 定义 + 导入验证
 *
 * 设计原则：
 * 1. 所有颜色、间距、字号通过变量定义（CSS 变量 + Tailwind token）
 * 2. 支持主题 JSON 导入（第三方或用户自定义）
 * 3. JSON schema 验证（类型安全）
 * 4. 默认光亮/深色主题 + 四个主题套包
 */

export const themes = {
  light: {
    colors: {
      bg: '#ffffff',
      'bg-secondary': '#f9fafb',
      fg: '#000000',
      'fg-muted': '#6b7280',
      accent: BRAND_COLORS.light.primary,
      'accent-hover': BRAND_COLORS.light.hover,
      'border': '#e5e7eb',
      'success': '#10b981',
      'warning': '#f59e0b',
      'error': '#ef4444',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    typography: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
  },
  dark: {
    colors: {
      bg: '#1a1a1a',
      'bg-secondary': '#2d2d2d',
      fg: '#ffffff',
      'fg-muted': '#9ca3af',
      accent: BRAND_COLORS.dark.primary,
      'accent-hover': BRAND_COLORS.dark.hover,
      border: '#404040',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    typography: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
  },
}

/**
 * 主题 JSON 导入时的验证 schema
 * 用于确保第三方主题格式正确
 */
export const themeSchema = {
  type: 'object',
  properties: {
    colors: {
      type: 'object',
      additionalProperties: {
        type: 'string',
        pattern: '^#[0-9a-fA-F]{6}$|^rgba?\\(.*\\)$|^var\\(--.*\\)$',
      },
    },
    spacing: {
      type: 'object',
      additionalProperties: {
        type: 'string',
        pattern: '^[0-9]+(px|rem|em)$',
      },
    },
    typography: {
      type: 'object',
      additionalProperties: {
        type: 'string',
        pattern: '^[0-9]+(px|rem|em)$',
      },
    },
  },
  required: ['colors', 'spacing', 'typography'],
} as const

/**
 * 验证主题对象是否符合 schema
 */
export function validateTheme(
  theme: unknown,
): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  if (typeof theme !== 'object' || theme === null) {
    errors.push('主题必须是对象')
    return { valid: false, errors }
  }

  const t = theme as Record<string, unknown>

  // 检查必需字段
  for (const key of ['colors', 'spacing', 'typography']) {
    if (typeof t[key] !== 'object' || t[key] === null) {
      errors.push(`缺少必需字段: ${key}`)
    }
  }

  // 检查颜色值（简单模式，生产环境应使用完整 JSON schema 库）
  const colors = t.colors as Record<string, unknown> | undefined
  if (colors) {
    for (const [key, value] of Object.entries(colors)) {
      if (typeof value !== 'string') {
        errors.push(`colors.${key} 必须是字符串`)
      }
    }
  }

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
}
