import { createHash, randomUUID } from 'node:crypto'
import { ToolContextSchema, JsonValueSchema, ToolApprovalDecisionSchema, ToolAuditSchema } from '@proma/protocol'
import type { ToolContext, ToolKind, JsonValue, ToolAudit, ToolApprovalDecision } from '@proma/protocol'
import { PermissionRules } from './rules.ts'
import { decidePermission } from './index.ts'
export interface GatedTool { name: string; kind: ToolKind; effect: 'read' | 'write' | 'delete' | 'external'; command?: string; forceAsk?: boolean }
export interface GateApproval { context: ToolContext; tool: GatedTool; input: JsonValue; signal: AbortSignal; whitelistable: boolean }
export interface GateOptions { context: ToolContext; signal: AbortSignal; authorize: (request: GateApproval) => Promise<boolean | ToolApprovalDecision>; assertContext?: () => void }
function canonical(value: JsonValue): JsonValue { return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value }
/** 统一执行边界；审计只记输入哈希，不记录工具正文、命令和凭据。 */
export class ToolGate {
  private readonly rules = new PermissionRules()
  private readonly grants = new Map<string, Set<string>>()
  private readonly versions=new Map<string,number>()
  private readonly records: ToolAudit[] = []
  constructor(private readonly sink: (event: ToolAudit) => void = () => {}) {}
  audit(): ToolAudit[] { return structuredClone(this.records) }
  clearSession(id: string): void { this.versions.set(id,(this.versions.get(id)??0)+1);this.grants.delete(id); this.rules.clearSession(id) }
  private emit(event: ToolAudit): void { const parsed = ToolAuditSchema.parse(event); this.sink(structuredClone(parsed)); this.records.push(parsed); if (this.records.length > 2000) this.records.shift() }
  async run<T>(raw: GatedTool, input: JsonValue, options: GateOptions, execute: () => Promise<T> | T): Promise<T> {
    const context = ToolContextSchema.parse(options.context), tool = structuredClone(raw), safeInput = JsonValueSchema.parse(input)
    if(Buffer.byteLength(JSON.stringify(safeInput))>2*1024*1024)throw new Error('工具输入超限')
    const inputHash = createHash('sha256').update(JSON.stringify(canonical(safeInput))).digest('hex')
    const auditTool = /^(?:Read|Write|execute|PowerShell|TerminalOutput|TerminalWait|TerminalKill|TerminalRelease|mcp__proma__[a-z][a-z0-9_]{0,63})$/.test(tool.name) ? tool.name : `tool_${createHash('sha256').update(tool.name).digest('hex').slice(0,24)}`
    const base = { id: randomUUID(), sessionId: context.sessionId, workspaceId: context.workspaceId, tool: auditTool, inputHash }
    let risk: ToolAudit['risk'] = tool.effect === 'read' ? 'read' : 'review'
    let decided = false
    const version=this.versions.get(context.sessionId)??0
    try {
      if (options.signal.aborted) throw new Error('工具执行已取消')
      options.assertContext?.()
      const result = tool.command === undefined ? undefined : this.rules.evaluate(context.sessionId, context.permission, { tool: tool.name, command: tool.command, input: safeInput })
      risk = result?.risk ?? risk
      const kind = tool.effect === 'read' ? 'read' : tool.effect === 'delete' ? 'delete' : tool.kind === 'edit' ? 'edit' : 'other'
      let decision = result?.decision ?? decidePermission(context.permission, { kind, readOnlyCommand: false })
      if ((context.permission.plan || context.permission.mode === 'read-only') && tool.effect !== 'read') decision = 'deny'
      if (tool.effect === 'delete' && ['automation', 'delegation'].includes(context.triggeredBy)) decision = 'deny'
      const whitelistable = context.triggeredBy !== 'external' && (result?.whitelistable ?? true) && risk !== 'dangerous' && !['delete','external'].includes(tool.effect) && !/powershell|pwsh/i.test(tool.name)
      const grantKey = JSON.stringify([context.workspaceId, tool.name, tool.effect, tool.command, inputHash])
      const granted = whitelistable && this.grants.get(context.sessionId)?.has(grantKey)
      if (decision !== 'deny' && (tool.forceAsk || ['delete','external'].includes(tool.effect) || (context.triggeredBy === 'external' && tool.effect !== 'read'))) decision = 'ask'
      if (decision === 'deny') throw new Error('工具权限策略拒绝执行')
      if (decision === 'ask' && !granted) {
        let cancelled: (() => void) | undefined
        let answer: boolean | ToolApprovalDecision
        try {
          answer = await Promise.race([options.authorize({ context: structuredClone(context), tool, input: safeInput, signal: options.signal, whitelistable }), new Promise<never>((_resolve, reject) => {
            cancelled = () => reject(new Error('工具执行已取消'))
            options.signal.addEventListener('abort', cancelled, { once: true })
            if (options.signal.aborted) cancelled()
          })])
        } finally { if (cancelled) options.signal.removeEventListener('abort', cancelled) }
        const selected = typeof answer === 'boolean' ? answer ? 'allow-once' : 'deny' : ToolApprovalDecisionSchema.parse(answer)
        if (selected === 'deny') throw new Error('用户拒绝工具执行')
        if (options.signal.aborted) throw new Error('工具执行已取消')
        options.assertContext?.()
        if((this.versions.get(context.sessionId)??0)!==version)throw new Error('工具会话已关闭')
        if (selected === 'allow-session' && whitelistable) { const grants = this.grants.get(context.sessionId) ?? new Set<string>(); if(grants.size>=500)throw new Error('会话授权过多，请结束会话后重试');grants.add(grantKey); this.grants.set(context.sessionId, grants) }
      }
      if (options.signal.aborted) throw new Error('工具执行已取消')
      options.assertContext?.()
      if((this.versions.get(context.sessionId)??0)!==version)throw new Error('工具会话已关闭')
      this.emit({ ...base, at: Date.now(), phase: 'decision', outcome: 'allow', risk }); decided = true
      const resultValue = await execute()
      this.emit({ ...base, at: Date.now(), phase: 'result', outcome: 'succeeded', risk })
      return resultValue
    } catch (error) {
      this.emit({ ...base, at: Date.now(), phase: decided ? 'result' : 'decision', outcome: options.signal.aborted ? 'cancelled' : decided ? 'failed' : 'deny', risk })
      throw error
    }
  }
}
