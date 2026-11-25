import{sessionControls}from'./controls';
import { test, expect } from 'bun:test'
import { fileURLToPath } from 'node:url'
import type { KernelEvent } from '@proma/protocol'
import { AcpKernel } from './kernel.ts'
const command = process.execPath; const args = [fileURLToPath(new URL('./test-fixtures/server.ts', import.meta.url))]
const create = () => new AcpKernel('fixture-acp', { command, args, timeoutMs: 2000,promptTimeoutMs:500, permissionTimeoutMs: 100 })
const input = { sessionId: 's1', cwd: process.cwd(), systemPrompt: '' }
test('Given CLI在空闲和运行中发扩展通知 When 连续两轮 Then 未协商通知不污染下一轮或毒化会话',async()=>{
 const kernel=new AcpKernel('extension-fixture',{command,args:[...args,'idle-extensions'],timeoutMs:2000});const handle=await kernel.createSession(input)
 try {for(const runId of ['extension-1','extension-2']){const events=[];for await(const event of kernel.prompt(handle,{runId,text:'vendor-notifications optional-request'},{signal:new AbortController().signal}))events.push(event);expect(events.some(event=>event.t==='error')).toBe(false);expect(events.at(-1)).toMatchObject({t:'done',reason:'stop'})}}
 finally{await kernel.close(handle)}
})
test('Given 真实脚本ACP进程 When initialize/new/prompt Then 核心/扩展事件齐全且会话可连续两轮', async () => {
  const kernel = create(); const handle = await kernel.createSession(input)
  try {
    for (const runId of ['r1', 'r2']) {
      const events: KernelEvent[] = []; for await (const event of kernel.prompt(handle, { runId, text: 'unknown' }, { signal: new AbortController().signal })) events.push(event)
      expect(new Set(events.map((event) => event.t)).size).toBe(10)
      expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'stop' })
      expect(events.some((event) => event.t === 'error' && event.err.code === 'unknown_acp_update')).toBe(true)
      expect(events.every((event) => event.runId === runId)).toBe(true)
    }
  } finally { await kernel.close(handle) }
})
for (const behavior of ['allow', 'deny'] as const) test(`Given 反向permission When ${behavior} Then 精确原始optionId返回而非自动接受`, async () => {
  const kernel = create(); const handle = await kernel.createSession(input)
  try {
    const events: KernelEvent[] = []
    for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'approval' }, { signal: new AbortController().signal })) {
      events.push(event)
      if (event.t === 'permission.request') {
        const action = event.req.actions.find((action) => action.behavior === behavior)!
        await expect(kernel.respondPermission(handle, event.req.requestId, { actionId: action.id, behavior: behavior === 'allow' ? 'deny' : 'allow' })).rejects.toThrow('不匹配')
        await kernel.respondPermission(handle, event.req.requestId, { actionId: action.id, behavior })
      }
    }
    expect(events.find((event) => event.t === 'tool.update')?.patch.status).toBe(behavior === 'allow' ? 'succeeded' : 'failed')
  } finally { await kernel.close(handle) }
})
test('Given 崩溃/超时 When prompt Then 错误显式且句柄禁止复用', async () => {
  for (const text of ['crash', 'hang']) {
    const kernel = create(); const handle = await kernel.createSession(input)
    try {
      const events = []; for await (const event of kernel.prompt(handle, { runId: 'r1', text }, { signal: new AbortController().signal })) events.push(event)
      expect(events.at(-1)).toMatchObject({ t: 'done', reason: 'error' })
      await expect(kernel.prompt(handle, { runId: 'r2', text: '' }, { signal: new AbortController().signal })[Symbol.asyncIterator]().next()).rejects.toThrow('不可复用')
    } finally { await kernel.close(handle) }
  }
})

test('Given 未答审批 When 等待超时 Then 返回cancelled而非自动允许', async () => {
  const kernel = create(); const handle = await kernel.createSession(input)
  try {
    const events: KernelEvent[] = []; for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'approval' }, { signal: new AbortController().signal })) events.push(event)
    expect(events.find((event) => event.t === 'tool.update')).toMatchObject({ patch: { status: 'failed' } })
    const approval = events.find((event) => event.t === 'permission.request')!
    await expect(kernel.respondPermission(handle, approval.req.requestId, { actionId: approval.req.actions[0]!.id, behavior: 'allow' })).rejects.toThrow('审批')
  } finally { await kernel.close(handle) }
})
test('Given signal取消或显式cancel When 运行中 Then 等待退出并禁止旧句柄重跑', async () => {
  for (const explicit of [false, true]) {
    const kernel = create(); const handle = await kernel.createSession(input); const controller = new AbortController()
    const iterator = kernel.prompt(handle, { runId: 'r1', text: 'hang' }, { signal: controller.signal })[Symbol.asyncIterator]()
    const pending = iterator.next(); if (explicit) await kernel.cancel(handle); else controller.abort()
    const first = await pending; expect(first.value).toMatchObject({ t: 'error' })
    expect((await iterator.next()).value).toMatchObject({ t: 'done', reason: 'cancelled' }); await iterator.next()
    await expect(kernel.prompt(handle, { runId: 'r2', text: '' }, { signal: new AbortController().signal })[Symbol.asyncIterator]().next()).rejects.toThrow('不可复用')
    await kernel.close(handle)
  }
})

