import type { ConversationAnnotation } from '@proma/shared';
/** 只合并互不重叠的行；同一批注被双方编辑时保留手机输入并要求核对。 */
export function rebaseMobileAnnotations(before: ConversationAnnotation[], desired: ConversationAnnotation[], fresh: ConversationAnnotation[]): ConversationAnnotation[] {
  const old = new Map(before.map(row => [row.id, row])),
    next = new Map(desired.map(row => [row.id, row])),
    current = new Map(fresh.map(row => [row.id, row]));
  for (const id of new Set([...old.keys(), ...next.keys()])) {
    if (JSON.stringify(old.get(id)) === JSON.stringify(next.get(id))) continue;
    if (JSON.stringify(current.get(id)) !== JSON.stringify(old.get(id)) && JSON.stringify(current.get(id)) !== JSON.stringify(next.get(id))) throw Error('这条批注已在电脑或其他窗口编辑；手机输入保留，请核对后重试。');
    const value = next.get(id);
    if (value) current.set(id, value);else current.delete(id);
  }
  return [...current.values()];
}
