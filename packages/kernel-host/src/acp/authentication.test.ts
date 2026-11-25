import { expect, test } from 'bun:test';
import { AcpKernel } from './kernel';
import { isKernelAuthenticationRequired, KernelAuthenticationRequiredError,configuredAcpAuthentication } from './authentication';
import { RpcRemoteError } from './rpc';
import { fileURLToPath } from 'node:url';

test('Given 认证、网络和审批失败 When 判断接管条件 Then 仅明确认证错误允许重试', () => {
  for (const error of [new RpcRemoteError(-32000, 'Authentication required'), new Error('not logged in'), new Error('Gemini API key is missing or not configured.'),new RpcRemoteError(-32000,'log in to Muse before opening a session'),new RpcRemoteError(-32600,'fx needs access to Vercel AI Gateway. Run fx login to sign in, or set AI_GATEWAY_API_KEY.'), new KernelAuthenticationRequiredError('codex')]) expect(isKernelAuthenticationRequired(error)).toBe(true);
  for (const error of [new RpcRemoteError(-32000, 'Internal processing error'), new RpcRemoteError(-32002, 'Resource not found'), new Error('HTTP 429'), new Error('Permission denied'), new Error('Tool timeout')]) expect(isKernelAuthenticationRequired(error)).toBe(false);
});
test('Given API-Key与OAuth并列 When 已配置密钥 Then 只选实际声明的对应密钥认证',()=>{
 expect(configuredAcpAuthentication([{id:'oauth'},{id:'gemini-api-key'}],{GEMINI_API_KEY:'{{SECRET_0kk1zwi7}}'})).toBe('gemini-api-key');expect(configuredAcpAuthentication([{id:'oauth'}],{GEMINI_API_KEY:'{{SECRET_0kk1zwi7}}'})).toBeUndefined();expect(configuredAcpAuthentication([{id:'factory-api-key'}],{OPENAI_API_KEY:'{{SECRET_0kk1zwi7}}'})).toBeUndefined();expect(configuredAcpAuthentication([{id:'api-key',type:'terminal'}],{OPENAI_API_KEY:'{{SECRET_0kk1zwi7}}'})).toBeUndefined();
})

test('Given ACP明确公布API-Key认证 When 未登录创建会话 Then 配置的密钥按声明认证且任务只发一次', async () => {
  const fixture = fileURLToPath(new URL('./test-fixtures/authenticated-server.ts', import.meta.url));
  const input = { sessionId: 'auth-test', cwd: process.cwd(), systemPrompt: '' };
  const missing = new AcpKernel('qa-auth', { command: process.execPath, args: [fixture], inheritEnv: false });
  await expect(missing.createSession(input)).rejects.toBeInstanceOf(KernelAuthenticationRequiredError);
  const configured = new AcpKernel('qa-auth', { command: process.execPath, args: [fixture], inheritEnv: false, env: { OPENAI_API_KEY: 'fixture-local-only' } });
  const handle = await configured.createSession(input);
  try {
    const events = [];
    for await (const event of configured.prompt(handle, { runId: 'r', text: 'local' }, { signal: new AbortController().signal })) events.push(event);
    expect(events.filter(event => event.t === 'message.delta')).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' });
  } finally { await configured.close(handle); }
});
