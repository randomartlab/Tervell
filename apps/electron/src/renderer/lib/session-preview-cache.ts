interface PreviewItem { id: string; role: string; preview: string; avatar?: string; model?: string }
export const SESSION_PREVIEW_CACHE_LIMIT = 24
export const SESSION_PREVIEW_CACHE_BYTES = 8 * 1024 * 1024
const weights = new WeakMap<PreviewItem[], number>()
function previewBytes(items: PreviewItem[]): number {
  const prior = weights.get(items)
  if (prior !== undefined) return prior
  const size = items.reduce((total, item) => total + 128 + 2 * (item.id.length + item.preview.length + (item.avatar?.length ?? 0) + (item.model?.length ?? 0)), 32)
  weights.set(items, size)
  return size
}

/** 悬浮预览只保留独立的小字符串，不让V8 sliced string长久引用完整对话正文。 */
export function setSessionPreviewCache<T extends PreviewItem>(previous: Map<string, T[]>, id: string, items: T[]): Map<string, T[]> {
  const next = new Map(previous)
  next.delete(id)
  const compact = items.map(item => ({ ...item, preview: JSON.parse(JSON.stringify(item.preview.slice(0, 220))) as string }))
  if (previewBytes(compact) <= SESSION_PREVIEW_CACHE_BYTES) next.set(id, compact)
  let size = [...next.values()].reduce((total, value) => total + previewBytes(value), 0)
  for (const [key, value] of next) {
    if (next.size <= SESSION_PREVIEW_CACHE_LIMIT && size <= SESSION_PREVIEW_CACHE_BYTES) break
    next.delete(key)
    size -= previewBytes(value)
  }
  return next
}
