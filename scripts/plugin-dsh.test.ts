import { test, expect } from 'bun:test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url),
  root = resolve('apps/electron/resources/third-party/plugin-host');
interface Fiber {
  state: number;
  _error?: unknown;
  await: () => Promise<void>;
  dispose: () => Promise<void>;
}
interface Context {
  plugin: (p: unknown, c?: unknown) => Fiber;
  fiber: Fiber;
  [key: string]: unknown;
}
interface Loader {
  builtins: Record<string, unknown>;
  create: (o: object) => Promise<string>;
  await: () => Promise<void>;
  resolve: (id: string) => {
    fiber?: Fiber;
  };
}
const {
    Context
  } = require(root + '/cordis.cjs') as {
    Context: new () => Context;
  },
  core = require(root + '/dsh-core.cjs') as {
    Loader: new (ctx: Context, config: object) => Loader;
    tools: Record<string, unknown>;
    SystemPrompt: unknown;
  };
test('Given DSH原始Loader及服务依赖 When 加载含等待依赖的插件 Then 按服务图激活且卸载执行清理', async () => {
  const ctx = new Context(),
    loader = new core.Loader(ctx, {
      baseUrl: 'file:///tmp/tervell-contract.js'
    });
  await ctx.fiber.await();
  let calls = 0,
    disposed = 0;
  loader.builtins.consumer = {
    inject: ['contractService'],
    apply() {
      calls++;
      return () => {
        disposed++;
      };
    }
  };
  const id = await loader.create({
    name: 'cordis:consumer'
  });
  await loader.await();
  expect(calls).toBe(0);
  const provider = ctx.plugin({
    apply(c: Context) {
      (c.provide as (name: string, value: unknown) => void)('contractService', {
        ready: true
      });
    }
  });
  await provider.await();
  await loader.await();
  await loader.resolve(id).fiber?.await();
  expect(calls).toBe(1);
  await ctx.fiber.dispose();
  expect(disposed).toBe(1);
});
test('Given 上游defineTool When 非法输入或输出 Then 使用原始定义验证而非手写Ajv近似', async () => {
  const define = core.tools.defineTool as (o: object) => {
    execute: (input: unknown, context: object) => Promise<unknown>;
  };
  const tool = define({
    name: 'contract',
    description: 'fixture',
    parameters: {
      value: {
        type: 'integer',
        required: true
      }
    },
    output: {
      schema: {
        type: 'integer'
      },
      render: () => []
    },
    execute: ({
      value
    }: {
      value: number;
    }) => value
  });
  expect(await tool.execute({
    value: 2
  }, {
    signal: new AbortController().signal
  })).toBe(2);
  await expect(tool.execute({
    value: 'bad'
  }, {
    signal: new AbortController().signal
  })).rejects.toThrow();
});
