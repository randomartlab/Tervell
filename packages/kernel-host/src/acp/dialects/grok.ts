import type {AcpDialect} from './types.ts'
import {record} from './types.ts'
import {readSessionCatalog} from './catalog.ts'
/** Grok 发布模型目录的 session-free 扩展；沿用真实返回，不虚构模型。 */
export const grokDialect:AcpDialect={id:'grok',sources:['orca-src/src/main/acp/acp-dialects/grok-model-catalog.ts'],catalog:{method:'x.ai/models/list',sessionless:true,read(raw){const outer=record(raw),state=record(outer.result??raw);if(!Array.isArray(state.availableModels)||!state.availableModels.length)throw new Error('Grok 未返回模型目录');return readSessionCatalog({models:state})}}}
