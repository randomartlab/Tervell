export interface ReleasePolicy {
  channel: 'stable' | 'alpha'
  configDirectory: string
  chromiumDirectory: string
  automaticUpdates: boolean
}

/** Alpha 使用独立身份和数据空间；保留已使用的数据路径，改名不触发自动迁移。 */
export function releasePolicy(channel: unknown): ReleasePolicy {
  if (channel === 'alpha') return {
    channel: 'alpha', configDirectory: '.project-workbench-alpha',
    chromiumDirectory: 'ProjectWorkbenchAlpha', automaticUpdates: false,
  }
  // Tervell 尚未配置自己的更新源，禁止回落到上游 Proma Release。
  return { channel: 'stable', configDirectory: '.proma', chromiumDirectory: 'Tervell', automaticUpdates: false }
}
