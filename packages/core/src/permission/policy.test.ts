import { describe, expect, test } from 'bun:test'
import { normalizePermissionPolicy, PermissionPolicySchema, SessionSchema } from '@proma/protocol'
import type { ExecutionPermissionMode, PermissionDecision, PermissionOperation } from '@proma/protocol'
import { decidePermission } from './index.ts'

const matrix: Record<ExecutionPermissionMode, PermissionDecision[]> = {
  'read-only': ['allow', 'allow', 'allow', 'deny', 'deny', 'deny', 'deny', 'deny'],
  ask: ['allow', 'allow', 'allow', 'ask', 'ask', 'ask', 'ask', 'ask'],
  'accept-edits': ['allow', 'allow', 'allow', 'allow', 'ask', 'ask', 'ask', 'ask'],
  auto: ['allow', 'allow', 'allow', 'allow', 'allow', 'allow', 'allow', 'allow'],
}
const operations: PermissionOperation[] = [
  { kind: 'read', readOnlyCommand: false }, { kind: 'search', readOnlyCommand: false },
  { kind: 'execute', readOnlyCommand: true }, { kind: 'edit', readOnlyCommand: false },
  { kind: 'delete', readOnlyCommand: false }, { kind: 'execute', readOnlyCommand: false },
  { kind: 'fetch', readOnlyCommand: false }, { kind: 'other', readOnlyCommand: false },
]

describe('SEC-01 四档权限与 plan', () => {
  for (const mode of ['read-only', 'ask', 'accept-edits', 'auto'] as const) {
    for (const plan of [false, true]) {
      test(`Given ${mode} / plan=${plan} When 判断八类操作 Then 符合权限矩阵`, () => {
        const expected = plan ? matrix['read-only'] : matrix[mode]
        expect(operations.map((operation) => decidePermission({ mode, plan }, operation))).toEqual(expected)
      })
    }
  }
  test('Given auto 开启 plan When 关闭 plan Then 恢复 auto 且原策略未改变', () => {
    const policy = PermissionPolicySchema.parse({ mode: 'auto', plan: true })
    expect(decidePermission(policy, { kind: 'edit', readOnlyCommand: false })).toBe('deny')
    expect(decidePermission({ ...policy, plan: false }, { kind: 'edit', readOnlyCommand: false })).toBe('allow')
    expect(policy).toEqual({ mode: 'auto', plan: true })
  })
  test('Given 旧 plan 会话 When 读取兼容策略 Then ask 与 plan 分离', () => {
    const session = SessionSchema.parse({ schemaVersion: 2, id: 'legacy', title: '旧会话', kernelId: 'fixture', permissionMode: 'plan', createdAt: 0, updatedAt: 0 })
    expect(normalizePermissionPolicy(session.permissionMode)).toEqual({ mode: 'ask', plan: true })
    for (const mode of ['read-only', 'ask', 'accept-edits', 'auto'] as const) expect(normalizePermissionPolicy(mode)).toEqual({ mode, plan: false })
  })
  test('Given 空策略 When 解析 Then 默认 ask 且无 plan', () => expect(normalizePermissionPolicy({})).toEqual({ mode: 'ask', plan: false }))
  test('Given 无效策略或操作 When 运行权限判定 Then 拒绝无效输入', () => {
    for (const input of ['root', null, { mode: 'plan' }, { mode: 'auto', plan: 'false' }]) expect(() => normalizePermissionPolicy(input)).toThrow()
  })
  test('Given 编辑/外发标记只读命令 When 判断 Then 不能绕过分类', () => {
    for (const kind of ['edit', 'fetch', 'delete'] as const) {
      expect(decidePermission({ mode: 'read-only', plan: false }, { kind, readOnlyCommand: true })).toBe('deny')
    }
  })
})
