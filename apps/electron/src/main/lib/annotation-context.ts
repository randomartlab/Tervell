export interface AnnotationContextTurn {
  role: string;
  text: string;
  ids: string[];
}

/** 来源消息单独保留，近期背景按完整 JSONL 记录取舍，不能截断为损坏的 JSON。 */
export function annotationConversationContext(turns: AnnotationContextTurn[], source?: AnnotationContextTurn): string {
  const budget = 48000;
  const recent = turns.slice(-16).filter(turn => turn !== source);
  const entries: string[] = [];
  const sourceEntry = source ? JSON.stringify({ role: source.role, text: source.text.slice(0, 8000), source: true }) : '';
  let size = sourceEntry.length;
  for (const turn of [...recent].reverse()) {
    const entry = JSON.stringify({ role: turn.role, text: turn.text.slice(0, 8000) });
    if (size + entry.length + 1 > budget) break;
    entries.unshift(entry);
    size += entry.length + 1;
  }
  if (sourceEntry) entries.unshift(sourceEntry);
  return entries.join('\n');
}
