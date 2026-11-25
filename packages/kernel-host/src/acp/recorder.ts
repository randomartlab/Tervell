import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { closeSync, fsyncSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { AcpTraceSchema, JsonRpcMessageSchema } from '@proma/protocol'
import type { AcpTrace, JsonValue } from '@proma/protocol'

const numericKey = /^(?:protocolVersion|code|seq|inputTokens|outputTokens|totalTokens|cachedReadTokens|cachedWriteTokens|thoughtTokens|input_tokens|output_tokens|cache_read_input_tokens|cache_creation_input_tokens|used|size|amount|originalTokens|compactedTokens|attempt|maxAttempts|delayMs|retryAfterMs|contentIndex|exitCode|wallTimeMs)$/
const secretKey = /^(?:authorization|proxy-authorization|api[-_]?key|password|passwd|secret|access[-_]?token|refresh[-_]?token|token|cookie|credentials?|authContent)$/i
const identityKey = /^(?:id|sessionId|toolCallId|optionId|compactionId|messageId|questionId|value|currentValue|modelId|currentModelId)$/
const structuralKey = /^(?:jsonrpc|method|id|sessionId|toolCallId|optionId|compactionId|messageId|sessionUpdate|type|kind|status|stopReason|currentValue|value|modelId|currentModelId|currency|api|version|configId|category|outcome|questionId|selectedOptionIds|priority)$/
const fieldKey = /^(?:jsonrpc|id|method|params|result|update|toolCall|error|code|message|data|protocolVersion|clientInfo|clientCapabilities|agentInfo|agentCapabilities|authMethods|name|label|title|description|version|sessionId|cwd|mcpServers|prompt|content|type|text|mimeType|uri|url|sessionUpdate|toolCallId|optionId|kind|status|rawInput|rawOutput|locations|path|line|options|outcome|answers|questionId|questions|selectedOptionIds|allowMultiple|plan|overview|todos|entries|priority|messageId|contentIndex|usage|inputTokens|outputTokens|totalTokens|cachedReadTokens|cachedWriteTokens|thoughtTokens|used|size|cost|amount|currency|stopReason|models|modelId|currentModelId|availableModels|configOptions|category|currentValue|value|configId|availableCommands|currentModeId|updatedAt|_meta|quota|token_count|input_tokens|output_tokens|model_usage|model|compaction|compactionId|summary|retry|reset|attempt|maxAttempts|delayMs|reason|originalTokens|compactedTokens|details|metadata|output|stdout|stderr|exitCode|exit_code|wallTimeMs|async|service|signal|timedOut|timed_out|exit|input|arguments|i|command|session|terminal|fs|readTextFile|writeTextFile|loadSession|promptCapabilities|mcpCapabilities|sessionCapabilities|image|audio|embeddedContext|http|sse|auth|parameterizedModelPicker|steering|supported|form|elicitation|mode|textSignature|resource|resource_link|oldText|newText)$/
const enumValues = new Set(['agent_message_chunk','agent_thought_chunk','user_message_chunk','tool_call','tool_call_update','plan','usage_update','compaction_update','compaction_summary_chunk','available_commands_update','config_option_update','current_mode_update','session_info_update','2.0','text','image','audio','resource','resource_link','content','diff','terminal','pending','in_progress','completed','failed','running','succeeded','cancelled','end_turn','max_tokens','max_turn_requests','refusal','allow_once','allow_always','reject_once','reject_always','allow','deny','selected','answered','accepted','high','medium','low','USD','EUR','credits','select','boolean','model','mode','thought_level','model_config','other','read','search','edit','delete','execute','fetch','move','think'])
const methodValue = /^(?:initialize|authenticate|session\/(?:new|load|prompt|cancel|update|set_mode|set_model|set_config_option|request_permission)|cursor\/(?:ask_question|create_plan|list_available_models)|_proma\/(?:compaction|retry)|fs\/(?:read_text_file|write_text_file)|terminal\/(?:create|output|wait_for_exit|kill|release))$/
const rawShapeKey = /^(?:type|text|content|details|metadata|output|stdout|stderr|exitCode|exit_code|wallTimeMs|async|service|signal|timedOut|timed_out|exit|path|input|arguments|i|command|error)$/
const privateKey = /^(?:text|description|summary|message|reason|command|stdout|stderr|output|plan|overview|rawInput|rawOutput|content|prompt|data|path|cwd|directory|file|uri|url)$/i
export interface TraceRecorderOptions { kernelId: string; dialectId?: string; origin: AcpTrace['origin']; agentVersion: string; source: string; secrets?: readonly string[]; maxBytes?: number; maxFrames?: number }
/** 默认隐去自由文本/路径/工具输入输出；JSON-RPC控制字段保留，不能把trace当原始审计日志。 */
export class AcpTraceRecorder {
  private readonly frames: AcpTrace['frames'] = []
  private bytes = 0
  private readonly salt = randomBytes(32)
  private digest(value: string): string { return createHmac('sha256', this.salt).update(value).digest('hex').slice(0, 20) }
  constructor(private readonly options: TraceRecorderOptions) {
    if (options.secrets?.some((secret) => !secret)) throw new Error('显式脱敏值不能为空')
    AcpTraceSchema.parse({ format: 'proma-acp-trace', version: 1, ...this.header(), frames: [] })
  }
  private header() { return { kernelId: this.options.kernelId, ...(this.options.dialectId ? { dialectId: this.options.dialectId } : {}), origin: this.options.origin, agentVersion: this.clean(this.options.agentVersion), source: this.clean(this.options.source).replace(/(?:\/[Uu]sers\/|\/home\/|[A-Za-z]:\\Users\\)[^\s]+/g, '[PATH]') } }
  private clean(value: string): string {
    let text = value
    for (const secret of [...(this.options.secrets ?? [])].sort((a, b) => b.length - a.length)) text = text.split(secret).join('[REDACTED]')
    return text.replace(/(?:Bearer\s+)[^\s"',}]+/gi, 'Bearer [REDACTED]').replace(/\bsk-[a-zA-Z0-9_-]{8,}\b/g, '[REDACTED]').replace(/([?&](?:api_key|token|key|secret)=)[^&#\s]+/gi, '$1[REDACTED]')
  }
  private sanitize(value: JsonValue, key = '', free = false): JsonValue {
    if (secretKey.test(key)) return '[REDACTED]'
    if (typeof value === 'string') {
      const cleaned = this.clean(value)
      if (!free && identityKey.test(key)) return `id_${this.digest("string:" + cleaned)}`
      if ((free && !(key === 'type' && ['text', 'image', 'content', 'diff'].includes(cleaned))) || privateKey.test(key) || !structuralKey.test(key)) return `[text:${this.digest(cleaned)}]`
      if (key === 'method' ? !methodValue.test(cleaned) : key === 'version' ? !/^v?\d{1,4}(?:\.\d{1,8}){0,3}(?:-[a-z0-9.-]{1,24})?$/i.test(cleaned) : !enumValues.has(cleaned)) return `[enum:${this.digest(cleaned)}]`
      // JSON strings can occur under SDK-specific keys: remove home paths and long opaque secret-like runs too.
      return cleaned.replace(/(?:\/[Uu]sers\/|\/home\/|[A-Za-z]:\\Users\\)[^\s"']+/g, '[PATH]').replace(/\b[A-Za-z0-9_+=/-]{48,}\b/g, '[OPAQUE]')
    }
    if (typeof value === 'number' && identityKey.test(key)) return `id_${this.digest("number:" + String(value))}`
    if (typeof value === 'number' && !numericKey.test(key)) return '[NUMBER]'
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item, key === 'selectedOptionIds' ? 'optionId' : '', free))
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([child, item]) => [!fieldKey.test(child) || this.clean(child) !== child || ((free || ['rawInput', 'rawOutput', 'input', 'arguments'].includes(key)) && !rawShapeKey.test(child)) || /[\\/@]|(?:sk-[A-Za-z0-9_-]{8,})/.test(child) ? `key_${this.digest(this.clean(child))}` : child, this.sanitize(item, child, free || ['rawInput', 'rawOutput', 'input', 'arguments'].includes(key))]))
    return free && value !== null ? '[PRIVATE]' : value
  }
  record(direction: 'client' | 'agent', raw: unknown): void {
    const message = JsonRpcMessageSchema.parse(raw)
    const safe = JsonRpcMessageSchema.parse(this.sanitize(JSON.parse(JSON.stringify(message))))
    const frame = { seq: this.frames.length + 1, direction, message: safe }
    const bytes = Buffer.byteLength(JSON.stringify(frame))
    if (this.frames.length >= (this.options.maxFrames ?? 100000) || this.bytes + bytes > (this.options.maxBytes ?? 32 * 1024 * 1024)) throw new Error('ACP trace录制超过上限')
    this.frames.push(frame); this.bytes += bytes
  }
  snapshot(): AcpTrace { return AcpTraceSchema.parse({ format: 'proma-acp-trace', version: 1, ...this.header(), frames: this.frames }) }
  export(): string { return JSON.stringify(this.snapshot(), null, 2) + '\n' }
  save(path: string): void {
    const data = this.export(); const temp = `${path}.${randomUUID()}.tmp`; let descriptor: number | undefined
    try {
      descriptor = openSync(temp, 'wx', 0o600)
      // Windows 不实现 POSIX owner/group 位；在写入数据前移除继承 ACL，仅允许当前用户与 SYSTEM。
      if (process.platform === 'win32') {
        const system = process.env.SystemRoot || 'C:\\Windows'
        const identity=execFileSync(join(system,'System32/whoami.exe'),['/user','/fo','csv','/nh'],{encoding:'utf8',windowsHide:true,timeout:10000})
        const sid=identity.match(/\bS-1-(?:\d+-)+\d+\b/)?.[0]
        if(!sid)throw new Error('无法确认私有ACP录制文件的Windows用户身份')
        // 原生 ACL 工具避免启动 PowerShell/.NET；新建空文件先收紧权限，再写入任何录制内容。
        // 先清除运行时创建文件时留下的显式组授权，再移除继承，不能只添加用户授权。
        execFileSync(join(system,'System32/icacls.exe'),[temp,'/reset'],{windowsHide:true,timeout:10000,stdio:'pipe'})
        execFileSync(join(system,'System32/icacls.exe'),[temp,'/inheritance:r','/grant:r',`*${sid}:(F)`,'*S-1-5-18:(F)'],{windowsHide:true,timeout:10000,stdio:'pipe'})
      }
      writeFileSync(descriptor, data); fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined; renameSync(temp, path)
    }
    finally { if (descriptor !== undefined) closeSync(descriptor); rmSync(temp, { force: true }) }
  }
}
