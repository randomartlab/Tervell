import { test, expect } from 'bun:test'
import { remoteApprovalPreview } from './approval-preview'

test('Given 工具参数 When 远程预览 Then 小参数完整展示、大参数禁止远程批准', () => {
  const small = { file_path: '/project/test.ts', old_string: 'before', new_string: 'after' }
  expect(JSON.parse(remoteApprovalPreview(small).inputPreview)).toEqual(small)
  expect(remoteApprovalPreview(small).canApprove).toBe(true)
  const large = remoteApprovalPreview({ content: 'a'.repeat(9000) })
  expect(large.canApprove).toBe(false)
  expect(large.inputPreview).toContain('电脑查看完整内容')
})
