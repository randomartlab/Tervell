import * as React from 'react'
import { Brain, Check, Loader2 } from 'lucide-react'
import { reasoningEffortLabel } from '@proma/shared'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { inputToolbarButtonClass } from './input-toolbar-styles'
import { cn } from '@/lib/utils'

export interface ReasoningOption { value: string; label?: string; description?: string; code?: string }
interface ReasoningPickerProps {
  value: string
  options: ReasoningOption[]
  onChange: (value: string) => void | Promise<void>
  automatic?: boolean
  disabled?: boolean
  loading?: boolean
  error?: string
  title?: string
  description?: string
  onRefresh?: () => void
}

/** Agent、Chat 和原生 CLI 共用，原值逐项可见，不用有限刻度截断供应商档位。 */
export function ReasoningPicker({value,options,onChange,automatic=false,disabled=false,loading=false,error,title='推理档位',description,onRefresh}:ReasoningPickerProps):React.ReactElement {
  const [open,setOpen]=React.useState(false)
  const selected=options.find(option=>option.value===value)
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="ghost" disabled={disabled} aria-label={`选择${title}`} className={cn(inputToolbarButtonClass,'w-auto gap-1.5 px-2')}>
      {loading?<Loader2 className="size-4 animate-spin motion-reduce:animate-none"/>:<Brain className="size-4"/>}
      <span className="max-w-28 truncate text-xs">{loading?'读取档位…':selected?.label??(value?reasoningEffortLabel(value):automatic?'自动':'推理档位')}</span>
    </Button></PopoverTrigger>
    <PopoverContent side="top" align="start" className="max-h-[min(65vh,520px)] w-72 space-y-3 overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{title}</h3>{onRefresh&&<Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onRefresh}>刷新</Button>}</div>
      {description&&<p className="text-xs leading-5 text-muted-foreground">{description}</p>}
      {error&&<p role="alert" className="text-xs leading-5 text-destructive">{error}</p>}
      {!!value&&!selected&&!loading&&<p role="alert" className="text-xs leading-5 text-destructive">原档位已不在当前能力列表中，请重新选择后发送。</p>}
      <div role="group" aria-label={`当前模型${title}`} className="space-y-1">
        {automatic&&<Button type="button" size="sm" variant={!value?'secondary':'ghost'} disabled={loading} aria-pressed={!value} className="w-full justify-between" onClick={()=>void onChange('')}>自动（模型默认）{!value&&<Check size={14}/>}</Button>}
        {options.map(option=><Button key={option.value} type="button" size="sm" variant={value===option.value?'secondary':'ghost'} disabled={loading} aria-pressed={value===option.value} className="h-auto min-h-9 w-full justify-between gap-3 whitespace-normal py-2 text-left" onClick={()=>void onChange(option.value)}>
          <span className="min-w-0"><span className="block">{option.label??reasoningEffortLabel(option.value)}</span>{option.description&&<span className="block text-xs font-normal text-muted-foreground">{option.description}</span>}</span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">{option.code??option.value}{value===option.value&&<Check size={14}/>}</span>
        </Button>)}
      </div>
      {!options.length&&!loading&&<p role="status" className="text-xs leading-5 text-muted-foreground">当前模型或内核未提供可选推理档位；保持其默认行为。</p>}
    </PopoverContent>
  </Popover>
}
