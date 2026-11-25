import * as React from 'react'
import logo from '@/assets/random-market/rd-mark-square.png'
import { cn } from '@/lib/utils'

export function RandomMarketLogo({ className }: { className?: string }): React.ReactElement {
  return <img src={logo} alt="" draggable={false} className={cn('size-11 shrink-0 rounded-lg bg-white object-contain p-1.5', className)} />
}
