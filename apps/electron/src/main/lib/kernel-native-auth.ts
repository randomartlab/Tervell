import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { KernelAuthenticationRequiredError } from '@proma/kernel-host'
import {parse} from 'yaml'

/** 少数 CLI 直到首次模型调用才检查凭据；只检查已核对的本地配置，不发送试探 prompt。 */
export function assertKernelNativeAuthentication(id: string, env: Record<string,string>): void {
  if(id==='deepagents'){if(env.ANTHROPIC_API_KEY?.trim()||env.OPENAI_API_KEY?.trim())return;throw new KernelAuthenticationRequiredError(id)}
  if(id==='crow-cli'){
    const home=env.HOME||env.USERPROFILE
    if(home)try{const path=join(home,'.agents/crow/config.yaml');if(statSync(path).size<=1024*1024){const data=parse(readFileSync(path,'utf8')) as {providers?:Record<string,unknown>;models?:Record<string,unknown>};if(Object.keys(data.providers??{}).length&&Object.keys(data.models??{}).length)return}}catch{/* 未配置模型时在发prompt前选择网关。 */}
    throw new KernelAuthenticationRequiredError(id)
  }
  if (id !== 'glm-acp-agent' || env.Z_AI_API_KEY?.trim()) return
  const config = env.XDG_CONFIG_HOME || (env.HOME || env.USERPROFILE ? join(env.HOME || env.USERPROFILE!, '.config') : undefined)
  if (config) {
    try {
      const path = join(config,'glm-acp-agent','credentials.json')
      if (statSync(path).size <= 32768) {
        const data = JSON.parse(readFileSync(path,'utf8')) as { z_ai_api_key?: unknown }
        if (typeof data.z_ai_api_key === 'string' && data.z_ai_api_key.trim()) return
      }
    } catch { /* 缺少有效凭据时交给统一的认证/网关流程。 */ }
  }
  throw new KernelAuthenticationRequiredError(id)
}
