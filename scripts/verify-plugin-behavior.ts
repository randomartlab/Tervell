import { app } from 'electron';
import { mkdtempSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const root = mkdtempSync(join(tmpdir(), 'tervell-plugin-behavior-'));
process.env.TERVELL_PROFILE_DIR = root;
app.setPath('userData', join(root, 'chromium'));
app.commandLine.appendSwitch('use-mock-keychain');
app.whenReady().then(run).catch(error => {
  console.error(error);
  app.exit(1);
});
async function run() {
  const {
      writeJsonFileAtomic,
      writeTextFileAtomic
    } = await import('../apps/electron/src/main/lib/safe-file'),
    cwd = join(root, 'project');
  mkdirSync(cwd, {
    recursive: true
  });
  mkdirSync(join(root, 'config'), {
    recursive: true
  });
  writeJsonFileAtomic(join(root, 'config/agent-workspaces.json'), {
    version: 2,
    workspaces: [{
      id: 'project-a',
      slug: 'a',
      name: 'Behavior',
      projectRootPath: cwd,
      createdAt: 1,
      updatedAt: 1
    }]
  });
  const service = await import('../apps/electron/src/main/lib/desktop-extension-service'),
    runtime = await import('../apps/electron/src/main/lib/plugin-host/runtime');
  const activate = async (path: string) => {
    const offer = service.previewDesktopPlugin(path);
    service.installDesktopPlugin(offer);
    service.configureDesktopPlugin(offer.manifest.id, {
      access: {
        workspaceIds: ['project-a'],
        network: false,
        runtime: 'trusted'
      }
    });
    await service.activateDesktopPlugin(offer.manifest.id, true);
    return offer.manifest.id;
  };
  const acquisition = join(root,'dependency-fixture');mkdirSync(acquisition);
  writeJsonFileAtomic(join(acquisition,'package.json'),{name:'contract-dependencies',version:'1.0.0',type:'module',dependencies:{'number-check':'npm:is-number@7.0.0'}});
  writeJsonFileAtomic(join(acquisition,'paseo-plugin.json'),{id:'dependency-fixture',requirements:{paseo:'>=0.14.0'},build:[[ './scripts/prepare' ]]});
  mkdirSync(join(acquisition,'scripts'));writeTextFileAtomic(join(acquisition,'scripts/prepare'),'#!/bin/sh\nvalue=0\n[ ! -f prepared.txt ] || value=$(cat prepared.txt)\nprintf \"%s\\n\" \"$((value + 1))\" > prepared.txt\n');(await import('node:fs')).chmodSync(join(acquisition,'scripts/prepare'),0o755);
  writeTextFileAtomic(join(acquisition,'index.server.ts'),"import check from 'number-check';import{defineRpc}from '@getpaseo/plugin';import{z}from'zod';export default s=>{s.handle(defineRpc({name:'dep.check',input:z.string(),output:z.boolean()}),v=>check(v));return()=>{}}");
  const depId=await activate(acquisition);
  if(await runtime.pluginRpc(depId,'dep.check','42')!==true)throw Error('npm别名依赖没有实际调用');
  await service.activateDesktopPlugin(depId,false);await service.activateDesktopPlugin(depId,true);
  const {pluginDirectory:directoryFor}=await import('../apps/electron/src/main/lib/plugin-host/packages');
  if(readFileSync(join(directoryFor(depId),'source/prepared.txt'),'utf8').trim()!=='1')throw Error('已成功准备的插件重启重复运行命令');
  await service.activateDesktopPlugin(depId,false);
  console.log('DEPENDENCIES bundled Bun alias install, original import, preparation once, restart PASS');
  const generated=join(root,'generated-entry-fixture');mkdirSync(generated);
  writeJsonFileAtomic(join(generated,'paseo-plugin.json'),{id:'generated-entry',requirements:{paseo:'>=0.14.0'},build:[['bun','-e',"require('fs').writeFileSync('index.server.ts','export default ()=>()=>{}')"]]});
  const generatedId=await activate(generated);
  if(runtime.pluginStatuses().find(p=>p.id===generatedId)?.phase!=='ready')throw Error('准备命令生成的入口未被发现');
  await service.activateDesktopPlugin(generatedId,false);
  console.log('GENERATED_ENTRY manifest preparation then entry discovery PASS');
  service.removeDesktopPlugin(generatedId);const generatedAgain=await activate(generated);
  if(runtime.pluginStatuses().find(p=>p.id===generatedAgain)?.phase!=='ready')throw Error('重装生成入口插件使用了旧准备标记');
  await service.activateDesktopPlugin(generatedAgain,false);console.log('REINSTALL generated source prepared again, settings directory preserved PASS');

  const generatedClient=join(root,'generated-client-fixture');mkdirSync(generatedClient);
  writeJsonFileAtomic(join(generatedClient,'paseo-plugin.json'),{id:'generated-client',requirements:{paseo:'>=0.14.0'},build:[['bun','-e',"require('fs').writeFileSync('index.client.tsx','export default ()=>()=>{}')"]]});
  const generatedClientId=await activate(generatedClient);
  if(!runtime.pluginStatuses().find(p=>p.id===generatedClientId)?.client)throw Error('生成的客户端入口未被告知渲染端');
  const clientSession=(await import('../apps/electron/src/main/lib/agent-session-manager')).createAgentSession('generated client preparation',undefined,'project-a');
  await runtime.preparePluginSession({id:clientSession.id,workspaceId:'project-a',cwd,kernelId:'pi'});
  await service.activateDesktopPlugin(generatedClientId,false);
  console.log('GENERATED_CLIENT client-only setup does not invoke nonexistent server PASS');


  const providerId = await activate(resolve('../paseo-src/plugin-examples/provider-direct'));
  const {
    PluginProviderKernel
  } = await import('../apps/electron/src/main/lib/plugin-host/provider-kernel');
  const {createRequire}=await import('node:module');const load=createRequire(resolve('package.json'));
  const {createPaseoApi}=load(resolve('apps/electron/resources/third-party/plugin-host/paseo-api.cjs'));
  const {createLocalPaseoDriver}=load(resolve('apps/electron/resources/third-party/plugin-host/paseo-driver.cjs'));
  const driver=createLocalPaseoDriver((name:string,value:unknown)=>runtime.pluginHostOperation(providerId,name,value),{interval:25});
  const sdk=createPaseoApi(driver);
  const {MutableDaemonConfigSchema,AgentSnapshotPayloadSchema,WorkspaceDescriptorPayloadSchema}=load(resolve('apps/electron/resources/third-party/plugin-host/paseo-core.cjs'));
  MutableDaemonConfigSchema.parse((await sdk.config.get()).config);
  await sdk.config.patch({providers:{'direct-example':{enabled:true,options:{voice:'direct'}}},appendSystemPrompt:'contract global instructions'});
  if((await sdk.config.get()).config.providers['direct-example'].options.voice!=='direct')throw Error('SDK配置补丁未生效');
  const workspaceHandle=sdk.workspaces.ref('project-a');await workspaceHandle.refresh();WorkspaceDescriptorPayloadSchema.parse(workspaceHandle.current());
  await workspaceHandle.setMetadata({sdkCheck:true});if(workspaceHandle.metadata.sdkCheck!==true)throw Error('SDK元数据未更新句柄');
  await workspaceHandle.setLabel('contract-label',{assigned:true});await workspaceHandle.setPinned(true);
  if((await workspaceHandle.refresh()).labels[0]!=='contract-label')throw Error('SDK标签没有保存');
  console.log('SDK workspace refresh/metadata/labels/pin/config original API PASS');
  const probed = await (await import('../apps/electron/src/main/lib/plugin-host/provider-kernel')).probePluginProvider('direct-example',cwd,{modelId:'example-1',modeId:'build',configValues:{voice:'direct'}});
  if(probed.controls?.find(c=>c.id==='voice')?.currentValue!=='direct')throw Error('手机探测插件供应商未应用选择');
  const kernel = new PluginProviderKernel('direct-example', {
      timeoutMs: 10000
    }),
    handle = await kernel.createSession({
      sessionId: 'provider-behavior',
      cwd,
      systemPrompt: 'Fixture'
    });
  const catalog = await kernel.modelCatalog(handle);
  if (catalog.models[0]?.id !== 'example-1') throw Error('原生供应商模型未落到内核目录');
  await kernel.configureSession(handle, {
    modelId: 'example-1',
    configValues: {
      voice: 'direct'
    }
  });
  const events = [];
  for await (const event of kernel.prompt(handle, {
    runId: 'provider-run',
    text: 'native provider test',
    history: []
  }, {
    signal: new AbortController().signal
  })) events.push(event);
  if (!events.some(e => e.t === 'message.final') || !events.some(e => e.t === 'done' && e.reason === 'stop')) throw Error('原供应商未生成实际会话结果：' + JSON.stringify(events));
  await kernel.close(handle);
  const restored=new PluginProviderKernel('direct-example',{timeoutMs:10000});const restoredHandle=await restored.createSession({sessionId:'provider-behavior',cwd,systemPrompt:'Fixture'});await restored.close(restoredHandle);
  console.log('PROVIDER_PERSISTENCE restored original provider artifact PASS');
  const createdBySdk=await sdk.agents.create({config:{provider:'direct-example/example-1',options:{voice:'direct'}},cwd,title:'Original SDK run',metadata:{sdk:true}});
  AgentSnapshotPayloadSchema.parse(createdBySdk.current());
  const run=await createdBySdk.run('SDK run contract',{timeoutMs:15000});
  if(!run.finalText.includes('SDK run contract')||run.final.status!=='idle')throw Error('SDK run wait返回过早或未返回最终回答：'+JSON.stringify(run));
  const full=await createdBySdk.timeline.refetch({limit:0});if(!full.epoch||!full.entries.length)throw Error('SDK时间线没有游标和条目');
  const commands=await createdBySdk.commands();
  if(commands.error||!commands.commands.some((command:{name:string})=>command.name==='reset'))throw Error('原生供应商真实命令未到SDK：'+JSON.stringify(commands));
  console.log('SDK_COMMANDS original provider session.commands propagated PASS',JSON.stringify(commands));
  console.log('SDK_AGENT_RUN real provider start/send/wait/timeline PASS',run.finalText);
  await sdk.dispose();await driver.close();
  console.log('PROVIDER', JSON.stringify({
    catalog,
    events
  }));
  await service.activateDesktopPlugin(providerId, false);
  const lifecycle = await activate(resolve('../paseo-src/plugin-examples/lifecycle-actions'));
  const {
    createAgentSessionWithPlugins,
    getAgentSessionMeta
  } = await import('../apps/electron/src/main/lib/agent-session-manager');
  const session = await createAgentSessionWithPlugins('Hook fixture', undefined, 'project-a');
  if (session.pluginEnvironment?.PASEO_HOOK_CREATE_EXAMPLE !== 'created') throw Error('创建before结果未保存');
  const prepared = await runtime.preparePluginSession({
    id: session.id,
    workspaceId: 'project-a',
    cwd,
    kernelId: 'pi',
    title: session.title
  });
  if (prepared.env.PASEO_HOOK_OPEN_EXAMPLE !== 'opened') throw Error('启动before结果未应用');
  console.log('LIFECYCLE', JSON.stringify({
    session: session.id,
    env: prepared.env
  }));
  const terminal = (await runtime.pluginHostOperation(lifecycle, 'terminal.create', {
    workspaceId: 'project-a',
    cwd,
    name: 'Generic terminal'
  })) as {
    terminal: {
      id: string;
    };
  };
  await runtime.pluginHostOperation(lifecycle, 'terminal.write', {
    id: terminal.terminal.id,
    data: 'printf \'contract-terminal\\n\' > terminal-result.txt\r'
  });
  for (let attempt = 0; attempt < 60 && !existsSync(join(cwd, 'terminal-result.txt')); attempt++) await new Promise(r => setTimeout(r, 100));
  if (!readFileSync(join(cwd, 'terminal-result.txt'), 'utf8').includes('contract-terminal')) throw Error('宿主终端未执行');
  console.log('TERMINAL', await runtime.pluginHostOperation(lifecycle, 'terminal.capture', {
    id: terminal.terminal.id
  }));
  await runtime.pluginHostOperation(lifecycle, 'terminal.kill', {
    id: terminal.terminal.id
  });
  const placement = await activate(resolve('../paseo-src/plugin-examples/worktree-placement'));
  const {
    execFileSync
  } = await import('node:child_process');
  execFileSync('/usr/bin/git', ['init', '-q'], {
    cwd
  });
  execFileSync('/usr/bin/git', ['-c', 'user.name=QA', '-c', 'user.email=qa@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture'], {
    cwd
  });
  const {
    createAgentWorkspace
  } = await import('../apps/electron/src/main/lib/agent-workspace-manager');
  const created = await createAgentWorkspace({
    name: 'Isolated lifecycle example',
    projectRootPath: cwd
  });
  if (!created.projectRootPath?.endsWith('.lifecycle-example')) throw Error('原始工作树钩子未改变实际目录');
  console.log('WORKTREE', created.projectRootPath);
  await service.activateDesktopPlugin(placement, false);
  await service.activateDesktopPlugin(lifecycle, false);
  const afterDisable = await runtime.preparePluginSession({
    id: session.id,
    workspaceId: 'project-a',
    cwd,
    kernelId: 'pi',
    title: session.title
  });
  if (afterDisable.env.PASEO_HOOK_CREATE_EXAMPLE) throw Error('停用后仍保留插件启动环境');
  console.log('REVOKE', 'saved launch environment no longer applied');
  const closure = join(root, 'contract-plugin');
  mkdirSync(closure);
  writeJsonFileAtomic(join(closure, 'paseo-plugin.json'), {
    id: 'contract-behavior',
    requirements: {
      paseo: '>=0.14.0'
    }
  });
  writeTextFileAtomic(join(closure, 'index.server.ts'), `import {defineRpc,defineSubscription} from '@getpaseo/plugin';import {z} from 'zod';export default server=>{server.handle(defineRpc({name:'round.trip',input:z.string().transform(s=>s+'-input'),output:z.string().transform(s=>s+'-output')}),s=>s);server.handle(defineSubscription({name:'bytes.stream',input:z.object({}),event:z.instanceof(Uint8Array)}),(_,{push,signal})=>{const timer=setInterval(()=>void push(new Uint8Array([0,255,4])),20);signal.addEventListener('abort',()=>clearInterval(timer),{once:true})});return()=>{}}`);
  const contract = await activate(closure);
  const output = await runtime.pluginRpc(contract, 'round.trip', 'raw');
  if (output !== 'raw-input') throw Error('RPC输出被重复转换');
  const subscription = (await runtime.pluginRpc(contract, '__tervell_subscription', {
    action: 'start',
    name: 'bytes.stream',
    input: {}
  })) as {
    id: string;
  };
  await new Promise(r => setTimeout(r, 50));
  const poll = (await runtime.pluginRpc(contract, '__tervell_subscription', {
    action: 'poll',
    id: subscription.id
  })) as {
    events: Uint8Array[];
    closed: boolean;
  };
  if (poll.closed || !(poll.events[0] instanceof Uint8Array) || poll.events[0][1] !== 255) throw Error('二进制订阅未持续传递');
  await runtime.pluginRpc(contract, '__tervell_subscription', {
    action: 'stop',
    id: subscription.id
  });
  console.log('RPC_SUBSCRIPTION', JSON.stringify({
    output,
    events: poll.events.map(e => [...e])
  }));
  const brokenSource = join(root, 'compile-failure');
  mkdirSync(brokenSource);
  writeJsonFileAtomic(join(brokenSource, 'paseo-plugin.json'), {
    id: 'compile-failure', requirements: { paseo: '>=0.14.0' }
  });
  writeTextFileAtomic(join(brokenSource, 'index.server.ts'), 'export default =;');
  const broken = service.previewDesktopPlugin(brokenSource);
  service.installDesktopPlugin(broken);
  service.configureDesktopPlugin(broken.manifest.id, {
    access: { workspaceIds: ['project-a'], network: false, runtime: 'trusted' }
  });
  let rejected = false;
  try { await service.activateDesktopPlugin(broken.manifest.id, true); } catch { rejected = true; }
  const diagnostic = runtime.pluginStatuses().find(p => p.id === broken.manifest.id);
  if (!rejected || diagnostic?.phase !== 'failed' || !diagnostic.error) throw Error('编译阶段失败被清理吞掉');
  if (service.desktopPluginState().installed.find(p => p.manifest.id === broken.manifest.id)?.enabled) throw Error('编译失败后仍标为启用');
  const { pluginDirectory } = await import('../apps/electron/src/main/lib/plugin-host/packages');
  writeTextFileAtomic(join(pluginDirectory(broken.manifest.id), 'source/index.server.ts'), 'export default () => () => {};');
  await service.activateDesktopPlugin(broken.manifest.id, true);
  if (runtime.pluginStatuses().find(p => p.id === broken.manifest.id)?.phase !== 'ready') throw Error('显式重试未清除旧编译失败');
  await service.activateDesktopPlugin(broken.manifest.id, false);
  if (runtime.pluginStatuses().some(p => p.id === broken.manifest.id)) throw Error('停用后旧诊断未释放');
  console.log('COMPILE_FAILURE', 'failed startup retained, retry ready, disable removed diagnostics');
  for (const p of service.desktopPluginState().installed) await runtime.stopPluginHost(p.manifest.id);
  await (await import('../apps/electron/src/main/lib/terminal-service')).stopAllTerminals();
  console.log('BEHAVIOR PASS', root);
  app.exit(0);
}
