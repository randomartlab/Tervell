interface ComposerDocument {
  content: { size: number };
  textBetween(from: number, to: number, separator: string, leafText: string): string;
}

/** 插件给的是文本偏移；编辑器位置还包含段落等结构节点。 */
export function composerTextSelection(
  doc: ComposerDocument,
  selection: { start: number; end: number },
): { from: number; to: number } {
  const position = (offset: number): number => {
    const target = Math.max(0, Number.isFinite(offset) ? Math.trunc(offset) : 0);
    let low = 1;
    let high = Math.max(1, doc.content.size - 1);
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (doc.textBetween(0, middle, '\n', '\n').length < target) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  const from = position(selection.start);
  const to = position(selection.end);
  return { from: Math.min(from, to), to: Math.max(from, to) };
}
