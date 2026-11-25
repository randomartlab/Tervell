import {inlineAttachmentParts} from '@proma/shared';
import {PathBoundary} from '@proma/core/permission';
import {mkdirSync,existsSync,readFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {writeJsonFileAtomic} from '../safe-file';
import {pluginDirectory} from './packages';
import {getAgentSessionMeta,appendSDKMessages} from '../agent-session-manager';
import {paseoProviderDefaults} from './config';
import { randomUUID, createHash } from 'node:crypto';
import { AcpEventMapper } from '@proma/kernel-host';
import type { DesktopKernelCatalog, KernelSessionSelection, KernelSessionControl } from '@proma/shared';
import type { JsonValue, KernelSessionCreate, KernelSessionHandle, KernelPromptInput, KernelEvent, KernelPermissionResponse } from '@proma/protocol';
import { pluginProviderDescriptor } from './registry';
import { pluginProviderOperation } from './runtime';
import { desktopCliEnvironment, resolveDesktopCommand } from '../desktop-extension-service';
import { rememberKernelCatalog,rememberKernelCommands } from '../desktop-kernel-catalog';
const acpEntityId = (s: string) => 'plugin_' + createHash('sha256').update(s).digest('hex').slice(0, 32);
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(object) : [];
interface ProviderKernelOptions {
  env?: Record<string, string>;
  mcpServers?: JsonValue[];
  timeoutMs?: number;
  sessionChanged?: (id: string, metadata: Record<string, JsonValue>) => void;
}
interface ProviderSession {
  handle: KernelSessionHandle;
  connectionId: string;
  events: Record<string, unknown>[];
  catalog: DesktopKernelCatalog;
  running: boolean;
  closed: boolean;
  error?: string;
  cwd: string;
  resumed?:boolean;
}
const liveProviders=new Map<string,PluginProviderKernel>();
export async function applyPluginProviderOptions(id:string,patch:Record<string,unknown>):Promise<boolean>{const kernel=liveProviders.get(id);if(!kernel)return false;await kernel.applyOptions(patch);return true;}
/** 一个提供商协议适配器服务所有 registerProvider 插件，不按插件名分支。 */
export class PluginProviderKernel {
  private session?: ProviderSession;
  private readonly descriptor;
  constructor(readonly id: string, private readonly options: ProviderKernelOptions = {}) {
    const descriptor = pluginProviderDescriptor(id);
    if (!descriptor) throw Error('插件供应商未注册：' + id);
    this.descriptor = descriptor;
  }
  private async call(method: string, input: Record<string, unknown>): Promise<unknown> {
    return pluginProviderOperation(this.descriptor.pluginId, method, {
      providerId: this.id,
      ...input
    });
  }
  private async send(input: Record<string, unknown>): Promise<void> {
    if (!this.session || this.session.closed) throw Error('供应商会话已关闭');
    await this.call('send', {
      connectionId: this.session.connectionId,
      input
    });
  }
  private async next(signal?: AbortSignal,timeoutMs:number|null=this.options.timeoutMs??120000): Promise<Record<string, unknown>> {
    const session = this.session;
    if (!session) throw Error('供应商连接不存在');
    const deadline = timeoutMs===null?null:Date.now() + timeoutMs;
    while (!session.closed) {
      signal?.throwIfAborted();
      if (session.events.length) return session.events.shift()!;
      const events = await this.call('poll', {
        connectionId: session.connectionId
      });
      session.events.push(...rows(events));
      if (session.events.length) continue;
      if (deadline!==null&&Date.now() > deadline) throw Error('插件供应商等待响应超时');
      await new Promise<void>(resolve => setTimeout(resolve, 30));
    }
    throw Error('供应商连接已关闭');
  }
  private async request(input: Record<string, unknown>, accept: string[], signal?: AbortSignal): Promise<Record<string, unknown>> {
    const requestId = randomUUID();
    await this.send({
      ...input,
      requestId
    });
    const deferred: Record<string, unknown>[] = [];
    try {
      while (true) {
        const event = await this.next(signal);
        this.observe(event);
        if (event.requestId === requestId && event.type === 'request.failed') throw Error(String(object(event.error).message ?? '供应商请求失败'));
        if ((event.requestId === requestId || event.sessionId === this.session?.handle.sessionId && !event.requestId) && accept.includes(String(event.type))) return event;
        deferred.push(event);
      }
    } finally {
      this.session?.events.unshift(...deferred);
    }
  }
  private persistenceFile(sessionId:string):string {const root=join(pluginDirectory(this.descriptor.pluginId),'provider-sessions');mkdirSync(root,{recursive:true});return join(root,createHash('sha256').update(this.id+'\0'+sessionId).digest('hex')+'.json');}
  private observe(event: Record<string, unknown>): void {
    if(event.type==='session.commands'&&this.session)rememberKernelCommands(this.session.handle.sessionId,this.id,event.commands);
    if(event.type==='session.persistence'||event.type==='session.opened'){
      if(event.persistence&&this.session)writeJsonFileAtomic(this.persistenceFile(this.session.handle.sessionId),object(event.persistence));
    }
    if (event.type !== 'session.config' || !this.session) return;
    const config = object(event.config);
    this.session.catalog = providerCatalog(this.id, config);
    rememberKernelCatalog(this.session.handle.sessionId, this.id, this.session.catalog);
  }
  async createSession(input: KernelSessionCreate, control?: {
    signal: AbortSignal;
  }): Promise<KernelSessionHandle> {
    if (this.session) throw Error('供应商实例已有会话');
    const connectionId = randomUUID(),
      env = {
        ...desktopCliEnvironment(),
        ...this.options.env
      },
      command = this.descriptor.command?.[0],
      launch = command ? {
        command: resolveDesktopCommand(command) ?? command,
        args: this.descriptor.command?.slice(1) ?? [],
        env
      } : undefined;
    const connection = object(await this.call('connect', {
      connectionId,
      request: {
        versions: [1],
        capabilities: ['prompt.message','prompt.image','session.configure','session.persistence','permission','timeline.plugin'],
        ...(launch ? {
          launch
        } : {})
      }
    }));
    if (connection.version !== 1) throw Error('插件供应商协议版本不受支持');
    const handle = {
      kernelId: this.id,
      sessionId: input.sessionId,
      kernelSessionRef: connectionId
    };
    this.session = {
      handle,
      connectionId,
      events: [],
      catalog: providerCatalog(this.id, {}),
      running: false,
      closed: false,
      cwd: input.cwd
    };
    try {
      const mcpServers = Object.fromEntries((this.options.mcpServers ?? []).map(raw => {
        const m = object(raw),
          name = String(m.name);
        return [name, m.command ? {
          type: 'stdio',
          command: m.command,
          args: m.args ?? [],
          env: Object.fromEntries(rows(m.env).map(p => [p.name, p.value]))
        } : {
          type: m.type ?? 'http',
          url: m.url,
          headers: Object.fromEntries(rows(m.headers).map(p => [p.name, p.value]))
        }];
      }));
      const defaults=paseoProviderDefaults(this.id),meta=getAgentSessionMeta(input.sessionId),persistenceFile=this.persistenceFile(input.sessionId);
      const persistence=existsSync(persistenceFile)&&!meta?.kernelHistoryRefresh?JSON.parse(readFileSync(persistenceFile,'utf8')):undefined;
      this.session.resumed=!!persistence;
      await this.request({
        type: 'session.open',
        sessionId: input.sessionId,
        config: {
          cwd: input.cwd,
          env,
          systemPrompt: input.systemPrompt,
          mcpServers,
          settings: {},
          providerOptions: {...defaults.options,...defaults.providerOptions,...meta?.pluginProviderOptions},
          persist: true
        },
        ...(persistence?{persistence}:{}),history: 'skip'
      }, ['session.ready'], control?.signal);
      liveProviders.set(input.sessionId,this);return handle;
    } catch (error) {
      await this.close(handle);
      throw error;
    }
  }
  async modelCatalog(_handle: KernelSessionHandle): Promise<DesktopKernelCatalog> {
    const event = await this.request({
      type: 'catalog',
      cwd: this.session?.cwd
    }, ['catalog']);
    const catalog = providerCatalog(this.id, object(event.catalog));
    const current = this.session!.catalog;
    this.session!.catalog = {
      ...catalog,
      currentModelId: current.currentModelId ?? catalog.currentModelId,
      currentModeId: current.currentModeId ?? catalog.currentModeId,
      controls: [...(current.controls ?? []), ...(catalog.controls ?? []).filter(c => !current.controls?.some(o => o.id === c.id))]
    };
    return this.session!.catalog;
  }
  sessionMetadata(_handle: KernelSessionHandle): Record<string, JsonValue> {
    return {
      configOptions: this.session?.catalog.controls?.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        type: c.type === 'boolean' ? 'boolean' : 'select',
        currentValue: c.currentValue ?? '',
        options: c.options?.map(o => ({
          value: o.value,
          name: o.name
        })) ?? []
      })) as JsonValue ?? []
    };
  }
  async configureSession(_handle: KernelSessionHandle, selection: KernelSessionSelection, signal?: AbortSignal): Promise<void> {
    const config = {
        ...selection.configValues
      },
      thinkingOption = config.thinkingOption;
    delete config.thinkingOption;
    await this.applyOptions({
      ...(selection.modelId!==undefined?{model:selection.modelId}:{}),
      ...(selection.modeId!==undefined?{mode:selection.modeId}:{}),
      ...(thinkingOption!==undefined?{thinkingOptionId:thinkingOption}:{}),...config
    },signal);
  }
  async applyOptions(patch:Record<string,unknown>,signal?:AbortSignal):Promise<void>{
    const changes:Record<string,unknown>={},options={...patch};
    for(const key of ['model','mode','thinkingOptionId'])if(Object.hasOwn(options,key)){
      changes[key==='thinkingOptionId'?'thinkingOption':key]=options[key];delete options[key];
    }
    if(Object.keys(options).length)changes.providerOptions=options;
    if(!Object.keys(changes).length)return;
    await this.request({type:'session.configure',sessionId:this.session!.handle.sessionId,changes},['request.completed'],signal);
  }

  async *prompt(handle: KernelSessionHandle, input: KernelPromptInput, {
    signal
  }: {
    signal: AbortSignal;
  }): AsyncIterable<KernelEvent> {
    const session = this.session!;
    session.running = true;
    const mapper = new AcpEventMapper(input.runId),
      items = new Map<string, Record<string, unknown>>(),
      indices = new Map<string, number>();
    const clientMessageId = randomUUID();
    const cancel = () => {
      void this.cancel(handle).catch(() => {});
    };
    signal.addEventListener('abort', cancel, {
      once: true
    });
    const content:Record<string,unknown>[]=[];
    for(const part of inlineAttachmentParts(input.text)){
      if(part.text)content.push({type:'text',text:part.text});
      const asset=part.attachment;
      if(asset?.path&&asset.mediaType.startsWith('image/')){
        const path=new PathBoundary({cwd:session.cwd,attachedDirectories:[]},()=>{}).assert(asset.path,'read');
        content.push({type:'image',data:readFileSync(realpathSync(path)).toString('base64'),mimeType:asset.mediaType});
      }else if(asset)content.push({type:'text',text:asset.url??`[附件 ${asset.label}] ${asset.path??''}`});
    }
    await this.send({
      type: 'session.prompt',
      sessionId: handle.sessionId,
      prompt: {
        clientMessageId,
        delivery: 'auto',
        input: {
          type: 'message',
          content: [...(!session.resumed&&input.history?.length?[{type:'text',text:'历史记录（仅供参考）：\n'+input.history.map(m=>m.role+': '+m.content.filter(p=>p.type==='text').map(p=>'text' in p?p.text:'').join('\n')).join('\n')}]:[]),...content]
        }
      }
    });
    try {
      while (!signal.aborted) {
        const event = await this.next(signal,null);
        this.observe(event);
        if (event.sessionId && event.sessionId !== handle.sessionId) continue;
        if (event.type === 'timeline.item') {
          const item = object(event.item),
            id = String(item.id ?? randomUUID()),
            previous = items.get(id);
          items.set(id, item);
          if (item.type === 'assistant_message' || item.type === 'reasoning') {
            const text = String(item.text ?? ''),
              before = String(previous?.text ?? ''),
              index = indices.get(id) ?? indices.size;
            indices.set(id, index);
            if (text.startsWith(before)) yield mapper.emit({
              t: 'message.delta',
              index,
              kind: item.type === 'reasoning' ? 'thinking' : 'text',
              text: text.slice(before.length)
            });
          } else if (item.type === 'tool_call') {
            const callId = acpEntityId(String(item.callId ?? id));
            if (!previous) yield mapper.emit({
              t: 'tool.call',
              call: {
                id: callId,
                name: String(item.name),
                kind: 'other',
                status: 'running',
                input: object(object(item.detail).input)
              }
            });
            if (item.status !== 'running') yield mapper.emit({
              t: 'tool.update',
              callId,
              patch: {
                status: item.status === 'completed' ? 'succeeded' : item.status === 'canceled' ? 'rejected' : 'failed',
                result: typeof object(item.detail).text === 'string' ? object(item.detail).text : JSON.stringify(item.detail),
                ...(item.error ? {
                  error: JSON.stringify(item.error)
                } : {})
              }
            });
          } else if(item.type==='plugin'){
            if(getAgentSessionMeta(handle.sessionId))appendSDKMessages(handle.sessionId,[{type:'system',subtype:'plugin_timeline',pluginId:this.descriptor.pluginId,item:{...item,pluginId:this.descriptor.pluginId},uuid:acpEntityId(String(item.id)),timestamp:new Date().toISOString()}]);
          } else if(item.type==='todo')yield mapper.emit({t:'plan.update',steps:rows(item.items).map((step,index)=>({id:'step_'+index,title:String(step.text??''),status:step.completed?'completed':step.status==='in_progress'?'running':'pending'}))});
          else if (item.type === 'error') yield mapper.error('plugin_provider_error', item, String(item.message));
        } else if (event.type === 'session.permission') {
          const request = object(event.request),
            actions = rows(request.actions);
          yield mapper.emit({
            t: 'permission.request',
            req: {
              requestId: String(request.id),
              kind: 'other',
              tool: String(request.name ?? 'plugin'),
              input: object(request.input),
              summary: String(request.description ?? request.title ?? request.name),
              actions: (actions.length ? actions : [{
                id: 'allow',
                label: '允许一次',
                behavior: 'allow'
              }, {
                id: 'deny',
                label: '拒绝',
                behavior: 'deny'
              }]).map(a => ({
                id: String(a.id),
                label: String(a.label),
                behavior: a.behavior === 'allow' ? 'allow' : 'deny'
              }))
            }
          });
        } else if (event.type === 'session.usage') {
          const u = object(event.usage);
          yield mapper.emit({
            t: 'usage',
            usage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              contextTokens: u.contextWindowUsedTokens,
              contextWindow: u.contextWindowMaxTokens,
              cost: u.totalCostUsd
            }
          });
        } else if (event.type === 'session.turn' && event.state !== 'started' || event.type === 'session.prompt_result' && object(event.result).type === 'completed') {
          const content = [...items.values()].filter(i => i.type === 'assistant_message' || i.type === 'reasoning').map(i => ({
            type: i.type === 'reasoning' ? 'thinking' : 'text',
            text: String(i.text ?? '')
          }));
          if (content.length) yield mapper.emit({
            t: 'message.final',
            message: {
              id: acpEntityId(clientMessageId),
              role: 'assistant',
              createdAt: Date.now(),
              content
            }
          });
          if (event.state === 'failed') yield mapper.error('plugin_provider_turn_failed', event, String(object(event.error).message));
          yield mapper.emit({
            t: 'done',
            reason: event.state === 'failed' ? 'error' : event.state === 'canceled' ? 'cancelled' : 'stop'
          });
          return;
        } else if (event.type === 'session.runtime_failed' || event.type === 'session.closed' || event.type === 'session.prompt_result' && object(event.result).type === 'failed') {
          yield mapper.error('plugin_provider_runtime_failed', event, String(object(event.error ?? object(event.result).error).message ?? '插件供应商终止'));
          yield mapper.emit({
            t: 'done',
            reason: 'error'
          });
          return;
        }
      }
    } finally {
      session.running = false;
      signal.removeEventListener('abort', cancel);
    }
  }
  async respondPermission(handle: KernelSessionHandle, requestId: string, response: KernelPermissionResponse): Promise<void> {
    await this.send({
      type: 'session.permission',
      sessionId: handle.sessionId,
      permissionId: requestId,
      response: {
        behavior: response.behavior,
        selectedActionId: response.actionId
      }
    });
  }
  async cancel(handle: KernelSessionHandle): Promise<void> {
    if (this.session?.running) await this.send({
      type: 'session.interrupt',
      requestId: randomUUID(),
      sessionId: handle.sessionId
    });
  }
  async close(_handle: KernelSessionHandle): Promise<void> {
    const session = this.session;
    if (!session || session.closed) return;
    session.closed = true;
    try {
      await this.call('close', {
        connectionId: session.connectionId
      });
    } finally {
      liveProviders.delete(session.handle.sessionId);this.session = undefined;
    }
  }
}
export function providerCatalog(kernelId: string, config: Record<string, unknown>): DesktopKernelCatalog {
  const models = rows(config.models),
    modes = rows(config.modes),
    controls: KernelSessionControl[] = [];
  if (models.length) controls.push({
    id: 'model',
    name: '模型',
    type: 'select',
    category: 'model',
    method: 'model',
    currentValue: typeof config.model === 'string' ? config.model : undefined,
    options: models.filter(m => m.isSelectable !== false).map(m => ({
      value: String(m.id),
      name: String(m.label ?? m.id)
    }))
  });
  if (modes.length) controls.push({
    id: 'mode',
    name: '模式',
    type: 'select',
    category: 'mode',
    method: 'mode',
    currentValue: typeof config.mode === 'string' ? config.mode : undefined,
    options: modes.map(m => ({
      value: String(m.id),
      name: String(m.label ?? m.id)
    }))
  });
  const thinking = rows(models.find(m => m.id === config.model)?.thinkingOptions ?? config.thinkingOptions);
  if (thinking.length) controls.push({
    id: 'thinkingOption',
    name: '推理档位',
    type: 'select',
    category: 'reasoning',
    method: 'config',
    currentValue: typeof config.thinkingOption === 'string' ? config.thinkingOption : undefined,
    options: thinking.map(o => ({
      value: String(o.id),
      name: String(o.label ?? o.id)
    }))
  });
  for (const c of rows(config.controls)) controls.push({
    id: String(c.key),
    name: String(c.label ?? c.key),
    type: c.type === 'toggle' ? 'boolean' : 'select',
    method: 'config',
    currentValue: object(config.providerOptions)[String(c.key)] as string | number | boolean ?? c.defaultValue as string | number | boolean,
    options: rows(c.choices).map(o => ({
      value: String(o.value),
      name: String(o.label ?? o.value)
    }))
  });
  return {
    kernelId,
    models: models.filter(m => m.isSelectable !== false).map(m => ({
      id: String(m.id),
      name: String(m.label ?? m.id)
    })),
    modes: modes.map(m => ({
      id: String(m.id),
      name: String(m.label ?? m.id)
    })),
    controls,
    currentModelId: typeof (config.model ?? config.defaultModel) === 'string' ? String(config.model ?? config.defaultModel) : null,
    currentModeId: typeof (config.mode ?? config.defaultMode) === 'string' ? String(config.mode ?? config.defaultMode) : null
  };
}
export async function probePluginProvider(id: string, cwd: string, selection: KernelSessionSelection = {}): Promise<DesktopKernelCatalog> {
  const kernel = new PluginProviderKernel(id),
    handle = await kernel.createSession({
      sessionId: randomUUID(),
      cwd,
      systemPrompt: ''
    });
  try {
    await kernel.configureSession(handle, {modelId:selection.modelId,modeId:selection.modeId});
    await kernel.configureSession(handle, {configValues:selection.configValues});
    return await kernel.modelCatalog(handle);
  } finally {
    await kernel.close(handle);
  }
}
