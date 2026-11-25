import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { writeTextFileAtomic, writeJsonFileAtomic } from './safe-file'
import type { ModelRoutingState } from '@proma/shared'

/** Magpie 配置模型目录后，DSH automation profile仍有独立acp模型选择；只写本次受管HOME。 */
export function prepareKernelRouteAdapter(kernelId: string, home: string, model: string, endpoint: string, metadata?: ModelRoutingState['models'][number]): Record<string, string> {
  if(kernelId==='cline')return {CLINE_SESSION_BACKEND_MODE:'local',CLINE_NO_AUTO_UPDATE:'1'}
  // ACP没有交互终端界面；Windows ConPTY可能不发退出事件，使用CLI正式的管道后端。
  if(kernelId==='gemini'&&process.platform==='win32')return {GEMINI_PTY_INFO:'child_process'}
  if(kernelId==='deepagents')return {TERVELL_DEEPAGENTS_MODEL:'openai:'+model}
  if(kernelId==='crow-cli'){
    const directory=join(home,'.agents','crow');mkdirSync(directory,{recursive:true,mode:0o700})
    writeTextFileAtomic(join(directory,'config.yaml'),JSON.stringify({providers:{magpie:{api_key:'tervell-local-gateway',base_url:endpoint.replace(/\/$/,'')+'/v1'}},models:{'tervell-selected':{provider:'magpie',model,modality:metadata?.images?['text','image']:['text']}},mcpServers:{'crow-mcp':{transport:'stdio',command:'crow-cli',args:['mcp']}}},null,2)+'\n')
    return {}
  }
  if(kernelId==='antigravity'){
    // Google 的独立 ACP server 与 agy CLI 读取不同配置；使用其正式 gateway auth/model 契约。
    const directory=join(home,'.gemini','antigravity-acp');mkdirSync(directory,{recursive:true,mode:0o700})
    writeJsonFileAtomic(join(directory,'settings.json'),{auth:{type:'gateway'}})
    return {AGY_LLM_GATEWAY_URL:endpoint,AGY_LLM_GATEWAY_API_KEY:'tervell-local-gateway',AGY_LLM_GATEWAY_MODELS:model}
  }
  if(kernelId==='hermes'&&metadata?.contextWindow){
    const directory=join(home,'.hermes');mkdirSync(directory,{recursive:true,mode:0o700})
    // 只写受管HOME，JSON兼容YAML；把网关确认的容量传给有最低上下文要求的Hermes。
    writeTextFileAtomic(join(directory,'config.yaml'),JSON.stringify({providers:{magpie:{name:'Tervell Magpie',base_url:endpoint.replace(/\/$/,'')+'/v1',api_key:'tervell-local-gateway',api_mode:'chat_completions',models:[model]}},model:{provider:'magpie',default:model,context_length:metadata.contextWindow}},null,2)+'\n')
    return {}
  }
  if (kernelId !== 'dsh' && kernelId !== 'deepseek') return {}
  const root = join(home, '.tervell-route'), patch = join(root, 'acp-model.yml')
  mkdirSync(root, { recursive: true, mode: 0o700 })
  // JSON 是 YAML 1.2 子集；未知能力交给 DSH 自己的默认值，不把假定容量当成供应商能力。
  const routeModel = { id: model, ...(metadata?.contextWindow ? { contextWindow: metadata.contextWindow } : {}), ...(metadata?.maxOutputTokens ? { maxTokens: metadata.maxOutputTokens } : {}), ...(metadata?.images === undefined ? {} : { input: metadata.images ? ['text','image'] : ['text'] }) }
  writeTextFileAtomic(patch, JSON.stringify([{ id:'llm-pi-ai', config:{ providers:{ magpie:{ displayName:'Tervell Magpie', api:'openai-completions', apiKeyEnv:'MAGPIE_GATEWAY_KEY', baseURL:endpoint.replace(/\/$/, '')+'/v1', models:[routeModel] } } } },{ id:'acp', config:{ provider:'magpie', model } }],null,2)+'\n')
  return { TERVELL_DSH_ACP_PATCH: patch, MAGPIE_GATEWAY_KEY: 'tervell-local-gateway' }
}
export function kernelRouteLaunchArgs(kernelId: string, args: string[], env: Record<string, string>): string[] {
  if(kernelId==='deepagents'&&env.TERVELL_DEEPAGENTS_MODEL)return [...args,'--model',env.TERVELL_DEEPAGENTS_MODEL]
  return (kernelId === 'dsh' || kernelId === 'deepseek') && env.TERVELL_DSH_ACP_PATCH
    ? [...args, '--patch', env.TERVELL_DSH_ACP_PATCH] : args
}
