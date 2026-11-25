/** 参数使用 JSON 数组或逐行输入；不把逗号/空格视作参数边界。 */
export function parseMcpArguments(text: string): string[] {
  if (!text.trim()) return []
  if (text.trimStart().startsWith('[')) {
    let parsed: unknown
    try { parsed = JSON.parse(text) } catch { throw new Error('参数 JSON 无效，请使用字符串数组，例如 ["-y", "包名"]。') }
    if (!Array.isArray(parsed) || parsed.some(value => typeof value !== 'string')) throw new Error('参数必须是字符串数组。')
    return parsed as string[]
  }
  return text.split(/\r?\n/).filter(line => line.trim().length > 0)
}
export function parseMcpKeyValues(text: string, separator: '=' | ':'): Record<string, string> {
  const entries = text.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return undefined
    const position = line.indexOf(separator)
    const key = line.slice(0, position).trim()
    if (position <= 0 || !key) throw new Error(`第 ${index + 1} 行格式无效，请使用 ${separator === '=' ? 'KEY=VALUE' : 'Key: Value'}。`)
    if (separator === '=' && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error(`第 ${index + 1} 行的环境变量名称无效。`)
    if (separator === ':' && !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(key)) throw new Error(`第 ${index + 1} 行的请求头名称无效。`)
    return [key, line.slice(position + 1).trim()] as const
  }).filter((entry): entry is readonly [string, string] => entry !== undefined)
  const names = entries.map(([key]) => separator === ':' ? key.toLowerCase() : key)
  if (new Set(names).size !== names.length) throw new Error('存在重复名称，请合并后保存。')
  return Object.fromEntries(entries)
}
export function parseMcpTimeout(text: string): number | undefined {
  if (!text.trim()) return undefined
  const value = Number(text)
  if (!Number.isInteger(value) || value < 1 || value > 600) throw new Error('启动超时请输入 1–600 秒的整数。')
  return value
}
