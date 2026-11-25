interface HostDirectory {
  self: {
    serverId: string;
    label: string;
  };
  hosts: Array<{
    serverId: string | null;
    label: string | null;
    status: string;
    targetDescription: string;
  }>;
}
interface BorrowedApi extends Record<string, unknown> {
  dispose(): Promise<void>;
}
interface HostApi extends BorrowedApi {
  hosts: {
    observe(): {
      ready: Promise<unknown>;
      subscribe(observer: {
        snapshot(value: HostDirectory): void;
        update(message: unknown): void;
        error(error: unknown): void;
      }): () => void;
      release(): Promise<void>;
    };
    client(serverId: string): Promise<BorrowedApi>;
  };
}
interface HostSummary {
  serverId: string;
  label: string;
  status: 'idle' | 'connecting' | 'online' | 'offline' | 'error';
}

/** 原版同步getPaseoClient借用已连接API；远端由原始SDK建立并随安装实例释放。 */
export function createNativeHostAccess(value: Record<string, unknown>, signal: AbortSignal) {
  const local = value as HostApi;
  const clients = new Map<string, BorrowedApi>();
  const pending = new Set<string>(),
    failed = new Set<string>(),
    listeners = new Set<() => void>();
  let directory: HostDirectory = {
    self: {
      serverId: 'local',
      label: '本机'
    },
    hosts: []
  };
  let snapshot: readonly HostSummary[] = [{
    serverId: 'local',
    label: '本机',
    status: 'online'
  }];
  const publish = () => {
    if (signal.aborted) return;
    const next: HostSummary[] = [{
      ...directory.self,
      status: 'online'
    }, ...directory.hosts.filter(host => host.serverId !== null && host.serverId !== directory.self.serverId).map(host => ({
      serverId: host.serverId!,
      label: host.label ?? host.targetDescription,
      status: (host.status === 'online' ? clients.has(host.serverId!) ? 'online' : failed.has(host.serverId!) ? 'error' : 'connecting' : host.status === 'disabled' ? 'offline' : host.status) as HostSummary['status']
    }))];
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const acquire = (id: string) => {
    if (clients.has(id) || pending.has(id) || failed.has(id) || signal.aborted) return;
    pending.add(id);
    void local.hosts.client(id).then(async api => {
      if (signal.aborted || !directory.hosts.some(host => host.serverId === id && host.status === 'online')) {
        await api.dispose();
        return;
      }
      clients.set(id, api);
    }).catch(() => failed.add(id)).finally(() => {
      pending.delete(id);
      publish();
    });
  };
  const observation = local.hosts.observe();
  const unsubscribe = observation.subscribe({
    snapshot(next) {
      if (signal.aborted) return;
      const previous = directory;
      directory = next;
      for (const [id, api] of clients) if (!next.hosts.some(host => host.serverId === id && host.status === 'online')) {
        clients.delete(id);
        void api.dispose().catch(() => {});
      }
      for (const id of failed) if (!previous.hosts.some(host => host.serverId === id && host.status === 'online')) failed.delete(id);
      for (const host of next.hosts) if (host.serverId && host.status === 'online') acquire(host.serverId);
      publish();
    },
    update() {},
    error() {
      for (const [id, api] of clients) {
        clients.delete(id);
        void api.dispose().catch(() => {});
      }
      publish();
    }
  });
  void observation.ready.catch(() => {});
  const stop = () => {
    unsubscribe();
    void observation.release().catch(() => {});
    for (const api of clients.values()) void api.dispose().catch(() => {});
    clients.clear();
    listeners.clear();
  };
  if (signal.aborted) stop();else signal.addEventListener('abort', stop, {
    once: true
  });
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      if (signal.aborted) return () => {};
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getPaseoClient(id: string): Record<string, unknown> {
      if (signal.aborted) throw Error('插件已停止');
      if (id === 'local' || id === 'tervell-local' || id === directory.self.serverId) return local;
      const host = snapshot.find(host => host.serverId === id);
      if (!host) throw Error('未知Paseo宿主：' + id);
      const api = clients.get(id);
      if (host.status !== 'online' || !api) throw Error('Paseo宿主未连接：' + id);
      return api;
    }
  };
}
