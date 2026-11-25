/**
 * SettingsInput - 设置文本输入控件
 *
 * 封装 ShadcnUI Input，集成标签和描述。
 * 支持错误状态提示。
 */

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { LABEL_CLASS, DESCRIPTION_CLASS } from './SettingsUIConstants'
import { cn } from '@/lib/utils'

interface SettingsInputProps {
  /** 标签文本 */
  label: string
  /** 描述文本（可选） */
  description?: string
  /** 输入值 */
  value: string
  /** 变更回调 */
  onChange: (value: string) => void
  /** 失焦回调（可选，用于延迟保存场景） */
  onBlur?: () => void
  /** 占位符 */
  placeholder?: string
  /** 是否必填 */
  required?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息（可选） */
  error?: string
  /** 输入类型 */
  type?: string
}

export function SettingsInput({
  label,
  description,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  disabled,
  error,
  type = 'text',
}: SettingsInputProps): React.ReactElement {
  const id = React.useId()
  return (
    <div className="px-4 py-3 space-y-2">
      <div>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        {description && (
          <div id={`${id}-description`} className={cn(DESCRIPTION_CLASS, 'mt-0.5')}>{description}</div>
        )}
      </div>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={[description ? `${id}-description` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(error && 'border-destructive focus-visible:ring-destructive')}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
