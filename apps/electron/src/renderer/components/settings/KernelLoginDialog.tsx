import * as React from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import '@xterm/xterm/css/xterm.css';

export function KernelLoginDialog({ kernelId, onClose }: { kernelId: string; onClose: () => void }) {
  const host = React.useRef<HTMLDivElement>(null), terminalId = React.useRef('');
  const [error, setError] = React.useState(''), [ended, setEnded] = React.useState(false);
  React.useEffect(() => {
    let live = true, terminal: Terminal | undefined, offOutput = () => {}, offExit = () => {}, observer: ResizeObserver | undefined;
    const frame = requestAnimationFrame(() => {
      if (!host.current) return;
      terminal = new Terminal({ fontSize: 13, fontFamily: 'monospace', cursorBlink: true, theme: { background: getComputedStyle(host.current).backgroundColor, foreground: getComputedStyle(host.current).color }, scrollback: 2000 });
      const fit = new FitAddon(); terminal.loadAddon(fit); terminal.open(host.current); fit.fit();
      void window.electronAPI.openDesktopKernelLogin(kernelId).then(async state => {
        if (!live) { await window.electronAPI.killTerminal(state.terminalId).catch(() => {}); return; }
        terminalId.current = state.terminalId;
        const term = terminal!, pending: Array<{ sequence: number; data: string }> = [];
        let readingSnapshot = true, sequence = 0;
        const consume = (event: { sequence: number; data: string }) => {
          if (event.sequence <= sequence) return;
          sequence = event.sequence; term.write(event.data);
          window.electronAPI.acknowledgeTerminalOutput({ terminalId: state.terminalId, sequence });
        };
        offOutput = window.electronAPI.onTerminalOutput(event => {
          if (!live || event.terminalId !== state.terminalId) return;
          if (readingSnapshot) pending.push(event); else consume(event);
        });
        offExit = window.electronAPI.onTerminalExit(event => { if (live && event.terminalId === state.terminalId) setEnded(true); });
        // 登录URL可能在IPC返回前就打印；快照补齐，序号避免与实时事件重复。
        try {
          const snapshot = await window.electronAPI.getTerminalSnapshot(state.terminalId);
          if (!live) return;
          term.write(snapshot.output); sequence = snapshot.sequence;
          window.electronAPI.acknowledgeTerminalOutput({ terminalId: state.terminalId, sequence });
        } finally { readingSnapshot = false; if (live) for (const event of pending) consume(event); }
        if (!live) return;
        term.onData(data => { void window.electronAPI.writeTerminal({ terminalId: state.terminalId, data }).catch(cause => setError(String(cause))); });
        observer = new ResizeObserver(() => { try { fit.fit(); void window.electronAPI.resizeTerminal({ terminalId: state.terminalId, cols: term.cols, rows: term.rows }); } catch { /* 卸载。 */ } });
        if (host.current) observer.observe(host.current);
      }).catch(cause => { if (live) setError(String(cause)); });
    });
    return () => { live = false; cancelAnimationFrame(frame); offOutput(); offExit(); observer?.disconnect(); terminal?.dispose(); if (terminalId.current) void window.electronAPI.killTerminal(terminalId.current).catch(() => {}); };
  }, [kernelId]);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>登录 {kernelId}</DialogTitle><DialogDescription>这是内核自己的登录程序，凭据仍由该工具管理。请按输出打开浏览器或输入确认。关闭窗口将结束本次登录进程，也可前往全局模型路由登录官方账号。</DialogDescription></DialogHeader><div className="h-80 rounded-lg bg-background p-3 text-foreground" ref={host} aria-label="内核账号登录终端" />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{ended && <p role="status" className="text-sm text-muted-foreground">登录进程已结束，可返回检查连接。</p>}<div className="flex justify-end"><Button variant="outline" onClick={onClose}>关闭</Button></div></DialogContent></Dialog>;
}