test('Given 同产品session重复create When 启动中或就绪 Then 拒绝重复进程', async () => {
  const kernel = create(); const first = kernel.createSession(input)
  await expect(kernel.createSession(input)).rejects.toThrow('启动中')
  const handle = await first
  try { await expect(kernel.createSession(input)).rejects.toThrow('已存在') }
  finally { await kernel.close(handle) }
})

test('Given 外会话更新或未知stopReason When prompt Then 不串台且坏终态使句柄失效', async () => {
  const kernel = create(); const handle = await kernel.createSession(input)
  try {
    const events: KernelEvent[] = []; for await (const event of kernel.prompt(handle, { runId: 'r1', text: 'foreign-session' }, { signal: new AbortController().signal })) events.push(event)
    expect(events.some((event) => event.t === 'error' && event.err.code === 'acp_session_mismatch')).toBe(true)
    expect(events.some((event) => event.t === 'message.delta' && event.text === '不应出现')).toBe(false)
    const invalid = []; for await (const event of kernel.prompt(handle, { runId: 'r2', text: 'bad-result' }, { signal: new AbortController().signal })) invalid.push(event)
    expect(invalid.at(-1)).toMatchObject({ t: 'done', reason: 'error' })
    await expect(kernel.prompt(handle, { runId: 'r3', text: '' }, { signal: new AbortController().signal })[Symbol.asyncIterator]().next()).rejects.toThrow('不可复用')
  } finally { await kernel.close(handle) }
})
test('Given 无效协议版本或命令不存在 When create Then 失败清理且可再次尝试', async () => {
  const version = new AcpKernel('bad', { command, args: [...args, 'bad-version'], timeoutMs: 100 })
  await expect(version.createSession(input)).rejects.toThrow()
  const missing = new AcpKernel('missing', { command: '/missing/proma-acp-executable', timeoutMs: 100 })
  await expect(missing.createSession(input)).rejects.toThrow()
  await expect(missing.createSession(input)).rejects.toThrow()
})

