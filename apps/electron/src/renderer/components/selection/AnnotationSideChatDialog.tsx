import * as React from 'react';
import { useStore } from 'jotai';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { submitAnnotationSideChat } from './side-chat';
export function AnnotationSideChatDialog(): React.ReactElement {
  const store = useStore(),
    [value, setValue] = React.useState<{
      parentId: string;
      quote: string;
      messageId?: string;
      chat?: boolean;
    } | null>(null),
    [question, setQuestion] = React.useState(''),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState('');
  React.useEffect(() => {
    const receive = (event: Event) => {
      setValue((event as CustomEvent<{
        parentId: string;
        quote: string;
        messageId?: string;
        chat?: boolean;
      }>).detail);
      setQuestion('');
      setError('');
    };
    window.addEventListener('tervell-side-chat-request', receive);
    return () => window.removeEventListener('tervell-side-chat-request', receive);
  }, []);
  const send = async () => {
    if (!value || !question.trim()) return;
    setBusy(true);
    setError('');
    try {
      await submitAnnotationSideChat(value.parentId, value.quote, question, store, value.messageId, value.chat);
      setValue(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <Dialog open={!!value} onOpenChange={open => {
    if (!open && !busy) setValue(null);
  }}><DialogContent><DialogHeader><DialogTitle>围绕选区旁支问答</DialogTitle><DialogDescription>继承主会话的内核、模型、模式与推理档位，带入来源消息和最近八轮上下文。</DialogDescription></DialogHeader><blockquote className="max-h-40 overflow-auto border-l-2 border-primary/40 pl-3 text-sm whitespace-pre-wrap">{value?.quote}</blockquote><Textarea autoFocus aria-label="旁支问题" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
          e.preventDefault();
          void send();
        }
      }} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy || !question.trim()} onClick={() => void send()}>{busy ? '创建中…' : '开始旁支问答'}</Button></DialogContent></Dialog>;
}
