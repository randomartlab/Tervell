import { test, expect } from 'bun:test';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { writeJsonFileAtomic } from '../apps/electron/src/main/lib/safe-file';
const require = createRequire(import.meta.url),
  root = resolve('apps/electron/resources/third-party/plugin-host');
const core = require(join(root, 'paseo-core.cjs')) as Record<string, unknown>;
const wire = require(join(root, 'wire.cjs')) as {
  encode: (v: unknown) => string;
  decode: (s: string) => unknown;
};
interface Schema {
  parse: (v: unknown) => unknown;
  parseAsync: (v: unknown) => Promise<unknown>;
}
interface SubscriptionHost {
  register: (contract: object, handler: (input: unknown, ctx: {
    push: (v: unknown) => Promise<void>;
    signal: AbortSignal;
  }) => void | Promise<void>) => void;
  start: (request: object, paseo: object) => void;
  release: (id: string) => void;
}
interface Sdk {
  defineRpc: (d: object) => Record<string, unknown>;
  defineSubscription: (d: object) => Record<string, unknown>;
  defineSettings: (d: object) => object;
  defineAgentTool: (d: object) => object;
}
const sdk = core.sdk as Sdk,
  server = core.serverSdk as Sdk;
const {
  z
} = require('zod') as typeof import('zod');
test('Given 全部上游SDK运行时导出 When 构建宿主 Then 共享/服务端/供应商/用量/ACP真实导出齐备', () => {
  for (const name of ['defineRpc', 'defineSubscription', 'defineSettings', 'defineAttachmentSource', 'settingsRpc', 'findSvgIconProblem']) expect(typeof (core.sdk as Record<string, unknown>)[name]).toBe('function');
  for (const name of ['spawnProcess', 'execCommand', 'terminateProcess', 'defineAgentTool']) expect(typeof (core.serverSdk as Record<string, unknown>)[name]).toBe('function');
  expect(typeof (core.acpSdk as Record<string, unknown>).runAcpProvider).toBe('function');
  expect(typeof (core.usageSdk as Record<string, unknown>).windowFromUsedPct).toBe('function');
  expect(() => sdk.defineRpc({
    name: 'bad name',
    input: z.unknown(),
    output: z.unknown()
  })).toThrow();
  expect(() => server.defineAgentTool({
    name: 'Bad Name'
  })).toThrow();
});
test('Given void返回的长期订阅 When 完成注册后继续推送 Then 不会被误关闭且释放触发取消', async () => {
  const messages: Array<Record<string, unknown>> = [];
  let push: ((v: unknown) => Promise<void>) | undefined, signal: AbortSignal | undefined;
  const Constructor = core.PluginSubscriptionHandlers as new (channel: {
    send: (v: Record<string, unknown>) => void;
    sendAndWait: (v: Record<string, unknown>) => Promise<void>;
  }) => SubscriptionHost;
  const host = new Constructor({
    send: v => messages.push(v),
    sendAndWait: async v => {
      messages.push(v);
    }
  });
  const contract = sdk.defineSubscription({
    name: 'stream.test',
    input: z.object({}),
    event: z.string().transform(v => v + '!')
  });
  host.register(contract, (_input, ctx) => {
    push = ctx.push;
    signal = ctx.signal;
  });
  host.start({
    type: 'subscribe',
    method: 'stream.test',
    input: {},
    requestId: 'request',
    subscriptionId: 'subscription'
  }, {});
  expect(messages[0]?.type).toBe('result');
  await push?.('raw');
  expect(messages.at(-1)?.event).toBe('raw');
  expect(messages.some(m => m.type === 'subscription.closed')).toBe(false);
  host.release('subscription');
  expect(signal?.aborted).toBe(true);
});
test('Given 二进制RPC或事件 When 通过worker协议 Then 保留bytes且拒绝原型路径与SDK嵌套bytes', () => {
  const value = wire.decode(wire.encode({
    id: 'request',
    input: Uint8Array.from([0, 255, 16])
  })) as {
    input: Uint8Array;
  };
  expect(value.input).toBeInstanceOf(Uint8Array);
  expect([...value.input]).toEqual([0, 255, 16]);
  const check = core.assertPluginWireValue as (v: unknown, label: string) => void;
  expect(() => check(new Uint8Array([1]), 'input')).not.toThrow();
  expect(() => check({
    nested: new Uint8Array([1])
  }, 'input')).toThrow('Bytes cross');
  expect(() => wire.decode(JSON.stringify({
    tervellPluginWire: 1,
    data: {},
    binary: [{
      path: ['__proto__'],
      base64: 'AA=='
    }]
  }))).toThrow();
});
test('Given 配置迁移与并发修改 When 使用上游设置存储 Then 不吞迁移/损坏且拒绝旧revision', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'tervell-contract-settings-'));
  interface Handler {
    contract: {
      input: Schema;
    };
    handle: (input: unknown) => Promise<{
      status: string;
      revision: string;
      values?: {
        count: number;
      };
    }>;
  }
  interface Store {
    register: (d: object) => {
      settings: {
        read: () => Promise<{
          status: string;
          revision: string;
          values: {
            count: number;
          };
        }>;
      };
      write: Handler;
    };
  }
  const Constructor = core.PluginSettingsStore as new (path: string, changed: () => void) => Store;
  try {
    writeJsonFileAtomic(join(directory, 'counter.json'), {
      version: 1,
      values: {
        old: 2
      }
    });
    const storage = new Constructor(directory, () => {}),
      handlers = storage.register(sdk.defineSettings({
        id: 'counter',
        scope: 'host',
        version: 2,
        schema: z.object({
          count: z.number()
        }),
        migrate: (v: {
          old: number;
        }) => ({
          count: v.old
        })
      }));
    const state = await handlers.settings.read();
    expect(state.values.count).toBe(2);
    const next = await handlers.write.handle({
      revision: state.revision,
      values: {
        count: 3
      }
    });
    expect(next.status).toBe('saved');
    expect((await handlers.write.handle({
      revision: state.revision,
      values: {
        count: 4
      }
    })).status).toBe('conflict');
    expect(JSON.parse(readFileSync(join(directory, 'counter.json'), 'utf8')).version).toBe(2);
  } finally {
    rmSync(directory, {
      recursive: true,
      force: true
    });
  }
});
test('Given 同一上游客户端SDK When Agent和Workspace状态变化 Then 发出实际增量并在dispose释放轮询', async () => {
  const {
    createPaseoApi
  } = require(join(root, 'paseo-api.cjs')) as {
    createPaseoApi: (driver: object) => {
      agents: {
        list: (o: object) => Promise<{
          subscription: {
            release: () => Promise<void>;
          };
        }>;
        subscribe: (fn: (u: {
          kind: string;
          agent?: {
            title: string;
          };
        }) => void) => () => void;
      };
      dispose: () => Promise<void>;
    };
  };
  const {
    createLocalPaseoDriver
  } = require(join(root, 'paseo-driver.cjs')) as {
    createLocalPaseoDriver: (call: (name: string, input: unknown) => Promise<unknown>, o: object) => {
      close: () => Promise<void>;
    };
  };
  let title = 'before',
    calls = 0;
  const driver = createLocalPaseoDriver(async name => {
    calls++;
    if (name === 'agents.list') return [{
      id: 'agent',cwd:'/fixture',
      title,
      workspaceId: 'workspace',
      background: false
    }];
    throw Error(name);
  }, {
    interval: 10
  });
  const api = createPaseoApi(driver),
    changes: string[] = [];
  api.agents.subscribe(u => {
    if (u.agent) changes.push(u.agent.title);
  });
  await api.agents.list({
    subscribe: {}
  });
  title = 'after';
  for (let i = 0; i < 20 && !changes.includes('after'); i++) await new Promise(r => setTimeout(r, 10));
  expect(changes).toContain('after');
  await api.dispose();
  await driver.close();
  const stopped = calls;
  await new Promise(r => setTimeout(r, 30));
  expect(calls).toBe(stopped);
});
