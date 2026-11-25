import { test, expect } from 'bun:test';
import { createNativeHostAccess } from '../apps/electron/src/renderer/components/plugins/native-hosts';

test('Given 原版useHosts/getPaseoClient When 远端上线/下线/插件停止 Then 不回退本机并释放借用API', async () => {
  let observer: { snapshot(value: object): void; error(error: unknown): void } | undefined;
  let disposed = 0, released = 0;
  const local = {
    hosts: {
      observe: () => ({ ready: Promise.resolve(), subscribe: (value: typeof observer) => { observer = value; return () => { observer = undefined; }; }, release: async () => { released++; } }),
      client: async () => ({ dispose: async () => { disposed++; }, marker: 'remote' }),
    },
  };
  const lifetime = new AbortController(), access = createNativeHostAccess(local, lifetime.signal);
  expect(() => access.getPaseoClient('unknown')).toThrow('未知');
  expect(access.getPaseoClient('local')).toBe(local);
  const directory = { self: { serverId: 'self', label: '本机' }, hosts: [{ serverId: 'remote', label: '远端', status: 'online', targetDescription: 'fixture' }] };
  observer!.snapshot(directory);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(access.getSnapshot().find(host => host.serverId === 'remote')?.status).toBe('online');
  expect(access.getPaseoClient('remote').marker).toBe('remote');
  observer!.snapshot({ ...directory, hosts: [{ ...directory.hosts[0], status: 'offline' }] });
  expect(() => access.getPaseoClient('remote')).toThrow('未连接');
  expect(disposed).toBe(1);
  lifetime.abort();
  expect(() => access.getPaseoClient('local')).toThrow('停止');
  expect(released).toBe(1);
});
