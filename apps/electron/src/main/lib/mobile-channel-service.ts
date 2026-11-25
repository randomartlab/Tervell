import {BrowserWindow} from 'electron';
import {REMOTE_IPC} from '@proma/shared';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { PROVIDER_DEFAULT_URLS, PROVIDER_LABELS, serializeCodexCredentials, serializeGithubCopilotCredentials, serializeXaiCredentials } from '@proma/shared';
import type { ProviderType, ChannelModel } from '@proma/shared';
import { listChannels, createChannel, updateChannel, deleteChannel, testChannel, fetchModels, resolveChannelRuntimeApiKey } from './channel-manager';
import type { MobileContext } from './mobile-control-policy';
const provider = z.custom<ProviderType>(v => typeof v === 'string' && Object.hasOwn(PROVIDER_DEFAULT_URLS, v) && v !== 'opencode-go-openai');
const id = z.uuid(),
  model = z.strictObject({
    id: z.string().min(1).max(512),
    name: z.string().min(1).max(512),
    enabled: z.boolean(),
    source: z.enum(['manual', 'fetched']).optional(),
    efforts: z.array(z.string().min(1).max(64)).max(100).optional()
  });
export const MobileChannelSchema = z.discriminatedUnion('action', [z.strictObject({
  action: z.literal('save'),
  id: id.optional(),
  expectedUpdatedAt: z.number().optional(),
  name: z.string().trim().min(1).max(200),
  provider,
  baseUrl: z.string().max(4096),
  apiKey: z.string().max(65536),
  enabled: z.boolean(),
  models: z.array(model).max(10000)
}), z.strictObject({
  action: z.literal('remove'),
  id
}), z.strictObject({
  action: z.literal('test'),
  id
}), z.strictObject({
  action: z.literal('models'),
  id
}), z.strictObject({
  action: z.literal('login'),
  provider: z.enum(['openai-codex', 'github-copilot', 'xai']),
  id: id.optional(),
  name: z.string().trim().min(1).max(200),
  enterpriseUrl: z.string().max(4096).optional()
}), z.strictObject({
  action: z.literal('login.cancel'),
  id
})]);
interface Flow {
  id: string;
  device: string;
  provider: string;
  state: 'waiting' | 'done' | 'failed' | 'cancelled';
  url?: string;
  code?: string;
  channelId?: string;
  cancel: () => void;
  expires: number;
}
const flows = new Map<string, Flow>();
function check(c: MobileContext) {
  c.assertCurrent();
  if (!c.device.management) throw Error('整机管理未授权');
}
export function mobileChannels(c: MobileContext) {
  check(c);
  return {
    channels: listChannels().map(({
      apiKey,
      ...row
    }) => ({
      ...row,
      hasKey: !!apiKey
    })),
    providers: Object.entries(PROVIDER_LABELS).filter(([id]) => id !== 'opencode-go-openai').map(([id, name]) => ({
      id,
      name,
      baseUrl: PROVIDER_DEFAULT_URLS[id as ProviderType]
    })),
    flows: [...flows.values()].filter(f => f.device === c.device.id && f.expires > Date.now()).map(({
      cancel,
      device,
      expires,
      ...row
    }) => row)
  };
}
export async function mobileChannelAction(raw: unknown, c: MobileContext) {
  check(c);
  const v = MobileChannelSchema.parse(raw);
  if (v.action === 'login.cancel') {
    const flow = flows.get(v.id);
    if (!flow || flow.device !== c.device.id) throw Error('授权已失效');
    flow.state = 'cancelled';
    flow.cancel();
    return {
      cancelled: true
    };
  }
  if (v.action === 'login') {
    for (const [id, row] of flows) if (row.expires < Date.now()) {
      if (row.state === 'waiting') row.cancel();
      flows.delete(id);
    }
    if ([...flows.values()].some(f => f.provider === v.provider && f.state === 'waiting')) throw Error('该渠道正在授权，请先完成或取消');
    const previous = v.id ? listChannels().find(r => r.id === v.id) : undefined;
    if (v.id && previous?.provider !== v.provider) throw Error('账号供应商与原渠道不符');
    const modules = await Promise.all([import('./codex-oauth-service'), import('./github-copilot-oauth-service'), import('./xai-oauth-service')]);
    check(c);
    const cancel = v.provider === 'openai-codex' ? modules[0].cancelCodexOAuthLogin : v.provider === 'github-copilot' ? modules[1].cancelGithubCopilotOAuthLogin : modules[2].cancelXaiOAuthLogin;
    const flow: Flow = {
      id: randomUUID(),
      device: c.device.id,
      provider: v.provider,
      state: 'waiting',
      cancel,
      expires: Date.now() + 15 * 60 * 1000
    };
    flows.set(flow.id, flow);
    const timer = setTimeout(() => {
      if (flow.state === 'waiting') {
        flow.state = 'failed';
        cancel();
      }
    }, 15 * 60 * 1000);
    timer.unref();
    const onDeviceCode = (value: {
      userCode: string;
      verificationUri: string;
    }) => {
      if (flow.state === 'waiting') {
        flow.code = value.userCode;
        flow.url = value.verificationUri;
      }
    };
    void (async () => {
      let credentials: string;
      if (v.provider === 'openai-codex') credentials = serializeCodexCredentials(await modules[0].loginCodexOAuth({
        method: 'device_code',
        openBrowser: false,
        onDeviceCode
      }));else if (v.provider === 'github-copilot') credentials = serializeGithubCopilotCredentials(await modules[1].loginGithubCopilotOAuth({
        enterpriseUrl: v.enterpriseUrl,
        openBrowser: false,
        onDeviceCode
      }));else credentials = serializeXaiCredentials(await modules[2].loginXaiOAuth({
        openBrowser: false,
        onDeviceCode
      }));
      check(c);
      if (flow.state !== 'waiting') return;
      const fetched = await fetchModels({
        provider: v.provider,
        baseUrl: previous?.baseUrl ?? '',
        apiKey: credentials
      });
      check(c);
      if (flow.state !== 'waiting') return;
      if (v.id && listChannels().find(r => r.id === v.id)?.updatedAt !== previous?.updatedAt) throw Error('渠道已在电脑更新，请重新读取');
      const models: ChannelModel[] = fetched.success ? fetched.models : previous?.models ?? [];
      const row = v.id ? updateChannel(v.id, {
        apiKey: credentials,
        models
      }) : createChannel({
        name: v.name,
        provider: v.provider,
        baseUrl: '',
        apiKey: credentials,
        enabled: true,
        models
      });
      for(const window of BrowserWindow.getAllWindows())if(!window.isDestroyed())window.webContents.send(REMOTE_IPC.CONTROL_CHANGED,{operation:'channels.action'});
      flow.channelId = row.id;
      flow.state = 'done';
      delete flow.code;
      delete flow.url;
    })().catch(() => {
      if (flow.state === 'waiting') flow.state = 'failed';
      delete flow.code;
      delete flow.url;
    }).finally(() => clearTimeout(timer));
    return {
      flowId: flow.id
    };
  }
  const existing = 'id' in v && v.id ? listChannels().find(row => row.id === v.id) : undefined;
  if (v.action === 'save') {
    if (v.id && !existing) throw Error('渠道不存在');
    if (existing && v.expectedUpdatedAt !== existing.updatedAt) throw Error('渠道已在电脑更新，请重新读取');
    if (['openai-codex', 'github-copilot', 'xai'].includes(v.provider) && (!existing || existing.provider !== v.provider || v.apiKey)) throw Error('订阅渠道请使用账号登录');
    if (v.baseUrl) {
      const url = new URL(v.baseUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('渠道地址无效');
    }
    const {
      action,
      id,
      expectedUpdatedAt,
      ...input
    } = v;
    const row = id ? updateChannel(id, input) : createChannel(input);
    return {
      id: row.id,
      saved: true
    };
  }
  if (!existing) throw Error('渠道不存在');
  if (v.action === 'remove') {
    deleteChannel(v.id);
    return {
      removed: true
    };
  }
  if (v.action === 'test') {
    const result = await testChannel(v.id);
    check(c);
    return {
      success: result.success,
      message: result.success ? '渠道连接成功' : '连接未成功，请检查电脑上的地址和账号授权'
    };
  }
  const key = await resolveChannelRuntimeApiKey(v.id);
  check(c);
  const result = await fetchModels({
    provider: existing.provider,
    baseUrl: existing.baseUrl,
    apiKey: key
  });
  check(c);
  return {
    success: result.success,
    models: result.models,
    message: result.success ? '模型已读取；确认保存后更新渠道' : '未能读取模型，请检查电脑供应商配置'
  };
}
