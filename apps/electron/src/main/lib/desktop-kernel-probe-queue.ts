/** 配置探测串行并合并相同请求，避免展开/刷新同时启动几十个CLI进程。 */
export class KernelProbeQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private readonly pending = new Map<string, Promise<unknown>>();
  run<T>(key: string, work: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) return existing as Promise<T>;
    if (this.pending.size >= 32) return Promise.reject(Error('内核检查请求过多，请等待当前检查完成'));
    const flight = this.tail.then(work).finally(() => { this.pending.delete(key); });
    this.pending.set(key, flight);
    this.tail = flight.catch(() => {});
    return flight;
  }
}
