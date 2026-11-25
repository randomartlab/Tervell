export interface AnnotationTextRange {
  start: number;
  end: number;
}

/** 重复选文只能用已保存的精确偏移恢复，不能猜测第一处同名文字。 */
export function resolveAnnotationTextRange(
  text: string,
  quote: string,
  saved?: Partial<AnnotationTextRange>,
): AnnotationTextRange | null {
  if (!quote) return null;
  if (saved?.start !== undefined && saved.end !== undefined) {
    if (!Number.isSafeInteger(saved.start) || !Number.isSafeInteger(saved.end)
      || saved.start < 0 || saved.end < saved.start || saved.end > text.length) return null;
    return text.slice(saved.start, saved.end) === quote ? { start: saved.start, end: saved.end } : null;
  }
  const start = text.indexOf(quote);
  if (start < 0 || text.indexOf(quote, start + 1) >= 0) return null;
  return { start, end: start + quote.length };
}

function textBoundary(root: Node, offset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (remaining <= node.length) return { node, offset: remaining };
    remaining -= node.length;
  }
  return null;
}

export function sourceLinePosition(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset), last = before.lastIndexOf('\n');
  return { line: before.split('\n').length, column: offset - last - 1 };
}

/** Pierre 的行号在独立 gutter，选区只进入代码文字，支持跨 token 与跨行。 */
export function revealAnnotationInPreview(root: HTMLElement, text: string, range: AnnotationTextRange): boolean {
  const roots: ParentNode[] = [root];
  const discover = (parent: ParentNode) => {
    for (const node of parent.querySelectorAll('*')) {
      if (node.shadowRoot) { roots.push(node.shadowRoot); discover(node.shadowRoot); }
    }
  };
  discover(root);
  for (const parent of roots) {
    const code = parent.querySelector('[data-code] [data-content]');
    const start = sourceLinePosition(text, range.start), end = sourceLinePosition(text, range.end);
    const first = code?.querySelector(`[data-line="${start.line}"]`), last = code?.querySelector(`[data-line="${end.line}"]`);
    const fallback = [...parent.querySelectorAll('pre')].find(node => node.textContent === text);
    const from = first ? textBoundary(first, start.column) : fallback ? textBoundary(fallback, range.start) : null;
    const to = last ? textBoundary(last, end.column) : fallback ? textBoundary(fallback, range.end) : null;
    if (!from || !to) continue;
    const selection = window.getSelection(), selected = document.createRange();
    selected.setStart(from.node, from.offset); selected.setEnd(to.node, to.offset);
    (first ?? fallback)?.scrollIntoView({ block: 'center' });
    selection?.removeAllRanges(); selection?.addRange(selected);
    return !!selection && !selection.isCollapsed;
  }
  return false;
}

export function captureAnnotationOffsets(text: string, range: Range): Partial<AnnotationTextRange> {
  const element = (node: Node) => node instanceof Element ? node : node.parentElement;
  const first = element(range.startContainer)?.closest<HTMLElement>('[data-line]');
  const last = element(range.endContainer)?.closest<HTMLElement>('[data-line]');
  if (!first || !last || first.closest('[data-content]') !== last.closest('[data-content]')) return {};
  const offset = (line: HTMLElement, node: Node, column: number): number | null => {
    const number = Number(line.dataset.line);
    if (!Number.isInteger(number) || number < 1) return null;
    const lines = text.split('\n');
    if (number > lines.length) return null;
    const prefix = document.createRange(); prefix.selectNodeContents(line); prefix.setEnd(node, column);
    return lines.slice(0, number - 1).reduce((n, value) => n + value.length + 1, 0) + prefix.toString().length;
  };
  const start = offset(first, range.startContainer, range.startOffset), end = offset(last, range.endContainer, range.endOffset);
  return start !== null && end !== null && end >= start ? { start, end } : {};
}
