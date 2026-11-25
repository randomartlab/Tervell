import {finishMobileOperation} from './operation-result';
export interface RecordValue {
  [key: string]: unknown;
}
interface BridgeResult {
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}
declare global {
  interface Window {
    TervellNative?: {
      postMessage: (json: string) => void;
    };
    __tervellResult?: (value: BridgeResult) => void;
    __tervellBack?: () => boolean;
    __tervellIncomingPairing?: (value: string) => void;
  }
}
const pending = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}>();
window.__tervellResult = result => {
  const task = pending.get(result.id);
  if (!task) return;
  pending.delete(result.id);
  clearTimeout(task.timer);
  result.ok ? task.resolve(result.data) : task.reject(Error(result.error ?? '操作未完成，原数据保留'));
};
export async function native<T = RecordValue>(operation: string, values: RecordValue = {}): Promise<T> {
  if (!window.TervellNative) throw Error('当前页面没有 Android 安全连接。请从 Tervell 应用打开。');
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(Error('请求暂未完成，可重试；草稿与同一次发送标识保留。'));
    }, ['scan', 'voice', 'export'].includes(operation) ? 15 * 60 * 1000 : 120000);
    pending.set(id, {
      resolve: v => resolve(v as T),
      reject,
      timer
    });
    window.TervellNative!.postMessage(JSON.stringify({
      id,
      operation,
      values
    }));
  });
}
export const request = <T = RecordValue,>(method: string, values: RecordValue = {}) => native<T>('request', {
  method,
  params: values
});
export async function control<T = RecordValue>(operation: string, values: RecordValue = {}, scope: {
  sessionId?: string;
  workspaceId?: string;
} = {}): Promise<T> {
  const response = await request<RecordValue>('control', {
    call: {
      operation,
      values,
      ...scope
    }
  });
  const finished = await finishMobileOperation<RecordValue>(response, id => request('control', {
      call: {
        operation: 'jobs.status',
        values: {
          id
        }
      }
    }), () => new Promise(resolve => setTimeout(resolve, 600)));
  const page = plain(finished?.controlResult);
  if (!page.id) return finished as T;
  let content = String(page.content), next = Number(page.nextOffset), more = Boolean(page.hasMore);
  while (more) {
    const part = await request('control', {call: {operation: 'control.result', values: {id: page.id, offset: next}}});
    if (part.error) throw Error(String(part.error));
    if (Number(part.offset) !== next) throw Error('电脑结果分页位置不符，请重新读取');
    content += String(part.content);
    next = Number(part.nextOffset); more = Boolean(part.hasMore);
  }
  return JSON.parse(content) as T;
}
export function plain(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}
export function list<T = RecordValue>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
export function readable(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? '';
}
/** 大结果以电脑端冻结快照逐页读取，不接收“摘要替代结构”。 */
export async function unpackResult(value: RecordValue): Promise<unknown> {
  const page = plain(value.resultPage);
  if (!page.id) return value.result;
  let content = String(page.content ?? ''),
    next = Number(page.nextOffset),
    more = Boolean(page.hasMore);
  while (more) {
    const part = await control('plugins.mobile-result', {
      id: page.id,
      offset: next
    });
    if (Number(part.offset) !== next) throw Error('插件结果分页位置不符');
    content += String(part.content ?? '');
    next = Number(part.nextOffset);
    more = Boolean(part.hasMore);
  }
  return JSON.parse(content);
}
