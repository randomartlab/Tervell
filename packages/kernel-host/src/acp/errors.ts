import { RpcRemoteError } from './rpc';

/** 用户可见错误不丢掉故障原因，也不直接泄漏原始RPC正文/密钥/堆栈。 */
export function acpPromptFailureMessage(error: unknown, secrets: string[] = [], stderr = ''): string {
  const details=(data:unknown,depth=0):string=>{
    if(depth>4||!data||typeof data!=='object'||Array.isArray(data))return '';
    const value=data as Record<string,unknown>;
    const text=['details','reason','errorMessage','message','detail','title'].map(key=>value[key]).filter((item):item is string=>typeof item==='string').map(item=>item.slice(0,2048)).join(' · ');
    return [text,details(value.error,depth+1)].filter(Boolean).join(' · ');
  };
  const detail = error instanceof RpcRemoteError ? typeof error.data==='string'?error.data.slice(0,4096):details(error.data) : '';
  const original = [error instanceof Error ? error.message : String(error), detail, stderr].filter(Boolean).join('\n');
  let message = original.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  for (const secret of secrets.filter(value => value.length >= 6).sort((a, b) => b.length - a.length)) message = message.split(secret).join('[已隐藏]');
  message = message
    .replace(/(Bearer\s+)[^\s"'<>]+/gi, '$1[已隐藏]')
    .replace(/((?:api[-_]?key|access[-_]?token|refresh[-_]?token|authorization|password|secret)["']?\s*[=:]\s*["']?)[^\s,"'<>}]+/gi, '$1[已隐藏]')
    .replace(/https?:\/\/[^\s"'<>]+/g, value => { try { const url = new URL(value); url.username = ''; url.password = ''; url.search = ''; url.hash = ''; return url.toString(); } catch { return '[服务地址]'; } })
    .split(/\n\s*at\s/)[0]!.trim();
  // Python异常的真正原因在Traceback末尾；保留最终异常，不能被长路径和调用栈挤掉。
  const traceback=message.lastIndexOf('Traceback (most recent call last):');
  if(traceback>=0){const cause=message.slice(traceback).split('\n').map(line=>line.trim()).filter(line=>line&&!/^(?:Traceback |File "|\.{3}|\^)/.test(line)).at(-1);message=[message.slice(0,traceback).trim(),cause].filter(Boolean).join('\n');}
  message=message.length>1200?message.slice(0,500)+'\n…\n'+message.slice(-690):message;
  if (/ACP 请求超时：session\/prompt/.test(message)) return 'ACP 任务超过显式设置的时限，已停止；可调整时限后继续。';
  if (/ACP 请求已取消/.test(message)) return 'ACP 任务已停止。';
  if (/ACP (?:连接已关闭|子进程退出)/.test(message) && !stderr.trim()) return '内核进程已退出或断开，请检查内核运行状态后重试。';
  return `内核请求失败${error instanceof RpcRemoteError ? `（RPC ${error.code}）` : ''}：${message || '未提供错误原因'}`;
}
