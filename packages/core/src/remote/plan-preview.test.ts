import { test, expect } from 'bun:test'
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { remotePlanPreview } from './plan-preview'

test('Given 提交时计划哈希 When 读取、替换、符号链接和超长内容 Then 只允许完整同版计划', () => {
  const directory = mkdtempSync(join(tmpdir(), 'proma-plan-preview-'))
  const path = join(directory, 'plan.md')
  const hash = (value: string) => createHash('sha256').update(value).digest('hex')
  try {
    writeFileSync(path, '只改一个文件')
    const document = { filePath: path, contentHash: hash('只改一个文件') }
    expect(remotePlanPreview(document)).toEqual({ text: '只改一个文件', canApprove: true })
    writeFileSync(path, '被替换的私密内容')
    expect(remotePlanPreview(document).canApprove).toBe(false)
    expect(remotePlanPreview(document).text).not.toContain('私密')
    const link = join(directory, 'link.md'); symlinkSync(path, link)
    expect(remotePlanPreview({ filePath: link, contentHash: hash('被替换的私密内容') }).canApprove).toBe(false)
    const long = '文'.repeat(33000); writeFileSync(path, long)
    const preview = remotePlanPreview({ filePath: path, contentHash: hash(long) })
    expect(preview.canApprove).toBe(false)
    expect(preview.text).toContain('电脑阅读完整')
    expect(remotePlanPreview(undefined).canApprove).toBe(false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
