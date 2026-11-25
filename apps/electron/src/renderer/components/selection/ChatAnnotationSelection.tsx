import * as React from 'react';
import { createPortal } from 'react-dom';
import { startAnnotationSideChat } from './side-chat';
import { offerAnnotation } from './annotation-store';
/** Chat 原生选区接口；只接受一条消息内的连续文本。 */
export function ChatAnnotationSelection(): React.ReactElement | null {
  const [value, setValue] = React.useState<{
    text: string;
    messageId: string;
    sessionId: string;
    x: number;
    y: number;
    range: Range;
  } | null>(null);
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const capture = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount !== 1) {
          setValue(null);
          return;
        }
        const range = selection.getRangeAt(0),
          element = (node: Node) => node instanceof Element ? node : node.parentElement,
          start = element(range.startContainer),
          end = element(range.endContainer),
          message = start?.closest<HTMLElement>('[data-message-id]'),
          chat = start?.closest<HTMLElement>('[data-annotation-chat]');
        if (!message || !chat || end?.closest('[data-message-id]') !== message || start?.closest('[contenteditable="true"],input,textarea')) {
          setValue(null);
          return;
        }
        const text = range.toString(),
          rect = range.getBoundingClientRect();
        if (!text.trim() || text.length > 200000) return;
        setValue({
          text,
          messageId: message.dataset.messageId!,
          sessionId: chat.dataset.annotationChat!,
          x: rect.left,
          y: rect.bottom,
          range: range.cloneRange()
        });
      }, 70);
    };
    const down = (e: PointerEvent) => {
      if (!(e.target as Element)?.closest('[data-chat-annotation-action],[data-annotation-editor]')) setValue(null);
    };
    document.addEventListener('pointerup', capture);
    document.addEventListener('keyup', capture);
    document.addEventListener('pointerdown', down, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerup', capture);
      document.removeEventListener('keyup', capture);
      document.removeEventListener('pointerdown', down, true);
    };
  }, []);
  return value ? createPortal(<div data-chat-annotation-action className="fixed z-[110] flex gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg" style={{
    left: Math.max(12, Math.min(value.x, innerWidth - 270)),
    top: Math.min(value.y + 6, innerHeight - 48)
  }}><button type="button" data-chat-annotation-action className="rounded-lg px-3 py-2 text-sm hover:bg-muted" style={{
      left: Math.max(12, Math.min(value.x, innerWidth - 180)),
      top: Math.min(value.y + 6, innerHeight - 48)
    }} onPointerDown={e => e.preventDefault()} onClick={() => {
      offerAnnotation({
        text: value.text,
        x: value.x,
        y: value.y,
        source: {
          kind: 'chat',
          label: 'Chat 消息',
          messageId: value.messageId,
          sessionId: value.sessionId
        },
        validate: () => value.range.startContainer.isConnected && value.range.toString() === value.text,
        reveal: () => {
          const element = value.range.startContainer.parentElement;
          if (!element) return false;
          element.scrollIntoView({
            block: 'center'
          });
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(value.range);
          return true;
        }
      });
      setValue(null);
    }}>添加批注</button><button type="button" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onPointerDown={e => e.preventDefault()} onClick={() => {
      void startAnnotationSideChat(value.sessionId, value.text, value.messageId, true);
      setValue(null);
    }}>旁支问答</button></div>, document.body) : null;
}
