import { RpcRemoteError } from './rpc';

/** 认证失败与网络、限流、权限失败分离；只能在尚未发送 prompt 时自动接管。 */
export function isKernelAuthenticationRequired(error: unknown): boolean {
  if (error instanceof KernelAuthenticationRequiredError) return true;
  if (!(error instanceof Error)) return false;
  // Goose 在没有配置 provider 时返回字符串 error.data，尚未进行模型请求。
  if(error instanceof RpcRemoteError&&typeof error.data==='string'&&error.data.includes('Configuration value not found: GOOSE_PROVIDER'))return true;
  if(error instanceof RpcRemoteError&&typeof error.data==='string'&&error.data.startsWith('No LLM provider configured.'))return true;
  if(error instanceof RpcRemoteError&&error.data&&typeof error.data==='object'&&!Array.isArray(error.data)&&typeof error.data.details==='string'&&error.data.details.startsWith('No LLM provider configured.'))return true;
  if(/\blog in to [^\n]{1,100} before (?:opening|starting) a session\b|\bRun [\w.-]+ login\b[^\n]{0,120}(?:sign in|API key)/i.test(error.message))return true;
  if (error instanceof RpcRemoteError && error.code === -32000 && /auth|login|sign.?in|credentials?/i.test(error.message)) return true;
  return /\b(?:authentication required|auth_required|not authenticated|not logged in|not signed in|login required|sign[- ]in required|no api key found|(?:api[ -]?key|credentials?) (?:is |are )?(?:missing|not configured)|missing (?:api[ -]?key|credentials?))\b|(?:尚未|未)登录|需要(?:登录|认证)/i.test(error.message);
}

export class KernelAuthenticationRequiredError extends Error {
  constructor(readonly kernelId: string) {
    super('内核尚未登录，需要模型认证');
    this.name = 'KernelAuthenticationRequiredError';
  }
}

/** 只选择 CLI 实际公布、且已显式配置密钥的非交互认证；不发起 OAuth/浏览器。 */
export function configuredAcpAuthentication(methods:unknown,env:Record<string,string>):string|undefined {
  if(!Array.isArray(methods))return undefined;
  const declared=methods.filter((value):value is {id:string;type?:string}=>!!value&&typeof value==='object'&&typeof value.id==='string'&&value.type!=='terminal');
  const candidates=[...(env.CODEX_API_KEY||env.OPENAI_API_KEY?['api-key']:[]),...(env.GEMINI_API_KEY?['gemini-api-key']:[]),...(env.FACTORY_API_KEY?['factory-api-key']:[])];
  return candidates.find(id=>declared.some(method=>method.id===id));
}