test('Given 正常关闭或取消的专用ACP子进程 When 宿主完成清理 Then PID确实不存在', async () => {
  const { mkdtempSync, readFileSync, rmSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const { join } = await import('node:path')
  const directory = mkdtempSync(join(tmpdir(), 'proma-acp-pid-'))
  try {
    for (const abort of [false, true]) {
      const file = join(directory, String(abort)); const kernel = new AcpKernel('pid-test', { command, args, env: { PROMA_ACP_TEST_PID_FILE: file }, timeoutMs: 500 })
      const handle = await kernel.createSession(input); const pid = Number(readFileSync(file, 'utf8'))
      if (abort) {
        const iterator = kernel.prompt(handle, { runId: 'r1', text: 'hang' }, { signal: new AbortController().signal })[Symbol.asyncIterator]()
        const first = iterator.next(); await kernel.cancel(handle); await first; while (!(await iterator.next()).done) { /* 等待规范终态 */ }
      }
      await kernel.close(handle); expect(() => process.kill(pid, 0)).toThrow()
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('Given 连续ACP prompt携带历史 When 已有内容再次传入 Then 不重复注入且新历史仍可携带', async () => {
  const kernel = create(); const handle = await kernel.createSession(input)
  const old = { id: 'm1', role: 'assistant' as const, content: [{ type: 'text' as const, text: '旧历史' }], createdAt: 0 }
  const fresh = { id: 'm2', role: 'assistant' as const, content: [{ type: 'text' as const, text: '外部新历史' }], createdAt: 1 }
  try {
    const texts: string[] = []
    for (const [index, history] of [[old], [old, fresh], [old, fresh]].entries()) {
      for await (const event of kernel.prompt(handle, { runId: `r${index}`, text: 'echo-history', history }, { signal: new AbortController().signal })) if (event.t === 'message.delta' && event.kind === 'text') texts.push(event.text)
    }
    const combined = texts.join('\n')
    expect(combined.split('旧历史')).toHaveLength(2)
    expect(combined.split('外部新历史')).toHaveLength(2)
  } finally { await kernel.close(handle) }
})

test('Given 宿主工具桥 When ACP新建失败或取消 Then 会话工具服务必须回收', async () => {
  let closes = 0
  const fixture = fileURLToPath(new URL('./test-fixtures/server.ts', import.meta.url))
  const toolBridge = async () => ({ config: { name: 'proma' as const, command: process.execPath, args: [], env: [] }, close: async () => { closes++ } })
  const failed = new AcpKernel('failed-tools', { command: process.execPath, args: [fixture], timeoutMs: 2000, openToolBridge: async () => { throw new Error('不能创建工具桥') } })
  await expect(failed.createSession({ sessionId: 'failed', cwd: process.cwd(), systemPrompt: '' })).rejects.toThrow('工具桥')
  const kernel = new AcpKernel('cancel-tools', { command: process.execPath, args: [fixture], timeoutMs: 1000, openToolBridge: toolBridge })
  const handle = await kernel.createSession({ sessionId: 'cancel', cwd: process.cwd(), systemPrompt: '' })
  const stop = new AbortController()
  const iterator = kernel.prompt(handle, { runId: 'r1', text: 'hang' }, { signal: stop.signal })[Symbol.asyncIterator]()
  const pending = iterator.next(); setTimeout(() => stop.abort(), 20)
  await pending
  await iterator.return?.()
  await kernel.close(handle)
  expect(closes).toBeGreaterThanOrEqual(1)
})

test('Given CLI 报告配置目录 When 选择模型和模式 Then 实际设置请求生效且不接受虚构选项',async()=>{
 const kernel=new AcpKernel('configurable',{command,args:[fileURLToPath(new URL('./test-fixtures/configurable-server.ts',import.meta.url))],timeoutMs:1000})
 const handle=await kernel.createSession(input)
 try{expect((await kernel.modelCatalog(handle)).models).toHaveLength(2);await kernel.configureSession(handle,{modelId:'local-large',modeId:'build'});const events:KernelEvent[]=[];for await(const event of kernel.prompt(handle,{runId:'configured_run',text:'hello'},{signal:new AbortController().signal}))events.push(event);expect(JSON.stringify(events)).toContain('model=local-large mode=build');await expect(kernel.configureSession(handle,{modelId:'made-up'})).rejects.toThrow()}finally{await kernel.close(handle)}
})

test('Given ACP 初始化不回应 When 取消创建 Then 有界退出并回收进程', async () => {
  const kernel = new AcpKernel('cancel-start', { command, args: [fileURLToPath(new URL('./test-fixtures/configurable-server.ts', import.meta.url)), '--hang-initialize'], timeoutMs: 5000 })
  const stop = new AbortController()
  const creating = kernel.createSession(input, { signal: stop.signal })
  setTimeout(() => stop.abort(), 50)
  const started = Date.now()
  await expect(creating).rejects.toThrow('取消')
  expect(Date.now() - started).toBeLessThan(1500)
  await expect(kernel.createSession(input, { signal: stop.signal })).rejects.toThrow('取消')
})

test('Given 项目注入远程 MCP When CLI 未声明传输能力 Then 新建明确失败而非静默漏工具', async () => {
  const kernel = new AcpKernel('unsupported-mcp', { command, args, timeoutMs: 1000, mcpServers: [{ type: 'http', name: 'local-fixture', url: 'http://127.0.0.1:1/mcp', headers: [] }] })
  await expect(kernel.createSession(input)).rejects.toThrow('未声明支持 MCP http')
})

test('Given 模型关联的Fast与推理控件 When 切换并应用 Then 每个RPC后采用新目录且通知更新不丢失',async()=>{
 const changes:Record<string,import('@proma/protocol').JsonValue>[]=[]
 const kernel=new AcpKernel('dynamic-controls',{command,args:[fileURLToPath(new URL('./test-fixtures/configurable-server.ts',import.meta.url))],timeoutMs:1000,sessionChanged:(_id,metadata)=>changes.push(metadata)})
 const handle=await kernel.createSession(input)
 try{
  await expect(kernel.configureSession(handle,{configValues:{speed:'fast'}})).rejects.toThrow('未报告')
  await kernel.configureSession(handle,{modelId:'local-large',modeId:'build',configValues:{speed:'fast',thinking:'high'}})
  const events:KernelEvent[]=[];for await(const e of kernel.prompt(handle,{runId:'r_fast',text:'hello'},{signal:new AbortController().signal}))events.push(e)
  expect(JSON.stringify(events)).toContain('speed=fast reasoning=high');expect(JSON.stringify(changes.at(-1))).toContain('"currentValue":"fast"')
  await kernel.configureSession(handle,{modelId:'local-small'})
  await expect(kernel.configureSession(handle,{configValues:{speed:'fast'}})).rejects.toThrow('未报告')
 }finally{await kernel.close(handle)}
})

test('Given 原生布尔ACP选项 When 切换Fast Then 按协议携带boolean类型而非字符串冒充',async()=>{
 const kernel=new AcpKernel('typed-boolean',{command,args:[fileURLToPath(new URL('./test-fixtures/configurable-server.ts',import.meta.url))],timeoutMs:1000});const handle=await kernel.createSession(input);try{await kernel.configureSession(handle,{configValues:{'fast-mode':true}});expect(sessionControls(kernel.sessionMetadata(handle)).find(c=>c.id==='fast-mode')?.currentValue).toBe(true);}finally{await kernel.close(handle);}
});

test('Given 长任务超过普通RPC时限 When prompt仍在执行 Then 不把普通请求时限当成整轮截止时间',async()=>{
 const kernel=new AcpKernel('long-task',{command,args,timeoutMs:2000});const handle=await kernel.createSession(input)
 try{const events:KernelEvent[]=[];for await(const event of kernel.prompt(handle,{runId:'long',text:'slow-success'},{signal:new AbortController().signal}))events.push(event);expect(events.at(-1)).toMatchObject({t:'done',reason:'stop'});expect(events.some(event=>event.t==='message.final')).toBe(true);expect(events.some(event=>event.t==='error')).toBe(false)}finally{await kernel.close(handle)}
})

test('Given 显式设置任务总时限 When 超过 Then 错误说明实际原因而不是只显示acp_prompt_failure',async()=>{
 const kernel=new AcpKernel('bounded-task',{command,args,timeoutMs:500,promptTimeoutMs:40});const handle=await kernel.createSession(input)
 try{const events:KernelEvent[]=[];for await(const event of kernel.prompt(handle,{runId:'bounded',text:'slow-success'},{signal:new AbortController().signal}))events.push(event);expect(events.find(event=>event.t==='error')).toMatchObject({err:{code:'acp_prompt_failure',message:'ACP 任务超过显式设置的时限，已停止；可调整时限后继续。'}});expect(events.at(-1)).toMatchObject({t:'done',reason:'error'})}finally{await kernel.close(handle)}
})

test('Given ACP本体派生常驻子进程 When 正常关闭 Then 整个会话进程组回收而非遗留app-server',async()=>{
 const{mkdtempSync,readFileSync,rmSync}=await import('node:fs');const{tmpdir}=await import('node:os');const{join}=await import('node:path');const root=mkdtempSync(join(tmpdir(),'tervell-acp-child-')),file=join(root,'pid');
 const kernel=new AcpKernel('process-tree',{command,args,env:{TERVELL_ACP_CHILD_PID:file},timeoutMs:2000});const handle=await kernel.createSession(input)
 try{for await(const _event of kernel.prompt(handle,{runId:'child',text:'spawn-descendant'},{signal:new AbortController().signal})){/* 必须等到真实终态。 */}const pid=Number(readFileSync(file,'utf8'));expect(pid).toBeGreaterThan(0);await kernel.close(handle);let exited=false;for(let n=0;n<50&&!exited;n++){try{process.kill(pid,0);await Bun.sleep(10)}catch{exited=true}}expect(exited).toBe(true)}finally{rmSync(root,{recursive:true,force:true})}
})

test('Given 供应商排在模型之前且动态改变目录 When 应用供应商和模型 Then 按依赖顺序保存且第二轮可用',async()=>{
 const kernel=new AcpKernel('provider-model',{command,args:[fileURLToPath(new URL('./test-fixtures/configurable-server.ts',import.meta.url)),'--provider-control'],timeoutMs:2000});const handle=await kernel.createSession(input)
 try{expect((await kernel.modelCatalog(handle)).models.map(m=>m.id)).toEqual(['local-small','local-large']);await kernel.configureSession(handle,{modelId:'cloud-large',configValues:{provider:'cloud'}});expect((await kernel.modelCatalog(handle)).currentModelId).toBe('cloud-large');expect(sessionControls(kernel.sessionMetadata(handle)).find(c=>c.id==='provider')?.currentValue).toBe('cloud');const events=[];for await(const event of kernel.prompt(handle,{runId:'provider-turn',text:'hello'},{signal:new AbortController().signal}))events.push(event);expect(events.at(-1)).toMatchObject({t:'done',reason:'stop'});expect(JSON.stringify(events)).toContain('model=cloud-large')}finally{await kernel.close(handle)}
})
