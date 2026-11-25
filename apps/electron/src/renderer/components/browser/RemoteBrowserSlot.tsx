import * as React from 'react';
import type { BrowserRemoteInput } from '@proma/shared';
/** 手机创建的离屏标签保留同一页及登录；电脑仅为该类标签绘制实际帧。 */
export function RemoteBrowserSlot({
  sessionId,
  tabId
}: {
  sessionId: string;
  tabId: string;
}): React.ReactElement {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const ref = React.useRef<HTMLDivElement>(null),
    [image, setImage] = React.useState(''),
    [error, setError] = React.useState('');
  const size = React.useRef({
      width: 1200,
      height: 850
    }),
    composing = React.useRef(false);
  React.useEffect(() => {
    let alive = true,
      pending = false;
    const paint = async () => {
      const element = ref.current;
      if (!alive || pending || document.hidden || !element) return;
      const box = element.getBoundingClientRect();
      if (box.width < 100 || box.height < 100) return;
      pending = true;
      try {
        const frame = await window.electronAPI.getAgentBrowserRemoteFrame({
          sessionId,
          tabId,
          width: Math.min(3840, Math.round(box.width)),
          height: Math.min(2160, Math.round(box.height))
        });
        if (alive) {
          size.current = {
            width: frame.width,
            height: frame.height
          };
          setImage(frame.dataUrl);
          setError('');
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '浏览器首帧尚未就绪');
      } finally {
        pending = false;
      }
    };
    void paint();
    const timer = setInterval(() => void paint(), 200);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [sessionId, tabId]);
  const send = (input: Omit<BrowserRemoteInput, 'sessionId' | 'tabId'>) => void window.electronAPI.sendAgentBrowserRemoteInput({
    sessionId,
    tabId,
    ...input
  }).catch(e => setError(String(e)));
  const point = (event: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(size.current.width, (event.clientX - r.x) / r.width * size.current.width)),
      y: Math.max(0, Math.min(size.current.height, (event.clientY - r.y) / r.height * size.current.height))
    };
  };
  const modifiers = (e: React.KeyboardEvent): NonNullable<BrowserRemoteInput['modifiers']> => [...(e.shiftKey ? ['shift' as const] : []), ...(e.ctrlKey ? ['control' as const] : []), ...(e.altKey ? ['alt' as const] : []), ...(e.metaKey ? ['meta' as const] : [])];
  return <div ref={ref} tabIndex={0} role="application" aria-label="手机浏览器标签" className="relative flex-1 min-h-0 outline-none bg-white overflow-hidden titlebar-no-drag" onClick={event => {
    inputRef.current?.focus();
    send({
      kind: 'click',
      ...point(event)
    });
  }} onWheel={event => {
    event.preventDefault();
    send({
      kind: 'wheel',
      ...point(event),
      deltaY: Math.max(-5000, Math.min(5000, event.deltaY)),
      deltaX: Math.max(-5000, Math.min(5000, event.deltaX))
    });
  }} onKeyDown={event => {
    if (composing.current || event.nativeEvent.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) send({
      kind: 'text',
      text: event.key
    });else send({
      kind: 'key',
      key: event.key,
      modifiers: modifiers(event)
    });
  }} onCompositionStart={() => {
    composing.current = true;
  }} onCompositionEnd={event => {
    composing.current = false;
    if (event.data) send({
      kind: 'text',
      text: event.data
    });
  }} onPaste={event => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    if (text) send({
      kind: 'text',
      text: text.slice(0, 10000)
    });
  }}>
 <textarea ref={inputRef} aria-label="浏览器页面输入" autoComplete="off" className="absolute opacity-0 w-px h-px bottom-0 left-0 resize-none" onChange={event => {
      if (!composing.current) event.currentTarget.value = '';
    }} />
 {image ? <img className="block w-full h-full object-fill pointer-events-none select-none" src={image} alt="电脑与手机共享浏览器页面" draggable={false} /> : <p className="p-4 text-sm text-muted-foreground">正在恢复手机浏览器标签…</p>}
 {error && <p role="status" className="absolute bottom-0 inset-x-0 bg-background/90 p-2 text-xs text-destructive">{error}</p>}
 </div>;
}
