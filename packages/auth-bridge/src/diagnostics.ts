import { createHash } from 'node:crypto'
import type { JsonValue } from '@proma/protocol'

const sensitive = /(?:secret|password|passwd|authorization|cookie|token|credential|api.?key|private.?key|extraEnv|headers|env|cipher)/i
const publicFields = new Set(['code','type','status','platform','arch','source','mode','kernelId','dialectId','version','name','sessionId','runId','seq','at','durationMs','count','events','logs','traces','configuration','environment','capabilities','tools','error','ok','data','result','frames','message','params','method','input','output','rawInput','rawOutput','arguments','text','content','prompt','summary','reason','path','cwd','url','endpoint','secretRef','apiKeySecretRef'])
const privateText = /^(?:text|message|reason|description|summary|prompt|input|rawInput|rawOutput|output|content|arguments|command|path|cwd|directory|uri|url|endpoint)$/i
/** 默认隐藏自由文本；诊断可用性依靠结构和错误码，不靠泄露用户正文。 */
export class DiagnosticRedactor {
  private readonly secrets: string[]
  constructor(secrets: readonly string[] = []) {
    if (secrets.some((value) => !value)) throw new Error('脱敏值不能为空')
    this.secrets = [...secrets].sort((a, b) => b.length - a.length)
  }
  text(raw: string): string {
    let value = raw
    for (const secret of this.secrets) for (const form of new Set([secret, encodeURIComponent(secret), Buffer.from(secret).toString('base64')])) value = value.split(form).join('[REDACTED]')
    return value.replace(/(?:Bearer|Basic)\s+[^\s"',}]+/gi, '[REDACTED]')
      .replace(/\bsk-[a-zA-Z0-9_-]{8,}\b/g, '[REDACTED]')
      .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
      .replace(/([?&](?:api.?key|token|secret|password)=)[^&#\s]+/gi, '$1[REDACTED]')
  }
  value(raw: unknown, depth = 0): JsonValue {
    if (depth > 12) return '[DEPTH_LIMIT]'
    if (raw === null || typeof raw === 'boolean') return raw
    if (typeof raw === 'number') return '[PRIVATE]'
    if (typeof raw === 'string') return '[PRIVATE]'
    if (Array.isArray(raw)) return raw.slice(0, 200).map((item) => this.value(item, depth + 1))
    if (!raw || typeof raw !== 'object') return null
    return Object.fromEntries(Object.entries(raw).slice(0, 200).map(([key, value]) => {
      const safeKey = this.text(key)
      const outputKey = publicFields.has(key) && safeKey === key ? key : `field_${createHash('sha256').update(key).digest('hex').slice(0, 12)}`
      if (sensitive.test(key) || privateText.test(key)) return [outputKey, '[REDACTED]']
      const publicEnums = new Set(['darwin','win32','linux','x64','arm64','ia32','scripted','live','verified','unverified','degraded','ready','error','running','completed','cancelled','read-only','ask','accept-edits','auto','E_FAILED','E_PERMISSION','E_MCP','E_ACP','E_TIMEOUT','ENOENT','EACCES'])
      const allowString = /^(?:code|type|status|platform|arch|source|mode)$/.test(key) && typeof value === 'string' && publicEnums.has(value)
      if (['seq', 'at', 'durationMs', 'count', 'code'].includes(key) && typeof value === 'number' && Number.isFinite(value)) return [outputKey, value]
      const safe = allowString && typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,80}$/.test(value) && this.text(value) === value ? value : this.value(value, depth + 1)
      return [outputKey, safe]
    }))
  }
  export(input: { environment: unknown; configuration: unknown; logs: unknown; traces: unknown }): string {
    return JSON.stringify({ format: 'proma-diagnostics', version: 1, ...Object.fromEntries((['environment', 'configuration', 'logs', 'traces'] as const).map((key) => [key, this.value(input[key])])) }, null, 2) + '\n'
  }
}
