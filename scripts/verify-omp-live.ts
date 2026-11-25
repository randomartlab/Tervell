import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir, homedir } from 'node:os'
import { AcpKernel } from '../packages/kernel-host/src/acp/kernel.ts'
import { AcpTraceRecorder } from '../packages/kernel-host/src/acp/recorder.ts'
import { replayAcpTrace } from '../packages/kernel-host/src/acp/replay.ts'
import { acpDialect } from '../packages/kernel-host/src/acp/dialects/index.ts'
import type { KernelEvent } from '../packages/protocol/src/index.ts'
import {createAcpClientBridge}from'../packages/kernel-host/src/acp/client-bridge';
import {PathBoundary,ToolGate}from'../packages/core/src/permission';

/** 显式运行：已有omp + 隔离HOME + 回环假模型；不安装、不读用户认证、不产生付费请求。 */
const executable = process.env.PROMA_OMP_EXECUTABLE ?? Bun.which('omp') ?? join(homedir(), '.local/bin/omp')
const toolScenario = process.argv.includes('--tools')
const clientBridge=process.argv.includes('--client-bridge'),longScenario=process.argv.includes('--long');
const directory = mkdtempSync(join(tmpdir(), 'proma-omp-live-')); const agent = join(directory, 'agent'); mkdirSync(agent)
let version: ReturnType<typeof Bun.spawnSync>
try { version = Bun.spawnSync([executable, '--version'], { env: { HOME: directory, PATH: process.env.PATH ?? '', PI_CODING_AGENT_DIR: agent, PI_OFFLINE: '1', PI_NO_PTY: '1' }, timeout: 10000 })
  if (version.exitCode !== 0) throw new Error('本机omp版本探测失败，未尝试安装')
} catch (error) { rmSync(directory, { recursive: true, force: true }); throw error }
const agentVersion = new TextDecoder().decode(version.stdout).trim()
writeFileSync(join(directory, 'fixture.txt'), 'original\n')
let requests = 0; let toolOutputs = ''; let editAnchor: string | undefined
const server = Bun.serve({ port: 0, hostname: '127.0.0.1', async fetch(request) {
  if (new URL(request.url).pathname !== '/v1/messages') return new Response('unexpected local endpoint', { status: 400 })
  const body = await request.json() as { messages?: Array<{ content?: unknown }> }; requests++
  const strings = (value: unknown): string[] => typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(strings) : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []
  toolOutputs = strings(body.messages ?? []).join('\n')
  if (toolScenario && requests === 2) {
    const match = toolOutputs.match(/\[([^\]\n]*fixture\.txt#[a-fA-F0-9]{4})\]/) ?? toolOutputs.match(/([^\s\[\]\n]*fixture\.txt#[a-fA-F0-9]{4})/)
    editAnchor = match?.[1]
    if (!editAnchor) throw new Error('OMP Read未返回编辑锚点，拒绝猜测hashline')
  }
  const tools = toolScenario ? [
    { name: 'read', input: { path: 'fixture.txt', i: 'read temporary fixture' } },
    { name: 'edit', input: { i: 'edit temporary fixture', input: `[${editAnchor ?? 'fixture.txt#0000'}]\nPUT 1.=1:\n+edited` } },
    ...Array.from({length:12},(_,i)=>({name:'bash',input:{command:`printf 'BASH_OK_${i}'; pwd`,i:'print local marker',pty:false}})),
    ...(longScenario?[{name:'bash',input:{command:"sleep 125; printf 'LONG_BASH_OK'",i:'verify task remains alive after two minutes',pty:false,timeout:150}}]:[]),
  ] : []
  const call = tools[requests - 1]
  const events = [
    { type: 'message_start', message: { id: `local-response-${requests}`, type: 'message', role: 'assistant', content: [], model: 'offline', stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } },
    { type: 'content_block_start', index: 0, content_block: call ? { type: 'tool_use', id: `local-call-${requests}`, name: call.name, input: {} } : { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: call ? { type: 'input_json_delta', partial_json: JSON.stringify(call.input) } : { type: 'text_delta', text: 'OMP回环验证完成' } },
    { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: call ? 'tool_use' : 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } }, { type: 'message_stop' },
  ]
  return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } })
} })
writeFileSync(join(agent, 'models.yml'), JSON.stringify({ providers: { offline: { baseUrl: `http://127.0.0.1:${server.port}`, api: 'anthropic-messages', auth: 'apiKey', apiKey: 'offline-fixture', models: [{ id: 'offline-model', name: 'Offline', reasoning: false, input: ['text'], contextWindow: 200000, maxTokens: 2048 }] } } }))
writeFileSync(join(agent, 'config.yml'), 'enabledModels:\n  - offline/offline-model\n')
const dialect = acpDialect('omp')
const recorder = new AcpTraceRecorder({ kernelId: 'omp', origin: 'live', agentVersion, source: toolScenario ? 'isolated-home-loopback-model;read-edit-bash' : 'isolated-home-loopback-model;prompt-only', secrets: ['offline-fixture', directory] })
const bridgeRequests:Array<{method:string;envNames?:string[];command?:string}>=[];
const gate=new ToolGate();
const kernel = new AcpKernel('omp', { command: executable, args: ['acp', '--model', 'offline/offline-model'], dialect, inheritEnv: false,
 ...(clientBridge?{openClientBridge:async(input)=>{const bridge=createAcpClientBridge(input,{context:{sessionId:input.sessionId,workspaceId:'isolated-omp',permission:{mode:'ask',plan:false},triggeredBy:'user'},authorize:async()=>true},new PathBoundary({cwd:directory},()=>{}),gate,{HOME:directory,PATH:process.env.PATH??'',SHELL:'/bin/bash'});return{...bridge,request:async(method,params,signal)=>{const p=params&&typeof params==='object'&&!Array.isArray(params)?params:{};bridgeRequests.push({method,...(method==='terminal/create'?{command:String(p.command),envNames:Array.isArray(p.env)?p.env.flatMap(row=>row&&typeof row==='object'&&!Array.isArray(row)&&typeof row.name==='string'?[row.name]:[]):[]}:{} )});return bridge.request(method,params,signal);}};}}:{}),
  env: { HOME: directory, PATH: process.env.PATH ?? '', PI_CODING_AGENT_DIR: agent, PI_NO_PTY: '1', PI_OFFLINE: '1', XDG_CONFIG_HOME: join(directory, 'config'), XDG_DATA_HOME: join(directory, 'data'), XDG_STATE_HOME: join(directory, 'state'), NO_COLOR: '1' },
  timeoutMs: 12000, trace: (direction, message) => recorder.record(direction, message),
})
let handle: Awaited<ReturnType<typeof kernel.createSession>> | undefined
try {
  handle = await kernel.createSession({ sessionId: 'live-omp', cwd: directory, systemPrompt: '' })
  const catalog = await kernel.modelCatalog(handle)
  if (!catalog.models.some((model) => model.id === 'offline/offline-model')) throw new Error('真实OMP模型目录未包含隔离配置模型')
  const events: KernelEvent[] = []; let approvals = 0
  for await (const event of kernel.prompt(handle, { runId: 'live_run_1', text: '仅在临时目录验证本机SSE和工具链路' }, { signal: new AbortController().signal })) {
    events.push(event)
    if (event.t === 'permission.request') { approvals++; const action = event.req.actions.find((item) => item.behavior === 'allow'); if (!action) throw new Error('OMP未提供允许选项'); await kernel.respondPermission(handle, event.req.requestId, { actionId: action.id, behavior: 'allow' }) }
  }
  const last = events.at(-1)
  if (last?.t !== 'done' || last.reason !== 'stop' || !events.some((event) => event.t === 'message.final')) throw new Error('OMP真实prompt未正常结束')
  const usage = events.find((event) => event.t === 'usage' && event.usage.tokenScope === 'turn')
  if (!usage || usage.t !== 'usage' || usage.usage.inputTokens !== requests || usage.usage.outputTokens !== requests * 2) throw new Error('OMP真实turn usage归一失败')
  if (toolScenario && (readFileSync(join(directory, 'fixture.txt'), 'utf8') !== 'edited\n' || !toolOutputs.includes('BASH_OK_11')||longScenario&&!toolOutputs.includes('LONG_BASH_OK'))) throw new Error('OMP真实工具read/edit/bash未全部完成')
  if (events.some((event) => event.t === 'error')) throw new Error('OMP真实运行出现规范化错误')
  if (toolScenario && events.filter((event) => event.t === 'tool.call').length !== (longScenario?15:14)) throw new Error('OMP工具调用数量不符')
  if(clientBridge&&!bridgeRequests.some(row=>row.method==='terminal/create'&&row.envNames?.length))throw Error('没有复现真实OMP非空环境回调');
  const replayed = replayAcpTrace(recorder.snapshot(), dialect)
  if (replayed.length !== 1 || replayed[0]?.at(-1)?.t !== 'done') throw new Error('真实录制回放未完成')
  const destination = resolve(process.argv.find((argument) => argument.startsWith('--trace='))?.slice(8) ?? '/tmp/proma-w5-omp-live.trace.json')
  recorder.save(destination)
  console.log(JSON.stringify({ status: 'passed', agentVersion, origin: 'live',clientBridge,longScenario,terminalCreates:bridgeRequests.filter(row=>row.method==='terminal/create').length,terminalEnvironmentNames:[...new Set(bridgeRequests.flatMap(row=>row.envNames??[]))], scope: toolScenario ? 'initialize/new/catalog/read/edit/bash/prompt-usage/replay' : 'initialize/new/catalog/prompt/usage/replay', modelRequests: requests, approvals, metadataKinds: Object.keys(kernel.sessionMetadata(handle)), eventTypes: events.map((event) => event.t), tracePath: destination }))
} finally {
  try { if (handle) await kernel.close(handle) } finally { server.stop(true); rmSync(directory, { recursive: true, force: true }) }
}
