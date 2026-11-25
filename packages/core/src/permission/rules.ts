import { CommandRuleSchema, PermissionPolicySchema, ToolPolicyRequestSchema } from '@proma/protocol'
import type { CommandRule, PermissionPolicy, ToolPolicyRequest, ToolPolicyResult, ToolKind } from '@proma/protocol'
import { decidePermission } from './index.ts'

const readTools = new Set(['read', 'glob', 'grep', 'ls', 'todoread', 'taskget', 'tasklist'])
const editTools = new Set(['write', 'edit', 'multiedit'])
// 严格整命令语法，不把 git branch/remote/tag 等可变子命令统统当只读。
const safeCommands = [
  /^(pwd|whoami|uname)( --?[a-zA-Z]+)?$/,
  /^(node|bun|git) --version$/,
  /^git (status|diff|log|show)( (?:--(?:short|porcelain|stat|oneline|no-pager|name-only)|-\d+|[a-zA-Z0-9_./][a-zA-Z0-9_./-]*))*$/,
  /^git (branch --list|remote -v|tag --list)$/,
  /^ls(?: (?:-[alhRFtdrS1]+|--(?:all|long|human-readable)|[a-zA-Z0-9_./][a-zA-Z0-9_./-]*))*$/,
  /^(head|tail)(?: (?:-[nc]|-[0-9]+|[0-9]+|[a-zA-Z0-9_./][a-zA-Z0-9_./-]*))*$/,
  /^wc(?: (?:-[lwcLm]+|[a-zA-Z0-9_./][a-zA-Z0-9_./-]*))*$/,
  /^(stat|file|du|df)(?: [a-zA-Z0-9_./][a-zA-Z0-9_./-]*)*$/,
]
export function commandFacts(command: string): { risk: ToolPolicyResult['risk']; tokens?: string[]; reason: string } {
  if (!command.trim() || command !== command.trim()) return { risk: 'review', reason: '命令为空或包含边缘空白' }
  const normalized = command.replace(/^(?:[^\s]*[/\\])(?=[^\s]+)/, '')
  const danger = /^(?:sudo|su|rm|rmdir|dd|mkfs|chmod|chown|kill|killall|pkill|del|erase|format|remove-item)(?:\.exe)?(?:\s|$)/i.test(normalized)
    || /^git\b.*\b(?:push\b.*(?:--force(?:-with-lease)?(?:=|\b)|(?:^|\s)-f(?:\s|$))|reset\b.*--hard|clean\b.*-[a-z]*f|branch\b.*-[dD](?:\s|$))/i.test(normalized)
    || /(?:\bfind\b.*\s-(?:exec|execdir|delete)\b|\b(?:curl|wget)\b.*[|]\s*(?:sh|bash))/i.test(command)
  if (danger) return { risk: 'dangerous', reason: '破坏性或高风险命令默认拒绝' }
  // 不尝试用不完整shell解析器解释复杂结构；白名单不能覆盖它们。
  if (/[\x00-\x1f\x7f;&|<>`$(){}\\'"!*?\[\]~]/.test(command) || /(^|\s)[^\s=]+=/.test(command)) return { risk: 'review', reason: '复合命令、重定向、替换或不透明语法必须询问' }
  const tokens = command.split(/ +/)
  if (/^(?:env|command|exec|sh|bash|zsh|fish|cmd|powershell|pwsh|python\d*|node)(?:\.exe)?$/i.test(tokens[0]?.split(/[\\/]/).at(-1) ?? '') && !/^(node|bun) --version$/.test(command)) return { risk: 'review', reason: '解释器或命令包装器必须询问' }
  if (tokens.some((token) => /^(?:--(?:output|upload|exec|config)(?:=|$)|-o)/i.test(token))) return { risk: 'review', reason: '可能写入或执行的选项必须询问' }
  // diff --no-index --output 与外部diff驱动不能自动允许。
  if (/^git\b/.test(command) && /(?:--(?:ext-diff|textconv|no-index)|-c)(?:\s|=|$)/.test(command)) return { risk: 'review', reason: 'Git扩展执行或写出选项必须询问' }
  return { risk: safeCommands.some((pattern) => pattern.test(command)) ? 'read' : 'review', tokens, reason: '按整命令规则分类' }
}
/** 白名单只接受用户明确批准的精确argv；不支持前缀/通配符或PowerShell工具级授权。 */
export class PermissionRules {
  private readonly commands: CommandRule[]
  private readonly grants = new Map<string, Set<string>>()
  constructor(rules: readonly CommandRule[] = []) { this.commands = rules.map((rule) => CommandRuleSchema.parse(rule)) }
  evaluate(sessionId: string, rawPolicy: PermissionPolicy, raw: ToolPolicyRequest): ToolPolicyResult {
    const policy = PermissionPolicySchema.parse(rawPolicy); const request = ToolPolicyRequestSchema.parse(raw)
    const tool = request.tool.toLowerCase().split(/[\\/]/).at(-1) ?? ''
    const supplied = request.input && typeof request.input === 'object' && !Array.isArray(request.input) ? request.input.command : undefined
    if (typeof supplied === 'string' && supplied !== request.command) return { decision: 'deny', risk: 'dangerous', reason: '判定命令与实际工具输入不一致', whitelistable: false }
    const powershell = /^(?:powershell|pwsh)(?:\.exe)?$/.test(tool)
    const execute = powershell || /^(?:bash|shell|execute|sh|zsh|cmd)(?:\.exe)?$/.test(tool) || request.command !== undefined || typeof supplied === 'string'
    const kind: ToolKind = execute ? 'execute' : readTools.has(tool) ? 'read' : editTools.has(tool) ? 'edit' : tool === 'delete' ? 'delete' : ['fetch', 'webfetch'].includes(tool) ? 'fetch' : 'other'
    const facts = execute ? commandFacts(request.command ?? '') : { risk: kind === 'read' ? 'read' as const : 'review' as const, reason: '工具分类' }
    const base = decidePermission(policy, { kind, readOnlyCommand: execute && !powershell && facts.risk === 'read' })
    if (facts.risk === 'dangerous') return { decision: 'deny', risk: 'dangerous', reason: facts.reason, whitelistable: false }
    if (base === 'deny') return { decision: 'deny', risk: facts.risk, reason: '只读或plan策略拒绝副作用', whitelistable: false }
    const transparent = !execute || !!facts.tokens
    const key = JSON.stringify(request)
    const exact = execute && !powershell && facts.tokens && this.commands.some((rule) => JSON.stringify([rule.executable, ...rule.args]) === JSON.stringify(facts.tokens))
    const granted = !powershell && transparent && this.grants.get(sessionId)?.has(key)
    const decision = execute && (powershell || !transparent) ? 'ask' : exact || granted ? 'allow' : base
    return { decision, risk: facts.risk, reason: facts.reason, whitelistable: !powershell && transparent }
  }
  allowForSession(sessionId: string, policy: PermissionPolicy, raw: ToolPolicyRequest): void {
    const request = ToolPolicyRequestSchema.parse(raw); const result = this.evaluate(sessionId, policy, request)
    if (!result.whitelistable || result.decision === 'deny') throw new Error('此请求不能加入会话白名单')
    const grants = this.grants.get(sessionId) ?? new Set<string>(); grants.add(JSON.stringify(request)); this.grants.set(sessionId, grants)
  }
  clearSession(sessionId: string): void { this.grants.delete(sessionId) }
}
