export interface OperationResult {
  [key: string]: unknown;
  job?: {id: string; phase: string};
  error?: unknown;
}

/** 票据不是操作结果；超出前台等待预算时明确保留电脑任务，不能让界面误报成功。 */
export async function finishMobileOperation<T>(
  initial: OperationResult,
  poll: (id: string) => Promise<OperationResult>,
  wait: () => Promise<void>,
  attempts = 240
): Promise<T> {
  let response = initial;
  for (let count = 0; ; count++) {
    const job = response.job;
    if (!job) {
      if (response.error) throw Error(String(response.error));
      return response as T;
    }
    if (job.phase === 'failed') throw Error(String(response.error ?? '电脑未完成操作'));
    if (job.phase === 'done') return response.result as T;
    if (job.phase !== 'running' || !job.id) throw Error('电脑返回了无法识别的任务状态，请刷新核对。');
    if (count >= attempts) throw Error('操作仍在电脑继续运行，请稍后查看运行状态；本次等待未确认完成，请勿重复提交。');
    await wait();
    response = await poll(job.id);
  }
}
