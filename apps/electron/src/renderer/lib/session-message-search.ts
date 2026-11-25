import {
  createSearchSnippet,
  MAX_NORMALIZED_SEARCH_QUERY_LENGTH,
  MAX_SEARCH_QUERY_SOURCE_LENGTH,
  findBestSearchMatchInNormalized,
  normalizeSearchText,
} from '@proma/shared'
import type { SessionMessageSearchResponse, SessionMessageSearchResult } from '@proma/shared'

/**
 * 搜索数据源与迷你地图展示解耦：数据源只返回命中元数据，不向 UI 泄露完整历史正文。
 */
export type SessionMessageSearch = (query: string) => Promise<SessionMessageSearchResponse>

export interface LocalSearchRecordInput {
  messageId: string
  role: SessionMessageSearchResult['role']
  text: string
}

export interface LocalSearchRecord extends LocalSearchRecordInput {
  normalizedText?: ReturnType<typeof normalizeSearchText>
}

/** 单条巨型工具/消息也只规范化有限窗口；重叠按规范化字符计，跨空白和 Unicode 不漏命中。 */
export function findBoundedSearchMatch(text: string, query: ReturnType<typeof normalizeSearchText>) {
  const window = { chars: [] as string[], starts: [] as number[], ends: [] as number[] }
  let best: ReturnType<typeof findBestSearchMatchInNormalized> = null
  const retain = query.chars.length + 1
  const scan = () => {
    const match = findBestSearchMatchInNormalized(window, query)
    if (match && (!best || match.score > best.score)) best = match
  }
  for (let offset = 0; offset < text.length;) {
    let end = Math.min(text.length, offset + 8192)
    if (end < text.length && text.charCodeAt(end - 1) >= 0xd800 && text.charCodeAt(end - 1) <= 0xdbff) end--
    const part = normalizeSearchText(text.slice(offset, end))
    window.chars.push(...part.chars)
    window.starts.push(...part.starts.map(position => position + offset))
    window.ends.push(...part.ends.map(position => position + offset))
    offset = end
    if (window.chars.length >= 8192) {
      scan()
      if ((best as ReturnType<typeof findBestSearchMatchInNormalized>)?.kind === 'exact') return best
      window.chars = window.chars.slice(-retain)
      window.starts = window.starts.slice(-retain)
      window.ends = window.ends.slice(-retain)
    }
  }
  scan()
  return best
}

/** 在 Agent 结构快照更新时预计算规范化文本，而不是随每次输入重复规范化全文。 */
export function createLocalSearchRecords(records: readonly LocalSearchRecordInput[]): LocalSearchRecord[] {
  // 只保存原文引用；按字符三数组的全文索引对长工具日志会放大数十倍内存。
  return records.map((record) => ({ ...record }))
}

/**
 * 在 Agent 已加载的结构化快照中检索全文。
 * 调用方只应在消息结构改变或流式轮次结束时重建 records，避免 token 级的全历史扫描。
 */
export function searchLocalSessionMessages(
  records: readonly LocalSearchRecord[],
  query: string,
  maxResults = 50,
): SessionMessageSearchResponse {
  if (query.length > MAX_SEARCH_QUERY_SOURCE_LENGTH) {
    return { results: [], truncated: false, queryTooLong: true }
  }
  const normalizedQuery = normalizeSearchText(query)
  if (normalizedQuery.chars.length < 2) return { results: [], truncated: false, queryTooLong: false }
  if (normalizedQuery.chars.length > MAX_NORMALIZED_SEARCH_QUERY_LENGTH) {
    return { results: [], truncated: false, queryTooLong: true }
  }

  const results: Array<SessionMessageSearchResult & { score: number }> = []
  for (const record of records) {
    const match = record.normalizedText
      ? findBestSearchMatchInNormalized(record.normalizedText, normalizedQuery)
      : findBoundedSearchMatch(record.text, normalizedQuery)
    if (!match) continue
    const snippet = createSearchSnippet(record.text, match.matchStart, match.matchLength)
    results.push({
      messageId: record.messageId,
      role: record.role,
      ...snippet,
      score: match.score,
    })
    if (results.length > maxResults * 2) {
      results.sort((a, b) => b.score - a.score)
      results.length = maxResults
    }
  }

  return {
    results: results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ score: _score, ...result }) => result),
    truncated: false,
    queryTooLong: false,
  }
}
