import * as React from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import type { GatewayPreset, GatewayProvider } from '@proma/shared'
import { RANDOM_MARKET } from '@proma/shared/config'
import { RandomMarketLogo } from '@/components/brand/RandomMarketLogo'
import { Button } from '@/components/ui/button'

export const randomMarketPreset: GatewayPreset = { id: RANDOM_MARKET.id, name: RANDOM_MARKET.name, icon: 'random-market', kind: 'relay', note: '注册 Random创造集市，创建 API 密钥后接入模型。', website: RANDOM_MARKET.origin, keysUrl: RANDOM_MARKET.keys, chat: RANDOM_MARKET.chat, responses: '', anthropic: '', gemini: '', noKey: false }
export function isRandomMarketProvider(provider: GatewayProvider): boolean {
  return [provider.chat, provider.responses, provider.anthropic, provider.gemini].some(value => { try { return new URL(value).origin === RANDOM_MARKET.origin } catch { return false } })
}
export function RandomMarketProvider({ busy, existing, onChoose }: { busy: boolean; existing?: GatewayProvider; onChoose: () => void }): React.ReactElement {
  return <aside aria-label="Random创造集市模型服务" data-testid="random-market-provider" className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
    <RandomMarketLogo />
    <div className="min-w-0 flex-1"><h3 className="text-base font-semibold">{RANDOM_MARKET.name}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">注册账号、创建密钥，集中接入模型。已有密钥可直接添加。</p></div>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void window.electronAPI.openExternal(RANDOM_MARKET.register)}><ExternalLink className="size-4" aria-hidden="true"/>注册账号</Button><Button type="button" disabled={busy} onClick={onChoose}><Plus className="size-4" aria-hidden="true"/>{existing ? '管理集市供应商' : '添加为供应商'}</Button></div>
  </aside>
}
