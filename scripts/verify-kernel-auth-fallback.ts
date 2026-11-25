import { app,BrowserWindow } from 'electron';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, existsSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { writeJsonFileAtomic, writeTextFileAtomic } from '../apps/electron/src/main/lib/safe-file';

/** 真实Magpie+ACP子进程+真实Codex适配器的隔离验收。所有模型请求仅到本机。 */
const root = mkdtempSync(join(tmpdir(), 'tervell-kernel-auth-'));
process.env.TERVELL_PROFILE_DIR = root;
process.env.TERVELL_MAGPIE_BIN = resolve('apps/electron/resources/model-gateway/'+(process.platform==='win32'?'magpie.exe':'magpie'));
app.setPath('userData', join(root, 'chromium'));
(app as typeof app&{setAppPath:(path:string)=>void}).setAppPath(resolve('apps/electron'));
app.commandLine.appendSwitch('use-mock-keychain');
const assert = (value: unknown, message: string): void => { if (!value) throw Error(message); };

async function run() {
  const window=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
  let upstreamCalls = 0;
  const upstream = createServer(async (req, res) => {
    if (req.method === 'GET') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ data: [{ id: 'fallback-model', supported_reasoning_levels: ['low', 'high', 'ultra'].map(effort => ({ effort })) }] })); return; }
    let body = ''; for await (const chunk of req) body += String(chunk);
    const input = JSON.parse(body); upstreamCalls++;
    assert(input.model === 'fallback-model', '模型没有经过配置的Magpie');
    const result = { id: 'chatcmpl-local', object: 'chat.completion', created: 1, model: 'fallback-model', choices: [{ index: 0, message: { role: 'assistant', content: 'fallback-model-ok' }, finish_reason: 'stop' }] };
    res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(result));
  });
  await new Promise<void>(ok => upstream.listen(0, '127.0.0.1', ok));
  const routing = await import('../apps/electron/src/main/lib/model-routing-service');
  try {
    const directory = join(root, 'config/model-routing/config/magpie'); mkdirSync(directory, { recursive: true });
    writeJsonFileAtomic(join(directory, 'providers.json'), { providers: [{ id: 'fixture', name: 'Local only', key: 'fixture-only', chat: `http://127.0.0.1:${(upstream.address() as { port: number }).port}/v1`, models: ['fallback-model'] }] });
    const policy = { version: 1 as const, enabled: false, defaultModel: 'fixture/fallback-model', rules: [] };
    routing.saveModelRouting(policy); console.log('START GATEWAY');await routing.startModelRouting(process.env.PATH ?? '');console.log('GATEWAY READY');
    await (await import('../apps/electron/src/main/lib/model-gateway-management')).gatewayCommand({ kind: 'provider.refresh', id: 'fixture' });
    const fixture = join(root, 'auth-fixture.cjs');
    await build({ entryPoints: [resolve('packages/kernel-host/src/acp/test-fixtures/authenticated-server.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: fixture });
    const { AcpKernel, KernelRegistry } = await import('@proma/kernel-host');
    const { MAGPIE_AGENT_ADAPTERS,MAGPIE_ACCOUNT_REQUIRED_KERNELS,environmentRoutedKernel } = await import('@proma/auth-bridge');
    const { openKernelWithAuthenticationFallback } = await import('../apps/electron/src/main/lib/kernel-auth-fallback');
    const base = (await import('../apps/electron/src/main/lib/desktop-extension-service')).desktopCliEnvironment();
    const supported: string[] = [], explicit: string[] = [];
    for (const definition of new KernelRegistry().list().filter(row => row.acp)) {
      console.log('AUTH CONTRACT',definition.id);
      routing.saveModelRouting(policy);
      let opens = 0;
      const open = async (route: { env: Record<string, string> }) => {
        opens++; const kernel = new AcpKernel(definition.id, { command: process.execPath, args: [fixture], inheritEnv: false, env: { ...route.env, ELECTRON_RUN_AS_NODE: '1' }, timeoutMs: 3000 });
        const handle = await kernel.createSession({ sessionId: 'auth', cwd: root, systemPrompt: '' });
        return { kernel, handle };
      };
      if(MAGPIE_ACCOUNT_REQUIRED_KERNELS[definition.id]){let message='';try{await openKernelWithAuthenticationFallback({kernelId:definition.id,base,scope:'test-'+definition.id,open})}catch(error){message=String(error)}assert(opens===1&&message.includes('账号'),'厂商认证未明确保留：'+definition.id);explicit.push(definition.id);continue}
      if (MAGPIE_AGENT_ADAPTERS[definition.id]||environmentRoutedKernel(definition.id)) {
        const result = await openKernelWithAuthenticationFallback({ kernelId: definition.id, base, scope: 'test-' + definition.id, open });
        try { assert(opens === (['glm-acp-agent','deepagents','crow-cli'].includes(definition.id)?1:2) && result.route.model === 'fixture/fallback-model' && result.notice?.includes('官方账号'), '未登录未统一接管：' + definition.id); }
        finally { await result.value.kernel.close(result.value.handle); }
        assert(routing.modelRoutingConfig().rules.some(row => row.kernelId === definition.id && row.model === 'fixture/fallback-model'), '接管未保存');
        supported.push(definition.id);
      } else {
        let message = ''; try { await openKernelWithAuthenticationFallback({ kernelId: definition.id, base, scope: 'test-' + definition.id, open }); } catch (error) { message = String(error); }
        assert(opens === 1 && message.includes('官方账号') && message.includes('Pi'), '厂商锁定条目没有明确操作：' + definition.id);
        explicit.push(definition.id);
      }
    }
    routing.saveModelRouting(policy);
    let retried = 0;
    try { await openKernelWithAuthenticationFallback({ kernelId: 'codex', base, scope: 'network', open: async () => { retried++; throw Error('Network unavailable'); } }); } catch { /* 预期失败。 */ }
    assert(retried === 1 && !routing.modelRoutingConfig().rules.length, '网络错误被当成未登录');
    console.log(JSON.stringify({ registeredAcp: supported.length + explicit.length, scriptedAuthenticationFallback: supported, explicitUnavailable: explicit, networkRetry: false }));

    // 可选使用已完成隔离安装的真实Codex适配器，不安装依赖、不读取日常账号。
    if (process.env.TERVELL_QA_CODEX_MANAGED) {
      const original = JSON.parse(readFileSync(process.env.TERVELL_QA_CODEX_MANAGED, 'utf8')) as { directory: string; command: string; args: string[]; env: Record<string, string>; installedVersion: string };
      const installation = join(root, 'config/cli-runtime/agents/codex/versions/qa');
      cpSync(original.directory, installation, { recursive: true });
      const remap = (value: string) => value.replaceAll(original.directory, installation);
      const record = { ...original, directory: installation, command: remap(original.command), args: original.args.map(remap), env: Object.fromEntries(Object.entries(original.env).filter(([key]) => !/(?:HOME|API_KEY|TOKEN)$/.test(key) && key !== 'CODEX_PATH').map(([key, value]) => [key, remap(value)])) };
      writeJsonFileAtomic(join(root, 'config/cli-runtime/agents/codex/active.json'), record);
      const desktop = await import('../apps/electron/src/main/lib/desktop-extension-service');
      const nativeHome = join(root, 'cli-home/.codex'); mkdirSync(nativeHome, { recursive: true });
      const originalConfig = '# isolated original config\n'; writeTextFileAtomic(join(nativeHome, 'config.toml'), originalConfig);
      desktop.saveDesktopKernel({ id: 'codex', name: 'Codex', command: 'codex-acp', args: [], enabled: true }); routing.saveModelRouting(policy);
      const catalog = await desktop.probeDesktopKernel('codex', root);
      assert(catalog.routedModel === 'fixture/fallback-model' && catalog.notice?.includes('Magpie'), '真实Codex接管失败');
      assert(catalog.controls?.some(row => row.category === 'mode' || row.id === 'mode'), '真实Codex权限模式未读取');
      console.log('REAL CODEX routed controls',JSON.stringify(catalog.controls?.map(row=>({id:row.id,type:row.type}))));
      assert(readFileSync(join(nativeHome, 'config.toml'), 'utf8') === originalConfig && !existsSync(join(nativeHome, 'auth.json')), '接管改写原生登录文件');
      assert(upstreamCalls === 0, '探测意外执行了付费prompt');
      console.log('REAL CODEX unauthenticated -> Magpie -> advertised model/sandbox/plan controls PASS; native config unchanged; no prompt sent');
    }
  } finally { routing.stopModelRouting();upstream.closeAllConnections(); await new Promise<void>(ok => upstream.close(() => ok()));window.destroy(); }
  console.log('ISOLATED PROFILE', root);
}
app.whenReady().then(run).then(() => app.exit(0)).catch(error => { console.error(error); app.exit(1); });
