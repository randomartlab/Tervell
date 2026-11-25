import { z } from 'zod'
import { EXTENDED_TOOL_CONTRACTS } from '@proma/protocol'
import type { ExtendedToolInput, ExtendedToolOutput, ExtendedToolMethod, ToolContext, ToolMetadata } from '@proma/protocol'
import { ToolCatalog } from './catalog.ts'
export type ExtendedBackend = { [M in ExtendedToolMethod]: (input: ExtendedToolInput<M>, context: ToolContext, signal: AbortSignal) => Promise<ExtendedToolOutput<M>> }
export function registerExtendedTools(catalog: ToolCatalog, backend: ExtendedBackend): void {
  const add = <I,O>(name: string, effect: ToolMetadata['effect'], contract: {input:z.ZodType<I>;output:z.ZodType<O>}, run: (input:I,context:ToolContext,signal:AbortSignal)=>Promise<O>) => {
    catalog.register({ name:`mcp__proma__${name}`, description:`当前项目的 ${name} 操作`, kind:effect==='read'?'read':'other',effect },contract.input,contract.output,async(input,execution)=>run(input,execution.context,execution.signal))
  }
  add('automation_list','read',EXTENDED_TOOL_CONTRACTS.automation_list,backend.automation_list)
  add('automation_create','external',EXTENDED_TOOL_CONTRACTS.automation_create,backend.automation_create)
  add('automation_set_active','external',EXTENDED_TOOL_CONTRACTS.automation_set_active,backend.automation_set_active)
  add('delegation_start','external',EXTENDED_TOOL_CONTRACTS.delegation_start,backend.delegation_start)
  add('delegation_list','read',EXTENDED_TOOL_CONTRACTS.delegation_list,backend.delegation_list)
  add('delegation_stop','write',EXTENDED_TOOL_CONTRACTS.delegation_stop,backend.delegation_stop)
  add('worktree_list','read',EXTENDED_TOOL_CONTRACTS.worktree_list,backend.worktree_list)
  add('worktree_create','write',EXTENDED_TOOL_CONTRACTS.worktree_create,backend.worktree_create)
  add('files_search','read',EXTENDED_TOOL_CONTRACTS.files_search,backend.files_search)
}
