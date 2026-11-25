/** 本地模型网关：凭据由独立服务管理，IPC 不返回供应商密钥。 */
export interface ModelRoutingRule { kernelId: string; mode: 'override' | 'native'; model?: string }
export interface ModelRoutingConfig { version: 1; enabled: boolean; defaultModel: string; rules: ModelRoutingRule[] }
export interface ModelRoutingSupport { kernelId: string; adapter?: string; method: 'native' | 'environment' | 'unavailable'; reason?: string;requiresAccount?:boolean }
export interface ModelRoutingState {
  config: ModelRoutingConfig
  phase: 'stopped' | 'starting' | 'ready' | 'failed'
  available: boolean
  models: Array<{ id: string; name: string; efforts?:string[]; reasoning?:boolean; icon?:string;providerName?:string;nativeEndpoints?:string[];preferredEndpoint?:string;contextWindow?:number;maxOutputTokens?:number;images?:boolean }>
  support: ModelRoutingSupport[]
  error?: string
}
export const MODEL_ROUTING_IPC = {
  options:'routing:model-reasoning-options',
  directReasoning:'routing:session-direct-reasoning',
  state: 'routing:state', changed: 'routing:changed', save: 'routing:save', start: 'routing:start', snapshot: 'routing:management-snapshot', query:'routing:management-query', pluginDirectory:'routing:plugin-directory', icon: 'routing:provider-icon', command: 'routing:management-command', reasoning: 'routing:session-reasoning', models: 'routing:models',
} as const
