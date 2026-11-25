/** 已对照 Magpie 原生 adapter 核对；受限的厂商后端不能冒充已支持。 */
export const MAGPIE_AGENT_ADAPTERS: Readonly<Record<string, string>> = {
  claude: 'claude', codex: 'codex', gemini: 'gemini', qwen: 'qwen', kimi: 'kimi',
  opencode: 'opencode', opencode2: 'opencode', omp: 'omp', grok: 'grok',
  deepseek: 'dsh', dsh: 'dsh', hermes: 'hermes', copilot: 'copilot', mcode: 'minimax-code',
  antigravity: 'agy', goose: 'goose', cline:'cline',codebuddy:'codebuddy',droid:'droid',fx:'fx',qoder:'qoder','qoder-cn':'qoder-cn',zcode:'zcode','mimo-code':'mimocode',ante:'ante',muse:'muse','prime-agent':'prime-agent',crush:'crush','command-code':'commandcode',openclaw:'openclaw',jcode:'jcode','mistral-vibe':'vibe','pi-acp':'pi',
}
/** BYOK配置不等于免厂商账号；这些真实ACP入口在自定义模型下仍要求先登录。 */
export const MAGPIE_ACCOUNT_REQUIRED_KERNELS:Readonly<Record<string,string>>={droid:'Factory Droid 的 ACP 入口仍需要 Factory 账号；登录后可使用已配置的自定义模型。',qoder:'Qoder 的 ACP 入口仍需要 Qoder 账号；登录后可使用自定义提供商。','qoder-cn':'Qoder CN 需要原生账号，模型覆盖不能替代厂商授权。',muse:'Muse 的 ACP 入口需要原生账号，模型覆盖不能替代厂商授权。'}
export interface RoutingPolicy { enabled: boolean; defaultModel: string; rules: Array<{kernelId:string;mode:'native'|'override';model?:string}> }
/** 逐内核策略优先；enabled 只控制未设例外的内核是否跟随全局默认。 */
export function routedModel(policy: RoutingPolicy, kernelId: string): string | undefined {
  const rule = policy.rules.find(row => row.kernelId === kernelId)
  if (rule?.mode === 'native') return undefined
  if (rule?.mode === 'override') return rule.model?.trim() || undefined
  return policy.enabled ? policy.defaultModel.trim() || undefined : undefined
}
/** 用于受管进程，不写 process.env；清除原供应商认证，避免端点覆盖后凭据串用。 */
export function routedAgentEnvironment(base: Record<string,string>, home: string, config: string, cache: string, gateway: string, platform: string = process.platform): Record<string,string> {
  const upstreamOnly=new Set(['GOOGLE_APPLICATION_CREDENTIALS','AWS_PROFILE','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_SESSION_TOKEN','CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY','ANTHROPIC_MODEL','OPENAI_MODEL','OPENAI_MODEL_ID','OPENCODE_CONFIG','OPENCODE_CONFIG_CONTENT','MAGPIE_GATEWAY','MAGPIE_WEB_URL','MAGPIE_UPDATE_FEED'])
  const env = Object.fromEntries(Object.entries(base).filter(([key]) => !/(?:API_KEY|AUTH_TOKEN|ACCESS_TOKEN|BEARER_TOKEN)$/.test(key)&&!upstreamOnly.has(key)))
  return {...env, HOME:home, USERPROFILE:home, XDG_CONFIG_HOME:config, XDG_CACHE_HOME:cache,
    ...(platform==='win32'?{APPDATA:`${home}/AppData/Roaming`,LOCALAPPDATA:`${home}/AppData/Local`,TEMP:`${home}/AppData/Local/Temp`,TMP:`${home}/AppData/Local/Temp`}:{}),
    CODEX_HOME:`${home}/.codex`, CLAUDE_CONFIG_DIR:`${home}/.claude`, GEMINI_CLI_HOME:home,
    QWEN_HOME:`${home}/.qwen`, QWEN_CODE_HOME:`${home}/.qwen`, KIMI_CODE_HOME:`${home}/.kimi`,
    GROK_HOME:`${home}/.grok`, DSH_HOME:`${home}/.dsh`, HERMES_HOME:`${home}/.hermes`,
    XDG_DATA_HOME:`${home}/.local/share`, XDG_STATE_HOME:`${home}/.local/state`,
    OPENCODE_CONFIG_DIR:`${home}/.config/opencode`, PI_CODING_AGENT_DIR:`${home}/.pi/agent`,
    MAGPIE_ADDR:new URL(gateway).host, MAGPIE_NO_ACCOUNTS:'1', DO_NOT_TRACK:'1',
    OPENAI_BASE_URL:`${gateway}/v1`, OPENAI_API_KEY:'magpie-tervell',
    ANTHROPIC_BASE_URL:gateway, ANTHROPIC_API_KEY:'magpie-tervell',
    GOOGLE_GEMINI_BASE_URL:gateway, GEMINI_API_KEY:'magpie-tervell',
  }
}

/** 社区适配器明确提供的环境契约，不冒充 Magpie 原生 Agent 名称。 */
export const ENVIRONMENT_ROUTED_KERNELS = ['glm-acp-agent','deepagents','crow-cli'] as const
export function environmentRoutedKernel(id: string): boolean { return ENVIRONMENT_ROUTED_KERNELS.some(value => value === id) }
export function kernelGatewayEnvironment(id: string, endpoint: string, model: string): Record<string,string> {
  if(id==='glm-acp-agent')return {Z_AI_API_KEY:'tervell-local-gateway',ACP_GLM_BASE_URL:endpoint.replace(/\/$/,'')+'/v1',ACP_GLM_MODEL:model,ACP_GLM_AVAILABLE_MODELS:model}
  if(id==='cline')return {CLINE_PROVIDER:'openai-compatible',CLINE_MODEL:model,CLINE_API_KEY:'tervell-local-gateway'}
  if(id==='codebuddy')return {CODEBUDDY_API_KEY:'magpie-codebuddy'}
  return {}
}
