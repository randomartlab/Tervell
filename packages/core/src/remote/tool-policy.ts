/** 远程可审批工具，协作和后台执行入口暂时关闭，避免子代理继承自动权限。 */
export function remoteToolBlocked(toolName: string): boolean {
  return /^(?:Agent$|Task$|mcp__collaboration__|Cron|ScheduleWakeup$|Monitor$|RemoteTrigger$|Workflow$)/.test(toolName)
}
