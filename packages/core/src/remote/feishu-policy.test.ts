import { describe, test, expect } from 'bun:test'
import { canUseFeishu, scopedFeishuSessions, findScopedSession } from './feishu-policy'
describe('飞书群权限', () => {
  test('Given 未配置信任身份 When 陌生人发消息 Then 默认拒绝', () => {
    expect(canUseFeishu({}, 'ou_stranger')).toBe(false)
    expect(canUseFeishu({ operatorOpenId: 'ou_owner' }, 'ou_stranger')).toBe(false)
    expect(canUseFeishu({ operatorOpenId: 'ou_owner' }, 'ou_owner')).toBe(true)
    expect(canUseFeishu({ allowedUserOpenIds: ['ou_member'] }, 'ou_member')).toBe(true)
  })
  test('Given 两群历史 When 列表和切换 Then 不可跨群', () => {
    const sessions = [{ id: 'aaaaaaaa-1' }, { id: 'bbbbbbbb-2' }, { id: 'aaaaaaaa-3' }]
    const scoped = scopedFeishuSessions(sessions, ['aaaaaaaa-1'], 'bbbbbbbb-2')
    expect(scoped).toHaveLength(2)
    expect(findScopedSession(scoped, '1')?.id).toBe('aaaaaaaa-1')
    expect(findScopedSession(scoped, 'aaaaaaaa-3')).toBeUndefined()
    expect(findScopedSession(sessions, 'aaaaaaaa')).toBeUndefined()
    expect(findScopedSession(sessions, '')).toBeUndefined()
  })
})

test('Given 外部工具 When 后台协作入口 Then 在审批前阻断', async () => {
  const { remoteToolBlocked } = await import('./tool-policy')
  for (const name of ['Task', 'Agent', 'mcp__collaboration__delegate_agent', 'CronCreate', 'ScheduleWakeup', 'Workflow']) expect(remoteToolBlocked(name)).toBe(true)
  for (const name of ['Read', 'Write', 'Bash', 'TaskCreate', 'TaskUpdate', 'BrowserClick']) expect(remoteToolBlocked(name)).toBe(false)
})
